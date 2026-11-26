// 새 방문, 이전 저장, 말씀 인장과 실제 출력단의 배경음악을 2D 원본과 단일 파일에서 확인한다.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const { gameOrigin, proxy } = require('../game-server');
const { attachScoreMeter, waitForAudibleCue } = require('../scene-music');

async function play(browser, origin, entry, out) {
  const page = await browser.newPage({ viewport:{width:360,height:740}, hasTouch:true, reducedMotion:'reduce' });
  page.setDefaultTimeout(8000);
  await attachScoreMeter(page);
  await page.addInitScript(() => {
    Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:class { constructor(text) { this.text=text; } }});
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(){},cancel(){}}});
  });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const button = name => page.getByRole('button', {name,exact:true});
  const quiet = () => page.waitForFunction(() => readScore().every(t => t.ended || t.state !== 'running'));
  const listen = () => waitForAudibleCue(page, 25.6);
  const fire = () => waitForAudibleCue(page, 10.5);
  const view = page.locator('.horeb-picture img');
  const focusedVerse = () => page.evaluate(() => document.activeElement.dataset.verse);
  try {
    await page.goto(origin + entry + '#horeb');
    await page.locator('.tier').first().tap();
    await button('출발 준비 완료').tap();
    await button('양 떼 살펴보기').waitFor();
    const start = Date.now();
    assert.deepEqual(await page.evaluate(() => readScore()), []);
    assert.equal(await page.locator('#ex01-bush').isVisible(), false);
    await button('양 떼 살펴보기').tap();
    await button('떨기나무 살펴보기').waitFor();
    assert(Date.now() - start < 30000);
    await listen();
    console.log(entry, '양 떼 발견부터 호렙 목축 음악 재생까지', Date.now() - start, 'ms');
    await button('읽어 줘').tap(); await quiet();
    await button('그만 듣기').tap(); await listen();
    await button('두루마리 · 출 3:1').tap();
    await quiet(); assert.equal(await focusedVerse(), '3:1');
    assert.equal(await page.locator('.wf-verse').count(), 12);
    await button('닫기').tap(); await listen();
    await page.evaluate(() => window.dispatchEvent(new Event('blur'))); await quiet();
    await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await listen();
    await button('음악 끄기').tap(); await quiet();
    await page.reload(); await button('음악 켜기').tap(); await listen();
    await page.emulateMedia({reducedMotion:'no-preference'});
    await button('떨기나무 살펴보기').tap(); await view.waitFor(); await fire();
    assert.equal(await view.getAttribute('data-view'),'standing');
    assert(await view.evaluate(img => img.clientWidth > 1.4 * img.parentElement.clientWidth), '승인된 왼쪽 덤불을 가까이 본다');
    if(out && entry === '/index.html') await page.screenshot({path:path.join(out,'horeb-discovery.png')});
    await page.emulateMedia({reducedMotion:'reduce'});
    assert(await view.evaluate(img => img.clientWidth === img.parentElement.clientWidth), '동작 줄이기는 전체 보기에서 시작한다');
    await button('이전').tap(); await listen();
    await button('떨기나무 살펴보기').tap(); await fire();
    await button('관찰 그림 크게 보기').tap();
    assert.equal(await page.locator('dialog img').evaluate(async img => { await img.decode(); return img.naturalWidth; }),1024);
    await page.keyboard.press('Escape');
    await button('다음').tap(); await quiet(); await button('두루마리 · 출 3:4').tap();
    assert.equal(await focusedVerse(), '3:4'); await button('닫기').tap();
    await button('다음').tap(); await page.locator('.find-word').tap();
    await button('다음').tap();
    await page.locator('.find-word').nth(1).tap();
    await page.setViewportSize({width:740,height:360}); await page.reload();
    assert.equal(await page.locator('.find-word.found').innerText(), '이삭');
    assert.equal(await view.getAttribute('data-view'),'covered');
    await page.setViewportSize({width:320,height:568});
    await page.addStyleTag({content:'html{font-size:125%} .sheet-body .narr{font-size:1.35rem}'});
    await page.locator('.find-word:not(.found)').first().focus(); await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.locator('.narr mark').first().waitFor();
    await quiet();
    if(out && entry === '/index.html') {
      await page.setViewportSize({width:390,height:844});
      await page.screenshot({path:path.join(out,'horeb-faces.png')});
    }
    await button('다음').tap(); await button('다음').tap();
    await page.locator('.find-word').tap();
    await page.locator('button.openbible').tap();
    assert.equal(await focusedVerse(), '3:12');
    assert.equal(await page.locator('[data-verse="3:12"] span').innerText(), await page.evaluate(() => BO.horebVerses['3:12']));
    if(out && entry === '/index.html') await page.screenshot({path:path.join(out,'horeb-scroll.png')});
    await button('닫기').tap();
    await button('시간표로 돌아가기').tap(); assert.equal(new URL(page.url()).hash,'#home');
    await page.waitForFunction(() => readScore().every(t => t.state === 'closed'));
    // 옛 저장에는 그림, 찾기 표시가 없다. 이미 받은 인장도 새 두루마리를 연다.
    await page.evaluate(() => {
      const record = JSON.parse(localStorage.getItem('bo_demo_v1'));
      record.journey = {id:'EX-01',tier:'t1',step:'cards'};
      localStorage.setItem('bo_demo_v1',JSON.stringify(record));
    });
    await page.goto(origin + entry + '#horeb');
    await button('말씀 인장 열기 · 출 3:5').tap();
    assert.equal(await focusedVerse(),'3:5'); await button('닫기').tap();
    await button('다음').tap(); await button('모세를 따라 왕궁으로').tap();
    assert.equal(new URL(page.url()).hash, '#palace');
    assert.deepEqual(errors, []);
    console.log(entry, '왕복·음악·회전·125%·낱말 저장·그림·말씀 인장·왕궁 연결 통과');
  } finally { await page.close(); }
}

(async () => {
  const out=process.argv[2];
  if(out) await fs.mkdir(out,{recursive:true});
  const browser=await chromium.launch({proxy});
  try {
    const origin=await gameOrigin(browser);
    for (const entry of ['/index.html','/preview.html']) await play(browser,origin,entry,out);
    console.log('호렙 현장과 말씀 인장 · no errors');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode=1; });
