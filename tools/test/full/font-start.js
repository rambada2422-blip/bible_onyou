// 글꼴 서버 응답을 보류한 채 게임을 시작하고, 도착한 스타일이 뒤늦게 적용되는지 본다.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { gameOrigin, proxy } = require('../game-server');

async function startWithoutFonts(browser, url, next) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    let request;
    await page.route('https://fonts.googleapis.com/**', route => { request = route; });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.getByRole('button', { name: '탐험 시작', exact: true }).tap({ timeout: 15000 });
    assert(await next(page).isVisible(), '글꼴 응답 전에도 시작 버튼이 작동해야 한다');
    assert(request, '게임이 사용하는 글꼴 스타일 요청을 가로채야 한다');
    await request.fulfill({ contentType: 'text/css', body: ':root { --font-test-loaded: yes; }' });
    await page.waitForFunction(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--font-test-loaded').trim() === 'yes');
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
    await startWithoutFonts(browser, origin + '/index.html', setup);
    await startWithoutFonts(browser, origin + '/preview.html', setup);
    await startWithoutFonts(browser, origin + '/preview3d.html', page => page.locator('.route-opts .btn').first());
    console.log('웹·단일 파일 2D·3D 모두 외부 글꼴 응답 전에 출발, 뒤늦은 스타일 적용 · no errors');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
