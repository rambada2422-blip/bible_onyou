// 8~10세 떨기나무 이야기의 '글에서 찾기' (출 3:5, 3:6, 3:10-12)를 시험한다 (web/js/content.js 머리말의 find).
// 대목 글을 읽은 뒤 '다음' 대신 글 속의 말을 찾아 누르면 동료의 말이 나온다. 말씀 카드는 전처럼 관문 뒤에 들어온다.
// node tools/build.js && node tools/test/full/text-find2d.js [화면 사진 폴더]
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const { chromium } = require('playwright');
const { gameOrigin, proxy } = require('../game-server');
const layoutIssues = require('../layout-issues');

const out = path.resolve(process.argv[2] || 'dist/check/text-find2d');
const key = 'bo_demo_v1';

function watchSpeech() {
  const voice = { current: null };
  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    value: class { constructor(text) { this.text = text; } }, configurable: true
  });
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
    speak(utterance) { voice.current = utterance; },
    cancel() { voice.current = null; }
  } });
  window.testVoice = voice;
}

async function openBeat(page, origin, entry, tier, step, extra) {
  await page.goto(origin + entry);
  await page.evaluate(([key, record]) => localStorage.setItem(key, JSON.stringify(record)), [key, {
    v: 1, tier, char: 'choeon', done: {}, cards: [], notes: {}, routed: true, journey: { id: 'EX-01', tier, step, ...extra }
  }]);
  await page.reload();
  await page.getByRole('button', { name: '이어서 탐험하기', exact: true }).click();
  await page.locator('.narr').waitFor();
  await page.waitForTimeout(600);
}

const saved = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);

// 찾을 말 단추가 손가락으로 누를 만큼 크고, 화면 안에서 가려지지 않았는지 본다.
async function wordBoxes(page) {
  return page.locator('.narr.findtext .find-word').evaluateAll((words) => words.map((word) => {
    word.scrollIntoView({ block: 'nearest' });
    const r = word.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { text: word.textContent, w: r.width, h: r.height, hit: hit === word || word.contains(hit) };
  }));
}

// 찾을 말과 나머지 말이 겉모습으로 구별되지 않아야 한다 (밑줄과 글자 모양).
async function sameLook(page) {
  return page.evaluate(() => {
    const look = (el) => { const s = getComputedStyle(el); return [s.textDecorationLine, s.textDecorationStyle, s.textDecorationColor, s.fontSize, s.fontFamily, s.color, s.fontWeight].join('|'); };
    const word = document.querySelector('.narr.findtext .find-word:not(.found)');
    const plain = document.querySelector('.narr.findtext span.w');
    return word && plain ? look(word) === look(plain) : null;
  });
}

async function play(browser, origin, entry, size, label) {
  const [width, height] = size;
  const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true });
  await context.addInitScript(watchSpeech);
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  const shot = async (name) => {
    const issues = await page.evaluate(layoutIssues, '#app > .screen');
    assert.deepEqual(issues, [], `${label} ${name} 화면 배치`);
    await page.screenshot({ path: path.join(out, `${label}-${name}.png`) });
  };
  const button = (name) => page.getByRole('button', { name, exact: true });
  try {
    await page.goto(origin + entry);
    const scene = await page.evaluate(() => BO.content.scenes['EX-01']);
    const findBeats = scene.beats.map((beat, i) => (beat.find && beat.find.t1 ? i : -1)).filter((i) => i >= 0);
    assert.deepEqual(findBeats, [3, 4, 6], '글에서 찾기는 출 3:5, 3:6, 3:10-12 세 대목이다');
    for (const i of findBeats) {
      const beat = scene.beats[i];
      assert(!beat.look, '그림을 눌러 여는 대목에는 글에서 찾기를 두지 않는다');
      assert.deepEqual(Object.keys(beat.find), ['t1'], '글에서 찾기는 8~10세에만 있다');
      for (const word of beat.find.t1.words) assert.equal(beat.text.t1.split(word).length - 1, 1, `찾을 말 '${word}'은 글에 한 번 있다`);
      assert.equal(beat.find.t1.card, undefined, '찾는 순간에는 말씀 카드를 주지 않는다');
    }

    // ① 출 3:5. 다음 단추 없이, 아래 단추 자리에 찾을 말이 적혀 있다.
    await openBeat(page, origin, entry, 't1', 'beat-3');
    const holy = scene.beats[3];
    assert.equal(await page.locator('.narr.findtext').count(), 1);
    assert.equal(await page.locator('.sheet-foot .btn.onpaper').count(), 0, '글에서 찾을 때는 다음 단추가 없다');
    assert.equal((await page.locator('.sheet-foot .find-help').innerText()).trim(), holy.find.t1.prompt);
    assert.equal(await page.locator('.narr.findtext').innerText(), holy.text.t1, '대목 글은 그대로 보인다');
    assert.equal(await page.locator('.say').count(), 0, '동료의 말은 찾은 뒤에 나온다');
    assert.equal(await sameLook(page), true, '찾을 말이 겉모습으로 드러나지 않는다');
    for (const box of await wordBoxes(page)) {
      assert(box.w >= 44 && box.h >= 44, `${box.text} 누르는 영역 ${box.w}×${box.h}`);
      assert(box.hit, `${box.text}이 다른 것에 가리지 않는다`);
    }
    await button('읽어 줘').tap();
    assert.equal(await page.evaluate(() => window.testVoice.current?.text), holy.text.t1 + ' ' + holy.find.t1.prompt, '8~10세는 찾을 말 안내까지 들려준다');
    await button('그만 듣기').tap();
    await shot('01-holy');

    // 글 사이 빈 곳은 세지 않는다. 다른 말을 누르면 다시 읽어 보게 하고, 또 누르면 찾을 말이 반짝인다. 대목은 그대로다.
    const para = await page.locator('.narr.findtext').boundingBox();
    const gap = await page.locator('.narr.findtext').evaluate((p) => {
      const r = p.getBoundingClientRect(), last = [...p.querySelectorAll('.w')].pop().getBoundingClientRect();
      return { x: Math.min(r.right - 4, last.right + 12), y: last.top + last.height / 2 };
    });
    if (gap.x > (await page.locator('.narr.findtext .w').last().boundingBox()).x + 30) {
      await page.touchscreen.tap(gap.x, gap.y);
      assert.equal(await page.locator('.find-note').innerText(), '', '글 사이 빈 곳은 다른 말로 세지 않는다');
    }
    assert(para.height > 0);
    const plain = page.locator('.narr.findtext span.w');
    await plain.nth(1).tap();
    assert.equal(await page.locator('.find-note').innerText(), '글을 천천히 다시 읽어 볼까요?');
    assert.equal(await page.locator('.find-word.nudge').count(), 0);
    await plain.nth(3).tap();
    assert.equal(await page.locator('.find-note').innerText(), '반짝이는 말을 눌러 보세요.');
    assert.equal(await page.locator('.find-word.nudge').count(), 1);
    assert.equal((await saved(page)).cards.length, 0, '찾기 전에는 카드가 들어오지 않는다');
    await shot('02-nudge');

    await page.locator('.find-word').first().tap();
    await page.locator('.narr.findtext').waitFor({ state: 'detached' });
    assert.deepEqual(await page.locator('.narr mark.found-word').allInnerTexts(), holy.find.t1.words, '찾은 말이 표시된다');
    assert.equal(await page.locator('.say .bubble').innerText(), '최온\n' + holy.say.text);
    assert.equal(await page.locator('.find-card').count(), 0, '찾은 뒤에 말씀 카드 띠를 보이지 않는다');
    assert.equal(await page.evaluate(() => document.activeElement.textContent), '다음', '찾은 뒤 초점은 다음 단추로 간다');
    let state = await saved(page);
    assert.deepEqual(state.cards, [], '말씀 카드는 관문 뒤에 들어온다');
    assert.deepEqual(state.journey.marks, [3]);
    await shot('03-holy-found');

    // 새로 열어도, 이전·다음으로 오가도 다시 찾게 하지 않는다.
    await page.reload();
    await button('이어서 탐험하기').click();
    await page.locator('.narr mark.found-word').waitFor();
    assert.equal(await page.locator('.narr.findtext').count(), 0);
    await button('이전').click();
    await page.locator('.narr', { hasText: scene.beats[2].text.t1 }).waitFor();
    await button('다음').click();
    await page.locator('.narr mark.found-word').waitFor();

    // ② 출 3:6. 세 이름을 차례로 찾는다. 키보드로도 찾을 수 있다.
    await button('다음').click();
    const names = scene.beats[4];
    await page.locator('.narr.findtext').waitFor();
    assert.deepEqual(await page.locator('.find-word').allInnerTexts(), names.find.t1.words);
    await page.locator('.find-word').nth(2).tap();
    assert.equal(await page.locator('.find-note').innerText(), '하나 찾았어요. 둘 남았어요.');
    await page.locator('.sheet-foot .find-help').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('.find-note').innerText(), '글을 천천히 다시 읽어 볼까요?', '아래 단추를 처음 누르면 글을 다시 읽게 한다');
    assert.equal(await page.locator('.find-word.nudge').count(), 0);
    await page.locator('.sheet-foot .find-help').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('.find-word.nudge').count(), 2, '두 번째부터는 남은 말만 반짝인다');
    assert.equal(await page.evaluate(() => document.activeElement.textContent), names.find.t1.words[0], '아래 단추를 누르면 초점이 남은 말로 간다');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('.find-note').innerText(), '둘 찾았어요. 하나 남았어요.');
    assert.equal(await page.evaluate(() => document.activeElement.textContent), names.find.t1.words[1], '찾은 뒤 초점은 남은 말로 간다');
    await shot('04-names');
    await page.keyboard.press('Enter');
    await page.locator('.narr.findtext').waitFor({ state: 'detached' });
    assert.equal(await page.locator('.say .bubble').innerText(), '휴\n' + names.say.text);
    assert.equal((await saved(page)).cards.length, 0);
    await shot('05-names-found');

    // ③ 출 3:7-8은 그대로 다음, ④ 출 3:10-12에서 약속을 찾는다.
    await button('다음').click();
    await page.locator('.narr', { hasText: scene.beats[5].text.t1 }).waitFor();
    assert.equal(await page.locator('.narr.findtext').count(), 0);
    await button('다음').click();
    const promise = scene.beats[6];
    await page.locator('.narr.findtext').waitFor();
    await page.locator('.find-word').first().tap();
    await page.locator('.narr.findtext').waitFor({ state: 'detached' });
    assert.match(await page.locator('.openbible').innerText(), /출애굽기 3장 12절/);
    await page.waitForTimeout(700);
    const open = await page.evaluate(() => {
      const box = document.querySelector('.openbible').getBoundingClientRect(), foot = document.querySelector('.sheet-foot').getBoundingClientRect();
      return { bottom: box.bottom, foot: foot.top, top: box.top, body: document.querySelector('.sheet-body').getBoundingClientRect().top };
    });
    assert(open.bottom <= open.foot + 1 && open.top >= open.body - 1, `찾은 뒤 성경책 안내가 아래 단추에 가리지 않는다 ${JSON.stringify(open)}`);
    assert.equal(await page.evaluate(() => document.activeElement.textContent), '다음으로 가는 관문');
    state = await saved(page);
    assert.deepEqual(state.cards, []);
    assert.deepEqual(state.journey.marks, [3, 4, 6]);
    assert.equal(promise.find.t1.words[0], '꼭 함께 있겠다고');
    await shot('06-promise-found');

    // 관문과 말씀 카드 화면은 그대로다. 카드는 말씀 카드 화면에서 두 장 들어온다.
    await button('다음으로 가는 관문').click();
    await page.locator('.q-kicker', { hasText: '다음으로 가는 관문 1' }).waitFor();
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('bo_demo_v1')); s.journey.step = 'cards'; localStorage.setItem('bo_demo_v1', JSON.stringify(s)); });
    await page.reload();
    await button('이어서 탐험하기').click();
    await page.locator('.vcards').waitFor();
    assert.deepEqual((await saved(page)).cards.map((card) => card.ref), ['출 3:5', '출 3:12']);

    // 깨진 저장 값의 찾기 기록은 무시한다.
    await openBeat(page, origin, entry, 't1', 'beat-4', { marks: [3, 3, 99, 'x', 5] });
    await page.locator('.narr.findtext').waitFor();
    await button('이전').click();
    await page.locator('.narr mark.found-word').waitFor();
    assert.deepEqual((await saved(page)).journey.marks, [3]);

    // 11~13세, 14~19세는 바뀌지 않았다.
    for (const tier of ['t2', 't3']) {
      for (const step of ['beat-3', 'beat-4', 'beat-6']) {
        await openBeat(page, origin, entry, tier, step);
        assert.equal(await page.locator('.narr.findtext').count(), 0, `${tier} ${step}에는 글에서 찾기가 없다`);
        assert.equal(await page.locator('.sheet-foot .btn.onpaper').count(), 1);
        assert.equal(await page.locator('.say').count(), 1);
      }
    }
    assert.deepEqual(errors, []);
    return `${label} · 글에서 찾기 세 대목, 카드와 이어하기, 키보드, 다른 나이 단계 그대로 · no errors`;
  } finally {
    await context.close();
  }
}

(async () => {
  await fs.mkdir(out, { recursive: true });
  const browser = await chromium.launch({ proxy });
  try {
    const origin = await gameOrigin(browser);
    const runs = [
      ['/web/index.html', [390, 844], '390x844'],
      ['/web/index.html', [320, 568], '320x568'],
      ['/web/index.html', [844, 390], '844x390'],
      ['/web/index.html', [568, 320], '568x320'],
      ['/preview.html', [390, 844], 'preview-390x844']
    ];
    for (const [entry, size, label] of runs) console.log(await play(browser, origin, entry, size, label));
    console.log('글에서 찾기 · no errors');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
