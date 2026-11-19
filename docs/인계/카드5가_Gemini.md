상태: 하는 중

# 카드 5-가 인계 · Gemini

- 날짜와 시각: 2026-11-19 14:16
- AI 이름: Gemini
- 줄: 코드 줄
- 단계: 카드 5-가 · 사진형 배경 그림(JPG·PNG)을 2D 시범판에 넣을 수 있게 하기
- 브랜치: `relay/horeb`

## 어디까지 했는지

- `tools/build.js`, `tools/test/bgraster.js`, `tools/check.js` 구현을 마쳤고, `node tools/test/bgraster.js` 통과 및 화면 사진(`docs/인계/사진/카드5가.png`) 확인·저장, 빠른 점검(`node tools/check.js`, 통과 4/4 합격)과 `git diff --stat web/js/art.js` 빈 결과까지 확인했다.
- 이제 전체 점검(`node tools/check.js --full`)을 돌려 합격 확인 후 `상태: 끝`으로 바꾼다.

## 한 일

- `tools/build.js`:
  - `web/assets/bg/`의 `키.jpg`와 `키.png`를 읽어 data URI로 바꾸고 `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200" preserveAspectRatio="xMidYMid slice"><g id="키-state-main"><image href="data:..." x="0" y="0" width="900" height="1200" preserveAspectRatio="xMidYMid slice"/></g></svg>` 꼴로 감싸 `BO.art[키]`에 넣도록 했다.
  - 같은 키의 `.svg`·`.jpg`·`.png` 중복, 단일 사진형 파일 300KB 초과, 파일 머리에서 읽은 가로×세로 크기가 900×1200이 아닌 경우, 사진형 파일 합계 1.5MB 초과 시 한국어로 원인을 알리고 묶기를 멈추도록(`process.exit(1)`) 했다.
  - 기존 금지 요소 점검(`<script`, `<image`, `<foreignObject`, `<text`, `href="http"`)은 손으로 쓴 SVG 파일에만 적용하고, 도구가 감싼 사진형 SVG는 점검에서 제외했다.
- `tools/test/bgraster.js` (새 파일):
  - Playwright로 네 귀퉁이와 한가운데에 서로 다른 색 표시가 있는 900×1200 시험용 JPG를 `web/assets/bg/zztest.jpg`로 만들고 묶은 뒤, 390×520 화면에 `BO.art.zztest`를 끼워 넣어 불러온 그림의 가로가 0보다 크고 화면 한가운데에 가운데 표시 색이 나타나는지 확인하며 화면을 찍도록 했다.
  - 네 가지 실패 조건마다 `tools/build.js`가 실제로 멈추는지(`status !== 0`) 확인하고, 시험이 끝나면(`finally`) 시험용 파일을 모두 지우고 다시 묶어 `web/js/art.js`를 원래대로 돌려놓도록 했다.
- `tools/check.js`:
  - 전체 점검 목록에 `['사진형 배경', ['tools/test/bgraster.js', path.join(out, 'bgraster')]]` 한 줄을 더했다 (`자동 조작 사진형 배경`).
- `docs/인계/사진/카드5가.png`:
  - 시험이 찍은 390×520 화면 사진(`01-bgraster.png`)을 직접 열어 네 귀퉁이와 한가운데 표시를 확인한 뒤 복사했다.

## 바뀐 파일 목록

- `tools/build.js`
- `tools/test/bgraster.js` (새 파일)
- `tools/check.js`
- `docs/인계/사진/카드5가.png` (새 파일)
- `docs/인계/카드5가_Gemini.md` (새 파일)
