상태: 끝

# 일감 가-16 인계 · Gemini

- 날짜와 시각: 2026-11-22 21:53
- AI 이름: Gemini (안티그래비티)
- 줄: 코드 줄 가 · 3D 게임
- 단계: 일감 가-16 · 여는 동안 '불러오는 중' 보여 주기
- 브랜치: `relay/horeb`

## 어디까지 했는지

3D 미리보기(`dist/preview3d.html`)와 `web3d/index.html`에서 첫 화면이 준비될 때까지 화면 가운데에 "불러오는 중이에요"를 보여 주고, 준비가 끝나면(또는 WebGL 미지원 안내를 띄울 때) 없애도록 구현했다.

- `web3d/index.html`, `tools/build3d.js`: `<div id="game" class="g3 app">` 안에 스크립트보다 먼저 `<div id="loading3" class="loading3" role="status" aria-live="polite">`와 문구 `"불러오는 중이에요"`만 배치했다.
- `web3d/css/game.css`: `.loading3` 중앙 배치 스타일과 `.loading3-dot` 회전 표시를 추가하고, `@media (prefers-reduced-motion: reduce)`에서는 회전을 멈추도록 했다.
- `web3d/js/game-ui.js`: `initUi()` 완료 시와 `G.showWebGLNotice()` 호출 시 `#loading3`을 제거하도록 `hideLoading()`을 추가했다.
- `tools/test/walk3d.js`: 첫 화면 진입 직후 `#loading3`이 제거되고 `"불러오는 중이에요"` 문구가 남지 않았으며 `탐험 시작` 단추가 보이는지 확인을 추가했다.
- `docs/인계/사진/일감가16.png`: 스크립트 실행 전 `"불러오는 중이에요"` 화면(왼쪽)과 준비 완료 후 첫 화면(오른쪽)을 나란히 찍어 남겼다.

## 건드린 파일

- `web3d/index.html`
- `web3d/css/game.css`
- `web3d/js/game-ui.js`
- `tools/build3d.js`
- `tools/test/walk3d.js`
- `docs/인계/일감가16_Gemini.md`
- `docs/인계/사진/일감가16.png` (신규)

## 점검 결과

1. WebGL 미지원 예외 시험 (`node tools/test/full/nowebgl.js`):
   - `통과 · WebGL 미지원 세로·가로, 장치 예외, 3D 저장 보존, 같은 기기에서 2D 시작`
2. 전체 점검 (`node tools/check.js --full`, `walk3d.js`의 `#loading3` 사라짐 확인 포함):
```
점검 종류: 전체 · 통과 8/8
점검 결과: 합격
```

## 남은 일과 다음 AI에게

- `일감 가-16`을 끝으로 `코드 줄 가 · 3D 게임`의 모든 단계가 완료되었다.
