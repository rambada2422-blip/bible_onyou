// 3D 장면 틀로 만든 장면의 자동 점검(장면마다 같은 흐름). 사용: node tools/test/walk3dScene.js <장면 OT-NN> <단계 0~2> <저장 폴더>
// 흐름: 시대 지도 → 걸어서 탐험 → 도착(통신) → (동행 문답) → 물음 → 재료 1 → 물음 → 재료 2 → 물음 → 재료 3 → 올려다보기 → (영상) → 지켜보기
//       → (동행 문답) → 관문 → (오늘의 물음) → 마무리 → 타임머신으로 → 아지트 → 출발 → 끝 화면 → 시대 지도에 마침 표시.
// 화면을 찍고, 오류와 막힌 곳을 낸다. OT-09(호렙 산)는 타임머신 이름 고르기(시대 추리)를 거치므로 walk3d.js로 점검한다.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const enter3d = require('./lib/enter.js');
const doHelp = require('./lib/help.js');
const id = process.argv[2] || 'OT-18', ti = Number(process.argv[3] || '1'), out = process.argv[4] || '/tmp/walk3dScene';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const b = await chromium.launch({ proxy, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })).newPage();
  await p.addInitScript(() => { window.BO3D_TEST = true; });
  const errs = [], probs = []; let n = 0;
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  const shot = async (l) => { n++; await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '-' + l + '.png') }); };
  const st = () => p.evaluate(() => BO3D.debug.state());
  await p.goto('file:///home/user/bible_onyou/dist/preview3d.html'); await p.waitForTimeout(2500);
  await p.evaluate(() => document.fonts.ready);
  await enter3d(p, ti, id);
  await p.waitForSelector('text=출발하자', { timeout: 60000 }); await p.waitForTimeout(1500);
  const info = await p.evaluate(() => BO3D.debug.scene());
  if (info.id !== id) probs.push('다른 장면이 열림: ' + info.id);
  const D = await p.evaluate((sid) => BO3D.ot.scenes[sid], id);
  const tier = ['t1', 't2', 't3'][ti];
  await shot('arrive');
  await p.click('text=출발하자'); await p.waitForTimeout(500);
  // story.js 조각(동행 문답·오늘의 물음): 시트의 마지막 버튼을 닫힐 때까지 누른다
  let helpSeen = 0;
  const segs = async (label) => {
    for (let i = 0; i < 12; i++) {
      const on = await p.evaluate(() => !!(BO3D.story && BO3D.story.debug.state().screen === 'seg'));
      if (!on) return i;
      if (i === 0) await shot(label);
      const h = await doHelp(p);   /* 현장 돕기 조각이면 돕기를 마친다 */
      if (h) { helpSeen++; await shot(label + '-help' + helpSeen + '-' + h.kind); if (!h.enabled || !h.good || !h.said) probs.push(label + ': 현장 돕기(' + h.kind + ' ' + h.title + ')를 마치지 못함'); }
      await p.click('.ot3 .sheet-foot .btn >> nth=-1'); await p.waitForTimeout(250);
    }
    probs.push(label + ': 조각이 닫히지 않음'); return -1;
  };
  await segs('talk-before');
  const pickIn = async (scope, label) => p.evaluate(([sc, lb]) => {
    const o = [...document.querySelectorAll(sc + ' .opt')].find((x) => x.textContent.trim().endsWith(lb.trim())); if (o) o.click(); return !!o;
  }, [scope, label]);
  async function solve(q, scope, label) {
    if (q.type === 'choice') await pickIn(scope, q.options.find((o) => o.ok).label);
    else if (q.type === 'find') { await p.click(scope + ' .btn:has-text("찾아서 읽었어요")'); await p.waitForTimeout(200); await pickIn(scope, q.confirm.options.find((o) => o.ok).label); }
    else if (q.type === 'order') { for (const it of q.items) await pickIn(scope, it); }
    else if (q.type === 'multi') { await p.click(scope + ' .btn:has-text("찾아서 읽었어요")'); await p.waitForTimeout(200); for (const o of q.confirm.options.filter((x) => x.ok)) await pickIn(scope, o.label); await p.click(scope + ' .btn:has-text("다 골랐어요")'); }
    else if (q.type === 'match') { for (const pr of q.pairs) { await p.evaluate(([sc, r, t]) => { [...document.querySelectorAll(sc + ' .match3 .mref')].find((x) => x.textContent.trim().endsWith(r)).click(); [...document.querySelectorAll(sc + ' .match3 .mtext')].find((x) => x.textContent.trim() === t.trim()).click(); }, [scope, pr.ref, pr.text]); await p.waitForTimeout(80); } }
    else if (q.type === 'findref') { const cv = q.accept[0].split(':'); const ins = await p.$$(scope + ' .refin input'); await ins[0].fill(cv[0]); await ins[1].fill(cv[1]); await p.click(scope + ' .refin .btn'); }
    await p.waitForTimeout(300);
    const good = await p.evaluate((sc) => !!document.querySelector(sc + ' .note.good'), scope);
    if (!good) probs.push(label + ': 물음(' + q.type + ')을 풀지 못함');
  }
  async function walkTo(x, z, label) {
    let last = null, still = 0;
    for (let i = 0; i < 500; i++) {
      const s = await st();
      if (s.state !== 'explore' && s.state !== 'free') break;
      const dx = x - s.x, dz = z - s.z, d = Math.hypot(dx, dz);
      if (d < 0.6) break;
      if (last && Math.hypot(s.x - last.x, s.z - last.z) < 0.03) { if (++still > 12) { probs.push((label || '걷기') + ': 막혀서 멈춤 ' + JSON.stringify([s.x, s.z]) + ' → ' + JSON.stringify([x, z])); break; } } else still = 0;
      last = s;
      await p.evaluate(([yaw]) => { BO3D.debug.yaw(yaw); BO3D.debug.stick(0, 1); }, [Math.atan2(dx, dz)]);
      await p.waitForTimeout(120);
      if (i === 10 && label) await shot(label + '-walking');
    }
    await p.evaluate(() => BO3D.debug.stick(0, 0)); await p.waitForTimeout(500);
  }
  const parts = info.parts;
  for (let i = 0; i < parts.length; i++) {
    await p.waitForSelector('.overlay3:not([hidden]) .q-kicker', { timeout: 20000 });
    await shot('quiz' + (i + 1));
    await solve(D.quests[i].q[tier], '.overlay3', 'quiz' + (i + 1));
    await p.click('text=찾으러 가기'); await p.waitForTimeout(500);
    await walkTo(parts[i].at[0], parts[i].at[1], 'to-part' + (i + 1));
    const s = await st();
    if (i < parts.length - 1) {
      if (s.state !== 'caption') { probs.push('재료 ' + (i + 1) + '을 줍지 못함 ' + JSON.stringify(s)); break; }
      await shot('part' + (i + 1));
      await p.click('text=계속 탐험하기'); await p.waitForTimeout(500);
      await segs('help-after-part' + (i + 1));
    }
  }
  await p.waitForTimeout(1500); await shot('lookup-a');
  await p.waitForSelector('.panel3:not([hidden])', { timeout: 120000 }); await p.waitForTimeout(2500);
  await shot('event1');
  const nb = D.beats.length - info.eventStart;
  for (let i = 0; i < nb; i++) {
    await p.waitForTimeout(i === 0 ? 4000 : 1800);
    if (i > 0) await shot('event' + (i + 1));
    await p.click('.panel3 .btn.onpaper'); await p.waitForTimeout(400);
    await segs('help-after-beat');
  }
  await segs('talk-after');
  const gates = D.gates[tier];
  for (let g = 0; g < gates.length; g++) {
    await p.waitForSelector('.overlay3:not([hidden]) .q-kicker', { timeout: 20000 });
    await shot('gate' + (g + 1));
    await solve(gates[g], '.overlay3', 'gate' + (g + 1));
    await p.click('.overlay3 .sheet-foot .btn.onpaper'); await p.waitForTimeout(400);
  }
  await segs('today');
  const helpN = D.mission && D.mission.help ? D.mission.help.steps.length : 0;
  if (helpSeen !== helpN) probs.push('현장 돕기 ' + helpN + '단계 가운데 ' + helpSeen + '단계만 나옴(3D에서는 after가 재료 때 보여 주는 대목·지켜보기 대목·gates여야 함)');
  await p.waitForSelector('text=계속 탐험하기', { timeout: 20000 }); await shot('end');
  await p.click('.overlay3 .sheet-foot .btn.onpaper'); await p.waitForTimeout(600);
  const pr = await p.evaluate(() => BO3D.debug.parts());
  if (pr.found !== parts.length || !pr.done) probs.push('재료/장면 마침이 맞지 않음 ' + JSON.stringify(pr));
  await walkTo(info.P.machine[0] - 2, info.P.machine[1] - 3, 'back-to-machine');
  await p.click('.den3'); await p.waitForTimeout(500); await shot('den');
  await p.click('text=다음 시대로 출발'); await p.waitForTimeout(5200); await shot('depart');
  await p.waitForSelector('text=시대 지도로', { timeout: 40000 }); await p.waitForTimeout(400); await shot('endcard');
  await p.click('text=시대 지도로'); await p.waitForTimeout(500);
  const done = await p.evaluate((sid) => !!document.querySelector('.otc.done[data-id="' + sid + '"]'), id);
  if (!done) probs.push('시대 지도에 마침 표시가 없음');
  await shot('map');
  console.log(id, tier, '화면', n, '문제', probs.length, probs.join('\n'), '\n오류', errs.length, errs.slice(0, 8).join('\n'));
  await b.close();
  process.exit(probs.length || errs.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
