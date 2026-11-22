// 두 우회 이야기에서 도착 때 살펴본 단서를 세 연령의 추리까지 가져간다.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const { chromium } = require('playwright');
const { gameOrigin, proxy } = require('../game-server');
const layoutIssues = require('../layout-issues');
const out = path.resolve(process.argv[2] || 'dist/check/detour-clues');

async function play(browser, url, name, age, width, height, picks) {
  const page = await browser.newPage({viewport: {width, height}, hasTouch: true, isMobile: true, reducedMotion: 'reduce'});
  try {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const button = text => page.getByRole('button', {name: text, exact: true});
    const next = page.locator('.sheet-foot .onpaper');
    await page.goto(url);
    await button('탐험 시작').tap();
    await page.locator('.tier').nth(age).tap();
    await button('출발 준비 완료').tap();
    await button('목적지 다시 고르기').tap();
    await button(name).tap();
    await page.locator('.sheet-body.arrive').waitFor();
    assert.equal(await page.locator('.hot').count(), 3, '네 대목을 넘기기 전에도 그림에서 단서를 찾을 수 있어야 한다');
    const data = await page.evaluate(name => {
      const sc = BO.content.scenes[BO.content.route.options.find(o => o.label === name).to];
      return { items: sc.spot.t1.items, question: sc.spot[BO.app2d.state.tier], art: sc.art };
    }, name);
    for (const k of picks) {
      const point = await page.locator('.art > svg').evaluate((svg, [art, id]) => {
        const r = BO.artMeta[art].regions.find(r => r.id === id);
        const [x,y] = r.tap || [r.x + r.w/2, r.y + r.h/2];
        const p = new DOMPoint(x,y).matrixTransform(svg.getScreenCTM());
        return {x:p.x, y:p.y};
      }, [data.art, data.items[k].region]);
      await page.touchscreen.tap(point.x, point.y);
      assert(await button('단서 ' + (k+1)).isDisabled(), '그림 위의 단서가 손가락에 반응한다');
      assert(await page.getByText(data.items[k].text, {exact: true}).isVisible());
    }
    assert.deepEqual(await page.evaluate(layoutIssues, '#app > .screen'), []);
    if (picks.length === 3) assert(await page.getByText('단서를 모두 찾았어요.').isVisible());
    if (width === 390 && picks.length) await page.screenshot({path: path.join(out, name + '-arrival.png')});
    await button('시간표로 돌아가기').tap();
    await page.locator('.node.play').filter({hasText:'구름 기둥과 불 기둥'}).tap();
    await button('시간표로 돌아가기').tap();
    await button(name + ' · 이어서 탐험하기').tap();
    for (const k of picks) assert(await button('단서 ' + (k+1)).isDisabled());
    await button('이야기 읽기').tap();
    await page.locator('.narr').waitFor();
    await next.tap();
    const text = await page.locator('.narr').innerText();
    await page.reload();
    await button('이어서 탐험하기').tap();
    assert.equal(await page.locator('.narr').innerText(), text);
    while (await page.locator('.narr').count()) await next.tap();
    if (age === 0) {
      assert.equal(await page.locator('.hot:disabled').count(), picks.length);
      assert.equal(await next.isEnabled(), picks.length === 3);
      for (const b of await page.locator('.hot').all()) {
        if (await b.isEnabled()) await b.tap();
      }
    } else {
      assert(await next.isDisabled());
      const notes = page.locator('details.clue-notes');
      assert.equal(await notes.count(), picks.length ? 1 : 0);
      if (picks.length) {
        await notes.locator('summary').tap();
        for (const k of picks) assert(await notes.getByText(data.items[k].text, {exact: true}).isVisible());
        assert.deepEqual(await page.evaluate(layoutIssues, '#app > .screen'), []);
        if (width === 390) await page.screenshot({path: path.join(out, name + '-review.png')});
        await notes.locator('summary').tap();
      }
      if (age === 1) {
        assert.equal(await page.locator('.opt[aria-pressed=true]').count(), 0);
        for (const option of data.question.options.filter(o => o.ok)) await button(option.label).tap();
      } else {
        const [chapter, verse] = data.question.accept[0].split(':');
        await page.getByRole('textbox', {name: '장', exact: true}).fill(chapter);
        await page.getByRole('textbox', {name: '절', exact: true}).fill(verse);
      }
      await button('확인').tap();
    }
    assert(await next.isEnabled());
    await next.tap();
    await button('찾아서 읽었어요').waitFor();
    assert.deepEqual(errors, []);
    console.log(new URL(url).pathname, name, age + 1, width + '×' + height, '먼저 찾은 단서', picks.length, '· 추리 통과');
  } finally { await page.close(); }
}

(async () => {
  await fs.mkdir(out, {recursive: true});
  const browser = await chromium.launch({proxy});
  try {
    const origin = await gameOrigin(browser);
    for (const entry of ['/web/index.html', '/preview.html']) {
      for (const name of ['요셉', '여호수아']) {
        for (const [age,w,h,picks] of [
          [0,320,568,[1]], [0,568,320,[2,0,1]], [1,390,844,[1,2]], [2,844,390,[0]], [1,360,560,[]]
        ]) await play(browser, origin + entry, name, age, w, h, picks);
      }
    }
  } finally { await browser.close(); }
})().catch(e => {console.error(e); process.exitCode = 1;});
