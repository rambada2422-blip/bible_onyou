// 3D를 지원하지 않는 Chromium에서 안내와 기존 탐험 기록을 확인한다.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const { gameOrigin, proxy } = require('../game-server');

async function run(output) {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ proxy, args: ['--disable-webgl'] });
  try {
    const origin = await gameOrigin(browser);
    const page = await browser.newPage({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
    page.setDefaultTimeout(12000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // 기기의 기본 글꼴만으로도 안내가 보여야 한다.
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
    await page.goto(origin + '/preview.html');
    await page.getByRole('button', { name: '탐험 시작', exact: true }).tap();
    await page.getByRole('heading', { name: '몇 살 탐험대인가요?' }).waitFor();
    const saved = JSON.stringify({ stage: 'horeb', tier: 't1', ch: 'choeon', route: 'EX-01', parts: 1, dex: {}, clues: {}, muted: true });
    await page.evaluate(value => localStorage.setItem('bo3d.save.v1', value), saved);
    await page.goto(origin + '/preview3d.html');
    const title = '이 기기에서는 3D 탐험을 열 수 없어요';
    const body = '다른 휴대폰이나 컴퓨터에서 다시 열어 주세요.';
    const notice = page.getByRole('main', { name: title });
    for (const [width, height] of [[320, 568], [844, 390]]) {
      await page.setViewportSize({ width, height });
      await page.getByRole('heading', { level: 1, name: title }).waitFor();
      assert.equal(await notice.locator('p').innerText(), body);
      assert.equal((await page.locator('body').innerText()).replace(/\s+/g, ' ').trim(), title + ' ' + body);
      assert.equal(await page.locator('canvas').isVisible(), false);
      assert.equal(await page.getByRole('button').count(), 0);
      for (const item of await notice.locator('h1, p').all()) {
        const box = await item.boundingBox();
        assert(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= width + 1 && box.y + box.height <= height + 1);
      }
      await page.screenshot({ path: path.join(output, width + 'x' + height + '.png') });
    }
    // 브라우저가 null을 반환하는 경우 외에 드라이버가 예외를 던질 때도 같은 문구로 끝난다.
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        if (type.includes('webgl')) throw new Error('3D 장치 사용할 수 없음');
        return original.call(this, type, ...args);
      };
    });
    await page.reload();
    await notice.waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('bo3d.save.v1')), saved);
    assert.deepEqual(errors, []);
    console.log('통과 · WebGL 미지원 세로·가로, 장치 예외, 3D 저장 보존, 같은 기기에서 2D 시작');
  } finally { await browser.close(); }
}

if (!process.argv[2]) {
  console.error('첫 번째 인자로 화면 사진을 저장할 폴더를 지정하세요.');
  process.exitCode = 1;
} else {
  run(path.resolve(process.argv[2])).catch(error => { console.error(error); process.exitCode = 1; });
}
