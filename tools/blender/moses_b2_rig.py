# -*- coding: utf-8 -*-
"""
인물 품질 실험 2단계 (docs/07): B-2 모세(moses_b2.py가 넘긴 형태)에 뼈대와 동작(Idle, Walk, HideFace)을 넣는다.

    <bpy 파이썬> tools/blender/moses_b2.py <베이스 메시 .blend> <정지.glb> --dump <형태.json>
    <bpy 파이썬> tools/blender/moses_b2_rig.py <형태.json> <출력.glb> [--check]

- 뼈대·자세·굽기·내보내기는 common.py(Person, Pose, set_arm, ik2, set_sleeve, run)를 그대로 쓴다.
  어깨 자리, 팔 길이, 팔 각도만 B-2 몸(베이스 메시)에 맞춘다(common의 값을 이 스크립트 안에서만 바꾼다).
- 동작은 moses.py의 Idle(3.0초), Walk(1.2초, 제자리), HideFace(0.8초, 끝 자세에서 멈춤)를 옮겼다.
  지팡이는 게임의 기존 모세와 같이 오른손으로 쥐고(2관절 IK), HideFace는 왼팔로 얼굴을 가린다(출 3:6, 선 채로).
- 오른손 손가락은 기본 자세에서 미리 말아 둔다(지팡이를 감아쥔 모양). 뼈 수 예산(25)을 지키려고 손가락 뼈는 두지 않는다.
- 가중치: 몸판은 엉덩이·허리·가슴과 두 다리(common.w_cloak), 소매는 팔 축을 따라 위팔→팔뚝→소매 뼈,
  수염은 beard 뼈, 머리쓰개 뒷자락은 veil 뼈, 옆자락은 아래로 갈수록 가슴을 조금 따른다.
"""
import bpy
import json
import math
import os
import sys
from mathutils import Vector, Matrix, Quaternion

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
SRC, OUT = argv[0], argv[1]
V = C.V
X, Y, Z = C.X, C.Y, C.Z
DEG = C.DEG
sstep, lerp = C.sstep, C.lerp

d = json.load(open(SRC))
K = d['k_scale']


def G(t):
    """Blender 좌표(z 위, -y 앞) → 게임 좌표(x 왼쪽, y 위, z 앞)."""
    return Vector((t[0], t[2], -t[1]))


P = [G(p) for p in d['P']]
F, FP, ORDER = d['F'], d['FP'], d['order']
VG = {int(k_): v for k_, v in d.get('VG', {}).items()}
vpart = [None] * len(P)
for f, pi in zip(F, FP):
    for i in f:
        if vpart[i] is None:
            vpart[i] = ORDER[pi]

# ---------------------------------------------------------------------------- 팔 치수를 B-2 몸에 맞춘다
SHO_L, WRI_L = G(d['SHO'][0]), G(d['WRI'][0])
ARM_LEN = (WRI_L - SHO_L).length
C.ARM_A = math.atan2(WRI_L.x - SHO_L.x, SHO_L.y - WRI_L.y)
C.UA = ARM_LEN * 0.52
C.FA = ARM_LEN - C.UA
C.HAND = 0.09
C.SH = lambda s: V(s * SHO_L.x, SHO_L.y, SHO_L.z)
print('arm: len %.3f angle %.1f UA %.3f FA %.3f shoulder %s' % (ARM_LEN, C.ARM_A / DEG, C.UA, C.FA, tuple(round(c, 3) for c in SHO_L)))


def hand_frame(s):
    a = C.arm_dir(s)
    g = Z.copy()
    w = g.cross(a) * (-s)
    wr = C.SH(s) + a * (C.UA + C.FA)
    return wr, a, w, g


# ---------------------------------------------------------------------------- 손가락 말기 (기본 자세 형태를 바꾼다)
def curl_hand(s, angles, joints=(0.085, 0.115, 0.138), pivot_w=(0.020, 0.030, 0.036)):
    wr, a, w, g = hand_frame(s)
    n = a.cross(w).normalized()                       # +a를 +w(손바닥 쪽)로 돌리는 축
    ids = [i for i in range(len(P)) if vpart[i] == 'Hands' and P[i].x * s > 0.0]
    cu0 = {i: (P[i] - wr).dot(a) for i in ids}
    for kj, ang, pw in reversed(list(zip(joints, angles, pivot_w))):     # 끝마디부터
        piv = wr + a * kj + w * pw
        R = Matrix.Rotation(ang * DEG, 3, n)
        for i in ids:
            if cu0[i] > kj:
                P[i] = piv + R @ (P[i] - piv)
    return ids


def grip_hole(s, ids):
    """말린 손가락이 둘러싼 빈 곳의 중심(cu, cw)과 반지름. 손의 면 위에 점을 촘촘히 뽑아 2차원(cu, cw)으로 찾는다.
    둘레 8방향 가운데 6방향 이상에 손이 있어야(둘러싸여야) 후보로 본다."""
    wr, a, w, g = hand_frame(s)
    idset = set(ids)
    pts = []
    for f, pi in zip(F, FP):
        if ORDER[pi] != 'Hands' or not all(i in idset for i in f):
            continue
        A, B_, Cc = P[f[0]], P[f[1]], P[f[2]]
        for u in range(7):
            for v in range(7 - u):
                q = A + (B_ - A) * (u / 6) + (Cc - A) * (v / 6)
                r = q - wr
                if abs(r.dot(g)) < 0.04:
                    pts.append((r.dot(a), r.dot(w)))
    best = (0.0, None)
    for iu in range(33):
        cu = 0.04 + 0.10 * iu / 32
        for iw in range(33):
            cw = -0.01 + 0.11 * iw / 32
            dmin = 9.0
            dirs = set()
            for u, v in pts:
                dd = math.hypot(u - cu, v - cw)
                dmin = min(dmin, dd)
                if dd < 0.040:
                    dirs.add(int(((math.atan2(v - cw, u - cu) + math.pi) / (2 * math.pi)) * 8) % 8)
            if len(dirs) >= 6 and dmin > best[0]:
                best = (dmin, (cu, cw))
    return best


ids_R = curl_hand(-1, (78, 72, 38))
ids_L = curl_hand(1, (24, 26, 16))
hole = grip_hole(-1, ids_R)
print('grip hole (radius, (cu, cw)):', round(hole[0], 4), tuple(round(c, 4) for c in hole[1]) if hole[1] else None)
GRIP_C = hole[1] if hole[1] else (0.075, 0.045)
STAFF_R = 0.016

# ---------------------------------------------------------------------------- 지팡이: 오른쪽 앞에 세운다(뼈 'staff')
STAFF_B0 = V(-0.34, 0.0, 0.31)
GRIP = 1.13
sv = [i for i in range(len(P)) if vpart[i] == 'Staff']
sb = Vector((sum(P[i].x for i in sv) / len(sv), min(P[i].y for i in sv), sum(P[i].z for i in sv) / len(sv)))
for i in sv:
    q = P[i] - sb
    P[i] = STAFF_B0 + Vector((q.x, q.y, q.z))

# ---------------------------------------------------------------------------- 사람, 뼈대
pal = C.palette(CORD='#4A2E22', CORD_SH='#3A241A')
p = C.Person('MosesV2', C.MODEL_TOP, pal)
p.std_bones(veil=True, beard=True)
BN = p.BONES
BN['chest']['tail'] = V(0, 1.39, 0)
BN['neck'].update(head=V(0, 1.39, 0), tail=V(0, 1.465, 0.012))
BN['head'].update(head=V(0, 1.465, 0.012), tail=V(0, 1.72, 0.0))
BN['beard'].update(head=V(0, 1.475, 0.13), tail=V(0, 1.27, 0.18))
BN['veil'].update(head=V(0, 1.63, -0.09), tail=V(0, 1.36, -0.16))
p.bone('staff', STAFF_B0, STAFF_B0 + V(0, 1.0, 0), 'root')
print('bones', len(p.ORDER))


# ---------------------------------------------------------------------------- 가중치
def w_arm(q, s):
    """팔 축을 따라: 위팔 → 팔뚝 → (소매 끝) 소매 뼈, 손목 너머는 손."""
    sd = C.SD(s)
    S_ = C.SH(s)
    a = C.arm_dir(s)
    t = (q - S_).dot(a)
    f = sstep(C.UA - 0.06, C.UA + 0.06, t)
    hnd = sstep(ARM_LEN - 0.02, ARM_LEN + 0.015, t)
    return t, {'upperarm' + sd: (1 - f), 'forearm' + sd: f * (1 - hnd), 'hand' + sd: f * hnd}


def soften_legs(w, k=0.75):
    """다리를 따르는 몫을 줄여(엉덩이로 옮겨) 걸을 때 옷자락이 땅을 뚫지 않게 한다."""
    out = dict(w)
    moved = 0.0
    for key in list(out):
        if key.startswith('thigh') or key.startswith('shin'):
            moved += out[key] * (1 - k)
            out[key] *= k
    out['hips'] = out.get('hips', 0.0) + moved
    return out


def armpit(q, w):
    """진동 둘레의 몸판은 위팔을 조금 따른다(팔을 들 때 겨드랑이가 덜 늘어나게)."""
    for s in (1, -1):
        dd = (q - C.SH(s)).length
        if q.x * s > 0.08 and dd < 0.17:
            k_ = sstep(0.17, 0.08, dd) * 0.45
            out = {kk: v * (1 - k_) for kk, v in w.items()}
            out['upperarm' + C.SD(s)] = out.get('upperarm' + C.SD(s), 0.0) + k_
            return out
    return w


def weights(i):
    q = P[i]
    part = vpart[i]
    x, y, z = q
    if part == 'Staff':
        return {'staff': 1.0}
    if part in ('EyeL', 'EyeR', 'Brows', 'Mustache', 'Cord'):
        return {'head': 1.0}
    if part == 'Hands':
        return w_arm(q, 1 if x > 0 else -1)[1]
    if part == 'Body':
        h = sstep(1.425, 1.49, y)
        c = sstep(1.415, 1.375, y)
        return {'head': h, 'neck': (1 - h) * (1 - c), 'chest': (1 - h) * c}
    if part == 'Beard':
        b = sstep(1.50, 1.40, y)
        return {'head': 1 - b, 'beard': b}
    if part == 'HeadCloth':
        band = 1.63
        kk = sstep(band, 1.43, y) * 0.92
        tgt = 'veil' if z < -0.03 else 'chest'
        if tgt == 'chest' and abs(x) > 0.10:
            tgt = 'shoulder.L' if x > 0 else 'shoulder.R'
        return {'head': 1 - kk, tgt: kk}
    if part == 'Mantle':
        vg = VG.get(i)
        if vg and max(vg.get('slvL', 0.0), vg.get('slvR', 0.0)) > 0.0:   # 소매(만들 때 표시한 꼭짓점)
            s = 1 if vg.get('slvL', 0.0) >= vg.get('slvR', 0.0) else -1
            k_ = max(vg.get('slvL', 0.0), vg.get('slvR', 0.0))
            S_ = C.SH(s)
            a = C.arm_dir(s)
            t = (q - S_).dot(a)
            if True:
                sd = C.SD(s)
                f = sstep(C.UA - 0.06, C.UA + 0.06, t)
                sl = sstep(C.UA + 0.02, ARM_LEN, t) * 0.85
                wa = {'upperarm' + sd: 1 - f, 'forearm' + sd: f * (1 - sl), 'sleeve' + sd: f * sl}
                wb = C.w_cloak(q)
                out = {}
                for kk_, v in wb.items():
                    out[kk_] = out.get(kk_, 0) + v * (1 - k_)
                for kk_, v in wa.items():
                    out[kk_] = out.get(kk_, 0) + v * k_
                return out
        return armpit(q, soften_legs(C.w_cloak(q)))
    return soften_legs(C.w_body(q))                          # 속옷, 띠


for i, q in enumerate(P):
    w = {k_: v for k_, v in weights(i).items() if v > 1e-4}
    tot = sum(w.values())
    p.B.P.append(q)
    p.B.W.append({k_: v / tot for k_, v in w.items()})

# ---------------------------------------------------------------------------- 면과 색(면마다)
SCLERA = C.hexc('#E2D9CA')
CLOTH = {'Mantle', 'HeadCloth', 'Tunic', 'Sash'}
COL = dict(Mantle=pal.ROBE, HeadCloth=pal.CLOTH, Beard=pal.BEARD, Tunic=pal.TUNIC, Staff=pal.STAFF, Cord=pal.CORD,
           Sash=pal.BELT, Mustache=pal.BEARD, Brows=pal.BROW)
for f, pi in zip(F, FP):
    part = ORDER[pi]
    pts = [P[i] for i in f]
    cen = sum(pts, Vector()) / len(pts)
    nrm = Vector()
    for j in range(1, len(pts) - 1):
        nrm += (pts[j] - pts[0]).cross(pts[j + 1] - pts[0])
    nrm = nrm.normalized() if nrm.length > 0 else Z
    if part in ('Body', 'Hands'):
        col = pal.SKIN
        if abs(cen.x) < 0.03 * K / 0.9644 and 1.48 < cen.y < 1.51 and cen.z > 0.13:
            col = pal.LIP
    elif part in ('EyeL', 'EyeR'):
        dd = nrm.dot(Z)
        col = (0.03, 0.022, 0.018) if dd > 0.965 else (pal.EYE if dd > 0.83 else SCLERA)
        if nrm.y > 0.36 and dd < 0.96:
            col = pal.SKIN_SH
    else:
        col = COL[part]
    p.B.f(list(f), col, C.MAT_CLOTH if part in CLOTH else C.MAT_SOLID)
p.parts = [(k_, sum(len(f) - 2 for f, pi in zip(F, FP) if ORDER[pi] == k_)) for k_ in ORDER]


# ---------------------------------------------------------------------------- 자세 (moses.py에서 옮김)
def staff_frame(prm):
    up = Vector(prm['staff_dir']).normalized()
    q = Y.rotation_difference(up) @ C.Ry(prm['staff_yaw'])
    return Vector(prm['staff_B']), up, q


def apply_b2(prm):
    Pz = C.Pose(p.BONES)
    Pz.set('hips', C.Ry(prm['hip_yaw']), Vector(prm['hip_t']))
    Pz.set('spine', C.Rx(prm['spine']))
    Pz.set('chest', C.Ry(prm['chest_yaw']) @ C.Rx(prm['chest']))
    Pz.set('neck', C.Rx(prm['neck']))
    Pz.set('head', C.Ry(prm['head_yaw']) @ C.Rx(prm['head']) @ C.Rz(prm['head_roll']))
    Pz.set('beard', C.Rx(prm['beard']))
    Pz.set('veil', C.Rx(prm['veil']))
    Pz.set('shoulder.L', C.Rz(prm['clavL']) @ C.Ry(-prm['clavL_f']))
    Pz.set('shoulder.R', C.Rz(-prm['clavR']))
    for sd in ('.L', '.R'):
        Pz.set('thigh' + sd, C.Rx(-prm['th' + sd]))
        Pz.set('shin' + sd, C.Rx(prm['kn' + sd]))
    Bp, up, q = staff_frame(prm)
    Pz.set('staff', q, Bp - STAFF_B0)
    # 왼팔: 방향을 직접 준다
    C.set_arm(Pz, '.L', Vector(prm['UL']).normalized(), Vector(prm['FL']).normalized())
    Pz.set('hand.L', Quaternion(C.arm_dir(1).cross(Z).normalized(), prm['handL'] * DEG))
    # 오른팔: 말린 손가락 사이(GRIP_C)로 지팡이가 지나도록 푼다(2관절 IK)
    a = C.arm_dir(-1)
    g0 = Z.copy()
    w0 = g0.cross(a)
    Gp = Bp + up * GRIP
    S_ = Pz.D('shoulder.R') @ C.SH(-1)
    Fv = (Gp - S_).normalized()
    pole = Vector((-0.45, -0.75, -0.45))
    for it in range(5):
        u1 = (Fv - up * Fv.dot(up))
        u1 = u1.normalized() if u1.length > 1e-4 else Z.copy()
        u1 = (u1 + up * prm['wrist_tilt']).normalized()
        g1 = (up - u1 * up.dot(u1)).normalized()
        w1 = g1.cross(u1)
        Wp = Gp - (u1 * GRIP_C[0] + w1 * GRIP_C[1])
        U, Fv = C.ik2(S_, Wp, pole)
    C.set_arm(Pz, '.R', U, Fv)
    Rh = Matrix((u1, w1, g1)).transposed() @ Matrix((a, w0, g0))
    Pz.set_world_rot('hand.R', Rh)
    C.set_sleeve(Pz, '.L', prm['sagL'])
    C.set_sleeve(Pz, '.R', prm['sagR'])
    return Pz


p.apply = apply_b2


def base_prm():
    return dict(hip_yaw=0.0, hip_t=(0, 0, 0), spine=3.0, chest=5.0, chest_yaw=0.0, neck=7.0, head=-4.0, head_yaw=0.0, head_roll=0.0,
                beard=0.0, veil=0.0, clavL=0.0, clavR=0.0, clavL_f=0.0,
                UL=(0.15, -0.98, 0.06), FL=(0.10, -0.95, 0.30), handL=8.0,
                staff_B=(-0.345, 0.0, 0.315), staff_dir=(-0.035, 1.0, -0.06), staff_yaw=-50.0, wrist_tilt=0.12,
                sagL=0.03, sagR=0.045, **{'th.L': 0.0, 'kn.L': 0.0, 'th.R': 0.0, 'kn.R': 0.0})


def idle(t):
    q = base_prm()
    b = math.sin(2 * math.pi * t / 3.0)
    b2 = math.sin(2 * math.pi * t / 3.0 - 1.0)
    q['spine'] += 0.4 * b; q['chest'] -= 2.0 * b; q['neck'] += 0.4 * b; q['head'] += 1.3 * b
    q['head_yaw'] = 1.6 * b2
    q['clavL'] = 2.6 * b; q['clavR'] = 2.6 * b
    q['hip_t'] = (0.003 * b2, 0.0, 0.0)
    q['beard'] = -0.6 * b; q['veil'] = -0.5 * b
    q['UL'] = (0.15 + 0.006 * b2, -0.98, 0.06 + 0.01 * b)
    q['FL'] = (0.10 + 0.008 * b2, -0.95, 0.30 + 0.02 * b)
    return q


def walk(t):
    q = base_prm()
    ph = 2 * math.pi * t / 1.2
    s, c = math.sin(ph), math.cos(ph)
    q['th.L'] = 16 * s; q['kn.L'] = 24 * max(0.0, c) ** 1.2 + 3
    q['th.R'] = -16 * s; q['kn.R'] = 24 * max(0.0, -c) ** 1.2 + 3
    q['hip_t'] = (0.010 * s, 0.004 + 0.012 * abs(c), 0.0)
    q['hip_yaw'] = 4.0 * s
    q['spine'] = 5.0; q['chest'] = 6.0 + 0.8 * math.cos(2 * ph); q['chest_yaw'] = -7.0 * s
    q['neck'] = 7.0; q['head'] = -5.0 - 0.8 * math.cos(2 * ph + 0.6); q['head_yaw'] = 3.0 * s
    q['beard'] = 1.5 * math.cos(2 * ph + 1.0); q['veil'] = 2.5 * math.cos(2 * ph + 1.4)
    sw = -s
    q['UL'] = (0.15, -0.96, 0.05 + 0.26 * sw)
    q['FL'] = (0.11, -0.92, 0.34 + 0.34 * sw)
    q['staff_B'] = (-0.36, max(0.0, c) * 0.06, 0.30 + 0.17 * s)
    q['staff_dir'] = (-0.035, 1.0, -0.05 - 0.16 * s)
    return q


BROW = V(0, 1.637, 0.146)                    # 기본 자세의 눈썹 가운데(B-2 머리)


def hide_target():
    q = base_prm()
    q['spine'] = 5.0; q['chest'] = 9.0; q['neck'] = 17.0; q['head'] = 21.0; q['head_roll'] = 0.0; q['head_yaw'] = 4.0
    q['beard'] = -20.0; q['veil'] = -34.0
    q['clavL'] = 9.0; q['clavL_f'] = 12.0
    q['handL'] = 18.0
    q['sagL'] = 0.085
    # 왼팔: 팔뚝이 눈앞을 가로지르고 손이 얼굴 오른쪽 너머에 가도록(얼굴이 소매 안에 묻힌다)
    Pz = apply_b2(q)
    Dh = Pz.D('head')
    R = Dh.to_3x3()
    brow = Dh @ BROW
    Wt = brow + (R @ Z) * 0.050 + (R @ X) * -0.135 + Y * 0.012
    U, Fv = C.ik2(Pz.D('shoulder.L') @ C.SH(1), Wt, Vector((0.6, -0.15, 0.8)))
    q['UL'] = tuple(U); q['FL'] = tuple(Fv)
    return q


_HIDE = []


def hide(t):
    if not _HIDE:
        _HIDE.append(hide_target())
    a, b = idle(0.0), _HIDE[0]
    k = sstep(0.0, 0.74, t)
    k = k * k * (3 - 2 * k) * 0.5 + k * 0.5
    ka = sstep(0.0, 0.62, t)
    out = {}
    for key in a:
        kk = ka if key in ('UL', 'FL', 'handL', 'clavL', 'clavL_f', 'sagL') else k
        if isinstance(a[key], tuple):
            out[key] = tuple(lerp(a[key][i], b[key][i], kk) for i in range(len(a[key])))
        else:
            out[key] = lerp(a[key], b[key], kk)
    for key in ('UL', 'FL'):
        out[key] = tuple(Vector(a[key]).normalized().slerp(Vector(b[key]).normalized(), ka))
    return out


CLIPS = [('Idle', 3.0, idle), ('Walk', 1.2, walk), ('HideFace', 0.8, hide)]

bpy.ops.wm.read_factory_settings(use_empty=True)
C.run(p, CLIPS, OUT, max_tris=8000)
