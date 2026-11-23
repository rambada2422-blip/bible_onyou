// 왕궁 진행 위치와 독립적으로 두 흔적, 예상, 성경 대조, 열 장의 일지를 검증한다.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require('playwright');
const {gameOrigin, proxy} = require('../game-server');
const out = path.resolve(process.argv[2] || 'dist/palace-watch-proof');

async function play(browser, url, firstPick) {
  const page = await browser.newPage({viewport:{width:360,height:640}, isMobile:true, hasTouch:true});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*.mp4', route => route.abort());
  await page.goto(url+'#palace');
  const dialog = page.locator('.watch-dialog');
  const tap = name => dialog.getByRole('button', {name,exact:true}).click();
  const read = () => page.evaluate(() => BO.app2d.state.palace);
  const data = await page.evaluate(() => BO.palaceWatchScenes);
  const chapters = await page.evaluate(() => BO.palaceChapters);
  assert.equal(data.length, 10);
  for (const [i, scene] of data.entries()) {
    const pick = (firstPick+i)%2, guess = 1-pick;
    assert.equal((await read()).chapter, i);
    await page.locator('.watch-launch').click();
    const spots = dialog.locator('.watch-spot');
    assert.equal(await spots.count(), 2);
    await dialog.locator('.watch-photo img').evaluate(e => e.decode());
    for (const spot of await spots.all()) {
      const r = await spot.boundingBox();
      assert(r && r.width>=44 && r.height>=44);
    }
    if (i===0) {
      await tap('영상 함께 보기 · '+chapters[i].seconds+'초');
      await dialog.getByText('영상을 불러오지 못했어요.',{exact:false}).waitFor();
    }
    if (i===6 && firstPick===0) await page.screenshot({path:path.join(out,'우박_두흔적.png')});
    await spots.nth(pick).click();
    assert((await dialog.innerText()).includes(scene.clues[pick].note));
    await tap('다음 일 예상하기');
    if (i===0) await page.reload();
    await tap(scene.guesses[guess]);
    assert((await dialog.innerText()).includes(chapters[i].beats[scene.before.beat].words));
    await tap('그 뒤의 기록');
    await dialog.locator('.watch-photo img').evaluate(e => e.decode());
    assert((await dialog.innerText()).includes(chapters[i].beats[scene.after.beat].words));
    if (i===6) {
      await tap('본문 듣기'); await dialog.getByRole('button',{name:'그만 듣기'}).waitFor();
      await page.setViewportSize({width:640,height:360}); await page.reload();
      assert.equal(await dialog.getByRole('button',{name:'그 뒤의 기록'}).getAttribute('aria-pressed'),'true');
      await page.setViewportSize({width:320,height:568});
    }
    await tap('두 장면을 일지에 잇기');
    await tap('전체 일지 펼치기');
    assert.equal(await dialog.locator('.watch-entry').count(),i+1);
    const saved = (await read()).watchNotes[i];
    assert(saved.done && saved.pick===pick && saved.guess===guess);
    assert((await dialog.locator('.watch-entry').last().innerText()).includes(scene.clues[pick].name));
    if(i===9 && firstPick===0) await page.screenshot({path:path.join(out,'열장_탐험일지.png')});
    await tap('왕궁으로');
    for(const beat of chapters[i].beats) {
      if(beat.options) await page.locator('.palace-option').nth(beat.answer).click();
      if(i===9 && (await read()).beat===chapters[i].beats.length-1) break;
      await page.locator('.palace-foot .onpaper').click();
    }
  }
  assert.deepEqual(errors,[]); await page.close();
  console.log(new URL(url).pathname,'열 장·흔적 10개·예상과 장절·본문 낭독·회전과 복원·영상 오류 뒤 계속하기 통과');
}
(async()=>{
  await fs.mkdir(out,{recursive:true});
  const b=await chromium.launch({proxy});
  try { const host=await gameOrigin(b); await play(b, host+'/index.html',0); await play(b,host+'/preview.html',1); }
  finally {await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
