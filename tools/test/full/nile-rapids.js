// 잔잔한 우회로와 두 물살을 통과하는 급행을 실제 입력으로 배달한다.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const {chromium} = require('playwright');
const {gameOrigin,proxy} = require('../game-server');
const out = path.resolve(process.argv[2] || 'dist/nile-rapids-proof');
const keys = {U:'ArrowUp',D:'ArrowDown',R:'ArrowRight',L:'ArrowLeft'};
const labels = {U:'위',D:'아래',R:'오른쪽',L:'왼쪽'};
async function play(browser,origin,touch) {
  const width=touch ? 360 : 1280, height=touch ? 640 : 800;
  const p=await browser.newPage({viewport:{width,height},hasTouch:touch,isMobile:touch,reducedMotion:'reduce'});
  p.setDefaultTimeout(8000);
  const errors=[];
  p.on('pageerror',err=>errors.push(err.message));
  try {
    const btn=n=>p.getByRole('button',{name:n,exact:true});
    const tap=async n=>touch ? btn(n).tap() : btn(n).click();
    const voyage=()=>p.evaluate(()=>BO.app2d.state.nileCourier);
    async function steer(seq) {
      for(const k of seq) {
        if(touch) await tap(labels[k]+' 방향으로 노 젓기');
        else await p.keyboard.press(keys[k]);
      }
    }
    await p.clock.install();
    if (touch) {
      await p.goto(origin+'/nile.html?course=river');
      await steer('D');
      await tap('급류 도전');
    } else await p.goto(origin+'/preview.html?course=rapids#nile');
    assert.equal(await p.locator('h1').innerText(),'갈대섬 우편선');
    await p.screenshot({path:path.join(out,'출항-'+width+'.png')});
    await tap('물살 연습');
    await steer('RR'); // 두 번째 노에 흰 물살이 막는다.
    let s=(await voyage()).practice;
    assert.equal(s.x,2);assert.equal(s.hits,1);assert.equal(s.beats,2);
    await steer('R');
    await tap('물때 넘기기');
    await tap('밧줄 잡기');await steer('R');
    s=(await voyage()).practice;
    assert.equal(s.x,4);assert.equal(s.rope,false);
    await tap('급행 배달');
    await tap('물살 연습');
    assert(await btn('항해 이어가기').isVisible());
    await tap('항해 이어가기');
    await steer('R');
    await tap('물때 넘기기');await tap('물때 넘기기');
    await steer('RR');
    assert((await voyage()).practice.arrived);
    await tap('다시 배달하기');
    await steer('UUURRRRRRDDD');
    assert(await p.getByRole('heading',{name:'연꽃 우편 도착!'}).isVisible());
    assert.equal((await voyage()).best['practice-flower'],12);

    await tap('급행 배달');
    await steer('RR');await tap('즉시 재도전');
    assert.equal((await voyage()).express.moves,0);
    await steer('R');await steer('R');
    let e=(await voyage()).express;
    assert.equal(e.x,2);assert.equal(e.hits,1);
    await tap('잠깐 쉬기');
    const held=(await voyage()).express.elapsed;
    await p.clock.runFor(12000);
    assert.equal((await voyage()).express.elapsed,held);
    await p.reload();
    await tap('항해 이어가기');
    assert.equal((await voyage()).express.hits,1);
    // 우회로에서 시간 초과 뒤에도 배달을 끝낼 수 있다.
    await p.clock.runFor(8500);await steer('LUUURRRRRRDDD');
    assert(await p.getByRole('heading',{name:'연꽃 우편 도착!'}).isVisible());
    assert.equal((await voyage()).best['express-stamp'],undefined);
    await tap('다시 배달하기');

    // 판정할 물살을 명확히 고정해 기록 경쟁을 재현한다. 첫 입력 시점부터 시계를 센다.
    await p.clock.pauseAt(new Date((await p.evaluate(()=>Date.now()))+1000));
    await steer('R');await p.clock.runFor(2450);
    await steer('RR');await tap('밧줄 잡기');await steer('R');
    assert.equal((await voyage()).express.rope,false);
    await p.clock.runFor(2450);await steer('RR');
    assert(await p.getByText('급행 도장 획득',{exact:true}).isVisible());
    e=(await voyage()).express;
    assert.deepEqual([e.moves,e.hits,e.channels,e.arrived],[6,0,3,true]);
    assert((await voyage()).best['express-stamp']<=8000);
    await p.screenshot({path:path.join(out,'급행도장-'+width+'.png')});
    await tap('물길로');
    assert.equal(await p.locator('.river-name').innerText(),'갈대 나루');
    if(touch) assert.deepEqual(await p.evaluate(()=>BO.app2d.state.nile.moves),['down']);
    await tap('급류 도전');
    assert(await p.getByText('급행 도장 획득',{exact:true}).isVisible());
    assert.deepEqual(errors,[]);
    console.log(width+'×'+height,'연습·급행, 막힘·밧줄·두 경로, 기한·재도전·저장·정지와 본편 복귀 통과');
  } finally { await p.close(); }
}
async function checkLayouts(browser,origin) {
  const page=await browser.newPage();
  try {
    await page.goto(origin+'/nile.html?course=rapids');
    for (const [width,height] of [[320,568],[360,640],[390,844],[568,320],[640,360],[844,390],[768,1024],[1280,800]]) {
      await page.setViewportSize({width,height});
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const metrics=await page.evaluate(()=>{
        const s=document.querySelector('main'), map=document.querySelector('.courier-map').getBoundingClientRect();
        const buttons=[...s.querySelectorAll('button')].filter(b=>b.getClientRects().length);
        return {overflow:s.scrollWidth>s.clientWidth, map:map.width,
          clipped:buttons.filter(b=>{
            const r=b.getBoundingClientRect();
            return r.left < 0 || r.right > innerWidth + 1 || r.top < 0 || r.bottom > innerHeight + 1 || r.height < 44;
          }).map(b=>b.textContent)};
      });
      assert(!metrics.overflow && metrics.map>140 && !metrics.clipped.length, width+'×'+height+' '+JSON.stringify(metrics));
    }
    console.log('화면 8종 · 지도가 보이고 조작 단추 높이 44px 이상, 첫 화면에 모두 표시');
  } finally {await page.close();}
}
(async()=>{
  await fs.mkdir(out,{recursive:true});
  const b=await chromium.launch({proxy});
  try {const url=await gameOrigin(b);await play(b,url,true);await play(b,url,false);await checkLayouts(b,url);}
  finally {await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
