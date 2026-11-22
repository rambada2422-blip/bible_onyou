상태: 끝

# 일감 가-13 인계 · Gemini

- 날짜와 시각: 2026-11-22 18:11
- AI 이름: Gemini (안티그래비티)
- 줄: 코드 줄 가 · 3D 게임
- 단계: 일감 가-13 · `models_jordan.js` 나누기
- 브랜치: `relay/horeb`

## 어디까지 했는지

1,219줄이던 `web3d/js/models_jordan.js`를 제사장·청색 천으로 덮인 궤·백성·여호수아·여리고·강가 소품의 생김새와 자리를 한 점도 바꾸지 않고 역할별 4개 파일로 나누었다. 공통 도형 도구와 색·팔다리 도우미는 `BO3D._jordanKit`으로 공유해 나머지 3개 파일이 `BO3D.models2`에 각 모형 함수를 붙이는 구조로 정리했다.

- `web3d/js/models_jordan.js` (322줄): 공통 `Builder`, `loft`, `hairCap`, `onEll`, 사람 공통 도우미, `BO3D._jordanKit`
- `web3d/js/models_jordan-people.js` (382줄): 이스라엘 백성, 제사장, 백성을 이끄는 사람 (`israelite`, `priestSimple`, `leaderSimple`)
- `web3d/js/models_jordan-ark-water.js` (255줄): 청색 보자기로 덮인 궤와 채, 물의 벽, 흐르는 강물 면 (`arkCovered`, `waterWall`, `waterSurface`)
- `web3d/js/models_jordan-world.js` (265줄): 여리고 성읍, 종려나무, 갈대, 곡식밭 (`jericho`, `palm`, `reeds`, `grain`)

`tools/build3d.js`와 `web3d/index.html`의 불러오기 순서를 새 4개 파일 순서로 맞추고 `node tools/build3d.js`로 묶음(`dist/preview3d.html`)을 갱신했다.

## 건드린 파일

- `web3d/js/models_jordan.js`
- `web3d/js/models_jordan-people.js` (신규)
- `web3d/js/models_jordan-ark-water.js` (신규)
- `web3d/js/models_jordan-world.js` (신규)
- `tools/build3d.js`
- `web3d/index.html`
- `docs/인계/일감가13_Gemini.md`

## 전·후 화면 사진 비교 결과

나누기 전과 나눈 뒤 각각 `tools/test/walkJ.js`(요단 강 자동 조작)로 21장씩 촬영해 대조했다.

- `04-arrive.png`: SSIM `0.999930` (MAE `0.038`)
- `06-clue-ark.png` (청색 천 궤·제사장): SSIM `0.984653`
- `08-clue-jericho.png` (여리고·곡식밭·종려나무): SSIM `0.988072`
- `09-clue-people.png` (강을 건너는 백성): SSIM `0.980970`
- `10-clue-leader.png` (여호수아·갈대): SSIM `0.985521`
- `11-notebook.png` (추리 수첩 단서 사진): SSIM `0.995746`

핵심 6장을 나란히 육안 대조한 결과, 제사장·청색 천으로 덮인 궤·백성·여호수아·여리고·강가 소품의 모양·색·자리가 전·후 모두 같음을 확인했다(약 1~2% 차이는 걷는 백성 애니메이션 위상 차이).

## 점검 결과 (`node tools/check.js --full`)

```
점검 종류: 전체 · 통과 8/8
점검 결과: 합격
```

## 남은 일과 다음 AI에게

- `일감 가-13`은 완료했다.
- `코드 줄 가`의 다음 단계는 `일감 가-14 · fx.js에서 소리 부분 떼어 내기` (`docs/일감/가-14.md`)다.
