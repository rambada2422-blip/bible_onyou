#!/bin/bash
# 인물 제작 라인: tools/blender/people/<이름>.json → web3d/assets/<이름>.glb (모세 B-2와 같은 방법, 약 3분)
#   tools/blender/make_person.sh david
#   TRIS=7000 tools/blender/make_person.sh goliath   (500KB를 넘으면 삼각형 수를 줄여 다시 만든다)
set -euo pipefail
cd "$(dirname "$0")/../.."
N="$1"; T="${TMPDIR:-/tmp}/person_$N"; mkdir -p "$T"
.venv-bpy/bin/python -I tools/blender/moses_b2.py -- ref/basemesh/human-base-meshes-bundle-v1.4.1/human_base_meshes_bundle.blend "$T/static.glb" --dump "$T/shape.json" --spec "tools/blender/people/$N.json" ${TRIS:+--tris $TRIS} | grep -E "OUT|tris|Error" || true
.venv-bpy/bin/python -I tools/blender/moses_b2_rig.py -- "$T/shape.json" "web3d/assets/$N.glb" --check | tail -4
ls -la "web3d/assets/$N.glb"
