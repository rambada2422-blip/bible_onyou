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
const url = pathToFileURL(path.resolve(__dirname, '../../../web/index.html')).href;
const screens = [
  { width: 320, height: 568, age: 0, destination: '여호수아' },
  { width: 844, height: 390, age: 0, destination: '요셉' },
  { width: 390, height: 844, age: 2 },
];

function inspectScreen() {
  const screen = document.querySelector('#app > .screen');
  const errors = [];
  const lines = [];
  const controls = screen.querySelectorAll('button, input, textarea');
  for (const control of controls) {
    const { width, height } = control.getBoundingClientRect();
    if (!width || !height) continue;
    const name = control.getAttribute('aria-label')?.trim() || control.innerText.trim();
    if (width < 43.99 || height < 43.99) {
      errors.push(`누르는 영역이 44×44보다 작음 · ${name} · ${width.toFixed(1)}×${height.toFixed(1)}`);
    }
    if (control.matches('button') && !name) errors.push('글자 없는 단추에 읽을 이름이 없음');
  }

  function recordText(rect, element, color, name) {
    let left = Math.max(0, rect.left);
    let right = Math.min(innerWidth, rect.right);
    let top = Math.max(0, rect.top);
    let bottom = Math.min(innerHeight, rect.bottom);
    let opacity = 1;
    for (let parent = element; parent; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      opacity *= Number(style.opacity);
      const box = parent.getBoundingClientRect();
      if (style.overflowX !== 'visible') {
        left = Math.max(left, box.left);
        right = Math.min(right, box.right);
      }
      if (style.overflowY !== 'visible') {
        top = Math.max(top, box.top);
        bottom = Math.min(bottom, box.bottom);
      }
    }
    if (right - left < 2 || bottom - top < 2) return;
    const y = Math.floor((top + bottom) / 2);
    const xs = [.2, .5, .8].map((fraction) => Math.floor(left + (right - left) * fraction));
    lines.push({ color, opacity, name: name.trim().slice(0, 28), xs, y });
  }

  const walker = document.createTreeWalker(screen, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const element = node.parentElement;
    if (!node.textContent.trim() || element.closest('svg')) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const color = getComputedStyle(element).color;
    for (const rect of range.getClientRects()) recordText(rect, element, color, node.textContent);
  }
  for (const field of screen.querySelectorAll('input, textarea')) {
    const text = field.value || field.placeholder;
    if (!text) continue;
    const color = getComputedStyle(field, field.value ? null : '::placeholder').color;
    const rect = field.getBoundingClientRect();
    recordText({ left: rect.left + 12, right: rect.right - 12, top: rect.top, bottom: rect.top + 34 },
      field, color, text);
  }
  return { errors, lines };
}

async function measureContrast({ image, lines }) {
  const picture = new Image();
  picture.src = 'data:image/png;base64,' + image;
  await picture.decode();
  const canvas = document.createElement('canvas');
  canvas.width = picture.width;
  canvas.height = picture.height;
  const context = canvas.getContext('2d');
  context.drawImage(picture, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const ratios = new Map();
  function brightness(channels) {
    const [r, g, b] = channels.map((channel) => {
      const s = channel / 255;
      return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4;
    });
    return .2126 * r + .7152 * g + .0722 * b;
  }
  for (const { color, opacity, name, xs, y } of lines) {
    const [r, g, b, a = 1] = color.match(/[\d.]+/g).map(Number);
    const alpha = a * opacity;
    for (const x of xs) {
      const index = (y * canvas.width + x) * 4;
      const bg = Array.from(pixels.subarray(index, index + 3));
      const fg = [r, g, b].map((channel, i) => channel * alpha + bg[i] * (1 - alpha));
      const l1 = brightness(fg);
      const l2 = brightness(bg);
      const ratio = (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);
      ratios.set(name, Math.min(ratios.get(name) ?? Infinity, ratio));
    }
  }
  return [...ratios].filter(([, ratio]) => ratio < 4.5)
    .map(([name, ratio]) => `글과 배경의 대비가 4.5보다 낮음 · ${name} · ${ratio.toFixed(2)}`);
}

async function checkScreen(browser, { width, height, age, destination }) {
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

  async function audit(name) {
    await page.evaluate(() => document.fonts.ready);
    const { errors, lines } = await page.evaluate(inspectScreen);
    await page.screenshot({ path: path.join(folder, `${name}.png`), animations: 'disabled' });
    // 글자만 잠깐 투명하게 해서 그림이나 반투명 칸 밑의 실제 배경색을 읽는다.
    const style = await page.addStyleTag({ content: '#app * { -webkit-text-fill-color: transparent !important; text-shadow: none !important; }' });
    try {
      const background = await page.screenshot({ animations: 'disabled' });
      const contrast = await page.evaluate(measureContrast, { image: background.toString('base64'), lines });
      for (const problem of [...errors, ...contrast]) issues.push(`${name} · ${problem}`);
    } finally {
      await style.evaluate((element) => element.remove());
    }
  }

  try {
    await fs.mkdir(folder, { recursive: true });
    await page.goto(url);
    await audit('01-title');
    await click('탐험 시작');
    await audit('02-setup');
    await page.locator('.tier').nth(age).click();
    await audit('03-picked');
    await click('출발 준비 완료');
    await audit('04-timeline');
    await click('일지 0');
    await audit('05-journal');
    await click('돌아가기');
    await page.locator('.node.play').first().click();
    await click('둘러보기');
    await audit('06-scene');
    await advanceTo('.q-prompt');
    await audit('07-question');
    const question = await page.evaluate((index) => BO.content.scenes['EX-00'].gates[BO.content.tiers[index].id][0], age);
    if (question.type === 'findref') {
      const [chapter, verse] = question.accept[0].split(':');
      await page.getByRole('textbox', { name: '장' }).fill(chapter);
      await page.getByRole('textbox', { name: '절' }).fill(verse);
      await click('확인');
    } else {
      await click(question.options.find((choice) => choice.ok).label);
    }
    await audit('08-answer');
    await click('관문 통과');
    await audit('09-card');
    await click('다음');
    await audit('10-ending');
    await click('다음 목적지 정하기');
    await audit('11-route');
    if (destination) {
      await click(destination);
      await click('둘러보기');
      await advanceTo('.found-list');
      await page.locator('.hot').last().waitFor();
      await audit('12-clues');
      for (const clue of await page.getByRole('button', { name: /^단서 [1-3]$/ }).all()) await clue.click();
      assert(await next.isEnabled(), '단서를 모두 눌렀으나 다음 화면이 열리지 않았습니다.');
    }
  } catch (error) {
    issues.push(error.message);
  } finally {
    await context.close();
  }
  if (issues.length) console.error(`실패 · ${size}\n${[...new Set(issues)].join('\n')}`);
  else console.log(`${size} · 누르는 영역, 읽을 이름, 글 대비 · no errors`);
  return issues.length === 0;
}

(async () => {
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const browser = await chromium.launch({ proxy });
  try {
    const results = await Promise.all(screens.map((view) => checkScreen(browser, view)));
    if (results.includes(false)) process.exitCode = 1;
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(`단추와 글 대비 시험을 실행하지 못했습니다. ${error.message}`);
  process.exitCode = 1;
});
