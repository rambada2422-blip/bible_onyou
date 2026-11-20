// 호렙 관문과 요단 추리 사이에서 닫았다 열고, 직접 쓴 탐험 기록을 다시 읽는다.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const { gameOrigin, proxy } = require('../game-server');
const folder = path.resolve(process.argv[2] || 'dist/check/story-resume3d');
const key = 'bo3d.save.v1';
const base = { tier: 't1', ch: 'choeon', route: 'EX-01', parts: 3, dex: { sheep: '' }, clues: {}, muted: true };

(async () => {
  await fs.mkdir(folder, { recursive: true });
  const browser = await chromium.launch({ proxy, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl'] });
  try {
    const start = (await gameOrigin(browser)) + '/preview3d.html';
    const page = await browser.newPage({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const errors = [];
    const failures = [];
    const button = name => page.getByRole('button', { name, exact: true });
    const resume = async () => { await page.reload(); await button('이어서 탐험하기').tap(); };
    const store = async record => {
      await page.evaluate(([key, record]) => localStorage.setItem(key, JSON.stringify(record)), [key, record]);
      await resume();
    };
    const check = async (name, run) => {
      try { await run(); console.log('통과 · ' + name); }
      catch (error) { failures.push(name + ' · ' + error.message); }
    };
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(start);
    const [sc, jd] = await page.evaluate(() => [BO.content.scenes['EX-01'], BO.content3d.jordan]);

    await check('호렙에서 맞힌 관문 다음부터 이어 간다', async () => {
      await store({ ...base, stage: 'gates' });
      await button(sc.gates.t1[0].options.find(o => o.ok).label).tap();
      await page.locator('.note.good').waitFor();
      await resume();
      assert.match(await page.locator('.q-kicker').innerText(), /2 \/ 2/);
      await button('찾아서 읽었어요').tap();
      await button(sc.gates.t1[1].confirm.options.find(o => o.ok).label).tap();
      await resume();
      assert.equal(await page.locator('.q-kicker').innerText(), '탐험을 마치며');
    });

    await check('요단 강 첫 증거를 풀고 다음 추리부터 이어 간다', async () => {
      const clues = Object.fromEntries(jd.clues.map(c => [c.id, '']));
      await store({ ...base, stage: 'deduce', route: 'ALT-02', clues, parts: 0 });
      const correct = jd.clues.find(c => jd.evidence[0].ok.includes(c.id));
      await button(correct.name).tap();
      await page.locator('.note.good').waitFor();
      await resume();
      assert.match(await page.locator('.q-kicker').innerText(), /추리 2 \//);
    });

    await check('쓴 기록은 새로고침과 귀환 후에도 읽고, 새 탐험에서 지운다', async () => {
      const note = '양 떼 쪽에서 모세를 보았다.\n<내 기록> & 두 번째 줄';
      await store({ ...base, stage: 'reward', tier: 't3', ch: 'onwoo' });
      const field = page.getByRole('textbox', { name: '기록' });
      await field.fill(note);
      await resume();
      assert.equal(await field.inputValue(), note);
      await button('계속 탐험하기').tap();
      const record = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
      assert.equal(record.stage, 'free');
      await page.evaluate(() => BO3D.debug.goto(...BO3D.world.P.machine));
      await button('타임머신에 타기').tap();
      await button('다음 시대로 출발').tap();
      await button('다른 이름으로 가 보기').waitFor({ timeout: 40000 });
      await resume();
      await page.getByText('내 탐험 기록', { exact: true }).tap();
      assert.equal(await page.locator('.journal-note p').textContent(), note);
      await page.screenshot({ path: path.join(folder, 'returned-note.png') });
      await button('처음부터 다시').tap();
      await button('탐험 시작').tap();
      assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).horebNote, key), undefined);
    });

    await check('예전 저장과 잘못된 문항 번호에서도 첫 관문을 연다', async () => {
      await store({ ...base, stage: 'gates', question: 999, horebNote: {} });
      assert.match(await page.locator('.q-kicker').innerText(), /1 \/ 2/);
      assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).dex.sheep, key), '');
    });
    assert.deepEqual(errors, []);
    assert.deepEqual(failures, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
