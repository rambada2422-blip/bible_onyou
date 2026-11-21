// 호렙 순서 관문에서 번호를 바꾸고 푼 뒤 실제 다음 관문까지 간다.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const { gameOrigin, proxy } = require('../game-server');
const output = path.resolve(process.argv[2] || 'dist/check/order-retry');

async function play(browser, url, id, is3d) {
  const page = await browser.newPage({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const errors = [];
  try {
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    await page.evaluate(three => {
      if (three) localStorage.setItem('bo3d.save.v1', JSON.stringify({ stage: 'gates', tier: 't2', ch: 'hyu', route: 'EX-01', parts: 3, dex: {}, clues: {}, muted: true }));
      else localStorage.setItem('bo_demo_v1', JSON.stringify({ v: 1, tier: 't2', char: 'hyu', routed: true, done: {}, cards: [], notes: {}, journey: { id: 'EX-01', tier: 't2', step: 'gate-0' } }));
    }, is3d);
    await page.reload();
    await page.getByRole('button', { name: '이어서 탐험하기', exact: true }).tap();
    const options = page.locator('.opt');
    const items = await page.evaluate(() => BO.content.scenes['EX-01'].gates.t2[0].items);
    const choice = index => options.filter({ hasText: items[index] });
    const selected = () => page.locator('.opt[aria-pressed="true"]').count();
    const next = page.getByRole('button', { name: '다음 관문', exact: true });

    // 끝 두 장면을 바꿔 놓아도 내가 고른 번호가 보여야 한다.
    const wrong = items.map((_, index) => index);
    const last = wrong.length - 1;
    [wrong[last - 1], wrong[last]] = [wrong[last], wrong[last - 1]];
    for (const index of wrong) await choice(index).tap();
    await page.locator('.note.look').waitFor();
    assert.equal(await selected(), items.length, id + ' · 다시 살펴볼 순서가 남아야 한다');
    assert.equal(await next.isDisabled(), true);
    await page.screenshot({ path: path.join(output, id + '-retry.png') });

    await choice(0).tap();
    assert.equal(await choice(1).locator('.num').innerText(), '1');
    assert.equal(await selected(), items.length - 1);
    await page.getByRole('button', { name: '다시 놓기', exact: true }).tap();
    assert.equal(await selected(), 0);

    for (const index of wrong) await choice(index).tap();
    await choice(last).tap();
    assert.equal(await choice(last - 1).locator('.num').innerText(), String(last));
    await choice(last).focus();
    await page.keyboard.press('Enter');
    await page.locator('.note.good').waitFor();
    assert.equal(await page.locator('.opt:disabled').count(), items.length);
    assert.equal(await page.getByRole('button', { name: '다시 놓기', exact: true }).isDisabled(), true);
    await next.tap();
    await page.getByRole('button', { name: '찾아서 읽었어요' }).waitFor();
    assert.deepEqual(errors, []);
    console.log('통과 · ' + id + ' · 전체 번호 유지, 중간 선택 취소, 다시 놓기, 두 번 눌러 수정, 다음 관문');
  } finally {
    await page.close();
  }
}

(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ proxy, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl'] });
  try {
    const origin = await gameOrigin(browser);
    for (const [id, file, three] of [['2d', '/preview.html', false], ['3d', '/preview3d.html', true],
      ['2d-web', '/web/index.html', false], ['3d-web', '/web3d/index.html', true]]) {
      await play(browser, origin + file, id, three);
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
