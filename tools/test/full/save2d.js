const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { gameOrigin, proxy } = require('../game-server');

const outputFolder = process.argv[2];
if (!outputFolder) {
  console.error('첫 번째 인자로 화면 사진을 저장할 폴더를 지정하세요.');
  process.exit(1);
}

const { chromium } = require('playwright');
const key = 'bo_demo_v1';
let url;
const folder = path.resolve(outputFolder);
const sample = { v: 1, tier: 't3', char: 'onwoo', done: {}, cards: [], notes: {}, routed: false };
const invalidValues = [
  ['broken-json', '끊어진 저장 값', '{"v":1,'],
  ['old-version', '옛 판 번호', JSON.stringify({ ...sample, v: 0 })],
  ['broken-player', '깨진 나이 단계', JSON.stringify({ ...sample, tier: '없는 단계' })],
  ['broken-progress', '깨진 진행 목록', JSON.stringify({ ...sample, done: null })],
  ['broken-journal', '깨진 말씀 카드', JSON.stringify({ ...sample, cards: [null] })],
  ['broken-notes', '깨진 탐험 기록', JSON.stringify({ ...sample, notes: { 'EX-00': 1 } })],
];

function button(page, name) {
  return page.getByRole('button', { name, exact: true });
}

async function startNew(page, age) {
  await button(page, '탐험 시작').click();
  await page.locator('.tier').nth(age).click();
  await button(page, '출발 준비 완료').click();
  await page.locator('.hub').waitFor();
}

async function finishFirstScene(page, note) {
  await page.locator('.node.play').first().click();
  await button(page, '둘러보기').click();
  const beats = await page.evaluate(() => BO.content.scenes['EX-00'].beats.length);
  const next = page.locator('.sheet-foot .btn.onpaper');
  for (let i = 0; i < beats; i++) await next.click();
  const [chapter, verse] = await page.evaluate(() =>
    BO.content.scenes['EX-00'].gates.t3[0].accept[0].split(':'));
  await page.getByRole('textbox', { name: '장', exact: true }).fill(chapter);
  await page.getByRole('textbox', { name: '절', exact: true }).fill(verse);
  await button(page, '확인').click();
  await button(page, '관문 통과').click();
  await button(page, '다음').click();
  await page.getByRole('textbox', { name: '기록', exact: true }).fill(note);
  await button(page, '다음 목적지 정하기').click();
  await button(page, '모세').waitFor();
}

async function checkCase(browser, label, run) {
  const context = await browser.newContext({ viewport: { width: 390, height: 664 }, reducedMotion: 'reduce' });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(6500);
    page.setDefaultNavigationTimeout(30000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await run(page);
    assert.equal(errors.length, 0, `게임 화면 실행 오류 · ${errors.join(' / ')}`);
    console.log(`통과 · ${label}`);
    return true;
  } catch (error) {
    console.error(`실패 · ${label} · ${error.message}`);
    return false;
  } finally {
    await context.close();
  }
}

const open = async (page) => {
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
};
const shot = (page, name) => page.screenshot({ path: path.join(folder, name + '.png') });
const readSave = (page) => page.evaluate((storageKey) => localStorage.getItem(storageKey), key);

(async () => {
  await fs.mkdir(folder, { recursive: true });
  const browser = await chromium.launch({ proxy });
  url = (await gameOrigin(browser)) + '/index.html';
  const results = [];
  try {
    for (const [name, label, value] of invalidValues) {
      results.push(await checkCase(browser, label, async (page) => {
        await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key, value });
        await open(page);
        assert(await button(page, '탐험 시작').isVisible(), '깨진 저장에서 새 탐험을 시작할 수 없습니다.');
        assert.equal(await readSave(page), value, '화면을 여는 동안 기존 저장 값이 바뀌었습니다.');
        await shot(page, name + '-start');
        await startNew(page, 2);
        await button(page, '일지 0').waitFor();
        const saved = JSON.parse(await readSave(page));
        assert.deepEqual(saved, sample, '게임에서 새로 만든 저장 값이 처음 상태와 다릅니다.');
      }));
    }

    for (const blocked of ['storage', 'write']) {
      const label = blocked === 'storage' ? '저장소를 열 수 없음' : '저장 용량 부족';
      results.push(await checkCase(browser, label, async (page) => {
        await page.addInitScript((blocked) => {
          if (blocked === 'storage') {
            Object.defineProperty(window, 'localStorage', {
              get() { throw new DOMException('시험용 저장소 차단', 'SecurityError'); },
            });
          } else {
            Storage.prototype.setItem = function () {
              throw new DOMException('시험용 저장 용량 부족', 'QuotaExceededError');
            };
          }
        }, blocked);
        await open(page);
        await startNew(page, 2);
        await finishFirstScene(page, '시험용 기록');
        await shot(page, blocked + '-route');
        await page.reload();
        await button(page, '탐험 시작').waitFor();
      }));
    }

    results.push(await checkCase(browser, '요셉의 이야기와 반지 단서에서 이어서 탐험', async (page) => {
      await open(page);
      await startNew(page, 0);
      const resume = async () => { await page.reload(); await button(page, '이어서 탐험하기').click(); };
      await button(page, '목적지 다시 고르기').click();
      await button(page, '요셉').click();
      await button(page, '둘러보기').click();
      await button(page, '다음').click();
      const narration = await page.locator('.sheet .narr').innerText();
      await resume();
      assert.equal(await page.locator('.sheet .narr').innerText(), narration);
      const next = page.locator('.sheet-foot .btn.onpaper');
      while (await page.locator('.sheet .narr').count()) await next.click();
      await button(page, '단서 2').click();
      await resume();
      assert(await button(page, '단서 2').isDisabled());
      assert(await button(page, '단서 1').isEnabled());
      assert(await next.isDisabled());
      await shot(page, 'resume-joseph-clue');
      await button(page, '시간표로 돌아가기').click();
      await page.locator('.hub').waitFor();
      await button(page, '요셉 · 이어서 탐험하기').click();
      assert(await button(page, '단서 2').isDisabled());
      await button(page, '단서 1').click(); await button(page, '단서 3').click();
      assert(await next.isEnabled());
      await resume();
      assert.match(await page.locator('.q-kicker').innerText(), /타임머신 다시 맞추기/);
    }));

    results.push(await checkCase(browser, '다른 단계와 깨진 위치에서 기존 일지 보존', async (page) => {
      await open(page);
      const data = { ...sample, done: { 'EX-00': true }, notes: { 'EX-00': '시험 기록' } };
      for (const journey of [
        { id: 'ALT-03', tier: 't1', step: 'spot' },
        { id: 'EX-00', tier: 't3', step: 'gate-25' },
        { id: '없는 곳', tier: 't3', step: 'arrive' }
      ]) {
        await page.evaluate(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [key, { ...data, journey }]);
        await page.reload(); await button(page, '이어서 탐험하기').click();
        await page.locator('.node.done').waitFor();
        assert.equal(JSON.parse(await readSave(page)).notes['EX-00'], '시험 기록');
      }
      await page.locator('.node.play').first().click(); await button(page, '둘러보기').click();
      await page.evaluate(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [key, data]);
      await button(page, '다음').click();
      assert.deepEqual(JSON.parse(await readSave(page)), data, '오래 열린 탭이 다른 탭의 진행을 덮었다');
    }));

    results.push(await checkCase(browser, '이어서 탐험하기와 처음부터 다시', async (page) => {
      await open(page);
      await startNew(page, 2);
      const note = '시험용 탐험 기록';
      await finishFirstScene(page, note);
      const saved = JSON.parse(await readSave(page));
      assert.equal(saved.done['EX-00'], true, '첫 장면 완료가 저장되지 않았습니다.');
      assert.equal(saved.cards.length, 1, '말씀 카드 한 장이 저장되어야 합니다.');
      assert.equal(saved.notes['EX-00'], note, '탐험 기록이 저장되지 않았습니다.');
      await page.reload();
      await button(page, '이어서 탐험하기').click();
      await page.locator('.node.done').first().waitFor();
      await shot(page, 'resume-timeline');
      await button(page, '일지 1').click();
      await page.getByText(note, { exact: true }).waitFor();
      await page.locator('.vcard').first().waitFor();
      await shot(page, 'resume-journal');
      await button(page, '돌아가기').click();
      await button(page, '처음부터 다시').click();
      await button(page, '탐험 시작').waitFor();
      await page.reload();
      await button(page, '탐험 시작').waitFor();
      assert.deepEqual(JSON.parse(await readSave(page)), { ...sample, tier: null, char: null },
        '처음부터 다시 고른 뒤 저장 상태가 비어 있지 않습니다.');
      await startNew(page, 0);
      await button(page, '일지 0').waitFor();
      assert.equal(await page.locator('.node.done').count(), 0, '이전 완료 장면이 남아 있습니다.');
      await shot(page, 'restart-timeline');
    }));
  } finally {
    await browser.close();
  }
  if (results.includes(false)) process.exitCode = 1;
  else console.log(`저장 시험 ${results.length}가지 통과 · no errors`);
})().catch((error) => {
  console.error(`저장 시험을 실행하지 못했습니다. ${error.message}`);
  process.exitCode = 1;
});
