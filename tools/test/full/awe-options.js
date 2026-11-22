// 압도 장면의 재방문, 접근성 설정과 예외 흐름을 실제 호렙 산에서 확인한다.
// 사용: node tools/test/full/awe-options.js <사진 폴더>
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { gameOrigin, proxy } = require('../game-server');
const { photographFlock } = require('../photograph-flock');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '../../..');
const out = process.argv[2] || path.join(root, 'dist/check/awe-options');
let preview;
const seenKey = 'bo3d.awe.bush.seen';
fs.mkdirSync(out, { recursive: true });

const state = page => page.evaluate(() => BO3D.debug.aweState());
const rect = page => page.evaluate(() => BO3D.debug.aweRect());
const seen = page => page.evaluate(key => localStorage.getItem(key), seenKey);
const skip = page => page.locator('.awe3 .awe-skip');
const next = (page, step) => page.evaluate(() => BO3D.debug.aweNext()).then(result => {
  assert.equal(result.step, step);
  return result;
});

async function withPage(browser, options, test) {
  const { manual = true, storageBlocked = false, ...contextOptions } = options;
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ...contextOptions });
  try {
    await ctx.addInitScript(({ manual, storageBlocked }) => {
      window.BO3D_TEST = manual;
      if (storageBlocked) Object.defineProperty(window, 'localStorage', { get() { throw new Error('storage is blocked'); } });
    }, { manual, storageBlocked });
    const page = await ctx.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await test(page);
    assert.deepEqual(errors, []);
  } finally {
    await ctx.close();
  }
}

async function openAwe(page, { missing = false } = {}) {
  await page.goto(preview);
  const restart = page.getByRole('button', { name: '처음부터 다시', exact: true });
  if (await restart.isVisible()) await restart.click();
  assert.equal(await page.locator('.awe-board img[src]').count(), 0, 'preload begins when Horeb starts');
  if (missing) await page.evaluate(() => { BO3D.aweData.bush_3 = 'AA'; });
  await page.getByRole('button', { name: '탐험 시작', exact: true }).click();
  await page.locator('.route-opts .btn').filter({ hasText: '모세' }).click();
  const panel = page.locator('.panel3');
  const click = name => panel.getByRole('button', { name, exact: true }).click();
  await page.waitForFunction(() => BO3D.debug.state().state === 'explore');
  assert.equal(await page.locator('.awe-board img[src]').count(), 2, 'both pictures preload before the first question');
  await photographFlock(page);
  const quiz = await page.evaluate(() => BO.content3d.horeb.quiz.map(item => ({
    at: item.at, correct: item.q.t2.options.find(o => o.ok).label
  })));
  for (const [index, { at, correct }] of quiz.entries()) {
    await click(correct);
    await click('다음'); await click('계속 탐험하기');
    await page.waitForFunction(() => BO3D.debug.state().state === 'explore');
    await page.evaluate(([x, z]) => BO3D.debug.goto(x, z), at);
    await page.waitForFunction(() => BO3D.debug.state().state === 'caption');
    if (index === 2) await click('다음');
    else {
      await click('계속 탐험하기');
      if (index === 0) await click('계속 탐험하기');
    }
  }
  await page.waitForFunction(() => BO3D.debug.aweState().active);
  if (!missing) await page.waitForFunction(() => BO3D.debug.aweState().ready);
}

async function watching(page) {
  await page.locator('.panel3 .q-kicker').getByText('지켜보기 1 / 5', { exact: true }).waitFor();
  assert.equal((await state(page)).active, false);
  assert.equal(await page.locator('.awe3').isVisible(), false);
  assert.equal(await page.locator('.cam3').isVisible(), true);
  assert.equal(await page.evaluate(() => BO3D.debug.audioLevels().held), false);
}

async function setHidden(page, hidden) {
  return page.evaluate(async hidden => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: hidden });
    document.dispatchEvent(new Event('visibilitychange'));
    if (hidden) return;
    // 복귀 때 0.5초 동안만 소리가 난다. 렌더러와 시험 도구를 왕복하기 전에 측정한다.
    const started = performance.now();
    while (BO3D.debug.audioLevels().scene === 0 && performance.now() - started < 500) {
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    return BO3D.debug.audioLevels().scene;
  }, hidden);
}

async function firstAndRepeat(page) {
  await openAwe(page);
  assert.equal(await skip(page).isVisible(), false);
  assert.equal(await seen(page), null);
  await page.mouse.click(48, 48);
  assert.equal((await state(page)).step, 0, 'a tap does not skip the first viewing');
  assert.equal((await next(page, 1)).view, 'near');
  for (const step of [2, 3, 4]) await next(page, step);
  assert.equal((await state(page)).t, 4);
  await setHidden(page, true);
  assert.equal((await state(page)).paused, true);
  assert.equal(await page.evaluate(() => BO3D.debug.audioLevels().scene), 0);
  assert.equal(await page.evaluate(() => BO3D.debug.aweNext()), null);
  const resumedGain = await setHidden(page, false);
  const resumed = await state(page);
  assert.equal(resumed.paused, false);
  assert.equal(resumed.step, 4);
  assert.equal(resumed.t, 0);
  assert.equal(resumed.text, '');
  assert(resumedGain > 0, 'audio restarts from the beginning of the step');
  await next(page, 5);
  assert.equal(await seen(page), null);
  assert.equal(await skip(page).isVisible(), false);
  await next(page, 6);
  assert.equal(await seen(page), '1', 'mark seen when the return starts');
  await next(page, null);
  await watching(page);

  await openAwe(page);
  assert.equal(await skip(page).innerText(), '건너뛰기');
  assert.equal(await skip(page).isVisible(), true);
  await page.screenshot({ path: path.join(out, 'repeat-skip.png') });
  await page.evaluate(() => { window.BO3D_TEST = false; });
  await skip(page).click();
  assert.equal((await state(page)).step, 6);
  assert.equal((await state(page)).text, '', 'skipping from the opening must not show the final caption');
  await watching(page);
  console.log('first visit, local seen record, pause/resume and repeat skip passed');
}

async function checkSkySeam(page, box, png) {
  const jump = await page.evaluate(async ({ box, data }) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + data;
    await img.decode();
    const cv = document.createElement('canvas');
    cv.width = img.width;
    cv.height = img.height;
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const y = Math.ceil(box.top);
    const width = Math.floor(box.width) - 8;
    const pixels = ctx.getImageData(Math.ceil(box.left) + 4, y - 1, width, 2).data;
    let difference = 0;
    for (let i = 0; i < width * 4; i += 4) {
      for (let c = 0; c < 3; c++) difference += Math.abs(pixels[i + c] - pixels[width * 4 + i + c]);
    }
    return difference / (3 * width);
  }, { box, data: png.toString('base64') });
  assert(jump < 1.5, 'the sky and the first picture row should meet without a visible seam: ' + jump);
  console.log('sky seam average RGB change:', jump.toFixed(2));
}

async function stillView(page, label) {
  await openAwe(page);
  const first = await next(page, 1);
  assert.equal(first.view, 'wide');
  assert.equal(first.pic, 2);
  const firstRect = await rect(page);
  assert.equal(firstRect.x0, 0);
  assert.equal(firstRect.x1, 1024);
  assert(firstRect.y1 >= 1299, 'picture should show Moses above the caption');
  await next(page, 2);
  assert.deepEqual(await rect(page), firstRect);
  await next(page, 3);
  assert.deepEqual(await rect(page), firstRect, 'no pan or zoom during the 5 + 6 second hold');
  const png = await page.screenshot({ path: path.join(out, label + '-standing.png') });
  if (firstRect.skyH > 0) await checkSkySeam(page, firstRect, png);
  const call = await next(page, 4);
  assert.equal(call.pic, 2);
  assert(call.ref && call.text);
  const hide = await next(page, 5);
  assert.equal(hide.pic, 3);
  assert(hide.ref && hide.text);
  await page.screenshot({ path: path.join(out, label + '-hiding.png') });
  await next(page, 6);
  await next(page, null);
  await watching(page);
  console.log(label, 'wide view and full sequence passed');
}

async function noPicture(page) {
  await openAwe(page, { missing: true });
  assert.equal(await skip(page).isVisible(), false);
  await page.waitForFunction(() => {
    const s = BO3D.debug.aweState();
    return s.step === 0 && s.t >= 5.5;
  });
  assert.equal((await state(page)).ready, false);
  assert.equal(await page.locator('.awe-stage').isVisible(), false);
  await watching(page);
  assert.equal(await seen(page), null, 'loading timeout must not mark the scene seen');
  await page.screenshot({ path: path.join(out, 'missing-picture-watching.png') });
  console.log('missing picture waits and then opens watching without a seen record');
}

(async () => {
  const browser = await chromium.launch({ proxy, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
  preview = (await gameOrigin(browser)) + '/preview3d.html';
  try {
    await withPage(browser, {}, firstAndRepeat);
    await withPage(browser, { reducedMotion: 'reduce' }, page => stillView(page, 'reduced-motion'));
    await withPage(browser, { viewport: { width: 844, height: 390 }, storageBlocked: true }, page => stillView(page, 'landscape'));
    await withPage(browser, { manual: false }, noPicture);
    console.log('awe-options no errors');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error('FAIL', error.stack || error.message);
  process.exitCode = 1;
});
