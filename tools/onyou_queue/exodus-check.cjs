// Check the delivered single-file game through its controls, starting at legacy checkpoints.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(require.resolve('playwright', { paths: [process.cwd(), __dirname] }));
const [job, file] = process.argv.slice(2);
const origin = 'http://onyou.test/expedition.html';
const roadKey = 'onyou.exodus.road.v1';
const guidedKey = 'onyou.exodus.expedition.v1';

async function openAt(page, mode, key, state) {
  await page.goto(origin + '#' + mode);
  await page.evaluate(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [key, state]);
  await page.reload();
}

async function sinai(page) {
  const button = name => page.getByRole('button', { name, exact: true });
  for (const choice of ['싸움 소리 같다', '노랫소리 같다']) {
    await openAt(page, 'guided', guidedKey, {
      v: 1, started: true, records: Array.from({length: 6}, () => ({memory: '지난 현장'})),
      progress: {step: 2}, sound: false
    });
    const resume = page.getByRole('button', { name: /떠난 현장 이어가기/ });
    await resume.click();
    await button('먼 진영 소리 듣기').click();
    await button('내 추측 남기기').click();
    await button(choice).click();
    await page.reload();
    await resume.click();
    await button('진영을 내려다보기').click();
    const text = await page.locator('#game').innerText();
    assert(text.includes('내 추측') && text.includes(choice), '복원한 내 추측과 선택 문구');
    assert(/송아지/.test(text) && /춤/.test(text) && /32:1[79]/.test(text), '진영에서 직접 본 것과 본문');
  }
}

async function desert(page) {
  const state = {x: 2, y: 0, turn: 3, heat: 2, water: 3, flags: {}, used: {}, notes: [], shots: [], sequence: [], cart: null};
  await openAt(page, 'road', roadKey, {v: 1, i: 4, gear: 'lens', entries: [], finished: false, s: state, undo: []});
  const read = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)).s, roadKey);
  const sample = s => [s.x, s.y, s.turn, s.heat, s.water];
  const wait = page.getByRole('button', {name: '그늘 기다리기', exact: true});
  await wait.tap();
  assert.deepEqual(sample(await read()), [2,0,4,0,2], '볕에서 기다린 비용과 바뀐 턴');
  await page.reload();
  assert.deepEqual(sample(await read()), [2,0,4,0,2], '재시작 후 보존');
  await wait.focus();
  await page.keyboard.press('Enter');
  assert.deepEqual(sample(await read()), [2,0,5,0,2], '이제 그늘이 된 칸에서는 물 보존');
  const undo = page.getByRole('button', {name: '한 수 되돌리기'});
  await undo.tap(); await undo.tap();
  assert.deepEqual(sample(await read()), sample(state), '두 턴 되돌리기');
}

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({viewport:{width:360,height:640}, hasTouch:true});
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    const html = fs.readFileSync(file, 'utf8');
    await page.route('**/*', route => route.request().url() === origin
      ? route.fulfill({contentType: 'text/html; charset=utf-8', body: html}) : route.abort());
    page.setDefaultTimeout(5000);
    if (job === 'sinai-witness') await sinai(page);
    else if (job === 'desert-shade') await desert(page);
    else throw Error('알 수 없는 검사 '+job);
    assert.deepEqual(errors, []);
    console.log(job+' · 조작 통과');
  } finally { await browser.close(); }
})().catch(err => {console.error(err); process.exitCode=1;});
