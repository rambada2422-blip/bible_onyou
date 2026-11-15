// 구약 장면 자료(content/ot/OT-NN.json)의 형식과 장절을 검사한다.
//   node tools/validate_ot.js            전체
//   node tools/validate_ot.js OT-05 ...   고른 장면만
// 오류(ERR)가 하나라도 있으면 종료 코드 1. 경고(WARN)는 사람이 확인한다.
// 장절이 실제로 있는지, 문장이 검증용 본문(개역한글)과 지나치게 같은지도 본다(ref/bible 이 있을 때. tools/bible_ref/fetch.sh).
const fs = require('fs'), path = require('path');
const R = require('./bible_ref/ref.js');
const DIR = path.join(__dirname, '..', 'content', 'ot');
const WHO = ['choeon', 'hyu', 'onwoo'];
const TYPES = { t1: ['choice', 'find'], t2: ['order', 'choice', 'find'], t3: ['findref', 'choice'] };
const BAN = ['틀렸', '실패', '감점', '목숨'];
const hasRef = fs.existsSync(path.join(__dirname, '..', 'ref', 'bible', 'krv', 'krv.1.1.txt'));
let nerr = 0, nwarn = 0;

function norm(s) { return String(s).replace(/[\s.,!?'"“”‘’·:;()\-~]/g, ''); }
function lcs(a, b) {            // 가장 긴 공통 연속 부분의 길이
  let best = 0, prev = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) if (a[i - 1] === b[j - 1]) { cur[j] = prev[j - 1] + 1; if (cur[j] > best) best = cur[j]; }
    prev = cur;
  }
  return best;
}

function check(file) {
  const id = path.basename(file, '.json');
  const E = (m) => { nerr++; console.log(`ERR  ${id}: ${m}`); };
  const W = (m) => { nwarn++; console.log(`WARN ${id}: ${m}`); };
  let d;
  try { d = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { E('JSON을 읽을 수 없음: ' + e.message); return; }
  const str = (v) => typeof v === 'string' && v.trim().length > 0;
  const refOk = (ref, where) => {
    if (!str(ref)) { E(`${where}: 장절 없음`); return null; }
    if (!R.parse(ref)) { E(`${where}: 장절 표기를 읽을 수 없음 "${ref}" (예: "창 1:1-5")`); return null; }
    if (hasRef) { const v = R.verses(ref); if (!v || v.bad || !v.list.length) { E(`${where}: 실제로 없는 장절 "${ref}"`); return null; } return v; }
    return null;
  };
  const texts = [];             // [where, text, ref]  금지어와 본문 유사도 검사용
  if (d.id !== id) E(`id "${d.id}"가 파일 이름과 다름`);
  if (!(Number.isInteger(d.era) && d.era >= 1 && d.era <= 10)) E('era는 1~10');
  ['title', 'place', 'sources'].forEach((k) => { if (!str(d[k])) E(`${k} 없음`); });
  refOk(d.ref, 'ref');
  if (!d.review || typeof d.review.required !== 'boolean' || !Array.isArray(d.review.topics) || d.review.status !== '미감수') E('review: {required: true/false, topics: [...], status: "미감수"}');
  else if (d.review.required && !d.review.topics.length) E('review.required가 true이면 topics에 규칙서 3.5의 해당 주제를 적는다');
  // 대목
  if (!Array.isArray(d.beats) || d.beats.length < 4 || d.beats.length > 8) E('beats는 4~8개');
  (d.beats || []).forEach((b, i) => {
    const w = `beats[${i}]`;
    refOk(b.ref, w + '.ref'); if (b.open) refOk(b.open, w + '.open');
    ['t1', 't2', 't3'].forEach((t) => { if (!b.text || !str(b.text[t])) E(`${w}.text.${t} 없음`); else texts.push([`${w}.text.${t}`, b.text[t], b.ref]); });
    if (b.text && str(b.text.t1) && (b.text.t1.match(/[.!?](\s|$)/g) || []).length > 3) W(`${w}.text.t1: 8~10세 문장이 3개를 넘음`);
    if (!b.say || !WHO.includes(b.say.who) || !str(b.say.text)) E(`${w}.say: {who: choeon|hyu|onwoo, text}`); else texts.push([`${w}.say`, b.say.text, null]);
  });
  // 물음
  const question = (q, w, tier) => {
    if (!q || !TYPES[tier].includes(q.type)) { E(`${w}: ${tier}에 쓸 수 있는 유형은 ${TYPES[tier].join(', ')} (지금: ${q && q.type})`); return; }
    const opts = (o, ww) => {
      if (!Array.isArray(o) || o.length < 3 || o.length > 4) { E(`${ww}: 보기는 3~4개`); return; }
      if (o.filter((x) => x.ok === true).length !== 1) E(`${ww}: 맞는 보기(ok: true)는 정확히 1개`);
      o.forEach((x, k) => {
        if (!str(x.label)) E(`${ww}[${k}].label 없음`); else texts.push([`${ww}[${k}]`, x.label, null]);
        if (!x.ok && !str(x.basis)) E(`${ww}[${k}]: 맞지 않는 보기에는 basis("본문에 없음" 또는 그 내용이 실제로 나오는 장절)를 적는다`);
        if (!x.ok && str(x.basis) && x.basis !== '본문에 없음') refOk(x.basis, `${ww}[${k}].basis`);
      });
    };
    if (!str(q.prompt)) E(`${w}.prompt 없음`); else texts.push([`${w}.prompt`, q.prompt, q.ref || null]);
    if (q.type === 'choice') { refOk(q.ref, w + '.ref'); opts(q.options, w + '.options'); }
    if (q.type === 'find') { refOk(q.ref, w + '.ref'); if (!q.confirm || !str(q.confirm.prompt)) E(`${w}.confirm.prompt 없음`); else opts(q.confirm.options, w + '.confirm.options'); }
    if (q.type === 'order') { refOk(q.ref, w + '.ref'); if (!Array.isArray(q.items) || q.items.length < 3 || q.items.length > 6) E(`${w}.items는 3~6개(본문 순서대로)`); else q.items.forEach((x, k) => texts.push([`${w}.items[${k}]`, x, q.ref])); }
    if (q.type === 'findref') {
      const bk = R.BOOKS.find((b) => b[1] === q.book);
      if (!bk) E(`${w}.book은 책 이름 전체(예: "창세기")`);
      if (!Array.isArray(q.accept) || !q.accept.length) E(`${w}.accept 없음(예: ["3:12"])`);
      else if (bk) q.accept.forEach((a) => { if (!/^\d+:\d+$/.test(a)) E(`${w}.accept "${a}"는 "장:절"`); else refOk(`${bk[0]} ${a}`, `${w}.accept`); });
      if (!str(q.hint)) E(`${w}.hint 없음`);
      if (q.after) texts.push([`${w}.after`, q.after, null]);
    }
  };
  ['t1', 't2', 't3'].forEach((t) => {
    const g = d.gates && d.gates[t];
    if (!Array.isArray(g) || g.length !== 2) E(`gates.${t}는 물음 2개`); else g.forEach((q, i) => question(q, `gates.${t}[${i}]`, t));
  });
  if (!Array.isArray(d.cards) || d.cards.length < 1 || d.cards.length > 2) E('cards는 1~2개'); else d.cards.forEach((c, i) => { refOk(c.ref, `cards[${i}].ref`); if (!str(c.title)) E(`cards[${i}].title 없음`); });
  const c = d.close || {};
  if (!c.t1 || c.t1.kind !== 'prayer' || !str(c.t1.text)) E('close.t1: {kind: "prayer", text}');
  if (!c.t2 || c.t2.kind !== 'practice' || !str(c.t2.text)) E('close.t2: {kind: "practice", text}');
  if (!c.t3 || c.t3.kind !== 'note' || !str(c.t3.prompt)) E('close.t3: {kind: "note", prompt}');
  // 3D 설계
  const g3 = d.design3d;
  if (!g3 || typeof g3.build !== 'boolean') E('design3d.build: true/false');
  else {
    ['place', 'terrain', 'god'].forEach((k) => { if (!str(g3[k])) E(`design3d.${k} 없음`); });
    ['people', 'props', 'never'].forEach((k) => { if (!Array.isArray(g3[k])) E(`design3d.${k}는 배열`); });
    if (!g3.epic || typeof g3.epic.yes !== 'boolean' || (g3.epic.yes && !str(g3.epic.why))) E('design3d.epic: {yes: true/false, why}');
    if (g3.build) {
      if (!Array.isArray(d.quests) || d.quests.length !== 3) E('design3d.build가 true이면 quests(부품 찾기 물음)가 3개 있어야 함');
      else d.quests.forEach((q, i) => {
        const w = `quests[${i}]`;
        ['part', 'name', 'line', 'found'].forEach((k) => { if (!str(q[k])) E(`${w}.${k} 없음`); });
        if (!q.say || !WHO.includes(q.say.who) || !str(q.say.text)) E(`${w}.say: {who, text}`);
        ['t1', 't2', 't3'].forEach((t) => question(q.q && q.q[t], `${w}.q.${t}`, t));
      });
    } else if (d.quests) W('design3d.build가 false인데 quests가 있음');
  }
  // 금지어, 본문과 지나치게 같은 문장
  texts.forEach(([w, t, ref]) => {
    BAN.forEach((b) => { if (String(t).includes(b)) E(`${w}: 쓰지 않는 표현 "${b}" (규칙서 4.2)`); });
    if (hasRef && ref && R.parse(ref)) {
      const v = R.verses(ref); if (!v) return;
      const a = norm(t), n = Math.max(...v.list.map((x) => lcs(a, norm(x.krv))));
      if (n >= 16) W(`${w}: 본문 문장과 ${n}글자가 그대로 같음. 자기 말로 풀어 쓴다 (${ref})`);
    }
  });
}

const want = process.argv.slice(2);
const files = fs.readdirSync(DIR).filter((f) => /^OT-\d\d\.json$/.test(f) && (!want.length || want.includes(f.replace('.json', '')))).sort();
if (!hasRef) console.log('주의: ref/bible 이 없어 장절이 실제로 있는지는 검사하지 못함 (tools/bible_ref/fetch.sh)');
files.forEach((f) => check(path.join(DIR, f)));
console.log(`검사 ${files.length}개 장면: 오류 ${nerr}, 경고 ${nwarn}`);
process.exit(nerr ? 1 : 0);
