// D09 성전을 위해 드린 예물 · 성전 예물 빛수첩 놀이 검증 (라이브 HTTP + D08 연결 + 오프라인 dist/david.html)
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

async function noOverflow(page, label) {
  const info = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  assert(info.sw <= info.iw + 1, `${label}: horizontal overflow ${info.sw} > ${info.iw}`);
}

async function run() {
  const srv = await startServer();
  const baseUrl = `http://127.0.0.1:${srv.address().port}/web/david/`;
  const browser = await chromium.launch();
  const errs = [];

  try {
    // 1) 라이브 HTTP 검증 (360x640 세로 + 640x360 가로 + 회전 복원 + 키보드 + 다른 단서 왕복 + 반대 순서 다시 비추기)
    const ctx = await browser.newContext({ viewport: { width: 360, height: 640 } });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push('pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

    await p.goto(baseUrl);
    await p.evaluate(() => document.fonts.ready);
    await p.locator('[data-field-start="D09"]').click();
    const hint = p.getByRole('button', { name: '동료 힌트' });
    const note = p.locator('.field-hint [role="status"]');
    for (const phrase of ['아래 홈', '돌려', '불이 켜지면']) {
      await hint.click();
      assert((await note.innerText()).includes(phrase));
    }
    await p.locator('[data-action="home"]').click();
    await p.locator('[data-field-start="D09-gifts"]').click();
    await p.locator('.gifts-panel[data-field="D09"]').waitFor();
    await noOverflow(p, 'D09 portrait start');
    for (const phrase of ['비추고 싶은 곳', '수첩에 담아', '세 모습을 담으면']) {
      await hint.click();
      assert((await note.innerText()).includes(phrase));
    }
    const lights = p.locator('.gifts-light:visible');
    assert.equal(await lights.count(), 1);

    // 첫 모습 담기 + 같은 모습 중복 방지
    await p.locator('[data-gifts-action="take"]').click();
    assert.deepEqual(await p.evaluate(() => BO_DAVID.debug.state().templeGifts.shots), ['vessels']);
    await p.locator('[data-gifts-action="take"]').click();
    assert.deepEqual(await p.evaluate(() => BO_DAVID.debug.state().templeGifts.shots), ['vessels']);
    await p.screenshot({ path: path.join(shotDir, '성전_예물_빛수첩.png') });

    // 가로 회전 + 새로고침 복원
    await p.setViewportSize({ width: 640, height: 360 });
    await p.reload();
    assert.equal(await p.evaluate(() => BO_DAVID.debug.state().sceneId), 'D09');
    assert.equal(await p.evaluate(() => BO_DAVID.debug.state().step), 'temple-gifts');
    assert.deepEqual(await p.evaluate(() => BO_DAVID.debug.state().templeGifts.shots), ['vessels']);
    await noOverflow(p, 'D09 landscape reload');

    // 키보드 이동 + 핀 탭으로 나머지 2곳 담기
    await p.locator('[data-gifts-pin="vessels"]').focus();
    await p.keyboard.press('ArrowRight');
    assert.equal(await lights.count(), 2);
    await p.locator('[data-gifts-action="take"]').click();
    await p.locator('[data-gifts-pin="materials"]').click();
    assert.equal(await lights.count(), 3);
    await p.locator('[data-gifts-pin="materials"]').click();
    assert.deepEqual(await p.evaluate(() => BO_DAVID.debug.state().templeGifts.shots), ['vessels', 'rejoice', 'materials']);
    await p.locator('.table-question').waitFor({ state: 'visible' });
    assert.equal(await p.locator('.gifts-board.fully-lit').count(), 1);
    assert.equal(await lights.count(), 0);
    await p.screenshot({ path: path.join(shotDir, '성전_예물_세_장면.png') });

    // 다른 단서(시냇가의 돌) 왕복 후 상태 유지
    await p.locator('[data-choice="brook-stones"]').click();
    await p.locator('[data-detour="brook-stones"]').waitFor();
    await p.locator('[data-action="retry-choice"]').click();
    assert.equal(await p.evaluate(() => BO_DAVID.debug.state().step), 'temple-gifts');
    assert.deepEqual(await p.evaluate(() => BO_DAVID.debug.state().templeGifts.shots), ['vessels', 'rejoice', 'materials']);

    // 정답 선택 → 완료 → 일지 그림 확인
    await p.locator('[data-choice="gold-silver"]').click();
    await p.locator('[data-discovery="D09"]').waitFor();
    await p.locator('[data-action="open-journal"]').click();
    assert((await p.locator('.gifts-keepsake summary').innerText()).includes('표지 금과 은 예물'));
    await p.locator('.gifts-keepsake summary').click();
    assert.equal(await p.locator('.gifts-keepsake .gifts-crop').count(), 3);

    // 반대 순서 다시 비추기 확인
    await p.locator('[data-reopen="D09"]').click();
    await p.locator('[data-action="open-gifts"]').click();
    assert.equal(await p.evaluate(() => BO_DAVID.debug.state().templeGifts.dir), 'reverse');
    assert.equal(await p.evaluate(() => BO_DAVID.debug.state().templeGifts.focus), 2);
    for (let i = 0; i < 3; i++) {
      await p.locator('[data-gifts-action="take"]').click();
      if (i < 2) await p.locator('[data-gifts-action="move"]').click();
    }
    await p.locator('[data-choice="gold-silver"]').click();
    await p.locator('[data-action="open-journal"]').click();
    await p.reload();
    assert((await p.locator('.gifts-keepsake summary').innerText()).includes('표지 성전 건축 재료'));
    await ctx.close();

    // 2) D08 우물 길 수첩 완료 뒤 '다음 장면 · 성전 예물 빛수첩' 연결 확인
    const ctxChain = await browser.newContext({ viewport: { width: 360, height: 640 } });
    const pChain = await ctxChain.newPage();
    await pChain.goto(baseUrl + '#well-trail');
    for (let i = 0; i < 3; i++) {
      await pChain.locator('[data-well-action="take"]').click();
      if (i < 2) await pChain.locator('[data-well-action="move"]').click();
    }
    await pChain.locator('[data-choice="well-water"]').click();
    await pChain.locator('[data-action="next-scene"]').click();
    await pChain.locator('.gifts-panel[data-field="D09"]').waitFor();
    assert.equal(await pChain.evaluate(() => BO_DAVID.debug.state().step), 'temple-gifts');
    await ctxChain.close();

    // 3) 해시 진입(#temple-gifts) 및 오프라인 단일 파일(dist/david.html) 복원 + 영상 로드 확인
    assert(fs.existsSync(bundleFile), 'dist/david.html must exist');
    const fileUrl = 'file:///' + bundleFile.replace(/\\/g, '/');
    const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, offline: true });
    const p2 = await ctx2.newPage();
    p2.on('pageerror', e => errs.push('offline pageerror: ' + e.message));
    await p2.goto(fileUrl + '#temple-gifts');
    await p2.locator('.gifts-panel[data-field="D09"]').waitFor();
    await p2.locator('[data-gifts-action="take"]').click();
    const savedRaw = await p2.evaluate(() => localStorage.getItem('bibleOnyou.david.v1'));
    await ctx2.close();

    // 새 컨텍스트에서 오프라인 복원 + 영상 디코딩 확인
    const ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 }, offline: true });
    const p3 = await ctx3.newPage();
    await p3.addInitScript(raw => { localStorage.setItem('bibleOnyou.david.v1', raw); }, savedRaw);
    await p3.goto(fileUrl);
    assert.equal(await p3.evaluate(() => BO_DAVID.debug.state().step), 'temple-gifts');
    assert.deepEqual(await p3.evaluate(() => BO_DAVID.debug.state().templeGifts.shots), ['vessels']);
    await p3.locator('.lookout-film summary').click();
    const vInfo = await p3.evaluate(async () => {
      const v = document.querySelector('.lookout-film video');
      v.load();
      await new Promise((res, rej) => {
        if (v.readyState >= 1) return res();
        v.addEventListener('loadedmetadata', res, { once: true });
        v.addEventListener('error', rej, { once: true });
      });
      return { w: v.videoWidth, h: v.videoHeight, dur: Math.round(v.duration) };
    });
    assert.equal(vInfo.w, 720);
    assert.equal(vInfo.h, 480);
    assert(vInfo.dur >= 8 && vInfo.dur <= 10, 'video duration ~9s: ' + vInfo.dur);
    await ctx3.close();

    assert.equal(errs.length, 0, 'browser errors: ' + errs.join('; '));
    console.log('TEMPLE_GIFTS_ALL_PASSED', JSON.stringify(vInfo));
  } finally {
    await browser.close();
    srv.close();
  }
}

run().catch(e => { console.error(e); process.exit(1); });
