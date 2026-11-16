#!/usr/bin/env node
/* 자동 작업 3d-c가 더한 3D 장면(추가 제안)을 장면마다 끄고 켠다. 대표가 "이 장면은 이야기 카드로만" 하고 정하면 off 한 번이면 된다.
 * 사용: node tools/test/toggle3d_c.js OT-37 stash|off|on    (그 뒤 node tools/build3d.js)
 *   stash : 3D로 바꾸기 전에 한 번. 지금의 design3d와 mission.materials(이야기 카드의 재료 1개)를 `_card3dc`에 적어 둔다.
 *   off   : 이야기 카드 때의 값(`_card3dc`)으로 되돌린다. 3D 값(design3d, quests, 재료 3개)은 `_3dc`에 옮겨 둔다. 전과 똑같은 이야기 카드가 된다.
 *   on    : `_3dc`에 둔 3D 값을 다시 켠다.
 * `_`로 시작하는 항목은 게임 묶음(otdata.js)에 들어가지 않는다(tools/build_ot.js). 글(대목·관문·돕기)은 건드리지 않는다.
 */
const fs = require('fs');
const path = require('path');
const id = process.argv[2], cmd = process.argv[3];
if (!/^OT-\d\d$/.test(id || '') || ['stash', 'off', 'on'].indexOf(cmd) < 0) { console.error('사용: node tools/test/toggle3d_c.js OT-NN stash|off|on'); process.exit(2); }
const file = path.join(__dirname, '..', '..', 'content', 'ot', id + '.json');
const d = JSON.parse(fs.readFileSync(file, 'utf8'));
const copy = (x) => JSON.parse(JSON.stringify(x));
/* 항목 순서를 지킨다: quests는 design3d 바로 뒤에 둔다 */
function rebuild(src, quests) {
  const out = {};
  Object.keys(src).forEach((k) => { if (k === 'quests') return; out[k] = src[k]; if (k === 'design3d' && quests) out.quests = quests; });
  return out;
}
let o = d;
if (cmd === 'stash') {
  if (d._card3dc) { console.log(id + ': 이미 적어 둠(_card3dc)'); process.exit(0); }
  if (d.design3d.build) { console.error(id + ': 이미 3D 장면이다(design3d.build true). stash는 바꾸기 전에 한다'); process.exit(1); }
  d._card3dc = { note: '자동 작업 3d-c가 3D 장면으로 바꾸기 전의 값. tools/test/toggle3d_c.js off가 이 값으로 되돌린다', design3d: copy(d.design3d), materials: copy(d.mission.materials) };
} else if (cmd === 'off') {
  if (!d._card3dc) { console.error(id + ': _card3dc가 없다(3d-c가 바꾼 장면이 아님)'); process.exit(1); }
  if (!d.design3d.build) { console.log(id + ': 이미 이야기 카드 장면'); process.exit(0); }
  d._3dc = { note: '자동 작업 3d-c의 3D 값. tools/test/toggle3d_c.js on이 다시 켠다', design3d: copy(d.design3d), quests: copy(d.quests), materials: copy(d.mission.materials) };
  d.design3d = copy(d._card3dc.design3d); d.mission.materials = copy(d._card3dc.materials);
  o = rebuild(d, null);
} else {
  if (!d._3dc) { console.error(id + ': _3dc가 없다(off 한 적이 없음)'); process.exit(1); }
  d.design3d = copy(d._3dc.design3d); d.mission.materials = copy(d._3dc.materials);
  const q = copy(d._3dc.quests); delete d._3dc;
  o = rebuild(d, q);
}
fs.writeFileSync(file, JSON.stringify(o, null, 2) + '\n');
console.log(id + ': ' + cmd + ' 끝. design3d.build = ' + o.design3d.build + ', 재료 ' + o.mission.materials.length + '개, quests ' + (o.quests ? o.quests.length : 0) + '개');
