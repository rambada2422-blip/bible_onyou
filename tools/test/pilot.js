// 시범 에피소드 걷기(2026-11-17): 도입 → 지도 → 아지트(설계도 1: 성경에서 찾기) → OT-03 이야기 카드 → 온실에 잔가지 꽂기
//   → 설계도 2 → OT-09 이야기 카드(날아간 양털) → 작업대(실·끈·구동 줄·매듭 줄) → 재 보기 → 온실의 새 잎 → 일지.
// 사용: node tools/test/pilot.js <단계 0~2> <저장 폴더>
// 확인: 화면마다 옆으로 넘침·쓰지 않는 표현, 저장(bo3d.world.v1)이 새로고침 뒤에도 남는지, 진행 자료(bo3d.ot.v1)의 형식이 그대로인지.
const { chromium, previewURL } = require('./lib/runtime.js');
const doHelp = require('./lib/help.js');
const doWind = require('./lib/wind.js');
const path = require('path'), fs = require('fs');
const ti = Number(process.argv[2] || '0'), out = process.argv[3] || '/tmp/pilot';
fs.mkdirSync(out, { recursive: true });
const BAN = ['틀렸', '실패', '감점', '목숨'];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: process.env.PILOT_MOTION ? 'no-preference' : 'reduce' });
  const p = await ctx.newPage();
  if (!process.env.PILOT_SLOW) await p.addInitScript(() => { window.BO3D_TEST = true; });
  const errs = [], probs = []; let n = 0;
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  const shot = async (l) => { n++; await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '-' + l + '.png') }); };
  const st = () => p.evaluate(() => BO3D.story.debug.state());
  const ds = () => p.evaluate(() => BO3D.den.debug.state());
  const need = (c, what) => { if (!c) probs.push(what); };
  const check = async (where) => {
    const r = await p.evaluate(() => {
      const box = [...document.querySelectorAll('.ot3')].find((x) => !x.hidden); if (!box) return { hidden: true };
      const over = [...box.querySelectorAll('.sheet-body, .sheet-foot, .otmap, .dk-panel')].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.className);
      return { over, text: box.innerText };
    });
    if (r.hidden) { probs.push(where + ': 화면이 보이지 않음'); return; }
    if (r.over.length) probs.push(where + ': 옆으로 넘침 ' + r.over.join(','));
    BAN.forEach((w) => { if (r.text.includes(w)) probs.push(where + ': 쓰지 않는 표현 "' + w + '"'); });
  };
  const next = async () => { await p.click('.ot3:not([hidden]) .sheet-foot .btn >> nth=-1', { timeout: 8000 }); await p.waitForTimeout(80); };
  // 물음 풀기: sel 안의 찾아 읽기/고르기/여러 개/차례/잇기/장절 적기(맞는 답만)
  const solveIn = async (q, sel) => p.evaluate(async ({ q, sel }) => {
    const sheet = document.querySelector(sel), wait = () => new Promise((r) => setTimeout(r, 40));
    const opts = () => [...sheet.querySelectorAll('.opt')];
    const pick = async (label) => { const o = opts().find((x) => !x.disabled && x.textContent.trim().endsWith(label.trim())); if (!o) return false; o.click(); await wait(); return true; };
    const rb = [...sheet.querySelectorAll('.btn')].find((x) => x.textContent === '찾아서 읽었어요'); if (rb) { rb.click(); await wait(); }
    if (q.type === 'choice') return pick(q.options.find((o) => o.ok).label);
    if (q.type === 'find') return pick(q.confirm.options.find((o) => o.ok).label);
    if (q.type === 'multi') { for (const it of q.confirm.options) { const e = opts().find((x) => x.textContent.trim().endsWith(it.label.trim())); if (e && (e.getAttribute('aria-pressed') === 'true') !== !!it.ok) { e.click(); await wait(); } } [...sheet.querySelectorAll('.btn')].find((x) => x.textContent === '다 골랐어요').click(); await wait(); return true; }
    if (q.type === 'order') { let ok = false; for (const it of q.items) ok = await pick(it); return ok; }
    if (q.type === 'match') { for (const pr of q.pairs) { [...sheet.querySelectorAll('.match3 .mref')].find((x) => x.textContent.trim().endsWith(pr.ref)).click(); await wait(); [...sheet.querySelectorAll('.match3 .mtext')].find((x) => x.textContent.trim() === pr.text.trim()).click(); await wait(); } return true; }
    if (q.type === 'findref') { const ins = sheet.querySelectorAll('.refin input'), cv = q.accept[0].split(':'); ins[0].value = cv[0]; ins[1].value = cv[1]; sheet.querySelector('.refin .btn').click(); await wait(); return true; }
    return false;
  }, { q, sel });
  const wind = () => doWind(p);
  // 이야기 카드 한 장면을 끝까지
  const playScene = async (id) => {
    let winds = 0, guard = 0, sawInst = false;
    while (guard++ < 70) {
      const s = await st();
      if (s.k === 'gate' || s.k === 'quest') {
        const q = await p.evaluate(() => BO3D.story.debug.q());
        need(await solveIn(q, '.ot3:not([hidden]) .sheet-body'), id + ' ' + s.k + ': 물음을 풀지 못함');
        const w = await wind(); if (w) { winds++; need(w.missed && w.card, id + ': 날아간 양털 놀이가 끝나지 않음 ' + JSON.stringify(w)); await shot(id + '-wind-done'); }
      }
      if (s.k === 'mat') {
        await p.evaluate(async () => { const k = BO3D.story.debug.seek(); if (k === null) return; document.querySelectorAll('.ot3:not([hidden]) .seek-t')[k].click(); await new Promise((r) => setTimeout(r, 40)); });
        const w = await wind(); if (w) { winds++; need(w.card, id + ': 날아간 양털 뒤에 재료 카드가 없음'); }
      }
      if (s.k === 'quest' || s.k === 'mat') { if (await p.evaluate(() => !!document.querySelector('.ot3:not([hidden]) .inst3'))) sawInst = true; }
      if (s.k === 'help') await doHelp(p);
      await check(id + ' ' + s.k + ' ' + (s.step + 1));
      if (s.k === 'finish') break;
      await next();
    }
    need(sawInst, id + ': 재료를 얻었을 때 "덜컹이에 끼웠어요"가 보이지 않음');
    return { winds };
  };

  await p.goto(previewURL); await p.waitForTimeout(2500);
  await p.evaluate(() => document.fonts.ready);
  await p.click('.tier >> nth=' + ti); await p.click('text=탐험 시작'); await p.waitForTimeout(300);
  // 1. 도입 장면
  let ic = 0; const arts = [];
  while ((await st()).screen === 'intro' && ic++ < 12) { arts.push(await p.evaluate(() => { const s = document.querySelector('.in-stage'); return s ? s.className : null; })); if (ic <= 4) await shot('intro' + ic); await check('도입 ' + ic); await next(); }
  need(arts.length === 6 && arts.every((a) => a) && /a-shake/.test(arts[1]) && /a-dark/.test(arts[2]) && /a-land/.test(arts[3]), '도입 장면 6컷(날기·흔들림·불 꺼짐·착륙)이 아님: ' + arts.join(' | '));
  // 2. 지도: 아지트 입구에 소식
  need((await st()).screen === 'map', '도입 뒤에 지도가 열리지 않음');
  need(await p.evaluate(() => !!document.querySelector('.denent.news')), '지도에 아지트 소식(설계도 첫 장)이 없음');
  await shot('map-news'); await check('지도');
  // 3. 아지트 조종 칸: 설계도 1을 성경에서 찾기
  await p.click('.denent'); await p.waitForTimeout(150);
  let d = await ds(); need(d.open && d.room === 'cockpit' && !d.twig, '아지트 조종 칸이 열리지 않음');
  need(await p.evaluate(() => document.querySelectorAll('.dk-cut .rm.shut').length === 2), '닫힌 문이 둘이 아님');
  await p.click('.dk-cut .rm[data-room="green"]'); await p.waitForTimeout(80);
  need(await p.evaluate(() => /잠겨/.test(document.querySelector('.dk-msg').textContent)), '닫힌 문을 눌렀을 때 안내가 없음');
  await shot('den-cockpit'); await check('아지트 조종 칸');
  need(await solveIn(await p.evaluate(() => BO3D.den.debug.q('oil')), '.den4 [data-bp="oil"]'), '설계도 1의 성경 물음을 풀지 못함');
  d = await ds(); need(d.bp.oil === 1 && d.marks.join() === 'OT-03', '설계도 1을 푼 뒤 지도 표시가 OT-03이 아님: ' + d.marks.join());
  await shot('den-bp1-found'); await check('설계도 1');
  await p.click('.den4 .otmap-foot .btn'); await p.waitForTimeout(150);
  need(await p.evaluate(() => !!document.querySelector('.otc.want[data-id="OT-03"] .bw')), '지도에서 OT-03에 설계도 표시가 없음');
  await shot('map-mark');
  // 4. OT-03 이야기 카드
  await p.click('.otc[data-id="OT-03"]'); await p.waitForTimeout(120);
  await p.click('.ot3:not([hidden]) .sheet-foot .btn:has-text("이야기 카드로")'); await p.waitForFunction(() => BO3D.story.debug.state().screen === 'play', null, { timeout: 8000 });
  await playScene('OT-03');
  need(await p.evaluate(() => !!document.querySelector('.closebox.dennews')), 'OT-03 마침 화면에 덜컹이 소식이 없음');
  await shot('ot03-finish');
  await p.click('.closebox.dennews .btn'); await p.waitForTimeout(150);
  // 5. 온실: 잔가지 꽂기
  d = await ds(); need(d.open && d.room === 'green' && d.twig && !d.planted, '온실이 열리지 않음 ' + JSON.stringify(d));
  await shot('green-open'); await check('온실(꽂기 전)');
  await p.click('.den4 .dk-panel .btn.wide'); await p.waitForTimeout(120);
  d = await ds(); need(d.planted && d.stage === 'twig' && d.age === 0, '잔가지를 꽂지 못함 ' + JSON.stringify(d));
  await shot('green-planted'); await check('온실(꽂은 뒤)');
  // 6. 설계도 2
  await p.click('.dk-cut .rm[data-room="cockpit"]'); await p.waitForTimeout(100);
  need(await p.evaluate(() => !!document.querySelector('.den4 [data-bp="belt"]')), '설계도 2가 보이지 않음');
  need(await solveIn(await p.evaluate(() => BO3D.den.debug.q('belt')), '.den4 [data-bp="belt"]'), '설계도 2의 성경 물음을 풀지 못함');
  d = await ds(); need(d.bp.belt === 1 && d.marks.indexOf('OT-09') >= 0, '설계도 2를 푼 뒤 OT-09 표시가 없음: ' + d.marks.join());
  await shot('den-bp2-found');
  await p.click('.den4 .otmap-foot .btn'); await p.waitForTimeout(150);
  // 7. OT-09 이야기 카드(시험이라 시대 잠금을 푼다)
  await p.evaluate(() => { BO3D.story.debug.unlockAll(); BO3D.story.openMap(); });
  await p.click('.otc[data-id="OT-09"]'); await p.waitForTimeout(120);
  await p.click('.ot3:not([hidden]) .sheet-foot .btn:has-text("이야기 카드로")'); await p.waitForFunction(() => BO3D.story.debug.state().screen === 'play', null, { timeout: 8000 });
  const r9 = await playScene('OT-09');
  need(r9.winds === 1, 'OT-09에서 날아간 양털이 한 번 나와야 함: ' + r9.winds);
  await shot('ot09-finish');
  need(await p.evaluate(() => /작업대/.test((document.querySelector('.closebox.dennews') || {}).textContent || '')), 'OT-09 마침 화면에 작업대 소식이 없음');
  await p.click('.closebox.dennews .btn'); await p.waitForTimeout(150);
  // 8. 작업대: 실 잣기(덜 돌리고 당기면 끊어짐) → 끈(같은 쪽은 풀림) → 구동 줄 → 매듭 줄
  d = await ds(); need(d.open && d.room === 'bench' && d.wool, '작업대가 열리지 않음 ' + JSON.stringify(d));
  await shot('bench-open'); await check('작업대');
  const B = (t) => p.evaluate(async (t) => { const b = [...document.querySelectorAll('.den4 .dk-panel .btn')].find((x) => x.textContent === t); if (!b) return false; b.click(); await new Promise((r) => setTimeout(r, 40)); return true; }, t);
  await B('당기기'); need(await p.evaluate(() => /끊어졌/.test(document.querySelector('.den4 .gh-say').textContent)), '덜 돌리고 당겼을 때 끊어지지 않음');
  for (let k = 0; k < 4; k++) { await B('돌리기'); await B('돌리기'); await B('돌리기'); await B('당기기'); }
  await p.waitForTimeout(150); d = await ds(); need(d.craft.thread === 1, '실을 잣지 못함');
  await shot('bench-ply');
  await B('실을 꼰 쪽과 같은 쪽으로'); need(await p.evaluate(() => /풀려/.test(document.querySelector('.den4 .gh-say').textContent)), '같은 쪽으로 꼬았을 때 풀리지 않음');
  await B('실을 꼰 쪽과 반대쪽으로'); await p.waitForTimeout(150); d = await ds(); need(d.craft.cord === 1, '끈을 꼬지 못함');
  await B('덜컹이에 끼우기'); await p.waitForTimeout(200); d = await ds(); need(d.craft.belt === 1, '구동 줄을 끼우지 못함');
  need(await p.evaluate(() => !!document.querySelector('.dk-cut .wheel.spin')), '구동 줄을 끼운 뒤 바퀴가 돌지 않음');
  await shot('bench-belt'); await check('구동 줄');
  for (let k = 0; k < 6; k++) await B('매듭 짓기');
  await p.waitForTimeout(200); d = await ds(); need(d.craft.rope === 1, '매듭 줄을 만들지 못함');
  // 9. 재 보기: 덜컹이, 방주(창 6:15)
  await B('덜컹이 재 보기'); await p.waitForTimeout(100);
  need(await solveIn(await p.evaluate(() => BO3D.den.debug.ark()), '.den4 .dk-panel'), '방주 재 보기의 성경 물음을 풀지 못함');
  await p.waitForTimeout(250); need(await p.evaluate(() => !!document.querySelector('.den4 .arkpic')), '방주 그림이 보이지 않음');
  await shot('bench-measure'); await check('재 보기');
  // 10. 온실: 장면 하나를 다녀왔으니 새 잎
  await p.click('.dk-cut .rm[data-room="green"]'); await p.waitForTimeout(120);
  d = await ds(); need(d.age === 1 && d.stage === 'leaf', '장면 하나 뒤에 새 잎이 나지 않음 ' + JSON.stringify(d));
  await shot('green-leaf'); await check('온실(새 잎)');
  await B('물 주기');
  // 11. 일지: 물음 수첩, 양을 치던 사람들, 재료 카드
  await p.click('.dk-cut .rm[data-room="cockpit"]'); await p.waitForTimeout(100);
  const pages = await p.evaluate(() => [...document.querySelectorAll('.den4 .jbtn')].map((x) => x.getAttribute('data-page')));
  need(['notes', 'shepherds', 'cards', 'measure'].every((k) => pages.indexOf(k) >= 0) && pages.indexOf('lamb') < 0, '일지 단추가 다름: ' + pages.join());
  for (const pg of ['notes', 'shepherds', 'cards']) { await p.click('.den4 .jbtn[data-page="' + pg + '"]'); await p.waitForTimeout(80); await shot('journal-' + pg); await check('일지 ' + pg); await B('일지 덮기'); }
  // 12. 저장: 새로고침 뒤에도 남는가, 진행 자료의 형식은 그대로인가
  const raw = await p.evaluate(() => ({ w: localStorage.getItem('bo3d.world.v1'), o: JSON.parse(localStorage.getItem('bo3d.ot.v1')) }));
  need(Object.keys(raw.o).sort().join() === 'done,mats,notes,seenIntro,unlockAll', '진행 자료(bo3d.ot.v1)의 칸이 달라짐: ' + Object.keys(raw.o).sort().join());
  need(Object.keys(raw.o.done).join() === 'OT-03,OT-09' && Object.keys(raw.o.mats).length === 6, '진행 자료의 내용이 다름');
  await p.reload(); await p.waitForTimeout(2200);
  d = await ds(); need(d.planted && d.craft.rope === 1 && d.bp.oil === 1 && d.stage === 'leaf', '새로고침 뒤에 아지트 상태가 사라짐 ' + JSON.stringify(d));
  // 13. 감수 태그 끄기
  await p.click('.tier >> nth=' + ti); await p.click('text=탐험 시작'); await p.waitForTimeout(300);
  const rv1 = await p.evaluate(() => document.querySelectorAll('.ot3:not([hidden]) .br').length);
  await p.evaluate(() => { BO3D.ui.rvSet(false); BO3D.story.openMap(); });
  const rv0 = await p.evaluate(() => document.querySelectorAll('.ot3:not([hidden]) .br, .ot3:not([hidden]) .rv3').length);
  need(rv1 > 0 && rv0 === 0, '감수 태그 켜기·끄기가 듣지 않음: ' + rv1 + ' → ' + rv0);
  await p.evaluate(() => { BO3D.ui.rvSet(true); });
  console.log('단계', ti, '· 화면', n, '· 아지트', JSON.stringify(d));
  console.log('문제', probs.length, probs.join('\n'));
  console.log('오류', errs.length, errs.slice(0, 10).join('\n'));
  await b.close();
  process.exit(probs.length || errs.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
