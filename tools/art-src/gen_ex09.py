#!/usr/bin/env python3
# ex09 구름 기둥과 불 기둥 배경 생성기 (임시 도구)
import math, random, json, sys

OUT = '/home/user/bible_onyou/web/assets/bg/ex09.svg'
META = '/home/user/bible_onyou/web/assets/bg/ex09.meta.json'
PX, PY = 540, 618  # 기둥 밑동


def n(v):
    s = '%.1f' % v
    if s.endswith('.0'):
        s = s[:-2]
    if s == '-0':
        s = '0'
    return s


def sc(v):
    s = ('%.3f' % v).rstrip('0').rstrip('.')
    if s.startswith('0.'):
        s = s[1:]
    if s.startswith('-0.'):
        s = '-' + s[2:]
    return s or '0'


def mix(c1, c2, t):
    t = max(0, min(1, t))
    a = [int(c1[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(c2[i:i + 2], 16) for i in (1, 3, 5)]
    return '#%02X%02X%02X' % tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def sm(x, a, b):
    t = max(0, min(1, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def ax(y):
    return PX + 11 * math.sin((PY - y) / 100.0)


def catmull(P, samples):
    out = []
    Q = [P[0]] + P + [P[-1]]
    for i in range(1, len(Q) - 2):
        p0, p1, p2, p3 = Q[i - 1], Q[i], Q[i + 1], Q[i + 2]
        for j in range(samples):
            t = j / samples
            out.append(tuple(0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t ** 3) for k in range(3)))
    out.append(P[-1])
    return out


# ---------------------------------------------------------------- 길
ROAD = [(450, 1215, 440), (468, 1085, 350), (540, 990, 262), (622, 908, 178), (606, 834, 124),
        (500, 784, 92), (388, 740, 66), (374, 696, 46), (440, 663, 32), (505, 641, 21), (531, 624, 12), (539, 613, 5)]
RD = catmull(ROAD, 24)


def road_path():
    S = catmull(ROAD, 6)
    L, Rr = [], []
    for i, (x, y, w) in enumerate(S):
        a = S[max(0, i - 1)]
        b = S[min(len(S) - 1, i + 1)]
        tx, ty = b[0] - a[0], b[1] - a[1]
        ln = math.hypot(tx, ty) or 1
        nx, ny = -ty / ln, tx / ln
        if nx < 0:
            nx, ny = -nx, -ny
        ox, oy = nx * w / 2, ny * w / 2 * 0.4
        # 옆으로 가는 구간도 최소 두께 유지
        L.append((x - ox, y - oy))
        Rr.append((x + ox, y + oy))
    pts = L + Rr[::-1]
    return 'M' + 'L'.join('%d %d' % (round(px), round(py)) for px, py in pts) + 'Z'


def road_at(y):
    for i in range(1, len(RD)):
        if RD[i][1] <= y:
            a, b = RD[i - 1], RD[i]
            return b[0], b[2], b[0] - a[0], b[1] - a[1]
    return RD[-1][0], RD[-1][2], 0, -1


# ---------------------------------------------------------------- 구름 기둥
CLUMPS = [(600, 4, 150, 30), (578, -8, 106, 44), (530, -24, 86, 48), (482, 22, 90, 52), (424, -18, 88, 54), (360, 22, 92, 56),
          (294, -20, 96, 58), (228, 18, 98, 58), (166, -16, 90, 56), (114, 18, 72, 48), (88, 44, 40, 28), (64, -20, 48, 35)]


def cloud():
    R = random.Random(21)
    out = ''
    for i, (cy, dx, a, b) in enumerate(CLUMPS):
        cx = ax(cy) + dx
        t = (PY - cy) / 560.0
        circ = [(cx, cy + 4, b * 0.95, 0.0, 0)]
        m = 7 if a > 100 else (6 if a > 60 else 4)
        for j in range(m):
            th = math.radians(-208 + 236 * (j + R.uniform(0.3, 0.7)) / m)
            x = cx + a * 0.66 * math.cos(th)
            y = cy + b * 0.5 * math.sin(th)
            r = b * R.uniform(0.5, 0.74)
            circ.append((x, y, r, (x - cx) / a, 1 if math.sin(th) < -0.35 else 0))
        warm = (1 - t) ** 2 * 0.5
        shd = mix('#AEB9D0', '#CBB9A4', warm)
        half = mix('#E2E5EE', '#EBDDC9', warm)
        lit = mix('#FFFDF6', '#F9ECD8', warm)
        g1 = g2 = g3 = g4 = ''
        for (x, y, r, u, up) in circ:
            g1 += '<circle cx="%d" cy="%d" r="%d"/>' % (x, y, r)
            if u > 0.3:
                g2 += '<circle cx="%d" cy="%d" r="%d"/>' % (x - 0.1 * r - 2, y - 0.16 * r - 4, r * 0.9)
            else:
                g3 += '<circle cx="%d" cy="%d" r="%d"/>' % (x - 0.1 * r - 3, y - 0.16 * r - 5, r * 0.9)
        out += '<g class="ex09-cb%d"><g fill="%s">%s</g><g fill="%s">%s</g><g fill="%s">%s</g></g>' % (i % 5 + 1, shd, g1, half, g2, lit, g3)
    return out


# ---------------------------------------------------------------- 불 기둥
def flame(W, ytop, seed, Lr=(70, 115), ampf=(0.12, 0.3), ybase=PY + 4, flare=1.18, tips=3):
    R = random.Random(seed)

    def hw(y):
        t = (ybase - y) / (ybase - ytop)
        b = W * (1 + (flare - 1) * max(0, 1 - t * 7))
        if t > 0.56:
            b *= 1.0 - 0.5 * ((t - 0.56) / 0.44) ** 1.3
        return b

    def side(sg):
        segs = []
        y = ybase
        x = ax(y) + sg * hw(y)
        ylim = ytop + 0.24 * (ybase - ytop)
        while y > ylim + 34:
            L = min(R.uniform(*Lr), y - ylim)
            a = W * R.uniform(*ampf)
            d = R.uniform(16, 28)
            ty = y - L
            tx = ax(ty) + sg * (hw(ty) + a * R.uniform(0.3, 0.9))
            c1 = (x + sg * a * 1.1, y - L * 0.5)
            ny = ty + d
            nx = ax(ny) + sg * (hw(ny) - R.uniform(3, 8) * W / 60)
            c2 = (tx - sg * a * 0.55, ty + d * 0.75)
            segs.append(((x, y), c1, (tx, ty)))
            segs.append(((tx, ty), c2, (nx, ny)))
            x, y = nx, ny
        return segs, (x, y)

    rs, (xr, yr) = side(1)
    ls, (xl, yl) = side(-1)
    ye = min(yr, yl)
    mid = (xl + xr) / 2
    h = (xr - xl) / 2
    H = ye - ytop
    if tips == 3:
        T1 = (mid + 0.62 * h, ytop + 0.6 * H)
        N12 = (mid + 0.3 * h, ytop + 0.86 * H)
        T2 = (mid + 0.04 * h + R.uniform(-4, 4), ytop)
        N23 = (mid - 0.36 * h, ytop + 0.8 * H)
        T3 = (mid - 0.66 * h, ytop + 0.46 * H)
        top = [((xr, yr), (xr + 0.25 * h, (yr + T1[1]) / 2 + 6), T1),
               (T1, (T1[0] - 0.22 * h, T1[1] + 0.55 * (N12[1] - T1[1])), N12),
               (N12, (N12[0] + 0.3 * h, (N12[1] + T2[1]) / 2 + 10), T2),
               (T2, (T2[0] - 0.2 * h, T2[1] + 0.6 * (N23[1] - T2[1])), N23),
               (N23, (N23[0] + 0.1 * h, (N23[1] + T3[1]) / 2 + 8), T3),
               (T3, (xl - 0.25 * h, (yl + T3[1]) / 2 + 4), (xl, yl))]
    else:
        T1 = (mid + 0.25 * h + R.uniform(-3, 3), ytop)
        top = [((xr, yr), (xr + 0.3 * h, (yr + T1[1]) / 2 + 8), T1),
               (T1, (xl - 0.2 * h, (yl + T1[1]) / 2 + 6), (xl, yl))]
    segs = rs + top + [(c, b, a) for (a, b, c) in reversed(ls)]
    d = 'M%d %d' % (round(segs[0][0][0]), round(segs[0][0][1]))
    for (a, b, c) in segs:
        d += 'Q%d %d %d %d' % (round(b[0]), round(b[1]), round(c[0]), round(c[1]))
    return d + 'Z'


# ---------------------------------------------------------------- 사람 (낮)
ROBES = ['#F1E6CE', '#B8623C', '#49668A', '#F1E6CE', '#B8623C', '#49668A', '#C4954A']
HEADS = ['#F8F0DC', '#C9963F', '#8E3F2A', '#35506F', '#E2D2B0']
HAZE = '#EAD6AE'


def person(kind, x, y, s, flip, robe, head, R, extra=''):
    k = s / 100.0
    hz = 0.3 * (1 - sm(s, 6, 26))
    robe = mix(robe, HAZE, hz)
    head = mix(head, HAZE, hz)
    tr = 'translate(%d %d)scale(%s)' % (round(x), round(y), sc(k)) if not flip else 'translate(%d %d)scale(%s %s)' % (round(x), round(y), sc(-k), sc(k))
    o = '<use href="#ex09-%s" transform="%s" fill="%s" color="%s"/>' % (kind, tr, robe, head)
    for e in extra.split():
        if e == 'st':
            o += '<use href="#ex09-st" transform="%s"/>' % tr
        elif e == 'bn':
            o += '<use href="#ex09-bn" transform="%s" fill="%s"/>' % (tr, mix(R.choice(['#D8C39A', '#8A6A48', '#C9A46A']), HAZE, hz))
        elif e == 'jr':
            o += '<use href="#ex09-jr" transform="%s" fill="%s"/>' % (tr, mix(R.choice(['#E6D5AE', '#C9A46A', '#D8C39A']), HAZE, hz))
    return o


def donkey(x, y, s, flip, R, load=True):
    k = s / 100.0
    hz = 0.3 * (1 - sm(s, 6, 26))
    tr = 'translate(%d %d)scale(%s)' % (round(x), round(y), sc(k)) if not flip else 'translate(%d %d)scale(%s %s)' % (round(x), round(y), sc(-k), sc(k))
    o = '<use href="#ex09-dk" transform="%s" fill="%s"/>' % (tr, mix(R.choice(['#8E7F72', '#9A8A78', '#7F7268']), HAZE, hz))
    if load:
        o += '<use href="#ex09-ld" transform="%s" fill="%s" color="%s"/>' % (tr, mix(R.choice(['#B8623C', '#49668A', '#8A6A48']), HAZE, hz), mix(R.choice(['#E6D5AE', '#D8C39A', '#C9A46A']), HAZE, hz))
    return o


def sheep(x, y, s, flip, R, col=None):
    k = s / 100.0
    tr = 'translate(%d %d)scale(%s)' % (round(x), round(y), sc(k)) if not flip else 'translate(%d %d)scale(%s %s)' % (round(x), round(y), sc(-k), sc(k))
    return '<use href="#ex09-sh" transform="%s" fill="%s"/>' % (tr, col or R.choice(['#F6EEDD', '#EFE4CC', '#F9F3E6']))


def scale_at(y):
    return max(4.5, 0.23 * (y - 598))


def procession():
    R = random.Random(5)
    items = []
    acc, nxt, row = 0, 0, 0
    for i in range(1, len(RD)):
        x0, y0, w0 = RD[i - 1]
        x1, y1, w1 = RD[i]
        if y1 > 852 or y1 < 619:
            continue
        s = scale_at(y1)
        dx, dy = x1 - x0, y1 - y0
        acc += math.hypot(dx, dy / 0.32)
        if acc < nxt:
            continue
        acc = 0
        nxt = s * R.uniform(0.5, 0.85)
        row += 1
        lateral = abs(dx) > 0.55 * abs(dy)
        face = 1 if dx > 0 else -1
        if s > 13 and row % 7 == 3:
            # 나귀와 끄는 사람
            fl = face < 0
            py = y1 + R.uniform(-0.1, 0.1) * w1 * 0.3
            s2 = scale_at(py)
            items.append((py, donkey(x1 - face * 0.1 * s2, py, s2, fl, R)))
            items.append((py - 0.02 * s2, person('ps', x1 + face * 0.62 * s2, py - 0.02 * s2, s2, fl, R.choice(ROBES), R.choice(HEADS), R)))
            continue
        k = R.choice([1, 2, 2, 3]) if s < 40 else R.choice([1, 2, 2])
        used = []
        for j in range(k):
            for _ in range(8):
                off = R.uniform(-0.38, 0.38)
                if all(abs(off - u) > 0.2 for u in used):
                    break
            used.append(off)
            if lateral:
                px = x1 + R.uniform(-0.3, 0.3) * s
                py = y1 + off * w1 * 0.42
            else:
                px = x1 + off * w1
                py = y1 + R.uniform(-0.12, 0.12) * s
            s2 = scale_at(py) * R.uniform(0.93, 1.05)
            back = (not lateral and R.random() < 0.6) or (abs(dx) < 0.25 * abs(dy))
            kind = 'pb' if back else 'ps'
            ex = ''
            r = R.random()
            child = r < 0.2
            if child:
                s2 *= R.uniform(0.55, 0.7)
            elif r < 0.36:
                ex = 'st'
            elif r < 0.5 and kind == 'ps':
                ex = 'bn'
            elif r < 0.6:
                ex = 'jr'
            items.append((py, person(kind, px, py, s2, (kind == 'ps' and face < 0), R.choice(ROBES), R.choice(HEADS), R, ex)))
    # 앞쪽 무리 (직접 배치)
    def P(kind, x, y, robe, head, ex='', f=False, m=1.0):
        items.append((y, person(kind, x, y, scale_at(y) * m, f, robe, head, R, ex)))
    P('pb', 540, 958, '#49668A', '#F8F0DC', 'st')
    P('pb', 578, 963, '#F1E6CE', '#C9963F', '', False, 0.6)
    P('pb', 614, 952, '#B8623C', '#E2D2B0', 'jr')
    P('ps', 488, 930, '#F1E6CE', '#8E3F2A', 'bn')
    items.append((906, donkey(640, 906, scale_at(906), False, R)))
    P('ps', 697, 898, '#F1E6CE', '#35506F', 'st')
    P('pb', 560, 882, '#B8623C', '#F8F0DC', '')
    P('pb', 592, 878, '#C4954A', '#35506F', '', False, 0.64)
    # 양 떼와 목자
    for (sx, sy) in [(372, 914), (408, 904), (440, 918), (360, 940), (398, 934), (434, 946), (414, 962), (334, 926), (378, 964), (446, 892)]:
        items.append((sy, sheep(sx, sy, scale_at(sy), False, R)))
    P('pb', 314, 958, '#B8623C', '#F8F0DC', 'st')
    P('pb', 284, 962, '#F1E6CE', '#35506F', '', False, 0.58)
    items.sort(key=lambda t: t[0])
    return ''.join(o for _, o in items)


# ---------------------------------------------------------------- 밤 진영
TENTS = [  # x, y, scale, flip
    (232, 690, .33, 0), (330, 708, .4, 0), (452, 682, .26, 0), (632, 686, .3, 1), (722, 704, .4, 1), (812, 690, .33, 1),
    (150, 752, .52, 0), (690, 756, .54, 1),
    (160, 812, .72, 0), (372, 836, .8, 0), (808, 798, .6, 1),
    (200, 956, 1.15, 0), (772, 884, .86, 1)]
NROBE = ['#55527C', '#6A4250', '#3C4C72', '#726060']
NHEAD = ['#9690AE', '#8A6450', '#5E3C44', '#33456A']


def camp():
    R = random.Random(11)
    items = []
    shadows = ''
    for (x, y, k, fl) in TENTS:
        dx, dy = x - PX, y - PY
        ln = math.hypot(dx, dy)
        ux, uy = dx / ln, dy / ln
        L = 95 * k
        ox, oy = ux * L, uy * L * 0.5 + 6 * k
        bl, br = x - 96 * k, x + 96 * k
        shadows += '<path d="M%d %dL%d %dL%d %dL%d %dZ"/>' % (bl, y - 2 * k, br, y - 2 * k, br + ox, y + oy, bl + ox, y + oy)
        near = sm(ln, 140, 480)
        lit = mix('#F8BC6A', '#CC8450', near)
        dark = mix('#4E3C5E', '#2A2748', near)
        ky = k * R.uniform(0.9, 1.12)
        tr = 'translate(%d %d)scale(%s %s)' % (x, y, sc(-k if fl else k), sc(ky))
        items.append((y, '<use href="#ex09-tn" transform="%s" fill="%s" color="%s"/>' % (tr, dark, lit)))

    def N(kind, x, y, m=1.0):
        s = scale_at(y) * m
        k = s / 100
        fl = x > PX
        ln = math.hypot(x - PX, y - PY)
        near = sm(ln, 90, 440)
        robe = R.choice(NROBE)
        head = R.choice(NHEAD)
        robe = mix(mix(robe, '#9A6450', 0.5), robe, near)
        head = mix(mix(head, '#C08A60', 0.5), head, near)
        tr = 'translate(%d %d)scale(%s)' % (x, y, sc(k)) if not fl else 'translate(%d %d)scale(%s %s)' % (x, y, sc(-k), sc(k))
        items.append((y, '<use href="#ex09-%s" transform="%s" fill="%s" color="%s"/>' % (kind, tr, robe, head)))

    # 가운데 길 위에서 기둥을 바라보는 사람들
    N('nb', 548, 946); N('nb', 518, 951, 0.6); N('nb', 628, 938); N('ns', 590, 964); N('ns', 660, 958, 0.7)
    # 앞쪽 장막 어귀
    N('nb', 342, 940); N('ns', 374, 962); N('ns', 404, 968, 0.66); N('ps', 446, 950)
    N('ns', 668, 893); N('nb', 648, 884, 0.62)
    # 가운데 줄
    N('nb', 464, 842); N('ns', 486, 850, 0.7); N('nb', 244, 818); N('ns', 268, 826); N('nb', 212, 758)
    N('ns', 742, 806); N('nb', 722, 800); N('ns', 624, 762); N('nb', 606, 758, .64)
    N('nb', 566, 838); N('nb', 544, 842, 0.6); N('ns', 604, 868); N('ps', 296, 790); N('ps', 706, 850)
    N('ns', 470, 796); N('ns', 494, 802, 0.7)
    # 먼 줄
    for (x, y) in [(290, 698), (392, 716), (412, 712), (424, 694), (484, 690), (500, 672), (586, 694), (660, 710), (676, 708), (764, 696), (430, 742), (404, 746), (520, 656), (548, 660)]:
        N(R.choice(['nb', 'nb', 'ns']), x, y, R.choice([1, 1, .65]))
    # 쉬는 양 떼, 나귀
    for (x, y) in [(430, 902), (456, 894), (480, 906), (446, 916), (472, 920), (410, 914), (498, 896)]:
        s = scale_at(y)
        items.append((y, '<use href="#ex09-shl" transform="translate(%d %d)scale(%s)" fill="%s"/>' % (x, y, sc(s / 100), R.choice(['#9790AE', '#A298B0', '#8D86A6']))))
    for (x, y, fl) in [(852, 902, 1), (108, 862, 0)]:
        s = scale_at(y)
        tr = 'translate(%d %d)scale(%s)' % (x, y, sc(s / 100)) if not fl else 'translate(%d %d)scale(%s %s)' % (x, y, sc(-s / 100), sc(s / 100))
        items.append((y, '<use href="#ex09-dk" transform="%s" fill="#4A4464"/>' % tr))
    items.sort(key=lambda t: t[0])
    return shadows, ''.join(o for _, o in items)


# ---------------------------------------------------------------- 별
def stars():
    R = random.Random(3)
    G = {}
    cnt = 0
    while cnt < 100:
        x = R.uniform(4, 896)
        y = R.uniform(8, 540)
        if R.random() < (y / 560) ** 2 * 0.7:
            continue
        d = abs(x - ax(y))
        if d < 120 or (d < 230 and R.random() < 0.75):
            continue
        cnt += 1
        key = (R.choice([1, 2, 3]), R.choice(['#FFFBEF', '#FFF2CF', '#DCE8FF']))
        if R.random() < 0.13:
            e = '<use href="#ex09-sr" transform="translate(%d %d)scale(%s)"/>' % (x, y, sc(R.uniform(0.7, 1.35)))
        else:
            e = '<circle cx="%d" cy="%d" r="%s"/>' % (x, y, n(R.choice([0.9, 1.1, 1.3, 1.6, 2.1])))
        G.setdefault(key, []).append(e)
    return ''.join('<g class="ex09-tw%d" fill="%s">%s</g>' % (k[0], k[1], ''.join(v)) for k, v in sorted(G.items()))


# ---------------------------------------------------------------- 잔돌, 발자국, 물결무늬
def pebbles():
    R = random.Random(8)
    o = ''
    for _ in range(46):
        y = R.uniform(650, 1190)
        x = R.uniform(10, 890)
        s = scale_at(y) / 100
        o += '<ellipse cx="%d" cy="%d" rx="%s" ry="%s"/>' % (x, y, n(R.uniform(4, 9) * s + 0.6), n(R.uniform(2, 4) * s + 0.4))
    return o


def footprints():
    R = random.Random(4)
    o = ''
    y = 1188
    while y > 980:
        x, w, dx, dy = road_at(y)
        s = scale_at(y) / 100
        px = x + R.uniform(-0.36, 0.36) * w
        o += '<ellipse cx="%d" cy="%d" rx="%s" ry="%s"/><ellipse cx="%d" cy="%d" rx="%s" ry="%s"/>' % (px, y, n(7 * s), n(3 * s), px + 16 * s, y - 9 * s, n(7 * s), n(3 * s))
        y -= R.uniform(5, 13)
    return o


def ripples():
    o = ''
    for (x, y, L, a, c, gap) in [(24, 962, 150, 9, 4, 13), (20, 800, 110, 6, 3, 9), (700, 800, 120, 6, 3, 9), (640, 1010, 190, 9, 3, 15), (60, 1100, 220, 10, 3, 18),
                                 (600, 700, 110, 4, 3, 7), (120, 690, 100, 4, 3, 7), (700, 1120, 170, 9, 2, 17), (520, 728, 90, 4, 2, 7)]:
        for i in range(c):
            xx = x + i * 9
            yy = y + i * gap
            o += '<path d="M%d %dq%d %d %d 0t%d 0"/>' % (xx, yy, L // 4, -a, L // 2, L // 2)
    return o


# ---------------------------------------------------------------- 조립
def build():
    road = road_path()
    sh, cmp_ = camp()
    S = []
    S.append('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200" preserveAspectRatio="xMidYMid slice">')
    S.append('''<style>
.ex09-fl,.ex09-gl{transform-origin:540px 622px}
.ex09-sp{opacity:.9}
@media (prefers-reduced-motion: no-preference){
.ex09-cb1{animation:ex09-billow 11s ease-in-out infinite alternate}
.ex09-cb2{animation:ex09-billow 13s ease-in-out -4s infinite alternate}
.ex09-cb3{animation:ex09-billow 12s ease-in-out -7s infinite alternate}
.ex09-cb4{animation:ex09-billow 14s ease-in-out -2s infinite alternate}
.ex09-cb5{animation:ex09-billow 15s ease-in-out -9s infinite alternate}
.ex09-wisp{animation:ex09-drift 40s linear infinite alternate}
.ex09-tw1{animation:ex09-tw 3.1s ease-in-out infinite alternate}
.ex09-tw2{animation:ex09-tw 4.3s ease-in-out -1.6s infinite alternate}
.ex09-tw3{animation:ex09-tw 5.7s ease-in-out -3.2s infinite alternate}
.ex09-fl1{animation:ex09-fla 3.4s ease-in-out infinite alternate}
.ex09-fl2{animation:ex09-flb 2.9s ease-in-out -.8s infinite alternate}
.ex09-fl3{animation:ex09-fla 2.5s ease-in-out -1.4s infinite alternate}
.ex09-fl4{animation:ex09-flb 2.1s ease-in-out -.4s infinite alternate}
.ex09-gl{animation:ex09-glow 3.7s ease-in-out infinite alternate}
.ex09-gr{animation:ex09-glow 4.4s ease-in-out -1s infinite alternate}
.ex09-sp1{animation:ex09-rise 5s linear infinite}
.ex09-sp2{animation:ex09-rise 6.5s linear -2.2s infinite}
.ex09-sp3{animation:ex09-rise 7.5s linear -4.1s infinite}
@keyframes ex09-billow{0%{transform:translate(-2px,2px)}100%{transform:translate(3px,-5px)}}
@keyframes ex09-drift{0%{transform:translate(-20px,0)}100%{transform:translate(30px,0)}}
@keyframes ex09-tw{0%{opacity:.25}100%{opacity:1}}
@keyframes ex09-fla{0%{transform:skewX(-1.1deg) scale(1,1)}100%{transform:skewX(1.2deg) scale(.985,1.018)}}
@keyframes ex09-flb{0%{transform:skewX(1deg) scale(.99,1.012)}100%{transform:skewX(-1.3deg) scale(1.012,1)}}
@keyframes ex09-glow{0%{opacity:.82}100%{opacity:1}}
@keyframes ex09-rise{0%{transform:translate(0,0);opacity:0}12%{opacity:.95}100%{transform:translate(10px,-110px);opacity:0}}
}
</style>''')
    D = []
    # 그라디언트
    D.append('<linearGradient id="ex09-gds" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3FA6B9"/><stop offset=".45" stop-color="#7AD0C8"/><stop offset=".82" stop-color="#CFEAD8"/><stop offset="1" stop-color="#F5E8C6"/></linearGradient>')
    D.append('<radialGradient id="ex09-gdl" cx="90" cy="40" r="520" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFFBE6" stop-opacity=".75"/><stop offset="1" stop-color="#FFFBE6" stop-opacity="0"/></radialGradient>')
    D.append('<linearGradient id="ex09-gdr" x1="0" y1="612" x2="0" y2="1200" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FBEFCB"/><stop offset=".5" stop-color="#F4DEAC"/><stop offset="1" stop-color="#EBCB92"/></linearGradient>')
    D.append('<linearGradient id="ex09-gns" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1530"/><stop offset=".45" stop-color="#16233F"/><stop offset=".8" stop-color="#2F2F64"/><stop offset="1" stop-color="#5A4A82"/></linearGradient>')
    D.append('<radialGradient id="ex09-gng" cx="540" cy="380" r="520" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFC56E" stop-opacity=".7"/><stop offset=".35" stop-color="#EF8A3E" stop-opacity=".34"/><stop offset=".7" stop-color="#B0507A" stop-opacity=".12"/><stop offset="1" stop-color="#5A4A82" stop-opacity="0"/></radialGradient>')
    for i, (r, st) in enumerate([(430, [('0', '#F2AE62'), ('.22', '#C27C4E'), ('.55', '#6B4D66'), ('1', '#34315C')]),
                                 (500, [('0', '#E79E58'), ('.26', '#A9694D'), ('.6', '#55426182'[:7]), ('1', '#2B2B53')]),
                                 (590, [('0', '#D08A52'), ('.32', '#8C5A4E'), ('.68', '#433A5E'), ('1', '#24284A')]),
                                 (720, [('0', '#B87850'), ('.42', '#6A4A54'), ('.78', '#302E50'), ('1', '#1B2040')])]):
        D.append('<radialGradient id="ex09-gn%d" cx="540" cy="622" r="%d" gradientUnits="userSpaceOnUse">%s</radialGradient>' % (i + 1, r, ''.join('<stop offset="%s" stop-color="%s"/>' % s for s in st)))
    D.append('<radialGradient id="ex09-gnr" cx="540" cy="622" r="620" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFD998" stop-opacity=".85"/><stop offset=".45" stop-color="#E9A56A" stop-opacity=".4"/><stop offset="1" stop-color="#9A7890" stop-opacity=".14"/></radialGradient>')
    D.append('<radialGradient id="ex09-gnk" cx="540" cy="622" r="430" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFD592" stop-opacity=".9"/><stop offset=".45" stop-color="#F0A45C" stop-opacity=".4"/><stop offset="1" stop-color="#F0A45C" stop-opacity="0"/></radialGradient>')
    D.append('<radialGradient id="ex09-gnp" cx="540" cy="640" r="330" gradientUnits="userSpaceOnUse" gradientTransform="matrix(1 0 0 .32 0 435)"><stop offset="0" stop-color="#FFE3A6" stop-opacity=".8"/><stop offset=".5" stop-color="#F7A552" stop-opacity=".3"/><stop offset="1" stop-color="#F7A552" stop-opacity="0"/></radialGradient>')
    D.append('<filter id="ex09-fb" x="-60%" y="-30%" width="220%" height="160%"><feGaussianBlur stdDeviation="20"/></filter>')
    D.append('<filter id="ex09-fs" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="5"/></filter>')
    # 지형 뼈대 (낮·밤 공통)
    D.append('<path id="ex09-m1" d="M0 548C60 530 110 500 170 506C220 510 250 540 300 536C350 530 380 492 440 488C500 486 520 520 580 526C640 530 680 500 740 496C800 494 850 520 900 512V660H0Z"/>')
    D.append('<path id="ex09-m2" d="M-9 574C40 568 66 550 116 549L188 551C214 553 226 573 262 576C320 580 360 568 420 572C480 576 520 586 590 582C640 580 658 558 698 556L788 554C828 554 850 568 909 564V680H-9Z"/>')
    D.append('<path id="ex09-d1" d="M-9 606C80 596 150 590 240 600C320 608 380 614 450 611C520 608 560 613 640 604C720 596 800 592 909 600V1209H-9Z"/>')
    D.append('<path id="ex09-d2" d="M-9 668C70 650 150 640 230 652C290 660 330 676 400 673C440 671 470 657 520 655C600 651 650 669 720 661C790 653 850 640 909 646V1209H-9Z"/>')
    D.append('<path id="ex09-d3" d="M-9 760C60 742 110 728 170 734C240 742 290 778 350 790C420 802 470 801 530 797C590 793 620 771 680 749C730 731 800 722 909 742V1209H-9Z"/>')
    D.append('<path id="ex09-d4" d="M-9 930C80 905 170 900 260 918C340 934 400 960 480 969C570 977 650 962 730 942C800 925 860 920 909 926V1209H-9Z"/>')
    D.append('<path id="ex09-rd" d="%s"/>' % road)
    D.append('<g id="ex09-pbl">%s</g>' % pebbles())
    D.append('<g id="ex09-ftp">%s</g>' % footprints())
    D.append('<g id="ex09-rip" fill="none" stroke-width="2" stroke-linecap="round">%s</g>' % ripples())
    # 바위, 관목
    D.append('<path id="ex09-rk1" d="M0 0C-6-30 6-62 34-78C58-92 96-88 118-66C138-48 150-22 146 0Z"/>')
    D.append('<path id="ex09-rk2" d="M0 0C-4-16 8-34 30-40L84-44C100-42 112-24 110 0Z"/>')
    D.append('<path id="ex09-rk3" d="M0 0C0-14 10-28 26-28C40-28 50-14 50 0Z"/>')
    D.append('<g id="ex09-rk1d"><use href="#ex09-rk1"/><path d="M80-87C98-85 112-74 118-66C138-48 150-22 146 0L92 0C104-28 100-60 80-87Z" fill="#000" opacity=".24"/><path d="M8-42C14-62 30-76 50-83C40-68 26-54 22-34Z" fill="#fff" opacity=".22"/><path d="M34-78C58-92 96-88 118-66C98-72 72-74 52-66Z" fill="#fff" opacity=".1"/><path d="M52-66C56-50 48-36 60-20" stroke="#000" stroke-opacity=".14" stroke-width="3" fill="none"/></g>')
    D.append('<g id="ex09-rk2d"><use href="#ex09-rk2"/><path d="M66-43L84-44C100-42 112-24 110 0L74 0C82-14 80-30 66-43Z" fill="#000" opacity=".24"/><path d="M6-22C12-32 22-38 34-40C26-32 20-26 18-16Z" fill="#fff" opacity=".2"/></g>')
    D.append('<g id="ex09-rk3d"><use href="#ex09-rk3"/><path d="M28-28C42-26 50-14 50 0L32 0C38-10 38-20 28-28Z" fill="#000" opacity=".24"/></g>')
    D.append('<g id="ex09-rk1n"><use href="#ex09-rk1"/><path d="M0-30C4-56 20-72 34-78C58-92 96-88 118-66C128-58 136-48 140-38C128-56 108-70 88-74C60-80 34-74 18-58C8-48 2-40 0-30Z" fill="currentColor"/></g>')
    D.append('<g id="ex09-rk2n"><use href="#ex09-rk2"/><path d="M2-16C6-30 16-38 30-40L84-44C94-43 102-36 106-26C98-34 90-37 82-37L32-33C20-32 10-26 2-16Z" fill="currentColor"/></g>')
    D.append('<g id="ex09-rk3n"><use href="#ex09-rk3"/><path d="M2-10C6-22 14-28 26-28C36-28 44-22 48-12C42-19 34-22 26-22C16-22 8-18 2-10Z" fill="currentColor"/></g>')
    D.append('<g id="ex09-sb"><path d="M0 0L-4-24M0 0L9-28M0 0L-16-18M0 0L20-17" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none"/><circle cx="-17" cy="-25" r="12"/><circle cx="-2" cy="-34" r="14"/><circle cx="13" cy="-30" r="12"/><circle cx="26" cy="-21" r="9"/><circle cx="-28" cy="-17" r="8"/></g>')
    D.append('<g id="ex09-sbh"><circle cx="-20" cy="-29" r="7"/><circle cx="-6" cy="-39" r="8"/><circle cx="9" cy="-35" r="6"/><circle cx="-29" cy="-20" r="4"/></g>')
    D.append('<path id="ex09-tf" d="M0 0Q-6-14-13-20M0 0Q-2-16-3-27M0 0Q4-14 10-23M0 0Q8-8 16-12" fill="none" stroke-width="2.2" stroke-linecap="round"/>')
    # 사람·짐승 (낮)
    D.append('<g id="ex09-pb"><ellipse cx="7" cy="0" rx="26" ry="5" fill="#6B4420" opacity=".28"/><path d="M-11-5h8v5h-8zM3-5h8v5h-8z" fill="#5B3A22"/><path d="M-13-76C-18-72-19-58-20-40L-23-7Q0-1 23-7L20-40C19-58 18-72 13-76Q0-82-13-76Z"/><path d="M4-79Q11-79 13-76C18-72 19-58 20-40L23-7Q15-3 9-4Q13-40 4-79Z" fill="#000" opacity=".16"/><path d="M-21-30Q0-24 21-30L22-24Q0-18-22-24Z" fill="#000" opacity=".1"/><path d="M-11-86C-11-104 11-104 11-86C11-78 15-72 16-66Q0-60-16-66C-15-72-11-78-11-86Z" fill="currentColor"/><path d="M3-99C9-97 11-92 11-86C11-78 15-72 16-66Q11-63 6-63Q10-80 3-99Z" fill="#000" opacity=".14"/><path d="M-11-91Q0-87 11-91V-88Q0-84-11-88Z" fill="#000" opacity=".3"/></g>')
    D.append('<g id="ex09-ps"><ellipse cx="3" cy="0" rx="26" ry="5" fill="#6B4420" opacity=".28"/><path d="M-20-5h10l1 5h-11zM11-5h10l2 5h-11z" fill="#5B3A22"/><path d="M-7-77C-13-70-13-50-15-28L-21-6L-7-4L1-11L12-4L21-7C17-30 15-50 12-64C11-74 6-79 0-79Z"/><path d="M-7-77C-13-70-13-50-15-28L-21-6L-13-5C-9-28-8-50-6-66Z" fill="#000" opacity=".16"/><path d="M-14-34Q0-30 16-36L17-31Q2-25-15-29Z" fill="#000" opacity=".1"/><circle cx="3" cy="-88" r="8.5" fill="#B98A5E"/><path d="M-9-84C-10-101 9-104 12-93L5-94C-1-93-2-87-1-81C-3-73-10-69-15-65C-12-74-9-78-9-84Z" fill="currentColor"/><path d="M1-72C8-66 13-57 15-49L9-46C6-55 2-62-3-66Z" fill="#000" opacity=".13"/><circle cx="13" cy="-46" r="3.4" fill="#B98A5E"/></g>')
    D.append('<path id="ex09-st" d="M18-100L15 0" stroke="#6E4426" stroke-width="3.2" stroke-linecap="round" fill="none"/>')
    D.append('<path id="ex09-bn" d="M-11-73C-24-78-31-63-27-51C-23-42-12-44-8-52C-5-60-5-69-11-73Z"/>')
    D.append('<path id="ex09-jr" d="M-13-102C-17-110-10-117 0-117C10-117 17-110 13-102Q0-98-13-102Z"/>')
    D.append('<g id="ex09-dk"><ellipse cx="6" cy="0" rx="52" ry="6" fill="#6B4420" opacity=".28"/><path d="M-37-36h7l-1 36h-6zM-22-34h7l-2 34h-6zM20-34h7l-1 34h-6zM33-36h7l-2 36h-6z" fill="#000" opacity=".5"/><path d="M-37-36h7l-1 36h-6zM33-36h7l-2 36h-6z" fill-opacity=".85"/><path d="M-44-52C-46-66-30-70-10-68L24-68C32-74 40-82 50-84L68-70C71-65 66-59 61-61L52-64C48-52 44-42 36-36C20-30-20-30-36-34C-42-38-44-44-44-52Z"/><path d="M47-83L42-103L53-88ZM54-84L58-104L61-83Z"/><path d="M-36-34C-20-30 20-30 36-36C30-42 10-44-8-43C-22-43-34-42-43-47C-43-40-40-36-36-34Z" fill="#000" opacity=".2"/><path d="M-44-54C-51-48-51-36-48-27" stroke="#000" stroke-opacity=".45" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="64" cy="-64" rx="4" ry="3" fill="#fff" opacity=".3"/></g>')
    D.append('<g id="ex09-ld"><path d="M-28-60C-30-78-12-84 0-80C12-86 28-78 26-60C28-48 22-40 14-40L-16-40C-26-42-30-50-28-60Z"/><path d="M-3-80C-5-66-5-52-3-40h6C1-52 1-66 3-80Z" fill="#000" opacity=".25"/><path d="M26-60C28-48 22-40 14-40L4-40C14-44 18-52 16-66Z" fill="#000" opacity=".15"/><ellipse cx="0" cy="-85" rx="18" ry="7" fill="currentColor"/></g>')
    D.append('<g id="ex09-shb"><circle cx="-9" cy="-23" r="11"/><circle cx="5" cy="-24" r="12"/><circle cx="-2" cy="-29" r="10"/><circle cx="13" cy="-27" r="8"/><path d="M-19-20C-14-10 12-9 19-19C10-14-10-14-19-20Z" fill="#000" opacity=".16"/><ellipse cx="21" cy="-27" rx="6.5" ry="5.5" fill="#4E3B2E"/><path d="M16-30l-6-2 5 6z" fill="#4E3B2E"/></g>')
    D.append('<g id="ex09-sh"><ellipse cx="3" cy="0" rx="22" ry="4" fill="#6B4420" opacity=".26"/><path d="M-14-14h4v14h-4zM-7-13h4v13h-4zM7-13h4v13h-4zM13-14h4v14h-4z" fill="#4E3B2E"/><use href="#ex09-shb"/></g>')
    # 밤: 장막, 사람, 누운 양, 별
    D.append('<g id="ex09-tn"><path d="M50-80Q0-79-52-64L-98-6Q-45 3 8 0Z"/><path d="M-20-75L-58-2M14-79L-22 1" stroke="#000" stroke-opacity=".16" stroke-width="2.5" fill="none"/><path d="M50-80L92 0H8Z" fill="currentColor"/><path d="M50-80L92 0H78Q70-40 50-80Z" fill="#fff" opacity=".16"/><path d="M50-54L66 0H36Z" fill="#1B1830" opacity=".8"/><path d="M50-80Q0-79-52-64" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M50-79v-10M-52-64v-8" stroke="#1B1830" stroke-width="3.5" stroke-linecap="round"/><path d="M50-80L112 3M-52-64L-118-2" stroke="#1B1830" stroke-opacity=".55" stroke-width="1.6"/></g>')
    D.append('<g id="ex09-nb"><use href="#ex09-pb" transform="scale(-1 1)"/><path d="M5-99C10-97 11-92 11-86C11-78 15-72 16-67L15-74C19-70 19-58 20-40L23-7L17-5C17-30 15-54 12-66C8-76 8-90 5-99Z" fill="#FFC874"/></g>')
    D.append('<g id="ex09-ns"><ellipse cx="-8" cy="-1" rx="34" ry="5" fill="#11163A" opacity=".4"/><path d="M-15-37C-23-29-28-14-32-3Q0 3 32-3C28-14 23-29 15-37Q0-43-15-37Z"/><path d="M-32-3Q0 3 32-3L29-11Q0-5-29-11Z" fill="#000" opacity=".14"/><path d="M-9-48C-9-65 9-65 9-48C9-42 13-38 16-33Q0-27-16-33C-13-38-9-42-9-48Z" fill="currentColor"/><path d="M4-60C8-58 9-53 9-48C9-42 13-38 16-33L15-37C23-29 28-14 32-3L25-2C22-15 17-27 11-34C6-42 6-54 4-60Z" fill="#FFC874"/></g>')
    D.append('<g id="ex09-shl"><ellipse cx="0" cy="-9" rx="20" ry="10"/><circle cx="-8" cy="-14" r="9"/><circle cx="6" cy="-15" r="10"/><path d="M-12-21C-4-27 10-27 15-19C8-23-4-23-12-21Z" fill="#FFD9A0" opacity=".7"/><ellipse cx="20" cy="-12" rx="6" ry="5" fill="#2A2440"/></g>')
    D.append('<path id="ex09-sr" d="M0-7Q.9-.9 7 0Q.9 .9 0 7Q-.9 .9-7 0Q-.9-.9 0-7Z"/>')
    S.append('<defs>' + ''.join(D) + '</defs>')

    # 공통 바탕
    S.append('<g id="ex09-common"><rect width="900" height="1200" fill="#E4BE7E"/></g>')

    # ================= 낮 =================
    A = ['<g id="ex09-state-day">']
    A.append('<rect width="900" height="640" fill="url(#ex09-gds)"/><rect width="900" height="640" fill="url(#ex09-gdl)"/>')
    A.append('<g class="ex09-wisp" fill="#FBF7EE" opacity=".55"><path d="M60 452q60-12 130-4q-50 10-130 4zM150 470q50-8 110-2q-46 8-110 2zM700 430q56-10 128-2q-60 9-128 2zM640 468q40-7 96-1q-44 7-96 1zM330 398q30-5 70-1q-34 5-70 1z"/></g>')
    A.append('<use href="#ex09-m1" fill="#A9C8CD"/><path d="M440 488C500 486 520 520 580 526C540 530 500 540 470 560C465 530 455 505 440 488ZM170 506C220 510 250 540 300 536C270 545 240 552 225 572C215 545 195 520 170 506ZM740 496C800 494 850 520 900 512V560C870 545 850 540 835 548C815 525 780 505 740 496Z" fill="#8FB4C0" opacity=".55"/>')
    A.append('<use href="#ex09-m2" fill="#D3C2A6"/><path d="M116 549L188 551C214 553 226 573 262 576C240 582 215 588 200 600C180 580 150 560 116 549ZM698 556L788 554C828 554 850 568 900 564V600C870 590 850 590 830 598C800 575 750 560 698 556Z" fill="#BCA98F" opacity=".7"/>')
    A.append('<ellipse cx="540" cy="325" rx="150" ry="305" fill="#FFFDF4" opacity=".3" filter="url(#ex09-fb)"/>')
    A.append('<use href="#ex09-d1" fill="#F1DDAE"/>')
    A.append('<path d="M560 612C640 606 720 600 900 604V640C780 628 660 626 560 620Z" fill="#DCC08A" opacity=".5"/>')
    # 기둥 그림자 (오른쪽 아래)
    A.append('<path d="M430 622L680 620L850 654L640 660Z" fill="#B0906E" opacity=".4" filter="url(#ex09-fs)"/>')
    A.append('<g id="ex09-cloud">%s</g>' % cloud())
    A.append('<g filter="url(#ex09-fs)"><ellipse cx="545" cy="627" rx="170" ry="7" fill="#FFFBF0" opacity=".75"/><ellipse cx="398" cy="625" rx="56" ry="5" fill="#FFFBF0" opacity=".7"/><ellipse cx="692" cy="626" rx="60" ry="5" fill="#EFE6DA" opacity=".7"/></g>')
    A.append('<use href="#ex09-d2" fill="#EACB90" stroke="#F6E6BC" stroke-width="2.5"/>')
    A.append('<path d="M150 642C205 641 262 656 330 668C352 672 372 674 392 673C340 682 282 690 240 716C224 688 190 660 150 642ZM540 654C600 651 650 669 702 663C668 672 636 686 616 712C600 686 572 666 540 654ZM850 641C870 640 890 644 900 646V680C886 666 870 652 850 641Z" fill="#DAB67A"/>')
    A.append('<use href="#ex09-d3" fill="#E4BE7E" stroke="#F3DDAA" stroke-width="3"/>')
    A.append('<path d="M150 731C232 739 290 778 350 790C376 795 400 799 422 800C372 820 318 852 292 940L236 940C262 884 204 852 218 812C224 784 184 752 150 731ZM815 727C850 730 880 736 900 742V930C884 880 850 846 860 802C866 772 836 746 815 727Z" fill="#CB9F62"/>')
    A.append('<use href="#ex09-d4" fill="#D9AC68" stroke="#EDD09A" stroke-width="3.5"/>')
    A.append('<path d="M170 902C230 905 300 925 360 946C400 958 430 964 452 967C410 992 366 1038 350 1112L276 1112C296 1048 232 1012 246 972C254 942 202 916 170 902ZM850 921C870 920 890 924 900 926V1080C886 1040 870 1004 878 972C882 950 866 934 850 921Z" fill="#BE8D52"/>')
    A.append('<use href="#ex09-rip" stroke="#B98A4E" opacity=".45"/>')
    A.append('<use href="#ex09-rd" fill="url(#ex09-gdr)" opacity=".9"/>')
    A.append('<use href="#ex09-ftp" fill="#C79A5E" opacity=".55"/>')
    A.append('<use href="#ex09-pbl" fill="#A97848" opacity=".6"/>')
    A.append(scenery(False))
    A.append('<g id="ex09-walk">%s</g>' % procession())
    A.append(foreground(False))
    A.append('</g>')
    S.append(''.join(A))

    # ================= 밤 =================
    B = ['<g id="ex09-state-night" style="display:none">']
    B.append('<rect width="900" height="1200" fill="#1B2040"/><rect width="900" height="640" fill="url(#ex09-gns)"/>')
    B.append('<g id="ex09-stars">%s</g>' % stars())
    B.append('<rect class="ex09-gr" width="900" height="900" fill="url(#ex09-gng)"/>')
    B.append('<use href="#ex09-m1" fill="#2B3260"/><use href="#ex09-m2" fill="#3A3767" stroke="url(#ex09-gnk)" stroke-width="2"/>')
    B.append('<use href="#ex09-d1" fill="url(#ex09-gn1)"/>')
    # 불 기둥
    F = '<g id="ex09-fire">'
    F += '<ellipse class="ex09-gl" cx="542" cy="330" rx="112" ry="306" fill="#F7902B" opacity=".6" filter="url(#ex09-fb)"/>'
    F += '<path class="ex09-fl ex09-fl1" d="%s" fill="#D4521E" opacity=".55"/>' % flame(86, 20, 31, ampf=(0.14, 0.32))
    F += '<path class="ex09-fl ex09-fl1" d="%s" fill="#EA6A2A"/>' % flame(70, 44, 32)
    F += '<path class="ex09-fl ex09-fl2" d="%s" fill="#F4902B"/>' % flame(53, 98, 33, ampf=(0.1, 0.22))
    F += '<path class="ex09-fl ex09-fl3" d="%s" fill="#F7B733"/>' % flame(38, 160, 34, ampf=(0.1, 0.22))
    F += '<path class="ex09-fl ex09-fl4" d="%s" fill="#FFD76A"/>' % flame(23, 230, 35, Lr=(90, 140), ampf=(0.1, 0.2), tips=1)
    F += '<path class="ex09-fl ex09-fl4" d="%s" fill="#FFF3C6"/>' % flame(10, 314, 36, Lr=(100, 150), ampf=(0.1, 0.2), tips=1, flare=1.5)
    # 떨어져 나온 불꽃 조각, 불티
    R = random.Random(17)
    for (x, y, k, rot, col) in [(478, 132, 1.0, -8, '#EA6A2A'), (604, 104, .8, 10, '#F4902B'), (586, 52, .7, 6, '#EA6A2A'), (462, 300, .7, -12, '#F4902B'), (626, 262, .8, 12, '#EA6A2A'), (506, 60, .55, -6, '#F7B733')]:
        F += '<g class="ex09-fl ex09-fl%d"><path d="M0 0C7-8 5-19 0-28C-5-19-8-8 0 0Z" transform="translate(%d %d)rotate(%d)scale(%s)" fill="%s"/></g>' % (2 if x < 540 else 3, x, y, rot, sc(k), col)
    for i in range(22):
        y = R.uniform(30, 520)
        x = ax(y) + R.choice([-1, 1]) * R.uniform(60, 120)
        F += '<circle class="ex09-sp ex09-sp%d" cx="%d" cy="%d" r="%s" fill="%s"/>' % (i % 3 + 1, x, y, n(R.choice([1.6, 2, 2.4, 3])), R.choice(['#FFD76A', '#F7B733', '#FFE9A8']))
    F += '</g>'
    B.append(F)
    B.append('<ellipse class="ex09-gr" cx="540" cy="640" rx="330" ry="106" fill="url(#ex09-gnp)"/><ellipse cx="540" cy="624" rx="128" ry="15" fill="#FFE7AE" opacity=".95" filter="url(#ex09-fs)"/>')
    B.append('<use href="#ex09-d2" fill="url(#ex09-gn2)" stroke="url(#ex09-gnk)" stroke-width="2.5"/>')
    B.append('<use href="#ex09-d3" fill="url(#ex09-gn3)" stroke="url(#ex09-gnk)" stroke-width="3"/>')
    B.append('<use href="#ex09-d4" fill="url(#ex09-gn4)" stroke="url(#ex09-gnk)" stroke-width="3"/>')
    B.append('<use href="#ex09-rip" stroke="#15193A" opacity=".3"/>')
    B.append('<use class="ex09-gr" href="#ex09-rd" fill="url(#ex09-gnr)"/>')
    B.append('<use href="#ex09-ftp" fill="#15193A" opacity=".3"/>')
    B.append('<use href="#ex09-pbl" fill="#15193A" opacity=".5"/>')
    B.append(scenery(True))
    B.append('<g fill="#11163A" opacity=".42">%s</g>' % sh)
    B.append('<g id="ex09-camp">%s</g>' % cmp_)
    B.append(foreground(True))
    B.append('</g>')
    S.append(''.join(B))
    S.append('</svg>')
    return '\n'.join(S)


# 중간 거리의 바위·관목 (낮/밤 색만 다름)
MID = [('rk2', 52, 772, .5), ('rk3', 96, 776, .6), ('sb', 262, 792, .42), ('tf', 300, 800, .6), ('rk3', 842, 760, .7), ('sb', 876, 770, .4),
       ('sb', 600, 664, .2), ('sb', 300, 668, .2), ('rk3', 180, 664, .3), ('sb', 760, 668, .22), ('tf', 470, 720, .4), ('sb', 690, 742, .3),
       ('rk3', 560, 742, .35), ('tf', 110, 880, .8), ('sb', 60, 910, .6), ('tf', 840, 900, .8), ('rk2', 800, 930, .5), ('tf', 720, 780, .5),
       ('tf', 250, 700, .35), ('sb', 438, 628, .1), ('sb', 660, 622, .1), ('sb', 220, 618, .11), ('rk3', 730, 626, .2)]
FORE = [('rk1', -30, 1100, 1.1), ('rk2', 110, 1112, 1.0), ('sb', 150, 1062, 1.25), ('tf', 226, 1100, 1.5), ('tf', 40, 1010, 1.2),
        ('rk1', 772, 1128, .95), ('sb', 800, 1050, 1.1), ('rk3', 706, 1120, 1.1), ('tf', 690, 1086, 1.4), ('tf', 880, 1040, 1.2), ('rk3', 300, 1150, .9), ('tf', 560, 1160, 1.3)]


def props(lst, night):
    o = ''
    for (kind, x, y, k) in lst:
        tr = 'translate(%d %d)scale(%s)' % (x, y, sc(k))
        far = 1 - sm(y, 620, 900)
        ln = math.hypot(x - PX, y - PY)
        if kind.startswith('rk'):
            if night:
                o += '<use href="#ex09-%sn" transform="%s" fill="%s" color="%s"/>' % (kind, tr, mix('#222145', '#5A4258', (1 - sm(ln, 60, 520)) * 0.8), mix('#3A3560', '#E0995A', (1 - sm(ln, 60, 560)) * 0.9))
            else:
                o += '<use href="#ex09-%sd" transform="%s" fill="%s"/>' % (kind, tr, mix('#9A6238', '#C9A070', far * 0.75))
        elif kind == 'sb':
            if night:
                o += '<use href="#ex09-sb" transform="%s" fill="%s" color="#15183A"/>' % (tr, mix('#1C2A3E', '#3E3A58', far * 0.7))
            else:
                o += '<use href="#ex09-sb" transform="%s" fill="%s" color="#6E4A2C"/><use href="#ex09-sbh" transform="%s" fill="%s"/>' % (tr, mix('#5F7540', '#A7A873', far * 0.7), tr, mix('#86994F', '#BDBB84', far * 0.7))
        else:
            o += '<use href="#ex09-tf" transform="%s" stroke="%s"/>' % (tr, ('#15183A' if night else mix('#8C8A44', '#B7A765', far * 0.7)))
    return o


def scenery(night):
    return props(MID, night)


def foreground(night):
    return '<g>%s</g>' % props(FORE, night)


if __name__ == '__main__':
    svg = build()
    open(OUT, 'w', encoding='utf-8').write(svg)
    print('bytes', len(svg.encode('utf-8')))
