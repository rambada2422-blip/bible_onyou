# -*- coding: utf-8 -*-
"""
압도 장면: 불붙은 떨기나무 (출 3:2-6). 사실적인 영상을 Blender(Cycles)로 미리 그린다.
장면 설명은 docs/05_본제작_지시서.md 6.5절(대표 승인 2026-11-13)을 따른다.

실행 (저장소 루트에서, bpy가 설치된 파이썬):
    venv/bin/python tools/blender/bush_vision.py --out <폴더> [--shots A,B,C,D] [--frame 72]
          [--res 540x960] [--samples 64] [--cache <폴더>] [--sim-res 96] [--anim]
    --anim 이 없으면 각 장면에서 한 장씩만 그린다(정지 화면 시험).

신학 규칙 (공통규칙서 3절, 스타일가이드 2절, 지시서 6.2절)
    - 하나님을 어떤 형상으로도 만들지 않는다. 불과 빛만 만든다. 천사(여호와의 사자)도 만들지 않는다.
    - 불꽃은 유체 계산(Mantaflow)으로 만든 무작위 모양이다. 얼굴·사람 모양이 한 장면이라도 보이면 그 영상은 쓰지 않는다.
      모든 장면을 사람이 눈으로 확인한다.
    - 타서 없어지지 않는 나무이므로 연기와 재를 만들지 않는다(불 종류 FIRE만, 연기 밀도 0). 잎은 초록 그대로 둔다.
    - 모세는 뒷모습과 윤곽만 보인다. 신을 벗는 모습, 무릎 꿇는 모습은 넣지 않는다. 얼굴을 가리는 동작(3:6)만 넣는다.
    - 하늘이 어두워지거나 날씨가 바뀐 것처럼 그리지 않는다. 낮이다. 주변이 어두워 보이는 것은 카메라 노출 때문이다.

좌표: Blender 기준 Z 위, 떨기나무 밑동이 원점, 언덕 꼭대기 땅 높이 0.
      아이들이 있는 쪽(게임의 남쪽)이 -Y, 호렙 산 쪽이 +Y. 언덕 비탈은 -Y 쪽으로 6.2m 내려간다.
"""
import bpy
import addon_utils
import bmesh
import math
import os
import random
import sys
from mathutils import Vector, Matrix, Quaternion, noise

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))


def arg(name, default=None):
    if name in sys.argv:
        i = sys.argv.index(name)
        if i + 1 < len(sys.argv) and not sys.argv[i + 1].startswith('--'):
            return sys.argv[i + 1]
        return True
    return default


OUT = arg('--out', os.path.join(ROOT, 'dist', 'vision'))
SHOTS = str(arg('--shots', 'A,B,C,D')).split(',')
FRAME = int(arg('--frame', 72))
RES = [int(v) for v in str(arg('--res', '540x960')).split('x')]
SAMPLES = int(arg('--samples', 64))
CACHE = arg('--cache', os.path.join(OUT, 'cache'))
SIM_RES = int(arg('--sim-res', 96))
ANIM = bool(arg('--anim', False))
FPS = 24
SIM_END = int(arg('--sim-end', 120))
FIRE_DETAIL = float(arg('--fire-detail', 4))
STEP_RATE = float(arg('--step-rate', 4))
FIRE_K = float(arg('--fire-k', 30))
FIRE_SHAPE = float(arg('--fire-shape', 0.75))
FIRE_NOISE = float(arg('--fire-noise', 5.0))
FIRE_BIAS = float(arg('--fire-bias', 0.7))
FIRE_EDGE = float(arg('--fire-edge', 0.25))
FIRE_ZS = float(arg('--fire-zs', 0.6))
FIRE_XS = float(arg('--fire-xs', 2.0))
FIRE_WARP = float(arg('--fire-warp', 1.4))
FIRE_ABS = float(arg('--fire-abs', 0.5))

DEG = math.pi / 180
# 모세가 선 자리: 떨기나무 앞쪽 왼편(남서), 떨기나무를 바라본다. 아래(-Y)에서 보면 뒷모습이다.
MOSES_AT = (-1.55, -0.95)
UP = Vector((0, 0, 1))
rnd = random.Random(3106)


# ---------------------------------------------------------------------------- 준비
def reset():
    addon_utils.enable('cycles', default_set=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    addon_utils.enable('cycles', default_set=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = SAMPLES
    sc.cycles.use_denoising = True
    sc.cycles.denoiser = 'OPENIMAGEDENOISE'
    sc.cycles.max_bounces = 4
    sc.cycles.diffuse_bounces = 2
    sc.cycles.glossy_bounces = 1
    sc.cycles.transmission_bounces = 2
    sc.cycles.volume_bounces = 0
    sc.cycles.transparent_max_bounces = 8
    sc.cycles.volume_step_rate = STEP_RATE
    sc.cycles.use_light_tree = True
    sc.render.resolution_x, sc.render.resolution_y = RES
    sc.render.resolution_percentage = 100
    sc.render.fps = FPS
    sc.render.use_motion_blur = True
    sc.render.motion_blur_shutter = 0.5
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = str(arg('--look', 'AgX - Punchy'))
    sc.view_settings.exposure = float(arg('--exposure', -1.9))
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGB'
    return sc


def node_mat(name):
    m = bpy.data.materials.new(name)
    if m.node_tree is None:
        m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    return m, nt, out


def link(nt, a, b):
    nt.links.new(a, b)


def mesh_obj(name, verts, faces, smooth=True, mat=None):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    if mat:
        me.materials.append(mat)
    return ob


# ---------------------------------------------------------------------------- 땅
def crest_y(x):
    return -1.75 + 0.35 * math.sin(x * 0.7 + 1.1) + 0.2 * math.sin(x * 1.9)


def ground_h(x, y):
    """언덕 꼭대기는 0 근처, 남쪽(-Y) 비탈은 6.2m 아래로 떨어진다. 북쪽(+Y)은 호렙 산 쪽으로 완만히 오른다."""
    n = noise.fractal(Vector((x * 0.35, y * 0.35, 0.5)), 0.55, 2.0, 4) * 0.12
    c = crest_y(x)
    far = max(0.0, math.hypot(x, y) - 30.0)
    rise = 7.5 * (1 - math.exp(-far / 70.0)) + noise.fractal(Vector((x * 0.02, y * 0.02, 9.0)), 0.6, 2.0, 4) * 3.0 * min(1.0, far / 40.0)
    if y > c:
        h = 0.06 * (1 - math.exp(-((x * x + y * y) / 30.0))) + max(0.0, y - 6) * 0.08
        return h + n
    t = min(1.0, (c - y) / 4.6)
    u = 1 - t
    prof = u * u * (3 - 2 * u)
    ledge = 0.25 * math.sin(prof * math.pi * 5) * t * (1 - t) * 4
    rid = (1 - abs(noise.noise(Vector((x * 0.9, y * 0.9, 2.0))))) * 0.35 + noise.fractal(Vector((x * 1.7, y * 1.7, 4.0)), 0.5, 2.0, 3) * 0.15
    return -6.2 + 6.2 * prof + ledge * 0.6 + n * (0.6 + 2.0 * t * (1 - t)) + rid * 4 * t * (1 - t) + rise * (1 - prof)


def build_ground():
    m, nt, out = node_mat('Ground')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Roughness'].default_value = 0.95
    geo = nt.nodes.new('ShaderNodeNewGeometry')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    link(nt, geo.outputs['Normal'], sep.inputs[0])
    # 비탈은 붉은 바위, 평평한 곳은 모래와 자갈
    slope = nt.nodes.new('ShaderNodeMapRange')
    slope.inputs['From Min'].default_value = 0.62
    slope.inputs['From Max'].default_value = 0.88
    slope.inputs['To Min'].default_value = 1.0
    slope.inputs['To Max'].default_value = 0.0
    link(nt, sep.outputs['Z'], slope.inputs['Value'])
    tc = nt.nodes.new('ShaderNodeTexCoord')
    n1 = nt.nodes.new('ShaderNodeTexNoise')
    n1.inputs['Scale'].default_value = 1.6
    n1.inputs['Detail'].default_value = 8
    n1.inputs['Roughness'].default_value = 0.6
    link(nt, tc.outputs['Object'], n1.inputs['Vector'])
    sand = nt.nodes.new('ShaderNodeValToRGB')
    sand.color_ramp.elements[0].color = (0.30, 0.18, 0.10, 1)
    sand.color_ramp.elements[1].color = (0.48, 0.32, 0.18, 1)
    link(nt, n1.outputs['Fac'], sand.inputs['Fac'])
    vor = nt.nodes.new('ShaderNodeTexVoronoi')
    vor.inputs['Scale'].default_value = 9.0
    link(nt, tc.outputs['Object'], vor.inputs['Vector'])
    grav = nt.nodes.new('ShaderNodeMix')
    grav.data_type = 'RGBA'
    grav.inputs['B'].default_value = (0.36, 0.25, 0.17, 1)
    gr = nt.nodes.new('ShaderNodeMapRange')
    gr.inputs['From Min'].default_value = 0.0
    gr.inputs['From Max'].default_value = 0.12
    gr.inputs['To Min'].default_value = 0.55
    gr.inputs['To Max'].default_value = 0.0
    link(nt, vor.outputs['Distance'], gr.inputs['Value'])
    link(nt, gr.outputs['Result'], grav.inputs['Factor'])
    link(nt, sand.outputs['Color'], grav.inputs['A'])
    # 바위: 금이 간 붉은 갈색 바위
    vr = nt.nodes.new('ShaderNodeTexVoronoi')
    vr.feature = 'DISTANCE_TO_EDGE'
    vr.inputs['Scale'].default_value = 0.9
    link(nt, tc.outputs['Object'], vr.inputs['Vector'])
    crack = nt.nodes.new('ShaderNodeMapRange')
    crack.inputs['From Min'].default_value = 0.0
    crack.inputs['From Max'].default_value = 0.06
    crack.inputs['To Min'].default_value = 0.82
    crack.inputs['To Max'].default_value = 1.0
    link(nt, vr.outputs['Distance'], crack.inputs['Value'])
    n3 = nt.nodes.new('ShaderNodeTexNoise')
    n3.inputs['Scale'].default_value = 0.8
    n3.inputs['Detail'].default_value = 6
    link(nt, tc.outputs['Object'], n3.inputs['Vector'])
    rock = nt.nodes.new('ShaderNodeValToRGB')
    rock.color_ramp.elements[0].color = (0.13, 0.065, 0.04, 1)
    rock.color_ramp.elements[1].color = (0.34, 0.19, 0.11, 1)
    link(nt, n3.outputs['Fac'], rock.inputs['Fac'])
    rockc = nt.nodes.new('ShaderNodeMix')
    rockc.data_type = 'RGBA'
    rockc.blend_type = 'MULTIPLY'
    rockc.inputs['Factor'].default_value = 1.0
    link(nt, rock.outputs['Color'], rockc.inputs['A'])
    link(nt, crack.outputs['Result'], rockc.inputs['B'])
    mix = nt.nodes.new('ShaderNodeMix')
    mix.data_type = 'RGBA'
    link(nt, slope.outputs['Result'], mix.inputs['Factor'])
    link(nt, grav.outputs['Result'], mix.inputs['A'])
    link(nt, rockc.outputs['Result'], mix.inputs['B'])
    link(nt, mix.outputs['Result'], bsdf.inputs['Base Color'])
    # 울퉁불퉁함
    n2 = nt.nodes.new('ShaderNodeTexNoise')
    n2.inputs['Scale'].default_value = 14
    n2.inputs['Detail'].default_value = 10
    link(nt, tc.outputs['Object'], n2.inputs['Vector'])
    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.7
    bump.inputs['Distance'].default_value = 0.04
    hsum = nt.nodes.new('ShaderNodeMath')
    hsum.operation = 'MULTIPLY_ADD'
    link(nt, crack.outputs['Result'], hsum.inputs[0])
    link(nt, slope.outputs['Result'], hsum.inputs[1])
    link(nt, n2.outputs['Fac'], hsum.inputs[2])
    link(nt, hsum.outputs['Value'], bump.inputs['Height'])
    link(nt, bump.outputs['Normal'], bsdf.inputs['Normal'])
    link(nt, bsdf.outputs['BSDF'], out.inputs['Surface'])

    # 가까운 곳은 촘촘하게, 먼 곳은 성기게
    xs = [x * 0.12 for x in range(-75, 76)]
    ys = [y * 0.12 for y in range(-150, 76)]
    def warp(v, lim):
        return v if abs(v) <= lim else math.copysign(lim + (abs(v) - lim) ** 1.6, v)
    verts, faces = [], []
    X = [warp(x, 6) for x in xs]
    Y = [warp(y, 8) for y in ys]
    for j, y in enumerate(Y):
        for i, x in enumerate(X):
            verts.append((x, y, ground_h(x, y)))
    nx = len(X)
    for j in range(len(Y) - 1):
        for i in range(nx - 1):
            a = j * nx + i
            faces.append((a, a + 1, a + nx + 1, a + nx))
    ob = mesh_obj('Ground', verts, faces, True, m)
    return ob


def build_rocks():
    m, nt, out = node_mat('Rock')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Roughness'].default_value = 0.9
    tc = nt.nodes.new('ShaderNodeTexCoord')
    n1 = nt.nodes.new('ShaderNodeTexNoise')
    n1.inputs['Scale'].default_value = 3
    n1.inputs['Detail'].default_value = 10
    link(nt, tc.outputs['Object'], n1.inputs['Vector'])
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (0.22, 0.13, 0.08, 1)
    ramp.color_ramp.elements[1].color = (0.52, 0.34, 0.22, 1)
    link(nt, n1.outputs['Fac'], ramp.inputs['Fac'])
    link(nt, ramp.outputs['Color'], bsdf.inputs['Base Color'])
    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.8
    n2 = nt.nodes.new('ShaderNodeTexNoise')
    n2.inputs['Scale'].default_value = 22
    n2.inputs['Detail'].default_value = 12
    link(nt, tc.outputs['Object'], n2.inputs['Vector'])
    link(nt, n2.outputs['Fac'], bump.inputs['Height'])
    link(nt, bump.outputs['Normal'], bsdf.inputs['Normal'])
    link(nt, bsdf.outputs['BSDF'], out.inputs['Surface'])
    r = random.Random(11)
    spots = []
    # 꼭대기 위 (떨기나무와 모세 자리는 비운다)
    for k in range(26):
        x, y = r.uniform(-7, 7), r.uniform(-1.4, 6)
        if math.hypot(x, y) < 1.8 or math.hypot(x - MOSES_AT[0], y - MOSES_AT[1]) < 1.2:
            continue
        spots.append((x, y, r.uniform(0.12, 0.45)))
    # 비탈과 기슭
    for k in range(40):
        x = r.uniform(-9, 9)
        y = r.uniform(-7.5, crest_y(x) - 0.2)
        spots.append((x, y, r.uniform(0.25, 0.9)))
    for i, (x, y, s) in enumerate(spots):
        bm = bmesh.new()
        bmesh.ops.create_icosphere(bm, subdivisions=3, radius=1.0)
        sx, sy, sz = r.uniform(0.8, 1.3), r.uniform(0.8, 1.3), r.uniform(0.45, 0.8)
        off = Vector((r.random() * 10, r.random() * 10, r.random() * 10))
        planes = []
        for q in range(7):
            nrm = Vector((r.gauss(0, 1), r.gauss(0, 1), r.gauss(0, 1))).normalized()
            planes.append((nrm, r.uniform(0.55, 0.85)))
        for v in bm.verts:
            d = noise.fractal(v.co * 1.3 + off, 0.6, 2.0, 4)
            co = v.co * (1 + 0.2 * d)
            for nrm, dd in planes:
                h = co.dot(nrm)
                if h > dd:
                    co = co - nrm * (h - dd)
            v.co = Vector((co.x * sx, co.y * sy, co.z * sz))
        me = bpy.data.meshes.new('rock%d' % i)
        bm.to_mesh(me)
        bm.free()
        ob = bpy.data.objects.new('rock%d' % i, me)
        bpy.context.scene.collection.objects.link(ob)
        me.materials.append(m)
        ob.scale = (s, s, s)
        ob.location = (x, y, ground_h(x, y) - s * 0.25)
        ob.rotation_euler = (r.uniform(-0.3, 0.3), r.uniform(-0.3, 0.3), r.uniform(0, 6.28))


def build_far_hills(mat):
    """지평선을 두르는 먼 언덕 (흐릿하게)"""
    verts, faces = [], []
    N = 240
    for i in range(N):
        a = i / N * 2 * math.pi
        h = 10 + 9 * (noise.fractal(Vector((math.cos(a) * 3, math.sin(a) * 3, 1.0)), 0.6, 2.0, 4) + 0.6)
        R = 380
        verts.append((math.cos(a) * R, math.sin(a) * R, -12))
        verts.append((math.cos(a) * R, math.sin(a) * R, h))
    for i in range(N):
        a, b = i * 2, ((i + 1) % N) * 2
        faces.append((a, b, b + 1, a + 1))
    mesh_obj('FarHills', verts, faces, True, mat)


def build_mountain():
    """멀리 북쪽의 호렙 산. 피라미드처럼 뾰족하지 않게, 둥글고 거친 바위산."""
    m, nt, out = node_mat('Mountain')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Roughness'].default_value = 1.0
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nz = nt.nodes.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = 0.08
    nz.inputs['Detail'].default_value = 10
    link(nt, tc.outputs['Object'], nz.inputs['Vector'])
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (0.16, 0.09, 0.07, 1)
    ramp.color_ramp.elements[1].color = (0.42, 0.27, 0.22, 1)
    link(nt, nz.outputs['Fac'], ramp.inputs['Fac'])
    link(nt, ramp.outputs['Color'], bsdf.inputs['Base Color'])
    camd = nt.nodes.new('ShaderNodeCameraData')
    hz = nt.nodes.new('ShaderNodeMapRange')
    hz.inputs['From Min'].default_value = 60
    hz.inputs['From Max'].default_value = 320
    hz.inputs['To Min'].default_value = 0.15
    hz.inputs['To Max'].default_value = 0.7
    link(nt, camd.outputs['View Distance'], hz.inputs['Value'])
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = (0.42, 0.55, 0.75, 1)
    em.inputs['Strength'].default_value = 1.6
    mx = nt.nodes.new('ShaderNodeMixShader')
    link(nt, hz.outputs['Result'], mx.inputs['Fac'])
    link(nt, bsdf.outputs['BSDF'], mx.inputs[1])
    link(nt, em.outputs['Emission'], mx.inputs[2])
    link(nt, mx.outputs['Shader'], out.inputs['Surface'])
    verts, faces = [], []
    N = 90
    for j in range(N + 1):
        for i in range(N + 1):
            x = (i / N - 0.5) * 340
            y = 40 + j / N * 260
            dx, dy = x - 10, y - 150
            d = math.hypot(dx, dy)
            t = max(0.0, 1 - d / 150)
            ridge = 1 - abs(noise.noise(Vector((x * 0.012, y * 0.012, 3.1))))
            h = (t ** 1.5) * 95 * (0.72 + 0.4 * ridge) + noise.fractal(Vector((x * 0.03, y * 0.03, 7.0)), 0.6, 2.0, 5) * 6 * t - 8
            verts.append((x, y, h))
    for j in range(N):
        for i in range(N):
            a = j * (N + 1) + i
            faces.append((a, a + 1, a + N + 2, a + N + 1))
    mesh_obj('Horeb', verts, faces, True, m)
    build_far_hills(m)


# ---------------------------------------------------------------------------- 떨기나무
def build_bush():
    """가시 관목: 밑동에서 여러 줄기가 비틀리며 뻗고, 잔가지 끝에 작은 잎이 촘촘히 달린다. 가지마다 가시."""
    segs, tips = [], []
    branch_p = [0.22, 0.3, 0.3, 0.0]

    def grow(p, d, length, radius, depth):
        pts, rads = [p.copy()], [radius]
        n = max(3, int(length / 0.055))
        cur, dr = p.copy(), d.copy()
        for i in range(n):
            jit = Vector((rnd.gauss(0, 1), rnd.gauss(0, 1), rnd.gauss(0, 0.7))) * (0.22 + 0.1 * depth)
            out = Vector((cur.x, cur.y, 0))
            out = out.normalized() if out.length > 1e-4 else Vector((0, 0, 0))
            dr = (dr + jit + UP * 0.06 + out * 0.05).normalized()
            cur = cur + dr * (length / n)
            # 수관 모양: 둥근 덤불을 벗어나지 않게
            hr = math.hypot(cur.x, cur.y)
            lim = 1.05 * math.sqrt(max(0.0, 1 - ((cur.z - 0.75) / 1.05) ** 2)) + 0.12
            if hr > lim:
                cur.x *= lim / hr
                cur.y *= lim / hr
            cur.z = min(cur.z, 1.85 - 0.25 * (hr / 1.1))
            pts.append(cur.copy())
            rads.append(radius * (1 - (i + 1) / n * 0.7))
            if depth < 3 and i > 0 and rnd.random() < branch_p[depth]:
                side = dr.cross(Vector((rnd.gauss(0, 1), rnd.gauss(0, 1), rnd.gauss(0, 1)))).normalized()
                nd = (dr * 0.6 + side * 0.9 + UP * 0.15).normalized()
                grow(cur.copy(), nd, length * rnd.uniform(0.45, 0.62), rads[-1] * 0.72, depth + 1)
        segs.append((pts, rads, depth))
        tips.append((cur, dr, depth))

    nmain = 14
    for k in range(nmain):
        a = k / nmain * 2 * math.pi + rnd.uniform(-0.3, 0.3)
        tilt = rnd.uniform(22, 58) * DEG if k > 1 else rnd.uniform(4, 14) * DEG
        d = Vector((math.cos(a) * math.sin(tilt), math.sin(a) * math.sin(tilt), math.cos(tilt)))
        base = Vector((math.cos(a) * 0.06, math.sin(a) * 0.06, -0.03))
        grow(base, d, rnd.uniform(1.15, 1.7), rnd.uniform(0.026, 0.04), 0)

    # 줄기와 가지: 관 모양 메쉬
    verts, faces = [], []
    thorn_v, thorn_f = [], []
    leaf_v, leaf_f, leaf_col = [], [], []
    SIDES = 6
    for pts, rads, depth in segs:
        if len(pts) < 2:
            continue
        t0 = (pts[1] - pts[0]).normalized()
        nrm = t0.orthogonal().normalized()
        base_i = len(verts)
        for i, p in enumerate(pts):
            t = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
            nrm = (nrm - t * nrm.dot(t)).normalized()
            bi = t.cross(nrm)
            r = max(rads[i], 0.0025)
            for s in range(SIDES):
                a = s / SIDES * 2 * math.pi
                verts.append(p + (nrm * math.cos(a) + bi * math.sin(a)) * r)
        for i in range(len(pts) - 1):
            for s in range(SIDES):
                a = base_i + i * SIDES + s
                b = base_i + i * SIDES + (s + 1) % SIDES
                faces.append((a, b, b + SIDES, a + SIDES))
        # 가시: 가지를 따라 바깥으로 비스듬히
        for i in range(1, len(pts) - 1):
            if rnd.random() > (0.55 if depth < 2 else 0.35):
                continue
            p = pts[i]
            t = (pts[i + 1] - pts[i - 1]).normalized()
            side = t.cross(Vector((rnd.gauss(0, 1), rnd.gauss(0, 1), rnd.gauss(0, 1)))).normalized()
            dirv = (side * 0.85 + t * 0.5).normalized()
            L = rnd.uniform(0.012, 0.028)
            r0 = max(rads[i], 0.003)
            o = p + side * r0 * 0.8
            q = dirv.orthogonal().normalized()
            q2 = dirv.cross(q)
            bi0 = len(thorn_v)
            for s in range(3):
                a = s / 3 * 2 * math.pi
                thorn_v.append(o + (q * math.cos(a) + q2 * math.sin(a)) * 0.0022)
            thorn_v.append(o + dirv * L)
            thorn_f += [(bi0, bi0 + 1, bi0 + 3), (bi0 + 1, bi0 + 2, bi0 + 3), (bi0 + 2, bi0, bi0 + 3)]
        # 잎: 2단계 이상 가지의 바깥쪽 절반에 작은 잎이 촘촘히
        if depth >= 1 or True:
            for i in range(len(pts) // 4 if depth >= 1 else len(pts) // 2, len(pts)):
                for _ in range(5 if depth >= 2 else (4 if depth == 1 else 2)):
                    p = pts[i] + Vector((rnd.gauss(0, 1), rnd.gauss(0, 1), rnd.gauss(0, 1))) * 0.03
                    t = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
                    side = t.cross(Vector((rnd.gauss(0, 1), rnd.gauss(0, 1), rnd.gauss(0, 1)))).normalized()
                    dirv = (side + t * 0.6 + UP * 0.2).normalized()
                    L = rnd.uniform(0.032, 0.058)
                    W = L * rnd.uniform(0.36, 0.5)
                    q = dirv.cross(UP)
                    if q.length < 1e-3:
                        q = dirv.orthogonal()
                    q.normalize()
                    nrm = q.cross(dirv).normalized()
                    q = (q * math.cos(rnd.uniform(-0.6, 0.6)) + nrm * math.sin(rnd.uniform(-0.6, 0.6))).normalized()
                    bi0 = len(leaf_v)
                    leaf_v += [p, p + dirv * L * 0.35 + q * W * 0.5, p + dirv * L, p + dirv * L * 0.35 - q * W * 0.5,
                               p + dirv * L * 0.5 + nrm * W * 0.12]
                    leaf_f += [(bi0, bi0 + 1, bi0 + 4), (bi0 + 1, bi0 + 2, bi0 + 4), (bi0 + 2, bi0 + 3, bi0 + 4), (bi0 + 3, bi0, bi0 + 4)]
                    leaf_col.append(rnd.random())
    # 재질
    bark, nt, out = node_mat('Bark')
    b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    b.inputs['Base Color'].default_value = (0.045, 0.032, 0.024, 1)
    b.inputs['Roughness'].default_value = 0.8
    link(nt, b.outputs['BSDF'], out.inputs['Surface'])
    thorn, nt, out = node_mat('Thorn')
    b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    b.inputs['Base Color'].default_value = (0.55, 0.45, 0.32, 1)
    b.inputs['Roughness'].default_value = 0.6
    link(nt, b.outputs['BSDF'], out.inputs['Surface'])
    leaf, nt, out = node_mat('Leaf')
    attr = nt.nodes.new('ShaderNodeAttribute')
    attr.attribute_name = 'leafvar'
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (0.06, 0.16, 0.03, 1)
    ramp.color_ramp.elements[1].color = (0.20, 0.36, 0.07, 1)
    e = ramp.color_ramp.elements.new(0.5)
    e.color = (0.10, 0.24, 0.05, 1)
    link(nt, attr.outputs['Fac'], ramp.inputs['Fac'])
    b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    b.inputs['Roughness'].default_value = 0.45
    link(nt, ramp.outputs['Color'], b.inputs['Base Color'])
    tr = nt.nodes.new('ShaderNodeBsdfTranslucent')
    link(nt, ramp.outputs['Color'], tr.inputs['Color'])
    mx = nt.nodes.new('ShaderNodeMixShader')
    mx.inputs['Fac'].default_value = 0.3
    link(nt, b.outputs['BSDF'], mx.inputs[1])
    link(nt, tr.outputs['BSDF'], mx.inputs[2])
    link(nt, mx.outputs['Shader'], out.inputs['Surface'])

    wood = mesh_obj('BushWood', verts, faces, True, bark)
    th = mesh_obj('BushThorns', thorn_v, thorn_f, False, thorn)
    lv = mesh_obj('BushLeaves', leaf_v, leaf_f, True, leaf)
    lat = lv.data.attributes.new('leafvar', 'FLOAT', 'FACE')
    for i in range(len(leaf_f)):
        lat.data[i].value = leaf_col[i // 4]
    print('bush: segments %d, wood faces %d, thorns %d, leaves %d' % (len(segs), len(faces), len(thorn_f) // 3, len(leaf_f) // 4))
    return wood, th, lv, segs


# ---------------------------------------------------------------------------- 불
# 이 환경의 Blender(5.3/4.5 파이썬 모듈, Ubuntu 4.0.2)에서는 유체 계산(Mantaflow)이 멈춘다.
# 그래서 불꽃은 잡음 무늬로 만든다(절차적 불꽃). 시간 값 하나로 움직이므로 같은 프레임은 언제나 같은 모양이다.
class NB:
    """노드를 짧게 잇는 도구"""
    def __init__(self, nt):
        self.nt = nt

    def math(self, op, a, b=None, clamp=False):
        n = self.nt.nodes.new('ShaderNodeMath')
        n.operation = op
        n.use_clamp = clamp
        self._in(n.inputs[0], a)
        if b is not None:
            self._in(n.inputs[1], b)
        return n.outputs[0]

    def vec(self, op, a, b=None):
        n = self.nt.nodes.new('ShaderNodeVectorMath')
        n.operation = op
        self._in(n.inputs[0], a)
        if b is not None:
            self._in(n.inputs[1], b)
        return n.outputs['Vector'] if op not in ('LENGTH', 'DOT_PRODUCT', 'DISTANCE') else n.outputs['Value']

    def _in(self, sock, v):
        if isinstance(v, (int, float)):
            sock.default_value = v
        elif isinstance(v, (tuple, list)):
            sock.default_value = v
        else:
            self.nt.links.new(v, sock)

    def sstep(self, e0, e1, x):
        n = self.nt.nodes.new('ShaderNodeMapRange')
        n.interpolation_type = 'SMOOTHSTEP'
        n.inputs['From Min'].default_value = e0
        n.inputs['From Max'].default_value = e1
        self._in(n.inputs['Value'], x)
        return n.outputs['Result']

    def noise4(self, vec, w, scale, detail, rough, distortion=0.0):
        n = self.nt.nodes.new('ShaderNodeTexNoise')
        n.noise_dimensions = '4D'
        n.inputs['Scale'].default_value = scale
        n.inputs['Detail'].default_value = detail
        n.inputs['Roughness'].default_value = rough
        if 'Distortion' in n.inputs:
            n.inputs['Distortion'].default_value = distortion
        self._in(n.inputs['Vector'], vec)
        self._in(n.inputs['W'], w)
        return n

    def xyz(self, x, y, z):
        n = self.nt.nodes.new('ShaderNodeCombineXYZ')
        self._in(n.inputs[0], x)
        self._in(n.inputs[1], y)
        self._in(n.inputs[2], z)
        return n.outputs[0]


def build_fire(segs):
    """덤불을 감싸고 위로 솟는 불. 밀도 0이라 연기가 없고, 빛만 낸다. 덤불 속 잎은 비쳐 보인다."""
    sc = bpy.context.scene
    H = 3.6
    bmv = bmesh.new()
    bmesh.ops.create_cube(bmv, size=1.0)
    for v in bmv.verts:
        v.co = Vector((v.co.x * 2.9, v.co.y * 2.9, (v.co.z + 0.5) * H))
    bmesh.ops.recalc_face_normals(bmv, faces=bmv.faces)
    me = bpy.data.meshes.new('FireVolume')
    bmv.to_mesh(me)
    bmv.free()
    dom = bpy.data.objects.new('FireVolume', me)
    sc.collection.objects.link(dom)
    m, nt, out = node_mat('Fire')
    nb = NB(nt)
    tc = nt.nodes.new('ShaderNodeTexCoord')
    p = tc.outputs['Object']
    tval = nt.nodes.new('ShaderNodeValue')
    tval.name = 'Time'
    T = tval.outputs[0]
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    link(nt, p, sep.inputs[0])
    z = sep.outputs['Z']
    r = nb.math('SQRT', nb.math('ADD', nb.math('MULTIPLY', sep.outputs['X'], sep.outputs['X']), nb.math('MULTIPLY', sep.outputs['Y'], sep.outputs['Y'])))
    hz = nb.math('DIVIDE', z, H * 0.92, clamp=True)
    # 높이에 따라 좁아지는 불의 테두리 (덤불 둘레에서 시작해 위로 가늘어진다)
    width = nb.math('ADD', nb.math('ADD', 0.5, nb.math('MULTIPLY', nb.sstep(0.0, 0.8, z), 0.62)), nb.math('MULTIPLY', nb.sstep(0.9, H * 0.9, z), -0.85))
    rr = nb.math('DIVIDE', r, width)
    shape = nb.math('MULTIPLY', nb.math('SUBTRACT', 1.0, nb.sstep(0.35, 1.0, rr)), nb.math('SUBTRACT', 1.0, nb.sstep(0.45, 1.0, hz)))
    shape = nb.math('MULTIPLY', shape, nb.sstep(0.0, 0.18, z))
    # 위로 흐르는 좌표: 시간만큼 아래로 밀어 무늬가 위로 올라가게, 위로 갈수록 더 빠르게
    rise = nb.xyz(0.0, 0.0, nb.math('MULTIPLY', T, -1.35))
    q = nb.vec('ADD', p, rise)
    # 크게 휘는 흔들림
    warp = nb.noise4(nb.vec('MULTIPLY', q, (0.9, 0.9, 0.55)), nb.math('MULTIPLY', T, 0.35), 1.0, 2, 0.5)
    wv = nb.vec('SUBTRACT', warp.outputs['Color'], (0.5, 0.5, 0.5))
    wamp = nb.math('ADD', 0.25, nb.math('MULTIPLY', hz, FIRE_WARP))
    q2 = nb.vec('ADD', q, nb.vec('MULTIPLY', wv, nb.xyz(wamp, wamp, 0.35)))
    # 불꽃 결: 세로로 늘인 잡음 (가로는 촘촘, 세로는 길게)
    tur = nb.noise4(nb.vec('MULTIPLY', q2, (FIRE_XS, FIRE_XS, FIRE_ZS)), nb.math('MULTIPLY', T, 0.9), 1.0, FIRE_DETAIL, 0.6)
    n = nb.math('ADD', tur.outputs['Fac'], 0.175)
    # 불꽃 값 = 테두리 + 잡음
    F = nb.math('ADD', nb.math('MULTIPLY', shape, FIRE_SHAPE), nb.math('MULTIPLY', nb.math('SUBTRACT', n, 0.66), FIRE_NOISE))
    F = nb.math('SUBTRACT', F, FIRE_BIAS)
    Fs = nb.sstep(0.0, FIRE_EDGE, F)
    # 색: 불꽃 자체는 주황, 진한 곳은 노랗게. 밝기는 카메라(AgX)가 흰빛 쪽으로 눌러 준다.
    fade = nb.math('SUBTRACT', 1.0, nb.math('MULTIPLY', nb.math('POWER', hz, 1.3), 0.85))
    heat = nb.math('MULTIPLY', Fs, fade)
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    cr = ramp.color_ramp
    cr.elements[0].position = 0.0
    cr.elements[0].color = (1.0, 0.12, 0.005, 1)
    cr.elements[1].position = 1.0
    cr.elements[1].color = (1.0, 0.34, 0.035, 1)
    e = cr.elements.new(0.5)
    e.color = (1.0, 0.15, 0.008, 1)
    link(nt, Fs, ramp.inputs['Fac'])
    vol = nt.nodes.new('ShaderNodeVolumePrincipled')
    vol.inputs['Color'].default_value = (0.0, 0.0, 0.0, 1)
    vol.inputs['Absorption Color'].default_value = (0.0, 0.0, 0.0, 1)
    # 가림은 불꽃이 밝은 곳에만 (빛이 약한 끝자락이 하늘을 가려 연기처럼 보이지 않게)
    link(nt, nb.math('MULTIPLY', nb.math('POWER', heat, 2.0), FIRE_ABS), vol.inputs['Density'])
    link(nt, ramp.outputs['Color'], vol.inputs['Emission Color'])
    strength = nb.math('MULTIPLY', nb.math('POWER', heat, 2.2), FIRE_K)
    link(nt, strength, vol.inputs['Emission Strength'])
    link(nt, vol.outputs['Volume'], out.inputs['Volume'])
    dom.data.materials.append(m)
    # 시간: 1초에 1씩 늘어난다
    tval.outputs[0].default_value = 0.0
    tval.outputs[0].keyframe_insert('default_value', frame=0)
    tval.outputs[0].default_value = 100.0
    tval.outputs[0].keyframe_insert('default_value', frame=FPS * 100)
    try:
        for fc in m.node_tree.animation_data.action.fcurves:
            for k in fc.keyframe_points:
                k.interpolation = 'LINEAR'
    except Exception:
        try:
            for layer in m.node_tree.animation_data.action.layers:
                for strip in layer.strips:
                    for cb in strip.channelbags:
                        for fc in cb.fcurves:
                            for k in fc.keyframe_points:
                                k.interpolation = 'LINEAR'
        except Exception as e:
            print('interp', e)
    # 불티가 나오는 곳 (덤불 속 둥근 덩어리)
    rg = random.Random(5)
    bm = bmesh.new()
    pts = []
    for pts_, rads, depth in segs:
        if depth <= 1:
            pts += pts_[2::4]
    rg.shuffle(pts)
    for pp in pts[:38]:
        bmesh.ops.create_icosphere(bm, subdivisions=1, radius=rg.uniform(0.07, 0.14), matrix=Matrix.Translation(pp))
    me = bpy.data.meshes.new('FireSource')
    bm.to_mesh(me)
    bm.free()
    src = bpy.data.objects.new('FireSource', me)
    sc.collection.objects.link(src)
    src.hide_render = True
    return dom, src


def bake_fire(dom):
    pass


# ---------------------------------------------------------------------------- 불티
def build_embers(src):
    sc = bpy.context.scene
    m, nt, out = node_mat('Ember')
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = (1.0, 0.45, 0.08, 1)
    em.inputs['Strength'].default_value = 10
    link(nt, em.outputs['Emission'], out.inputs['Surface'])
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1, location=(0, 0, -50))
    sph = bpy.context.active_object
    sph.name = 'EmberShape'
    sph.data.materials.append(m)
    src.hide_render = False
    ps = src.modifiers.new('Embers', 'PARTICLE_SYSTEM').particle_system
    s = ps.settings
    src.show_instancer_for_render = False
    s.count = 1400
    s.frame_start = -60
    s.frame_end = SIM_END + 600
    s.lifetime = 44
    s.lifetime_random = 0.6
    s.emit_from = 'VOLUME'
    s.normal_factor = 0.0
    s.object_align_factor = (0, 0, 1.4)
    s.factor_random = 0.6
    s.brownian_factor = 1.1
    s.drag_factor = 0.15
    s.effector_weights.gravity = -0.12
    s.render_type = 'OBJECT'
    s.instance_object = sph
    s.particle_size = 0.007
    s.size_random = 0.7
    sph.hide_render = False


# ---------------------------------------------------------------------------- 모세
def build_moses():
    """영상용 사실적 모세(moses_real.py). 뒷모습과 윤곽만 보인다"""
    sys.path.insert(0, HERE)
    import moses_real
    m = moses_real.build()
    root = m['root']
    root.location = (MOSES_AT[0], MOSES_AT[1], ground_h(*MOSES_AT))
    d = Vector((0, 0.15, 0)) - Vector((MOSES_AT[0], MOSES_AT[1], 0))
    # 모세는 +Y를 보도록 만들어져 있다. 떨기나무 쪽으로 돌린다
    root.rotation_euler = (0, 0, math.atan2(d.y, d.x) - math.pi / 2)
    global MOSES_POSE
    MOSES_POSE = m['pose']
    return root, None


MOSES_POSE = None


def set_action(arm, name, frame):
    if not arm:
        return
    act = bpy.data.actions.get(name)
    if act is None:
        for a in bpy.data.actions:
            if a.name.startswith(name):
                act = a
                break
    if act is None:
        print('action not found', name, [a.name for a in bpy.data.actions])
        return
    arm.animation_data_create()
    arm.animation_data.action = act
    if hasattr(arm.animation_data, 'action_slot') and act.slots:
        arm.animation_data.action_slot = act.slots[0]


# ---------------------------------------------------------------------------- 빛
def build_lights():
    sc = bpy.context.scene
    w = bpy.data.worlds.new('Sky')
    sc.world = w
    if w.node_tree is None:
        w.use_nodes = True
    nt = w.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputWorld')
    bg = nt.nodes.new('ShaderNodeBackground')
    sky = nt.nodes.new('ShaderNodeTexSky')
    sky.sky_type = 'MULTIPLE_SCATTERING'
    sun_el, sun_az = float(arg('--sun-el', 60)) * DEG, float(arg('--sun-az', 62)) * DEG   # 아침, 해는 떨기나무 뒤쪽(동북동) 하늘. 모세와 잎이 역광을 받는다
    sky.sun_elevation = sun_el
    sky.sun_rotation = sun_az
    if hasattr(sky, 'air_density'):
        sky.air_density = 1.0
    bg.inputs['Strength'].default_value = float(arg('--sky', 0.24))
    if hasattr(sky, 'sun_disc'):
        sky.sun_disc = False
    link(nt, sky.outputs['Color'], bg.inputs['Color'])
    link(nt, bg.outputs['Background'], out.inputs['Surface'])
    sun = bpy.data.lights.new('Sun', 'SUN')
    sun.energy = 2.4
    sun.color = (1.0, 0.95, 0.88)
    sun.angle = 0.6 * DEG
    so = bpy.data.objects.new('Sun', sun)
    sc.collection.objects.link(so)
    # 해의 방향 (sky와 맞춘다): 해 쪽에서 원점으로 비춘다
    dvec = Vector((math.sin(sun_az) * math.cos(sun_el), math.cos(sun_az) * math.cos(sun_el), math.sin(sun_el)))
    so.rotation_euler = (-dvec).to_track_quat('-Z', 'Y').to_euler()
    # 불빛: 덤불 속 여러 점광원, 일렁인다
    fl = []
    r = random.Random(9)
    LK = float(arg('--light-k', 1.0))
    for k, (p, e) in enumerate((((0, 0, 0.8), 160), ((0.35, -0.2, 1.25), 90), ((-0.4, 0.15, 1.1), 90), ((0.0, 0.1, 1.9), 80))):
        e *= LK
        L = bpy.data.lights.new('Fire%d' % k, 'POINT')
        L.energy = e
        L.color = (1.0, 0.5, 0.16)
        L.shadow_soft_size = 0.45
        o = bpy.data.objects.new('Fire%d' % k, L)
        o['base_energy'] = e
        o.location = p
        sc.collection.objects.link(o)
        for f in range(-10, 1200, 3):
            L.energy = e * (0.82 + 0.3 * r.random())
            L.keyframe_insert('energy', frame=f)
        fl.append(o)
    return fl


# ---------------------------------------------------------------------------- 카메라
def camera(name, loc, look, lens, focus=None, fstop=4.0):
    cd = bpy.data.cameras.new(name)
    cd.lens = lens
    cd.sensor_fit = 'VERTICAL'
    cd.sensor_height = 24
    cd.clip_start = 0.05
    cd.clip_end = 900
    co = bpy.data.objects.new(name, cd)
    bpy.context.scene.collection.objects.link(co)
    co.location = loc
    co.rotation_euler = (Vector(look) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    if focus:
        cd.dof.use_dof = True
        cd.dof.focus_distance = (Vector(focus) - Vector(loc)).length
        cd.dof.aperture_fstop = fstop
    return co


def build_cameras():
    cams = {}
    # A: 언덕 아래에서 올려다본다 (게임의 올려다보기와 같은 쪽)
    # A: 언덕 바로 아래 비탈에서 위로 치켜본다. 비탈 끝 너머로 불붙은 덤불과 모세의 뒷모습
    cams['A'] = camera('CamA', (1.0, -11.0, ground_h(1.0, -11.0) + 1.0), (-0.55, 0.0, 2.1), 55, focus=(-0.6, -0.4, 1.0), fstop=1.2)
    # B: 불에 휩싸인 덤불 가까이
    cams['B'] = camera('CamB', (0.6, -3.6, 0.75), (0, 0, 1.0), 32, focus=(0, -0.6, 0.9), fstop=4.0)
    # C: 모세 뒤에서 불을 본다. 모세는 화면 왼쪽 아래 뒷모습
    mp = Vector((MOSES_AT[0], MOSES_AT[1], 0))
    toward = (Vector((0, 0.15, 0)) - mp).normalized()
    side = toward.cross(UP)
    cl = mp - toward * 3.0 - side * 0.6 + Vector((0, 0, 1.5))
    cams['C'] = camera('CamC', tuple(cl), (0.1, 0.2, 1.2), 34, focus=tuple(mp + Vector((0, 0, 1.2))), fstop=3.2)
    # D: 얼굴을 가리는 모세. 비스듬한 뒤쪽
    cl2 = mp - toward * 2.1 + side * 0.9 + Vector((0, 0, 1.35))
    cams['D'] = camera('CamD', tuple(cl2), tuple(mp + toward * 0.6 + Vector((0, 0, 1.3))), 38, focus=tuple(mp + Vector((0, 0, 1.4))), fstop=3.2)
    return cams


# ---------------------------------------------------------------------------- 실행
def main():
    sc = reset()
    build_ground()
    build_rocks()
    build_mountain()
    wood, th, lv, segs = build_bush()
    nofire = bool(arg('--nofire', False))
    if not nofire:
        dom, src = build_fire(segs)
        build_embers(src)
    moses, arm = build_moses()
    build_lights()
    cams = build_cameras()
    os.makedirs(OUT, exist_ok=True)
    if not nofire:
        bake_fire(dom)
    for s in SHOTS:
        sc.camera = cams[s]
        if MOSES_POSE:
            MOSES_POSE(FRAME / FPS, 1.0 if s == 'D' else 0.0)
        sc.frame_set(FRAME + (14 if s == 'D' else 0))
        sc.render.filepath = os.path.join(OUT, 'still_%s.png' % s)
        bpy.ops.render.render(write_still=True)
        print('rendered', s)


if __name__ == '__main__':
    main()
