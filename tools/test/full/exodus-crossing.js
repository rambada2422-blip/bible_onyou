// Play both routes with normal inputs. Storage is read only to observe checkpoints.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { openOfflineBundle } = require('../game-server');
const { chromium, firefox, webkit } = require('playwright');

(async () => {
  const out = process.argv[2] || 'dist/check/crossing',
    file = process.argv[3] || 'dist/expedition.html';
  const name = process.argv[4] || 'chromium',
    driver = { chromium, firefox, webkit }[name];
  fs.mkdirSync(out, { recursive: true });
  const browser = await driver.launch(
    process.env.EXPEDITION_BROWSER_PATH ? { executablePath: process.env.EXPEDITION_BROWSER_PATH } : {}
  );
  try {
    for (const light of [true, false]) {
      const context = await browser.newContext({
        viewport: light ? { width: 390, height: 740 } : { width: 960, height: 600 },
        reducedMotion: 'reduce'
      });
      await context.route(/^https?:/, (route) => route.abort());
      const errors = [];
      context.on('weberror', (event) => errors.push(event.error().message));
      context.setDefaultTimeout(8000);
      context.setDefaultNavigationTimeout(30000);
      const p = await openOfflineBundle(context, file);
      const wait = (ms) => p.clock.runFor(ms);
      const state = () => p.evaluate(() => JSON.parse(localStorage.getItem('onyou.crossing.v1')));
      const picture = async (n) => p.screenshot({ path: path.join(out, n + '.jpg'), quality: 85 });
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(300);
      await p.clock.install();
      await wait(270);
      assert(await p.locator('#cx-cover').isVisible());
      if (light) await picture('입구');
      await p.locator('#cx-start').click();
      let looked = false,
        foundRock = false,
        paused = false,
        restored = false,
        sawGust = false,
        lifted = false,
        loaded = false;
      let s = await state(),
        stuck = 0,
        prevZ = -10;
      for (let i = 0; i < 190 && !s.ended; i++) {
        if (light && s.z > 7 && !looked) {
          await p.locator('#cx-look').click();
          await wait(1700);
          assert((await state()).school);
          const stop = (await state()).z;
          await wait(450);
          assert.equal((await state()).z, stop);
          await picture('물벽_안쪽');
          await p.locator('#cx-look').click();
          looked = true;
        }
        if (s.z > 9 && !paused) {
          await p.keyboard.press('Escape');
          const stopped = (await state()).z;
          await wait(1000);
          assert.equal((await state()).z, stopped);
          assert.equal(await p.locator('#cx-heading').innerText(), '잠시 멈춘 길');
          await p.getByRole('button', { name: '계속 걷기' }).click();
          paused = true;
        }
        if (s.z > 39 && !restored && light) {
          const before = s;
          await p.reload();
          await p.getByRole('button', { name: /바닷길 이어 걷기/ }).click();
          await wait(280);
          s = await state();
          assert(s.z >= before.z - 0.25);
          assert(s.light);
          restored = true;
        }
        const wanted = light
          ? s.z < 54
            ? -0.8
            : 0.85
          : !foundRock
            ? 0
            : s.z < 37
              ? 0.86
              : s.z < 59
                ? -0.13
                : 0.89;
        if (light || foundRock) {
          const diff = wanted - s.x;
          if (Math.abs(diff) > 0.1) {
            const k = diff > 0 ? 'ArrowRight' : 'ArrowLeft';
            await p.keyboard.down(k);
            await wait(Math.min(360, Math.abs(diff) * 680));
            await p.keyboard.up(k);
          }
        }
        const use = await p.locator('#cx-use').innerText();
        if (light && !loaded && use === '등불에 답하기') {
          await p.keyboard.press('Space');
          loaded = true;
        }
        if (!s.traveler && use === '짐 함께 들기') {
          await p.keyboard.down('Space');
          await wait(340);
          await p.keyboard.up('Space');
          assert(!(await state()).traveler);
          await p.keyboard.down('Space');
          await wait(1450);
          await p.keyboard.up('Space');
          assert((await state()).traveler);
          lifted = true;
          if (light) await picture('짐을_나눈_길');
        }
        const message = await p.locator('#cx-message').innerText();
        if (/바위턱/.test(message) && !light && !foundRock) {
          foundRock = true;
          await p.locator('#cx-right').click();
          await wait(360);
        }
        if (!sawGust && /옆바람|바람이 머리|바위가 바람/.test(message)) {
          await p.keyboard.down('Space');
          await wait(1100);
          await p.keyboard.up('Space');
          sawGust = true;
        }
        await p.keyboard.down('w');
        await wait(490);
        await p.keyboard.up('w');
        s = await state();
        stuck = Math.abs(s.z - prevZ) < 0.015 ? stuck + 1 : 0;
        prevZ = s.z;
        if (stuck > 15) throw Error('진행 멈춤 ' + JSON.stringify(s) + ' ' + message);
      }
      assert.equal(s.light, light);
      assert.equal(s.route, light ? 'shelf' : 'open');
      assert(lifted && s.traveler && s.ended && paused);
      assert(light ? restored : foundRock);
      assert.equal(await p.locator('#cx-heading').innerText(), '건너편의 노래');
      for (const name of ['소고 두드리기', '테두리 치기', '소고 두드리기']) {
        await p.getByRole('button', { name }).click();
        await wait(260);
      }
      await wait(1250);
      assert.deepEqual(
        (await state()).song.map((h) => h.rim),
        [false, true, false]
      );
      assert.match(await p.locator('#cx-eyebrow').innerText(), /건너편의 답가/);
      assert.match(await p.locator('#cx-detail').innerText(), /소고가 답한다/);
      if (light) await picture('건너편');
      await p.getByRole('button', { name: '본문 단서' }).click();
      assert.match(await p.locator('#cx-detail').innerText(), /물이 갈라져/);
      await p.getByRole('button', { name: '건너편으로 돌아가기' }).click();
      await p.getByRole('button', { name: '다른 길로 건너기' }).click();
      assert(!(await state()).ended && (await state()).z < 2);
      assert.deepEqual(errors, []);
      await context.close();
    }
    console.log('홍해 물벽 · 두 갈래 완주, 등불 동행, 바위 우회, 짐 나눔, 소고, 저장·재개 · no errors');
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
