// 가려 풀기의 답(blind/ans-N.json)을 정답 표(blind/key-N.json)와 견준다. sheets.js가 만든 폴더를 넘긴다.
//   node tools/bible_ref/grade_blind.js <폴더> [시대 번호 ...]
// 나오는 것: 답이 정답 표와 다른 물음, 푼 사람이 문제(issue)를 적은 물음. 이 목록은 반박 검증으로 넘긴다.
const fs = require('fs'), path = require('path');
const D = process.argv[2], eras = process.argv.slice(3).length ? process.argv.slice(3) : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
let total = 0, diff = 0, issues = 0, missing = 0;
eras.forEach((e) => {
  const kf = path.join(D, 'blind', `key-${e}.json`), af = path.join(D, 'blind', `ans-${e}.json`);
  if (!fs.existsSync(af)) { console.log(`시대 ${e}: 답 파일 없음`); return; }
  const K = JSON.parse(fs.readFileSync(kf, 'utf8')), A = JSON.parse(fs.readFileSync(af, 'utf8'));
  const out = [];
  Object.keys(K).forEach((id) => {
    total++;
    const k = K[id], a = A[id];
    if (!a) { missing++; out.push({ id, kind: '안 풂' }); return; }
    let same;
    if (k.type === 'multi') same = eq([].concat(a.answer).slice().sort(), k.ok.slice().sort());
    else if (k.type === 'order') same = eq(a.answer, k.ok);
    else if (k.type === 'match') same = Object.keys(k.ok).every((r) => a.answer && a.answer[r] === k.ok[r]);
    else if (k.type === 'findref') same = [].concat(a.answer).some((x) => k.ok.includes(x));
    else same = eq([].concat(a.answer), k.ok);
    const lab = (x) => (typeof x === 'string' && k.labels && 'ABCDEFGH'.includes(x) ? `${x}(${k.labels['ABCDEFGH'.indexOf(x)]})` : x);
    const show = (v) => (Array.isArray(v) ? v.map(lab).join(' → ') : v && typeof v === 'object' ? Object.keys(v).map((r) => `${r}=${lab(v[r])}`).join(' / ') : lab(v));
    if (!same) { diff++; out.push({ id, kind: '답이 다름', 정답표: show(k.ok), 푼답: show(a.answer), 확신: a.sure, 문제: a.issue || '' }); }
    else if (a.issue && String(a.issue).trim()) { issues++; out.push({ id, kind: '문제 적음', 답: show(a.answer), 확신: a.sure, 문제: a.issue }); }
  });
  fs.writeFileSync(path.join(D, 'blind', `grade-${e}.json`), JSON.stringify(out, null, 1));
  console.log(`시대 ${e}: 물음 ${Object.keys(K).length}, 답이 다름 ${out.filter((x) => x.kind === '답이 다름').length}, 문제 적음 ${out.filter((x) => x.kind === '문제 적음').length}, 안 풂 ${out.filter((x) => x.kind === '안 풂').length}`);
});
console.log(`모두: 물음 ${total}, 답이 다름 ${diff}, 문제 적음 ${issues}, 안 풂 ${missing}`);
