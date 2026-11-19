// 3D 전체 자동 점검. 첫 tierIndex부터 나이 단계 셋을 모두 실행한다.
// 사용: node tools/test/walk3d.js <firstTierIndex 0-2> <outDir> [dsf]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const ti = Number(process.argv[2] || '1'), out = process.argv[3], dsf = Number(process.argv[4] || '1');
assert([0, 1, 2].includes(ti), 'tier index must be 0, 1 or 2');
fs.mkdirSync(out, { recursive: true });
const design = fs.readFileSync(path.resolve(__dirname, '../../docs/07_호렙_퀴즈와_동선.md'), 'utf8').replace(/\r\n/g, '\n');
const approvedBlock = design.split('## 5. 구현할 때 넣을 자료')[1].split('```js\n')[1].split('```')[0].trim();
const approved = JSON.parse(JSON.stringify(vm.runInNewContext('({' + approvedBlock + '}).horeb')));

async function runTier(browser, tierIndex) {
  const tierOut = path.join(out, 't' + (tierIndex + 1));
  fs.mkdirSync(tierOut, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dsf });
  try {
    const p = await ctx.newPage(), errs = [];
    await p.addInitScript(() => { window.BO3D_TEST = true; });
    p.on('pageerror', e => errs.push('pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    let n = 0;
    const shot = async label => {
      n++;
      await p.screenshot({ path: path.join(tierOut, String(n).padStart(2, '0') + '-' + label + '.png') });
    };
    const st = () => p.evaluate(() => BO3D.debug.state());
    const parts = () => p.evaluate(() => BO3D.debug.parts());
    const panel = p.locator('.panel3');
    const panelButton = label => panel.getByRole('button', { name: label, exact: true }).click();
    const waitState = state => p.waitForFunction(want => BO3D.debug.state().state === want, state);
    const hiddenTracker = async () => assert.equal(await p.locator('.track3').isVisible(), false, 'locked tracker must be hidden');
    async function walkTo(x, z, label) {
      for (let i = 0; i < 400; i++) {
        const s = await st();
        if (s.state !== 'explore' && s.state !== 'free') break;
        const dx = x - s.x, dz = z - s.z;
        if (Math.hypot(dx, dz) < 0.6) break;
        await p.evaluate(yaw => { BO3D.debug.yaw(yaw); BO3D.debug.stick(0, 1); }, Math.atan2(dx, dz));
        await p.waitForTimeout(120);
        if (i === 12 && label) await shot(label + '-walking');
      }
      await p.evaluate(() => BO3D.debug.stick(0, 0));
      await p.waitForTimeout(400);
    }
    const aim = async (x, z) => {
      await p.evaluate(([x, z]) => { const s = BO3D.debug.state(); BO3D.debug.yaw(Math.atan2(x - s.x, z - s.z)); }, [x, z]);
      await p.waitForTimeout(1500);
    };
    const snap = async label => { await p.locator('.cam3').click(); await p.waitForTimeout(400); await shot(label); };
    await p.goto(require('url').pathToFileURL(path.resolve(__dirname, '../../dist/preview3d.html')).href);
    await p.evaluate(() => document.fonts.ready);
    const { C, H, P } = await p.evaluate(() => ({ C: BO.content, H: BO.content3d.horeb, P: BO3D.world.P }));
    assert.deepEqual(H, approved, 'horeb data must exactly match approved document, including all labels and notes');
    assert.deepEqual((await parts()).at, H.quiz.map(q => q.at), 'part positions');
    assert.deepEqual(P.scraps, H.quiz.map(q => q.at), 'parts and scripture fragments share positions');
    const tier = C.tiers[tierIndex].id;
    await shot('menu');
    await p.locator('.tier').nth(tierIndex).click();
    await p.getByRole('button', { name: '탐험 시작', exact: true }).click();
    await p.locator('.route-opts .btn').filter({ hasText: '모세' }).click();
    await panel.getByRole('button', { name: '다음', exact: true }).waitFor({ timeout: 40000 });
    assert((await panel.innerText()).includes('타임머신이 모래 위에 거칠게 내려앉았어요.'));
    await shot('intro1');
    await panelButton('다음');
    assert.equal(await panel.locator('.narr').innerText(), H.intro.narr2[tier]);
    await panelButton('출발하자');

    async function solveDetector(index) {
      const item = H.quiz[index], q = item.q[tier];
      await panel.locator('[data-detector-quiz="' + index + '"]').waitFor();
      assert.equal((await st()).state, 'detector');
      await hiddenTracker();
      assert.equal(await p.locator('.hud3 .ref').isVisible(), false, 'HUD must not reveal verse hints during quiz');
      assert.equal(await panel.locator('.q-kicker').innerText(), H.kicker + ' ' + (index + 1) + ' / 3');
      assert.equal(await panel.locator('.q-prompt').innerText(), q.prompt);
      assert.deepEqual(await panel.locator('.opt').allTextContents(), q.options.map(o => o.label));
      if (tier === 't2') assert.equal(await panel.locator('.narr-meta .ref').innerText(), item.ref);
      else {
        assert.equal(await panel.locator('.narr-meta').innerText(), H.bookHint[tier]);
        assert.equal(await panel.locator('.ref').count(), 0, 'no verse before correct answer for t1/t3');
      }
      assert(!(await panel.innerText()).includes('본문에 없음'), 'internal option notes must not be rendered');
      await shot('detector' + (index + 1));
      const wrong = q.options.find(o => !o.ok);
      await panel.getByRole('button', { name: wrong.label, exact: true }).click();
      assert.equal(await panel.locator('.note.look b').innerText(), '성경에서 확인해 볼까요?');
      assert((await panel.locator('.note.look').innerText()).includes('성경책을 펴서 읽은 뒤 다시 골라 보세요.'));
      assert.equal((await parts()).found, index, 'wrong answer must not collect or unlock a part');
      assert.equal((await st()).state, 'detector');
      await hiddenTracker();
      const before = await st();
      await p.keyboard.down('w'); await p.waitForTimeout(180); await p.keyboard.up('w');
      const after = await st();
      assert.deepEqual([after.x, after.z], [before.x, before.z], 'quiz must pause player movement');
      await panel.getByRole('button', { name: q.options.find(o => o.ok).label, exact: true }).click();
      assert.equal(await panel.locator('.note.good b').innerText(), '성경에 그렇게 기록되어 있어요.');
      assert.equal(await panel.locator('.note.good .ref').innerText(), item.okRef[tier]);
      if (tier === 't1') {
        assert(!(await panel.innerText()).includes('탐험대 이야기'), 't1 Bible answer and detector guidance must be separate screens');
        await panelButton('다음');
        assert.equal(await panel.locator('.note.good').count(), 0);
      }
      assert.equal(await panel.locator('.q-kicker').innerText(), '탐험대 이야기');
      assert.equal(await panel.locator('.narr').innerText(), tier === 't1' && item.foundT1 ? item.foundT1 : item.found);
      await panelButton('계속 탐험하기');
      await waitState('explore');
      await p.locator('.track3').waitFor({ state: 'visible' });
      assert.equal(await p.locator('.hud3 .obj span').innerText(), item.objective);
      console.log(tier, 'detector', index + 1, 'wrong answer -> retry -> correct; guidance and signal verified');
    }

    for (let i = 0; i < H.quiz.length; i++) {
      await solveDetector(i);
      if (i === 0) {
        // 나중 부품과 독립된 말씀 조각을 미리 줍지 못하는지, 위치만 옮겨 실제 프레임에서 확인한다.
        const start = await st();
        for (const at of H.quiz.slice(1).map(q => q.at)) {
          await p.evaluate(at => BO3D.debug.goto(at[0], at[1]), at);
          await p.waitForTimeout(250);
          assert.equal((await parts()).found, 0, 'future part collected before its quiz');
          assert.equal((await st()).state, 'explore', 'future scripture fragment collected separately');
        }
        await p.evaluate(at => BO3D.debug.goto(at[0], at[1]), [start.x, start.z]);
        await aim(P.mountain[0], P.mountain[1]); await snap('photo-horeb');
      }
      if (i === 1) {
        assert.equal((await st()).mosesArrived, false, 'Moses must not have arrived before fragment 2');
        await walkTo(P.flock[0] + 6, P.flock[1] + 6);
        await aim(P.flock[0], P.flock[1]); await snap('photo-sheep');
        assert((await p.evaluate(() => BO3D.debug.sheep())) >= 30, 'sheep < 30');
      }
      if (i === 2) {
        const before = await st();
        await p.evaluate(P => { BO3D.debug.goto(P.bush[0], P.bush[1] + P.witnessRadius + 0.2); BO3D.debug.yaw(Math.PI); BO3D.debug.stick(0, 1); }, P);
        await p.waitForTimeout(900);
        await p.evaluate(() => BO3D.debug.stick(0, 0));
        const edge = await st();
        assert(Math.hypot(edge.x - P.bush[0], edge.z - P.bush[1]) >= P.witnessRadius - 0.1, 'crossed witness boundary');
        await shot('boundary');
        await p.evaluate(at => BO3D.debug.goto(at[0], at[1]), [before.x, before.z]);
      }
      await walkTo(H.quiz[i].at[0], H.quiz[i].at[1], 'part' + (i + 1));
      assert.equal((await parts()).found, i + 1, 'part was not collected');
      assert.equal((await st()).state, 'caption');
      await shot('part' + (i + 1));
      if (H.quiz[i].beat !== null) {
        assert.equal(await panel.locator('.q-kicker').innerText(), '말씀 조각 ' + (i + 1) + ' / 3');
        assert.equal(await panel.locator('.narr-meta .ref').innerText(), C.scenes['EX-01'].beats[H.quiz[i].beat].ref);
        await panelButton('계속 탐험하기');
      } else {
        assert.equal(await panel.locator('.q-kicker').innerText(), '탐험대 이야기');
        assert((await panel.innerText()).includes(H.lookUp.text));
        assert((await p.locator('.toast3').innerText()).includes(H.lastPart));
        assert(!(await p.locator('.toast3').innerText()).includes('타임머신에 끼우러 가자.'));
        await panelButton('다음');
      }
    }
    await waitState('event');
    await p.waitForTimeout(1800);
    await shot('look-up');
    await snap('photo-event');
    const scene = C.scenes['EX-01'];
    for (let beat = 2; beat < scene.beats.length; beat++) {
      assert.equal(await panel.locator('.q-kicker').innerText(), '지켜보기 ' + (beat - 1) + ' / ' + (scene.beats.length - 2));
      await panel.locator('.sheet-foot .btn.onpaper').click();
    }
    await waitState('gates');
    for (const [index, q] of scene.gates[tier].entries()) {
      await shot('gate' + (index + 1));
      const pick = qq => p.locator('.overlay3').getByRole('button', { name: qq.options.find(o => o.ok).label, exact: true }).click();
      if (q.type === 'choice') await pick(q);
      else if (q.type === 'find') { await p.getByRole('button', { name: '찾아서 읽었어요', exact: true }).click(); await pick(q.confirm); }
      else if (q.type === 'order') for (const item of q.items) await p.locator('.overlay3 .opt').filter({ hasText: item }).click();
      else if (q.type === 'findref') {
        const value = q.accept[0].split(':');
        await p.locator('.refin input').nth(0).fill(value[0]); await p.locator('.refin input').nth(1).fill(value[1]);
        await p.locator('.refin .btn').click();
      }
      await p.locator('.overlay3 .sheet-foot .btn.onpaper').click();
    }
    await waitState('end'); await shot('end');
    await p.locator('.overlay3').getByRole('button', { name: '계속 탐험하기', exact: true }).click();
    await waitState('free');
    assert.equal((await parts()).found, 3);
    assert.equal((await parts()).done, true);
    await walkTo(P.machine[0] - 2, P.machine[1] - 4, 'back-to-machine');
    await aim(P.machine[0], P.machine[1]); await snap('photo-machine');
    await p.locator('.dex3').click(); await shot('dex');
    await p.getByRole('button', { name: '닫기', exact: true }).click();
    await p.getByRole('button', { name: '타임머신에 타기', exact: true }).click(); await shot('den');
    await p.locator('.sw').nth(2).click(); await p.locator('.tog').click(); await shot('den-deco');
    await p.getByRole('button', { name: '밖으로 나가기', exact: true }).click();
    await p.getByRole('button', { name: '타임머신에 타기', exact: true }).click();
    await p.getByRole('button', { name: '다음 시대로 출발', exact: true }).click();
    await p.getByRole('button', { name: '처음부터 다시', exact: true }).waitFor({ timeout: 40000 });
    await shot('endcard');
    assert.equal((await st()).state, 'end2');
    // 다시 시작할 때 답과 부품 수집 상태가 남지 않는지도 화면 조작으로 확인한다.
    await p.getByRole('button', { name: '처음부터 다시', exact: true }).click();
    await p.getByRole('button', { name: '탐험 시작', exact: true }).click();
    await p.locator('.route-opts .btn').filter({ hasText: '모세' }).click();
    await panelButton('다음'); await panelButton('출발하자');
    await panel.locator('[data-detector-quiz="0"]').waitFor();
    assert.equal((await parts()).found, 0);
    await hiddenTracker();
    assert.deepEqual(errs, [], 'browser errors');
    console.log(tier, 'shots:', n, 'all three quizzes and full journey passed; restart resets progress; no errors');
  } finally { await ctx.close(); }
}

(async () => {
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const browser = await chromium.launch({ proxy, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
  try { for (const index of [ti].concat([0, 1, 2].filter(i => i !== ti))) await runTier(browser, index); }
  finally { await browser.close(); }
})().catch(e => { console.error('FAIL', e.stack || e.message); process.exitCode = 1; });
