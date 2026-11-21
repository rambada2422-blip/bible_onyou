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
    async function assertArt(key) {
      assert(await page.locator('.po-picture img').evaluate((img, name) => decodeURIComponent(img.src).includes(name + '-state-main'), key), key);
    }
    const views = [
      ['plague-water','plague-digging'], ['plague-frogs'], ['plague-dust'],
      ['plague-flies','plague-goshen'], ['plague-yard'], ['plague-kiln'],
      ['plague-hail'], ['plague-locusts'], ['plague-darkness','plague-light']
    ];
    const checkArt = () => page.locator('.po-picture img').evaluate(async img => { await img.decode(); return img.naturalWidth > 0; });
    async function resume() { await page.reload(); await tap('이어서 탐험하기'); }
    async function reviewNotes(total, name, escape) {
      const before = await page.evaluate(() => JSON.stringify(BO.app2d.state.passover));
      await tap('본 재앙 보기');
      const dialog = page.getByRole('dialog', {name:'지금까지 본 재앙'});
      assert.equal(await dialog.locator('summary').count(), total);
      assert.deepEqual(await dialog.locator('summary').allTextContents(),
        names.slice(0, total).map((title, i) => (i+1) + '번째 · ' + title).reverse());
      const entry = dialog.locator('details').filter({has:page.getByText(name, {exact:true})});
      await entry.locator('summary').click();
      await entry.locator('img').first().waitFor();
      assert(await entry.locator('img').evaluateAll(async images => {
        await Promise.all(images.map(img => img.decode())); return images.every(img => img.naturalWidth);
      }));
      if (age === 0 && total === 3) await page.screenshot({path:path.join(output,'field-notes.png')});
      if (escape) await page.keyboard.press('Escape');
      else await tap('탐험으로 돌아가기');
      await dialog.waitFor({state:'detached'});
      assert(await button('본 재앙 보기').evaluate(el => el === document.activeElement));
      assert.equal(await page.evaluate(() => JSON.stringify(BO.app2d.state.passover)), before);
    }
    await page.goto(url);
    await tap('탐험 시작');
    await page.locator('.tier').nth(age).tap();
    await tap('출발 준비 완료');
    await tap('열 가지 재앙과 유월절 · 감수용 미리보기');
    for (const [i, name] of names.entries()) {
      const places = {0:['강물','강가'], 3:['애굽의 집','고센 땅'], 8:['애굽 땅','이스라엘 자손이 사는 곳']}[i];
      const next = button(i === 8 ? '유월절을 준비하는 집으로' : '다음 재앙 살펴보기');
      const progress = page.locator('.po-trail strong');
      assert.equal(await page.locator('.po-segments i').count(), 9);
      assert.equal(await page.locator(places ? '.po-title h2' : '.po-body h3').innerText(), (i+1) + '번째 재앙 · ' + name);
      assert((await page.locator('.po-title').innerText()).includes(['강과 땅','애굽과 고센','하늘과 어둠'][Math.floor(i/3)]));
      assert.equal(await progress.innerText(), (i + (places ? 0 : 1)) + ' / 9 기록');
      if (places) {
        assert(await next.isDisabled());
        if (i === 0) assert.equal(await button('본 재앙 보기').count(), 0);
        const [first, second] = age % 2 ? places.slice().reverse() : places;
        assert.equal(await page.locator('.po-picture img').count(), 0);
        for (const [j, place] of places.entries()) {
          const thumb = button(place).locator('img');
          assert(await thumb.evaluate(async (img, key) => {
            await img.decode();
            const r = img.getBoundingClientRect();
            const target = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
            const card = img.closest('button').getBoundingClientRect();
            const pane = img.closest('.po-scroll').getBoundingClientRect();
            return img.naturalWidth && decodeURIComponent(img.src).includes(key + '-state-main')
              && img === target && r.width >= 44 && r.height >= 44
              && card.top >= pane.top && card.bottom <= pane.bottom;
          }, views[i][j]), place + ' 그림을 스크롤 없이 누를 수 있어야 한다');
        }
        if (age === 2 && i === 0) await page.screenshot({path:path.join(output,'picture-choices.png')});
        const target = await button(first).locator('img').boundingBox();
        await page.touchscreen.tap(target.x + target.width / 2, target.y + target.height / 2);
        assert((await page.locator('.po-spot-hint').innerText()).includes(second));
        assert(await button(second).evaluate(control => {
          const pane = control.closest('.po-scroll').getBoundingClientRect();
          const rect = control.getBoundingClientRect();
          return rect.top >= pane.top && rect.bottom <= pane.bottom;
        }), '한 곳을 본 뒤에도 남은 그림과 이름이 전부 보여야 한다');
        await assertArt(views[i][places.indexOf(first)]);
        assert.equal(await page.locator('.po-guide').count(), age === 0 ? 1 : 0);
        if (i === 3) await reviewNotes(3, '1번째 · 물이 피가 됨', true);
        const firstView = await page.locator('.po-land').getAttribute('data-view');
        assert(await next.isDisabled());
        await resume();
        assert.equal(await button('✓ '+first).getAttribute('aria-pressed'), 'true');
        assert.equal(await page.locator('.po-detail b').innerText(), first);
        assert.equal(await progress.innerText(), i + ' / 9 기록');
        await tap('✓ '+first);
        assert(await next.isDisabled());
        assert((await page.locator('.po-spot-hint').innerText()).includes(second));
        if (age === 0) {
          await button(second).focus();
          await page.keyboard.press('Enter');
        } else await tap(second);
        assert.equal(await page.locator('.po-spot-hint').innerText(), '두 곳을 살펴봤어요.');
        await assertArt(views[i][places.indexOf(second)]);
        assert.notEqual(await page.locator('.po-land').getAttribute('data-view'), firstView);
        assert(await checkArt());
        if (age === 0) {
          assert((await page.locator('.po-guide').innerText()).endsWith('세요.'));
          if (i === 0) await page.screenshot({path:path.join(output,'digging.png')});
        }
        assert.deepEqual(await page.evaluate(layoutIssues, '.po-screen'), []);
        if (age === 0 && i === 8) {
          await tap('✓ 애굽 땅');
          await page.screenshot({path:path.join(output,'dark.png')});
          await tap('✓ 이스라엘 자손이 사는 곳');
          await page.screenshot({path:path.join(output,'light.png')});
        }
      } else {
        await assertArt(views[i][0]);
        assert.equal(await page.locator('.po-spots').count(), 0);
        if (i === 5) await resume();
        assert(await checkArt());
      }
      assert(await next.isEnabled());
      assert.equal(await progress.innerText(), (i+1) + ' / 9 기록');
      assert.equal(await page.locator('.po-segments .filled').count(), i+1);
      assert.equal(await page.locator('.po-finding').isVisible(), age !== 0 || ![0,2,3,7,8].includes(i));
      if (age === 0 && i === 6) await page.screenshot({path:path.join(output,'plague-trail.png')});
      await tap(i === 8 ? '유월절을 준비하는 집으로' : '다음 재앙 살펴보기');
    }
    assert(await checkArt());
    assert.deepEqual(await page.locator('.po-chips li').allTextContents(), ['미발견','미발견','미발견']);
    await assertArt('ex07-room');
    assert((await page.locator('.po-clue').innerText()).includes('그 밤 한밤중이 되기 전'));
    const pins = page.locator('.po-pins button');
    for (const pin of await pins.all()) {
      const bounds = await pin.boundingBox();
      assert(bounds.width >= 44 && bounds.height >= 44);
    }
    // 원본 그림의 좌표로 직접 누른다. 벽은 반응하지 않고 빵과 신발은 단서를 연다.
    const room = await page.locator('.po-meal .po-picture').boundingBox();
    assert(Math.abs(room.width / room.height - 1.5) < .02);
    const touchPicture = (x,y) => page.touchscreen.tap(room.x + room.width*x, room.y + room.height*y);
    await touchPicture(.62,.40);
    assert.equal(await page.locator('.po-chips .found').count(), 0);
    await touchPicture(.44,.72);
    await resume();
    assert(await button('식탁 단서 다시 보기').isVisible());
    assert.equal(await page.locator('.po-clue b').innerText(), '식탁');
    assert(await button('단서 2개 더 찾아보세요 · 1/3').isDisabled());
    await reviewNotes(9, '9번째 · 흑암', false);
    await tap('식탁 단서 다시 보기');
    assert.equal(await page.locator('.po-chips .found').count(), 1);
    await touchPicture(.81,.80);
    assert(await button('단서 1개 더 찾아보세요 · 2/3').isDisabled());
    await button('왼쪽 단서 살펴보기').focus();
    await page.keyboard.press('Enter');
    assert.deepEqual(await page.locator('.po-chips li').allTextContents(), ['✓ 문','✓ 식탁','✓ 떠날 차림']);
    assert.deepEqual(await page.evaluate(layoutIssues, '.po-screen'), []);
    const card = await page.locator('.po-clue').boundingBox();
    assert(card.y >= 0 && card.y + card.height <= height, '누른 단서 설명 전체가 화면 안에 들어야 한다');
    if (age === 0) await page.screenshot({ path:path.join(output,'preparation.png') });
    await tap('그 밤의 기록으로');
    assert(await checkArt());
    assert.equal(await page.locator('.po-body h3').innerText(), '열 번째 재앙');
    await assertArt('plague-midnight');
    assert.equal(await button('본 재앙 보기').count(), 0);
    assert((await page.locator('.po-body').innerText()).includes('피를 바른 이스라엘 자손의 집에는 재앙이 내려 멸하는 일이 없었어요.'));
    assert.equal(await page.locator('.po-trail, .po-chips, .po-pins, .po-finding').count(), 0);
    if (age === 0) await page.screenshot({path:path.join(output,'midnight.png')});
    await tap('바로의 소식 읽기');
    assert(await page.locator('.po-summons').evaluate(el => el === document.activeElement));
    await resume();
    assert(await page.locator('.po-summons').isVisible());
    await tap('떠나는 길 살펴보기');
    assert.equal(await page.locator('.po-trail, .po-chips, .po-pins, .po-finding').count(), 0);
    assert(!(await page.locator('.po-screen').innerText()).includes('✓'));
    await tap('탐험 기록 다시 읽기');
    assert.equal(await page.locator('.po-record').count(), 14);
    const nightRecord = page.locator('.po-record').filter({has:page.getByText('열 번째 재앙', {exact:true})});
    await nightRecord.locator('summary').click();
    assert((await nightRecord.innerText()).includes('피를 바른 이스라엘 자손의 집에는 재앙이 내려 멸하는 일이 없었어요.'));
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
        assert(await page.getByRole('button', {name:'가운데 단서 살펴보기', exact:true}).isVisible());
      }
    }
    // 예전 식탁 화면에는 마지막으로 열어 둔 단서의 번호가 없었다.
    await page.evaluate(() => {
      BO.app2d.state.passover = {step:9, seen:5, active:true};
      BO.app2d.save();
    });
    await page.reload();
    await tap('이어서 탐험하기');
    assert.deepEqual(await page.locator('.po-chips li').allTextContents(), ['✓ 문','미발견','✓ 떠날 차림']);
    assert.equal(await page.locator('.po-clue b').innerText(), '문');
    await tap('가운데 단서 살펴보기');
    assert(await page.getByRole('button', {name:'그 밤의 기록으로',exact:true}).isEnabled());
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
