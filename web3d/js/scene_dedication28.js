/* 3D 장면 설정: OT-28 솔로몬이 성전을 봉헌함 (왕상 8:1-30, 8:54-61).
 * 방향: 여호와의 전은 북쪽(-Z) 조금 높은 터 위에 앞(낭실)이 남쪽을 보고 서 있다. 그 앞에 여호와의 단, 단 남쪽이 회중이 서는 뜰이다.
 *   아이들은 회중 뒤쪽(남쪽)과 예루살렘 길에서만 다닌다(뜰 안, 단과 전 쪽으로 가지 않는다).
 * 아이들이 다니는 때: 칠월 절기에 이스라엘 모든 사람이 솔로몬 앞에 모일 때(8:2). 재료 1을 주울 때 8:1-2를 글로 읽는다(돕기: 모여드는 사람들의 보따리).
 * 본문에 맞춘 점 (content/ot/OT-28.json design3d)
 *  - 전의 크기는 왕상 6:2-3대로: 길이 60, 너비 20, 높이 30규빗(27×9×13.5), 앞 낭실은 너비 20, 깊이 10규빗. 꾸밈과 기둥은 그리지 않는다(이 범위 밖).
 *  - 8:1-2: 길에서 사람들이 모여 온다. 8:3-6: 제사장들과 레위 사람들이 줄지어 동쪽 길로 올라와 전으로 들어간다.
 *    언약궤와 회막의 기구, 지성소 안은 그리지 않는다(행렬까지만. 무엇을 메었는지는 글로). 8:5의 양과 소의 제사는 그리지 않는다.
 *  - 8:10-11: 제사장들이 성소에서 나오자 구름이 전에 가득하다. 하나님의 영광은 전을 둘러싼 흰 구름으로만(사람 모양·얼굴·빛줄기 없음, 불 없음). 제사장들은 전 앞에 비켜 선다.
 *  - 8:14: 솔로몬이 얼굴을 돌려 서 있는 온 회중을 축복한다. 8:22: 단 앞에서 회중을 마주 서서 하늘을 향해 손을 편다.
 *    8:54: 무릎을 꿇고 손을 펴서 기도하다가 일어나 선다(8:55). 기도하는 말과 축복의 말은 소리로 만들지 않는다(대목 글로만).
 *  - 하나님의 형상·음성 없음. 하늘에서 내리는 불 없음.
 * 감수가 필요한 설정: 전이 남쪽을 보게 둔 것(성경 다른 곳은 전의 앞이 동쪽, 겔 47:1), 전의 높은 터·뜰·단의 생김새와 자리와 크기, 낭실의 높이,
 *   언약궤를 그리지 않고 제사장 행렬만 둔 것과 행렬이 오는 길(다윗 성에서 올라옴 8:1, 동쪽 길로 둠), 제사장의 흰 옷, 제사장·레위 사람의 수,
 *   구름의 모양·빛깔·퍼지는 빠르기, 구름이 대목 끝까지 머무는 것, 솔로몬의 생김새(무리 모형, 왕관과 꾸민 옷 없음)와 자리, 무릎 꿇은 모습(몸을 낮춤),
 *   회중의 수(56)와 선 자리, 모여 오는 사람들의 길과 보따리, 8:5의 양과 소를 그리지 않은 것, 날씨와 때(맑은 낮),
 *   재료(마른 풀 줄기 8:1, 작은 조약돌 8:2, 마른 흙덩이 8:14 — 모두 길과 회중 뒤의 땅).
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  BO3D.scene3d = BO3D.scene3d || {};
  if (!(BO3D.c3d && BO3D.c3d.on('OT-28'))) return;   /* design3d.build가 false면 이야기 카드로만 간다 */
  BO3D.scene3d['OT-28'] = function (api) {
    var T = THREE, M2 = BO3D.models2 || {}, MO = BO3D.models || {}, PR = BO3D.props, FX = api.FX, C3 = BO3D.c3d, R = PR.rng(2811), sm = C3.sm, noise = C3.noise, hash = C3.hash, i, k;
    var TERR = 1.6, HW = 4.5, HL = 27, HH = 13.5, HZ0 = -38.5, PORCH = 4.5, PH = 11, ALTAR = [0, -24.5], SOL = [0, -20.4];
    var HOUSE_C = [0, HZ0 - HL / 2], DOOR = [0, HZ0 + PORCH];   /* 전: z -65.5..-38.5, 낭실: z -38.5..-34 */
    function height(x, z) {
      var up = sm(-29, -33, z) * sm(16, 12, Math.abs(x));                                    /* 전이 선 높은 터 */
      return TERR * up + 0.3 * noise(x * 0.06 + 2, z * 0.06 + 5) * (1 - up) + sm(120, 230, Math.hypot(x, z)) * 12 * noise(x * 0.02, z * 0.02);
    }
    function walkable(x, z) { return (x >= -36 && x <= 30 && z >= 3 && z <= 32); }

    var scene = new T.Scene();
    scene.background = new T.Color('#EEE2C6'); scene.fog = new T.Fog('#EEE2C6', 80, 320);
    var skyG = new T.SphereGeometry(560, 24, 14), sp = skyG.attributes.position, sc = new Float32Array(sp.count * 3), cc = new T.Color(), top = new T.Color('#7AB0D2'), hor = new T.Color('#F3E7CA');
    for (i = 0; i < sp.count; i++) { var tt = Math.max(0, sp.getY(i) / 560); cc.copy(hor).lerp(top, sm(0.02, 0.7, tt)); sc[i * 3] = cc.r; sc[i * 3 + 1] = cc.g; sc[i * 3 + 2] = cc.b; }
    skyG.setAttribute('color', new T.BufferAttribute(sc, 3));
    var skyM = new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false }); scene.add(new T.Mesh(skyG, skyM));
    var g = new T.PlaneGeometry(520, 520, 150, 150); g.rotateX(-Math.PI / 2);
    var pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color(), s1 = new T.Color('#C9B283'), s2 = new T.Color('#AFA270'), court = new T.Color('#DCCDA8'), lane = new T.Color('#D3C092');
    for (i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i), y = height(x, z); pos.setY(i, y);
      c.copy(s1).lerp(s2, noise(x * 0.06, z * 0.06));
      if (Math.abs(x) < 24 && z > -70 && z < 0) c.lerp(court, 0.75);                                  /* 전과 단 앞의 뜰 */
      if ((Math.abs(x - 23) < 2.6 && z > -10 && z < 90) || (Math.abs(z - 18) < 2.4 && x < -30 && x > -90) || (Math.abs(x) < 3 && z > 0 && z < 90)) c.lerp(lane, 0.7);   /* 길 */
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

    /* 여호와의 전(6:2-3의 크기)과 낭실, 높은 터와 층계, 단(8:22). 꾸밈은 그리지 않는다 */
    var stoneM = std('#E2D3AE'), stoneM2 = std('#CDBE98'), roofM = std('#B9A980'), sp2 = [];
    sp2.push(box(36, TERR, 44, stoneM2, 0, -51, 0));                                                                 /* 높은 터 */
    sp2.push(box(HW * 2, HH, HL, stoneM, HOUSE_C[0], HOUSE_C[1], TERR)); sp2.push(box(HW * 2 + 0.6, 0.6, HL + 0.6, roofM, HOUSE_C[0], HOUSE_C[1], TERR + HH));
    sp2.push(box(HW * 2, PH, PORCH, stoneM, 0, HZ0 + PORCH / 2, TERR)); sp2.push(box(HW * 2 + 0.6, 0.5, PORCH + 0.6, roofM, 0, HZ0 + PORCH / 2, TERR + PH));
    for (k = 0; k < 4; k++) sp2.push(box(12, TERR * (k + 1) / 4, 1.1, stoneM2, 0, -29.45 - k * 1.1, 0));   /* 층계(높은 터의 남쪽 끝) */
    sp2.push(box(5, 2.4, 5, std('#A89068'), ALTAR[0], ALTAR[1]));                                                     /* 여호와의 단(생김새는 본문에 없음) */
    scene.add(PR.mergeStatic(sp2));
    var dark = new T.Mesh(new T.PlaneGeometry(3.4, 6), new T.MeshBasicMaterial({ color: '#2E2620' })); dark.position.set(0, TERR + 3, DOOR[1] + 0.03); scene.add(dark);   /* 낭실의 문(안은 보이지 않는다) */

    /* 예루살렘의 집들(멀리)과 둘레의 땅 */
    var hs = [], houseM = [std('#E2C79A'), std('#D7B98A'), std('#E9D3A8')];
    for (i = 0; i < 60; i++) { var hx = -110 + R() * 220, hz = -100 + R() * 220; if ((Math.abs(hx) < 46 && hz > -80 && hz < 40) || Math.abs(hx - 23) < 8 || Math.abs(hz - 18) < 7 || Math.abs(hx) < 7) continue; var hw = 5 + R() * 4, hh = 3 + R() * 4; hs.push(box(hw, hh, 5 + R() * 4, houseM[i % 3], hx, hz)); }
    if (hs.length) scene.add(PR.mergeStatic(hs));
    var deco = [];
    if (MO.rock) for (i = 0; i < 26; i++) { var rx = -150 + R() * 300, rz = -150 + R() * 300; if (Math.abs(rx) < 60 && rz > -90 && rz < 50) continue; var ro = MO.rock(2830 + i); ro.scale.multiplyScalar(0.7 + R() * 1.4); ro.position.set(rx, height(rx, rz) - 0.1, rz); deco.push(ro); }
    if (MO.shrub) for (i = 0; i < 20; i++) { var shx = -150 + R() * 300, shz = -150 + R() * 300; if (Math.abs(shx) < 60 && shz > -90 && shz < 50) continue; var sh = MO.shrub(280 + i); sh.position.set(shx, height(shx, shz), shz); deco.push(sh); }
    if (deco.length) scene.add(C3.merge(deco));

    /* 사람 */
    function man(seed, opt) { var o = null; try { if (M2.israelite) o = M2.israelite(seed, opt || { kind: 'man', carry: 'none' }); } catch (e) { o = null; } if (!o) o = PR.soldier(seed, '#7A6A54', null); o.group.rotation.order = 'YXZ'; scene.add(o.group); return o; }
    function setAt(o, x, z, ry, dy) { o.group.position.set(x, height(x, z) + (dy || 0), z); if (ry !== undefined) o.group.rotation.y = ry; }
    function mkPath(pts) { var L = [], tot = 0; for (var n = 0; n + 1 < pts.length; n++) { var l = Math.hypot(pts[n + 1][0] - pts[n][0], pts[n + 1][1] - pts[n][1]); L.push(l); tot += l; } return { p: pts, L: L, tot: tot }; }
    function pathAt(P, s) { s = Math.min(P.tot, Math.max(0, s)); for (var n = 0; n < P.L.length; n++) { if (s <= P.L[n] || n === P.L.length - 1) { var u = P.L[n] ? Math.min(1, s / P.L[n]) : 1, a = P.p[n], b = P.p[n + 1]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, Math.atan2(b[0] - a[0], b[1] - a[1])]; } s -= P.L[n]; } var e = P.p[P.p.length - 1]; return [e[0], e[1], 0]; }
    function walk(o, P, s, endRy, dt) { var w = pathAt(P, s), mv = s > 0 && s < P.tot; o.group.visible = true; setAt(o, w[0], w[1], mv || endRy === undefined ? w[2] : endRy); if (o.update) o.update(dt, mv ? 1 : 0); return mv; }
    /* 제사장의 흰 옷: 목 아래 옷 빛깔만 바꾼다(빛깔은 이 본문에 없음) */
    var LIN = new T.Color('#F1EBDD'); if (MO.config && MO.config.srgbOutput) LIN.convertSRGBToLinear();
    function linen(o) {
      var rig = o.group.children[0], H = o.group.userData.height || 1.7; if (!rig || !rig.children || !rig.children[0]) return;
      function paint(mesh, test) { if (!mesh || !mesh.geometry || !mesh.geometry.attributes.color) return; var ca = mesh.geometry.attributes.color, pa = mesh.geometry.attributes.position; for (var n = 0; n < ca.count; n++) if (test(pa.getX(n), pa.getY(n), pa.getZ(n))) { var f = 0.84 + 0.18 * hash(n, 5); ca.setXYZ(n, LIN.r * f, LIN.g * f, LIN.b * f); } ca.needsUpdate = true; }
      paint(rig.children[0], function (x, y) { return y < H * 0.795; }); var reach = 0.315 * H * 0.88; [rig.children[1], rig.children[2]].forEach(function (a) { paint(a, function (x, y, z) { return Math.hypot(x, y, z) < reach; }); });
    }
    function arms(o, l, r, zz) { var rig = o.group.children[0]; if (!rig || !rig.children || !rig.children[1]) return; rig.children[1].rotation.x = l; rig.children[2].rotation.x = r; rig.children[1].rotation.z = zz; rig.children[2].rotation.z = -zz; }
    var sol = man(2801, { kind: 'man', carry: 'none' });                                          /* 솔로몬: 무리 모형(왕관과 꾸민 옷 없음) */
    /* 제사장(8:3)과 레위 사람(8:4)의 행렬: 동쪽 길로 올라와 낭실로 들어간다 */
    var priests = [];
    for (i = 0; i < 14; i++) {
      var pr = man(2810 + i * 7, { kind: 'man', carry: 'none' }); if (i < 8) linen(pr);
      var lane2 = (i % 2 ? 0.7 : -0.7), back = Math.floor(i / 2) * 1.6;
      pr.P = mkPath([[23 + lane2, 50 + back], [23 + lane2, -6 + back], [12 + lane2, -22], [4 + lane2 * 0.5, -27.6], [lane2 * 0.6, DOOR[1] + 0.8], [0, DOOR[1] - 1.5]]);
      pr.out = [-8 + (i % 7) * 2.6 + (i < 7 ? 0 : 1.3), -31.5 - (i < 7 ? 0 : 1.6)];                  /* 8:10-11 나와서 전 앞에 비켜 선다 */
      priests.push(pr);
    }
    /* 온 회중(8:5, 8:14). 앞줄은 장로와 족장들(8:1) */
    var cong = [], COLS = 8, ROWS = 7;
    for (i = 0; i < COLS * ROWS; i++) {
      var row = Math.floor(i / COLS), cl = i % COLS, cp = man(i * 19 + 2900, row === 0 ? { kind: 'man', carry: 'none' } : { carry: 'none' });
      cp.home = [-12.25 + cl * 3.5 + (hash(i, 1) - 0.5) * 0.8, -17 + row * 2.3 + (hash(i, 2) - 0.5) * 0.5];
      cong.push(cp);
    }
    /* 8:2 길로 모여 오는 사람들(보따리를 진 사람도 있다) */
    var comers = [];
    for (i = 0; i < 14; i++) {
      var cm = man(i * 23 + 3000, i % 3 ? {} : { carry: 'none' }), west = i % 2 === 0, off = Math.floor(i / 2) * 7;
      cm.P = west ? mkPath([[-90 - off, 18 + (hash(i, 3) - 0.5) * 2], [-40, 18], [-14 + (i % 4) * 4, 0]]) : mkPath([[(hash(i, 4) - 0.5) * 3, 80 + off], [(hash(i, 4) - 0.5) * 3, 36], [-4 + (i % 4) * 3, 0]]);
      cm.P.tot += 0; comers.push(cm);
    }

    /* 구름(8:10-11): 전을 둘러싸는 흰 구름. 사람 모양이나 얼굴, 빛줄기는 만들지 않는다 */
    var cv = document.createElement('canvas'); cv.width = cv.height = 64; var cx = cv.getContext('2d'), gr = cx.createRadialGradient(32, 32, 2, 32, 32, 31);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); cx.fillStyle = gr; cx.fillRect(0, 0, 64, 64);
    var CN = 170, cloudG = new T.BufferGeometry(), cp0 = new Float32Array(CN * 3), cpos = new Float32Array(CN * 3), cseed = [];
    for (i = 0; i < CN; i++) {
      var ox = (R() - 0.5) * (HW * 2 + 9), oy = TERR + R() * (HH + 5), oz = HZ0 + PORCH + 3 - R() * (HL + PORCH + 8);
      cp0[i * 3] = ox; cp0[i * 3 + 1] = oy; cp0[i * 3 + 2] = oz; cseed.push(R() * 6.28);
      cpos[i * 3] = 0; cpos[i * 3 + 1] = TERR + 3; cpos[i * 3 + 2] = DOOR[1];
    }
    cloudG.setAttribute('position', new T.BufferAttribute(cpos, 3));
    var cloudM = new T.PointsMaterial({ size: 9, map: new T.CanvasTexture(cv), transparent: true, opacity: 0, depthWrite: false, color: '#FFFFFF' }), cloud = new T.Points(cloudG, cloudM);
    cloud.frustumCulled = false; scene.add(cloud);
    var cloudAmt = 0, cloudWant = 0;
    function placeCloud(now) {
      var e = cloudAmt * cloudAmt * (3 - 2 * cloudAmt);
      for (var n = 0; n < CN; n++) {
        var dr = 0.6 * Math.sin(now * 0.25 + cseed[n]);
        var k0 = 0.22 + 0.78 * e;   /* 전 안(벽에 가려 보이지 않는 곳)에서 시작해 전을 둘러싸며 퍼진다. 문 한곳에 몰려 빛줄기처럼 보이지 않게 */
        cpos[n * 3] = cp0[n * 3] * k0 + dr; cpos[n * 3 + 1] = (TERR + HH * 0.45) + (cp0[n * 3 + 1] - TERR - HH * 0.45) * k0 + 0.4 * Math.sin(now * 0.3 + cseed[n] * 2); cpos[n * 3 + 2] = HOUSE_C[1] + (cp0[n * 3 + 2] - HOUSE_C[1]) * k0;
      }
      cloudG.attributes.position.needsUpdate = true;
    }

    var phase = 'gather', pt = 0, kneel = 0, kneelWant = 0, raise = 0, raiseWant = 0;
    function hideAll() { [sol].concat(priests, cong, comers).forEach(function (o) { o.group.visible = false; o.group.rotation.x = 0; }); arms(sol, 0, 0, 0); }
    function standCong() { cong.forEach(function (o) { setAt(o, o.home[0], o.home[1], Math.PI); o.group.visible = true; if (o.update) o.update(0.016, 0); }); }
    function setPhase(p) {
      phase = p; pt = 0; hideAll(); kneel = 0; kneelWant = 0; raise = 0; raiseWant = 0;
      cloudWant = p === 'cloud' || p === 'bless' || p === 'pray' || p === 'kneel' || p === 'rise' ? 1 : 0; cloudAmt = p === 'cloud' ? 0 : cloudWant;
      if (p === 'gather') comers.forEach(function (o) { o.group.visible = true; });
      if (p === 'ark' || p === 'wait') { standCong(); }
      if (p === 'ark') { setAt(sol, SOL[0], SOL[1], Math.PI); sol.group.visible = true; if (sol.update) sol.update(0.016, 0); }   /* 8:5 솔로몬과 회중이 함께 있다 */
      if (p !== 'gather' && p !== 'ark' && p !== 'wait') {
        standCong();
        priests.forEach(function (o) { setAt(o, o.out[0], o.out[1], 0); o.group.visible = true; if (o.update) o.update(0.016, 0); });
        setAt(sol, SOL[0], SOL[1], p === 'cloud' ? Math.PI : 0); sol.group.visible = true; if (sol.update) sol.update(0.016, 0);   /* 8:14 얼굴을 돌이켜 회중을 본다 */
        if (p === 'pray') raiseWant = 1;                                                                  /* 8:22 손을 편다 */
        if (p === 'kneel') { raiseWant = 1; kneelWant = 1; }                                             /* 8:54 무릎을 꿇고 손을 편다 */
        if (p === 'rise') { kneel = 1; kneelWant = 0; raise = 1; raiseWant = 0; }                        /* 8:54-55 일어나 서서 축복한다 */
        if (p === 'cloud') priests.forEach(function (o) { o.group.visible = false; });                    /* 8:10 성소에서 나오는 때부터 */
      }
      placeCloud(0); cloudM.opacity = 0.55 * cloudAmt;
    }
    if (window.BO3D_TEST) C3.t28 = { skip: function (sec) { pt += sec; if (phase === 'cloud' && pt > 2) cloudAmt = 1 - (1 - cloudAmt) * Math.exp(-0.35 * Math.min(sec, pt - 2)); } };   /* 시험에서 때를 건너뛰어 볼 때만 쓴다 */
    if (FX) FX.sortLayers(scene);
    setPhase('gather');

    return {
      id: 'OT-28', scene: scene, sun: sun, sunOff: [-30, 50, 30],
      height: height, walkable: walkable,
      edge: function (x, z) {
        if (z < 3) return { who: 'onwoo', text: '회중 앞쪽과 단, 전 쪽으로는 가지 말자. 우리는 뒤에서 지켜보는 사람이야.' };
        if (x > 30) return { who: 'hyu', text: '저 동쪽으로는 가지 말자. 이 길과 회중 뒤쪽에서만 다니자.' };
        return { who: 'hyu', text: '이 길과 회중 뒤쪽에서만 다니자.' };
      },
      P: { start: [0, 24], machine: [-8, 28], machineRot: 0.4,
        /* 재료가 놓인 곳(quests[i].found): 전에서 멀리 떨어진 서쪽 길가 / 남쪽 길가 / 회중 뒤쪽 땅 */
        parts: [[-32, 21], [8, 30], [-6, 6]], lookSpot: [-6, 6],
        look: { focus: [0, DOOR[1]], mid: [0, -20], dy: 5, backE: 10, upE: 5 } },
      eventCam: function (i) {
        if (i === 1) return { pos: [14, 30, 60], look: [8, 2, -16] };                        /* 8:3-6 동쪽 길로 올라와 전으로 들어가는 행렬 */
        if (i === 2) return { pos: [4, height(4, 10) + 7, 10], look: [0, TERR + 9, -46] };                          /* 8:10-11 구름이 가득한 전 */
        return null;
      },
      eventLook: function (i) { if (i >= 3) return { focus: [SOL[0], SOL[1]], mid: [0, -12], dy: 1.4, backE: 10, upE: 4.5 }; return null; },
      beatNote: function (i) {
        if (i === 0) return '전에서 멀리 떨어진 예루살렘 길이에요. 칠월 절기에 사람들이 모여들고 있어요.';
        if (i === 1) return '언약궤와 성막의 기구, 지성소 안은 그리지 않았어요. 제사장들이 메고 올라가 전으로 들어가는 것까지만 멀리서 봐요. 무엇을 메었는지는 성경책에서 읽어요.';
        if (i === 2) return '여호와의 영광은 전에 가득한 구름으로만 나타냈어요. 구름 속에는 아무 모양도 그리지 않았어요.';
        return null;
      },
      helpNote: function (after) {
        if (after === 0) return '이 일은 전에서 멀리 떨어진 예루살렘 길에서 해요.';
        if (after === 3) return '우리는 회중 맨 뒤에서 함께 서 있어요. 앞으로 나아가지 않아요.';
        return null;
      },
      detector: '탐지기', askLabel: '탐지기 물음 풀기',
      intro: { text: '타임머신이 예루살렘 길가에 내려앉았어요. 북쪽 높은 터에 여호와의 전이 보여요.', say: { who: 'hyu', text: '전과 단 쪽으로는 가지 말자. 이 길과 회중 뒤쪽에서만 다니자.' } },
      lookText: '성전 봉헌 이야기를 성경에서 찾아 읽은 뒤 다시 골라 보세요.',
      partBeats: [0], eventStart: 1,
      sceneDoneText: '성전 봉헌을 끝까지 지켜봐야 떠날 수 있어요.',
      dex: [
        { id: 'house', name: '여호와의 전', desc: '솔로몬이 지은 전. 길이 60규빗, 너비 20규빗, 높이 30규빗', ref: '왕상 6:2', hint: '북쪽 높은 터 위를 담아 보세요.', range: 120, crop: 0.6, pos: function () { return v3(0, TERR + 7, HOUSE_C[1]); } },
        { id: 'altar', name: '여호와의 단', desc: '솔로몬이 그 앞에 서서 손을 편 단', ref: '왕상 8:22', hint: '전 앞쪽을 보세요.', range: 90, crop: 0.4, pos: function () { return v3(ALTAR[0], 2, ALTAR[1]); } },
        { id: 'cong', name: '온 회중', desc: '칠월 절기에 솔로몬 앞에 모인 이스라엘', ref: '왕상 8:2', hint: '뜰에 선 사람들을 보세요.', range: 70, visible: function () { return cong[0].group.visible; }, pos: function () { return v3(0, 1, -10); } }
      ],
      reset: function () { setPhase('gather'); },
      partFound: function () {},
      partContinue: function (i) { if (i === 0) setPhase('wait'); },
      lookupPose: function () { if (phase !== 'wait') setPhase('wait'); },
      /* 대목 번호(OT-28.json): 0 = 8:1-2, 1 = 8:3-9, 2 = 8:10-11, 3 = 8:12-21, 4 = 8:22-26, 5 = 8:27-30, 6 = 8:54-61 */
      beatPose: function (i) { setPhase(['gather', 'ark', 'cloud', 'bless', 'pray', 'kneel', 'rise'][i] || 'wait'); },
      update: function (dt, now) {
        pt += dt;
        if (phase === 'gather' || phase === 'wait') comers.forEach(function (o, n) { if (phase === 'wait') { o.group.visible = false; return; } walk(o, o.P, (pt + n * 3.1) * 1.4 % (o.P.tot + 8), undefined, dt); });   /* 8:2 모여 온다 */
        if (phase === 'ark') priests.forEach(function (o, n) { var s = Math.max(0, pt - 1) * 2.2; if (s < o.P.tot) walk(o, o.P, s, undefined, dt); else o.group.visible = false; });   /* 8:3-6 */
        if (phase === 'cloud') {
          cloudWant = pt > 2 ? 1 : 0;                                                                         /* 8:10 제사장이 나올 때에 구름이 가득하다 */
          priests.forEach(function (o, n) { var s = (pt - n * 0.25) * 1.8; if (s > 0) { if (!o.Q) o.Q = mkPath([[0, DOOR[1] - 1], [0, DOOR[1] + 1.5], o.out]); walk(o, o.Q, s, 0, dt); } });
        }
        if (cloudAmt !== cloudWant) { cloudAmt += (cloudWant - cloudAmt) * Math.min(1, dt * 0.35); if (Math.abs(cloudAmt - cloudWant) < 0.002) cloudAmt = cloudWant; }
        if (cloudAmt > 0.001) { placeCloud(now); cloudM.opacity = 0.55 * cloudAmt; } else cloudM.opacity = 0;
        if (sol.group.visible) {
          if (phase === 'rise') { kneelWant = pt > 1.5 ? 0 : 1; raiseWant = pt > 1.5 ? 0.35 : 1; }
          kneel += (kneelWant - kneel) * Math.min(1, dt * 1.5); raise += (raiseWant - raise) * Math.min(1, dt * 1.5);
          arms(sol, -2.6 * raise, -2.6 * raise, 0.35 * raise);
          sol.group.position.y = height(SOL[0], SOL[1]) - 0.5 * kneel; sol.group.rotation.x = 0.08 * kneel;   /* 무릎 꿇은 높이로 낮춘다 */
        }
      },
      audio: function (A) { A.setFlock(999); A.setFire(999); },   /* 기도와 축복의 말, 구름의 소리는 만들지 않는다 */
      menuCam: function (camera, now) { var a = now * 0.05; camera.position.set(Math.sin(a) * 10, 9, 26); camera.lookAt(0, TERR + 6, -40); },
      debug: { phase: function () { return { phase: phase, pt: pt, cloud: cloudAmt, kneel: kneel, raise: raise }; }, arrived: function () { return phase !== 'gather'; } }
    };
  };
})();
