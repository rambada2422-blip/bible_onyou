// 재앙과 유월절의 순서, 중단 지점, 기록에서 돌아가는 길을 실제 화면에서 확인한다.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const { gameOrigin, proxy } = require('../game-server');
const layoutIssues = require('../layout-issues');
const names = ['물이 피가 됨', '개구리', '이', '파리', '가축의 돌림병', '악성 종기', '우박', '메뚜기', '흑암'];
const output = path.resolve('dist/passover-proof');

async function play(browser, url, age) {
  const sizes = [[390,844], [568,320], [320,568]];
  const [width,height] = sizes[age];
  const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  try {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const button = name => page.getByRole('button', { name, exact: true });
    const tap = name => button(name).tap();
    const checkArt = () => page.locator('.po-land img').evaluate(async img => { await img.decode(); return img.naturalWidth > 0; });
    async function resume() { await page.reload(); await tap('이어서 탐험하기'); }
    await page.goto(url);
    await tap('탐험 시작');
    await page.locator('.tier').nth(age).tap();
    await tap('출발 준비 완료');
    await tap('열 가지 재앙과 유월절 · 감수용 미리보기');
    assert(await checkArt());
    for (const [i, name] of names.entries()) {
      assert.equal(await page.locator('.po-body h3').innerText(), (i+1) + '번째 재앙 · ' + name);
      const places = {0:['강물','강가'], 3:['애굽의 집','고센 땅'], 8:['애굽 땅','이스라엘 자손이 사는 곳']}[i];
      const next = button(i === 8 ? '유월절을 준비하는 집으로' : '다음 재앙 살펴보기');
      if (places) {
        assert(await next.isDisabled());
        const [first, second] = age % 2 ? places.slice().reverse() : places;
        await tap(first);
        const firstView = await page.locator('.po-land').getAttribute('data-view');
        assert(await next.isDisabled());
        await resume();
        assert.equal(await button('✓ '+first).getAttribute('aria-pressed'), 'true');
        assert.equal(await page.locator('.po-detail b').innerText(), first);
        await tap('✓ '+first);
        assert(await next.isDisabled());
        await tap(second);
        assert.notEqual(await page.locator('.po-land').getAttribute('data-view'), firstView);
        assert(await checkArt());
        assert.deepEqual(await page.evaluate(layoutIssues, '.po-screen'), []);
        if (age === 0 && i === 8) {
          await tap('✓ 애굽 땅');
          await page.screenshot({path:path.join(output,'dark.png')});
          await tap('✓ 이스라엘 자손이 사는 곳');
          await page.screenshot({path:path.join(output,'light.png')});
        }
      } else {
        assert.equal(await page.locator('.po-spots').count(), 0);
        if (i === 5) await resume();
        assert(await checkArt());
      }
      assert(await next.isEnabled());
      await tap(i === 8 ? '유월절을 준비하는 집으로' : '다음 재앙 살펴보기');
    }
    assert(await checkArt());
    await tap('식탁');
    await resume();
    assert(await button('✓ 식탁').isVisible());
    assert(await button('그 밤의 기록으로').isDisabled());
    await tap('떠날 차림');
    await tap('문');
    assert.deepEqual(await page.evaluate(layoutIssues, '.po-screen'), []);
    if (age === 0) await page.screenshot({ path:path.join(output,'preparation.png') });
    await tap('그 밤의 기록으로');
    assert(await checkArt());
    assert.equal(await page.locator('.po-body h3').innerText(), '열 번째 재앙');
    await tap('바로의 소식 읽기');
    assert(await page.locator('.po-summons').evaluate(el => el === document.activeElement));
    await resume();
    assert(await page.locator('.po-summons').isVisible());
    await tap('떠나는 길 살펴보기');
    await tap('탐험 기록 모아보기');
    assert.equal(await page.locator('.po-record').count(), 14);
    await tap('시간표로 돌아가기');
    await tap('일지 1');
    await tap('열 가지 재앙과 유월절 · 탐험 기록');
    await page.getByText('흑암', { exact:true }).tap();
    assert(await page.getByText('출 10:21-29', { exact:true }).isVisible());
    await tap('일지로 돌아가기');
    assert(await page.getByText('탐험 일지', {exact:true}).isVisible());
    await page.locator('.page-head button').first().click();
    await tap('열 가지 재앙과 유월절 · 감수용 미리보기');
    await tap('처음부터 다시 둘러보기');
    await tap('강가');
    await tap('← 시간표');
    await tap('일지 1');
    await tap('열 가지 재앙과 유월절 · 탐험 기록');
    assert.equal(await page.locator('.po-record').count(), 14);
    await tap('일지로 돌아가기');
    await page.locator('.page-head button').first().click();
    await tap('열 가지 재앙과 유월절 · 감수용 미리보기');
    assert.equal(await button('✓ 강가').getAttribute('aria-pressed'), 'true');
    assert(await button('다음 재앙 살펴보기').isDisabled());
    assert.deepEqual(errors, []);
    console.log(new URL(url).pathname, width, height, '단계', age+1, '통과');
  } finally { await page.close(); }
}

// 첫 판의 이름 맞히기를 이미 통과한 저장과 아직 풀기 전 저장을 같은 장면에서 복원한다.
async function legacy(browser, url) {
  const page = await browser.newPage();
  try {
    await page.goto(url);
    const tap = name => page.getByRole('button', {name, exact:true}).click();
    await tap('탐험 시작');
    await page.locator('.tier').first().click();
    await tap('출발 준비 완료');
    for (const matched of [false, true]) {
      await page.evaluate(value => {
        BO.app2d.state.passover = {step:8, seen:0, active:true, matched:value};
        BO.app2d.save();
      }, matched);
      await page.reload();
      await tap('이어서 탐험하기');
      const next = page.getByRole('button', {name:'유월절을 준비하는 집으로'});
      assert.equal(await next.isEnabled(), matched);
      if (matched) {
        await next.click();
        assert(await page.getByRole('button', {name:'식탁', exact:true}).isVisible());
      }
    }
  } finally { await page.close(); }
}

(async () => {
  const browser = await chromium.launch({ proxy });
  try {
    await fs.mkdir(output, {recursive:true});
    const origin = await gameOrigin(browser);
    for (const entry of ['/web/index.html','/preview.html']) {
      await legacy(browser, origin + entry);
      for (let age = 0; age < 3; age++) await play(browser, origin + entry, age);
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
