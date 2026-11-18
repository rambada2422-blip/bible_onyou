// 겹친 그림 무대(시내 산, OT-12) 점검: 실제 손가락 동작(끌기·문지르기·누르기)으로 처음부터 모세가 어둠 쪽으로 가는 데까지.
// 사용: node tools/test/stage12.js <저장 폴더> [noimg|badimg|calm]
//  - noimg: 그림 파일이 없을 때 임시 그림으로 오류 없이 도는지 / badimg: 그림이 깨졌을 때 / calm: 움직임 줄이기
const { chromium, previewURL } = require('./lib/runtime.js');
const path = require('path');
const fs = require('fs');
const out = process.argv[2] || '/tmp/stage12', mode = process.argv[3] || '';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: mode ? 1 : 2, reducedMotion: mode === 'calm' ? 'reduce' : 'no-preference', hasTouch: false })).newPage();
  const errs = [], probs = []; let n = 0;
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  const shot = async (l) => { n++; await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '-' + l + '.png') }); };
  const st = () => p.evaluate(() => BO3D.story.debug.state());
  const sg = () => p.evaluate(() => BO3D.stage2d.debug.state());
  const nextBtn = () => p.locator('.ot3 .sheet-foot .btn').last();
  const next = async () => { await nextBtn().click({ timeout: 8000 }); await p.waitForTimeout(250); };
  const box = async () => p.evaluate(() => { const r = document.querySelector('.st2 canvas').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const drag = async (x0, y0, x1, y1, steps) => { await p.mouse.move(x0, y0); await p.mouse.down(); for (let i = 1; i <= (steps || 8); i++) { await p.mouse.move(x0 + (x1 - x0) * i / (steps || 8), y0 + (y1 - y0) * i / (steps || 8)); await p.waitForTimeout(16); } await p.mouse.up(); await p.waitForTimeout(120); };
  const enabled = async () => !(await nextBtn().isDisabled());

  await p.goto(previewURL);
  await p.waitForTimeout(2500);
  await p.evaluate(() => document.fonts.ready);
  if (mode === 'noimg') await p.evaluate(() => { BO3D.img2d = {}; });
  if (mode === 'badimg') await p.evaluate(() => { Object.keys(BO3D.img2d).forEach((k) => { BO3D.img2d[k] = 'data:image/webp;base64,AAAA'; }); });
  await p.click('.tier >> nth=0');
  await p.click('text=탐험 시작'); await p.waitForTimeout(300);
  if (await p.locator('text=건너뛰기').count()) await p.click('text=건너뛰기');
  while ((await st()).screen === 'intro') await next();
  await p.click('text=모든 시대 열기'); await p.waitForTimeout(200);
  await p.click('.otc[data-id="OT-12"]'); await p.waitForTimeout(300);
  for (let g = 0; g < 4 && (await st()).screen !== 'play'; g++) {
    const s = await st();
    if (s.screen === 'era') await p.click('.ot3 .sheet-foot .btn:has-text("첫 장면으로")');
    else if (s.screen === 'pick') await p.click('.ot3 .sheet-foot .btn:has-text("이야기 카드로")');
    await p.waitForTimeout(300);
  }
  if ((await st()).id !== 'OT-12') { console.log('OT-12가 열리지 않음', JSON.stringify(await st())); process.exit(1); }
  await p.waitForTimeout(900);
  console.log('그림', JSON.stringify(await p.evaluate(() => BO3D.stage2d.debug.real())));
  const real = await p.evaluate(() => BO3D.stage2d.debug.real());
  if (!mode && !real.ot12_mountain) probs.push('산 그림을 불러오지 못함');
  if (mode === 'noimg' || mode === 'badimg') { if (Object.values(real).some(Boolean)) probs.push('그림이 없어야 하는데 불러옴'); }
  let B = await box();
  if (B.w < 300 || B.h < 300) probs.push('무대 크기가 작음 ' + JSON.stringify(B));
  await shot('arrive');
  /* 둘러보기: 왼쪽으로 끌면 오른쪽(산)이 보인다 */
  const c0 = (await sg()).cam.cx; await drag(B.x + 320, B.y + 200, B.x + 40, B.y + 200); const c1 = (await sg()).cam.cx;
  if (!(c1 > c0 + 100)) probs.push('끌어도 그림이 움직이지 않음 ' + c0 + '→' + c1);
  await shot('arrive-pan');
  await next(); await p.waitForTimeout(1000); await shot('beat0-camp');
  await next(); await p.waitForTimeout(1000); await shot('beat1-moses');
  await next(); await p.waitForTimeout(1100); await shot('beat2-bound');
  await drag(B.x + 330, B.y + 200, B.x + 30, B.y + 200); await drag(B.x + 330, B.y + 200, B.x + 30, B.y + 200);
  if (!(await p.locator('.st2-toast').isVisible())) probs.push('경계 안내가 뜨지 않음');
  await shot('beat2-limit');
  /* 옷 빨기 */
  await next(); await p.waitForTimeout(500);
  if (await enabled()) probs.push('옷을 빨기 전에 [다음]이 열려 있음');
  await shot('wash-start');
  for (let k = 0; k < 3; k++) {
    const r = await p.evaluate(() => { const c = document.querySelector('.st2-cloth').getBoundingClientRect(); return { x: c.left, y: c.top, w: c.width, h: c.height }; });
    await p.mouse.move(r.x + r.w * 0.2, r.y + r.h * 0.5); await p.mouse.down();
    for (let i = 0; i < 9; i++) { await p.mouse.move(r.x + r.w * (i % 2 ? 0.2 : 0.8), r.y + r.h * (0.35 + 0.3 * (i % 3) / 2), { steps: 4 }); }
    await p.mouse.up(); if (k === 0) await shot('wash-one'); await p.waitForTimeout(800);
  }
  await p.waitForTimeout(800);
  if (!(await enabled())) probs.push('옷 세 벌을 빨았는데 [다음]이 열리지 않음 ' + JSON.stringify(await sg()));
  await shot('wash-done');
  /* 셋째 날 아침 */
  await next(); await p.waitForTimeout(700); await shot('days-1');
  await p.waitForTimeout(mode === 'calm' ? 600 : 2600); await shot('days-2');
  await p.waitForFunction(() => BO3D.stage2d.debug.state().mode === 'note', null, { timeout: 15000 });
  await p.waitForTimeout(2600); await shot('storm');
  if (await enabled()) probs.push('수첩을 채우기 전에 [다음]이 열려 있음');
  const t0 = Date.now(); let shots = 0;
  while (Date.now() - t0 < 60000) {
    const s2 = await sg(); if (s2.note.length >= 4) break;
    const sp = await p.evaluate(() => BO3D.stage2d.debug.spots());
    if (sp.length) { await p.mouse.click(sp[0].x, sp[0].y); await p.waitForTimeout(150); if (shots++ === 1) await shot('storm-note'); } else await p.waitForTimeout(150);
  }
  const nt = (await sg()).note; if (nt.length < 4) probs.push('수첩에 네 가지를 담지 못함 ' + nt.join(','));
  await p.waitForTimeout(400); if (!(await enabled())) probs.push('수첩을 채웠는데 [다음]이 열리지 않음');
  await shot('storm-done');
  /* 산기슭으로 */
  await next(); await p.waitForTimeout(900); B = await box(); await shot('walk-start');
  for (let k = 0; k < 6 && !(await enabled()); k++) await drag(B.x + 60, B.y + 260, B.x + 340, B.y + 260);
  if (!(await enabled())) probs.push('산기슭으로 가도 [다음]이 열리지 않음');
  await p.waitForTimeout(500); await shot('walk-done');
  await next(); await p.waitForTimeout(1200); await shot('word-1');
  await next(); await p.waitForTimeout(600); await shot('word-2');
  /* 뒤로 물러서기 */
  await next(); await p.waitForTimeout(1000); B = await box(); await shot('back-start');
  for (let k = 0; k < 6 && !(await enabled()); k++) await drag(B.x + 200, B.y + 120, B.x + 200, B.y + 380);
  if (!(await enabled())) probs.push('뒤로 물러서도 [다음]이 열리지 않음');
  await p.waitForTimeout(500); await shot('back-done');
  /* 모세 */
  await next(); await p.waitForTimeout(mode === 'calm' ? 300 : 2500); await shot('moses-mid');
  await p.waitForTimeout(mode === 'calm' ? 600 : 4200); await shot('moses-end');
  const m = (await sg()).moses; if (m.a > 0.05) probs.push('모세가 어둠 쪽으로 사라지지 않음 ' + JSON.stringify(m));
  await next(); await p.waitForTimeout(700); await shot('gate');
  const s9 = await st(); if (s9.k !== 'gate') probs.push('관문으로 넘어가지 않음 ' + JSON.stringify(s9));
  console.log('무대', JSON.stringify(await sg()));
  console.log('문제', probs.length, probs.join(' | '));
  console.log('오류', errs.length, errs.slice(0, 5).join(' | '));
  await b.close();
  process.exit(probs.length || errs.length ? 1 : 0);
})();
