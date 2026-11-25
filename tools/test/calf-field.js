const assert=require('node:assert/strict');
const path=require('node:path');
const {attachScoreMeter,waitForAudibleCue}=require('./scene-music');
const button=(page,name)=>page.getByRole('button',{name,exact:true});
const stop=page=>page.evaluate(()=>BO.app2d.state.wilderness.stops.at(-1));
async function followVerse(page,name,ref){
  await button(page,name).click();
  assert.equal(await page.locator(':focus').getAttribute('data-verse'),ref);
  await button(page,'닫기').click();
  await page.locator('.wf-dialog').waitFor({state:'detached'});
}
async function playCalf(page,out){
  const btn=name=>button(page,name), title=()=>page.locator('.sf-scene-title strong').innerText();
  assert.equal(await title(),'백성이 가져온 금고리');
  const photo=page.locator('.cf-board img');
  assert.equal(await photo.evaluate(async img=>{await img.decode();return img.naturalWidth;}),1672);
  if(out)await page.screenshot({path:path.join(out,'calf-rings.png')});
  await btn('금고리가 모인 자리 확대').tap();
  assert(await btn('기록하고 휴 부르기').isDisabled());
  await btn('왼쪽 관찰창 문지르기').focus();await page.keyboard.press('Space');
  await page.reload();assert.equal((await stop(page)).rubMask,1);
  const paper=page.locator('.cf-rub');await paper.scrollIntoViewIfNeeded();
  const r=await paper.boundingBox(),y=r.y+r.height/2;
  await page.mouse.move(r.x+r.width*.5,y);await page.mouse.down();
  await page.mouse.move(r.x+r.width*.84,y,{steps:9});await page.mouse.up();
  assert.equal((await stop(page)).rubMask,7);
  await btn('기록하고 휴 부르기').click();assert.equal(await title(),'산 아래 깨진 두 돌판');
  await page.locator('.cf-inspect summary').click();assert(await page.locator('.cf-crop').isVisible());
  await page.locator('.cf-inspect summary').click();
  const fix=btn('필름 고정하고 온우 부르기'),strip=page.locator('.cf-strip');
  await fix.click();assert.equal((await stop(page)).phase,1);
  await strip.nth(0).tap();await btn('진영에서').click();await page.reload();
  assert.equal(await title(),'백성이 가져온 금고리');
  await btn('필름 맞추기로 돌아가기').click();
  assert.equal(await strip.nth(0).getAttribute('aria-pressed'),'true');
  await strip.nth(2).tap();assert.deepEqual((await stop(page)).filmOrder,[0,2,1]);
  await strip.nth(1).tap();await strip.nth(2).focus();await page.keyboard.press('Enter');
  await fix.click();assert.equal(await title(),'다시 나아가는 모세');
  await followVerse(page,'모세의 간구 · 출 32:32','32:32');
  await followVerse(page,'백성에게 일어난 일 · 출 32:35','32:35');
  await btn('다시 나아가는 모세').tap();assert.equal((await stop(page)).mapped,0);
  await followVerse(page,'이 칸의 말씀 · 출 32:3','32:3');
  await btn('백성이 가져온 금고리').tap();await page.reload();assert.equal((await stop(page)).mapped,1);
  await btn('산 아래 깨진 두 돌판').tap();await btn('다시 나아가는 모세').tap();
  await btn('현장 수첩에 보관').tap();assert.equal((await stop(page)).phase,3);
  await followVerse(page,'말씀 인장 · 출 32:30','32:30');
  await btn('산기슭에서').click();await page.reload();assert.equal(await title(),'산 아래 깨진 두 돌판');
  assert.equal(await page.evaluate(()=>BO.app2d.state.wilderness.earned.at(-1)),true);
  if(out)await page.screenshot({path:path.join(out,'calf-tablets.png')});
}
async function checkCalfSound(browser,origin,entry){
  const page=await browser.newPage({viewport:{width:320,height:568},hasTouch:true});
  const btn=name=>button(page,name),quiet=()=>page.waitForFunction(()=>readScore().every(t=>t.ended||t.state!=='running'));
  try{
    await attachScoreMeter(page);await page.goto(origin+entry+'#calf');
    assert.deepEqual(await page.evaluate(()=>readScore()),[]);
    await btn('금고리가 모인 자리 확대').tap();await waitForAudibleCue(page,21);
    // An existing three-phase notebook from the previous version has no film state.
    await page.evaluate(()=>{
      const app=BO.app2d,w=app.state.wilderness;
      w.stops[6]={phase:1,pos:4,dial:0,mapped:0};app.save();
    });
    await page.reload();await btn('필름 고정하고 온우 부르기').tap();await waitForAudibleCue(page,21.6);
    await btn('산기슭에서').tap();await waitForAudibleCue(page,20);
    await btn('진영에서').tap();await waitForAudibleCue(page,21);
    await btn('다음 날').tap();await waitForAudibleCue(page,21.6);
    await btn('모세의 간구 · 출 32:32').tap();await quiet();await btn('닫기').tap();
    await waitForAudibleCue(page,21.6);
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await quiet();
    await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await waitForAudibleCue(page,21.6);
    await btn('음악 끄기').tap();await quiet();await page.reload();
    await btn('진영에서').tap();assert.deepEqual(await page.evaluate(()=>readScore()),[]);
    await btn('음악 켜기').tap();await waitForAudibleCue(page,21);
    for(const [width,height] of [[320,568],[720,360],[1100,780]]){
      await page.setViewportSize({width,height});await page.evaluate(()=>document.documentElement.style.fontSize='200%');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&
        document.querySelector('.wf-scroll').scrollWidth<=document.querySelector('.wf-scroll').clientWidth+1));
    }
    await btn('탐험 입구').click();await page.waitForFunction(()=>readScore().every(t=>t.state==='closed'));
  }finally{await page.close();}
}
module.exports={playCalf,checkCalfSound};
