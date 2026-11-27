'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const outDir = process.argv[2] || 'dist/check/desert-shade';
const target = process.argv[3] || 'dist/expedition.html';
const url = /^https?:/.test(target) ? target : pathToFileURL(path.resolve(target)).href;

const HANDOFF_SHOT_DIR = path.resolve('docs/인계/사진/출애굽기원정');
const DESERT_ROWS = [
  'P..^.P..E.',
  '..^.....:.',
  '..:..^^...',
  '....^...^^',
  '..^..^.:..',
  '....:.....',
  '.@...^^...',
  'P...^....P'
];

function desertState(gear) {
  return {
    v: 1,
    i: 4,
    gear,
    sound: false,
    practice: false,
    finished: false,
    rewinds: 0,
    s: {
      x: 1,
      y: 6,
      turn: 0,
      face: 1,
      cart: null,
      loaded: false,
      delivered: false,
      flags: {},
      notes: [],
      shots: [],
      sequence: [],
      used: {},
      water: gear === 'flask' ? 5 : 3,
      heat: 0
    },
    entries: [],
    undo: []
  };
}

function tileAt(x, y) {
  return DESERT_ROWS[y]?.[x] || '#';
}

function isShaded(x, y, turn) {
  if (tileAt(x, y) === ':') return true;
  const side = Math.floor(turn / 4) % 2 ? 1 : -1;
  const nx = x + side;
  return nx >= 0 && nx < DESERT_ROWS[0].length && ['^', 'P'].includes(tileAt(nx, y));
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(HANDOFF_SHOT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 360, height: 640 },
    reducedMotion: 'reduce',
    hasTouch: true,
    isMobile: true
  });

  const errors = [];
  const p = await context.newPage();
  p.on('pageerror', (e) => errors.push(String(e)));
  p.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  const st = () => p.evaluate(() => JSON.parse(localStorage.getItem('onyou.exodus.road.v1')));
  const envText = () => p.locator('#rd-env').textContent();
  const toastText = () => p.locator('#rd-toast').textContent();
  const waitBtn = () => p.locator('.rd-wait');
  const actBtn = () => p.locator('#rd-act');
  const undoBtn = () => p.locator('#rd-undo');

  async function bootDesert(gear) {
    await p.goto(url + '#road', { waitUntil: 'domcontentloaded' });
    await p.evaluate((g) => localStorage.setItem('onyou.exodus.road.v1', JSON.stringify(g)), desertState(gear));
    await p.reload({ waitUntil: 'domcontentloaded' });
    await p.locator('#rd-world').waitFor();
    await p.waitForTimeout(120);
  }

  async function stepDir(dir, viaKeyboard = false) {
    if (viaKeyboard) {
      const key = { n: 'ArrowUp', e: 'ArrowRight', s: 'ArrowDown', w: 'ArrowLeft' }[dir];
      await p.keyboard.press(key);
    } else {
      await p.locator(`[data-go="${dir}"]`).tap();
    }
    await p.waitForTimeout(55);
  }

  async function followSteps(steps, { viaKeyboard = false, refillTents = false } = {}) {
    for (const step of steps) {
      const dialogOpen = await p.locator('#rd-dialog[open]').isVisible().catch(() => false);
      if (dialogOpen) break;
      if (step === 'wait') {
        if (viaKeyboard) await p.keyboard.press('t');
        else await waitBtn().tap();
        await p.waitForTimeout(60);
      } else {
        await stepDir(step, viaKeyboard);
        if (refillTents) {
          const cur = (await st()).s;
          const id = `${cur.x},${cur.y}`;
          if (
            tileAt(cur.x, cur.y) === ':' &&
            !cur.used[id] &&
            Math.abs(cur.x - 8) + Math.abs(cur.y - 0) > 1
          ) {
            if (viaKeyboard) await p.keyboard.press('Space');
            else await actBtn().tap();
            await p.waitForTimeout(60);
          }
        }
      }
    }
  }

  try {
    // 1. Mobile layout, sun-flip before/after shots, touch & keyboard wait, undo & restart
    await bootDesert('flask');
    assert.equal(await waitBtn().isVisible(), true, '그늘 기다리기 버튼이 광야에서 보여야 함');
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, '360x640 가로 넘침 없음');

    // Move 3 steps east: (1,6) -> (2,6) -> (3,6) -> (4,6), turn=3 (next turn flips shadow onto (4,6) from rock (5,6))
    await followSteps(['e', 'e', 'e'], { viaKeyboard: false });
    const beforeFlip = (await st()).s;
    assert.deepEqual([beforeFlip.x, beforeFlip.y, beforeFlip.turn], [4, 6, 3]);
    assert.equal(isShaded(4, 6, 3), false);
    const beforeEnv = await envText();
    assert.match(beforeEnv, /다음 턴 서쪽 그늘/, `전환 직전 힌트 확인: ${beforeEnv}`);
    await p.waitForTimeout(140);
    await p.screenshot({ path: path.join(HANDOFF_SHOT_DIR, '광야_태양전환_전.png') });
    await p.screenshot({ path: path.join(outDir, '광야_태양전환_전.png') });

    // Tap "그늘 기다리기" once: stays at (4,6), turn=4, shadow flips onto (4,6)!
    await waitBtn().tap();
    await p.waitForTimeout(140);
    const afterFlip = (await st()).s;
    assert.deepEqual([afterFlip.x, afterFlip.y, afterFlip.turn], [4, 6, 4]);
    assert.equal(isShaded(4, 6, 4), true);
    // Heat was 0 after 3 sunlit steps (water dropped 5 -> 4); waiting in sun on turn 3 adds 1 heat -> heat=1, water=4
    assert.equal(afterFlip.water, 4);
    assert.equal(afterFlip.heat, 1);
    const afterEnv = await envText();
    assert.match(afterEnv, /그늘/, `전환 직후 그늘 표시 확인: ${afterEnv}`);
    assert.match(afterEnv, /4턴 뒤 동쪽 그늘/, `전환 직후 다음 방향 안내 확인: ${afterEnv}`);
    await p.screenshot({ path: path.join(HANDOFF_SHOT_DIR, '광야_태양전환_후.png') });
    await p.screenshot({ path: path.join(outDir, '광야_태양전환_후.png') });

    // Wait again via keyboard 't' while in shade -> heat cools from 1 to 0, water stays 4
    await p.keyboard.press('t');
    await p.waitForTimeout(60);
    const cooled = (await st()).s;
    assert.deepEqual([cooled.x, cooled.y, cooled.turn, cooled.heat, cooled.water], [4, 6, 5, 0, 4]);

    // Undo via keyboard 'z' restores pre-wait state cleanly
    await p.keyboard.press('z');
    await p.waitForTimeout(60);
    const undone = (await st()).s;
    assert.deepEqual([undone.x, undone.y, undone.turn, undone.heat, undone.water], [4, 6, 4, 1, 4]);

    // Step onto tent (4,5): waiting on tent must NOT auto-refill water
    await stepDir('n', true);
    const onTent = (await st()).s;
    assert.deepEqual([onTent.x, onTent.y], [4, 5]);
    const waterBeforeTentWait = onTent.water;
    await waitBtn().tap();
    await p.waitForTimeout(60);
    const afterTentWait = (await st()).s;
    assert.deepEqual([afterTentWait.x, afterTentWait.y], [4, 5]);
    assert.equal(afterTentWait.water, waterBeforeTentWait, '차양 위에서 기다려도 물이 자동 보충되지 않아야 함');
    assert.equal(Object.keys(afterTentWait.used).length, 0);

    // Explicit refill on tent works
    await actBtn().tap();
    await p.waitForTimeout(60);
    const afterRefill = (await st()).s;
    assert.equal(afterRefill.water, 5);
    assert.equal(afterRefill.used['4,5'], true);

    // Mid-stage restart via menu
    await p.locator('#rd-menu').tap();
    await p.getByRole('button', { name: '이 현장 다시 시작' }).tap();
    await p.getByRole('button', { name: '다시 시작' }).tap();
    await p.waitForTimeout(80);
    const restarted = (await st()).s;
    assert.deepEqual([restarted.x, restarted.y, restarted.turn, restarted.water, restarted.heat], [1, 6, 0, 5, 0]);
    assert.deepEqual(restarted.used, {});

    // 2. Exhaustion by waiting in sun + undo recovery (lens: water 3 -> 12 sunlit waits exhausts)
    await bootDesert('lens');
    // (1,6) is sunlit at turn 0..3; move to (1,5) which is ALWAYS sunlit (no adjacent ^ or P horizontally)
    await stepDir('n', true); // (1,5), turn 1, heat 1, water 3
    let exhausted = false;
    for (let k = 0; k < 14; k++) {
      await p.keyboard.press('t');
      await p.waitForTimeout(40);
      if (await p.locator('#rd-dialog[open]').isVisible().catch(() => false)) {
        exhausted = true;
        break;
      }
    }
    assert.equal(exhausted, true, '볕에서 계속 기다리면 탈진 안내가 열려야 함');
    assert.match(await p.locator('#rd-dialog-body h2').textContent(), /발걸음이 멎었다/);
    await p.getByRole('button', { name: '마지막 걸음 되돌리기' }).tap();
    await p.waitForTimeout(60);
    const recovered = (await st()).s;
    assert.equal(recovered.water, 0, '탈진 직전 턴으로 복구되어야 함');
    assert.equal(await p.locator('#rd-dialog[open]').isVisible().catch(() => false), false);

    // 3. Route comparison with SAME gear (lens, start water 3) AND (flask, start water 5)
    // Short sunlit route (12 steps, no tents):
    // (1,6)->(1,5)->(2,5)->(3,5)->(3,4)->(3,3)->(3,2)->(4,2)->(4,1)->(5,1)->(6,1)->(7,1)->(7,0) [near E(8,0)]
    const shortSunlit = ['n', 'e', 'e', 'n', 'n', 'n', 'e', 'n', 'e', 'e', 'e', 'n'];

    // Shade + tent route (uses rock shade + wait + tents (4,5), (7,4), (8,1)):
    // (1,6) -> e,e,e -> (4,6)[turn 3] -> wait[turn 4, shaded!] -> n(4,5 tent +2) -> e,e,e -> (7,5) -> n(7,4 tent +2)
    // -> n(7,3) -> n(7,2) -> n(7,1) -> e(8,1 tent +2, near E(8,0))
    const shadeTent = ['e', 'e', 'e', 'wait', 'n', 'e', 'e', 'e', 'n', 'n', 'n', 'n', 'e'];

    const results = {};
    for (const gear of ['lens', 'flask']) {
      // Short sunlit
      await bootDesert(gear);
      await followSteps(shortSunlit, { viaKeyboard: true, refillTents: false });
      const sunDialog = await p.locator('#rd-dialog[open]').isVisible().catch(() => false);
      const sunSt = (await st()).s;
      const sunArrived = !sunDialog && Math.abs(sunSt.x - 8) + Math.abs(sunSt.y - 0) <= 1;
      results[`${gear}_short`] = {
        gear,
        arrived: sunArrived,
        exhausted: sunDialog,
        water: sunSt.water,
        heat: sunSt.heat,
        turn: sunSt.turn,
        tents: Object.keys(sunSt.used).length
      };

      // Shade + tent
      await bootDesert(gear);
      await followSteps(shadeTent, { viaKeyboard: false, refillTents: true });
      const shadeDialog = await p.locator('#rd-dialog[open]').isVisible().catch(() => false);
      const shadeSt = (await st()).s;
      const shadeArrived = !shadeDialog && Math.abs(shadeSt.x - 8) + Math.abs(shadeSt.y - 0) <= 1;
      assert.equal(shadeArrived, true, `${gear} 그늘·차양 경로는 엘림의 샘에 닿아야 함: ${JSON.stringify(shadeSt)}`);
      results[`${gear}_shade`] = {
        gear,
        arrived: shadeArrived,
        exhausted: shadeDialog,
        water: shadeSt.water,
        heat: shadeSt.heat,
        turn: shadeSt.turn,
        tents: Object.keys(shadeSt.used).length
      };
    }

    // Same-gear comparisons must clearly favor shade/tent route
    assert.ok(
      results.lens_shade.water > results.lens_short.water,
      `렌즈 동일 장비 비교: 그늘 경로(${results.lens_shade.water}) > 볕 직행(${results.lens_short.water})`
    );
    assert.ok(
      results.flask_shade.water > results.flask_short.water,
      `물병 동일 장비 비교: 그늘 경로(${results.flask_shade.water}) > 볕 직행(${results.flask_short.water})`
    );
    assert.ok(
      results.flask_short.water > results.lens_short.water,
      `장비 비교(볕 직행): 물병(${results.flask_short.water}) > 렌즈(${results.lens_short.water})`
    );

    // 4. Complete desert at E(8,0) and advance to 6th site (ridge)
    await actBtn().tap(); // 샘에 닿기 (currently standing at (8,1) next to E(8,0) from flask_shade)
    await p.getByRole('button', { name: '다음 현장으로' }).tap();
    await p.waitForTimeout(100);
    const nextStage = await st();
    assert.equal(nextStage.i, 5, '6번째 현장(시내 산기슭)으로 넘어가야 함');
    assert.equal(await waitBtn().isVisible(), false, '광야를 벗어나면 그늘 기다리기 버튼이 숨겨져야 함');
    assert.match(await p.locator('#rd-title').textContent(), /산 위에서 들은 것/);

    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);

    fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(results, null, 2));
    console.log('광야 움직이는 그늘 테스트 통과:', JSON.stringify(results));
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
