// 3d-c 장면의 지켜보기 대목을 하나씩, 카메라가 다 옮겨 간 뒤에 찍는다. 사용: node tools/test/beats3d_c.js <장면 OT-NN> <저장 폴더> [대목마다 기다릴 초(기본 14)] [건너뛸 장면 시간(초)]
// 까닭: 화면 없는 시험 컴퓨터는 한 장면 그리기가 느려서(초당 몇 장), 게임 시간(한 장면에 최대 0.05초)이 실제보다 느리게 흐른다.
//       walk3dScene.js는 대목마다 1.8초 뒤에 찍으므로 카메라가 옮겨 가는 도중의 화면이 찍힌다. 이 도구는 대목 화면이 휴대폰에서처럼 자리 잡은 뒤를 본다.
// 재료 줍기·물음은 건너뛴다(BO3D.debug.lookup). 대목 사이의 돕기 조각은 lib/help.js로 마친다. 글 잘림을 보려고 글 상자도 함께 찍힌다.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const enter3d = require('./lib/enter.js');
const doHelp = require('./lib/help.js');
const id = process.argv[2] || 'OT-37', out = process.argv[3] || '/tmp/beats3d_c', waitS = Number(process.argv[4] || '14'), skipS = Number(process.argv[5] || '0');   /* 다섯째: 대목마다 장면 시간을 이만큼 건너뛰고 찍는다(장면이 BO3D.c3d.tNN.skip을 줄 때만) */
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })).newPage();
  await p.addInitScript(() => { window.BO3D_TEST = true; });
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('file://' + path.join(__dirname, '..', '..', 'dist', 'preview3d.html')); await p.waitForTimeout(2500);
  await p.evaluate(() => document.fonts.ready);
  await enter3d(p, 1, id);
  await p.waitForSelector('text=출발하자', { timeout: 60000 }); await p.waitForTimeout(800);
  await p.click('text=출발하자'); await p.waitForTimeout(500);
  const closeSegs = async () => {
    for (let i = 0; i < 12; i++) {
      const on = await p.evaluate(() => !!(BO3D.story && BO3D.story.debug.state().screen === 'seg'));
      if (!on) return;
      await doHelp(p);
      await p.click('.ot3 .sheet-foot .btn >> nth=-1'); await p.waitForTimeout(250);
    }
  };
  await closeSegs();
  await p.evaluate(() => BO3D.debug.lookup());
  await p.waitForSelector('.panel3:not([hidden])', { timeout: 180000 });
  const D = await p.evaluate((sid) => BO3D.ot.scenes[sid], id), info = await p.evaluate(() => BO3D.debug.scene());
  const nb = D.beats.length - info.eventStart;
  for (let i = 0; i < nb; i++) {
    await p.waitForTimeout(waitS * 1000);
    if (skipS) { await p.evaluate(([n, s]) => { const t = BO3D.c3d && BO3D.c3d['t' + n]; if (t) t.skip(s); }, [id.slice(3), skipS]); await p.waitForTimeout(2500); }
    const ph = await p.evaluate(() => BO3D.debug.phase());
    await p.screenshot({ path: path.join(out, 'beat' + (info.eventStart + i) + '.png') });
    console.log('대목', info.eventStart + i, JSON.stringify(ph));
    if (i < nb - 1) { await p.click('.panel3 .btn.onpaper'); await p.waitForTimeout(400); await closeSegs(); }
  }
  console.log(id, '대목 화면', nb, '오류', errs.length, errs.slice(0, 6).join('\n'));
  await b.close();
  process.exit(errs.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
