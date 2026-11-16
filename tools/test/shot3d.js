// 3D 장면의 지켜보기 대목만 빠르게 찍는다(배치·카메라 확인용. 전체 흐름 시험은 walk3dScene.js).
// 사용: node tools/test/shot3d.js <OT-NN> <저장 폴더> [대목마다 기다릴 초=3] [단계 0~2=1]
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const enter3d = require('./lib/enter.js');
const id = process.argv[2], out = process.argv[3] || '/tmp/shot3d', wait = Number(process.argv[4] || 3) * 1000, ti = Number(process.argv[5] || 1);
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })).newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(() => { window.BO3D_TEST = true; });
  await p.goto('file:///home/user/bible_onyou/dist/preview3d.html'); await p.waitForTimeout(2500);
  await enter3d(p, ti, id);
  await p.waitForSelector('text=출발하자', { timeout: 60000 }); await p.click('text=출발하자'); await p.waitForTimeout(800);
  await p.evaluate(() => { const o = document.querySelector('.overlay3'); if (o) o.hidden = true; });
  await p.waitForTimeout(1200); await p.screenshot({ path: path.join(out, '00-explore.png') });
  const info = await p.evaluate(() => BO3D.debug.scene()), D = await p.evaluate((sid) => BO3D.ot.scenes[sid], id);
  await p.evaluate(() => BO3D.debug.lookup());
  await p.waitForSelector('.panel3:not([hidden])', { timeout: 120000 });
  const nb = D.beats.length - info.eventStart;
  for (let i = 0; i < nb; i++) {
    await p.waitForTimeout(wait);
    await p.screenshot({ path: path.join(out, String(i + 1).padStart(2, '0') + '-beat' + (info.eventStart + i) + '.png') });
    await p.evaluate(() => { const pn = document.querySelector('.panel3'); pn.style.visibility = 'hidden'; });
    await p.waitForTimeout(150);
    await p.screenshot({ path: path.join(out, String(i + 1).padStart(2, '0') + '-beat' + (info.eventStart + i) + '-nopanel.png') });
    await p.evaluate(() => { const pn = document.querySelector('.panel3'); pn.style.visibility = ''; });
    if (i < nb - 1) {
      await p.click('.panel3 .btn.onpaper'); await p.waitForTimeout(400);
      for (let k = 0; k < 12; k++) {   /* 현장 돕기 조각은 화면에서 지워 넘긴다(여기서는 배치만 본다) */
        const on = await p.evaluate(() => !!(BO3D.story && BO3D.story.debug.state().screen === 'seg'));
        if (!on) break;
        await p.evaluate(() => { const bs = [...document.querySelectorAll('.ot3 .sheet-foot .btn')]; bs.forEach((x) => { x.disabled = false; }); if (bs.length) bs[bs.length - 1].click(); });
        await p.waitForTimeout(250);
      }
    }
  }
  console.log(id, '대목', nb, '오류', errs.length, errs.slice(0, 5).join('\n'));
  await b.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
