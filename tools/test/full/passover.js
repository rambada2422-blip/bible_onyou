// 재앙과 유월절의 순서, 중단 지점, 기록에서 돌아가는 길을 실제 화면에서 확인한다.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const { gameOrigin, proxy } = require('../game-server');
const layoutIssues = require('../layout-issues');
const names = ['물이 피가 됨', '개구리', '이', '파리', '가축의 돌림병', '악성 종기', '우박', '메뚜기', '흑암'];
const output = path.resolve('dist/passover-proof');

async function play(browser, url, age) {
  const sizes = [[390,844], [568,320], [320,568]];
  const [width,height] = sizes[age];
  const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  try {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const button = name => page.getByRole('button', { name, exact: true });
    const tap = name => button(name).tap();
    const checkArt = () => page.locator('.po-land img').evaluate(async img => { await img.decode(); return img.naturalWidth > 0; });
    async function resume() { await page.reload(); await tap('이어서 탐험하기'); }
    await page.goto(url);
    await tap('탐험 시작');
    await page.locator('.tier').nth(age).tap();
    await tap('출발 준비 완료');
    await tap('열 가지 재앙과 유월절 · 감수용 미리보기');
    assert(await checkArt());
    for (const [i, name] of names.entries()) {
      if (i % 3 === 0) {
        const wrong = names[i + 1];
        await tap(wrong);
        assert(await button(wrong).isDisabled());
        assert.deepEqual(await page.evaluate(layoutIssues, '.po-screen'), []);
      }
      await tap(name);
      if (i === 5) await resume();
      assert.equal(await page.locator('.po-match').textContent(), '찾은 기록 · ' + name);
      if (age === 0 && i === 0) await page.screenshot({ path:path.join(output,'river.png') });
      await tap(i === 8 ? '유월절을 준비하는 집으로' : '다음 재앙 살펴보기');
    }
    assert(await checkArt());
    await tap('식탁');
    await resume();
    assert(await button('✓ 식탁').isVisible());
    assert(await button('그 밤의 기록으로').isDisabled());
    await tap('떠날 차림');
    await tap('문');
    assert.deepEqual(await page.evaluate(layoutIssues, '.po-screen'), []);
    if (age === 0) await page.screenshot({ path:path.join(output,'preparation.png') });
    await tap('그 밤의 기록으로');
    assert(await checkArt());
    assert.equal(await page.locator('.po-body h3').innerText(), '열 번째 재앙');
    await tap('떠나는 길 살펴보기');
    await tap('탐험 기록 모아보기');
    assert.equal(await page.locator('.po-record').count(), 14);
    await tap('시간표로 돌아가기');
    await tap('일지 1');
    await tap('열 가지 재앙과 유월절 · 탐험 기록');
    await page.getByText('흑암', { exact:true }).tap();
    assert(await page.getByText('출 10:21-29', { exact:true }).isVisible());
    await tap('일지로 돌아가기');
    assert(await page.getByText('탐험 일지', {exact:true}).isVisible());
    assert.deepEqual(errors, []);
    console.log(new URL(url).pathname, width, height, '단계', age+1, '통과');
  } finally { await page.close(); }
}

(async () => {
  const browser = await chromium.launch({ proxy });
  try {
    await fs.mkdir(output, {recursive:true});
    const origin = await gameOrigin(browser);
    for (const entry of ['/web/index.html','/preview.html']) {
      for (let age = 0; age < 3; age++) await play(browser, origin + entry, age);
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
