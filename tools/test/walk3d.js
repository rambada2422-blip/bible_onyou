// 3D 호렙 산 자동 점검. 사용: node walk3d.js <단계 0~2> <저장 폴더> [화면 배율]
// 흐름: 탐지기 물음 → 부품 1(양 떼) → 물음 → 부품 2(호렙으로 가는 길목) → 물음 → 부품 3(언덕 아래) → 올려다보기 → 지켜보기 → 관문 → 타임머신
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const enter3d = require('./lib/enter.js');
const doHelp = require('./lib/help.js');
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
  await p.goto('file:///home/user/bible_onyou/dist/preview3d.html' + (process.env.BO3D_HASH || ''));   // 예: BO3D_HASH=#moses2
  await p.waitForTimeout(2500);
  await p.evaluate(() => document.fonts.ready);
  await shot('menu');
  await enter3d(p, ti, 'OT-09');
  await p.waitForTimeout(600);
  await p.click('.route-opts .btn:has-text("모세")');
  await p.waitForSelector('text=출발하자', { timeout: 40000 });
  await p.waitForTimeout(1500);
  await shot('story');
  await p.click('text=출발하자');
  await p.waitForTimeout(800);
  const st = () => p.evaluate(() => BO3D.debug.state());
  const C = await p.evaluate(() => BO.content);
  const C3 = await p.evaluate(() => BO.content3d);
  const tier = C.tiers[Number(ti)].id;
  const P = await p.evaluate(() => BO3D.world.P);

  /* 이야기 조각(동행 문답·현장 돕기·오늘의 물음): 돕기면 돕기를 마치고, 시트의 마지막 버튼을 닫힐 때까지 누른다 */
  let helpSeen = 0; const probs = [];
  const segs = async (label) => {
    for (let i = 0; i < 12; i++) {
      const on = await p.evaluate(() => !!(BO3D.story && BO3D.story.debug.state().screen === 'seg'));
      if (!on) return;
      if (i === 0) await shot(label);
      const h = await doHelp(p);
      if (h) { helpSeen++; await shot(label + '-help' + helpSeen + '-' + h.kind); if (!h.enabled || !h.good || !h.said) probs.push(label + ': 현장 돕기(' + h.kind + ')를 마치지 못함'); }
      await p.click('.ot3 .sheet-foot .btn >> nth=-1'); await p.waitForTimeout(250);
    }
  };
  // 퀴즈 풀기: 먼저 틀린 보기 하나를 눌러 안내 문구를 확인한 뒤 맞는 답
  async function solve(q, label) {
    await shot(label);
    if (q.type === 'choice') {
      const wrong = q.options.find((o) => !o.ok);
      await p.click('.overlay3 .opt:has-text("' + wrong.label + '")'); await p.waitForTimeout(300);
      if (label === 'quiz1') await shot(label + '-look');
      await p.click('.overlay3 .opt:has-text("' + q.options.find((o) => o.ok).label + '")');
    } else if (q.type === 'order') {
      // 일부러 거꾸로 한 번 눌러 안내 문구를 본 뒤, 바른 순서로
      for (const it of [...q.items].reverse()) await p.click('.overlay3 .opt:has-text("' + it + '")');
      await p.waitForTimeout(300); await shot(label + '-look');
      for (const it of q.items) await p.click('.overlay3 .opt:has-text("' + it + '")');
    } else if (q.type === 'find') {   /* 규칙서 13.5: 읽을 곳을 찾아 읽은 뒤 묻는다 */
      await p.click('.overlay3 .btn:has-text("찾아서 읽었어요")'); await p.waitForTimeout(250);
      const wrong = q.confirm.options.find((o) => !o.ok);
      await p.click('.overlay3 .opt:has-text("' + wrong.label + '")'); await p.waitForTimeout(300);
      if (label === 'quiz1') await shot(label + '-look');
      await p.click('.overlay3 .opt:has-text("' + q.confirm.options.find((o) => o.ok).label + '")');
    } else if (q.type === 'findref') {
      const ins = await p.$$('.refin input');
      await ins[0].fill('3'); await ins[1].fill('9'); await p.click('.refin .btn'); await p.waitForTimeout(300);
      const cv = q.accept[0].split(':'); await ins[0].fill(cv[0]); await ins[1].fill(cv[1]); await p.click('.refin .btn');
    }
    await p.waitForTimeout(400);
    await shot(label + '-ok');
    await p.click('text=찾으러 가기'); await p.waitForTimeout(600);
  }
  async function walkTo(x, z, label) {
    let last = null, still = 0;
    for (let i = 0; i < 500; i++) {
      const s = await st();
      if (s.state !== 'explore' && s.state !== 'free') break;
      const dx = x - s.x, dz = z - s.z, d = Math.hypot(dx, dz);
      if (d < 0.6) break;
      if (last && Math.hypot(s.x - last.x, s.z - last.z) < 0.03) { if (++still > 12) break; } else still = 0;
      last = s;
      await p.evaluate(([yaw]) => { BO3D.debug.yaw(yaw); BO3D.debug.stick(0, 1); }, [Math.atan2(dx, dz)]);
      await p.waitForTimeout(120);
      if (i === 12 && label) await shot(label + '-walking');
    }
    await p.evaluate(() => BO3D.debug.stick(0, 0));
    await p.waitForTimeout(500);
  }
  const aim = async (x, z) => { await p.evaluate(([x, z]) => { const s = BO3D.debug.state(); BO3D.debug.yaw(Math.atan2(x - s.x, z - s.z)); }, [x, z]); await p.waitForTimeout(2600); };
  const snap = async (label) => { await p.click('.cam3'); await p.waitForTimeout(700); await shot(label); console.log(label, JSON.stringify(await p.evaluate(() => BO3D.debug.dex()))); };

  const Q = await p.evaluate(() => (BO3D.ot && BO3D.ot.scenes['OT-09'].quests) || BO.content3d.horeb.quests);   /* 게임과 같은 자료(OT-09.json) */
  await solve(Q[0].q[tier], 'quiz1');
  await shot('tracker1');
  await aim(P.mountain[0], P.mountain[1]); await snap('photo-horeb');
  await walkTo(P.parts[0][0], P.parts[0][1], 'to-flock');
  await shot('part1');
  console.log('after part1', JSON.stringify(await st()));
  await p.click('text=계속 탐험하기'); await p.waitForTimeout(500);
  await segs('help-after-part');
  await solve(Q[1].q[tier], 'quiz2');
  await p.waitForTimeout(2500);
  const fc = await p.evaluate(() => BO3D.debug.flock());
  console.log('flock', JSON.stringify(fc));
  await aim(fc.c.x, fc.c.z); await shot('flock-follow'); await snap('photo-sheep');
  await walkTo(P.parts[1][0], P.parts[1][1], 'to-path');
  await shot('part2');
  await p.click('text=계속 탐험하기'); await p.waitForTimeout(500);
  await segs('help-after-part');
  await solve(Q[2].q[tier], 'quiz3');
  // 언덕에 오르려고 해 본다 (막혀야 한다)
  await walkTo(P.bush[0] - 1, P.bush[1] + 2, null);
  await shot('boundary');
  console.log('boundary', JSON.stringify(await st()));
  await walkTo(P.parts[2][0], P.parts[2][1], 'to-hill');
  await p.waitForTimeout(1500); await shot('lookup-a');
  await p.waitForTimeout(4000); await shot('lookup-b');
  await p.waitForSelector('.panel3:not([hidden])', { timeout: 120000 });
  await p.waitForTimeout(2500);
  await shot('event1');
  console.log('event', JSON.stringify(await st()));
  /* 지켜보기 대목을 넘긴다. 대목 뒤에 현장 돕기 조각이 뜨면 마친다. 마지막은 '다음으로 가는 관문' */
  for (let i = 0, k = 0; i < 24; i++) {
    if (await p.evaluate(() => !!(BO3D.story && BO3D.story.debug.state().screen === 'seg'))) { await segs('help-after-beat'); continue; }
    const pb = await p.$('.panel3:not([hidden]) .btn.onpaper'); if (!pb) break;
    const txt = await pb.textContent(); await pb.click(); await p.waitForTimeout(1300); k++;
    if (k === 2 || k === 4) await shot('event' + (k + 1));
    if (/관문/.test(txt)) { await p.waitForTimeout(400); if (await p.evaluate(() => !!(BO3D.story && BO3D.story.debug.state().screen === 'seg'))) await segs('help-before-gates'); break; }
  }
  // 임무가 있으면 동행 문답(story.js 조각)이 관문 앞에, 오늘의 물음이 관문 뒤에 뜬다. 시트의 마지막 버튼을 닫힐 때까지 누른다
  await segs('talk-after');
  // 관문 풀기
  const gates = (await p.evaluate(() => BO3D.ot ? BO3D.ot.scenes['OT-09'].gates : BO.content.scenes['EX-01'].gates))[tier];
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
  await segs('today');
  await p.waitForSelector('text=계속 탐험하기', { timeout: 20000 });
  await shot('end');
  await p.click('.overlay3 .sheet-foot .btn.onpaper'); await p.waitForTimeout(600);
  console.log('parts', JSON.stringify(await p.evaluate(() => BO3D.debug.parts())));
  await walkTo(P.machine[0] - 2, P.machine[1] - 4, 'back-to-machine');
  await aim(P.machine[0], P.machine[1]); await snap('photo-machine');
  await p.click('.dex3'); await p.waitForTimeout(500); await shot('dex');
  await p.click('text=닫기'); await p.waitForTimeout(300);
  await p.click('.den3'); await p.waitForTimeout(500); await shot('den');
  await p.click('.sw >> nth=2'); await p.click('.tog'); await p.waitForTimeout(300); await shot('den-deco');
  await p.click('text=밖으로 나가기'); await p.waitForTimeout(1200); await shot('deco-outside');
  await p.click('.den3'); await p.waitForTimeout(400);
  await p.click('text=다음 시대로 출발'); await p.waitForTimeout(5200); await shot('depart');
  await p.waitForSelector('text=/처음부터 다시|시대 지도로/', { timeout: 40000 }); await p.waitForTimeout(400); await shot('endcard');
  const helpN = await p.evaluate(() => { const h = BO3D.ot && BO3D.ot.scenes['OT-09'].mission && BO3D.ot.scenes['OT-09'].mission.help; return h ? h.steps.length : 0; });
  if (helpSeen !== helpN) probs.push('현장 돕기 ' + helpN + '단계 가운데 ' + helpSeen + '단계만 나옴');
  console.log(tier, 'shots:', n, JSON.stringify(await st()), errs.length ? '\nERR ' + errs.slice(0, 8).join('\n') : 'no errors', '· 돕기', helpSeen + '/' + helpN, probs.length ? '\n문제 ' + probs.join('\n') : '· 문제 0');
  await b.close();
  if (errs.length || probs.length) process.exit(1);
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
