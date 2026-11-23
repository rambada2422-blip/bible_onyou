/* 왕궁에서 유월절을 거쳐 성막까지. 실제 단추와 선의 방향으로 모든 판을 맞춘다. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const { gameOrigin } = require('./game-server');

async function walk(page, origin, output) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const button = name => page.getByRole('button', {name, exact:true});
  const tap = name => button(name).click();
  const save = () => page.evaluate(() => JSON.parse(localStorage.getItem('bo_demo_v1')));
  await page.goto(origin + '/preview.html#palace');
  // 기존 저장에서 출발한다. 마지막 단서는 플레이어가 직접 답해야 한다.
  await page.evaluate(() => {
    const s = BO.app2d.state;
    s.palace.chapter = 9; s.palace.beat = 3;
    s.passover = {step:2, seen:0, active:false};
    BO.app2d.save();
  });
  await page.reload();
  await page.locator('.palace-option').first().click();
  await page.locator('.palace-foot .onpaper').click();
  await tap('유월절을 준비한 집 살펴보기');
  assert.equal((await save()).passover.step, 9);
  await page.locator('.po-pin').first().click();
  await page.reload();
  assert.equal((await save()).passover.seen, 1);
  for (const i of [1, 2]) await page.locator('.po-pin').nth(i).click();
  await tap('그 밤의 기록으로'); await tap('바로의 소식 읽기'); await tap('떠나는 길 살펴보기');
  await tap('길 잇기 수첩 바로 열기');
  assert.equal((await save()).passover.recorded, true);

  const titles = ['홍해 건너편', '광야의 샘', '시내산의 기록', '성막의 마지막 장'];
  const routes = [[4,5,1,2,6,7], [8,4,5,9,10,6,2,3], [0,4,8,9,5,6,10,11], [8,9,5,4,0,1,2,6,10,11]];
  const sides = ['위', '오른쪽', '아래', '왼쪽'];
  async function solve(route, i) {
    for (const [n, cell] of route.entries()) {
      const tile = page.locator('.xt-grid > *').nth(cell);
      const direction = (other) => sides[[-4,1,4,-1].indexOf(other - cell)];
      const incoming = n ? direction(route[n - 1]) : '왼쪽';
      const outgoing = n + 1 < route.length ? direction(route[n + 1]) : '오른쪽';
      for (let k = 0; k < 4; k++) {
        const label = await tile.getAttribute('aria-label');
        if (label.includes(incoming + '와 ' + outgoing + ' 연결') || label.includes(outgoing + '와 ' + incoming + ' 연결')) break;
        await tile.focus(); await page.keyboard.press('Enter');
      }
      if (i === 0 && n === 2) {
        const position = (await save()).exodusTrail;
        await page.setViewportSize({width:640,height:320}); await page.reload();
        assert.deepEqual((await save()).exodusTrail, position);
        await page.setViewportSize({width:360,height:640});
        await page.screenshot({path:path.join(output,'홍해_길잇기.png')});
      }
    }
  }
  for (const [i, route] of routes.entries()) {
    assert.equal(await page.locator('.xt-head h1').innerText(), titles[i]);
    const cells = await page.locator('.xt-cell').evaluateAll(ns => ns.map(n => n.getBoundingClientRect().width));
    assert(cells.every(w => w >= 44));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await tap('끊긴 조각 찾기');
    assert.equal(await page.locator('.xt-hint:focus').count(), 1);
    await solve(route, i);
    assert.equal(await page.locator('.xt-stamps details').count(), 3);
    await tap(i === 3 ? '완성한 수첩 열기' : '다음 장 펼치기');
  }
  assert.equal(await page.locator('.xt-entry details').count(), 12);
  await page.getByText('장막 위에 머문 구름', {exact:true}).click();
  assert(await page.getByText('출 40:34–38',{exact:true}).isVisible());
  await page.getByText('장막 위에 머문 구름', {exact:true}).scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(output,'성막_수첩.png')});
  await page.reload();
  assert.equal(await page.locator('.xt-head h1').innerText(), '완성한 출애굽기 수첩');
  await button('이 판 다시 맞추기').first().click();
  await solve(routes[0].map(c => (2 - Math.floor(c / 4)) * 4 + c % 4), -1);
  await tap('내 수첩');
  assert.equal(await page.locator('.xt-entry details').count(),12);
  await tap('탐험 입구'); await tap('세 친구의 길 잇기 계속하기');
  assert.equal(await page.locator('.xt-entry details').count(),12);
  await tap('열두 기록 복원하기');
  await tap('소고를 든 미리암');
  assert((await page.locator('.xt-message').innerText()).includes('출 14:5–14'));
  const entries = [
    ['바다 앞에 갇히다','바다 사이의 마른 길','소고를 든 미리암'],
    ['엘림의 샘과 종려나무','아침에 거두는 만나','바위에서 흐른 물'],
    ['십계명을 듣는 백성','시내산에서 맺은 언약','금송아지'],
    ['두 돌판을 들고 내려오는 모세','성막을 짓는 손길','장막 위에 머문 구름']
  ];
  for (const i of entries.keys()) {
    for (const [j, label] of entries[i].entries()) {
      await tap(label);
      if (i === 1 && j === 0) {
        await page.reload();
        assert.equal(await page.locator('.xt-placed li').innerText(),label);
      }
    }
  }
  assert(await page.getByText('열두 기록을 시간 순서로 복원했어요.').isVisible());
  // 중간 진입으로 광야를 고르면 나이·친구 선택 뒤 출 13장에 도착한다.
  await page.goto(origin + '/index.html#passover');
  await tap('구름 기둥과 불 기둥 따라가기');
  await page.locator('.tier').first().click(); await tap('출발 준비 완료');
  await tap('밤 풍경 보기');
  await page.reload();
  await tap('낮 풍경 보기');
  // 이미 마무리 대목까지 플레이한 옛 저장에서 새 연결 단추를 검사한다.
  async function resumeClosing(id) {
    await page.evaluate(scene => {
      const s = BO.app2d.state;
      s.journey = {id:scene,tier:s.tier,step:'close'}; BO.app2d.save();
    },id);
  }
  await resumeClosing('EX-09'); await page.reload();
  await tap('길 잇기 수첩 바로 열기');
  assert.equal((await save()).done['EX-09'],true);
  await resumeClosing('EX-01');
  await page.goto(origin + '/index.html');
  await tap('이어서 탐험하기'); await tap('모세를 따라 왕궁으로');
  assert.equal((await save()).done['EX-01'],true);
  assert(await page.locator('.palace-headline').isVisible());
  assert.deepEqual(errors, []);
}

(async () => {
  const output = path.resolve(process.argv[2] || 'dist/exodus-trail');
  await fs.mkdir(output,{recursive:true});
  const browser = await chromium.launch({args:['--no-sandbox']});
  try {
    const page = await browser.newPage({viewport:{width:320,height:568},hasTouch:true,reducedMotion:'reduce'});
    await walk(page, await gameOrigin(browser), output);
    const freshPage = await browser.newPage();
    await freshPage.goto(new URL('/index.html#home', page.url()).href);
    const tap = name => freshPage.getByRole('button',{name,exact:true}).click();
    await tap('탐험 시작'); await freshPage.locator('.tier').first().click(); await tap('출발 준비 완료');
    await tap('모세와 바로의 대화 · 열 재앙 영상'); await tap('다음');
    const words = await freshPage.locator('.palace-words').innerText();
    await freshPage.reload();
    assert.equal(await freshPage.locator('.palace-words').innerText(), words);
    await tap('← 돌아가기'); await tap('열 가지 재앙과 유월절 · 감수용 미리보기');
    await tap('강물'); await freshPage.reload();
    assert.equal(await freshPage.getByRole('button',{name:'✓ 강물',exact:true}).getAttribute('aria-pressed'),'true');
    console.log('왕궁 → 유월절 → 홍해 → 성막, 4판 12기록, 회전·복원·재도전: no errors');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
