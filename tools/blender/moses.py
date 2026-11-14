# -*- coding: utf-8 -*-
"""
모세(출 3:1-6, 팔십 세의 목자)를 Blender로 처음부터 만들어 GLB로 내보낸다.

실행 방법 (저장소 루트에서):
    <bpy가 설치된 파이썬> tools/blender/moses.py
    -> web3d/assets/old/moses_v1.glb 를 새로 쓴다(2026-11-14부터 게임의 기본 모세는 moses_b2_rig.py가 만든다). 다른 곳에 쓰려면: ... moses.py --out /경로/moses.glb
    ("MeshOptimizer is not available", "Draco is not available" 경고는 무시해도 된다. 둘 다 쓰지 않는다.)

bpy 설치 방법 (Blender 화면 없이 파이썬 모듈로만 쓴다):
    uv venv --python 3.13 venv && VIRTUAL_ENV=venv uv pip install bpy
    venv/bin/python tools/blender/moses.py
    (Blender 5.3의 bpy로 만들고 확인했다.)

다시 실행하면 같은 결과가 나온다(난수는 모두 고정된 해시 함수).

결과물
    - 단위 미터, 옷자락 끝이 y=0, 정면이 +Z (glTF 기준), 키 1.75m
    - 뼈대 1개(뼈 23개) + 스킨 메쉬 1개(재질 2개: MosesSolid, MosesCloth[양면])
    - 색은 꼭짓점 색(COLOR_0)으로만 넣는다. 텍스처 없음.
      three.js r128에서 renderer.outputEncoding 기본값(Linear)일 때 지금 게임의 색과 같게 보이도록
      #hex 값을 변환 없이 그대로 넣었다. (sRGB 출력으로 바꾸면 색을 선형으로 바꿔 넣어야 한다: SRGB_OUTPUT)
    - 애니메이션 클립: Idle(3.0s 반복), Walk(1.2s 반복, 제자리), HideFace(0.8s, 끝 자세에서 멈춤)
      게임에서는 항상 Idle을 틀어 둔다(뼈대의 기본 자세는 팔을 벌린 A자세다).

신학 규칙(공통규칙서 3절, 스타일가이드 2절, 장면목록 EX-01)
    - 이 파일에는 모세만 있다. 하나님이나 천사를 나타내는 것은 만들지 않는다.
    - 옷자락이 땅까지 내려와 발이 드러나지 않는다. 맨발도, 신도, 벗어 놓은 신도 만들지 않는다.
    - HideFace는 선 채로 얼굴을 가리는 동작이다(3:6). 무릎을 꿇지 않는다.

만드는 방법 요약
    1. 몸의 각 부분을 매개변수 곡면(둘레 x 높이 격자)으로 만든다. 좌표는 게임 좌표(x, y 위, z 앞)로 쓰고
       마지막에 Blender 좌표(x, -z, y)로 바꾼다. 얼굴은 한 장의 곡면에 코, 눈썹뼈, 광대를 솟게 한다.
    2. 겉옷 몸통에 팔 구멍을 내고 소매를 같은 꼭짓점으로 이어 붙여 어깨에서 소매까지 한 장의 천으로 만든다.
    3. 손바닥은 상자 뼈대(cage)에 Blender의 세분화 표면(Catmull-Clark)을 적용하고, 손가락은 관으로 감아 붙인다.
    4. 꼭짓점마다 뼈 가중치를 위치의 함수로 준다(관절 앞뒤로 부드럽게 섞는다. 꼭짓점마다 뼈 4개까지).
    5. 광선(mathutils BVH)으로 주변 가림(AO)을 계산해 꼭짓점 색에 곱한다(수염 아래, 옷 주름 골, 소매 안이 어두워진다).
    6. 자세를 함수로 계산해(오른팔은 지팡이를 쥐도록, HideFace의 왼팔은 이마 앞에 닿도록 2관절 IK)
       프레임마다 키를 넣고 GLB로 내보낸다.

고칠 때 알아 둘 것
    - 색, 치수, 자세 값은 모두 이 파일의 숫자다. 고친 뒤 다시 실행하면 GLB가 새로 나온다.
    - 뼈 이름: root hips spine chest neck head beard veil shoulder/upperarm/forearm/hand/sleeve(.L .R)
      thigh/shin(.L .R) staff. sleeve는 넓은 소매가 처지는 것, veil은 머리쓰개 자락, beard는 수염이 따로 움직이게 한다.
    - three.js r128에서는 SkinnedMesh 2개(재질별)가 한 뼈대를 함께 쓴다. frustumCulled = false 를 권한다.
"""
import bpy
import math
import os
import sys
from mathutils import Vector, Matrix, Quaternion
from mathutils.bvhtree import BVHTree

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'web3d', 'assets', 'old', 'moses_v1.glb'))
if '--out' in sys.argv:
    OUT = sys.argv[sys.argv.index('--out') + 1]
SRGB_OUTPUT = False          # 게임이 renderer.outputEncoding = sRGBEncoding 을 쓰게 되면 True
FPS = 30

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


# ---------------------------------------------------------------------------- 색 (지금 모델과 같은 계열)
SKIN = hexc('#C48A5E'); SKIN_SH = hexc('#A56E47'); LIP = hexc('#B06E55')
TUNIC = hexc('#EADBB6'); STRIPE = hexc('#B58A5C')
CLOAK = hexc('#9C5438'); CLOAK_SH = hexc('#6A3423'); CLOAK_HI = hexc('#B4683F')
BEARD = hexc('#F6F1E6'); BEARD_SH = hexc('#E6DECD'); HAIR = hexc('#EEE8DA')
CLOTH = hexc('#F3EAD4'); CLOTH_SH = hexc('#E3D8BC'); CORD = hexc('#8A4B34'); CORD_SH = hexc('#6E3826')
BELT = hexc('#4F5D7A'); BELT_SH = hexc('#3F4C66')
STAFF = hexc('#6B4526'); STAFF_HI = hexc('#7C5330'); EYE = hexc('#33241C'); UNDER = hexc('#3E2A1C')
MAT_SOLID, MAT_CLOTH = 0, 1


# ---------------------------------------------------------------------------- 뼈대 (게임 좌표)
ARM_A = 32 * DEG                       # 기본 자세에서 팔이 수직에서 벌어진 각
UA, FA, HAND = 0.28, 0.25, 0.09
def arm_dir(s): return V(s * math.sin(ARM_A), -math.cos(ARM_A), 0)
def arm_up(s): return V(s * math.cos(ARM_A), math.sin(ARM_A), 0)
def SH(s): return V(s * 0.186, 1.358, 0)
STAFF_B0 = V(-0.34, 0, 0.31)           # 지팡이 밑동의 기본 자리
GRIP = 1.13                            # 지팡이를 쥐는 높이

BONES = {}
ORDER = []
def bone(name, head, tail, parent=None):
    BONES[name] = dict(head=Vector(head), tail=Vector(tail), parent=parent)
    ORDER.append(name)

bone('root', (0, 0, 0), (0, 0.12, 0))
bone('hips', (0, 0.93, 0), (0, 1.03, 0), 'root')
bone('spine', (0, 1.03, 0), (0, 1.20, 0), 'hips')
bone('chest', (0, 1.20, 0), (0, 1.385, 0), 'spine')
bone('neck', (0, 1.385, 0), (0, 1.455, 0.012), 'chest')
bone('head', (0, 1.455, 0.012), (0, 1.70, 0.012), 'neck')
bone('beard', (0, 1.445, 0.10), (0, 1.27, 0.17), 'head')
bone('veil', (0, 1.60, -0.10), (0, 1.32, -0.17), 'head')
for sd, s in (('.L', 1), ('.R', -1)):
    S_ = SH(s); a_ = arm_dir(s)
    bone('shoulder' + sd, (s * 0.035, 1.375, 0), S_, 'chest')
    bone('upperarm' + sd, S_, S_ + a_ * UA, 'shoulder' + sd)
    bone('forearm' + sd, S_ + a_ * UA, S_ + a_ * (UA + FA), 'upperarm' + sd)
    bone('hand' + sd, S_ + a_ * (UA + FA), S_ + a_ * (UA + FA + HAND), 'forearm' + sd)
    bone('sleeve' + sd, S_ + a_ * (UA + 0.05), S_ + a_ * (UA + 0.22), 'forearm' + sd)
    bone('thigh' + sd, (s * 0.09, 0.90, 0), (s * 0.09, 0.47, 0), 'hips')
    bone('shin' + sd, (s * 0.09, 0.47, 0), (s * 0.09, 0.05, 0), 'thigh' + sd)
bone('staff', STAFF_B0, STAFF_B0 + V(0, 1.0, 0), 'root')


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


# ---------------------------------------------------------------------------- 몸통: 통옷과 겉옷
TUNIC_AB = spline([(0.0, 0.252, 0.220), (0.15, 0.242, 0.210), (0.40, 0.230, 0.198), (0.76, 0.212, 0.180), (0.92, 0.202, 0.170),
                   (1.0, 0.190, 0.160), (1.13, 0.192, 0.160), (1.25, 0.194, 0.156), (1.33, 0.178, 0.136), (1.385, 0.130, 0.104), (1.425, 0.076, 0.072)])
CLOAK_AB = spline([(0.11, 0.282, 0.250), (0.40, 0.262, 0.228), (0.76, 0.240, 0.204), (0.92, 0.228, 0.194), (1.04, 0.218, 0.183),
                   (1.13, 0.216, 0.180), (1.20, 0.218, 0.180), (1.25, 0.219, 0.178), (1.30, 0.218, 0.172), (1.345, 0.210, 0.158),
                   (1.385, 0.170, 0.128), (1.428, 0.100, 0.094)])
THETA_OPEN = spline([(0.11, 34.0), (1.0, 28.0), (1.30, 25.0), (1.385, 30.0), (1.428, 40.0)])

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

CL_TH = [None, 40, 49, 58, 66, 74, 82, 90, 98, 106, 114, 122, 129, 136, 143, 150, 157, 164, 172, 180]   # 왼쪽 절반의 둘레 각
CL_Y = [0.11, 0.15, 0.27, 0.41, 0.57, 0.74, 0.90, 1.03, 1.13, 1.20, 1.25, 1.30, 1.345, 1.385, 1.428]
CL_N = 39                                 # 둘레 선의 수(앞이 열려 있다)
HOLE_J0, HOLE_J1 = CL_Y.index(1.20), CL_Y.index(1.385)
HOLE_I0, HOLE_I1 = 3, 11
CLOAK_PAT = [CLOAK, CLOAK_HI, CLOAK, CLOAK_SH]

def cloak_k(i): return i if i <= 19 else 38 - i
def cloak_pt(i, y):
    k = cloak_k(i)
    th = (THETA_OPEN(y)[0] if k == 0 else CL_TH[k]) * DEG
    if i > 19: th = 2 * math.pi - th
    a, b = CLOAK_AB(y)
    r = srad(th, a, b)
    amp = 0.021 * sstep(1.18, 0.25, y) * (0.65 + 0.6 * hsh((k + 2) // 4, 3.0))       # 아래로 갈수록 깊어지는 세로 주름
    wave = 0.5 if k == 0 else (-1.0 if k % 4 in (0, 1) else 0.8)
    r += amp * wave + (0.007 if k == 0 else 0.0)                                      # 앞섶은 살짝 말려 나온다
    yy = y - (0.012 * (0.5 - hsh(k, 7.0)) if y < 0.2 else 0.0)                        # 옷자락 끝은 고르지 않게
    return V(r * math.sin(th), yy, r * math.cos(th))

def build_cloak(B):
    G = [[B.v(cloak_pt(i, y), w_cloak(cloak_pt(i, y))) for i in range(CL_N)] for y in CL_Y]
    def col(j, i):
        k = i if i < 19 else 37 - i
        if j == 0 or k == 0: return CLOAK_SH                                           # 옷자락과 앞섶의 어두운 단
        return CLOAK_PAT[(k - 1) % 4]
    def hole(j, i):
        return HOLE_J0 <= j < HOLE_J1 and (HOLE_I0 <= i < HOLE_I1 or 38 - HOLE_I1 <= i < 38 - HOLE_I0)
    B.grid(G, col, MAT_CLOTH, skip=hole)
    return G

def hole_loop(G, s):
    """팔 구멍 둘레의 꼭짓점 24개. 위 가운데에서 시작해 앞 -> 아래 -> 뒤로 돈다."""
    I = (lambda i: i) if s > 0 else (lambda i: 38 - i)
    out = [G[HOLE_J1][I(i)] for i in (7, 6, 5, 4, 3)]
    out += [G[j][I(3)] for j in range(HOLE_J1 - 1, HOLE_J0, -1)]
    out += [G[HOLE_J0][I(i)] for i in range(3, 12)]
    out += [G[j][I(11)] for j in range(HOLE_J0 + 1, HOLE_J1)]
    out += [G[HOLE_J1][I(i)] for i in (11, 10, 9, 8)]
    return out

SLEEVE_S = [0.165, 0.21, 0.255, 0.30, 0.345, 0.39, 0.435, 0.475, 0.505]
SLEEVE_R = spline([(0.165, 0.094), (0.28, 0.087), (0.40, 0.100), (0.505, 0.124)])
NS = 24

def w_sleeve(s_, sd):
    f = sstep(0.215, 0.345, s_)                       # 팔꿈치(0.28) 앞뒤로 섞는다
    sl = sstep(0.30, 0.50, s_) * 0.9
    return {'upperarm' + sd: 1 - f, 'forearm' + sd: f * (1 - sl), 'sleeve' + sd: f * sl}

def build_sleeve(B, G, s):
    sd = '.L' if s > 0 else '.R'
    a = arm_dir(s); eu = arm_up(s); S_ = SH(s)
    loop = hole_loop(G, s)
    for vi in loop:                                    # 구멍 둘레는 위팔을 조금 따른다
        w = B.W[vi]
        for key in w: w[key] *= 0.78
        w['upperarm' + sd] = 0.22
    def ring_pt(k, s_):
        ph = 2 * math.pi * k / NS
        fold = (1.0 if k % 4 in (1, 2) else -1.0) * lerp(0.015, 0.055, sstep(0.165, 0.505, s_)) * (0.6 + 0.8 * hsh(k // 4 + (3 if s > 0 else 11), 5.0))
        r = SLEEVE_R(s_)[0] * (1 + fold)
        if s_ >= 0.505: r *= 1.03
        return S_ + a * s_ + (eu * math.cos(ph) + Z * math.sin(ph)) * r
    rings = [loop]
    r1 = []
    for k in range(NS):                                # 어깨를 덮는 중간 고리
        ph = 2 * math.pi * k / NS
        p = B.P[loop[k]].lerp(ring_pt(k, SLEEVE_S[0]), 0.5)
        p += (eu * math.cos(ph) + Z * math.sin(ph)) * (0.020 * (0.55 + 0.45 * math.cos(ph)))
        r1.append(B.v(p, {'chest': 0.22, 'shoulder' + sd: 0.26, 'upperarm' + sd: 0.52}))
    rings.append(r1)
    for s_ in SLEEVE_S:
        rings.append([B.v(ring_pt(k, s_), w_sleeve(s_, sd)) for k in range(NS)])
    def col(j, k):
        if j == len(rings) - 2: return CLOAK_SH       # 소매 끝의 어두운 단
        return CLOAK_PAT[k % 4]
    B.grid(rings, col, MAT_CLOTH, flip=(s < 0), wrap=True)
    # 소매 끝 안쪽의 어두운 안감(안이 비어 보이지 않게)
    inner = [B.v(S_ + a * 0.445 + (eu * math.cos(2 * math.pi * k / NS) + Z * math.sin(2 * math.pi * k / NS)) * 0.046, {'forearm' + sd: 1.0}) for k in range(NS)]
    B.grid([inner, rings[-1]], CLOAK_SH, MAT_CLOTH, flip=(s > 0), wrap=True)
    return r1

TUNIC_RING_Y = [0.0, 0.05, 0.11, 0.17]
TUNIC_FRONT_Y = [0.17, 0.42, 0.66, 0.86, 0.962, 0.968, 1.040, 1.046, 1.14, 1.25, 1.33, 1.385, 1.425]
def tunic_pt(q, y, off=0.0):
    th = q * 10 * DEG
    a, b = TUNIC_AB(y)
    r = srad(th, a, b) + off
    kq = min(q % 36, 36 - (q % 36))
    r += 0.009 * sstep(0.9, 0.0, y) * (1.0 if kq % 3 == 1 else -0.5)                  # 줄무늬 자리가 살짝 솟는 주름
    return V(r * math.sin(th), y, r * math.cos(th))

def build_tunic(B):
    def qcol(q):
        q %= 36
        return STRIPE if min(q, 35 - q) % 3 == 1 else TUNIC
    ring = [[B.v(tunic_pt(q, y), w_body(tunic_pt(q, y))) for q in range(36)] for y in TUNIC_RING_Y]
    B.grid(ring, lambda j, i: (STRIPE if j == 0 else qcol(i)), MAT_CLOTH, wrap=True)
    qs = list(range(-6, 7))                                                             # 앞판: -60도 ~ +60도
    rows = [[ring[-1][q % 36] for q in qs]]
    for y in TUNIC_FRONT_Y[1:]:
        off = 0.010 if y in (0.968, 1.040) else 0.0                                     # 허리띠는 살짝 도드라진다
        rows.append([B.v(tunic_pt(q, y, off), w_body(tunic_pt(q, y, off))) for q in qs])
    def col(j, i):
        y0 = TUNIC_FRONT_Y[j]
        if y0 in (0.962, 0.968, 1.040): return BELT if y0 == 0.968 else BELT_SH
        return qcol(qs[i])
    B.grid(rows, col, MAT_CLOTH)
    # 허리띠 매듭과 늘어진 두 끝자락
    def strip(q0, q1, y0, y1, off, c):
        g = []
        for t in (0.0, 0.33, 0.66, 1.0):
            y = lerp(y0, y1, t)
            g.append([B.v(tunic_pt(q, y, off + 0.004 * math.sin(t * 5)), w_body(tunic_pt(q, y))) for q in (q0, q1)])
        B.grid(g[::-1], c, MAT_CLOTH)
    strip(1.1, 1.75, 1.0, 0.75, 0.018, BELT)
    strip(1.9, 2.5, 1.0, 0.80, 0.024, BELT_SH)
    kc = tunic_pt(1.75, 1.004, 0.016)
    kn = V(math.sin(17.5 * DEG), 0, math.cos(17.5 * DEG)); kt = Y.cross(kn)
    tube(B, [kc - kn * 0.004 + Y * 0.0, kc + kn * 0.010, kc + kn * 0.019], [0.030, 0.027, 0.014], 6, w_body(kc), BELT_SH, MAT_SOLID, cap0=False, squash=(0.95, 1.1))
    # 옷자락 안의 어두운 바닥(옷자락이 들릴 때 안이 비어 보이지 않게). 발은 만들지 않는다.
    c0 = B.v(V(0, 0.012, 0), 'root')
    rim = [B.v(tunic_pt(q * 3, 0.012, -0.012), 'root') for q in range(12)]
    for q in range(12):
        B.f([c0, rim[(q + 1) % 12], rim[q]], UNDER, MAT_SOLID)


# ---------------------------------------------------------------------------- 팔뚝과 손
def build_arm_hand(B, s, grip):
    """팔뚝(살)과 손. 손은 상자 뼈대를 만든 뒤 Blender의 세분화 표면으로 다듬는다(따로 만든 메쉬를 합친다)."""
    sd = '.L' if s > 0 else '.R'
    a = arm_dir(s); S_ = SH(s); wr = S_ + a * (UA + FA)
    g = Z; wv = g.cross(a) * (-s)                       # 손바닥이 향하는 쪽(몸 쪽)
    flip = s > 0
    def L(cu, cw, cg): return wr + a * cu + wv * cw + g * cg
    # 팔뚝
    st = [(-0.21, 0.040, 'forearm'), (-0.10, 0.036, 'forearm'), (-0.012, 0.0285, 'mix'), (0.022, 0.027, 'hand')]
    pts = [L(c, 0.0, 0) for c, r, wn in st]
    wl = [{'forearm' + sd: 1.0} if wn == 'forearm' else ({'hand' + sd: 1.0} if wn == 'hand' else {'forearm' + sd: 0.5, 'hand' + sd: 0.5}) for c, r, wn in st]
    e1 = None; rings = []
    for i, p in enumerate(pts):
        ring = []
        for k in range(8):
            ph = 2 * math.pi * k / 8
            sq = 0.80 if i >= 2 else 1.0                # 손목은 납작하다
            ring.append(B.v(p + (wv * math.cos(ph) * sq + g * math.sin(ph)) * st[i][1], wl[i]))
        rings.append(ring)
    # (wv, g, a) 방향: 왼쪽은 왼손 좌표계라 뒤집는다
    B.grid(rings, SKIN, MAT_SOLID, flip=flip, wrap=True)
    return dict(L=L, sd=sd, flip=flip, grip=grip)


# 손 좌표: cu 손끝 쪽, cw 손바닥 쪽, cg 엄지 쪽. 지팡이 축은 (cu, cw) = FIST_C 를 cg 방향으로 지난다.
FIST_C = (0.060, 0.031)
FIST_RI = 0.0225                         # 쥔 손 안쪽 반지름(지팡이 굵기)
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

def subdivided(verts, faces, levels, crease_fn=None):
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

def build_hand(B, arm):
    L, sd, flip, grip = arm['L'], arm['sd'], arm['flip'], arm['grip']
    w = {'hand' + sd: 1.0}
    # 손바닥: 상자 뼈대에 세분화 표면(Catmull-Clark)을 적용한다
    vs, fs = subdivided(*palm_cage(), levels=1)
    base = len(B.P)
    for v in vs: B.v(L(*v), w)
    for f in fs: B.f([base + i for i in f], SKIN, MAT_SOLID, flip=flip)
    # 손가락 넷: 지팡이를 감아쥔다(왼손은 느슨하게 말린다)
    ri = FIST_RI if grip else 0.017
    fingers = [(0.030, 0.0100, 316), (0.0100, 0.0104, 324), (-0.0100, 0.0098, 318), (-0.0295, 0.0086, 306)]
    for cg, rf, bend in fingers:
        if not grip: bend -= 62
        rc = ri + rf * 0.92
        n = 7
        pts = []
        for i in range(n):
            bb = lerp(96, bend, i / (n - 1)) * DEG
            pts.append(L(FIST_C[0] - math.cos(bb) * rc, FIST_C[1] - math.sin(bb) * rc, cg))
        tube(B, pts, lambda i: rf * [1.0, 1.04, 1.0, 0.98, 0.95, 0.92, 0.80][i], 5, w, SKIN, MAT_SOLID, up=Z, cap0=False)
    # 엄지: 손가락 반대쪽으로 감싼다
    tp = [L(0.016, 0.002, 0.030), L(0.020, 0.028, 0.049), L(0.034, 0.053, 0.050), L(0.054, 0.068, 0.040)] if grip else \
         [L(0.016, 0.002, 0.030), L(0.028, 0.022, 0.050), L(0.048, 0.036, 0.050), L(0.070, 0.040, 0.040)]
    tp = cr_points(tp, 5)
    tube(B, tp, lambda i: [0.0130, 0.0135, 0.0128, 0.0118, 0.0105, 0.0080][i], 6, w, SKIN, MAT_SOLID, up=Z)


# ---------------------------------------------------------------------------- 머리
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

def build_head(B):
    H = 'head'
    # 얼굴(한 장의 곡면에 코, 눈썹뼈, 광대를 솟게 한다)
    G = [[B.v(face_pt(t * DEG, yr), H) for t in FACE_TH] for yr in FACE_Y]
    def fcol(j, i):
        y = 0.5 * (FACE_Y[j] + FACE_Y[j + 1]); t = 0.5 * (FACE_TH[i] + FACE_TH[i + 1])
        if -0.097 < y < -0.079 and abs(t) < 9: return LIP
        return SKIN
    B.grid(G, fcol, MAT_SOLID, flip=True)
    # 뒤통수: 머리쓰개 아래의 흰 머리(고개를 숙여 천이 들릴 때 속이 비어 보이지 않게)
    bth = [82, 100, 120, 140, 160, 180, 200, 220, 240, 260, 278]
    byr = [0.085, 0.04, -0.01, -0.06, -0.105, -0.150]
    bg = []
    for yr in byr:
        row = []
        for t in bth:
            r = srad(t * DEG, HX * 1.02, HZ * 1.02, 2.2) * math.sqrt(max(0.05, 1 - (yr / 0.165) ** 2)) * (1 - 0.30 * sstep(-0.06, -0.15, yr))
            row.append(B.v(C + V(r * math.sin(t * DEG), yr, r * math.cos(t * DEG)), H))
        bg.append(row)
    B.grid(bg, HAIR, MAT_SOLID, flip=True)
    # 목
    tube(B, [V(0, 1.335, 0.0), V(0, 1.40, 0.004), V(0, 1.47, 0.012)], [0.056, 0.052, 0.052], 8,
         lambda p: {'chest': 1.0} if p.y < 1.36 else ({'neck': 1.0} if p.y < 1.45 else {'head': 0.6, 'neck': 0.4}), SKIN_SH, MAT_SOLID, cap0=False, cap1=False, up=Z)
    for s in (1, -1):
        # 눈: 작은 점 눈
        te = s * 20.5 * DEG; ye = 0.0125
        n = V(math.sin(te), 0, math.cos(te)); tx = V(math.cos(te), 0, -math.sin(te))
        ce = face_pt(te, ye, -0.0015)
        c0 = B.v(ce + n * 0.0060, H)
        r1 = [B.v(ce + (tx * math.cos(k * math.pi / 5) * 0.0068 + Y * math.sin(k * math.pi / 5) * 0.0088) + n * 0.0046, H) for k in range(10)]
        r2 = [B.v(ce + (tx * math.cos(k * math.pi / 5) * 0.0108 + Y * math.sin(k * math.pi / 5) * 0.0140), H) for k in range(10)]
        for k in range(10):
            B.f([c0, r1[k], r1[(k + 1) % 10]], EYE, MAT_SOLID)
            B.f([r1[k], r2[k], r2[(k + 1) % 10], r1[(k + 1) % 10]], EYE, MAT_SOLID)
        # 흰 눈썹: 숱이 많고 바깥이 처진다
        bp = []
        for u in (0.0, 0.25, 0.5, 0.75, 1.0):
            t = s * lerp(6.5, 37.0, u) * DEG
            yr = 0.047 + 0.009 * math.sin(math.pi * u) - 0.011 * u * u
            bp.append(face_pt(t, yr, 0.0035))
        tube(B, bp, [0.0060, 0.0095, 0.0098, 0.0080, 0.0040], 5, H, BEARD, MAT_SOLID, up=Y, squash=(1.0, 0.75))
        # 콧수염
        mp = [face_pt(s * t * DEG, yr, o) for t, yr, o in ((1.5, -0.0615, 0.004), (9, -0.065, 0.010), (18, -0.075, 0.012), (27, -0.094, 0.010), (33, -0.118, 0.008))]
        tube(B, mp, [0.0075, 0.0125, 0.0130, 0.0100, 0.0030], 6, H, BEARD, MAT_SOLID, up=Y, squash=(1.0, 0.8))
        # 옆머리: 머리쓰개 아래로 내려온 흰 머리
        hp = [face_pt(s * t * DEG, yr, o) for t, yr, o in ((60, 0.060, 0.004), (59, 0.0, 0.008), (58, -0.06, 0.012), (59, -0.115, 0.022), (61, -0.165, 0.034))]
        tube(B, hp, [0.008, 0.015, 0.016, 0.013, 0.004], 6, lambda p: {'head': 1.0} if p.y > 1.50 else {'head': 0.7, 'veil': 0.3}, HAIR, MAT_SOLID, up=Z, squash=(0.6, 1.0))

# 수염
YJ, YTIP = -0.128, -0.318
B_TH = [-100, -84, -69, -55, -42, -30, -19.5, -9.5, 0, 9.5, 19.5, 30, 42, 55, 69, 84, 100]
B_BACK = [128, 156, 180, 204, 232]
def beard_T(th): return lerp(0.037, 0.020, sstep(30, 100, abs(th)))
def beard_top(th): return lerp(-0.101, 0.030, sstep(13, 74, abs(th)) ** 0.85)
def w_beard(p):
    k = sstep(C.y + YJ + 0.01, C.y + YJ - 0.10, p.y) * 0.9
    return {'head': 1 - k, 'beard': k}

def build_beard(B):
    def lock(i, depth):                                # 가닥의 굴곡
        return 1.0 + (0.20 if i % 2 == 0 else -0.16) * depth
    rows = []
    for jj, (f, tk) in enumerate(((0.0, -0.004), (0.34, 0.72), (0.68, 0.98), (1.0, 1.0))):
        row = []
        for i, t in enumerate(B_TH):
            yt = beard_top(t); yr = lerp(yt, YJ + 0.012 * sstep(45, 100, abs(t)), f)
            thick = beard_T(t) * tk * (lock(i, 0.35 * f) if tk > 0 else 1.0)
            p = face_pt(t * DEG, yr, thick) if yr > -0.11 else (C + V(*[(face_base(t * DEG, yr) + thick) * c for c in (math.sin(t * DEG), 0, math.cos(t * DEG))]) + V(0, yr, 0))
            row.append(B.v(p, w_beard(p)))
        rows.append(row)
    def bcol(j, i): return BEARD if i % 2 == 0 else BEARD_SH
    B.grid(rows, bcol, MAT_SOLID, flip=True)
    # 턱 아래로 늘어진 부분: 둥글게 닫힌 덩어리가 아래로 갈수록 좁아지며 가슴 앞으로 나온다
    def hang_pt(i, th, yr):
        t = clamp((YJ - yr) / (YJ - YTIP))
        sc = 1 - 0.74 * t ** 2.1
        cz = 0.150 * t ** 1.1
        if abs(th) <= 100:
            r = (face_base(th * DEG, YJ) + beard_T(th) * lock(i, 0.35 + 0.65 * t)) * sc
        else:
            r = lerp(face_base(100 * DEG, YJ) + 0.020, 0.050, sstep(100, 150, abs(th) if abs(th) <= 180 else 360 - abs(th))) * sc
        return C + V(r * math.sin(th * DEG), yr, r * math.cos(th * DEG) + cz)
    ths = B_TH + B_BACK
    rings = [rows[-1] + [B.v(hang_pt(0, t, YJ + 0.012), 'head') for t in B_BACK]]
    for yr in (-0.160, -0.195, -0.230, -0.262, -0.290, -0.308):
        rings.append([B.v(hang_pt(i, t, yr), w_beard(hang_pt(i, t, yr))) for i, t in enumerate(ths)])
    B.grid(rings, lambda j, i: (BEARD if i % 2 == 0 else BEARD_SH) if i < 16 else BEARD_SH, MAT_SOLID, flip=True, wrap=True)
    tip = hang_pt(0, 0, YTIP) + V(0, 0, 0.004)
    ti = B.v(tip, w_beard(tip))
    n = len(ths)
    for i in range(n):
        B.f([rings[-1][i], rings[-1][(i + 1) % n], ti], BEARD if i % 2 == 0 else BEARD_SH, MAT_SOLID, flip=True)

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
def on_body(p, gap=0.013):
    """늘어진 천이 겉옷 속으로 들어가지 않게 몸 바깥으로 밀어낸다."""
    if p.y > 1.428: return p
    a, b = CLOAK_AB(max(p.y, 1.13))
    th = math.atan2(p.x, p.z); rb = math.hypot(p.x, p.z)
    rmin = srad(th, a + gap, b + gap)
    if rb < rmin: return V(p.x * rmin / rb, p.y, p.z * rmin / rb)
    return p

def build_headcloth(B):
    def w_h(v, th):
        if abs(th) <= 40: return {'head': 1.0}
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
                y = lerp(yc, HC_END_Y(at)[0], v); r = rc + 0.007 * math.sin(math.pi * min(1.0, v * 1.1)) - 0.004 * sstep(0.86, 1.0, v)
            else:
                y = lerp(yc, HC_END_Y(at)[0], v)
                r = lerp(rc, HC_END_R(at)[0], v ** 0.62)
                if at >= 62: r += 0.0075 * v * (1.0 if i % 2 == 0 else -1.0)      # 늘어진 천의 주름
            p = C + V(r * math.sin(t * DEG), y, r * math.cos(t * DEG))
            if at > 40: p = on_body(p)
            row.append(B.v(p, w_h(v, t)))
        rows.append(row)
    def col(j, i):
        t = 0.5 * (abs(HC_ANG[i]) + abs(HC_ANG[(i + 1) % len(HC_ANG)]))
        if j == 8 and t > 56: return STRIPE                # 끝자락 가까이의 줄
        if j >= 5 and t > 56 and i % 2 == 1: return CLOTH_SH
        return CLOTH
    B.grid(rows, col, MAT_CLOTH, flip=True, wrap=True)
    # 머리끈
    n = 22
    pts = [cap_pt(360.0 * k / n, hc_alpha(360.0 * k / n) + 0.02, 0.009) for k in range(n)]
    tube(B, pts, lambda i: 0.0115, 5, 'head', lambda j, k: CORD if j % 2 == 0 else CORD_SH, MAT_SOLID, closed=True, up=Y, squash=(1.25, 1.0))


# ---------------------------------------------------------------------------- 지팡이
def build_staff(B):
    ctrl = [V(0, 0, 0), V(0.004, 0.4, 0.003), V(-0.004, 0.8, -0.003), V(0.003, 1.2, 0.003), V(0, 1.5, 0)]
    crook = cr_points([V(0, 1.6, 0), V(0, 1.72, 0.012), V(0, 1.81, 0.06), V(0, 1.838, 0.13), V(0, 1.795, 0.195), V(0, 1.715, 0.205)], 9)
    pts = ctrl + crook
    m = len(pts)
    tube(B, [STAFF_B0 + p for p in pts], lambda i: lerp(0.0225, 0.0160, i / (m - 1)) * (1.08 if i in (2, 5) else 1.0), 6, 'staff',
         lambda j, k: STAFF_HI if (k + j // 2) % 3 == 0 else STAFF, MAT_SOLID, up=X, round_cap=0.0)


# ---------------------------------------------------------------------------- 조립
def build_all():
    B = Builder()
    G = build_cloak(B)
    for s in (1, -1): build_sleeve(B, G, s)
    build_tunic(B)
    for s in (1, -1):
        arm = build_arm_hand(B, s, grip=(s < 0))
        build_hand(B, arm)
    build_head(B)
    build_beard(B)
    build_headcloth(B)
    build_staff(B)
    return B


def bake_ao(B, strength=0.55, maxd=0.22):
    """꼭짓점마다 반구 방향으로 광선을 쏘아 가려진 정도를 구한다(땅도 넣는다)."""
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
    return ao, nrm


def make_objects(B):
    scene = bpy.context.scene
    for o in list(bpy.data.objects): bpy.data.objects.remove(o)
    scene.render.fps = FPS
    def BL(p): return Vector((p[0], -p[2], p[1]))        # 게임 좌표 -> Blender 좌표
    # 뼈대
    arm = bpy.data.armatures.new('MosesRig')
    aob = bpy.data.objects.new('Moses', arm)
    scene.collection.objects.link(aob)
    bpy.context.view_layer.objects.active = aob
    bpy.ops.object.mode_set(mode='EDIT')
    for name in ORDER:
        b = BONES[name]
        eb = arm.edit_bones.new(name)
        eb.head = BL(b['head']); eb.tail = BL(b['tail']); eb.roll = 0.0
        if b['parent']: eb.parent = arm.edit_bones[b['parent']]
        eb.use_connect = False
    bpy.ops.object.mode_set(mode='OBJECT')
    # 메쉬
    ao, _ = bake_ao(B)
    me = bpy.data.meshes.new('MosesMesh')
    me.from_pydata([BL(p) for p in B.P], [], [list(f[0]) for f in B.F])
    me.update()
    mats = []
    for nm, rough, cull in (('MosesSolid', 0.82, True), ('MosesCloth', 0.92, False)):
        m = bpy.data.materials.new(nm)
        if m.node_tree is None or m.node_tree.nodes.get('Principled BSDF') is None: m.use_nodes = True
        bsdf = m.node_tree.nodes.get('Principled BSDF')
        bsdf.inputs['Base Color'].default_value = (1, 1, 1, 1)
        bsdf.inputs['Roughness'].default_value = rough
        bsdf.inputs['Metallic'].default_value = 0.0
        m.use_backface_culling = cull
        me.materials.append(m); mats.append(m)
    ca = me.color_attributes.new(name='Color', type='FLOAT_COLOR', domain='CORNER')
    li = 0
    for pi, poly in enumerate(me.polygons):
        idx, col, mat = B.F[pi]
        poly.material_index = mat
        poly.use_smooth = True
        for vi in poly.vertices:
            a = ao[vi]
            if col in (SKIN, LIP): a = lerp(1.0, a, 0.6)                                                  # 살은 그늘을 약하게
            ca.data[li].color = (col[0] * lerp(1, a, 0.90), col[1] * lerp(1, a, 0.96), col[2] * a, 1.0)   # 그늘은 살짝 따뜻하게
            li += 1
    me.color_attributes.active_color = ca
    me.color_attributes.render_color_index = 0
    mob = bpy.data.objects.new('MosesBody', me)
    scene.collection.objects.link(mob)
    groups = {name: mob.vertex_groups.new(name=name) for name in ORDER}
    for vi, w in enumerate(B.W):
        for k, v in prune(w).items():
            groups[k].add([vi], v, 'REPLACE')
    mob.parent = aob
    md = mob.modifiers.new('Armature', 'ARMATURE'); md.object = aob
    return aob, mob


# ---------------------------------------------------------------------------- 자세
def Rx(d): return Quaternion(X, d * DEG)
def Ry(d): return Quaternion(Y, d * DEG)
def Rz(d): return Quaternion(Z, d * DEG)

class Pose:
    """뼈마다 (회전 q, 이동 t)를 기본 자세의 세계 축 기준으로 주면 D(b) = 기본 자세의 점을 옮기는 행렬을 돌려준다."""
    def __init__(self): self.loc = {}; self._D = {}
    def set(self, b, q=None, t=None):
        self.loc[b] = (q if q is not None else Quaternion(), t if t is not None else Vector((0, 0, 0)))
        self._D = {}
    def D(self, b):
        if b in self._D: return self._D[b]
        q, t = self.loc.get(b, (Quaternion(), Vector((0, 0, 0))))
        h = BONES[b]['head']
        M = Matrix.Translation(t + h) @ q.to_matrix().to_4x4() @ Matrix.Translation(-h)
        par = BONES[b]['parent']
        if par: M = self.D(par) @ M
        self._D[b] = M
        return M
    def set_world_rot(self, b, R3, t=None):
        Rp = self.D(BONES[b]['parent']).to_3x3()
        self.set(b, (Rp.inverted() @ R3).to_quaternion(), t)

def frame_rot(a0, h0, a1, h1):
    """(a0, h0)을 (a1, h1)로 옮기는 회전. h는 a에 수직이 되게 고친다."""
    def fr(a, h):
        a = a.normalized(); h = (h - a * h.dot(a)).normalized(); c = a.cross(h)
        return Matrix((a, h, c)).transposed()
    return fr(a1, h1) @ fr(a0, h0).transposed()

def set_arm(P, sd, U, F):
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

def set_sleeve(P, sd, sag):
    """넓은 소매는 팔 아래로 처진다: 팔뚝이 눕는 만큼 소매 끝을 아래로 내린다."""
    Df = P.D('forearm' + sd); R = Df.to_3x3()
    s = 1 if sd == '.L' else -1
    F = (R @ arm_dir(s)).normalized()
    down = -Y
    dp = down - F * down.dot(F)
    off = dp * sag
    ax = F.cross(down)
    qw = Quaternion(ax.normalized(), 14 * DEG * dp.length) if ax.length > 1e-4 else Quaternion()
    Rq = R.to_quaternion()
    P.set('sleeve' + sd, Rq.inverted() @ qw @ Rq, R.inverted() @ off)

def staff_frame(prm):
    up = Vector(prm['staff_dir']).normalized()
    q = Y.rotation_difference(up) @ Ry(prm['staff_yaw'])
    return Vector(prm['staff_B']), up, q

def apply(prm):
    P = Pose()
    P.set('hips', Ry(prm['hip_yaw']), Vector(prm['hip_t']))
    P.set('spine', Rx(prm['spine']))
    P.set('chest', Ry(prm['chest_yaw']) @ Rx(prm['chest']))
    P.set('neck', Rx(prm['neck']))
    P.set('head', Ry(prm['head_yaw']) @ Rx(prm['head']) @ Rz(prm['head_roll']))
    P.set('beard', Rx(prm['beard']))
    P.set('veil', Rx(prm['veil']))
    P.set('shoulder.L', Rz(prm['clavL']) @ Ry(-prm['clavL_f']))
    P.set('shoulder.R', Rz(-prm['clavR']))
    for sd, s in (('.L', 1), ('.R', -1)):
        P.set('thigh' + sd, Rx(-prm['th' + sd]))
        P.set('shin' + sd, Rx(prm['kn' + sd]))
    Bp, up, q = staff_frame(prm)
    P.set('staff', q, Bp - STAFF_B0)
    # 왼팔: 방향을 직접 준다
    set_arm(P, '.L', Vector(prm['UL']).normalized(), Vector(prm['FL']).normalized())
    P.set('hand.L', Quaternion(arm_dir(1).cross(Z).normalized(), prm['handL'] * DEG))
    # 오른팔: 손이 지팡이를 쥐도록 푼다(2관절 IK)
    a = arm_dir(-1); g0 = Z; w0 = g0.cross(a)
    Gp = Bp + up * GRIP
    S_ = P.D('shoulder.R') @ SH(-1)
    F = (Gp - S_).normalized()
    pole = Vector((-0.45, -0.75, -0.45))
    for it in range(4):
        u1 = (F - up * F.dot(up))
        u1 = u1.normalized() if u1.length > 1e-4 else Z.copy()
        u1 = (u1 + up * prm['wrist_tilt']).normalized()            # 손목이 살짝 꺾인다
        g1 = (up - u1 * up.dot(u1)).normalized()
        w1 = g1.cross(u1)
        Wp = Gp - (u1 * FIST_C[0] + w1 * FIST_C[1])
        U, F = ik2(S_, Wp, pole)
    set_arm(P, '.R', U, F)
    Rh = Matrix((u1, w1, g1)).transposed() @ Matrix((a, w0, g0))   # (a, w0, g0) -> (u1, w1, g1)
    P.set_world_rot('hand.R', Rh)
    set_sleeve(P, '.L', prm['sagL'])
    set_sleeve(P, '.R', prm['sagR'])
    return P

def base_prm():
    return dict(hip_yaw=0.0, hip_t=(0, 0, 0), spine=3.0, chest=5.0, chest_yaw=0.0, neck=7.0, head=-4.0, head_yaw=0.0, head_roll=0.0,
                beard=0.0, veil=0.0, clavL=0.0, clavR=0.0, clavL_f=0.0,
                UL=(0.25, -0.96, 0.04), FL=(0.17, -0.93, 0.33), handL=8.0,
                staff_B=(-0.345, 0.0, 0.315), staff_dir=(-0.035, 1.0, -0.06), staff_yaw=-50.0, wrist_tilt=0.12,
                sagL=0.03, sagR=0.045, **{'th.L': 0.0, 'kn.L': 0.0, 'th.R': 0.0, 'kn.R': 0.0})

def idle(t):
    p = base_prm()
    b = math.sin(2 * math.pi * t / 3.0); b2 = math.sin(2 * math.pi * t / 3.0 - 1.0)
    p['spine'] += 0.4 * b; p['chest'] -= 2.0 * b; p['neck'] += 0.4 * b; p['head'] += 1.3 * b
    p['head_yaw'] = 1.6 * b2
    p['clavL'] = 2.6 * b; p['clavR'] = 2.6 * b
    p['hip_t'] = (0.003 * b2, 0.0, 0.0)
    p['beard'] = -0.6 * b; p['veil'] = -0.5 * b
    p['UL'] = (0.25 + 0.006 * b2, -0.96, 0.04 + 0.01 * b)
    p['FL'] = (0.17 + 0.008 * b2, -0.93, 0.33 + 0.02 * b)
    return p

def walk(t):
    p = base_prm()
    ph = 2 * math.pi * t / 1.2
    s, c = math.sin(ph), math.cos(ph)
    p['th.L'] = 16 * s; p['kn.L'] = 24 * max(0.0, c) ** 1.2 + 3
    p['th.R'] = -16 * s; p['kn.R'] = 24 * max(0.0, -c) ** 1.2 + 3
    p['hip_t'] = (0.010 * s, 0.004 + 0.012 * abs(c), 0.0)
    p['hip_yaw'] = 4.0 * s
    p['spine'] = 5.0; p['chest'] = 6.0 + 0.8 * math.cos(2 * ph); p['chest_yaw'] = -7.0 * s
    p['neck'] = 7.0; p['head'] = -5.0 - 0.8 * math.cos(2 * ph + 0.6); p['head_yaw'] = 3.0 * s
    p['beard'] = 1.5 * math.cos(2 * ph + 1.0); p['veil'] = 2.5 * math.cos(2 * ph + 1.4)
    sw = -s                                             # 왼팔은 왼다리와 반대로 흔든다
    p['UL'] = (0.24, -0.95, 0.04 + 0.26 * sw)
    p['FL'] = (0.17, -0.90, 0.36 + 0.34 * sw)
    p['staff_B'] = (-0.36, max(0.0, c) * 0.06, 0.30 + 0.17 * s)
    p['staff_dir'] = (-0.035, 1.0, -0.05 - 0.16 * s)
    return p

def hide_target():
    p = base_prm()
    p['spine'] = 5.0; p['chest'] = 9.0; p['neck'] = 17.0; p['head'] = 21.0; p['head_roll'] = 0.0; p['head_yaw'] = 4.0
    p['beard'] = -20.0; p['veil'] = -26.0
    p['clavL'] = 9.0; p['clavL_f'] = 12.0
    p['handL'] = 18.0
    p['sagL'] = 0.085
    # 왼팔: 팔뚝이 눈앞을 가로지르고 손이 얼굴 오른쪽 너머에 가도록 푼다(얼굴이 소매 안에 묻힌다)
    P = apply(p)
    Dh = P.D('head'); R = Dh.to_3x3()
    brow = Dh @ face_pt(0.0, 0.058)
    Wt = brow + (R @ Z) * 0.040 + (R @ X) * -0.118 + Y * 0.012
    U, F = ik2(P.D('shoulder.L') @ SH(1), Wt, Vector((0.6, -0.15, 0.8)))
    p['UL'] = tuple(U); p['FL'] = tuple(F)
    return p
_HIDE = []

def hide(t):
    if not _HIDE: _HIDE.append(hide_target())
    a = idle(0.0); b = _HIDE[0]
    k = sstep(0.0, 0.74, t)
    k = k * k * (3 - 2 * k) * 0.5 + k * 0.5
    ka = sstep(0.0, 0.62, t)                             # 팔이 먼저 올라가고 고개가 따라 숙여진다
    out = {}
    for key in a:
        kk = ka if key in ('UL', 'FL', 'handL', 'clavL', 'clavL_f', 'sagL') else k
        if isinstance(a[key], tuple): out[key] = tuple(lerp(a[key][i], b[key][i], kk) for i in range(3))
        else: out[key] = lerp(a[key], b[key], kk)
    if True:                                             # 팔은 방향을 구면으로 섞는다
        for key in ('UL', 'FL'):
            va = Vector(a[key]).normalized(); vb = Vector(b[key]).normalized()
            out[key] = tuple(va.slerp(vb, ka))
    return out

CLIPS = [('Idle', 3.0, idle), ('Walk', 1.2, walk), ('HideFace', 0.8, hide)]


def animate(aob):
    Cm = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))     # 게임 -> Blender
    Ci = Cm.inverted()
    rest = {n: aob.data.bones[n].matrix_local.copy() for n in ORDER}
    aob.animation_data_create()
    for pb in aob.pose.bones: pb.rotation_mode = 'QUATERNION'
    LOCB = ('hips', 'staff', 'sleeve.L', 'sleeve.R')
    acts = []
    for name, dur, fn in CLIPS:
        act = bpy.data.actions.new(name)
        aob.animation_data.action = act
        nfr = int(round(dur * FPS))
        prev = {}
        for f in range(nfr + 1):
            P = apply(fn(f / FPS))
            for n in ORDER:
                Mb = Cm @ P.D(n) @ Ci @ rest[n]
                par = BONES[n]['parent']
                if par:
                    Mp = Cm @ P.D(par) @ Ci @ rest[par]
                    Lm = rest[n].inverted() @ rest[par] @ Mp.inverted() @ Mb
                else:
                    Lm = rest[n].inverted() @ Mb
                loc, q, sc = Lm.decompose()
                if n in prev and prev[n].dot(q) < 0: q.negate()
                prev[n] = q.copy()
                pb = aob.pose.bones[n]
                pb.rotation_quaternion = q
                pb.keyframe_insert('rotation_quaternion', frame=f)
                if n in LOCB:
                    pb.location = loc
                    pb.keyframe_insert('location', frame=f)
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


def export(aob, mob):
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    bpy.ops.export_scene.gltf(
        filepath=OUT, export_format='GLB', export_yup=True, export_apply=False,
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


def main():
    B = build_all()
    tris = sum(len(f[0]) - 2 for f in B.F)
    aob, mob = make_objects(B)
    acts = animate(aob)
    export(aob, mob)
    ys = [p.y for p in B.P]
    print('MOSES verts(before split)=%d tris=%d bones=%d materials=%d minY=%.3f maxY=%.3f' % (len(B.P), tris, len(ORDER), len(mob.data.materials), min(ys), max(ys)))
    print('MOSES clips: ' + ', '.join('%s %.2fs' % (n, d) for n, d, f in CLIPS))
    print('MOSES wrote %s (%d bytes)' % (OUT, os.path.getsize(OUT)))


main()
