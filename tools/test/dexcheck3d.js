// 도감 사진 대상 점검(polish 갈래 "사진 찍기 좋은 자리"). 사용: node tools/test/dexcheck3d.js [--file 미리보기] [장면들...]
// 사진기를 쓰는 때는 탐험(첫 상태)과 지켜보기를 마친 뒤(마지막 대목의 상태)다. 두 때에 도감 대상마다
// ① 자리 둘레(2m 안)에 보이는 물체가 있는지 ② 걸을 수 있는 곳에서 사진 거리(range) 안에 드는지 본다. 땅·하늘·바다처럼 아주 큰 것은 물체로 치지 않는다.
const { chromium } = require('playwright');
const path = require('path');
const enter3d = require('./lib/enter.js');
const argv = process.argv.slice(2), ids = []; let file = path.join(__dirname, '../../dist/preview3d.html');
for (let i = 0; i < argv.length; i++) { if (argv[i] === '--file') file = path.resolve(argv[++i]); else ids.push(argv[i]); }
if (!ids.length) ids.push('OT-18', 'OT-11', 'OT-26', 'OT-19', 'OT-30', 'OT-03', 'OT-13', 'OT-05', 'OT-21', 'OT-36', 'OT-39');
const probe = () => {
  const D = BO3D.debug, T = THREE, sc = D.three().scene, st = D.state(), meshes = [];
  sc.traverse((o) => { if (!o.isMesh && !o.isPoints) return; for (let a = o; a; a = a.parent) if (!a.visible) return; if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); meshes.push(o); });
  const c = new T.Vector3(), sp = new T.Sphere();
  return D.dexTargets().map((t) => {
    const P = new T.Vector3(t.p[0], t.p[1], t.p[2]); let near = 1e9, what = '';
    meshes.forEach((m) => { sp.copy(m.geometry.boundingSphere).applyMatrix4(m.matrixWorld); if (sp.radius > 60) return; const d = Math.max(0, sp.center.distanceTo(P) - sp.radius); if (d < near) { near = d; what = m.isPoints ? 'points' : m.geometry.type; } });
    let reach = false; for (let gx = -60; gx <= 60 && !reach; gx += 3) for (let gz = -60; gz <= 60 && !reach; gz += 3) { const x = st.x + gx, z = st.z + gz; if (D.walk(x, z) && Math.hypot(x - P.x, z - P.z) < t.range - 3) reach = true; }
    return { id: t.id, vis: t.vis, near: Math.round(near * 10) / 10, what, reach };
  });
};
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const id of ids) {
    const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })).newPage();
    const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.addInitScript(() => { window.BO3D_TEST = true; });
    try {
      await p.goto('file://' + file); await p.waitForTimeout(2500);
      await enter3d(p, 1, id);
      await p.waitForSelector('text=출발하자', { timeout: 60000 });
      await p.click('text=출발하자'); await p.waitForTimeout(800);
      await p.evaluate(() => { const o = document.querySelector('.overlay3'); if (o) o.hidden = true; });
      await p.waitForTimeout(1500);
      const a = await p.evaluate(probe);
      await p.evaluate(() => BO3D.debug.lookup());
      await p.waitForSelector('.panel3:not([hidden])', { timeout: 90000 }); await p.waitForTimeout(1500);
      const n = await p.evaluate(() => { const s = BO3D.debug.scene(); return BO3D.ot.scenes[s.id].beats.length; });
      await p.evaluate((k) => BO3D.debug.beat(k), n - 1);
      const t0 = await p.evaluate(() => BO3D.debug.now()); for (let k = 0; k < 400; k++) { if ((await p.evaluate(() => BO3D.debug.now())) - t0 > 20) break; await p.waitForTimeout(250); }
      const e = await p.evaluate(probe);
      const fmt = (r) => r.map((x) => x.id + (x.vis === false ? '(안보임 설정)' : '') + (x.near > 2 && x.vis !== false ? '[물체 ' + x.near + 'm]' : '') + (x.reach ? '' : '[거리 밖]')).join(' ');
      console.log(id, '| 탐험:', fmt(a), '| 사건 뒤:', fmt(e), '| 오류', errs.length);
    } catch (x) { console.log(id, 'FAIL', x.message.split('\n')[0]); }
    await p.context().close();
  }
  await b.close();
})();
