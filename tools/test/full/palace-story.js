// 모세와 바로 대화의 실제 진입, 근거 찾기, 영상 오류, 이전 탐험 복귀를 확인한다.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const { gameOrigin, proxy } = require('../game-server');
const { playToEnding } = require('../palace-video');
const out = path.resolve(process.argv[2] || 'dist/palace-proof');

async function check(browser, origin, entry, width, height) {
  const page = await browser.newPage({viewport:{width, height}, isMobile:true, hasTouch:true, reducedMotion:'reduce'});
  const errors = [], requests = [];
  page.on('pageerror', err => errors.push(err.message));
  const testRetry = width === 320;
  if (testRetry) await page.route('**/*.mp4', route => { requests.push(route.request().url()); return route.abort(); });
  const tap = name => page.getByRole('button', {name, exact:true}).click();
  const forward = page.locator('.palace-foot .onpaper');
  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('bo_demo_v1')));
  const fromHub = entry === '/index.html';
  await page.goto(origin + entry);
  if (fromHub) {
    await tap('탐험 시작'); await page.locator('.tier').first().click(); await tap('출발 준비 완료');
    await tap('열 가지 재앙과 유월절 · 감수용 미리보기');
    await tap('강물');
    await tap('모세와 바로의 대화 · 열 재앙 영상');
  }
  const chapters = await page.evaluate(() => BO.palaceChapters);
  assert.equal(chapters.length, 10);
  assert.equal(new Set(chapters.map(ch => ch.url)).size, 10);
  const shots = fromHub && width === 360;
  for (const [number, ch] of chapters.entries()) {
    assert.equal(ch.beats.filter(b => b.film).length, 1);
    for (const [i, b] of ch.beats.entries()) {
      assert.equal(await page.locator('.palace-headline h1').innerText(), number<2 ? await page.evaluate(([n,i])=>(n===0?BO.app2d.palaceFirst:BO.app2d.palaceFrogs).titles[i],[number,i]) : ch.title);
      if(b.film)await page.locator('.palace-reading summary').click();
      assert.equal(await page.locator('.palace-words').innerText(), b.words);
      assert.equal(await page.locator('.palace-sources .ref').innerText(), b.ref);
      const autoFilm = b.film && ch.beats[i-1]?.options;
      assert.equal(await page.locator('video').count(), autoFilm ? 1 : 0);
      if (number === 0 && i === 2) {
        if (shots) await page.screenshot({path:path.join(out,'바로의_첫_대답.png')});
        const position = (await saved()).palace;
        await page.setViewportSize({width:height, height:width});
        await page.reload();
        if (fromHub) await tap('이어서 탐험하기');
        assert.deepEqual((await saved()).palace, position);
        await page.setViewportSize({width, height});
      }
      if (b.options) {
        const opts = page.locator('.palace-option');
        assert(await forward.isDisabled());
        await opts.nth(1-b.answer).click();
        assert.equal(await page.locator('.palace-feedback').innerText(), b.hint);
        assert(await forward.isDisabled());
        await opts.nth(b.answer).click();
        assert.equal(await page.locator('.palace-feedback').innerText(), b.evidence);
        if (number === 0) {
          await page.reload();
          if (fromHub) await tap('이어서 탐험하기');
          assert.equal(await opts.nth(b.answer).getAttribute('aria-pressed'),'true');
        }
        if (shots && number === 1) await page.screenshot({path:path.join(out,'개구리_약속_단서.png')});
      }
      if (b.film) {
        const before = autoFilm ? 0 : requests.length;
        if (!autoFilm) {
          const watch = page.getByRole('button',{name:'영상 보기 · '+ch.seconds+'초',exact:true});
          assert(await watch.isHidden());
          await page.locator('.palace-panel .palace-option').nth(number%2).click();
          if(number===1){
            await page.reload();if(fromHub)await tap('이어서 탐험하기');
            assert.equal(await page.locator('.palace-panel .palace-option').nth(number%2).getAttribute('aria-pressed'),'true');
          }
          await watch.click();
        }
        if (testRetry) {
          await page.getByRole('button', {name:'영상 다시 불러오기'}).waitFor();
          assert.equal(requests[before], ch.url);
          if (number === 0) {
            await tap('영상 다시 불러오기');
            await page.getByRole('button', {name:'영상 다시 불러오기'}).waitFor();
            assert.equal(requests[before + 1],ch.url);
          }
        } else {
          await playToEnding(page, number + 1, ch.seconds);
          await page.getByRole('button', {name:'세 친구와 현장 살펴보기'}).waitFor();
          const outcome=await page.evaluate(n=>n<3 ? BO.palaceChapters[n].beats.find(b=>b.film).words : BO.palaceChapters[n].beats[BO.palaceWatchScenes[n].after.beat].words,number);
          assert.equal(await page.locator('.palace-status p').innerText(),outcome);
        }
      }
      const footer = await forward.boundingBox();
      assert(footer && footer.width >= 44 && footer.height >= 44 && footer.y + footer.height <= height + 1);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await forward.click();
    }
  }
  if (fromHub) {
    assert.equal(await page.getByRole('button',{name:'✓ 강물'}).getAttribute('aria-pressed'),'true');
    await tap('← 시간표');
    await tap('모세와 바로의 대화 · 열 재앙 영상');
    assert.equal((await saved()).palace.chapter, 0);
    await forward.click(); await tap('이전'); assert.equal((await saved()).palace.beat,0);
    await tap('← 돌아가기'); assert(await page.getByText('출애굽기 시간표',{exact:true}).isVisible());
  }
  assert.deepEqual(errors,[]);
  await page.close();
  console.log(entry, width+'×'+height, '· 대화·장절·근거 찾기·회전·복원·복귀 통과,', testRetry ? '영상 오류와 재시도 통과' : '저장소 영상 10편 재생과 결말 통과');
}
(async () => {
  await fs.mkdir(out,{recursive:true});
  const browser = await chromium.launch({proxy});
  try {
    const origin = await gameOrigin(browser);
    await check(browser,origin,'/index.html',360,640);
    await check(browser,origin,'/preview.html#palace',320,568);
    await check(browser,origin,'/dist/preview.html#palace',844,390);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode=1; });
