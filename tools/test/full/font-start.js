// 네 진입점에서 외부 연결 없이 실제 게임 글꼴을 사용하고, 글꼴이 늦어도 출발하는지 본다.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { gameOrigin, proxy } = require('../game-server');

async function checkEntry(browser, origin, entry, next, bundled) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const external = [], files = [];
    let stylesheet;
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.protocol === 'data:') return route.continue();
      if (url.origin !== origin) {
        external.push(url.hostname);
        return route.abort();
      }
      if (url.pathname.endsWith('/fonts.css')) { stylesheet = route; return; }
      if (url.pathname.endsWith('.woff2')) files.push(url.pathname);
      return route.continue();
    });
    await page.goto(origin + entry, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: '탐험 시작', exact: true }).tap();
    assert(await next(page).isVisible(), '글꼴 응답 전에도 출발해야 한다');
    if (!bundled) {
      assert(stylesheet, '웹 원본의 글꼴 스타일 요청을 기다린다');
      const applied = page.waitForFunction(() => document.fonts.size === 4);
      await stylesheet.continue(); await applied;
    }
    const loaded = await page.evaluate(async () => {
      const faces = ['20px Jua', '20px "Gowun Dodum"', '20px "Gowun Batang"', 'bold 20px "Gowun Batang"'];
      return Promise.all(faces.map(async css => (await document.fonts.load(css, '성경탐험대')).map(f => f.status)));
    });
    assert.deepEqual(loaded, Array(4).fill(['loaded']));
    assert.equal(files.length, bundled ? 0 : 4);
    assert.deepEqual(external, []);
    console.log(entry, '실제 한글 글꼴 네 파일, 외부 요청 없음');
  } finally {
    await page.close();
  }
}

(async () => {
  const browser = await chromium.launch({ proxy,
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
  try {
    const origin = await gameOrigin(browser);
    const setup = page => page.getByRole('button', { name: '출발 준비 완료', exact: true });
    const routes = page => page.locator('.route-opts .btn').first();
    await checkEntry(browser, origin, '/index.html', setup, false);
    await checkEntry(browser, origin, '/preview.html', setup, true);
    await checkEntry(browser, origin, '/web3d/index.html', routes, false);
    await checkEntry(browser, origin, '/preview3d.html', routes, true);
    console.log('웹·단일 파일 2D·3D의 오프라인 글꼴과 출발 · no errors');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
