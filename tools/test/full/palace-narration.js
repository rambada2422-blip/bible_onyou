// 실제 MP3를 재생해 기본 음성 엔진이 없는 기기, 대사 교대, 화면 이동과 중단을 검증한다.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { gameOrigin, proxy } = require('../game-server');

async function check(browser, url) {
  const page = await browser.newPage({viewport:{width:360,height:640},isMobile:true,hasTouch:true});
  await page.addInitScript(() => {
    delete window.speechSynthesis;
    window.played = [];
    const NativeAudio = window.Audio;
    window.Audio = class extends NativeAudio {
      constructor(url) { super(url); window.played.push(this); }
    };
  });
  await page.goto(url + '#palace');
  const button = name => page.getByRole('button',{name,exact:true});
  const forward = page.locator('.palace-foot .onpaper');
  async function hear(label) {
    await button(label).click();
    await page.waitForFunction(() => {const p=window.played.at(-1);return p && !p.paused && p.currentTime>0 && p.duration>0;});
    assert(await button('그만 듣기').isVisible());
  }
  const chapters = await page.evaluate(() => BO.palaceChapters);
  let total=0;
  for (const [chapterIndex,chapter] of chapters.entries()) {
    for (const [beatIndex,beat] of chapter.beats.entries()) {
      await hear('읽어 줘');
      total++;
      if (chapterIndex===0 && beatIndex===0) {
        await button('그만 듣기').click();
        assert(await page.evaluate(() => window.played.at(-1).paused));
        await hear('읽어 줘');
        await page.evaluate(() => {Object.defineProperty(document,'hidden',{configurable:true,value:true}); document.dispatchEvent(new Event('visibilitychange')); delete document.hidden;});
        assert(await button('읽어 줘').isVisible());
      }
      if (chapterIndex===0 && beatIndex===1) {
        await page.evaluate(() => {const a=window.played.at(-1); a.currentTime=a.duration-.1;});
        await button('읽어 줘').waitFor();
      }
      if (beat.options) {
        for (const choice of [1-beat.answer,beat.answer]) {
          await page.locator('.palace-option').nth(choice).click();
          await hear('풀이 듣기');
          total++;
        }
      }
      if (chapterIndex===0 && beat.film) {
        await page.route('**/*.mp4',route=>route.abort());
        await button('영상 보기 · ' + chapter.seconds + '초').click();
        assert(await page.evaluate(() => window.played.at(-1).paused));
        await hear('읽어 줘');
      }
      await forward.click();
      assert(await page.evaluate(() => window.played.every(p=>p.paused)), '다음 대목에 이전 소리가 남음');
    }
  }
  assert.equal(total,51);
  console.log(url.split('/').at(-1),'· 대목 45개와 풀이 6개 재생, 자연 종료·취소·영상 전환·이탈 확인');
  await page.close();
}
(async () => {
  const browser=await chromium.launch({proxy});
  try { const host=await gameOrigin(browser); await check(browser,host+'/index.html'); await check(browser,host+'/preview.html'); }
  finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
