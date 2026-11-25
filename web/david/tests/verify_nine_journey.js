// 다윗 아홉 장면 이어하기 검증 (D01→D02 카메라→D03 퍼즐~D09→탐험 일지 연속 완주, 떠난 자리 복원, 9/9 일지 보존, 건너뛰기 분리, 3장면 코스, 오프라인 dist/david.html)
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '../../..');
const shotDir = path.join(root, 'docs/인계/사진/다윗');
const bundleFile = path.join(root, 'dist/david.html');

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.svg': 'image/svg+xml'
};

function startServer() {
  const srv = http.createServer((req, res) => {
    let u = req.url.split('?')[0];
    if (u.endsWith('/')) u += 'index.html';
    const fp = path.join(root, u);
    if (!fs.existsSync(fp)) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(fp)] || 'application/octet-stream' });
    fs.createReadStream(fp).pipe(res);
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r(srv)));
}

async function run() {
  const srv = await startServer();
  const baseUrl = `http://127.0.0.1:${srv.address().port}/web/david/`;
  const browser = await chromium.launch();
  const errs = [];

  try {
    // 1) 건너뛰어 체험한 사람의 일지 개수를 연속 여정 위치로 간주하지 않는지 검증
    const ctxSkip = await browser.newContext({ viewport: { width: 360, height: 640 } });
    const pSkip = await ctxSkip.newPage();
    pSkip.on('pageerror', e => errs.push('skip pageerror: ' + e.message));
    await pSkip.goto(baseUrl);
    await pSkip.locator('[data-field-start="D04"]').click();
    for (let s = 0; s < 2; s++) {
      for (let b = 0; b < 3; b++) await pSkip.locator(`[data-rub-band="${b}"]`).click();
      if (s === 0) await pSkip.locator('[data-action="next-rubbing"]').click();
    }
    await pSkip.locator('[data-choice="saul-hem"]').click();
    await pSkip.locator('[data-action="home"]').click();
    await pSkip.locator('[data-field-start="D07"]').click();
    for (let i = 0; i < 3; i++) {
      await pSkip.locator('[data-table-action="move"]').click();
      await pSkip.locator('[data-table-action="take"]').click();
    }
    await pSkip.locator('[data-choice="mephibosheth"]').click();
    await pSkip.locator('[data-action="home"]').click();
    assert.equal(await pSkip.evaluate(() => Object.keys(BO_DAVID.debug.state().journal).length), 2);
    assert.equal(await pSkip.locator('[data-journey-box]').getAttribute('data-journey-active'), 'false');
    assert.equal(await pSkip.locator('[data-journey-box]').getAttribute('data-journey-current'), 'none');
    await ctxSkip.close();

    // 2) 첫 화면에서 시작해 목록에서 장면을 다시 고르지 않고 D01~D09 연속 완주 + 중간 떠난 자리 복원
    const ctx = await browser.newContext({ viewport: { width: 360, height: 640 } });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push('main pageerror: ' + e.message));
    await p.goto(baseUrl);
    await p.evaluate(() => document.fonts.ready);

    // 첫 화면에서 아홉 장면 시작 -> D01 들판 망원경
    await p.locator('[data-action="journey-start"]').click();
    await p.locator('.meadow-panel[data-field="D01"]').waitFor();
    const lens = p.locator('.meadow-lens');
    await lens.focus();
    for (const k of ['Space', 'Home', 'Space', 'End', 'Space']) await lens.press(k);
    await p.locator('[data-choice="horn"]').click();
    await p.locator('[data-discovery="D01"]').waitFor();

    // D01 완료 -> 다음 장면 -> D02 카메라 진입 및 9초 영상 확인
    await p.locator('[data-action="next-scene"]').click();
    await p.locator('.brook-camera').waitFor();
    assert.equal(await p.evaluate(() => BO_DAVID.debug.state().sceneId), 'D02');
    assert.equal(await p.evaluate(() => BO_DAVID.debug.state().step), 'stones');
    await p.locator('details[data-d02-film="true"] summary').click();
    const d02Vid = await p.evaluate(async () => {
      const v = document.querySelector('details[data-d02-film="true"] video');
      v.load();
      await new Promise((res, rej) => {
        if (v.readyState >= 1) return res();
        v.addEventListener('loadedmetadata', res, { once: true });
        v.addEventListener('error', () => rej(new Error('D02 video load error')), { once: true });
      });
      return { w: v.videoWidth, h: v.videoHeight, d: v.duration, muted: v.muted };
    });
    assert.equal(d02Vid.w, 720);
    assert.equal(d02Vid.h, 480);
    assert(d02Vid.d >= 8.5 && d02Vid.d <= 9.5, 'D02 영상 길이 확인');
    assert.equal(d02Vid.muted, true);
    await p.locator('details[data-d02-film="true"] summary').click();

    // D02 중간 조작(사진 1장 + 돌 2개) 후 첫 화면으로 나가 떠난 자리 확인 및 이어하기 복원
    await p.locator('[data-action="d02-shutter"]').click();
    for (let i = 0; i < 2; i++) {
      await p.locator('[data-spot-kind="stone"][aria-pressed="false"]').first().click();
    }
    assert.equal(await p.evaluate(() => BO_DAVID.debug.state().stonesFound.length), 2);
    await p.locator('[data-action="home"]').click();
    assert.equal(await p.locator('[data-journey-box]').getAttribute('data-journey-current'), 'D02');
    assert.equal(await p.locator('[data-journey-pill="D01"]').getAttribute('data-journey-state'), 'done');
    assert.equal(await p.locator('[data-journey-pill="D02"]').getAttribute('data-journey-state'), 'current');
    assert.equal(await p.locator('[data-scene="D02"]').getAttribute('data-journey-here'), 'true');
    await p.screenshot({ path: path.join(shotDir, '아홉장면_이어하기.png') });

    await p.locator('[data-action="journey-resume"]').click();
    await p.reload();
    assert.equal(await p.evaluate(() => BO_DAVID.debug.state().sceneId), 'D02');
    assert.equal(await p.evaluate(() => BO_DAVID.debug.state().step), 'stones');
    assert.equal(await p.evaluate(() => BO_DAVID.debug.state().d02Camera.photos.length), 1);
    assert.equal(await p.evaluate(() => BO_DAVID.debug.state().stonesFound.length), 2);
    for (let i = 0; i < 3; i++) {
      await p.locator('[data-spot-kind="stone"][aria-pressed="false"]').first().click();
    }
    await p.locator('[data-discovery="D02"]').waitFor();

    // D02 완료 -> 다음 장면 -> D03 겉옷 퍼즐 진입 확인
    await p.locator('[data-action="next-scene"]').click();
    await p.locator('.robe-panel[data-field="D03"]').waitFor();
    for (const idx of [1, 2, 2, 3, 3, 3]) {
      await p.locator(`[data-robe-piece="${idx}"]`).click();
    }
    await p.locator('[data-choice="self-robe"]').click();
    await p.locator('[data-d03-entry="gift"]').click();
    await p.locator('[data-order-id="farewell"]').click();
    await p.locator('[data-action="check-order"]').click();
    await p.locator('[data-discovery="D03"]').waitFor();

    // D03 완료 -> 다음 장면 -> D04 엔게디 탁본
    await p.locator('[data-action="next-scene"]').click();
    await p.locator('.rub-panel[data-field="D04"]').waitFor();
    for (let s = 0; s < 2; s++) {
      for (let b = 0; b < 3; b++) await p.locator(`[data-rub-band="${b}"]`).click();
      if (s === 0) await p.locator('[data-action="next-rubbing"]').click();
    }
    await p.locator('[data-choice="saul-hem"]').click();
    await p.locator('[data-discovery="D04"]').waitFor();

    // D04 완료 -> 다음 장면 -> D05 헤브론 기억 카드 (중간 새로고침 포함)
    await p.locator('[data-action="next-scene"]').click();
    await p.locator('.hm-panel[data-field="D05"]').waitFor();
    await p.locator('[data-kind="picture"]').nth(0).click();
    await p.locator('[data-kind="clue"]').nth(1).click();
    await p.reload();
    assert.deepEqual(await p.evaluate(() => BO_DAVID.debug.state().hebronCards.found), ['town']);
    await p.locator('[data-kind="picture"]').nth(1).click();
    await p.locator('[data-kind="clue"]').nth(2).click();
    await p.locator('[data-kind="picture"]').nth(2).click();
    await p.locator('[data-kind="clue"]').nth(0).click();
    await p.locator('[data-choice="judah"]').click();
    await p.locator('[data-choice="israel-elders-next"]').click();
    await p.locator('[data-discovery="D05"]').waitFor();

    // D05 완료 -> 다음 장면 -> D06 행렬 두 자리 관찰
    await p.locator('[data-action="next-scene"]').click();
    await p.locator('.field-panel[data-field="D06"]').waitFor();
    await p.locator('[data-field-action="trace"]').click();
    await p.locator('[data-field-action="side-1"]').click();
    await p.locator('[data-field-action="trace"]').click();
    const slider = p.locator('.field-overlay input');
    await slider.press('Home');
    for (let i = 0; i < 5; i++) await slider.press('PageUp');
    await p.locator('[data-field-action="keep-views"]').click();
    await p.locator('[data-discovery="D06"]').waitFor();

    // D06 완료 -> 다음 장면 -> D07 왕의 식탁 돋보기
    await p.locator('[data-action="next-scene"]').click();
    await p.locator('.table-panel[data-field="D07"]').waitFor();
    for (let i = 0; i < 3; i++) {
      await p.locator('[data-table-action="move"]').click();
      await p.locator('[data-table-action="take"]').click();
    }
    await p.locator('[data-choice="mephibosheth"]').click();
    await p.locator('[data-discovery="D07"]').waitFor();

    // D07 완료 -> 다음 장면 -> D08 우물 길 수첩
    await p.locator('[data-action="next-scene"]').click();
    await p.locator('.well-panel[data-field="D08"]').waitFor();
    for (let i = 0; i < 3; i++) {
      await p.locator('[data-well-action="take"]').click();
      if (i < 2) await p.locator('[data-well-action="move"]').click();
    }
    await p.locator('[data-choice="well-water"]').click();
    await p.locator('[data-discovery="D08"]').waitFor();

    // D08 완료 -> 다음 장면 -> D09 성전 예물 빛수첩
    await p.locator('[data-action="next-scene"]').click();
    await p.locator('.gifts-panel[data-field="D09"]').waitFor();
    for (let i = 0; i < 3; i++) {
      await p.locator('[data-gifts-action="take"]').click();
      if (i < 2) await p.locator('[data-gifts-action="move"]').click();
    }
    await p.locator('[data-choice="gold-silver"]').click();
    await p.locator('[data-discovery="D09"]').waitFor();

    // 마지막 D09에서 완료 단추를 누르면 모은 탐험 일지(9/9)를 연다
    await p.locator('[data-action="next-scene"]').click();
    assert.equal(await p.evaluate(() => BO_DAVID.debug.state().view), 'journal');
    assert.equal(await p.locator('[data-journal-id]').count(), 9);
    await p.screenshot({ path: path.join(shotDir, '아홉장면_완주_일지.png') });

    // 3) 기존 9/9 일지가 있는 저장본에서 새 여정을 시작해도 모아 둔 일지를 보존하는지 확인
    await p.locator('[data-action="home"]').click();
    assert.equal(await p.locator('[data-journey-box]').getAttribute('data-journey-active'), 'false');
    await p.locator('[data-action="journey-start"]').click();
    assert.equal(await p.evaluate(() => Object.keys(BO_DAVID.debug.state().journal).length), 9);
    assert.equal(await p.evaluate(() => BO_DAVID.debug.state().sceneId), 'D01');
    assert.equal(await p.evaluate(() => BO_DAVID.debug.state().step), 'pasture');
    assert.deepEqual(await p.evaluate(() => BO_DAVID.debug.state().journey.completed), []);
    await p.locator('.meadow-lens').focus();
    await p.locator('.meadow-lens').press('Space');
    await p.locator('[data-action="home"]').click();
    assert.equal(await p.evaluate(() => Object.keys(BO_DAVID.debug.state().journal).length), 9);
    assert.equal(await p.locator('[data-journey-box]').getAttribute('data-journey-current'), 'D01');
    await p.locator('[data-action="journey-resume"]').click();
    assert.equal(await p.evaluate(() => BO_DAVID.debug.state().pasture.seen.length), 1);

    // 4) 기존 세 장면 선택 코스도 독립적으로 동작하는지 확인
    await p.locator('[data-action="home"]').click();
    await p.locator('[data-course-pick="D01"]').click();
    await p.locator('[data-course-pick="D04"]').click();
    await p.locator('[data-course-pick="D07"]').click();
    await p.locator('[data-action="course-start"]').click();
    assert.equal(await p.evaluate(() => BO_DAVID.debug.state().sceneId), 'D01');
    await p.locator('[data-choice="horn"]').click();
    await p.locator('[data-action="course-next"]').click();
    assert.equal(await p.evaluate(() => BO_DAVID.debug.state().sceneId), 'D04');
    await ctx.close();

    // 5) 오프라인 단일 HTML(dist/david.html) 브라우저 종료·재시작 시 여정 위치 및 그림 놀이 조작 상태 복원
    assert(fs.existsSync(bundleFile), 'dist/david.html must exist');
    const fileUrl = 'file:///' + bundleFile.replace(/\\/g, '/');
    const ctxOff1 = await browser.newContext({ viewport: { width: 360, height: 640 }, offline: true });
    const pOff1 = await ctxOff1.newPage();
    pOff1.on('pageerror', e => errs.push('offline1 pageerror: ' + e.message));
    await pOff1.goto(fileUrl);
    await pOff1.locator('[data-action="journey-start"]').click();
    await pOff1.locator('.meadow-lens').focus();
    for (const k of ['Space', 'Home', 'Space', 'End', 'Space']) await pOff1.locator('.meadow-lens').press(k);
    await pOff1.locator('[data-choice="horn"]').click();
    await pOff1.locator('[data-action="next-scene"]').click();
    await pOff1.locator('[data-action="d02-shutter"]').click();
    await pOff1.locator('[data-spot-kind="stone"][aria-pressed="false"]').first().click();
    await pOff1.locator('[data-action="home"]').click();
    const savedRaw = await pOff1.evaluate(() => localStorage.getItem('bibleOnyou.david.v1'));
    await ctxOff1.close();

    const ctxOff2 = await browser.newContext({ viewport: { width: 360, height: 640 }, offline: true });
    const pOff2 = await ctxOff2.newPage();
    pOff2.on('pageerror', e => errs.push('offline2 pageerror: ' + e.message));
    await pOff2.addInitScript(raw => { localStorage.setItem('bibleOnyou.david.v1', raw); }, savedRaw);
    await pOff2.goto(fileUrl);
    assert.equal(await pOff2.locator('[data-journey-box]').getAttribute('data-journey-current'), 'D02');
    await pOff2.locator('[data-action="journey-resume"]').click();
    assert.equal(await pOff2.evaluate(() => BO_DAVID.debug.state().sceneId), 'D02');
    assert.equal(await pOff2.evaluate(() => BO_DAVID.debug.state().step), 'stones');
    assert.equal(await pOff2.evaluate(() => BO_DAVID.debug.state().d02Camera.photos.length), 1);
    assert.equal(await pOff2.evaluate(() => BO_DAVID.debug.state().stonesFound.length), 1);
    await ctxOff2.close();

    assert.equal(errs.length, 0, 'browser errors: ' + errs.join('; '));
    console.log('NINE_SCENES_JOURNEY_ALL_PASSED');
  } finally {
    await browser.close();
    srv.close();
  }
}

run().catch(e => { console.error(e); process.exit(1); });
