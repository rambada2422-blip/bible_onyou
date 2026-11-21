// 실제 2D 화면에서 웹 음성 엔진에 보낸 문장과 취소 요청을 확인한다.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const { gameOrigin, proxy } = require('../game-server');

const out = path.resolve(process.argv[2] || 'dist/check/read-aloud2d');

function watchSpeech() {
  const voice = { current: null, last: null, fail: false };
  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    value: class { constructor(text) { this.text = text; } }, configurable: true
  });
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
    speak(utterance) {
      if (voice.fail) throw new Error('speech unavailable');
      voice.last = voice.current = utterance;
    },
    cancel() { voice.current = null; }
  } });
  window.testVoice = voice;
}

async function play(browser, origin, entry, label) {
  const page = await browser.newPage({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  try {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(watchSpeech);
    await page.goto(origin + entry);
    const key = 'bo_demo_v1';
    const record = { v: 1, tier: 't1', char: 'choeon', done: {}, cards: [], notes: {}, routed: true,
      journey: { id: 'EX-01', tier: 't1', step: 'beat-0' } };
    await page.evaluate(([key, record]) => localStorage.setItem(key, JSON.stringify(record)), [key, record]);
    await page.reload();
    const button = name => page.getByRole('button', { name, exact: true });
    const current = () => page.evaluate(() => window.testVoice.current?.text || null);
    await button('이어서 탐험하기').tap();
    const firstText = await page.locator('.narr').innerText();
    const lookText = await page.locator('.sheet-foot .look-help').innerText();
    await button('읽어 줘').tap();
    assert.equal(await current(), firstText + ' ' + lookText.trim(), '8~10세는 그림에서 찾을 것까지 들려준다');
    assert.equal(await page.evaluate(() => window.testVoice.current.lang), 'ko-KR');
    await button('떨기나무 살펴보기').tap();
    assert.equal(await current(), null, '그림을 눌러 다음 대목으로 가면 이전 문장이 멈춘다');

    const nextText = await page.locator('.narr').innerText();
    await button('읽어 줘').tap();
    assert.equal(await current(), nextText);
    await page.evaluate(() => { window.staleVoice = window.testVoice.current; });
    await button('그만 듣기').tap();
    assert.equal(await current(), null);
    await button('읽어 줘').tap();
    await page.evaluate(() => window.staleVoice.onend?.());
    assert(await button('그만 듣기').isVisible(), '끝난 문장의 늦은 알림이 새 낭독을 끊지 않는다');
    await page.evaluate(() => {
      const utterance = window.testVoice.current;
      window.testVoice.current = null;
      utterance.onend();
    });
    await button('읽어 줘').tap();
    await button('이전').tap();
    assert.equal(await current(), null);

    await button('읽어 줘').tap();
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
      delete document.hidden;
    });
    assert.equal(await current(), null, '화면이 숨겨지면 읽기를 멈춘다');
    await button('읽어 줘').tap();
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    assert.equal(await current(), null);
    await button('읽어 줘').tap();
    await page.evaluate(() => {
      const utterance = window.testVoice.current;
      window.testVoice.current = null;
      utterance.onerror({ error: 'synthesis-failed' });
    });
    await page.getByRole('status').filter({ hasText: '지금은 소리로 읽어 줄 수 없어요.' }).waitFor();
    await page.screenshot({ path: path.join(out, label + '-unavailable.png') });
    await page.evaluate(() => { window.testVoice.fail = true; });
    await button('읽어 줘').tap();
    assert(await button('읽어 줘').isVisible());
    await page.evaluate(() => { window.testVoice.fail = false; });
    await button('읽어 줘').tap();
    await button('시간표로 돌아가기').tap();
    assert.equal(await current(), null, '시간표에서도 이전 대목의 낭독을 멈춘다');
    record.tier = record.journey.tier = 't2';
    await page.evaluate(([key, record]) => localStorage.setItem(key, JSON.stringify(record)), [key, record]);
    await page.reload();
    await button('이어서 탐험하기').tap();
    await page.locator('.narr').waitFor();
    assert.equal(await page.locator('.readbtn').count(), 0);
    assert.deepEqual(errors, []);
    console.log(label + ' · 다음/이전, 직접 멈춤, 끝·오류·늦은 알림, 화면 숨김과 시간표 이동 통과');
  } finally { await page.close(); }
}

(async () => {
  const browser = await chromium.launch({ proxy });
  try {
    await fs.mkdir(out, { recursive: true });
    const origin = await gameOrigin(browser);
    await play(browser, origin, '/preview.html', '2d-preview');
    await play(browser, origin, '/web/index.html', '2d-web');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
