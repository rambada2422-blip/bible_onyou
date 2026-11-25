/* 광야 본편의 실제 버튼을 눌러 복원, 관찰, 인장과 기존 수첩을 확인한다. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { chromium } = require('playwright');
const { gameOrigin } = require('./game-server');

const { checkObservations } = require('./wilderness-observation');
const {playRock,checkRockSound,checkRockLegacy}=require('./rephidim-field');
const {playCalf,checkCalfSound}=require('./calf-field');
const {playSinai}=require('./sinai-field');
const {checkTwoDays}=require('./wilderness-two-days');
const { checkManna } = require('./wilderness-manna');

const stopNames = ['마라의 물가', '엘림의 샘', '만나를 거두는 아침', '여섯째 날과 일곱째 날', '반석에서 흐른 물', '시내산 앞의 진영', '금송아지 사건의 진영'];
const seals = ['15:25', '15:27', '16:18', '16:30', '17:6', '20:18', '32:30'];
const exact = name => ({name, exact:true});
async function runRoute(browser, origin, out, entry, width) {
  const page = await browser.newPage({viewport:{width,height:640}, hasTouch:true, reducedMotion:'reduce'});
  page.setDefaultTimeout(7000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const button = name => page.getByRole('button', exact(name));
  async function click(name) {
    await button(name).click();
    if (name==='닫기') await page.locator('.wf-dialog').waitFor({state:'detached'});
  }
  const state = () => page.evaluate(() => BO.app2d.state.wilderness);
  const heading = () => page.locator('.wf-heading h1').innerText();
  await page.goto(origin + entry);
  if (entry.includes('redsea')) {
    await page.evaluate(() => {
      const s = BO.app2d.state;
      s.redSea.chapter = 3; s.redSea.finished = true;
      BO.app2d.save();
    });
    await page.reload();
    await click('마라로 떠나기');
  }
  assert(page.url().endsWith('#wilderness'));
  const verses = await page.evaluate(() => BO.wildScripture.verses);
  assert.equal(createHash('sha256').update(JSON.stringify(verses)).digest('hex'),
    '97aad33e6c6130f76b84f9c1bd64b87953a3be4017aec0a81af5e7b8a731e4d7');
  const data = await page.evaluate(() => BO.wildField);
  const seen = new Set();
  for (const [i,stage] of data.stages.entries()) {
    assert.equal(await heading(),stopNames[i]);
    if(stage.beats){
      if(stage.id==='sinai'||stage.id==='calf')await page.locator('.wf-library summary').click();
      assert(page.url().endsWith(stage.id==='sabbath'?'#wilderness':'#sinai'));
      for(const [j,beat] of stage.beats.entries()){
        assert.equal(await page.locator('.wf-record p').innerText(),beat.notes[2]);
        await click('이 대목의 원문 · 출 '+beat.ref);
        assert.equal(await page.locator(':focus').getAttribute('data-verse'),beat.ref.split('–')[0]);
        await click('닫기');
        if(j===1){await page.reload();assert.equal((await state()).stops[i].beat,j);if(stage.id==='sinai'||stage.id==='calf')await page.locator('.wf-library summary').click();}
        if(j<stage.beats.length-1)await click('뒤 대목');
      }
    }
    await click('말씀 두루마리');
    for (const verse of await page.locator('.wf-verse').all()) {
      const ref = await verse.getAttribute('data-verse');
      assert.equal(await verse.locator('span').innerText(), verses[ref]);
      seen.add(ref);
    }
    await click('닫기');
    if (!i) {
      await click('설정');
      await page.getByRole('combobox').selectOption('2');
      await click('소리 켜짐');
      await click('닫기');
      const before = (await state()).stops[0].pos;
      await page.locator('.wf-field').focus();
      await page.keyboard.press('ArrowRight');
      assert.equal((await state()).stops[0].pos,before+1);
    }
    if(stage.id==='sinai'){
      await playSinai(page,out);
      await click('관측대');
      await page.getByRole('dialog').getByRole('button',exact('말씀 인장 · 출 20:18')).click();
      await page.getByRole('dialog',exact('말씀 두루마리')).waitFor();
      assert.equal(await page.locator(':focus').getAttribute('data-verse'),'20:18');
      await click('닫기');
      await click('금송아지 사건으로');
      continue;
    }
    if(stage.id==='rock'){
      await playRock(page,width===360?out:null);
      await click('관측대');
      assert.equal(await page.locator('.wf-slot button').count(),i+1);
      await click('닫기');
      if(width===360){await click('시내산 수첩으로');await click('시내산 본편 답사');}
      else await click('시내산 본편으로');
      continue;
    }
    if(stage.id==='calf'){
      await playCalf(page,width===360?out:null);
      await click('관측대');
      assert.equal(await page.locator('.wf-slot button').count(),i+1);
      await page.getByRole('dialog').getByRole('button',exact('말씀 인장 · 출 32:30')).click();
      await page.getByRole('dialog',exact('말씀 두루마리')).waitFor();
      assert.equal(await page.locator(':focus').getAttribute('data-verse'),'32:30');
      await click('닫기');await click('시내산 수첩으로');continue;
    }
    const firstFrame = await page.locator('.wf-picture').evaluate(c => c.toDataURL());
    await page.locator('.wf-pin').tap();
    await page.locator('.wf-role').nth(0).tap();
    await click('접사 렌즈로 살펴보기');
    if(stage.groundPoint){
      await page.getByRole('slider',exact('이슬 전후 사진 비교선')).focus();
      await page.keyboard.press('End');await click('알갱이 위치 기록');
      await page.locator('.wf-dialog').waitFor({state:'detached'});
    }
    assert.equal((await state()).stops[i].phase,1);
    await page.locator('.wf-role').nth(1).tap();
    await click('장비 고정');
    assert.equal((await state()).stops[i].phase,1);
    const dial = page.getByRole('slider');
    await dial.focus();await page.keyboard.press(stage.aim===0?'Home':'End');
    await page.setViewportSize({width:640,height:width});
    await page.reload();
    assert.equal(await dial.inputValue(),String(stage.aim));
    assert.equal((await state()).actor,1);
    await page.setViewportSize({width,height:640});
    await click('장비 고정');
    if(!stage.frames)assert.notEqual(await page.locator('.wf-picture').evaluate(c=>c.toDataURL()),firstFrame);
    await page.locator('.wf-pin').tap();
    await page.locator('.wf-role').nth(2).tap();
    if (width===360 && (i===1||i===3||i>=4)) {
      await page.locator('.wf-scroll').evaluate(e=>e.scrollTop=0);
      await page.screenshot({path:path.join(out,stage.id+'.png')});
    }
    assert.equal(await page.locator('.wf-friend:visible').count(),2);
    assert(await page.locator('.wf-talk span').evaluate(s=>s.offsetHeight<=parseFloat(getComputedStyle(s).lineHeight)*2+1));
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    if(stage.frames){
      const order=width===360?[1,0]:[0,1];
      for(const frame of order){
        await click(stage.frames[frame]);
        const picture=await page.locator('.wf-picture').evaluate(c=>c.toDataURL());
        assert.equal(picture===firstFrame,frame===0);
        assert.equal(await page.locator('.wf-landmark:visible').count(),1);
        await click(stage.trail[frame][0]+' 관찰');
        if(frame===order[0]){
          await click(stage.trail[frame][0]+' 관찰');
          await page.setViewportSize({width:640,height:width});await page.reload();
          assert.equal((await state()).stops[i].observed,1<<frame);
          assert.equal(await button(stage.frames[frame]).getAttribute('aria-pressed'),'true');
          await page.setViewportSize({width,height:640});
        }
      }
    }else{
      await click(stage.trail[1][0]+' 관찰');
      assert.equal((await state()).stops[i].mapped,0);
      for(const [j,landmark] of stage.trail.entries()){
        await click(landmark[0]+' 관찰');
        if(j===0){await page.reload();assert.equal((await state()).stops[i].mapped,1);}
      }
    }
    await click(stage.choices[1-stage.match]);
    assert.equal((await state()).stops[i].phase,2);
    await click('말씀과 나란히 살피기');
    assert.equal(await page.locator(':focus').getAttribute('data-verse'),seals[i]);
    await page.keyboard.press('Escape');
    await click(stage.choices[stage.match]);
    assert((await state()).earned[i]);
    assert(await page.getByText(stage.card+' 관찰 카드', {exact:true}).isVisible());
    await click('처음 기록 다시 보기');
    assert.equal(await page.locator('.wf-picture').evaluate(c=>c.toDataURL()),firstFrame);
    await click('나중 기록 다시 보기');
    await page.reload();await click('관측대');
    assert.equal(await page.locator('.wf-slot button').count(),i+1);
    const completed=i+1+(entry.includes('redsea')?1:0);
    assert.equal(await page.locator('.wf-cabinet .wf-lit').count(),[1,3,6,10].filter(n=>n<=completed).length);
    await page.getByRole('dialog').getByRole('button',exact('말씀 인장 · 출 '+seals[i])).click();
    await page.getByRole('dialog',exact('말씀 두루마리')).waitFor();
    assert.equal(await page.locator(':focus').getAttribute('data-verse'),seals[i]);
    await click('닫기');
    await click(stopNames[i+1]+' 답사하기');
  }
  assert.equal(seen.size,118);
  assert.equal(await page.locator(':focus').innerText(),'시내산의 기록');
  assert.equal(await page.locator('.xt-entry').nth(1).locator('details').count(),3);
  assert.equal(await page.evaluate(()=>BO.app2d.state.exodusTrail.best[1]),undefined);
  const mountEntries=page.locator('.xt-entry').nth(2).locator('details summary');
  assert.deepEqual(await mountEntries.allTextContents(),['십계명을 듣는 백성','금송아지']);
  await click('시내산 본편 답사');assert.equal(await heading(),stopNames[6]);
  await click('시내산 수첩으로');
  await click('광야 본편 답사');await click('이 장소 다시 답사');
  assert((await state()).earned.every(Boolean));
  await click('탐험 입구');
  await click('광야 본편 이어 보기');
  assert.equal(await heading(),stopNames[4]);
  assert.deepEqual(errors,[]);await page.close();
}

async function checkOldSaves(browser,origin){
  for(const count of [4,6]){
    const page=await browser.newPage({viewport:{width:320,height:480}});
    await page.goto(origin+'/index.html#wilderness');
    await page.evaluate(count=>{
      const app=BO.app2d;
      const stops=Array.from({length:count},(_,i)=>({pos:7,phase:i===count-1?2:3,dial:2,mapped:1}));
      const earned=stops.map(s=>s.phase===3);
      app.state.wilderness={stops,earned,index:count-1};
      if(count===6)Object.assign(app.state.wilderness,{desertIndex:3,mountainIndex:5});
      app.save();
    },count);
    await page.goto(origin+'/index.html#home');
    await page.getByRole('button',exact(count===6?'시내산 본편 이어 보기':'광야 본편 이어 보기')).click();
    assert.equal(await page.locator('.wf-heading h1').innerText(),count===6?stopNames[6]:stopNames[4]);
    const oldProgress=await page.evaluate(()=>BO.app2d.state.wilderness);
    assert.equal(oldProgress.stops[oldProgress.index].phase,2);
    assert.equal(oldProgress.stops[oldProgress.index].pos,7);
    assert.equal(oldProgress.earned[3],false);
    await page.goto(origin+'/index.html#manna-rest');
    assert.equal(await page.locator('.wf-heading h1').innerText(),stopNames[3]);
    await page.reload();
    assert.equal(await page.locator('.wf-heading h1').innerText(),stopNames[3]);
    const current=await page.evaluate(()=>BO.app2d.state.wilderness);
    assert.deepEqual(current.earned,oldProgress.earned);
    assert.deepEqual(current.stops[oldProgress.index],oldProgress.stops[oldProgress.index]);
    await page.close();
  }
}

async function checkHints(browser,origin) {
  const page=await browser.newPage({viewport:{width:320,height:480}});
  await page.clock.install();
  await page.goto(origin+'/index.html#wilderness');
  for(const [mode,seconds] of [[0,10],[1,15],[2,25]]) {
    await page.getByRole('button',exact('설정')).click();
    await page.getByRole('combobox').selectOption(String(mode));
    await page.getByRole('button',exact('닫기')).click();
    await page.locator('.wf-dialog').waitFor({state:'detached'});
    await page.clock.runFor(seconds*1000+25);
    assert(await page.locator('.wf-thought').isVisible(),'mode '+mode+' first hint');
    assert.equal(await page.locator('.wf-glow').count(),0);
    await page.clock.runFor(seconds*1000);
    assert.equal(await page.locator('.wf-glow').count(),mode===2?0:1);
    await page.clock.runFor(seconds*1000);
    if (mode===2) {
      assert.equal(await page.locator('.wf-ring').count(),0);
      await page.getByRole('button',exact('동료에게 묻기')).click();
      await page.getByRole('button',exact('동료에게 묻기')).click();
    }
    assert.equal(await page.locator('.wf-ring').count(),1);
  }
  await page.close();
}
(async()=>{
  const out=path.resolve(process.argv[2]||'dist/wilderness');
  await fs.mkdir(out,{recursive:true});
  const browser=await chromium.launch();
  try {
    const origin=await gameOrigin(browser);
    for(const entry of ['/index.html','/preview.html'])await checkObservations(browser,origin,entry,out);
    await runRoute(browser,origin,out,'/index.html#redsea',360);
    await runRoute(browser,origin,out,'/preview.html#wilderness',320);
    for(const entry of ['/index.html','/preview.html']){
      await checkManna(browser,origin,entry,out);
      await checkTwoDays(browser,origin,entry);
      await checkRockSound(browser,origin,entry);
      await checkCalfSound(browser,origin,entry);
    }
    const direct=await browser.newPage({viewport:{width:320,height:480}});
    await direct.goto(origin+'/preview.html#sinai-camp');
    await direct.locator('.wf-library summary').click();
    assert.equal(await direct.locator('h1').innerText(),stopNames[5]);
    assert.equal(await direct.locator('.wf-record p').innerText(),await direct.evaluate(()=>BO.wildField.stages[5].beats[0].notes[0]));
    await direct.getByRole('button',exact('설정')).click();
    await direct.getByRole('combobox').selectOption('1');
    await direct.getByRole('button',exact('닫기')).click();
    assert.equal(await direct.locator('.wf-record p').innerText(),await direct.evaluate(()=>BO.wildField.stages[5].beats[0].notes[1]));
    await direct.close();await checkRockLegacy(browser,origin);await checkOldSaves(browser,origin);await checkHints(browser,origin);
    console.log('광야·시내산 일곱 장면 · 두 날 관찰창·회전·이전 저장·원문 118절·인장·수첩·연령별 힌트: no errors');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
