"""Join one original chapter and its narrated aftermath. Requires FFmpeg with libass."""
import argparse
import json
import subprocess
import tempfile
import textwrap
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FPS = 24
DISSOLVE = 16  # frames


def ass_time(seconds):
    centis = round(seconds * 100)
    return f'{centis//360000}:{centis//6000%60:02d}:{centis//100%60:02d}.{centis%100:02d}'


def subtitles(row, path, offset):
    content = [
        '[Script Info]', 'ScriptType: v4.00+', 'PlayResX: 1920', 'PlayResY: 1080',
        'WrapStyle: 2', 'ScaledBorderAndShadow: yes', '[V4+ Styles]',
        'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
        'Style: Words,Onyou Film Sans,90,&H00FFFFFF,&H00FFFFFF,&H00131A1D,&H80131A1D,0,0,0,0,100,100,0,0,1,3,1,2,96,96,95,1',
        'Style: Ref,Onyou Film Sans,55,&H00BCDBF3,&H00BCDBF3,&H00131A1D,&H80131A1D,0,0,0,0,100,100,0,0,1,2,0,2,100,100,26,1',
        '[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text'
    ]
    cues = [cue for shot in row['shots'] for cue in shot['cues']]
    for index, cue in enumerate(cues):
        # Leave the final sentence on screen during the quiet hold.
        stop = cues[index+1]['start'] if index+1 < len(cues) else row['tailFrames']/FPS
        display = r'\N'.join(textwrap.wrap(cue['text'], width=21, break_long_words=False))
        content.append(f"Dialogue: 0,{ass_time(offset+cue['start']-.14)},{ass_time(offset+stop-.07)},Words,,0,0,0,,{{\\fad(90,70)}}{display}")
    content.append(f"Dialogue: 0,{ass_time(offset+.38)},{ass_time(offset+row['tailFrames']/FPS)},Ref,,0,0,0,,{row['ref']}")
    path.write_text('\n'.join(content)+'\n', encoding='utf-8')


def render(number, original, out, score=None):
    row = json.loads((ROOT/'scenes.json').read_text())[number-1]
    assert number == row['number']
    probe = json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',str(original)]))
    video = next(s for s in probe['streams'] if s['codec_type']=='video')
    if not any(s['codec_type']=='audio' for s in probe['streams']):
        raise ValueError('Original is missing its sound track')
    intro_frames = round(float(video['duration'])*FPS)
    offset_frames = intro_frames-DISSOLVE
    offset = offset_frames/FPS
    total = (offset_frames+row['tailFrames'])/FPS
    shots = row['shots']
    starts = [0] + [round((shot['cues'][0]['start']-.46)*FPS) for shot in shots[1:]]
    args = ['ffmpeg','-nostdin','-hide_banner','-loglevel','error','-y','-filter_complex_threads','1','-threads','2','-i',str(original)]
    for shot in shots:
        args += ['-threads','1','-i',str(ROOT/'stills'/(shot['image']+'.jpg'))]
    voice_input = len(shots)+1
    args += ['-i',str(ROOT/'voice'/f'{number:02}.m4a')]
    if score:
        # The same commissioned score resolves quietly under the narrator.
        args += ['-stream_loop','-1','-ss',str(4+(number-1)*7),'-i',str(score)]
    filters = [f"[0:v]fps={FPS},scale=1920:1080,setsar=1,format=yuv420p,trim=end_frame={intro_frames},settb=1/{FPS},setpts=N,fps={FPS},settb=1/{FPS}[intro]"]
    last='intro'
    for i, start in enumerate(starts):
        end = starts[i+1]+DISSOLVE if i+1<len(shots) else row['tailFrames']
        frames = end-start
        # Continuous fractional movement across a single photograph, fixed start per cut.
        zoom = f'1.07-0.045*on/{frames}' if i%2 else f'1.015+0.045*on/{frames}'
        filters += [f"[{i+1}:v]scale=2560:1440:flags=lanczos,zoompan=z='{zoom}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d={frames}:s=1920x1080:fps={FPS},setsar=1,format=yuv420p,settb=1/{FPS},setpts=N,fps={FPS},settb=1/{FPS}[shot{i}]",
                    f"[{last}][shot{i}]xfade=transition=fade:duration={DISSOLVE/FPS:.6f}:offset={(offset_frames+start)/FPS:.6f},fps={FPS},settb=1/{FPS}[sum{i}]"]
        last = f'sum{i}'
    with tempfile.TemporaryDirectory() as tmp:
        work=Path(tmp)
        (work/'fonts').mkdir()
        (work/'fonts'/'caption.ttf').symlink_to(ROOT/'caption.ttf')
        subtitles(row,work/'captions.ass',offset)
        # A feathered scrim behind the captions leaves the picture readable on a phone.
        filters += [f"color=c=black:s=192x108:r={FPS}:d={total:.6f},format=rgba,geq=r=0:g=0:b=0:a='178*clip((Y-57)/42,0,1)',scale=1920:1080,fade=t=in:st={offset:.6f}:d=0.6:alpha=1[shade]",
                    f"[{last}][shade]overlay=shortest=1,ass=captions.ass:fontsdir=fonts,format=yuv420p[v]",
                    f"[0:a]aresample=48000,aformat=channel_layouts=stereo,apad,atrim=duration={intro_frames/FPS:.6f},afade=t=out:st={max(0,offset-.5):.6f}:d={(DISSOLVE/FPS+.5):.6f}[field]",
                    f"[{voice_input}:a]aresample=48000,aformat=channel_layouts=stereo,volume=1.4,adelay={round(offset*1000)}:all=1[voice]"]
        mix='[field][voice]'
        if score:
            filters += [f"[{voice_input+1}:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.11,afade=t=in:d=1.2,atrim=duration={row['tailFrames']/FPS:.6f},afade=t=out:st={row['tailFrames']/FPS-1.6:.6f}:d=1.6,adelay={round(offset*1000)}:all=1[music]"]
            mix+='[music]'
        filters += [mix+f"amix=inputs={3 if score else 2}:duration=longest:normalize=0,alimiter=limit=0.90:level=false:latency=1,apad,atrim=duration={total:.6f}[a]"]
        args += ['-filter_complex',';'.join(filters),'-map','[v]','-map','[a]','-t',f'{total:.6f}',
                 '-c:v','libx264','-threads','3','-preset','veryfast','-crf','20','-maxrate','7500k','-bufsize','12000k','-pix_fmt','yuv420p','-g','48',
                 '-c:a','aac','-ar','48000','-ac','2','-b:a','160k','-map_metadata','-1','-metadata','title='+row['title'],'-movflags','+faststart',str(out)]
        subprocess.run(args,cwd=work,check=True)
    print(f'{number:02}: {total:.2f} seconds',flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('chapter',type=int,choices=range(1,11))
    parser.add_argument('original',type=Path)
    parser.add_argument('output',type=Path)
    parser.add_argument('--score',type=Path)
    opts=parser.parse_args()
    render(opts.chapter,opts.original.resolve(),opts.output.resolve(),opts.score.resolve() if opts.score else None)
