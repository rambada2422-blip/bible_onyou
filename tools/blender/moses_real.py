# -*- coding: utf-8 -*-
"""
압도 장면 영상용 모세 (사실적인 비율과 천). 게임 화면의 모세(moses.py, 인형풍)와 따로 쓴다.
대표 결정 2026-11-14: "영상용 모세를 새로 만들어".

쓰는 곳: tools/blender/bush_vision.py, vision_video.py 에서 build()를 불러 장면에 넣는다.
    m = moses_real.build()          # 원점에 서서 +Y를 바라본다. 키 1.75m, 옷자락 끝이 z=0
    m['root'].location = ...        # 자리와 방향은 부르는 쪽에서 정한다
    m['pose'](t, hide)              # t: 초(숨 쉬는 작은 움직임), hide: 0~1 (1이면 얼굴을 가린 자세)

신학 규칙(공통규칙서 3절, 장면목록 EX-01, 지시서 6.5)
    - 영상에서는 뒷모습과 윤곽만 보인다. 얼굴은 만들지 않는다(머리쓰개 안은 어둡게 비운다).
    - 옷자락이 땅까지 내려와 발이 드러나지 않는다. 신도, 벗어 놓은 신도 만들지 않는다.
    - 얼굴을 가리는 동작(3:6)은 선 채로 한 팔을 들어 얼굴 앞을 가리는 것이다. 무릎을 꿇지 않는다.

만드는 방법
    - 몸통 옷(속옷), 겉옷(앞이 트인 망토), 머리쓰개를 둘레 x 높이 격자로 만들고,
      세로로 늘인 잡음으로 주름을 판다(아래로 갈수록 깊다). 마지막에 세분화 표면으로 부드럽게 한다.
    - 팔은 소매 두 토막과 손으로, 빈 물체(관절)에 붙여 돌린다(어깨-팔꿈치-손목).
    - 지팡이는 조금 굽은 자연목. 왼손에 쥔다. 얼굴은 오른팔로 가린다.
"""
import bpy
import bmesh
import math
from mathutils import Vector, Matrix, Euler, noise

DEG = math.pi / 180


def _mat(name, base, rough=0.92, sheen=0.5, stripes=None, transl=0.0, bump=0.35):
    m = bpy.data.materials.new(name)
    if m.node_tree is None:
        m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    b.inputs['Roughness'].default_value = rough
    if 'Sheen Weight' in b.inputs:
        b.inputs['Sheen Weight'].default_value = sheen
    tc = nt.nodes.new('ShaderNodeTexCoord')
    col_out = None
    if stripes:
        # 세로 줄무늬 (모직 겉옷)
        wv = nt.nodes.new('ShaderNodeTexWave')
        wv.wave_type = 'BANDS'
        wv.bands_direction = 'X'
        wv.inputs['Scale'].default_value = stripes[0]
        wv.inputs['Distortion'].default_value = 1.5
        nt.links.new(tc.outputs['Object'], wv.inputs['Vector'])
        ramp = nt.nodes.new('ShaderNodeValToRGB')
        ramp.color_ramp.elements[0].color = base + (1,)
        ramp.color_ramp.elements[1].color = stripes[1] + (1,)
        ramp.color_ramp.elements[0].position = 0.55
        ramp.color_ramp.elements[1].position = 0.75
        nt.links.new(wv.outputs['Fac'], ramp.inputs['Fac'])
        col_out = ramp.outputs['Color']
    else:
        b.inputs['Base Color'].default_value = base + (1,)
    # 거친 직물 결
    nz = nt.nodes.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = 260
    nz.inputs['Detail'].default_value = 4
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    if col_out is not None:
        mx = nt.nodes.new('ShaderNodeMix')
        mx.data_type = 'RGBA'
        mx.blend_type = 'MULTIPLY'
        mx.inputs['Factor'].default_value = 0.25
        nt.links.new(col_out, mx.inputs['A'])
        nt.links.new(nz.outputs['Color'], mx.inputs['B'])
        nt.links.new(mx.outputs['Result'], b.inputs['Base Color'])
    bp = nt.nodes.new('ShaderNodeBump')
    bp.inputs['Strength'].default_value = bump
    bp.inputs['Distance'].default_value = 0.004
    nt.links.new(nz.outputs['Fac'], bp.inputs['Height'])
    nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    shader = b.outputs['BSDF']
    if transl > 0:
        tr = nt.nodes.new('ShaderNodeBsdfTranslucent')
        tr.inputs['Color'].default_value = base + (1,)
        ms = nt.nodes.new('ShaderNodeMixShader')
        ms.inputs['Fac'].default_value = transl
        nt.links.new(shader, ms.inputs[1])
        nt.links.new(tr.outputs['BSDF'], ms.inputs[2])
        shader = ms.outputs['Shader']
    nt.links.new(shader, out.inputs['Surface'])
    return m


def _obj(name, verts, faces, mat, parent=None, subsurf=1, smooth=True, thick=0.0):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    me.materials.append(mat)
    if thick:
        sd = ob.modifiers.new('thick', 'SOLIDIFY')
        sd.thickness = thick
    if subsurf:
        md = ob.modifiers.new('sub', 'SUBSURF')
        md.levels = subsurf
        md.render_levels = subsurf
    if parent:
        ob.parent = parent
    return ob


def _empty(name, loc, parent=None):
    e = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(e)
    e.location = loc
    e.rotation_mode = 'XYZ'
    if parent:
        e.parent = parent
    return e


def _sheet(nu, nv, fn, closed=True):
    """둘레 nu x 높이 nv 격자. fn(u 0..1, v 0..1) -> Vector"""
    verts, faces = [], []
    cols = nu if closed else nu + 1
    for j in range(nv + 1):
        for i in range(cols):
            verts.append(fn(i / nu, j / nv))
    for j in range(nv):
        for i in range(nu if closed else nu):
            a = j * cols + i
            b = j * cols + (i + 1) % cols if closed else a + 1
            faces.append((a, b, b + cols, a + cols))
    return verts, faces


def _folds(theta, z, amp, seed):
    """세로로 흐르는 옷 주름: 둘레 방향으로 촘촘하고 위아래로 긴 잡음"""
    p = Vector((math.cos(theta) * 2.2 + seed, math.sin(theta) * 2.2, z * 0.9))
    n1 = noise.noise(Vector((p.x * 1.6, p.y * 1.6, p.z * 0.5)))
    n2 = noise.noise(Vector((p.x * 3.4 + 7, p.y * 3.4, p.z * 0.9)))
    ridge = 1 - abs(noise.noise(Vector((p.x * 2.4 + 3, p.y * 2.4, p.z * 0.35))))
    return amp * (0.55 * n1 + 0.25 * n2 + 0.45 * (ridge - 0.5))


def _lerp(a, b, t):
    return a + (b - a) * t


def _profile(z, keys):
    """keys: [(z, a, b)] 아래에서 위로. z에서의 가로(a), 앞뒤(b) 반지름"""
    if z <= keys[0][0]:
        return keys[0][1], keys[0][2]
    for k in range(len(keys) - 1):
        z0, a0, b0 = keys[k]
        z1, a1, b1 = keys[k + 1]
        if z <= z1:
            t = (z - z0) / (z1 - z0)
            t = t * t * (3 - 2 * t)
            return _lerp(a0, a1, t), _lerp(b0, b1, t)
    return keys[-1][1], keys[-1][2]


def build():
    # 재질: 거친 모직과 삼베 (게임 모세의 색 계열을 따르되 바랜 실제 천 색)
    m_tunic = _mat('MR_Tunic', (0.42, 0.33, 0.24), sheen=0.6)
    m_mantle = _mat('MR_Mantle', (0.085, 0.062, 0.046), stripes=(2.2, (0.11, 0.08, 0.058)), sheen=0.7, bump=0.5)
    m_head = _mat('MR_HeadCloth', (0.55, 0.50, 0.42), sheen=0.5, transl=0.12)
    m_skin = _mat('MR_Skin', (0.30, 0.17, 0.10), rough=0.6, sheen=0.0, bump=0.1)
    m_dark = _mat('MR_Shadow', (0.01, 0.008, 0.006), rough=1.0, sheen=0.0, bump=0.0)
    m_wood = _mat('MR_Staff', (0.16, 0.10, 0.06), rough=0.75, sheen=0.0, bump=1.0)

    root = _empty('MosesReal', (0, 0, 0))
    hips = _empty('MR_hips', (0, 0, 0.95), root)
    chest = _empty('MR_chest', (0, 0, 0.35), hips)          # z 1.30
    head = _empty('MR_head', (0, 0.01, 0.25), chest)        # z 1.55 (목)

    # 속옷(몸통 옷): 목에서 땅까지. 앞은 +Y
    tunic_keys = [(0.0, 0.30, 0.27), (0.25, 0.27, 0.23), (0.85, 0.20, 0.15), (1.02, 0.175, 0.13), (1.28, 0.20, 0.145), (1.42, 0.215, 0.13), (1.50, 0.11, 0.09), (1.56, 0.065, 0.065)]
    def tunic(u, v):
        th = u * 2 * math.pi
        z = v * 1.56
        a, b = _profile(z, tunic_keys)
        depth = max(0.0, (1.0 - z / 1.0))
        r = 1 + _folds(th, z, 0.02 + 0.12 * depth * depth, 1.0) * (1 if z < 1.42 else 0.2)
        hem = 0.0
        if v == 0:
            hem = 0.012 * noise.noise(Vector((math.cos(th) * 3, math.sin(th) * 3, 2.0)))
        return Vector((math.sin(th) * a * r, math.cos(th) * b * r, z + hem))
    v_, f_ = _sheet(64, 70, tunic)
    tun = _obj('MR_Tunic', [x - Vector((0, 0, 0.95)) for x in v_], f_, m_tunic, hips)

    # 겉옷: 어깨에서 발목 위까지, 앞은 트였다(앞쪽 70도 빔). 속옷보다 조금 크다
    # 겉옷: 어깨에서 발목 위까지, 앞은 트였다
    mantle_keys = [(0.10, 0.37, 0.32), (0.5, 0.30, 0.245), (0.95, 0.245, 0.185), (1.25, 0.26, 0.175), (1.42, 0.272, 0.16), (1.48, 0.16, 0.11)]
    open_half = 38 * DEG
    def mantle(u, v):
        th = open_half + u * (2 * math.pi - 2 * open_half)   # 앞(+Y, th=0)을 비운다
        z = 0.10 + v * 1.38
        a, b = _profile(z, mantle_keys)
        depth = max(0.0, (1.0 - (z - 0.1) / 1.1))
        hood = False
        r = 1 + _folds(th, z, (0.035 + 0.14 * depth) if not hood else 0.05, 5.0)
        # 겉옷 속의 팔이 옆구리에 조금 드러난다
        arm = math.exp(-((abs(math.sin(th)) - 1) / 0.12) ** 2) * max(0.0, min(1.0, (z - 0.95) / 0.1)) * max(0.0, min(1.0, (1.43 - z) / 0.08))
        r += 0.11 * arm
        # 앞 자락은 안쪽으로 조금 말린다
        edge = min(u, 1 - u)
        r *= 1 - 0.06 * max(0.0, 1 - edge / 0.05)
        yo = 0.02 if hood else 0.0
        return Vector((math.sin(th) * a * r * 1.02, math.cos(th) * b * r * 1.04 + yo, z))
    v_, f_ = _sheet(70, 64, mantle, closed=False)
    man = _obj('MR_Mantle', [x - Vector((0, 0, 0.95)) for x in v_], f_, m_mantle, hips, thick=0.012)

    # 머리: 어두운 속(얼굴 없음)을 머리쓰개가 감싼다. 머리쓰개는 어깨와 등으로 늘어진다
    hd = bmesh.new()
    bmesh.ops.create_uvsphere(hd, u_segments=24, v_segments=16, radius=0.082)
    for vv in hd.verts:
        vv.co = Vector((vv.co.x * 1.0, vv.co.y * 1.0, vv.co.z * 1.1)) + Vector((0, 0.0, 0.13))
    me = bpy.data.meshes.new('MR_HeadCore')
    hd.to_mesh(me)
    hd.free()
    core = bpy.data.objects.new('MR_HeadCore', me)
    bpy.context.scene.collection.objects.link(core)
    me.materials.append(m_dark)
    core.parent = head
    m_shawl = _mat('MR_HeadCloth', (0.30, 0.21, 0.13), sheen=0.6, transl=0.06, bump=0.4)
    def headcloth(u, v):
        # 둘레 전체를 감싼다. 얼굴 자리(앞)는 구멍이 아니라 안으로 들어간 그늘이다
        th = u * 2 * math.pi
        dx, dy = math.sin(th), math.cos(th)
        back = 0.5 - 0.5 * dy
        side = abs(dx)
        front = max(0.0, dy) ** 6                 # 정면 근처만 1
        R0, cz = 0.108, 0.14
        if v <= 0.45:
            phi = (v / 0.45) * 100 * DEG
            r = R0 * math.sin(phi)
            z = cz + R0 * math.cos(phi)
            face = front * max(0.0, min(1.0, (phi - 35 * DEG) / (25 * DEG)))
            return Vector((dx * r * (1 - 0.25 * face), dy * r * 1.05 - 0.075 * face + 0.01, z))
        s_ = (v - 0.45) / 0.55
        r_top = R0 * math.sin(100 * DEG)
        z_top = cz + R0 * math.cos(100 * DEG)
        L = 0.20 + 0.24 * back * back - 0.06 * front
        R1 = 0.15 + 0.07 * side * side - 0.02 * back
        r = r_top + (R1 - r_top) * math.sqrt(s_)
        z = z_top - L * s_
        f = _folds(th, z * 4 + 1, 0.08 * s_, 9.0)
        face = front * max(0.0, 1 - s_ * 1.5)
        return Vector((dx * r * (1 + f) * (1 - 0.25 * face), dy * r * (1 + f) - 0.075 * face + 0.01 - 0.02 * back * s_, z))
    v_, f_ = _sheet(56, 32, headcloth, closed=True)
    hc = _obj('MR_HeadCloth', v_, f_, m_shawl, head, thick=0.006)

    # 팔: 어깨 관절 → 팔꿈치 → 손목. 소매는 넓고 손목 쪽이 더 넓다
    arms = {}
    for side, sx in (('R', 1), ('L', -1)):
        sh = _empty('MR_shoulder.' + side, (sx * 0.20, 0.0, 0.10), chest)     # 가슴 기준 (z 1.40)
        el = _empty('MR_elbow.' + side, (0, 0, -0.29), sh)
        wr = _empty('MR_wrist.' + side, (0, 0, -0.26), el)
        def sleeve(r0, r1, L, seed):
            def fn(u, v):
                th = u * 2 * math.pi
                r = _lerp(r0, r1, v) * (1 + _folds(th, v * 2, 0.08 + 0.1 * v, seed))
                sag = 0.025 * v * v       # 넓은 소매가 아래로 처진다
                return Vector((math.sin(th) * r, math.cos(th) * r - sag * 0.3, -v * L - sag))
            return fn
        v_, f_ = _sheet(20, 10, sleeve(0.065, 0.075, 0.31, 11 + sx))
        up = _obj('MR_SleeveU.' + side, v_, f_, m_mantle, sh)
        v_, f_ = _sheet(22, 10, sleeve(0.07, 0.115, 0.28, 17 + sx))
        lo = _obj('MR_SleeveL.' + side, v_, f_, m_mantle, el)
        hb = bmesh.new()
        bmesh.ops.create_uvsphere(hb, u_segments=12, v_segments=8, radius=0.045)
        for vv in hb.verts:
            vv.co = Vector((vv.co.x * 0.8, vv.co.y * 1.0, vv.co.z * 1.25)) + Vector((0, 0.0, -0.05))
        me = bpy.data.meshes.new('MR_Hand.' + side)
        hb.to_mesh(me)
        hb.free()
        hand = bpy.data.objects.new('MR_Hand.' + side, me)
        bpy.context.scene.collection.objects.link(hand)
        me.materials.append(m_skin)
        for p in me.polygons:
            p.use_smooth = True
        hand.parent = wr
        arms[side] = (sh, el, wr)

    # 지팡이: 왼손에 쥔 조금 굽은 자연목 (위쪽 끝이 손 위로 올라간다)
    pts = []
    for k in range(17):
        t = k / 16
        bend = 0.03 * math.sin(t * math.pi * 1.3) + 0.012 * noise.noise(Vector((t * 4, 1.0, 2.0)))
        pts.append(Vector((bend, 0.01 * math.sin(t * 5), -1.0 + t * 1.85)))
    sv, sf = [], []
    for k, p in enumerate(pts):
        r = 0.016 - 0.004 * (k / 16)
        for s in range(8):
            a = s / 8 * 2 * math.pi
            sv.append(p + Vector((math.cos(a) * r, math.sin(a) * r, 0)))
    for k in range(16):
        for s in range(8):
            a, b = k * 8 + s, k * 8 + (s + 1) % 8
            sf.append((a, b, b + 8, a + 8))
    staff = _obj('MR_Staff', sv, sf, m_wood, arms['L'][2], subsurf=0)

    parts = [o for o in bpy.data.objects if o.name.startswith('MR_') or o.name == 'MosesReal']

    def pose(t, hide):
        """t: 초, hide: 0~1"""
        h = max(0.0, min(1.0, hide))
        e = h * h * (3 - 2 * h)
        br = math.sin(t * 2 * math.pi / 4.2)
        chest.rotation_euler = Euler((0.012 * br + 0.10 * e, 0, 0))
        hips.rotation_euler = Euler((0.0, 0, 0))
        head.rotation_euler = Euler((0.05 + 0.24 * e, 0, 0.0))
        # 왼팔: 지팡이를 짚는다 (팔을 조금 앞으로, 팔꿈치를 굽혀)
        shL, elL, wrL = arms['L']
        shL.rotation_euler = Euler((22 * DEG + 2 * DEG * br, 0, -8 * DEG))
        elL.rotation_euler = Euler((40 * DEG, 0, 0))
        wrL.rotation_euler = Euler((-62 * DEG, 0, 0))
        # 오른팔: 가만히 내린 자세 → 얼굴 앞을 가리는 자세
        shR, elR, wrR = arms['R']
        shR.rotation_euler = Euler((_lerp(6, 112, e) * DEG, 0, _lerp(6, -32, e) * DEG))
        elR.rotation_euler = Euler((_lerp(10, 112, e) * DEG, 0, _lerp(0, 18, e) * DEG))
        wrR.rotation_euler = Euler((_lerp(0, 10, e) * DEG, 0, 0))

    pose(0.0, 0.0)
    return dict(root=root, pose=pose, parts=parts, objects=parts)


if __name__ == '__main__':
    # 단독 시험: venv/bin/python tools/blender/moses_real.py <출력 png> [hide]
    import sys
    import addon_utils
    addon_utils.enable('cycles', default_set=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    addon_utils.enable('cycles', default_set=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.samples = 24
    sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = 360, 640
    sc.view_settings.view_transform = 'AgX'
    m = build()
    hide = float(sys.argv[-1]) if len(sys.argv) > 2 else 0.0
    m['pose'](0.0, hide)
    w = bpy.data.worlds.new('w')
    sc.world = w
    if w.node_tree is None:
        w.use_nodes = True
    w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.6
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN'))
    sun.data.energy = 3
    sun.rotation_euler = (50 * DEG, 0, 140 * DEG)
    sc.collection.objects.link(sun)
    cams = []
    for k, (loc, look) in enumerate((((1.6, -3.2, 1.3), (0, 0, 0.95)), ((-1.2, -2.6, 1.5), (0, 0, 1.1)))):
        cd = bpy.data.cameras.new('c%d' % k)
        cd.lens = 40
        co = bpy.data.objects.new('c%d' % k, cd)
        sc.collection.objects.link(co)
        co.location = loc
        co.rotation_euler = (Vector(look) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
        cams.append(co)
    # 시험 화면: 모세는 +Y를 보고, 카메라는 뒤(-Y)에 있다
    out = sys.argv[1] if len(sys.argv) > 1 else '/tmp/moses_real.png'
    for k, co in enumerate(cams):
        sc.camera = co
        sc.render.filepath = out.replace('.png', '_%d.png' % k)
        bpy.ops.render.render(write_still=True)
