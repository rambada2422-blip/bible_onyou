// 호렙과 요단 강에서 누를 영역, 아이콘 단추 이름과 실제 배경 위의 글자 대비를 검사한다.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const { gameOrigin, proxy } = require('../game-server');

function inspect() {
  const overlay = document.querySelector('.overlay3');
  const scope = overlay.getClientRects().length ? overlay : document.querySelector('#ui');
  const issues = [], lines = [];
  for (const control of scope.querySelectorAll('button, input, textarea, summary, [role="button"]')) {
    const box = control.getBoundingClientRect();
    if (!box.width || !box.height || getComputedStyle(control).visibility === 'hidden') continue;
    const text = control.innerText?.trim() || '';
    const name = control.getAttribute('aria-label')?.trim() || text;
    if (!name) issues.push('읽을 이름 없음 · ' + control.className);
    if (box.width < 43.99 || box.height < 43.99) {
      issues.push(name + ' · 터치 ' + box.width.toFixed(1) + '×' + box.height.toFixed(1));
    }
  }
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = node.parentElement, name = node.textContent.trim();
    if (!name || el.closest('svg, :disabled, [aria-hidden="true"]')) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const rect of range.getClientRects()) {
      let left = Math.max(0, rect.left), right = Math.min(innerWidth, rect.right);
      let top = Math.max(0, rect.top), bottom = Math.min(innerHeight, rect.bottom), opacity = 1;
      for (let parent = el; parent; parent = parent.parentElement) {
        const css = getComputedStyle(parent), clip = parent.getBoundingClientRect();
        opacity *= Number(css.opacity);
        if (css.overflowX !== 'visible') { left = Math.max(left, clip.left); right = Math.min(right, clip.right); }
        if (css.overflowY !== 'visible') { top = Math.max(top, clip.top); bottom = Math.min(bottom, clip.bottom); }
      }
      if (right - left < 2 || bottom - top < 2 || opacity === 0) continue;
      const y = Math.floor((top + bottom) / 2);
      const xs = [.2, .5, .8].map(f => Math.floor(left + (right - left) * f)).filter(x => {
        const cover = document.elementFromPoint(x, y)?.closest('.overlay3, .toast3, .panel3');
        return !cover || cover.contains(el);
      });
      if (xs.length) lines.push({ name: name.slice(0, 26), color: getComputedStyle(el).color, opacity, xs, y });
    }
  }
  return { issues, lines };
}

async function contrast({ lines, png }) {
  const img = new Image();
  img.src = 'data:image/png;base64,' + png;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = img.width; canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const pixels = ctx.getImageData(0, 0, img.width, img.height).data;
  function luminance(channels) {
    const [r, g, b] = channels.map(n => n / 255).map(s => s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4);
    return .2126 * r + .7152 * g + .0722 * b;
  }
  const errors = [];
  for (const { name, color, opacity, xs, y } of lines) {
    const [r, g, b, a = 1] = color.match(/[\d.]+/g).map(Number);
    const alpha = a * opacity;
    let worst = Infinity;
    for (const x of xs) {
      const i = (y * img.width + x) * 4;
      const bg = Array.from(pixels.subarray(i, i + 3));
      const fg = [r, g, b].map((v, c) => v * alpha + bg[c] * (1 - alpha));
      const foreground = luminance(fg), background = luminance(bg);
      worst = Math.min(worst, (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05));
    }
    if (worst < 4.5) errors.push(name + ' · 대비 ' + worst.toFixed(2));
  }
  return errors;
}

async function run(output) {
  const browser = await chromium.launch({ proxy, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl'] });
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const errors = new Set();
    page.on('pageerror', e => errors.add(e.message));
    const button = name => page.getByRole('button', { name, exact: true });
    const url = (await gameOrigin(browser)) + '/preview3d.html?q=low';
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    async function audit(scene) {
      for (const [width, height] of [[320, 568], [568, 320]]) {
        await page.setViewportSize({ width, height });
        const folder = path.join(output, width + 'x' + height);
        await fs.mkdir(folder, { recursive: true });
        // 긴 창도 맨 아래의 단추와 글까지 실제 보이는 배경 위에서 잰다.
        const scroller = page.locator('.overlay3:visible, .panel3:visible .sheet-body').first();
        const inner = page.locator('.overlay3:visible .sheet-body').first();
        const scroll = await inner.count() ? inner : scroller;
        const offsets = await scroll.count() ? await scroll.evaluate(e => {
          const end = e.scrollHeight - e.clientHeight, result = [0];
          for (let y = e.clientHeight; y < end && e.clientHeight; y += e.clientHeight) result.push(y);
          if (end > 2) result.push(end);
          return result;
        }) : [0];
        for (const [index, offset] of offsets.entries()) {
          if (offsets.length > 1) await scroll.evaluate((e, y) => { e.scrollTop = y; }, offset);
          await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
          const { issues, lines } = await page.evaluate(inspect);
          await page.screenshot({ path: path.join(folder, scene + (index ? '-' + (index + 1) : '') + '.png'), animations: 'disabled' });
          const style = await page.addStyleTag({ content: '#ui * { -webkit-text-fill-color: transparent !important; text-shadow: none !important; }' });
          try {
            const png = (await page.screenshot({ animations: 'disabled' })).toString('base64');
            const ratios = await page.evaluate(contrast, { lines, png });
            for (const issue of issues.concat(ratios)) errors.add(scene + ' ' + width + '×' + height + ' · ' + issue);
          } finally { await style.evaluate(s => s.remove()); }
        }
        if (offsets.length > 1) await scroll.evaluate(e => { e.scrollTop = 0; });
      }
    }
    async function resume(stage) {
      await page.evaluate(stage => {
        const jordan = ['jordan', 'deduce'].includes(stage);
        const clues = jordan ? Object.fromEntries(BO.content3d.jordan.clues.map(c => [c.id, ''])) : {};
        localStorage.setItem('bo3d.save.v1', JSON.stringify({ stage, parts: stage === 'horeb' ? 0 : 3, tier: 't1', ch: 'choeon',
          route: jordan ? 'ALT-02' : 'EX-01', dex: { sheep: '' }, clues, muted: true }));
      }, stage);
      await page.reload();
      await button('이어서 탐험하기').tap();
    }
    await audit('menu');
    await button('탐험 시작').tap(); await audit('route');
    await button('여호수아').tap(); await button('둘러보자').waitFor(); await audit('jordan-arrival');
    await resume('horeb'); await page.locator('[data-detector-quiz]').waitFor(); await audit('horeb-question');
    await resume('gates'); await page.locator('.overlay3 .q-kicker').first().waitFor(); await audit('horeb-gate');
    await resume('free'); await page.locator('.dex3').waitFor(); await audit('horeb-hud');
    await button('소리 켜기').tap();
    assert.equal(await button('소리 끄기').getAttribute('aria-pressed'), 'false');
    await button('소리 끄기').tap();
    assert.equal(await button('소리 켜기').getAttribute('aria-pressed'), 'true');
    assert.equal(await button('사진 찍기').count(), 1);
    await page.locator('.dex3').tap(); await audit('horeb-album'); await button('닫기').tap();
    await page.evaluate(() => BO3D.debug.goto(...BO3D.world.P.machine));
    await button('타임머신에 타기').tap(); await audit('horeb-den');
    await resume('jordan'); await page.locator('.dex3').waitFor(); await audit('jordan-hud');
    await page.locator('.dex3').tap(); await audit('jordan-notebook'); await button('닫기').tap();
    await button('추리하기').tap(); await page.locator('.evi').first().waitFor(); await audit('jordan-evidence');
    for (const issue of errors) console.error(issue);
    assert.equal(errors.size, 0, '3D 누르는 영역, 이름 또는 글자 대비');
    console.log('호렙·요단 강 11개 화면, 세로·가로 · 터치 44×44, 읽을 이름, 실제 배경 대비 4.5 이상 · no errors');
  } finally { await browser.close(); }
}

if (!process.argv[2]) { console.error('첫 인자로 화면 사진을 저장할 폴더를 지정하세요.'); process.exitCode = 1; }
else run(path.resolve(process.argv[2])).catch(e => { console.error(e); process.exitCode = 1; });
