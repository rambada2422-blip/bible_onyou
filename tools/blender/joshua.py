# -*- coding: utf-8 -*-
"""
여호수아(수 3장, 요단 강을 건널 때 백성을 이끄는 사람)를 Blender로 만들어 GLB로 내보낸다.

실행 방법 (저장소 루트에서):
    <bpy가 설치된 파이썬> tools/blender/joshua.py
    -> web3d/assets/joshua.glb 를 새로 쓴다. 다른 곳에 쓰려면: ... joshua.py --out /경로/joshua.glb
    스킨이 늘어나는 정도까지 확인하려면 뒤에 --check 를 붙인다.
    ("MeshOptimizer is not available", "Draco is not available" 경고는 무시해도 된다. bpy 설치 방법은 common.py 머리말.)

같은 폴더의 common.py(모세 스크립트를 매개변수로 바꾼 공통 부분)를 불러 쓴다. 다시 실행하면 같은 결과가 나온다.

결과물
    - 단위 미터, 옷자락 끝이 y=0, 정면이 +Z (glTF 기준), 키 1.76m
    - 뼈대 1개(뼈 22개) + 스킨 메쉬 1개(재질 2개: JoshuaSolid, JoshuaCloth[양면]). 꼭짓점 색, 텍스처 없음.
    - 클립: Idle(3.0s 반복. 두 팔을 내리고 곧게 서서 숨쉰다), Walk(1.1s 반복, 제자리)
      게임에서는 항상 Idle을 틀어 둔다(뼈대의 기본 자세는 팔을 벌린 A자세다).

모세와 구별되는 점 (이 장면에 모세가 없다는 것이 게임의 단서다)
    - 붉은 겉옷, 짙은 갈색 머리와 짧은 수염, 황토색 머리쓰개(어깨까지만 내려온다), 줄무늬 없는 속옷, 갈색 허리띠
    - 지팡이를 들지 않는다. 등을 굽히지 않고 곧게 선다.

신학 규칙(공통규칙서 3절, 스타일가이드 2절, 장면목록 ALT-02)
    - 이 파일에는 여호수아만 있다. 하나님이나 천사를 나타내는 것은 만들지 않는다.
    - 본문에 여호수아의 나이나 생김새 묘사가 없으므로 흉터, 무기, 갑옷 같은 것은 넣지 않는다.
    - 옷자락이 땅까지 내려와 발이 드러나지 않는다.
    - 팔을 뻗어 가리키거나 손을 내미는 동작은 넣지 않는다. 수 3장 본문에 그런 손짓이 없고,
      모세가 바다 위로 손을 내민 장면(출 14장)과 겹쳐 손짓이 물을 멈춘 것처럼 읽힐 수 있기 때문이다.

뼈 이름: root hips spine chest neck head beard veil shoulder/upperarm/forearm/hand/sleeve(.L .R) thigh/shin(.L .R)
"""
import math
import os
import sys
sys.dont_write_bytecode = True          # 저장소에 __pycache__ 를 남기지 않는다
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import Person, palette, base_prm, run, out_path

HEIGHT = 1.76

PAL = palette(
    ROBE='#B0302A', ROBE_SH='#84221E', ROBE_HI='#C94836',          # 붉은 겉옷
    TUNIC='#E7DAB9', STRIPE='#D6C59E',                              # 속옷: 줄무늬 대신 옅은 주름 색
    BELT='#5B3D26', BELT_SH='#432B1A',
    BEARD='#3B2A1F', BEARD_SH='#2B1E16', HAIR='#30231A', BROW='#2C2018',
    CLOTH='#CFA962', CLOTH_SH='#B58F4C', CLOTH_STRIPE='#7E4F2A', CORD='#3A2A20', CORD_SH='#291D16')


def build():
    p = Person('Joshua', HEIGHT, PAL)
    p.std_bones()
    G = p.build_robe()                                  # 앞이 열린 겉옷
    for s in (1, -1): p.build_sleeve(G, s)
    p.build_tunic(hem_stripe=False)
    for s in (1, -1):
        p.build_arm(s)
        p.build_hand(s)
    p.build_head(brow_size=0.78, brow_droop=0.004, brow_arch=0.006, mustache=0.9, side_hair=0.0)
    p.build_beard(tip=-0.226, lean=0.050, fr=(0.30, 0.58, 0.82), taper=0.66)
    p.build_headcloth(drop=0.80)
    return p


# ---------------------------------------------------------------------------- 자세
def stand():
    """곧게 선 자세."""
    return base_prm(spine=0.0, chest=-1.5, neck=1.0, head=-1.5,
                    UL=(0.235, -0.97, 0.0), FL=(0.165, -0.965, 0.19), UR=(-0.235, -0.97, 0.0), FR=(-0.165, -0.965, 0.19),
                    handL=6.0, handR=6.0)


def idle(t):
    p = stand()
    b = math.sin(2 * math.pi * t / 3.0); b2 = math.sin(2 * math.pi * t / 3.0 - 1.0)
    p['spine'] += 0.3 * b; p['chest'] -= 1.8 * b; p['neck'] += 0.3 * b; p['head'] += 1.0 * b
    p['head_yaw'] = 1.4 * b2
    p['clavL'] = 2.4 * b; p['clavR'] = 2.4 * b
    p['hip_t'] = (0.003 * b2, 0.0, 0.0)
    p['beard'] = -0.5 * b; p['veil'] = -0.5 * b
    for k, s in (('L', 1), ('R', -1)):
        p['U' + k] = (s * (0.235 + 0.006 * b), -0.97, 0.0 + 0.008 * b2)
        p['F' + k] = (s * (0.165 + 0.008 * b), -0.965, 0.19 + 0.016 * b2)
    return p


def walk(t):
    p = stand()
    ph = 2 * math.pi * t / 1.1
    s, c = math.sin(ph), math.cos(ph)
    p['th.L'] = 17 * s; p['kn.L'] = 25 * max(0.0, c) ** 1.2 + 3
    p['th.R'] = -17 * s; p['kn.R'] = 25 * max(0.0, -c) ** 1.2 + 3
    p['hip_t'] = (0.010 * s, 0.004 + 0.012 * abs(c), 0.0)
    p['hip_yaw'] = 4.5 * s
    p['spine'] = 2.0; p['chest'] = 1.5 + 0.8 * math.cos(2 * ph); p['chest_yaw'] = -8.0 * s
    p['neck'] = 2.0; p['head'] = -2.5 - 0.8 * math.cos(2 * ph + 0.6); p['head_yaw'] = 3.5 * s
    p['beard'] = 1.2 * math.cos(2 * ph + 1.0); p['veil'] = 2.5 * math.cos(2 * ph + 1.4)
    for k, sx, sw in (('L', 1, -s), ('R', -1, s)):      # 팔은 같은 쪽 다리와 반대로 흔든다
        p['U' + k] = (sx * 0.24, -0.95, 0.02 + 0.30 * sw)
        p['F' + k] = (sx * 0.17, -0.90, 0.30 + 0.36 * sw)
    p['sagL'] = p['sagR'] = 0.04
    return p


CLIPS = [('Idle', 3.0, idle), ('Walk', 1.1, walk)]

J = build()
if __name__ == '__main__':
    run(J, CLIPS, out_path('joshua.glb'))
