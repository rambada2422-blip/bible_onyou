// 장면 그림을 실제 게임 화면(390×844)에서 찍는다: 시대 지도 → 장면 → 도착과 대목마다 한 장.
// 사용: node tools/test/shotArtPlay.js <저장 폴더> <OT-NN ...>   (먼저 node tools/build3d.js)
// 물음이 나오는 단계(돕기·관문)는 풀지 않고, 다음 단추가 눌리는 데까지만 간다. 그 뒤 대목은 shotArt.js로 본다.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const out = process.argv[2] || '/tmp/shotArtPlay', ids = process.argv.slice(3);
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errs = [];
  for (const id of ids) {
    const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })).newPage();
    p.on('pageerror', (e) => errs.push(id + ' pageerror: ' + e.message));
    await p.addInitScript(() => { window.BO3D_TEST = true; try { localStorage.setItem('bo3d.ot.v1', JSON.stringify({ seenIntro: 1, unlockAll: true })); } catch (e) { /* 무시 */ } });
    await p.goto('file://' + path.join(__dirname, '..', '..', 'dist', 'preview3d.html'));
    await p.waitForTimeout(2000);
    await p.click('.tier >> nth=1'); await p.click('text=탐험 시작'); await p.waitForTimeout(300);
    const st = () => p.evaluate(() => BO3D.story.debug.state());
    if ((await st()).screen === 'map' && id === ids[0]) await p.screenshot({ path: path.join(out, 'map.png') });
    await p.click('.otc[data-id="' + id + '"]'); await p.waitForTimeout(150);
    let s = await st();
    if (s.screen === 'pick') { await p.click('.ot3 .sheet-foot .btn:has-text("이야기 카드로")'); await p.waitForTimeout(150); s = await st(); }
    if (s.screen !== 'play') { errs.push(id + ': 장면이 열리지 않음(' + s.screen + ')'); await p.close(); continue; }
    let n = 0, guard = 0;
    while (guard++ < 30) {
      s = await st();
      await p.screenshot({ path: path.join(out, id + '-' + String(n++).padStart(2, '0') + '-' + s.k + '.png') });
      const dis = await p.evaluate(() => { const x = [...document.querySelectorAll('.ot3 .sheet-foot .btn')].pop(); return !x || x.disabled; });
      if (dis || s.k === 'finish') break;
      await p.click('.ot3 .sheet-foot .btn >> nth=-1'); await p.waitForTimeout(350);
    }
    console.log(id + ': ' + n + '장');
    await p.close();
  }
  console.log('오류 ' + errs.length); errs.forEach((e) => console.log(e));
  await b.close(); process.exit(errs.length ? 1 : 0);
})();
