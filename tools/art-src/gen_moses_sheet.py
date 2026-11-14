# -*- coding: utf-8 -*-
"""
모세 디자인 시트 (정면, 측면, 후면). 인물 품질 실험(docs/07)의 기준 그림이며 Meshy Image to 3D 입력으로도 쓴다.
실행: python3 tools/art-src/gen_moses_sheet.py <출력 폴더>
  -> moses_sheet.svg (세 방향), moses_front.svg (정면만, 3D 생성 입력용)

외형 가운데 본문에 근거가 있는 것은 팔십 세 무렵(출 7:7, 행 7:30), 목자의 지팡이(출 3:1, 4:2)뿐이다.
수염, 머리쓰개, 옷의 겹과 색, 허리띠, 지팡이 모양은 감수 대상이다(그림 안에 글자는 넣지 않는다).
옷자락이 땅까지 내려와 발이 보이지 않는다(장면목록 EX-01).
"""
import os
import sys

OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
os.makedirs(OUT, exist_ok=True)

# 색 (스타일가이드 4절 계열)
SKIN, SKIN_SH = '#B98A62', '#93694A'
LINEN, LINEN_SH, LINEN_DK = '#EFE3C8', '#D6C4A1', '#BFA97F'
WOOL, WOOL_SH, WOOL_HI = '#7A4E2E', '#5C3820', '#946240'
SASH, SASH_SH = '#5E6E86', '#48566B'
BEARD, BEARD_SH = '#E9E4DA', '#C9C1B3'
WOOD, WOOD_SH = '#7B5232', '#5A3A22'
CORD = '#4A3324'
INK = '#3B2A20'


def P(d, fill, extra=''):
    return '<path d="%s" fill="%s" %s/>' % (d, fill, extra)


def staff(x, top, bottom, lean=0):
    w = 7
    d = 'M%.1f %d C%.1f %d %.1f %d %.1f %d L%.1f %d C%.1f %d %.1f %d %.1f %d Z' % (
        x - w, top, x - w + 6 + lean, top + 300, x - w - 5 + lean, bottom - 300, x - w + lean, bottom,
        x + w + lean, bottom, x + w - 5 + lean, bottom - 300, x + w + 6, top + 300, x + w, top)
    knot = ''.join('<ellipse cx="%.1f" cy="%d" rx="9" ry="5" fill="%s"/>' % (x + lean * (y - top) / (bottom - top), y, WOOD_SH) for y in (top + 160, top + 420, top + 690))
    return P(d, WOOD) + P('M%.1f %d C%.1f %d %.1f %d %.1f %d L%.1f %d C%.1f %d %.1f %d %.1f %d Z' % (
        x + 1, top + 4, x + 7 + lean * 0.3, top + 300, x - 2 + lean * 0.7, bottom - 300, x + 1 + lean, bottom - 6,
        x + w + lean, bottom - 6, x + w - 5 + lean * 0.7, bottom - 300, x + w + 6 + lean * 0.3, top + 300, x + w, top + 4), WOOD_SH) + knot


def front(ox=0):
    s = []
    # 지팡이 (왼손, 보는 쪽에서 오른쪽)
    s.append(staff(ox + 452, 70, 938, 4))
    # 겉옷 뒤판 (바깥 실루엣): 어깨에서 옷자락으로 넓어진다
    s.append(P('M%d 262 C%d 300 %d 420 %d 560 C%d 700 %d 820 %d 902 C%d 918 %d 922 %d 914 L%d 914 C%d 922 %d 918 %d 902 C%d 820 %d 700 %d 560 C%d 420 %d 300 %d 262 Z' % tuple(
        ox + v for v in (205, 182, 170, 163, 158, 150, 148, 175, 225, 260, 340, 375, 425, 452, 450, 442, 437, 430, 418, 395)), WOOL))
    # 속옷 (가운데, 겉옷 사이로 보인다)
    s.append(P('M%d 250 L%d 250 C%d 420 %d 700 %d 934 L%d 934 C%d 700 %d 420 %d 250 Z' % tuple(ox + v for v in (268, 332, 352, 380, 392, 208, 220, 248, 268)), LINEN))
    for x0, x1 in ((282, 262), (300, 300), (318, 338), (262, 238), (338, 362)):
        s.append(P('M%d 600 C%d 700 %d 820 %d 932 L%d 932 C%d 820 %d 700 %d 600 Z' % tuple(ox + v for v in (x0, x0, x1, x1 - 4, x1 + 4, x1 + 4, x0 + 3, x0 + 3)), LINEN_SH))
    # 허리띠
    s.append(P('M%d 515 C%d 506 %d 506 %d 515 L%d 552 C%d 544 %d 544 %d 552 Z' % tuple(ox + v for v in (246, 280, 320, 354, 357, 320, 280, 243)), SASH))
    s.append(P('M%d 548 L%d 548 L%d 640 C%d 646 %d 646 %d 640 Z' % tuple(ox + v for v in (286, 302, 300, 296, 288, 282)), SASH_SH))
    s.append(P('M%d 548 L%d 548 L%d 618 C%d 622 %d 622 %d 616 Z' % tuple(ox + v for v in (304, 316, 318, 314, 306, 304)), SASH))
    # 겉옷 앞자락 (왼·오른): 안쪽 가장자리가 속옷을 덮는다
    s.append(P('M%d 258 C%d 300 %d 330 %d 360 C%d 520 %d 720 %d 912 C%d 920 %d 920 %d 912 C%d 760 %d 560 %d 262 Z' % tuple(ox + v for v in (230, 248, 258, 262, 250, 240, 232, 205, 170, 152, 160, 168, 205)), WOOL))
    s.append(P('M%d 258 C%d 300 %d 330 %d 360 C%d 520 %d 720 %d 912 C%d 920 %d 920 %d 912 C%d 760 %d 560 %d 262 Z' % tuple(ox + v for v in (370, 352, 342, 338, 350, 360, 368, 395, 430, 448, 440, 432, 395)), WOOL))
    # 겉옷 주름 (그늘 면)
    for a, b, c in ((214, 196, 186), (246, 236, 226), (386, 404, 414), (354, 364, 374)):
        s.append(P('M%d 420 C%d 600 %d 760 %d 908 L%d 910 C%d 760 %d 600 %d 420 Z' % tuple(ox + v for v in (a, b, c, c - 6, c + 8, c + 4, b + 6, a + 4)), WOOL_SH))
    s.append(P('M%d 360 C%d 520 %d 720 %d 912 L%d 912 C%d 720 %d 520 %d 360 Z' % tuple(ox + v for v in (262, 250, 240, 232, 242, 250, 260, 270)), WOOL_HI))
    s.append(P('M%d 360 C%d 520 %d 720 %d 912 L%d 912 C%d 720 %d 520 %d 360 Z' % tuple(ox + v for v in (338, 350, 360, 368, 358, 350, 340, 330)), WOOL_SH))
    # 소매와 손 (A자세): 오른팔(보는 쪽 왼쪽)은 내리고, 왼팔은 지팡이를 쥔다
    s.append(P('M%d 272 C%d 300 %d 360 %d 440 C%d 500 %d 560 %d 590 L%d 610 C%d 560 %d 470 %d 390 C%d 330 %d 300 %d 290 Z' % tuple(ox + v for v in (208, 188, 170, 158, 148, 138, 126, 184, 196, 200, 216, 222, 232, 236)), WOOL))
    s.append(P('M%d 440 C%d 500 %d 560 %d 590 L%d 600 C%d 560 %d 500 %d 450 Z' % tuple(ox + v for v in (158, 148, 138, 126, 150, 160, 170, 178)), WOOL_SH))
    s.append('<ellipse cx="%d" cy="618" rx="20" ry="26" fill="%s"/>' % (ox + 160, SKIN))
    s.append(P('M%d 608 C%d 630 %d 640 %d 644 C%d 640 %d 628 %d 612 Z' % tuple(ox + v for v in (146, 150, 160, 170, 176, 178, 176)), SKIN_SH))
    s.append(P('M%d 272 C%d 300 %d 360 %d 430 C%d 480 %d 520 %d 552 L%d 580 C%d 540 %d 470 %d 400 C%d 330 %d 300 %d 290 Z' % tuple(ox + v for v in (392, 412, 426, 434, 440, 444, 446, 400, 396, 390, 382, 376, 368, 364)), WOOL))
    s.append(P('M%d 430 C%d 480 %d 520 %d 552 L%d 560 C%d 520 %d 480 %d 438 Z' % tuple(ox + v for v in (434, 440, 444, 446, 428, 428, 424, 420)), WOOL_SH))
    s.append('<ellipse cx="%d" cy="566" rx="22" ry="25" fill="%s"/>' % (ox + 452, SKIN))
    s.append(P('M%d 556 C%d 560 %d 572 %d 580 L%d 586 C%d 574 %d 562 %d 556 Z' % tuple(ox + v for v in (432, 440, 452, 470, 472, 460, 446, 436)), SKIN_SH))
    # 머리쓰개 뒤로 늘어진 부분 (어깨 위)
    s.append(P('M%d 140 C%d 200 %d 260 %d 318 C%d 300 %d 290 %d 286 L%d 286 C%d 290 %d 300 %d 318 C%d 260 %d 200 %d 140 Z' % tuple(ox + v for v in (232, 222, 214, 200, 220, 238, 250, 350, 362, 380, 400, 386, 378, 368)), LINEN_SH))
    # 수염 (가슴까지)
    s.append(P('M%d 200 C%d 250 %d 300 %d 352 C%d 380 %d 396 %d 402 C%d 396 %d 380 %d 352 C%d 300 %d 250 %d 200 Z' % tuple(ox + v for v in (252, 250, 256, 268, 280, 292, 300, 308, 320, 332, 344, 350, 348)), BEARD))
    for x0, x1 in ((276, 282), (300, 300), (324, 318)):
        s.append(P('M%d 250 C%d 300 %d 340 %d 386 L%d 386 C%d 340 %d 300 %d 250 Z' % tuple(ox + v for v in (x0, x0 + 2, x1, x1 - 2, x1 + 3, x1 + 3, x0 + 4, x0 + 4)), BEARD_SH))
    # 얼굴
    s.append('<ellipse cx="%d" cy="182" rx="44" ry="54" fill="%s"/>' % (ox + 300, SKIN))
    s.append(P('M%d 150 C%d 190 %d 220 %d 236 C%d 214 %d 182 %d 150 Z' % tuple(ox + v for v in (257, 262, 270, 282, 266, 258, 257)), SKIN_SH))
    # 눈썹, 눈, 코, 콧수염
    s.append(P('M%d 166 C%d 158 %d 158 %d 166 L%d 170 C%d 164 %d 164 %d 170 Z' % tuple(ox + v for v in (270, 278, 288, 294, 292, 286, 278, 272)), BEARD))
    s.append(P('M%d 166 C%d 158 %d 158 %d 166 L%d 170 C%d 164 %d 164 %d 170 Z' % tuple(ox + v for v in (306, 312, 322, 330, 328, 322, 314, 308)), BEARD))
    s.append('<ellipse cx="%d" cy="180" rx="4.5" ry="5" fill="%s"/><ellipse cx="%d" cy="180" rx="4.5" ry="5" fill="%s"/>' % (ox + 282, INK, ox + 318, INK))
    s.append(P('M%d 176 C%d 196 %d 206 %d 210 C%d 212 %d 212 %d 208 C%d 200 %d 190 %d 178 Z' % tuple(ox + v for v in (300, 296, 292, 294, 300, 306, 308, 306, 304, 302)), SKIN_SH))
    s.append(P('M%d 222 C%d 214 %d 214 %d 220 C%d 214 %d 214 %d 222 C%d 232 %d 236 %d 230 C%d 236 %d 232 %d 222 Z' % tuple(ox + v for v in (272, 282, 294, 300, 306, 318, 328, 320, 306, 300, 294, 280, 272)), BEARD))
    # 머리쓰개 (머리를 감싸고 양옆으로 늘어진다) + 끈
    s.append(P('M%d 232 C%d 180 %d 120 %d 100 C%d 72 %d 64 %d 64 C%d 64 %d 72 %d 100 C%d 120 %d 180 %d 232 L%d 230 C%d 190 %d 150 %d 132 C%d 120 %d 118 %d 132 C%d 150 %d 190 %d 230 Z' % tuple(
        ox + v for v in (232, 236, 242, 252, 270, 288, 300, 312, 330, 348, 358, 364, 368, 348, 346, 342, 334, 316, 284, 266, 258, 254, 252)), LINEN))
    s.append(P('M%d 232 C%d 180 %d 130 %d 108 L%d 112 C%d 136 %d 182 %d 232 Z' % tuple(ox + v for v in (232, 236, 240, 250, 258, 250, 246, 248)), LINEN_DK))
    s.append(P('M%d 100 C%d 88 %d 84 %d 84 C%d 84 %d 88 %d 100 L%d 112 C%d 100 %d 96 %d 96 C%d 96 %d 100 %d 112 Z' % tuple(ox + v for v in (252, 270, 288, 300, 312, 330, 348, 346, 330, 312, 300, 288, 270, 254)), CORD))
    return ''.join(s)


def side(ox=0):
    """오른쪽을 보는 옆모습"""
    s = []
    s.append(staff(ox + 398, 70, 938, -4))
    s.append(P('M%d 258 C%d 300 %d 460 %d 600 C%d 740 %d 840 %d 912 L%d 916 C%d 840 %d 700 %d 560 C%d 440 %d 320 %d 262 Z' % tuple(ox + v for v in (300, 250, 236, 228, 220, 206, 200, 360, 356, 350, 340, 336, 330, 330)), WOOL))
    s.append(P('M%d 600 L%d 934 L%d 934 L%d 600 Z' % tuple(ox + v for v in (330, 342, 380, 352)), LINEN))
    s.append(P('M%d 515 L%d 515 L%d 552 L%d 552 Z' % tuple(ox + v for v in (300, 344, 346, 300)), SASH))
    for a in (240, 268, 300):
        s.append(P('M%d 420 C%d 600 %d 760 %d 908 L%d 910 C%d 760 %d 600 %d 420 Z' % tuple(ox + v for v in (a, a - 8, a - 16, a - 20, a - 8, a - 6, a + 2, a + 8)), WOOL_SH))
    # 팔 (지팡이를 쥔 왼팔이 앞)
    s.append(P('M%d 276 C%d 330 %d 420 %d 520 L%d 560 C%d 470 %d 360 %d 290 Z' % tuple(ox + v for v in (290, 310, 340, 370, 398, 390, 352, 318)), WOOL))
    s.append('<ellipse cx="%d" cy="566" rx="20" ry="24" fill="%s"/>' % (ox + 396, SKIN))
    # 머리쓰개 뒷자락
    s.append(P('M%d 120 C%d 180 %d 260 %d 330 L%d 300 C%d 240 %d 170 %d 120 Z' % tuple(ox + v for v in (262, 246, 240, 250, 300, 290, 286, 300)), LINEN_SH))
    # 수염과 얼굴 (옆)
    s.append(P('M%d 200 C%d 260 %d 320 %d 392 C%d 380 %d 330 %d 290 C%d 250 %d 220 %d 200 Z' % tuple(ox + v for v in (320, 336, 336, 324, 312, 306, 300, 300, 304, 310)), BEARD))
    s.append(P('M%d 120 C%d 120 %d 150 %d 176 L%d 182 C%d 188 %d 196 %d 206 C%d 214 %d 224 %d 228 L%d 236 L%d 236 L%d 120 Z' % tuple(ox + v for v in (300, 330, 344, 346, 356, 352, 346, 346, 346, 344, 336, 330, 296, 296)), SKIN))
    s.append(P('M%d 164 C%d 158 %d 158 %d 166 L%d 170 C%d 164 %d 164 %d 168 Z' % tuple(ox + v for v in (318, 326, 334, 340, 338, 332, 326, 320)), BEARD))
    s.append('<ellipse cx="%d" cy="180" rx="4" ry="5" fill="%s"/>' % (ox + 332, INK))
    s.append(P('M%d 232 C%d 180 %d 120 %d 100 C%d 72 %d 64 %d 64 C%d 70 %d 90 %d 110 L%d 132 C%d 120 %d 118 %d 130 C%d 160 %d 200 %d 236 Z' % tuple(ox + v for v in (262, 256, 258, 268, 284, 300, 316, 334, 344, 346, 338, 320, 300, 286, 280, 276, 264)), LINEN))
    s.append(P('M%d 98 C%d 86 %d 82 %d 84 C%d 88 %d 96 %d 110 L%d 116 C%d 104 %d 98 %d 98 C%d 98 %d 104 %d 112 Z' % tuple(ox + v for v in (268, 284, 300, 316, 332, 342, 346, 340, 332, 318, 300, 286, 276, 270)), CORD))
    return ''.join(s)


def back(ox=0):
    s = []
    s.append(staff(ox + 148, 70, 938, -4))      # 뒤에서 보면 왼손은 보는 쪽 왼쪽
    s.append(P('M%d 262 C%d 300 %d 420 %d 560 C%d 700 %d 820 %d 902 C%d 922 %d 926 %d 916 L%d 916 C%d 926 %d 922 %d 902 C%d 820 %d 700 %d 560 C%d 420 %d 300 %d 262 Z' % tuple(
        ox + v for v in (205, 182, 170, 163, 158, 150, 148, 175, 225, 260, 340, 375, 425, 452, 450, 442, 437, 430, 418, 395)), WOOL))
    s.append(P('M%d 912 L%d 934 L%d 934 L%d 912 Z' % tuple(ox + v for v in (180, 200, 400, 420)), LINEN))
    for a, b, c in ((200, 186, 176), (236, 230, 222), (270, 270, 266), (330, 332, 336), (366, 372, 378), (400, 414, 424)):
        s.append(P('M%d 360 C%d 560 %d 760 %d 912 L%d 914 C%d 760 %d 560 %d 360 Z' % tuple(ox + v for v in (a, b, c, c - 7, c + 7, c + 4, b + 5, a + 5)), WOOL_SH))
    s.append(P('M%d 272 C%d 300 %d 360 %d 440 C%d 500 %d 560 %d 590 L%d 610 C%d 560 %d 470 %d 390 C%d 330 %d 300 %d 290 Z' % tuple(ox + v for v in (392, 412, 430, 442, 452, 462, 474, 416, 404, 400, 384, 378, 368, 364)), WOOL))
    s.append('<ellipse cx="%d" cy="618" rx="20" ry="26" fill="%s"/>' % (ox + 440, SKIN))
    s.append(P('M%d 272 C%d 300 %d 360 %d 430 C%d 480 %d 520 %d 552 L%d 580 C%d 540 %d 470 %d 400 C%d 330 %d 300 %d 290 Z' % tuple(ox + v for v in (208, 188, 174, 166, 160, 156, 154, 200, 204, 210, 218, 224, 232, 236)), WOOL))
    s.append('<ellipse cx="%d" cy="566" rx="22" ry="25" fill="%s"/>' % (ox + 148, SKIN))
    # 머리쓰개 뒷모습: 머리를 덮고 등 위로 늘어진다
    s.append(P('M%d 230 C%d 170 %d 110 %d 92 C%d 66 %d 62 %d 62 C%d 62 %d 66 %d 92 C%d 110 %d 170 %d 230 C%d 300 %d 340 %d 352 C%d 360 %d 360 %d 352 C%d 340 %d 300 %d 230 Z' % tuple(
        ox + v for v in (232, 234, 242, 254, 272, 288, 300, 312, 328, 346, 358, 366, 368, 384, 378, 360, 330, 270, 240, 222, 216, 232)), LINEN))
    for x0 in (262, 300, 338):
        s.append(P('M%d 150 C%d 220 %d 290 %d 350 L%d 350 C%d 290 %d 220 %d 150 Z' % tuple(ox + v for v in (x0, x0 - 2, x0 - 4, x0 - 6, x0 + 4, x0 + 4, x0 + 3, x0 + 3)), LINEN_SH))
    s.append(P('M%d 96 C%d 86 %d 82 %d 82 C%d 82 %d 86 %d 96 L%d 110 C%d 98 %d 96 %d 96 C%d 96 %d 98 %d 110 Z' % tuple(ox + v for v in (254, 272, 288, 300, 312, 328, 346, 346, 330, 312, 300, 288, 270, 254)), CORD))
    return ''.join(s)


def ground(ox):
    return '<ellipse cx="%d" cy="938" rx="170" ry="16" fill="#000" opacity="0.10"/>' % (ox + 300)


BG = '#F4EFE6'
sheet = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1800 1000"><rect width="1800" height="1000" fill="%s"/>' % BG
         + ground(0) + front(0) + ground(600) + side(600) + ground(1200) + back(1200) + '</svg>')
single = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 1000"><rect width="600" height="1000" fill="#FFFFFF"/>'
          + front(0) + '</svg>')
open(os.path.join(OUT, 'moses_sheet.svg'), 'w', encoding='utf-8').write(sheet)
open(os.path.join(OUT, 'moses_front.svg'), 'w', encoding='utf-8').write(single)
print('ok', len(sheet), len(single))
