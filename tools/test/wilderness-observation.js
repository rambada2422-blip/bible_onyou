/* 그림 안팎의 시점과 음원이 함께 복원되는지 실제로 누르고 디코딩한 출력으로 검사한다. */
const assert=require('node:assert/strict');
const path=require('node:path');
const {attachScoreMeter,waitForAudibleCue}=require('./scene-music');

async function checkObservations(browser,origin,entry,out){
  const page=await browser.newPage({viewport:{width:360,height:720},hasTouch:true});
  page.setDefaultTimeout(7000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const button=name=>page.getByRole('button',{name,exact:true});
  const seen=page.locator('.wf-optics'), taps=name=>seen.getByRole('button',{name,exact:true}).tap();
  const audible=duration=>waitForAudibleCue(page,duration);
  const quiet=()=>page.waitForFunction(()=>readScore().every(t=>t.ended||t.state!=='running'));
  const track={road:24*60/77,bitter:18*60/66,water:24*60/84,springs:24*60/89,tents:24*60/63};
  try{
    await attachScoreMeter(page);
    await page.goto(origin+entry+'#marah');
    assert.deepEqual(await page.evaluate(()=>readScore()),[]);
    await button('사흘 길').tap();await audible(track.road);
    const road=await seen.locator('canvas').evaluate(c=>c.toDataURL());
    await taps('물가의 백성');await audible(track.bitter);
    assert.notEqual(await seen.locator('canvas').evaluate(c=>c.toDataURL()),road);
    await taps('사흘 길');await audible(track.road);
    await taps('물결 속 나무');await audible(track.water);
    await page.setViewportSize({width:640,height:360});await page.reload();
    assert.equal(await seen.locator('h3').innerText(),'물이 달아진 뒤');
    assert.deepEqual(await page.evaluate(()=>readScore()),[]);
    await taps('물결 속 나무');await audible(track.water);
    await taps('두루마리 열기 · 출 15:25');
    await page.waitForFunction(()=>document.activeElement.dataset.verse==='15:25');await quiet();
    await page.reload();
    await page.waitForFunction(()=>document.activeElement.dataset.verse==='15:25');await quiet();
    await page.keyboard.press('Escape');
    await seen.waitFor();await audible(track.water);
    await page.setViewportSize({width:320,height:568});
    await page.addStyleTag({content:':root {font-size:200%}'});
    for(const size of [[320,568],[568,320],[390,844],[844,390],[1024,768]]){
      await page.setViewportSize({width:size[0],height:size[1]});
      assert(await seen.evaluate(d=>d.scrollWidth<=d.clientWidth+1));
      const tabs=seen.locator('.wf-view-tabs button');
      for(const b of await tabs.all()){const r=await b.boundingBox();assert(r.width>=44&&r.height>=44);}
    }
    await page.setViewportSize({width:360,height:720});await page.reload();
    await seen.waitFor();await page.screenshot({path:path.join(out,'marah-optics.png')});
    await taps('닫기');await seen.waitFor({state:'detached'});await audible(track.road);
    await page.locator('.wf-pin').tap();await audible(track.bitter);
    await button('음악 끄기').tap();await quiet();
    await page.reload();await button('물결 속 나무').tap();
    assert.deepEqual(await page.evaluate(()=>readScore()),[]);
    await taps('닫기');await button('음악 켜기').tap();await audible(track.bitter);
    await button('설정').tap();await button('소리 켜짐').tap();await quiet();
    await button('닫기').tap();assert(await button('음악 듣기').isDisabled());
    await page.reload();await button('사흘 길').tap();assert.deepEqual(await page.evaluate(()=>readScore()),[]);
    await taps('닫기');await button('설정').tap();await button('소리 꺼짐').tap();await button('닫기').tap();
    await audible(track.bitter);
    // 완료 저장에서 현장 기록을 왕복한 뒤 다음 장소로 넘어간다. 전체 탐사 과정은 wilderness.js가 검증한다.
    await page.evaluate(()=>{BO.app2d.state.wilderness.stops[0].phase=3;BO.app2d.save();});
    await page.reload();await button('처음 기록 다시 보기').tap();await audible(track.road);
    await page.reload();await button('나중 기록 다시 보기').tap();await audible(track.water);
    await button('엘림의 샘 답사하기').tap();await audible(track.springs);
    await button('물가의 장막').tap();await audible(track.tents);
    await taps('종려 그늘');await audible(track.springs);
    await taps('물가의 장막');await audible(track.tents);
    await page.screenshot({path:path.join(out,'elim-optics.png')});
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await quiet();
    await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await audible(track.tents);
    await taps('닫기');await audible(track.springs);
    await button('탐험 입구').tap();
    await page.waitForFunction(()=>readScore().every(t=>t.state==='closed'));
    await page.goto(origin+entry+'#elim');
    await page.getByRole('heading',{name:'엘림의 샘',exact:true}).waitFor();
    assert.deepEqual(errors,[]);
  }finally{await page.close();}
}
module.exports={checkObservations};
