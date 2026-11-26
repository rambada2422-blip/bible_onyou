// 2D 떨기나무 이야기에서 '다음' 대신 그림의 떨기나무를 눌러 출 3:2-3 대목을 여는 곳 (출 3:3, 모세가 돌이켜 가서 봄)을 시험한다.
// node tools/build.js && node tools/test/full/look-beats2d.js [화면 사진 폴더]
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const { chromium } = require('playwright');
const { gameOrigin, proxy } = require('../game-server');
const layoutIssues = require('../layout-issues');
const { passFindWords } = require('../find-words2d');

const out = path.resolve(process.argv[2] || 'dist/check/look-beats2d');
const key = 'bo_demo_v1';

async function openBeat(page, origin, entry, tier, step) {
  await page.goto(origin + entry);
  await page.evaluate(([key, tier, step]) => localStorage.setItem(key, JSON.stringify({
    v: 1, tier, char: 'choeon', done: {}, cards: [], notes: {}, routed: true, journey: { id: 'EX-01', tier, step }
  })), [key, tier, step]);
  await page.reload();
  await page.getByRole('button', { name: '이어서 탐험하기', exact: true }).click();
  await page.locator('.narr').waitFor();
  await page.waitForTimeout(1400); // 그림이 대목의 자리로 당겨지는 시간
}

// 찾을 곳이 화면 안에서 손가락으로 누를 만큼 보이고, 그려진 자리와 겹치는지 본다.
async function targetCheck(page, drawing) {
  return page.evaluate((drawing) => {
    const target = document.querySelector('.hot-layer .look-target');
    const stage = document.querySelector('.stage').getBoundingClientRect();
    const box = target.getBoundingClientRect();
    const w = Math.min(box.right, stage.right, innerWidth) - Math.max(box.left, stage.left, 0);
    const h = Math.min(box.bottom, stage.bottom) - Math.max(box.top, stage.top, 0);
    let hit = null;
    if (drawing) {
      const d = document.querySelector(drawing).getBoundingClientRect();
      const x = Math.min(Math.max(d.left + d.width / 2, stage.left + 4), Math.min(stage.right, innerWidth) - 4);
      const y = Math.min(Math.max(d.top + d.height / 2, stage.top + 4), stage.bottom - 4);
      hit = document.elementFromPoint(x, y) === target;
    }
    return { w, h, hit, label: target.getAttribute('aria-label') };
  }, drawing);
}

async function play(browser, origin, entry, tier, size, label) {
  const [width, height] = size;
  const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  try {
    const beats = await (async () => { await page.goto(origin + entry); return page.evaluate(() => BO.content.scenes['EX-01'].beats); })();
    const looks = beats.map((beat, i) => (beat.look ? i : -1)).filter((i) => i > 0);
    assert.deepEqual(looks, [1], '그림을 눌러 여는 대목은 출 3:2-3 하나다');
    assert.equal(beats[1].focus, 'bush', '성경 인물이 아니라 떨기나무를 찾는다');
    const shot = async (name) => {
      const issues = await page.evaluate(layoutIssues, '#app > .screen');
      assert.deepEqual(issues, [], `${label} ${name} 화면 배치`);
      await page.screenshot({ path: path.join(out, `${label}-${name}.png`) });
    };
    const footButtons = () => page.locator('.sheet-foot button').allInnerTexts();

    // 첫 대목: '다음'이 없고, 찾을 것이 아래 단추 자리에 적혀 있다.
    await openBeat(page, origin, entry, tier, 'beat-0');
    assert.equal(await page.locator('.sheet-foot .btn.onpaper').count(), 0, '그림을 찾을 대목에는 다음 단추가 없다');
    assert.deepEqual((await footButtons()).map((t) => t.trim()), [beats[1].look]);
    const bush = await targetCheck(page, '#ex01-bush');
    assert.equal(bush.label, '떨기나무 살펴보기');
    assert(bush.w >= 44 && bush.h >= 44, `떨기나무를 누를 자리가 작다 ${bush.w}×${bush.h}`);
    if (width >= height) assert(bush.w >= 44, '가로 화면에서도 떨기나무를 누를 수 있다');
    else assert.equal(bush.hit, true, '당겨진 그림의 떨기나무 자리를 누르면 찾을 곳이 눌린다');
    await shot('01-beat0');

    // 엉뚱한 곳을 누르면 대목은 그대로이고 찾을 곳에 고리가 뜬다.
    const stage = await page.locator('.stage').boundingBox();
    await page.touchscreen.tap(stage.x + 12, stage.y + stage.height - 40);
    await page.locator('.hot-layer .look-target.nudge').waitFor();
    assert.equal(await page.locator('.narr').innerText(), beats[0].text[tier]);
    await shot('02-nudge');

    // 아래 단추를 누르면 고리가 뜨고 초점이 그림의 찾을 곳으로 간다 (키보드로 이어 갈 수 있다).
    await page.evaluate(() => document.querySelector('.hot-layer .look-target').classList.remove('nudge'));
    await page.locator('.sheet-foot .look-help').focus();
    await page.keyboard.press('Enter');
    await page.locator('.hot-layer .look-target.nudge').waitFor();
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), '떨기나무 살펴보기');
    await page.keyboard.press('Enter');
    await page.locator('.narr', { hasText: beats[1].text[tier] }).waitFor();
    assert.equal(await page.locator('.hot-layer .look-target').count(), 0, '다음 대목에는 찾을 곳이 남지 않는다');

    // '이전'으로 돌아오면 다시 찾게 한다. 이번에는 손가락으로 떨기나무를 누른다.
    await page.getByRole('button', { name: '이전', exact: true }).click();
    await page.locator('.sheet-foot .look-help').waitFor();
    await page.waitForTimeout(1400);
    await page.getByRole('button', { name: '떨기나무 살펴보기', exact: true }).tap();
    await page.locator('.narr', { hasText: beats[1].text[tier] }).waitFor();

    // 관문까지 아래 단추를 이어서 누르는 횟수를 센다. 8~10세는 글에서 찾기 대목 (출 3:5, 3:6, 3:10-12)에서 끊긴다.
    let run = 0, longest = 0, guard = 0, finds = 0;
    while (guard++ < 20) {
      // 하나님이 말씀하시는 대목 (출 3:4-12)은 그림을 눌러 열지 않는다.
      assert.equal(await page.locator('.sheet-foot .look-help').count(), 0, '말씀 대목에서 그림 찾기가 나오면 안 된다');
      if (guard === 3) await shot('03-beat2');
      if (await page.locator('.narr.findtext').count()) {
        assert.equal(await page.locator('.sheet-foot .btn.onpaper').count(), 0, '글에서 찾기 대목에는 다음 단추가 없다');
        finds += await passFindWords(page);
        run = 0;
        continue;
      }
      const next = page.locator('.sheet-foot .btn.onpaper');
      const text = (await next.innerText()).trim();
      await next.click();
      longest = Math.max(longest, ++run);
      if (text === '다음으로 가는 관문') break;
      await page.locator('.narr').waitFor();
    }
    await page.locator('.q-kicker', { hasText: '다음으로 가는 관문 1' }).waitFor();
    const expected = tier === 't1' ? { longest: 2, finds: 3 } : { longest: 6, finds: 0 };
    assert.equal(finds, expected.finds, `글에서 찾기 대목 ${finds}개`);
    assert.equal(longest, expected.longest, `떨기나무를 찾은 뒤 관문까지 아래 단추를 이어 누른 횟수 ${longest}번`);
    assert.deepEqual(errors, []);
    return `${label} · 떨기나무를 그림에서 찾아 관문까지 (떨기나무 뒤 아래 단추를 이어 누른 횟수 최대 ${longest}번, 글에서 찾기 ${finds}곳)`;
  } finally {
    await page.close();
  }
}

(async () => {
  await fs.mkdir(out, { recursive: true });
  const browser = await chromium.launch({ proxy });
  try {
    const origin = await gameOrigin(browser);
    const runs = [
      ['/web/index.html', 't1', [390, 844], 't1-390x844'],
      ['/web/index.html', 't2', [390, 844], 't2-390x844'],
      ['/web/index.html', 't3', [390, 844], 't3-390x844'],
      ['/web/index.html', 't1', [320, 568], 't1-320x568'],
      ['/web/index.html', 't1', [568, 320], 't1-568x320'],
      ['/web/index.html', 't2', [844, 390], 't2-844x390'],
      ['/preview.html', 't1', [390, 844], 'preview-t1-390x844']
    ];
    for (const [entry, tier, size, label] of runs) console.log(await play(browser, origin, entry, tier, size, label));
    console.log('그림을 눌러 여는 떨기나무 이야기 · no errors');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
