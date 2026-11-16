// 시대 지도 화면(390 너비)을 위에서 아래까지 한 장으로 찍는다: 열 시대의 띠 그림과 그 위의 길을 한눈에 본다.
// 사용: node tools/test/shotMap.js <저장 폴더> [locked]   (먼저 node tools/build3d.js)
//  - locked를 주면 처음 상태(시대 1만 열림) 그대로, 주지 않으면 모든 시대를 연 상태로 찍는다.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const out = process.argv[2] || '/tmp/shotMap', locked = process.argv[3] === 'locked';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })).newPage();
  const errs = []; p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await p.addInitScript((lk) => { window.BO3D_TEST = true; try { localStorage.setItem('bo3d.ot.v1', JSON.stringify(lk ? { seenIntro: 1 } : { seenIntro: 1, unlockAll: true })); } catch (e) { /* 무시 */ } }, locked);
  await p.goto('file://' + path.join(__dirname, '..', '..', 'dist', 'preview3d.html'));
  await p.waitForTimeout(2000);
  await p.click('.tier >> nth=1'); await p.click('text=탐험 시작'); await p.waitForTimeout(300);
  /* 지도 목록만 떼어 길게 찍는다(카드는 접어 띠 그림끼리 가깝게) */
  const n = await p.evaluate(() => { const m = document.querySelector('.otmap'); m.style.overflow = 'visible'; m.style.height = 'auto'; m.style.flex = 'none'; document.querySelectorAll('.otcs').forEach((x) => { x.style.display = 'none'; }); return document.querySelectorAll('.ote-h svg').length; });
  /* 화면 높이에 잘리지 않게 창을 목록 길이만큼 늘린다 */
  const hh = await p.evaluate(() => document.querySelector('.otmap').scrollHeight);
  await p.setViewportSize({ width: 390, height: hh + 40 }); await p.waitForTimeout(200);
  await p.locator('.otmap').screenshot({ path: path.join(out, 'map' + (locked ? '-locked' : '') + '.png') });
  console.log('띠 그림 ' + n + '개 · 오류 ' + errs.length); errs.forEach((e) => console.log(e));
  await b.close(); process.exit(errs.length ? 1 : 0);
})();
