// 첫 호렙 물음을 실촬영한 사진으로 풀고 새로고침·이전 저장·키보드 경로를 확인한다.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const { gameOrigin, proxy } = require('../game-server');
const { photographFlock } = require('../photograph-flock');
const out = path.resolve(process.argv[2] || 'dist/check/horeb-field');
const key = 'bo3d.save.v1';

async function play(browser, url, tierIndex, viewport) {
  const p = await browser.newPage({ viewport, hasTouch: true, isMobile: true });
  try {
    const errors = [];
    p.on('pageerror', e => errors.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    const button = name => p.getByRole('button', { name, exact: true });
    const read = () => p.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
    const resume = async () => { await p.reload(); await button('이어서 탐험하기').tap(); };
    await p.goto(url);
    await p.locator('.tier').nth(tierIndex).tap();
    await button('탐험 시작').tap();
    await p.locator('.route-opts .btn').filter({hasText: '모세'}).tap();
    await button('어떻게 하나요?').waitFor();
    if (tierIndex === 0) {
      await p.locator('.toast3').waitFor({state: 'hidden'});
      await p.screenshot({path: path.join(out,'landing.png')});
    }
    await photographFlock(p);
    assert.doesNotMatch(await p.locator('.toast3').textContent(), /양 떼/);
    if (tierIndex === 0) {
      await p.locator('.field-photo img').evaluate(image => image.decode());
      await p.screenshot({path: path.join(out,'photo-question.png')});
    }
    const shot = await read();
    assert(shot.flockMarks.length > 0 && shot.flockMarks.length <= 32);
    const field = button('사진에서 동물 찾기');
    await resume();
    await field.waitFor();
    const stored = await p.locator('.field-photo img').getAttribute('src');
    assert.equal(stored, shot.dex.sheep);
    await field.scrollIntoViewIfNeeded();
    const box = await field.boundingBox();
    const finger = point => field.tap({position: {x: box.width * point[0] / 1000, y: box.height * point[1] / 1000}});
    const blank = [[40,40],[960,40],[40,960],[960,960],[500,50],[500,950]].find(([x,y]) =>
      shot.flockMarks.every(([px,py,r]) => Math.hypot(px-x,py-y) > Math.max(r,12000/box.width)+5));
    assert(blank);
    await finger(blank);
    assert.match(await p.locator('.field-observation [role=status]').innerText(), /다른 곳/);
    assert.equal(await p.evaluate(() => BO3D.debug.parts().found),0);
    const target = shot.flockMarks.reduce((best, mark) => mark[2] > best[2] ? mark : best);
    if (tierIndex === 2) {
      // 키보드 조준점은 사진을 마지막으로 누른 자리에서 이어진다.
      await field.focus();
      for (const [axis, negative, positive] of [[0,'ArrowLeft','ArrowRight'],[1,'ArrowUp','ArrowDown']]) {
        const steps = Math.round((target[axis]-blank[axis])/60);
        for (let n=0;n<Math.abs(steps);n++) await p.keyboard.press(steps<0?negative:positive);
      }
      await p.keyboard.press('Enter');
    } else await finger(target);
    if (tierIndex !== 0) {
      const found = await p.locator('.field-observation [role=status]').innerText();
      assert.match(found, /동물 무리를 찾았어요/);
      assert.doesNotMatch(found, /양/, '물음 1의 답 (양 떼)을 먼저 보여 주지 않는다');
      assert.equal(await p.evaluate(() => BO3D.debug.state().state),'detector');
      await button(tierIndex===1?'장인 이드로의 양 떼':'장인 이드로').tap();
    }
    await button('다음').waitFor();
    assert.equal((await read()).signal.step, 'reference');
    await button('다음').tap();
    await button('계속 탐험하기').waitFor();
    assert.equal((await read()).signal.step, 'sharon');
    await button('계속 탐험하기').tap();
    await p.locator('.track3').waitFor();
    assert.equal((await read()).signal.step, 'search');
    await resume();
    await p.locator('.track3').waitFor();
    for (const marks of [undefined, [[-55,2,4],'bad']]) {
      await p.evaluate(([k,s,marks]) => localStorage.setItem(k,JSON.stringify({...s,flockMarks:marks})),[key,shot,marks]);
      await resume();
      await p.locator('[data-detector-quiz="0"]').waitFor();
      assert.equal(await field.count(),0);
      assert.equal(await p.locator('.field-observation > img').getAttribute('src'), stored);
      assert.equal(await p.locator('.panel3 .opt').count(),3);
    }
    assert.deepEqual(errors,[]);
    console.log(new URL(url).pathname, 't'+(tierIndex+1), '사진 관찰·정답·복원·이전 저장 통과');
  } finally { await p.close(); }
}
(async () => {
  await fs.mkdir(out,{recursive:true});
  const browser = await chromium.launch({proxy,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
  try {
    const origin = await gameOrigin(browser);
    await play(browser,origin+'/preview3d.html?q=low',0,{width:390,height:844});
    await play(browser,origin+'/web3d/index.html?q=low',1,{width:568,height:320});
    await play(browser,origin+'/preview3d.html?q=low',2,{width:320,height:568});
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
