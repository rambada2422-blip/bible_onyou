// 물길 네 곳을 실제 터치·밀기·키보드로 지나고 왕궁 이야기의 저장 지점을 확인한다.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require('playwright');
const {gameOrigin, proxy} = require('../game-server');
const out = path.resolve(process.argv[2] || 'dist/nile-proof');
const keys = {L:'ArrowLeft', R:'ArrowRight', U:'ArrowUp', D:'ArrowDown'};
const buttons = {L:'왼쪽', R:'오른쪽', U:'위', D:'아래'};
const flowers = ['DUUUL', 'ULLUUURRDR', 'RRULUUULL', 'URRRUUUL'];
const names = ['갈대 나루','모래톱 굽이','연못 사이로','저녁 등불'];
async function play(browser, origin, entry, width, height, touch) {
  const page = await browser.newPage({viewport:{width,height}, hasTouch:touch, isMobile:touch, reducedMotion:'reduce'});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const button = name => page.getByRole('button', {name, exact:true});
  const tap = async name => { if (touch) await button(name).tap(); else await button(name).click(); };
  const active = () => page.evaluate(() => BO.app2d.state.nile);
  async function steer(route) {
    for (const key of route) {
      if (touch) await tap(buttons[key] + ' 방향으로 노 젓기');
      else await page.keyboard.press(keys[key]);
    }
  }
  await page.goto(origin + entry);
  await tap('모세와 아론의 말 읽기');
  await tap('나일강 물길 탐험');
  assert.equal(await page.locator('.river-name').innerText(), names[0]);
  if (width === 360 || width >= 1000) await page.screenshot({path:path.join(out, width+'-출항.png')});
  await tap('물길 힌트');
  assert.match(await page.locator('.river-hinted').getAttribute('aria-label'), /^(위|왼쪽) 방향으로 노 젓기$/);
  // 막힌 동쪽으로 저어도 이동하지 않는다.
  await page.keyboard.press('ArrowRight');
  if (await active()) assert.equal((await active()).moves.length,0);
  if (touch) {
    // 실제 터치 제스처를 보내 pointer capture 경로도 확인한다.
    const box = await page.locator('canvas').boundingBox();
    const x = Math.round(box.x + box.width / 2), y = Math.round(box.y + box.height / 2);
    const cdp = await page.context().newCDPSession(page);
    for (const [type, points] of [['touchStart',[{x,y}]],['touchMove',[{x,y:y+45}]],['touchEnd',[]]]) {
      await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
    }
    await cdp.detach();
  } else await page.keyboard.press('s');
  assert.deepEqual((await active()).moves,['down']);
  assert.match(await page.locator('canvas').getAttribute('aria-label'), /^배 4행 2열,/);
  await page.setViewportSize({width:height,height:width});
  await page.reload();
  assert.deepEqual((await active()).moves,['down']);
  await page.setViewportSize({width,height});
  await tap('한 수 되돌리기');
  assert.deepEqual((await active()).moves,[]);
  await steer('LUU');
  assert.equal((await active()).records[0].best,3);
  assert.equal((await active()).records[0].flower,false);
  await tap('이 물길 다시 타기');
  for (const [i, route] of flowers.entries()) {
    assert.equal(await page.locator('.river-name').innerText(), names[i]);
    await steer(route);
    assert(await page.getByRole('heading',{name:'나루에 도착했어요!'}).isVisible());
    assert.equal((await active()).records[i].flower,true);
    if (i < 3) await tap('다음 물길');
  }
  assert.equal((await active()).records[0].best,3);
  await tap('완성한 항해 일지');
  assert.equal(await page.locator('dialog li').count(),4);
  await page.getByText('모세와 아론의 부탁',{exact:true}).click();
  assert.equal(await page.locator('dialog details[open] .ref').innerText(),'출 5:1');
  assert.equal(await page.locator('dialog li').filter({hasText:'갈대 기록'}).count(),4);
  await page.locator('dialog li').first().getByRole('button').click();
  assert.equal(await page.locator('.river-name').innerText(),names[0]);
  await tap('왕궁 이야기');
  assert.match(await page.locator('.palace-speaker').innerText(), /^모세와 아론/);
  await tap('나일강 물길 탐험');
  await page.reload();
  assert.equal((await active()).records.filter(Boolean).length,4);
  assert.deepEqual(errors,[]);
  await page.close();
  console.log(entry,width+'×'+height,'· 네 물길, 터치/키 입력, 갈대, 되감기·회전·재개·일지·왕궁 복귀 통과');
}
async function lightweight(browser, origin) {
  const page = await browser.newPage({viewport:{width:390,height:844}, hasTouch:true, isMobile:true});
  const assets = [], errors = [];
  page.on('request', request => assets.push(request.url()));
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin + '/nile.html');
  await page.locator('.river-name').waitFor();
  await page.getByRole('button',{name:'아래 방향으로 노 젓기'}).tap();
  await page.getByText('갈대를 발견했어요!',{exact:false}).waitFor();
  assert.deepEqual(assets,[origin + '/nile.html']);
  await page.reload();
  assert.deepEqual(await page.evaluate(() => BO.app2d.state.nile.moves),['down']);
  await page.getByRole('button',{name:'왕궁 이야기'}).tap();
  await page.locator('.palace-headline h1').waitFor();
  await page.getByRole('button',{name:'나일강 물길 탐험'}).tap();
  assert.deepEqual(await page.evaluate(() => BO.app2d.state.nile.moves),['down']);
  assert.deepEqual(errors,[]);
  await page.close();
  console.log('가벼운 입구 · 단일 요청, 일반 모션 갈대 발견, 왕궁과 저장 공유 통과');
}
(async () => {
  await fs.mkdir(out,{recursive:true});
  const browser = await chromium.launch({proxy});
  try {
    const origin = await gameOrigin(browser);
    await lightweight(browser,origin);
    await play(browser,origin,'/index.html#palace',360,640,true);
    await play(browser,origin,'/preview.html#palace',1280,800,false);
    await play(browser,origin,'/preview.html#palace',320,568,true);
    await play(browser,origin,'/index.html#palace',844,390,true);
  } finally { await browser.close(); }
})().catch(e => {console.error(e); process.exitCode=1;});
