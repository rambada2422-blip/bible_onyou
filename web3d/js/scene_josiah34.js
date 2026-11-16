/* 3D 장면 설정: OT-34 요시야와 율법책 (왕하 22:1-23:3).
 * 방향: 여호와의 전은 북쪽(-Z) 높은 터 위에 남쪽을 보고 서 있다. 그 앞이 뜰이고, 뜰 북쪽 끝(전 문 앞)에 왕이 선 대가 있다.
 *       동쪽(+X) 낮은 곳에 왕이 있는 곳, 서쪽(-X) 멀리 둘째 구역의 집들. 아이들은 높은 터 아래 남쪽 길에서만 다닌다(뜰에 올라가지 않는다).
 * 아이들이 다니는 때: 요시야 왕 십팔년, 전을 고치고 있을 때(22:3-6). 재료 2를 주우면 사반이 왕에게서 전으로 올라간다(22:3-4).
 * 본문에 맞춘 점 (content/ot/OT-34.json design3d)
 *  - 전의 낡은 곳을 고친다(22:5). 목수(재목을 나르고 켠다), 건축자(다듬은 돌을 나른다), 미장이(벽 앞과 비계 위), 일을 감독하는 사람들(22:5-6). 재목과 다듬은 돌 더미(22:6).
 *    문을 지키는 사람들(22:4)은 뜰 어귀에 서 있다. 은(22:4)은 그리지 않는다.
 *  - 전의 문은 닫혀 있고 안은 보이지 않는다. 힐기야가 책을 발견하는 모습과 자리는 그리지 않는다(22:8은 발견했다는 말뿐). 책을 든 힐기야가 뜰 어귀에 서 있는 데서 시작한다.
 *  - 22:8-10: 힐기야가 책을 사반에게 건네고, 사반이 읽고, 왕에게 돌아가 왕 앞에서 읽는다. 책은 작고 단순한 꼴(글자 없음, 빛 없음). 낭독 소리·글귀 없음.
 *  - 22:11-13: 왕이 책의 말을 듣자 옷을 찢는다 → 멀리서, 몸을 앞으로 숙이는 데까지만. 다섯 사람(힐기야, 아히감, 악볼, 사반, 아사야)이 왕 앞에 모였다가 떠난다.
 *  - 22:14-20: 다섯 사람이 둘째 구역의 집 앞에 서 있다(멀리서, 집 바깥만). 훌다의 모습과 훌다가 전한 말씀은 그림·소리로 만들지 않는다(대목 글과 성경책으로만). 사람들이 왕에게 돌아온다(22:20).
 *  - 23:1-3: 장로들(23:1)과 어린 사람부터 나이 든 사람까지 모든 백성(23:2)이 왕과 함께 전으로 올라가 뜰에 선다. 왕은 대 위에 서서 책을 들고 있다(23:2-3).
 *    백성은 서 있다(절하거나 손을 드는 모습은 본문에 없어 그리지 않는다). 23:4 뒤의 일(우상을 헐어 버림)은 넣지 않는다.
 *  - 하나님의 형상·빛·음성 없음. 왕과 사람들의 얼굴을 가까이 보이지 않는다.
 * 감수가 필요한 설정: 전의 생김새·크기·높은 터와 층계, 뜰과 낮은 담, 비계와 사다리, 대의 생김새와 자리(전 문 앞, 민기둥 하나 곁), 왕이 있는 곳의 생김새와 자리(기둥과 지붕),
 *   둘째 구역 집의 생김새와 자리, 책의 꼴(작은 네모), 요시야의 생김새와 옷 색(tools/blender/people/josiah.json: 수염 없는 젊은 어른, 푸른 겉옷, 왕관 없음),
 *   힐기야·사반·일꾼·백성의 옷(무리 모형), 사람 수(일꾼 11, 백성 64), 사반이 책을 들고 다니는 것, 언약 대목의 따뜻한 빛(날씨와 때는 본문에 없음), 길을 오가는 사람들.
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  BO3D.scene3d = BO3D.scene3d || {};
  if (!(BO3D.c3d && BO3D.c3d.on('OT-34'))) return;
  BO3D.scene3d['OT-34'] = function (api) {
    var T = THREE, M2 = BO3D.models2 || {}, MO = BO3D.models || {}, PR = BO3D.props, FX = api.FX, C3 = BO3D.c3d, R = PR.rng(3411), sm = C3.sm, noise = C3.noise, hash = C3.hash, i, k;
    var TH = 2.6, COURT_X = 34, EDGE_Z = -17.5, FRONT_Z = -50, DAIS = [0, -44], DAIS_H = 1.3, KING = [35, 0], PLAT_H = 0.8, HUL = [-56, 3], ROAD_Z = -5;
    function height(x, z) {
      var st = sm(8.2, 6.2, Math.abs(x)), upW = sm(-14.6, -17.2, z), up = (upW + (sm(-7, -17, z) - upW) * st) * sm(78, 58, Math.abs(x));   /* 가운데는 층계, 양옆은 축대 */
      return TH * up + 0.3 * noise(x * 0.06 + 3, z * 0.06 + 1) * (1 - up) + sm(120, 230, Math.hypot(x, z)) * 12 * noise(x * 0.02, z * 0.02);
    }
    function walkable(x, z) { return x >= -40 && x <= 24 && z >= -2.5 && z <= 30; }
    function plat(x, z) { return x > 29.6 && x < 41.6 && Math.abs(z - KING[1]) < 4.2 ? PLAT_H : 0; }   /* 왕이 있는 곳의 낮은 단 */

    var scene = new T.Scene();
    scene.background = new T.Color('#EFE3C6'); scene.fog = new T.Fog('#EFE3C6', 80, 330);
    var skyG = new T.SphereGeometry(560, 24, 14), sp = skyG.attributes.position, sc = new Float32Array(sp.count * 3), cc = new T.Color(), top = new T.Color('#7DB2D2'), hor = new T.Color('#F4E8CA');
    for (i = 0; i < sp.count; i++) { var tt = Math.max(0, sp.getY(i) / 560); cc.copy(hor).lerp(top, sm(0.02, 0.7, tt)); sc[i * 3] = cc.r; sc[i * 3 + 1] = cc.g; sc[i * 3 + 2] = cc.b; }
    skyG.setAttribute('color', new T.BufferAttribute(sc, 3));
    var skyM = new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false }); scene.add(new T.Mesh(skyG, skyM));
    var g = new T.PlaneGeometry(520, 520, 160, 160); g.rotateX(-Math.PI / 2);
    var pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color(), s1 = new T.Color('#CDB582'), s2 = new T.Color('#B3A772'), pave = new T.Color('#E0CFA6'), road = new T.Color('#D9C596');
    for (i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i), y = height(x, z); pos.setY(i, y);
      c.copy(s1).lerp(s2, noise(x * 0.06, z * 0.06));
      if (Math.abs(z - ROAD_Z) < 2.6 && Math.abs(x) < 62) c.lerp(road, 0.75);
      if (Math.abs(x) < 4 && z > -8 && z < 34) c.lerp(road, 0.6);
      if (z < EDGE_Z + 2 && z > -84 && Math.abs(x) < COURT_X + 1) c.lerp(pave, 0.85);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals();
    var ground = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 })); ground.receiveShadow = true; scene.add(ground);
    var hemi = new T.HemisphereLight('#DCEFF2', '#A99A6A', 0.64); scene.add(hemi);
    var sun = new T.DirectionalLight('#FFF0CF', 0.74); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    var ss = sun.shadow.camera; ss.left = -26; ss.right = 26; ss.top = 26; ss.bottom = -26; ss.near = 1; ss.far = 150; sun.shadow.bias = -0.0015;
    scene.add(sun); scene.add(sun.target);
    var MAT = {};
    function std(cl) { return MAT[cl] || (MAT[cl] = new T.MeshStandardMaterial({ color: cl, flatShading: true, roughness: 0.95 })); }
    var statics = [];
    function box(w, h, d, cl, x, y, z, ry, rz) { var m = new T.Mesh(new T.BoxGeometry(w, h, d), std(cl)); m.position.set(x, y, z); if (ry) m.rotation.y = ry; if (rz) m.rotation.z = rz; statics.push(m); return m; }
    function cyl(r1, r2, h, cl, x, y, z, seg) { var m = new T.Mesh(new T.CylinderGeometry(r1, r2, h, seg || 8), std(cl)); m.position.set(x, y, z); statics.push(m); return m; }
    function put(o, x, z, lift) { o.position.set(x, height(x, z) + (lift || 0), z); scene.add(o); return o; }

    /* ── 여호와의 전(바깥만. 문은 닫혀 있다) ── 생김새는 본문에 없음: 단순한 돌집 */
    var STONE = '#E6D5AC', STONE2 = '#D9C69A', STONE3 = '#CBB688', OLD = '#B7A27A', WOOD = '#8A6240', WOOD2 = '#A57A4E', DARK = '#5A3E28';
    box(13, 16, 30, STONE, 0, TH + 8, FRONT_Z - 17);                       /* 가운데 높은 집 */
    box(13.8, 0.7, 30.8, STONE2, 0, TH + 16.2, FRONT_Z - 17);
    box(24, 8, 28, STONE2, 0, TH + 4, FRONT_Z - 18);                        /* 둘레의 낮은 방들 */
    box(24.6, 0.5, 28.6, STONE3, 0, TH + 8.2, FRONT_Z - 18);
    box(11, 18, 4, STONE, 0, TH + 9, FRONT_Z - 2);                          /* 앞쪽 현관 */
    box(11.8, 0.8, 4.8, STONE2, 0, TH + 18.3, FRONT_Z - 2);
    box(4.2, 7.5, 0.4, DARK, 0, TH + 3.75, FRONT_Z + 0.05);                 /* 닫힌 문(무늬 없음) */
    box(0.12, 7.5, 0.5, '#3E2A1A', 0, TH + 3.75, FRONT_Z + 0.1);
    box(5.4, 0.6, 0.6, STONE3, 0, TH + 7.8, FRONT_Z + 0.2);
    for (k = 0; k < 3; k++) box(9 - k * 1.2, 0.3, 1.1, STONE3, 0, TH + 0.15 + k * 0.3, FRONT_Z + 2.4 - k * 0.9);   /* 문 앞 층계 */
    [-1, 1].forEach(function (sd) { box(1.3, 18, 0.5, STONE2, sd * 4.85, TH + 9, FRONT_Z + 0.2); [-8.2, -10.6].forEach(function (wx) { box(0.5, 1.5, 0.2, '#6A5A44', sd * wx, TH + 6.2, FRONT_Z - 3.95); }); });
    [10.5, 14.2].forEach(function (by) { box(8.4, 0.2, 0.14, STONE3, 0, TH + by, FRONT_Z + 0.05); });
    /* 낡은 곳(22:5): 벗겨진 벽과 빠진 돌 자리 */
    [[-9.5, 3.2, 3.2, 2.2], [9.2, 5.4, 2.6, 1.6], [-7.4, 6.2, 1.8, 1.2], [10.6, 2.0, 1.6, 2.4], [-10.8, 1.4, 1.2, 1.4]].forEach(function (q) { box(q[2], q[3], 0.16, OLD, q[0], TH + q[1], FRONT_Z - 4 + 0.06); });
    [[-3.8, 12.5, 1.6, 2.2], [3.4, 15.2, 2.2, 1.4], [4.2, 9.4, 1.2, 1.8]].forEach(function (q) { box(q[2], q[3], 0.16, OLD, q[0], TH + q[1], FRONT_Z + 0.06); });
    /* 비계와 사다리(감수 대상): 현관 양옆, 낮은 방들의 앞벽에 */
    [-1, 1].forEach(function (sd) {
      var bx = sd * 9.2, bz = FRONT_Z - 2.9;
      [-2.4, 0, 2.4].forEach(function (dx) { cyl(0.09, 0.09, 8.6, WOOD, bx + dx, TH + 4.3, bz, 5); cyl(0.09, 0.09, 8.6, WOOD, bx + dx, TH + 4.3, bz + 1.3, 5); });
      [2.6, 5.4].forEach(function (hy) { box(5.4, 0.12, 1.5, WOOD2, bx, TH + hy, bz + 0.65); });
      box(5.6, 0.1, 0.1, WOOD, bx, TH + 8.2, bz + 1.3);
      var ld = new T.Group(); [-0.3, 0.3].forEach(function (dx) { var r = new T.Mesh(new T.BoxGeometry(0.08, 6.2, 0.08), std(WOOD)); r.position.set(dx, 3.1, 0); ld.add(r); });
      for (k = 0; k < 8; k++) { var rg = new T.Mesh(new T.BoxGeometry(0.6, 0.06, 0.06), std(WOOD)); rg.position.set(0, 0.6 + k * 0.7, 0); ld.add(rg); }
      ld.position.set(bx + sd * 3.4, TH, bz + 2.9); ld.rotation.x = -0.26; statics.push(ld);
    });
    /* 뜰의 낮은 담과 어귀(22:4 문을 지키는 사람들이 서는 곳), 올라가는 층계 */
    [-1, 1].forEach(function (sd) {
      box(54, TH + 0.9, 2.6, STONE2, sd * (9.4 + 27), (TH + 0.4) / 2 - 0.25, -16.2); box(54.2, 0.2, 3.0, STONE3, sd * (9.4 + 27), TH + 0.5, -16.2);   /* 축대와 그 위의 낮은 턱 */
      [0.9, 1.9].forEach(function (by) { box(54.1, 0.14, 2.7, STONE3, sd * (9.4 + 27), by, -16.2); });
      for (k = 0; k < 5; k++) { var cz = -8 - k * 2, ctop = height(0, cz - 1) + 0.7; box(3.6, ctop + 0.5, 2.02, k % 2 ? STONE : STONE2, sd * 8.1, (ctop - 0.5) / 2, cz); }               /* 층계 옆 벽 */
      box(0.8, 1.1, 66, STONE2, sd * COURT_X, TH + 0.55, EDGE_Z - 33);
      box(1.6, 3.4, 1.6, STONE, sd * 7, TH + 1.7, EDGE_Z); box(2.0, 0.4, 2.0, STONE3, sd * 7, TH + 3.6, EDGE_Z);
    });
    for (k = 0; k < 10; k++) { var sz0 = -7.5 - k, stop = height(0, sz0 - 0.5) + 0.08; box(13, stop + 0.5, 1.02, k % 2 ? STONE2 : STONE, 0, (stop - 0.5) / 2, sz0); }
    /* 대(23:3): 낮은 돌 단과 그 곁의 민기둥 하나 */
    box(3.4, DAIS_H, 3.4, STONE, DAIS[0], TH + DAIS_H / 2, DAIS[1]); box(3.8, 0.25, 3.8, STONE3, DAIS[0], TH + 0.125, DAIS[1]);
    box(1.6, 0.45, 1.0, STONE3, DAIS[0], TH + 0.22, DAIS[1] + 2.2); box(1.6, 0.9, 0.6, STONE3, DAIS[0], TH + 0.45, DAIS[1] + 1.85);
    cyl(0.5, 0.58, 8.4, STONE2, DAIS[0] + 3.0, TH + 4.2, DAIS[1] - 1.2, 10); box(1.5, 0.4, 1.5, STONE3, DAIS[0] + 3.0, TH + 0.2, DAIS[1] - 1.2); box(1.4, 0.4, 1.4, STONE3, DAIS[0] + 3.0, TH + 8.6, DAIS[1] - 1.2);
    /* 재목 더미와 다듬은 돌 더미(22:6) */
    var TIMBER = [-21, -27], STONES = [21, -27];
    [[0, 0], [0.5, 0], [1.0, 0], [-0.5, 0], [0.25, 0.42], [0.75, 0.42], [-0.25, 0.42], [0.5, 0.84], [0, 0.84]].forEach(function (q, n) { var lg = new T.Mesh(new T.CylinderGeometry(0.22, 0.22, 6.4, 7), std(n % 2 ? WOOD : WOOD2)); lg.rotation.z = Math.PI / 2; lg.position.set(TIMBER[0] + (hash(n, 4) - 0.5) * 0.5, TH + 0.22 + q[1], TIMBER[1] + q[0] * 0.92); statics.push(lg); });
    for (k = 0; k < 4; k++) { var lg2 = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 5.2, 7), std(WOOD2)); lg2.rotation.z = Math.PI / 2; lg2.rotation.y = 0.5; lg2.position.set(-17.5 + (k % 2) * 0.3, TH + 0.2 + Math.floor(k / 2) * 0.4, -47 + (k % 2) * 0.45); statics.push(lg2); }
    function stonePile(cx, cz, nx, ny, nz) { for (var a = 0; a < nx; a++) for (var b = 0; b < ny; b++) for (var d2 = 0; d2 < nz; d2++) { if (b === ny - 1 && hash(a + cx, d2 + cz) < 0.45) continue; box(0.86, 0.5, 0.6, (a + b + d2) % 2 ? '#DCCDA8' : '#CFC09A', cx + a * 0.9, TH + 0.25 + b * 0.5, cz + d2 * 0.64); } }
    stonePile(STONES[0], STONES[1], 5, 3, 3); stonePile(15.6, -46.5, 3, 2, 2); stonePile(-26, -38, 3, 2, 2);
    /* 왕이 있는 곳(22:9-10. 생김새와 자리는 본문에 없음): 낮은 단, 기둥 넷, 지붕, 뒤의 집 */
    var ky = height(KING[0], KING[1]);
    box(12, PLAT_H, 8.4, STONE2, KING[0] + 0.6, ky + PLAT_H / 2, KING[1]); box(1.2, PLAT_H / 2, 3, STONE3, KING[0] - 6, ky + PLAT_H / 4, KING[1]);
    [[-5.4, -3.7], [-5.4, 3.7], [5.4, -3.7], [5.4, 3.7]].forEach(function (q) { cyl(0.34, 0.4, 5, STONE, KING[0] + 0.6 + q[0], ky + PLAT_H + 2.5, KING[1] + q[1], 8); });
    box(12.6, 0.5, 9, STONE3, KING[0] + 0.6, ky + PLAT_H + 5.25, KING[1]);
    box(1.3, 0.8, 1.5, STONE3, KING[0] + 2.2, ky + PLAT_H + 0.4, KING[1]); box(0.4, 1.9, 1.5, STONE3, KING[0] + 3.0, ky + PLAT_H + 0.95, KING[1]);   /* 꾸밈없는 돌 자리(감수 대상) */
    box(14, 8, 16, STONE2, KING[0] + 13.6, ky + 4, KING[1]); box(14.6, 0.5, 16.6, STONE3, KING[0] + 13.6, ky + 8.2, KING[1]);
    /* 예루살렘의 집들(멀리). 서쪽이 둘째 구역(22:14) */
    var HC = ['#E2C090', '#D6AE7C', '#EACB9A', '#DDBB8A'];
    function house(hx, hz, hw, hh, hd, face) {
      var y0 = height(hx, hz); box(hw, hh + 1, hd, HC[Math.floor(hash(hx, hz) * 4)], hx, y0 + hh / 2 - 0.5, hz); box(hw + 0.3, 0.3, hd + 0.3, '#C9A470', hx, y0 + hh + 0.1, hz);
      if (!face) return;
      var fx = face[0], fz = face[1], ox = fx * (hw / 2 + 0.02), oz = fz * (hd / 2 + 0.02), sx = fz ? 1 : 0, sz1 = fx ? 1 : 0, off = (hash(hx, 7) - 0.5) * 1.6;
      box(fz ? 1.1 : 0.14, 2.0, fx ? 1.1 : 0.14, DARK, hx + ox + sx * off, y0 + 1.0, hz + oz + sz1 * off);
      box(fz ? 0.6 : 0.14, 0.6, fx ? 0.6 : 0.14, '#6A5238', hx + ox + sx * (off + 1.7), y0 + hh * 0.62, hz + oz + sz1 * (off + 1.7));
      if (hash(hz, 3) < 0.6) { var jx = hx + ox + fx * 0.5 + sx * (off - 1.1), jz = hz + oz + fz * 0.5 + sz1 * (off - 1.1); cyl(0.3, 0.2, 0.75, '#B5673E', jx, height(jx, jz) + 0.37, jz, 8); }   /* 물동이 */
      if (hash(hx, 11) < 0.4) { var ax = hx + ox + fx * 1.1 + sx * (off + 1.4), az = hz + oz + fz * 1.1 + sz1 * (off + 1.4), ay = height(ax, az);
        box(fz ? 2.6 : 2.0, 0.07, fx ? 2.6 : 2.0, ['#9C5438', '#4F5D7A', '#C89A4A'][Math.floor(hash(hx, 13) * 3)], ax, ay + 2.3, az);
        [-1, 1].forEach(function (e) { cyl(0.05, 0.05, 2.3, WOOD, ax + fx * 0.9 + sx * e * 1.2, ay + 1.15, az + fz * 0.9 + sz1 * e * 1.2, 5); }); }                                           /* 차양 */
    }
    for (i = 0; i < 9; i++) house(-42 + i * 9.2 + (hash(i, 21) - 0.5) * 2, 37.5 + hash(i, 22) * 2.5, 5.5 + hash(i, 23) * 2.5, 3.2 + hash(i, 24) * 2.6, 5 + hash(i, 25) * 2, [0, -1]);
    for (i = 0; i < 4; i++) house(-49.5 - hash(i, 26) * 2, 12 + i * 7.6, 5 + hash(i, 27) * 2, 3.2 + hash(i, 28) * 2.4, 5.4 + hash(i, 29), [1, 0]);
    for (i = 0; i < 2; i++) house(36 + hash(i, 30) * 2, 27.5 + i * 7.4, 5 + hash(i, 31) * 2, 3.2 + hash(i, 32) * 2.4, 5.4 + hash(i, 33), [-1, 0]);
    for (i = 0; i < 26; i++) house(-70 + R() * 150, 38 + R() * 46, 4 + R() * 5, 3 + R() * 3, 4 + R() * 4);
    for (i = 0; i < 20; i++) house(-100 + R() * 34, -12 + R() * 56, 4 + R() * 5, 3 + R() * 3.5, 4 + R() * 4);
    for (i = 0; i < 16; i++) house(58 + R() * 40, -14 + R() * 60, 4 + R() * 5, 3 + R() * 3.5, 4 + R() * 4);
    for (i = 0; i < 12; i++) house((i % 2 ? 1 : -1) * (44 + R() * 40), -30 - R() * 50, 4 + R() * 5, 3 + R() * 3, 4 + R() * 4);
    /* 다섯 사람이 찾아간 집(22:14. 바깥만) */
    var hy0 = height(HUL[0], HUL[1]);
    box(8, 5, 9, '#E2C090', HUL[0] - 3, hy0 + 2.5, HUL[1]); box(8.4, 0.3, 9.4, '#C9A470', HUL[0] - 3, hy0 + 5.1, HUL[1]); box(0.3, 2.6, 1.4, DARK, HUL[0] + 1.0, hy0 + 1.3, HUL[1]);
    box(6, 4, 7, '#D6AE7C', HUL[0] - 2, hy0 + 2, HUL[1] + 10); box(6, 4.4, 6, '#EACB9A', HUL[0] - 3, hy0 + 2.2, HUL[1] - 9.5);
    /* 길가의 나무(아이들이 다니는 곳 바깥) */
    [[-44, 9], [-45, 27], [28, 12], [29, 27], [-18, 33.5], [14, 34], [-62, -8], [46, -9], [-36, 34]].forEach(function (q, n) {
      var ty = height(q[0], q[1]), th = 2.2 + hash(n, 9) * 1.2; cyl(0.16, 0.24, th, '#6E5238', q[0], ty + th / 2, q[1], 6);
      var cr = new T.Mesh(new T.IcosahedronGeometry(1.5 + hash(n, 2) * 0.6, 0), std(n % 2 ? '#7C8C52' : '#6F8448')); cr.position.set(q[0], ty + th + 0.9, q[1]); cr.scale.y = 0.8; statics.push(cr);
    });
    scene.add(PR.mergeStatic(statics));
    if (MO.rock) for (i = 0; i < 7; i++) { var rk = MO.rock(60 + i), rx = -38 + R() * 60, rz = 2 + R() * 26; if (Math.abs(rx) < 5) rx += 9; put(rk, rx, rz, -0.05); }
    if (MO.shrub) for (i = 0; i < 8; i++) { var sh = MO.shrub(70 + i); put(sh, i % 2 ? 26 + R() * 3 : -42 - R() * 3, R() * 30); }

    /* ── 사람 ── */
    function man(seed) { var o = null; try { if (M2.israelite) o = M2.israelite(seed, { kind: 'man', carry: 'none' }); } catch (e) { o = null; } if (!o) o = PR.soldier(seed, '#7A6A54', null); o.group.rotation.order = 'YXZ'; scene.add(o.group); return o; }
    function setAt(o, x, z, ry, lift) { o.group.position.set(x, height(x, z) + (lift === undefined ? plat(x, z) : lift), z); if (ry !== undefined) o.group.rotation.y = ry; }
    var king = { group: api.fallback('#2F4F8F', 1.75, 0.27), update: function () {} }; king.group.rotation.order = 'YXZ'; scene.add(king.group);
    api.person('josiah', function (nm) { nm.group.rotation.order = 'YXZ'; nm.group.position.copy(king.group.position); nm.group.rotation.copy(king.group.rotation); nm.group.visible = king.group.visible; scene.remove(king.group); scene.add(nm.group); king = nm; });
    var hilkiah = man(3401), shaphan = man(3402), ahikam = man(3403), achbor = man(3404), asaiah = man(3405), FIVE = [hilkiah, shaphan, ahikam, achbor, asaiah];
    var keepers = [man(3411), man(3412)];
    setAt(keepers[0], -5.2, EDGE_Z - 0.9, 0); setAt(keepers[1], 5.2, EDGE_Z - 0.9, 0);
    /* 율법책: 생김새는 본문에 없음. 작고 단순한 꼴, 글자 없음 */
    var book = new T.Mesh(new T.BoxGeometry(0.34, 0.08, 0.26), std('#6A4A2E')); book.visible = false; scene.add(book);
    var bookWith = null;
    /* 일꾼(22:5-6): 감독하는 사람 2, 목수 3(둘은 재목을 나르고 하나는 켠다), 건축자 3(다듬은 돌을 나른다), 미장이 3(벽 앞, 비계 위) */
    var workers = [];
    function worker(seed, kind, a, b, ph) {
      var o = man(seed); o.kind = kind; o.a = a; o.b = b; o.ph = ph || 0;
      if (kind === 'timber') { o.load = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 2.6, 6), std(WOOD2)); o.load.rotation.x = Math.PI / 2; o.load.position.set(0.25, 1.42, 0.1); o.group.add(o.load); }
      if (kind === 'stone') { o.load = new T.Mesh(new T.BoxGeometry(0.42, 0.28, 0.3), std('#DCCDA8')); o.load.position.set(0, 1.12, 0.3); o.group.add(o.load); }
      workers.push(o); return o;
    }
    worker(3421, 'over', [-5, -31]); worker(3422, 'over', [12, -33]);
    worker(3423, 'timber', [TIMBER[0] + 4.2, TIMBER[1] - 1], [-10.5, FRONT_Z + 1.5], 0); worker(3424, 'timber', [TIMBER[0] + 4.2, TIMBER[1] + 0.6], [-12.5, FRONT_Z + 2.5], 0.5);
    worker(3425, 'saw', [TIMBER[0] + 1, TIMBER[1] + 2.2]);
    worker(3426, 'stone', [STONES[0] - 1.6, STONES[1] - 0.4], [10.5, FRONT_Z + 1.6], 0.1); worker(3427, 'stone', [STONES[0] - 1.6, STONES[1] + 1], [8.6, FRONT_Z + 2.6], 0.45); worker(3428, 'stone', [STONES[0] - 0.6, STONES[1] + 2.6], [12.4, FRONT_Z + 3.2], 0.8);
    worker(3429, 'mason', [8.2, FRONT_Z - 1.6]); worker(3430, 'mason2', [-9.6, FRONT_Z - 2.25]); worker(3431, 'mason3', [10.2, FRONT_Z - 2.25]);
    workers.forEach(function (o) {
      if (o.kind === 'over') setAt(o, o.a[0], o.a[1], Math.PI * (o.a[0] < 0 ? 0.75 : -0.75));
      if (o.kind === 'saw') setAt(o, o.a[0], o.a[1], Math.PI);
      if (o.kind === 'mason') setAt(o, o.a[0], o.a[1], Math.PI);
      if (o.kind === 'mason2') setAt(o, o.a[0], o.a[1], Math.PI, 2.66);
      if (o.kind === 'mason3') setAt(o, o.a[0], o.a[1], Math.PI, 5.46);
    });
    /* 장로들(23:1, 앞줄 여덟)과 모든 백성(23:2, 어린 사람부터 나이 든 사람까지). 앞의 여덟 사람은 다른 때에는 길을 오간다 */
    var crowd = [], COLS = 8, ROWS = 8;
    for (i = 0; i < COLS * ROWS; i++) {
      var row = Math.floor(i / COLS), cl = i % COLS, o = null;
      try { if (M2.israelite) o = M2.israelite(i * 13 + 500, row === 0 || i >= 56 ? { kind: 'man', carry: 'none' } : { carry: 'none' }); } catch (e) { o = null; }
      if (!o) o = PR.soldier(i, '#7A6A54', null);
      o.group.rotation.order = 'YXZ'; scene.add(o.group); o.k = i;
      o.home = [-6.65 + cl * 1.9 + (hash(i, 1) - 0.5) * 0.6, -39.6 + row * 1.75 + (hash(i, 2) - 0.5) * 0.4];
      o.from = [o.home[0] * 0.8, o.home[1] + 11];
      if (i >= 56) { o.walkA = -44 + hash(i, 5) * 20; o.walkB = 4 + hash(i, 6) * 20; o.walkZ = ROAD_Z - 0.7 + (hash(i, 7) - 0.5) * 1.8; o.walkS = 1.3 + hash(i, 8) * 0.7; o.walkP = hash(i, 9) * 60; }
      crowd.push(o);
    }

    function mkPath(pts) { var L = [], tot = 0; for (var n = 0; n + 1 < pts.length; n++) { var l = Math.hypot(pts[n + 1][0] - pts[n][0], pts[n + 1][1] - pts[n][1]); L.push(l); tot += l; } return { p: pts, L: L, tot: tot }; }
    function pathAt(P, s) { s = Math.min(P.tot, Math.max(0, s)); for (var n = 0; n < P.L.length; n++) { if (s <= P.L[n] || n === P.L.length - 1) { var u = P.L[n] ? Math.min(1, s / P.L[n]) : 1, a = P.p[n], b = P.p[n + 1]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, Math.atan2(b[0] - a[0], b[1] - a[1])]; } s -= P.L[n]; } return [P.p[0][0], P.p[0][1], 0]; }
    function walk(o, P, s, endRy, dt) { var w = pathAt(P, s), mv = s > 0 && s < P.tot; setAt(o, w[0], w[1], mv || endRy === undefined ? w[2] : endRy); if (o.update) o.update(dt, mv ? 1 : 0); return !mv && s >= P.tot; }
    var SH_KING = [32.8, 0], SH_TEMPLE = [1.3, -23], HIL0 = [-1.1, -23];
    var UP = mkPath([SH_KING, [29.5, -0.6], [8, ROAD_Z], [1.6, -8], [1.5, -19], SH_TEMPLE]), DOWN = mkPath(UP.p.slice().reverse());
    var GATHER = [[32.3, -2.3], SH_KING, [33.4, -3.0], [31.3, -1.2], [31.3, 1.0]];                                  /* 왕 앞에 모인 다섯 사람(22:12) */
    var ATT0 = [null, null, [36.6, -2.9], [38.3, -2.5], [38.9, -0.7]];                                                 /* 왕 곁에 선 세 사람 */
    var ATHOUSE = [[-52.6, 2.2], [-52.4, 4.2], [-51.2, 1.0], [-51.0, 3.2], [-50.6, 5.2]];                            /* 둘째 구역의 집 앞(22:14) */
    var BYDAIS = [[-3.6, -43.2], [-4.9, -43.4], [-6.2, -43.2], [4.9, -42.4], [6.2, -42.6]];                          /* 대 곁(23:2 제사장들과 함께) */
    var LEAVE = FIVE.map(function (o, n) { return mkPath([GATHER[n], [26 - n * 0.4, ROAD_Z + (n % 2 ? 0.7 : -0.5)], [-40, ROAD_Z + (n % 2 ? 0.7 : -0.5)], [-50, 1 + n]]); });
    var BACK = FIVE.map(function (o, n) { return mkPath([[-10 - n * 1.5, ROAD_Z + (n % 2 ? 0.7 : -0.5)], [26, ROAD_Z + (n % 2 ? 0.7 : -0.5)], GATHER[n]]); });
    var HIL_IN = mkPath([[19, -3.6], GATHER[0]]);

    var phase = 'work', pt = 0, tod = 0, todWant = 0, lean = 0, wt = 0;
    var ca = new T.Color(), cb = new T.Color();
    function applyTod() {
      ca.set('#EFE3C6'); cb.set('#F4D9A6'); ca.lerp(cb, tod); scene.background.copy(ca); scene.fog.color.copy(ca);
      ca.set('#FFFFFF'); cb.set('#FFE6BE'); skyM.color.copy(ca.lerp(cb, tod)); hemi.intensity = 0.64 - 0.06 * tod; sun.intensity = 0.74 + 0.1 * tod; ca.set('#FFF0CF'); cb.set('#FFD79A'); sun.color.copy(ca.lerp(cb, tod));
    }
    function kingAt(x, z, ry, lift) { king.group.position.set(x, height(x, z) + (lift === undefined ? plat(x, z) : lift), z); king.group.rotation.set(0, ry, 0); }
    function still(o) { if (o.update) o.update(0.016, 0); }
    /* 대목마다 모든 상태를 처음부터 정한다('이전'으로 돌아와도 뒤 대목의 것이 남지 않게) */
    function setPhase(p) {
      phase = p; pt = 0; lean = 0;
      var cov = p === 'covenant', work = !cov;
      workers.forEach(function (o) { o.group.visible = work; });
      crowd.forEach(function (o) { o.group.visible = cov || o.k >= 56; o.group.rotation.x = 0; if (cov) { setAt(o, o.from[0], o.from[1], Math.PI); } });
      todWant = cov ? 1 : 0; if (!cov) { tod = 0; applyTod(); }
      kingAt(KING[0], KING[1], -Math.PI / 2);
      setAt(hilkiah, HIL0[0], HIL0[1], 0); setAt(shaphan, SH_KING[0], SH_KING[1], Math.PI / 2);
      [2, 3, 4].forEach(function (n) { setAt(FIVE[n], ATT0[n][0], ATT0[n][1], -Math.PI / 2); });
      FIVE.forEach(function (o) { o.group.visible = true; still(o); });
      book.visible = false; bookWith = null;
      if (p === 'sentDone') { setAt(shaphan, SH_TEMPLE[0], SH_TEMPLE[1], -Math.PI / 2); setAt(hilkiah, HIL0[0], HIL0[1], Math.PI / 2); }
      if (p === 'book') { setAt(shaphan, SH_TEMPLE[0], SH_TEMPLE[1], -Math.PI / 2); setAt(hilkiah, HIL0[0], HIL0[1], Math.PI / 2); book.visible = true; bookWith = hilkiah; }     /* 22:8 */
      if (p === 'tear') { book.visible = true; bookWith = shaphan; setAt(hilkiah, HIL_IN.p[0][0], HIL_IN.p[0][1], Math.PI / 2); }                                                    /* 22:10-13 */
      if (p === 'huldah') { FIVE.forEach(function (o, n) { setAt(o, ATHOUSE[n][0], ATHOUSE[n][1], -Math.PI / 2 + (n - 2) * 0.08); }); book.visible = true; bookWith = shaphan; }     /* 22:14 */
      if (p === 'report') { FIVE.forEach(function (o, n) { setAt(o, BACK[n].p[0][0], BACK[n].p[0][1], Math.PI / 2); }); book.visible = true; bookWith = shaphan; }                    /* 22:20 */
      if (cov) {                                                                                                                                                                   /* 23:1-3 */
        kingAt(DAIS[0], DAIS[1], 0, DAIS_H); book.visible = true; bookWith = king;
        FIVE.forEach(function (o, n) { setAt(o, BYDAIS[n][0], BYDAIS[n][1], n < 3 ? 0.25 : -0.25); });
      }
      placeBook();
    }
    function placeBook() {
      if (!bookWith || !book.visible) return;
      var gp = bookWith.group.position, ry = bookWith.group.rotation.y;
      book.position.set(gp.x + Math.sin(ry) * 0.3, gp.y + 1.06, gp.z + Math.cos(ry) * 0.3); book.rotation.y = ry;
    }
    function v3(x, y, z) { return new T.Vector3(x, y, z); }
    var KCAM = { pos: [34.5, height(34.5, 19) + 6.2, 19], look: [33.4, height(KING[0], KING[1]) + 2.0, 0] };   /* 왕이 있는 곳을 멀리서 */
    function camFollow(o, back, up) { var q = o.group.position; return q.x > 22 ? KCAM : { pos: [q.x + 1.6, q.y + up, Math.min(q.z + back, 16)], look: [q.x, q.y + 1.1, q.z] }; }
    setPhase('work');
    if (window.BO3D_TEST) C3.t34 = { skip: function (sec) { pt += sec; wt += sec; } };   /* 시험에서 때를 건너뛰어 볼 때만 쓴다 */
    if (FX) FX.sortLayers(scene);

    return {
      id: 'OT-34', scene: scene, sun: sun, sunOff: [-30, 50, 30],
      height: height, walkable: walkable,
      edge: function (x, z) {
        if (z < -2.5) return { who: 'onwoo', text: '여호와의 전 뜰 쪽으로는 올라가지 말자. 우리는 아래에서 지켜보는 사람이야.' };
        if (x > 24) return { who: 'hyu', text: '왕이 있는 곳으로는 가지 말자.' };
        if (x < -40) return { who: 'choeon', text: '저쪽 집들로는 가지 말자. 이 길에서만 다니자.' };
        return { who: 'hyu', text: '이 길 위에서만 다니자.' };
      },
      P: { start: [0, 17], machine: [6, 24], machineRot: -0.4,
        /* 재료가 놓인 곳(quests[i].found): 전에서 멀리 떨어진 예루살렘 길가 / 여호와의 전이 올려다보이는 비탈 아래 / 대가 올려다보이는 비탈 아래 */
        parts: [[-31, 24], [-21, -1.2], [1.6, -1.6]], lookSpot: [1.6, -1.6],
        look: { focus: [0, FRONT_Z], mid: [0, -30], dy: 3.5, backE: 9, upE: 6.5 } },
      eventCam: function (i) {
        if (i === 2) return camFollow(shaphan, 15, 5.6);                                                    /* 책이 건네지고, 사반이 왕에게 간다 */
        if (i === 3) return KCAM;
        if (i === 4) return { pos: [-33, height(-33, 3) + 6.5, 4.5], look: [-52, height(HUL[0], HUL[1]) + 1.6, 3.2] };
        if (i === 5) return camFollow(FIVE[0], 15, 5.6);
        if (i === 6) return { pos: [9.5, TH + 8.2, -11.5], look: [0, TH + 2.2, -41] };
        return null;
      },
      beatNote: function (i) {
        if (i === 4 || i === 5) return '훌다가 전한 여호와의 말씀은 그림이나 소리로 만들지 않았어요. 글로 읽고, 성경책에서 직접 찾아 읽어요.';
        return null;
      },
      detector: '탐지기', askLabel: '탐지기 물음 풀기',
      intro: { text: '타임머신이 예루살렘 길가에 내려앉았어요. 북쪽 높은 터에서 사람들이 여호와의 전을 고치고 있어요.', say: { who: 'hyu', text: '전의 뜰에는 올라가지 말자. 우리는 이 아래 길에서만 다니자.' } },
      lookText: '요시야와 율법책 이야기를 성경에서 찾아 읽은 뒤 다시 골라 보세요.',
      partBeats: [0, 1], eventStart: 2,
      sceneDoneText: '여호와의 전 앞의 일을 끝까지 지켜봐야 떠날 수 있어요.',
      dex: [
        { id: 'temple', name: '여호와의 전', desc: '요시야 왕 때 낡은 곳을 고친 전', ref: '왕하 22:5', hint: '북쪽 높은 터를 올려다보세요.', range: 130, crop: 0.6, pos: function () { return v3(0, TH + 8, FRONT_Z); } },
        { id: 'workers', name: '전을 고치는 일꾼들', desc: '목수와 건축자와 미장이. 재목과 다듬은 돌로 전을 고쳤다', ref: '왕하 22:6', hint: '뜰에서 재목과 돌을 나르는 사람들을 보세요.', range: 70, crop: 0.4, visible: function () { return workers[2].group.visible; }, pos: function () { var p = workers[2].group.position; return v3(p.x, p.y + 1.1, p.z); } },
        { id: 'josiah', name: '요시야 왕', desc: '여덟 살에 왕이 되어 여호와 보시기에 바르게 행한 왕', ref: '왕하 22:1-2', hint: '동쪽 기둥 지붕 아래를 보세요.', range: 60, crop: 0.36, pos: function () { var p = king.group.position; return v3(p.x, p.y + 1.1, p.z); } },
        { id: 'dais', name: '왕이 선 대', desc: '왕이 그 위에 서서 여호와 앞에 언약을 세운 대', ref: '왕하 23:3', hint: '전 문 앞, 기둥 곁을 보세요.', range: 70, crop: 0.4, pos: function () { return v3(DAIS[0], TH + 1.6, DAIS[1]); } }
      ],
      reset: function () { setPhase('work'); },
      partFound: function (i) { if (i === 1 && phase === 'work') setPhase('sent'); },   /* 22:3-4: 왕이 사반을 여호와의 전으로 보낸다 */
      partContinue: function () {},
      lookupPose: function () { if (phase === 'work' || phase === 'sent') setPhase('sentDone'); },
      /* 대목 번호(OT-34.json): 0 = 22:1-2, 1 = 22:3-7, 2 = 22:8-10, 3 = 22:11-13, 4 = 22:14-17, 5 = 22:18-20, 6 = 23:1-3 */
      beatPose: function (i) { setPhase(['work', 'sentDone', 'book', 'tear', 'huldah', 'report', 'covenant'][i] || 'work'); },
      update: function (dt, now) {
        pt += dt; wt += dt;
        if (Math.abs(tod - todWant) > 0.003) { tod += (todWant - tod) * Math.min(1, dt * 0.35); applyTod(); }
        var cov = phase === 'covenant';
        /* 일꾼: 더미에서 벽으로 나르고 빈손으로 돌아온다 */
        if (!cov) workers.forEach(function (o) {
          if (o.b) {
            var len = Math.hypot(o.b[0] - o.a[0], o.b[1] - o.a[1]), per = len / 1.5, u = (wt / per + o.ph * 2) % 2, go = u < 1, f = go ? u : 2 - u, e = Math.min(1, Math.max(0, (f - 0.04) / 0.92));
            var x = o.a[0] + (o.b[0] - o.a[0]) * e, z = o.a[1] + (o.b[1] - o.a[1]) * e, mv = f > 0.04 && f < 0.96;
            setAt(o, x, z, Math.atan2((o.b[0] - o.a[0]) * (go ? 1 : -1), (o.b[1] - o.a[1]) * (go ? 1 : -1)), 0); o.load.visible = go; if (o.update) o.update(dt, mv ? 1 : 0);
          } else {
            if (o.kind === 'saw') o.group.rotation.x = 0.16 + Math.sin(wt * 4.2) * 0.1;
            if (o.kind.indexOf('mason') === 0) o.group.rotation.x = 0.05 + Math.sin(wt * 1.7 + o.a[0]) * 0.05;
            if (o.update) o.update(dt, 0);
          }
        });
        /* 길을 오가는 사람들 */
        crowd.forEach(function (o) {
          if (cov) {
            var u = Math.min(1, Math.max(0, (pt * 2.2 - (o.k % COLS) * 0.12) / 11)), x = o.from[0] + (o.home[0] - o.from[0]) * u, z = o.from[1] + (o.home[1] - o.from[1]) * u;
            setAt(o, x, z, Math.PI, 0); if (o.update) o.update(dt, u < 1 ? 1 : 0);
          } else if (o.k >= 56) {
            var span = o.walkB - o.walkA, s = (wt * o.walkS + o.walkP) % (span * 2), fw = s < span, wx = o.walkA + (fw ? s : span * 2 - s);
            setAt(o, wx, o.walkZ, fw ? Math.PI / 2 : -Math.PI / 2, 0); if (o.update) o.update(dt, 1);
          }
        });
        if (phase === 'sent') { walk(shaphan, UP, pt * 3.2, -Math.PI / 2, dt); if (pt * 3.2 >= UP.tot) hilkiah.group.rotation.y = Math.PI / 2; }
        if (phase === 'book') {
          bookWith = pt < 2.6 ? hilkiah : shaphan;                               /* 22:8 힐기야가 책을 사반에게 준다. 사반이 읽는다 */
          if (pt > 5.2) walk(shaphan, DOWN, (pt - 5.2) * 3.4, Math.PI / 2, dt);  /* 22:9-10 왕에게 돌아가 왕 앞에서 읽는다 */
          if (pt > 6) hilkiah.group.rotation.y = 0;
        }
        if (phase === 'tear') {
          lean += ((pt > 2.6 ? 0.22 : 0) - lean) * Math.min(1, dt * 2.2); king.group.rotation.x = lean;   /* 22:11 멀리서, 몸을 숙이는 데까지만 */
          if (pt > 4.5 && pt <= 11) {                                                                     /* 22:12 다섯 사람이 왕 앞에 모인다 */
            walk(hilkiah, HIL_IN, (pt - 4.5) * 3.0, Math.PI / 2, dt);
            var e2 = sm(4.5, 8, pt); [2, 3, 4].forEach(function (n) { var a = ATT0[n], b = GATHER[n], x = a[0] + (b[0] - a[0]) * e2, z = a[1] + (b[1] - a[1]) * e2; setAt(FIVE[n], x, z, e2 < 1 ? Math.atan2(b[0] - a[0], b[1] - a[1]) : Math.PI / 2); if (FIVE[n].update) FIVE[n].update(dt, e2 > 0 && e2 < 1 ? 1 : 0); });
          }
          if (pt > 11) FIVE.forEach(function (o, n) { walk(o, LEAVE[n], Math.max(0, (pt - 11 - n * 0.5) * 3.0), -Math.PI / 2, dt); });   /* 22:14 떠난다 */
        }
        if (phase === 'report') FIVE.forEach(function (o, n) { walk(o, BACK[n], pt * 3.4, Math.PI / 2, dt); });
        if (king.update) king.update(dt, false);
        keepers.forEach(function (o) { if (o.update) o.update(dt, 0); });
        placeBook();
      },
      audio: function (A) { A.setFlock(999); A.setFire(999); },
      menuCam: function (camera, now) { var a = now * 0.05; camera.position.set(Math.sin(a) * 12, TH + 7, 8); camera.lookAt(0, TH + 5, FRONT_Z); },
      debug: { phase: function () { return { phase: phase, pt: pt, tod: tod, lean: lean }; }, arrived: function () { return phase !== 'work'; } }
    };
  };
})();
