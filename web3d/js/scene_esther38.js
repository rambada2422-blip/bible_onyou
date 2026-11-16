/* 3D 장면 설정: OT-38 에스더 (에 4:1-17, 7:1-10).
 * 방향: 수산 궁의 담과 대궐 문은 북쪽(-Z)에 동서로 서 있다. 그 앞(남쪽)이 성중 광장이고, 광장 둘레는 성 안의 집과 길이다.
 *   아이들은 광장 남쪽 끝과 둘레 길에서만 다닌다(대궐 문 쪽과 광장 가운데로 가지 않는다). 담 안(잔치 자리, 왕궁 후원)은 걷는 곳이 아니다.
 * 아이들이 다니는 때: 모르드개가 굵은 베를 입고 대궐 문 앞까지 와 있을 때(4:1-2). 재료 2를 주우면 에스더가 보낸 내시와 하닥이 문에서 나온다(4:4-9).
 * 본문에 맞춘 점 (content/ot/OT-38.json design3d)
 *  - 모르드개는 굵은 베(거칠고 어두운 옷)를 입고 재를 무릅쓰고(잿빛 머리쓰개) 대궐 문 앞 광장에 서 있다(4:1-2, 4:6). 대궐 문 안으로 들어가지 않는다(4:2).
 *    아이들 쪽에서는 뒷모습과 고개를 숙인 모습까지만 보인다. 울음소리는 만들지 않는다.
 *  - 4:4: 내시 하나가 입을 옷(작은 보따리)을 들고 나왔다가, 모르드개가 받지 않아 도로 들어간다. 4:6-9: 하닥이 나와 모르드개에게 오고,
 *    모르드개가 조서 초본(작은 두루마리, 글자 없음)을 건네고(4:8), 하닥이 돌아간다(4:9). 4:10-12: 하닥이 다시 나온다. 4:13-14: 회답을 가지고 돌아간다.
 *  - 4:15-17: 에스더의 회답이 오고, 모르드개가 가서 수산의 유다인을 모은다. 유다인들은 성 안 길에서 광장으로 모여 와 조용히 선다(금식은 먹고 마시는 것이 없는 데까지만).
 *    남쪽 길로 오는 사람들은 아이들 곁(동쪽)을 지나간다(돕기: 길 비켜 주기).
 *  - 에스더는 궁 안에 있어 모습을 그리지 않는다. 에스더의 말은 대목의 글과 성경책으로만.
 *  - 7:1: 며칠 뒤. 타임머신 창 너머로 담 안을 멀리서 본다(아이들은 화면에 없음). 왕과 하만이 왕궁의 집에서 잔치 자리로 간다. 잔치 자리 안은 그리지 않는다.
 *  - 7:7-8: 왕이 잔치 자리에서 나와 왕궁 후원으로 갔다가 돌아온다. 그 뒤의 일(7:8-10: 걸상, 하만의 얼굴을 쌈, 나무, 하만을 닮)은 그리지 않는다(글로만).
 *  - 하나님의 이름과 말씀은 이 본문에 없다. 빛·음성·말씀 자막 없음.
 * 감수가 필요한 설정: 수산 궁의 담과 대궐 문의 생김새·크기·방향, 광장과 성 안 집과 길의 생김새, 담 안의 집 두 채(왕궁의 집, 잔치 자리)와 후원의 나무(종려),
 *   모르드개의 생김새(tools/blender/people/mordecai.json: 수염, 어두운 굵은 베, 잿빛 머리쓰개. 찢은 옷은 그리지 않음), 모르드개가 선 자리,
 *   내시와 하닥과 하만의 옷(무리 모형), 왕의 모습(다리오 모형을 멀리서 씀), 에스더가 보낸 옷의 꼴(보따리), 조서 초본의 꼴(작은 두루마리),
 *   유다인의 수(40)와 모여 오는 길과 선 자리, 모르드개가 그들 앞에 선 것, 금식하는 모습(조용히 서 있음), 성 안을 오가는 사람들, 날씨와 때(맑은 낮),
 *   재료 재(4:1, 모르드개가 무릅쓴 재가 길에 떨어진 것으로 읽음)와 작은 돌(광장 가장자리).
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  BO3D.scene3d = BO3D.scene3d || {};
  if (!(BO3D.c3d && BO3D.c3d.on('OT-38'))) return;   /* design3d.build가 false면 이야기 카드로만 간다 */
  BO3D.scene3d['OT-38'] = function (api) {
    var T = THREE, M2 = BO3D.models2 || {}, MO = BO3D.models || {}, PR = BO3D.props, FX = api.FX, C3 = BO3D.c3d, R = PR.rng(3811), sm = C3.sm, noise = C3.noise, hash = C3.hash, i, k;
    var WALL_Z = -24, GATE = [0, WALL_Z], IN = [0, -29], OUT = [0, -21.5], MOR = [4.5, -15], MEET = [3.2, -16.6], FRONT_M = [0, -21.2];
    var ROYAL = [-6, -62], ROYAL_DOOR = [-6, -56.5], HALL = [8, -62], HALL_DOOR = [8, -56.5], GARDEN = [10, -46];   /* 담 안: 왕궁의 집(서), 잔치 자리(동), 그 앞의 후원 */
    function height(x, z) {
      var inside = sm(-25.5, -27.5, z);                                   /* 담 안은 조금 높은 터 */
      return 1.2 * inside + 0.18 * noise(x * 0.08 + 3, z * 0.08 + 1) * (1 - inside) + sm(120, 230, Math.hypot(x, z)) * 12 * noise(x * 0.02, z * 0.02);
    }
    function walkable(x, z) {
      return (x >= -32 && x <= 32 && z >= -6 && z <= 32) || (z >= 9 && z <= 17 && x >= -42 && x < -32) || (z >= 1 && z <= 9 && x > 32 && x <= 42);
    }
    function square(x, z) { return Math.abs(x) < 28 && z > -23 && z < -1; }

    var scene = new T.Scene();
    scene.background = new T.Color('#EEE2C8'); scene.fog = new T.Fog('#EEE2C8', 80, 330);
    var skyG = new T.SphereGeometry(560, 24, 14), sp = skyG.attributes.position, sc = new Float32Array(sp.count * 3), cc = new T.Color(), top = new T.Color('#7AAED0'), hor = new T.Color('#F3E6C8');
    for (i = 0; i < sp.count; i++) { var tt = Math.max(0, sp.getY(i) / 560); cc.copy(hor).lerp(top, sm(0.02, 0.7, tt)); sc[i * 3] = cc.r; sc[i * 3 + 1] = cc.g; sc[i * 3 + 2] = cc.b; }
    skyG.setAttribute('color', new T.BufferAttribute(sc, 3));
    var skyM = new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false }); scene.add(new T.Mesh(skyG, skyM));
    var g = new T.PlaneGeometry(520, 520, 150, 150); g.rotateX(-Math.PI / 2);
    var pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color(), s1 = new T.Color('#C9B184'), s2 = new T.Color('#B6A27A'), pave = new T.Color('#D9CCAE'), lane = new T.Color('#CDBB92'), court = new T.Color('#D4C6A2');
    for (i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i), y = height(x, z); pos.setY(i, y);
      c.copy(s1).lerp(s2, noise(x * 0.06, z * 0.06));
      if (walkable(x, z) || (Math.abs(x) < 6 && z > 30 && z < 70) || (z > 9 && z < 17 && x < -32 && x > -80) || (z > 1 && z < 9 && x > 32 && x < 80)) c.lerp(lane, 0.7);
      if (square(x, z)) c.lerp(pave, 0.85);
      if (z < -26 && z > -80 && Math.abs(x) < 40) c.lerp(court, 0.6);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals();
    var ground = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 })); ground.receiveShadow = true; scene.add(ground);
    var hemi = new T.HemisphereLight('#DCEFF2', '#A99A6A', 0.64); scene.add(hemi);
    var sun = new T.DirectionalLight('#FFF0CF', 0.76); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    var ss = sun.shadow.camera; ss.left = -26; ss.right = 26; ss.top = 26; ss.bottom = -26; ss.near = 1; ss.far = 150; sun.shadow.bias = -0.0015;
    scene.add(sun); scene.add(sun.target);
    function std(cl) { return new T.MeshStandardMaterial({ color: cl, flatShading: true, roughness: 0.95 }); }
    function box(w, h, d, m, x, z, y0) { var b = new T.Mesh(new T.BoxGeometry(w, h, d), m); b.position.set(x, (y0 === undefined ? height(x, z) : y0) + h / 2, z); return b; }
    function v3(x, y, z) { return new T.Vector3(x, y, z); }

    /* 성 안의 집들(본문에 생김새 없음): 단순한 네모. 광장 둘레와 남쪽, 길은 비워 둔다 */
    var houseM = [std('#E2C79A'), std('#D7B98A'), std('#E9D3A8')], roofM = std('#BFA477'), hs = [];
    function block(x0, x1, z0, z1) {
      for (var hx = x0; hx < x1; hx += 7 + hash(hx, z0) * 3) for (var hz = z0; hz < z1; hz += 7 + hash(hz, x0) * 3) {
        var w = 5 + hash(hx, hz) * 2.4, d = 5 + hash(hz, hx) * 2.4, h = 3.2 + hash(hx + 3, hz) * 3.4, m = houseM[Math.floor(hash(hx, hz + 7) * 3)];
        hs.push(box(w, h, d, m, hx + w / 2, hz + d / 2)); hs.push(box(w + 0.3, 0.3, d + 0.3, roofM, hx + w / 2, hz + d / 2, height(hx + w / 2, hz + d / 2) + h));
      }
    }
    block(-78, -35, -22, 7); block(-78, -35, 19, 46); block(35, 78, -22, -1); block(35, 78, 11, 46); block(-60, -8, 35, 62); block(8, 60, 35, 62);
    var houses = PR.mergeStatic(hs); scene.add(houses);

    /* 수산 궁의 담과 대궐 문(4:2). 크기와 생김새는 본문에 없다 */
    var wallM = std('#CDB48A'), wallM2 = std('#BBA078'), wp = [];
    [[-78, -4.2], [4.2, 78]].forEach(function (seg) { var w = seg[1] - seg[0]; wp.push(box(w, 7, 2.2, wallM, (seg[0] + seg[1]) / 2, WALL_Z, 0)); });
    [-4, 4].forEach(function (dx) { wp.push(box(3.4, 10, 4, wallM2, GATE[0] + dx, WALL_Z, 0)); });
    wp.push(box(11.4, 2.4, 4, wallM2, GATE[0], WALL_Z, 7.6));
    wp.push(box(2.2, 7, 56, wallM, -40, -52, 0)); wp.push(box(2.2, 7, 56, wallM, 40, -52, 0)); wp.push(box(82, 7, 2.2, wallM, 0, -80, 0));
    var walls = PR.mergeStatic(wp); scene.add(walls);
    var dark = new T.Mesh(new T.PlaneGeometry(4.6, 7.6), new T.MeshBasicMaterial({ color: '#2A2420' })); dark.position.set(GATE[0], 3.8, WALL_Z - 1.6); scene.add(dark);   /* 문 안쪽 그늘(안은 보이지 않는다) */

    /* 담 안: 왕궁의 집과 잔치 자리(7:1), 왕궁 후원(7:7). 모두 단순한 꼴, 창 너머로 멀리서만 */
    var inner = [], hallM = std('#E6D2AA'), royalM = std('#DCC49A');
    inner.push(box(12, 9, 11, royalM, ROYAL[0], ROYAL[1])); inner.push(box(12.6, 0.6, 11.6, roofM, ROYAL[0], ROYAL[1], height(ROYAL[0], ROYAL[1]) + 9));
    inner.push(box(12, 8, 11, hallM, HALL[0], HALL[1])); inner.push(box(12.6, 0.6, 11.6, roofM, HALL[0], HALL[1], height(HALL[0], HALL[1]) + 8));
    var doorM = std('#3A2E24');
    inner.push(box(2.4, 3.6, 0.3, doorM, ROYAL_DOOR[0], ROYAL_DOOR[1] + 0.12)); inner.push(box(2.4, 3.6, 0.3, doorM, HALL_DOOR[0], HALL_DOOR[1] + 0.12));
    var innerM = PR.mergeStatic(inner); scene.add(innerM);
    var trees = [];
    if (M2.palm) for (i = 0; i < 9; i++) { var pl = M2.palm(3820 + i), px = GARDEN[0] - 4.2 + (i % 3) * 4.2 + (hash(i, 2) - 0.5) * 1.4, pz = GARDEN[1] - 5 + Math.floor(i / 3) * 4.8 + (hash(i, 4) - 0.5) * 1.2; pl.scale.multiplyScalar(0.8); pl.position.set(px, height(px, pz), pz); trees.push(pl); }
    if (trees.length) scene.add(C3.merge(trees));

    /* 둘레의 땅(멀리): 바위와 떨기만 */
    var deco = [];
    if (MO.rock) for (i = 0; i < 30; i++) { var ro = MO.rock(3830 + i), rx = -160 + R() * 320, rz = -160 + R() * 320; if (Math.abs(rx) < 85 && rz > -90 && rz < 70) continue; ro.scale.multiplyScalar(0.8 + R() * 1.5); ro.position.set(rx, height(rx, rz) - 0.1, rz); deco.push(ro); }
    if (MO.shrub) for (i = 0; i < 24; i++) { var sh = MO.shrub(380 + i), sx = -150 + R() * 300, sz = -150 + R() * 300; if (Math.abs(sx) < 85 && sz > -90 && sz < 70) continue; sh.position.set(sx, height(sx, sz), sz); deco.push(sh); }
    if (deco.length) scene.add(C3.merge(deco));

    /* 사람 */
    function man(seed, opt) { var o = null; try { if (M2.israelite) o = M2.israelite(seed, opt || { kind: 'man', carry: 'none' }); } catch (e) { o = null; } if (!o) o = PR.soldier(seed, '#7A6A54', null); o.group.rotation.order = 'YXZ'; scene.add(o.group); return o; }
    function setAt(o, x, z, ry) { o.group.position.set(x, height(x, z), z); if (ry !== undefined) o.group.rotation.y = ry; }
    function mkPath(pts) { var L = [], tot = 0; for (var n = 0; n + 1 < pts.length; n++) { var l = Math.hypot(pts[n + 1][0] - pts[n][0], pts[n + 1][1] - pts[n][1]); L.push(l); tot += l; } return { p: pts, L: L, tot: tot }; }
    function pathAt(P, s) { s = Math.min(P.tot, Math.max(0, s)); for (var n = 0; n < P.L.length; n++) { if (s <= P.L[n] || n === P.L.length - 1) { var u = P.L[n] ? Math.min(1, s / P.L[n]) : 1, a = P.p[n], b = P.p[n + 1]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, Math.atan2(b[0] - a[0], b[1] - a[1])]; } s -= P.L[n]; } var e = P.p[P.p.length - 1]; return [e[0], e[1], 0]; }
    function walk(o, P, s, endRy, dt) { var w = pathAt(P, s), mv = s > 0 && s < P.tot; o.group.visible = true; setAt(o, w[0], w[1], mv || endRy === undefined ? w[2] : endRy); if (o.update) o.update(dt, mv ? 1 : 0); return mv; }

    var mor = { group: api.fallback('#5A5246', 1.75, 0.27), update: function () {} }; mor.group.rotation.order = 'YXZ'; scene.add(mor.group);
    api.person('mordecai', function (nm) { nm.group.rotation.order = 'YXZ'; nm.group.position.copy(mor.group.position); nm.group.rotation.copy(mor.group.rotation); nm.group.visible = mor.group.visible; scene.remove(mor.group); scene.add(nm.group); mor = nm; });
    var king = { group: api.fallback('#6A3E6A', 1.75, 0.27), update: function () {} }; king.group.rotation.order = 'YXZ'; scene.add(king.group); king.group.visible = false;
    api.person('darius', function (nm) { nm.group.rotation.order = 'YXZ'; nm.group.position.copy(king.group.position); nm.group.rotation.copy(king.group.rotation); nm.group.visible = king.group.visible; scene.remove(king.group); scene.add(nm.group); king = nm; });
    var hathach = man(3851), servant = man(3852), haman = man(3853);
    /* 에스더가 보낸 옷(4:4): 보따리. 조서 초본(4:8): 작은 두루마리(글자 없음) */
    var garb = new T.Mesh(new T.BoxGeometry(0.5, 0.22, 0.36), std('#C9B7D6')); garb.position.set(0, 1.08, 0.3); servant.group.add(garb);
    var scroll = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.34, 8), std('#E8DCC0')); scroll.rotation.z = Math.PI / 2; scene.add(scroll); scroll.visible = false; var scrollWith = null;
    /* 수산의 유다인(4:16): 남자·여자·아이. 남쪽 길(아이들 동쪽을 지나), 서쪽 길, 동쪽 길에서 광장으로 모여 온다 */
    var jews = [], COLS = 8, ROWS = 5;
    for (i = 0; i < COLS * ROWS; i++) {
      var o = man(i * 23 + 600, { carry: 'none' }), cl = i % COLS, row = Math.floor(i / COLS), src = i % 5;
      o.spot = [-10.5 + cl * 3 + (hash(i, 1) - 0.5) * 0.8, -19.5 + row * 2 + (hash(i, 2) - 0.5) * 0.5];
      var start, mid;
      if (src <= 2) { start = [3 + hash(i, 3) * 4, 34 + (i % 3) * 1.5]; mid = [[3 + hash(i, 3) * 5, 28], [4 + hash(i, 5) * 4, -2]]; }        /* 남쪽 길: 아이들 동쪽(x 3~9)으로 지난다 */
      else if (src === 3) { start = [-46 - (i % 4) * 1.4, 13 + (hash(i, 3) - 0.5) * 3]; mid = [[-30, 13], [-18, -6]]; }                        /* 서쪽 길 */
      else { start = [46 + (i % 4) * 1.4, 5 + (hash(i, 3) - 0.5) * 3]; mid = [[30, 5], [18, -6]]; }                                               /* 동쪽 길 */
      o.P = mkPath([start].concat(mid, [o.spot])); o.wait = (i % 8) * 0.7 + Math.floor(i / 8) * 0.4; o.group.visible = false; jews.push(o);
    }
    /* 성 안을 오가는 사람들(4:1 '성중'): 둘레 길에서만 */
    var walkers = [];
    for (i = 0; i < 6; i++) { var wk = man(i * 31 + 700, { carry: 'none' }); wk.P = i % 2 ? mkPath([[-75, 12 + i * 0.4], [-34, 12 + i * 0.4], [-34, -4], [-75, -4]]) : mkPath([[75, 4 + i * 0.3], [36, 4 + i * 0.3], [36, 30], [75, 30]]); wk.ph = i * 9; walkers.push(wk); }

    var OUTP = mkPath([IN, OUT, MEET]), BACKP = mkPath([MEET, OUT, IN]);
    var MOR_GO = mkPath([MOR, [-3, -12], [-1, -18], FRONT_M]);                                                         /* 4:17 모르드개가 가서 모은다 */
    var K_TO = mkPath([[ROYAL_DOOR[0], ROYAL_DOOR[1] + 0.4], [ROYAL_DOOR[0], -54.2], [HALL_DOOR[0] - 0.5, -54.2], [HALL_DOOR[0] - 0.5, HALL_DOOR[1] + 0.3]]), H_TO = mkPath([[ROYAL_DOOR[0] + 1.2, ROYAL_DOOR[1] + 0.4], [ROYAL_DOOR[0] + 1.2, -53.2], [HALL_DOOR[0] + 0.7, -53.2], [HALL_DOOR[0] + 0.7, HALL_DOOR[1] + 0.3]]);   /* 7:1 왕궁의 집에서 잔치 자리로 */
    var K_OUT = mkPath([[HALL_DOOR[0], HALL_DOOR[1] + 0.4], [HALL_DOOR[0] + 1, -52], GARDEN]), K_BACK = mkPath([GARDEN, [HALL_DOOR[0] + 1, -52], [HALL_DOOR[0], HALL_DOOR[1] + 0.4]]);                    /* 7:7-8 */

    var phase = 'mourn', pt = 0, tilt = 0;
    function still(o) { if (o.update) o.update(0.016, 0); }
    function hideIn(o) { o.group.visible = false; setAt(o, IN[0], IN[1], 0); }
    /* 대목마다 모든 상태를 처음부터 정한다('이전'으로 돌아와도 뒤 대목의 것이 남지 않게) */
    function setPhase(p) {
      phase = p; pt = 0;
      var palace = p === 'feast' || p === 'garden';
      mor.group.visible = !palace; setAt(mor, MOR[0], MOR[1], Math.PI); tilt = 0.24;
      hideIn(hathach); hideIn(servant); garb.visible = true; scroll.visible = false; scrollWith = null;
      jews.forEach(function (o) { o.group.visible = false; });
      walkers.forEach(function (o) { o.group.visible = !palace; });
      king.group.visible = false; haman.group.visible = false;
      if (p === 'answer' || p === 'reply') { hathach.group.visible = true; setAt(hathach, MEET[0], MEET[1], Math.PI * 0.25 + Math.PI); if (p === 'answer') setAt(hathach, IN[0], IN[1], 0); }
      if (p === 'gather') { setAt(hathach, IN[0], IN[1], 0); }
      if (p === 'feast') { king.group.visible = true; haman.group.visible = true; setAt(king, ROYAL_DOOR[0], ROYAL_DOOR[1], 0); setAt(haman, ROYAL_DOOR[0] + 1.2, ROYAL_DOOR[1], 0); }
      if (p === 'garden') { king.group.visible = true; setAt(king, HALL_DOOR[0], HALL_DOOR[1] + 0.4, 0); }
      still(mor); still(hathach);
    }
    var D_SERV = 0, D_HATH = 13;   /* 4:4 옷을 가져온 내시 → 4:6 하닥 */
    function clothes(dt) {
      /* 4:4: 내시가 옷을 들고 나왔다가 받지 않으므로 도로 들어간다 */
      var s1 = pt - D_SERV;
      if (s1 < OUTP.tot / 1.6) walk(servant, OUTP, s1 * 1.6, undefined, dt);
      else if (s1 < OUTP.tot / 1.6 + 2.4) { servant.group.visible = true; servant.group.rotation.y = Math.atan2(MOR[0] - MEET[0], MOR[1] - MEET[1]); still(servant); }
      else if (s1 < OUTP.tot / 1.6 * 2 + 2.4) walk(servant, BACKP, (s1 - OUTP.tot / 1.6 - 2.4) * 1.6, undefined, dt);
      else servant.group.visible = false;
      /* 4:6-9: 하닥이 와서 듣고, 조서 초본을 받아 돌아간다 */
      var s2 = pt - D_HATH, tw = OUTP.tot / 1.6;
      if (s2 < 0) return;
      if (s2 < tw) walk(hathach, OUTP, s2 * 1.6, undefined, dt);
      else if (s2 < tw + 6) { hathach.group.visible = true; hathach.group.rotation.y = Math.atan2(MOR[0] - MEET[0], MOR[1] - MEET[1]); still(hathach); scroll.visible = true; scrollWith = s2 < tw + 3.5 ? mor : hathach; }
      else if (s2 < tw * 2 + 6) { walk(hathach, BACKP, (s2 - tw - 6) * 1.6, undefined, dt); scroll.visible = true; scrollWith = hathach; }
      else { hathach.group.visible = false; scroll.visible = false; }
    }
    function placeScroll() {
      if (!scroll.visible || !scrollWith) return;
      var gp = scrollWith.group.position, ry = scrollWith.group.rotation.y;
      scroll.position.set(gp.x + Math.sin(ry) * 0.32, gp.y + 1.05, gp.z + Math.cos(ry) * 0.32); scroll.rotation.y = ry;
    }
    if (FX) FX.sortLayers(scene);
    setPhase('mourn');

    return {
      id: 'OT-38', scene: scene, sun: sun, sunOff: [-30, 50, 30],
      height: height, walkable: walkable,
      edge: function (x, z) {
        if (z < -6) return { who: 'onwoo', text: '광장 가운데와 대궐 문 쪽으로는 가지 말자. 우리는 지켜보는 사람이야.' };
        if (Math.abs(x) > 32) return { who: 'hyu', text: '저 길 끝까지만 가자. 집들 사이로는 들어가지 말자.' };
        return { who: 'hyu', text: '광장 남쪽과 이 길에서만 다니자.' };
      },
      P: { start: [0, 20], machine: [-8, 26], machineRot: 0.4,
        /* 재료가 놓인 곳(quests[i].found): 성 서쪽 길가 / 광장 동쪽 길가 / 광장 남쪽 가장자리. 모르드개(4.5, -15)와 대궐 문에서 떨어진 곳 */
        parts: [[-38, 13], [38, 5], [-6, -4.5]], lookSpot: [-6, -4.5],
        look: { focus: [GATE[0], WALL_Z + 2], mid: [2, -16], dy: 3, backE: 9, upE: 5 } },
      eventCam: function (i) {
        if (i === 4) return { pos: [10, height(10, 34) + 16, 34], look: [0, 1, -15] };                         /* 4:16-17 모여 오는 유다인 */
        if (i === 5 || i === 6) return { pos: [2, 48, 4], look: [2, 0, -56] };                              /* 담 안을 창 너머로 멀리서 */
        return null;
      },
      eventLook: function (i) { if (i === 2 || i === 3) return { focus: [2, -20], mid: [3, -16], dy: 1.5, backE: 14, upE: 4 }; return null; },   /* 문과 모르드개와 하닥이 함께 보이게 */
      kidsHidden: function (i) { return i === 5 || i === 6; },
      beatNote: function (i) {
        if (i === 5) return '시간이 흘렀어요. 며칠 뒤, 왕후 에스더가 잔치를 연 날이에요. 타임머신 창 너머로 궁의 담 안을 멀리서 봐요. 잔치 자리 안의 모습은 성경에 없어서 그리지 않았어요.';
        if (i === 6) return '왕이 후원으로 나갔다가 돌아온 것까지만 멀리서 봐요. 그 뒤의 일(7:8-10)은 그림으로 만들지 않았어요. 성경책에서 읽어요.';
        return null;
      },
      helpNote: function (after) {
        if (after === 4) return '이 일은 탐험대가 광장 남쪽 길가에서 해요. 금식하는 무리 사이로는 들어가지 않아요.';
        return null;
      },
      detector: '탐지기', askLabel: '탐지기 물음 풀기',
      intro: { text: '타임머신이 수산 성 안, 대궐 문 앞 광장 남쪽에 내려앉았어요. 굵은 베를 입은 사람이 대궐 문 앞에 서 있어요.', say: { who: 'hyu', text: '대궐 문 쪽으로는 가지 말자. 광장 남쪽과 길에서만 다니자.' } },
      lookText: '에스더 이야기를 성경에서 찾아 읽은 뒤 다시 골라 보세요.',
      partBeats: [0, 1], eventStart: 2,
      sceneDoneText: '광장의 일을 끝까지 지켜봐야 떠날 수 있어요.',
      dex: [
        { id: 'gate', name: '대궐 문', desc: '굵은 베를 입은 사람은 들어가지 못한 수산 궁의 문', ref: '에 4:2', hint: '북쪽의 큰 문을 담아 보세요.', range: 90, crop: 0.5, pos: function () { return v3(GATE[0], 5, WALL_Z); } },
        { id: 'mordecai', name: '모르드개', desc: '굵은 베를 입고 재를 무릅쓰고 대궐 문 앞까지 온 사람', ref: '에 4:1-2', hint: '광장 북쪽, 문 앞에 선 사람을 보세요.', range: 60, crop: 0.36, visible: function () { return mor.group.visible; }, pos: function () { var p = mor.group.position; return v3(p.x, p.y + 1.1, p.z); } },
        { id: 'square', name: '대궐 문 앞 광장', desc: '하닥이 모르드개를 만난 곳', ref: '에 4:6', hint: '문 앞의 넓은 곳을 보세요.', range: 80, pos: function () { return v3(0, 0.6, -12); } }
      ],
      reset: function () { setPhase('mourn'); },
      partFound: function (i) { if (i === 1) setPhase('clothes'); },            /* 재료 2: 4:4-9를 보여 준다 */
      partContinue: function (i) { if (i === 1) setPhase('wait'); },
      lookupPose: function () { if (phase !== 'wait') setPhase('wait'); },
      /* 대목 번호(OT-38.json): 0 = 4:1-3, 1 = 4:4-9, 2 = 4:10-12, 3 = 4:13-14, 4 = 4:15-17, 5 = 7:1-6, 6 = 7:7-10 */
      beatPose: function (i) { setPhase(['mourn', 'clothes', 'answer', 'reply', 'gather', 'feast', 'garden'][i] || 'wait'); },
      update: function (dt, now) {
        pt += dt;
        if (mor.group.visible && phase !== 'gather') { mor.group.rotation.x = tilt; if (mor.update) mor.update(dt, false); }   /* 고개를 숙인 모습까지만 */
        walkers.forEach(function (o) { if (o.group.visible) { var s = (now * 1.3 + o.ph) % o.P.tot; walk(o, o.P, s < 0.01 ? 0.01 : s, undefined, dt); } });
        if (phase === 'clothes') clothes(dt);
        if (phase === 'answer') { var ta = OUTP.tot / 1.6; if (pt < ta) walk(hathach, OUTP, pt * 1.6, undefined, dt); else { hathach.group.rotation.y = Math.atan2(MOR[0] - MEET[0], MOR[1] - MEET[1]); still(hathach); } }   /* 4:10-12 */
        if (phase === 'reply') { if (pt > 3) { if (!walk(hathach, BACKP, (pt - 3) * 1.6, undefined, dt) && pt > 3 + BACKP.tot / 1.6) hathach.group.visible = false; } else { hathach.group.rotation.y = Math.atan2(MOR[0] - MEET[0], MOR[1] - MEET[1]); still(hathach); } }   /* 4:13-14 */
        if (phase === 'gather') {
          /* 4:15: 회답이 오고(하닥이 나왔다 들어감), 4:17: 모르드개가 가서 유다인을 모은다 */
          var th = OUTP.tot / 1.6;
          if (pt < th) walk(hathach, OUTP, pt * 1.6, undefined, dt); else if (pt < th + 2.5) still(hathach); else if (pt < th * 2 + 2.5) walk(hathach, BACKP, (pt - th - 2.5) * 1.6, undefined, dt); else hathach.group.visible = false;
          mor.group.rotation.x = 0; walk(mor, MOR_GO, Math.max(0, pt - 6) * 1.3, 0, dt);
          jews.forEach(function (o) { if (pt > 7 + o.wait) walk(o, o.P, (pt - 7 - o.wait) * 3.0, Math.PI, dt); });
        }
        if (phase === 'feast') { walk(king, K_TO, Math.max(0, pt - 1) * 1.2, 0, dt); walk(haman, H_TO, Math.max(0, pt - 1) * 1.2, 0, dt); if (pt > 1 + K_TO.tot / 1.2 + 0.5) { king.group.visible = false; haman.group.visible = false; } }   /* 7:1 잔치 자리로 */
        if (phase === 'garden') {   /* 7:7 후원으로 나갔다가 7:8 돌아온다 */
          var go = K_OUT.tot / 1.2;
          if (pt < go) walk(king, K_OUT, pt * 1.2, undefined, dt); else if (pt < go + 6) { king.group.visible = true; if (king.update) king.update(dt, false); } else if (pt < go * 2 + 6) walk(king, K_BACK, (pt - go - 6) * 1.2, undefined, dt); else king.group.visible = false;
        }
        placeScroll();
      },
      audio: function (A) { A.setFlock(999); A.setFire(999); },   /* 울음과 외침은 소리로 지어내지 않는다 */
      menuCam: function (camera, now) { var a = now * 0.05; camera.position.set(Math.sin(a) * 10, 8, 18); camera.lookAt(0, 3, WALL_Z); },
      debug: { phase: function () { return { phase: phase, pt: pt }; }, arrived: function () { return phase !== 'mourn'; } }
    };
  };
})();
