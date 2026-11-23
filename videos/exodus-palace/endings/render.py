"""Assemble the original location footage and the narrated household and court scenes."""
import argparse
import json
import subprocess
import tempfile
import textwrap
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FPS = 24
DISSOLVE = 16


def ass_time(seconds):
    centis = round(seconds * 100)
    return f'{centis//360000}:{centis//6000%60:02d}:{centis//100%60:02d}.{centis%100:02d}'


def subtitles(row, path):
    content = [
        '[Script Info]', 'ScriptType: v4.00+', 'PlayResX: 1920', 'PlayResY: 1080',
        'WrapStyle: 2', 'ScaledBorderAndShadow: yes', '[V4+ Styles]',
        'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
        'Style: Words,Onyou Film Sans,90,&H00FFFFFF,&H00FFFFFF,&H00131A1D,&H80131A1D,0,0,0,0,100,100,0,0,1,3,1,2,96,96,95,1',
        'Style: Ref,Onyou Film Sans,55,&H00BCDBF3,&H00BCDBF3,&H00131A1D,&H80131A1D,0,0,0,0,100,100,0,0,1,2,0,2,100,100,26,1',
        '[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text'
    ]
    for shot, stop_frame in zip(row['shots'], shot_ends(row)):
        start = shot['startFrame']/FPS
        end = stop_frame/FPS
        caption_ref = ' · '.join(filter(None, [shot.get('speaker'), shot['ref']]))
        def line(style, begin, stop, words):
            return f'Dialogue: 0,{ass_time(begin)},{ass_time(stop)},{style},,0,0,0,,{{\\fad(100,120)}}{words}'
        content.append(line('Ref',start+.28,end-.07,caption_ref))
        for idx,cue in enumerate(shot['cues']):
            # Give the reader a clean view of the damage after the line is spoken.
            stop = (shot['cues'][idx+1]['start']-.16 if idx+1<len(shot['cues']) else end-.12)
            if shot.get('impact'):
                stop = min(stop,cue['end']+1.15)
            display = r'\N'.join(textwrap.wrap(cue['text'],width=21,break_long_words=False))
            content.append(line('Words',cue['start']-.15,stop,display))
    path.write_text('\n'.join(content)+'\n',encoding='utf-8')


def shot_ends(row):
    return [s['startFrame'] for s in row['shots'][1:]]+[row['frames']]


def render(number,original,out,score=None):
    row=json.loads((ROOT/'scenes.json').read_text())[number-1]
    shots=row['shots']
    assert row['number']==number and sum(bool(s.get('original')) for s in shots)==1
    total=row['frames']/FPS
    args=['ffmpeg','-nostdin','-hide_banner','-loglevel','error','-y','-filter_complex_threads','1']
    for shot in shots:
        source=original if shot.get('original') else ROOT/'stills'/(shot['image']+'.jpg')
        args+=['-threads','1','-i',str(source)]
    voice=len(shots)
    args+=['-i',str(ROOT/'voice'/f'{number:02}.m4a')]
    if score:
        args+=['-stream_loop','-1','-ss',str(4+(number-1)*7),'-i',str(score)]
    filters=[]
    for i,(shot,end) in enumerate(zip(shots,shot_ends(row))):
        start=shot['startFrame']
        length=end-start+(DISSOLVE if i+1<len(shots) else 0)
        if shot.get('original'):
            # Extend the final frame only when a spoken warning outlasts the original.
            picture=f'fps={FPS},scale=1920:1080,tpad=stop_mode=clone:stop_duration={length/FPS:.4f},trim=end_frame={length}'
            field=i
            field_start=start/FPS
            field_duration=(end-start)/FPS
        else:
            zoom=f'1.06-0.04*on/{length}' if i%2 else f'1.015+0.045*on/{length}'
            picture=f"scale=2560:1440:flags=lanczos,zoompan=z='{zoom}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d={length}:s=1920x1080:fps={FPS}"
        filters.append(f'[{i}:v]{picture},setsar=1,format=yuv420p,settb=1/{FPS},setpts=N,fps={FPS},settb=1/{FPS}[s{i}]')
        if i:
            filters.append(f'[{last}][s{i}]xfade=transition=fade:duration={DISSOLVE/FPS:.6f}:offset={start/FPS:.6f},fps={FPS},settb=1/{FPS}[cut{i}]')
        last=f'cut{i}' if i else 's0'
    with tempfile.TemporaryDirectory() as tmp:
        work=Path(tmp)
        (work/'fonts').mkdir()
        (work/'fonts'/'caption.ttf').symlink_to(ROOT/'caption.ttf')
        subtitles(row,work/'captions.ass')
        filters.extend([
            f"color=c=black:s=192x108:r={FPS}:d={total:.6f},format=rgba,geq=r=0:g=0:b=0:a='178*clip((Y-57)/42,0,1)',scale=1920:1080[shade]",
            f"[{last}]tpad=stop_mode=clone:stop_duration=0.35,trim=end_frame={row['frames']}[picture]",
            f"[picture][shade]overlay=shortest=1,ass=captions.ass:fontsdir=fonts,format=yuv420p[v]",
            f"[{field}:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.38,apad,atrim=duration={field_duration:.6f},afade=t=in:d=0.4,afade=t=out:st={field_duration-1.2:.6f}:d=1.2,adelay={round(field_start*1000)}:all=1[field]",
            f"[{voice}:a]aresample=48000,aformat=channel_layouts=stereo,volume=1.4[voice]"
        ])
        inputs='[field][voice]'
        if score:
            filters.append(f'[{voice+1}:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.10,afade=t=in:d=1.2,atrim=duration={total:.6f},afade=t=out:st={total-2:.6f}:d=2[music]')
            inputs+='[music]'
        filters.append(inputs+f'amix=inputs={3 if score else 2}:duration=longest:normalize=0,alimiter=limit=0.90:level=false:latency=1,apad,atrim=duration={total:.6f}[a]')
        args+=['-filter_complex',';'.join(filters),'-map','[v]','-map','[a]','-t',f'{total:.6f}',
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
