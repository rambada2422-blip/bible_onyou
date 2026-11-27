// 첫 출시판 저장과 새 입구에서 부엌의 두 흔적, 약속, 재앙 뒤의 결정을 왕복한다.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require('playwright');
const {gameOrigin,proxy} = require('../game-server');
const {attachScoreMeter,waitForAudibleCue} = require('../scene-music');

async function walk(browser,url,out,continuous) {
  const page=await browser.newPage({viewport:{width:360,height:740},isMobile:true,hasTouch:true});
  page.setDefaultTimeout(10000);
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await attachScoreMeter(page);
  const btn=name=>page.getByRole('button',{name,exact:true});
  const next=page.locator('.palace-foot .onpaper');
  const state=()=>page.evaluate(()=>BO.app2d.state.palace);
  const quiet=()=>page.waitForFunction(()=>readScore().every(t=>t.ended||t.state!=='running'));
  const cue=seconds=>waitForAudibleCue(page,seconds);
  async function readVerse(control,ref) {
    await btn(control).tap();await quiet();
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.verse),ref);
    await btn('닫기').tap();
  }
  async function photo(file) {
    if(!out)return;
    if(file==='약속과_결말.png')await page.locator('.frog-records').evaluate(n=>n.scrollIntoView({block:'start'}));
    else await page.locator('.palace-scroll').evaluate(n=>n.scrollTop=0);
    await page.screenshot({path:path.join(out,file)});
  }
  try {
    await page.goto(url+'#palace-frogs');
    assert.equal((await state()).chapter,1);
    const start=Date.now();
    assert.deepEqual(await page.evaluate(()=>readScore()),[]);
    await readVerse('갈대 줄기 살펴보기','8:3');
    assert(Date.now()-start<30000);await cue(20);
    await next.tap();
    const watch=btn('영상 보기 · 52초');
    assert(await watch.isHidden());
    await page.locator('.palace-option').last().tap();
    await watch.tap();
    const video=page.locator('.palace-picture video');
    await page.waitForFunction(()=>document.querySelector('video')?.currentTime>.2);await quiet();
    assert.equal(Math.round(await video.evaluate(v=>v.duration)),52);
    if(continuous){
      for(const seconds of [12,28,43]){
        await page.waitForFunction(t=>document.querySelector('video')?.currentTime>=t,seconds,{timeout:25000});
        console.log('개구리 영상 연속 재생',seconds,'초',await video.evaluate(v=>v.getVideoPlaybackQuality().totalVideoFrames),'프레임');
      }
    } else {
      await video.evaluate(v=>v.currentTime=19);
      await page.waitForFunction(()=>BO.app2d.state.palace.frogFilmAt>=15);
      await page.reload();assert.equal(await video.count(),0);
      await watch.tap();await page.waitForFunction(()=>document.querySelector('video')?.currentTime>=15);
      await video.evaluate(v=>v.currentTime=v.duration-.4);
    }
    await page.locator('[data-frog-view="kitchen"]').waitFor({timeout:16000});
    await cue(21.429);
    assert.equal((await state()).frogFilmSeen,true);
    assert(!/완강|완악/.test(await page.locator('.palace-panel').innerText()));
    await btn('반죽판 위의 개구리').tap();
    await page.reload();assert(await page.locator('.frog-zoom').count());
    await btn('부엌 전체 보기').tap();await cue(21.429);
    await btn('화덕 앞의 개구리').focus();await page.keyboard.press('Enter');
    assert.match(await page.locator('.pf-feedback').innerText(),/2\/2/);
    await photo('부엌_화덕.png');
    await next.tap();await cue(22.5);
    await btn('읽어 줘').tap();await quiet();await btn('그만 듣기').tap();await cue(22.5);
    await btn('음악 끄기').tap();await page.reload();assert(await btn('음악 켜기').isVisible());
    await btn('음악 켜기').tap();await cue(22.5);
    await next.tap();await next.tap();await next.tap();
    await cue(24);await readVerse('마당 원문 · 출 8:13','8:13');
    await btn('앞서 한 약속').tap();await cue(22.5);
    await readVerse('앞서 한 약속 원문 · 출 8:8','8:8');
    await btn('그 뒤의 반응').tap();await quiet();
    await readVerse('그 뒤의 반응 원문 · 출 8:15','8:15');
    await page.setViewportSize({width:844,height:390});await page.reload();
    await page.addStyleTag({content:'html{font-size:150% !important;}'});
    assert(await page.locator('[data-frog-view="turned"]').isVisible());
    await btn('마당').tap();await cue(24);
    await page.evaluate(()=>{
      Object.defineProperty(document,'hidden',{configurable:true,value:true});
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await quiet();
    await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
    await cue(24);
    await btn('그 뒤의 반응').tap();await quiet();
    await btn('앞서 한 약속').tap();await cue(22.5);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.setViewportSize({width:320,height:568});await photo('약속과_결말.png');
    await btn('탐험 일지').tap();await quiet();
    await readVerse('말씀 인장 · 출 8:8, 15','8:15');
    await btn('왕궁으로').tap();
    await next.tap();
    await page.locator('.palace-option').first().tap();assert(await next.isDisabled());
    await page.locator('.palace-option').last().tap();await next.tap();
    assert.equal((await state()).chapter,2);assert.equal(new URL(page.url()).hash,'#palace');await quiet();

    // 세 번째 재앙에 도착한 예전 저장으로 두 번째를 따로 보아도 본편 위치와 일지가 남는다.
    await page.goto(url+'#palace-frogs');await btn('갈대 줄기 살펴보기').waitFor();
    assert(await btn('이전').isDisabled());
    await next.tap();
    await btn('부엌 사진으로 살펴보기').tap();
    await page.reload();assert(await btn('반죽판 위의 개구리').isVisible());
    assert.equal((await state()).frogVisit.beat,1);assert.equal((await state()).chapter,2);
    await page.route('**/02.mp4',r=>r.abort());
    await page.locator('.palace-film-play').tap();
    await page.locator('.palace-option').first().tap();await watch.tap();
    await btn('부엌 사진으로 확인하기').tap();await btn('화덕 앞의 개구리').tap();
    await next.tap();await next.tap();await next.tap();await next.tap();await next.tap();
    await page.locator('.palace-option').last().tap();
    await btn('하던 재앙으로 돌아가기').tap();
    assert.equal((await state()).chapter,2);assert.equal((await state()).beat,0);
    assert.equal(new URL(page.url()).hash,'#palace');
    assert.deepEqual(errors,[]);
  } finally {await page.close();}
}
(async()=>{
  const out=process.argv[2];if(out)await fs.mkdir(out,{recursive:true});
  const browser=await chromium.launch({proxy});
  try{
    const origin=await gameOrigin(browser);
    await walk(browser,origin+'/index.html',out,process.argv.includes('--continuous'));
    await walk(browser,origin+'/preview.html',null,false);
    console.log('개구리 부엌·약속·결말·세 번째 재앙 복귀 · no errors');
  } finally {await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
