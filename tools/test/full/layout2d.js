const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const outputFolder = process.argv[2];
if (!outputFolder) {
  console.error('첫 번째 인자로 화면 사진을 저장할 폴더를 지정하세요.');
  process.exit(1);
}

const { chromium } = require('playwright');
const sizes = [[320, 568], [360, 560], [390, 664], [844, 390]];
const url = pathToFileURL(path.resolve(__dirname, '../../../web/index.html')).href;

// 내용이 세로로 길면 읽을 수 있도록 움직인 뒤 살핀다. 가로 넘침은 허용하지 않는다.
function layoutIssues() {
  const problems = new Set();
  const screen = document.querySelector('#app > .screen');
  const controls = [...screen.querySelectorAll('button, input, textarea')];
  const viewport = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
  const scrollValues = new Map();
  const tolerance = 2;
  const label = (el) => (el.getAttribute('aria-label') || el.textContent || el.className).trim().slice(0, 36);

  function clipChain(el) {
    const clips = [];
    for (let parent = el.parentElement; parent; parent = parent.parentElement) {
      const { overflowX, overflowY } = getComputedStyle(parent);
      if (overflowX === 'visible' && overflowY === 'visible') continue;
      const { x, y } = parent.getBoundingClientRect();
      const left = x + parent.clientLeft;
      const top = y + parent.clientTop;
      clips.push({ parent, overflowX, overflowY, left, top,
        right: left + parent.clientWidth, bottom: top + parent.clientHeight });
    }
    return clips;
  }

  function visibleBox(el) {
    const r = el.getBoundingClientRect();
    const box = { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    for (const clip of [...clipChain(el), viewport]) {
      if (clip.overflowX !== 'visible') {
        box.left = Math.max(box.left, clip.left);
        box.right = Math.min(box.right, clip.right);
      }
      if (clip.overflowY !== 'visible') {
        box.top = Math.max(box.top, clip.top);
        box.bottom = Math.min(box.bottom, clip.bottom);
      }
    }
    return box;
  }

  for (const control of controls) {
    const box = control.getBoundingClientRect();
    if (!box.width || !box.height) continue;
    const scroll = clipChain(control).find(({ parent, overflowY }) =>
      ['auto', 'scroll'].includes(overflowY) && parent.scrollHeight > parent.clientHeight + 1);
    if (scroll) {
      if (!scrollValues.has(scroll.parent)) scrollValues.set(scroll.parent, scroll.parent.scrollTop);
      scroll.parent.scrollTop += (box.top + box.bottom - scroll.top - scroll.bottom) / 2;
    }

    const r = control.getBoundingClientRect();
    const visible = visibleBox(control);
    if (r.width - (visible.right - visible.left) > tolerance ||
        r.height - (visible.bottom - visible.top) > tolerance) {
      problems.add(`조작 항목이 잘림 · ${label(control)}`);
    } else if (!control.disabled) {
      // 원형 단서에서도 영역 안쪽의 중심과 네 방향을 실제로 누를 수 있어야 한다.
      const uncovered = [[.5, .5], [.18, .5], [.82, .5], [.5, .18], [.5, .82]]
        .every(([x, y]) => control.contains(document.elementFromPoint(r.left + r.width * x, r.top + r.height * y)));
      if (!uncovered) problems.add(`조작 항목이 가려짐 · ${label(control)}`);
    }

    for (const other of controls) {
      if (other === control) continue;
      const v = visibleBox(other);
      const overlapX = Math.min(visible.right, v.right) - Math.max(visible.left, v.left);
      const overlapY = Math.min(visible.bottom, v.bottom) - Math.max(visible.top, v.top);
      if (overlapX > tolerance && overlapY > tolerance) {
        problems.add(`조작 항목이 겹침 · ${[label(control), label(other)].sort().join(' / ')}`);
      }
    }
  }
  for (const [element, top] of scrollValues) element.scrollTop = top;

  const walker = document.createTreeWalker(screen, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = node.parentElement;
    if (!node.textContent.trim() || el.closest('svg')) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const clips = [...clipChain(node), viewport];
    for (const line of range.getClientRects()) {
      for (const clip of clips) {
        if (clip.overflowX !== 'visible' &&
            (line.left < clip.left - tolerance || line.right > clip.right + tolerance)) {
          problems.add(`글이 좌우로 잘림 · ${node.textContent.trim().slice(0, 36)}`);
        }
      }
      for (const clip of clips) {
        if (clip.overflowY === 'visible') continue;
        const scrolls = ['auto', 'scroll'].includes(clip.overflowY);
        const top = clip.top - (scrolls ? clip.parent.scrollTop : 0);
        const bottom = scrolls ? top + clip.parent.scrollHeight : clip.bottom;
        if (line.top < top - tolerance || line.bottom > bottom + tolerance ||
            line.height > clip.bottom - clip.top + tolerance) {
          problems.add(`글이 위아래로 잘림 · ${node.textContent.trim().slice(0, 36)}`);
        }
        if (scrolls) break;
      }
    }
  }
  return [...problems];
}

async function checkSize(browser, width, height) {
  const size = `${width}x${height}`;
  const folder = path.resolve(outputFolder, size);
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  page.setDefaultNavigationTimeout(30000);
  const issues = [];
  page.on('pageerror', (error) => issues.push(`화면 실행 오류 · ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') issues.push(`화면 기록 오류 · ${message.text()}`);
  });
  const click = (name) => page.getByRole('button', { name, exact: true }).click();
  const next = page.locator('.sheet-foot .btn.onpaper');
  async function advanceTo(selector) {
    for (let step = 0; step < 20; step++) {
      if (await page.locator(selector).count()) return;
      await next.click();
    }
    throw new Error(`지정한 화면에 도착하지 못했습니다. ${selector}`);
  }

  async function capture(name) {
    for (const issue of await page.evaluate(layoutIssues)) issues.push(`${name} · ${issue}`);
    await page.screenshot({ path: path.join(folder, `${name}.png`), animations: 'disabled' });
  }

  async function checkClues(destination, filename) {
    await click(destination);
    await click('둘러보기');
    await advanceTo('.found-list');
    await page.locator('.hot').last().waitFor();
    await capture(filename);
    const clues = await page.locator('.hot').all();
    assert.equal(clues.length, 3, `${destination} 경로의 단서가 세 개여야 합니다.`);
    for (const clue of clues) await clue.click();
    assert(await next.isEnabled(), `${destination} 경로에서 단서를 모두 눌렀으나 다음 화면이 열리지 않았습니다.`);
  }

  try {
    await fs.mkdir(folder, { recursive: true });
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    await capture('01-title');
    await click('탐험 시작');
    await page.locator('.tier').first().click();
    await capture('02-setup');
    await click('출발 준비 완료');
    await capture('03-timeline');
    await page.locator('.node.play').first().click();
    await click('둘러보기');
    await capture('04-scene');
    await advanceTo('.q-prompt');
    await capture('05-question');
    const correct = await page.evaluate(() => BO.content.scenes['EX-00'].gates.t1[0].options.find((choice) => choice.ok).label);
    await click(correct);
    await click('관문 통과');
    await click('다음');
    await capture('06-ending');
    await click('다음 목적지 정하기');
    await capture('07-route');
    await checkClues('여호수아', '08-clues');
    await click('시간표로 돌아가기');
    await click('목적지 다시 고르기');
    await checkClues('요셉', '09-joseph-clues');
  } catch (error) {
    issues.push(error.message);
  } finally {
    await context.close();
  }
  if (issues.length) {
    console.error(`실패 · ${size}\n${[...new Set(issues)].join('\n')}`);
  } else {
    console.log(`${size} · 9화면 확인 · no errors`);
  }
  return issues.length === 0;
}

(async () => {
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const browser = await chromium.launch({ proxy });
  try {
    const results = await Promise.all(sizes.map(([width, height]) => checkSize(browser, width, height)));
    if (results.includes(false)) process.exitCode = 1;
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(`화면 배치 시험을 실행하지 못했습니다. ${error.message}`);
  process.exitCode = 1;
});
