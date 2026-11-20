// 휴대폰의 장절 입력과 키보드 제출을 실제 호렙 관문에서 확인한다.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const { gameOrigin, proxy } = require('../game-server');

async function checkGate(browser, origin, file, three, output) {
  const page = await browser.newPage({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  page.setDefaultTimeout(30000);
  try {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + file);
    await page.evaluate(three => {
      const save = three
        ? { stage: 'gates', tier: 't3', ch: 'onwoo', route: 'EX-01', parts: 3, dex: {}, clues: {}, muted: true }
        : { v: 1, tier: 't3', char: 'onwoo', routed: true, done: {}, cards: [], notes: {}, journey: { id: 'EX-01', tier: 't3', step: 'gate-0' } };
      localStorage.setItem(three ? 'bo3d.save.v1' : 'bo_demo_v1', JSON.stringify(save));
    }, three);
    await page.reload();
    const button = name => page.getByRole('button', { name, exact: true });
    await button('이어서 탐험하기').tap();
    const chapter = page.getByRole('textbox', { name: '장', exact: true });
    const verse = page.getByRole('textbox', { name: '절', exact: true });
    const next = button('다음 관문');

    await button('확인').tap();
    await page.getByText('장과 절을 숫자로 적어 주세요.').waitFor();
    assert(await chapter.evaluate(field => field === document.activeElement));
    await chapter.fill('3-4');
    await verse.fill('12a');
    await button('확인').tap();
    assert(await next.isDisabled(), '문자가 섞인 답을 맞았다고 처리했습니다.');
    await page.getByText('장과 절을 숫자로 적어 주세요.').waitFor();
    await chapter.fill('3');
    await chapter.press('Enter');
    assert(await verse.evaluate(field => field === document.activeElement), '장 입력 후 절 입력칸으로 이동해야 합니다.');
    await verse.fill('11');
    await verse.press('Enter');
    await page.getByText('그 절에는 다른 내용이 적혀 있어요.').waitFor();
    assert(await next.isDisabled());

    await chapter.fill('３장');
    await verse.fill('１２절');
    await verse.press('Enter');
    await page.getByText('맞게 찾았어요. 출애굽기 3장 12절.', { exact: true }).waitFor();
    assert(await next.isEnabled());
    assert(await button('확인').isDisabled());
    await page.screenshot({ path: path.join(output, file.split('/').filter(Boolean).join('-') + '.png') });
    await next.tap();
    await page.getByText('그 절에서 하나님이 모세에게 가장 먼저 하신 대답은 무엇인가?').waitFor();
    assert.deepEqual(errors, []);
    console.log('통과 · ' + file + ' · 잘못된 입력, 다음 칸, 정답 제출, 다음 관문');
  } finally { await page.close(); }
}

(async () => {
  const output = path.resolve(process.argv[2] || 'dist/check/verse-input');
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ proxy, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl'] });
  try {
    const origin = await gameOrigin(browser);
    for (const [file, three] of [['/web/index.html', false], ['/preview.html', false], ['/web3d/index.html', true], ['/preview3d.html', true]]) {
      await checkGate(browser, origin, file, three, output);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
