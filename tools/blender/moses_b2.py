# -*- coding: utf-8 -*-
"""
인물 품질 실험 B-2 (docs/07_인물품질_개선실험_계획.md): 고품질 인체 베이스 메시에서 시작한 모세 정지 모델(A자세).

    <bpy 파이썬> tools/blender/moses_b2.py <human_base_meshes_bundle.blend> <출력.glb> [--tris 8000] [--blend 저장.blend]

- 얼굴·목·손: Blender Studio "Human Base Meshes" v1.4.1의 GEO-body_male_stylized (CC0, 작가 표기는 파일 안 자산 정보 참고)
  내려받기: https://download.blender.org/demo/asset-bundles/human-base-meshes/human-base-meshes-bundle-v1.4.1.zip
  (묶음 안 README는 "모든 자산 CC0"이라고 적고, 자산마다 license=CC0이다. 같은 파일의 "License" 글 한 줄은 다른 작품(Rain Rig)의
   CC BY 4.0 문구가 남은 것으로 보인다. 안전하게 출처를 표기한다: © Blender Foundation | studio.blender.org)
- 겉옷(소매 포함)·머리쓰개: 천 시뮬레이션으로 한 번 드리운 뒤 고정 메시로 굳힌다(게임에서 실시간으로 돌리지 않는다).
- 수염·콧수염·눈썹: 얼굴과 가슴 위에 광선을 쏘아 얹은 두께 지도(겹)로 만든다.
- 옷·수염의 주름은 주기가 일정하지 않은 여러 물결을 겹쳐 쓴다(기계적인 반복 주름을 피한다, docs/07 1.1).
- 색은 꼭짓점 색 + 반구 가림(AO). 재질 2개(Solid, Cloth). 내보내기 규격은 common.py와 같다(옷자락 끝 y=0, 정면 +Z, 키 1.7485).
- 1단계(정지 모델 비교)용이다. 뼈대와 동작은 고른 하나에만 2단계에서 넣는다.
- 성경 표현(docs/07 4절): 지팡이를 든 노년의 목자. 신은 옷자락으로 가린다. 수염·머리쓰개·옷 색은 본문에 없어 감수 대상이다.
"""
import bpy
import bmesh
import math
import os
import sys
import time
from mathutils import Vector
from mathutils.bvhtree import BVHTree

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402  (색, 내보내기 규격을 같이 쓴다)

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
BUNDLE, OUT = argv[0], argv[1]
MAX_TRIS = int(argv[argv.index('--tris') + 1]) if '--tris' in argv else 8000
SAVE_BLEND = argv[argv.index('--blend') + 1] if '--blend' in argv else None
DUMP = argv[argv.index('--dump') + 1] if '--dump' in argv else None   # 2단계(뼈대) 스크립트에 넘길 형태
EYE_SCALE = 0.88                   # 대표 결정(2026-11-14): 베이스 메시 눈을 조금 작게
FAST = '--fast' in argv            # 시험용: 천 시뮬레이션 프레임을 줄인다
# 인물 제작 라인(2026-11-15): --spec 인물.json 으로 모세 말고 다른 인물을 만든다(tools/blender/people/*.json).
#   colors: palette 덮어쓰기, beard: "full"|"none", staff: false(지팡이를 아주 작게 해 보이지 않게), spear: true(굵은 자루+창날),
#   helmet: true(머리쓰개 대신 투구), armor: true(겉옷·속옷에 비늘 무늬. 색은 rig가 칠한다). 모양의 본문 근거는 json의 note에 적는다.
import json
SPEC = json.load(open(argv[argv.index('--spec') + 1])) if '--spec' in argv else {}

pal = C.palette(**dict(dict(CORD='#4A2E22', CORD_SH='#3A241A'), **SPEC.get('colors', {})))
SCLERA = C.hexc('#E2D9CA')
DEG = math.pi / 180
t_start = time.time()


def log(*a):
    print('[b2 %5.1fs]' % (time.time() - t_start), *a, flush=True)


def hsh(i, s=0.0):
    v = math.sin(i * 127.1 + s * 311.7 + 0.5) * 43758.5453
    return v - math.floor(v)


def waves(u, v, seed, n=4, k0=7.0, k1=15.0, drift=0.0):
    """주기가 서로 다른 물결 n개를 겹친다. u: 둘레 각(라디안), v: 높이(0 위 ~ 1 아래). 값은 대략 -1..1."""
    s = 0.0
    tot = 0.0
    for i in range(n):
        k = k0 + (k1 - k0) * hsh(i, seed)
        ph = 6.283 * hsh(i + 17, seed)
        dr = drift * (hsh(i + 31, seed) - 0.5) * 2
        a = 0.55 + 0.45 * hsh(i + 47, seed)
        on = C.sstep(0.0, 0.35 + 0.5 * hsh(i + 61, seed), v)      # 주름마다 시작 높이가 다르다
        s += a * on * math.sin(k * u + ph + dr * v * 6.283)
        tot += a
    return s / max(tot, 1e-6) * 1.6


# ---------------------------------------------------------------------------- 장면과 베이스 메시
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
with bpy.data.libraries.load(BUNDLE, link=False) as (src, dst):
    dst.objects = ['GEO-body_male_stylized', 'GEO-body_male_stylized.eye.L', 'GEO-body_male_stylized.eye.R']
body, eyeL, eyeR = dst.objects
CX = None
for o in (body, eyeL, eyeR):
    sc.collection.objects.link(o)
bpy.context.view_layer.update()          # 불러온 물체의 위치·부모가 matrix_world에 반영되게
mws = {o.name: o.matrix_world.copy() for o in (body, eyeL, eyeR)}
for o in (body, eyeL, eyeR):
    o.modifiers.clear()
    o.animation_data_clear()
    o.data = o.data.copy()
    o.data.transform(mws[o.name])
    o.parent = None
    o.matrix_world.identity()
xs = [v.co.x for v in body.data.vertices]
CX = (min(xs) + max(xs)) / 2
for o in (body, eyeL, eyeR):
    for v in o.data.vertices:
        v.co.x -= CX
    o.data.update()
log('body', len(body.data.polygons), 'quads, center shift', round(CX, 4))

# 팔 축(측정값, 몸 좌표: z 위, -y 앞, +x 인물의 왼쪽)
SHO = {1: Vector((0.205, -0.005, 1.375)), -1: Vector((-0.205, -0.005, 1.375))}
WRI = {1: Vector((0.398, -0.01, 0.885)), -1: Vector((-0.398, -0.01, 0.885))}
HEAD_C = Vector((0.0, -0.02, 1.64))


def bvh_of(objs):
    verts, polys = [], []
    for o in objs:
        me = o.data
        b = len(verts)
        verts += [tuple(o.matrix_world @ v.co) for v in me.vertices]
        polys += [[b + i for i in p.vertices] for p in me.polygons]
    return BVHTree.FromPolygons(verts, polys), verts, polys


def push_out(p, axis_pt, bvhs, off, keep_outside=False):
    """축(axis_pt, 같은 높이)에서 p 쪽으로 뻗은 방향을 따라 바깥에서 광선을 쏘아 가장 바깥 면 위 off에 놓는다.
    keep_outside면 원래 점이 이미 더 바깥이면 그대로 둔다."""
    d = p - axis_pt
    d.z = 0.0
    if d.length < 1e-9:
        return p
    d.normalize()
    o = Vector((axis_pt.x, axis_pt.y, p.z)) + d * 0.9
    best = None
    for bv in bvhs:
        h = bv.ray_cast(o, -d, 0.9)
        if h[0] is not None and (best is None or h[3] < best[3]):
            best = h
    if best is None:
        return p
    q = best[0] + d * off
    q.z = p.z
    if keep_outside and (p - axis_pt).length > (q - axis_pt).length:
        return p
    return q


def mesh_obj(name, verts, faces, link=True):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], faces)
    me.update()
    ob = bpy.data.objects.new(name, me)
    if link:
        sc.collection.objects.link(ob)
    return ob


def grid_faces(nr, nc, wrap=False, keep=None):
    F = []
    cols = nc if wrap else nc - 1
    for r in range(nr - 1):
        for c in range(cols):
            c2 = (c + 1) % nc
            q = [r * nc + c, r * nc + c2, (r + 1) * nc + c2, (r + 1) * nc + c]
            if keep is None or keep(r, c):
                F.append(q)
    return F


def bake_cloth(ob, frames, pin=None, colliders=(), quality=6, self_col=False, mass=0.3, bend=0.6, shrink=0.0):
    """천 시뮬레이션을 frames만큼 돌린 뒤 결과 메시로 바꾼다."""
    for c in colliders:
        if not any(m.type == 'COLLISION' for m in c.modifiers):
            m = c.modifiers.new('col', 'COLLISION')
        c.collision.thickness_outer = 0.006
        c.collision.cloth_friction = 8.0
    m = ob.modifiers.new('cloth', 'CLOTH')
    st = m.settings
    st.quality = quality
    st.mass = mass
    st.bending_stiffness = bend
    st.tension_stiffness = 40
    st.compression_stiffness = 30
    st.shear_stiffness = 8
    st.air_damping = 1.5
    st.shrink_min = shrink
    if pin is not None:
        st.vertex_group_mass = pin
        st.pin_stiffness = 1.0
    cs = m.collision_settings
    cs.use_collision = True
    cs.distance_min = 0.004
    cs.collision_quality = 3
    cs.use_self_collision = self_col
    cs.self_distance_min = 0.004
    m.point_cache.frame_start = 1
    m.point_cache.frame_end = frames
    sc.frame_start, sc.frame_end = 1, frames
    t = time.time()
    for f in range(1, frames + 1):
        sc.frame_set(f)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    ob.modifiers.clear()
    old = ob.data
    ob.data = me
    bpy.data.meshes.remove(old)
    sc.frame_set(1)
    log('cloth', ob.name, frames, 'frames', round(time.time() - t, 1), 's')
    return ob


# ---------------------------------------------------------------------------- 충돌용 몸(낮은 해상도)
proxy = body.copy()
proxy.data = body.data.copy()
proxy.name = 'Proxy'
sc.collection.objects.link(proxy)
dm = proxy.modifiers.new('dec', 'DECIMATE')
dm.ratio = 0.25
dg = bpy.context.evaluated_depsgraph_get()
pm = bpy.data.meshes.new_from_object(proxy.evaluated_get(dg))
proxy.modifiers.clear()
proxy.data = pm
ground = mesh_obj('Ground', [(-2, -2, 0), (2, -2, 0), (2, 2, 0), (-2, 2, 0)], [[0, 1, 2, 3]])
log('proxy', len(pm.polygons))


# ---------------------------------------------------------------------------- 몸통 단면(겉옷이 지나는 자리)
def sec(z):
    """높이 z에서 겉옷 단면 (중심 y, 반지름 x, 반지름 y). 어깨에서 옷자락까지 폭과 두께가 달라진다(docs/07 1.1)."""
    ks = [(1.475, 0.0, 0.088, 0.082), (1.445, -0.004, 0.17, 0.12), (1.405, -0.008, 0.262, 0.15),
          (1.30, -0.014, 0.205, 0.158), (1.12, -0.03, 0.178, 0.165), (0.95, -0.026, 0.19, 0.162),
          (0.62, -0.02, 0.225, 0.18), (0.30, -0.02, 0.27, 0.205), (0.0, -0.02, 0.31, 0.235)]
    if z >= ks[0][0]:
        return ks[0][1:]
    for a, b in zip(ks, ks[1:]):
        if b[0] <= z <= a[0]:
            t = (a[0] - z) / (a[0] - b[0])
            t = t * t * (3 - 2 * t)
            return tuple(a[i] + (b[i] - a[i]) * t for i in (1, 2, 3))
    return ks[-1][1:]


def sec_pt(th, z, off=0.0):
    """th: 앞(-y)에서 인물 왼쪽(+x)으로 도는 각. 초타원 단면 위의 점."""
    cy, rx, ry = sec(z)
    r = C.srad(th, rx + off, ry + off, 2.6)
    return Vector((r * math.sin(th), cy - r * math.cos(th), z))


# ---------------------------------------------------------------------------- 속옷(앞 트임 사이로 보이는 통옷)과 띠
def opening(z):
    """겉옷 앞 트임의 반각. 가슴은 좁고 아래로 넓어진다."""
    return (13 + 15 * C.sstep(1.35, 0.15, z)) * DEG


def build_tunic():
    NC, ZS = 26, [1.48 - i * 0.03 for i in range(50)] + [0.0]
    V, F = [], []
    for z in ZS:
        a = opening(z) + 16 * DEG
        for c in range(NC):
            th = -a + 2 * a * c / (NC - 1)
            p = sec_pt(th, z, -0.018 if z < 1.44 else -0.006)
            # 띠 아래로 늘어진 통옷의 잔주름(형태로 보이게 약하게)
            w = waves(th * 3, C.clamp((1.0 - z) / 1.0), 3.1, n=3, k0=4, k1=9) * 0.004 * C.sstep(0.95, 0.5, z)
            p.y -= w
            V.append(p)
    F = grid_faces(len(ZS), NC)
    return mesh_obj('Tunic', V, F)


def build_sash():
    """허리띠(파란 띠)와 앞에 늘어뜨린 두 가닥."""
    V, F = [], []
    zt, zb = 1.0, 0.94
    NC = 24
    for z in (zt, zb):
        for c in range(NC):
            th = -40 * DEG + 80 * DEG * c / (NC - 1)
            V.append(sec_pt(th, z, -0.008))
    F += grid_faces(2, NC)
    for side, x0, ln in ((1, -0.012, 0.36), (2, 0.026, 0.30)):
        b = len(V)
        n = 10
        for i in range(n + 1):
            z = zb - ln * i / n
            p = sec_pt(0, z, -0.004)
            sway = 0.006 * math.sin(i * 0.9 + side)
            for dx in (-0.019, 0.019):
                V.append(Vector((x0 + dx + sway, p.y - 0.006, z)))
        for i in range(n):
            F.append([b + 2 * i, b + 2 * i + 1, b + 2 * i + 3, b + 2 * i + 2])
    return mesh_obj('Sash', V, F)


# ---------------------------------------------------------------------------- 겉옷: 몸판(앞이 열림, 진동 구멍) + 소매 두 개 → 한 물체로 천 시뮬레이션
def build_mantle():
    V, F, PIN = [], [], []
    SLV = {}                               # 소매 꼭짓점: (쪽, 소매를 따라간 정도 0..1). 뼈대 단계에서 가중치에 쓴다
    ZS = [1.475, 1.462, 1.448, 1.434, 1.42, 1.405] + [1.39 - i * 0.022 for i in range(64)]
    ZS = [z for z in ZS if z > 0.03] + [0.03]
    NC = 96
    # 몸판: 앞 가운데(th=0)에서 트이고, 둘레를 한 바퀴 돈다
    rows = []
    for ri, z in enumerate(ZS):
        a = opening(z)
        row = []
        for c in range(NC):
            th = a + (2 * math.pi - 2 * a) * c / (NC - 1)
            v = C.clamp((1.42 - z) / 1.42)
            # 주름: 어깨뼈와 가슴에서 시작해 옷자락으로 갈수록 깊어진다. 앞자락 가장자리는 덜 접힌다.
            edge = C.sstep(0.0, 0.5, min(th - a, 2 * math.pi - a - th))
            fold = waves(th, v, 1.7, n=6, k0=6.0, k1=17.0, drift=0.35) * (0.004 + 0.03 * v ** 1.3) * edge
            p = sec_pt(th, z, 0.022 + fold)
            if z >= 1.33:                     # 목·어깨 둘레는 몸 표면에 붙인다(어깨가 뿔처럼 서지 않게)
                cy = sec(z)[0]
                q = push_out(p, Vector((0.0, cy, z)), [BODY_BVH], 0.013)
                p = q.lerp(p, 0.0 if z >= 1.37 else C.clamp((1.37 - z) / 0.04))
            row.append(len(V))
            V.append(p)
            PIN.append(1.0 if z >= 1.40 else (0.0 if z < 1.34 else (z - 1.34) / 0.06 * 0.7))
        rows.append(row)

    # 진동: 어깨선(z 1.405)에서 겨드랑이(z 1.16)까지, 옆구리의 직사각형 칸을 비우고 그 테두리에서 소매를 뽑는다(한 장의 옷)
    ra = min(range(len(ZS)), key=lambda i: abs(ZS[i] - 1.405))
    rb = min(range(len(ZS)), key=lambda i: abs(ZS[i] - 1.16))

    def col_of(deg):
        a0 = opening(1.30)
        return int(round((deg * DEG - a0) / (2 * math.pi - 2 * a0) * (NC - 1)))
    holes = {1: (col_of(52), col_of(128)), -1: (col_of(232), col_of(308))}
    for r in range(len(ZS) - 1):
        for c in range(NC - 1):
            if any(ra <= r < rb and h0 <= c < h1 for h0, h1 in holes.values()):
                continue
            F.append([rows[r][c], rows[r][c + 1], rows[r + 1][c + 1], rows[r + 1][c]])
    for s_ in (1, -1):
        ca, cb = holes[s_]
        loop = [rows[ra][c] for c in range(ca, cb + 1)] + [rows[r][cb] for r in range(ra + 1, rb + 1)] + \
               [rows[rb][c] for c in range(cb - 1, ca - 1, -1)] + [rows[r][ca] for r in range(rb - 1, ra, -1)]
        A, B = SHO[s_] + Vector((0.0, 0.0, 0.01)), WRI[s_] + Vector((0.0, 0.0, -0.012))
        ax = (B - A).normalized()
        u1 = ax.cross(Vector((0, -1, 0))).normalized()
        u2 = ax.cross(u1).normalized()
        phis = []
        for vi in loop:
            w = V[vi] - A
            w = w - ax * w.dot(ax)
            phis.append(math.atan2(w.dot(u2), w.dot(u1)))
        for j in range(1, len(phis)):                 # 각을 이어지게 편다
            while phis[j] - phis[j - 1] > math.pi:
                phis[j] -= 2 * math.pi
            while phis[j] - phis[j - 1] < -math.pi:
                phis[j] += 2 * math.pi
        NR = 22
        prev = loop
        n = len(loop)
        for k in range(1, NR + 1):
            t = k / NR
            cen = A.lerp(B, t)
            r = 0.086 - 0.012 * C.sstep(0.0, 0.3, t) + 0.056 * C.sstep(0.45, 1.0, t) ** 1.4
            bl = C.sstep(0.0, 0.30, t)
            ring = []
            for j, vi in enumerate(loop):
                ph = phis[j]
                rr = r * (1.0 + 0.10 * waves(ph, t, 5.3 + s_, n=4, k0=3, k1=7) * C.sstep(0.3, 1.0, t))
                circ = cen + (u1 * math.cos(ph) + u2 * math.sin(ph)) * rr
                ring.append(len(V))
                SLV[len(V)] = (s_, t)
                V.append(V[vi].lerp(circ, bl))
                PIN.append(0.45 if k == 1 else (0.2 if k == 2 else 0.0))
            for j in range(n):
                j2 = (j + 1) % n
                F.append([prev[j], prev[j2], ring[j2], ring[j]])
            prev = ring
    ob = mesh_obj('Mantle', V, F)
    g = ob.vertex_groups.new(name='pin')
    for i, w in enumerate(PIN):
        if w > 0:
            g.add([i], w, 'REPLACE')
    gl, gr, gt = (ob.vertex_groups.new(name=n) for n in ('slvL', 'slvR', 'slvT'))
    for i, (sd_, t) in SLV.items():
        (gl if sd_ > 0 else gr).add([i], C.sstep(0.0, 0.22, t) * 0.999 + 0.001, 'REPLACE')
        gt.add([i], max(0.001, t), 'REPLACE')
    return ob


# ---------------------------------------------------------------------------- 머리쓰개(정수리 덮개 + 어깨로 늘어진 천), 머리끈
BAND_Z_FRONT, BAND_Z_BACK = 1.748, 1.692
HR = (0.142, 0.125, 0.155)      # 머리 타원체 반지름 x, y, z (측정값)


def band_z(th):
    return BAND_Z_BACK + (BAND_Z_FRONT - BAND_Z_BACK) * (0.5 + 0.5 * math.cos(th))


HEAD_BVH = None
BAND = []


def on_head(p, off):
    """머리 바깥에서 머리 중심 쪽으로 광선을 쏘아 머리 표면 위 off만큼 띄운 점."""
    d = (p - HEAD_C)
    d.z *= 0.6
    d = d.normalized()
    o = HEAD_C + d * 0.5
    h = HEAD_BVH.ray_cast(o, -d, 0.6)
    if h[0] is None:
        return p
    return h[0] + d * off


def smooth_ring(pts, it=3, w=0.5):
    n = len(pts)
    for _ in range(it):
        out = []
        for i in range(n):
            a, b, c = pts[(i - 1) % n], pts[i], pts[(i + 1) % n]
            q = b.lerp((a + c) * 0.5, w)
            q.z = b.z
            out.append(q)
        pts = out
    return pts


def build_headcloth():
    """머리쓰개를 직접 만든다(천 시뮬레이션을 쓰면 얇은 천이 찢어져 보여서 뺐다).
    정수리 덮개는 머리 표면을 따라, 머리끈 아래는 얼굴 앞(±55도)을 비우고 옆과 뒤로 어깨까지 늘어진다."""
    V, F = [], []
    NC = 72
    rows = []
    NCAP = 12
    cz = HEAD_C.z + HR[2]
    for i in range(1, NCAP + 1):
        ring = []
        for c in range(NC):
            th = 2 * math.pi * c / NC
            zt = cz + (band_z(th) - cz) * (i / NCAP) ** 0.9
            q = C.clamp((cz - zt) / HR[2])
            rad = math.sqrt(max(0.0, 1 - (1 - q) ** 2))
            p = Vector((HEAD_C.x + math.sin(th) * HR[0] * rad, HEAD_C.y - math.cos(th) * HR[1] * rad, zt))
            ring.append(on_head(p, 0.012 + 0.006 * (i / NCAP)))
        ring = smooth_ring(ring, 4)
        if i == NCAP:
            BAND.extend(p.copy() for p in ring)
        rows.append(ring)
    NDR = 16
    for i in range(1, NDR + 1):
        t = i / NDR
        ring = []
        for c in range(NC):
            th = 2 * math.pi * c / NC
            bz = band_z(th)
            hem = 1.385 + 0.025 * waves(th, 1.0, 2.2, n=3, k0=2, k1=5)
            z = bz - (bz - hem) * t ** 1.05
            bp = BAND[c]
            out = Vector((math.sin(th), -math.cos(th), 0))
            p = Vector((bp.x, bp.y + 0.025 * t, z)) + out * (0.006 + 0.09 * t ** 1.4)
            p = push_out(p, Vector((HEAD_C.x, HEAD_C.y, z)), [BODY_BVH, MANTLE_BVH], 0.018 + 0.008 * t, keep_outside=True)
            ring.append(p)
        ring = smooth_ring(ring, 5)
        # 주름: 머리끈에서 시작해 아래로 갈수록 깊어진다(주기가 일정하지 않게)
        for c in range(NC):
            th = 2 * math.pi * c / NC
            out = Vector((math.sin(th), -math.cos(th), 0))
            ring[c] = ring[c] + out * (0.011 * t * waves(th, t, 9.2, n=5, k0=5, k1=12, drift=0.2))
        rows.append(ring)
    for ring in rows:
        V.extend(ring)
    for r in range(len(rows) - 1):
        for c in range(NC):
            c2 = (c + 1) % NC
            th = 2 * math.pi * (c + 0.5) / NC
            if r >= NCAP - 1 and (th < 55 * DEG or th > 305 * DEG):
                continue
            F.append([r * NC + c, r * NC + c2, (r + 1) * NC + c2, (r + 1) * NC + c])
    top = len(V)
    V.append(Vector((HEAD_C.x, HEAD_C.y, cz + 0.018)))
    for c in range(NC):
        F.append([top, (c + 1) % NC, c])
    return mesh_obj('HeadCloth', V, F)


def build_cord():
    """머리끈 두 겹: 머리쓰개 머리끈 자리(BAND) 바로 바깥을 따라 감는다."""
    V, F = [], []
    NB, NS = len(BAND), 8
    for dz, rr in ((0.011, 0.0100), (-0.010, 0.0100)):
        base = len(V)
        for c in range(NB):
            bp = BAND[c]
            out = Vector((bp.x - HEAD_C.x, bp.y - HEAD_C.y, 0.0)).normalized()
            cen = bp + out * 0.009 + Vector((0, 0, dz))
            for j in range(NS):
                ph = 2 * math.pi * j / NS
                V.append(cen + out * math.cos(ph) * rr + Vector((0, 0, 1)) * math.sin(ph) * rr)
        for c in range(NB):
            c2 = (c + 1) % NB
            for j in range(NS):
                j2 = (j + 1) % NS
                F.append([base + c * NS + j, base + c2 * NS + j, base + c2 * NS + j2, base + c * NS + j2])
    return mesh_obj('Cord', V, F)


# ---------------------------------------------------------------------------- 지팡이(왼손, 마디 셋)
def build_staff():
    V, F = [], []
    NS = 7
    x0, y0 = 0.415, -0.012                 # 왼손 손바닥을 지난다(쥔 모양은 2단계 뼈대에서)
    pts = []
    n = 24
    for i in range(n + 1):
        z = -0.0 + 1.66 * i / n
        bend = 0.012 * math.sin(z * 2.1 + 0.4) + 0.006 * math.sin(z * 5.3)
        pts.append(Vector((x0 + bend, y0 + 0.008 * math.sin(z * 3.1), z)))
    for i, p in enumerate(pts):
        z = p.z
        knot = 1.0 + 0.35 * sum(C.gauss(z - kz, 0.018) for kz in (0.42, 0.90, 1.35))
        r = (0.017 - 0.003 * z / 1.66) * knot
        for j in range(NS):
            ph = 2 * math.pi * j / NS
            V.append(p + Vector((math.cos(ph) * r, math.sin(ph) * r, 0)))
    for i in range(n):
        for j in range(NS):
            j2 = (j + 1) % NS
            F.append([i * NS + j, i * NS + j2, (i + 1) * NS + j2, (i + 1) * NS + j])
    top = len(V)
    V.append(pts[-1] + Vector((0, 0, 0.012)))
    for j in range(NS):
        F.append([n * NS + j, n * NS + (j + 1) % NS, top])
    return mesh_obj('Staff', V, F)


# ---------------------------------------------------------------------------- 얼굴 위에 얹는 겹(수염, 콧수염, 눈썹)
def relief(name, bvh, xs, zs, mask, thick, hang=None, front_env=None):
    """앞(-y)에서 광선을 쏘아 맞은 면 위에 두께 thick(x,z)만큼 띄운 겹을 만든다. mask(x,z)>0인 칸만.
    hang이 있으면 위에서 아래로 내려가며 앞쪽(-y)으로 나온 정도를 유지해, 턱 아래에서 목으로 파고들지 않고 늘어진다."""
    nx, nz = len(xs), len(zs)
    idx = {}
    V = []
    pos = {}
    for iz, z in enumerate(zs):
        for ix, x in enumerate(xs):
            if mask(x, z) <= 0:
                continue
            hit = bvh.ray_cast(Vector((x, -1.0, z)), Vector((0, 1, 0)))
            if hit[0] is None:
                continue
            p, n = hit[0], hit[1]
            if n.y > 0:
                n = -n
            d = (n + Vector((0, -0.6, 0))).normalized()
            pos[(ix, iz)] = p + d * thick(x, z)
    if front_env:
        for iz in range(nz):
            row = [(ix, pos[(ix, iz)]) for ix in range(nx) if (ix, iz) in pos]
            if not row or zs[iz] > front_env:
                continue
            ymin = min(q.y for _, q in row)
            xs_r = [xs[ix] for ix, _ in row]
            half = (max(xs_r) - min(xs_r)) / 2 + 1e-6
            xc = (max(xs_r) + min(xs_r)) / 2
            for ix, q in row:
                u = (xs[ix] - xc) / half
                q.y = min(q.y, ymin - thick(xs[ix], zs[iz]) * 0.9 + 0.022 * u * u)
    if hang is not None:
        for ix in range(nx):
            prev = None
            for iz in reversed(range(nz)):
                if (ix, iz) not in pos:
                    prev = None
                    continue
                q = pos[(ix, iz)]
                if prev is not None:
                    q.y = min(q.y, prev.y + hang * (prev.z - q.z))
                prev = q
    for k, q in pos.items():
        idx[k] = len(V)
        V.append(q)
    F = []
    for iz in range(nz - 1):
        for ix in range(nx - 1):
            q = [(ix, iz), (ix, iz + 1), (ix + 1, iz + 1), (ix + 1, iz)]
            if all(k in idx for k in q):
                F.append([idx[k] for k in reversed(q)])     # 앞(-y)을 보게
    return mesh_obj(name, V, F)


def frange(a, b, n):
    return [a + (b - a) * i / (n - 1) for i in range(n)]


# ---------------------------------------------------------------------------- 만들기
BODY_BVH = bvh_of([body])[0]
tunic = build_tunic()
sash = build_sash()
mantle = build_mantle()
log('mantle verts', len(mantle.data.vertices), 'faces', len(mantle.data.polygons))
bm = bmesh.new()
bm.from_mesh(mantle.data)
bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
bm.to_mesh(mantle.data)
bm.free()
bake_cloth(mantle, 30 if FAST else 70, pin='pin', colliders=[proxy, ground, tunic], quality=7, self_col=True, mass=0.35, bend=0.9)
bm = bmesh.new()
bm.from_mesh(mantle.data)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
bm.to_mesh(mantle.data)
bm.free()

HEAD_BVH = BODY_BVH
MANTLE_BVH = bvh_of([mantle])[0]
headcloth = build_headcloth()
cord = build_cord()
staff = build_staff()
if SPEC.get('staff') is False or SPEC.get('spear'):
    # 지팡이 없음: 뼈대 스크립트가 쥔 손을 맞추도록 아주 작게만 남긴다. 창: 자루를 굵게, 꼭대기에 창날
    sv_ = staff.data.vertices
    z0 = min(v.co.z for v in sv_)
    cx = sum(v.co.x for v in sv_) / len(sv_)
    cy = sum(v.co.y for v in sv_) / len(sv_)
    for v in sv_:
        if SPEC.get('spear'):
            v.co.x = cx + (v.co.x - cx) * 1.9
            v.co.y = cy + (v.co.y - cy) * 1.9
        else:
            v.co.x = cx + (v.co.x - cx) * 0.02
            v.co.y = cy + (v.co.y - cy) * 0.02
            v.co.z = z0 + 0.95 + (v.co.z - z0) * 0.01
    if SPEC.get('spear'):
        ztop = max(v.co.z for v in sv_)
        bm_ = bmesh.new()
        bm_.from_mesh(staff.data)
        ring = [bm_.verts.new((cx + math.cos(2 * math.pi * j / 6) * 0.045, cy + math.sin(2 * math.pi * j / 6) * 0.018, ztop)) for j in range(6)]
        tip = bm_.verts.new((cx, cy, ztop + 0.36))
        for j in range(6):
            bm_.faces.new((ring[j], ring[(j + 1) % 6], tip))
        bm_.faces.new(list(reversed(ring)))
        bm_.to_mesh(staff.data)
        bm_.free()
    staff.data.update()
if SPEC.get('helmet'):
    # 투구(삼상 17:5): 머리 위를 덮는 둥근 덮개와 테. 머리쓰개 자리(HeadCloth)를 대신한다
    V_, F_ = [], []
    NA, NE = 28, 9
    for e in range(NE + 1):
        el = -0.32 + (math.pi / 2 + 0.32) * e / NE
        for a in range(NA):
            az = 2 * math.pi * a / NA
            V_.append(Vector((HEAD_C.x + math.cos(el) * math.sin(az) * HR[0] * 1.13, HEAD_C.y - math.cos(el) * math.cos(az) * HR[1] * 1.13,
                              HEAD_C.z + 0.02 + math.sin(el) * HR[2] * 1.06)))
    for e in range(NE):
        for a in range(NA):
            a2 = (a + 1) % NA
            F_.append([e * NA + a, e * NA + a2, (e + 1) * NA + a2, (e + 1) * NA + a])
    b0 = len(V_)
    for a in range(NA):
        az = 2 * math.pi * a / NA
        V_.append(Vector((HEAD_C.x + math.sin(az) * HR[0] * 1.24, HEAD_C.y - math.cos(az) * HR[1] * 1.24, HEAD_C.z + 0.02 - math.sin(0.32) * HR[2])))
    for a in range(NA):
        a2 = (a + 1) % NA
        F_.append([a, b0 + a, b0 + a2, a2])
    bpy.data.objects.remove(headcloth)
    headcloth = mesh_obj('HeadCloth', V_, F_)

# 얼굴·몸: 보이는 곳만 남긴다(머리·목, 손). 몸통·팔·다리는 옷 안이라 지운다.
bm = bmesh.new()
bm.from_mesh(body.data)
kill = []
for v in bm.verts:
    p = v.co
    head = p.z > 1.43
    hand = p.z < 0.93 and abs(p.x) > 0.33
    if not (head or hand):
        kill.append(v)
bmesh.ops.delete(bm, geom=kill, context='VERTS')
bm.to_mesh(body.data)
bm.free()
body.data.update()
# 손은 따로 줄인다(머리와 같이 줄이면 손에 삼각형이 너무 적어 쥔 손이 각진 덩어리가 된다)
hands = body.copy()
hands.data = body.data.copy()
hands.name = 'Hands'
sc.collection.objects.link(hands)
for ob_, keep_head in ((body, True), (hands, False)):
    bm = bmesh.new()
    bm.from_mesh(ob_.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if (v.co.z > 1.0) != keep_head], context='VERTS')
    bm.to_mesh(ob_.data)
    bm.free()
    ob_.data.update()

# 수염 겹: 얼굴과 (겉옷·속옷) 가슴 위
face_bvh, _, _ = bvh_of([body, tunic, mantle])


def relief_grid(bvh, nu, nv, at, thick, hang=None, front_env=None):
    """at(i, j) -> (x, z, u, v): 수염 모양을 따라 짠 격자(윤곽이 계단처럼 깨지지 않게). 나머지는 relief와 같다."""
    pos, uv = {}, {}
    for j in range(nv):
        for i in range(nu):
            x, z, u, v = at(i, j)
            hit = bvh.ray_cast(Vector((x, -1.0, z)), Vector((0, 1, 0)))
            if hit[0] is None:
                continue
            p, nn = hit[0], hit[1]
            if nn.y > 0:
                nn = -nn
            bias = 0.6 * C.sstep(1.53, 1.49, z)           # 턱 아래로만 앞으로 기울여 띄운다(볼은 면을 따라)
            d = (nn + Vector((0, -bias, 0))).normalized()
            pos[(i, j)] = p + d * thick(x, z, u, v)
            uv[(i, j)] = (x, z, u, v)
    if front_env is not None:
        for j in range(nv):
            row = [i for i in range(nu) if (i, j) in pos]
            if not row or uv[(row[0], j)][1] > front_env:
                continue
            ymin = min(pos[(i, j)].y for i in row)
            for i in row:
                x, z, u, v = uv[(i, j)]
                k = C.sstep(front_env, front_env - 0.04, z)     # 턱 바로 아래부터 서서히
                tgt = ymin - thick(x, z, u, v) * 0.9 + 0.024 * u * u
                pos[(i, j)].y = min(pos[(i, j)].y, pos[(i, j)].y + (tgt - pos[(i, j)].y) * k)
    if hang is not None:
        for i in range(nu):
            prev = None
            for j in range(nv):                      # j: 위(0) → 아래
                if (i, j) not in pos:
                    prev = None
                    continue
                q = pos[(i, j)]
                if prev is not None:
                    q.y = min(q.y, prev.y + hang * (prev.z - q.z))
                prev = q
    idx, V, F = {}, [], []
    for k, q in pos.items():
        idx[k] = len(V)
        V.append(q)
    for j in range(nv - 1):
        for i in range(nu - 1):
            q = [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]
            if all(k in idx for k in q):
                F.append([idx[k] for k in q])
    return V, F


def beard_mesh_parts():
    """수염 한 장: u는 왼쪽 구레나룻(-1) → 턱 가운데(0) → 오른쪽 구레나룻(+1), v는 위 경계(0) → 바깥 윤곽(1).
    위 경계는 구레나룻에서 볼을 따라 입꼬리, 아랫입술 밑으로 이어진다(입은 비운다). 바깥 윤곽은 턱선에서 가슴 위 끝(1.305)까지."""
    NU, NV = 31, 16

    def U(u):
        s_, a = (1 if u >= 0 else -1), abs(u)
        if a >= 0.42:
            k = C.sstep(1.0, 0.42, a)
            return s_ * (0.106 - 0.058 * k), 1.607 - 0.056 * k
        k = a / 0.42
        return s_ * 0.048 * k, 1.538 + 0.013 * C.sstep(0.0, 1.0, k)

    def L(u):
        s_, a = (1 if u >= 0 else -1), abs(u)
        return s_ * 0.114 * math.sin(a * math.pi / 2) ** 0.75, 1.305 + 0.245 * a ** 1.5

    # 같은 높이에서 가장 앞에 있는 면(얼굴·옷)의 y. 턱 아래 수염은 이보다 앞에 늘어진다.
    env = {}

    def env_y(z):
        k = round(z, 3)
        if k not in env:
            ys = []
            for x in [i * 0.012 - 0.12 for i in range(21)]:
                h = face_bvh.ray_cast(Vector((x, -1.0, z)), Vector((0, 1, 0)))
                if h[0] is not None:
                    ys.append(h[0].y)
            env[k] = min(ys) if ys else -0.15
        return env[k]
    pos = {}
    for j in range(NV):
        v = j / (NV - 1)
        for i in range(NU):
            u = -1 + 2 * i / (NU - 1)
            (x0, z0), (x1, z1) = U(u), L(u)
            x, z = x0 + (x1 - x0) * v, z0 + (z1 - z0) * v
            a = abs(u)
            T = 0.010 + 0.030 * (1 - a) ** 1.3 * C.sstep(1.56, 1.47, z)
            strands = 0.004 * waves(u * 3.4, v, 4.4, n=5, k0=3, k1=8) * C.sstep(0.0, 0.3, v)
            th = 0.0012 + (T + strands) * math.sin(math.pi * min(1.0, v * 1.15)) ** 0.55 * (1 - a ** 6)
            hit = face_bvh.ray_cast(Vector((x, -1.0, z)), Vector((0, 1, 0)))
            if hit[0] is None:
                continue
            p, nn = hit[0], hit[1]
            if nn.y > 0:
                nn = -nn
            bias = 0.6 * C.sstep(1.53, 1.49, z)
            q = p + (nn + Vector((0, -bias, 0))).normalized() * th
            k = C.sstep(1.515, 1.47, z)                  # 턱 아래: 가장 앞의 면보다 앞에(둥글게)
            w = abs(L(u)[0]) + 1e-3
            tgt = env_y(z) - th * 0.9 + 0.026 * (x / 0.114) ** 2
            q.y = min(q.y, q.y + (tgt - q.y) * k)
            pos[(i, j)] = q
    for i in range(NU):                              # 위에서 아래로 늘어지게(목으로 파고들지 않게)
        prev = None
        for j in range(NV):
            q = pos.get((i, j))
            if q is None:
                prev = None
                continue
            if prev is not None and q.z < prev.z:
                q.y = min(q.y, prev.y + 0.35 * (prev.z - q.z))
            prev = q
    idx, V, F = {}, [], []
    for k_, q in pos.items():
        idx[k_] = len(V)
        V.append(q)
    for j in range(NV - 1):
        for i in range(NU - 1):
            qd = [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]
            if all(k_ in idx for k_ in qd):
                F.append([idx[k_] for k_ in qd])
    return V, F


BEARD_PARTS = beard_mesh_parts()


def mus_at(i, j, NU=17, NV=4):
    """콧수염 한 장: 코 밑 가운데를 지나 양쪽 입꼬리 바깥 아래로 흘러내려 수염 위 경계와 만난다."""
    u = -1 + 2 * i / (NU - 1)
    v = j / (NV - 1)
    a = abs(u)
    x = u * 0.058
    zc = 1.570 - 0.034 * C.sstep(0.30, 1.0, a)
    half = 0.009 + 0.004 * math.sin(min(1.0, a * 1.4) * math.pi) - 0.004 * C.sstep(0.8, 1.0, a)
    return x, zc + half * (1 - 2 * v), (v * 2 - 1), a


def mus_thick(x, z, u, v):
    return 0.0015 + 0.008 * (1 - abs(u) ** 2) * (1 - 0.5 * v)


def brow_at(side):
    def at(i, j, NU=10, NV=3):
        u = i / (NU - 1)
        v = j / (NV - 1)
        x = side * (0.024 + 0.070 * u)
        zc = 1.697 + 0.009 * math.sin(u * math.pi * 0.9) - 0.010 * u
        half = 0.0105 * (1 - 0.40 * u)
        return x, zc + half * (1 - 2 * v), (v * 2 - 1), u
    return at


def piece(at_fn, nu, nv, thick, flip):
    Vx, Fx = relief_grid(face_bvh, nu, nv, at_fn, thick)
    return Vx, (Fx if not flip else [f[::-1] for f in Fx])


def front_mesh(name, parts_):
    V, F = [], []
    for Vx, Fx in parts_:
        b0 = len(V)
        V += Vx
        F += [[b0 + i for i in f] for f in Fx]
    ob = mesh_obj(name, V, F)
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bm.normal_update()
    bmesh.ops.reverse_faces(bm, faces=[f for f in bm.faces if f.normal.y > 0.0])
    inner = [v for v in bm.verts if not v.is_boundary]
    for _ in range(3):                           # 가장자리는 두고 안쪽만 고르게(톱니 모양 줄이기)
        bmesh.ops.smooth_vert(bm, verts=inner, factor=0.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    bm.to_mesh(ob.data)
    bm.free()
    return ob


beard = front_mesh('Beard', [BEARD_PARTS])
mustache = front_mesh('Mustache', [piece(mus_at, 17, 4, mus_thick, False)])
brows = front_mesh('Brows', [piece(brow_at(sd), 10, 3, lambda x, z, u, v: 0.0035 + 0.008 * (1 - abs(u) ** 2), sd < 0) for sd in (1, -1)])
log('relief', len(beard.data.polygons), len(mustache.data.polygons), len(brows.data.polygons))



# ---------------------------------------------------------------------------- 줄이기(예산) → 합치기 → 색과 그늘 → 내보내기
def decimate(ob, target):
    n = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    if n <= target:
        return n
    m = ob.modifiers.new('d', 'DECIMATE')
    m.ratio = target / n
    m.use_collapse_triangulate = True
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    ob.modifiers.clear()
    ob.data = me
    return sum(len(p.vertices) - 2 for p in me.polygons)


share = dict(Body=0.205, Hands=0.08, Mantle=0.30, HeadCloth=0.115, Beard=0.10, Tunic=0.04, Staff=0.02, Cord=0.025,
             Sash=0.01, Mustache=0.012, Brows=0.008, EyeL=0.02, EyeR=0.02)
parts = dict(Body=body, Hands=hands, Mantle=mantle, HeadCloth=headcloth, Beard=beard, Tunic=tunic, Staff=staff, Cord=cord,
             Sash=sash, Mustache=mustache, Brows=brows, EyeL=eyeL, EyeR=eyeR)
COL = dict(Mantle=pal.ROBE, HeadCloth=pal.CLOTH, Beard=pal.BEARD, Tunic=pal.TUNIC, Staff=pal.STAFF, Cord=pal.CORD,
           Sash=pal.BELT, Mustache=pal.BEARD, Brows=pal.BROW)
CLOTH_PARTS = {'Mantle', 'HeadCloth', 'Tunic', 'Sash'}
if SPEC.get('beard') == 'none':                  # 수염 없는 인물(젊은이 등)
    for k_ in ('Beard', 'Mustache'):
        parts.pop(k_, None)
if SPEC.get('helmet'):                            # 투구에는 머리끈이 없다
    parts.pop('Cord', None)
for eo in (eyeL, eyeR):                          # 눈알을 조금 줄이고 살짝 안으로(눈꺼풀이 더 덮는다)
    vs = eo.data.vertices
    cen = sum((v.co for v in vs), Vector()) / len(vs)
    for v in vs:
        v.co = cen + (v.co - cen) * EYE_SCALE + Vector((0.0, 0.004, 0.0))
    eo.data.update()
tris = {}
for k, ob in parts.items():
    tris[k] = decimate(ob, int(MAX_TRIS * share[k] * 0.98))
log('tris', tris, 'sum', sum(tris.values()))

# 모든 부분을 한 메시로 (부분 이름은 색을 정하려고 면 속성으로 남긴다)
P, Fs, FP = [], [], []
order = list(parts)
for pi, k in enumerate(order):
    ob = parts[k]
    b = len(P)
    P += [ob.matrix_world @ v.co for v in ob.data.vertices]
    for p in ob.data.polygons:
        Fs.append([b + i for i in p.vertices])
        FP.append(pi)

# 키 맞추기: 머리쓰개 꼭대기를 C.MODEL_TOP으로, 옷자락 끝은 y=0 유지
top = max(v.z for v in P)
k_scale = C.MODEL_TOP / top
P = [Vector((v.x * k_scale, v.y * k_scale, max(0.0, v.z * k_scale))) for v in P]
if DUMP:
    import json
    VG = {}
    b0 = 0
    for k in order:
        ob = parts[k]
        if k == 'Mantle':
            names = {g.index: g.name for g in ob.vertex_groups}
            for v in ob.data.vertices:
                ws = {names[e.group]: round(e.weight, 4) for e in v.groups if names.get(e.group) in ('slvL', 'slvR', 'slvT')}
                if ws:
                    VG[b0 + v.index] = ws
        b0 += len(ob.data.vertices)
    json.dump(dict(P=[tuple(round(c, 6) for c in v) for v in P], F=Fs, FP=FP, order=order, k_scale=k_scale, VG=VG,
                   SHO=[tuple(SHO[s] * k_scale) for s in (1, -1)], WRI=[tuple(WRI[s] * k_scale) for s in (1, -1)],
                   HEAD_C=tuple(HEAD_C * k_scale), BAND=[tuple(b * k_scale) for b in BAND], spec=SPEC),
              open(DUMP, 'w'))
    log('dump', DUMP)

# 반구 가림(AO): 땅 포함
gnd = len(P)
bv = BVHTree.FromPolygons([tuple(v) for v in P] + [(-3, -3, 0), (3, -3, 0), (3, 3, 0), (-3, 3, 0)], Fs + [[gnd, gnd + 1, gnd + 2, gnd + 3]])
nrm = [Vector() for _ in P]
for f in Fs:
    p = [P[i] for i in f]
    n = Vector()
    for i in range(1, len(p) - 1):
        n += (p[i] - p[0]).cross(p[i + 1] - p[0])
    for i in f:
        nrm[i] += n
K = 32
dirs = []
for i in range(K):
    u = (i + 0.5) / K
    ph = i * 2.399963
    r = math.sqrt(u)
    dirs.append((r * math.cos(ph), r * math.sin(ph), math.sqrt(1 - u)))
ao = []
for i, p in enumerate(P):
    n = nrm[i]
    if n.length < 1e-12:
        ao.append(1.0)
        continue
    n = n.normalized()
    t = n.cross(Vector((0, 0, 1)) if abs(n.z) < 0.9 else Vector((1, 0, 0))).normalized()
    bb = n.cross(t)
    o = p + n * 0.004
    occ = 0.0
    for dx, dy, dz in dirs:
        d = t * dx + bb * dy + n * dz
        h = bv.ray_cast(o, d, 0.20)
        if h[0] is not None:
            occ += 1.0 - (h[3] / 0.20) ** 0.5
    ao.append(1.0 - 0.6 * occ / K)
log('ao done')

me = bpy.data.meshes.new('MosesB2Mesh')
me.from_pydata([tuple(v) for v in P], [], Fs)
me.update()
for nm, rough, cull in (('MosesB2Solid', 0.82, True), ('MosesB2Cloth', 0.92, False)):
    m = bpy.data.materials.new(nm)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (1, 1, 1, 1)
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = 0.0
    m.use_backface_culling = cull
    me.materials.append(m)
ca = me.color_attributes.new(name='Color', type='FLOAT_COLOR', domain='CORNER')
eye_fwd = Vector((0, -1, 0))
li = 0
for fi, poly in enumerate(me.polygons):
    k = order[FP[fi]]
    poly.material_index = 1 if k in CLOTH_PARTS else 0
    poly.use_smooth = True
    for vi in poly.vertices:
        a = ao[vi]
        if k in ('Body', 'Hands'):
            col = pal.SKIN
            p = P[vi]
            zz = p.z / k_scale
            if abs(p.x / k_scale) < 0.03 and 1.535 < zz < 1.565 and p.y / k_scale < -0.14:
                col = pal.LIP
            a = C.lerp(1.0, a, 0.6)
        elif k in ('EyeL', 'EyeR'):
            cen = (eyeL if k == 'EyeL' else eyeR)
            n = nrm[vi].normalized() if nrm[vi].length > 0 else eye_fwd
            dd = n.dot(eye_fwd)
            col = (0.03, 0.022, 0.018) if dd > 0.965 else (pal.EYE if dd > 0.83 else SCLERA)
            if n.z > 0.36 and dd < 0.96:                 # 윗눈꺼풀이 덮은 듯(흰자를 줄여 차분한 노인의 눈)
                col = pal.SKIN_SH
            a = 1.0
        else:
            col = COL[k]
            if k == 'Mantle':
                col = C.mixc(pal.ROBE_SH, pal.ROBE, C.clamp(a * 1.2 - 0.1))
            if k == 'HeadCloth':
                col = C.mixc(pal.CLOTH_SH, pal.CLOTH, C.clamp(a * 1.2 - 0.1))
        ca.data[li].color = (col[0] * C.lerp(1, a, 0.90), col[1] * C.lerp(1, a, 0.96), col[2] * a, 1.0)
        li += 1
me.color_attributes.active_color = ca
me.color_attributes.render_color_index = 0

for o in list(sc.collection.objects):
    bpy.data.objects.remove(o)
ob = bpy.data.objects.new('MosesB2', me)
sc.collection.objects.link(ob)
ntri = sum(len(p.vertices) - 2 for p in me.polygons)
if SAVE_BLEND:
    bpy.ops.wm.save_as_mainfile(filepath=SAVE_BLEND)
os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)
C.export_glb(OUT)
log('OUT', OUT, 'tris', ntri, 'materials', len(me.materials), 'bytes', os.path.getsize(OUT),
    'height', round(max(v.z for v in P), 4))
