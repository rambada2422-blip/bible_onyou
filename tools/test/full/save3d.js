// 호렙의 첫 부품을 실제로 얻은 다음 다시 열어 복원한다. 그 저장으로 나머지 구간과 예외도 확인한다.
const { chromium } = require('playwright');
const { gameOrigin, proxy } = require('../game-server');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const out = process.argv[2] || path.resolve('dist/check/save3d');
const key = 'bo3d.save.v1';

async function checkJourney(page, url) {
  const button = name => page.getByRole('button', { name, exact: true });
  const state = desired => page.waitForFunction(value => BO3D.debug.state().state === value, desired);
  const snapshot = () => page.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
  const resume = async () => { await page.reload(); await button('이어서 탐험하기').click(); };
  await page.goto(url);
  await page.locator('.char').last().click();
  await button('탐험 시작').click();
  await page.locator('.route-opts .btn').filter({ hasText: '모세' }).click();
  await page.waitForFunction(() => ['caption', 'explore'].includes(BO3D.debug.state().state));
  async function sheepPhoto() {
    await page.evaluate(() => {
      const [x, z] = BO3D.world.P.flock;
      BO3D.debug.goto(x + 6, z + 6); BO3D.debug.yaw(-3 * Math.PI / 4);
    });
    await page.waitForTimeout(2200);
    await button('사진 찍기').click();
    await page.waitForFunction(() => BO3D.debug.dex().includes('sheep'));
  }
  // 기존 호렙 소개와 사진부터 시작하는 통합 검토본 모두 같은 첫 부품을 얻는다.
  if (await page.evaluate(() => BO3D.debug.state().state === 'caption')) {
    await button('다음').click(); await button('출발하자').click();
  } else await sheepPhoto();
  await page.locator('[data-detector-quiz="0"]').waitFor();
  const first = await page.evaluate(() => BO.content3d.horeb.quiz[0]);
  await button(first.q.t2.options.find(o => o.ok).label).click();
  if (await button('다음').isVisible()) { await button('다음').click(); await button('계속 탐험하기').click(); }
  await state('explore');
  if (!(await page.evaluate(() => BO3D.debug.dex())).includes('sheep')) await sheepPhoto();
  await button('소리 끄기').click();
  await page.evaluate(([x, z]) => BO3D.debug.goto(x, z), first.at);
  await page.waitForFunction(k => JSON.parse(localStorage.getItem(k)).parts === 1, key);
  const firstPart = await snapshot();
  assert.equal(firstPart.route, 'EX-01'); assert.equal(firstPart.ch, 'onwoo'); assert.equal(firstPart.tier, 't2');
  assert.equal(firstPart.muted, true); assert.match(firstPart.dex.sheep, /^data:image\/jpeg;base64,/);
  await page.reload(); await button('이어서 탐험하기').waitFor();
  await page.screenshot({ path: path.join(out, 'resume.png') });
  await button('이어서 탐험하기').click();
  await page.locator('[data-detector-quiz="1"]').waitFor();
  assert.equal(await page.evaluate(() => BO3D.debug.parts().found), 1);
  assert.equal(await button('소리 켜기').getAttribute('aria-pressed'), 'true');
  assert.equal((await snapshot()).dex.sheep, firstPart.dex.sheep);
  await page.screenshot({ path: path.join(out, 'next-part.png') });
  console.log('첫 부품, 사진, 인물, 나이 단계, 음소거 복원');

  for (const [stage, expected] of [['watch', 'event'], ['gates', 'gates'], ['reward', 'end'], ['free', 'free'], ['end', 'end2']]) {
    await page.evaluate(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [key, { ...firstPart, stage, parts: 3 }]);
    await resume(); await state(expected);
    assert.equal(await page.evaluate(() => BO3D.debug.parts().found), 3);
    if (stage === 'watch') assert(await page.evaluate(() => BO3D.debug.aweState().active));
  }
  await button('처음부터 다시').click();
  assert.equal(await snapshot(), null);
  await button('탐험 시작').click(); await page.locator('.route-opts .btn').filter({ hasText: '여호수아' }).click();
  await button('둘러보자').click();
  await page.evaluate(() => {
    const mark = BO3D.debug.jordan().targets.find(([id]) => id === 'ark');
    BO3D.debug.goto(mark[1] + 5, mark[3] + 5); BO3D.debug.yaw(-3 * Math.PI / 4);
  });
  await page.waitForTimeout(2200); await button('사진 찍기').click();
  await page.waitForFunction(() => BO3D.debug.clues().includes('ark'));
  const jordan = await snapshot();
  assert.equal(jordan.route, 'ALT-02'); assert.equal(jordan.stage, 'jordan'); assert.equal(Object.keys(jordan.dex).length, 0);
  await resume(); await state('explore');
  assert.equal(await page.evaluate(() => BO3D.debug.level()), 'jordan');
  assert((await page.evaluate(() => BO3D.debug.clues())).includes('ark'));
  await page.locator('.dex3').click();
  assert(await page.locator('.dexcell img').first().isVisible());
  await button('닫기').click();
  // 수첩에 모은 단서가 충분할 때 추리와 그 결과도 해당 구간부터 열린다.
  const clueIds = await page.evaluate(() => BO.content3d.jordan.clues.map(c => c.id));
  const allClues = Object.fromEntries(clueIds.map(id => [id, jordan.clues.ark]));
  for (const [stage, title] of [['deduce', '추리 1 /'], ['return', '추리 결과']]) {
    await page.evaluate(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [key, { ...jordan, stage, clues: allClues }]);
    await resume(); await page.locator('.overlay3 .q-kicker').filter({ hasText: title }).waitFor();
    assert.equal((await snapshot()).stage, stage);
  }
  console.log('다섯 호렙 구간, 요단 강 수첩·추리·결과 복원, 처음부터 다시');

  await page.evaluate(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [key, firstPart]);
  await resume();
  await page.evaluate(() => {
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, data) {
      if (data.includes('data:image/jpeg')) throw new DOMException('full', 'QuotaExceededError');
      return write.call(this, k, data);
    };
  });
  await button('소리 켜기').click();
  const compact = await snapshot();
  assert.equal(compact.dex.sheep, ''); assert.equal(compact.parts, 1); assert.equal(compact.muted, false);
  await page.evaluate(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [key, { ...compact, stage: 'route', parts: 0 }]);
  await button('소리 끄기').click();
  assert.equal((await snapshot()).stage, 'route', '다른 탭의 새 진행을 이전 탭이 덮지 않는다');
  console.log('저장 공간 부족 시 진행 유지, 오래된 탭의 덮어쓰기 방지');

  await page.evaluate(k => localStorage.setItem(k, '{'), key);
  await page.reload(); await button('탐험 시작').waitFor();
  assert.equal(await button('이어서 탐험하기').count(), 0);
  await page.evaluate(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [key, { ...firstPart, stage: 'gates', parts: 1 }]);
  await page.reload(); await button('탐험 시작').waitFor();
  assert.equal(await button('이어서 탐험하기').count(), 0);
  console.log('깨진 저장과 맞지 않는 구간은 새 게임으로 시작');
}

(async () => {
  await fs.mkdir(out, { recursive: true });
  const browser = await chromium.launch({ proxy, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl'] });
  try {
    const url = await gameOrigin(browser) + '/preview3d.html';
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await checkJourney(page, url);
    await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }));
    await page.reload(); await page.getByRole('button', { name: '탐험 시작', exact: true }).click();
    await page.locator('.route-opts .btn').filter({ hasText: '모세' }).click();
    await page.waitForFunction(() => ['caption', 'explore'].includes(BO3D.debug.state().state));
    assert.deepEqual(errors, []);
    console.log('저장 차단 환경에서도 탐험 · no errors');
  } finally { await browser.close(); }
})().catch(e => { console.error('FAIL', e); process.exitCode = 1; });
