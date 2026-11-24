/* 세 목격 장면을 실제 화면에서 조작한다. 출입·소리 없이 완료·예전 저장도 함께 확인한다. */
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require('playwright');
const {gameOrigin}=require('./game-server');
async function visit(browser,origin,entry,viewport,out) {
  const page=await browser.newPage({viewport,hasTouch:true,reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const b=name=>page.getByRole('button',{name,exact:true});
  const tap=name=>b(name).click();
  const heading=()=>page.locator('h1').innerText();
  const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('bo_demo_v1')));
  const raw=entry.startsWith('/index');
  const photo=async(name)=>{if(raw && viewport.width===360) await page.screenshot({path:path.join(out,name+'.png')});};
  const visibleArt=async(key)=>{
    const img=page.locator('.rs-frame[data-view="'+key+'"] img');
    await img.evaluate(e=>e.decode());
    assert.equal(await img.evaluate(e=>e.naturalWidth),1440);
    assert(await img.isVisible());
    assert.equal(await img.evaluate(e=>getComputedStyle(e).animationName),'none');
    return img.getAttribute('src');
  };
  await page.goto(origin+entry);
  if(entry.endsWith('#exodus')) await tap('홍해 본편');
  assert.equal(await heading(),'바다 앞에 갇히다');
  assert(await b('바다 가운데로').isHidden());
  const camp=await visibleArt('camp');
  await photo('막힌_해안');
  await b('뒤쪽 길 보기').tap();
  const rear=await visibleArt('rear');assert.notEqual(rear,camp);
  assert((await page.locator('.rs-note').innerText()).includes('두려워하여'));
  await photo('출발_바닷가');
  await page.reload();
  assert.equal(await b('뒤쪽 길 보기').getAttribute('aria-pressed'),'true');
  assert.equal(await visibleArt('rear'),rear);
  await tap('앞바다 보기');assert(![camp,rear].includes(await visibleArt('shore')));
  await tap('모세가 전한 말 살피기');assert.equal(await visibleArt('camp'),camp);
  assert((await page.locator('.rs-note').innerText()).includes('구원을 지켜보라고'));
  await tap('바다 가운데로');
  assert(await b('건너온 바다 돌아보기').isHidden());
  await tap('앞으로 걷기');await tap('앞으로 걷기');
  assert((await page.locator('.rs-story').innerText()).includes('양쪽에서 물이 벽처럼'));
  const imageBefore=await page.locator('canvas').evaluate(c=>c.toDataURL());
  await tap('뒤로 걷기');
  assert.notEqual(await page.locator('canvas').evaluate(c=>c.toDataURL()),imageBefore);
  await tap('앞으로 걷기');await photo('홍해_마른길');
  await page.setViewportSize({width:viewport.height,height:viewport.width});
  await page.reload();
  assert.equal(await page.getByRole('slider').inputValue(),'40');
  const bookmark=(await saved()).redSea;
  await page.goto(origin+entry.split('#')[0]+'#redsea-coast');
  await visibleArt('camp');await b('뒤쪽 길 보기').tap();await page.reload();
  await visibleArt('rear');assert.deepEqual((await saved()).redSea,bookmark);
  await tap('보던 탐험으로 돌아가기');
  assert.equal(await page.getByRole('slider').inputValue(),'40');
  await page.getByRole('slider').focus();await page.keyboard.press('End');
  assert.equal(await page.getByRole('slider').inputValue(),'100');
  await tap('건너온 바다 돌아보기');
  assert((await page.locator('.rs-story').innerText()).includes('하나님이 이스라엘을 애굽 사람의 손에서 구원'));
  await tap('노랫소리를 따라가기');
  await page.setViewportSize(viewport);
  assert.equal(await heading(),'미리암의 소고');
  await photo('미리암_소고');
  if(raw){
    await tap('장단 들어 보기');await tap('가장자리 치기');
    assert.equal((await saved()).redSea.beat,0);
    await tap('가운데 치기');await page.reload();
    assert.equal((await saved()).redSea.beat,1);
    await tap('가장자리 치기');await tap('가운데 치기');
    assert.equal(await page.locator('.struck').count(),3);
  }
  await tap('홍해 탐험 일지 열기');
  assert((await saved()).redSea.finished);
  assert.equal(await page.locator('.rs-story details').count(),3);
  assert((await page.locator('.rs-story details[open]').innerText()).includes('미리암'));
  await page.reload();assert.equal(await heading(),'홍해를 건넌 뒤');
  await tap('광야 수첩으로 이어가기');
  assert.equal(await heading(),'광야의 샘');
  await tap('내 수첩');
  assert.equal(await page.locator('.xt-entry').first().locator('details').count(),3);
  assert.equal(await page.locator('.xt-head p').last().innerText(),'모은 기록 3 / 12');
  assert.equal((await saved()).exodusTrail.best[0],undefined);
  await tap('홍해 본편');assert.equal(await heading(),'홍해를 건넌 뒤');
  await tap('홍해 다시 목격하기');assert((await saved()).redSea.finished);
  assert.equal(await heading(),'바다 앞에 갇히다');
  const sizes=await page.locator('.rs-screen button:visible').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().height));
  assert(sizes.every(h=>h>=44));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);await page.close();
}
async function bridges(browser,origin) {
  const page=await browser.newPage();
  const b=name=>page.getByRole('button',{name,exact:true});
  await page.goto(origin+'/preview.html#passover');
  await page.evaluate(()=>{
    BO.app2d.state.passover={step:11,seen:7,active:true};BO.app2d.save();
  });await page.reload();await b('홍해 본편으로').click();
  assert(page.url().endsWith('#redsea'));
  assert((await page.evaluate(()=>BO.app2d.state.passover)).recorded);
  await b('탐험 입구').click();await b('탐험 시작').click();
  await page.locator('.tier').first().click();await b('출발 준비 완료').click();
  await b('홍해 본편 · 바닷가에서 미리암의 노래까지').click();
  await page.evaluate(()=>{
    const s=BO.app2d.state;s.journey={id:'EX-09',tier:s.tier,step:'close'};
    s.exodusTrail={index:2,pages:[]};BO.app2d.save();
  });
  await page.goto(origin+'/preview.html#pillar');
  await b('홍해 본편으로').click();
  assert(await page.evaluate(()=>BO.app2d.state.done['EX-09']));
  // 다른 권차까지 읽은 수첩을 덮어쓰지 않는다.
  await page.evaluate(()=>{BO.app2d.state.redSea.chapter=3;BO.app2d.state.redSea.finished=true;BO.app2d.save();});
  await page.reload();await b('광야 수첩으로 이어가기').click();
  assert.equal(await page.locator('h1').innerText(),'시내산의 기록');
  await b('탐험 입구').click();await page.getByRole('button',{name:/^일지 /}).click();
  assert(await page.getByText('홍해 · 건너편에서 부른 노래',{exact:true}).isVisible());
  await page.close();
}
(async()=>{
  const out=path.resolve(process.argv[2]||'dist/red-sea');await fs.mkdir(out,{recursive:true});
  const browser=await chromium.launch();
  try{
    const origin=await gameOrigin(browser);
    for(const [entry,viewport] of [
      ['/index.html#exodus',{width:360,height:720}],
      ['/preview.html#redsea-coast',{width:320,height:568}],
      ['/preview.html#redsea',{width:1000,height:700}]
    ])await visit(browser,origin,entry,viewport,out);
    await bridges(browser,origin);
    console.log('홍해 세 장면 · 터치·키보드·무음·회전·복원·일지·본편 진입과 광야 복귀: no errors');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
