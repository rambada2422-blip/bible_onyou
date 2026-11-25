const assert=require('node:assert/strict');
const path=require('node:path');

async function playSinai(page,out){
  const btn=name=>page.getByRole('button',{name,exact:true});
  const board=page.locator('.sf-board');
  const state=()=>page.evaluate(()=>{const s=BO.app2d.state.wilderness;return s.stops[s.index];});
  async function aim(x,y){
    await board.scrollIntoViewIfNeeded();
    const r=await board.boundingBox();
    await page.touchscreen.tap(r.x+r.width*x,r.y+r.height*y);
  }
  async function verifyPhoto(){
    assert(await page.locator('.sf-world').evaluate(async img=>{await img.decode();return img.naturalWidth>=1500;}));
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  await verifyPhoto();
  await btn('사진 찍기').tap();assert.equal((await state()).phase,0);
  assert.equal((await state()).personalPhoto.scene,'arrival');
  await aim(.14,.62);await page.reload();assert(Math.abs((await state()).finder[0]-14)<2);
  await btn('사진 찍기').tap();assert.equal((await state()).phase,1);
  await btn('관측창 고정').tap();assert.equal((await state()).phase,1);
  await board.focus();await page.keyboard.press('ArrowLeft');await page.reload();
  assert.equal((await state()).filmOffset,13);
  for(let i=0;i<6;i++)await btn('필름 왼쪽').click();
  await btn('관측창 고정').tap();assert.equal((await state()).phase,2);
  await verifyPhoto();
  const storm=await page.locator('.sf-world').getAttribute('src');
  await btn('장막을 친 때').tap();
  assert.notEqual(await page.locator('.sf-world').getAttribute('src'),storm);
  await aim(.84,.69);await btn('사진 찍기').tap();assert(!(await state()).crowdPhoto);
  await btn('구름이 덮인 때').tap();
  await btn('십계명 원문 펼치기 · 출 20:1–17').tap();
  assert.equal(await page.locator(':focus').getAttribute('data-verse'),'20:1');
  await btn('닫기').tap();
  await aim(.84,.69);await btn('사진 찍기').tap();await page.reload();
  assert.deepEqual(await page.locator('.sf-scripture blockquote').allTextContents(),[await page.evaluate(()=>BO.wildScripture.verses['20:18'])]);
  await btn('산 앞에 친 장막 사진 붙이기').click();assert.equal((await state()).phase,2);
  await page.screenshot({path:path.join(out,'sinai-contact-sheet.png')});
  await btn('멀리 선 백성 사진 붙이기').click();assert.equal((await state()).phase,3);
  assert.equal(await page.locator('.sf-prints figure.sf-print').count(),2);
  await btn('산 앞에 친 장막').click();await page.reload();assert((await state()).reviewEarly);
  await btn('멀리 선 백성').click();
}
module.exports={playSinai};
