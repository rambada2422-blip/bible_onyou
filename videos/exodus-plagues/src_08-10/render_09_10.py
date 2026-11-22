"""09 흑암 (12초, 출 10:21-23) · 10 처음 난 것을 치심과 유월절 밤 (16초, 출 12:7-13, 23, 27-30)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *

OUT = os.path.join(HERE, 'out')

def film09():
    # 등불 없는 캄캄한 애굽 골목에 머문다 (정적). 같은 때 이스라엘 자손이 사는 곳의 환한 골목을 비슷한 구도로.
    # 해가 뜨는 것처럼 밝아지는 전환을 넣지 않는다: 어둠에서 환한 골목으로 바로 끊는다 (사이에 검정을 두지 않는다. 시간이 흐른 것처럼 보이지 않게).
    dark = view(gain(load('plague-darkness'), 1.7), 40, 0, 320)   # 왼쪽 닫힌 문, 오른쪽으로 이어지는 골목
    light = view(load('plague-light'), 60, 0, 320)                  # 같은 자리: 왼쪽 문, 오른쪽 골목
    w = Writer(os.path.join(OUT, 'plague-09.mp4'))
    for f in range(12 * FPS):
        t = f / FPS
        w.put(dark if t < 6.0 else light)
    return w.close()

def film10():
    room = load('ex07-room')                       # 1200x800
    door = extend_fill(gain(load('plague-midnight'), 1.35), 45, 45)   # 720x570, 위 벽과 아래 땅을 가장자리 빛깔로 채움 (표시가 두 번 나오지 않게)
    door_v = view(door, 168, 0, 380)               # 인방과 양쪽 설주의 세 자국이 모두 들어간다
    w = Writer(os.path.join(OUT, 'plague-10.mp4'))
    x_door, x_table = 20.0, 335.0
    for f in range(16 * FPS):
        t = f / FPS
        if t < 6.0:
            # 한밤중이 되기 전 준비: 문의 세 자국 → 카메라가 한 번 천천히 식탁으로 (어린 양, 무교병, 쓴 나물)
            u = ease((t - 1.5) / 3.0)
            x = x_door + (x_table - x_door) * u
            img = view(room, x, 0, 533.33)
            if t >= 5.6:
                img = fade(img, 1 - (t - 5.6) / 0.4)
            w.put(img)
        else:
            # 한밤중 이스라엘 자손의 집 밖 닫힌 문. 고요하게 머문다
            k = min(1.0, (t - 6.0) / 0.5)
            w.put(fade(door_v, k) if k < 1 else door_v)
    return w.close()

if __name__ == '__main__':
    print('09 frames', film09())
    print('10 frames', film10())
