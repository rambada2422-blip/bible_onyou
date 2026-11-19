// 압도 장면 ① 그림판과 두 가지 보기(가까이 보기·전체 보기) 배치 자동 점검.
// 사용: node tools/test/full/awe_layout.js [outDir]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const out = process.argv[2] || path.join(root, 'dist/check/awe_layout');
fs.mkdirSync(out, { recursive: true });

// docs/09_떨기나무_압도장면.md 10절의 식으로 기대 범위를 따로 계산한다
function expectedRect(reqView, vw, vh) {
  const W = Math.min(vw, 560), H = vh;
  const landscape = vw > vh || W > H;
  const view = (reqView === 'near' && !landscape) ? 'near' : 'wide';
  if (view === 'near') {
    const visH = H * 703 / W;
    let y0, y1;
    if (visH <= 1536) {
      y0 = Math.max(0, Math.min(1536 - visH, 681 - visH / 2));
      y1 = y0 + visH;
    } else {
      y0 = 0;
      y1 = 1536;
    }
    return { view, W, H, x0: 0, x1: 703, y0, y1, capY: null };
  }
  const scale = Math.min(W / 1024, (H - 150) / 1300);
  const drawH = 1536 * scale;
  const top = Math.max(0, (H - 150) - drawH);
  const capY = (H - 150 - top) / scale;
  return { view, W, H, x0: 0, x1: 1024, y0: 0, y1: Math.min(1536, capY), capY };
}

(async () => {
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const b = await chromium.launch({
    proxy,
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl']
  });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.addInitScript(() => { window.BO3D_TEST = true; });
  const errs = [];
  let n = 0;
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

  const shot = async (label) => {
    n++;
    await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '-' + label + '.png') });
  };

  await p.goto(require('url').pathToFileURL(path.join(root, 'dist/preview3d.html')).href);
  await p.waitForFunction(() => window.BO3D && BO3D.debug && typeof BO3D.debug.awe === 'function');
  await p.evaluate(() => { BO3D.debug.awe('near', 2); });
  await p.waitForFunction(() => { const r = BO3D.debug.aweRect(); return r && r.ready; }, { timeout: 15000 });

  const sizes = [
    [390, 844],
    [390, 664],
    [360, 560],
    [844, 390]
  ];

  for (const [vw, vh] of sizes) {
    await p.setViewportSize({ width: vw, height: vh });
    await p.waitForTimeout(150);

    const cases = (vw === 390 && vh === 844)
      ? [['near', 2], ['wide', 2], ['wide', 3]]
      : [['near', 2], ['wide', 2]];

    for (const [reqView, pic] of cases) {
      await p.evaluate(([v, k]) => BO3D.debug.awe(v, k), [reqView, pic]);
      await p.waitForTimeout(100);
      const r = await p.evaluate(() => BO3D.debug.aweRect());
      if (!r) throw new Error(`aweRect returned null at ${vw}x${vh} ${reqView}`);

      const exp = expectedRect(reqView, vw, vh);
      if (r.view !== exp.view) {
        throw new Error(`${vw}x${vh} ${reqView}: expected view=${exp.view}, got ${r.view}`);
      }
      if (vw > vh && reqView === 'near' && r.view !== 'wide') {
        throw new Error(`landscape ${vw}x${vh} must not show near view`);
      }

      for (const k of ['x0', 'x1', 'y0', 'y1']) {
        if (Math.abs(r[k] - exp[k]) > 1) {
          throw new Error(`${vw}x${vh} ${reqView} ${k} mismatch: got ${r[k]}, expected ${exp[k]}`);
        }
      }

      if (r.view === 'near') {
        if (r.x1 > 703 + 1e-6) {
          throw new Error(`${vw}x${vh} near x1 > 703: ${r.x1}`);
        }
      } else {
        if (Math.abs(r.capY - exp.capY) > 1) {
          throw new Error(`${vw}x${vh} wide capY mismatch: got ${r.capY}, expected ${exp.capY}`);
        }
        if (r.capY < 1300 - 1 || r.y1 < 1300 - 1) {
          throw new Error(`${vw}x${vh} wide caption top above 1300: capY=${r.capY}, y1=${r.y1}`);
        }
      }

      await shot(`${vw}x${vh}-${reqView}-p${pic}`);
      console.log(`${vw}x${vh} ${reqView}(->${r.view}) p${pic}: x=${r.x0.toFixed(1)}..${r.x1.toFixed(1)} y=${r.y0.toFixed(1)}..${r.y1.toFixed(1)}` + (r.capY !== null ? ` capY=${r.capY.toFixed(1)}` : ''));
    }
  }

  await p.evaluate(() => BO3D.debug.awe('off'));
  if (errs.length) throw new Error(errs.join('; '));
  console.log('awe_layout shots:', n, 'no errors');
  await b.close();
})().catch((e) => {
  console.error('FAIL', e.message);
  process.exit(1);
});
