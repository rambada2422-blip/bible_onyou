#!/usr/bin/env python3
"""감수 자료에 넣을 화면 사진 만들기 (갈래 pack).
   .venv-bpy/bin/python tools/test/make_review_images.py <찍은 화면 폴더>
 <폴더>/OT-NN/*.png : `node tools/test/walk3dScene.js OT-NN 1 <폴더>/OT-NN` (호렙은 walk3d.js 1 <폴더>/OT-09)가 찍은 화면
 <폴더>/p_<이름>.png : `node tools/test/view_person.js <이름> <폴더>/p_<이름>.png`
 지켜보기(event) 화면 가운데 처음·가운데·끝 석 장을 골라 위쪽 3D 부분만 잘라 docs/감수/화면/ 에 작은 JPEG로 둔다. 그 뒤 node tools/make_review_pack.js 를 다시 돌린다."""
import os, re, sys
from PIL import Image, ImageStat
src = sys.argv[1]
out = os.path.join(os.path.dirname(__file__), '..', '..', 'docs', '감수', '화면')
os.makedirs(out, exist_ok=True)
n = 0
for d in sorted(os.listdir(src)):
    p = os.path.join(src, d)
    if re.fullmatch(r'OT-\d\d', d) and os.path.isdir(p):
        ev = sorted(f for f in os.listdir(p) if re.search(r'-(event\d+|watch\d*|vision\w*)\.png$', f) and 'help' not in f)  # 돕기 화면(…-help2-watch.png)은 글 상자가 가려서 뺀다
        if not ev: ev = sorted(f for f in os.listdir(p) if 'event' in f and 'help' not in f)
        # 글 상자(밝은 크림색)가 위쪽 절반을 가린 화면과 거의 빈 화면(밝기 차이가 작음)은 뺀다. 다 빠지면 그대로 둔다
        def usable(f):
            im = Image.open(os.path.join(p, f)).convert('RGB'); w, h = im.size
            im = im.crop((0, 0, w, int(h * 0.5))).resize((97, 105))
            px = list(getattr(im, 'get_flattened_data', im.getdata)()); cream = sum(1 for r, g, b in px if r > 235 and g > 228 and b > 215 and r - b < 30) / len(px)
            return cream < 0.25 and ImageStat.Stat(im.convert('L')).stddev[0] >= 15
        ev = [f for f in ev if usable(f)] or ev
        pick = []
        for i in ([0, len(ev) // 2, len(ev) - 1] if len(ev) >= 3 else range(len(ev))):
            if ev[i] not in pick: pick.append(ev[i])
        for f in os.listdir(out):  # 이 장면의 옛 사진을 지우고 새로 둔다(장 수가 줄어도 옛 사진이 남지 않게)
            if re.fullmatch(re.escape(d) + r'_\d+\.jpg', f): os.remove(os.path.join(out, f))
        for k, f in enumerate(pick, 1):
            im = Image.open(os.path.join(p, f)).convert('RGB')
            w, h = im.size
            im = im.crop((0, 0, w, int(h * 0.5)))
            im.save(os.path.join(out, '%s_%d.jpg' % (d, k)), quality=72, optimize=True); n += 1
    m = re.fullmatch(r'p_(\w+)\.png', d)
    if m:
        im = Image.open(p).convert('RGB'); im.thumbnail((760, 400))
        im.save(os.path.join(out, '인물_%s.jpg' % m.group(1)), quality=72, optimize=True); n += 1
print('만든 사진', n, '장 →', os.path.normpath(out))
