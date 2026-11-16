// 자동 작업 3d-b: 새 3D 장면을 빨리 들여다보는 점검(걷기 없이). 사용: node tools/test/3d-b/peek.js <OT-NN> <저장 폴더> [대목마다 기다릴 초(쉼표로)]
// 처음 화면 → 3D 진입 → 탐험 화면 → (재료를 건너뛰고) 올려다보기 → 지켜보기 대목마다 화면. 전체 흐름 점검은 walk3dScene.js로 한다.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const enter3d = require('../lib/enter.js');
const doHelp = require('../lib/help.js');   /* 3D 안 돕기는 마쳐야 "계속"이 눌린다(play 갈래의 잠금, 규칙서 13.6) */
const id = process.argv[2], out = process.argv[3] || '/tmp/peek', waits = (process.argv[4] || '').split(',').filter(Boolean).map(Number);
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })).newPage();
  await p.addInitScript(() => { window.BO3D_TEST = true; });
  const errs = []; let n = 0;
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  const shot = async (l) => { n++; await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '-' + l + '.png') }); };
  await p.goto('file://' + path.join(__dirname, '..', '..', '..', 'dist', 'preview3d.html')); await p.waitForTimeout(2500);
  await enter3d(p, 1, id);
  await p.waitForSelector('text=출발하자', { timeout: 60000 }); await p.waitForTimeout(2500);
  await shot('arrive');
  await p.evaluate(() => { document.querySelectorAll('.panel3,.overlay3').forEach((x) => { x.style.visibility = 'hidden'; }); });
  const info = await p.evaluate(() => BO3D.debug.scene());
  for (const yaw of [Math.PI, Math.PI / 2, -Math.PI / 2, 0]) { await p.evaluate((y) => BO3D.debug.yaw(y), yaw); await p.waitForTimeout(1200); await shot('look' + yaw.toFixed(1)); }
  for (let i = 0; i < info.parts.length; i++) { await p.evaluate(([x, z]) => BO3D.debug.goto(x, z + 3), info.parts[i].at); await p.evaluate(() => BO3D.debug.yaw(Math.PI)); await p.waitForTimeout(1500); await shot('part' + (i + 1)); }
  await p.evaluate(() => { document.querySelectorAll('.panel3,.overlay3').forEach((x) => { x.style.visibility = ''; }); BO3D.debug.lookup(); });
  await p.waitForTimeout(9000);
  const D = await p.evaluate((sid) => BO3D.ot.scenes[sid], id), nb = D.beats.length - info.eventStart;
  for (let i = 0; i < nb; i++) {
    const w = waits[i] || 6; await p.waitForTimeout(2500); await shot('beat' + (info.eventStart + i) + 'a');
    await p.waitForTimeout(w * 1000); await shot('beat' + (info.eventStart + i) + 'b');
    console.log('beat', info.eventStart + i, JSON.stringify(await p.evaluate(() => BO3D.debug.phase())), JSON.stringify(await p.evaluate(() => BO3D.debug.render())));
    if (i < nb - 1) { await p.click('.panel3 .btn.onpaper'); await p.waitForTimeout(300);
      for (let k = 0; k < 12; k++) { const on = await p.evaluate(() => !!(BO3D.story && BO3D.story.debug.state().screen === 'seg')); if (!on) break; await doHelp(p); await p.click('.ot3 .sheet-foot .btn >> nth=-1').catch(() => {}); await p.waitForTimeout(250); } }
  }
  console.log(id, '화면', n, '오류', errs.length, errs.slice(0, 6).join('\n'));
  await b.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
