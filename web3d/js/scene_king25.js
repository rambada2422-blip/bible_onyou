/* 3D 장면 설정: OT-25 백성이 왕을 구하고 사울이 왕이 됨 (삼상 8:4-22, 10:17-25).
 * 방향: 미스바 언덕 위. 북쪽(-Z)에 작은 성읍, 그 남쪽의 넓은 빈터에 백성이 지파대로 모여 북쪽(사무엘)을 보고 선다. 빈터 서쪽에 짐(행구) 더미.
 *   아이들은 빈터 남쪽 가장자리와 둘레 길에서만 다닌다(모인 사람들 사이로 가지 않는다).
 *   라마(사무엘의 집, 7:17, 8:4)는 같은 화면 세계의 먼 곳(서남쪽 RAMA)에 두고 타임머신 창 너머로만 본다(아이들은 화면에 없음).
 * 아이들이 다니는 때: 사무엘이 백성을 미스바로 불러 모을 때(10:17). 라마의 일(8:4-22)은 그보다 앞의 일로, 지켜보기 처음 네 대목에서 창 너머로 본다.
 * 본문에 맞춘 점 (content/ot/OT-25.json design3d)
 *  - 8:4-5: 장로들이 모여 라마의 사무엘 집 앞으로 와서 선다. 8:6: 사무엘은 집 곁으로 조금 떨어져 서 있기만 하고, 8:21: 집 쪽으로 돌아서 서 있기만 한다
 *    (기도하는 말과 몸짓은 만들지 않는다. 몸을 숙이지도 않는다).
 *    하나님의 말씀은 글로만. 8:11-18의 왕의 일은 미리 알려 준 말이라 그리지 않는다. 8:22: 장로들이 각기 성읍으로 돌아간다.
 *  - 10:17-19: 백성이 지파대로 열두 무리로 모여 있고, 사무엘이 그 앞에 서 있다. 여호와 앞에는 아무것도 그리지 않는다(단·궤·장막 없음).
 *  - 10:20-23: 지파와 가족과 사울이 어떻게 뽑혔는지는 그리지 않는다. 사울은 짐 더미 뒤에 몸을 낮추고 있다가, 두 사람이 달려가 데려오면 백성 가운데 선다.
 *    앞줄 사람들 곁에 서서 다른 사람보다 어깨 위만큼 크다(무리 모형을 키 크게). 숨은 까닭을 보여 주는 표정과 몸짓은 없다.
 *  - 사람들은 무리 사이의 빈 길(통로)로만 오가고, 올 때는 앞줄부터, 갈 때는 뒷줄부터 움직여 서로 겹치거나 서 있는 사람을 뚫고 지나가지 않는다.
 *  - 10:24-25: 만세를 외치는 소리는 만들지 않는다. 사무엘은 나라의 제도를 적은 책(작은 두루마리, 글자 없음)을 들고 있다. 책을 두는 자리는 그리지 않는다.
 *    백성은 각기 집으로 돌아간다(남쪽 길로 가는 사람들은 아이들 곁을 지난다: 돕기 '길 비켜 주기').
 * 감수가 필요한 설정: 미스바의 생김새(언덕 위 작은 성읍과 남쪽 빈터)와 라마의 생김새(사무엘의 집과 앞마당), 두 곳을 같은 화면 세계에 둔 것,
 *   사무엘의 생김새(tools/blender/people/samuel.json: 늙음, 흰 수염, 어두운 겉옷, 지팡이 없음), 8:6에 집 곁에 떨어져 서 있고 8:21에 집 쪽으로 돌아서 있는 것,
 *   장로들의 수(10)와 오는 길, 미스바에 모인 백성을 열두 무리 마흔여덟 사람(모두 남자)으로 줄여 둔 것과 선 자리, 모여 오는 길과 돌아가는 길,
 *   짐 더미의 자리와 생김새, 사울의 생김새(무리 모형을 1.14배)와 짐 뒤에 몸을 낮춘 모습, 사울을 데려온 두 사람, 사울이 선 자리(앞줄 곁, 백성 쪽을 봄),
 *   사무엘이 든 책의 꼴, 사울도 다른 사람들과 함께 돌아가는 것(10:26 기브아는 범위 밖), 날씨와 때(맑은 낮),
 *   재료(양털 한 줌 8:17 — 서남쪽 길가, 가죽 끈 조각 10:22 — 동쪽 길가, 질그릇 조각 10:17 — 모이는 자리 남쪽 길가. 누구의 것인지 정하지 않음),
 *   라마의 사람들에게 그림자가 없는 것(해의 그림자는 아이들 둘레만 그린다).
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  BO3D.scene3d = BO3D.scene3d || {};
  if (!(BO3D.c3d && BO3D.c3d.on('OT-25'))) return;   /* design3d.build가 false면 이야기 카드로만 간다 */
  BO3D.scene3d['OT-25'] = function (api) {
    var T = THREE, M2 = BO3D.models2 || {}, MO = BO3D.models || {}, PR = BO3D.props, FX = api.FX, C3 = BO3D.c3d, R = PR.rng(2511), sm = C3.sm, noise = C3.noise, hash = C3.hash, i, k;
    var RAMA = [-230, 170], SAM_M = [0, -27], SAUL_AT = [-2.6, -19.4], BAG = [-24, -15], SAUL_HIDE = [-25.8, -15.6], SROAD = -4;
    function rp(dx, dz) { return [RAMA[0] + dx, RAMA[1] + dz]; }
    var SAM_R = rp(0, -1.6), PRAY_R = rp(-9, -3.4);
    function height(x, z) {
      var r = Math.hypot(x, z), dr = Math.hypot(x - RAMA[0], z - RAMA[1]), keepR = 1 - sm(40, 75, dr);
      return 0.18 * noise(x * 0.08 + 5, z * 0.08 + 2) - 5 * sm(70, 150, r) * (1 - keepR) + 16 * sm(150, 280, r) * noise(x * 0.015, z * 0.015) * (1 - keepR);
    }
    function walkable(x, z) { return x >= -34 && x <= 34 && z >= 0 && z <= 30; }
    function angTo(a, b, k) { return b + Math.atan2(Math.sin(a - b), Math.cos(a - b)) * k; }

    var scene = new T.Scene();
    scene.background = new T.Color('#EAE2CC'); scene.fog = new T.Fog('#EAE2CC', 80, 300);
    var skyG = new T.SphereGeometry(600, 24, 14), sp = skyG.attributes.position, sc = new Float32Array(sp.count * 3), cc = new T.Color(), top = new T.Color('#7DAED2'), hor = new T.Color('#F2E8CE');
    for (i = 0; i < sp.count; i++) { var tt = Math.max(0, sp.getY(i) / 600); cc.copy(hor).lerp(top, sm(0.02, 0.7, tt)); sc[i * 3] = cc.r; sc[i * 3 + 1] = cc.g; sc[i * 3 + 2] = cc.b; }
    skyG.setAttribute('color', new T.BufferAttribute(sc, 3));
    scene.add(new T.Mesh(skyG, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false })));
    var g = new T.PlaneGeometry(640, 640, 160, 160); g.rotateX(-Math.PI / 2);
    var pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color(), s1 = new T.Color('#C2B07E'), s2 = new T.Color('#A99C70'), lane = new T.Color('#D2C29C'), field = new T.Color('#C9B98A');
    for (i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i), y = height(x, z); pos.setY(i, y);
      c.copy(s1).lerp(s2, noise(x * 0.05, z * 0.05));
      if (Math.abs(x) < 30 && z > -36 && z < 0) c.lerp(field, 0.6);                                                       /* 모이는 빈터 */
      if (walkable(x, z) || (Math.abs(x - SROAD) < 3.2 && z > 0 && z < 100) || (Math.abs(z - 19) < 3 && x < -28 && x > -100) || (Math.abs(z - 23) < 3 && x > 28 && x < 100)) c.lerp(lane, 0.7);   /* 남·서·동쪽 길 */
      var dr = Math.hypot(x - RAMA[0], z - RAMA[1]); if (dr < 22) c.lerp(lane, 0.5 * (1 - dr / 22));                         /* 라마의 앞마당 */
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals();
    var ground = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 })); ground.receiveShadow = true; scene.add(ground);
    scene.add(new T.HemisphereLight('#DCEFF2', '#A99A6A', 0.64));
    var sun = new T.DirectionalLight('#FFF0CF', 0.76); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    var ss = sun.shadow.camera; ss.left = -26; ss.right = 26; ss.top = 26; ss.bottom = -26; ss.near = 1; ss.far = 150; sun.shadow.bias = -0.0015;
    scene.add(sun); scene.add(sun.target);
    function std(cl) { return new T.MeshStandardMaterial({ color: cl, flatShading: true, roughness: 0.95 }); }
    function box(w, h, d, m, x, z, y0) { var b = new T.Mesh(new T.BoxGeometry(w, h, d), m); b.position.set(x, (y0 === undefined ? height(x, z) : y0) + h / 2, z); return b; }
    function v3(x, y, z) { return new T.Vector3(x, y, z); }

    /* 미스바 성읍(본문에 생김새 없음): 북쪽의 단순한 네모 집들 */
    var houseM = [std('#E0C99C'), std('#D4BA8E'), std('#E6D3AA')], roofM = std('#BDA37A'), hs = [];
    function block(x0, x1, z0, z1, seed) {
      for (var hx = x0; hx < x1; hx += 7 + hash(hx, z0 + seed) * 3) for (var hz = z0; hz < z1; hz += 7 + hash(hz, x0 + seed) * 3) {
        var w = 4.8 + hash(hx, hz) * 2.4, d = 4.8 + hash(hz, hx) * 2.4, h = 3 + hash(hx + 3, hz) * 2.6, m = houseM[Math.floor(hash(hx, hz + 7) * 3)];
        if (hx + w > x1 || hz + d > z1) continue;
        var cx = hx + w / 2, cz = hz + d / 2;
        hs.push(box(w, h, d, m, cx, cz)); hs.push(box(w + 0.3, 0.3, d + 0.3, roofM, cx, cz, height(cx, cz) + h));
      }
    }
    block(-46, 46, -82, -42, 0);
    /* 라마: 사무엘의 집(7:17)과 둘레의 집 몇 채. 단순한 꼴 */
    hs.push(box(9, 4.4, 6, houseM[1], RAMA[0], RAMA[1] - 6)); hs.push(box(9.4, 0.35, 6.4, roofM, RAMA[0], RAMA[1] - 6, height(RAMA[0], RAMA[1] - 6) + 4.4));
    hs.push(box(1.6, 2.6, 0.2, std('#3A2E24'), RAMA[0], RAMA[1] - 2.95));
    [[-18, -10], [16, -12], [-20, 8], [20, 6], [-6, -22], [10, -24]].forEach(function (o, n) { var hx = RAMA[0] + o[0], hz = RAMA[1] + o[1], w = 6 + hash(n, 3) * 2, h = 3.4 + hash(n, 5) * 1.6; hs.push(box(w, h, 5.5, houseM[n % 3], hx, hz)); hs.push(box(w + 0.3, 0.3, 5.8, roofM, hx, hz, height(hx, hz) + h)); });
    scene.add(C3.merge(hs));

    /* 짐(행구, 10:22): 빈터 서쪽의 보따리와 자루 더미. 무엇을 담았는지는 본문에 없다 */
    var bagM = [std('#A88A5E'), std('#8E7650'), std('#C2A878'), std('#7A6448')], bags = [];
    for (i = 0; i < 16; i++) {
      var bx = BAG[0] + (hash(i, 1) - 0.5) * 6, bz = BAG[1] + (hash(i, 2) - 0.5) * 4.5, bm = bagM[i % 4];
      if (bx < -23.6 && bz < -14.4) continue;   /* 사울이 숨은 곳과 그가 나오는 북쪽 길은 비운다 */
      if (i % 3 === 0) { var cy = new T.Mesh(new T.CylinderGeometry(0.34, 0.4, 0.9 + hash(i, 4) * 0.4, 8), bm); cy.position.set(bx, height(bx, bz) + 0.5, bz); bags.push(cy); }
      else bags.push(box(0.8 + hash(i, 3) * 0.6, 0.55 + hash(i, 4) * 0.5, 0.6 + hash(i, 5) * 0.4, bm, bx, bz));
    }
    for (i = 0; i < 5; i++) bags.push(box(1.0, 0.7, 0.7, bagM[(i + 1) % 4], SAUL_HIDE[0] + 1.3 + (i % 3) * 0.6, SAUL_HIDE[1] - 0.8 + i * 0.4));   /* 몸을 낮춘 사울 앞을 가리는 짐 */
    scene.add(C3.merge(bags));

    /* 둘레의 땅(멀리): 바위와 떨기만 */
    var deco = [];
    if (MO.rock) for (i = 0; i < 34; i++) { var ro = MO.rock(2530 + i), rx = -180 + R() * 360, rz = -180 + R() * 360; if (Math.abs(rx) < 60 && rz > -90 && rz < 60) continue; ro.scale.multiplyScalar(0.8 + R() * 1.6); ro.position.set(rx, height(rx, rz) - 0.1, rz); deco.push(ro); }
    if (MO.shrub) for (i = 0; i < 40; i++) { var sh = MO.shrub(250 + i), sx = -170 + R() * 340, sz = -170 + R() * 340; if (Math.abs(sx) < 50 && sz > -90 && sz < 40) continue; sh.position.set(sx, height(sx, sz), sz); deco.push(sh); }
    if (MO.shrub) for (i = 0; i < 10; i++) { var sh2 = MO.shrub(300 + i), ax = RAMA[0] + (R() - 0.5) * 60, az = RAMA[1] + (R() - 0.5) * 60; if (Math.hypot(ax - RAMA[0], az - RAMA[1]) < 16) continue; sh2.position.set(ax, height(ax, az), az); deco.push(sh2); }
    if (deco.length) scene.add(C3.merge(deco));

    /* 사람 */
    function man(seed, opt) { var o = null; try { if (M2.israelite) o = M2.israelite(seed, opt || { kind: 'man', carry: 'none' }); } catch (e) { o = null; } if (!o) o = PR.soldier(seed, '#7A6A54', null); o.group.rotation.order = 'YXZ'; scene.add(o.group); return o; }
    function setAt(o, x, z, ry) { o.group.position.set(x, height(x, z), z); if (ry !== undefined) o.group.rotation.y = ry; }
    function mkPath(pts) { var L = [], tot = 0; for (var n = 0; n + 1 < pts.length; n++) { var l = Math.hypot(pts[n + 1][0] - pts[n][0], pts[n + 1][1] - pts[n][1]); L.push(l); tot += l; } return { p: pts, L: L, tot: tot }; }
    function pathAt(P, s) { s = Math.min(P.tot, Math.max(0, s)); for (var n = 0; n < P.L.length; n++) { if (s <= P.L[n] || n === P.L.length - 1) { var u = P.L[n] ? Math.min(1, s / P.L[n]) : 1, a = P.p[n], b = P.p[n + 1]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, Math.atan2(b[0] - a[0], b[1] - a[1])]; } s -= P.L[n]; } var e = P.p[P.p.length - 1]; return [e[0], e[1], 0]; }
    function walk(o, P, s, endRy, dt) { var w = pathAt(P, s), mv = s > 0 && s < P.tot; o.group.visible = true; setAt(o, w[0], w[1], mv || endRy === undefined ? w[2] : endRy); if (o.update) o.update(dt, mv ? 1 : 0); return mv; }
    function still(o) { if (o.update) o.update(0.016, 0); }
    function rev(P) { return mkPath(P.p.slice().reverse()); }

    var sam = { group: api.fallback('#5E5A6E', 1.75, 0.27), update: function () {} }; sam.group.rotation.order = 'YXZ'; scene.add(sam.group);
    api.person('samuel', function (nm) { nm.group.rotation.order = 'YXZ'; nm.group.position.copy(sam.group.position); nm.group.rotation.copy(sam.group.rotation); nm.group.visible = sam.group.visible; scene.remove(sam.group); scene.add(nm.group); sam = nm; });
    var book = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.34, 8), std('#E8DCC0')); book.rotation.z = Math.PI / 2; book.visible = false; scene.add(book);   /* 10:25 나라의 제도를 적은 책(글자 없음) */
    var saul = man(2591, { kind: 'man', carry: 'none' }); saul.group.scale.multiplyScalar(1.14);   /* 9:2, 10:23 어깨 위만큼 더 크다 */

    /* 미스바에 모인 백성(10:17-19): 지파대로 열두 무리, 무리마다 네 사람. 북쪽(사무엘)을 보고 선다 */
    var GX = [-13.5, -4.5, 4.5, 13.5], GZ = [-18.5, -12.8, -7.1], crowd = [];
    for (k = 0; k < 12; k++) {
      var gx = GX[k % 4] + (hash(k, 1) - 0.5) * 0.8, gz = GZ[Math.floor(k / 4)];
      for (i = 0; i < 4; i++) {
        var o = man(k * 41 + i * 7 + 2600, { kind: 'man', carry: 'none' }), spot = [gx + (i % 2 ? 0.65 : -0.65) + (hash(k, i) - 0.5) * 0.25, gz + (i < 2 ? -0.65 : 0.65)];
        o.spot = spot; o.grp = k;
        /* 무리 사이의 빈 길(통로)로만 다닌다: 통로를 따라 줄 사이까지 와서 옆으로 들어간다. 사람마다 길을 조금씩 비켜 겹치지 않게 */
        var j = (hash(k, i + 4) - 0.5) * 0.6, A0 = (gx < -9 ? -18.2 : gx < 0 ? -9 : gx < 9 ? 9 : 18.2), A = A0 + j, rowZ = gz + 2.85 + j * 0.3, src;
        var near = A0 > gx ? i % 2 === 1 : i % 2 === 0;   /* 통로 쪽에 선 사람 */
        if (gx < -6) src = [[-82 - k, 19 + j], [-30 + j, 19 + j * 0.5], [A, 1 + j]];
        else if (gx > 6) src = [[82 + k, 23 + j], [30 + j, 23 + j * 0.5], [A, 1 + j]];
        else { var lane = SROAD + (gx > 0 ? 1.2 : -1.2) + j * 0.5, tz = (gx > 0 ? 0.3 : 1.9) + j * 0.3; src = [[lane, 84 + k], [lane, tz], [A, tz]]; }   /* 남쪽 길은 동쪽으로 갈 줄과 서쪽으로 갈 줄을 나눈다 */
        o.IN = mkPath(src.concat([[A, rowZ], [spot[0], rowZ], spot])); o.OUT = rev(o.IN);
        o.wait = Math.floor(k / 4) * 7 + (k % 4) * 1.6 + ((i < 2 ? 0 : 2) + (near ? 1 : 0)) * 1.2;          /* 올 때는 앞줄부터, 무리 안에서는 통로에서 먼 사람부터 1.2초씩 */
        o.leave = (2 - Math.floor(k / 4)) * 6 + (k % 4) * 1.3 + ((i >= 2 ? 0 : 2) + (near ? 0 : 1)) * 1.3;   /* 갈 때는 뒷줄부터, 통로에 가까운 사람부터 1.3초씩 */
        o.group.visible = false; crowd.push(o);
      }
    }
    var RUN = [crowd[0], crowd[1]];   /* 10:23 달려가서 사울을 데려온 사람들(누구인지는 본문에 없음) */
    /* 라마에 모여 온 장로들(8:4) */
    var elders = [];
    for (i = 0; i < 10; i++) {
      var e = man(i * 53 + 2700, { kind: 'man', carry: 'none' }), es = rp(-6 + (i % 5) * 3 + (hash(i, 3) - 0.5) * 0.6, 5.2 + Math.floor(i / 5) * 2.3);
      e.spot = es; e.IN = mkPath([rp(18 + i * 0.8, 16 + (i % 3)), rp(8 + (hash(i, 7) - 0.5) * 4, 8.5 + (hash(i, 8) - 0.5) * 3), es]); e.OUT = rev(e.IN); e.wait = i * 0.55; e.group.visible = false; elders.push(e);
    }
    var EVIA = rp(8, 8.5); elders.slice().sort(function (a, b) { return Math.hypot(a.spot[0] - EVIA[0], a.spot[1] - EVIA[1]) - Math.hypot(b.spot[0] - EVIA[0], b.spot[1] - EVIA[1]); }).forEach(function (o, n) { o.go = n * 0.9; });   /* 8:22 길에 가까운 사람부터 떠난다 */
    /* 10:22-23: 두 사람은 짐 더미 동쪽(상자 밖)에 서고, 사울은 짐 북쪽으로 나와 앞줄 곁에 선다. 두 사람은 제자리로 돌아간다 */
    var STOP = [[-19.6, -16.2], [-19.6, -14.9]];   /* 짐 더미(동쪽 끝 x -20.7) 밖 */
    var SAUL_GO = mkPath([SAUL_HIDE, [-25.6, -18.3], [-20.4, -18.3], [-12, -20.6], [-3.4, -20.3], SAUL_AT]), SAUL_OUT = mkPath([SAUL_AT, [0, -19.4], [0, 1], [SROAD, 1], [SROAD, 90]]);
    var RUN_TO = RUN.map(function (o, n) { return mkPath([o.spot, [o.spot[0], o.spot[1] - 1.6], STOP[n]]); });
    var RUN_BACK = RUN.map(function (o, n) { return mkPath([STOP[n], [-17.5, -21.0], [o.spot[0], -21.0], o.spot]); });
    var SAM_PRAY = mkPath([SAM_R, rp(-5, -1.2), PRAY_R]), SAM_BACK = rev(SAM_PRAY);

    var phase = 'gather', pt = 0;
    function placeAll() { crowd.forEach(function (o) { setAt(o, o.spot[0], o.spot[1], Math.PI); o.group.visible = true; still(o); }); }
    /* 대목마다 모든 상태를 처음부터 정한다('이전'으로 돌아와도 뒤 대목의 것이 남지 않게) */
    function setPhase(p) {
      phase = p; pt = 0;
      var rama = p.charAt(0) === 'r';
      crowd.forEach(function (o) { o.group.visible = false; });
      elders.forEach(function (o) { o.group.visible = false; });
      saul.group.visible = false; book.visible = false; sam.group.rotation.x = 0;
      if (rama) {
        setAt(sam, SAM_R[0], SAM_R[1], 0); sam.group.visible = true; still(sam);
        if (p !== 'r_come') elders.forEach(function (o) { setAt(o, o.spot[0], o.spot[1], Math.PI); o.group.visible = true; still(o); });
      } else {
        setAt(sam, SAM_M[0], SAM_M[1], 0); sam.group.visible = true; still(sam);
        if (p !== 'gather') placeAll();
        if (p === 'm_saul') { saul.group.visible = true; setAt(saul, SAUL_HIDE[0], SAUL_HIDE[1], Math.PI / 2); saul.group.position.y -= 0.62; still(saul); }   /* 10:22 짐 사이에 숨어 있다 */
        if (p === 'm_send') { saul.group.visible = true; setAt(saul, SAUL_AT[0], SAUL_AT[1], 0); still(saul); book.visible = true; }
        if (p === 'm_saul') RUN.forEach(function (o) { setAt(o, o.spot[0], o.spot[1], Math.PI); });
      }
    }
    if (window.BO3D_TEST) C3.t25 = { skip: function (sec) { pt += sec; } };   /* 시험에서 때를 건너뛰어 볼 때만 쓴다 */
    if (FX) FX.sortLayers(scene);
    setPhase('gather');

    return {
      id: 'OT-25', placeLabel: '미스바', scene: scene, sun: sun, sunOff: [-30, 50, 30],
      height: height, walkable: walkable,
      edge: function (x, z) {
        if (z < 0) return { who: 'onwoo', text: '모인 사람들 쪽으로는 가지 말자. 우리는 가장자리에서 지켜보는 사람이야.' };
        if (Math.abs(x) > 34) return { who: 'hyu', text: '이 길 끝까지만 가자.' };
        return { who: 'hyu', text: '남쪽 가장자리와 길가에서만 다니자.' };
      },
      P: { start: [8, 22], machine: [15, 26], machineRot: 0.4,
        /* 재료가 놓인 곳(quests[i].found): 서남쪽 길가 / 동쪽 가장자리 / 모이는 자리 남쪽 길가. 사무엘(0, -27)과 무리(z -19 ~ -6)에서 떨어진 곳 */
        parts: [[-27, 27], [31, 8], [14, 4]], lookSpot: [14, 4],   /* 사람들이 오가는 길(남쪽 길 x -4, 서·동쪽 길과 꺾이는 곳)에서 떨어진 곳 */
        look: { focus: [0, -24], mid: [2, -12], dy: 2.5, backE: 10, upE: 5 } },
      eventCam: function (i) {
        if (i === 0) return { pos: [RAMA[0] - 12, height(RAMA[0], RAMA[1]) + 10, RAMA[1] + 30], look: [RAMA[0] + 2, 1.6, RAMA[1] + 2] };   /* 창 너머: 라마(장로들이 동쪽에서 온다) */
        if (i === 1) return { pos: [RAMA[0] + 6, height(RAMA[0], RAMA[1]) + 8, RAMA[1] + 22], look: [RAMA[0] - 4, 1.6, RAMA[1] - 1] };
        if (i === 2 || i === 3) return { pos: [RAMA[0] + 10, height(RAMA[0], RAMA[1]) + 8, RAMA[1] + 22], look: [RAMA[0] - 1, 1.6, RAMA[1] + 1] };
        if (i === 5) { var sp = saul.group.position; return { pos: [-4, height(-4, 2) + 7, 2], look: [sp.x, sp.y + 1.2, sp.z] }; }   /* 10:22-23 짐 더미에서 백성 가운데로 오는 사울을 따라 본다 */
        return null;
      },
      eventLook: function () { return null; },   /* 짐 더미와 무리 앞이 함께 보이게 */
      kidsHidden: function (i) { return i <= 3; },
      beatNote: function (i) {
        if (i === 0) return '타임머신 창 너머로, 미스바에 모이기 전에 라마에서 있었던 일을 멀리서 봐요.';
        if (i === 1) return '사무엘이 기도한 말과 하나님의 말씀은 소리나 빛으로 만들지 않고 글로만 읽어요.';
        if (i === 2) return '사무엘이 말한 왕의 일은 미리 알려 준 말이라 그림으로 만들지 않았어요.';
        if (i === 4) return '다시 미스바예요. 백성이 지파대로 모였어요.';
        if (i === 5) return '어떻게 뽑혔는지는 성경에 적혀 있지 않아 그리지 않았어요.';
        if (i === 6) return '만세를 외치는 소리는 만들지 않았어요.';
        return null;
      },
      helpNote: function (after) {
        if (after === 4) return '우리는 모인 백성의 남쪽 가장자리에서 함께 기다려요. 무리 사이로는 들어가지 않아요.';
        if (after === 6) return '우리는 남쪽 가장자리에서 지켜보고, 돌아가는 사람들에게는 길을 비켜 줘요.';
        return null;
      },
      detector: '탐지기', askLabel: '탐지기 물음 풀기',
      intro: { text: '타임머신이 미스바 언덕의 남쪽 길가에 내려앉았어요. 사람들이 지파대로 모여 오고 있어요.', say: { who: 'hyu', text: '모이는 자리 가운데로는 가지 말자. 남쪽 가장자리와 길가에서만 다니자.' } },
      lookText: '사무엘상 7장부터 10장까지를 성경에서 찾아 읽은 뒤 다시 골라 보세요.',
      partBeats: [], eventStart: 0,
      sceneDoneText: '백성이 각기 집으로 돌아가는 것까지 지켜봐야 떠날 수 있어요.',
      dex: [
        { id: 'samuel', name: '사무엘', desc: '늙은 선지자. 백성을 미스바로 불러 여호와 앞에 모았다', ref: '삼상 3:20, 8:5, 10:17', hint: '모인 사람들 앞(북쪽)에 선 흰 수염의 사람을 보세요.', range: 70, crop: 0.36, visible: function () { return sam.group.visible && sam.group.position.distanceTo(v3(0, 0, 0)) < 120; }, pos: function () { var p = sam.group.position; return v3(p.x, p.y + 1.1, p.z); } },
        { id: 'mizpah', name: '미스바의 모이는 자리', desc: '사무엘이 백성을 불러 여호와 앞에 모은 곳', ref: '삼상 10:17', hint: '언덕 위의 넓은 빈터를 보세요.', range: 90, pos: function () { return v3(0, 0.6, -12); } },
        { id: 'baggage', name: '짐(행구)', desc: '사울이 그 사이에 숨어 있던 짐', ref: '삼상 10:22', hint: '빈터 서쪽의 짐 더미를 보세요.', range: 70, pos: function () { return v3(BAG[0], 0.8, BAG[1]); } }
      ],
      reset: function () { setPhase('gather'); },
      partFound: function () {},
      partContinue: function () {},
      lookupPose: function () { if (phase !== 'wait') setPhase('wait'); },
      /* 대목 번호(OT-25.json): 0 = 8:4-5, 1 = 8:6-9, 2 = 8:10-18, 3 = 8:19-22, 4 = 10:17-19, 5 = 10:20-23, 6 = 10:24-25 */
      beatPose: function (i) { setPhase(['r_come', 'r_pray', 'r_tell', 'r_refuse', 'm_speak', 'm_saul', 'm_send'][i] || 'wait'); },
      update: function (dt, now) {
        pt += dt;
        if (phase === 'gather') crowd.forEach(function (o) { var s = (pt - o.wait) * 2.0; if (s > 0) walk(o, o.IN, s, Math.PI, dt); });   /* 10:17 미스바로 모여 온다 */
        if (phase === 'r_come') elders.forEach(function (o) { var s = (pt - 0.5 - o.wait) * 2.4; if (s > 0) walk(o, o.IN, s, Math.PI, dt); });   /* 8:4 */
        if (phase === 'r_pray') { if (pt < 1) still(sam); else walk(sam, SAM_PRAY, (pt - 1) * 1.1, -Math.PI / 2, dt); }   /* 8:6 조금 떨어져 선다 */
        if (phase === 'r_refuse') {
          sam.group.rotation.y = angTo(pt > 3 && pt < 6.5 ? Math.PI : 0, sam.group.rotation.y, Math.min(1, dt * 3)); still(sam);   /* 8:21 집 쪽으로 돌아서 서 있다가(고한다) 8:22 다시 장로들을 본다 */
          if (pt > 7.5) elders.forEach(function (o) { var s = (pt - 7.5 - o.go) * 2.2; if (s > 0) { if (!walk(o, o.OUT, s, undefined, dt)) o.group.visible = false; } });   /* 8:22 각기 성읍으로 */
        }
        if (phase === 'm_saul') {
          /* 10:22-23: 두 사람이 달려가 짐 사이에서 사울을 데려오고, 사울이 백성 가운데 선다 */
          var ra = 3, rb = Math.max(ra + RUN_TO[0].tot / 3.2, ra + 0.7 + RUN_TO[1].tot / 3.2), rc = rb + 1.2, rs = rc + 1.0;   /* 두 사람이 다 와서 선 뒤에 사울이 일어선다 */
          RUN.forEach(function (o, n) {
            var r0 = ra + n * 0.7, t0 = rc + 0.4 + n * 1.4;
            if (pt < r0) return;
            if (pt < r0 + RUN_TO[n].tot / 3.2 + 0.05) walk(o, RUN_TO[n], (pt - r0) * 3.2, -Math.PI / 2, dt);
            else if (pt < t0) still(o);
            else walk(o, RUN_BACK[n], (pt - t0) * 2.0, Math.PI, dt);
          });
          if (pt < rb + 0.3) { saul.group.position.y = height(SAUL_HIDE[0], SAUL_HIDE[1]) - 0.62; still(saul); }
          else if (pt < rc) { saul.group.position.y = height(SAUL_HIDE[0], SAUL_HIDE[1]) - 0.62 * (1 - sm(rb + 0.3, rc, pt)); still(saul); }   /* 일어선다 */
          else if (pt < rs) still(saul);
          else walk(saul, SAUL_GO, (pt - rs) * 2.0, 0, dt);
        }
        if (phase === 'm_send') {
          /* 10:25 사무엘이 모든 백성을 각기 집으로 보낸다 */
          crowd.forEach(function (o) { var s = (pt - 4 - o.leave) * 1.7; if (s > 0) { if (!walk(o, o.OUT, s, undefined, dt) && s > o.OUT.tot) o.group.visible = false; } });
          var su = (pt - 22) * 1.7; if (su > 0) { if (!walk(saul, SAUL_OUT, su, undefined, dt) && su > SAUL_OUT.tot) saul.group.visible = false; }
        }
        if (book.visible) { var gp = sam.group.position, ry = sam.group.rotation.y; book.position.set(gp.x + Math.sin(ry) * 0.34 + Math.cos(ry) * 0.18, gp.y + 1.02, gp.z + Math.cos(ry) * 0.34 - Math.sin(ry) * 0.18); book.rotation.y = ry; }
        if (sam.update && sam.group.visible && phase !== 'r_pray' && phase !== 'r_refuse') sam.update(dt, false);
      },
      audio: function (A) { A.setFlock(999); A.setFire(999); },   /* 기도의 말, 하나님의 말씀, 만세 소리는 소리로 만들지 않는다 */
      menuCam: function (camera, now) { var a = now * 0.05; camera.position.set(Math.sin(a) * 12, 9, 22); camera.lookAt(0, 1.5, -18); },
      debug: { phase: function () { return { phase: phase, pt: pt }; }, arrived: function () { return phase !== 'gather'; } }
    };
  };
})();
