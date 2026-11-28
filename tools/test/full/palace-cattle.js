// 고삐·빈 우리·살아 있는 가축을 직접 촬영하고, 보고를 들은 바로의 결정까지 확인한다.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require('playwright');
const {gameOrigin,proxy}=require('../game-server');
const {attachScoreMeter,waitForAudibleCue}=require('../scene-music');

async function walk(browser,url,out,continuous){
  const page=await browser.newPage({viewport:{width:360,height:740},isMobile:true,hasTouch:true});
  page.setDefaultTimeout(12000);const errors=[];
  page.on('pageerror',e=>errors.push(e.message));await attachScoreMeter(page);
  const btn=name=>page.getByRole('button',{name,exact:true});
  const next=page.locator('.palace-foot .onpaper'),video=page.locator('.palace-picture video');
  const surface=page.locator('.cattle-finder'),status=page.locator('.pf-feedback[role=status]');
  const state=()=>page.evaluate(()=>BO.app2d.state.palace);
  const cue=duration=>waitForAudibleCue(page,duration);
  const quiet=()=>page.waitForFunction(()=>readScore().every(t=>t.ended||t.state!=='running'));
  async function verse(label,ref){
    await btn(label).tap();await quiet();
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.verse),ref);
    await btn('닫기').tap();
  }
  async function snapshot(name){
    if(!out)return;
    await page.locator('.palace-scroll').evaluate(n=>n.scrollTop=0);
    await page.screenshot({path:path.join(out,name+'.png')});
  }
  async function touch(x,y){
    const r=await surface.boundingBox();await page.touchscreen.tap(r.x+x*r.width,r.y+y*r.height);
  }
  try{
    await page.goto(url+'#palace-cattle');
    assert.equal((await state()).chapter,4);assert.deepEqual(await page.evaluate(()=>readScore()),[]);
    const start=Date.now();await verse('들에 있는 소 살펴보기','9:4');assert(Date.now()-start<30000);
    await next.tap();await verse('고삐의 기록 펼치기','9:5');
    await page.locator('.palace-option').last().tap();const play=page.locator('.palace-film-play');
    await play.tap();await page.waitForFunction(()=>document.querySelector('video')?.currentTime>.2);await quiet();
    assert.equal(Math.round(await video.evaluate(v=>v.duration)),37);
    if(continuous){
      let frames=0;
      for(const sec of [5,15,25,34]){
        await page.waitForFunction(t=>document.querySelector('video')?.currentTime>=t,sec,{timeout:25000});
        const n=await video.evaluate(v=>v.getVideoPlaybackQuality().totalVideoFrames);assert(n>frames);frames=n;
        console.log('다섯째 영상',sec,'초',n,'프레임');
      }
    }else{
      await video.evaluate(v=>v.currentTime=16);
      await page.waitForFunction(()=>BO.app2d.state.palace.cattleFilmAt>=15);
      await page.reload();await play.tap();await page.waitForFunction(()=>document.querySelector('video')?.currentTime>=15);
      await video.evaluate(v=>v.currentTime=v.duration-.4);
    }
    await surface.waitFor();assert((await state()).cattleFilmSeen);await cue(21.176);
    await touch(.15,.22);await btn('사진 찍기').tap();
    assert.match(await status.innerText(),/초점 안내/);assert(!(await state()).cattleMarks.halter);
    await touch(.34,.8);await btn('사진 찍기').tap();
    assert.match(await status.innerText(),/고삐.*1\/2/);
    await page.reload();assert.equal((await state()).cattlePenAim.x,34);
    const r=await surface.boundingBox();await page.mouse.move(r.x+r.width*.34,r.y+r.height*.8);await page.mouse.down();
    await page.mouse.move(r.x+r.width*.65,r.y+r.height*.56,{steps:10});await page.mouse.up();
    await surface.focus();await page.keyboard.press('Enter');assert.match(await status.innerText(),/울타리.*2\/2/);
    await surface.focus();await page.keyboard.press('ArrowRight');
    assert.equal((await state()).cattlePenAim.x,71);
    await snapshot('다섯째재앙_빈우리의초점');
    await btn('이스라엘 들로 가기').tap();await cue(17.143);await btn('초점 안내').tap();await btn('사진 찍기').tap();
    assert.match(await status.innerText(),/송아지.*1\/1/);await verse('가축 기록 · 출 9:6','9:6');
    await btn('빈 우리').tap();await cue(21.176);await btn('가축 떼').tap();await cue(17.143);
    await btn('음악 끄기').tap();await page.reload();assert(await btn('음악 켜기').isVisible());
    assert(await page.locator('[data-cattle-view=herd]').isVisible());
    await btn('음악 켜기').tap();await cue(17.143);
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});await quiet();
    await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await cue(17.143);
    await btn('왕궁으로 가기').tap();await cue(22.5);await btn('읽어 줘').tap();await quiet();await btn('그만 듣기').tap();await cue(22.5);
    await btn('바로의 결정').tap();await quiet();await verse('바로의 결정 · 출 9:7','9:7');
    await page.setViewportSize({width:740,height:360});await page.reload();await page.addStyleTag({content:'html{font-size:150%!important}'});
    assert(await page.locator('[data-cattle-view=king]').isVisible());await btn('확인한 소식').tap();await cue(22.5);
    await btn('바로의 결정').tap();await quiet();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.setViewportSize({width:390,height:844});await snapshot('다섯째재앙_확인뒤의바로');
    await btn('탐험 일지').tap();await verse('말씀 인장 · 출 9:6–7','9:7');await btn('왕궁으로').tap();
    await next.tap();assert.equal((await state()).chapter,5);assert.equal(new URL(page.url()).hash,'#palace');await quiet();

    await page.goto(url+'#palace-cattle');await btn('들에 있는 소 살펴보기').waitFor();
    assert(await btn('이전').isDisabled());await next.tap();await page.route('**/05.mp4',r=>r.abort());
    await page.locator('.palace-option').first().tap();await play.tap();await btn('우리와 들 사진으로 확인하기').tap();
    await btn('이스라엘 들로 가기').tap();await page.reload();assert(await page.locator('[data-cattle-view=herd]').isVisible());
    await next.tap();await btn('하던 재앙으로 돌아가기').tap();assert.equal((await state()).chapter,5);assert.equal((await state()).beat,0);
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
    console.log('다섯째 재앙 · 초점 촬영·가축 대조·말씀 인장·음악·복원 · no errors');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
