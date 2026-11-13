# -*- coding: utf-8 -*-
"""
압도 장면 영상 만들기: 불붙은 떨기나무 (지시서 6.5절, 대표 승인 2026-11-13).
장면 모양은 bush_vision.py가 만들고, 이 파일은 영상을 빠르게 뽑기 위해 층으로 나눠 그린 뒤 합친다.

실행 (저장소 루트에서, bpy가 설치된 파이썬):
    venv/bin/python tools/blender/vision_video.py --work <작업 폴더> [--only A,B] [--test 24] [--res 540x960]
    끝나면 <작업 폴더>/vision_bush.mp4 가 생긴다. 게임에 쓰려면 web3d/assets/vision_bush.mp4 로 복사한다.

층 (모두 장면의 선형 빛 값으로 저장해 더한 뒤, 마지막에 Blender의 AgX로 화면 색을 만든다)
    배경-해: 해와 하늘만. 장면마다 한 번
    배경-불빛: 덤불 속 불빛만. 장면마다 한 번. 프레임마다 일렁임 값을 곱해 더한다
    불: 불꽃과 불티. 다른 물체는 가림막(holdout)으로만 쓴다. 프레임마다, 절반 크기로 그려 키운다
    모세: 모세만. 장면 C, D에서 프레임마다 (얼굴을 가리는 동작이 있으므로)
    배경에서 모세는 그림자만 남기고 보이지 않게 한다.

신학 규칙은 bush_vision.py 머리말과 같다. 완성된 영상은 모든 장면을 사람이 눈으로 확인한다.
"""
import bpy
import math
import os
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import bush_vision as bv  # noqa: E402

arg = bv.arg
WORK = os.path.abspath(arg('--work', os.path.join(bv.ROOT, 'dist', 'vision_work')))
ONLY = str(arg('--only', 'A,B,C,D')).split(',')
TEST = int(arg('--test', 0))           # 0이 아니면 장면마다 앞의 N프레임만
W, H = [int(v) for v in str(arg('--res', '540x960')).split('x')]
FIRE_SCALE = float(arg('--fire-scale', 0.5))
FIRE_SAMPLES = int(arg('--fire-samples', 12))
BG_SAMPLES = int(arg('--bg-samples', 96))
MOSES_SAMPLES = int(arg('--moses-samples', 32))
FPS = bv.FPS

# 장면표: 전체 30초(720프레임). zoom은 처음→끝 확대 비율(천천히 다가가기)
SHOTS = [
    dict(key='A', start=0, end=144, zoom=(1.0, 1.10), moses=False),
    dict(key='B', start=144, end=300, zoom=(1.0, 1.08), moses=False),
    dict(key='C', start=300, end=504, zoom=(1.0, 1.05), moses=True),
    dict(key='D', start=504, end=720, zoom=(1.03, 1.0), moses=True, hide_at=528),
]


def flick(t):
    """불빛의 일렁임 (모든 층이 같은 값을 쓴다)"""
    return 1.0 + 0.11 * math.sin(t * 7.3) + 0.07 * math.sin(t * 12.1 + 1.0) + 0.05 * math.sin(t * 3.1 + 2.0) + 0.03 * math.sin(t * 19.7 + 0.4)


# ---------------------------------------------------------------------------- 장면 준비
def build():
    sc = bv.reset()
    sc.render.resolution_x, sc.render.resolution_y = W, H
    ground = bv.build_ground()
    bv.build_rocks()
    bv.build_mountain()
    wood, th, lv, segs = bv.build_bush()
    dom, src = bv.build_fire(segs)
    bv.build_embers(src)
    moses, arm = bv.build_moses()
    lights = bv.build_lights()
    cams = bv.build_cameras()
    # 불빛 세기: 기준값을 기억해 두고, 일렁임은 층을 합칠 때 곱한다
    base = {}
    for L in lights:
        if L.data.animation_data:
            L.data.animation_data_clear()
        base[L.name] = float(L.get('base_energy', L.data.energy))
    sun = bpy.data.objects['Sun']
    moses_objs = [o for o in bpy.data.objects if o == moses or o.parent == moses or (o.parent and o.parent.parent == moses)]
    return dict(sc=sc, dom=dom, src=src, moses=moses, arm=arm, moses_objs=moses_objs, lights=lights, base=base, sun=sun, cams=cams)


def nla_moses(S, hide_at):
    """모세 동작: 처음엔 가만히 숨 쉬고(Idle 반복), hide_at 프레임에 얼굴을 가린다(HideFace, 끝 자세 유지)"""
    arm = S['arm']
    if not arm:
        return
    def find(name):
        for a in bpy.data.actions:
            if a.name == name or a.name.startswith(name):
                return a
        return None
    idle, hide = find('Idle'), find('HideFace')
    ad = arm.animation_data_create()
    ad.action = None
    for t in list(ad.nla_tracks):
        ad.nla_tracks.remove(t)
    tr = ad.nla_tracks.new()
    if idle:
        st = tr.strips.new('idle', 1, idle)
        if hasattr(st, 'action_slot') and idle.slots:
            st.action_slot = idle.slots[0]
        length = st.frame_end - st.frame_start
        st.repeat = max(1.0, (hide_at if hide_at else 900) / max(1.0, length))
    if hide and hide_at:
        tr2 = ad.nla_tracks.new()
        st2 = tr2.strips.new('hide', hide_at + 1, hide)
        if hasattr(st2, 'action_slot') and hide.slots:
            st2.action_slot = hide.slots[0]
        st2.extrapolation = 'HOLD_FORWARD'
        st2.blend_in = 4


def set_mode(S, mode, shot):
    """mode: 'sun' | 'firelight' | 'fire' | 'moses'"""
    sc = S['sc']
    world_bg = sc.world.node_tree.nodes.get('Background')
    solid = [o for o in bpy.data.objects if o.type == 'MESH' and o not in (S['dom'], S['src']) and o.name != 'EmberShape']
    for o in bpy.data.objects:
        o.hide_render = False
        o.is_holdout = False
        o.visible_camera = True
        o.visible_shadow = True
    S['src'].show_instancer_for_render = False
    sc.render.film_transparent = mode in ('fire', 'moses')
    sky = bv.arg('--sky', 0.24)
    world_bg.inputs['Strength'].default_value = float(sky) if mode in ('sun', 'moses') else 0.0
    S['sun'].hide_render = mode not in ('sun', 'moses')
    for L in S['lights']:
        L.hide_render = mode not in ('firelight', 'moses')
        L.data.energy = S['base'][L.name]
    fire_on = mode == 'fire'
    S['dom'].hide_render = not fire_on
    S['src'].hide_render = not fire_on
    bpy.data.objects['EmberShape'].hide_render = not fire_on
    if mode in ('sun', 'firelight'):
        sc.cycles.samples = BG_SAMPLES
        sc.render.resolution_percentage = 100
        if shot['moses']:
            for o in S['moses_objs']:
                o.visible_camera = False   # 그림자만 남긴다
    elif mode == 'fire':
        sc.cycles.samples = FIRE_SAMPLES
        sc.render.resolution_percentage = int(FIRE_SCALE * 100)
        for o in solid:
            o.is_holdout = True
    elif mode == 'moses':
        sc.cycles.samples = MOSES_SAMPLES
        sc.render.resolution_percentage = 100
        for o in solid:
            if o not in S['moses_objs']:
                o.visible_camera = False
    sc.render.image_settings.file_format = 'OPEN_EXR'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.render.image_settings.color_depth = '16'


def render_to(path):
    sc = bpy.context.scene
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


# ---------------------------------------------------------------------------- 그림 읽고 합치기
def load_exr(path):
    img = bpy.data.images.load(path, check_existing=False)
    w, h = img.size
    a = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(a)
    bpy.data.images.remove(img)
    return a.reshape(h, w, 4)            # 아래 줄부터 (Blender 순서)


def resize(a, h, w):
    """이중선형 크기 바꾸기"""
    H0, W0 = a.shape[:2]
    ys = (np.arange(h) + 0.5) * H0 / h - 0.5
    xs = (np.arange(w) + 0.5) * W0 / w - 0.5
    return sample(a, ys[:, None] + np.zeros((1, w)), xs[None, :] + np.zeros((h, 1)))


def sample(a, ys, xs):
    H0, W0 = a.shape[:2]
    ys = np.clip(ys, 0, H0 - 1.001)
    xs = np.clip(xs, 0, W0 - 1.001)
    y0 = np.floor(ys).astype(np.int32)
    x0 = np.floor(xs).astype(np.int32)
    fy = (ys - y0)[..., None]
    fx = (xs - x0)[..., None]
    return (a[y0, x0] * (1 - fy) * (1 - fx) + a[y0 + 1, x0] * fy * (1 - fx) + a[y0, x0 + 1] * (1 - fy) * fx + a[y0 + 1, x0 + 1] * fy * fx)


def blur(a, k=6):
    """작게 줄였다 키워 흐리게"""
    h, w = a.shape[:2]
    s = resize(a, max(2, h // k), max(2, w // k))
    return resize(s, h, w)


def compose(S, shot, f, layers, out_png):
    t = (f + 1) / FPS
    sun, firel, fire, mo = layers['sun'], layers['firelight'], layers['fire'], layers.get('moses')
    bg = sun[..., :3] + firel[..., :3] * flick(t)
    fr = resize(fire, H, W)
    # 아지랑이: 불 위쪽 공기가 일렁인다 (불의 알파를 흐리게 해 위로 끌어올린 영역)
    m = blur(fr[..., 3:4], 8)
    m = np.maximum(m, np.roll(m, int(H * 0.06), axis=0))   # 위쪽으로 (Blender 순서는 아래 줄부터)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    amp = 2.2 * np.clip(m[..., 0] * 1.6, 0, 1)
    dx = amp * np.sin(yy * 0.11 - t * 9.0 + np.sin(xx * 0.05) * 2.0)
    dy = amp * 0.6 * np.sin(xx * 0.09 + t * 7.0)
    bg = sample(bg, yy + dy, xx + dx)
    col = fr[..., :3] + (1 - fr[..., 3:4]) * bg
    if mo is not None:
        col = mo[..., :3] + (1 - mo[..., 3:4]) * col
    # 천천히 다가가기
    u = (f - shot['start']) / max(1, shot['end'] - shot['start'] - 1)
    u = u * u * (3 - 2 * u)
    z = shot['zoom'][0] + (shot['zoom'][1] - shot['zoom'][0]) * u
    if abs(z - 1.0) > 1e-4:
        cy, cx = H * 0.55, W * 0.5
        col = sample(col, cy + (yy - cy) / z, cx + (xx - cx) / z)
    rgba = np.concatenate([col, np.ones((H, W, 1), np.float32)], axis=2).astype(np.float32)
    img = bpy.data.images.get('__comp') or bpy.data.images.new('__comp', W, H, float_buffer=True, alpha=False)
    if tuple(img.size) != (W, H):
        img.scale(W, H)
    img.pixels.foreach_set(rgba.ravel())
    sc = bpy.context.scene
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGB'
    sc.render.image_settings.color_depth = '8'
    img.save_render(out_png, scene=sc)


# ---------------------------------------------------------------------------- 실행
def main():
    os.makedirs(WORK, exist_ok=True)
    S = build()
    sc = S['sc']
    sc.render.use_motion_blur = True
    for shot in SHOTS:
        if shot['key'] not in ONLY:
            continue
        k = shot['key']
        sc.camera = S['cams'][k]
        nla_moses(S, shot.get('hide_at'))
        d = os.path.join(WORK, k)
        os.makedirs(d, exist_ok=True)
        f0, f1 = shot['start'], shot['end'] if not TEST else min(shot['end'], shot['start'] + TEST)
        # 배경 두 장
        sc.frame_set(f0 + 1)
        for mode in ('sun', 'firelight'):
            p = os.path.join(d, 'bg_%s.exr' % mode)
            if not os.path.exists(p):
                set_mode(S, mode, shot)
                render_to(p)
                print('bg', k, mode, flush=True)
        bgs = {m: load_exr(os.path.join(d, 'bg_%s.exr' % m)) for m in ('sun', 'firelight')}
        for f in range(f0, f1):
            sc.frame_set(f + 1)
            pf = os.path.join(d, 'fire_%04d.exr' % f)
            if not os.path.exists(pf):
                set_mode(S, 'fire', shot)
                render_to(pf)
            layers = dict(bgs)
            layers['fire'] = load_exr(pf)
            if shot['moses']:
                pm = os.path.join(d, 'moses_%04d.exr' % f)
                if not os.path.exists(pm):
                    set_mode(S, 'moses', shot)
                    tt = (f + 1) / FPS
                    for L in S['lights']:
                        L.data.energy = S['base'][L.name] * flick(tt)
                    render_to(pm)
                layers['moses'] = load_exr(pm)
            out = os.path.join(WORK, 'frames', 'f_%04d.png' % f)
            os.makedirs(os.path.dirname(out), exist_ok=True)
            compose(S, shot, f, layers, out)
            print('frame', k, f, flush=True)
    # 영상으로 묶기 (소리 없음. 소리는 게임이 영상 시간에 맞춰 낸다)
    frames = os.path.join(WORK, 'frames')
    mp4 = os.path.join(WORK, 'vision_bush.mp4')
    if not TEST:
        subprocess.run(['ffmpeg', '-y', '-framerate', str(FPS), '-i', os.path.join(frames, 'f_%04d.png'),
                        '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4], check=True)
        print('video', mp4)


if __name__ == '__main__':
    main()
