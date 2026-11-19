상태: 하는 중

# 일감 가-2 인계 · Gemini

- 날짜와 시각: 2026-11-19 16:56
- AI 이름: Gemini
- 줄: 코드 줄 가 · 3D 게임
- 단계: 일감 가-2 · 압도 장면 ② 순서와 글자
- 브랜치: `relay/horeb`

## 어디까지 했는지

- `web3d/js/content3d.js`, `web3d/js/game-awe.js`, `web3d/js/game-story.js`, `web3d/js/game-debug.js`, `web3d/css/game.css`, `tools/test/walk3d.js` 구현을 마쳤고, 빠른 점검(`node tools/check.js`, 통과 4/5 · 확인 필요 1 합격)과 `awe_layout.js`(9장 촬영 · `no errors`) 통과를 확인했다.
- 이제 전체 점검(`node tools/check.js --full`)을 돌려 나이 단계 셋 모두에서 0~6번 통과, 4번·5번 글자 일치, 5번 그림 교체 직전·직후 가로 0~719 영역 일치를 확인하고, 찍힌 4번·5번 화면 사진을 직접 열어 확인한 뒤 `docs/인계/사진/일감가2.png`로 저장해 `상태: 끝`으로 바꾼다.

## 한 일

- `web3d/js/content3d.js`:
  - `BO.content3d.horeb` 안에 `docs/일감/가-2.md` 3번의 `awe` 자료(`call`, `hide`)를 한 글자도 바꾸지 않고 그대로 붙여 넣었다.
- `web3d/js/game-awe.js`, `web3d/css/game.css`:
  - `docs/09_떨기나무_압도장면.md` 1절 표, 3.1절, 4절, 7절, 10절대로 순서 0~6번을 차례로 보여 주는 `G.startAwe(onDone)`, `G.stopAwe()`, `G.aweNext(arg)`, `G.aweState()`를 구현했다.
  - 0번(직전, 3.5초 올려다보기), 1번(넘어감, 0.7초 모래색 `#E4BE7E` 덮임 → 0.8초 가까이 보기 등장), 2번(떨기나무, 5초 동안 전체 움직임의 5%를 한 가지 빠르기로 물러남), 3번(모세, 6초 동안 나머지 95%를 이어받아 물러나며 글자 자리가 서서히 나타남), 4번(부르심, 8초 멈춤 + 0~1초 글자 떠오름 · 1~7초 유지 · 7~8초 사라짐), 5번(얼굴을 가림, 4번 글자 사라진 직후 그림 한 번에 교체 + 1~2초 글자 떠오름 · 2~9초 유지), 6번(돌아옴, 0.7초 모래색 덮임 → 0.8초 인형풍 세계 복귀 후 지켜보기 1 / 5로 이어짐)을 반영했다.
  - 장면 동안 `.g3.awe-on`으로 위쪽 표시줄, 목표 문구, 도감·사진기·소리 단추, 조종 막대를 숨기고 끝나면 되돌리도록 했다.
- `web3d/js/game-story.js`, `web3d/js/game-debug.js`:
  - 부품 3을 주운 뒤 최온의 말에서 `'다음'`을 누른 뒤 지켜보기 1 / 5 창이 뜨기 전에 `G.startAwe(...)`를 실행하고, 6번이 끝나면 지켜보기 1 / 5(`showBeat()`)와 음악이 이어지게 연결했다.
  - `BO3D.debug.aweNext`, `BO3D.debug.aweState`를 노출했다.
- `tools/test/walk3d.js`:
  - 나이 단계 셋(`t1`·`t2`·`t3`)에서 압도 장면 0~6번을 지나가고, 4번과 5번의 장절·글자가 승인 자료와 같은지 확인하며, 5번에서 그림을 바꾸기 직전과 직후의 화면을 찍어 그림의 가로 0~719 영역이 완전히 같고(`leftDiff === 0`) 모세 영역만 바뀌는지(`rightDiff > 100`) 검증하도록 고쳤다.

## 바뀐 파일 목록

- `web3d/js/content3d.js`
- `web3d/js/game-awe.js`
- `web3d/js/game-story.js`
- `web3d/js/game-debug.js`
- `web3d/css/game.css`
- `tools/test/walk3d.js`
- `docs/인계/일감가2_Gemini.md` (새 파일)
