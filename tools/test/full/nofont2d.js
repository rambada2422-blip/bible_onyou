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
let gameUrl;
const sizes = [[320, 568], [390, 664], [844, 390]];

function findClippedText() {
  const screen = document.querySelector('#app > .screen');
  const walker = document.createTreeWalker(screen, NodeFilter.SHOW_TEXT);
  const problems = new Set();
  const tolerance = 2;

  function clipsLine(element, line, horizontal) {
    const [start, end] = horizontal ? [line.left, line.right] : [line.top, line.bottom];
    for (let parent = element; parent; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      const overflow = horizontal ? style.overflowX : style.overflowY;
      if (overflow === 'visible') continue;
      const box = parent.getBoundingClientRect();
      const edge = horizontal ? box.left + parent.clientLeft : box.top + parent.clientTop;
      const visible = horizontal ? parent.clientWidth : parent.clientHeight;
      // 세로로 넘기는 본문과 가로로 넘기는 안내 표의 내용도 읽을 수 있어야 한다.
      const scrollable = ['auto', 'scroll'].includes(overflow) &&
        (!horizontal || parent.classList.contains('tblwrap'));
      const scroll = scrollable ? (horizontal ? parent.scrollLeft : parent.scrollTop) : 0;
      const extent = scrollable ? (horizontal ? parent.scrollWidth : parent.scrollHeight) : visible;
      if (start < edge - scroll - tolerance || end > edge - scroll + extent + tolerance ||
          end - start > visible + tolerance) return true;
      if (scrollable) return false;
    }
    return start < -tolerance || end > (horizontal ? innerWidth : innerHeight) + tolerance;
  }

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const label = node.textContent.trim().slice(0, 42);
    const element = node.parentElement;
    if (!label || element.closest('svg') || getComputedStyle(element).visibility !== 'visible') continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const line of range.getClientRects()) {
      if (!line.width || !line.height) continue;
      if (clipsLine(element, line, true)) problems.add(`글이 좌우로 잘림 · ${label}`);
      if (clipsLine(element, line, false)) problems.add(`글이 위아래로 잘림 · ${label}`);
    }
  }
  return [...problems];
}

async function localFontFamilies(context, page) {
  const session = await context.newCDPSession(page);
  try {
    await session.send('DOM.enable');
    await session.send('CSS.enable');
    const { root } = await session.send('DOM.getDocument');
    const families = [];
    for (const selector of ['.game-title', '.game-sub', '.eyebrow']) {
      const { nodeId } = await session.send('DOM.querySelector', { nodeId: root.nodeId, selector });
      const { fonts } = await session.send('CSS.getPlatformFontsForNode', { nodeId });
      assert(fonts.length && fonts.every((font) => !font.isCustomFont) &&
        fonts.some((font) => font.glyphCount >= 5), `기기 글꼴로 한글을 그리지 못했습니다. ${selector}`);
      families.push(...fonts.map((font) => font.familyName));
    }
    return [...new Set(families)].join(', ');
  } finally {
    await session.detach();
  }
}

async function checkScreen(browser, [width, height], age) {
  const size = `${width}x${height}`;
  const folder = path.resolve(outputFolder, size);
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
  const issues = [];
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    page.setDefaultNavigationTimeout(30000);
    page.on('pageerror', (error) => issues.push(`게임 실행 오류 · ${error.message}`));
    const blocked = new Set();
    await page.route(
      (url) => ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname),
      (route) => {
        blocked.add(new URL(route.request().url()).hostname);
        return route.abort('blockedbyclient');
      }
    );
    const click = (name) => page.getByRole('button', { name, exact: true }).click();
    const next = page.locator('.sheet-foot .btn.onpaper');
    let count = 0;
    async function capture(name) {
      await page.evaluate(() => document.fonts.ready);
      const problems = await page.evaluate(findClippedText);
      issues.push(...problems.map((problem) => `${name} · ${problem}`));
      await page.screenshot({ path: path.join(folder, `${name}.png`), animations: 'disabled' });
      count++;
    }

    await fs.mkdir(folder, { recursive: true });
    await page.goto(gameUrl);
    assert(blocked.has('fonts.googleapis.com'), '인터넷 글꼴 주소를 실제로 차단하지 못했습니다.');
    assert.equal(await page.evaluate(() => document.fonts.size), 0, '인터넷 글꼴 선언이 화면에 남았습니다.');
    const families = await localFontFamilies(context, page);
    await capture('01-title');
    await click('구성 안내 (선생님·부모님용)');
    await capture('02-guide');
    await click('돌아가기');
    await click('탐험 시작');
    await page.locator('.tier').nth(age).click();
    await capture('03-setup');
    await click('출발 준비 완료');
    await capture('04-timeline');
    await page.locator('.node.play').first().click();
    await click('둘러보기');
    await capture('05-story');
    const { beats, questions } = await page.evaluate((index) => {
      const scene = BO.content.scenes['EX-00'];
      return { beats: scene.beats.length, questions: scene.gates[BO.content.tiers[index].id] };
    }, age);
    for (let step = 0; step < beats; step++) await next.click();
    for (const [index, question] of questions.entries()) {
      await capture(`06-question-${index + 1}`);
      if (question.type === 'findref') {
        const [chapter, verse] = question.accept[0].split(':');
        await page.getByRole('textbox', { name: '장', exact: true }).fill(chapter);
        await page.getByRole('textbox', { name: '절', exact: true }).fill(verse);
        await click('확인');
      } else {
        await click(question.options.find((choice) => choice.ok).label);
      }
      await click(index === questions.length - 1 ? '관문 통과' : '다음 관문');
    }
    await capture('07-card');
    await click('다음');
    await capture('08-ending');
    await click('다음 목적지 정하기');
    await capture('09-route');
    if (!issues.length) console.log(`${size} · ${count}화면 확인 · 기기 글꼴 ${families}`);
  } catch (error) {
    issues.push(error.message);
  } finally {
    await context.close();
  }
  if (issues.length) console.error(`실패 · ${size}\n${[...new Set(issues)].join('\n')}`);
  return issues.length === 0;
}

(async () => {
  const browser = await chromium.launch({ proxy });
  gameUrl = (await gameOrigin(browser)) + '/index.html';
  try {
    const results = await Promise.all(sizes.map((size, age) => checkScreen(browser, size, age)));
    if (results.every(Boolean)) console.log('글꼴 차단 시험 통과 · no errors');
    else process.exitCode = 1;
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(`글꼴 차단 시험을 실행하지 못했습니다. ${error.message}`);
  process.exitCode = 1;
});
