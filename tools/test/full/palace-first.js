// 첫 퀴즈에서 영상, 강가에서 왕궁, 말씀 인장에서 두 번째 재앙까지 정상 입구로 플레이한다.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require('playwright');
const {gameOrigin,proxy}=require('../game-server');
const {attachScoreMeter,waitForAudibleCue}=require('../scene-music');
async function run(browser,url,folder,uninterrupted){
  const page=await browser.newPage({viewport:{width:360,height:740},hasTouch:true,reducedMotion:'reduce'});
  page.setDefaultTimeout(9000);
  await attachScoreMeter(page);
  const button=name=>page.getByRole('button',{name,exact:true});
  const next=page.locator('.palace-foot .onpaper'), forward=()=>next.tap();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const muted=()=>page.waitForFunction(()=>readScore().every(t=>t.ended||t.state!=='running'));
  const cue=n=>waitForAudibleCue(page,n);
  const state=()=>page.evaluate(()=>BO.app2d.state.palace);
  const view=()=>page.locator('.palace-picture').getAttribute('data-first-view');
  const scrollRef=()=>page.evaluate(()=>document.activeElement.dataset.verse);
  try{
    await page.goto(url+'#palace-first');
    const start=Date.now();
    assert.equal(await view(),'yard');assert.deepEqual(await page.evaluate(()=>readScore()),[]);
    await button('벽돌 바구니 살펴보기').tap();await cue(21.818);
    assert((await state()).firstMarks.includes('load'));
    assert(Date.now()-start<30000);
    await forward();await cue(22.5);
    await button('읽어 줘').tap();await muted();
    await button('그만 듣기').tap();await cue(22.5);
    await button('말씀 두루마리').tap();await muted();assert.equal(await scrollRef(),'5:1');
    await button('닫기').tap();await cue(22.5);
    await page.locator('.watch-launch').tap();await muted();await button('왕궁으로').tap();await cue(22.5);
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await muted();
    await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await cue(22.5);
    await button('음악 끄기').tap();await page.reload();
    assert(await button('음악 켜기').isVisible());await button('음악 켜기').tap();await cue(22.5);
    await forward();assert.equal(await view(),'throne');await forward();assert.equal(await view(),'clay');await cue(21.818);
    await page.setViewportSize({width:320,height:568});
    await page.addStyleTag({content:'html{font-size:125%} .palace-words{font-size:1.35rem}'});
    await button('나무틀 살펴보기').focus();await page.keyboard.press('Enter');
    await page.setViewportSize({width:740,height:360});await page.reload();
    assert.equal(await button('나무틀 살펴보기').getAttribute('aria-pressed'),'true');
    await button('나무틀 살펴보기').scrollIntoViewIfNeeded();
    const a=await button('나무틀 살펴보기').boundingBox(),b=await button('말리는 벽돌 살펴보기').boundingBox();
    await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();
    await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:8});await page.mouse.up();
    assert.equal(await button('말리는 벽돌 살펴보기').getAttribute('aria-pressed'),'true');
    await page.setViewportSize({width:390,height:844});
    if(folder){await page.locator('.palace-scroll').evaluate(n=>n.scrollTop=0);await page.screenshot({path:path.join(folder,'벽돌_일터.png')});}
    await forward();
    await page.locator('.palace-option').nth(1).tap();assert(await next.isDisabled());
    await page.locator('.palace-option').first().tap();assert.match(await next.innerText(),/영상 보기/);
    await forward();await page.waitForFunction(()=>document.querySelector('video')?.currentTime>.2);
    await muted();
    const video=page.locator('.palace-picture video');
    assert.equal(Math.round(await video.evaluate(v=>v.duration)),76);
    if(uninterrupted){
      for(const sec of [17,40,60,72]) {
        await page.waitForFunction(t=>document.querySelector('video')?.currentTime>=t,sec,{timeout:46000});
        console.log('나일강 첫 재앙 연속 재생',sec,'초',await video.evaluate(v=>v.getVideoPlaybackQuality().totalVideoFrames),'프레임');
      }
      await page.locator('[data-first-view="jar"]').waitFor({timeout:14000});
    } else {
      await video.evaluate(v=>{v.currentTime=31;});
      await page.waitForFunction(()=>BO.app2d.state.palace.firstFilmAt>=30);
      await page.reload();assert.equal(await video.count(),0);
      await page.locator('.palace-film-play').tap();
      await page.waitForFunction(()=>document.querySelector('video')?.currentTime>=30);
      await video.evaluate(v=>{v.currentTime=v.duration-.35;});
      await page.locator('[data-first-view="jar"]').waitFor();
    }
    await cue(20);assert.equal((await state()).firstFilmEnded,true);
    await button('기울인 물항아리 살펴보기').tap();
    await button('물을 찾으러 간 자리 보기').tap();await page.reload();assert.equal(await view(),'bank');
    await button('강가에 쌓인 흙 살펴보기').tap();assert.equal(await scrollRef(),'7:24');
    await button('닫기').tap();await cue(20);
    if(folder)await page.screenshot({path:path.join(folder,'강가_결말.png')});
    await button('바로의 반응 확인하기').tap();await cue(22.5);
    await button('왕좌의 금빛 팔걸이 살펴보기').tap();assert.equal(await scrollRef(),'7:22');
    await button('닫기').tap();
    await page.setViewportSize({width:844,height:390});
    await page.addStyleTag({content:'html {font-size:150% !important;}'});
    await button('나일 강가 다시 보기').tap();await cue(20);
    await button('물을 찾으러 간 자리 보기').tap();
    await button('강가에 쌓인 흙 살펴보기').tap();assert.equal(await scrollRef(),'7:24');
    await button('닫기').tap();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.setViewportSize({width:390,height:844});
    await forward();await cue(22.5);
    await button('탐험 일지').tap();await button('말씀 인장 · 출 7:22–24').tap();assert.equal(await scrollRef(),'7:22');
    await button('닫기').tap();await button('왕궁으로').tap();
    await forward();assert.equal((await state()).chapter,1);await muted();
    const main=await state();
    await page.goto(url+'#palace-first');await page.locator('.palace-picture[data-first-view="yard"]').waitFor();
    await forward();await page.reload();
    assert.equal((await state()).firstVisit.beat,1);assert.equal((await state()).chapter,main.chapter);
    for(let step=0;step<7 && await next.innerText()!=='하던 재앙으로 돌아가기';step++){
      if(await page.locator('.palace-options').isVisible())await page.locator('.palace-option').first().tap();
      await forward();
    }
    assert.equal(await next.innerText(),'하던 재앙으로 돌아가기');
    await forward();assert.equal((await state()).chapter,1);assert.equal((await state()).beat,main.beat);
    assert.equal(new URL(page.url()).hash,'#palace');
    assert.deepEqual(errors,[]);
  }finally{await page.close();}
}
(async()=>{
  const folder=process.argv[2];if(folder)await fs.mkdir(folder,{recursive:true});
  const browser=await chromium.launch({proxy});try{
    const origin=await gameOrigin(browser);
    await run(browser,origin+'/index.html',folder,process.argv.includes('--continuous'));
    await run(browser,origin+'/preview.html',null,false);
    console.log('첫 재앙의 일터·강가·왕궁, 영상과 원문 인장 · no errors');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
