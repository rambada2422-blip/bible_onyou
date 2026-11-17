/* 3D 장면 설정: OT-29 나라가 둘로 갈라짐 (왕상 12:1-24).
 * 방향: 세겜의 넓은 빈터. 북쪽(-Z)에 르호보암이 서고, 그 앞(남쪽)에 온 이스라엘이 지파대로 열두 무리로 모여 북쪽을 보고 선다.
 *   빈터 동쪽과 서쪽에 이스라엘 사람들의 장막(12:16)이 늘어서 있다. 빈터 서북쪽에 왕이 머문 집(본문에 없음)과 수레(12:18).
 *   아이들은 빈터 남쪽 가장자리와 그 둘레에서만 다닌다(모인 사람들 사이와 왕이 머문 집으로 가지 않는다).
 *   예루살렘(12:21-24)은 같은 화면 세계의 먼 곳(동북쪽 JRS)에 두고 타임머신 창 너머로만 본다(아이들은 화면에 없음).
 * 아이들이 다니는 때: 온 이스라엘이 르호보암을 왕으로 세우려고 세겜에 모일 때(12:1).
 * 본문에 맞춘 점 (content/ot/OT-29.json design3d)
 *  - 12:1-3: 백성이 모여 있고 여로보암이 맨 앞에 선다. 12:4-5: 사흘 뒤에 다시 오라는 말에 백성이 장막으로 물러간다(뒷줄부터).
 *  - 12:6-11: 왕이 머문 집 앞에서 노인들, 그다음 젊은 사람들과 의논한다(의논한 곳은 본문에 없음. 멀리서, 말은 글로만).
 *  - 12:12-15: 사흘 만에 백성이 다시 온다(앞줄부터). 왕의 거친 대답은 글로만. 사람들이 소리치거나 주먹을 드는 몸짓은 없다.
 *  - 12:16-20: 백성이 장막으로 돌아가고(모두 떠나기 시작한 뒤, 대목이 열리고 약 13초), 르호보암이 수레 뒤로 가서 올라 서북쪽 길로 급히 떠난다.
 *    일꾼 감독의 일(12:18)은 그리지 않는다. 12:20은 글로만.
 *  - 12:21-24: 창 너머 예루살렘. 유다와 베냐민의 용사(서른여섯으로 줄임)가 창을 세워 들고 서 있고, 르호보암이 그 앞에, 하나님의 사람 스마야가 곁에 선다.
 *    말씀은 글로만(빛과 소리 없음). 스마야가 선 뒤에 용사들이 각기 집으로 돌아간다(12:24 말씀을 듣고). 싸우는 모습은 없다. 사건 뒤에는 수레를 세겜에 두지 않는다.
 *  - 사람들은 무리 사이의 빈 길(통로)로만 오가고, 올 때는 앞줄부터·갈 때는 뒷줄부터, 무리 안에서도 1.2~1.3초씩 사이를 두어 서로 겹치지 않는다.
 * 감수가 필요한 설정: 세겜의 생김새(빈터와 동서의 장막), 왕이 머문 집과 의논한 자리(본문에 없음), 르호보암의 생김새(tools/blender/people/rehoboam.json:
 *   어른, 수염, 청록 겉옷, 왕관 없음)와 선 자리, 여로보암·스마야·노인들·젊은 사람들을 무리 모형으로 둔 것, 온 회중을 열두 무리 마흔여덟 사람(모두 남자)으로 줄인 것,
 *   백성이 장막으로 물러가고 오는 길, 수레(말 두 마리)와 떠나는 길, 예루살렘의 생김새와 용사의 수(서른여섯)와 차림(창), 스마야가 선 자리, 날씨와 때(맑은 낮),
 *   재료(해진 장막 천 12:16 — 서남쪽 길가, 부러진 나무 말뚝(장막을 박던 것) 12:16 — 동남쪽 길가, 질그릇 조각 12:1 — 모이는 자리 남쪽 길가. 누구의 것인지 정하지 않음),
 *   예루살렘 사람들에게 그림자가 없는 것(해의 그림자는 아이들 둘레만 그린다), 12:5 '백성이 가니라'를 장막으로 물러가는 것으로 그리고 12:16 '장막으로'를
 *   말 그대로 장막으로 그린 것(삼하 20:1처럼 '집으로'라는 뜻일 수 있음), 탐지기 물음에 장면 범위 밖의 왕상 11:26-28을 쓴 것, 용사의 투구,
 *   노인들과 젊은 사람들을 같은 무리 모형으로 둔 것(자리와 대목 글로만 구별), 수레가 이 장면 세계에서 서북쪽으로 떠나는 것(실제 예루살렘은 세겜의 남쪽).
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  BO3D.scene3d = BO3D.scene3d || {};
  if (!(BO3D.c3d && BO3D.c3d.on('OT-29'))) return;   /* design3d.build가 false면 이야기 카드로만 간다 */
  BO3D.scene3d['OT-29'] = function (api) {
    var T = THREE, M2 = BO3D.models2 || {}, MO = BO3D.models || {}, PR = BO3D.props, FX = api.FX, C3 = BO3D.c3d, R = PR.rng(2911), sm = C3.sm, noise = C3.noise, hash = C3.hash, i, k;
    var JRS = [210, -170], REH = [0, -27], JER = [0, -22.6], HOUSE = [-26, -46], REH_C = [-26, -40.4], CH_AT = [-7, -31], CAMP_X = 41, RT0 = 13;   /* RT0: 12:18 백성이 모두 장막 쪽으로 떠나기 시작한 뒤 왕이 수레로 간다 */
    function gapZ(z) { var gg = [-24.5, -17.5, -10.5, -3.5, 3.5, 10.5], b = gg[0]; gg.forEach(function (v) { if (Math.abs(v - z) < Math.abs(b - z)) b = v; }); return b; }   /* 장막 줄 사이 */
    function jp(dx, dz) { return [JRS[0] + dx, JRS[1] + dz]; }
    function height(x, z) {
      var r = Math.hypot(x, z), dr = Math.hypot(x - JRS[0], z - JRS[1]), keepR = 1 - sm(40, 75, dr);
      return 0.18 * noise(x * 0.08 + 7, z * 0.08 + 4) - 4 * sm(80, 150, r) * (1 - keepR) + 16 * sm(150, 280, r) * noise(x * 0.015 + 3, z * 0.015) * (1 - keepR);
    }
    function walkable(x, z) { return x >= -30 && x <= 30 && z >= 4 && z <= 28; }
    function angTo(a, b, kk) { return b + Math.atan2(Math.sin(a - b), Math.cos(a - b)) * kk; }

    var scene = new T.Scene();
    scene.background = new T.Color('#EAE2CC'); scene.fog = new T.Fog('#EAE2CC', 80, 300);
    var skyG = new T.SphereGeometry(600, 24, 14), sp = skyG.attributes.position, sc = new Float32Array(sp.count * 3), cc = new T.Color(), top = new T.Color('#7DAED2'), hor = new T.Color('#F2E8CE');
    for (i = 0; i < sp.count; i++) { var tt = Math.max(0, sp.getY(i) / 600); cc.copy(hor).lerp(top, sm(0.02, 0.7, tt)); sc[i * 3] = cc.r; sc[i * 3 + 1] = cc.g; sc[i * 3 + 2] = cc.b; }
    skyG.setAttribute('color', new T.BufferAttribute(sc, 3));
    scene.add(new T.Mesh(skyG, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false })));
    var g = new T.PlaneGeometry(640, 640, 160, 160); g.rotateX(-Math.PI / 2);
    var pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color(), s1 = new T.Color('#BFB27E'), s2 = new T.Color('#A69C6E'), lane = new T.Color('#D2C29C'), field = new T.Color('#C8B98A');
    for (i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i), y = height(x, z); pos.setY(i, y);
      c.copy(s1).lerp(s2, noise(x * 0.05, z * 0.05));
      if (Math.abs(x) < 34 && z > -34 && z < 3) c.lerp(field, 0.6);                                                        /* 모이는 빈터 */
      if (walkable(x, z) || (Math.abs(z - 1.6) < 1.8 && Math.abs(x) < 40) || (Math.abs(x) < 2.5 && z > 28 && z < 90) || (z > -37 && z < -32 && x < -8 && x > -140)) c.lerp(lane, 0.7);   /* 남쪽 가장자리 길, 남쪽 길, 수레가 떠나는 서북쪽 길 */
      var dj = Math.hypot(x - JRS[0], z - JRS[1]); if (dj < 26) c.lerp(lane, 0.5 * (1 - dj / 26));
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

    /* 이스라엘 사람들의 장막(12:16): 빈터 동쪽과 서쪽에 늘어선다. 같은 빛깔의 천은 재질 하나로 묶어 한꺼번에 그린다(휴대폰 무게) */
    var st = [], matCache = {};
    function shareMat(obj) { obj.traverse(function (m) { if (!m.isMesh) return; var key = m.material.color.getHexString() + '_' + m.material.side; if (!matCache[key]) matCache[key] = m.material; m.material = matCache[key]; }); }
    [-1, 1].forEach(function (sd) {
      for (var cx = 0; cx < 3; cx++) for (var rz = 0; rz < 6; rz++) {
        var tx = sd * (42 + cx * 8 + (hash(cx, rz + sd) - 0.5) * 1.6), tz = -28 + rz * 7 + (hash(rz, cx + sd) - 0.5) * 1.6, tn = PR.tent(2900 + cx * 7 + rz * 3 + (sd > 0 ? 50 : 0));
        tn.position.set(tx, height(tx, tz), tz); tn.rotation.y = sd * Math.PI / 2 + (hash(cx, rz) - 0.5) * 0.4; shareMat(tn); st.push(tn);
      }
    });
    /* 왕이 머문 집(본문에 없음)과 둘레의 집 몇 채 */
    var houseM = [std('#E0C99C'), std('#D4BA8E'), std('#E6D3AA')], roofM = std('#BDA37A');
    st.push(box(9, 4.4, 7, houseM[1], HOUSE[0], HOUSE[1])); st.push(box(9.4, 0.35, 7.4, roofM, HOUSE[0], HOUSE[1], height(HOUSE[0], HOUSE[1]) + 4.4)); st.push(box(1.6, 2.6, 0.2, std('#3A2E24'), HOUSE[0], HOUSE[1] + 3.55));
    [[-40, -52], [-14, -58], [2, -64], [16, -56], [-50, -62]].forEach(function (o, n) { var w = 6 + hash(n, 3) * 2, h = 3.4 + hash(n, 5) * 1.6; st.push(box(w, h, 5.5, houseM[n % 3], o[0], o[1])); st.push(box(w + 0.3, 0.3, 5.8, roofM, o[0], o[1], height(o[0], o[1]) + h)); });
    /* 예루살렘(창 너머): 성벽과 문만 단순한 꼴로 */
    var wallM = std('#CDB48A'), wallM2 = std('#BBA078');
    st.push(box(70, 8, 3, wallM, JRS[0], JRS[1] - 16, height(JRS[0], JRS[1] - 16) - 0.2)); [-4, 4].forEach(function (dx) { st.push(box(3.4, 10, 4, wallM2, JRS[0] + dx, JRS[1] - 16, height(JRS[0], JRS[1] - 16) - 0.2)); });
    var jh = jp(0, -28); st.push(box(60, 5, 18, houseM[0], jh[0], jh[1], height(jh[0], jh[1])));
    scene.add(C3.merge(st));
    var deco = [];
    if (MO.rock) for (i = 0; i < 34; i++) { var ro = MO.rock(2930 + i), rx = -180 + R() * 360, rz2 = -180 + R() * 360; if (Math.abs(rx) < 70 && rz2 > -80 && rz2 < 50) continue; ro.scale.multiplyScalar(0.8 + R() * 1.6); ro.position.set(rx, height(rx, rz2) - 0.1, rz2); deco.push(ro); }
    if (MO.shrub) for (i = 0; i < 40; i++) { var sh = MO.shrub(290 + i), sx = -170 + R() * 340, sz = -170 + R() * 340; if (Math.abs(sx) < 66 && sz > -80 && sz < 40) continue; sh.position.set(sx, height(sx, sz), sz); deco.push(sh); }
    if (deco.length) scene.add(C3.merge(deco));

    /* 사람 */
    function man(seed, opt) { var o = null; try { if (M2.israelite) o = M2.israelite(seed, opt || { kind: 'man', carry: 'none' }); } catch (e) { o = null; } if (!o) o = PR.soldier(seed, '#7A6A54', null); o.group.rotation.order = 'YXZ'; scene.add(o.group); return o; }
    function setAt(o, x, z, ry) { o.group.position.set(x, height(x, z), z); if (ry !== undefined) o.group.rotation.y = ry; }
    function mkPath(pts) { var L = [], tot = 0; for (var n = 0; n + 1 < pts.length; n++) { var l = Math.hypot(pts[n + 1][0] - pts[n][0], pts[n + 1][1] - pts[n][1]); L.push(l); tot += l; } return { p: pts, L: L, tot: tot }; }
    function pathAt(P, s) { s = Math.min(P.tot, Math.max(0, s)); for (var n = 0; n < P.L.length; n++) { if (s <= P.L[n] || n === P.L.length - 1) { var u = P.L[n] ? Math.min(1, s / P.L[n]) : 1, a = P.p[n], b = P.p[n + 1]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, Math.atan2(b[0] - a[0], b[1] - a[1])]; } s -= P.L[n]; } var e = P.p[P.p.length - 1]; return [e[0], e[1], 0]; }
    function walk(o, P, s, endRy, dt) { var w = pathAt(P, s), mv = s > 0 && s < P.tot; o.group.visible = true; setAt(o, w[0], w[1], mv || endRy === undefined ? w[2] : endRy); if (o.update) o.update(dt, mv ? 1 : 0); return mv; }
    function still(o) { if (o.update) o.update(0.016, 0); }
    function rev(P) { return mkPath(P.p.slice().reverse()); }

    var reh = { group: api.fallback('#2E5A62', 1.75, 0.27), update: function () {} }; reh.group.rotation.order = 'YXZ'; scene.add(reh.group);
    api.person('rehoboam', function (nm) { nm.group.rotation.order = 'YXZ'; nm.group.position.copy(reh.group.position); nm.group.rotation.copy(reh.group.rotation); nm.group.visible = reh.group.visible; scene.remove(reh.group); scene.add(nm.group); reh = nm; });
    var jer = man(2971, { kind: 'man', carry: 'none' }), shem = man(2983, { kind: 'man', carry: 'none' });
    var chariot = PR.chariot(2991); chariot.group.position.set(CH_AT[0], height(CH_AT[0], CH_AT[1]), CH_AT[1]); chariot.group.rotation.y = -Math.PI / 2; scene.add(chariot.group);   /* 12:18 르호보암의 수레 */
    var CH_GO = mkPath([CH_AT, [-36, -34.5], [-140, -40]]), REH_TO_CH = mkPath([REH, [-2.2, -29.4], [-3.9, -31]]);   /* 수레 뒤로 가서 서쪽으로 오른다(바퀴 사이) */

    /* 온 회중(12:1, 12:3): 지파대로 열두 무리, 무리마다 네 사람. 무리 사이의 빈 길로만 동서의 장막과 오간다 */
    var GX = [-13.5, -4.5, 4.5, 13.5], GZ = [-18.5, -12.8, -7.1], crowd = [];
    for (k = 0; k < 12; k++) {
      var gx = GX[k % 4] + (hash(k, 1) - 0.5) * 0.8, gz = GZ[Math.floor(k / 4)], sd = gx < 0 ? -1 : 1;
      for (i = 0; i < 4; i++) {
        var o = man(k * 43 + i * 11 + 3000, { kind: 'man', carry: 'none' }), spot = [gx + (i % 2 ? 0.65 : -0.65) + (hash(k, i) - 0.5) * 0.25, gz + (i < 2 ? -0.65 : 0.65)];
        var j = (hash(k, i + 4) - 0.5) * 0.6, A0 = (gx < -9 ? -18.2 : gx < 0 ? -9 : gx < 9 ? 9 : 18.2), A = A0 + j, rowZ = gz + 2.85 + j * 0.3, near = A0 > gx ? i % 2 === 1 : i % 2 === 0, out;
        var lz = Math.abs(gx) > 9 ? rowZ : 1.0 + j * 0.3;
        if (Math.abs(gx) > 9) out = [spot, [spot[0], rowZ], [A, rowZ], [sd * 36, lz]];                  /* 바깥 무리는 줄 사이로 곧장 장막 쪽으로 */
        else out = [spot, [spot[0], rowZ], [A, rowZ], [A, lz], [sd * 36, lz]];                            /* 가운데 무리는 통로로 남쪽 가장자리까지 나와 장막 쪽으로 */
        out.push([sd * CAMP_X, gapZ(lz) + j * 0.3]);                                                      /* 장막 천 속이 아니라 장막 사이로 들어가고 나온다 */
        o.spot = spot; o.OUT = mkPath(out); o.IN = rev(o.OUT);
        o.wait = Math.floor(k / 4) * 7 + (k % 4) * 1.6 + ((i < 2 ? 0 : 2) + (near ? 1 : 0)) * 1.2;          /* 올 때는 앞줄부터, 무리 안에서는 통로에서 먼 사람부터 */
        o.leave = (2 - Math.floor(k / 4)) * 6 + (k % 4) * 1.3 + ((i >= 2 ? 0 : 2) + (near ? 0 : 1)) * 1.3;   /* 갈 때는 뒷줄부터, 통로에 가까운 사람부터 */
        o.group.visible = false; crowd.push(o);
      }
    }
    var ARR_T = Math.max.apply(null, crowd.map(function (o) { return o.wait + o.IN.tot / 2.0; })), ARR_R = Math.max.apply(null, crowd.map(function (o) { return o.wait * 0.4 + o.IN.tot / 2.8; }));
    var JER_OUT = mkPath([JER, [0, 2.4], [36, 2.4], [CAMP_X, 3.5]]), JER_IN = rev(JER_OUT);   /* 여로보암은 가운데 통로로(백성과 함께 오고, 12:16에는 백성보다 나중에 간다) */
    /* 노인들(12:6)과 젊은 사람들(12:8): 왕이 머문 집 앞 */
    function counsel(seed) { var arr = []; for (var n = 0; n < 6; n++) { var cm = man(seed + n * 13, { kind: 'man', carry: 'none' }); cm.spot = [REH_C[0] - 2.6 + (n % 3) * 2.6 + (hash(n, seed) - 0.5) * 0.4, REH_C[1] + 3.2 + Math.floor(n / 3) * 1.5]; cm.group.visible = false; arr.push(cm); } return arr; }
    var elders = counsel(3100), youths = counsel(3200);
    /* 예루살렘의 유다와 베냐민 용사(12:21): 서른여섯으로 줄임. 창을 세워 들고 서 있기만 한다 */
    var army = [];
    for (i = 0; i < 36; i++) {
      var so = PR.soldier(3300 + i, ['#8A5A3A', '#7A6A54', '#6E5A44', '#8A7A5A'][i % 4], '#9A8A6A'); so.group.rotation.order = 'YXZ'; scene.add(so.group);
      so.spot = jp(-11 + (i % 12) * 2 + (hash(i, 2) - 0.5) * 0.3, 2 + Math.floor(i / 12) * 2.2); so.dir = (i % 12) < 6 ? -1 : 1; so.wait = (2 - Math.floor(i / 12)) * 1.4 + (i % 12) * 0.25;
      so.HOME = mkPath([so.spot, [so.spot[0] + so.dir * 6, so.spot[1] + 6], [so.spot[0] + so.dir * 22, so.spot[1] + 30]]); so.group.visible = false; army.push(so);
    }
    var SHEM_IN = mkPath([jp(22, -6), jp(3.4, -6.2)]);

    var phase = 'gather', pt = 0, chS = 0;
    /* 서 있기만 하는 동안의 온 회중은 한 덩어리로 합쳐 그린다(휴대폰 무게). 움직이기 시작하면 한 사람씩으로 바꾼다 */
    crowd.forEach(function (o) { setAt(o, o.spot[0], o.spot[1], Math.PI); o.group.visible = true; still(o); });
    var crowdM = C3.merge(crowd.map(function (o) { return o.group; })); scene.add(crowdM); crowdM.visible = false;
    crowd.forEach(function (o) { o.group.visible = false; });
    function crowdLoose() { if (!crowdM.visible) return; crowdM.visible = false; crowd.forEach(function (o) { setAt(o, o.spot[0], o.spot[1], Math.PI); o.group.visible = true; still(o); }); }
    function placeCrowd() { crowdM.visible = true; setAt(jer, JER[0], JER[1], Math.PI); jer.group.visible = true; still(jer); }
    /* 대목마다 모든 상태를 처음부터 정한다('이전'으로 돌아와도 뒤 대목의 것이 남지 않게) */
    function setPhase(p) {
      phase = p; pt = 0; chS = 0;
      crowd.forEach(function (o) { o.group.visible = false; }); crowdM.visible = false; jer.group.visible = false;
      elders.concat(youths).forEach(function (o) { o.group.visible = false; });
      army.forEach(function (o) { o.group.visible = false; }); shem.group.visible = false;
      chariot.group.visible = true; chariot.group.position.set(CH_AT[0], height(CH_AT[0], CH_AT[1]), CH_AT[1]); chariot.group.rotation.y = -Math.PI / 2;
      reh.group.visible = true; setAt(reh, REH[0], REH[1], 0); still(reh);
      if (p === 'assemble' || p === 'withdraw' || p === 'tents' || p === 'wait') placeCrowd();
      if (p === 'old' || p === 'young') { setAt(reh, REH_C[0], REH_C[1], 0); (p === 'old' ? elders : youths).forEach(function (o) { setAt(o, o.spot[0], o.spot[1], Math.PI); o.group.visible = true; still(o); }); }
      if (p === 'jerusalem') {
        chariot.group.visible = false;   /* 왕이 타고 떠난 수레는 세겜에 남지 않는다 */
        setAt(reh, jp(-1.2, -5.6)[0], jp(-1.2, -5.6)[1], 0);
        army.forEach(function (o) { setAt(o, o.spot[0], o.spot[1], Math.PI); o.group.visible = true; o.update(0.016, 0, 0); });
        setAt(shem, SHEM_IN.p[0][0], SHEM_IN.p[0][1], -Math.PI / 2);
      }
    }
    if (window.BO3D_TEST) C3.t29 = { skip: function (sec) { pt += sec; } };   /* 시험에서 때를 건너뛰어 볼 때만 쓴다 */
    if (FX) FX.sortLayers(scene);
    setPhase('gather');

    return {
      id: 'OT-29', scene: scene, sun: sun, sunOff: [-30, 50, 30],
      height: height, walkable: walkable,
      edge: function (x, z) {
        if (z < 4) return { who: 'onwoo', text: '모인 사람들 쪽으로는 가지 말자. 우리는 가장자리에서 지켜보는 사람이야.' };
        if (Math.abs(x) > 30) return { who: 'hyu', text: '장막 쪽으로는 가지 말자. 사람들의 장막과 물건에는 손대지 않아.' };
        return { who: 'hyu', text: '남쪽 가장자리와 길가에서만 다니자.' };
      },
      P: { start: [6, 22], machine: [13, 25], machineRot: 0.4,
        /* 재료가 놓인 곳(quests[i].found): 서남쪽 길가 / 동남쪽 길가 / 모이는 자리 남쪽 길가. 사람들이 오가는 길(z 1~2.4)과 르호보암(0, -27)에서 떨어진 곳 */
        parts: [[-26, 22], [26, 20], [12, 7.5]], lookSpot: [12, 7.5],
        look: { focus: [0, -24], mid: [2, -12], dy: 2.5, backE: 10, upE: 5 } },
      eventCam: function (i) {
        if (i === 2 || i === 3) return { pos: [-12, height(-12, -24) + 7, -24], look: [REH_C[0], 1.6, REH_C[1] + 1.5] };      /* 왕이 머문 집 앞을 멀리서 */
        if (i === 6) return { pos: [JRS[0] + 16, height(JRS[0], JRS[1]) + 10, JRS[1] + 26], look: [JRS[0], 1.5, JRS[1] - 1] };   /* 창 너머: 예루살렘 */
        return null;
      },
      eventLook: function () { return null; },
      kidsHidden: function (i) { return i === 2 || i === 3 || i === 6; },
      beatNote: function (i) {
        if (i === 2) return '왕이 의논한 곳은 성경에 적혀 있지 않아, 왕이 머문 집 앞으로 두고 멀리서 봐요. 말은 글로만 읽어요.';
        if (i === 4) return '사흘 만에 백성이 다시 모여 와요.';
        if (i === 5) return '왕이 보낸 일꾼 감독이 당한 일(18절)은 그림으로 만들지 않았어요. 성경책에서 읽어요.';
        if (i === 6) return '타임머신 창 너머로 예루살렘을 멀리서 봐요. 스마야가 받은 말씀은 소리나 빛으로 만들지 않았어요.';
        return null;
      },
      helpNote: function (after) {
        if (after === 1) return '우리는 남쪽 가장자리에서 물러가는 사람들에게 길을 비켜 주고, 함께 기다려요.';
        if (after === 6) return '우리는 창 너머로 멀리서 봐요.';
        return null;
      },
      detector: '탐지기', askLabel: '탐지기 물음 풀기',
      intro: { text: '타임머신이 세겜의 모이는 자리 남쪽 가장자리에 내려앉았어요. 동쪽과 서쪽에 장막이 늘어서 있어요.', say: { who: 'hyu', text: '모이는 자리 가운데로는 가지 말자. 남쪽 가장자리와 길가에서만 다니자.' } },
      lookText: '열왕기상 11장과 12장을 성경에서 찾아 읽은 뒤 다시 골라 보세요.',
      partBeats: [], eventStart: 0,
      sceneDoneText: '예루살렘의 일까지 지켜봐야 떠날 수 있어요.',
      dex: [
        { id: 'rehoboam', name: '르호보암', desc: '온 이스라엘이 왕으로 세우려고 세겜에 모인 솔로몬의 아들', ref: '왕상 12:1, 12:21', hint: '모인 사람들 앞(북쪽)에 선 청록 옷의 사람을 보세요. 사건이 끝나면 왕은 떠나요.', range: 70, crop: 0.36, visible: function () { return reh.group.visible && Math.hypot(reh.group.position.x, reh.group.position.z) < 80; }, pos: function () { var p = reh.group.position; return v3(p.x, p.y + 1.1, p.z); } },
        { id: 'tents', name: '이스라엘 사람들의 장막', desc: '온 이스라엘이 돌아간 장막', ref: '왕상 12:16', hint: '빈터 동쪽의 장막을 보세요.', range: 90, pos: function () { return v3(42, 1.2, -4); } },
        { id: 'shechem', name: '세겜의 모이는 자리', desc: '온 이스라엘이 르호보암을 왕으로 세우려고 모인 곳', ref: '왕상 12:1', hint: '넓은 빈터를 보세요.', range: 90, pos: function () { return v3(0, 0.6, -12); } }
      ],
      reset: function () { setPhase('gather'); },
      partFound: function () {},
      partContinue: function () {},
      lookupPose: function () { if (phase !== 'wait') setPhase('wait'); },
      /* 대목 번호(OT-29.json): 0 = 12:1-3, 1 = 12:4-5, 2 = 12:6-7, 3 = 12:8-11, 4 = 12:12-15, 5 = 12:16-20, 6 = 12:21-24 */
      beatPose: function (i) { setPhase(['assemble', 'withdraw', 'old', 'young', 'return', 'tents', 'jerusalem'][i] || 'wait'); },
      update: function (dt, now) {
        pt += dt;
        if (phase === 'gather' || phase === 'return') {   /* 12:1 모여 온다, 12:12 사흘 만에 다시 온다 */
          var t0 = phase === 'return' ? 1 : 3, spd = phase === 'return' ? 2.8 : 2.0, wf = phase === 'return' ? 0.4 : 1;   /* 사흘 만에 다시 올 때는 서둘러 온다 */
          var sj = phase === 'return' ? (pt - t0 + 2) * 2.8 : (pt - t0 + 3) * 2.0; walk(jer, JER_IN, sj, Math.PI, dt);
          if (!crowdM.visible) crowd.forEach(function (o) { var s = (pt - t0 - o.wait * wf) * spd; if (s > 0) walk(o, o.IN, s, Math.PI, dt); });
          if (!crowdM.visible && pt > t0 + (phase === 'return' ? ARR_R : ARR_T) + 0.5) { crowd.forEach(function (o) { o.group.visible = false; }); crowdM.visible = true; }   /* 다 와서 서면 한 덩어리로 */
        }
        if (phase === 'withdraw' || phase === 'tents') {   /* 12:5 장막으로 물러간다, 12:16 장막으로 돌아간다 */
          var t1 = phase === 'withdraw' ? 6 : 4; if (pt > t1 - 0.2) crowdLoose();
          var lf = phase === 'tents' ? 0.45 : 1, ls = phase === 'tents' ? 2.0 : 1.7;   /* 12:16에는 서둘러 떠난다(13초 안에 모두 떠나기 시작) */
          crowd.forEach(function (o) { var s = (pt - t1 - o.leave * lf) * ls; if (s > 0) { if (!walk(o, o.OUT, s, undefined, dt) && s > o.OUT.tot) o.group.visible = false; } });
          var sj2 = (pt - t1 - (phase === 'tents' ? 12 : 26)) * ls; if (sj2 > 0) { if (!walk(jer, JER_OUT, sj2, undefined, dt) && sj2 > JER_OUT.tot) jer.group.visible = false; }
        }
        if (phase === 'tents') {   /* 12:18 르호보암이 급히 수레에 올라 떠난다 */
          var RW = REH_TO_CH.tot / 2.6;
          if (pt > RT0 && pt < RT0 + RW) walk(reh, REH_TO_CH, (pt - RT0) * 2.6, -Math.PI / 2, dt);
          else if (pt >= RT0 + RW) {
            var tg = pt - RT0 - RW, up = Math.min(1, tg / 0.6), ta = tg - 0.9; chS = ta < 0 ? 0 : ta < 2 ? 2.25 * ta * ta : 9 + 9 * (ta - 2);   /* 0.6초 동안 수레에 오르고, 2초 동안 빨라져 초당 9로 급히 */   /* 올라탄 뒤 2초 동안 빨라져 초당 9로 급히 */
            var cw = pathAt(CH_GO, chS), cy = height(cw[0], cw[1]); chariot.group.position.set(cw[0], cy, cw[1]); chariot.group.rotation.y = angTo(cw[2], chariot.group.rotation.y, Math.min(1, dt * 4));
            var ry = chariot.group.rotation.y, bx = cw[0] - Math.sin(ry) * 1.9, bz = cw[1] - Math.cos(ry) * 1.9, e0 = REH_TO_CH.p[REH_TO_CH.p.length - 1], ey = height(e0[0], e0[1]);
            reh.group.position.set(e0[0] + (bx - e0[0]) * up, ey + (cy + 0.62 - ey) * up, e0[1] + (bz - e0[1]) * up); reh.group.rotation.y = up < 1 ? angTo(ry, reh.group.rotation.y, Math.min(1, dt * 8)) : ry; still(reh);
            if (chariot.update) chariot.update(dt, chS > 0 && chS < CH_GO.tot ? 6 : 0, now);   /* 서 있는 동안 말은 걷지 않는다 */
            if (chS >= CH_GO.tot) { chariot.group.visible = false; reh.group.visible = false; }
          }
        }
        if (phase === 'jerusalem') {   /* 12:22-24 스마야가 와서 서고, 용사들은 각기 집으로 돌아간다 */
          walk(shem, SHEM_IN, Math.max(0, pt - 1) * 1.6, 0, dt);
          army.forEach(function (o) { var s = (pt - 17 - o.wait) * 1.6; if (s > 0) { var w = pathAt(o.HOME, s), mv = s < o.HOME.tot; o.group.position.set(w[0], height(w[0], w[1]), w[1]); o.group.rotation.y = w[2]; o.update(dt, mv ? 1 : 0, now); if (!mv) o.group.visible = false; } });
        }
        if (reh.group.visible && reh.update && !(phase === 'tents' && pt > RT0)) reh.update(dt, false);
      },
      audio: function (A) { A.setFlock(999); A.setFire(999); },   /* 거친 말과 외침, 말씀은 소리로 만들지 않는다 */
      menuCam: function (camera, now) { var a = now * 0.05; camera.position.set(Math.sin(a) * 12, 9, 22); camera.lookAt(0, 1.5, -18); },
      debug: { phase: function () { return { phase: phase, pt: pt, ch: chS }; }, arrived: function () { return phase !== 'gather'; } }
    };
  };
})();
