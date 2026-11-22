"""08 메뚜기 (6초, 출 10:12-15). 우박 뒤 남은 잎 → 바람을 타고 온 메뚜기가 잎에 내려앉음 → 한 번 물러나 들 안쪽의 떼.
동풍으로 들어온 일만 보여 준다. 서풍에 물러가는 움직임은 없다 (메뚜기도 바람도 모두 한 방향, 왼쪽에서 오른쪽)."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np, cv2
from lib import *

OUT = os.path.join(HERE, 'out')
rng = np.random.default_rng(10)
T = 6.0

base = Image.open(os.path.join(SRC, 'plague-locusts-film.png')).convert('RGB')   # 결구 양배추 대신 상추 (prepare.py)
B = np.asarray(base).copy()
Hh, Ww, _ = B.shape
land = Image.open(os.path.join(SRC, 'locust_land2.png'))     # 내려앉는 메뚜기: 원화 왼쪽 위의 메뚜기 (오른쪽을 본다)
sky_all = [Image.fromarray(s, 'RGBA') for s in np.load(os.path.join(SRC, 'sky_sprites.npy'), allow_pickle=True)]

def flying_like(s):
    a = np.asarray(s).astype(np.int16); m = a[..., 3] > 80
    if m.sum() < 12: return False
    r, g, b = a[..., 0][m].mean(), a[..., 1][m].mean(), a[..., 2][m].mean()
    return r > g * 1.05 and g > b * 0.95 and s.size[0] >= s.size[1] * 1.4
sky = [s.transpose(Image.FLIP_LEFT_RIGHT) for s in sky_all if flying_like(s)][:24]   # 오른쪽을 보고 난다
big = max(sky, key=lambda s: s.size[0])                       # 날개를 편 큰 메뚜기: 날아오는 모습에 쓴다
fly = big.resize((int(big.width * 3.0), int(big.height * 3.0)), Image.LANCZOS)

# ── 하늘: 원화에 그려진 떼도 바람 쪽으로 아주 조금 흐른다. 나무, 신전, 이삭, 앉은 메뚜기는 그대로 둔다.
HZ = 190
skyc = np.array([190, 195, 218], np.float32)
top = B[:HZ].astype(np.float32)
not_sky = (np.sqrt(((top - skyc) ** 2).sum(axis=2)) > 40).astype(np.uint8)
n, lab, st, _ = cv2.connectedComponentsWithStats(not_sky)
obst = np.zeros_like(not_sky)
for i in range(1, n):
    if st[i, cv2.CC_STAT_AREA] > 300: obst[lab == i] = 1          # 큰 덩어리 = 나무, 건물, 이삭, 앉은 메뚜기
obst[HZ - 25:] = 1                                                # 지평선 아래는 움직이지 않는다
obst = cv2.dilate(obst, np.ones((5, 5), np.uint8))
sky_only = cv2.inpaint(B[:HZ], obst * 255, 7, cv2.INPAINT_TELEA)
fly_sky = np.where(obst[..., None] == 0, B[:HZ], sky_only)       # 하늘과 작은 메뚜기만 남은 층
soft = cv2.GaussianBlur(obst.astype(np.float32), (7, 7), 0)[..., None]

# ── 들: 이삭과 잎이 바람 쪽으로 살짝 기운다 (흙은 움직이지 않는다)
Bf = B.astype(np.float32)
green = ((Bf[..., 1] > Bf[..., 0] * 0.92) & (Bf[..., 1] > Bf[..., 2] * 1.15)).astype(np.float32)
sway_w = cv2.GaussianBlur(green, (0, 0), 4)
rows = np.arange(Hh, dtype=np.float32)[:, None]
sway_w *= np.clip((rows - 150) / 80, 0, 1)
gx, gy = np.meshgrid(np.arange(Ww, dtype=np.float32), np.arange(Hh, dtype=np.float32))

def sway(t):
    return 1.7 * sway_w * (0.55 + 0.45 * np.sin(2 * math.pi * 0.45 * t + 0.025 * gx + 0.04 * gy))

FEET = (92, 67)                     # 오려 낸 메뚜기 그림 안의 발 자리
LAND = (472.0, 368.0)               # 근대 잎 위 (구멍 난 잎. 원화의 메뚜기가 없는 곳)
CLOSE = (270.0, 135.0, 230.0)       # 가까이 보기 창: 잎 높이. 하늘의 떼와 원화의 다른 메뚜기가 들어오지 않는다
WIDE = (310.0, 0.0, 320.0)          # 물러난 창: 하늘의 떼, 들, 내려앉은 메뚜기, 들 안쪽의 다른 메뚜기
T_IN, T_DOWN = 0.6, 2.3

flock = []
for k in range(70):
    s = sky[k % len(sky)]; sc = rng.uniform(0.7, 1.25); y = rng.uniform(18, 150)
    speed = rng.uniform(70, 140); start = rng.uniform(-1.0, T)
    if start < 2.5 and rng.random() < 0.55: continue
    flock.append((s, sc, y, speed, start, rng.uniform(-6, 6)))

def frame(t):
    d = sway(t)
    img_a = cv2.remap(B, gx - d, gy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    shift = 4.0 * t                                                # 하늘이 바람 쪽으로 천천히
    M = np.float32([[1, 0, shift], [0, 1, 0]])
    moved = cv2.warpAffine(fly_sky, M, (Ww, HZ), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    img_a[:HZ] = (moved * (1 - soft) + img_a[:HZ] * soft).astype(np.uint8)
    img = Image.fromarray(img_a).convert('RGBA')
    for s, sc, y, speed, start, wob in flock:
        if t < start: continue
        x = -40 + (t - start) * speed
        if x > 735: continue
        ss = s.resize((max(1, int(s.width * sc)), max(1, int(s.height * sc))), Image.LANCZOS)
        img.alpha_composite(ss, (int(x), int(y + wob * math.sin(t * 2 + start))))
    if t >= T_IN:
        fx = LAND[0] + float(d[int(LAND[1]), int(LAND[0])])        # 앉은 뒤에는 잎과 함께 흔들린다
        if t < T_DOWN:
            u = (t - T_IN) / (T_DOWN - T_IN); e = 1 - (1 - u) ** 2.2
            cx = 170 + (LAND[0] - 40 - 170) * e
            cy = 230 + (LAND[1] - 40 - 230) * e - 35 * math.sin(math.pi * e) * (1 - e)
            spr = fly.rotate(10 * (1 - e), resample=Image.BICUBIC, expand=True)
            a = np.asarray(spr).astype(np.float32)
            k = np.zeros((1, 3), np.float32); k[0, :] = 1 / 3                # 날 때만 가볍게 흐리게
            spr = Image.fromarray(np.clip(cv2.filter2D(a, -1, k), 0, 255).astype(np.uint8), 'RGBA')
            img.alpha_composite(spr, (int(cx - spr.width / 2), int(cy - spr.height / 2)))
        fold = min(1.0, max(0.0, (t - (T_DOWN - 0.2)) / 0.2))      # 내려앉으며 날개를 접는다 (0.2초)
        if fold > 0:
            dy = 2.0 * math.exp(-(t - T_DOWN) * 9) * math.sin((t - T_DOWN) * 30) if t >= T_DOWN else -4 * (1 - fold)
            l2 = land.copy()
            if fold < 1:
                a = np.asarray(l2).copy(); a[..., 3] = (a[..., 3] * fold).astype(np.uint8); l2 = Image.fromarray(a, 'RGBA')
            img.alpha_composite(l2, (int(round(fx - FEET[0])), int(round(LAND[1] + dy - FEET[1]))))
    u = ease((t - 2.6) / 1.6)                                      # 카메라는 2.6초부터 4.2초까지 한 번만 물러난다
    cx_, cy_, cw = [CLOSE[i] + (WIDE[i] - CLOSE[i]) * u for i in range(3)]
    return view(img.convert('RGB'), cx_, cy_, cw)

if __name__ == '__main__':
    w = Writer(os.path.join(OUT, 'plague-08.mp4'))
    for f in range(int(T * FPS)):
        w.put(frame(f / FPS))
    print('08 frames', w.close())
