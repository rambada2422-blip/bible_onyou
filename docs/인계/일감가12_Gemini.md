상태: 끝

# 일감 가-12 인계 · Gemini

- 날짜와 시각: 2026-11-22 12:12
- AI 이름: Gemini (안티그래비티)
- 줄: 코드 줄 가 · 3D 게임
- 단계: 일감 가-12 · `models.js` 나누기
- 브랜치: `relay/horeb`

## 어디까지 했는지

1,332줄이던 `web3d/js/models.js`를 모양·크기·색·움직임을 그대로 유지한 채 역할별 5개 파일로 나누었다. 공통 도형 도구와 색 모음, 임시 수학 객체는 `BO3D._modelKit`으로 공유해 나머지 4개 파일이 `BO3D.models`에 각 모형 함수를 붙이는 구조로 정리했다.

- `web3d/js/models.js` (309줄): 공통 `Builder`, `onEll`, 색 모음, `BO3D._modelKit`, `BO3D.models = { config }`
- `web3d/js/models-kids.js` (249줄): 아이 모형 (`BO3D.models.kid`)
- `web3d/js/models-horeb-cast.js` (276줄): 모세·양 모형 (`BO3D.models.moses`, `BO3D.models.sheep`)
- `web3d/js/models-bush-props.js` (353줄): 떨기나무·부품·바위·덤불·아카시아 모형 (`BO3D.models.bush`, `scrap`, `rock`, `shrub`, `acacia`)
- `web3d/js/models-machine.js` (140줄): 타임머신 모형 (`BO3D.models.timeMachine`)

`tools/build3d.js`와 `web3d/index.html`의 불러오기 순서를 새 5개 파일 순서(`models.js` → `models-kids.js` → `models-horeb-cast.js` → `models-bush-props.js` → `models-machine.js`)로 맞추고, `README.md`의 3D 표 `models.js` 한 줄도 갱신했다.

## 건드린 파일

- `web3d/js/models.js`
- `web3d/js/models-kids.js` (신규)
- `web3d/js/models-horeb-cast.js` (신규)
- `web3d/js/models-bush-props.js` (신규)
- `web3d/js/models-machine.js` (신규)
- `tools/build3d.js`
- `web3d/index.html`
- `README.md`
- `docs/인계/일감가12_Gemini.md`

## 전·후 화면 사진 비교 결과

나누기 전과 나눈 뒤 각각 `tools/test/full/layout3d.js`로 호렙 산 3D 화면 사진을 찍어 `320x568` 기준 6장을 1:1 대조했다.

- `menu.png`: SSIM `1.000000` (완전 일치)
- `dex.png`: SSIM `1.000000` (완전 일치)
- `end.png`: SSIM `1.000000` (완전 일치)
- `detector.png`: SSIM `0.999957` (완전 일치)
- `landing.png`: SSIM `0.998917` (유다·시온·타임머신·그림자·안내판 모두 육안 동일)
- `piece.png`: SSIM `0.990500` (모세·양·떨기나무·부품 모형 동일, 불꽃·양 애니메이션 위상 차이만 존재)

전·후 6장 모두 모형 모양·크기·색·배치가 같음을 확인했다. (초기 분리 시 `onEll`과 임시 벡터를 `BO3D._modelKit`에 누락해 `landing.png`에서 아이가 대체 도형으로 나오는 문제를 비교 사진으로 잡아 즉시 수정·재검증했다.)

## 점검 결과 (`node tools/check.js --full`)

```
점검 종류: 전체 · 통과 8/8
점검 결과: 합격
```

## 남은 일과 다음 AI에게

- `일감 가-12`는 완료했다.
- `코드 줄 가`의 다음 단계는 `일감 가-13 · models_jordan.js 나누기` (`docs/일감/가-13.md`)다.
