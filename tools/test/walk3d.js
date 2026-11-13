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
  await p.goto('file:///home/user/bible_onyou/dist/preview3d.html');
  await p.waitForTimeout(2500);
  await p.evaluate(() => document.fonts.ready);
  await shot('menu');
  await p.click('.tier >> nth=' + ti);
  await p.click('text=탐험 시작');
  await p.waitForTimeout(600);
  await p.click('.route-opts .btn:has-text("모세")');
  await p.waitForSelector('text=출발하자', { timeout: 40000 });
  await p.waitForTimeout(1500);
  await shot('story');
  await p.click('text=출발하자');
  await p.waitForTimeout(1500);
  await shot('start');
  const st = () => p.evaluate(() => BO3D.debug.state());
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
  const C = await p.evaluate(() => BO.content);
  const tier = C.tiers[Number(ti)].id;
  await walkTo(P.scraps[0][0], P.scraps[0][1], 'to-flock');
  await shot('scrap1');
  console.log('after scrap1', JSON.stringify(await st()));
  await p.click('text=계속 탐험하기'); await p.waitForTimeout(1500);
  await shot('follow');
  await aim(P.flock[0], P.flock[1]); await snap('photo-sheep');
  await walkTo(P.scraps[1][0], P.scraps[1][1], 'to-rise');
  await shot('scrap2');
  await p.click('text=계속 탐험하기'); await p.waitForTimeout(600);
  // 경계 안으로 들어가 보려고 시도
  await walkTo(P.bush[0], P.bush[1] + 3, null);
  await p.waitForTimeout(400);
  await shot('boundary');
  console.log('boundary', JSON.stringify(await st()));
  await walkTo(P.scraps[2][0], P.scraps[2][1], null);
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
    const pick = async (qq) => p.click('.overlay3 .opt:has-text("' + qq.options.find((o) => o.ok).label + '")');
    if (q.type === 'choice') await pick(q);
    else if (q.type === 'find') { await p.click('text=찾아서 읽었어요'); await p.waitForTimeout(200); await pick(q.confirm); }
    else if (q.type === 'order') { for (const it of q.items) await p.click('.overlay3 .opt:has-text("' + it + '")'); }
    else if (q.type === 'findref') { const cv = q.accept[0].split(':'); const ins = await p.$$('.refin input'); await ins[0].fill(cv[0]); await ins[1].fill(cv[1]); await p.click('.refin .btn'); }
    await p.waitForTimeout(300);
    await p.click('.overlay3 .sheet-foot .btn.onpaper'); await p.waitForTimeout(400);
  }
  await shot('end');
  await p.click('.overlay3 .sheet-foot .btn.onpaper'); await p.waitForTimeout(600);
  const parts = await p.evaluate(() => BO3D.debug.parts());
  let pi = 0;
  for (const at of [parts.at[2], parts.at[1], parts.at[0]]) {
    await walkTo(at[0], at[1], pi === 0 ? 'tracker' : null); pi++;
    await p.waitForTimeout(300);
    console.log('part', JSON.stringify(await p.evaluate(() => BO3D.debug.parts().found)));
    if (pi === 1) await shot('part1');
  }
  await walkTo(P.machine[0] - 2, P.machine[1] - 4, "back-to-machine");
  await aim(P.machine[0], P.machine[1]); await snap('photo-machine');
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
