// 자동 작업(3d-a)이 3D로 만든 장면을 이야기 카드만의 장면으로 되돌리거나(off) 다시 3D로 켠다(on).
// 사용: node tools/test/toggle3d.js OT-15 off   → design3d.build=false, quests를 빼고 mission.call·materials를 3D로 만들기 전의 원문(_story_only)으로 되돌린다
//       node tools/test/toggle3d.js OT-15 on    → 다시 3D 장면으로
// 뺀 것은 파일 안의 _3d_only에 보관한다(잃지 않는다). 그 뒤 node tools/build3d.js로 다시 묶는다.
const fs = require('fs'), path = require('path');
const id = process.argv[2], mode = process.argv[3];
if (!/^OT-\d\d$/.test(id || '') || !['on', 'off'].includes(mode)) { console.error('사용: node tools/test/toggle3d.js OT-NN on|off'); process.exit(1); }
const f = path.join(__dirname, '../../content/ot', id + '.json'), d = JSON.parse(fs.readFileSync(f, 'utf8'));
const note = (o) => Object.assign({ _note: o._note }, o);
if (mode === 'off') {
  if (!d._story_only) { console.error(id + ': _story_only가 없다(3d-a가 3D로 만든 장면이 아니거나 이미 꺼져 있다)'); process.exit(1); }
  const s = d._story_only;
  d._3d_only = { _note: '3D 장면용 자료(자동 작업 3d-a). toggle3d.js on으로 되살린다.', quests: d.quests, call: d.mission.call, materials: d.mission.materials, design3d: d.design3d };
  delete d.quests; d.mission.call = s.call; d.mission.materials = s.materials; d.design3d = s.design3d; delete d._story_only;
} else {
  if (!d._3d_only) { console.error(id + ': _3d_only가 없다(이미 3D이거나 3d-a의 장면이 아니다)'); process.exit(1); }
  const t = d._3d_only, out = {};
  d._story_only = { _note: '3D 장면(자동 작업 3d-a)으로 만들기 전의 이야기 카드용 원문. toggle3d.js off로 되돌린다.', call: d.mission.call, materials: d.mission.materials, design3d: d.design3d };
  d.mission.call = t.call; d.mission.materials = t.materials; d.design3d = t.design3d; delete d._3d_only;
  Object.keys(d).forEach((k) => { if (k === 'design3d') out.quests = t.quests; if (k !== 'quests') out[k] = d[k]; });
  fs.writeFileSync(f, JSON.stringify(out, null, 2) + '\n'); console.log(id, '3D 켬'); process.exit(0);
}
fs.writeFileSync(f, JSON.stringify(d, null, 2) + '\n'); console.log(id, '이야기 카드로 되돌림');
