상태: 끝

# 일감 조-1 인계 · Gemini

- 날짜와 시각: 2026-11-20 00:04 ~ 00:08
- AI 이름: Gemini (안티그래비티)
- 줄: 조사 줄 · 참고 문서
- 단계: 일감 조-1 · 3D 코드 지도
- 브랜치: `relay/docs`

## 한 일

- `web3d/index.html`의 스크립트 불러오기 순서와 `web3d/js/` 아래 19개 파일을 확인하여 `docs/참고/코드지도_3D.md`를 새로 작성했다 (기준 커밋: `8d15dda`, 코드는 건드리지 않음).
  - 파일마다 하는 일 두세 줄, 밖에서 부르는 이름(`BO3D.*`, `BO.content3d`, `G.*`) 목록과 한 줄 풀이, 파일끼리 호출 관계를 적었다.
  - 게임 흐름(첫 화면 → 이동 → 호렙 산 탐험 → 탐지기 물음 → 걷기·사진·부품 줍기 → 압도 장면 → 지켜보기 → 관문 → 돌아감 → 요단 강)별 담당 파일과 핵심 함수를 표로 정리했다.
  - 내부 도형 조립 함수를 통째로 읽지 않은 `models.js`·`models_jordan.js`는 바깥에 내놓는 목록만 확인했음을 ⚠️로 표시했다.

## 문서 속 함수 이름 10개 실존 재확인

1. `web3d/js/game-scene.js:56` — `function spawnKids()`
2. `web3d/js/game-ui.js:26` — `function detectorQuestion(item, index, onReady)`
3. `web3d/js/game-awe.js:377` — `function startAwe(onDone)`
4. `web3d/js/game-exploration.js:72` — `function showDetector(i)`
5. `web3d/js/game-travel.js:154` — `function loadJordanGlb()`
6. `web3d/js/game-jordan.js:119` — `function startDeduce()`
7. `web3d/js/game-story.js:205` — `function startGates()`
8. `web3d/js/game-controls.js:85` — `function updateCamera(dt)`
9. `web3d/js/game-loop.js:12` — `function frame(t)`
10. `web3d/js/fx.js:113` — `function upgradeBush(bushGroup)`

## 바뀐 파일 목록

- `docs/참고/코드지도_3D.md` (새 파일)
- `docs/인계/일감조1_Gemini.md` (새 파일)

## 점검

- 빠른 점검 명령: `node tools/check.js`
- 점검 결과 마지막 두 줄:

```text
점검 종류: 빠른 · 통과 4/4
점검 결과: 합격
```

## 남은 일

- 일감 조-1에 남은 일은 없다. 조사 줄의 다음 단계는 `일감 조-2 · 2D와 도구 코드 지도`이다.
