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
let url;
const viewport = { width: 390, height: 664 };

function watchMotion() {
  const seen = new Set();
  function add(target, name) {
    if (!target?.closest('#app')) return;
    const art = target.closest('.art');
    const artKey = art?.querySelector('svg [id]')?.id.split('-')[0];
    const source = artKey ? artKey + ' 배경 그림' : '화면 요소';
    seen.add(`${source} · ${name}`);
  }
  document.addEventListener('animationstart', (event) => add(event.target, event.animationName));
  document.addEventListener('transitionrun', (event) => add(event.target, event.propertyName));
  window.readMotion = () => {
    for (const animation of document.getAnimations()) {
      if (animation.playState !== 'running' && !animation.pending) continue;
      const target = animation.effect?.target;
      add(target?.element || target, animation.animationName || animation.transitionProperty || '움직임');
    }
    return [...seen];
  };
}

async function start(page, holdStart) {
  await page.goto(url, { timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  const button = page.getByRole('button', { name: '탐험 시작', exact: true });
  if (holdStart) {
    const box = await button.boundingBox();
    assert(box, '탐험 시작 단추가 보이지 않습니다.');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await holdStart();
    await page.mouse.up();
  } else {
    await button.click();
  }
  await page.locator('.tier').first().click();
  await page.getByRole('button', { name: '출발 준비 완료', exact: true }).click();
  await page.locator('.hub').waitFor();
}

async function checkReduced(browser, folder) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  try {
    await context.addInitScript(watchMotion);
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    const issues = new Set();
    const checkMotion = async () => {
      for (const item of await page.evaluate(() => window.readMotion())) issues.add(item);
    };
    const capture = async (name) => {
      await page.evaluate(() => Promise.all([...document.querySelectorAll('#app img')].map((image) => image.decode())));
      await checkMotion();
      await page.screenshot({ path: path.join(folder, name + '.png') });
    };
    const click = (name) => page.getByRole('button', { name, exact: true }).click();
    const next = page.locator('.sheet-foot .btn.onpaper');
    await start(page, async () => {
      await checkMotion();
      const moved = await page.getByRole('button', { name: '탐험 시작', exact: true })
        .evaluate((button) => getComputedStyle(button).transform !== 'none');
      if (moved) issues.add('탐험 시작 단추를 눌렀을 때 위치가 움직임');
      await capture('01-title-pressed');
    });
    assert(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches),
      '움직임 줄이기 설정이 적용되지 않았습니다.');
    await capture('02-timeline');
    const { timeline, routes, scenes } = await page.evaluate(() => ({
      timeline: BO.content.timeline.filter((item) => item.playable).map((item) => item.id),
      routes: BO.content.route.options,
      scenes: BO.content.scenes,
    }));
    const viewed = new Set();

    async function checkScene(id) {
      const { art, beats, alt } = scenes[id];
      await page.locator('.warp').waitFor();
      await capture(id + '-warp');
      await page.locator('.stage .art > svg').waitFor();
      let state = beats[0].state;
      async function checkArtwork() {
        const visible = await page.locator('.stage .art > svg').evaluate(async (svg, { art, state }) => {
          const states = BO.artMeta[art]?.states || [];
          const groups = [...svg.querySelectorAll(`g[id^="${art}-state-"]`)]
            .filter((group) => getComputedStyle(group).display !== 'none');
          if (states.length && groups.length !== 1) return false;
          const picture = states.length ? groups[0] : svg;
          if (state && picture.id !== art + '-state-' + state) return false;
          const { width, height } = picture.getBBox();
          if (!width || !height || getComputedStyle(picture).visibility !== 'visible') return false;
          for (const embedded of picture.querySelectorAll('image')) {
            const image = new Image();
            image.src = embedded.href.baseVal;
            await image.decode();
          }
          return true;
        }, { art, state });
        assert(visible, `${id} 구간의 배경 그림 상태가 보이지 않습니다. ${state || '기본 상태'}`);
      }

      await checkArtwork();
      await capture(id + '-00-arrive');
      await click(id === 'EX-09' ? '광야 길 따라가기' : '둘러보기');
      for (const [index, beat] of beats.entries()) {
        state = beat.state || state;
        await checkArtwork();
        await capture(id + '-' + String(index + 1).padStart(2, '0') + '-beat');
        await next.click();
      }
      if (alt) await page.locator('.hot').last().waitFor();
      else await page.locator('.q-kicker').waitFor();
      await capture(id + '-question');
      await click('시간표로 돌아가기');
      viewed.add(id);
    }

    for (const [index, id] of timeline.entries()) {
      await page.locator('.node.play').nth(index).click();
      const route = routes.find((option) => option.to === id);
      if (route) await click(route.label);
      await checkScene(id);
    }
    for (const route of routes) {
      if (viewed.has(route.to)) continue;
      await click('목적지 다시 고르기');
      await click(route.label);
      await checkScene(route.to);
    }
    await checkMotion();
    assert(issues.size === 0, '움직임 줄이기에서 확인된 움직임\n' + [...issues].join('\n'));
    return [...viewed];
  } finally {
    await context.close();
  }
}

async function checkNormal(browser) {
  const context = await browser.newContext({ viewport, reducedMotion: 'no-preference' });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    await start(page);
    await page.locator('.node.play').first().click();
    await page.locator('.stage .art > svg').waitFor();
    await page.waitForFunction(() => document.getAnimations().some((animation) =>
      animation.animationName && animation.playState === 'running' && animation.effect?.target?.closest?.('.art')));
  } finally {
    await context.close();
  }
}

(async () => {
  const folder = path.resolve(outputFolder);
  await fs.mkdir(folder, { recursive: true });
  const browser = await chromium.launch({ proxy });
  url = (await gameOrigin(browser)) + '/index.html';
  try {
    const viewed = await checkReduced(browser, folder);
    await checkNormal(browser);
    console.log(`움직임 줄이기 장면 ${viewed.length}개 확인 · ${viewed.join(', ')} · no errors`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(`움직임 점검 불합격 · ${error.message}`);
  process.exitCode = 1;
});
