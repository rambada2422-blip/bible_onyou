// 셋째 재앙의 사람·가축 사진과 요술사·바로의 기록을 웹 원본과 단일 파일에서 왕복한다.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require('playwright');
const {gameOrigin,proxy} = require('../game-server');
const {attachScoreMeter,waitForAudibleCue} = require('../scene-music');

async function walk(browser,url,out,continuous){
  const page=await browser.newPage({viewport:{width:360,height:740},isMobile:true,hasTouch:true});
  page.setDefaultTimeout(12000);
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await attachScoreMeter(page);
  const btn=name=>page.getByRole('button',{name,exact:true});
  const state=()=>page.evaluate(()=>BO.app2d.state.palace);
  const quiet=()=>page.waitForFunction(()=>readScore().every(t=>t.ended||t.state!=='running'));
  const cue=duration=>waitForAudibleCue(page,duration);
  const video=page.locator('.palace-picture video');
  async function verse(name,ref){
    await btn(name).tap();await quiet();
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.verse),ref);
    await btn('닫기').tap();
  }
  try{
    await page.goto(url+'#palace-dust');
    assert.equal((await state()).chapter,2);
    const start=Date.now();
    await verse('지팡이 끝의 티끌 살펴보기','8:16');
    assert(Date.now()-start<30000);
    await page.locator('.palace-option').last().tap();
    const play=page.locator('.palace-film-play');
    await play.tap();
    await page.waitForFunction(()=>document.querySelector('video')?.currentTime>.2);
    await quiet();
    if(continuous){
      let frames=0;
      for(const seconds of [9,22,35]){
        await page.waitForFunction(t=>document.querySelector('video')?.currentTime>=t,seconds,{timeout:30000});
        const count=await video.evaluate(v=>v.getVideoPlaybackQuality().totalVideoFrames);
        assert(count>frames);frames=count;
        console.log('셋째 재앙',seconds,'초',count,'프레임');
      }
    }else{
      await video.evaluate(v=>v.currentTime=15.5);
      await page.waitForFunction(()=>BO.app2d.state.palace.dustFilmAt>=15);
      await page.reload();await play.tap();
      await page.waitForFunction(()=>document.querySelector('video')?.currentTime>=15);
      await video.evaluate(v=>v.currentTime=v.duration-.4);
    }
    await page.locator('[data-dust-view="pen"]').waitFor();
    assert((await state()).dustFilmSeen);
    await cue(20);
    await btn('어깨를 긁는 목자').tap();
    assert.match(await page.locator('.pf-feedback').innerText(),/사진 1\/2/);
    await page.reload();
    assert.equal(await page.locator('.dust-print img').count(),1);
    await btn('몸을 비비는 염소').focus();await page.keyboard.press('Enter');
    assert.match(await page.locator('.pf-feedback').innerText(),/사진 2\/2/);
    assert.equal(await page.locator('.dust-print img').count(),2);
    await cue(20);
    if(out){
      await page.locator('.palace-scroll').evaluate(n=>n.scrollTop=0);
      await page.screenshot({path:path.join(out,'셋째재앙_목자와염소.png')});
    }
    await btn('음악 끄기').tap();await page.reload();assert(await btn('음악 켜기').isVisible());
    await btn('음악 켜기').tap();await cue(20);
    await btn('왕궁으로 가기').tap();await cue(22.5);
    await btn('읽어 줘').tap();await quiet();await btn('그만 듣기').tap();await cue(22.5);
    await verse('요술사들이 한 일 · 출 8:18','8:18');
    await btn('바로 돌아보기').tap();await quiet();
    await verse('바로의 반응 · 출 8:19','8:19');
    await page.setViewportSize({width:740,height:360});await page.reload();
    await page.addStyleTag({content:'html{font-size:150%!important}'});
    assert(await page.locator('[data-dust-view="king"]').isVisible());
    await btn('요술사들 보기').tap();await cue(22.5);
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await quiet();
    await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await cue(22.5);
    await btn('바로 돌아보기').tap();await quiet();
    await btn('탐험 일지').tap();await verse('말씀 인장 · 출 8:18–19','8:19');await btn('왕궁으로').tap();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    if(out){
      await page.setViewportSize({width:390,height:844});
      await page.locator('.palace-scroll').evaluate(n=>n.scrollTop=0);
      await page.screenshot({path:path.join(out,'셋째재앙_바로의반응.png')});
    }
    await btn('다음 재앙으로').tap();assert.equal((await state()).chapter,3);
    assert.equal(new URL(page.url()).hash,'#palace');
    // 기존 진행 중 사진으로 다시 보거나, 영상 파일이 없을 때도 정상 복귀한다.
    await page.goto(url+'#palace-dust');assert(await btn('이전').isDisabled());
    await page.route('**/03.mp4',r=>r.abort());
    await page.locator('.palace-option').first().tap();await play.tap();
    await btn('우리 사진으로 확인하기').tap();await btn('몸을 비비는 염소').tap();
    await page.reload();assert(await page.locator('[data-dust-view="pen"]').isVisible());
    await btn('왕궁으로 가기').tap();await btn('하던 재앙으로 돌아가기').tap();
    assert.equal((await state()).chapter,3);assert.equal((await state()).beat,0);
    assert.deepEqual(errors,[]);
  }finally{await page.close();}
}
(async()=>{
  const out=process.argv[2];if(out)await fs.mkdir(out,{recursive:true});
  const browser=await chromium.launch({proxy});
  try{
    const origin=await gameOrigin(browser);
    await walk(browser,origin+'/index.html',out,process.argv.includes('--continuous'));
    await walk(browser,origin+'/preview.html',null,false);
    console.log('셋째 재앙 영상·우리 사진·왕궁 원문·음악·복원 · no errors');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
