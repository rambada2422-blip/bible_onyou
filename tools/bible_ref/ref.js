// 장절 표기를 읽고 검증용 본문에서 절을 꺼낸다. 표기: "창 1:1", "창 1:1-5", "창 1:1-2:3", "출 3" (장 전체)
const fs = require('fs'), path = require('path');
const BOOKS = require('./books.js');
const DIR = path.join(__dirname, '..', '..', 'ref', 'bible');
const idx = {}; BOOKS.forEach((b, i) => { idx[b[0]] = i; });
let KJV = null;
function parse(ref) {
  const m = /^(\S+) (\d+)(?::(\d+))?(?:-(?:(\d+):)?(\d+))?$/.exec(String(ref).trim());
  if (!m || !(m[1] in idx)) return null;
  const b = idx[m[1]], c1 = +m[2], v1 = m[3] ? +m[3] : 1;
  let c2 = c1, v2 = m[3] ? v1 : 999;
  if (m[5]) { if (m[4]) { c2 = +m[4]; v2 = +m[5]; } else if (m[3]) { v2 = +m[5]; } else { c2 = +m[5]; v2 = 999; } }
  if (c1 < 1 || c2 > BOOKS[b][2] || c2 < c1 || (c1 === c2 && v2 < v1)) return null;
  return { book: b, c1, v1, c2, v2 };
}
function krvChapter(b, c) {
  const f = path.join(DIR, 'krv', `krv.${b + 1}.${c}.txt`);
  if (!fs.existsSync(f)) return null;
  const out = {};
  fs.readFileSync(f, 'utf8').split('\n').forEach((l) => { const m = /^(\d+)\s+(.*)$/.exec(l.trim()); if (m) out[+m[1]] = m[2]; });
  return out;
}
function kjvChapter(b, c) {
  if (!KJV) { const f = path.join(DIR, 'en_kjv.json'); if (!fs.existsSync(f)) return null; KJV = JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, '')); }
  const ch = KJV[b] && KJV[b].chapters[c - 1]; if (!ch) return null;
  const out = {}; ch.forEach((t, i) => { out[i + 1] = t; }); return out;
}
// 범위 안의 절: [{c, v, krv, kjv}]. 본문이 없으면 null. 범위가 실제 절을 벗어나면 bad=true
function verses(ref) {
  const r = parse(ref); if (!r) return null;
  const out = []; let bad = false;
  for (let c = r.c1; c <= r.c2; c++) {
    const k = krvChapter(r.book, c), e = kjvChapter(r.book, c); if (!k) return null;
    const max = Math.max(...Object.keys(k).map(Number));
    const a = c === r.c1 ? r.v1 : 1, z = c === r.c2 ? Math.min(r.v2, max) : max;
    if (a > max || (c === r.c2 && r.v2 !== 999 && r.v2 > max)) bad = true;
    for (let v = a; v <= z; v++) out.push({ c, v, krv: k[v] || '', kjv: (e && e[v]) || '' });
  }
  return { list: out, bad, book: BOOKS[r.book] };
}
module.exports = { parse, verses, BOOKS };
if (require.main === module) {
  const ref = process.argv.slice(2).join(' ');
  const r = verses(ref);
  if (!r) { console.error('읽을 수 없는 장절이거나 본문이 없음(tools/bible_ref/fetch.sh를 먼저 실행):', ref); process.exit(1); }
  if (r.bad) console.error('주의: 범위가 실제 절 수를 벗어남');
  r.list.forEach((x) => console.log(`${r.book[0]} ${x.c}:${x.v}\n  [개역한글] ${x.krv}\n  [KJV] ${x.kjv}`));
}
