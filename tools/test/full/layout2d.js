const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { gameOrigin, proxy } = require('../game-server');

const outputFolder = process.argv[2];
if (!outputFolder) {
  console.error('첫 번째 인자로 화면 사진을 저장할 폴더를 지정하세요.');
  process.exit(1);
}

const { chromium } = require('playwright');
const layoutIssues = require('../layout-issues');
const sizes = [[320, 568], [360, 560], [390, 664], [390, 844], [568, 320], [844, 390]];
let url;

async function checkSize(browser, width, height) {
  const size = `${width}x${height}`;
  const folder = path.resolve(outputFolder, size);
  const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  page.setDefaultNavigationTimeout(30000);
  const issues = [];
  page.on('pageerror', (error) => issues.push(`화면 실행 오류 · ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') issues.push(`화면 기록 오류 · ${message.text()}`);
  });
  const click = (name) => page.getByRole('button', { name, exact: true }).click();
  const next = page.locator('.sheet-foot .btn.onpaper');
  async function advanceTo(selector) {
    for (let step = 0; step < 20; step++) {
      if (await page.locator(selector).count()) return;
      await next.click();
    }
    throw new Error(`지정한 화면에 도착하지 못했습니다. ${selector}`);
  }

  async function capture(name) {
    for (const issue of await page.evaluate(layoutIssues, '#app > .screen')) issues.push(`${name} · ${issue}`);
    await page.screenshot({ path: path.join(folder, `${name}.png`), animations: 'disabled' });
  }

  async function checkClues(destination, filename) {
    await click(destination);
    await click('이야기 읽기');
    await advanceTo('.found-list');
    await page.locator('.hot').last().waitFor();
    await capture(filename);
    const clues = await page.locator('.hot').all();
    assert.equal(clues.length, 3, `${destination} 경로의 단서가 세 개여야 합니다.`);
    await clues[0].tap();
    if (destination === '요셉' && width === 390 && height === 844) {
      await page.setViewportSize({ width: height, height: width });
      assert.equal(await page.locator('.hot').count(), 3);
      assert(await clues[0].isDisabled(), '회전 후에도 이미 찾은 단서가 표시되어야 합니다.');
      assert.equal(await next.isEnabled(), false);
      await capture('10-joseph-rotated');
    }
    for (const clue of clues.slice(1)) await clue.tap();
    assert(await next.isEnabled(), `${destination} 경로에서 단서를 모두 눌렀으나 다음 화면이 열리지 않았습니다.`);
    await next.click();
    assert.equal(await page.locator('.hot').count(), 0, '이전 그림의 단서가 새 화면에 남아 있습니다.');
  }

  try {
    await fs.mkdir(folder, { recursive: true });
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    await capture('01-title');
    await click('탐험 시작');
    await page.locator('.tier').first().click();
    await capture('02-setup');
    await click('출발 준비 완료');
    const rows = page.locator('#journey-list li:visible');
    const playable = await page.locator('#journey-list .node.play').count();
    assert.equal(await rows.count(), playable);
    await page.getByRole('button', { name: '전체 여정 보기' }).click();
    assert.equal(await rows.count(), await page.evaluate(() => BO.content.timeline.length));
    await page.getByRole('button', { name: '갈 수 있는 장면만 보기' }).click();
    assert.equal(await rows.count(), playable);
    await capture('03-timeline');
    await page.locator('.node.play').first().click();
    await page.getByRole('button', { name: '짓고 있는 성 살펴보기' }).waitFor();
    await capture('03-egypt-arrival');
    // 성벽과 중앙 건물을 실제 그림 좌표로 눌러 본다.
    const city = await page.locator('#ex00-city').evaluate(g => [[520, 555], [670, 563]].map(([x, y]) => {
      const pt = new DOMPoint(x, y).matrixTransform(g.getScreenCTM());
      return { x: pt.x, y: pt.y, canTap: !!document.elementFromPoint(pt.x, pt.y)?.closest('.look-target') };
    }));
    assert(city.every(p => p.canTap), '성벽과 중앙 건물을 모두 누를 수 있어야 한다');
    await page.touchscreen.tap(city[0].x, city[0].y);
    assert.match(await page.locator('.sheet .narr').innerText(), /새 왕/);
    await capture('04-scene');
    await advanceTo('.q-prompt');
    await capture('05-question');
    const correct = await page.evaluate(() => BO.content.scenes['EX-00'].gates.t1[0].options.find((choice) => choice.ok).label);
    await click(correct);
    await click('관문 통과');
    await click('다음');
    await capture('06-ending');
    await click('다음 목적지 정하기');
    await capture('07-route');
    await checkClues('여호수아', '08-clues');
    await click('시간표로 돌아가기');
    await click('목적지 다시 고르기');
    await checkClues('요셉', '09-joseph-clues');
    await page.setViewportSize({ width, height });
    await click('시간표로 돌아가기');
    await click('목적지 다시 고르기');
    await click('모세');
    const target = page.getByRole('button', { name: '양 떼 살펴보기', exact: true });
    await target.waitFor();
    await capture('11-horeb-arrival');
    const sheep = await page.locator('#ex01-sheep > g').evaluateAll(groups => groups.map(group => {
      const box = group.getBoundingClientRect();
      const x = box.x + box.width / 2, y = box.y + box.height / 2;
      return { x, y, canTap: document.elementFromPoint(x, y)?.classList.contains('look-target') };
    }));
    assert(sheep.length > 1 && sheep.every(animal => animal.canTap), '그림에 보이는 양을 각각 누를 수 있어야 한다');
    const animal = sheep[sheep.length - 1];
    await page.touchscreen.tap(animal.x, animal.y);
    assert.match(await page.locator('.sheet .narr').innerText(), /양 떼/);
    assert.equal(await target.count(), 0);
    await capture('12-horeb-first-discovery');
    if (width === 390 && height === 844) {
      async function flockPosition() {
        return page.locator('#ex01-sheep').evaluate(async flock => {
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          const windowBox = flock.closest('.stage').getBoundingClientRect();
          const box = flock.getBoundingClientRect();
          return [box.x - windowBox.x, box.y - windowBox.y];
        });
      }
      const portrait = await flockPosition();
      await page.setViewportSize({ width: height, height: width });
      const rotated = await flockPosition();
      await click('떨기나무 살펴보기');
      await click('이전');
      const reopened = await flockPosition();
      assert(rotated.every((coord, i) => Math.abs(coord - reopened[i]) < 1),
        '가로로 돌린 뒤에도 같은 대목을 처음 열었을 때와 양 떼의 위치가 같아야 합니다.');
      await page.setViewportSize({ width, height });
      const returned = await flockPosition();
      assert(returned.every((coord, i) => Math.abs(coord - portrait[i]) < 1),
        '세로로 돌려 놓으면 원래 양 떼의 위치로 돌아와야 합니다.');
    }
  } catch (error) {
    issues.push(error.message);
  } finally {
    await context.close();
  }
  if (issues.length) {
    console.error(`실패 · ${size}\n${[...new Set(issues)].join('\n')}`);
  } else {
    console.log(`${size} · 두 경로의 단서, 애굽의 성과 호렙의 양 떼 직접 발견 · no errors`);
  }
  return issues.length === 0;
}

(async () => {
  const browser = await chromium.launch({ proxy });
  url = (await gameOrigin(browser)) + '/index.html';
  try {
    const results = await Promise.all(sizes.map(([width, height]) => checkSize(browser, width, height)));
    if (results.includes(false)) process.exitCode = 1;
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(`화면 배치 시험을 실행하지 못했습니다. ${error.message}`);
  process.exitCode = 1;
});
