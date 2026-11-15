#!/bin/bash
# 새 작업 환경(컨테이너)에서 한 번 실행한다. 저장소 밖으로 나가는 것은 없다. 받은 것은 모두 .gitignore에 있다.
#   1) Blender(bpy 5.3) 파이썬 환경  → .venv-bpy/   (Cycles는 addon_utils.enable('cycles') 뒤에 쓴다)
#   2) 검증용 성경 본문               → ref/bible/
#   3) 인체 베이스 메시(CC0)          → ref/basemesh/
# 필요한 네트워크: 패키지 저장소(PyPI), raw.githubusercontent.com, download.blender.org (환경 bible_onyou에서 열려 있음)
set -euo pipefail
cd "$(dirname "$0")/.."
if [ ! -x .venv-bpy/bin/python ] || ! .venv-bpy/bin/python -c "import bpy" 2>/dev/null; then
  uv venv --python 3.13 .venv-bpy
  VIRTUAL_ENV=.venv-bpy uv pip install bpy==5.3.0 pillow
fi
.venv-bpy/bin/python -c "import bpy; print('bpy', bpy.app.version_string)" 2>/dev/null | tail -1
tools/bible_ref/fetch.sh
mkdir -p ref/basemesh
if [ ! -s ref/basemesh/human-base-meshes-bundle-v1.4.1/human_base_meshes_bundle.blend ]; then
  curl -sS -L --max-time 600 -A "Mozilla/5.0" -o ref/basemesh/hbm.zip https://download.blender.org/demo/asset-bundles/human-base-meshes/human-base-meshes-bundle-v1.4.1.zip
  echo "811f43accbb31a88266d932f8f5563b2d13586fca0ba2693aad1f5fe582b3515  ref/basemesh/hbm.zip" | sha256sum -c -
  python3 -c "import zipfile; zipfile.ZipFile('ref/basemesh/hbm.zip').extractall('ref/basemesh')" && rm ref/basemesh/hbm.zip
fi
ls -la ref/basemesh/human-base-meshes-bundle-v1.4.1/human_base_meshes_bundle.blend | awk '{print "basemesh", $5, "bytes"}'
echo "준비 끝. 모세를 다시 만드는 예:"
echo "  .venv-bpy/bin/python -I tools/blender/moses_b2.py -- ref/basemesh/human-base-meshes-bundle-v1.4.1/human_base_meshes_bundle.blend /tmp/m.glb --dump /tmp/m.json"
echo "  .venv-bpy/bin/python -I tools/blender/moses_b2_rig.py -- /tmp/m.json web3d/assets/moses.glb --check"
