# 3d-c 진행 (자동 작업)

갈래: 시대 7~10의 새 3D 장면. 브랜치 `claude/auto-3d-c`. 지시서 `docs/auto/3d-c_지시.md`.

## 최종 보고
(마감 때 채운다)

## ▶ 다음
(2026-11-16 15:05 KST 인계. 총괄의 요청으로 이 세션은 멈추고 새 세션이 이어받는다. 아래 순서대로 한다.)
1. `bash tools/setup_env.sh` → `node tools/build3d.js` → `node tools/validate_ot.js --v3`(인계 때 40장면 오류 0 경고 0).
2. **OT-37 확인**: `node tools/test/walk3dScene.js OT-37 0|1|2 <폴더>`를 한 번에 하나씩 다시 돌려 끝줄(`문제 0 … 오류 0`)을 직접 본다 → 찍힌 화면을 열어 본다(도착, 재료 3곳, 올려다보기, 지켜보기 대목 전부) → `node tools/test/perf3d.js OT-09 OT-37` → 되돌리기 확인(`toggle3d_c.js OT-37 off` → validate → `on` → JSON이 같은지).
3. **OT-34 확인**: 2와 같게. 더해서 첫 재료가 이야기 카드 때의 재료(`content/ot/OT-34.json`의 `_card3dc.materials[0]`)와 같은지 본다(다르면 첫 재료를 원래 것으로).
4. 두 장면 모두 **작성 과정을 보지 않은 에이전트**에게 배치 독립 검증을 맡긴다(장면 설정 파일 + `design3d`·`quests`·`materials` + 화면을 `node tools/bible_ref/ref.js`로 본문과 대조: 방향, 거리, 순서, 인물의 행동, 물음의 정답·basis, 재료가 거룩한 것이 아닌지). 높음·중간 지적을 모두 고치고 지적 수·반영 수를 "끝난 것"에 적는다.
5. 장면마다 "대표 결정 대기"·"감수 항목"(각 장면 파일 머리말의 "감수가 필요한 설정")을 이 파일에 옮겨 적고, `content/ot/_verify/era-9.md`(OT-34)·`era-10.md`(OT-37)에 "3D 연결 (자동 작업 3d-c)" 절을 더한다. 커밋·푸시.
6. 그다음 지시서 순서대로 OT-38 에스더 → OT-31 요나 → OT-28 성전 봉헌. 제작 안내는 아래 "제작 안내"를 쓴다.

## 끝난 것
- 준비(커밋 146efa4): `props_3d-c.js`(3d-c 장면이 함께 쓰는 것, `BO3D.c3d.on`), `tools/test/toggle3d_c.js`(장면 끄고 켜기), 다섯 장면의 이야기 카드 값 `_card3dc`. `index.html`·`build3d.js`에 더하기 한 곳씩.
- 시작 점검(2026-11-16 14:20 KST): `setup_env.sh` 끝, `validate_ot.js --v3` 40장면 오류 0 경고 0, `build3d.js` 끝, `walk3dScene.js OT-39 1` 통과(화면 31, 문제 0, 오류 0, 3분).

## 하는 중
- **OT-37 성전을 다시 지음 — 중간 저장(제작 에이전트가 화면을 열어 보던 중에 멈춤)**: `web3d/js/scene_temple37.js`, `content/ot/OT-37.json`(`design3d.build` true, `quests` 3개, 재료 3개: 짐승 털 / 모난 잔돌 / 짐 끈 토막). 걷기 시험 3단계가 끝 화면(시대 지도, 화면 33장)까지 갔고 에이전트가 "첫 번에 통과"라고 했으나, **총괄 세션이 끝줄을 직접 보지 못했다(미검증)**. 화면 열어 보기·무게 재기·되돌리기 확인·독립 검증은 하지 않았다.
- **OT-34 요시야와 율법책 — 중간 저장(제작 에이전트가 시험을 돌리던 중에 멈춤)**: `web3d/js/scene_josiah34.js`, `content/ot/OT-34.json`(`build` true, `quests` 3개, 재료 3개: 납작한 돌 조각 / 마른 흙덩이 / 작은 조약돌), 새 인물 `tools/blender/people/josiah.json` + `web3d/assets/josiah.glb`(290KB. 네 방향 화면은 총괄이 보지 못함). 걷기 시험 3단계가 끝 화면(화면 31장)까지 간 폴더가 있으나 **끝줄과 마지막 수정 뒤의 결과는 모른다(미검증)**. 화면·무게·되돌리기·독립 검증은 하지 않았다.
- 두 장면 파일 모두 문법 오류 없음, `validate_ot.js --v3`와 `--mission` 오류 0 경고 0(인계 때 확인). `index.html`과 `build3d.js`의 3d-c 목록에 두 장면이 들어가 있다. 생성 파일(`otdata.js`, `glbdata.js`)은 `build3d.js`가 만든 그대로 커밋했다.
- 독립 검증 지적: 아직 받은 것이 없다(반영할 것 없음).
- 시험 화면은 컨테이너의 임시 폴더에 있었으므로 새 세션에는 없다. 다시 찍는다.

## 제작 안내 (새 세션이 그대로 쓴다)
장면 하나를 만들 때 지킬 것(이 세션이 제작 에이전트에게 준 안내의 요점):
- 고칠 수 있는 것: 그 장면 JSON의 `design3d`·`quests`·`mission.materials`만(대목·관문·돕기·동행·오늘의 물음은 한 글자도 고치지 않는다. `_card3dc`도), 새 `web3d/js/scene_<이름>NN.js`, `props_3d-c.js`(끝에 더하기만), `index.html`(`js/game.js` 앞 한 줄)과 `build3d.js`의 3d-c 목록 한 줄, 새 인물은 가까이 보이는 주요 인물 1명일 때만.
- 장면 파일 맨 위: `if (!(BO3D.c3d && BO3D.c3d.on('OT-NN'))) return;` (build가 false면 등록하지 않음).
- `quests`는 모두 find형(t1 한 절의 사실 / t2 범위와 "왜" / t3 떨어진 두 곳 이상), 관문과 같은 물음을 되풀이하지 않는다. 첫 재료는 이야기 카드의 재료 그대로. 재료 3곳은 사건의 자리에서 떨어진 곳.
- `partBeats`·`eventStart`는 대목 수와 `mission.help.steps[*].after`를 보고 정한다(돕기 조각은 그 대목이 partBeats에 있거나 지켜보기 대목일 때만 나오고, 시험이 돕기 단계 수를 센다).
- 점검: build3d → 걷기 시험 3단계(한 번에 하나) → 화면 직접 열어 보기 → `perf3d.js OT-09 OT-NN` → `validate_ot.js --v3` 전체 → 되돌리기 확인 → 작성 과정을 보지 않은 에이전트의 독립 검증.
- 장면별 조심할 것은 `docs/auto/3d-c_지시.md`의 표.

## 정한 방식 (이 갈래의 장면 모두에 같다)
- 장면 자료는 기존 3D 장면과 같은 형식으로 쓴다: `design3d.build: true`, `quests` 3개, `mission.materials` 3개(첫 재료는 이야기 카드 때의 재료를 그대로 둔다). 검사기(`validate_ot.js`)가 이 형식을 요구한다.
- 대목·관문·돕기·동행·오늘의 물음(글)은 고치지 않는다(verify 갈래의 것).
- 장면 설정 파일은 `design3d.build`가 true일 때만 3D 장면으로 등록된다. false로 되돌리면 "걸어서 탐험" 고르기가 사라지고 이야기 카드로만 간다.
- 전과 똑같은 이야기 카드(재료 1개)로 되돌리는 명령: `node tools/test/toggle3d_c.js OT-NN off` (다시 켜기는 `on`). 되돌릴 때 쓰는 원래 값은 JSON의 `_card3dc`에 있다(게임에는 묶이지 않는다).

## 대표 결정 대기
| 무엇 | 왜 대표가 정해야 하나 | 그동안 쓴 기본값 |
|---|---|---|
| (장면이 끝날 때마다 한 줄 더한다) | 장면표(`docs/09`)의 결정은 "3D는 대표 장면 12개"다. 이 갈래의 장면은 그 밖의 추가 제안이다 | 이 브랜치에만 둔다. 합칠지는 대표가 정한다 |

## 감수 항목

## 다른 갈래·총괄에 부탁

## 실패·주의
