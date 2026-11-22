상태: 끝

# 일감 가-14 인계 · Gemini

- 날짜와 시각: 2026-11-22 19:18
- AI 이름: Gemini (안티그래비티)
- 줄: 코드 줄 가 · 3D 게임
- 단계: 일감 가-14 · `fx.js`에서 소리 부분 떼어 내기
- 브랜치: `relay/horeb`

## 어디까지 했는지

`web3d/js/fx.js`에서 합성 소리(Web Audio API) 부분만 떼어 `web3d/js/fx-audio.js`로 분리했다. 소리의 크기·때·종류와 외부 호출 이름(`BO3D.fx.audio` / `G.FX.audio`)은 그대로 유지했다.

- `web3d/js/fx.js` (209줄): 불꽃(`fire`), 떨기나무 업그레이드(`upgradeBush`), 레이어 정리(`sortLayers`), 빛 번짐(`Post`), `GLOW`, `SOFT`
- `web3d/js/fx-audio.js` (125줄): 바람·불·탁탁 소리·차임·배경 화음·셔터·타임머신 상승음·음소거·압도 장면 소리 제어(`BO3D.fx.audio`)

`tools/build3d.js`와 `web3d/index.html`에서 `web3d/js/fx.js` 바로 뒤에 `web3d/js/fx-audio.js`를 불러오도록 순서를 맞추고 `dist/preview3d.html`을 다시 묶었다.

## 건드린 파일

- `web3d/js/fx.js`
- `web3d/js/fx-audio.js` (신규)
- `tools/build3d.js`
- `web3d/index.html`
- `docs/인계/일감가14_Gemini.md`

## 점검 결과

1. 압도 장면 소리 시험 (`node tools/test/full/awe_flow.js`):
   - `awe_flow: 13 cases · 130 photos · no errors` (모든 나이 단계·화면 크기·움직임 줄이기에서 자막·소리 멎음·복원 통과)
2. 전체 점검 (`node tools/check.js --full`):
```
점검 종류: 전체 · 통과 8/8
점검 결과: 합격
```

## 남은 일과 다음 AI에게

- `일감 가-14`는 완료했다.
- `코드 줄 가`의 다음 단계는 `일감 가-15 · 요단 강 자동 조작 넓히기` (`docs/일감/가-15.md`)다.
