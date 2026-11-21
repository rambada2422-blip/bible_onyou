// 압도 장면의 화면, 문구, 그림 교체와 소리를 실제 호렙 산에서 확인한다.
// 사용: node tools/test/full/awe_flow.js <사진을 둘 폴더>
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '../../..');
const out = process.argv[2] || path.join(root, 'dist/check/awe-flow');
const preview = pathToFileURL(path.join(root, 'dist/preview3d.html')).href;
const design = fs.readFileSync(path.join(root, 'docs/09_떨기나무_압도장면.md'), 'utf8');
const textSection = design.split(/^## 4\. .*$/m)[1].split(/^## 5\./m)[0];
const captions = textSection.split(/\r?\n/).filter(line => /^\|\s*[45]\./.test(line))
  .map(row => row.split('|').slice(2, 6).map(value => value.trim()));
assert.equal(captions.length, 2, 'the design must contain two approved caption rows');

const tiers = ['t1', 't2', 't3'];
const viewports = [
  { width: 390, height: 844 },
  { width: 390, height: 664 },
  { width: 360, height: 560 },
  { width: 844, height: 390 }
];

async function enterAwe(page, tier) {
  await page.goto(preview);
  await page.locator('.tier').nth(tiers.indexOf(tier)).click();
  await page.getByRole('button', { name: '탐험 시작', exact: true }).click();
  await page.locator('.route-opts .btn').filter({ hasText: '모세' }).click();

  const panel = page.locator('.panel3');
  const click = (name, timeout) => panel.getByRole('button', { name, exact: true }).click({ timeout });
  await click('다음', 40000);
  if (tier === 't1') await click('다음');
  await click('출발하자');
  const quiz = await page.evaluate(tier => BO.content3d.horeb.quiz.map(item => ({
    at: item.at, correct: item.q[tier].options.find(option => option.ok).label
  })), tier);
  for (const [index, { at, correct }] of quiz.entries()) {
    await click(correct);
    await click('다음');
    await click('계속 탐험하기');
    await page.waitForFunction(() => BO3D.debug.state().state === 'explore');
    await page.evaluate(([x, z]) => BO3D.debug.goto(x, z), at);
    await page.waitForFunction(() => BO3D.debug.state().state === 'caption');
    if (index === 2) await click('다음');
    else {
      await click('계속 탐험하기');
      if (index === 0) await click('계속 탐험하기');
    }
  }
  await page.waitForFunction(() => {
    const scene = BO3D.debug.aweState();
    return scene.active && scene.ready && scene.step === 0;
  });
}

async function assertCaption(page, row, tier) {
  const cap = page.locator('.awe-cap');
  assert.equal(await cap.locator('.awe-line').textContent(), row[tiers.indexOf(tier)]);
  assert.equal(await cap.locator('.ref').textContent(), row[3]);
  assert(await cap.locator('.awe-text').evaluate(text => {
    const board = document.querySelector('.awe-board').getBoundingClientRect();
    const rockBottom = board.top + board.height * 1229 / 1536;
    return text.getBoundingClientRect().top >= rockBottom;
  }), 'caption starts below the rock where Moses stands');
}

async function assertSilence(page) {
  await page.waitForFunction(() => {
    const sound = BO3D.debug.audioLevels();
    return sound?.running === 'running' && sound.normal > 0 && !sound.muted && sound.total <= sound.normal / 100;
  }, undefined, { timeout: 5000 });
}

async function observeSwap(page) {
  // 두 프레임을 읽은 다음 실제 재생으로 넘기고, 그림이 바뀌면 다시 멈춘다.
  const frames = await page.evaluate(() => new Promise((resolve, reject) => {
    const samples = [];
    let after = 0;
    function inspect() {
      const { step } = BO3D.debug.aweState();
      const stage = document.querySelector('.awe-stage');
      const pictures = [...stage.querySelectorAll('.awe-board img')];
      const visible = pictures.map((image, index) => {
        const style = getComputedStyle(image);
        return style.visibility === 'visible' && style.opacity === '1' && image.complete && image.naturalWidth > 0 ? index + 2 : 0;
      }).filter(Boolean);
      const style = getComputedStyle(stage);
      samples.push({ step, visible, opaque: !stage.hidden && style.opacity === '1' && style.backgroundColor.startsWith('rgb(') });
      if (samples.length === 2) window.BO3D_TEST = false;
      if (step === 5) {
        window.BO3D_TEST = true;
        after++;
      }
      if (after === 3) resolve(samples);
      else if (samples.length >= 20) {
        window.BO3D_TEST = true;
        reject(new Error('the live image swap did not finish'));
      } else requestAnimationFrame(inspect);
    }
    requestAnimationFrame(inspect);
  }));
  assert(frames.filter(frame => frame.step === 4).length >= 2);
  assert.equal(frames.filter(frame => frame.step === 5).length, 3);
  for (const frame of frames) {
    assert.equal(frame.opaque, true, 'every sampled frame has an opaque picture stage');
    assert.deepEqual(frame.visible, [frame.step === 4 ? 2 : 3], 'every sampled frame has one decoded picture');
  }
}

async function compareSwapPhotos(page, shots) {
  const deltas = await page.evaluate(async pictures => {
    const board = document.querySelector('.awe-board').getBoundingClientRect();
    const cap = document.querySelector('.awe-cap').getBoundingClientRect();
    const xLeft = Math.ceil(board.left);
    const boundary = Math.floor(board.left + board.width * 719 / 1024);
    const width = Math.floor(board.right) - xLeft;
    const yTop = Math.ceil(board.top);
    const height = Math.floor(Math.min(board.bottom, cap.top)) - yTop;
    const commonWidth = boundary - xLeft;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const pixels = [];
    for (const src of pictures) {
      const image = new Image();
      image.src = 'data:image/png;base64,' + src;
      await image.decode();
      ctx.drawImage(image, xLeft, yTop, width, height, 0, 0, width, height);
      pixels.push(ctx.getImageData(0, 0, width, height).data);
    }
    const first = pixels[0];
    return pixels.map(picture => {
      let commonChanges = 0, poseChanges = 0, brightness = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const offset = (y * width + x) * 4;
          const r = picture[offset], g = picture[offset + 1], b = picture[offset + 2];
          const change = Math.max(Math.abs(r - first[offset]), Math.abs(g - first[offset + 1]), Math.abs(b - first[offset + 2]));
          brightness += 0.2126 * r + 0.7152 * g + 0.0722 * b;
          if (x < commonWidth && change > 0) commonChanges++;
          if (x >= commonWidth && change > 25) poseChanges++;
        }
      }
      return { commonChanges, poseChanges, brightness: brightness / (width * height) };
    });
  }, shots.map(shot => shot.toString('base64')));

  assert(deltas[0].brightness > 40, 'the first frame must contain the lit picture');
  assert.equal(deltas[1].poseChanges, 0, 'the second frame before the swap must still show Moses standing');
  for (const delta of deltas) {
    assert.equal(delta.commonChanges, 0, 'the decoded picture left of Moses must match pixel for pixel');
    assert(delta.brightness >= deltas[0].brightness * 0.95, 'a dark flash must not appear during the image change');
  }
  for (const delta of deltas.slice(2)) assert(delta.poseChanges > 100, 'Moses must cover his face after the swap');
  return deltas.map(delta => delta.brightness.toFixed(2)).join(' / ');
}

async function captureFlow(browser, tier, viewport, reducedMotion = 'no-preference') {
  const reduced = reducedMotion === 'reduce';
  const viewName = viewport.width + 'x' + viewport.height;
  const folder = reduced ? path.join(out, tier, 'reduced-motion') : path.join(out, tier);
  const label = tier + ' ' + viewName + (reduced ? ' reduced motion' : '');
  fs.mkdirSync(folder, { recursive: true });
  const ctx = await browser.newContext({ viewport, reducedMotion, deviceScaleFactor: 1 });
  try {
    await ctx.addInitScript(() => { window.BO3D_TEST = true; });
    const page = await ctx.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    const shot = (step, name) => page.screenshot({ path: path.join(folder, viewName + '_' + step + '_' + name + '.png') });
    const advance = async (arg, step) => {
      const scene = await page.evaluate(arg => BO3D.debug.aweNext(arg), arg);
      assert.equal(scene.step, step);
      return scene;
    };
    await enterAwe(page, tier);
    const transition = await advance(null, 1);
    assert(transition.veil > 0 && transition.veil < 1);
    assert.equal(transition.view, reduced || viewport.width > viewport.height ? 'wide' : 'near');
    await shot(1, 'transition');

    const bush = await advance(null, 2);
    assert.equal(bush.text, '');
    await shot(2, 'bush');
    const standing = await advance(null, 3);
    assert.equal(standing.view, 'wide');
    assert.equal(standing.pic, 2);
    assert.equal(standing.text, '');
    await shot(3, 'standing');

    await advance(null, 4);
    await assertCaption(page, captions[0], tier);
    await assertSilence(page);
    await shot(4, 'call');

    await advance('beforeSwap', 4);
    await assertSilence(page);
    const before = [await shot(5, 'before-swap'), await shot(5, 'before-swap-2')];
    await observeSwap(page);
    const after = [await shot(5, 'after-swap'), await shot(5, 'after-swap-2')];
    const brightness = await compareSwapPhotos(page, before.concat(after));

    await advance('afterSwap', 5);
    const hiding = await advance(null, 5);
    assert.equal(hiding.pic, 3);
    await assertCaption(page, captions[1], tier);
    await shot(5, 'hide');
    const returnScene = await advance(null, 6);
    assert(returnScene.veil > 0 && returnScene.veil < 1);
    await shot(6, 'return');
    await advance(null, null);

    await page.locator('.panel3').getByText('지켜보기 1 / 5', { exact: true }).waitFor();
    assert.equal(await page.locator('.awe3').isVisible(), false);
    assert.deepEqual(errors, [], 'browser errors');
    console.log(label, '10 photos · swap brightness ' + brightness + ' · captions and silence passed');
  } catch (error) {
    throw new Error(label + ': ' + error.message, { cause: error });
  } finally {
    await ctx.close();
  }
}

(async () => {
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const browser = await chromium.launch({ proxy, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
  try {
    for (const tier of tiers) {
      for (const viewport of viewports) await captureFlow(browser, tier, viewport);
    }
    await captureFlow(browser, 't1', viewports[0], 'reduce');
    console.log('awe_flow: 13 cases · 130 photos · no errors');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error('FAIL', error.cause?.stack || error.stack || error.message);
  console.error(error.message);
  process.exitCode = 1;
});
