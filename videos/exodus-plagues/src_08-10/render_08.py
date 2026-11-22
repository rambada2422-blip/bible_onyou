"""08 메뚜기 (6초, 출 10:12-15). 우박 뒤 남은 잎 → 바람을 타고 온 메뚜기가 잎에 내려앉음 → 한 번 물러나 들 안쪽의 떼.
동풍으로 들어온 일만 보여 준다. 서풍에 물러가는 움직임은 없다 (모든 메뚜기가 한 방향으로 들어온다)."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np, cv2
from lib import *

OUT = os.path.join(HERE, 'out')
rng = np.random.default_rng(10)

base = load('plague-locusts').convert('RGBA')                  # 720x480, 그림은 고치지 않는다
land = Image.open(os.path.join(SRC, 'locust_land.png'))         # 잎에 앉은 메뚜기 (원화에서 오려 냄)
la = np.asarray(land).astype(np.int16).copy()
yg = (la[..., 1] > la[..., 0] * 0.90) & (la[..., 1] > la[..., 2] * 1.30)   # 잎 조각의 노랗고 푸른 테두리를 걷어 낸다
la[..., 3][yg] = 0
land = Image.fromarray(np.clip(la, 0, 255).astype(np.uint8), 'RGBA').transpose(Image.FLIP_LEFT_RIGHT)  # 원화의 메뚜기와 똑같아 보이지 않게 좌우를 바꾼다
sky = [Image.fromarray(s, 'RGBA') for s in np.load(os.path.join(SRC, 'sky_sprites.npy'), allow_pickle=True)]

# 하늘 높은 곳의 작은 메뚜기만 쓴다 (지평선 근처의 나무, 신전 조각을 빼려고 크기와 빛깔로 고른다)
def flying_like(s):
    a = np.asarray(s).astype(np.int16)
    m = a[..., 3] > 80
    if m.sum() < 12: return False
    r, g, b = a[..., 0][m].mean(), a[..., 1][m].mean(), a[..., 2][m].mean()
    w, h = s.size
    return r > g * 1.05 and g > b * 0.95 and w >= h * 1.4
sky = [s for s in sky if flying_like(s)][:24]

LAND_AT = (448.0, 372.0)            # 근대 잎 위 (구멍 난 잎. 원화의 메뚜기가 없는 곳)
CLOSE = (250.0, 120.0, 240.0)       # 가까이 보기 창 (x, y, 폭). 원화의 메뚜기가 들어오지 않는 곳
WIDE = (300.0, 0.0, 320.0)          # 물러난 창: 하늘의 떼, 들, 내려앉은 메뚜기가 함께 보인다
T = 6.0

# 하늘을 가로지르는 떼: 왼쪽에서 오른쪽으로만 (바람이 불어 들이는 한 방향)
flock = []
for k in range(70):
    s = sky[k % len(sky)]
    sc = rng.uniform(0.7, 1.25)
    y = rng.uniform(18, 150)
    speed = rng.uniform(70, 140)     # 원화 좌표 px/초
    start = rng.uniform(-1.0, T)     # 나타나는 때 (점점 많아진다)
    if start < 2.5 and rng.random() < 0.55: continue
    flock.append((s, sc, y, speed, start, rng.uniform(-6, 6)))

def flight(t):
    """내려앉는 메뚜기의 자리. 0.8초에 왼쪽 밖에서 들어와 2.6초에 잎에 앉는다."""
    t0, t1 = 0.8, 2.6
    if t < t0: return None
    if t >= t1:
        dy = 2.2 * math.exp(-(t - t1) * 9) * math.sin((t - t1) * 30)   # 앉은 뒤 잎 위에서 아주 작게 자리를 잡는다
        return LAND_AT[0], LAND_AT[1] + dy, 0.0, False
    u = (t - t0) / (t1 - t0)
    e = 1 - (1 - u) ** 2.2
    x = 200 + (LAND_AT[0] - 200) * e
    y = 240 + (LAND_AT[1] - 240) * e - 40 * math.sin(math.pi * e) * (1 - e)
    tilt = 18 * (1 - e)
    return x, y, tilt, u < 0.85

def frame(t):
    img = base.copy()
    # 하늘의 떼
    for s, sc, y, speed, start, wob in flock:
        if t < start: continue
        x = -40 + (t - start) * speed
        if x > 735: continue
        yy = y + wob * math.sin(t * 2 + start)
        ss = s.resize((max(1, int(s.width * sc)), max(1, int(s.height * sc))), Image.LANCZOS).transpose(Image.FLIP_LEFT_RIGHT)
        img.alpha_composite(ss, (int(x), int(yy)))
    # 내려앉는 메뚜기
    p = flight(t)
    if p:
        x, y, tilt, moving = p
        spr = land.rotate(tilt, resample=Image.BICUBIC, expand=True)
        if moving:   # 빠르게 날 때만 가로로 흐리게
            a = np.asarray(spr).astype(np.float32)
            k = np.zeros((1, 9), np.float32); k[0, :] = 1 / 9
            a = cv2.filter2D(a, -1, k)
            spr = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')
        img.alpha_composite(spr, (int(round(x - spr.width * 0.58)), int(round(y - spr.height * 0.55))))
    # 카메라: 2.9초부터 5.0초까지 한 번만 천천히 물러난다
    u = ease((t - 2.9) / 2.1)
    cx = CLOSE[0] + (WIDE[0] - CLOSE[0]) * u
    cy = CLOSE[1] + (WIDE[1] - CLOSE[1]) * u
    cw = CLOSE[2] + (WIDE[2] - CLOSE[2]) * u
    return view(img.convert('RGB'), cx, cy, cw)

if __name__ == '__main__':
    print('sky sprites used', len(sky), 'flock', len(flock))
    w = Writer(os.path.join(OUT, 'plague-08.mp4'))
    for f in range(int(T * FPS)):
        w.put(frame(f / FPS))
    print('08 frames', w.close())
