# 접근성 점검의 색 대비 계산: a11yCheck.js가 남긴 texts.json과 찍은 화면으로 글자마다 대비(WCAG)를 낸다.
# 글자색은 CSS에서 계산된 색, 바탕색은 찍은 화면의 글자 네모 안에서 가장 많이 나온 색으로 본다. 그림 위의 글과 아주 굵은 큰 글자는 어림값이다.
# CSS 거르개(filter)로 색을 바꾼 글(말풍선의 아이 이름표)은 계산된 색이 바뀌기 전 색이라 실제보다 낮게 나온다.
# 사용: python3 tools/test/a11yContrast.py <저장 폴더>   (Pillow 필요: .venv-bpy/bin/python 으로 실행해도 된다)
import json, sys, re, os, warnings
warnings.simplefilter("ignore")
from collections import Counter
from PIL import Image
d = sys.argv[1]
def lum(c):
    def f(v):
        v /= 255.0
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2])
def ratio(a, b):
    la, lb = lum(a), lum(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)
pages = json.load(open(os.path.join(d, 'texts.json'), encoding='utf8'))
rows, tiny = [], []
for pg in pages:
    im = Image.open(os.path.join(d, pg['name'] + '.png')).convert('RGB')
    for t in pg['texts']:
        m = re.findall(r'[\d.]+', t['color']); fg = tuple(int(float(x)) for x in m[:3])
        x0, y0, x1, y1 = int(t['x']), int(t['y']), int(t['x'] + t['w']), int(t['y'] + t['h'])
        box = im.crop((max(0, x0), max(0, y0), min(im.width, x1), min(im.height, y1)))
        if box.width < 2 or box.height < 2: continue
        cnt = Counter((r // 8 * 8, g // 8 * 8, b // 8 * 8) for r, g, b in box.getdata())
        bg = cnt.most_common(1)[0][0]
        r = ratio(fg, bg)
        big = t['size'] >= 24 or (t['size'] >= 18.66 and t['bold'])
        if t['size'] < 12: tiny.append((pg['name'], t['cls'], round(t['size'], 1), t['t']))
        if t['dis'] or t['op'] < 0.99: continue   # 꺼진 단추·흐리게 한 것(잠긴 시대)은 따로 본다
        need = 3.0 if big else 4.5
        if r < need: rows.append((round(r, 2), need, pg['name'], t['cls'], round(t['size'], 1), '#%02x%02x%02x' % fg, '#%02x%02x%02x' % bg, t['t']))
seen, out = set(), []
for r in sorted(rows):
    k = (r[3], r[5], r[6])
    if k in seen: continue
    seen.add(k); out.append(r)
print('글 조각 가운데 대비가 모자란 종류:', len(out))
for r in out: print('  대비 %s (기준 %s) · %s · .%s · %spx · 글자 %s / 바탕 %s · "%s"' % r)
ts = sorted(set((c, s) for _, c, s, _ in tiny))
print('12px 미만 글자 종류:', len(ts))
for c, s in ts: print('  .%s %spx' % (c, s))
