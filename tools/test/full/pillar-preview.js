// 구름 기둥과 불 기둥을 실제 그림 좌표로 누르고 같은 여정에서 이어 간다.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const { gameOrigin, proxy } = require('../game-server');
const layoutIssues = require('../layout-issues');

const output = path.resolve(process.argv[2] || 'dist/check/pillar-preview');
const sizes = [[390, 844], [568, 320], [320, 568], [844, 390], [360, 560], [390, 664]];

async function tapPicture(page, group, x, y) {
  const point = await page.locator(group).evaluate((drawing, coords) => {
    const p = new DOMPoint(...coords).matrixTransform(drawing.getScreenCTM());
    return { x: p.x, y: p.y };
  }, [x, y]);
  await page.touchscreen.tap(point.x, point.y);
}

async function play(browser, url, width, height, age) {
  const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  try {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const button = name => page.getByRole('button', { name, exact: true });
    const cloud = page.locator('#ex09-cloud');
    const fire = page.locator('#ex09-fire');
    await page.goto(url);
    await button('탐험 시작').tap();
    await page.locator('.tier').nth(age).tap();
    await button('출발 준비 완료').tap();
    await page.locator('.node.play').filter({ hasText: '구름 기둥과 불 기둥' }).tap();
    await button('광야 길 따라가기').waitFor();
    assert(await cloud.isVisible());
    await tapPicture(page, '#ex09-cloud', 170, 460);
    assert(await cloud.isVisible(), '빈 하늘을 눌러도 같은 모습을 유지한다');
    await tapPicture(page, '#ex09-cloud', 540, 420);
    assert(await fire.isVisible(), '도착 화면에서 구름을 누르면 밤의 불 기둥이 보여야 한다');
    assert.deepEqual(await page.evaluate(layoutIssues, '#app > .screen'), []);
    if (width === 390 && height === 844) {
      await page.screenshot({ path: path.join(output, 'night.png') });
      await page.setViewportSize({ width: height, height: width });
    }
    await tapPicture(page, '#ex09-fire', 540, 420);
    assert(await cloud.isVisible(), '불 기둥을 누르면 낮으로 돌아온다');
    if (width === 390 && height === 844) {
      await page.setViewportSize({ width, height });
      await page.screenshot({ path: path.join(output, 'day.png') });
    }
    await button('밤 풍경 보기').focus();
    await page.keyboard.press('Enter');
    assert(await fire.isVisible());
    assert(await button('낮 풍경 보기').evaluate(b => b === document.activeElement));
    await page.keyboard.press('Space');
    assert(await cloud.isVisible());
    await button('밤 풍경 보기').tap();
    await button('시간표로 돌아가기').tap();
    await page.locator('.node.play').first().tap();
    await button('둘러보기').tap();
    await button('시간표로 돌아가기').tap();
    await page.locator('.node.play').filter({ hasText: '구름 기둥과 불 기둥' }).tap();
    assert(await fire.isVisible(), '다른 장면에 다녀와도 마지막으로 본 모습이 남는다');
    await page.reload();
    await button('이어서 탐험하기').tap();
    assert(await fire.isVisible(), '재접속해도 같은 모습을 연다');
    await button('광야 길 따라가기').tap();
    const first = await page.evaluate(() => BO.content.scenes['EX-09'].beats[0].text[BO.app2d.state.tier]);
    assert.equal(await page.locator('.sheet .narr').innerText(), first);
    assert(await cloud.isVisible(), '첫 대목은 원래의 낮 그림으로 시작한다');
    await tapPicture(page, '#ex09-cloud', 540, 420);
    assert(await cloud.isVisible());
    assert.equal(await button('밤 풍경 보기').count(), 0);
    assert.deepEqual(errors, []);
    console.log(new URL(url).pathname, width + '×' + height, '연령 단계', age + 1, '· 낮·밤 직접 조작, 장면 이동·재접속, 첫 대목 통과');
  } finally { await page.close(); }
}

async function checkFallback(browser, url) {
  const page = await browser.newPage();
  try {
    const button = name => page.getByRole('button', { name, exact: true });
    await page.goto(url);
    await button('탐험 시작').click();
    await page.locator('.tier').first().click();
    await button('출발 준비 완료').click();
    await page.evaluate(() => { BO.art.ex09 = '<svg viewBox="0 0 900 1200"></svg>'; });
    await page.locator('.node.play').filter({ hasText: '구름 기둥과 불 기둥' }).click();
    await button('둘러보기').focus();
    assert.equal(await button('밤 풍경 보기').count(), 0);
    await page.keyboard.press('Enter');
    await page.locator('.sheet .narr').waitFor();
    console.log(new URL(url).pathname, '· 기둥 그림이 없는 판도 첫 대목 진입');
  } finally { await page.close(); }
}

(async () => {
  const browser = await chromium.launch({ proxy });
  try {
    await fs.mkdir(output, { recursive: true });
    const origin = await gameOrigin(browser);
    for (const entry of ['/web/index.html', '/preview.html']) {
      for (const [i, [width, height]] of sizes.entries()) {
        await play(browser, origin + entry, width, height, i % 3);
      }
      await checkFallback(browser, origin + entry);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
