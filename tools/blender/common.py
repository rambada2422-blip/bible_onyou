# -*- coding: utf-8 -*-
"""
긴 옷을 입은 성경 인물을 Blender(bpy)로 만들어 GLB로 내보낼 때 함께 쓰는 부분.

이 파일은 직접 실행하지 않는다. 인물 스크립트(joshua.py, priest.py)가 불러 쓴다.
    <bpy가 설치된 파이썬> tools/blender/joshua.py      -> web3d/assets/joshua.glb
    <bpy가 설치된 파이썬> tools/blender/priest.py      -> web3d/assets/priest.glb
    (bpy 설치: uv venv --python 3.13 venv && VIRTUAL_ENV=venv uv pip install bpy.  Blender 5.3의 bpy로 확인했다.)

moses.py(기준 예시)의 코드를 옮겨 와 색, 옷, 수염, 머리쓰개, 손, 자세를 매개변수로 바꾼 것이다.
moses.py는 이 파일을 쓰지 않고 그대로 둔다(모세 결과물이 달라지지 않게). 기본값은 모두 모세의 값이다.

새 인물을 만드는 순서 (joshua.py가 가장 짧은 예시)
    1. pal = palette(SKIN='#..', ...)          색. DEFAULT_COLORS에서 바꿀 것만 준다.
    2. p = Person('Name', 키, pal)             키는 미터. 모든 치수는 모세 크기(1.75m)로 쓰고 마지막에 키에 맞춰 늘인다.
    3. p.std_bones(...) 와 p.bone(...)         뼈대. 뼈는 25개까지.
    4. p.build_robe / build_sleeve / build_tunic / build_sash / build_arm / build_hand /
       build_head / build_beard / build_headcloth / build_turban / build_staff      필요한 부분만 고른다.
    5. 자세 함수 fn(t) -> prm(dict). base_prm()에서 시작해 값을 바꾼다. 팔은 방향(UL, FL, UR, FR)으로 주거나
       p.pose_hook(P, prm)에서 ik2 / grip_ik 로 푼다.
    6. run(p, [(클립 이름, 길이, fn), ...], out)

좌표: 게임 좌표(x 왼쪽, y 위, z 앞)로 쓰고 내보낼 때 Blender 좌표(x, -z, y)로 바꾼다. 옷자락 끝 y=0, 정면 +Z.
색: three.js r128의 renderer.outputEncoding 기본값(Linear)에 맞춰 #hex 값을 변환 없이 꼭짓점 색으로 넣는다.
    게임이 sRGB 출력으로 바뀌면 SRGB_OUTPUT = True.
규칙(공통규칙서 3절, 스타일가이드 2절·8절): 하나님이나 천사를 나타내는 것은 만들지 않는다. 옷자락이 땅까지 내려와
    발이 드러나지 않게 한다. 인물당 삼각형 8,000 이하, 뼈 25개 이하, 재질 4개 이하, GLB 500KB 이하(run이 확인한다).
"""
import bpy
import math
import os
import sys
from mathutils import Vector, Matrix, Quaternion
from mathutils.bvhtree import BVHTree

SRGB_OUTPUT = False          # 게임이 renderer.outputEncoding = sRGBEncoding 을 쓰게 되면 True
FPS = 30
MODEL_TOP = 1.7485           # 치수를 쓰는 기준 키(모세의 머리쓰개 꼭대기)

DEG = math.pi / 180.0
X = Vector((1, 0, 0)); Y = Vector((0, 1, 0)); Z = Vector((0, 0, 1))


# ---------------------------------------------------------------------------- 작은 도구
def lerp(a, b, t): return a + (b - a) * t
def clamp(x, a=0.0, b=1.0): return a if x < a else (b if x > b else x)
def sstep(e0, e1, x):
    t = clamp((x - e0) / (e1 - e0))
    return t * t * (3 - 2 * t)
def gauss(d, s): return math.exp(-(d / s) ** 2)
def hsh(i, seed=0.0):
    v = math.sin(i * 127.1 + seed * 311.7 + 0.5) * 43758.5453
    return v - math.floor(v)
def hexc(h):
    h = h.lstrip('#')
    c = tuple(int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))
    if SRGB_OUTPUT:
        c = tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c)
    return c
def mixc(a, b, t): return tuple(lerp(a[i], b[i], t) for i in range(3))
def V(x, y, z): return Vector((x, y, z))

def spline(keys):
    """(x, 값...) 표를 부드럽게 잇는 함수(구간별 3차 Hermite)."""
    xs = [k[0] for k in keys]
    vs = [k[1:] for k in keys]
    n = len(xs)
    def tang(i):
        if i == 0: return [(vs[1][c] - vs[0][c]) / (xs[1] - xs[0]) for c in range(len(vs[0]))]
        if i == n - 1: return [(vs[-1][c] - vs[-2][c]) / (xs[-1] - xs[-2]) for c in range(len(vs[0]))]
        return [(vs[i + 1][c] - vs[i - 1][c]) / (xs[i + 1] - xs[i - 1]) for c in range(len(vs[0]))]
    ts = [tang(i) for i in range(n)]
    def f(x):
        if x <= xs[0]: return tuple(vs[0])
        if x >= xs[-1]: return tuple(vs[-1])
        i = 0
        while x > xs[i + 1]: i += 1
        h = xs[i + 1] - xs[i]; t = (x - xs[i]) / h
        h00 = 2 * t ** 3 - 3 * t ** 2 + 1; h10 = t ** 3 - 2 * t ** 2 + t
        h01 = -2 * t ** 3 + 3 * t ** 2; h11 = t ** 3 - t ** 2
        return tuple(h00 * vs[i][c] + h10 * h * ts[i][c] + h01 * vs[i + 1][c] + h11 * h * ts[i + 1][c] for c in range(len(vs[0])))
    return f

def cr_points(ctrl, n):
    """Catmull-Rom 곡선 위의 점 n+1개."""
    out = []
    m = len(ctrl)
    for s in range(n + 1):
        u = s / n * (m - 1)
        i = min(int(u), m - 2); t = u - i
        p0 = ctrl[max(i - 1, 0)]; p1 = ctrl[i]; p2 = ctrl[i + 1]; p3 = ctrl[min(i + 2, m - 1)]
        out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    return out

def srad(th, a, b, n=2.4):
    """각도 th(앞 +z에서 왼쪽 +x로) 방향의 초타원 반지름."""
    return (abs(math.sin(th) / a) ** n + abs(math.cos(th) / b) ** n) ** (-1.0 / n)


# ---------------------------------------------------------------------------- 색
# 이름은 쓰임이다. 기본값은 모세. 인물 스크립트에서 palette(ROBE='#..', ...)로 바꿀 것만 준다.
DEFAULT_COLORS = dict(
    SKIN='#C48A5E', SKIN_SH='#A56E47', LIP='#B06E55', EYE='#33241C', UNDER='#3E2A1C',
    TUNIC='#EADBB6', STRIPE='#B58A5C',                       # 속 통옷과 그 줄무늬(겉옷이 열린 사이로 보인다)
    ROBE='#9C5438', ROBE_SH='#6A3423', ROBE_HI='#B4683F',    # 몸통 옷(모세의 겉옷, 제사장의 세마포 통옷)과 소매
    BEARD='#F6F1E6', BEARD_SH='#E6DECD', HAIR='#EEE8DA', BROW='#F6F1E6',
    CLOTH='#F3EAD4', CLOTH_SH='#E3D8BC', CLOTH_STRIPE='#B58A5C',   # 머리쓰개
    CORD='#8A4B34', CORD_SH='#6E3826',                       # 머리끈
    BELT='#4F5D7A', BELT_SH='#3F4C66',
    STAFF='#6B4526', STAFF_HI='#7C5330')

class Palette:
    pass

def palette(**over):
    d = dict(DEFAULT_COLORS); d.update(over)
    p = Palette()
    for k, v in d.items(): setattr(p, k, hexc(v))
    return p

MAT_SOLID, MAT_CLOTH = 0, 1


# ---------------------------------------------------------------------------- 치수 (모든 인물이 같다. 키는 마지막에 늘여 맞춘다)
ARM_A = 32 * DEG                       # 기본 자세에서 팔이 수직에서 벌어진 각
UA, FA, HAND = 0.28, 0.25, 0.09
def arm_dir(s): return V(s * math.sin(ARM_A), -math.cos(ARM_A), 0)
def arm_up(s): return V(s * math.cos(ARM_A), math.sin(ARM_A), 0)
def SH(s): return V(s * 0.186, 1.358, 0)
def SD(s): return '.L' if s > 0 else '.R'


# ---------------------------------------------------------------------------- 메쉬 모으기
class Builder:
    def __init__(self):
        self.P = []; self.W = []; self.F = []
    def v(self, p, w):
        self.P.append(Vector(p)); self.W.append(dict(w) if not isinstance(w, str) else {w: 1.0})
        return len(self.P) - 1
    def f(self, idx, col, mat, flip=False):
        ids = []
        for k in idx:
            if k not in ids: ids.append(k)
        if len(ids) < 3: return
        if flip: ids = ids[::-1]
        self.F.append((tuple(ids), col, mat))
    def grid(self, G, col, mat, flip=False, wrap=False, skip=None):
        """G[j][i] 꼭짓점 번호. (i 방향) x (j 방향) 이 바깥을 향하게 놓는다."""
        nr = len(G); nc = len(G[0])
        for j in range(nr - 1):
            for i in range(nc if wrap else nc - 1):
                if skip and skip(j, i): continue
                i2 = (i + 1) % nc
                c = col(j, i) if callable(col) else col
                self.f([G[j][i], G[j][i2], G[j + 1][i2], G[j + 1][i]], c, mat, flip)
    def tris(self): return sum(len(f[0]) - 2 for f in self.F)

def tube(B, pts, rad, n, w, col, mat, cap0=True, cap1=True, up=Z, flip=False, closed=False, squash=(1.0, 1.0), ph0=0.0, round_cap=0.6):
    """점들을 따라가는 관. rad(i) 반지름, w 가중치(dict | 뼈 이름 | 함수(p)), col 색 | 함수(j, k)."""
    m = len(pts); rings = []; e1 = None
    for i, p in enumerate(pts):
        t = (pts[(i + 1) % m] - pts[i - 1]) if closed else (pts[min(i + 1, m - 1)] - pts[max(i - 1, 0)])
        t.normalize()
        e1 = (up if e1 is None else e1)
        e1 = e1 - t * e1.dot(t)
        if e1.length < 1e-6: e1 = X - t * t.x
        e1.normalize()
        e2 = t.cross(e1)
        r = rad(i) if callable(rad) else rad[i]
        ring = []
        for k in range(n):
            ph = 2 * math.pi * k / n + ph0
            q = p + (e1 * (math.cos(ph) * squash[0]) + e2 * (math.sin(ph) * squash[1])) * r
            ring.append(B.v(q, w(q) if callable(w) else w))
        rings.append(ring)
    G = rings + ([rings[0]] if closed else [])
    B.grid(G, col, mat, flip=flip, wrap=True)
    def cap(ring, c, first):
        c = c + (pts[0] - pts[1] if first else pts[-1] - pts[-2]).normalized() * ((rad(0 if first else m - 1) if callable(rad) else rad[0 if first else m - 1]) * round_cap)
        ci = B.v(c, w(c) if callable(w) else w)
        cc = col(0 if first else m - 1, 0) if callable(col) else col
        for k in range(n):
            a, b = ring[k], ring[(k + 1) % n]
            B.f([ci, b, a] if first else [ci, a, b], cc, mat, flip)
    if not closed:
        if cap0: cap(rings[0], pts[0], True)
        if cap1: cap(rings[-1], pts[-1], False)
    return rings

def prune(w, n=4):
    it = sorted(((v, k) for k, v in w.items() if v > 1e-4), reverse=True)[:n]
    s = sum(v for v, k in it)
    return {k: v / s for v, k in it}

def subdivided(verts, faces, levels):
    """Blender의 세분화 표면(Catmull-Clark)을 적용한 결과 (꼭짓점, 면)."""
    me = bpy.data.meshes.new('cage')
    me.from_pydata([Vector(v) for v in verts], [], [list(f) for f in faces])
    me.update()
    ob = bpy.data.objects.new('cage', me)
    bpy.context.scene.collection.objects.link(ob)
    md = ob.modifiers.new('subd', 'SUBSURF'); md.levels = levels; md.render_levels = levels
    dg = bpy.context.evaluated_depsgraph_get()
    ev = ob.evaluated_get(dg); m2 = ev.to_mesh()
    vs = [v.co.copy() for v in m2.vertices]; fs = [tuple(p.vertices) for p in m2.polygons]
    ev.to_mesh_clear()
    bpy.data.objects.remove(ob); bpy.data.meshes.remove(me)
    return vs, fs


# ---------------------------------------------------------------------------- 몸통 옷의 치수표와 가중치
TUNIC_AB = spline([(0.0, 0.252, 0.220), (0.15, 0.242, 0.210), (0.40, 0.230, 0.198), (0.76, 0.212, 0.180), (0.92, 0.202, 0.170),
                   (1.0, 0.190, 0.160), (1.13, 0.192, 0.160), (1.25, 0.194, 0.156), (1.33, 0.178, 0.136), (1.385, 0.130, 0.104), (1.425, 0.076, 0.072)])
# 겉옷(앞이 열린다). 높이 -> (좌우 반지름, 앞뒤 반지름)
CLOAK_AB = spline([(0.11, 0.282, 0.250), (0.40, 0.262, 0.228), (0.76, 0.240, 0.204), (0.92, 0.228, 0.194), (1.04, 0.218, 0.183),
                   (1.13, 0.216, 0.180), (1.20, 0.218, 0.180), (1.25, 0.219, 0.178), (1.30, 0.218, 0.172), (1.345, 0.210, 0.158),
                   (1.385, 0.170, 0.128), (1.428, 0.100, 0.094)])
CLOAK_Y = [0.11, 0.15, 0.27, 0.41, 0.57, 0.74, 0.90, 1.03, 1.13, 1.20, 1.25, 1.30, 1.345, 1.385, 1.428]
THETA_OPEN = spline([(0.11, 34.0), (1.0, 28.0), (1.30, 25.0), (1.385, 30.0), (1.428, 40.0)])
# 통옷 하나만 입는 인물의 옷(앞이 닫히고 땅까지 내려오며 목둘레까지 올라온다). 어깨(1.20 이상)는 겉옷과 같아 소매가 그대로 붙는다.
GOWN_AB = spline([(0.0, 0.262, 0.230), (0.15, 0.253, 0.221), (0.40, 0.240, 0.208), (0.76, 0.222, 0.190), (0.92, 0.208, 0.178),
                  (1.02, 0.197, 0.167), (1.13, 0.204, 0.171), (1.20, 0.213, 0.177), (1.25, 0.217, 0.177), (1.30, 0.217, 0.172),
                  (1.345, 0.210, 0.158), (1.385, 0.170, 0.128), (1.428, 0.100, 0.094), (1.455, 0.068, 0.066)])
GOWN_Y = [0.0, 0.05, 0.20, 0.44, 0.70, 0.90, 1.02, 1.13, 1.20, 1.25, 1.30, 1.345, 1.385, 1.428, 1.455]
GOWN_FRONT = [14.0, 27.0]              # 앞이 닫힌 옷에서 앞 가운데(0도)와 40도 사이에 더 넣는 둘레 각
CL_TH = [None, 40, 49, 58, 66, 74, 82, 90, 98, 106, 114, 122, 129, 136, 143, 150, 157, 164, 172, 180]   # 왼쪽 절반의 둘레 각
HOLE_I0, HOLE_I1 = 3, 11               # 팔 구멍이 차지하는 둘레 칸

def w_body(p):
    """몸통 옷의 가중치: 위는 엉덩이-허리-가슴, 아래는 두 다리(옷 속), 옷자락 끝은 root에 조금."""
    x, y, z = p
    legs = sstep(1.00, 0.74, y) * 0.64
    sL = sstep(-0.08, 0.08, x)
    k = sstep(0.60, 0.34, y)
    up = 1 - legs
    s1 = sstep(0.97, 1.09, y); s2 = sstep(1.15, 1.27, y)
    w = {'hips': up * (1 - s1), 'spine': up * s1 * (1 - s2), 'chest': up * s1 * s2,
         'thigh.L': legs * sL * (1 - k), 'shin.L': legs * sL * k, 'thigh.R': legs * (1 - sL) * (1 - k), 'shin.R': legs * (1 - sL) * k}
    g = sstep(0.32, 0.0, y) * 0.40
    for key in w: w[key] *= (1 - g)
    w['root'] = g
    return w

def w_cloak(p):
    w = w_body(p)
    x, y, z = p
    n = sstep(0.05, 0.15, abs(x)) * sstep(1.20, 1.32, y) * 0.45        # 어깨 위의 천은 어깨뼈를 조금 따른다
    if n > 0:
        for key in w: w[key] *= (1 - n)
        w['shoulder.L' if x > 0 else 'shoulder.R'] = n
    return w

SLEEVE_S = [0.165, 0.21, 0.255, 0.30, 0.345, 0.39, 0.435, 0.475, 0.505]
SLEEVE_S_LIGHT = [0.165, 0.225, 0.285, 0.345, 0.405, 0.465, 0.505]     # 가볍게 만들 때(고리 둘을 줄인다)
SLEEVE_R = spline([(0.165, 0.094), (0.28, 0.087), (0.40, 0.100), (0.505, 0.124)])
NS = 24                                 # 소매 둘레의 꼭짓점 수(팔 구멍 둘레와 같아야 한다)

def w_sleeve(s_, sd):
    f = sstep(0.215, 0.345, s_)                       # 팔꿈치(0.28) 앞뒤로 섞는다
    sl = sstep(0.30, 0.50, s_) * 0.9
    return {'upperarm' + sd: 1 - f, 'forearm' + sd: f * (1 - sl), 'sleeve' + sd: f * sl}

TUNIC_RING_Y = [0.0, 0.05, 0.11, 0.17]
TUNIC_FRONT_Y = [0.17, 0.42, 0.66, 0.86, 0.962, 0.968, 1.040, 1.046, 1.14, 1.25, 1.33, 1.385, 1.425]
def tunic_pt(q, y, off=0.0):
    th = q * 10 * DEG
    a, b = TUNIC_AB(y)
    r = srad(th, a, b) + off
    kq = min(q % 36, 36 - (q % 36))
    r += 0.009 * sstep(0.9, 0.0, y) * (1.0 if kq % 3 == 1 else -0.5)                  # 줄무늬 자리가 살짝 솟는 주름
    return V(r * math.sin(th), y, r * math.cos(th))


# ---------------------------------------------------------------------------- 손
# 손 좌표: cu 손끝 쪽, cw 손바닥 쪽, cg 엄지 쪽. 쥔 막대의 축은 (cu, cw) = FIST_C 를 cg 방향으로 지난다.
FIST_C = (0.060, 0.031)
FIST_RI = 0.0225                         # 쥔 손 안쪽 반지름의 기준(모세의 지팡이 굵기)
def grip_center(r):
    """반지름 r인 막대를 쥘 때 막대 축이 지나는 (cu, cw). 굵은 막대일수록 손바닥에서 멀어진다."""
    return (FIST_C[0], FIST_C[1] + (r - FIST_RI))
def palm_cage():
    """손바닥의 상자 뼈대: 손목 쪽이 좁고 손가락 뿌리 쪽이 넓다. 손등은 가운데가 볼록하다."""
    st = [(-0.008, 0.026, -0.015, 0.014), (0.036, 0.040, -0.0175, 0.011), (0.079, 0.040, -0.0135, 0.007)]   # cu, 반폭, 손등 cw, 손바닥 cw
    verts = []
    for cu, hw, c0, c1 in st:
        verts += [(cu, c0 * 0.55, -hw), (cu, c0 * 1.3, 0.0), (cu, c0 * 0.55, hw), (cu, c1, hw), (cu, c1, 0.0), (cu, c1, -hw)]
    faces = []
    for j in range(len(st) - 1):
        a = j * 6; b = a + 6
        for i in range(6):
            faces.append((a + i, a + (i + 1) % 6, b + (i + 1) % 6, b + i))
    faces.append((5, 4, 1, 0)); faces.append((4, 3, 2, 1))
    faces.append((12, 13, 16, 17)); faces.append((13, 14, 15, 16))
    return verts, faces


# ---------------------------------------------------------------------------- 머리 (얼굴 모양은 모든 인물이 같다)
C = V(0, 1.572, 0.012)                 # 머리 중심
HX, HZ = 0.122, 0.132
def face_base(th, yr):
    if yr >= 0:
        q = math.sqrt(max(0.02, 1 - (yr / 0.160) ** 2)); qx = qz = q
    else:
        t = min(1.0, -yr / 0.145)
        qx = 1 - 0.40 * t ** 2.2
        qz = 1 - 0.10 * t ** 2
        u = sstep(-0.135, -0.165, yr); qx *= (1 - 0.6 * u); qz *= (1 - 0.5 * u)
    return srad(th, HX * qx, HZ * qz, 2.25)

Y_NAS, Y_TIP, Y_NB = 0.022, -0.040, -0.058
def face_feat(x, yr):
    """코, 눈썹뼈, 눈두덩, 광대, 입 둘레의 솟고 꺼진 정도(바깥쪽 +)."""
    ax = abs(x); d = 0.0
    # 코: 미간에서 코끝으로 갈수록 높고 넓다
    if yr > Y_NAS: h = 0.006 * gauss(yr - Y_NAS, 0.016)
    elif yr > Y_TIP: h = 0.006 + 0.030 * ((Y_NAS - yr) / (Y_NAS - Y_TIP)) ** 1.15
    else: h = 0.036 * (1 - sstep(Y_TIP, Y_NB, yr)) ** 1.3
    wn = 0.0110 + 0.0150 * sstep(Y_NAS, Y_TIP, yr)
    d += h * math.exp(-abs(x / wn) ** 2.4)
    d += 0.006 * gauss(x, 0.017) * gauss(yr - (Y_TIP + 0.003), 0.013)                 # 둥근 코끝
    d += 0.011 * gauss(ax - 0.0185, 0.0095) * gauss(yr + 0.046, 0.010)              # 콧방울
    d += 0.0070 * gauss(yr - 0.043, 0.014) * sstep(0.006, 0.028, ax) * (1 - sstep(0.070, 0.100, ax))   # 눈썹뼈
    d -= 0.0065 * gauss(ax - 0.046, 0.022) * gauss(yr - 0.013, 0.015)               # 눈두덩
    d += 0.014 * gauss(ax - 0.062, 0.030) * gauss(yr + 0.034, 0.026)                # 광대
    d += 0.006 * gauss(x, 0.034) * gauss(yr + 0.082, 0.024)                         # 입 둘레
    d -= 0.004 * gauss(ax - 0.030, 0.010) * gauss(yr + 0.062, 0.016)                # 팔자 주름 자리
    return d

def face_r(th, yr):
    r = face_base(th, yr)
    return r + face_feat(r * math.sin(th), yr)
def face_pt(th, yr, off=0.0):
    r = face_r(th, yr) + off
    return C + V(r * math.sin(th), yr, r * math.cos(th))

FACE_TH = [-82, -68, -56, -45, -35, -26, -18, -11.5, -5.5, 0, 5.5, 11.5, 18, 26, 35, 45, 56, 68, 82]
FACE_Y = [0.112, 0.090, 0.066, 0.049, 0.037, 0.025, 0.013, 0.001, -0.013, -0.026, -0.0385, -0.047, -0.056, -0.066, -0.080, -0.096, -0.114, -0.134]

# 수염
YJ = -0.128                            # 턱선(머리 중심 기준 높이). 이 아래로 수염이 늘어진다.
B_TH = [-100, -84, -69, -55, -42, -30, -19.5, -9.5, 0, 9.5, 19.5, 30, 42, 55, 69, 84, 100]
B_BACK = [128, 156, 180, 204, 232]
def beard_T(th): return lerp(0.037, 0.020, sstep(30, 100, abs(th)))
def beard_top(th): return lerp(-0.101, 0.030, sstep(13, 74, abs(th)) ** 0.85)
BEARD_TIP = -0.318                     # 모세의 수염 끝
BEARD_FR = tuple((YJ - y) / (YJ - BEARD_TIP) for y in (-0.160, -0.195, -0.230, -0.262, -0.290, -0.308))
def w_beard(p):
    k = sstep(C.y + YJ + 0.01, C.y + YJ - 0.10, p.y) * 0.9
    return {'head': 1 - k, 'beard': k}

# 머리쓰개
HC_TH = [0, 13, 27, 40, 50, 62, 76, 92, 108, 124, 140, 156, 170]
HC_ANG = HC_TH + [180] + [-t for t in reversed(HC_TH[1:])]
CAP = (HX * 1.14, 0.1765, HZ * 1.13)
def hc_cord_y(th): return 0.066 + 0.016 * math.cos(th * DEG)
def cap_pt(th, al, out=0.0):
    sa = math.sin(al)
    return C + V((CAP[0] + out) * sa * math.sin(th * DEG), CAP[1] * math.cos(al), (CAP[2] + out) * sa * math.cos(th * DEG))
def hc_alpha(th): return math.acos(hc_cord_y(th) / CAP[1])
HC_END_Y = spline([(0, 0.050), (40, 0.050), (50, -0.070), (62, -0.265), (76, -0.215), (92, -0.180), (110, -0.185), (124, -0.235), (140, -0.300), (180, -0.318)])
HC_END_R = spline([(0, 0.0), (40, 0.0), (50, 0.150), (62, 0.176), (76, 0.176), (92, 0.176), (108, 0.180), (124, 0.186), (140, 0.192), (180, 0.196)])


# ---------------------------------------------------------------------------- 자세 도구
def Rx(d): return Quaternion(X, d * DEG)
def Ry(d): return Quaternion(Y, d * DEG)
def Rz(d): return Quaternion(Z, d * DEG)

class Pose:
    """뼈마다 (회전 q, 이동 t)를 기본 자세의 세계 축 기준으로 주면 D(b) = 기본 자세의 점을 옮기는 행렬을 돌려준다."""
    def __init__(self, bones): self.bones = bones; self.loc = {}; self._D = {}
    def set(self, b, q=None, t=None):
        self.loc[b] = (q if q is not None else Quaternion(), t if t is not None else Vector((0, 0, 0)))
        self._D = {}
    def D(self, b):
        if b in self._D: return self._D[b]
        q, t = self.loc.get(b, (Quaternion(), Vector((0, 0, 0))))
        h = self.bones[b]['head']
        M = Matrix.Translation(t + h) @ q.to_matrix().to_4x4() @ Matrix.Translation(-h)
        par = self.bones[b]['parent']
        if par: M = self.D(par) @ M
        self._D[b] = M
        return M
    def set_world_rot(self, b, R3, t=None):
        Rp = self.D(self.bones[b]['parent']).to_3x3()
        self.set(b, (Rp.inverted() @ R3).to_quaternion(), t)

def frame_rot(a0, h0, a1, h1):
    """(a0, h0)을 (a1, h1)로 옮기는 회전. h는 a에 수직이 되게 고친다."""
    def fr(a, h):
        a = a.normalized(); h = (h - a * h.dot(a)).normalized(); c = a.cross(h)
        return Matrix((a, h, c)).transposed()
    return fr(a1, h1) @ fr(a0, h0).transposed()

def set_arm(P, sd, U, F):
    """위팔 방향 U, 팔뚝 방향 F(세계 좌표)로 팔을 놓는다."""
    s = 1 if sd == '.L' else -1
    a = arm_dir(s); h0 = a.cross(Z)
    h1 = U.cross(F)
    if h1.length < 1e-3: h1 = (frame_rot(a, h0, U, h0) @ h0)
    P.set_world_rot('upperarm' + sd, frame_rot(a, h0, U, h1))
    P.set_world_rot('forearm' + sd, frame_rot(a, h0, F, h1))

def ik2(S_, W, pole):
    """어깨 S_에서 손목 W까지 두 뼈(UA, FA)로 닿게 하는 위팔, 팔뚝 방향. pole은 팔꿈치가 향하는 쪽."""
    nv = W - S_
    dist = min(nv.length, UA + FA - 0.004); nv.normalize()
    al = (UA * UA - FA * FA + dist * dist) / (2 * dist); hh = math.sqrt(max(0.0, UA * UA - al * al))
    pl = (pole - nv * pole.dot(nv)).normalized()
    E = S_ + nv * al + pl * hh
    return (E - S_).normalized(), (S_ + nv * dist - E).normalized()

def hand_rest_frame(s):
    """기본 자세에서 손의 세 축: 손끝 쪽 a, 손바닥이 향하는 쪽 w, 엄지 쪽 g."""
    a = arm_dir(s); g = Z.copy(); w = g.cross(a) * (-s)
    return a, w, g

def set_hand_frame(P, sd, u1, g1):
    """손끝이 u1, 엄지 쪽이 g1을 향하게 손을 놓는다(g1은 u1에 수직이 되게 고친다)."""
    s = 1 if sd == '.L' else -1
    a, w0, g0 = hand_rest_frame(s)
    u1 = u1.normalized(); g1 = (g1 - u1 * g1.dot(u1)).normalized(); w1 = g1.cross(u1) * (-s)
    P.set_world_rot('hand' + sd, Matrix((u1, w1, g1)).transposed() @ Matrix((a, w0, g0)))

def grip_ik(P, sd, G, axis, pole, wrist_tilt=0.0, r=FIST_RI):
    """손이 점 G를 지나는 막대(축 방향 axis, 엄지가 그쪽을 향한다. 반지름 r)를 쥐도록 팔을 푼다(2관절 IK).
    r은 build_hand(grip=반지름)에 준 값과 같아야 한다. 손목의 세계 좌표를 돌려준다."""
    s = 1 if sd == '.L' else -1
    up = axis.normalized(); fc = grip_center(r)
    S_ = P.D('shoulder' + sd) @ SH(s)
    F = (G - S_).normalized()
    for it in range(4):
        u1 = (F - up * F.dot(up))
        u1 = u1.normalized() if u1.length > 1e-4 else Z.copy()
        u1 = (u1 + up * wrist_tilt).normalized()                   # 손목이 살짝 꺾인다
        g1 = (up - u1 * up.dot(u1)).normalized()
        w1 = g1.cross(u1) * (-s)
        Wp = G - (u1 * fc[0] + w1 * fc[1])
        U, F = ik2(S_, Wp, pole)
    set_arm(P, sd, U, F)
    set_hand_frame(P, sd, u1, g1)
    return P.D('hand' + sd) @ (SH(s) + arm_dir(s) * (UA + FA))

def set_sleeve(P, sd, sag, slide=0.0):
    """넓은 소매는 팔 아래로 처진다: 팔뚝이 눕는 만큼 소매 끝을 아래로 내린다.
    slide: 팔뚝을 세워 들었을 때 소매가 팔꿈치 쪽으로 흘러내리는 길이."""
    Df = P.D('forearm' + sd); R = Df.to_3x3()
    s = 1 if sd == '.L' else -1
    F = (R @ arm_dir(s)).normalized()
    down = -Y
    dp = down - F * down.dot(F)
    off = dp * sag - F * slide
    ax = F.cross(down)
    qw = Quaternion(ax.normalized(), 14 * DEG * dp.length) if ax.length > 1e-4 else Quaternion()
    Rq = R.to_quaternion()
    P.set('sleeve' + sd, Rq.inverted() @ qw @ Rq, R.inverted() @ off)

def base_prm(**over):
    """자세 값의 기본(곧게 선 자세, 두 팔은 내려뜨린다). 각도는 도, 방향은 세계 좌표."""
    p = dict(hip_yaw=0.0, hip_t=(0, 0, 0), spine=0.0, chest=0.0, chest_yaw=0.0, neck=0.0, head=0.0, head_yaw=0.0, head_roll=0.0,
             beard=0.0, veil=0.0, clavL=0.0, clavR=0.0, clavL_f=0.0, clavR_f=0.0,
             UL=(0.25, -0.96, 0.04), FL=(0.17, -0.93, 0.33), handL=8.0,
             UR=(-0.25, -0.96, 0.04), FR=(-0.17, -0.93, 0.33), handR=8.0,
             sagL=0.03, sagR=0.03, slideL=0.0, slideR=0.0, **{'th.L': 0.0, 'kn.L': 0.0, 'th.R': 0.0, 'kn.R': 0.0})
    p.update(over)
    return p

def blend_prm(a, b, k, ka=None, arm_keys=('UL', 'FL', 'UR', 'FR')):
    """두 자세 값을 섞는다. 팔 방향(arm_keys)은 ka(없으면 k)로 구면 보간한다."""
    ka = k if ka is None else ka
    out = {}
    for key in a:
        if key in arm_keys:
            out[key] = tuple(Vector(a[key]).normalized().slerp(Vector(b[key]).normalized(), ka))
        elif isinstance(a[key], tuple):
            out[key] = tuple(lerp(a[key][i], b[key][i], k) for i in range(len(a[key])))
        else:
            out[key] = lerp(a[key], b[key], k)
    return out


# ---------------------------------------------------------------------------- 인물
class Person:
    def __init__(self, name, height, pal):
        self.name = name; self.height = height; self.c = pal
        self.B = Builder()
        self.BONES = {}; self.ORDER = []
        self.robe_ab = CLOAK_AB
        self.parts = []                  # (부분 이름, 삼각형 수)
        self.pose_hook = None            # 함수(P, prm): 기본 자세를 놓은 뒤, 소매를 놓기 전에 불린다(IK, 덧붙인 뼈)
        self.scale = 1.0

    def _part(self, name, t0): self.parts.append((name, self.B.tris() - t0))

    # ------------------------------------------------------------------ 뼈대 (게임 좌표)
    def bone(self, name, head, tail, parent=None):
        self.BONES[name] = dict(head=Vector(head), tail=Vector(tail), parent=parent)
        self.ORDER.append(name)

    def std_bones(self, veil=True, beard=True):
        """기본 뼈대: root hips spine chest neck head (beard) (veil) + 좌우 shoulder upperarm forearm hand sleeve thigh shin."""
        bone = self.bone
        bone('root', (0, 0, 0), (0, 0.12, 0))
        bone('hips', (0, 0.93, 0), (0, 1.03, 0), 'root')
        bone('spine', (0, 1.03, 0), (0, 1.20, 0), 'hips')
        bone('chest', (0, 1.20, 0), (0, 1.385, 0), 'spine')
        bone('neck', (0, 1.385, 0), (0, 1.455, 0.012), 'chest')
        bone('head', (0, 1.455, 0.012), (0, 1.70, 0.012), 'neck')
        if beard: bone('beard', (0, 1.445, 0.10), (0, 1.27, 0.17), 'head')
        if veil: bone('veil', (0, 1.60, -0.10), (0, 1.32, -0.17), 'head')
        for sd, s in (('.L', 1), ('.R', -1)):
            S_ = SH(s); a_ = arm_dir(s)
            bone('shoulder' + sd, (s * 0.035, 1.375, 0), S_, 'chest')
            bone('upperarm' + sd, S_, S_ + a_ * UA, 'shoulder' + sd)
            bone('forearm' + sd, S_ + a_ * UA, S_ + a_ * (UA + FA), 'upperarm' + sd)
            bone('hand' + sd, S_ + a_ * (UA + FA), S_ + a_ * (UA + FA + HAND), 'forearm' + sd)
            bone('sleeve' + sd, S_ + a_ * (UA + 0.05), S_ + a_ * (UA + 0.22), 'forearm' + sd)
            bone('thigh' + sd, (s * 0.09, 0.90, 0), (s * 0.09, 0.47, 0), 'hips')
            bone('shin' + sd, (s * 0.09, 0.47, 0), (s * 0.09, 0.05, 0), 'thigh' + sd)

    def _hand_L(self, s):
        a = arm_dir(s); wr = SH(s) + a * (UA + FA)
        g = Z; wv = g.cross(a) * (-s)                       # 손바닥이 향하는 쪽(몸 쪽)
        return lambda cu, cw, cg: wr + a * cu + wv * cw + g * cg

    # ------------------------------------------------------------------ 몸통 옷(겉옷 또는 통옷)과 소매
    def build_robe(self, ab=CLOAK_AB, ys=CLOAK_Y, open_front=True, theta_open=THETA_OPEN, front=GOWN_FRONT, fold=0.021, pat=None, trim=None):
        """몸통 옷. open_front=True면 앞이 열린 겉옷(속에 build_tunic), False면 앞이 닫힌 통옷(앞판에 front 각의 선을 더 넣는다).
        ys에는 팔 구멍의 위아래인 1.20과 1.385가 들어 있어야 한다. 격자를 돌려준다(build_sleeve에 넘긴다)."""
        B = self.B; c = self.c; t0 = B.tris()
        pat = pat or [c.ROBE, c.ROBE_HI, c.ROBE, c.ROBE_SH]; trim = trim or c.ROBE_SH
        self.robe_ab = ab; self.robe_y = ys; self.robe_open = open_front
        self.hole_j0, self.hole_j1 = ys.index(1.20), ys.index(1.385)
        TH = ([None] if open_front else [0.0] + list(front)) + CL_TH[1:]     # 왼쪽 절반의 둘레 각(앞 -> 뒤)
        e = len(TH) - len(CL_TH); K = len(TH) - 1          # e: 앞에 더 넣은 선의 수, K: 뒤 가운데(180도)의 번호
        self.robe_e, self.robe_K = e, K
        n = 2 * K + 1 if open_front else 2 * K             # 둘레 선의 수
        hem = ys[0]
        def ck(i): return i if i <= K else 2 * K - i
        def pt(i, y):
            k = ck(i); kk = k - e                          # kk: 겉옷(모세)과 같은 주름 번호
            th = (theta_open(y)[0] if (k == 0 and open_front) else TH[k]) * DEG
            if i > K: th = 2 * math.pi - th
            a, b = ab(y)
            r = srad(th, a, b)
            amp = fold * sstep(1.18, 0.25, y) * (0.65 + 0.6 * hsh((kk + 2) // 4, 3.0))      # 아래로 갈수록 깊어지는 세로 주름
            wave = 0.5 if (k == 0 and open_front) else (-1.0 if kk % 4 in (0, 1) else 0.8)
            r += amp * wave + (0.007 if (k == 0 and open_front) else 0.0)                    # 앞섶은 살짝 말려 나온다
            yy = y - (0.012 * (0.5 - hsh(k, 7.0)) if y < hem + 0.09 else 0.0)                # 옷자락 끝은 고르지 않게
            return V(r * math.sin(th), max(0.0, yy), r * math.cos(th))
        self.robe_pt = pt
        G = [[B.v(pt(i, y), w_cloak(pt(i, y))) for i in range(n)] for y in ys]
        def col(j, i):
            k = i if i < K else 2 * K - 1 - i
            if j == 0 or (k == 0 and open_front): return trim                              # 옷자락과 앞섶의 어두운 단
            return pat[(k - e - 1) % 4]
        j0, j1 = self.hole_j0, self.hole_j1
        i0, i1 = HOLE_I0 + e, HOLE_I1 + e
        def hole(j, i):
            return j0 <= j < j1 and (i0 <= i < i1 or 2 * K - i1 <= i < 2 * K - i0)
        B.grid(G, col, MAT_CLOTH, skip=hole, wrap=not open_front)
        self._part('robe', t0)
        return G

    def hole_loop(self, G, s):
        """팔 구멍 둘레의 꼭짓점 24개. 위 가운데에서 시작해 앞 -> 아래 -> 뒤로 돈다."""
        j0, j1 = self.hole_j0, self.hole_j1
        e, K = self.robe_e, self.robe_K
        I = (lambda i: i + e) if s > 0 else (lambda i: 2 * K - (i + e))
        out = [G[j1][I(i)] for i in (7, 6, 5, 4, 3)]
        out += [G[j][I(3)] for j in range(j1 - 1, j0, -1)]
        out += [G[j0][I(i)] for i in range(3, 12)]
        out += [G[j][I(11)] for j in range(j0 + 1, j1)]
        out += [G[j1][I(i)] for i in (11, 10, 9, 8)]
        return out

    def build_sleeve(self, G, s, ss=SLEEVE_S, rad=SLEEVE_R, pat=None, trim=None, lining=None, lining_follows_sleeve=False):
        """넓은 소매. 몸통 옷의 팔 구멍 둘레와 같은 꼭짓점으로 이어 붙여 어깨에서 소매까지 한 장의 천이 된다."""
        B = self.B; c = self.c; t0 = B.tris()
        pat = pat or [c.ROBE, c.ROBE_HI, c.ROBE, c.ROBE_SH]; trim = trim or c.ROBE_SH; lining = lining or c.ROBE_SH
        sd = SD(s)
        a = arm_dir(s); eu = arm_up(s); S_ = SH(s)
        loop = self.hole_loop(G, s)
        for vi in loop:                                    # 구멍 둘레는 위팔을 조금 따른다
            w = B.W[vi]
            for key in w: w[key] *= 0.78
            w['upperarm' + sd] = 0.22
        s0, s1 = ss[0], ss[-1]
        def ring_pt(k, s_):
            ph = 2 * math.pi * k / NS
            fold = (1.0 if k % 4 in (1, 2) else -1.0) * lerp(0.015, 0.055, sstep(s0, s1, s_)) * (0.6 + 0.8 * hsh(k // 4 + (3 if s > 0 else 11), 5.0))
            r = rad(s_)[0] * (1 + fold)
            if s_ >= s1: r *= 1.03
            return S_ + a * s_ + (eu * math.cos(ph) + Z * math.sin(ph)) * r
        rings = [loop]
        r1 = []
        for k in range(NS):                                # 어깨를 덮는 중간 고리
            ph = 2 * math.pi * k / NS
            p = B.P[loop[k]].lerp(ring_pt(k, s0), 0.5)
            p += (eu * math.cos(ph) + Z * math.sin(ph)) * (0.020 * (0.55 + 0.45 * math.cos(ph)))
            r1.append(B.v(p, {'chest': 0.22, 'shoulder' + sd: 0.26, 'upperarm' + sd: 0.52}))
        rings.append(r1)
        for s_ in ss:
            rings.append([B.v(ring_pt(k, s_), w_sleeve(s_, sd)) for k in range(NS)])
        def col(j, k):
            if j == len(rings) - 2: return trim           # 소매 끝의 어두운 단
            return pat[k % 4]
        B.grid(rings, col, MAT_CLOTH, flip=(s < 0), wrap=True)
        # 소매 끝 안쪽의 어두운 안감(안이 비어 보이지 않게)
        wi = w_sleeve(s1 - 0.06, sd) if lining_follows_sleeve else {'forearm' + sd: 1.0}
        inner = [B.v(S_ + a * (s1 - 0.06) + (eu * math.cos(2 * math.pi * k / NS) + Z * math.sin(2 * math.pi * k / NS)) * 0.046, wi) for k in range(NS)]
        B.grid([inner, rings[-1]], lining, MAT_CLOTH, flip=(s > 0), wrap=True)
        self._part('sleeve' + sd, t0)
        return r1

    # ------------------------------------------------------------------ 속 통옷(겉옷이 열린 사이로 보이는 앞판)과 허리띠
    def build_tunic(self, belt=True, hem_stripe=True):
        B = self.B; c = self.c; t0 = B.tris()
        def qcol(q):
            q %= 36
            return c.STRIPE if min(q, 35 - q) % 3 == 1 else c.TUNIC
        ring = [[B.v(tunic_pt(q, y), w_body(tunic_pt(q, y))) for q in range(36)] for y in TUNIC_RING_Y]
        B.grid(ring, lambda j, i: (c.STRIPE if (j == 0 and hem_stripe) else qcol(i)), MAT_CLOTH, wrap=True)
        qs = list(range(-6, 7))                                                             # 앞판: -60도 ~ +60도
        rows = [[ring[-1][q % 36] for q in qs]]
        for y in TUNIC_FRONT_Y[1:]:
            off = 0.010 if (belt and y in (0.968, 1.040)) else 0.0                          # 허리띠는 살짝 도드라진다
            rows.append([B.v(tunic_pt(q, y, off), w_body(tunic_pt(q, y, off))) for q in qs])
        def col(j, i):
            y0 = TUNIC_FRONT_Y[j]
            if belt and y0 in (0.962, 0.968, 1.040): return c.BELT if y0 == 0.968 else c.BELT_SH
            return qcol(qs[i])
        B.grid(rows, col, MAT_CLOTH)
        if belt:
            # 허리띠 매듭과 늘어진 두 끝자락
            def strip(q0, q1, y0, y1, off, cc):
                g = []
                for t in (0.0, 0.33, 0.66, 1.0):
                    y = lerp(y0, y1, t)
                    g.append([B.v(tunic_pt(q, y, off + 0.004 * math.sin(t * 5)), w_body(tunic_pt(q, y))) for q in (q0, q1)])
                B.grid(g[::-1], cc, MAT_CLOTH)
            strip(1.1, 1.75, 1.0, 0.75, 0.018, c.BELT)
            strip(1.9, 2.5, 1.0, 0.80, 0.024, c.BELT_SH)
            kc = tunic_pt(1.75, 1.004, 0.016)
            kn = V(math.sin(17.5 * DEG), 0, math.cos(17.5 * DEG))
            tube(B, [kc - kn * 0.004 + Y * 0.0, kc + kn * 0.010, kc + kn * 0.019], [0.030, 0.027, 0.014], 6, w_body(kc), c.BELT_SH, MAT_SOLID, cap0=False, squash=(0.95, 1.1))
        self._part('tunic', t0)
        self.build_floor(lambda q: tunic_pt(q * 3, 0.012, -0.012))

    def build_floor(self, rim_pt=None):
        """옷자락 안의 어두운 바닥(옷자락이 들릴 때 안이 비어 보이지 않게). 발은 만들지 않는다."""
        B = self.B; t0 = B.tris()
        if rim_pt is None:
            ab = self.robe_ab
            def rim_pt(q):
                th = q * 30 * DEG; a, b = ab(0.012); r = srad(th, a, b) - 0.030
                return V(r * math.sin(th), 0.012, r * math.cos(th))
        c0 = B.v(V(0, 0.012, 0), 'root')
        rim = [B.v(rim_pt(q), 'root') for q in range(12)]
        for q in range(12):
            B.f([c0, rim[(q + 1) % 12], rim[q]], self.c.UNDER, MAT_SOLID)
        self._part('floor', t0)

    def build_sash(self, y0=0.975, y1=1.050, bands=None, edge=None, off=0.012, n=24, ends=True, knot_th=17.0):
        """통옷 위에 두르는 띠. bands: 아래에서 위로 가는 색 줄. 앞에서 매듭을 짓고 두 끝자락이 늘어진다."""
        B = self.B; c = self.c; t0 = B.tris(); ab = self.robe_ab
        bands = bands or [c.BELT]; edge = edge or c.BELT_SH
        def pt(th, y, o):
            a, b = ab(y); r = srad(th * DEG, a, b) + o
            return V(r * math.sin(th * DEG), y, r * math.cos(th * DEG))
        m = len(bands)
        rows_def = [(y0 - 0.005, 0.002)] + [(lerp(y0, y1, j / m), off) for j in range(m + 1)] + [(y1 + 0.005, 0.002)]
        rows = [[B.v(pt(360.0 * k / n, y, o), w_body(pt(360.0 * k / n, y, o))) for k in range(n)] for y, o in rows_def]
        def col(j, i):
            if j == 0 or j == m + 1: return edge
            return bands[j - 1]
        B.grid(rows, col, MAT_CLOTH, wrap=True)
        if ends:
            ym = 0.5 * (y0 + y1)
            def strip(th0, th1, ya, yb, o, cols):
                g = []; k = len(cols)
                for t in (0.0, 0.33, 0.66, 1.0):
                    y = lerp(ya, yb, t)
                    g.append([B.v(pt(lerp(th0, th1, i / k), y, o + 0.004 * math.sin(t * 5)), w_body(pt(lerp(th0, th1, i / k), y, o))) for i in range(k + 1)])
                B.grid(g[::-1], lambda j, i: cols[i], MAT_CLOTH)
            strip(knot_th - 7.5, knot_th + 0.5, ym, ym - 0.30, off + 0.008, bands)
            strip(knot_th + 1.5, knot_th + 9.0, ym, ym - 0.24, off + 0.014, bands[::-1])
            kc = pt(knot_th, ym, off + 0.004)
            kn = V(math.sin(knot_th * DEG), 0, math.cos(knot_th * DEG))
            tube(B, [kc - kn * 0.004, kc + kn * 0.010, kc + kn * 0.019], [0.032, 0.029, 0.015], 6, w_body(kc), bands[len(bands) // 2], MAT_SOLID, cap0=False, squash=(1.05, 1.1))
        self._part('sash', t0)

    # ------------------------------------------------------------------ 팔뚝과 손
    def build_arm(self, s):
        """팔뚝(살). 소매 안에 있다."""
        B = self.B; t0 = B.tris()
        sd = SD(s)
        a = arm_dir(s)
        g = Z; wv = g.cross(a) * (-s)
        L = self._hand_L(s)
        flip = s > 0
        st = [(-0.21, 0.040, 'forearm'), (-0.10, 0.036, 'forearm'), (-0.012, 0.0285, 'mix'), (0.022, 0.027, 'hand')]
        pts = [L(cu, 0.0, 0) for cu, r, wn in st]
        wl = [{'forearm' + sd: 1.0} if wn == 'forearm' else ({'hand' + sd: 1.0} if wn == 'hand' else {'forearm' + sd: 0.5, 'hand' + sd: 0.5}) for cu, r, wn in st]
        rings = []
        for i, p in enumerate(pts):
            ring = []
            for k in range(8):
                ph = 2 * math.pi * k / 8
                sq = 0.80 if i >= 2 else 1.0                # 손목은 납작하다
                ring.append(B.v(p + (wv * math.cos(ph) * sq + g * math.sin(ph)) * st[i][1], wl[i]))
            rings.append(ring)
        # (wv, g, a) 방향: 왼쪽은 왼손 좌표계라 뒤집는다
        B.grid(rings, self.c.SKIN, MAT_SOLID, flip=flip, wrap=True)
        self._part('arm' + sd, t0)

    def build_hand(self, s, grip=None, finger_n=7):
        """손. 손바닥은 상자 뼈대에 Blender의 세분화 표면을 적용하고 손가락은 관으로 감아 붙인다.
        grip: None이면 느슨하게 말린 손, 반지름을 주면 그 굵기의 막대를 감아쥔 손(grip_ik와 함께 쓴다).
        finger_n: 손가락 하나를 잇는 점의 수(가볍게 만들 때 줄인다)."""
        B = self.B; c = self.c; t0 = B.tris()
        sd = SD(s); L = self._hand_L(s); flip = s > 0
        w = {'hand' + sd: 1.0}
        vs, fs = subdivided(*palm_cage(), levels=1)
        base = len(B.P)
        for v in vs: B.v(L(*v), w)
        for f in fs: B.f([base + i for i in f], c.SKIN, MAT_SOLID, flip=flip)
        ri = grip if grip else 0.017
        fc = grip_center(ri) if grip else FIST_C
        fingers = [(0.030, 0.0100, 316), (0.0100, 0.0104, 324), (-0.0100, 0.0098, 318), (-0.0295, 0.0086, 306)]
        n = finger_n
        frad = spline([(0.0, 1.0), (1 / 6, 1.04), (2 / 6, 1.0), (3 / 6, 0.98), (4 / 6, 0.95), (5 / 6, 0.92), (1.0, 0.80)])
        fr_ = [1.0, 1.04, 1.0, 0.98, 0.95, 0.92, 0.80] if n == 7 else [frad(i / (n - 1))[0] for i in range(n)]
        for cg, rf, bend in fingers:
            if not grip: bend -= 62
            rc = ri + rf * 0.92
            pts = []
            for i in range(n):
                bb = lerp(96, bend, i / (n - 1)) * DEG
                pts.append(L(fc[0] - math.cos(bb) * rc, fc[1] - math.sin(bb) * rc, cg))
            tube(B, pts, lambda i: rf * fr_[i], 5, w, c.SKIN, MAT_SOLID, up=Z, cap0=False)
        # 엄지: 손가락 반대쪽으로 감싼다
        d = (ri - FIST_RI) if grip else 0.0
        tp = [L(0.016, 0.002, 0.030), L(0.020, 0.028 + d, 0.049), L(0.034, 0.053 + d * 2, 0.050), L(0.054, 0.068 + d * 2, 0.040)] if grip else \
             [L(0.016, 0.002, 0.030), L(0.028, 0.022, 0.050), L(0.048, 0.036, 0.050), L(0.070, 0.040, 0.040)]
        tp = cr_points(tp, 5)
        tube(B, tp, lambda i: [0.0130, 0.0135, 0.0128, 0.0118, 0.0105, 0.0080][i], 6, w, c.SKIN, MAT_SOLID, up=Z)
        self._part('hand' + sd, t0)

    # ------------------------------------------------------------------ 머리
    def build_head(self, brow_size=1.0, brow_droop=0.011, brow_arch=0.009, mustache=1.0, side_hair=1.0, back_hair=True, full_hair=False):
        """얼굴(한 장의 곡면), 뒤통수 머리, 목, 점 눈, 눈썹, 콧수염, 옆머리.
        brow_size 눈썹 굵기, brow_droop 눈썹 바깥이 처지는 정도, mustache 콧수염 굵기(0이면 없음), side_hair 옆머리 길이(0이면 없음).
        full_hair: 뒤로 늘어지는 머리쓰개가 없어 뒤통수가 보이는 인물은 True(머리가 목덜미까지 풍성하게 내려와 수염 뒤쪽을 가린다)."""
        B = self.B; c = self.c; t0 = B.tris()
        H = 'head'
        G = [[B.v(face_pt(t * DEG, yr), H) for t in FACE_TH] for yr in FACE_Y]
        def fcol(j, i):
            y = 0.5 * (FACE_Y[j] + FACE_Y[j + 1]); t = 0.5 * (FACE_TH[i] + FACE_TH[i + 1])
            if -0.097 < y < -0.079 and abs(t) < 9: return c.LIP
            return c.SKIN
        B.grid(G, fcol, MAT_SOLID, flip=True)
        # 뒤통수: 머리쓰개 아래의 머리(고개를 숙여 천이 들릴 때 속이 비어 보이지 않게)
        if back_hair:
            bth = [82, 100, 120, 140, 160, 180, 200, 220, 240, 260, 278]
            byr = [0.085, 0.04, -0.01, -0.06, -0.105, -0.150] + ([-0.180] if full_hair else [])
            bg = []
            for yr in byr:
                row = []
                for t in bth:
                    if full_hair:
                        r = srad(t * DEG, HX * 1.12, HZ * 1.05, 2.2) * max(math.sqrt(max(0.05, 1 - (yr / 0.165) ** 2)), 0.92) * (1 - 0.05 * sstep(-0.09, -0.15, yr))
                        if t in (bth[0], bth[-1]): r *= 0.88           # 앞쪽 가장자리는 수염 속으로 넣는다(모서리가 실처럼 보이지 않게)
                    else:
                        r = srad(t * DEG, HX * 1.02, HZ * 1.02, 2.2) * math.sqrt(max(0.05, 1 - (yr / 0.165) ** 2)) * (1 - 0.30 * sstep(-0.06, -0.15, yr))
                    row.append(B.v(C + V(r * math.sin(t * DEG), yr, r * math.cos(t * DEG)), H))
                bg.append(row)
            B.grid(bg, (lambda j, i: c.BEARD if i % 2 == 0 else c.HAIR) if full_hair else c.HAIR, MAT_SOLID, flip=True)
        # 목
        tube(B, [V(0, 1.335, 0.0), V(0, 1.40, 0.004), V(0, 1.47, 0.012)], [0.056, 0.052, 0.052], 8,
             lambda p: {'chest': 1.0} if p.y < 1.36 else ({'neck': 1.0} if p.y < 1.45 else {'head': 0.6, 'neck': 0.4}), c.SKIN_SH, MAT_SOLID, cap0=False, cap1=False, up=Z)
        for s in (1, -1):
            # 눈: 작은 점 눈
            te = s * 20.5 * DEG; ye = 0.0125
            n = V(math.sin(te), 0, math.cos(te)); tx = V(math.cos(te), 0, -math.sin(te))
            ce = face_pt(te, ye, -0.0015)
            c0 = B.v(ce + n * 0.0060, H)
            r1 = [B.v(ce + (tx * math.cos(k * math.pi / 5) * 0.0068 + Y * math.sin(k * math.pi / 5) * 0.0088) + n * 0.0046, H) for k in range(10)]
            r2 = [B.v(ce + (tx * math.cos(k * math.pi / 5) * 0.0108 + Y * math.sin(k * math.pi / 5) * 0.0140), H) for k in range(10)]
            for k in range(10):
                B.f([c0, r1[k], r1[(k + 1) % 10]], c.EYE, MAT_SOLID)
                B.f([r1[k], r2[k], r2[(k + 1) % 10], r1[(k + 1) % 10]], c.EYE, MAT_SOLID)
            # 눈썹
            bp = []
            for u in (0.0, 0.25, 0.5, 0.75, 1.0):
                t = s * lerp(6.5, 37.0, u) * DEG
                yr = 0.047 + brow_arch * math.sin(math.pi * u) - brow_droop * u * u
                bp.append(face_pt(t, yr, 0.0035 * min(1.0, brow_size)))
            tube(B, bp, [r * brow_size for r in (0.0060, 0.0095, 0.0098, 0.0080, 0.0040)], 5, H, c.BROW, MAT_SOLID, up=Y, squash=(1.0, 0.75))
            # 콧수염
            if mustache > 0:
                mp = [face_pt(s * t * DEG, yr, o) for t, yr, o in ((1.5, -0.0615, 0.004), (9, -0.065, 0.010), (18, -0.075, 0.012), (27, -0.094, 0.010), (33, -0.118, 0.008))]
                tube(B, mp, [r * mustache for r in (0.0075, 0.0125, 0.0130, 0.0100, 0.0030)], 6, H, c.BEARD, MAT_SOLID, up=Y, squash=(1.0, 0.8))
            # 옆머리: 머리쓰개 아래로 내려온 머리
            if side_hair > 0:
                k = side_hair
                hp = [face_pt(s * t * DEG, 0.060 + (yr - 0.060) * k, 0.004 + (o - 0.004) * k) for t, yr, o in ((60, 0.060, 0.004), (59, 0.0, 0.008), (58, -0.06, 0.012), (59, -0.115, 0.022), (61, -0.165, 0.034))]
                wv = (lambda p: {'head': 1.0} if p.y > 1.50 else {'head': 0.7, 'veil': 0.3}) if 'veil' in self.BONES else 'head'
                tube(B, hp, [0.008, 0.015, 0.016, 0.013, 0.004], 6, wv, c.HAIR, MAT_SOLID, up=Z, squash=(0.6, 1.0))
        self._part('head', t0)

    def build_beard(self, tip=BEARD_TIP, lean=0.150, fr=BEARD_FR, taper=0.74, thick=1.0, side_lift=0.0, edge_thin=0.0):
        """수염. tip: 수염 끝의 높이(머리 중심 기준. 턱선은 -0.128), lean: 끝이 앞으로 나오는 길이,
        fr: 턱선과 끝 사이에 놓는 고리의 위치(0~1), taper: 끝으로 갈수록 좁아지는 정도, thick: 두께 배율,
        side_lift: 귀 아래와 뒤쪽의 수염을 턱선 쪽으로 끌어올리는 정도(0~1). 뒤로 늘어지는 머리쓰개가 없어
        수염의 옆과 뒤가 보이는 인물에 쓴다(0이면 옆도 앞만큼 길게 늘어진다),
        edge_thin: 귀 쪽 가장자리로 갈수록 수염을 얇게 하는 정도(0~1). 같은 인물에 쓴다(뒤통수 머리 밖으로 수염이 삐져나오지 않게)."""
        B = self.B; c = self.c; t0 = B.tris()
        wb = w_beard if 'beard' in self.BONES else (lambda p: {'head': 1.0})
        def T(th): return beard_T(th) * thick * (1 - edge_thin * sstep(69, 100, abs(th)))
        def lock(i, depth):                                # 가닥의 굴곡
            return 1.0 + (0.20 if i % 2 == 0 else -0.16) * depth
        rows = []
        for jj, (f, tk) in enumerate(((0.0, -0.004), (0.34, 0.72), (0.68, 0.98), (1.0, 1.0))):
            row = []
            for i, t in enumerate(B_TH):
                yt = beard_top(t); yr = lerp(yt, YJ + 0.012 * sstep(45, 100, abs(t)), f)
                th_ = T(t) * tk * lock(i, 0.35 * f) if tk > 0 else beard_T(t) * tk
                p = face_pt(t * DEG, yr, th_) if yr > -0.11 else (C + V(*[(face_base(t * DEG, yr) + th_) * q for q in (math.sin(t * DEG), 0, math.cos(t * DEG))]) + V(0, yr, 0))
                row.append(B.v(p, wb(p)))
            rows.append(row)
        def bcol(j, i): return c.BEARD if i % 2 == 0 else c.BEARD_SH
        B.grid(rows, bcol, MAT_SOLID, flip=True)
        # 턱 아래로 늘어진 부분: 둥글게 닫힌 덩어리가 아래로 갈수록 좁아지며 가슴 앞으로 나온다
        def hang_pt(i, th, yr):
            t = clamp((YJ - yr) / (YJ - tip))
            sc = 1 - taper * t ** 2.1
            cz = lean * t ** 1.1
            if abs(th) <= 100:
                r = (face_base(th * DEG, YJ) + T(th) * lock(i, 0.35 + 0.65 * t)) * sc
            else:
                r = lerp(face_base(100 * DEG, YJ) + 0.020 * thick * (1 - edge_thin), 0.050, sstep(100, 150, abs(th) if abs(th) <= 180 else 360 - abs(th))) * sc
            if side_lift > 0: yr += (YJ + 0.012 - yr) * side_lift * sstep(50, 100, min(abs(th), 100))
            return C + V(r * math.sin(th * DEG), yr, r * math.cos(th * DEG) + cz)
        ths = B_TH + B_BACK
        rings = [rows[-1] + [B.v(hang_pt(0, t, YJ + 0.012), 'head') for t in B_BACK]]
        for f in fr:
            yr = lerp(YJ, tip, f)
            rings.append([B.v(hang_pt(i, t, yr), wb(hang_pt(i, t, yr))) for i, t in enumerate(ths)])
        B.grid(rings, lambda j, i: (c.BEARD if i % 2 == 0 else c.BEARD_SH) if i < 16 else c.BEARD_SH, MAT_SOLID, flip=True, wrap=True)
        tp = hang_pt(0, 0, tip) + V(0, 0, 0.004)
        ti = B.v(tp, wb(tp))
        n = len(ths)
        for i in range(n):
            B.f([rings[-1][i], rings[-1][(i + 1) % n], ti], c.BEARD if i % 2 == 0 else c.BEARD_SH, MAT_SOLID, flip=True)
        self._part('beard', t0)

    def on_body(self, p, gap=0.013):
        """늘어진 천이 몸통 옷 속으로 들어가지 않게 몸 바깥으로 밀어낸다."""
        if p.y > 1.428: return p
        a, b = self.robe_ab(max(p.y, 1.13))
        th = math.atan2(p.x, p.z); rb = math.hypot(p.x, p.z)
        rmin = srad(th, a + gap, b + gap)
        if rb < rmin: return V(p.x * rmin / rb, p.y, p.z * rmin / rb)
        return p

    def build_headcloth(self, drop=1.0, stripe=True, cord=True):
        """머리쓰개(머리를 덮고 어깨와 등으로 늘어지는 천)와 머리끈. drop: 늘어지는 길이의 배율(1 = 모세)."""
        B = self.B; c = self.c; t0 = B.tris()
        veil = 'veil' in self.BONES
        def end_y(at):
            y = HC_END_Y(at)[0]
            return y if at <= 40 else lerp(0.050, y, drop) if at < 50 else y * drop
        def w_h(v, th):
            if abs(th) <= 40 or not veil: return {'head': 1.0}
            k = clamp(v) ** 1.2 * (0.9 if abs(th) >= 62 else 0.5)
            return {'head': 1 - k, 'veil': k}
        top = B.v(C + V(0, CAP[1], 0), 'head')
        rows = [[top] * len(HC_ANG)]
        for f in (0.26, 0.52, 0.77, 1.0):
            rows.append([B.v(cap_pt(t, hc_alpha(t) * f), 'head') for t in HC_ANG])
        VS = (0.20, 0.42, 0.64, 0.84, 0.93, 1.0)
        for v in VS:
            row = []
            for i, t in enumerate(HC_ANG):
                at = abs(t)
                pc = cap_pt(t, hc_alpha(t)); rc = math.hypot(pc.x, pc.z - C.z); yc = pc.y - C.y
                if at <= 40:                                   # 이마 위: 도톰하게 말린 단
                    y = lerp(yc, end_y(at), v); r = rc + 0.007 * math.sin(math.pi * min(1.0, v * 1.1)) - 0.004 * sstep(0.86, 1.0, v)
                else:
                    y = lerp(yc, end_y(at), v)
                    r = lerp(rc, HC_END_R(at)[0], v ** 0.62)
                    if at >= 62: r += 0.0075 * v * (1.0 if i % 2 == 0 else -1.0)      # 늘어진 천의 주름
                p = C + V(r * math.sin(t * DEG), y, r * math.cos(t * DEG))
                if at > 40: p = self.on_body(p)
                row.append(B.v(p, w_h(v, t)))
            rows.append(row)
        def col(j, i):
            t = 0.5 * (abs(HC_ANG[i]) + abs(HC_ANG[(i + 1) % len(HC_ANG)]))
            if stripe and j == 8 and t > 56: return c.CLOTH_STRIPE     # 끝자락 가까이의 줄
            if j >= 5 and t > 56 and i % 2 == 1: return c.CLOTH_SH
            return c.CLOTH
        B.grid(rows, col, MAT_CLOTH, flip=True, wrap=True)
        if cord:                                               # 머리끈
            n = 22
            pts = [cap_pt(360.0 * k / n, hc_alpha(360.0 * k / n) + 0.02, 0.009) for k in range(n)]
            tube(B, pts, lambda i: 0.0115, 5, 'head', lambda j, k: c.CORD if j % 2 == 0 else c.CORD_SH, MAT_SOLID, closed=True, up=Y, squash=(1.25, 1.0))
        self._part('headcloth', t0)

    def build_turban(self, n=16, roll=0.021, lift=0.012):
        """감아 올린 두건(어깨로 늘어지는 천이 없다): 둥근 덮개와, 이마 둘레로 감은 두 줄의 천."""
        B = self.B; c = self.c; t0 = B.tris()
        def ry(th): return 0.060 + 0.014 * math.cos(th * DEG)             # 아래 줄의 높이(뒤가 조금 낮다)
        def al(yr): return math.acos(clamp(yr / CAP[1], -1.0, 1.0))
        angs = [360.0 * k / n for k in range(n)]
        top = B.v(C + V(0, CAP[1] + lift, -0.006), 'head')
        rows = [[top] * n]
        for f in (0.34, 0.66, 1.0):
            row = []
            for t in angs:
                p = cap_pt(t, al(ry(t) + 0.004) * f, 0.004)
                p.y += lift * (1 - f) ** 0.7
                row.append(B.v(p, 'head'))
            rows.append(row)
        B.grid(rows, lambda j, i: mixc(c.CLOTH, c.CLOTH_SH, 0.6) if (i + j) % 4 == 0 else c.CLOTH, MAT_CLOTH, flip=True, wrap=True)   # 비스듬히 감긴 결
        lo = [cap_pt(t, al(ry(t)), 0.003) for t in angs]
        tube(B, lo, lambda i: roll, 5, 'head', lambda j, k: c.CLOTH_SH if j % 4 == 3 else c.CLOTH, MAT_CLOTH, closed=True, up=Y, squash=(1.2, 0.95), ph0=0.3)
        hi = [cap_pt(t, al(ry(t) + 0.036 + 0.012 * math.sin((t + 40) * DEG)), 0.006) for t in angs]
        tube(B, hi, lambda i: roll * 0.86, 5, 'head', lambda j, k: c.CLOTH_SH if j % 4 == 1 else c.CLOTH, MAT_CLOTH, closed=True, up=Y, squash=(1.15, 0.9), ph0=0.3)
        self._part('turban', t0)

    def build_staff(self, base, bone='staff', crook=True):
        """목자의 지팡이. bone: 지팡이가 따르는 뼈(self.bone(...)으로 먼저 만든다. 머리가 base)."""
        B = self.B; c = self.c; t0 = B.tris()
        ctrl = [V(0, 0, 0), V(0.004, 0.4, 0.003), V(-0.004, 0.8, -0.003), V(0.003, 1.2, 0.003), V(0, 1.5, 0)]
        ck = cr_points([V(0, 1.6, 0), V(0, 1.72, 0.012), V(0, 1.81, 0.06), V(0, 1.838, 0.13), V(0, 1.795, 0.195), V(0, 1.715, 0.205)], 9) if crook else [V(0, 1.6, 0), V(0, 1.7, 0)]
        pts = ctrl + ck
        m = len(pts)
        tube(B, [base + p for p in pts], lambda i: lerp(0.0225, 0.0160, i / (m - 1)) * (1.08 if i in (2, 5) else 1.0), 6, bone,
             lambda j, k: c.STAFF_HI if (k + j // 2) % 3 == 0 else c.STAFF, MAT_SOLID, up=X, round_cap=0.0)
        self._part('staff', t0)

    # ------------------------------------------------------------------ 자세
    def apply(self, prm):
        """자세 값(base_prm 참고)으로 모든 뼈를 놓는다."""
        P = Pose(self.BONES)
        P.set('hips', Ry(prm['hip_yaw']), Vector(prm['hip_t']))
        P.set('spine', Rx(prm['spine']))
        P.set('chest', Ry(prm['chest_yaw']) @ Rx(prm['chest']))
        P.set('neck', Rx(prm['neck']))
        P.set('head', Ry(prm['head_yaw']) @ Rx(prm['head']) @ Rz(prm['head_roll']))
        if 'beard' in self.BONES: P.set('beard', Rx(prm['beard']))
        if 'veil' in self.BONES: P.set('veil', Rx(prm['veil']))
        P.set('shoulder.L', Rz(prm['clavL']) @ Ry(-prm['clavL_f']))
        P.set('shoulder.R', Rz(-prm['clavR']) @ Ry(prm['clavR_f']))
        for sd, s in (('.L', 1), ('.R', -1)):
            P.set('thigh' + sd, Rx(-prm['th' + sd]))
            P.set('shin' + sd, Rx(prm['kn' + sd]))
            k = sd[1]
            set_arm(P, sd, Vector(prm['U' + k]).normalized(), Vector(prm['F' + k]).normalized())
            P.set('hand' + sd, Quaternion(arm_dir(s).cross(Z).normalized(), prm['hand' + k] * DEG))
        if self.pose_hook: self.pose_hook(P, prm)
        set_sleeve(P, '.L', prm['sagL'], prm['slideL'])
        set_sleeve(P, '.R', prm['sagR'], prm['slideR'])
        return P

    def skinned(self, P):
        """자세 P에서 꼭짓점의 자리(게임 좌표, 모세 크기). 확인과 측정에 쓴다."""
        if not hasattr(self, '_W'): self._W = [prune(w) for w in self.B.W]
        D = {n: P.D(n) for n in self.ORDER}
        out = []
        for i, p in enumerate(self.B.P):
            q = Vector((0, 0, 0))
            for k, w in self._W[i].items(): q += (D[k] @ p) * w
            out.append(q)
        return out

    def check_skin(self, clips):
        """모든 클립의 모든 프레임에서 모서리가 얼마나 늘어나는지, 땅 아래로 내려가는 꼭짓점이 있는지 본다."""
        B = self.B
        edges = set()
        for idx, col, mat in B.F:
            for i in range(len(idx)):
                a, b = idx[i], idx[(i + 1) % len(idx)]
                edges.add((min(a, b), max(a, b)))
        edges = [(a, b, (B.P[a] - B.P[b]).length) for a, b in edges if (B.P[a] - B.P[b]).length > 1e-5]
        for name, dur, fn in clips:
            worst = (0, None); miny = 9; grow = (0, None)
            for f in range(int(round(dur * FPS)) + 1):
                pos = self.skinned(self.apply(fn(f / FPS)))
                miny = min(miny, min(q.y for q in pos))
                for a, b, l0 in edges:
                    l = (pos[a] - pos[b]).length
                    if l / l0 > worst[0]: worst = (l / l0, (f, tuple(round(v, 3) for v in B.P[a])))
                    if l - l0 > grow[0]: grow = (l - l0, (f, tuple(round(v, 3) for v in B.P[a])))
            print('%s check %s: max stretch x%.2f %s | max growth %.3fm %s | minY %.4f' % (self.name.upper(), name, worst[0], worst[1], grow[0], grow[1], miny * self.scale))

    # ------------------------------------------------------------------ 그늘 굽기, Blender 물체, 동작, 내보내기
    def bake_ao(self, strength=0.55, maxd=0.22):
        """꼭짓점마다 반구 방향으로 광선을 쏘아 가려진 정도를 구한다(땅도 넣는다)."""
        B = self.B
        verts = [tuple(p) for p in B.P]
        polys = [list(f[0]) for f in B.F]
        nv = len(verts)
        g0 = len(verts)
        verts += [(-3, 0, -3), (3, 0, -3), (3, 0, 3), (-3, 0, 3)]
        polys.append([g0, g0 + 1, g0 + 2, g0 + 3])
        bvh = BVHTree.FromPolygons(verts, polys)
        nrm = [Vector((0, 0, 0)) for _ in range(nv)]
        for idx, col, mat in B.F:
            p = [B.P[i] for i in idx]
            n = Vector((0, 0, 0))
            for i in range(1, len(p) - 1): n += (p[i] - p[0]).cross(p[i + 1] - p[0])
            for i in idx: nrm[i] += n
        dirs = []
        K = 40
        for i in range(K):                                    # 고정된 반구 방향(코사인 분포)
            u = (i + 0.5) / K; ph = i * 2.399963
            r = math.sqrt(u); dirs.append((r * math.cos(ph), r * math.sin(ph), math.sqrt(1 - u)))
        ao = []
        for i in range(nv):
            n = nrm[i]
            if n.length < 1e-12: ao.append(1.0); continue
            n = n.normalized()
            t = n.cross(Y if abs(n.y) < 0.9 else X).normalized(); b = n.cross(t)
            o = B.P[i] + n * 0.006
            occ = 0.0
            for dx, dy, dz in dirs:
                d = t * dx + b * dy + n * dz
                hit = bvh.ray_cast(o, d, maxd)
                if hit[0] is not None: occ += 1 - hit[3] / maxd
            ao.append(1 - strength * (occ / K))
        return ao

    def make_objects(self):
        B = self.B; c = self.c; nm_ = self.name
        scene = bpy.context.scene
        for o in list(bpy.data.objects): bpy.data.objects.remove(o)
        scene.render.fps = FPS
        ys = [p.y for p in B.P]
        self.scale = S = self.height / max(ys)               # 키에 맞춰 늘인다
        def BL(p): return Vector((p[0], -p[2], p[1])) * S    # 게임 좌표 -> Blender 좌표
        arm = bpy.data.armatures.new(nm_ + 'Rig')
        aob = bpy.data.objects.new(nm_, arm)
        scene.collection.objects.link(aob)
        bpy.context.view_layer.objects.active = aob
        bpy.ops.object.mode_set(mode='EDIT')
        for name in self.ORDER:
            b = self.BONES[name]
            eb = arm.edit_bones.new(name)
            eb.head = BL(b['head']); eb.tail = BL(b['tail']); eb.roll = 0.0
            if b['parent']: eb.parent = arm.edit_bones[b['parent']]
            eb.use_connect = False
        bpy.ops.object.mode_set(mode='OBJECT')
        ao = self.bake_ao()
        me = bpy.data.meshes.new(nm_ + 'Mesh')
        me.from_pydata([BL(p) for p in B.P], [], [list(f[0]) for f in B.F])
        me.update()
        for nm, rough, cull in ((nm_ + 'Solid', 0.82, True), (nm_ + 'Cloth', 0.92, False)):
            m = bpy.data.materials.new(nm)
            if m.node_tree is None or m.node_tree.nodes.get('Principled BSDF') is None: m.use_nodes = True
            bsdf = m.node_tree.nodes.get('Principled BSDF')
            bsdf.inputs['Base Color'].default_value = (1, 1, 1, 1)
            bsdf.inputs['Roughness'].default_value = rough
            bsdf.inputs['Metallic'].default_value = 0.0
            m.use_backface_culling = cull
            me.materials.append(m)
        ca = me.color_attributes.new(name='Color', type='FLOAT_COLOR', domain='CORNER')
        li = 0
        for pi, poly in enumerate(me.polygons):
            idx, col, mat = B.F[pi]
            poly.material_index = mat
            poly.use_smooth = True
            for vi in poly.vertices:
                a = ao[vi]
                if col in (c.SKIN, c.LIP): a = lerp(1.0, a, 0.6)                                              # 살은 그늘을 약하게
                ca.data[li].color = (col[0] * lerp(1, a, 0.90), col[1] * lerp(1, a, 0.96), col[2] * a, 1.0)   # 그늘은 살짝 따뜻하게
                li += 1
        me.color_attributes.active_color = ca
        me.color_attributes.render_color_index = 0
        mob = bpy.data.objects.new(nm_ + 'Body', me)
        scene.collection.objects.link(mob)
        groups = {name: mob.vertex_groups.new(name=name) for name in self.ORDER}
        for vi, w in enumerate(B.W):
            for k, v in prune(w).items():
                groups[k].add([vi], v, 'REPLACE')
        mob.parent = aob
        md = mob.modifiers.new('Armature', 'ARMATURE'); md.object = aob
        return aob, mob

    def animate(self, aob, clips):
        S = self.scale
        Cm = Matrix(((S, 0, 0, 0), (0, 0, -S, 0), (0, S, 0, 0), (0, 0, 0, 1)))     # 게임 -> Blender (키에 맞춘 배율 포함)
        Ci = Cm.inverted()
        ORDER = self.ORDER; BONES = self.BONES
        rest = {n: aob.data.bones[n].matrix_local.copy() for n in ORDER}
        aob.animation_data_create()
        for pb in aob.pose.bones: pb.rotation_mode = 'QUATERNION'
        acts = []
        for name, dur, fn in clips:
            nfr = int(round(dur * FPS))
            frames = []
            for f in range(nfr + 1):
                P = self.apply(fn(f / FPS))
                fr = {}
                for n in ORDER:
                    Mb = Cm @ P.D(n) @ Ci @ rest[n]
                    par = BONES[n]['parent']
                    if par:
                        Mp = Cm @ P.D(par) @ Ci @ rest[par]
                        Lm = rest[n].inverted() @ rest[par] @ Mp.inverted() @ Mb
                    else:
                        Lm = rest[n].inverted() @ Mb
                    loc, q, sc = Lm.decompose()
                    fr[n] = (loc, q)
                frames.append(fr)
            locb = [n for n in ORDER if any(fr[n][0].length > 1e-6 for fr in frames)]      # 자리를 옮기는 뼈만 이동 키를 넣는다
            act = bpy.data.actions.new(name)
            aob.animation_data.action = act
            prev = {}
            for f, fr in enumerate(frames):
                for n in ORDER:
                    loc, q = fr[n]
                    if n in prev and prev[n].dot(q) < 0: q.negate()
                    prev[n] = q.copy()
                    pb = aob.pose.bones[n]
                    pb.rotation_quaternion = q
                    pb.keyframe_insert('rotation_quaternion', frame=f)
                    if n in locb:
                        pb.location = loc
                        pb.keyframe_insert('location', frame=f)
            for pb in aob.pose.bones:
                pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
            acts.append(act)
        # 클립마다 NLA 트랙에 올린다(내보낼 때 클립 하나씩 나간다)
        ad = aob.animation_data
        ad.action = None
        for act in acts:
            tr = ad.nla_tracks.new(); tr.name = act.name
            st = tr.strips.new(act.name, 0, act)
            try:
                if getattr(st, 'action_slot', None) is None and len(act.slots): st.action_slot = act.slots[0]
            except Exception as e:
                print('slot', e)
        for pb in aob.pose.bones:
            pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
        return acts


def export_glb(out):
    os.makedirs(os.path.dirname(out), exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    bpy.ops.export_scene.gltf(
        filepath=out, export_format='GLB', export_yup=True, export_apply=False,
        export_texcoords=False, export_normals=True, export_tangents=False,
        export_materials='EXPORT', export_vertex_color='ACTIVE', export_all_vertex_colors=False,
        export_active_vertex_color_when_no_material=True,
        export_cameras=False, export_lights=False, export_extras=False,
        export_skins=True, export_influence_nb=4, export_all_influences=False, export_def_bones=False,
        export_animations=True, export_animation_mode='ACTIONS', export_nla_strips=True,
        export_force_sampling=True, export_frame_step=1, export_optimize_animation_size=True,
        export_optimize_animation_keep_anim_armature=False, export_anim_slide_to_zero=True,
        export_reset_pose_bones=True, export_rest_position_armature=True,
        export_morph=False, export_shared_accessors=True)


def out_path(default_name):
    """--out 경로가 있으면 그 경로, 없으면 web3d/assets/<default_name>."""
    here = os.path.dirname(os.path.abspath(__file__))
    out = os.path.normpath(os.path.join(here, '..', '..', 'web3d', 'assets', default_name))
    if '--out' in sys.argv: out = sys.argv[sys.argv.index('--out') + 1]
    return out


def run(person, clips, out, max_tris=8000):
    """물체를 만들고 클립을 넣어 GLB로 내보낸 뒤 예산을 확인한다. '--check'를 주면 스킨이 늘어나는 정도도 찍는다."""
    p = person; B = p.B; tag = p.name.upper()
    aob, mob = p.make_objects()
    p.animate(aob, clips)
    export_glb(out)
    ys = [q.y * p.scale for q in B.P]
    size = os.path.getsize(out)
    print('%s parts: %s' % (tag, ', '.join('%s %d' % (n, t) for n, t in p.parts)))
    print('%s verts(before split)=%d tris=%d bones=%d materials=%d scale=%.4f minY=%.3f maxY=%.3f' % (tag, len(B.P), B.tris(), len(p.ORDER), len(mob.data.materials), p.scale, min(ys), max(ys)))
    print('%s clips: %s' % (tag, ', '.join('%s %.2fs' % (n, d) for n, d, f in clips)))
    print('%s wrote %s (%d bytes)' % (tag, out, size))
    if '--check' in sys.argv: p.check_skin(clips)
    bad = []
    if B.tris() > max_tris: bad.append('삼각형 %d > %d' % (B.tris(), max_tris))
    if len(p.ORDER) > 25: bad.append('뼈 %d > 25' % len(p.ORDER))
    if size > 500 * 1024: bad.append('GLB %d바이트 > 500KB' % size)
    if min(ys) < -1e-6: bad.append('기본 자세에서 땅 아래로 내려간 꼭짓점 %.4f' % min(ys))
    if bad: print('%s 예산 초과: %s' % (tag, '; '.join(bad)))
    return aob, mob
