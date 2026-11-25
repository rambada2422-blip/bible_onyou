'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const fs = require('node:fs');
const os = require('node:os');
const { chromium } = require('playwright');
const url = pathToFileURL(path.resolve(__dirname, '../../dist/genesis-e58.html')).href;
const answers = ['요셉','1','청지기','2','잔','2','베냐민','12','성','13'];
const key = 'onyou.genesis.E58.rehearsal.v1';

async function run(detour) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'onyou-e58-'));
  const errors = [];
  let ctx, page;
  async function open() {
    ctx = await chromium.launchPersistentContext(profile, { offline:true, viewport:{ width:360, height:640 }, hasTouch:true });
    page = ctx.pages()[0];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', req => { if (!req.url().startsWith('file:') && !req.url().startsWith('data:')) errors.push(req.url().slice(0,80)); });
    await page.goto(url);
  }
  const action = id => page.locator('[data-action="' + id + '"]');
  async function press(id) {
    if (detour) await action(id).press('Enter');
    else await action(id).tap();
  }
  async function place() {
    const { stage,line,mode } = await page.locator('.page').evaluate(el => ({ ...el.dataset }));
    return { stage:Number(stage), line:Number(line), mode };
  }
  async function until(stage, line) {
    for (let i=0; i<65; i++) {
      const here = await place();
      if (here.stage === stage && here.line === line) return;
      assert.equal(here.mode,'play');
      await press('advance');
    }
    assert.fail('진입 실패 ' + stage + '/' + line);
  }
  try {
    await open();
    assert.equal(await page.getByRole('radio').count(),2);
    await page.getByText('대표와 목회자가 정할 것 · 7건', { exact:true }).click();
    assert.equal(await page.locator('details[open] > details').count(),7);
    if (!detour) await page.getByRole('radio',{ name:'E57 일지 있음' }).check();
    await press('start');
    await page.locator('.time-machine').evaluate(image => image.decode());
    await until(1,2);
    assert.ok((await page.locator('.line').innerText()).includes(detour ? '막내 베냐민과 함께' : '지난 일지'));
    await press('advance');
    assert.deepEqual(await place(),detour ? {stage:2,line:0,mode:'play'} : {stage:1,line:3,mode:'play'});
    await until(2,3);
    await press('pause');
    assert.ok(await page.getByText(/베냐민이 넣은 것이 아니에요/).isVisible());
    await page.reload();
    assert.equal((await place()).mode,'pause');
    await press('resume');
    await until(2,5);
    assert.equal(await page.locator('.time-machine').count(),0);
    assert.equal(await page.locator('.mask').count(),0);
    assert.equal(await page.getByRole('button',{name:'요셉이 있는 성'}).count(),1);
    if (detour) {
      await press('choice-3');
      await page.locator('.time-machine').evaluate(image => image.decode());
      await page.getByText('어른용 · 실물 성경 가림 위치',{exact:true}).click();
      assert.ok(await page.locator('.mask').innerText().then(s => s.includes('42장 29절') && !s.includes('44장')));
      await until(2,4);
      assert.equal(await page.locator('.line').innerText(),'이번에는 성경을 덮은 채로 다시 골라요.');
      await until(2,5);
      await press('choice-3');
      assert.equal(await page.locator('#message').innerText(),'그 절은 몇 장에 있었나요?');
    }
    await press('choice-4');
    await page.getByText('어른용 · 실물 성경 가림 위치',{exact:true}).click();
    assert.equal(await page.locator('.mask .strip').count(),2);
    await page.getByRole('checkbox').check();
    assert.equal(await page.locator('.mask .strip').count(),3);
    assert.ok((await page.locator('.mask').innerText()).includes('14~17절'));
    await page.getByRole('checkbox').uncheck();
    await until(4,7);
    assert.equal(await page.locator('[data-entry]').count(),6);
    for (let i=0;i<6;i++) await page.locator('[data-entry="'+i+'"]').fill(answers[i]);
    await ctx.close();
    await open();
    assert.deepEqual(await place(),{stage:4,line:7,mode:'play'});
    assert.equal(await page.locator('[data-entry="2"]').inputValue(),answers[2]);
    await until(6,3);
    assert.equal(await page.locator('[data-entry]').count(),8);
    for (const i of [6,7]) await page.locator('[data-entry="'+i+'"]').fill(answers[i]);
    await until(6,8);
    for (const i of [8,9]) await page.locator('[data-entry="'+i+'"]').fill(answers[i]);
    await until(7,2);
    assert.equal(await page.locator('.record').first().innerText(),'고른 카드 · 요셉이 있는 성');
    await press('back');
    assert.equal((await place()).line,1);
    await until(9,0);
    await press('advance');
    assert.equal((await place()).mode,'done');
    assert.deepEqual(await page.locator('[data-entry]').evaluateAll(list => list.map(input => input.value)),answers);
    assert.equal(await page.locator('.list li').count(),detour ? 4 : 3);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true);
    if (process.env.E58_CAPTURE && detour) {
      await page.setViewportSize({width:760,height:920});
      await page.screenshot({path:path.join(process.env.E58_CAPTURE,'E58_일지.png')});
    }
    await ctx.close();
    await open();
    assert.equal((await place()).mode,'done');
    await press('restart');
    await page.evaluate(k => localStorage.setItem(k,'not JSON'), key);
    await page.reload();
    assert.equal((await place()).mode,'start');
    await page.locator('.cover').evaluate(img => img.decode());
    assert.deepEqual(errors,[]);
  } finally {
    if (ctx) await ctx.close();
    fs.rmSync(profile,{recursive:true,force:true});
  }
}

(async () => {
  await run(false); await run(true);
  console.log('E58 직접·우회·재선택 경로, 두 가림 배치, 중단·재시작 복원, 열 칸 기록과 조건부 일지, 오프라인 통과');
})().catch(error => { console.error(error); process.exitCode = 1; });
