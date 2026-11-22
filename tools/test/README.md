# 자동 점검 스크립트

휴대폰 크기 화면에서 게임을 처음부터 끝까지 조작하고 화면을 찍는다. Playwright와 Chromium이 필요하다.

## 기본 자동 조작 (`tools/test/`)

- `walk2d.js <단계 0~2> <고를 이름> <저장 폴더>`: 2D 시범판 (`web/index.html`)
- `bgraster.js <저장 폴더>`: 2D 시범판 사진형 배경(JPG·PNG) 확인
- `walk3d.js <단계 0~2> <저장 폴더> [화면 배율]`: 3D 호렙 산 전체 흐름 (`dist/preview3d.html`)
- `walkJ.js <단계 0~2> <저장 폴더> [화면 배율]`: 3D 요단 강 시대 추리

3D 점검 전에 `node tools/build3d.js`로 미리보기 페이지를 다시 만든다. 자동 조작은 실행할 때마다 이 컴퓨터 안에서만 열리는 임시 웹 주소를 만든다. 브라우저가 닫히면 서버도 종료된다. 웹 원본은 저장소에 있는 한글 글꼴을 읽고, 단일 파일 미리보기에는 같은 글꼴이 함께 들어 있다.

## 스스로 찾아 돌리는 검사와 시험 (`tools/check.js`)

여러 작업 줄이 `tools/check.js`를 함께 고치다 부딪히지 않도록, 아래 두 폴더에 `.js` 파일을 넣으면 `tools/check.js`가 이름순으로 스스로 찾아 돌린다. 폴더가 없거나 비어 있어도 점검은 그대로 된다.

- `tools/lint/*.js`: **빠른 점검(`node tools/check.js`)과 전체 점검(`node tools/check.js --full`) 모두** 실행한다.
  - `exit 0`: 통과 (`✅`)
  - `exit 1`: 불합격 (`❌`)
  - `exit 2`: 확인 필요 (`⚠️`)
- `tools/test/full/*.js`: **전체 점검(`node tools/check.js --full`)**에서 기본 네 가지 자동 조작 뒤에 실행한다.
  - 첫 인자로 화면 사진을 둘 폴더(`dist/check/<파일이름>`)를 받는다.
  - `exit 0`이면 통과, 그 외(`exit 1` 등)는 불합격이다.
  - 예: `full/awe_layout.js` (압도 장면 그림판 배치 자동 점검)

전체 점검을 한 번에 돌리려면 `node tools/check.js --full`을 쓴다. 화면 사진은 `dist/check/`에 남는다.
