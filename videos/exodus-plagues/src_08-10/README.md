# 영상 08·09·10 다시 굽기

1. `pip install numpy pillow opencv-python-headless` (FFmpeg가 있어야 한다).
2. 이 폴더에서 `python3 prepare.py` → `work/`에 게임 원화 다섯 장과 08에 쓸 메뚜기 조각이 생긴다.
3. `python3 render_08.py`, `python3 render_09_10.py` → `out/`에 `plague-08.mp4`, `plague-09.mp4`, `plague-10.mp4`.
4. 검토용으로 이어 붙이기:

```
ffmpeg -i out/plague-08.mp4 -i out/plague-09.mp4 -i out/plague-10.mp4 -filter_complex "[0:v][1:v][2:v]concat=n=3:v=1:a=0[v]" -map "[v]" -an -c:v libx264 -profile:v high -preset slow -crf 17 -pix_fmt yuv420p -r 24 -movflags +faststart out/plague-08-10-review.mp4
```

`work/`와 `out/`은 만들어지는 폴더라 저장소에 넣지 않는다. 연출과 점검은 `../plague-08-10_기록.md`.
