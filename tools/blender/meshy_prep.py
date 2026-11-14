# -*- coding: utf-8 -*-
"""
인물 품질 실험 C (docs/07): Meshy에서 받은 GLB를 같은 기준으로 맞춰 비교용 두 판을 만든다.

    <bpy 파이썬> tools/blender/meshy_prep.py <meshy.glb> <출력 폴더> [--rot 0] [--tris 8000]

- 모든 메시를 하나로 합치고, 키를 1.7485m(다른 모세와 같은 기준)로 맞춘 뒤 발(가장 낮은 점)을 y=0, 가운데를 원점에 둔다.
- 정면이 +Z(glTF)가 아니면 --rot(도, 위축 기준)로 돌린다. 판정은 4방향 화면으로 사람이 한다.
- 원본판(삼각형 그대로, 형상 품질 판정용)과 예산판(삼각형 --tris 이하, 8절 예산 측정용)을 내보낸다.
  텍스처가 있으면 두 판 모두 그대로 둔다(예산판의 텍스처 크기는 따로 기록).
- 내려받은 파일은 믿지 않는 자료로 다룬다: 스크립트는 실행하지 않고(use_scripts=False와 같은 효과의 가져오기만 한다)
  메시·재질·텍스처만 읽는다.
"""
import bpy
import math
import os
import sys

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
SRC, OUT = argv[0], argv[1]
ROT = float(argv[argv.index('--rot') + 1]) if '--rot' in argv else 0.0
MAX_TRIS = int(argv[argv.index('--tris') + 1]) if '--tris' in argv else 8000
TOP = 1.7485


def tris(ob):
    return sum(len(p.vertices) - 2 for p in ob.data.polygons)


def export(path, textured):
    bpy.ops.export_scene.gltf(
        filepath=path, export_format='GLB', export_yup=True, export_apply=True,
        export_texcoords=textured, export_normals=True, export_materials='EXPORT',
        export_cameras=False, export_lights=False, export_animations=False, export_skins=False)


bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
print('meshes', len(meshes), 'objects', len(bpy.data.objects))
bpy.context.view_layer.update()
for o in meshes:
    o.data = o.data.copy()
    o.data.transform(o.matrix_world)
    o.parent = None
    o.matrix_world.identity()
for o in list(bpy.data.objects):
    if o.type != 'MESH':
        bpy.data.objects.remove(o)
with bpy.context.temp_override(active_object=meshes[0], selected_editable_objects=meshes, object=meshes[0]):
    if len(meshes) > 1:
        bpy.ops.object.join()
ob = bpy.data.objects[0] if len(bpy.data.objects) == 1 else meshes[0]
me = ob.data
# 위축(Blender Z) 기준으로 돌리고 크기·위치를 맞춘다
rz = math.radians(ROT)
c, s = math.cos(rz), math.sin(rz)
for v in me.vertices:
    x, y = v.co.x, v.co.y
    v.co.x, v.co.y = c * x - s * y, s * x + c * y
zs = [v.co.z for v in me.vertices]
h = max(zs) - min(zs)
k = TOP / h
xs = [v.co.x for v in me.vertices]
ys = [v.co.y for v in me.vertices]
cx, cy, z0 = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, min(zs)
for v in me.vertices:
    v.co.x = (v.co.x - cx) * k
    v.co.y = (v.co.y - cy) * k
    v.co.z = (v.co.z - z0) * k
me.update()
imgs = [(im.name, tuple(im.size)) for im in bpy.data.images if im.size[0] > 0]
textured = bool(imgs) and len(me.uv_layers) > 0
print('source tris', tris(ob), 'materials', len(me.materials), 'uv', len(me.uv_layers), 'images', imgs,
      'scale', round(k, 4), 'dims', tuple(round(d, 3) for d in ob.dimensions))
os.makedirs(OUT, exist_ok=True)
full = os.path.join(OUT, 'meshy_full.glb')
export(full, textured)
n = tris(ob)
if n > MAX_TRIS:
    m = ob.modifiers.new('d', 'DECIMATE')
    m.ratio = MAX_TRIS / n * 0.98
    dg = bpy.context.evaluated_depsgraph_get()
    nm = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    ob.modifiers.clear()
    ob.data = nm
budget = os.path.join(OUT, 'meshy_budget.glb')
export(budget, textured)
print('OUT full', os.path.getsize(full), 'bytes;', 'budget', os.path.getsize(budget), 'bytes, tris', tris(ob),
      'materials', len(ob.data.materials))
