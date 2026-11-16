# 3d-a: 이야기 카드 장면을 3D 장면으로 만드는 법 (자동 작업 3d-a가 OT-15를 만들며 정리)

본보기: `web3d/js/scene_spies15.js`(OT-15 열두 정탐꾼), `web3d/js/props_3d-a.js`(함께 쓰는 소품), `content/ot/OT-15.json`.
규칙은 `docs/auto/00_공통지시.md`, `docs/auto/3d-a_지시.md`, `docs/00_공통규칙서.md` 3절·13절, `content/ot/작성규칙.md` 1·2·5절이 위다. 이 글은 틀을 쓰는 요령만 적는다.

## 1. 자료(`content/ot/OT-NN.json`)에서 바꾸는 것
3D 장면이 되려면 검사기(`node tools/validate_ot.js --v3 --mission OT-NN`, 오류 0·경고 0)가 아래를 요구한다.
- `design3d.build: true`, `design3d`의 place·terrain·people·props·god·epic·never를 장절과 함께 채운다(OT-15, OT-39 깊이). 본문에 없는 생김새는 "본문에 없음"이라고 적는다.
- `quests` 3개(`design3d` 바로 앞에 둔다). 물음마다 t1(한 절 `ref`, find) · t2(범위 `ref`, find 또는 order) · t3(`refs` 두 곳 이상, find). 본문의 앞→뒤 순서.
  관문(`gates`)이 이미 쓴 장절과 같은 물음은 피한다. 맞지 않는 보기에는 `basis`("본문에 없음" 또는 그 내용이 실제로 적힌 장절. `node tools/bible_ref/ref.js "민 13:3"`으로 확인).
  보기 글이 본문과 16글자 이상 같으면 경고가 난다. 자기 말로 풀어 쓴다.
- `mission.materials` 3개(원래 1개). 원래 있던 재료를 첫째로 두고(자리 설명은 3D 배치에 맞게 고친다) 둘을 더한다. 재료는 본문에 나오는 평범한 것만(규칙서 13.2). `quests[i]`와 `materials[i]`가 짝이다(i번째 물음을 풀면 i번째 재료 자리로 간다).
  이름에 따라 바닥에 놓이는 모양이 정해진다(`game.js` matMesh: 돌/털/뿔/갈대·풀·짚/가지·막대/벽돌·조각/흙·모래/줄·끈·천/씨·열매).
- `mission.call`의 t1·t2·t3에 망가진 부속 세 가지(quests의 name)를 적는다.
- **되돌리기**: 바꾸기 전의 `mission.call`·`mission.materials`·`design3d` 원문을 파일 끝 `_story_only`에 넣는다(`_note`, `call`, `materials`, `design3d` 순서. `_note`는 OT-15와 같은 글).
  `node tools/test/toggle3d.js OT-NN off` 뒤 `_3d_only`를 뺀 내용이 `git show claude/auto-base:content/ot/OT-NN.json`과 같아야 하고, `on` 뒤에는 파일이 글자 하나 다르지 않게 돌아와야 한다(OT-15에서 확인한 방법).
- 대목(`beats`)·관문(`gates`)·돕기(`help`)·동행(`companion`)의 글은 고치지 않는다(verify 갈래의 것). 어긋난 것을 찾으면 진행 파일 "다른 갈래·총괄에 부탁"에 적는다.
- JSON은 들여쓰기 2칸, 한글 그대로(`json.dumps(d, ensure_ascii=False, indent=2) + '\n'`). 키 순서를 지킨다.

## 2. 장면 설정 파일(`web3d/js/scene_<이름>NN.js`)
`BO3D.scene3d['OT-NN'] = function (api) { ... return {...}; }`. 틀(`game.js`)이 타임머신·재료·도감·세 아이를 더한다.
- 돌려주는 것: `id, scene, sun, sunOff, height(x,z), walkable(x,z), edge(x,z), P{start, machine, machineRot, parts[3], lookSpot, look}, eventCam(i) 또는 eventLook(i), detector, askLabel, intro, lookText, partBeats, eventStart, beatNote(i), sceneDoneText, dex[], reset(), partFound(i), partContinue(i), lookupPose(), beatPose(i), update(dt, now), audio(A), menuCam(camera, now), debug{phase(), arrived()}`.
- 흐름: 물음 1 → 재료 1(→ `partFound(0)`, `partBeats[0]`번 대목을 글 상자로 보여 줌) → 물음 2 → 재료 2(`partFound(1)`, `partBeats[1]`) → 물음 3 → 재료 3 → 올려다보기(`P.look`) → 지켜보기(`eventStart`번 대목부터 끝까지, 대목마다 `beatPose(i)`).
  `mission.help.steps`의 `after`는 `partBeats`의 대목 번호, 지켜보기 대목 번호, 또는 "gates"여야 한다(걷기 시험이 센다). 그에 맞게 `partBeats`·`eventStart`를 정한다.
- `beatPose(i)`는 **모든 상태를 처음부터** 정한다('이전' 단추로 돌아와도 뒤 대목의 것이 남지 않게). OT-15의 `setPhase`처럼.
- 아이들이 다니는 곳(`walkable`)은 사건의 자리에서 떨어진 곳. 재료 3곳도 그 안. 사건 속 사람이 지나는 길과 겹치지 않게 한다.
- 지켜보기 화면: 세로 화면이라 가로로 보이는 폭이 좁다(가로 시야 약 24도). 글 상자가 아래 절반을 덮고, 틀이 화면을 위로 20% 올려 준다.
  `eventCam(i)`가 `{pos:[x,y,z], look:[x,y,z]}`를 주면 그 자리에서 본다. OT-15의 `cam(자리[x,z], 높이, 볼 것[x,y,z])` 도우미를 그대로 쓰면 볼 것이 글 상자 위쪽 가운데에 온다. 볼 것들을 좁게 모아 세운다.
- 낮밤을 바꿀 때 값 사이를 차례로 지나가므로, 대목 순서대로 이웃한 값이 되게 늘어놓는다(OT-15: 0 낮, 1 아침, 2 밤).
- 인물: `api.person('moses', cb)`(Blender GLB. 있는 것: moses, aaron, joshua, caleb, abraham, noah, david, goliath, elijah, gideon, daniel, darius, nehemiah, ezra, priest). 읽히기 전에는 `api.fallback(색, 키, 반지름)`. 무리는 `BO3D.models2.israelite(seed, {kind:'man', carry:'none'})`(update(dt, 속도)).
  GLB 하나가 미리보기에 약 0.42MB를 더한다(지금 8.8MB, 한도 16MB). 새 인물은 꼭 필요할 때만 `tools/blender/make_person.sh <이름>`(3~5분), `node tools/test/view_person.js <이름> <png>`로 네 방향을 본다.
- 움직이지 않는 것은 `BO3D.props.mergeStatic([...])`으로 합쳐 그리기 호출을 줄인다. 소리는 `api.FX.audio`가 주는 것만(rumble, thud, wind, pad, chime 등). 흔들림은 `api.shake(세기, 초)`.
- 하나님의 형상·음성, 천사, 죽음·폭력의 모습은 만들지 않는다. 파일 머리말에 "본문에 맞춘 점"과 "감수가 필요한 설정"을 적는다.

## 3. 묶기와 시험
- `web3d/index.html`과 `tools/build3d.js`의 스크립트 목록에 장면 파일 한 줄을 더한다(`scene_wall39.js` 뒤, `props_3d-a.js` 뒤).
- `node tools/build3d.js` → `dist/preview3d.html`. 생성 파일(`web3d/js/otdata.js`, `glbdata.js`, `avatars.js`)은 커밋하지 않는다(갈래끼리 부딪힌다. 총괄이 합친 뒤 다시 만든다).
- 빠른 확인(2~3분): `node tools/test/shot3d.js OT-NN <폴더> 8` → 지켜보기 대목마다 화면(글 상자 있는 것/없는 것). **직접 열어 본다.**
- 전체 흐름(한 번에 5~10분): `node tools/test/walk3dScene.js OT-NN 0|1|2 <폴더>` → "문제 0, 오류 0"이어야 한다. 한 번에 1~2개만 돌린다.
- 무게: `node tools/test/perf3d.js OT-09 OT-NN` → 호렙 산(그리기 호출 377, 삼각형 39만)보다 크게 무겁지 않을 것.
- 커밋은 자기 파일만 경로를 적어서(`git add <파일들>`. `git add -A` 금지), 한국어 한 줄, `git push origin claude/auto-3d-a`.
