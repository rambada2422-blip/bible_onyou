#!/usr/bin/env node
/* 감수 목록(규칙서 13.11): 감수가 필요한 곳을 세 단계(★ 가벼움 · ★★ 중요 · ★★★ 필수)로 모아 docs/19_감수목록.md를 만든다.
 * 실행: node tools/review_list.js
 * - 줄기 자료(content/ot/threads/*.json)는 자료에 적힌 rv·why를 그대로 쓴다.
 * - 장면 자료(content/ot/OT-NN.json)는 고치지 않고 아래 규칙으로 단계를 매긴다(장면 자료에 rv가 생기면 그것을 먼저 쓴다).
 * 목록은 "잡아 갈 곳"의 색인이다. 감수 상태를 바꾸지 않는다(모든 장면은 미감수). */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), DIR = path.join(root, 'content', 'ot');
const STAR = ['', '★', '★★', '★★★'];
const rows = [];
const cut = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > (n || 46) ? s.slice(0, (n || 46)) + '…' : s; };
const tx = (v) => (typeof v === 'string' ? v : v ? (v.t1 || v.t2 || v.t3 || '') : '');
const add = (lv, where, what, text, why) => rows.push({ lv, where, what, text: cut(text), why: cut(why, 70) });

/* 8~10세의 죽음 표현을 손본 장면(규칙서 13.9, 진행표 대표 결정 4차) */
const CALLED = ['OT-16', 'OT-22', 'OT-23'], OMIT = ['OT-03', 'OT-10', 'OT-14', 'OT-15', 'OT-19', 'OT-22', 'OT-38'];

fs.readdirSync(DIR).filter((f) => /^OT-\d\d\.json$/.test(f)).sort().forEach((f) => {
  const d = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')), id = d.id, m = d.mission || {};
  if (d.review && d.review.required) add(3, id, '장면 전체', d.title, '감수 필수 주제: ' + (d.review.topics || []).join(', '));
  (m.today || []).forEach((t, i) => add(3, id, '오늘의 물음 ' + (i + 1), t.q, '오늘의 물음은 모두 감수 필수(13.4). 박사의 답과 근거 장절'));
  ((m.help || {}).steps || []).forEach((h, i) => {
    if (h.kind === 'ask') { if (h.nt) add(3, id, '뜻 묻기 · 신약과 이어 읽기', h.nt.text, '구약 사건의 신약적 의미(3.5). ' + h.nt.ref); add(2, id, '뜻 묻기 ' + (i + 1), h.title, '본문에 기록된 말로만 답하는지(13.6)'); }
    else if (h.kind === 'do') add(2, id, '손으로 하는 돕기 ' + (i + 1), h.title, '사건 곁의 평범한 일인지, 본문의 무리와 닿는 창작(13.6·13.7). 근거 ' + (h.basis || ''));
    else add(1, id, (h.kind === 'watch' ? '곁에서 보기 ' : '함께 머물기 ') + (i + 1), h.title, '탐험대 이야기의 표현');
  });
  if (m.companion) add(2, id, '동행 문답 ' + m.companion.talks.length + '개 · ' + m.companion.who, tx(m.companion.talks[0].answer), '동행 인물이 성경에 기록된 자기 말만 하는지(13.3)');
  const opens = (d.beats || []).filter((b) => b.open);
  if (opens.length) add(2, id, '하나님의 말씀을 풀어 옮긴 대목 ' + opens.length + '곳', opens.map((b) => b.open).join(', '), '말씀을 간접으로 옮긴 글이 본문과 맞는지');
  if (CALLED.indexOf(id) >= 0) add(2, id, '8~10세 글: 사람의 죽음', '"하나님이 부르셨어요"', '8~10세에게 맞춘 표현(13.9)');
  if (OMIT.indexOf(id) >= 0) add(2, id, '8~10세 글: 심판의 죽음', '죽음이라는 말을 뺌', '8~10세에게 맞춘 표현(13.9)');
  const c = d.close || {};
  if (c.t3) add(3, id, '마무리 · 14~19세 기록', c.t3.prompt, '삶의 적용(3.5)');
  if (c.t1) add(2, id, '마무리 · 8~10세 기도', c.t1.text, '기도문의 표현');
  if (c.t2) add(1, id, '마무리 · 11~13세 실천', c.t2.text, '실천 문구의 표현');
  (m.materials || []).forEach((x) => add(1, id, '재료 · ' + x.name, x.use, '떨어진 것만 줍는지(13.2), 쓰임은 탐험대의 가상 기술. 근거 ' + (x.basis || '')));
});

/* 줄기 자료: rv가 적힌 곳을 모두 */
const TD = path.join(DIR, 'threads');
if (fs.existsSync(TD)) fs.readdirSync(TD).filter((f) => f.endsWith('.json')).sort().forEach((f) => {
  const t = JSON.parse(fs.readFileSync(path.join(TD, f), 'utf8'));
  const walk = (o, where, inherit) => {
    if (Array.isArray(o)) { o.forEach((x, i) => walk(x, where + '[' + (i + 1) + ']', inherit)); return; }
    if (!o || typeof o !== 'object') return;
    const text = o.text || o.q || o.title || o.shadow || o.part || o.done || (o.find && o.find.confirm && o.find.confirm.prompt) || '';
    if (o.rv) add(o.rv, '줄기 · ' + f.replace('.json', ''), where + (o.ref ? ' (' + o.ref + ')' : ''), text, o.why || o.why2 || '');
    else if (inherit && (o.ref || o.text) && where.indexOf('list') >= 0) add(inherit.rv, '줄기 · ' + f.replace('.json', ''), where + (o.ref ? ' (' + o.ref + ')' : ''), text, o.why || inherit.why);
    const next = o.rv ? { rv: o.rv, why: o.why || o.why2 || '' } : inherit;
    Object.keys(o).forEach((k) => { if (k[0] !== '_' && typeof o[k] === 'object') walk(o[k], where ? where + '.' + k : k, /^(list|nt)$/.test(k) ? next : (o.rv ? null : inherit)); });
  };
  walk(t, '', null);
});

const n = [0, 0, 0, 0]; rows.forEach((r) => n[r.lv]++);
const out = [];
out.push('# 감수 목록 (감수 태그 ★ 가벼움 · ★★ 중요 · ★★★ 필수)', '');
out.push('- 만든 도구: `node tools/review_list.js` (이 파일은 도구가 만든다. 직접 고치지 말고, 자료를 고친 뒤 다시 만든다)');
out.push('- 기준: 규칙서 13.11(대표 결정 2026-11-17). 감수를 기다리지 않고 만들기를 진행하고, 감수가 필요한 곳에 태그를 붙여 뒤에 차례로 잡는다.');
out.push('- 모든 장면의 감수 상태는 **미감수**다. 이 목록은 잡아 갈 곳의 색인이며, 잡은 곳은 "확인" 칸에 표시해 나간다.');
out.push('- 줄기 자료(`content/ot/threads/`)의 태그는 자료에 적힌 `rv`·`why` 그대로이고, 장면 자료(40장면)의 태그는 도구의 규칙으로 매겼다.', '');
out.push('| 단계 | 뜻 | 곳 수 |', '|---|---|---|');
out.push('| ★★★ 필수 | 3.5의 주제(주권과 책임, 재앙과 심판, 구약 사건의 신약적 의미, 삶의 적용), 그리스도와의 연결, 유월절과 제사, 오늘의 물음 | ' + n[3] + ' |');
out.push('| ★★ 중요 | 유추, 본문에 없는 것을 성경 장면 곁에 둔 것, 8~10세 표현, 돕기·동행, 하나님의 말씀을 풀어 옮긴 곳, 새 성경 물음 | ' + n[2] + ' |');
out.push('| ★ 가벼움 | 표현·말투, 탐험대 이야기의 설정, 일반 사실의 확인 | ' + n[1] + ' |');
out.push('| 합계 | | ' + rows.length + ' |', '');
[3, 2, 1].forEach((lv) => {
  out.push('## ' + STAR[lv] + ' ' + ['', '가벼움', '중요', '필수'][lv] + ' (' + n[lv] + '곳)', '', '| 확인 | 곳 | 무엇 | 글(앞부분) | 까닭 |', '|---|---|---|---|---|');
  rows.filter((r) => r.lv === lv).forEach((r) => out.push('| ☐ | ' + r.where + ' | ' + r.what.replace(/\|/g, '/') + ' | ' + r.text.replace(/\|/g, '/') + ' | ' + r.why.replace(/\|/g, '/') + ' |'));
  out.push('');
});
fs.writeFileSync(path.join(root, 'docs', '19_감수목록.md'), out.join('\n'));
console.log('docs/19_감수목록.md · ★★★ ' + n[3] + ' · ★★ ' + n[2] + ' · ★ ' + n[1] + ' · 합계 ' + rows.length);
