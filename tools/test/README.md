# 자동 점검 스크립트

휴대폰 크기 화면에서 게임을 처음부터 끝까지 조작하고 화면을 찍는다. Playwright와 Chromium이 필요하다.

- `walk2d.js <단계 0~2> <고를 이름> <저장 폴더>`: 2D 시범판 (`web/index.html`)
- `walk3d.js <단계 0~2> <저장 폴더> [화면 배율]`: 3D 호렙 산 전체 흐름 (`dist/preview3d.html`)
- `walkJ.js <단계 0~2> <저장 폴더> [화면 배율]`: 3D 요단 강 시대 추리

3D 점검 전에 `node tools/build3d.js`로 미리보기 페이지를 다시 만든다. 스크립트 안의 주소는 `/home/user/bible_onyou` 기준이므로 다른 위치에서는 고쳐 쓴다.
