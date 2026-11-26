// D08 베들레헴 성문 곁 우물 · 길 수첩 놀이 검증 (라이브 HTTP + 오프라인 dist/david.html)
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
    // 1) 라이브 HTTP 검증 (360x640 세로 + 640x360 가로 + 회전 복원 + 키보드 + 다른 단서 왕복 + 반대 방향 다시 담기)
    const ctx = await browser.newContext({ viewport: { width: 360, height: 640 } });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push('pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

    await p.goto(baseUrl);
    await p.evaluate(() => document.fonts.ready);
    await p.locator('[data-field-start="D08"]').click();
    await p.locator('[data-field="D08"]').waitFor();
    await noOverflow(p, 'D08 portrait start');

    // 단추로 첫 지점 담기 + 같은 지점 중복 방지
    await p.getByText('단추로 지점 고르기', { exact: true }).click();
    await p.locator('[data-well-action="take"]').click();
    assert.deepEqual(await p.evaluate(() => BO_DAVID.debug.state().wellTrail.shots), ['well']);
    await p.locator('[data-well-action="take"]').click();
    assert.deepEqual(await p.evaluate(() => BO_DAVID.debug.state().wellTrail.shots), ['well']);
    await p.screenshot({ path: path.join(shotDir, '우물_길_수첩.png') });

    // 가로 회전 + 새로고침 복원
    await p.setViewportSize({ width: 640, height: 360 });
    await p.reload();
    assert.equal(await p.evaluate(() => BO_DAVID.debug.state().sceneId), 'D08');
    assert.equal(await p.evaluate(() => BO_DAVID.debug.state().step), 'well-trail');
    assert.deepEqual(await p.evaluate(() => BO_DAVID.debug.state().wellTrail.shots), ['well']);
    await noOverflow(p, 'D08 landscape reload');

    // 키보드 이동 + 핀 탭으로 나머지 2곳 담기
    await p.locator('[data-well-pin="well"]').focus();
    await p.keyboard.press('ArrowRight');
    await p.keyboard.press('Enter');
    await p.locator('[data-well-pin="cave"]').click();
    const line = p.locator('.well-board .trail-ink');
    const route = await line.getAttribute('d');
    assert.equal(route.split('Q').length - 1, 2);
    assert.deepEqual(await p.evaluate(() => BO_DAVID.debug.state().wellTrail.shots), ['well', 'path', 'cave']);
    await p.locator('.table-question').waitFor({ state: 'visible' });
    await p.screenshot({ path: path.join(shotDir, '우물_길_세_장면.png') });

    // 다른 단서(시냇가의 돌) 왕복 후 상태 유지
    await p.locator('[data-choice="brook-stones"]').click();
    await p.locator('[data-detour="brook-stones"]').waitFor();
    await p.locator('[data-action="retry-choice"]').click();
    assert.equal(await p.evaluate(() => BO_DAVID.debug.state().step), 'well-trail');
    assert.deepEqual(await p.evaluate(() => BO_DAVID.debug.state().wellTrail.shots), ['well', 'path', 'cave']);

    // 정답 선택 → 완료 → 일지 그림 확인
    await p.locator('[data-choice="well-water"]').click();
    await p.locator('[data-discovery="D08"]').waitFor();
    await p.locator('[data-action="open-journal"]').click();
    await p.locator('.well-keepsake summary').click();
    assert.equal(await p.locator('.well-keepsake .well-crop').count(), 3);
    assert.equal(await p.locator('.well-keepsake .trail-ink').getAttribute('d'), route);

    // 반대 방향 다시 담기 확인
    await p.locator('[data-reopen="D08"]').click();
    await p.locator('[data-action="open-well"]').click();
    assert.equal(await p.evaluate(() => BO_DAVID.debug.state().wellTrail.dir), 'reverse');
    assert.equal(await p.evaluate(() => BO_DAVID.debug.state().wellTrail.focus), 2);
    await p.locator('[data-well-pin="path"]').focus();
    await p.keyboard.press('ArrowRight');
    assert.equal(await p.locator('[data-well-pin]:focus').getAttribute('data-well-pin'), 'cave');
    await ctx.close();

    // 2) 해시 진입(#well-trail) 및 오프라인 단일 파일(dist/david.html) 복원 + 영상 로드 확인
    assert(fs.existsSync(bundleFile), 'dist/david.html must exist');
    const fileUrl = 'file:///' + bundleFile.replace(/\\/g, '/');
    const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, offline: true });
    const p2 = await ctx2.newPage();
    p2.on('pageerror', e => errs.push('offline pageerror: ' + e.message));
    await p2.goto(fileUrl + '#well-trail');
    await p2.locator('[data-field="D08"]').waitFor();
    await p2.locator('[data-well-pin="cave"]').click();
    await p2.locator('[data-well-pin="well"]').click();
    const savedLine = await p2.locator('.well-board .trail-ink').getAttribute('d');
    const savedRaw = await p2.evaluate(() => localStorage.getItem('bibleOnyou.david.v1'));
    await ctx2.close();

    // 새 컨텍스트에서 오프라인 복원 + 영상 디코딩 확인
    const ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 }, offline: true });
    const p3 = await ctx3.newPage();
    await p3.addInitScript(raw => { localStorage.setItem('bibleOnyou.david.v1', raw); }, savedRaw);
    await p3.goto(fileUrl);
    assert.equal(await p3.evaluate(() => BO_DAVID.debug.state().step), 'well-trail');
    assert.deepEqual(await p3.evaluate(() => BO_DAVID.debug.state().wellTrail.shots), ['cave', 'well']);
    assert.equal(await p3.locator('.well-board .trail-ink').getAttribute('d'), savedLine);
    await p3.locator('[data-well-pin="path"]').click();
    assert.deepEqual(await p3.evaluate(() => BO_DAVID.debug.state().wellTrail.shots), ['cave', 'well', 'path']);
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
    console.log('WELL_TRAIL_ALL_PASSED', JSON.stringify(vInfo));
  } finally {
    await browser.close();
    srv.close();
  }
}

run().catch(e => { console.error(e); process.exit(1); });
