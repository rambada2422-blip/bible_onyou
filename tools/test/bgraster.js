// 사진형 배경 그림(JPG·PNG) 묶기 및 화면 표시 자동 점검. 사용: node tools/test/bgraster.js [outDir]
const { chromium } = require('playwright');
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const bgDir = path.join(root, 'web/assets/bg');
const artPath = path.join(root, 'web/js/art.js');
const out = process.argv[2] || path.join(root, 'dist/check/bgraster');
fs.mkdirSync(out, { recursive: true });

const tempFiles = [
  'zztest.jpg',
  'zztest.png',
  'ex01.jpg',
  'zztest1.jpg',
  'zztest2.jpg',
  'zztest3.jpg',
  'zztest4.jpg',
  'zztest5.jpg',
  'zztest6.jpg'
].map((f) => path.join(bgDir, f));

function runBuild() {
  return spawnSync('node', ['tools/build.js'], { cwd: root, encoding: 'utf8', timeout: 60000 });
}

function cleanTemps() {
  for (const f of tempFiles) fs.rmSync(f, { force: true });
}

function padJpg(buf, targetBytes) {
  if (buf.length >= targetBytes) return buf;
  return Buffer.concat([buf, Buffer.alloc(targetBytes - buf.length, 0)]);
}

(async () => {
  const origArt = fs.readFileSync(artPath, 'utf8');
  let b = null;
  try {
    cleanTemps();
    const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
    b = await chromium.launch({ proxy });

    // 1. 900x1200 시험용 JPG 생성 (네 귀퉁이와 한가운데에 서로 다른 색 표시)
    const genCtx = await b.newContext({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 1 });
    const genPage = await genCtx.newPage();
    await genPage.setContent([
      '<!doctype html><html><head><style>',
      'html,body{margin:0;padding:0;width:900px;height:1200px;background:#F3E6C8;position:relative;overflow:hidden}',
      '.box{position:absolute;width:180px;height:180px}',
      '.tl{left:0;top:0;background:#D94E34}',
      '.tr{right:0;top:0;background:#2F9C95}',
      '.bl{left:0;bottom:0;background:#4E5FB0}',
      '.br{right:0;bottom:0;background:#6F8448}',
      '.ct{left:360px;top:510px;background:#DC2828}',
      '</style></head><body>',
      '<div class="box tl"></div><div class="box tr"></div>',
      '<div class="box bl"></div><div class="box br"></div>',
      '<div class="box ct"></div>',
      '</body></html>'
    ].join(''));
    const zzJpg = path.join(bgDir, 'zztest.jpg');
    const validJpgBuf = await genPage.screenshot({ path: zzJpg, type: 'jpeg', quality: 85 });

    // 2. 정상 묶기 및 390x520 화면 표시 확인
    const okBuild = runBuild();
    if (okBuild.status !== 0) throw new Error('valid build failed: ' + (okBuild.stderr || okBuild.stdout));

    const viewCtx = await b.newContext({ viewport: { width: 390, height: 520 }, deviceScaleFactor: 2 });
    const viewPage = await viewCtx.newPage();
    const artCode = fs.readFileSync(artPath, 'utf8');
    await viewPage.setContent([
      '<!doctype html><html><head><style>',
      'html,body{margin:0;padding:0;width:390px;height:520px;overflow:hidden;background:#000}',
      '#stage{width:390px;height:520px}',
      '#stage svg{width:100%;height:100%;display:block}',
      '</style></head><body><div id="stage"></div>',
      '<script>' + artCode + '</script>',
      '<script>document.getElementById("stage").innerHTML = BO.art.zztest || "";</script>',
      '</body></html>'
    ].join(''));

    const shotPath = path.join(out, '01-bgraster.png');
    const shotBuf = await viewPage.screenshot({ path: shotPath });
    const shotB64 = 'data:image/png;base64,' + shotBuf.toString('base64');

    const checkRender = await viewPage.evaluate(async (snapUri) => {
      const g = document.getElementById('zztest-state-main');
      const imgEl = g && g.querySelector('image');
      if (!imgEl) return { ok: false, reason: 'missing image element' };
      const href = imgEl.getAttribute('href') || '';
      const loadImg = (src) => new Promise((resolve) => {
        const im = new Image();
        im.onload = () => resolve({ w: im.naturalWidth, h: im.naturalHeight, im });
        im.onerror = () => resolve({ w: 0, h: 0, im: null });
        im.src = src;
      });
      const loaded = await loadImg(href);
      const snap = await loadImg(snapUri);
      const rect = imgEl.getBoundingClientRect();
      if (!loaded.im || loaded.w <= 0 || rect.width <= 0 || !snap.im) {
        return { ok: false, reason: 'width <= 0', naturalWidth: loaded.w, rectWidth: rect.width };
      }
      const c = document.createElement('canvas');
      c.width = snap.w; c.height = snap.h;
      const ctx = c.getContext('2d');
      ctx.drawImage(snap.im, 0, 0);
      const px = (x, y) => Array.from(ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data);
      return {
        ok: true,
        naturalWidth: loaded.w,
        naturalHeight: loaded.h,
        rectWidth: rect.width,
        rectHeight: rect.height,
        center: px(snap.w / 2, snap.h / 2),
        tl: px(snap.w * 0.05, snap.h * 0.05),
        tr: px(snap.w * 0.95, snap.h * 0.05),
        bl: px(snap.w * 0.05, snap.h * 0.95),
        br: px(snap.w * 0.95, snap.h * 0.95)
      };
    }, shotB64);

    if (!checkRender.ok) throw new Error('render check failed: ' + JSON.stringify(checkRender));
    const [cr, cg, cb] = checkRender.center;
    if (!(cr > 180 && cg < 80 && cb < 80)) {
      throw new Error('center color mismatch: ' + JSON.stringify(checkRender.center));
    }

    // 3. 실패 조건 4가지 확인
    // (가) 같은 키의 .svg와 사진형 파일이 함께 있거나 .jpg와 .png가 함께 있음
    fs.writeFileSync(path.join(bgDir, 'ex01.jpg'), validJpgBuf);
    const dupSvg = runBuild();
    fs.rmSync(path.join(bgDir, 'ex01.jpg'), { force: true });
    if (dupSvg.status === 0) throw new Error('expected build failure for same key .svg + .jpg');

    await genPage.screenshot({ path: path.join(bgDir, 'zztest.png'), type: 'png' });
    const dupPng = runBuild();
    fs.rmSync(path.join(bgDir, 'zztest.png'), { force: true });
    if (dupPng.status === 0) throw new Error('expected build failure for same key .jpg + .png');

    // (나) 사진형 파일 하나가 300KB를 넘음
    fs.writeFileSync(zzJpg, padJpg(validJpgBuf, 305 * 1024));
    const over300 = runBuild();
    if (over300.status === 0) throw new Error('expected build failure for single file > 300KB');

    // (다) 사진형 파일 크기가 가로 900 x 세로 1200 픽셀이 아님
    await genPage.setViewportSize({ width: 800, height: 1200 });
    await genPage.screenshot({ path: zzJpg, type: 'jpeg', quality: 80 });
    const badSize = runBuild();
    if (badSize.status === 0) throw new Error('expected build failure for wrong image dimensions');

    // (라) 사진형 파일을 모두 합쳐 1.5MB를 넘음 (한 파일은 280KB <= 300KB, 6개 합계 1680KB > 1.5MB)
    fs.rmSync(zzJpg, { force: true });
    const chunk280 = padJpg(validJpgBuf, 280 * 1024);
    for (let i = 1; i <= 6; i++) fs.writeFileSync(path.join(bgDir, 'zztest' + i + '.jpg'), chunk280);
    const overTotal = runBuild();
    for (let i = 1; i <= 6; i++) fs.rmSync(path.join(bgDir, 'zztest' + i + '.jpg'), { force: true });
    if (overTotal.status === 0) throw new Error('expected build failure for total raster size > 1.5MB');

    // 4. 정리 후 원래대로 묶기
    cleanTemps();
    const restore = runBuild();
    if (restore.status !== 0) throw new Error('restore build failed: ' + (restore.stderr || restore.stdout));
    const restoredArt = fs.readFileSync(artPath, 'utf8');
    if (restoredArt !== origArt) throw new Error('art.js differs from original after cleanup');

    console.log('bgraster width:', checkRender.naturalWidth, 'center:', checkRender.center.join(','), 'no errors');
  } finally {
    cleanTemps();
    runBuild();
    if (b) await b.close();
  }
})().catch((e) => {
  console.error('FAIL', e.message);
  process.exit(1);
});
