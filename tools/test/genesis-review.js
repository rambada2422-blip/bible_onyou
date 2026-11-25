/* node tools/build-genesis-review.js && node tools/test/genesis-review.js */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const { readingOrder, guardianOnly } = require('../../web/genesis/reading-order');

async function verifyReview() {
  const episodes = Array.from({ length: 9 }, (_, i) => 45 + i);
  assert.deepEqual(guardianOnly, [46, 50, 51, 52]);
  assert.deepEqual(readingOrder([45, 47], [46, 50]), [45, 47]); // Approval cannot introduce an unreviewed episode.
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ offline: true, viewport: { width: 360, height: 640 }, hasTouch: true });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', req => { if (!req.url().startsWith('file:')) errors.push(req.url()); });
    const file = path.resolve(__dirname, '../../dist/genesis-e57-review.html');
    assert.equal(fs.readFileSync(file, 'utf8'), fs.readFileSync(path.resolve(__dirname, '../../docs/인계/창세기_E57_목회자검토.html'), 'utf8'));
    const url = pathToFileURL(file).href;
    await page.goto(url);
    const boxes = page.getByRole('checkbox');
    assert.equal(await boxes.count(), 4);
    assert.equal(await page.locator('article').count(), 5);
    for (let mask = 0; mask < 16; mask++) {
      const chosen = guardianOnly.filter((_, i) => (mask & (1 << i)) !== 0);
      const expected = episodes.filter(number => !guardianOnly.includes(number) || chosen.includes(number));
      assert.deepEqual(readingOrder(episodes, chosen), expected);
      for (let i = 0; i < guardianOnly.length; i++) await boxes.nth(i).setChecked(chosen.includes(guardianOnly[i]));
      assert.deepEqual(await page.locator('#route li').allTextContents(), expected.map(n => 'E' + n));
    }
    await page.reload();
    assert.equal(await page.locator('input:checked').count(), 0);
    assert.deepEqual(await page.locator('#route li').allTextContents(), ['E45', 'E47', 'E48', 'E49', 'E53']);
    const proposed = await page.locator('article .proposed p').allTextContents();
    for (const [i, clue] of ['셀라가 자란 뒤', '요셉의 일을 바로에게 말', '아버지 곁', '아버지에게 한 말', '바로 왕을 섬기게'].entries()) {
      assert.ok(proposed[i].includes(clue), clue);
    }
    assert.ok(!proposed[4].includes('서른 살'));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await boxes.first().focus();
    await page.keyboard.press('Space');
    assert.ok(await boxes.first().isChecked());
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
}
verifyReview().then(() => console.log('보호자 선택 16조합, 미감수 회차 제외, 오프라인·키보드, 수정안 5건 통과'))
  .catch(error => { console.error(error); process.exitCode = 1; });
