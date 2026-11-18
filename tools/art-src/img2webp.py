#!/usr/bin/env python3
"""GPT가 만든 PNG(tools/art-src/<장면>/*.png)를 게임용 WebP(web3d/assets/img/)로 바꾼다.
- 거의 불투명한 알파(250 이상)는 255로, 거의 투명한 알파(8 이하)는 0으로 맞춘다.
- 마젠타(#FF00FF) 단색 배경으로 온 그림은 그 색을 투명으로 바꾼다.
실행: python3 tools/art-src/img2webp.py tools/art-src/ot12
"""
import sys, os
from PIL import Image

def clean(im):
    im = im.convert("RGBA")
    px = im.load(); W, H = im.size
    # 네 귀퉁이가 모두 마젠타에 가까우면 마젠타 배경으로 본다
    def mag(p): return p[0] > 200 and p[1] < 80 and p[2] > 200
    corners = [px[2, 2], px[W - 3, 2], px[2, H - 3], px[W - 3, H - 3]]
    key = all(mag(c) and c[3] > 200 for c in corners)
    for y in range(H):
        for x in range(W):
            r, g, b, a = px[x, y]
            if key and r > 170 and g < 110 and b > 170 and abs(r - b) < 60: px[x, y] = (r, g, b, 0); continue
            if a >= 250: px[x, y] = (r, g, b, 255)
            elif a <= 8: px[x, y] = (0, 0, 0, 0)
    return im, key

def main(d):
    out = os.path.join(os.path.dirname(__file__), "..", "..", "web3d", "assets", "img")
    os.makedirs(out, exist_ok=True)
    for f in sorted(os.listdir(d)):
        if not f.lower().endswith(".png"): continue
        im, key = clean(Image.open(os.path.join(d, f)))
        dst = os.path.join(out, os.path.splitext(f)[0] + ".webp")
        im.save(dst, "WEBP", quality=84, method=6)
        a = im.getchannel("A").histogram(); tot = sum(a)
        print(f, im.size, "투명 %.0f%%" % (a[0] / tot * 100), "마젠타 배경" if key else "알파", "->", os.path.basename(dst), "%dKB" % (os.path.getsize(dst) / 1024))

if __name__ == "__main__":
    main(sys.argv[1])
