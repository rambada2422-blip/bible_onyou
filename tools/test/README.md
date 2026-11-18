# 자동 점검 스크립트

휴대폰 크기 화면에서 게임을 처음부터 끝까지 조작하고 화면을 찍는다. Playwright와 Chromium이 필요하다.

- `walk2d.js <단계 0~2> <고를 이름> <저장 폴더>`: 2D 시범판 (`web/index.html`)
- `walk3d.js <단계 0~2> <저장 폴더> [화면 배율]`: 3D 호렙 산 전체 흐름 (`dist/preview3d.html`)
- `walkJ.js <단계 0~2> <저장 폴더> [화면 배율]`: 3D 요단 강 시대 추리

3D 점검 전에 `node tools/build3d.js`로 미리보기 페이지를 다시 만든다. 주소는 저장소 위치를 기준으로 잡으므로 어느 컴퓨터에서든 그대로 돈다.

세 가지를 한 번에 돌리려면 `node tools/check.js --full`을 쓴다. 화면 사진은 `dist/check/`에 남는다.
