// 단일 파일과 웹 원본에서 아이의 입력으로 애굽·고센 관찰과 왕궁 결말을 잇는다.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require('playwright');
const {gameOrigin,proxy} = require('../game-server');
const {attachScoreMeter,waitForAudibleCue} = require('../scene-music');

async function walk(browser,url,out,continuous) {
  const page=await browser.newPage({viewport:{width:360,height:740},hasTouch:true,isMobile:true});
  page.setDefaultTimeout(12000);
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await attachScoreMeter(page);
  const btn=name=>page.getByRole('button',{name,exact:true});
  const next=page.locator('.palace-foot .onpaper');
  const video=page.locator('.palace-picture video');
  const slider=page.getByRole('slider',{name:'애굽 집과 고센 밭 비교'});
  const state=()=>page.evaluate(()=>BO.app2d.state.palace);
  const quiet=()=>page.waitForFunction(()=>readScore().every(t=>t.ended||t.state!=='running'));
  const cue=duration=>waitForAudibleCue(page,duration);
  async function verse(label,ref) {
    await btn(label).tap();await quiet();
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.verse),ref);
    await btn('닫기').tap();
  }
  async function shot(name) {
    if (!out)return;
    await page.locator('.palace-scroll').evaluate(n=>n.scrollTop=0);
    await page.screenshot({path:path.join(out,name+'.png')});
  }
  try{
    await page.goto(url+'#palace-flies');
    assert.equal((await state()).chapter,3);
    assert.deepEqual(await page.evaluate(()=>readScore()),[]);
    const start=Date.now();
    await verse('고센의 마을','8:22');
    assert(Date.now()-start<30000);await cue(25.714);
    await next.tap();await verse('그릇에 앉은 파리','8:24');
    await page.locator('.palace-option').last().tap();
    const play=page.locator('.palace-film-play');
    await play.tap();
    await page.waitForFunction(()=>document.querySelector('video')?.currentTime>.2);
    assert.equal(Math.round(await video.evaluate(v=>v.duration)),38);
    await quiet();
    if(continuous){
      let last=0;
      for(const t of [7,16,28,35]){
        await page.waitForFunction(t=>document.querySelector('video')?.currentTime>=t,t,{timeout:25000});
        const frames=await video.evaluate(v=>v.getVideoPlaybackQuality().totalVideoFrames);
        assert(frames>last);last=frames;console.log('파리 영상',t,'초',frames,'프레임');
      }
    }else{
      await video.evaluate(v=>v.currentTime=16);
      await page.waitForFunction(()=>BO.app2d.state.palace.fliesFilmAt>=15);
      await page.reload();await play.tap();
      await page.waitForFunction(()=>document.querySelector('video')?.currentTime>=15);
      await video.evaluate(v=>v.currentTime=v.duration-.4);
    }
    await slider.waitFor();assert((await state()).fliesFilmSeen);await cue(18.667);
    await btn('음식을 덮는 천').tap();
    assert.match(await page.locator('.pf-feedback[role=status]').innerText(),/1\/2/);
    await slider.focus();await page.keyboard.press('End');await cue(25.714);
    await btn('고센의 밭').tap();
    assert.match(await page.locator('.pf-feedback[role=status]').innerText(),/2\/2/);
    await btn('애굽 집').tap();await cue(18.667);
    const strip=await page.locator('.flies-strip').boundingBox();
    await page.mouse.move(strip.x+strip.width*.87,strip.y+strip.height*.3);await page.mouse.down();
    await page.mouse.move(strip.x+strip.width*.19,strip.y+strip.height*.3,{steps:12});await page.mouse.up();
    assert(Number(await slider.inputValue())>60);await cue(25.714);
    await btn('고센 밭').tap();await cue(25.714);
    const r=await slider.boundingBox();
    await page.mouse.move(r.x+r.width-5,r.y+r.height/2);await page.mouse.down();
    await page.mouse.move(r.x+r.width*.58,r.y+r.height/2,{steps:8});await page.mouse.up();
    const split=Number(await slider.inputValue());assert(split>45 && split<70);
    await page.reload();assert.equal(Number(await slider.inputValue()),split);
    await shot('넷째재앙_두곳의관찰창');
    await btn('애굽 집').tap();await cue(18.667);
    await btn('음악 끄기').tap();await page.reload();assert(await btn('음악 켜기').isVisible());
    await btn('음악 켜기').tap();await cue(18.667);
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});await quiet();
    await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await cue(18.667);
    await btn('왕궁으로 가기').tap();await cue(22.5);
    await btn('읽어 줘').tap();await quiet();await btn('그만 듣기').tap();await cue(22.5);
    await verse('온우의 말씀 기록 · 출 8:25','8:25');
    await next.tap();await verse('온우의 말씀 기록 · 출 8:27','8:27');
    await next.tap();await cue(24);
    await verse('파리 떼가 떠난 뜰 · 출 8:31','8:31');
    await btn('바로 보기').tap();await quiet();await verse('바로의 거절 · 출 8:32','8:32');
    await page.setViewportSize({width:740,height:360});await page.reload();
    await page.addStyleTag({content:'html{font-size:150%!important}'});
    assert(await page.locator('[data-flies-view=king]').isVisible());
    await btn('왕궁 뜰 보기').tap();await cue(24);await btn('바로 보기').tap();await quiet();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.setViewportSize({width:390,height:844});await shot('넷째재앙_왕궁에서의결말');
    await btn('탐험 일지').tap();await verse('말씀 인장 · 출 8:31–32','8:32');await btn('왕궁으로').tap();
    await next.tap();assert.equal((await state()).chapter,4);assert.equal(new URL(page.url()).hash,'#palace');await quiet();

    await page.goto(url+'#palace-flies');await btn('고센의 마을').waitFor();
    assert(await btn('이전').isDisabled());await next.tap();
    await page.route('**/04.mp4',route=>route.abort());
    await page.locator('.palace-option').first().tap();await play.tap();
    await btn('두 곳 사진으로 확인하기').tap();await btn('고센 밭').tap();await btn('고센의 밭').tap();
    await page.reload();assert.equal(await slider.inputValue(),'100');
    await next.tap();await next.tap();await next.tap();await btn('하던 재앙으로 돌아가기').tap();
    assert.equal((await state()).chapter,4);assert.equal((await state()).beat,0);assert.deepEqual(errors,[]);
  }finally{await page.close();}
}
(async()=>{
  const out=process.argv[2];if(out)await fs.mkdir(out,{recursive:true});
  const browser=await chromium.launch({proxy});
  try{
    const origin=await gameOrigin(browser);
    await walk(browser,origin+'/index.html',out,process.argv.includes('--continuous'));
    await walk(browser,origin+'/preview.html',null,false);
    console.log('넷째 재앙 · 비교창·두 원문·음악 왕복·복원 · no errors');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
