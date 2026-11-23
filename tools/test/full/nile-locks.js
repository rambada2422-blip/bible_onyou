// 수문 퍼즐의 해결 가능성과 기존 항해 저장을 실제 브라우저에서 함께 확인한다.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require('playwright');
const {gameOrigin, proxy} = require('../game-server');
const dirs = {R:'right', L:'left', U:'up', D:'down', T:'turn'};
const names = {R:'오른쪽', L:'왼쪽', U:'위', D:'아래'};
const arrows = {R:'ArrowRight', L:'ArrowLeft', U:'ArrowUp', D:'ArrowDown', T:'g'};
const simple = ['RRTDDDDR', 'UURRDDDL', 'DDDRRRRRU'];
const flowers = ['RRTDDDDLLRRR', 'URRDDL', 'DDDRRRDURRU'];
const out = path.resolve(process.argv[2] || 'dist/nile-lock-proof');

function checkRoutes() {
  global.BO = {};
  require('../../../web/js/nile-routes');
  const {routes, locks, sail, start, hint, trace} = BO.nileRoutes;
  const id = p => [p.x,p.y,p.found,p.gateOpen].join('/');
  const riverSimple = ['UUL','UUUR','URUUULL','UUUURR'];
  const riverFlowers = ['DUUUL','ULLUUURRDR','RRULUUULL','URRRUUUL'];
  [...routes,...locks].forEach((route, i) => {
    const cells = new Set();
    const seen = new Set(), goals = new Map(), queue = [[start(route), 0]];
    for (let j = 0; j < queue.length; j++) {
      const [pos, cost] = queue[j];
      if (seen.has(id(pos))) continue;
      seen.add(id(pos));
      cells.add([pos.x,pos.y].join());
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
        if (next) {
          const distance = Math.abs(next.x-pos.x) + Math.abs(next.y-pos.y);
          assert.equal(distance,act==='turn' ? 0 : 1);
          queue.push([next,cost+1]);
        }
      }
    }
    const easy = [...riverSimple,...simple][i], withFlower = [...riverFlowers,...flowers][i];
    assert.equal(cells.size,route.rows.join('').replaceAll('#','').length);
    assert.equal(goals.get(false),easy.length);
    assert.equal(goals.get(true),withFlower.length);
    for (const word of [easy,withFlower]) {
      const positions = trace(route,Array.from(word,c => dirs[c]));
      assert.equal(positions.length,word.length+1);
      assert(positions.at(-1).arrived);
    }
    console.log(route.name,seen.size+'개 상태·도착/갈대 최단 해법 검증');
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
      delete prior.nile.movement;
      prior.nile.records[0] = {best:2,flower:true};
      localStorage.setItem('bo_demo_v1',JSON.stringify(prior));
    });
    const original = {...(await state()).nile, movement:'step', moves:['down','down']};
    original.records[0] = {best:null, flower:true, glideBest:2};
    await page.goto(origin+'/nile.html?course=locks');
    assert.equal(await page.locator('.river-name').innerText(),'갈대 수문');
    assert(await button('바퀴 돌리기').isDisabled());
    await act('R');
    assert.match(await page.locator('canvas').getAttribute('aria-label'), /^배 1행 3열,/);
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
    assert.deepEqual((await state()).nileLocks.moves,['right','right','turn']);
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
    assert.deepEqual((await state()).nileLocks.moves,['right','right','turn']);
    await act('DDDDR');
    assert.equal((await state()).nileLocks.records[0].best,8);
    await tap('이 물길 다시 타기');
    const wheelVoyages = [flowers[0], 'UUTURDDLURRRRDDLLDL', 'DTDDDDRRUUUTRDDRURU'];
    for (const [i, sequence] of wheelVoyages.entries()) {
      if (i===1) {
        await act(sequence.slice(0,3));
        assert.equal(await page.locator('.river-gate-state').innerText(),'황금 수문 열림 · 푸른 수문 닫힘');
        await page.screenshot({path:path.join(out,'수문-'+width+'.png')});
        await act(sequence.slice(3));
      } else await act(sequence);
      await page.getByRole('heading',{name:'나루에 도착했어요!'}).waitFor();
      if (i<flowers.length-1) await tap('다음 물길');
    }
    const records = (await state()).nileLocks.records;
    assert.deepEqual(records.map(r=>r.flower),[true,true,true]);
    assert.equal(records[0].best,8);
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
async function precision(browser, origin) {
  const page = await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  try {
    await page.goto(origin+'/nile.html?course=locks');
    const board = page.locator('canvas');
    const position = (row,col) => '배 '+row+'행 '+col+'열,';
    const at = async (row,col) => assert((await board.getAttribute('aria-label')).startsWith(position(row,col)));
    await at(1,2);
    const box = await board.boundingBox();
    const x = Math.round(box.x+16), y = Math.round(box.y+22);
    const cdp = await page.context().newCDPSession(page);
    const swipe = [['touchStart',[{x,y}]],['touchMove',[{x:x+180,y}]],['touchEnd',[]]];
    for (const [type,touchPoints] of swipe) await cdp.send('Input.dispatchTouchEvent',{type,touchPoints});
    await cdp.detach();
    await page.waitForFunction(() => document.querySelector('.river-status').textContent.includes('배가 멈췄어요'));
    await at(1,3);
    await page.keyboard.down('ArrowRight');
    await page.keyboard.down('ArrowRight'); // 길게 누를 때 오는 반복 이벤트
    await page.keyboard.up('ArrowRight');
    await at(1,4);
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowDown');
    await at(1,3); // 남쪽은 갈대. 입력이 빠르더라도 이 자리에 머문다.
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowDown');
    await at(2,2); // 애니메이션 중 두 번 누른 방향을 모두 반영한다.

    // 미끄러지던 저장에서 황금 수문을 지나 갈대가 있는 행까지 간 배를 복원한다.
    await page.evaluate(() => {
      const old = JSON.parse(localStorage.getItem('bo_demo_v1'));
      old.nileLocks = {index:0, moves:['right','turn','down','left'], records:[{best:4,flower:true}], sound:false};
      localStorage.setItem('bo_demo_v1', JSON.stringify(old));
    });
    await page.reload();
    await at(5,1);
    const saved = () => page.evaluate(() => BO.app2d.state.nileLocks);
    const migrated = await saved();
    assert.deepEqual(migrated.moves,['right','right','turn','down','down','down','down','left','left','left']);
    assert.deepEqual(migrated.records[0],{best:null,flower:true,glideBest:4});
    assert.match(await page.locator('.river-gate-state').innerText(),/황금 수문 열림/);
    assert(await page.locator('.reed-found').isVisible());
    await page.reload();
    assert.deepEqual(await saved(),migrated);
    await page.getByRole('button',{name:'한 수 되돌리기',exact:true}).tap();
    await at(5,2);
    console.log('일반 모션에서 긴 밀기·키 반복·빠른 연속 입력·구형 수문 저장 복원 통과');
  } finally { await page.close(); }
}
async function layouts(browser, origin) {
  const page = await browser.newPage({hasTouch:true, isMobile:true});
  try {
    const note = '『탐험대 이야기』 탐험대 수첩 속 물길 놀이예요. 수문과 바퀴는 성경에 나오지 않아요.';
    for (const course of ['river','locks']) {
      await page.goto(origin+'/nile.html?course='+course);
      assert.equal(await page.locator('.river-story-note').innerText(),note);
      assert.match(await page.locator('canvas').getAttribute('aria-label'),/갈대/);
      const button = page.getByRole('button',{name:'항해 일지'});
      await button.click();
      assert(await page.getByText('출 2:3',{exact:true}).isVisible());
      await page.getByRole('button',{name:'물길로 돌아가기'}).click();
    }
    for (const [width,height] of [[320,568],[360,640],[390,844],[414,896],[568,320],[844,390],[768,1024],[1280,800]]) {
      await page.setViewportSize({width,height});
      const fit = await page.evaluate(() => {
        const screen = document.querySelector('.river-screen');
        const buttons = screen.querySelectorAll('.river-key,.river-wheel');
        const note = screen.querySelector('.river-story-note').getBoundingClientRect();
        return note.top >= 0 && note.bottom <= innerHeight && screen.scrollWidth <= screen.clientWidth && Array.from(buttons).every(button => {
          const box = button.getBoundingClientRect();
          return box.width >= 44 && box.height >= 44 && box.left >= 0 && box.right <= innerWidth &&
            box.top >= 0 && box.bottom <= innerHeight;
        });
      });
      assert(fit,width+'×'+height+'에서 수문과 노 젓기 단추가 첫 화면에 보여야 한다');
    }
    console.log('화면 8종 · 좌우 넘침 없이 수문과 방향 단추 44px 이상, 첫 화면에 표시');
  } finally { await page.close(); }
}
(async () => {
  checkRoutes(); await fs.mkdir(out,{recursive:true});
  const b = await chromium.launch({proxy});
  try {
    const origin = await gameOrigin(b);
    await precision(b,origin);
    await layouts(b,origin);
    await check(b,origin,true,320,568);
    await check(b,origin,true,360,640);
    await check(b,origin,false,1280,800);
    await check(b,origin,true,844,390);
  } finally { await b.close(); }
})().catch(e => {console.error(e); process.exitCode=1;});
