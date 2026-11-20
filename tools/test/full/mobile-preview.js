// 두 단일 파일을 휴대폰 브라우저로 열어 배율과 실제 플레이 입력을 확인한다.
// node tools/build.js && node tools/build3d.js && node tools/test/full/mobile-preview.js
const assert = require('node:assert/strict');
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
    assert.deepEqual(errors, []);
    console.log('2D·3D 휴대폰 미리보기, 도감과 창 전환 입력 · no errors');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
