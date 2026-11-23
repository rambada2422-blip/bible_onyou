"""열 편 최종 합본: plague-01.mp4 ~ plague-10.mp4를 성경 순서로 잇고 색 표시를 bt709로 맞춘다.

대표가 세 팀의 영상을 보고 승인한 뒤에만 돌린다 (대표 지시 2026-11-22).
사용: python3 assemble_all.py [영상 폴더] [출력 파일]
  영상 폴더 기본값: 이 폴더의 위 (videos/exodus-plagues)
  출력 기본값: out/plague-all.mp4

색: 색 표시가 없는 파일은 RGB에서 FFmpeg 기본값(bt601)으로 인코딩된 것으로 보고 bt709로 바꾼다
(08~10은 그렇게 만든 것을 확인했다). bt709 표시가 있는 파일 (01~04)은 그대로 둔다.
끝나면 길이, 프레임 수, 각 편의 첫·마지막 프레임이 원본과 같은 자리에 있는지 확인한다."""
import json, os, subprocess, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.abspath(os.path.join(HERE, '..'))
OUT = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else os.path.join(HERE, 'out', 'plague-all.mp4')
LENS = [12, 6, 6, 12, 6, 6, 6, 6, 12, 16]          # 01 ~ 10 (초)
FPS = 24


def probe(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v', '-count_frames', '-show_entries',
                        'stream=width,height,pix_fmt,r_frame_rate,nb_read_frames,color_space',
                        '-show_entries', 'format=duration,nb_streams', '-of', 'json', path],
                       capture_output=True, text=True, check=True)
    j = json.loads(r.stdout)
    s = j['streams'][0]
    return dict(w=s['width'], h=s['height'], pix=s['pix_fmt'], fps=s['r_frame_rate'], frames=int(s['nb_read_frames']),
                cs=s.get('color_space', 'unknown'), dur=float(j['format']['duration']), streams=int(j['format']['nb_streams']))


def frame(path, n, matrix):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-vf',
                          f'select=eq(n\\,{n}),scale=in_color_matrix={matrix}:in_range=tv,format=rgb24',
                          '-vsync', '0', '-frames:v', '1', '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(1080, 720, 3).astype(np.int16)


files = [os.path.join(SRC, f'plague-{k:02d}.mp4') for k in range(1, 11)]
info = []
for k, f in enumerate(files):
    assert os.path.exists(f), f'없음: {f}'
    p = probe(f)
    assert (p['w'], p['h'], p['pix'], p['fps'], p['streams']) == (720, 1080, 'yuv420p', '24/1', 1), (f, p)
    assert p['frames'] == LENS[k] * FPS, (f, p['frames'])
    info.append(p)
    print(f'{k + 1:02d} {LENS[k]:>2}초 {p["frames"]}프레임 색 표시 {p["cs"]}')

filt, ins = [], []
for k, (f, p) in enumerate(zip(files, info)):
    ins += ['-i', f]
    conv = '' if p['cs'] == 'bt709' else 'scale=in_color_matrix=bt601:out_color_matrix=bt709:in_range=tv:out_range=tv,'
    filt.append(f'[{k}:v]{conv}setsar=1,setpts=PTS-STARTPTS[v{k}]')
graph = ';'.join(filt) + ';' + ''.join(f'[v{k}]' for k in range(10)) + 'concat=n=10:v=1:a=0,fps=24,format=yuv420p[v]'
os.makedirs(os.path.dirname(OUT), exist_ok=True)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *ins, '-filter_complex', graph, '-map', '[v]', '-an',
                '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '18',
                '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
                '-movflags', '+faststart', OUT], check=True)

p = probe(OUT)
assert p['frames'] == sum(LENS) * FPS and abs(p['dur'] - sum(LENS)) < 0.01 and p['streams'] == 1, p
start = 0
for k, (f, q) in enumerate(zip(files, info)):
    m = 'bt709' if q['cs'] == 'bt709' else 'bt601'
    a = np.abs(frame(OUT, start * FPS, 'bt709') - frame(f, 0, m)).mean()
    b = np.abs(frame(OUT, (start + LENS[k]) * FPS - 1, 'bt709') - frame(f, LENS[k] * FPS - 1, m)).mean()
    assert a < 4 and b < 4, (k + 1, a, b)
    start += LENS[k]
print(f'합본 {OUT}: {p["dur"]:.3f}초 {p["frames"]}프레임, 열 편의 첫·마지막 프레임이 제자리에 있다')
