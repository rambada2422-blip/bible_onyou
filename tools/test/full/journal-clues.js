// 우회 탐험을 실제로 마치고, 단서가 시간표의 일지에 남는지 확인한다.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const { gameOrigin, proxy } = require('../game-server');
const layoutIssues = require('../layout-issues');
const out = path.resolve(process.argv[2] || 'dist/check/journal-clues');
const key = 'bo_demo_v1';

async function play(browser, url, width, height) {
  const p = await browser.newPage({ viewport: { width, height }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  try {
    const errors = [];
    p.on('pageerror', e => errors.push(e.message));
    const button = name => p.getByRole('button', {name, exact:true});
    const next = p.locator('.sheet-foot .onpaper');
    const journal = () => p.getByRole('button', {name:/^일지 \d+$/}).tap();
    const group = name => p.locator('.journal-clues details').filter({has: p.locator('summary').filter({hasText:name})});
    async function enter(name) {
      await button('목적지 다시 고르기').tap();
      await button(name).tap();
      await button('이야기 읽기').waitFor();
    }
    async function readStory() {
      await button('이야기 읽기').tap();
      await p.locator('.narr').waitFor();
      while (await p.locator('.narr').count()) await next.tap();
    }
    async function returnToHoreb(name, count) {
      await button('성경에서 확인하기').tap();
      await button('찾아서 읽었어요').tap();
      await button('모세').tap();
      await next.tap();
      await button('단서 일지 보기').tap();
      assert.equal(await group(name).locator('.it:visible').count(),count);
      assert(await group(name).locator('summary').evaluate(s=>s === document.activeElement));
      await button('말씀 카드로 돌아가기').tap();
      assert(await button('단서 일지 보기').evaluate(b=>b === document.activeElement));
      assert.deepEqual(await p.evaluate(layoutIssues,'#app > .screen'),[]);
      if (width === 390 && name === '요셉') await p.screenshot({path:path.join(out,'reward-journal.png')});
      await button('모세가 있는 곳으로').tap();
      await p.locator('#ex01-sheep').waitFor();
      await button('시간표로 돌아가기').tap();
    }
    await p.goto(url);
    await button('탐험 시작').tap();
    await p.locator('.tier').nth(1).tap();
    await button('출발 준비 완료').tap();
    await enter('요셉');
    await button('단서 2').tap();
    await readStory();
    const answers = await p.evaluate(() => BO.content.scenes['ALT-03'].spot.t2.options.filter(o=>o.ok).map(o=>o.label));
    for (const a of answers) await button(a).tap();
    await button('확인').tap();
    await returnToHoreb('요셉',1);
    await journal();
    assert.equal(await group('요셉').count(), 1, '호렙으로 돌아와도 금 사슬은 일지에 남아야 한다');
    await group('요셉').locator('summary').tap();
    assert.equal(await group('요셉').locator('.it').count(), 1);
    assert.match(await group('요셉').innerText(), /금 사슬/);
    assert.match(await group('요셉').innerText(), /창 41:42/);
    await button('돌아가기').tap();
    await enter('요셉');
    assert(await button('단서 2').isEnabled(), '새 탐험은 처음부터 관찰할 수 있다');
    await button('단서 2').tap();
    await button('단서 1').tap();
    await button('시간표로 돌아가기').tap();
    await button('단계').tap();
    await p.locator('.tier').first().tap();
    await button('출발 준비 완료').tap();
    await enter('여호수아');
    await readStory();
    for (const b of await p.locator('.hot').all()) await b.tap();
    await returnToHoreb('여호수아',3);
    await p.reload();
    await button('이어서 탐험하기').tap();
    await button('시간표로 돌아가기').tap();
    await journal();
    for (const [name, count] of [['요셉',2],['여호수아',3]]) {
      const details = group(name);
      await details.locator('summary').focus();
      await p.keyboard.press('Enter');
      assert.equal(await details.locator('.it:visible').count(),count);
    }
    assert.equal(await p.locator('.vcard').count(),2);
    assert.deepEqual(await p.evaluate(layoutIssues,'#app > .screen'),[]);
    if (width === 390) await p.screenshot({path:path.join(out,'clue-journal.png')});
    await button('돌아가기').tap();
    await button('처음부터 다시').tap();
    await button('탐험 시작').tap();
    await p.locator('.tier').first().tap();
    await button('출발 준비 완료').tap();
    await journal();
    assert.equal(await p.locator('.journal-clues').count(),0);
    assert.deepEqual(errors,[]);
    console.log(new URL(url).pathname,width+'×'+height,'· 두 탐험 귀환, 다른 연령, 다시 발견, 재접속과 초기화 통과');
  } finally { await p.close(); }
}

async function oldRecords(browser, url) {
  const p = await browser.newPage({reducedMotion:'reduce'});
  try {
    const button = name => p.getByRole('button', {name,exact:true});
    const card = {ref:'창 41:41', title:'요셉이 애굽 온 땅 위에 세워짐', scene:'요셉이 애굽을 다스리게 됨', bonus:true};
    const base = {v:1, tier:'t2', char:'choeon', done:{}, cards:[card], notes:{}, routed:true};
    async function open(saved) {
      await p.evaluate(([key,data])=>localStorage.setItem(key,JSON.stringify(data)),[key,saved]);
      await p.reload();
      await button('이어서 탐험하기').click();
    }
    await p.goto(url);
    await open({...base, clueJournal:true});
    await button('일지 1').click();
    assert.equal(await p.locator('.vcard').count(),1);
    assert.equal(await p.locator('.journal-clues').count(),0,'카드만으로 단서를 추정하지 않는다');
    await open({...base,
      journey:{id:'ALT-03',tier:'t2',step:'beat-1',found:['chain','chain','unknown']},
      pausedJourneys:{'ALT-02':{id:'ALT-02',tier:'t2',step:'arrive',found:['ark']}},
      clueJournal:{'ALT-03':['ring','bogus'],'ALT-02':{},'EX-00':['fake']}
    });
    await button('시간표로 돌아가기').click();
    await button('단계').click();
    await p.locator('.tier').last().click();
    await button('출발 준비 완료').click();
    await p.reload();
    await button('이어서 탐험하기').click();
    await button('일지 4').click();
    for (const s of await p.locator('.journal-clues summary').all()) await s.click();
    assert.equal(await p.locator('.journal-clues .it').count(),3);
    assert.match(await p.locator('.journal-clues').innerText(),/금 사슬/);
    assert.match(await p.locator('.journal-clues').innerText(),/언약궤/);
    assert.match(await p.locator('.journal-clues').innerText(),/반지/);
    console.log(new URL(url).pathname,'· 카드만 남은 예전 판, 진행·보류 중 발견 복원, 중복·잘못된 단서 제외 통과');
  } finally { await p.close(); }
}

(async () => {
  await fs.mkdir(out,{recursive:true});
  const browser=await chromium.launch({proxy});
  try {
    const origin=await gameOrigin(browser);
    for (const entry of ['/web/index.html','/preview.html']) {
      for (const [w,h] of [[390,844],[568,320],[320,568]]) await play(browser,origin+entry,w,h);
      await oldRecords(browser,origin+entry);
    }
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
