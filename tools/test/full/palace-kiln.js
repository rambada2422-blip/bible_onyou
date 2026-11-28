// 여섯째 재앙의 영상과 기록 필름을 오가고 개역성경 11절·12절 및 일지 인장을 연다.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require('playwright');
const {gameOrigin,proxy} = require('../game-server');
const {attachScoreMeter,waitForAudibleCue} = require('../scene-music');

async function play(browser,url,out,continuous){
  const p=await browser.newPage({viewport:{width:360,height:740},isMobile:true,hasTouch:true});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(12000);await attachScoreMeter(p);
  const btn=name=>p.getByRole('button',{name,exact:true});
  const playFilm=p.locator('.palace-film-play'), film=p.locator('.palace-picture video');
  const slider=p.getByRole('slider',{name:'휴의 기록 필름 감기'});
  const quiet=()=>p.waitForFunction(()=>readScore().every(t=>t.ended||t.state!=='running'));
  const cue=seconds=>waitForAudibleCue(p,seconds);
  async function verse(label,ref){
    await btn(label).tap();await quiet();
    assert.equal(await p.evaluate(()=>document.activeElement.dataset.verse),ref);
    await btn('닫기').tap();
  }
  async function snap(name){
    if(!out)return;
    await p.locator('.palace-scroll').evaluate(n=>n.scrollTop=0);
    await p.screenshot({path:path.join(out,name+'.png')});
  }
  try{
    await p.goto(url+'#palace-kiln');
    assert.deepEqual(await p.evaluate(()=>readScore()),[]);
    const first=Date.now();await verse('두 손의 재 살펴보기','9:8');assert(Date.now()-first<30000);
    await p.locator('.palace-option').last().tap();await playFilm.tap();
    await p.waitForFunction(()=>document.querySelector('video')?.currentTime>.2);await quiet();
    assert.equal(Math.round(await film.evaluate(v=>v.duration)),43);
    if(continuous){
      let frames=0;
      for(const t of [4,10,19,29,40]){
        await p.waitForFunction(t=>document.querySelector('video')?.currentTime>=t,t,{timeout:18000});
        const now=await film.evaluate(v=>v.getVideoPlaybackQuality().totalVideoFrames);
        assert(now>frames);frames=now;console.log('여섯째 영상',t,'초',frames,'프레임');
      }
    }else{
      await film.evaluate(v=>v.currentTime=17);
      await p.waitForFunction(()=>BO.app2d.state.palace.kilnFilmAt>=15);
      await p.reload();await playFilm.tap();
      await p.waitForFunction(()=>document.querySelector('video')?.currentTime>=15);
      await film.evaluate(v=>v.currentTime=v.duration-.35);
    }
    await slider.waitFor();await cue(19.2);assert.equal(await slider.inputValue(),'0');
    await btn('손 안의 잿가루').tap();await btn('작업장으로 감기').tap();await cue(22.8);
    await btn('팔을 감싸 쥔 사람').tap();await btn('내려놓은 연장').tap();
    assert.equal(await p.locator('.kiln-counter').innerText(),'현장 기록 3/4');await snap('여섯째재앙_멈춘작업장');
    await p.reload();assert.equal(await slider.inputValue(),'1');
    assert.equal(await btn('팔을 감싸 쥔 사람').getAttribute('aria-pressed'),'true');
    await slider.focus();await slider.press('ArrowLeft');await cue(19.2);
    await slider.press('ArrowRight');await cue(22.8);await btn('가축 쪽으로 감기').tap();await quiet();
    await btn('가축의 옆구리').tap();assert.equal(await p.locator('.kiln-counter').innerText(),'현장 기록 4/4');
    await btn('이전 사진').tap();await cue(22.8);await btn('음악 끄기').tap();await quiet();
    await p.reload();assert(await btn('음악 켜기').isVisible());await btn('음악 켜기').tap();await cue(22.8);
    await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});await quiet();
    await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await cue(22.8);
    await btn('다음 사진').tap();await quiet();await btn('왕궁 기록 열기').tap();await cue(22.5);
    await btn('읽어 줘').tap();await quiet();await btn('그만 듣기').tap();await cue(22.5);
    await verse('술객들의 기록 · 출 9:11','9:11');await btn('바로의 반응').tap();await quiet();
    await verse('바로의 기록 · 출 9:12','9:12');await p.setViewportSize({width:740,height:360});await p.reload();
    await p.addStyleTag({content:'html{font-size:150%!important}'});assert(await p.locator('[data-kiln-view=king]').isVisible());
    await btn('술객들의 자리').tap();await cue(22.5);await btn('바로의 반응').tap();await quiet();
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await p.setViewportSize({width:390,height:844});await snap('여섯째재앙_왕궁의두기록');
    await btn('탐험 일지').tap();await verse('말씀 인장 · 출 9:11–12','9:12');await btn('왕궁으로').tap();
    await btn('다음 재앙으로').tap();assert.equal(await p.locator('h1').innerText(),'들판을 때린 우박');
    assert.equal(new URL(p.url()).hash,'#palace');await quiet();

    await p.goto(url+'#palace-kiln');await btn('두 손의 재 살펴보기').waitFor();assert(await btn('이전').isDisabled());
    await p.route('**/06.mp4',r=>r.abort());await p.locator('.palace-option').first().tap();
    await playFilm.tap();await btn('작업장 사진으로 확인하기').tap();await btn('작업장으로 감기').tap();
    await p.reload();assert.equal(await slider.inputValue(),'1');
    await btn('가축 쪽으로 감기').tap();await btn('왕궁 기록 열기').tap();await btn('하던 재앙으로 돌아가기').tap();
    assert.equal(await p.locator('h1').innerText(),'들판을 때린 우박');assert.deepEqual(errors,[]);
  }finally{await p.close();}
}
(async()=>{
  const out=process.argv[2];if(out)await fs.mkdir(out,{recursive:true});
  const browser=await chromium.launch({proxy});
  try{
    const origin=await gameOrigin(browser);
    await play(browser,origin+'/index.html',out,process.argv.includes('--continuous'));
    await play(browser,origin+'/preview.html',null,false);
    console.log('여섯째 재앙 · 기록 필름·왕궁 원문·음악·영상 복원 · no errors');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
