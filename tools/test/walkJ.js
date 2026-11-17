// 시대 추리(요단 강) 자동 점검. 사용: node walkJ.js <tierIndex> <outDir> [dsf] [url]
const { chromium, previewURL } = require('./lib/runtime.js');
const path = require('path');
const fs = require('fs');
const enter3d = require('./lib/enter.js');
const ti = process.argv[2] || '1', out = process.argv[3], dsf = Number(process.argv[4] || '1');
const url = process.argv[5] || previewURL;
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dsf });
  const p = await ctx.newPage();
  await p.addInitScript(() => { window.BO3D_TEST = true; });
  const errs = []; let n = 0;
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/ERR_FILE_NOT_FOUND|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  const shot = async (label) => { n++; await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '-' + label + '.png') }); };
  const st = () => p.evaluate(() => BO3D.debug.state());
  const GR = require('./lib/growth.js'), seedN = Number(process.env.GROWTH_SEED || '0');   /* 성장 시스템: GROWTH_SEED=n */
  if (seedN) await GR.seed(p, seedN, { exclude: ['OT-09'] });
  await p.goto(url);
  await p.waitForTimeout(2500);
  await p.evaluate(() => document.fonts.ready);
  const { C, C3 } = await p.evaluate(() => ({ C: BO.content, C3: BO.content3d }));
  const tier = C.tiers[Number(ti)].id, JD = C3.jordan, ALT = C.scenes['ALT-02'];
  await GR.install(p);
  await enter3d(p, ti, 'OT-09');
  await p.waitForTimeout(600);
  await shot('route');
  await p.click('.route-opts .btn:has-text("여호수아")'); await p.waitForTimeout(900);
  await shot('warp');
  await p.waitForSelector('text=둘러보자', { timeout: 40000 }); await p.waitForTimeout(1800);
  await shot('story');
  await p.click('text=둘러보자'); await p.waitForTimeout(1500);
  await shot('arrive');
  console.log('level', await p.evaluate(() => BO3D.debug.level()));
  const J = await p.evaluate(() => BO3D.debug.jordan());
  async function walkTo(x, z) {
    for (let i = 0; i < 300; i++) {
      const s = await st();
      if (s.state !== 'explore') break;
      const dx = x - s.x, dz = z - s.z, d = Math.hypot(dx, dz);
      if (d < 0.7) break;
      await p.evaluate(([yaw]) => { BO3D.debug.yaw(yaw); BO3D.debug.stick(0, 1); }, [Math.atan2(dx, dz)]);
      await p.waitForTimeout(120);
    }
    await p.evaluate(() => BO3D.debug.stick(0, 0)); await p.waitForTimeout(400);
  }
  const aim = async (x, z) => { await p.evaluate(([x, z]) => { const s = BO3D.debug.state(); BO3D.debug.yaw(Math.atan2(x - s.x, z - s.z)); }, [x, z]); await p.waitForTimeout(2800); };
  const snap = async (label) => { await p.click('.cam3'); await p.waitForTimeout(700); await shot(label); console.log(label, JSON.stringify(await p.evaluate(() => BO3D.debug.clues()))); };
  const T = Object.fromEntries(J.targets.map((t) => [t[0], t]));
  // 강가로 내려가 본다 (경계 확인)
  await walkTo(-3, 4); await p.waitForTimeout(400); await shot('boundary');
  console.log('boundary', JSON.stringify(await st()));
  await walkTo(9, 12);
  await aim(T.ark[1], T.ark[3]); await snap('clue-ark');
  await aim(T.bed[1], T.bed[3]); await snap('clue-bed');
  await aim(T.jericho[1], T.jericho[3]); await snap('clue-jericho');
  await walkTo(-20, 11.5);
  await aim(T.people[1], T.people[3]); await snap('clue-people');
  await aim(T.leader[1], T.leader[3]); await snap('clue-leader');
  await p.click('.dex3'); await p.waitForTimeout(500); await shot('notebook');
  await p.click('text=닫기'); await p.waitForTimeout(300);
  await p.click('text=추리하기'); await p.waitForTimeout(500);
  const evs = JD.evidence.filter((e) => e.tiers.includes(tier));
  const next = async () => { await p.click('.overlay3 .sheet-foot .btn.onpaper'); await p.waitForTimeout(450); };
  const pickOk = async (q) => p.click('.overlay3 .opt:has-text("' + q.options.find((o) => o.ok).label + '")');
  let ei = 0;
  for (const e of evs) {
    ei++;
    if (ei === 1) { // 일부러 맞지 않는 사진을 먼저 골라 본다
      const wrong = JD.clues.find((c) => !e.ok.includes(c.id));
      if (wrong) { await p.click('.evi:has-text("' + wrong.name + '")'); await p.waitForTimeout(300); await shot('evidence-look'); }
    }
    const okc = ei === 3 ? JD.clues.find((c) => c.id === 'ark') : JD.clues.find((c) => e.ok.includes(c.id));
    await p.click('.evi:has-text("' + okc.name + '")'); await p.waitForTimeout(300);
    if (e.find) { await p.click('text=찾아서 읽었어요'); await p.waitForTimeout(200); await pickOk(e.find.confirm); await p.waitForTimeout(300); }
    await shot('evidence' + ei);
    await next();
  }
  await p.click('text=찾아서 읽었어요'); await p.waitForTimeout(200); await pickOk(JD.river.confirm); await p.waitForTimeout(300);
  await shot('river');
  if (tier !== 't1') await next();
  if (tier === 't2') { for (const o of ALT.spot.t2.options.filter((x) => x.ok)) await p.click('.overlay3 .opt:has-text("' + o.label + '")'); await p.click('.overlay3 .sheet-body .btn.plain'); }
  if (tier === 't3') { const cv = ALT.spot.t3.accept[0].split(':'); const ins = await p.$$('.refin input'); await ins[0].fill(cv[0]); await ins[1].fill(cv[1]); await p.click('.refin .btn'); }
  await p.waitForTimeout(300); await shot('final');
  await next(); await shot('conclusion');
  await next();
  await p.click('text=찾아서 읽었어요'); await p.waitForTimeout(200); await pickOk(ALT.back.confirm); await p.waitForTimeout(300);
  await shot('back');
  await next(); await shot('bonus-card');
  await next();
  await p.waitForSelector('text=출발하자', { timeout: 40000 }); await p.waitForTimeout(1500);
  await shot('horeb');
  { const g = await GR.report(p);   /* 요단 경로: 여호수아·제사장(glb) 6m 안, 언약궤 10m 안에서는 빛이 꺼져야 한다(T23·T24) */
    if (g.bad.length) errs.push('손목 빛이 보이면 안 되는 때 보임 ' + g.bad.slice(0, 3).join(' | '));
    console.log('GROWTH 요단 경로 seed', seedN, '빛 화면', g.vis + '/' + g.frames, 'maxOp', g.maxOp.toFixed(2), '인물', g.figs, '어긋남', g.bad.length); }
  console.log(tier, 'shots:', n, 'level', await p.evaluate(() => BO3D.debug.level()), JSON.stringify(await st()), errs.length ? '\nERR ' + errs.slice(0, 8).join('\n') : 'no errors');
  if (errs.length) process.exit(1);
  await b.close();
})().catch((e) => { console.error('FAIL', e.message.split('\n').slice(0, 6).join('\n')); process.exit(1); });
