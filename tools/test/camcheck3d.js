// 탐험 중 카메라가 아이들을 가리는 곳을 찾는다(polish 갈래 "조작감"). 사용: node tools/test/camcheck3d.js [--file 미리보기] [장면들...]
// 장면에 들어가 걸을 수 있는 곳을 격자(6m)로 고르고, 네 방향(카메라가 아이 뒤에 서는 방향)마다
// 카메라 → 아이 머리 사이를 ① 지형 높이로 ② 장면의 물건(보이는 mesh)으로 가리는지 본다. 가린 비율과 가린 물건, 자리를 낸다.
const { chromium } = require('playwright');
const path = require('path');
const enter3d = require('./lib/enter.js');
const argv = process.argv.slice(2), ids = []; let file = path.join(__dirname, '../../dist/preview3d.html');
for (let i = 0; i < argv.length; i++) { if (argv[i] === '--file') file = path.resolve(argv[++i]); else ids.push(argv[i]); }
if (!ids.length) ids.push('OT-18', 'OT-11', 'OT-26', 'OT-19', 'OT-30', 'OT-03', 'OT-13', 'OT-05', 'OT-21', 'OT-36', 'OT-39');
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
      const r = await p.evaluate(() => {
        const D = BO3D.debug, T = THREE, th = D.three(), sc = th.scene, P = D.scene().P, st = D.state(), sx = st.x, sz = st.z;
        const rc = new T.Raycaster(), meshes = [];
        sc.traverse((o) => { if (!o.isMesh) return; for (let a = o; a; a = a.parent) if (!a.visible) return; meshes.push(o); });
        const out = { n: 0, terrain: 0, obj: 0, who: {}, spots: [] }, v = new T.Vector3(), dir = new T.Vector3();
        for (let gx = -48; gx <= 48; gx += 6) for (let gz = -48; gz <= 48; gz += 6) {
          const x = sx + gx, z = sz + gz; if (!D.walk(x, z)) continue;
          for (let k = 0; k < 4; k++) {
            const yaw = k * Math.PI / 2 + 0.3, c = D.camAt(x, z, yaw), hy = c[3] + 1.2; out.n++;
            let tb = false;
            for (let s = 1; s < 12; s++) { const t = s / 12, qx = c[0] + (x - c[0]) * t, qz = c[2] + (z - c[2]) * t, qy = c[1] + (hy - c[1]) * t; if (D.h(qx, qz) > qy - 0.05) { tb = true; break; } }
            if (tb) { out.terrain++; if (out.spots.length < 12) out.spots.push(['지형', Math.round(x), Math.round(z), k]); continue; }
            v.set(c[0], c[1], c[2]); dir.set(x - c[0], hy - c[1], z - c[2]); const L = dir.length(); dir.normalize();
            rc.set(v, dir); rc.far = L - 1.0;
            const hit = rc.intersectObjects(meshes, false).find((h) => h.distance > 0.05);
            if (hit) {
              out.obj++; let o = hit.object, nm = o.name || '';
              for (let a = o; a && !nm; a = a.parent) nm = a.name || a.userData.kind || '';
              nm = nm || (o.geometry && o.geometry.type) + '/' + (o.material && o.material.color ? '#' + o.material.color.getHexString() : '');
              out.who[nm] = (out.who[nm] || 0) + 1; if (out.spots.length < 12) out.spots.push([nm, Math.round(x), Math.round(z), k]);
            }
          }
        }
        /* 말없이 막히는 곳: 걸을 수 있는 자리에서 한 걸음(0.6m) 나아갈 수 없고(옆으로 미끄러지지도 못함) 동행의 안내 말(edge)도 없는 방향 */
        const blk = { n: 0, silent: 0, trap: 0, spots: [] };
        for (let gx = -48; gx <= 48; gx += 2) for (let gz = -48; gz <= 48; gz += 2) {
          const x = sx + gx, z = sz + gz; if (!D.walk(x, z)) continue;
          let open = 0;
          for (let k = 0; k < 8; k++) {
            const a = k * Math.PI / 4, nx = x + Math.sin(a) * 0.6, nz = z + Math.cos(a) * 0.6;
            /* game.js movePlayer와 같게: 안 되면 x만, 그다음 z만 움직여 본다. 움직인 거리가 0.2m 아래면 막힌 것 */
            const mv = D.walk(nx, nz) ? 0.6 : D.walk(nx, z) ? Math.abs(nx - x) : D.walk(x, nz) ? Math.abs(nz - z) : 0;
            if (mv > 0.2) { open++; continue; }
            blk.n++; if (!D.edge(nx, nz)) { blk.silent++; if (blk.spots.length < 10) blk.spots.push([Math.round(nx), Math.round(nz)]); }
          }
          if (!open) blk.trap++;
        }
        out.blk = blk;
        return out;
      });
      console.log(id, '막힌 방향', r.blk.n, '그 가운데 안내 말 없음', r.blk.silent, '갇히는 자리', r.blk.trap, '말 없는 자리', JSON.stringify(r.blk.spots));
      console.log(id, '표본', r.n, '지형에 가림', r.terrain, '(' + (100 * r.terrain / Math.max(1, r.n)).toFixed(1) + '%)', '물건에 가림', r.obj, '(' + (100 * r.obj / Math.max(1, r.n)).toFixed(1) + '%)', JSON.stringify(r.who), '자리', JSON.stringify(r.spots), '오류', errs.length);
    } catch (x) { console.log(id, 'FAIL', x.message.split('\n')[0]); }
    await p.context().close();
  }
  await b.close();
})();
