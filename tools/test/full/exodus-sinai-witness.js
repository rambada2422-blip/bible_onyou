// 일곱째 현장 산길: 소리만 듣고 남긴 추측이 재시작 뒤에도 남고, 능선을 연 뒤에야 직접 본 모습과 함께 읽히는지 검증한다.
// 사용: node tools/test/full/exodus-sinai-witness.js 검사결과폴더 dist/expedition.html [chromium|firefox|webkit]
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { openOfflineBundle } = require('../game-server');
const { chromium, firefox, webkit } = require('playwright');
const key = 'onyou.exodus.expedition.v1';
// 앞의 여섯 현장은 tools/test/full/exodus-expedition.js가 실제 조작으로 확인한다. 여기서는 산길 앞까지 저장만 채운다.
const before = (progress) => ({
  v: 1,
  records: Array.from({ length: 6 }, () => ({ memory: '' })),
  progress,
  sound: false,
  started: true
});
(async () => {
  const out = process.argv[2] || path.resolve('dist/check/sinai-witness');
  const file = process.argv[3] || path.resolve('dist/expedition.html');
  fs.mkdirSync(out, { recursive: true });
  const engine = { chromium, firefox, webkit }[process.argv[4] || 'chromium'];
  const browser = await engine.launch(
    process.env.EXPEDITION_BROWSER_PATH ? { executablePath: process.env.EXPEDITION_BROWSER_PATH } : {}
  );
  const seen = [];
  async function journey(name, progress, play) {
    const ctx = await browser.newContext({
      offline: engine === chromium,
      viewport: { width: 360, height: 640 }
    });
    if (engine !== chromium) await ctx.route(/^https?:/, (route) => route.abort());
    const errors = [];
    ctx.on('weberror', (event) => errors.push(event.error().message));
    ctx.setDefaultTimeout(5500);
    const p = await openOfflineBundle(ctx, file, '#guided');
    await p.evaluate(([k, data]) => localStorage.setItem(k, JSON.stringify(data)), [key, before(progress)]);
    await p.reload();
    await p.evaluate(() => document.fonts.ready);
    const by = (label) => p.getByRole('button', { name: label, exact: true });
    const t = {
      p,
      by,
      click: (label) => by(label).click(),
      saved: () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)).progress, key),
      panel: () => p.locator('.panel').innerText(),
      stage: () => p.locator('.stage').innerText(),
      shot: (label) => p.screenshot({ path: path.join(out, label + '.png'), fullPage: true }),
      // 능선을 열기 전에는 송아지·춤과 두 사람의 해석이 보이지 않아야 한다.
      hidden: async (where) => {
        const words = (await t.panel()) + '\n' + (await t.stage());
        assert.doesNotMatch(words, /송아지|춤/, where + ': 능선 전에 본 장면이 드러남');
        assert.doesNotMatch(words, /여호수아는|노래하는 소리라고/, where + ': 추측 전에 두 사람의 해석이 드러남');
      },
      resume: async () => {
        await p.reload();
        await p.evaluate(() => document.fonts.ready);
        await by('떠난 현장 이어가기 →').click();
        assert.match(await p.locator('#game h1').innerText(), /산 위의 말, 산 아래의 소리/);
      },
      finishRest: async () => {
        await by('이튿날의 산길').click();
        await by('다시 올라간 이유 기록').click();
        assert.match(await p.locator('#game h1').innerText(), /두 번 백성을 위해 간구한 모세/);
      }
    };
    await by('떠난 현장 이어가기 →').click();
    await play(t);
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, name + ' 가로 넘침');
    assert.deepEqual(errors, [], name + ' 오류');
    seen.push(name);
    await ctx.close();
  }
  try {
    // 1. 처음부터 걸어 내려와 소리를 듣고 '싸움 소리 같다'를 남긴다. 고른 직후 다시 열고, 산길을 밀어 능선을 연다.
    await journey('싸움 소리 · 밀어서 확인', { step: 0 }, async (t) => {
      const { p, click } = t;
      await click('소리 켜기');
      for (const [a, b] of [
        ['하나님이 말씀하신 까닭', '모세가 한 말 듣기'],
        ['모세의 첫 간구', '산 아래로 내려가기']
      ]) {
        await click(a);
        await click(b);
      }
      await t.hidden('듣기 전');
      await click('먼 진영 소리 듣기');
      assert.match(await p.locator('.meter').innerText(), /자막 · 산 아래 진영 쪽에서 백성이 떠드는 소리가 들린다/);
      assert.match(await p.locator('.notice').innerText(), /자막/);
      await t.hidden('소리를 들은 뒤');
      await t.shot('01-heard-caption');
      await click('소리 다시 듣기');
      await click('내 추측 남기기');
      assert.equal(
        await p.evaluate(() => document.activeElement.textContent),
        '싸움 소리 같다',
        '보기를 펼치면 첫 보기로 초점이 간다'
      );
      assert.equal((await t.saved()).guess, undefined, '보기를 펼치기만 하면 저장하지 않는다');
      await t.shot('02-guess-choices');
      await click('싸움 소리 같다');
      assert.equal((await t.saved()).guess, '싸움 소리 같다');
      await t.resume();
      assert.match(await t.panel(), /내 추측 · 소리만 듣고\s*싸움 소리 같다/);
      await t.hidden('추측 직후 다시 연 뒤');
      await t.shot('03-guess-after-reload');
      const box = await p.locator('.stage').boundingBox();
      await p.mouse.move(box.x + 24, box.y + box.height * 0.3);
      await p.mouse.down();
      await p.mouse.move(box.x + 190, box.y + box.height * 0.3, { steps: 8 });
      await p.mouse.up();
      const panel = await t.panel();
      assert.match(panel, /내 추측 · 소리만 듣고\s*싸움 소리 같다/);
      assert.match(panel, /두 사람이 한 말 · 출 32:17–18\s*여호수아는 백성이 떠드는 소리를 듣고/);
      assert.match(panel, /직접 본 모습 · 출 32:19\s*모세는 진영에 가까이 이르러 송아지와 춤추는 것을 보았다/);
      assert.doesNotMatch(await p.locator('.meter').innerText(), /자막/);
      await t.shot('04-reveal-fight');
      await t.resume();
      assert.match(await t.panel(), /싸움 소리 같다[\s\S]*직접 본 모습/, '능선을 연 뒤 다시 열어도 비교가 남는다');
      await click('싸우는 군대');
      assert.match(await p.locator('.notice').innerText(), /여호수아/);
      await click('송아지와 춤추는 사람들');
      await t.finishRest();
    });
    // 2. 처음 고른 추측을 바꿔 '노랫소리 같다'를 남기고, 진영 표식을 눌러 연다.
    await journey('노랫소리 · 눌러서 확인', { step: 2 }, async (t) => {
      const { p, click } = t;
      await t.hidden('듣기 전');
      await click('먼 진영 소리 듣기');
      await click('내 추측 남기기');
      await click('싸움 소리 같다');
      await click('추측 다시 고르기');
      await click('노랫소리 같다');
      assert.equal((await t.saved()).guess, '노랫소리 같다');
      await t.resume();
      assert.match(await t.panel(), /내 추측 · 소리만 듣고\s*노랫소리 같다/);
      assert.doesNotMatch(await t.panel(), /싸움 소리 같다/);
      await t.hidden('바꾼 추측을 다시 연 뒤');
      await click('진영을 내려다보기');
      const panel = await t.panel();
      assert.match(panel, /내 추측 · 소리만 듣고\s*노랫소리 같다/);
      assert.match(panel, /자기가 듣기에는 노래하는 소리라고 답했다/);
      assert.match(panel, /송아지와 춤추는 것을 보았다/);
      await t.shot('05-reveal-song');
      await click('송아지와 춤추는 사람들');
      await t.finishRest();
    });
    // 3. 추측 기능 전에 소리만 들은 예전 저장. 추측 없이 바로 능선을 열어도 이어진다.
    await journey('예전 저장 · 추측 생략', { step: 2, heardCamp: true }, async (t) => {
      const { p, by, click } = t;
      assert.equal(await by('내 추측 남기기').count(), 1);
      await t.hidden('예전 저장');
      await click('진영을 내려다보기');
      assert.match(await t.panel(), /내 추측 · 소리만 듣고\s*추측을 남기지 않고 진영을 내려다보았다/);
      assert.equal((await t.saved()).guess, undefined);
      await t.shot('06-old-save-skip');
      await click('송아지와 춤추는 사람들');
      await t.finishRest();
    });
    // 4. 예전 저장에서 이미 능선을 연 상태. 비교 화면이 그대로 열린다.
    await journey('예전 저장 · 능선 연 뒤', { step: 2, heardCamp: true, open: true }, async (t) => {
      assert.match(await t.panel(), /추측을 남기지 않고 진영을 내려다보았다[\s\S]*출 32:19/);
      await t.click('송아지와 춤추는 사람들');
      await t.finishRest();
    });
    console.log('시내산 소리의 출처 · ' + seen.length + '/4 경로 합격 (' + seen.join(', ') + ') · no errors');
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
