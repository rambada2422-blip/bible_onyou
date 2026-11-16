// 구약 전체 흐름 자동 점검: 처음 화면 → 비상 착륙 → 시대 지도 → 40장면을 이야기 카드로 처음부터 끝까지.
// 사용: node tools/test/walkOT.js <단계 0~2> <저장 폴더> [첫 장면 번호 1~40] [마지막 장면 번호]
// 장면마다: 도착 → (동행) → 지켜보기 → (동행) → 관문(첫 관문은 다른 보기를 먼저 눌러 안내 문구 확인) → 재료 → 오늘의 물음 → 마무리 → 다음 장면/다음 시대.
// 화면마다 글이 옆으로 넘치지 않는지 보고, 시대의 첫 장면과 몇몇 화면을 찍는다. 끝에 오류 목록을 낸다.
const { chromium } = require('playwright');
const doHelp = require('./lib/help.js');
const solveQ = require('./lib/solve.js');
const path = require('path');
const fs = require('fs');
const ti = Number(process.argv[2] || '1'), out = process.argv[3] || '/tmp/walkOT', from = Number(process.argv[4] || '1'), to = Number(process.argv[5] || '40');
fs.mkdirSync(out, { recursive: true });
const BAN = ['틀렸', '실패', '감점', '목숨'];
(async () => {
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const b = await chromium.launch({ proxy, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })).newPage();
  await p.addInitScript(() => { window.BO3D_TEST = true; });
  const errs = [], probs = []; let n = 0;
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  const shot = async (l) => { n++; await p.screenshot({ path: path.join(out, String(n).padStart(3, '0') + '-' + l + '.png') }); };
  const st = () => p.evaluate(() => BO3D.story.debug.state());
  const next = async () => { await p.click('.ot3 .sheet-foot .btn >> nth=-1', { timeout: 8000 }); await p.waitForTimeout(60); };
  // 화면 점검: 옆으로 넘침, 쓰지 않는 표현
  const check = async (where) => {
    const r = await p.evaluate(() => {
      const box = document.querySelector('.ot3'); if (!box || box.hidden) return { hidden: true };
      const over = [...box.querySelectorAll('.sheet-body, .sheet-foot, .otmap, .ot-top')].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.className);
      const btns = [...box.querySelectorAll('.sheet-foot .btn')].filter((e) => e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 4).map((e) => e.textContent);
      return { over, btns, text: box.innerText };
    });
    if (r.hidden) { probs.push(where + ': 이야기 화면이 보이지 않음'); return; }
    if (r.over.length) probs.push(where + ': 옆으로 넘침 ' + r.over.join(','));
    if (r.btns.length) probs.push(where + ': 버튼 글이 넘침 ' + r.btns.join(','));
    BAN.forEach((w) => { if (r.text.includes(w)) probs.push(where + ': 쓰지 않는 표현 "' + w + '"'); });
  };
  // 물음 풀기(페이지 안에서 누른다). wrongFirst면 맞지 않는 보기를 먼저 눌러 안내가 나오는지 본다
  const solve = async (where, wrongFirst) => {
    const r = await solveQ(p, wrongFirst);
    if (!r.ok || !r.good) probs.push(where + ': 물음(' + r.type + ')을 풀지 못함');
    if (wrongFirst && r.look === false) probs.push(where + ': 다른 보기를 눌렀는데 안내 문구가 없음');
    return r;
  };

  await p.goto('file:///home/user/bible_onyou/dist/preview3d.html');
  await p.waitForTimeout(2500);
  await p.evaluate(() => document.fonts.ready);
  await p.click('.tier >> nth=' + ti);
  await p.click('text=탐험 시작'); await p.waitForTimeout(300);
  await shot('intro'); await check('비상 착륙');
  while ((await st()).screen === 'intro') await next();
  await shot('map'); await check('시대 지도');
  const order = await p.evaluate(() => BO3D.ot.order);
  const meta = await p.evaluate(() => Object.fromEntries(BO3D.ot.order.map((id) => [id, { era: BO3D.ot.scenes[id].era, title: BO3D.ot.scenes[id].title }])));
  const log = [];
  // 첫 장면은 지도에서 고른다
  if (from > 1) await p.evaluate(() => BO3D.story.debug.unlockAll());   /* 중간부터 볼 때는 시대 잠금을 푼다 */
  await p.click('.otc[data-id="' + order[from - 1] + '"]'); await p.waitForTimeout(100);
  for (let k = from - 1; k < to; k++) {
    const id = order[k], t0 = Date.now(), firstOfEra = k === from - 1 || meta[order[k - 1]].era !== meta[id].era;
    let s = await st();
    if (s.screen === 'era') { if (firstOfEra) { await shot(id + '-era'); await check(id + ' 시대 안내'); } await p.click('.ot3 .sheet-foot .btn:has-text("첫 장면으로")'); await p.waitForTimeout(80); s = await st(); }
    if (s.screen === 'pick') { await shot(id + '-pick'); await p.click('.ot3 .sheet-foot .btn:has-text("이야기 카드로")'); await p.waitForTimeout(80); }
    await p.waitForFunction(() => BO3D.story.debug.state().screen === 'play', null, { timeout: 8000 });
    s = await st();
    if (s.id !== id) { probs.push(id + ': 다른 장면이 열림 ' + s.id); break; }
    const kinds = []; let gi = 0, guard = 0;
    while (guard++ < 60) {
      s = await st(); kinds.push(s.k);
      const where = id + ' ' + s.k + ' ' + (s.step + 1) + '/' + s.n;
      if (firstOfEra && ['arrive', 'talk', 'gate', 'quest', 'mat', 'today'].includes(s.k) && !kinds.slice(0, -1).includes(s.k)) await shot(id + '-' + s.k);
      if (s.k === 'gate' || s.k === 'quest') await solve(where, gi++ === 0);
      if (s.k === 'mat') {   /* 숨은 재료 찾기: 다른 곳을 한 번 눌러 탐지기 말을 본 뒤 맞는 곳 */
        const r = await p.evaluate(async () => { const k = BO3D.story.debug.seek(); if (k === null) return { skip: 1 }; const t = [...document.querySelectorAll('.ot3 .seek-t')]; const other = t.find((x, i) => i !== k); other.click(); await new Promise((r) => setTimeout(r, 30)); const msg = document.querySelector('.ot3 .seek-msg').textContent; t[k].click(); await new Promise((r) => setTimeout(r, 30)); return { msg, got: !!document.querySelector('.ot3 .matcard') }; });
        if (!r.skip && !r.got) probs.push(where + ': 숨은 재료를 찾지 못함');
      }
      if (s.k === 'help') {   /* 현장 돕기(규칙서 13.6) */
        const h = await doHelp(p);
        if (!h || !h.enabled || !h.good || !h.said) probs.push(where + ': 현장 돕기를 마치지 못함 ' + JSON.stringify(h));
        if (firstOfEra || id === 'OT-10') await shot(id + '-help-' + kinds.filter((x) => x === 'help').length + '-' + (h && h.kind));
      }
      await check(where);
      if (firstOfEra && (s.k === 'gate' || s.k === 'quest') && kinds.filter((x) => x === s.k).length === 1) await shot(id + '-' + s.k + '-ok');
      if (s.k === 'finish') break;
      await next();
    }
    if (firstOfEra || id === order[to - 1]) await shot(id + '-finish');
    const done = (await st()).done;
    log.push(id + ' ' + meta[id].title + ': ' + kinds.join('>') + ' (' + (Date.now() - t0) + 'ms)');
    if (!kinds.includes('finish')) { probs.push(id + ': 마무리까지 가지 못함'); break; }
    if (k < to - 1) await next(); // 다음 장면 / 다음 시대로
    else { await p.click('.ot3 .sheet-foot .btn >> nth=0'); await p.waitForTimeout(100); }
  }
  await shot('map-end'); await check('끝난 뒤 시대 지도');
  const fin = await st();
  fs.writeFileSync(path.join(out, 'log.txt'), log.join('\n') + '\n');
  console.log(log.join('\n'));
  console.log('단계', ti, '· 장면', from + '~' + to, '· 마친 장면', fin.done, '· 재료', fin.mats + '/' + fin.total, '· 화면', n);
  console.log('문제', probs.length, probs.slice(0, 40).join('\n'));
  console.log('오류', errs.length, errs.slice(0, 10).join('\n'));
  await b.close();
  process.exit(probs.length || errs.length ? 1 : 0);
})();
