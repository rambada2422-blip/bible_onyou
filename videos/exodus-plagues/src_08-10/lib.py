"""공통: 그림을 2:3 세로 창으로 잘라 720x1080, 24fps, H.264 무음 MP4로 굽는다."""
import os, subprocess
import numpy as np
from PIL import Image, ImageFilter

W, H, FPS = 720, 1080, 24
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'work')   # prepare.py가 원화와 오려 낸 메뚜기를 여기에 둔다


def load(name):
    return Image.open(os.path.join(SRC, name + '.jpg')).convert('RGB')


def ease(t):
    t = min(1.0, max(0.0, t))
    return 2 * t * t if t < .5 else 1 - (-2 * t + 2) ** 2 / 2


def view(img, x0, y0, w):
    """왼쪽 위 (x0, y0)에서 폭 w, 높이 1.5w인 창을 720x1080으로. 소수 좌표도 받는다."""
    h = w * 1.5
    out = img.resize((W, H), resample=Image.LANCZOS, box=(x0, y0, x0 + w, y0 + h))
    return out.filter(ImageFilter.UnsharpMask(radius=1.1, percent=35, threshold=2))


def gain(img, g):
    a = np.asarray(img, dtype=np.float32) * g
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def black():
    return Image.new('RGB', (W, H), (0, 0, 0))


def fade(img, k):
    """k=0 검정, k=1 그림. 그림 둘을 겹치지 않는다 (검정과만 섞는다)."""
    return gain(img, k)


def extend_vertical(img, top, bottom, darken=0.55):
    """위아래로 이어지는 벽과 땅을 비춰 이어 붙이고 끝으로 갈수록 어둡게 한다 (새 물건을 그리지 않는다)."""
    a = np.asarray(img, dtype=np.float32)
    h, w, _ = a.shape
    t = a[:top][::-1]
    b = a[h - bottom:][::-1]
    for i in range(top):  # i=0 이 맨 위
        f = 1 - darken * ((top - i) / top) ** 1.4
        t[i] *= f
    for i in range(bottom):  # i=bottom-1 이 맨 아래
        f = 1 - darken * ((i + 1) / bottom) ** 1.4
        b[i] *= f
    out = np.concatenate([t, a, b], axis=0)
    # 이음매를 부드럽게: 이음 위아래 6줄을 섞는다
    for seam in (top, top + h):
        lo, hi = max(0, seam - 6), min(out.shape[0], seam + 6)
        out[lo:hi] = (out[lo:hi] + np.concatenate([out[lo - 1:lo], out[lo:hi - 1]], axis=0)) / 2
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


class Writer:
    def __init__(self, path):
        self.path = path
        self.n = 0
        self.p = subprocess.Popen([
            'ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
            '-r', str(FPS), '-i', '-', '-an', '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '17',
            '-pix_fmt', 'yuv420p', '-r', str(FPS), '-movflags', '+faststart', path], stdin=subprocess.PIPE)

    def put(self, img):
        assert img.size == (W, H), img.size
        self.p.stdin.write(img.tobytes())
        self.n += 1

    def close(self):
        self.p.stdin.close()
        assert self.p.wait() == 0
        return self.n


def extend_fill(img, top, bottom, darken=0.45, seed=7):
    """위아래로 늘린 자리를 가장자리의 벽과 땅 빛깔로 채운다 (비춰 붙이지 않으므로 인방이나 표시가 두 번 나오지 않는다)."""
    import cv2
    a = np.asarray(img, dtype=np.uint8)
    h, w, _ = a.shape
    canvas = np.zeros((h + top + bottom, w, 3), np.uint8)
    canvas[top:top + h] = a
    mask = np.zeros(canvas.shape[:2], np.uint8)
    mask[:top] = 255
    mask[top + h:] = 255
    filled = cv2.inpaint(canvas, mask, 12, cv2.INPAINT_TELEA).astype(np.float32)
    rng = np.random.default_rng(seed)
    grain = rng.normal(0, 3.0, filled.shape[:2])[..., None]
    for i in range(top):
        f = 1 - darken * ((top - i) / top) ** 1.3
        filled[i] = filled[i] * f + grain[i]
    for j in range(bottom):
        i = top + h + j
        f = 1 - darken * ((j + 1) / bottom) ** 1.3
        filled[i] = filled[i] * f + grain[i]
    return Image.fromarray(np.clip(filled, 0, 255).astype(np.uint8))


def brush_side_marks(img, seed=3):
    """한밤중 문의 좌우 설주 자국에 인방 자국처럼 세로 붓질 결을 준다 (자리와 빛깔은 그대로, 새로 그리지 않는다).
    흐릿한 둥근 자국이 어둠 속에서 빛나는 눈처럼 보이지 않게 하려는 것이다. 자국 밖은 원화 그대로다."""
    import cv2
    a = np.asarray(img, dtype=np.float32).copy()
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    red = ((r > g * 1.5) & (r > b * 1.15) & (r > 40)).astype(np.uint8)
    red = cv2.morphologyEx(red, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(red)
    rng = np.random.default_rng(seed)
    for i in range(1, n):
        x, y, w, h, area = st[i]
        if area < 60 or h < w * 1.3:      # 세로로 긴 덩어리 = 좌우 설주의 자국 (인방 자국은 가로로 길다)
            continue
        x0, x1, y0, y1 = max(0, x - 3), min(a.shape[1], x + w + 3), max(0, y - 3), min(a.shape[0], y + h + 3)
        patch = a[y0:y1, x0:x1].copy()
        redness = np.clip((patch[..., 0] - (patch[..., 1] + patch[..., 2]) / 2) / 40, 0, 1)
        wood = patch[redness < 0.12]
        base = np.median(wood, axis=0) if len(wood) else patch.reshape(-1, 3).min(axis=0)
        streak = rng.uniform(0.35, 1.3, (patch.shape[0] // 5 + 2, patch.shape[1])).astype(np.float32)
        streak = cv2.resize(streak, (patch.shape[1], patch.shape[0]), interpolation=cv2.INTER_CUBIC)
        textured = base + (patch - base) * streak[..., None]
        wgt = np.clip((redness - 0.15) / 0.3, 0, 1)[..., None]           # 자국 안에만
        halo = (np.clip((0.3 - redness) / 0.25, 0, 1) * (redness > 0.04))[..., None] * 0.5   # 자국 둘레의 번진 붉은 빛을 줄인다
        out = patch * (1 - wgt) + textured * wgt
        out = out * (1 - halo) + base * halo
        a[y0:y1, x0:x1] = out
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
