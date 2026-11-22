"""영상 08·09·10을 굽기 전 준비: 게임 원화를 work/로 복사하고, 08에 쓸 메뚜기를 같은 원화에서 오려 낸다.
필요한 것: Python 3, numpy, Pillow, opencv-python-headless. 사용: python3 prepare.py"""
import os, shutil
import numpy as np, cv2
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
WORK = os.path.join(HERE, 'work')
os.makedirs(WORK, exist_ok=True)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
for name in ['plague-locusts', 'plague-darkness', 'plague-light', 'plague-midnight', 'ex07-room']:
    shutil.copy(os.path.join(REPO, 'web', 'assets', 'bg', name + '.jpg'), os.path.join(WORK, name + '.jpg'))

im = np.asarray(Image.open(os.path.join(WORK, 'plague-locusts.jpg')).convert('RGB')).copy()
H, W, _ = im.shape

# 1) 잎에 앉은 메뚜기 (오른쪽 가운데) 를 오려 낸다. 윤곽을 손으로 잡고 GrabCut으로 가장자리를 다듬는다.
ox, oy, z = 500, 270, 4.0
poly_zoom = [(165,150),(205,135),(260,150),(380,180),(495,215),(505,250),(500,300),(505,355),(480,365),(400,345),
             (330,310),(320,345),(305,350),(285,280),(250,280),(210,260),(140,245),(130,235),(165,215),(160,180)]
poly = np.array([(ox + x / z, oy + y / z) for x, y in poly_zoom], np.float32)
m = np.zeros((H, W), np.uint8); cv2.fillPoly(m, [np.round(poly).astype(np.int32)], 255)
gc = np.full((H, W), cv2.GC_BGD, np.uint8)
gc[cv2.dilate(m, np.ones((9, 9), np.uint8)) > 0] = cv2.GC_PR_BGD
gc[m > 0] = cv2.GC_PR_FGD
gc[cv2.erode(m, np.ones((5, 5), np.uint8)) > 0] = cv2.GC_FGD
cv2.grabCut(cv2.cvtColor(im, cv2.COLOR_RGB2BGR), gc, None, np.zeros((1, 65)), np.zeros((1, 65)), 6, cv2.GC_INIT_WITH_MASK)
fg = np.where((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(fg)
fg = np.where(lab == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]), 255, 0).astype(np.uint8)
alpha = cv2.GaussianBlur(fg, (3, 3), 0)
x0, y0, x1, y1 = 520, 280, 640, 375
spr = np.dstack([im[y0:y1, x0:x1], alpha[y0:y1, x0:x1]]).astype(np.int16)
r, g, b, a = spr[..., 0], spr[..., 1], spr[..., 2], spr[..., 3]
a[(g > r * 0.98) & (g > b * 1.15)] = 0                      # 붙어 나온 잎 조각을 걷어 낸다
a8 = cv2.morphologyEx(a.astype(np.uint8), cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats((a8 > 40).astype(np.uint8))
a8[lab != 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])] = 0
spr[..., 3] = cv2.GaussianBlur(a8, (3, 3), 0)
Image.fromarray(spr.astype(np.uint8), 'RGBA').save(os.path.join(WORK, 'locust_land.png'))

# 2) 하늘에 그려진 작은 메뚜기들을 오려 낸다 (밝은 하늘 위의 어두운 모양).
sky = im[:150].astype(np.int16)
lum = sky.mean(axis=2)
bg = cv2.medianBlur(lum.astype(np.uint8), 31).astype(np.int16)
dark = ((bg - lum) > 28).astype(np.uint8); dark[:, :40] = 0
n, lab, st, _ = cv2.connectedComponentsWithStats(dark)
sprites = []
for i in range(1, n):
    x, y, w, h, area = st[i]
    if 25 <= area <= 260 and w <= 45 and h <= 26 and x > 150:
        x0, y0 = max(0, x - 3), max(0, y - 3); x1, y1 = min(720, x + w + 3), min(150, y + h + 3)
        d = np.clip((bg[y0:y1, x0:x1] - lum[y0:y1, x0:x1] - 10) / 35, 0, 1)
        sprites.append(np.dstack([im[y0:y1, x0:x1].astype(np.float32), d * 255]).astype(np.uint8))
np.save(os.path.join(WORK, 'sky_sprites.npy'), np.array(sprites, dtype=object), allow_pickle=True)

# 3) 내려앉을 메뚜기: 왼쪽 위, 하늘을 배경으로 이삭에 앉은 메뚜기 (오른쪽을 본다. 더듬이와 다리가 온전하다).
#    08의 처음과 마지막 화면에는 이 메뚜기의 원래 자리가 들어오지 않아 두 번 보이지 않는다.
imf = im.astype(np.float32)
poly = np.array([(62,80),(66,74),(72,62),(78,55),(80,46),(90,44),(110,43),(128,38),(137,36),(140,30),(150,10),(156,8),(167,12),
                 (152,30),(147,36),(148,48),(145,56),(151,62),(153,71),(146,73),(140,67),(128,65),(118,68),(106,72),(92,75),(80,80),(70,84)], np.int32)
m = np.zeros((H, W), np.uint8); cv2.fillPoly(m, [poly], 255); m = cv2.dilate(m, np.ones((3, 3), np.uint8))
x0, y0, x1, y1 = 55, 4, 172, 90
reg = imf[y0:y1, x0:x1]; inside = m[y0:y1, x0:x1] > 0
cand = reg[~inside & (reg[..., 2] > reg[..., 1]) & (reg.mean(axis=2) > 170)]
skyc = np.median(cand, axis=0)
alpha = np.clip((np.sqrt(((reg - skyc) ** 2).sum(axis=2)) - 22) / 30, 0, 1) * inside
gold = (reg[..., 0] > 165) & (reg[..., 1] > 135) & (reg[..., 2] < 120) & (np.arange(y1 - y0)[:, None] > 58)
alpha[gold] = 0                                                  # 발 아래 이삭 조각을 걷어 낸다
alpha = cv2.erode((alpha * 255).astype(np.uint8), np.ones((2, 2), np.uint8)).astype(np.float32) / 255
a3 = np.clip(alpha, 0.25, 1)[..., None]
unmixed = np.clip((reg - (1 - a3) * skyc) / a3, 0, 255)          # 가장자리에 남은 하늘빛을 걷어 낸다
alpha = cv2.GaussianBlur((alpha * 255).astype(np.uint8), (3, 3), 0)
Image.fromarray(np.dstack([unmixed, alpha]).astype(np.uint8), 'RGBA').save(os.path.join(WORK, 'locust_land2.png'))

# 4) 오른쪽 아래의 결구 양배추는 이 시대 애굽의 작물로 보기 어렵다. 같은 그림 왼쪽의 상추 (잎이 벌어진 것)를 옮겨 덮는다.
#    옮겨 온 상추의 원래 자리는 08의 마지막 화면에 들어오지 않는다.
bgr = cv2.cvtColor(im, cv2.COLOR_RGB2BGR)
src_patch = bgr[378:472, 195:315]
mask = np.zeros(src_patch.shape[:2], np.uint8)
cv2.ellipse(mask, (60, 52), (56, 42), 0, 0, 360, 255, -1)
mask[:, 108:] = 0
fixed = cv2.seamlessClone(src_patch, bgr, mask, (573, 433), cv2.NORMAL_CLONE)   # 옛 양배추 밑동까지 덮는다
Image.fromarray(cv2.cvtColor(fixed, cv2.COLOR_BGR2RGB)).save(os.path.join(WORK, 'plague-locusts-film.png'))
print('준비 끝:', WORK, '하늘 메뚜기', len(sprites))
