// 호렙의 실제 화면을 여섯 휴대폰 크기로 돌려 단추, 스크롤과 글의 겹침을 확인한다.
// node tools/build3d.js && node tools/test/full/layout3d.js dist/check/layout3d
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const { gameOrigin, proxy } = require('../game-server');
const layoutIssues = require('../layout-issues');

const output = path.resolve(process.argv[2] || 'dist/check/layout3d');
const sizes = [[390, 844], [320, 568], [360, 560], [390, 664], [844, 390], [568, 320]];
const saveKey = 'bo3d.save.v1';

async function inspectHoreb(page) {
  const button = label => page.getByRole('button', { name: label, exact: true });
  const problems = [];
  let count = 0;

  async function capture(name) {
    const scope = await page.locator('.overlay3').isVisible() ? '.overlay3' : '#ui';
    for (const [width, height] of sizes) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.deepEqual(await page.evaluate(() => [innerWidth, innerHeight]), [width, height], '휴대폰 너비로 열려야 한다');
      const issues = await page.evaluate(layoutIssues, scope);
      if (name === 'landing') {
        const hint = await page.locator('.hint').boundingBox();
        const goal = await page.locator('.hud3 .obj').boundingBox();
        if (hint && goal && hint.x < goal.x + goal.width && goal.x < hint.x + hint.width &&
            hint.y < goal.y + goal.height && goal.y < hint.y + hint.height) issues.push('이동 안내가 탐험 목표를 덮는다');
      }
      problems.push(...issues.map(issue => width + '×' + height + ' ' + name + ' · ' + issue));
      const folder = path.join(output, width + 'x' + height);
      await fs.mkdir(folder, { recursive: true });
      await page.screenshot({ path: path.join(folder, name + '.png'), animations: 'disabled' });
      count++;
    }
  }

  async function resume(stage, parts = 3) {
    await page.evaluate(([key, saved]) => localStorage.setItem(key, JSON.stringify(saved)),
      [saveKey, { stage, parts, tier: 't1', ch: 'choeon', route: 'EX-01', dex: { sheep: '' }, clues: {}, muted: true }]);
    await page.reload();
    await button('이어서 탐험하기').tap();
  }

  async function inspectDex() {
    await page.locator('.dex3').tap();
    await capture('dex');
    await button('닫기').tap();
  }

  await capture('menu');
  await page.locator('.tier').first().tap();
  await button('탐험 시작').tap();
  await capture('route');
  await button('모세').tap();
  await page.waitForFunction(() => ['explore', 'caption'].includes(BO3D.debug.state().state));
  const firstPhoto = await page.evaluate(() => BO3D.debug.state().state === 'explore');
  if (firstPhoto) {
    await capture('landing');
    await button('샤론에게 물어보기').tap();
    await capture('introduction');
    await page.locator('summary').filter({ hasText: '샤론 소개' }).tap();
    await capture('introduction-open');
    await button('계속 탐험하기').tap();
    await inspectDex();
    await resume('horeb', 0);
  } else {
    await capture('introduction');
    await button('다음').tap();
    await button('다음').tap();
    await button('출발하자').tap();
  }

  await page.locator('[data-detector-quiz="0"]').waitFor();
  await capture('detector');
  const correct = await page.evaluate(() => BO.content3d.horeb.quiz[0].q.t1.options.find(option => option.ok).label);
  await button(correct).tap();
  if (!firstPhoto) {
    await button('다음').tap(); await button('계속 탐험하기').tap();
    await capture('landing'); await inspectDex();
  }
  await page.evaluate(() => BO3D.debug.goto(...BO.content3d.horeb.quiz[0].at));
  await page.waitForFunction(() => BO3D.debug.parts().found === 1);
  await capture('piece');

  await resume('watch');
  await page.waitForFunction(() => BO3D.debug.aweState().active && BO3D.debug.aweState().ready);
  for (let step = 0; step < 7; step++) await page.evaluate(() => BO3D.debug.aweNext());
  await page.getByText(/^지켜보기 1/).waitFor();
  await capture('watch');
  await resume('gates');
  await page.locator('.overlay3.sheet3 .q-kicker').first().waitFor();
  await capture('gates');
  await resume('end');
  await button('다른 이름으로 가 보기').waitFor();
  await capture('end');
  assert.deepEqual(problems, [], '화면 잘림 또는 겹침');
  console.log('호렙의 실제 화면 ' + count + '장 · 단추, 글자, 조작 안내 확인');
}

(async () => {
  const browser = await chromium.launch({ proxy,
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
  try {
    const url = (await gameOrigin(browser)) + '/preview3d.html';
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => { window.BO3D_TEST = true; });
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    await inspectHoreb(page);
    assert.deepEqual(errors, []);
    console.log('3D 휴대폰 배치 · no errors');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
