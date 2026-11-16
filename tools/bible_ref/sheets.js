// 3차 전수 대조(자동 작업 2026-11-16~17)에 쓴 대조지를 만든다. 저장소에는 대조지를 넣지 않는다(바깥 폴더에 쓴다).
//   node tools/bible_ref/sheets.js <저장 폴더>
//   <폴더>/read/OT-NN.md   읽는 대조용: 장면 자료의 모든 글을 "자리: 글" 한 줄씩(3D 설계 design3d는 뺀다. 다른 갈래의 것)
//   <폴더>/blind/era-N.md  가려 풀기용: 물음과 보기만(정답·근거 표시 없이, 보기 차례를 섞음)
//   <폴더>/blind/key-N.json 가려 풀기의 정답 표(푸는 쪽에는 주지 않는다)
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..', '..', 'content', 'ot');
const OUT = process.argv[2];
if (!OUT) { console.error('저장 폴더를 적어 주세요'); process.exit(1); }
fs.mkdirSync(path.join(OUT, 'read'), { recursive: true }); fs.mkdirSync(path.join(OUT, 'blind'), { recursive: true });
let seed = 20261116;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const L = 'ABCDEFGH';
const files = fs.readdirSync(DIR).filter((f) => /^OT-\d\d\.json$/.test(f)).sort();
const blind = {}, keys = {};
files.forEach((f) => {
  const d = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
  /* 읽는 대조지 */
  const lines = [`# ${d.id} ${d.title} (${d.ref}) · 시대 ${d.era}`, ''];
  const walk = (v, p) => {
    if (v === null || v === undefined) { lines.push(`${p}: (없음)`); return; }
    if (typeof v !== 'object') { lines.push(`${p}: ${v}`); return; }
    if (Array.isArray(v)) {
      if (v.every((x) => typeof x !== 'object')) { lines.push(`${p}: ${v.map((x) => `「${x}」`).join(' / ')}`); return; }
      v.forEach((x, i) => walk(x, `${p}[${i}]`)); return;
    }
    if (typeof v.label === 'string' && Object.keys(v).every((k) => ['label', 'ok', 'basis'].includes(k))) { lines.push(`${p}: 「${v.label}」 ${v.ok ? '【맞는 보기】' : `【맞지 않는 보기. 근거: ${v.basis}】`}`); return; }
    Object.keys(v).forEach((k) => { if (k === 'design3d' || k[0] === '_') return; walk(v[k], p ? `${p}.${k}` : k); });
  };
  ['id', 'era', 'title', 'ref', 'place', 'review'].forEach((k) => walk(d[k], k));
  lines.push('', '## 대목(beats)'); (d.beats || []).forEach((b, i) => { walk(b, `beats[${i}]`); lines.push(''); });
  lines.push('## 관문(gates)'); walk(d.gates, 'gates');
  if (d.quests) { lines.push('', '## 3D 탐지기 물음(quests)'); walk(d.quests, 'quests'); }
  lines.push('', '## 말씀 카드·마무리'); walk(d.cards, 'cards'); walk(d.close, 'close');
  lines.push('', '## 임무(mission): 최현 박사 통신(call)·재료(materials)·동행 문답(companion)·현장 돕기(help)·오늘의 물음(today)'); walk(d.mission, 'mission');
  fs.writeFileSync(path.join(OUT, 'read', d.id + '.md'), lines.join('\n') + '\n');
  /* 가려 풀기 */
  const B = (blind[d.era] = blind[d.era] || []), K = (keys[d.era] = keys[d.era] || {});
  const add = (q, where, tier) => {
    if (!q) return;
    const id = `${d.id}|${where}`, refs = (q.refs || [q.ref]).filter(Boolean);
    const out = [`### ${id}  (${{ t1: '8~10세', t2: '11~13세', t3: '14~19세' }[tier]}, 방식 ${q.type})`, `읽을 곳: ${refs.join(', ') || '(없음)'}`];
    if (q.type === 'find' || q.type === 'choice' || q.type === 'multi') {
      const o = shuffle((q.confirm ? q.confirm.options : q.options) || []);
      out.push(`물음: ${q.confirm ? q.confirm.prompt : q.prompt}`); o.forEach((x, i) => out.push(`  ${L[i]}. ${x.label}`));
      K[id] = { type: q.type, ok: o.map((x, i) => (x.ok ? L[i] : null)).filter(Boolean), labels: o.map((x) => x.label), basis: o.map((x) => x.basis || null) };
    } else if (q.type === 'order') {
      const idx = shuffle(q.items.map((_, i) => i));
      out.push(`물음: ${q.prompt}`, '(아래 항목을 본문에서 일어난 차례대로 늘어놓는다)'); idx.forEach((k, i) => out.push(`  ${L[i]}. ${q.items[k]}`));
      const pos = {}; idx.forEach((k, i) => { pos[k] = L[i]; });
      K[id] = { type: 'order', ok: q.items.map((_, k) => pos[k]), labels: idx.map((k) => q.items[k]) };
    } else if (q.type === 'match') {
      const idx = shuffle(q.pairs.map((_, i) => i));
      out.push(`물음: ${q.prompt}`, '(구절마다 맞는 내용 하나를 잇는다)'); idx.forEach((k, i) => out.push(`  ${L[i]}. ${q.pairs[k].text}`));
      const m = {}; idx.forEach((k, i) => { m[q.pairs[k].ref] = L[i]; });
      K[id] = { type: 'match', ok: m, labels: idx.map((k) => q.pairs[k].text) };
    } else if (q.type === 'findref') { out.push(`물음: ${q.prompt} (책: ${q.book})`); K[id] = { type: 'findref', ok: q.accept }; }
    B.push(out.join('\n'));
  };
  ['t1', 't2', 't3'].forEach((t) => ((d.gates && d.gates[t]) || []).forEach((q, i) => add(q, `gates.${t}[${i}]`, t)));
  (d.quests || []).forEach((q, i) => ['t1', 't2', 't3'].forEach((t) => add(q.q && q.q[t], `quests[${i}].q.${t}`, t)));
  ((d.mission && d.mission.help && d.mission.help.steps) || []).forEach((x, i) => { if (x.kind === 'ask') ['t1', 't2', 't3'].forEach((t) => add(x.read && x.read[t], `mission.help.steps[${i}].read.${t}`, t)); });
});
let n = 0;
Object.keys(blind).forEach((e) => {
  fs.writeFileSync(path.join(OUT, 'blind', `era-${e}.md`), `# 시대 ${e} 물음지 (정답 표시 없음, 보기 차례 섞음) · 물음 ${blind[e].length}개\n\n` + blind[e].join('\n\n') + '\n');
  fs.writeFileSync(path.join(OUT, 'blind', `key-${e}.json`), JSON.stringify(keys[e], null, 1)); n += blind[e].length;
});
console.log(`읽는 대조지 ${files.length}장, 가려 풀기 물음 ${n}개 → ${OUT}`);
