// 두 단일 파일을 휴대폰 브라우저로 열어 배율과 실제 플레이 입력을 확인한다.
// node tools/build.js && node tools/build3d.js && node tools/test/full/mobile-preview.js
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const { chromium } = require('playwright');
const { gameOrigin, proxy } = require('../game-server');

function waitFrames(page, frames) {
  return page.evaluate(count => new Promise(resolve => {
    function frame() {
      if (--count === 0) resolve();
      else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }), frames);
}

async function walkToFirstPhoto(page, output) {
  const frame = page.locator('.photo-focus3');
  const camera = page.getByRole('button', { name: '사진 찍기' });
  assert(await frame.isHidden(), '출발 자리에서는 아직 촬영 거리가 아니다');
  const surface = await page.locator('.touch3').boundingBox();
  const finger = { x: surface.x + surface.width * 0.24, y: surface.y + surface.height * 0.8 };
  const session = await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [finger] });
  try {
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: finger.x, y: finger.y - 60 }] });
    await frame.waitFor({ state: 'visible', timeout: 60000 });
  } finally {
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await session.detach();
  }
  assert.match(await camera.getAttribute('aria-description'), /화면에 들어왔어요/);
  await page.screenshot({ path: path.join(output, 'flock-' + page.viewportSize().width + '.png') });
  await page.locator('.dex3').tap();
  await frame.waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: '닫기' }).tap();
  await frame.waitFor({ state: 'visible' });
  await camera.tap();
  await page.locator('[data-detector-quiz="0"]').waitFor();
  await frame.waitFor({ state: 'hidden' });
  assert((await page.evaluate(() => BO3D.debug.dex())).includes('sheep'));
}

async function checkControls(page) {
  const position = () => page.evaluate(() => {
    const { x, z } = BO3D.debug.state();
    return [x, z];
  });
  await page.getByRole('button', { name: '탐험 시작', exact: true }).tap();
  await page.locator('.route-opts .btn').filter({ hasText: '모세' }).tap();
  await page.waitForFunction(() => BO3D.debug.state().state === 'explore');
  await page.locator('.dex3').tap();
  await page.getByRole('button', { name: '닫기' }).waitFor();
  const opened = await position();
  await page.keyboard.down('ArrowUp');
  await waitFrames(page, 6);
  assert.deepEqual(await position(), opened, '도감을 읽는 중에는 주인공이 걷지 않는다');
  await page.getByRole('button', { name: '닫기' }).tap();
  await waitFrames(page, 4);
  assert.deepEqual(await position(), opened, '도감에서 누른 키는 탐험으로 이어지지 않는다');
  await page.keyboard.up('ArrowUp');
  await page.keyboard.down('ArrowUp');
  await waitFrames(page, 5);
  assert.notDeepEqual(await position(), opened, '도감을 닫은 뒤 다시 눌러 걸을 수 있다');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const paused = await position();
  await waitFrames(page, 6);
  assert.deepEqual(await position(), paused, '창을 떠나면 눌린 방향키가 풀린다');
  await page.keyboard.up('ArrowUp');
}

(async () => {
  const output = path.resolve(process.argv[2] || 'dist/check/mobile-preview');
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ proxy,
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
  try {
    const origin = await gameOrigin(browser);
    const page = await browser.newPage({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    for (const name of ['preview.html', 'preview3d.html']) {
      await page.goto(origin + '/' + name);
      await page.evaluate(() => document.fonts.ready);
      assert.deepEqual(await page.evaluate(() => [innerWidth, innerHeight, visualViewport.scale, document.documentElement.lang]),
        [320, 568, 1, 'ko'], name + '이 휴대폰 크기와 한국어 문서 설정을 유지해야 한다');
      if (name === 'preview.html') await page.getByRole('button', { name: '탐험 시작', exact: true }).tap();
      else await checkControls(page);
    }
    await walkToFirstPhoto(page, output);
    await page.setViewportSize({ width: 844, height: 390 });
    await page.reload();
    await page.getByRole('button', { name: '처음부터 다시', exact: true }).tap();
    await page.getByRole('button', { name: '탐험 시작', exact: true }).tap();
    await page.locator('.route-opts .btn').filter({ hasText: '모세' }).tap();
    await page.waitForFunction(() => BO3D.debug.state().state === 'explore');
    await walkToFirstPhoto(page, output);
    assert.deepEqual(errors, []);
    console.log('2D·3D 휴대폰 미리보기, 도감과 창 전환 입력, 세로·가로에서 직접 걸어 첫 촬영 · no errors');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
