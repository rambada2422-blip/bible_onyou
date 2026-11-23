// 수문 퍼즐의 해결 가능성과 기존 항해 저장을 실제 브라우저에서 함께 확인한다.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require('playwright');
const {gameOrigin, proxy} = require('../game-server');
const dirs = {R:'right', L:'left', U:'up', D:'down', T:'turn'};
const names = {R:'오른쪽', L:'왼쪽', U:'위', D:'아래'};
const arrows = {R:'ArrowRight', L:'ArrowLeft', U:'ArrowUp', D:'ArrowDown', T:'g'};
const simple = ['RTDR', 'UTRDLDL', 'DTDRUTDRU'];
const flowers = ['RTDLR', 'UTURDLURDLDL', 'DTDRUTRDRURU'];
const out = path.resolve(process.argv[2] || 'dist/nile-lock-proof');

function checkRoutes() {
  global.BO = {};
  require('../../../web/js/nile-routes');
  const {locks, sail, start, hint, trace} = BO.nileRoutes;
  const id = p => [p.x,p.y,p.found,p.gateOpen].join('/');
  locks.forEach((route, i) => {
    const seen = new Set(), goals = new Map(), queue = [[start(route), 0]];
    for (let j = 0; j < queue.length; j++) {
      const [pos, cost] = queue[j];
      if (seen.has(id(pos))) continue;
      seen.add(id(pos));
      if (pos.arrived) {
        if (!goals.has(pos.found)) goals.set(pos.found, cost);
        continue;
      }
      // 어떤 도달 가능한 위치에서도 차례로 힌트를 따르면 순환 없이 나루에 도착한다.
      let step = pos;
      const guided = new Set();
      while (!step.arrived) {
        assert(!guided.has(id(step)),route.name);
        guided.add(id(step));
        step = sail(route,step,hint(route,step));
        assert(step,route.name);
      }
      for (const act of Object.values(dirs)) {
        const next = sail(route,pos,act);
        if (next) queue.push([next,cost+1]);
      }
    }
    assert.equal(goals.get(false),simple[i].length);
    assert.equal(goals.get(true),flowers[i].length);
    for (const word of [simple[i],flowers[i]]) {
      const positions = trace(route,Array.from(word,c => dirs[c]));
      assert.equal(positions.length,word.length+1);
      assert(positions.at(-1).arrived);
    }
    console.log(route.name,seen.size+'개 상태·도착/연꽃 최단 해법 검증');
  });
}

async function check(browser, origin, mobile, width, height) {
  const page = await browser.newPage({hasTouch:mobile,isMobile:mobile,viewport:{width,height},reducedMotion:'reduce'});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const button = n => page.getByRole('button',{name:n,exact:true});
  const tap = async n => mobile ? button(n).tap() : button(n).click();
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('bo_demo_v1')));
  async function act(sequence) {
    for (const k of sequence) {
      if (!mobile) await page.keyboard.press(arrows[k]);
      else await tap(k === 'T' ? '바퀴 돌리기' : names[k]+' 방향으로 노 젓기');
    }
  }
  try {
    // 이전 버전의 저장 형식. 이전 항해의 중간 위치와 완주 기록을 간직해야 한다.
    await page.goto(origin+'/nile.html');
    await act('D');
    await page.evaluate(() => {
      const prior = JSON.parse(localStorage.getItem('bo_demo_v1'));
      delete prior.nileCourse;
      prior.nile.records[0] = {best:2,flower:true};
      localStorage.setItem('bo_demo_v1',JSON.stringify(prior));
    });
    const original = (await state()).nile;
    await page.goto(origin+'/nile.html?course=locks');
    assert.equal(await page.locator('.river-name').innerText(),'갈대 수문');
    assert(await button('바퀴 돌리기').isDisabled());
    await act('R');
    await tap('물길 힌트');
    assert(await button('바퀴 돌리기').evaluate(el => el.classList.contains('river-hinted')));
    if (mobile) {
      const r = await page.locator('canvas').boundingBox();
      await page.touchscreen.tap(r.x+r.width*3.5/5, r.y+r.height*.5/5);
    } else await act('T');
    assert.match(await page.locator('.river-gate-state').innerText(),/황금 수문 열림/);
    await page.setViewportSize({width:height,height:width});
    await page.reload();
    assert.deepEqual((await state()).nileLocks.moves,['right','turn']);
    await tap('한 수 되돌리기');
    assert.match(await page.locator('.river-gate-state').innerText(),/황금 수문 닫힘/);
    await page.setViewportSize({width,height});
    await act('T');
    await tap('항해 일지');
    await tap('첫 네 물길로');
    assert.deepEqual((await state()).nile,original);
    await page.reload();
    assert.equal(await page.locator('.river-name').innerText(),'갈대 나루');
    await tap('항해 일지');
    await tap('수문 탐험으로');
    assert.deepEqual((await state()).nileLocks.moves,['right','turn']);
    await act('DR');
    assert.equal((await state()).nileLocks.records[0].best,4);
    await tap('이 물길 다시 타기');
    for (const [i, sequence] of flowers.entries()) {
      if (i===1) {
        await act(sequence.slice(0,2));
        assert.equal(await page.locator('.river-gate-state').innerText(),'황금 수문 열림 · 푸른 수문 닫힘');
        await page.screenshot({path:path.join(out,'수문-'+width+'.png')});
        await act(sequence.slice(2));
      } else await act(sequence);
      await page.getByRole('heading',{name:'나루에 도착했어요!'}).waitFor();
      if (i<flowers.length-1) await tap('다음 물길');
    }
    const records = (await state()).nileLocks.records;
    assert.deepEqual(records.map(r=>r.flower),[true,true,true]);
    assert.equal(records[0].best,4);
    await tap('완성한 항해 일지');
    await page.locator('dialog details').last().locator('summary').click();
    assert.equal(await page.locator('dialog details[open] .ref').innerText(),'출 8:12–15');
    await tap('물길로 돌아가기');
    await tap('왕궁 이야기');
    await tap('나일강 물길 탐험');
    assert.equal(await page.locator('.river-name').innerText(),'두 바퀴의 나루');
    assert.deepEqual((await state()).nile,original);
    assert.deepEqual(errors,[]);
    console.log(width+'×'+height,'수문 3곳·두 항해 저장·이전 저장 복원·일지 통과');
  } finally { await page.close(); }
}
(async () => {
  checkRoutes(); await fs.mkdir(out,{recursive:true});
  const b = await chromium.launch({proxy});
  try {
    const origin = await gameOrigin(b);
    await check(b,origin,true,360,640);
    await check(b,origin,false,1280,800);
    await check(b,origin,true,844,390);
  } finally { await b.close(); }
})().catch(e => {console.error(e); process.exitCode=1;});
