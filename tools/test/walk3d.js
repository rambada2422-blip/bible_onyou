// 3D 전체 자동 점검. 첫 tierIndex부터 나이 단계 셋을 모두 실행한다.
// 사용: node tools/test/walk3d.js <firstTierIndex 0-2> <outDir> [dsf] [low]
const { chromium } = require('playwright');
const { gameOrigin, proxy } = require('./game-server');
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
const aweDoc = fs.readFileSync(path.resolve(__dirname, '../../docs/일감/가-2.md'), 'utf8').replace(/\r\n/g, '\n');
const aweBlock = aweDoc.split('```js\n')[1].split('```')[0].trim();
approved.awe = JSON.parse(JSON.stringify(vm.runInNewContext('({' + aweBlock + '}).awe')));

async function runTier(browser, tierIndex, url) {
  const tierOut = path.join(out, 't' + (tierIndex + 1));
  fs.mkdirSync(tierOut, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dsf });
  try {
    const p = await ctx.newPage(), errs = [];
    await p.addInitScript(() => { window.BO3D_TEST = true; });
    p.on('pageerror', e => errs.push('pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    let n = 0, afterLastPart = false;
    const noSharon = async () => assert.equal(await p.locator('[data-sharon]').count(), 0);
    const noLegacyLabel = async () => assert(!(await p.locator('#game').innerText()).includes('탐지기'));
    const shot = async label => {
      await noLegacyLabel();
      if (afterLastPart) await noSharon();
      n++;
      await p.screenshot({ path: path.join(tierOut, String(n).padStart(2, '0') + '-' + label + '.png') });
    };
    const st = () => p.evaluate(() => BO3D.debug.state());
    const performanceRows = [];
    async function sampleFrames(stage) {
      const stats = await p.evaluate(async () => {
        // 첫 프레임 전에 있던 조작·화면 사진 시간을 이 장면의 표에 섞지 않는다.
        for (let i = 0; i < 13; i++) await new Promise(requestAnimationFrame);
        return BO3D.debug.perf(12);
      });
      assert.equal(stats.samples, 12);
      assert(stats.meanMs > 0 && stats.maxMs >= stats.meanMs && stats.drawCalls > 0);
      performanceRows.push({ stage, ...stats });
    }
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
    const lv = () => p.evaluate(() => BO3D.debug.audioLevels());
    const muteRun = tierIndex === 2;
    const near = (a, b, tol, msg) => assert(Math.abs(a - b) <= tol, msg + ': ' + a + ' vs ' + b);
    await p.goto(url);
    if (new URL(url).searchParams.get('q') === 'low') {
      assert.equal(await p.evaluate(() => BO3D.debug.quality()), 'low');
      assert.equal(await p.evaluate(() => BO3D.debug.sheep()), 32);
    }
    await p.evaluate(() => document.fonts.ready);
    const { C, H, P, sharon } = await p.evaluate(() => ({
      C: BO.content, H: BO.content3d.horeb, P: BO3D.world.P, sharon: BO.content3d.sharon
    }));
    assert.deepEqual(H, approved, 'horeb data must exactly match approved document, including all labels and notes');
    assert.deepEqual((await parts()).at, H.quiz.map(q => q.at), 'part positions');
    assert.deepEqual(P.scraps, H.quiz.map(q => q.at), 'parts and scripture fragments share positions');
    const tier = C.tiers[tierIndex].id, scene = C.scenes['EX-01'];
    const pieceGloss = sharon.gloss.find(g => g.at === 'piece1');
    const reviewPages = sharon.gloss.filter(g => g.at.startsWith('watch') && g.text[tier]);
    assert.equal(reviewPages.length, tier === 't1' ? 4 : 7);
    assert.equal(await p.evaluate(() => BO3D.debug.includeReviewRequiredGloss), true);
    await shot('menu');
    await p.locator('.tier').nth(tierIndex).click();
    await p.getByRole('button', { name: '탐험 시작', exact: true }).click();
    await p.locator('.route-opts .btn').filter({ hasText: '모세' }).click();
    async function photographFlock(checkHelp) {
      await waitState('explore');
      await hiddenTracker();
      assert.equal(await panel.isVisible(), false);
      assert.equal((await parts()).found, 0);
      if (checkHelp) {
        await sampleFrames('탐험 시작');
        await shot('landing');
        await p.getByRole('button', { name: '샤론에게 물어보기' }).click();
        assert((await panel.innerText()).includes('양 떼 쪽으로'));
        await panel.locator('summary').click();
        assert.deepEqual(await panel.locator('details p').allTextContents(), sharon.intro[tier]);
        await panelButton('계속 탐험하기');
        await waitState('explore');
        await aim(P.machine[0], P.machine[1]); await snap('before-flock');
        assert.equal((await st()).state, 'explore', 'a photo without sheep must not start the question');
      }
      await walkTo(P.flock[0] + 6, P.flock[1] + 6);
      await aim(P.flock[0], P.flock[1]);
      if (checkHelp) await sampleFrames('양 떼 가까이');
      await p.getByRole('button', { name: '사진 찍기' }).click();
      await waitState('detector');
      assert((await p.evaluate(() => BO3D.debug.dex())).includes('sheep'));
    }
    await photographFlock(true);

    async function assertGloss(container, entry) {
      const gloss = container.locator('[data-sharon-gloss]');
      assert.equal(await gloss.count(), 1);
      assert.equal(await gloss.getAttribute('data-sharon-gloss'), entry.id);
      assert.equal(await gloss.locator('.q-kicker').innerText(), sharon.glossKicker);
      assert.equal(await gloss.locator('.q-kicker svg').count(), 1);
      const text = await gloss.locator('.sharon-line').textContent();
      assert.equal(text, entry.text[tier]);
      assert(text.endsWith('찾아볼까요?'));
      assert.deepEqual(await gloss.locator('.ref').allTextContents(), entry.refs[tier]);
      assert.equal(await gloss.locator('img.avatar[data-sharon="avatar"]').count(), 1);
      assert.equal(await gloss.locator('button, a').count(), 0, 'verse chips must be static');
    }

    async function passWatching(openReview) {
      for (let beat = 2; beat < scene.beats.length; beat++) {
        await noSharon();
        await noLegacyLabel();
        assert.equal(await panel.locator('.q-kicker').innerText(), '지켜보기 ' + (beat - 1) + ' / ' + (scene.beats.length - 2));
        if (openReview && beat === scene.beats.length - 1) await panelButton(sharon.reviewTitle);
        else await panel.locator('.sheet-foot .btn.onpaper').click();
      }
    }

    async function passReview(pages, takePhotos, skip) {
      await waitState('review');
      const review = p.locator('.overlay3.sharon-review'), title = review.locator('.sharon-review-title');
      const button = name => review.getByRole('button', { name, exact: true });
      assert.equal(await panel.isVisible(), false);
      assert(await review.evaluate(el => {
        const style = getComputedStyle(el);
        const overlay = el.getBoundingClientRect(), game = document.querySelector('#game').getBoundingClientRect();
        return style.backgroundColor.startsWith('rgb(') && style.opacity === '1' &&
          ['x', 'y', 'width', 'height'].every(key => overlay[key] === game[key]);
      }), 'review must cover the whole 3D scene with an opaque background');
      for (const [index, gloss] of pages.entries()) {
        const last = index === pages.length - 1;
        const beat = scene.beats[1 + Number(gloss.at.slice('watch'.length))];
        assert.equal(await title.innerText(), sharon.reviewTitle + ' ' + (index + 1) + ' / ' + pages.length);
        assert.equal(await review.locator('.sharon-watch .ref').innerText(), beat.ref);
        assert.equal(await review.locator('.sharon-watch .narr').textContent(), beat.text[tier]);
        await assertGloss(review, gloss);
        assert.equal(await button('이전').count(), index === 0 ? 0 : 1);
        assert.equal(await button(sharon.skip).count(), 1);
        assert.deepEqual(await review.locator('.sharon-ask-adult').allTextContents(), last ? [sharon.askAdult] : []);
        if (index === 1 && takePhotos) {
          await button('이전').click();
          assert.equal(await title.innerText(), sharon.reviewTitle + ' 1 / ' + pages.length);
          await assertGloss(review, pages[0]);
          await button('다음').click();
          await assertGloss(review, gloss);
        }
        if (takePhotos) {
          if (index === 0) await shot('sharon-review-first');
          if (index === 1 && gloss.refs[tier].length > 1) await shot('sharon-review-refs');
          if (last) await shot('sharon-review-last');
        }
        await button(last ? (skip ? sharon.skip : '다음으로 가는 관문') : '다음').click();
      }
      await waitState('gates');
      assert.equal(await review.count(), 0);
      await noSharon();
    }

    async function solveDetector(index) {
      const item = H.quiz[index], q = item.q[tier];
      await panel.locator('[data-detector-quiz="' + index + '"]').waitFor();
      assert.equal((await st()).state, 'detector');
      await hiddenTracker();
      assert.equal(await p.locator('.hud3 .place').innerText(), index < 2 ? '광야' : scene.place);
      assert.equal(await p.locator('.hud3 .ref').isVisible(), false, 'HUD must not reveal verse hints during quiz');
      assert.equal(await panel.locator('.q-kicker').innerText(), sharon.kicker + ' ' + (index + 1) + ' / 3');
      const bubble = panel.locator('.sharon-say .bubble'), question = panel.locator('.sharon-line');
      const rest = panel.locator('.q-prompt');
      const firstSentence = q.prompt.match(/^.*?[.?](?= )/)?.[0];
      assert.equal(await question.textContent(), firstSentence || q.prompt);
      assert.equal(await rest.count(), firstSentence ? 1 : 0);
      assert.equal([await question.textContent(), ...await rest.allTextContents()].join(' '), q.prompt);
      assert.equal(await panel.locator('img.avatar[data-sharon="ask"]').count(), 1);
      assert.deepEqual(await panel.locator('.opt').allTextContents(), q.options.map(o => o.label));
      if (tier === 't2') assert.equal(await panel.locator('.narr-meta .ref').innerText(), item.ref);
      else {
        assert.equal(await panel.locator('.narr-meta').innerText(), H.bookHint[tier]);
        assert.equal(await panel.locator('.ref').count(), 0, 'no verse before correct answer for t1/t3');
      }
      assert(!(await panel.innerText()).includes('본문에 없음'), 'internal option notes must not be rendered');
      await shot('detector' + (index + 1));
      const bubbleNode = await bubble.elementHandle();
      const bubbleText = await bubble.textContent();
      for (const wrong of q.options.filter(o => !o.ok)) {
        const option = panel.getByRole('button', { name: wrong.label, exact: true });
        await option.click();
        assert(await option.isDisabled());
        assert(await option.evaluate(el => el.classList.contains('rest')));
        assert.equal(await panel.locator('img.avatar[data-sharon="cheer"]').count(), 1);
        assert.equal(await panel.locator('[data-sharon="ask"]').count(), 0);
        assert(await bubble.evaluate((el, original) => el === original, bubbleNode));
        assert.equal(await bubble.textContent(), bubbleText);
        assert.equal(await panel.locator('.note.look').count(), 1);
      }
      if (index === 0) await shot('sharon-retry');
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
      if (index > 0) {
        assert.equal(await panel.locator('.note.good b').innerText(), '성경에 그렇게 기록되어 있어요.');
        assert.equal(await panel.locator('.note.good .ref').innerText(), item.okRef[tier]);
        assert(!(await panel.innerText()).includes('탐험대 이야기'), 'Bible answer and guidance must be separate screens');
        await noSharon();
        await noLegacyLabel();
        await panelButton('다음');
        assert.equal(await panel.locator('.note.good').count(), 0);
        assert.equal(await panel.locator('.q-kicker').innerText(), '탐험대 이야기');
        const found = sharon.found[index];
        assert.equal(await question.textContent(), tier === 't1' && found.t1 ? found.t1 : found.text);
        assert.equal(await panel.locator('img.avatar[data-sharon="joy"]').count(), 1);
        await panelButton('계속 탐험하기');
      }
      await waitState('explore');
      await p.locator('.track3').waitFor({ state: 'visible' });
      if (index === 0) {
        assert.equal(await panel.isVisible(), false);
        assert((await p.locator('.toast3').innerText()).includes(item.okRef[tier]));
        await shot('first-signal');
      }
      const distance = await p.locator('.track3 span').innerText();
      assert(distance.startsWith(sharon.track) && /^\d+m$/.test(distance.slice(sharon.track.length)), distance);
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
        await aim(P.flock[0], P.flock[1]);
        await snap('photo-sheep');
        assert((await p.evaluate(() => BO3D.debug.sheep())) >= 30, 'sheep < 30');
      }
      if (i === 2) {
        if (muteRun) {
          // 소리 끄기 단추를 누른 채로도 압도 장면을 한 번 지나간다 (세 번째 나이 단계).
          await p.locator('.snd3').click();
          assert.equal(await p.locator('.snd3').getAttribute('aria-pressed'), 'true', 'sound button must be pressed for muted run');
        }
        const before = await st();
        await p.evaluate(P => { BO3D.debug.goto(P.bush[0], P.bush[1] + P.witnessRadius + 0.2); BO3D.debug.yaw(Math.PI); BO3D.debug.stick(0, 1); }, P);
        await p.waitForTimeout(900);
        await p.evaluate(() => BO3D.debug.stick(0, 0));
        const edge = await st();
        assert(Math.hypot(edge.x - P.bush[0], edge.z - P.bush[1]) >= P.witnessRadius - 0.1, 'crossed witness boundary');
        await shot('boundary');
        await sampleFrames('언덕 아래');
        await p.evaluate(at => BO3D.debug.goto(at[0], at[1]), [before.x, before.z]);
      }
      await walkTo(H.quiz[i].at[0], H.quiz[i].at[1], 'part' + (i + 1));
      assert.equal((await parts()).found, i + 1, 'part was not collected');
      assert.equal((await st()).state, 'caption');
      await noSharon();
      assert.equal(await p.locator('.toast3 img.avatar').count(), 1, 'part toast uses the player portrait');
      afterLastPart = i === H.quiz.length - 1;
      await shot('part' + (i + 1));
      if (H.quiz[i].beat !== null) {
        assert.equal(await panel.locator('.q-kicker').innerText(), '말씀 조각 ' + (i + 1) + ' / 3');
        assert.equal(await panel.locator('.narr-meta .ref').innerText(), C.scenes['EX-01'].beats[H.quiz[i].beat].ref);
        await panelButton('계속 탐험하기');
        if (i === 0) {
          await assertGloss(panel, pieceGloss);
          if (tier !== 't3') await shot('sharon-piece-gloss');
          await panelButton('계속 탐험하기');
        }
      } else {
        assert.equal(await panel.locator('.q-kicker').innerText(), '탐험대 이야기');
        assert((await panel.innerText()).includes(H.lookUp.text));
        assert((await p.locator('.toast3').innerText()).includes(H.lastPart));
        assert(!(await p.locator('.toast3').innerText()).includes('타임머신에 끼우러 가자.'));
        await panelButton('다음');
      }
    }
    await waitState('event');
    await noSharon();
    let awe = await p.evaluate(() => BO3D.debug.aweState());
    assert.equal(awe.active, true, 'awe scene must start after lookUp');
    assert.equal(awe.step, 0);
    for (const sel of ['.hud3', '.cam3', '.dex3', '.snd3', '.stick']) {
      assert.equal(await p.locator(sel).isVisible(), false, sel + ' must be hidden during awe scene');
    }
    await p.waitForTimeout(1500);
    await shot('look-up');
    await sampleFrames('압도 장면');
    // 소리 (docs/09 5절): 장면 동안 거리 계산을 멈추고, 순서마다 정한 크기를 따른다.
    const a0 = await lv();
    assert(a0, 'audio levels must be readable');
    assert.equal(a0.running, 'running', 'audio context must be running');
    assert.equal(a0.held, true, 'distance-based fire sound must pause during awe scene');
    assert.equal(a0.muted, muteRun, 'mute state must follow the sound button');
    if (muteRun) assert(a0.total <= 0.001, 'muted total must be silent: ' + a0.total);
    else near(a0.total, a0.normal, 0.02, 'total before scene must be normal');

    awe = await p.evaluate(() => BO3D.debug.aweNext());
    assert.equal(awe.step, 1);
    await p.waitForTimeout(700);
    const a1 = await lv();
    near(a1.wind, a0.wind / 2, 0.01, 'step 1 wind must drop to half');
    near(a1.fire, a0.fire / 2, 0.01, 'step 1 fire must drop to half');
    awe = await p.evaluate(() => BO3D.debug.aweNext());
    assert.equal(awe.step, 2);
    await p.waitForTimeout(5400);
    const a2 = await lv();
    assert(a2.fire > a1.fire + 0.02, 'fire at end of step 2 must be louder than at end of step 1: ' + a2.fire + ' vs ' + a1.fire);
    assert(a2.fire <= a2.fireMax + 0.001 && a2.crackle <= a2.crackleMax + 0.001, 'fire must not exceed boundary level: ' + JSON.stringify(a2));
    near(a2.wind, a1.wind, 0.005, 'step 2 wind must stay low');
    awe = await p.evaluate(() => BO3D.debug.aweNext());
    assert.equal(awe.step, 3);
    awe = await p.evaluate(() => BO3D.debug.aweNext());
    assert.equal(awe.step, 4);
    await p.waitForTimeout(600);
    const a4 = await lv();
    assert(a4.total <= a4.normal / 100, 'step 4 total must be at most 1/100 of normal after 0.5s: ' + JSON.stringify(a4));
    for (const k of ['wind', 'fire', 'crackle', 'music']) assert(a4[k] <= 0.001, 'step 4 ' + k + ' must be silent: ' + a4[k]);
    assert.equal(a4.musicOn, false, 'music must not play before step 5');
    assert.equal(awe.ref, H.awe.call.ref);
    assert.equal(awe.text, H.awe.call[tier]);
    assert.equal(await p.locator('.awe-cap .ref').innerText(), H.awe.call.ref);
    assert.equal(await p.locator('.awe-cap .awe-line').innerText(), H.awe.call[tier]);
    await shot('awe-call');

    await p.evaluate(() => BO3D.debug.aweNext('beforeSwap'));
    n++;
    const beforeBuf = await p.screenshot({ path: path.join(tierOut, String(n).padStart(2, '0') + '-awe-before-swap.png') });
    await p.evaluate(() => BO3D.debug.aweNext('afterSwap'));
    n++;
    const afterBuf = await p.screenshot({ path: path.join(tierOut, String(n).padStart(2, '0') + '-awe-after-swap.png') });

    const swapCheck = await p.evaluate(async ([b1, b2]) => {
      const r = BO3D.debug.aweRect();
      const load = src => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.src = src; });
      const im1 = await load('data:image/png;base64,' + b1);
      const im2 = await load('data:image/png;base64,' + b2);
      const dpr = im1.naturalWidth / r.W;
      const xStart = Math.max(0, Math.round(r.left * dpr));
      const xSplit = Math.min(im1.naturalWidth, Math.floor((r.left + r.width * (719 / 1024)) * dpr));
      const xEnd = Math.min(im1.naturalWidth, Math.floor((r.left + r.width) * dpr));
      const yStart = Math.max(0, Math.round(r.top * dpr));
      const yEnd = Math.min(im1.naturalHeight, Math.floor(Math.min(r.top + r.height, r.H - 150) * dpr));
      const c1 = document.createElement('canvas'), c2 = document.createElement('canvas');
      c1.width = c2.width = im1.naturalWidth; c1.height = c2.height = im1.naturalHeight;
      const g1 = c1.getContext('2d'), g2 = c2.getContext('2d');
      g1.drawImage(im1, 0, 0); g2.drawImage(im2, 0, 0);
      const d1 = g1.getImageData(0, 0, c1.width, c1.height).data;
      const d2 = g2.getImageData(0, 0, c2.width, c2.height).data;
      let leftDiff = 0, leftSum = 0, leftCnt = 0, rightDiff = 0;
      for (let y = yStart; y < yEnd; y++) {
        for (let x = xStart; x < xEnd; x++) {
          const o = (y * c1.width + x) * 4;
          const diff = Math.max(Math.abs(d1[o] - d2[o]), Math.abs(d1[o + 1] - d2[o + 1]), Math.abs(d1[o + 2] - d2[o + 2]));
          if (x <= xSplit) {
            leftCnt++;
            leftSum += diff;
            if (diff > 16) leftDiff++;
          } else if (diff > 25) {
            rightDiff++;
          }
        }
      }
      return { leftDiff, avgLeft: leftSum / Math.max(1, leftCnt), rightDiff, xStart, xSplit, xEnd, yStart, yEnd };
    }, [beforeBuf.toString('base64'), afterBuf.toString('base64')]);
    assert.equal(swapCheck.leftDiff, 0, 'image 0..719 region must be identical before and after swap: ' + JSON.stringify(swapCheck));
    assert(swapCheck.avgLeft < 1.5, 'image 0..719 average diff too large: ' + JSON.stringify(swapCheck));
    assert(swapCheck.rightDiff > 1000, 'Moses region must change after swap: ' + JSON.stringify(swapCheck));

    awe = await p.evaluate(() => BO3D.debug.aweNext());
    assert.equal(awe.step, 5);
    assert.equal(awe.ref, H.awe.hide.ref);
    assert.equal(awe.text, H.awe.hide[tier]);
    assert.equal(await p.locator('.awe-cap .ref').innerText(), H.awe.hide.ref);
    assert.equal(await p.locator('.awe-cap .awe-line').innerText(), H.awe.hide[tier]);
    await shot('awe-hide');
    await p.waitForTimeout(400);
    const a5 = await lv();
    assert(Math.abs(a5.music - 0.9) <= 0.05, 'step 5 music must play at watching level: ' + a5.music);
    assert.equal(a5.musicOn, true);
    assert.equal(a5.musicStarts, a4.musicStarts + 1, 'music must start once in step 5');
    for (const k of ['wind', 'fire', 'crackle']) assert(a5[k] <= 0.001, 'step 5 ' + k + ' must be silent: ' + a5[k]);
    if (muteRun) assert(a5.total <= 0.001, 'muted total must stay silent in step 5');
    else near(a5.total, a5.normal, 0.02, 'step 5 total must be back to normal');

    awe = await p.evaluate(() => BO3D.debug.aweNext());
    assert.equal(awe.step, 6);
    awe = await p.evaluate(() => BO3D.debug.aweNext());
    assert.equal(awe.active, false, 'awe scene must finish after step 6');
    assert.equal(await p.locator('.cam3').isVisible(), true, 'camera button must be restored after awe scene');
    await panel.locator('.q-kicker').filter({ hasText: '지켜보기 1 / ' }).waitFor();
    await p.waitForTimeout(900);
    const a6 = await lv();
    assert.equal(a6.musicStarts, a5.musicStarts, 'music must not restart when watching begins');
    assert(a6.music >= a5.music - 0.02, 'music must continue at the same level when watching begins: ' + a6.music + ' vs ' + a5.music);
    assert.equal(a6.held, false, 'distance-based fire sound must resume after awe scene');
    near(a6.wind, a0.wind, 0.01, 'wind must return to normal');
    assert(a6.fire > 0.01, 'fire sound must return after awe scene: ' + a6.fire);
    assert.equal(a6.muted, muteRun, 'mute state must be kept after awe scene');
    if (muteRun) {
      assert(a6.total <= 0.001, 'muted total must stay silent after awe scene');
      assert.equal(await p.locator('.snd3').getAttribute('aria-pressed'), 'true', 'sound button must stay pressed');
    } else near(a6.total, a6.normal, 0.02, 'total must be normal after awe scene');
    console.log(tier, 'awe sound', muteRun ? '(muted)' : '', 'step1 fire', a1.fire.toFixed(3), 'step2 fire', a2.fire.toFixed(3), 'step4 total', a4.total.toFixed(4), 'step5 music', a5.music.toFixed(3), 'starts', a6.musicStarts);
    await snap('photo-event');
    await sampleFrames('지켜보기');
    await passWatching(true);
    afterLastPart = false;
    await passReview(reviewPages, tier !== 't3', false);
    afterLastPart = true;
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
    afterLastPart = false;
    await photographFlock(false);
    await panel.locator('[data-detector-quiz="0"]').waitFor();
    assert.equal((await parts()).found, 0);
    await hiddenTracker();
    if (tier !== 't1') {
      await p.evaluate(() => { BO3D.debug.includeReviewRequiredGloss = false; });
      for (const [index, item] of H.quiz.entries()) {
        await panel.locator('[data-detector-quiz="' + index + '"]').waitFor();
        await panelButton(item.q[tier].options.find(o => o.ok).label);
        if (index > 0) {
          await panelButton('다음');
          await panelButton('계속 탐험하기');
        }
        await waitState('explore');
        await p.evaluate(([x, z]) => BO3D.debug.goto(x, z), item.at);
        await waitState('caption');
        if (index === 2) {
          await noSharon();
          await panelButton('다음');
        } else {
          await panelButton('계속 탐험하기');
          if (index === 0) await panelButton('계속 탐험하기');
        }
      }
      await waitState('event');
      await p.evaluate(() => {
        for (let step = 0; step <= 6; step++) BO3D.debug.aweNext();
      });
      await passWatching(tier === 't2');
      if (tier === 't2') {
        const publicPages = reviewPages.filter(g => !g.review);
        assert.equal(publicPages.length, reviewPages.length - 2);
        await passReview(publicPages, false, true);
      } else {
        await waitState('gates');
        assert.equal(await p.locator('.sharon-review').count(), 0);
      }
    }
    assert.deepEqual(errs, [], 'browser errors');
    const recent = await p.evaluate(() => BO3D.debug.perf());
    assert.equal(recent.samples, 300, '전체 탐험 후에는 최근 300프레임만 남아야 한다');
    assert(recent.maxMs >= recent.meanMs && recent.meanMs > 0);
    assert.equal(await p.locator('.perf3').count(), new URL(url).searchParams.get('perf') === '1' ? 1 : 0);
    assert.equal(performanceRows.length, 5);
    fs.writeFileSync(path.join(tierOut, 'perf.json'), JSON.stringify(performanceRows, null, 2) + '\n');
    console.table(performanceRows.map(row => ({ 구간: row.stage, 평균ms: +row.meanMs.toFixed(1),
      최대ms: +row.maxMs.toFixed(1), 그리기: row.drawCalls })));
    console.log(tier, 'shots:', n, 'all three quizzes and full journey passed; restart resets progress; no errors');
  } finally { await ctx.close(); }
}

(async () => {
  const browser = await chromium.launch({ proxy, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
  try {
    const url = (await gameOrigin(browser)) + '/preview3d.html';
    // 첫 연령은 명시적인 낮은 품질에서 끝까지, 나머지는 기본 주소로 자동 조정까지 조작한다.
    for (const index of [ti].concat([0, 1, 2].filter(i => i !== ti))) {
      const low = index === ti || process.argv[5] === 'low';
      await runTier(browser, index, url + (low ? '?q=low' : ''));
    }
  }
  finally { await browser.close(); }
})().catch(e => { console.error('FAIL', e.stack || e.message); process.exitCode = 1; });
