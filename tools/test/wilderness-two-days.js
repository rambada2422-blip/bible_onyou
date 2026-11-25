const assert=require('node:assert/strict');
const {attachScoreMeter,waitForAudibleCue}=require('./scene-music');

async function checkTwoDays(browser,origin,entry){
  const page=await browser.newPage({viewport:{width:320,height:568},hasTouch:true});
  const button=name=>page.getByRole('button',{name,exact:true});
  const quiet=()=>page.waitForFunction(()=>readScore().every(t=>t.ended||t.state!=='running'));
  try{
    await attachScoreMeter(page);await page.goto(origin+entry+'#manna-rest');
    assert.deepEqual(await page.evaluate(()=>readScore()),[]);
    await button('일곱째 날').tap();await waitForAudibleCue(page,21.176);
    assert.equal(await button('일곱째 날').getAttribute('aria-pressed'),'true');
    await button('사진 찍기 · 진영의 장막').tap();
    await page.reload();
    assert.equal(await button('일곱째 날').getAttribute('aria-pressed'),'true');
    await button('여섯째 날').tap();await waitForAudibleCue(page,19.2);
    await button('사진 찍기 · 거두는 사람들').tap();
    assert.equal(await page.locator('.wf-album figure').count(),2);
    await button('출 16:22').tap();await quiet();
    assert.equal(await page.locator(':focus').getAttribute('data-verse'),'16:22');
    await button('닫기').tap();await waitForAudibleCue(page,19.2);
    await button('일곱째 날').tap();await waitForAudibleCue(page,21.176);
    await button('음악 끄기').tap();await quiet();await page.reload();
    await button('여섯째 날').tap();assert.deepEqual(await page.evaluate(()=>readScore()),[]);
    await button('음악 켜기').tap();await waitForAudibleCue(page,19.2);
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await quiet();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  } finally {await page.close();}
}
module.exports={checkTwoDays};
