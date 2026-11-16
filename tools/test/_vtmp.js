const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: 320, height: 640 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { window.BO3D_TEST = true; if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x','1'); localStorage.setItem('bo3d.ot.v1', JSON.stringify({ done: { 'OT-01': { t: 't1' }, 'OT-09': { t: 't3', d3: 1 } }, mats: {}, notes: { 'OT-09': '옛 기록' }, seenIntro: 1 })); localStorage.setItem('bo3d.set.v1', JSON.stringify({ fs: 2, snd: 1, read: 1 })); } });
  await p.goto('file:///home/user/bible_onyou/dist/preview3d.html'); await p.waitForTimeout(2500);
  const out = {};
  out.oldAdult = await p.evaluate(() => { BO3D.S.tier='t1'; BO3D.story.openAdult(); return document.querySelector('.ot3').innerText.slice(0, 520); });
  out.oldNotes = await p.evaluate(() => { BO3D.story.openJournal('notes'); return document.querySelector('.ot3').innerText.slice(0, 600); });
  await p.screenshot({ path: process.argv[2] + '/j320.png' });
  out.over1 = await p.evaluate(() => [...document.querySelectorAll('.ot3 *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1); }).slice(0,6).map(e => e.className + ':' + Math.round(e.getBoundingClientRect().right)));
  // play sheet at fs2, 320
  await p.evaluate(() => BO3D.story.play('OT-10')); await p.waitForTimeout(300);
  for (let i = 0; i < 2; i++) { await p.click('.ot3 .sheet-foot .btn >> nth=-1'); await p.waitForTimeout(80); }
  await p.screenshot({ path: process.argv[2] + '/play320.png' });
  out.over2 = await p.evaluate(() => { const sb = document.querySelector('.ot3 .sheet-body'); return { sw: sb.scrollWidth, cw: sb.clientWidth, w: sb.getBoundingClientRect().width, right: [...document.querySelectorAll('.ot3 .sheet *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 1; }).slice(0,5).map(e => e.className + ':' + Math.round(e.getBoundingClientRect().right)) }; });
  out.speak = await p.evaluate(() => BO3D.ui.speakText(document.querySelector('.ot3 .sheet-body')).slice(0, 300));
  // 3D 조각 뒤에 남는 시간
  out.seg = await p.evaluate(async () => { const w = (ms) => new Promise(r => setTimeout(r, ms)); const t0 = BO3D.story.debug.pg().time['OT-11'] || 0; let fin = false; BO3D.story.segment('OT-11', 'today', () => { fin = true; }); await w(100); let g = 0; while (!fin && g++ < 10) { const bs = document.querySelectorAll('.ot3 .sheet-foot .btn'); bs[bs.length - 1].click(); await w(60); } await w(3000); BO3D.story.openMap(); return { fin, added: (BO3D.story.debug.pg().time['OT-11'] || 0) - t0 }; });
  // 읽는 중에 3D 시트를 닫으면?
  out.speakTexts = await p.evaluate(() => { const d = document.createElement('div'); d.innerHTML = '<p>약 400년 뒤, 아 3시 2분에 수 12개와 단 1명. 창 1:3, 1:9 그리고 시 33:6을 봐요. 출 3:1-4:17.</p>'; return BO3D.ui.speakText(d); });
  console.log(JSON.stringify(out, null, 1)); console.log('errs', errs);
  await b.close();
})();
