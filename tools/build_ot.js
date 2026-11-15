#!/usr/bin/env node
/* 구약 장면 자료(content/ot/OT-NN.json)와 시대 정보(content/ot/eras.json)를 게임이 읽는 한 파일(web3d/js/otdata.js)로 묶는다.
 * 실행: node tools/build_ot.js   (tools/build3d.js가 먼저 부른다)
 * - 게임에 필요 없는 design3d와 _note는 빼고 묶는다(3D 설계는 사람이 JSON에서 읽는다).
 * - 묶기 전에 가볍게 점검한다: 장면 40개가 다 있는지, 시대 번호, "이 사이에 기록한 곳"이 장면의 대목과 겹치지 않는지.
 *   자세한 형식 검사는 node tools/validate_ot.js.
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const DIR = path.join(root, 'content', 'ot');
let R = null;
try { R = require('./bible_ref/ref.js'); } catch (e) { R = null; }
const hasRef = R && fs.existsSync(path.join(root, 'ref', 'bible', 'krv', 'krv.1.1.txt'));

function build() {
  const E = JSON.parse(fs.readFileSync(path.join(DIR, 'eras.json'), 'utf8'));
  const files = fs.readdirSync(DIR).filter((f) => /^OT-\d\d\.json$/.test(f)).sort();
  const scenes = {}, order = [], problems = [];
  files.forEach((f) => {
    const d = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
    const out = {};
    Object.keys(d).forEach((k) => { if (k !== 'design3d' && k[0] !== '_') out[k] = d[k]; });
    out.has3d = !!(d.design3d && d.design3d.build);
    out.epic = !!(d.design3d && d.design3d.epic && d.design3d.epic.yes);
    scenes[d.id] = out; order.push(d.id);
  });
  if (order.length !== 40) problems.push('장면이 40개가 아님: ' + order.length);
  const eras = E.eras.map((e) => {
    const ids = order.filter((id) => scenes[id].era === e.era);
    if (!ids.length) problems.push('시대 ' + e.era + '에 장면이 없음');
    return { era: e.era, name: e.name, key: e.key, intro: e.intro, between: e.between, scenes: ids };
  });
  /* "이 사이에 기록한 곳"이 장면의 대목 장절과 겹치면 안내가 틀린 것이다 */
  if (hasRef) {
    const key = (b, c, v) => b + ':' + c + ':' + v, used = {};
    order.forEach((id) => scenes[id].beats.forEach((b) => { const r = R.parse(b.ref), v = R.verses(b.ref); if (r && v) v.list.forEach((x) => { used[key(r.book, x.c, x.v)] = id; }); }));
    eras.forEach((e) => e.between.forEach((ref) => {
      const r = R.parse(ref), v = R.verses(ref);
      if (!r || !v || v.bad) { problems.push('시대 ' + e.era + ': 읽을 수 없는 장절 ' + ref); return; }
      const hit = v.list.find((x) => used[key(r.book, x.c, x.v)]);
      if (hit) problems.push('시대 ' + e.era + ': ' + ref + '가 ' + used[key(r.book, hit.c, hit.v)] + '의 대목과 겹침');
    }));
  }
  const data = { story: E.story, eras: eras, order: order, scenes: scenes };
  const js = '/* tools/build_ot.js가 content/ot/에서 만든 파일. 직접 고치지 말 것. */\nwindow.BO3D = window.BO3D || {};\nBO3D.ot = ' + JSON.stringify(data) + ';\n';
  fs.writeFileSync(path.join(root, 'web3d', 'js', 'otdata.js'), js);
  const nm = order.filter((id) => scenes[id].mission).length;
  console.log('otdata.js: 장면 ' + order.length + '개 (임무 있음 ' + nm + '), ' + (Buffer.byteLength(js) / 1024).toFixed(0) + 'KB' + (hasRef ? '' : ' · 주의: ref/bible 없음, 겹침 점검 못 함'));
  problems.forEach((p) => console.log('주의: ' + p));
  return problems.length;
}
module.exports = build;
if (require.main === module) process.exit(build() ? 1 : 0);
