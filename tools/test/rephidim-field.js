/* 같은 물길을 터치·드래그·키보드로 거슬러 간 뒤, 옛 저장과 원문을 대조한다. */
const assert=require('node:assert/strict');
const path=require('node:path');
const {attachScoreMeter,waitForAudibleCue}=require('./scene-music');
const button=(page,name)=>page.getByRole('button',{name,exact:true});
const stop=page=>page.evaluate(()=>BO.app2d.state.wilderness.stops[4]);

async function playRock(page,out){
  const btn=name=>button(page,name);
  await btn('마른 물길 살피기').click();
  assert(await btn('기록하고 휴 부르기').isDisabled());
  await btn('빈 항아리 살피기').tap();await page.reload();
  assert.equal((await stop(page)).campSpot,0);
  assert.equal(await page.locator('.sf-scripture blockquote').innerText(),await page.evaluate(()=>BO.wildScripture.verses['17:1']));
  if(out)await page.screenshot({path:path.join(out,'rock-camp.png')});
  await btn('기록하고 휴 부르기').click();await btn('녹음하고 온우 부르기').click();
  assert.equal((await stop(page)).phase,1);
  const dial=page.getByRole('slider',{name:'집음기 방향'});
  await dial.focus();await page.keyboard.press('Home');
  for(let i=0;i<11;i++)await page.keyboard.press('ArrowRight');
  await page.reload();assert.equal(await dial.inputValue(),'11');
  await btn('녹음하고 온우 부르기').click();
  await btn('반석의 물줄기 살피기').focus();await page.keyboard.press('Enter');
  assert.equal((await stop(page)).mapped,0);
  await btn('물을 뜨는 자리 살피기').tap();
  assert.equal((await stop(page)).mapped,1);await page.reload();
  await btn('르비딤 진영').click();await page.reload();assert.equal(await btn('르비딤 진영').getAttribute('aria-pressed'),'true');
  await btn('물길 답사 이어가기').click();assert.equal((await stop(page)).mapped,1);
  const at=async name=>{
    const r=await btn(name+' 살피기').boundingBox();
    return {x:r.x+r.width/2,y:r.y+r.height/2};
  };
  await page.locator('.rp-board').scrollIntoViewIfNeeded();
  const a=await at('자갈 사이 여울'),b=await at('반석의 물줄기');
  await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:12});await page.mouse.up();
  assert.equal((await stop(page)).mapped,3);
  if(out)await page.screenshot({path:path.join(out,'rock-stream.png')});
  await btn('물길을 수첩에 보관').click();
  assert(await page.getByText('반석 아래 물길 관찰 카드',{exact:true}).isVisible());
  await btn('말씀 인장 · 출 17:6').click();assert.equal(await page.locator(':focus').getAttribute('data-verse'),'17:6');
  await btn('닫기').click();await page.locator('dialog').waitFor({state:'detached'});
  await page.reload();assert.equal((await stop(page)).phase,3);
}
async function checkRockSound(browser,origin,entry){
  const page=await browser.newPage({viewport:{width:360,height:720},hasTouch:true});
  const btn=name=>button(page,name),quiet=()=>page.waitForFunction(()=>readScore().every(t=>t.ended||t.state!=='running'));
  try{
    await attachScoreMeter(page);await page.goto(origin+entry+'#rock');
    assert.deepEqual(await page.evaluate(()=>readScore()),[]);
    await btn('빈 항아리 살피기').tap();await waitForAudibleCue(page,20.833);
    await btn('백성이 겪은 일 · 출 17:3').tap();await quiet();
    assert.equal(await page.locator(':focus').getAttribute('data-verse'),'17:3');
    await btn('닫기').tap();await page.locator('dialog').waitFor({state:'detached'});
    await btn('기록하고 휴 부르기').tap();await waitForAudibleCue(page,20);
    await btn('르비딤 진영').tap();await waitForAudibleCue(page,20.833);
    await btn('호렙 물길').tap();await waitForAudibleCue(page,20);
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await quiet();
    await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await waitForAudibleCue(page,20);
    await btn('음악 끄기').tap();await quiet();await page.reload();
    await btn('르비딤 진영').tap();assert.deepEqual(await page.evaluate(()=>readScore()),[]);
    await btn('음악 켜기').tap();await waitForAudibleCue(page,20.833);
    for(const [width,height] of [[320,568],[720,360],[1100,780]]){
      await page.setViewportSize({width,height});
      await page.evaluate(()=>document.documentElement.style.fontSize='200%');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&
        document.querySelector('.wf-scroll').scrollWidth<=document.querySelector('.wf-scroll').clientWidth+1));
    }
    await btn('탐험 입구').click();await page.waitForFunction(()=>readScore().every(t=>t.state==='closed'));
  }finally{await page.close();}
}
async function checkRockLegacy(browser,origin){
  const page=await browser.newPage({viewport:{width:320,height:568},hasTouch:true});
  const btn=name=>button(page,name);
  try{
    await page.goto(origin+'/index.html#rock');
    for(const phase of [0,1,2,3]){
      await page.evaluate(phase=>{
        const app=BO.app2d,w=app.state.wilderness;
        w.stops[4]={phase,pos:4,dial:0,mapped:phase>=2?2:0};w.earned[4]=phase===3;
        app.save();
      },phase);
      await page.reload();assert.equal((await stop(page)).phase,phase);
      if(phase===0)assert(await btn('빈 항아리 살피기').isVisible());
      if(phase===1)assert.equal(await page.getByRole('slider').inputValue(),'11');
      if(phase===2){await btn('반석의 물줄기 살피기').tap();assert(await btn('물길을 수첩에 보관').isEnabled());}
      if(phase===3){
        await btn('이 장소 다시 답사').tap();assert.equal((await stop(page)).phase,0);
        await btn('관측대').tap();assert(await btn('말씀 인장 · 출 17:6').isVisible());
      }
    }
  }finally{await page.close();}
}
module.exports={playRock,checkRockSound,checkRockLegacy};
