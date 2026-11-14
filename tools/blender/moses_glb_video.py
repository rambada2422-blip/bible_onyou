# -*- coding: utf-8 -*-
"""
압도 장면 영상(bush_vision.py, vision_video.py)에 게임의 기본 모세 GLB(web3d/assets/moses.glb, B-2)를 넣는다.

    bush_vision.build_moses()가 '--moses-glb <경로>'를 받으면 moses_real.py 대신 이 파일의 build()를 쓴다.
    build() -> dict(root, pose, parts): moses_real.build()와 같은 꼴이다.
      root: 빈 물체. +Y를 보게 맞춰 두었다(부르는 쪽이 떨기나무 쪽으로 돌린다).
      pose(t, hide): hide가 0이면 Idle(3초 반복)의 t초, 0보다 크면 HideFace를 hide(0..1)만큼 진행한 자세.

- 재질: GLB의 꼭짓점 색을 Cycles 재질의 바탕색으로 쓴다(옷은 결이 보이게 거칠기를 높이고 살짝 sheen).
- 동작은 GLB 안의 액션을 시간에서 직접 계산해 뼈에 넣는다(장면의 프레임과 따로 움직인다. 불은 장면 프레임을 따른다).
"""
import bpy
import math
import re

GLB_FPS = 30
IDLE_LEN, HIDE_LEN = 3.0, 0.8


def _fcurves(act):
    """Blender 4.4+의 슬롯 액션과 예전 액션 모두에서 F커브를 꺼낸다."""
    try:
        if act.fcurves:
            return list(act.fcurves)
    except AttributeError:
        pass
    out = []
    for layer in act.layers:
        for strip in layer.strips:
            for slot in act.slots:
                cb = strip.channelbag(slot)
                if cb:
                    out.extend(cb.fcurves)
    return out


def _material(name, rough, sheen, attr):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes.get('Principled BSDF')
    vc = nt.nodes.new('ShaderNodeVertexColor')
    vc.layer_name = attr
    gm = nt.nodes.new('ShaderNodeGamma')          # 게임은 꼭짓점 색을 화면 값 그대로 쓴다. Cycles에서는 선형 값으로 바꿔야 같은 색이 된다
    gm.inputs['Gamma'].default_value = 2.2
    nt.links.new(vc.outputs['Color'], gm.inputs['Color'])
    nt.links.new(gm.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = rough
    if 'Sheen Weight' in bsdf.inputs:
        bsdf.inputs['Sheen Weight'].default_value = sheen
    return m


def build(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    arm = [o for o in new if o.type == 'ARMATURE'][0]
    meshes = [o for o in new if o.type == 'MESH']
    root = bpy.data.objects.new('MosesB2Root', None)
    bpy.context.scene.collection.objects.link(root)
    top = arm
    while top.parent is not None and top.parent in new:
        top = top.parent
    top.parent = root
    top.rotation_mode = 'XYZ'
    top.rotation_euler = (top.rotation_euler[0], top.rotation_euler[1], top.rotation_euler[2] + math.pi)   # 정면 -Y → +Y
    for o in meshes:
        me = o.data
        attr = me.color_attributes.active_color.name if me.color_attributes.active_color else (me.color_attributes[0].name if len(me.color_attributes) else 'Color')
        mats = []
        for i, slot in enumerate(o.material_slots):
            cloth = slot.material is not None and 'Cloth' in slot.material.name
            mats.append(_material('B2Video' + ('Cloth' if cloth else 'Solid') + str(i), 0.95 if cloth else 0.75, 0.35 if cloth else 0.0, attr))
        for i, m in enumerate(mats):
            o.material_slots[i].material = m
    acts = {}
    for key in ('Idle', 'HideFace', 'Walk'):           # 가져오기가 붙이는 꼬리(_MosesV2 등)와 상관없이 찾는다
        for a in bpy.data.actions:
            if a.name == key or a.name.startswith(key + '_') or a.name.startswith(key + '.') or a.name.startswith(key + '|'):
                acts[key] = a
                break
    if arm.animation_data:
        arm.animation_data.action = None
        for tr in list(arm.animation_data.nla_tracks):
            arm.animation_data.nla_tracks.remove(tr)
    curves = {k: _fcurves(a) for k, a in acts.items() if k in ('Idle', 'HideFace', 'Walk')}
    for pb in arm.pose.bones:
        pb.rotation_mode = 'QUATERNION'
    pat = re.compile(r'pose\.bones\["(.+?)"\]\.(\w+)')

    def apply(name, frame):
        for fc in curves.get(name, []):
            m = pat.match(fc.data_path)
            if not m or m.group(1) not in arm.pose.bones:
                continue
            pb = arm.pose.bones[m.group(1)]
            prop = getattr(pb, m.group(2))
            prop[fc.array_index] = fc.evaluate(frame)

    def pose(t, hide):
        if hide > 0.0:
            apply('HideFace', hide * HIDE_LEN * GLB_FPS)
        else:
            apply('Idle', (t % IDLE_LEN) * GLB_FPS)

    print('moses glb video: actions', sorted(curves), 'fcurves', {k: len(v) for k, v in curves.items()}, 'meshes', len(meshes))
    pose(0.0, 0.0)
    return dict(root=root, pose=pose, parts=meshes, objects=meshes, arm=arm)
