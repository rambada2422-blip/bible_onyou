// 3D 샘플 자동 점검. 사용: node walk3d.js <tierIndex> <outDir> [dsf]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ti = process.argv[2] || '1', out = process.argv[3], dsf = Number(process.argv[4] || '1');
fs.mkdirSync(out, { recursive: true });
(async () => {
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const b = await chromium.launch({ proxy, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dsf });
  const p = await ctx.newPage();
  await p.addInitScript(() => { window.BO3D_TEST = true; });
  const errs = []; let n = 0;
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  const shot = async (label) => { n++; await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '-' + label + '.png') }); };
  await p.goto(require('url').pathToFileURL(path.resolve(__dirname, '../../dist/preview3d.html')).href);
  await p.waitForTimeout(2500);
  await p.evaluate(() => document.fonts.ready);
  await shot('menu');
  await p.click('.tier >> nth=' + ti);
  await p.click('text=탐험 시작');
  await p.waitForTimeout(600);
  await p.click('.route-opts .btn:has-text("모세")');
  await p.waitForSelector('.panel3 .btn.onpaper:has-text("다음")', { timeout: 40000 });
  await p.waitForTimeout(1500);
  await shot('story');
  await p.click('.panel3 .btn.onpaper:has-text("다음")');
  await p.waitForSelector('.panel3 .btn.onpaper:has-text("출발하자")', { timeout: 10000 });
  await p.waitForTimeout(400);
  const C = await p.evaluate(() => BO.content);
  const H3 = await p.evaluate(() => BO.content3d.horeb);
  const tier = C.tiers[Number(ti)].id;
  const intro2Text = await p.locator('.panel3').innerText();
  if (!intro2Text.includes(H3.intro.narr2[tier])) throw new Error('intro2 text mismatch');
  await p.click('.panel3 .btn.onpaper:has-text("출발하자")');
  await p.waitForTimeout(600);
  const st = () => p.evaluate(() => BO3D.debug.state());
  async function solveQuiz(idx) {
    const item = H3.quiz[idx], q = item.q[tier];
    const hint = tier === 't1' ? H3.bookHint.t1 : (tier === 't3' ? H3.bookHint.t3 : item.ref);
    const okRef = item.okRef[tier];
    const foundText = (tier === 't1' && item.foundT1) ? item.foundT1 : item.found;
    await p.waitForSelector('.overlay3:not([hidden]) .q-kicker', { timeout: 10000 });
    const preText = await p.locator('.overlay3').innerText();
    if (!preText.includes(H3.kicker + ' ' + (idx + 1) + ' / ' + H3.quiz.length)) throw new Error('quiz kicker mismatch ' + idx);
    if (!preText.includes(hint)) throw new Error('quiz hint mismatch ' + idx);
    if (tier === 't3' && preText.includes(item.ref)) throw new Error('t3 leaked verse ref ' + idx);
    if (preText.includes('본문에 없음')) throw new Error('quiz leaked note ' + idx);
    if (!(await p.locator('.track3').isHidden())) throw new Error('tracker visible before quiz ' + idx);
    await shot('quiz' + (idx + 1));
    const wrongIdx = q.options.findIndex((o) => !o.ok);
    await p.click('.overlay3 .opt >> nth=' + wrongIdx);
    await p.waitForTimeout(250);
    const wrongText = await p.locator('.overlay3').innerText();
    if (!wrongText.includes('성경에서 확인해 볼까요?') || !wrongText.includes('성경책을 펴서 읽은 뒤 다시 골라 보세요.')) throw new Error('wrong feedback missing ' + idx);
    if (wrongText.includes('틀렸습니다')) throw new Error('forbidden wrong wording ' + idx);
    if (!(await p.locator('.overlay3 .sheet-foot .btn.onpaper').isDisabled())) throw new Error('next enabled after wrong ' + idx);
    const okIdx = q.options.findIndex((o) => o.ok);
    await p.click('.overlay3 .opt >> nth=' + okIdx);
    await p.waitForTimeout(300);
    const okText = await p.locator('.overlay3').innerText();
    if (!okText.includes('성경에 그렇게 기록되어 있어요.') || !okText.includes(okRef)) throw new Error('ok feedback missing ' + idx);
    if (tier === 't1') {
      if (okText.includes(foundText)) throw new Error('t1 did not split found screen ' + idx);
      await p.click('.overlay3 .sheet-foot .btn.onpaper');
      await p.waitForTimeout(300);
      const t1Found = await p.locator('.overlay3').innerText();
      if (!t1Found.includes('탐험대 이야기') || !t1Found.includes(foundText)) throw new Error('t1 found screen missing ' + idx);
      await p.click('.overlay3 .sheet-foot .btn.onpaper');
    } else {
      if (!okText.includes('탐험대 이야기') || !okText.includes(foundText)) throw new Error('found guide missing ' + idx);
      await p.click('.overlay3 .sheet-foot .btn.onpaper');
    }
    await p.waitForTimeout(500);
    if (await p.locator('.track3').isHidden()) throw new Error('tracker hidden after quiz ' + idx);
    const objText = await p.locator('.hud3 .obj').innerText();
    if (!objText.includes(item.objective)) throw new Error('objective mismatch after quiz ' + idx);
  }
  await solveQuiz(0);
  await p.waitForTimeout(900);
  await shot('start');
  // 목표 지점을 향해 조이스틱을 민다 (카메라 방향을 목표 쪽으로 고정)
  async function walkTo(x, z, label, stopState) {
    for (let i = 0; i < 400; i++) {
      const s = await st();
      if (s.state !== 'explore' && s.state !== 'free') break;
      const dx = x - s.x, dz = z - s.z, d = Math.hypot(dx, dz);
      if (d < 0.6) break;
      await p.evaluate(([yaw]) => { BO3D.debug.yaw(yaw); BO3D.debug.stick(0, 1); }, [Math.atan2(dx, dz)]);
      await p.waitForTimeout(120);
      if (i === 12 && label) await shot(label + '-walking');
    }
    await p.evaluate(() => BO3D.debug.stick(0, 0));
    await p.waitForTimeout(500);
  }
  const P = await p.evaluate(() => BO3D.world.P);
  const aim = async (x, z) => { await p.evaluate(([x, z]) => { const s = BO3D.debug.state(); BO3D.debug.yaw(Math.atan2(x - s.x, z - s.z)); }, [x, z]); await p.waitForTimeout(2600); };
  const snap = async (label) => { await p.click('.cam3'); await p.waitForTimeout(700); await shot(label); console.log(label, JSON.stringify(await p.evaluate(() => BO3D.debug.dex()))); };
  await aim(P.mountain[0], P.mountain[1]); await snap('photo-horeb');
  await walkTo(P.scraps[0][0], P.scraps[0][1], 'to-flock');
  if ((await p.evaluate(() => BO3D.debug.parts().found)) !== 1) throw new Error('part 1 not collected');
  await shot('scrap1');
  console.log('after scrap1', JSON.stringify(await st()));
  await p.click('.panel3 .btn.onpaper'); await p.waitForTimeout(500);
  await solveQuiz(1);
  await shot('follow');
  await walkTo(P.flock[0] + 6, P.flock[1] + 6, null);
  await aim(P.flock[0], P.flock[1]); await snap('photo-sheep');
  if ((await p.evaluate(() => BO3D.debug.sheep())) < 30) throw new Error('sheep < 30');
  await walkTo(P.scraps[1][0], P.scraps[1][1], 'to-rise');
  if ((await p.evaluate(() => BO3D.debug.parts().found)) !== 2) throw new Error('part 2 not collected');
  await shot('scrap2');
  await p.click('.panel3 .btn.onpaper'); await p.waitForTimeout(500);
  await solveQuiz(2);
  // 경계 안으로 들어가 보려고 시도
  await walkTo(P.bush[0], P.bush[1] + 3, null);
  await p.waitForTimeout(400);
  await shot('boundary');
  const bst = await st();
  console.log('boundary', JSON.stringify(bst));
  if (Math.hypot(bst.x - P.bush[0], bst.z - P.bush[1]) < P.witnessRadius - 0.1) throw new Error('crossed witness boundary');
  await walkTo(P.scraps[2][0], P.scraps[2][1], null);
  if ((await p.evaluate(() => BO3D.debug.parts().found)) !== 3) throw new Error('part 3 not collected');
  const luText = await p.locator('.panel3').innerText();
  if (!luText.includes(H3.lookUp.text)) throw new Error('lookUp text missing');
  await shot('lookup');
  await p.click('.panel3 .btn.onpaper');
  await p.waitForTimeout(2600);
  await shot('event1');
  await snap('photo-event');
  console.log('event', JSON.stringify(await st()));
  for (let i = 0; i < 4; i++) { await p.click('.panel3 .btn.onpaper'); await p.waitForTimeout(1300); if (i === 1 || i === 3) await shot('event' + (i + 2)); }
  await p.click('.panel3 .btn.onpaper'); await p.waitForTimeout(600);
  // 관문 풀기
  const gates = C.scenes['EX-01'].gates[tier];
  for (let g = 0; g < gates.length; g++) {
    const q = gates[g];
    await shot('gate' + (g + 1));
    const pick = async (qq) => p.click('.overlay3 .opt >> nth=' + qq.options.findIndex((o) => o.ok));
    if (q.type === 'choice') await pick(q);
    else if (q.type === 'find') { await p.click('text=찾아서 읽었어요'); await p.waitForTimeout(200); await pick(q.confirm); }
    else if (q.type === 'order') { for (const it of q.items) await p.click('.overlay3 .opt:has-text("' + it + '")'); }
    else if (q.type === 'findref') { const cv = q.accept[0].split(':'); const ins = await p.$$('.refin input'); await ins[0].fill(cv[0]); await ins[1].fill(cv[1]); await p.click('.refin .btn'); }
    await p.waitForTimeout(300);
    await p.click('.overlay3 .sheet-foot .btn.onpaper'); await p.waitForTimeout(400);
  }
  await shot('end');
  await p.click('.overlay3 .sheet-foot .btn.onpaper'); await p.waitForTimeout(600);
  await walkTo(P.machine[0] - 2, P.machine[1] - 4, 'back-to-machine');
  await aim(P.machine[0], P.machine[1]); await snap('photo-machine');
  const dexAll = await p.evaluate(() => BO3D.debug.dex());
  if (dexAll.length < 5) throw new Error('dex incomplete: ' + JSON.stringify(dexAll));
  await p.click('.dex3'); await p.waitForTimeout(500); await shot('dex');
  await p.click('text=닫기'); await p.waitForTimeout(300);
  await p.click('.den3'); await p.waitForTimeout(500); await shot('den');
  await p.click('.sw >> nth=2'); await p.click('.tog'); await p.waitForTimeout(300); await shot('den-deco');
  await p.click('text=밖으로 나가기'); await p.waitForTimeout(1200); await shot('deco-outside');
  await p.click('.den3'); await p.waitForTimeout(400);
  await p.click('text=다음 시대로 출발'); await p.waitForTimeout(5200); await shot('depart');
  await p.waitForSelector('text=처음부터 다시', { timeout: 40000 }); await p.waitForTimeout(400); await shot('endcard');
  console.log(tier, 'shots:', n, JSON.stringify(await st()), errs.length ? '\nERR ' + errs.slice(0, 8).join('\n') : 'no errors');
  await b.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
