// 구약 장면 자료(content/ot/OT-NN.json)의 형식과 장절을 검사한다.
//   node tools/validate_ot.js            전체
//   node tools/validate_ot.js OT-05 ...   고른 장면만
//   node tools/validate_ot.js --mission    임무(mission)가 없으면 오류로 본다
// 오류(ERR)가 하나라도 있으면 종료 코드 1. 경고(WARN)는 사람이 확인한다.
// 장절이 실제로 있는지, 문장이 검증용 본문(개역한글)과 지나치게 같은지도 본다(ref/bible 이 있을 때. tools/bible_ref/fetch.sh).
const fs = require('fs'), path = require('path');
const R = require('./bible_ref/ref.js');
const DIR = path.join(__dirname, '..', 'content', 'ot');
const WHO = ['choeon', 'hyu', 'onwoo'];
/* 규칙서 13.5: 세 단계 모두 읽을 곳을 주고 찾아 읽게 하는 find를 쓸 수 있다(14~19세는 refs로 떨어진 두 곳 이상) */
const TYPES = { t1: ['choice', 'find', 'multi'], t2: ['order', 'choice', 'find'], t3: ['findref', 'choice', 'find', 'match'] };
/* 규칙서 13.8(--v3): 관문의 둘째 물음은 단계마다 정해진 놀이 방식 */
const SECOND = { t1: 'multi', t2: 'order', t3: 'match' };
const HELP_KINDS = ['do', 'watch', 'stay', 'ask'];
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
    if (b.text && str(b.text.t1) && (b.text.t1.match(/[.!?](\s|$)/g) || []).length > (V3 ? 2 : 3)) (V3 ? E : W)(`${w}.text.t1: 8~10세 문장이 ${V3 ? 2 : 3}개를 넘음(규칙서 5절, 13.8)`);
    if (!b.say || !WHO.includes(b.say.who) || !str(b.say.text)) E(`${w}.say: {who: choeon|hyu|onwoo, text}`); else texts.push([`${w}.say`, b.say.text, null]);
  });
  // 물음
  const question = (q, w, tier) => {
    if (!q || !TYPES[tier].includes(q.type)) { E(`${w}: ${tier}에 쓸 수 있는 유형은 ${TYPES[tier].join(', ')} (지금: ${q && q.type})`); return; }
    if (V2) {   /* 규칙서 13.5 물음의 세 단계(--v2): t1 한 절 / t2 범위 / t3 떨어진 두 곳 이상. 놀이 방식은 find, 그리고 13.8의 multi·order·match */
      const okType = { t1: ['find', 'multi'], t2: ['find', 'order'], t3: ['find', 'match'] }[tier];
      if (!okType.includes(q.type)) E(`${w}: 13.5·13.8에 따라 ${okType.join(' 또는 ')}로 쓴다(지금: ${q.type})`);
      else if (tier === 't1' && (q.refs || !/^\S+ \d+:\d+$/.test(String(q.ref || '')))) E(`${w}: 8~10세는 ref에 한 절(예: "출 12:7")`);
      else if (tier === 't2' && (q.refs || !/^\S+ \d+:\d+-(\d+:)?\d+$/.test(String(q.ref || '')))) E(`${w}: 11~13세는 ref에 범위(예: "출 12:21-23")`);
      else if (tier === 't3' && !(Array.isArray(q.refs) && q.refs.length >= 2)) E(`${w}: 14~19세는 refs에 떨어진 두 곳 이상`);
    }
    const sim = q && (q.refs || [q.ref]).filter(Boolean);   /* 보기 글도 물음의 장절 본문과 대조한다(그대로 옮긴 보기를 막는다) */
    const opts = (o, ww) => {
      if (!Array.isArray(o) || o.length < 3 || o.length > 4) { E(`${ww}: 보기는 3~4개`); return; }
      if (o.filter((x) => x.ok === true).length !== 1) E(`${ww}: 맞는 보기(ok: true)는 정확히 1개`);
      o.forEach((x, k) => {
        if (!str(x.label)) E(`${ww}[${k}].label 없음`); else if (sim && sim.length) sim.forEach((r) => texts.push([`${ww}[${k}]`, x.label, r])); else texts.push([`${ww}[${k}]`, x.label, null]);
        if (!x.ok && !str(x.basis)) E(`${ww}[${k}]: 맞지 않는 보기에는 basis("본문에 없음" 또는 그 내용이 실제로 나오는 장절)를 적는다`);
        if (!x.ok && str(x.basis) && x.basis !== '본문에 없음') refOk(x.basis, `${ww}[${k}].basis`);
      });
    };
    if (!str(q.prompt)) E(`${w}.prompt 없음`); else texts.push([`${w}.prompt`, q.prompt, q.ref || null]);
    if (q.type === 'choice') { refOk(q.ref, w + '.ref'); opts(q.options, w + '.options'); }
    if (q.type === 'find') {
      if (Array.isArray(q.refs)) { if (q.refs.length < 2) E(`${w}.refs는 두 곳 이상(한 곳이면 ref)`); q.refs.forEach((r, k) => refOk(r, `${w}.refs[${k}]`)); }
      else refOk(q.ref, w + '.ref');
      if (!q.confirm || !str(q.confirm.prompt)) E(`${w}.confirm.prompt 없음`); else { texts.push([`${w}.confirm.prompt`, q.confirm.prompt, q.ref || (q.refs && q.refs[0]) || null]); opts(q.confirm.options, w + '.confirm.options'); }
    }
    if (q.type === 'order') { refOk(q.ref, w + '.ref'); if (!Array.isArray(q.items) || q.items.length < 3 || q.items.length > 6) E(`${w}.items는 3~6개(본문 순서대로)`); else q.items.forEach((x, k) => texts.push([`${w}.items[${k}]`, x, q.ref])); }
    if (q.type === 'multi') {   /* 여러 개 고르기: 한 절을 찾아 읽고 맞는 것을 모두 */
      refOk(q.ref, w + '.ref');
      const o = q.confirm && q.confirm.options;
      if (!q.confirm || !str(q.confirm.prompt)) E(`${w}.confirm.prompt 없음`); else texts.push([`${w}.confirm.prompt`, q.confirm.prompt, q.ref]);
      if (!Array.isArray(o) || o.length < 4 || o.length > 5) E(`${w}.confirm.options는 4~5개`);
      else {
        const n = o.filter((x) => x.ok === true).length;
        if (n < 2 || n >= o.length) E(`${w}.confirm.options: 맞는 보기는 2개 이상, 모두는 아니게`);
        o.forEach((x, k) => { if (!str(x.label)) E(`${w}.confirm.options[${k}].label 없음`); else texts.push([`${w}.confirm.options[${k}]`, x.label, q.ref]); if (!x.ok && !str(x.basis)) E(`${w}.confirm.options[${k}]: 맞지 않는 보기에는 basis`); if (!x.ok && str(x.basis) && x.basis !== '본문에 없음') refOk(x.basis, `${w}.confirm.options[${k}].basis`); });
      }
    }
    if (q.type === 'match') {   /* 잇기: 떨어진 여러 곳을 찾아 읽고, 구절마다 맞는 내용을 잇는다 */
      if (!Array.isArray(q.refs) || q.refs.length < 2 || q.refs.length > 4) E(`${w}.refs는 2~4곳`); else q.refs.forEach((r, k) => refOk(r, `${w}.refs[${k}]`));
      if (!Array.isArray(q.pairs) || !Array.isArray(q.refs) || q.pairs.length !== q.refs.length) E(`${w}.pairs는 refs와 같은 수({ref, text})`);
      else {
        const seen = new Set();
        q.pairs.forEach((x, k) => { if (!q.refs.includes(x.ref) || seen.has(x.ref)) E(`${w}.pairs[${k}].ref는 refs의 한 곳(겹치지 않게)`); seen.add(x.ref); if (!str(x.text)) E(`${w}.pairs[${k}].text 없음`); else texts.push([`${w}.pairs[${k}].text`, x.text, x.ref]); });
        if (new Set(q.pairs.map((x) => x.text)).size !== q.pairs.length) E(`${w}.pairs의 text가 겹침`);
      }
      if (q.after) texts.push([`${w}.after`, q.after, null]);
    }
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
    if (V3 && Array.isArray(g) && g[1] && g[1].type !== SECOND[t]) E(`gates.${t}[1]: 13.8에 따라 ${SECOND[t]}로 쓴다(지금: ${g[1].type})`);
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
  // 임무(mission): 최현 박사 통신, 재료, 동행 문답, 오늘의 물음 (작성규칙 7절)
  const m = d.mission, tri = (o, w, ref) => ['t1', 't2', 't3'].forEach((t) => { if (!o || !str(o[t])) E(`${w}.${t} 없음`); else texts.push([`${w}.${t}`, o[t], ref || null]); });
  if (!m) { if (NEED_MISSION) E('mission 없음'); }
  else {
    tri(m.call, 'mission.call');
    if (m.companion === undefined) E('mission.companion 없음(동행 인물이 없으면 null)');
    const want = g3 && g3.build ? 3 : 1;
    if (!Array.isArray(m.materials) || m.materials.length !== want) E(`mission.materials는 ${want}개(3D 장면 3개, 그 밖 1개)`);
    else m.materials.forEach((x, i) => {
      ['key', 'name', 'use', 'how', 'line'].forEach((k) => { if (!str(x[k])) E(`mission.materials[${i}].${k} 없음`); else if (k !== 'key') texts.push([`mission.materials[${i}].${k}`, x[k], null]); });
      refOk(x.basis, `mission.materials[${i}].basis`);
    });
    if (m.companion !== null) {
      const cp = m.companion || {};
      if (!str(cp.who)) E('mission.companion.who 없음(동행 인물이 없으면 companion: null)');
      if (cp.when !== 'before' && cp.when !== 'after') E('mission.companion.when은 "before" 또는 "after"(작성규칙 7.1)');
      refOk(cp.ref, 'mission.companion.ref');
      if (!Array.isArray(cp.talks) || cp.talks.length < 2 || cp.talks.length > 3) E('mission.companion.talks는 2~3개');
      else cp.talks.forEach((x, i) => {
        const w = `mission.companion.talks[${i}]`;
        if (!x.ask || !WHO.includes(x.ask.who) || !str(x.ask.text)) E(`${w}.ask: {who, text}`); else texts.push([`${w}.ask`, x.ask.text, null]);
        refOk(x.ref, w + '.ref'); refOk(x.open, w + '.open'); tri(x.answer, w + '.answer', x.ref);
      });
    }
    /* 현장 돕기(규칙서 13.6, 작성규칙 7.2): 본문에 그 사람들이 했다고 적힌 평범한 일만. 거룩한 행위는 watch로 곁에서 본다 */
    if (V2 && !m.help) E('mission.help 없음(규칙서 13.6. 돕는 일이 없으면 watch·stay·ask만으로)');
    if (V3 && m.help && !(m.help.steps || []).some((x) => x.kind === 'do')) E('mission.help.steps에 손으로 하는 돕기(do)가 하나는 있어야 함(규칙서 13.7)');
    if (m.help !== undefined) {
      const h = m.help || {};
      if (!str(h.who)) E('mission.help.who 없음(돕는 상대, 예: "이스라엘 자손의 한 집")');
      if (!Array.isArray(h.steps) || h.steps.length < 2 || h.steps.length > 8) E('mission.help.steps는 2~8개');
      else if (V2 && !h.steps.some((x) => x.kind === 'ask')) E('mission.help.steps에 뜻을 묻는 ask가 하나는 있어야 함');
      if (Array.isArray(h.steps)) h.steps.forEach((x, i) => {
        const w = `mission.help.steps[${i}]`;
        if (!HELP_KINDS.includes(x.kind)) E(`${w}.kind는 ${HELP_KINDS.join(', ')}`);
        if (!(x.after === 'gates' || (Number.isInteger(x.after) && x.after >= 0 && x.after < (d.beats || []).length))) E(`${w}.after는 대목 번호 또는 "gates"`);
        if (!str(x.title)) E(`${w}.title 없음`); else texts.push([`${w}.title`, x.title, null]);
        refOk(x.basis, w + '.basis');
        if (x.kind !== 'ask') tri(x.text, w + '.text', x.basis);
        if (x.kind === 'do') {
          if (!Array.isArray(x.tasks) || x.tasks.length < 2 || x.tasks.length > 4) E(`${w}.tasks는 2~4개(누르는 일)`); else x.tasks.forEach((t, k) => { if (!str(t)) E(`${w}.tasks[${k}] 없음`); });
          if (!x.done || !WHO.includes(x.done.who) || !str(x.done.text)) E(`${w}.done: {who, text}`); else texts.push([`${w}.done`, x.done.text, x.basis]);
        }
        if (x.kind === 'stay' && !str(x.wait)) E(`${w}.wait 없음(기다리기 버튼 글)`);
        if (x.say) { if (!WHO.includes(x.say.who) || !str(x.say.text)) E(`${w}.say: {who, text}`); else texts.push([`${w}.say`, x.say.text, x.basis]); }
        if (x.kind === 'ask' && !str(x.by)) E(`${w}.by 없음(답하는 사람. 본문에 말할 사람이 없으면 "최현 박사")`);
        if (x.kind === 'ask') {
          if (!x.ask || !WHO.includes(x.ask.who) || !str(x.ask.text)) E(`${w}.ask: {who, text}`); else texts.push([`${w}.ask`, x.ask.text, null]);
          tri(x.answer, w + '.answer', x.basis);
          ['t1', 't2', 't3'].forEach((t) => question(x.read && x.read[t], `${w}.read.${t}`, t));
          /* 신약 장절은 이 검사기(구약 본문)로 확인하지 않는다. 작성자가 확인하고 감수 전으로 둔다(규칙서 13.6) */
          if (x.nt) { if (!/^\S+ \d+:\d+(-\d+)?$/.test(String(x.nt.ref || ''))) E(`${w}.nt.ref는 "책 장:절"`); if (!(d.review && d.review.required && d.review.topics.some((t) => t.includes('신약')))) E(`${w}.nt: 신약 연결이 있으면 review.required true, topics에 "구약 사건의 신약적 의미"(규칙서 3.5)`); if (!str(x.nt.text)) E(`${w}.nt.text 없음`); else texts.push([`${w}.nt.text`, x.nt.text, null]); }
        }
      });
    }
    if (!Array.isArray(m.today) || m.today.length < 1 || m.today.length > 2) E('mission.today는 1~2개');
    else m.today.forEach((x, i) => {
      const w = `mission.today[${i}]`;
      if (!str(x.q)) E(`${w}.q 없음`); else texts.push([`${w}.q`, x.q, null]); tri(x.a, w + '.a');
      if (!Array.isArray(x.refs) || !x.refs.length) E(`${w}.refs 없음(근거 장절)`); else x.refs.forEach((r) => refOk(r, w + '.refs'));
    });
  }
  // 금지어, 본문과 지나치게 같은 문장
  const beatRefs = (d.beats || []).map((b) => b.ref).filter((r) => r && R.parse(r));
  texts.forEach(([w, t, ref]) => {
    BAN.forEach((b) => { if (String(t).includes(b)) E(`${w}: 쓰지 않는 표현 "${b}" (규칙서 4.2)`); });
    if (hasRef && ref && R.parse(ref)) {
      const v = R.verses(ref); if (!v) return;
      const a = norm(t), n = Math.max(...v.list.map((x) => lcs(a, norm(x.krv))));
      if (n >= 16) W(`${w}: 본문 문장과 ${n}글자가 그대로 같음. 자기 말로 풀어 쓴다 (${ref})`);
    }
    /* 현장 돕기의 글은 근거 장절만이 아니라 장면의 대목 본문 전체와도 견준다(독립 대조 지적, 2026-11-15) */
    if (hasRef && /^mission\.help/.test(w)) {
      let best = 0, br = '';
      const a = norm(t);
      beatRefs.forEach((r) => { const v = R.verses(r); if (v) v.list.forEach((x) => { const n = lcs(a, norm(x.krv)); if (n > best) { best = n; br = r; } }); });
      if (best >= 16 && br !== ref) W(`${w}: 장면 본문과 ${best}글자가 그대로 같음. 자기 말로 풀어 쓴다 (${br})`);
    }
  });  if (V4) exposure(d, E);
}

/* ── --v4: 성경을 읽어야 답이 나오는 물음(규칙서 13.9, 대표 결정 2026-11-16) ──
 * 물음의 답이 그 나이 단계에서 물음 앞에 보이는 글(대목·돕기·동행 문답·통신·재료·탐지기 글)에 먼저 나오면 오류.
 * 이름만 겹치고 답(관계)은 성경에서만 알 수 있으면 그 물음에 "inStory": "이유"를 적는다(독립 대조가 확인). */
const JOSA2 = /(에서|으로|에게|께서|이다|였다|했다|었다|았다|하여|해서|이라고|라고|처럼|까지|부터|이에요|예요|했어요|였어요)$/;
const JOSA1 = /[을를은는이가에와과의도만로]$/;
function toks(label) {
  return String(label).split(/[\s,·()\[\]"'“”‘’.!?~\-]+/).map((w) => {
    let x = w.replace(JOSA2, ''); if (x.length >= 3) x = x.replace(JOSA1, ''); return x;
  }).filter((x) => x.length >= 2 || /\d/.test(x));
}
const STOP = new Set(['하나님', '하나님이', '여호와', '여호와께서', '이스라엘', '사람', '사람들', '백성', '모두', '그리고', '그는', '그가', '그들', '그들이', '자기', '했다', '하셨다', '말했다', '하였다', '있었다', '때문에', '위해', '하려고', '것을', '것이', '그것', '모든', '함께', '다시', '이미']);
function seen(label, story, prompt) {          // 보기의 낱말(물음에 이미 있는 낱말·흔한 낱말 빼고)이 이야기 글에 얼마나 있나
  const pt = new Set(toks(prompt || ''));
  const t = toks(label).filter((x) => !STOP.has(x) && !pt.has(x)); if (!t.length) return null;
  const hit = t.filter((x) => story.includes(x));
  const need = t.length <= 2 ? t.length : Math.ceil(t.length * 0.7);
  return hit.length >= need ? hit : null;
}
function exposure(d, E) {
  const m = d.mission || {}, TIERS = ['t1', 't2', 't3'], AGE = { t1: '8~10세', t2: '11~13세', t3: '14~19세' };
  const T = (o, t) => (o && typeof o === 'object' ? (o[t] || '') : (o || ''));
  TIERS.forEach((t) => {
    const parts = [];   // [where, text]
    const P = (w, x) => { if (x) parts.push([w, String(x)]); };
    P('mission.call.' + t, T(m.call, t));
    ((m.companion || {}).talks || []).forEach((k, i) => { P(`companion.talks[${i}].ask`, k.ask && k.ask.text); P(`companion.talks[${i}].answer.${t}`, T(k.answer, t)); });
    (d.beats || []).forEach((b, i) => { P(`beats[${i}].text.${t}`, T(b.text, t)); P(`beats[${i}].say`, b.say && b.say.text); });
    ((m.help || {}).steps || []).forEach((h, i) => {
      const w = `help.steps[${i}]`;
      P(w + '.title', h.title); P(w + '.text.' + t, T(h.text, t)); (h.tasks || []).forEach((x, j) => P(`${w}.tasks[${j}]`, x));
      P(w + '.done', h.done && h.done.text); P(w + '.say', h.say && h.say.text); P(w + '.ask', h.ask && h.ask.text);
      parts.push([w + '.answer.' + t, T(h.answer, t), i]); if (t === 't3' && h.nt) P(w + '.nt', h.nt.text);
    });
    (d.quests || []).forEach((q, i) => { P(`quests[${i}].line`, q.line); P(`quests[${i}].found`, q.found); P(`quests[${i}].say`, q.say && q.say.text); });
    (m.materials || []).forEach((x, i) => { ['name', 'how', 'line', 'use'].forEach((k) => P(`materials[${i}].${k}`, x[k])); });
    const qs = [];
    ((d.gates || {})[t] || []).forEach((q, i) => qs.push([`gates.${t}[${i}]`, q, -1]));
    (d.quests || []).forEach((x, i) => { if (x.q && x.q[t]) qs.push([`quests[${i}].q.${t}`, x.q[t], -1]); });
    ((m.help || {}).steps || []).forEach((h, i) => { if (h.read && h.read[t]) qs.push([`help.steps[${i}].read.${t}`, h.read[t], i]); });
    qs.forEach(([w, q, own]) => {
      if (q.inStory) return;
      const story = parts.filter((p) => p[2] === undefined || p[2] !== own);
      const all = norm(story.map((p) => p[1]).join(' '));
      const where = (tok) => { const f = story.find((p) => norm(p[1]).includes(tok)); return f ? f[0] : '?'; };
      if (q.confirm && Array.isArray(q.confirm.options)) {
        q.confirm.options.filter((o) => o.ok).forEach((o) => {
          const h = seen(o.label, all, q.confirm.prompt);
          if (h) E(`${w}: 답 "${o.label}"이(가) ${AGE[t]} 이야기 글에 먼저 나옴(${h.map((x) => x + '@' + where(x)).join(', ')}). 이야기에서 가리거나, 이름만 겹치면 "inStory"에 이유(규칙서 13.9)`);
        });
      }
      if (q.type === 'order' && Array.isArray(q.items)) {
        // 이야기 글이 같은 차례를 그대로 말하는가: 항목마다 가장 먼저 크게 겹치는 글의 자리
        const flat = story.map((p) => norm(p[1])), pos = q.items.map((it) => { const tk = toks(it); let best = -1, bi = -1; flat.forEach((f, k) => { const n = tk.filter((x) => f.includes(x)).length / (tk.length || 1); if (n > best) { best = n; bi = k; } }); return best >= 0.6 ? bi : -1; });
        const found = pos.filter((x) => x >= 0).length, inc = pos.every((x, k) => x < 0 || k === 0 || pos[k - 1] < 0 || x >= pos[k - 1]);
        if (found >= q.items.length - 1 && inc) E(`${w}: 순서 맞추기의 항목이 ${AGE[t]} 이야기 글에 같은 차례로 다 나옴. 더 잘게 묻거나 이야기 글을 줄인다(규칙서 13.9). 아니면 "inStory"에 이유`);
      }
      if (q.type === 'match' && Array.isArray(q.pairs)) {
        q.pairs.forEach((pr) => { const cv = (String(pr.ref).match(/(\d+:\d+)$/) || [])[1]; if (cv && story.some((p) => p[1].includes('(' + cv + ')') || p[1].includes(cv + ')'))) E(`${w}: 잇기의 구절 ${pr.ref}이(가) ${AGE[t]} 이야기 글에 장절과 함께 나옴. 이야기 글에서 그 장절 표시를 뺀다(규칙서 13.9)`); });
      }
    });
  });
}

const NEED_MISSION = process.argv.includes('--mission') || process.argv.includes('--v2') || process.argv.includes('--v3') || process.argv.includes('--v4');
const V4 = process.argv.includes('--v4');
const V3 = process.argv.includes('--v3') || V4;
const V2 = process.argv.includes('--v2') || V3;
const want = process.argv.slice(2).filter((x) => !x.startsWith('--'));
const files = fs.readdirSync(DIR).filter((f) => /^OT-\d\d\.json$/.test(f) && (!want.length || want.includes(f.replace('.json', '')))).sort();
if (!hasRef) console.log('주의: ref/bible 이 없어 장절이 실제로 있는지는 검사하지 못함 (tools/bible_ref/fetch.sh)');
files.forEach((f) => check(path.join(DIR, f)));
console.log(`검사 ${files.length}개 장면: 오류 ${nerr}, 경고 ${nwarn}`);
process.exit(nerr ? 1 : 0);
