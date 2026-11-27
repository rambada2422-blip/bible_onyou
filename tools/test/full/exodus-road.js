// 배포한 파일의 조작으로 수레 복구, 장비 효과, 일곱 현장의 완주와 저장을 확인한다.
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium, webkit, firefox } = require('playwright');
(async () => {
  const out = process.argv[2] || path.resolve('dist/check/road'),
    file = process.argv[3] || path.resolve('dist/expedition.html');
  fs.mkdirSync(out, { recursive: true });
  const driver = { chromium, webkit, firefox }[process.argv[4] || 'chromium'];
  const browser = await driver.launch(
    process.env.EXPEDITION_BROWSER_PATH ? { executablePath: process.env.EXPEDITION_BROWSER_PATH } : {}
  );
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 740 },
      offline: driver === chromium,
      reducedMotion: 'reduce'
    });
    if (driver !== chromium) await context.route(/^https?:/, (r) => r.abort());
    const p = await context.newPage(),
      errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    p.setDefaultTimeout(5000);
    const url = pathToFileURL(file).href + '#road',
      click = async (name) => {
        const d = p.locator('#rd-dialog');
        return ((await d.isVisible()) ? d : p).getByRole('button', { name, exact: true }).click();
      },
      act = () => p.locator('#rd-act').click();
    const st = () => p.evaluate(() => JSON.parse(localStorage.getItem('onyou.exodus.road.v1')));
    const readPanel = () => p.locator('#rd-dialog-body').innerText();
    const keyDir = { n: 'ArrowUp', e: 'ArrowRight', s: 'ArrowDown', w: 'ArrowLeft' };
    const walk = async (str) => {
      for (const d of str) await p.keyboard.press(keyDir[d]);
    };
    const shot = async (name) => {
      await p.waitForTimeout(160);
      await p.screenshot({ path: path.join(out, name + '.jpg'), quality: 84 });
    };
    await p.goto(url);
    await p.evaluate(() => document.fonts.ready);
    await shot('01-goshen');
    assert.equal(await p.locator('#rd-title').innerText(), '해 질 무렵의 일터');
    await act();
    assert.deepEqual((await st()).s.cart, { x: 4, y: 4 });
    await click('한 수 되돌리기');
    assert.deepEqual((await st()).s.cart, { x: 3, y: 4 });
    await walk('e');
    await act();
    await p.getByRole('button', { name: '다지기 시작', exact: true }).press('Space', { delay: 220 });
    await p.locator('#rd-dialog').getByText(/차지 않았다/).waitFor();
    assert.match(await readPanel(), /차지 않았다/);
    await click('손으로 고르게 누르기');
    for (let j = 0; j < 3; j++) await click('흙을 한 겹 누르기');
    assert((await st()).s.loaded);
    await walk('e');
    const blocked = (await st()).s.turn;
    await walk('e');
    assert.equal((await st()).s.turn, blocked);
    await walk('senwnee');
    assert((await st()).s.delivered);
    await shot('02-cart');
    await act();
    await click('다른 동선으로 다시 풀기');
    await walk('e');
    await click('원정 메뉴');
    await click('원정 복귀');
    assert((await st()).s.delivered);
    await act();
    await click('여분 물병');
    await click('다음 현장으로');
    const maps = await p.evaluate(() => roadMaps.map((m) => m.rows));
    const directions = [
      ['n', 0, -1],
      ['e', 1, 0],
      ['s', 0, 1],
      ['w', -1, 0]
    ];
    async function go(marker, r = 0, specific) {
      const state = await st(),
        rows = maps[state.i],
        ty = specific ? specific[1] : rows.findIndex((row) => row.includes(marker)),
        tx = specific ? specific[0] : rows[ty].indexOf(marker);
      const q = [[state.s.x, state.s.y, '']],
        seen = new Set();
      for (let i = 0; i < q.length; i++) {
        const [x, y, route] = q[i];
        if (Math.abs(x - tx) + Math.abs(y - ty) <= r) {
          await walk(route);
          return;
        }
        for (const [d, dx, dy] of directions) {
          const a = x + dx,
            b = y + dy,
            k = a + ',' + b;
          if (seen.has(k) || '#P^~Br'.includes(rows[b]?.[a] ?? '#')) continue;
          seen.add(k);
          q.push([a, b, route + d]);
        }
      }
      throw Error('unreachable ' + marker);
    }
    await go('J');
    await act();
    assert((await st()).s.flags.J);
    await p.reload();
    await p.getByRole('heading', { name: '누이가 보던 강둑' }).waitFor();
    assert((await st()).s.flags.J);
    await go('S');
    await act();
    await click('다음 현장으로');
    for (const id of ['F', 'K']) {
      await go(id);
      for (let j = 0; j < 16; j++) {
        await p.keyboard.press('f');
        await p.waitForTimeout(45);
        await act();
        if ((await st()).s.flags[id]) break;
      }
      assert((await st()).s.flags[id]);
    }
    await p.keyboard.press('Escape');
    await act();
    await click('다음 현장으로');
    await act();
    await p.locator('#cx-start').waitFor();
    assert.equal(new URL(p.url()).hash, '#crossing-journey');
    await p.getByRole('link', { name: '원래 지도 돌아가기' }).click();
    await p.locator('#rd-world').waitFor();
    assert.equal((await st()).i, 3);
    for (const id of ['A', 'H']) {
      await go(id);
      await act();
    }
    await go('E');
    await act();
    for (let j = 0; j < 3; j++) await p.locator('#rd-dialog-body .rd-opts button').first().click();
    await click('다음 현장으로');
    assert.equal((await st()).s.water, 5);
    await go(':', 0, [4, 5]);
    await act();
    await shot('03-desert');
    await go('E');
    await act();
    await click('다음 현장으로');
    for (const id of ['R', 'T', 'V']) {
      await go(id);
      await act();
      await click(id === 'V' ? '세 기록 재구성' : '지도 돌아가기');
    }
    for (const n of ['이튿날 다시 용서를 구함', '산 위에서 백성을 위해 간구', '송아지와 춤을 직접 봄'])
      await click(n);
    await click('기록 대조');
    assert.match(await readPanel(), /다시 맞춰/);
    for (const n of ['산 위에서 백성을 위해 간구', '송아지와 춤을 직접 봄', '이튿날 다시 용서를 구함'])
      await click(n);
    await click('기록 대조');
    await click('다음 현장으로');
    for (const id of ['X', 'Y']) {
      await go(id);
      for (let j = 0; j < 7 && !(await st()).s.flags[id]; j++) await act();
      assert((await st()).s.flags[id]);
    }
    await go('E');
    await act();
    await click('여정 마치기');
    assert.equal((await st()).entries.length, 7);
    assert.equal((await st()).entries[2].shots.length, 2);
    await p.reload();
    await p.getByRole('heading', { name: '길 끝의 기록' }).waitFor();
    await click('지도 돌아가기');
    await click('원정 메뉴');
    await click('다른 장비로 다시 걷기');
    assert.equal((await st()).previous.length, 7);
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    console.log('출애굽기 직접 탐험 7/7 · 수레·되돌리기·장비·복원·도약 사진·열기·증언·후일담 · no errors');
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
