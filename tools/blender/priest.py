# -*- coding: utf-8 -*-
"""
언약궤의 채를 어깨에 멘 제사장(수 3장)을 Blender로 만들어 GLB로 내보낸다. 넷이 함께 나오므로 가볍게 만든다.

실행 방법 (저장소 루트에서):
    <bpy가 설치된 파이썬> tools/blender/priest.py
    -> web3d/assets/priest.glb 를 새로 쓴다. 다른 곳에 쓰려면: ... priest.py --out /경로/priest.glb
    스킨이 늘어나는 정도까지 확인하려면 --check, 채 좌표를 JSON으로도 받으려면 --meta /경로/pole.json 을 붙인다.
    ("MeshOptimizer is not available", "Draco is not available" 경고는 무시해도 된다. bpy 설치 방법은 common.py 머리말.)

같은 폴더의 common.py(모세 스크립트를 매개변수로 바꾼 공통 부분)를 불러 쓴다. 다시 실행하면 같은 결과가 나온다.

결과물
    - 단위 미터, 옷자락 끝이 y=0, 정면이 +Z (glTF 기준), 키 1.72m
    - 뼈대 1개(뼈 21개) + 스킨 메쉬 1개(재질 2개: PriestSolid, PriestCloth[양면]). 꼭짓점 색, 텍스처 없음.
    - 클립: Carry(3.0s 반복). 오른팔을 들어 오른쪽 어깨 위의 채를 받치고 서서 아주 조금 숨쉰다.
      왼쪽 어깨에 메는 제사장은 게임에서 좌우를 뒤집어 쓴다(scale.x = -1. 채의 x도 부호를 바꾼다).

채 (모델에 들어 있지 않다. 게임이 놓는다)
    - 지름 5cm의 채를 아래 POLE 지점을 지나 Z 방향으로 놓으면 어깨에 얹히고 오른손이 그 채를 감싸 쥔다.
    - 실행하면 "PRIEST pole ..." 줄에 채의 중심 좌표와 손의 위치가 찍힌다(이 파일의 숫자를 바꾸면 값이 달라진다).
      지금 값(미터): 채 중심이 지나는 점 (x, y, z) = (-0.156, 1.393, 0.000). 어깨에 닿는 채의 아랫면은 y = 1.368.
                     손이 채를 쥔 곳 (-0.156, 1.393, +0.211), 손목 (-0.209, 1.351, +0.211).

옷 (출 39:27-29)
    - 흰 세마포 속옷(긴 통옷) 한 벌, 흰 두건, 청색·자색·홍색 실이 섞인 띠. 겉옷은 없다. 수염은 짙은 색.
    - 에봇, 흉패, 금패는 대제사장의 옷이므로 만들지 않는다.

신학 규칙(공통규칙서 3절, 스타일가이드 2절, 장면목록 ALT-02)
    - 이 파일에는 제사장 한 사람만 있다. 하나님이나 천사를 나타내는 것은 만들지 않는다. 언약궤와 채도 만들지 않는다.
    - 옷자락이 땅까지 내려와 발이 드러나지 않는다.

뼈 이름: root hips spine chest neck head beard shoulder/upperarm/forearm/hand/sleeve(.L .R) thigh/shin(.L .R)
"""
import json
import math
import os
import sys
sys.dont_write_bytecode = True          # 저장소에 __pycache__ 를 남기지 않는다
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import (Person, palette, hexc, base_prm, run, out_path, grip_ik, GOWN_AB, GOWN_Y, SLEEVE_S_LIGHT, MAT_CLOTH,
                    SH, arm_dir, UA, FA, FIST_C, V, Vector)

HEIGHT = 1.72
POLE_R = 0.025                           # 채의 반지름(지름 5cm)
POLE_X = -0.1600                         # 채가 얹히는 자리(오른쪽 어깨 위. 모세 크기 기준이며 내보낼 때 키에 맞춰 줄어든다)
GRIP_Z = 0.216                           # 손이 채를 쥐는 곳(어깨 앞)

PAL = palette(
    ROBE='#EDE6D5', ROBE_SH='#D3C9B2', ROBE_HI='#F8F3E7',          # 흰 세마포 통옷
    CLOTH='#F3EDDF', CLOTH_SH='#DAD0BA',                            # 흰 두건
    BEARD='#2F2520', BEARD_SH='#221B17', HAIR='#271E1A', BROW='#241B17')
SASH_BLUE = hexc('#3D5DA6'); SASH_PURPLE = hexc('#6C3E8C'); SASH_SCARLET = hexc('#B6302B'); SASH_EDGE = hexc('#D3C9B2')
LINING = hexc('#B3A88F')


def build(pole_r=POLE_R):
    p = Person('Priest', HEIGHT, PAL)
    p.std_bones(veil=False)
    G = p.build_robe(ab=GOWN_AB, ys=GOWN_Y, open_front=False, fold=0.018)       # 앞이 닫힌 통옷
    for s in (1, -1): p.build_sleeve(G, s, ss=SLEEVE_S_LIGHT, lining=LINING, lining_follows_sleeve=True)
    p.build_floor()
    p.build_sash(bands=[SASH_SCARLET, SASH_PURPLE, SASH_BLUE], edge=SASH_EDGE)
    for s in (1, -1):
        p.build_arm(s)
        p.build_hand(s, grip=(pole_r if s < 0 else None), finger_n=6)                       # 오른손은 채를 감아쥔다
    p.build_head(brow_size=0.80, brow_droop=0.005, brow_arch=0.006, mustache=0.9, side_hair=0.0, full_hair=True)
    p.build_beard(tip=-0.240, lean=0.060, fr=(0.30, 0.58, 0.82), taper=0.62, side_lift=0.8, edge_thin=0.85)
    p.build_turban(n=14)
    p.pose_hook = hook
    return p


# ---------------------------------------------------------------------------- 자세
POLE_Y = [1.455]                         # 채 중심의 높이. measure()가 어깨 위에 얹히도록 맞춘다.

def hook(P, prm):
    """오른손이 채를 쥐도록 팔을 푼다. 채는 Z 방향이고 엄지는 뒤쪽을 향한다(손이 바깥에서 올라와 채를 감싼다)."""
    G = Vector((POLE_X, POLE_Y[0], GRIP_Z))
    grip_ik(P, '.R', G, Vector((0, 0, -1)), Vector((-0.42, -0.80, 0.42)), wrist_tilt=0.0, r=POLE_R_M[0])


def carry(t):
    p = base_prm(spine=0.0, chest=-1.0, neck=1.0, head=-1.0, head_roll=-3.5, head_yaw=0.0,
                 UL=(0.235, -0.97, 0.0), FL=(0.165, -0.965, 0.19), handL=6.0,
                 clavR=5.0, sagR=0.020, slideR=0.095)
    b = math.sin(2 * math.pi * t / 3.0); b2 = math.sin(2 * math.pi * t / 3.0 - 1.0)
    p['spine'] += 0.15 * b; p['chest'] -= 0.5 * b; p['neck'] += 0.2 * b; p['head'] += 0.6 * b      # 아주 조금 숨쉰다
    p['head_yaw'] = 0.8 * b2
    p['clavL'] = 1.2 * b
    p['beard'] = -0.3 * b
    p['UL'] = (0.235 + 0.004 * b, -0.97, 0.0 + 0.004 * b2)
    p['FL'] = (0.165 + 0.005 * b, -0.965, 0.19 + 0.008 * b2)
    return p


def measure(p):
    """채가 어깨 위에 얹히는 높이를 잰다: 숨쉬는 동안 옷이 가장 높이 올라오는 곳에 채의 아랫면이 닿게 한다."""
    B = p.B
    cloth = set()
    for idx, col, mat in B.F:
        if mat == MAT_CLOTH: cloth.update(idx)
    headv = [i for i, w in enumerate(B.W) if sum(w.get(k, 0.0) for k in ('head', 'beard', 'neck')) > 0.5]
    R = POLE_R_M[0]
    for it in range(4):
        top = -1.0
        for t in (0.0, 0.75, 1.5, 2.25):
            pos = p.skinned(p.apply(carry(t)))
            for i in cloth:
                q = pos[i]
                if 'head' in B.W[i] or q.z < -0.16 or q.z > 0.30: continue
                dx = abs(q.x - POLE_X)
                if dx < R: top = max(top, q.y + math.sqrt(R ** 2 - dx ** 2))
        POLE_Y[0] = top + 0.001
    # 머리, 수염, 두건과의 틈
    gap = 9.0
    for t in (0.0, 0.75, 1.5, 2.25):
        pos = p.skinned(p.apply(carry(t)))
        for i in headv:
            gap = min(gap, math.hypot(pos[i].x - POLE_X, pos[i].y - POLE_Y[0]) - R)
    P = p.apply(carry(0.0))
    wrist = P.D('hand.R') @ (SH(-1) + arm_dir(-1) * (UA + FA))
    elbow = P.D('forearm.R') @ (SH(-1) + arm_dir(-1) * UA)
    return dict(gap=gap, wrist=wrist, elbow=elbow)


CLIPS = [('Carry', 3.0, carry)]

POLE_R_M = [POLE_R]
PR = build()
POLE_R_M[0] = POLE_R * max(q.y for q in PR.B.P) / HEIGHT     # 모세 크기로 잰 채의 반지름(내보낼 때 줄어들어 2.5cm가 된다)
PR = build(POLE_R_M[0])
if __name__ == '__main__':
    m = measure(PR)
    run(PR, CLIPS, out_path('priest.glb'), max_tris=5000)
    S = PR.scale
    meta = dict(pole=[round(POLE_X * S, 4), round(POLE_Y[0] * S, 4), 0.0], pole_radius=POLE_R,
                grip=[round(POLE_X * S, 4), round(POLE_Y[0] * S, 4), round(GRIP_Z * S, 4)],
                wrist=[round(v * S, 4) for v in m['wrist']], elbow=[round(v * S, 4) for v in m['elbow']],
                head_gap=round(m['gap'] * S, 4))
    print('PRIEST pole: 채 중심이 지나는 점 (x, y, z) = (%.3f, %.3f, 0.000), 방향 Z, 지름 %.3f (어깨에 닿는 아랫면 y = %.3f)' % (meta['pole'][0], meta['pole'][1], 2 * POLE_R, meta['pole'][1] - POLE_R))
    print('PRIEST hand: 손이 채를 쥔 곳 (x, y, z) = (%.3f, %.3f, %.3f), 손목 (%.3f, %.3f, %.3f), 팔꿈치 (%.3f, %.3f, %.3f)' % tuple(meta['grip'] + meta['wrist'] + meta['elbow']))
    print('PRIEST 채와 머리·수염·두건 사이의 가장 좁은 틈 %.3fm' % meta['head_gap'])
    if '--meta' in sys.argv:
        with open(sys.argv[sys.argv.index('--meta') + 1], 'w') as f: json.dump(meta, f)
