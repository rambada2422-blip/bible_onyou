// 휴대폰 화면 전수 점검(play 갈래): 폭 320·360·390·430 × 세 나이 단계로 이야기 카드 40장면의 모든 화면을 지나가며
// 옆으로 넘침, 화면 밖으로 나간 것, 잘린 글, 누르기 어려운 단추(44px 미만), 스크롤해야 끝까지 보이는 시트를 모아 표로 낸다.
// 사용: node tools/test/phoneAudit.js <저장 폴더> [폭들 "320,360,390,430"] [단계들 "0,1,2"] [첫 장면] [마지막 장면]
// 결과: <저장 폴더>/summary.md 와 폭·단계별 audit.json. walkOT.js를 BO_AUDIT=1로 부른다(한 번에 하나씩).
const { spawnSync } = require('child_process');
const fs = require('fs'), path = require('path');
const out = process.argv[2] || '/tmp/phoneAudit';
const SIZES = { 320: 568, 360: 640, 390: 844, 430: 932 };
const widths = (process.argv[3] || '320,360,390,430').split(',').map(Number), tiers = (process.argv[4] || '0,1,2').split(',').map(Number);
const from = process.argv[5] || '1', to = process.argv[6] || '40';
fs.mkdirSync(out, { recursive: true });
const rows = [], kindOf = (w) => { const m = / (arrive|talk|beat|help|gate|quest|mat|today|finish) /.exec(w + ' '); return m ? m[1] : w.replace(/OT-\d\d /, ''); };
const tally = {}, bump = (k, ex) => { const o = tally[k] || (tally[k] = { n: 0, ex: [] }); o.n++; if (o.ex.length < 4 && !o.ex.includes(ex)) o.ex.push(ex); };
let fails = 0;
for (const w of widths) for (const t of tiers) {
  const dir = path.join(out, w + '-t' + (t + 1));
  const r = spawnSync('node', [path.join(__dirname, 'walkOT.js'), String(t), dir, from, to], { env: Object.assign({}, process.env, { BO_W: String(w), BO_H: String(SIZES[w] || 844), BO_AUDIT: '1' }), encoding: 'utf8', maxBuffer: 1 << 26 });
  const tail = (r.stdout || '').trim().split('\n').slice(-3).join(' / ');
  if (r.status !== 0) fails++;
  let a = { items: [] }; try { a = JSON.parse(fs.readFileSync(path.join(dir, 'audit.json'), 'utf8')); } catch (e) { /* 중간에 멈춤 */ }
  const cnt = { small: 0, clip: 0, out: 0, footOver: 0, scroll: 0, scrollMax: 0, screens: a.items.length }, byKind = {};
  for (const it of a.items) {
    const k = kindOf(it.where), tag = w + ' t' + (t + 1);
    it.small.forEach((x) => { cnt.small++; bump('작은 단추 · ' + x.split('|').slice(0, 2).join(' ') + ' · ' + x.split('|')[2], tag + ' ' + it.where); });
    it.clip.forEach((x) => { cnt.clip++; bump('잘린 글 · ' + x.split('|')[0], tag + ' ' + it.where + ' "' + x.split('|')[1] + '"'); });
    it.out.forEach((x) => { cnt.out++; bump('화면 밖 · ' + x, tag + ' ' + it.where); });
    it.footOver.forEach((x) => { cnt.footOver++; bump('아래 단추 글이 세 줄 이상 · ' + x, tag + ' ' + it.where); });
    if (it.scroll > 4) { cnt.scroll++; cnt.scrollMax = Math.max(cnt.scrollMax, it.scroll); const o = byKind[k] || (byKind[k] = { n: 0, max: 0, at: '' }); o.n++; if (it.scroll > o.max) { o.max = it.scroll; o.at = it.where + ' (시트 ' + it.bodyH + 'px, 글 ' + it.full + 'px)'; } }
  }
  rows.push({ w, h: SIZES[w], t: t + 1, status: r.status, tail, cnt, byKind });
  console.log(w + '×' + SIZES[w], 't' + (t + 1), '· 종료', r.status, '· 화면', cnt.screens, '· 작은 단추', cnt.small, '· 잘린 글', cnt.clip, '· 화면 밖', cnt.out, '· 스크롤 시트', cnt.scroll, '(최대 ' + cnt.scrollMax + 'px)');
}
const md = ['# 휴대폰 화면 전수 점검 결과', '', '장면 ' + from + '~' + to + ' · 이야기 카드의 모든 화면. 화면 크기: ' + widths.map((w) => w + '×' + SIZES[w]).join(', '), '',
  '| 화면 | 나이 | 걷기 시험 | 화면 수 | 작은 단추 | 잘린 글 | 화면 밖 | 아래 단추 넘침 | 스크롤해야 하는 시트 | 가장 긴 스크롤 |', '|---|---|---|---|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.w}×${r.h} | t${r.t} | ${r.status === 0 ? '통과' : '문제 있음: ' + r.tail} | ${r.cnt.screens} | ${r.cnt.small} | ${r.cnt.clip} | ${r.cnt.out} | ${r.cnt.footOver} | ${r.cnt.scroll} | ${r.cnt.scrollMax}px |`), '',
  '## 스크롤해야 끝까지 보이는 시트(화면 종류별)', '', '| 화면 | 나이 | 종류 | 수 | 가장 긴 곳 |', '|---|---|---|---|---|',
  ...rows.flatMap((r) => Object.keys(r.byKind).map((k) => `| ${r.w} | t${r.t} | ${k} | ${r.byKind[k].n} | ${r.byKind[k].max}px · ${r.byKind[k].at} |`)), '',
  '## 지적 종류별(수, 본보기)', '', ...Object.keys(tally).sort((a, b) => tally[b].n - tally[a].n).map((k) => `- ${k}: ${tally[k].n}곳 — ${tally[k].ex.join(' ; ')}`), ''];
fs.writeFileSync(path.join(out, 'summary.md'), md.join('\n'));
console.log('요약:', path.join(out, 'summary.md'), '· 걷기 시험 문제', fails);
process.exit(fails ? 1 : 0);
