상태: 끝

# 일감 가-1 인계 · Gemini

- 날짜와 시각: 2026-11-19 16:17
- AI 이름: Gemini
- 줄: 코드 줄 가 · 3D 게임
- 단계: 일감 가-1 · 압도 장면 ① 그림판과 두 가지 보기
- 브랜치: `relay/horeb`

## 한 일

- `tools/build3d.js`:
  - `web3d/assets/awe/*.jpg`(`bush_2.jpg`, `bush_3.jpg`)를 base64 문자열로 읽어 `web3d/js/glbdata.js`의 `BO3D.aweData`에 함께 묶고, `scripts` 목록에 `web3d/js/game-awe.js`를 더했다.
- `web3d/js/game-awe.js` (새 파일):
  - `docs/09_떨기나무_압도장면.md` 3.2절, 3.3절, 10절의 식과 숫자를 그대로 따라 그림판(`.awe-board` + 위쪽 하늘 띠 `.awe-sky`), 가까이 보기(`near`)와 전체 보기(`wide`), 글자 자리(`.awe-cap`, 전체 보기에서만 아래 150px), 모래색 덮개(`.awe-veil`, `#E4BE7E`)를 만들었다.
  - 위쪽 하늘 띠는 그림 맨 윗줄 4줄을 가로 9구간 평균 및 3점 다듬기로 매끄러운 가로 그라디언트로 칠해 세로 줄무늬가 생기지 않게 했다.
  - 두 그림(`bush_2`, `bush_3`)을 같은 자리에 미리 그려 두고 겹치지 않게 한 번에 보이는 쪽(`visibility`)만 바꾸도록 했다.
  - 가로가 세로보다 긴 화면에서는 가까이 보기를 요청해도 전체 보기로 띄우도록 했다 (3.4절, 10절).
- `web3d/index.html`, `web3d/js/game.js`, `web3d/css/game.css`, `web3d/js/game-debug.js`:
  - `game-awe.js`를 불러와 초기화하고, `.awe3`, `.awe-sky`, `.awe-board`, `.awe-cap`, `.awe-veil` 및 `.g3.awe-on` 스타일을 더했으며, `BO3D.debug.awe(view, pic)`과 `BO3D.debug.aweRect()`를 연결했다.
- `tools/test/full/awe_layout.js` (새 파일):
  - `390×844`, `390×664`, `360×560`, `844×390` 네 가지 화면 크기에서 두 보기를 띄워 찍고, `BO3D.debug.aweRect()`가 10절의 식으로 따로 계산한 값과 차이 1 이하로 일치하는지, 가까이 보기에서 가로 끝이 703 이하인지, 전체 보기에서 글자 자리 윗변이 세로 1300 아래인지, 가로가 긴 화면(`844×390`)에서 가까이 보기를 띄우지 않는지 확인하도록 했다.
  - 단독 실행 결과 (`node tools/test/full/awe_layout.js dist/check/awe_layout`):
    - `390x844 near(->near) p2: x=0.0..703.0 y=0.0..1521.3`
    - `390x844 wide(->wide) p2: x=0.0..1024.0 y=0.0..1536.0 capY=1536.0`
    - `390x844 wide(->wide) p3: x=0.0..1024.0 y=0.0..1536.0 capY=1536.0`
    - `390x664 near(->near) p2: x=0.0..703.0 y=82.5..1279.4`
    - `390x664 wide(->wide) p2: x=0.0..1024.0 y=0.0..1349.6 capY=1349.6`
    - `360x560 near(->near) p2: x=0.0..703.0 y=134.2..1227.7`
    - `360x560 wide(->wide) p2: x=0.0..1024.0 y=0.0..1300.0 capY=1300.0`
    - `844x390 near(->wide) p2: x=0.0..1024.0 y=0.0..1300.1 capY=1300.1`
    - `844x390 wide(->wide) p2: x=0.0..1024.0 y=0.0..1300.1 capY=1300.1`
    - `awe_layout shots: 9 no errors`
- `docs/인계/사진/일감가1.png`, `docs/인계/사진/일감가1_가까이.png` (새 파일):
  - 찍힌 사진을 직접 열어 가까이 보기에 모세가 보이지 않고, 전체 보기에서 글자 자리가 모세가 선 바위를 가리지 않으며, 하늘 띠에 세로 줄무늬가 없음을 확인한 뒤 복사해 함께 커밋했다.

## 바뀐 파일 목록

- `tools/build3d.js`
- `web3d/js/game-awe.js` (새 파일)
- `web3d/index.html`
- `web3d/js/game.js`
- `web3d/css/game.css`
- `web3d/js/game-debug.js`
- `web3d/js/glbdata.js` (묶은 결과 파일)
- `tools/test/full/awe_layout.js` (새 파일)
- `docs/인계/사진/일감가1.png` (새 파일)
- `docs/인계/사진/일감가1_가까이.png` (새 파일)
- `docs/인계/일감가1_Gemini.md` (새 파일)

## 점검

- 단독 배치 점검: `node tools/test/full/awe_layout.js dist/check/awe_layout` → `awe_layout shots: 9 no errors` 통과.
- 전체 점검 명령: `node tools/check.js --full`
- 세부 결과: 문법(27개 파일), `tools/build.js`, `tools/build3d.js`, 바뀐 파일 11개 확인, 자동 조작 2D 시범판(60초), 자동 조작 사진형 배경(2초), 자동 조작 3D 호렙 산(269초), 자동 조작 3D 요단 강(138초) 모두 통과.
- 점검 결과 마지막 두 줄:

```text
점검 종류: 전체 · 통과 8/8
점검 결과: 합격
```

## 남은 일

- 일감 가-1의 구현과 점검에 남은 일은 없다.
- 코드 줄 가의 다음 단계는 `일감 가-2 · 압도 장면 ② 순서와 글자`이다.
