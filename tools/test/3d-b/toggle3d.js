#!/usr/bin/env node
/* 자동 작업 3d-b가 더한 3D 장면을 끄고 켠다(대표가 합치지 않기로 하면 끄면 된다).
 *   node tools/test/3d-b/toggle3d.js OT-23 off   → design3d.build를 false로, 탐지기 물음(quests)과 둘째·셋째 재료를 `_3d`에 넣어 둔다. 이야기 카드가 전과 같이 돈다(재료 1개)
 *   node tools/test/3d-b/toggle3d.js OT-23 on    → `_3d`에 넣어 둔 것을 되살리고 build를 true로
 * 끈 뒤에도 장면 설정 파일(web3d/js/scene_*.js)은 남지만, build가 false면 3D를 등록하지 않는다(props_3d-b.js의 on()).
 * 바꾼 뒤 `node tools/validate_ot.js --v3 OT-NN`과 `node tools/build3d.js`를 다시 돌린다. */
const fs = require('fs'), path = require('path');
const id = process.argv[2], mode = process.argv[3];
if (!/^OT-\d\d$/.test(id || '') || (mode !== 'on' && mode !== 'off')) { console.log('사용: node tools/test/3d-b/toggle3d.js OT-NN on|off'); process.exit(1); }
const f = path.join(__dirname, '..', '..', '..', 'content', 'ot', id + '.json');
const d = JSON.parse(fs.readFileSync(f, 'utf8')), out = {};
if (mode === 'off') {
  if (!d.design3d.build) { console.log(id, '이미 꺼져 있음'); process.exit(0); }
  d._3d = { quests: d.quests, materials: d.mission.materials.slice(1), epic: d.design3d.epic };
  d.design3d.build = false; d.mission.materials = [d.mission.materials[0]];
  Object.keys(d).forEach((k) => { if (k !== 'quests') out[k] = d[k]; });
} else {
  if (d.design3d.build) { console.log(id, '이미 켜져 있음'); process.exit(0); }
  if (!d._3d) { console.log(id, '되살릴 `_3d`가 없음'); process.exit(1); }
  d.design3d.build = true; d.mission.materials = [d.mission.materials[0]].concat(d._3d.materials);
  Object.keys(d).forEach((k) => { if (k === '_3d') return; if (k === 'mission') out.quests = d._3d.quests; out[k] = d[k]; });
}
fs.writeFileSync(f, JSON.stringify(out, null, 2) + '\n');
console.log(id, mode === 'off' ? '3D 끔(이야기 카드만)' : '3D 켬');
