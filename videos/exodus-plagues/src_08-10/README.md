# 영상 08·09·10 다시 굽기

1. `pip install numpy pillow opencv-python-headless` (FFmpeg가 있어야 한다).
2. 이 폴더에서 `python3 prepare.py` → `work/`에 게임 원화 다섯 장과 08에 쓸 메뚜기 조각이 생긴다.
3. `python3 render_08.py`, `python3 render_09_10.py` → `out/`에 `plague-08.mp4`, `plague-09.mp4`, `plague-10.mp4`.
4. 검토용으로 이어 붙이기:

```
ffmpeg -i out/plague-08.mp4 -i out/plague-09.mp4 -i out/plague-10.mp4 -filter_complex "[0:v][1:v][2:v]concat=n=3:v=1:a=0[v]" -map "[v]" -an -c:v libx264 -profile:v high -preset slow -crf 17 -pix_fmt yuv420p -r 24 -movflags +faststart out/plague-08-10-review.mp4
```

5. 열 편 최종 합본 (대표가 세 팀 영상을 보고 승인한 뒤): 열 편이 모두 들어 있는 `videos/exodus-plagues/`에서 `python3 src_08-10/assemble_all.py` → `src_08-10/out/plague-all.mp4` (88초, 2112프레임). 01~04는 bt709 색 표시가 있고 05~10은 없어서, 표시가 없는 편을 bt709로 바꿔 맞춘다. 끝나면 열 편의 첫·마지막 프레임이 제자리에 있는지 스스로 확인한다. 2026-11-22 그때의 열 편 (06은 수정 전)으로 돌려 통과했다.

`work/`와 `out/`은 만들어지는 폴더라 저장소에 넣지 않는다. 연출과 점검은 `../plague-08-10_기록.md`.
