상태: 끝

# 카드 5-가 인계 · Gemini

- 날짜와 시각: 2026-11-19 14:25
- AI 이름: Gemini
- 줄: 코드 줄
- 단계: 카드 5-가 · 사진형 배경 그림(JPG·PNG)을 2D 시범판에 넣을 수 있게 하기
- 브랜치: `relay/horeb`

## 한 일

- `tools/build.js`:
  - `web/assets/bg/`의 `키.jpg`와 `키.png`를 읽어 data URI로 바꾸고 `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200" preserveAspectRatio="xMidYMid slice"><g id="키-state-main"><image href="data:..." x="0" y="0" width="900" height="1200" preserveAspectRatio="xMidYMid slice"/></g></svg>` 꼴의 SVG 글자로 감싸 `BO.art[키]`에 넣도록 했다.
  - 같은 키의 `.svg`와 사진형 파일(또는 `.jpg`와 `.png`)이 함께 있는 경우, 사진형 파일 하나가 300KB를 넘는 경우, 파일 머리에서 읽은 크기가 가로 900 × 세로 1200 픽셀이 아닌 경우, 사진형 파일을 모두 합쳐 1.5MB를 넘는 경우 한국어로 무엇이 틀렸는지 알리고 묶기를 멈추도록(`process.exit(1)`) 했다.
  - 기존 금지 요소 점검(`<script`, `<image`, `<foreignObject`, `<text`, `href="http"`)은 손으로 쓴 SVG 파일에만 그대로 적용하고, 묶는 도구가 감싼 사진형 SVG는 점검에서 제외했다.
  - 사진형 그림이 없는 지금 상태에서 묶은 `web/js/art.js`가 고치기 전과 한 글자도 다르지 않음을 확인했다 (`git diff --stat web/js/art.js` 빈 출력).
- `tools/test/bgraster.js` (새 파일):
  - Playwright로 네 귀퉁이와 한가운데에 서로 다른 색 표시를 둔 900×1200 시험용 JPG를 `web/assets/bg/zztest.jpg`로 만들고 묶은 뒤, `BO.art.zztest`를 390×520 화면에 끼워 넣어 불러온 그림의 가로가 0보다 크고 한가운데 표시 색이 화면 한가운데에 있는지 확인하며 화면을 찍도록 했다.
  - 위 네 가지 실패 조건마다 `tools/build.js`가 실제로 멈추는지 확인하고, 시험이 끝나면(`finally`) 시험용 파일을 지우고 다시 묶어 `web/js/art.js`를 원래대로 돌려놓도록 했다.
- `tools/check.js`:
  - 전체 점검 목록에 `['사진형 배경', ['tools/test/bgraster.js', path.join(out, 'bgraster')]]` 한 줄을 더했다 (`자동 조작 사진형 배경`).
- `docs/인계/사진/카드5가.png` (새 파일):
  - 시험이 찍은 390×520 화면 사진(`dist/check/bgraster/01-bgraster.png`)을 직접 열어 네 귀퉁이와 한가운데 색 표시를 확인한 뒤 복사해 함께 커밋했다.

## 바뀐 파일 목록

- `tools/build.js`
- `tools/test/bgraster.js` (새 파일)
- `tools/check.js`
- `docs/인계/사진/카드5가.png` (새 파일)
- `docs/인계/카드5가_Gemini.md` (새 파일)

## 점검

- 전체 점검 명령: `node tools/check.js --full`
- 세부 결과: 문법(26개 파일), `tools/build.js`, `tools/build3d.js`, 바뀐 파일 5개 확인, 자동 조작 2D 시범판(62초), 자동 조작 사진형 배경(2초), 자동 조작 3D 호렙 산(275초), 자동 조작 3D 요단 강(138초) 모두 통과.
- 점검 결과 마지막 두 줄:

```text
점검 종류: 전체 · 통과 8/8
점검 결과: 합격
```

## 남은 일

- 카드 5-가의 구현과 전체 점검에 남은 일은 없다.
- 코드 줄은 카드 5-가 뒤에 아직 다음 단계가 없으므로 총괄이 그림 승인과 대표의 결정을 받아 다음 단계를 넣는다.
