/* 3D 장면 설정: OT-27 다윗에게 주신 언약 (삼하 7:1-17).
 * 방향: 왕의 백향목 궁은 북쪽(-Z)의 조금 높은 터에 남쪽을 보고 서 있다. 궁 앞에 기둥 줄(지붕 덮인 앞자리)이 있고, 그 앞이 뜰, 뜰 앞에 낮은 담, 담 앞(남쪽)이 길이다.
 *   아이들은 궁 앞 길과 둘레 길에서만 다닌다(담 너머 뜰과 궁으로 가지 않는다).
 * 아이들이 다니는 때: 왕이 궁에 평안히 거할 때, 다윗과 나단이 궁 앞에서 이야기할 때(7:1-3). 7:1-2부터 궁 앞 길에서 지켜보기로 본다(재료를 주울 때가 아니라).
 * 본문에 맞춘 점 (content/ot/OT-27.json design3d)
 *  - 7:1-3: 다윗 왕과 선지자 나단이 궁 앞 기둥 줄 아래에서 마주 서 있다. 말은 대목의 글로만(입 모양·몸짓으로 말을 지어내지 않는다).
 *    본문은 궁 어디에서 말했는지 말하지 않는다. 아이들이 멀리서 볼 수 있게 궁 앞에 둔다.
 *  - 7:4-16: 그 밤. 타임머신 창 너머로 밤의 예루살렘을 멀리서 본다(아이들은 화면에 없음). 나단이 그 밤에 어디에 있었는지는 본문에 없어 그리지 않는다.
 *    하나님의 말씀은 글로만. 밤하늘에 특별한 빛을 두지 않는다(별과 푸른 밤빛, 집들 창의 작은 불빛만).
 *  - 7:17: 나단이 궁 앞 길에서 뜰 입구로 들어와 층계를 올라 왕 앞에 선다(대목이 열리고 약 8초). 말씀을 전한 때는 본문에 없어 낮으로 둔다.
 *  - 하나님의 궤와 장막(7:2, 6:17)은 왕의 말 속에만 나오므로 그리지 않는다. 지어질 집(7:13)과 다윗의 몸에서 날 자식(7:12)도 그리지 않는다.
 * 감수가 필요한 설정: 궁의 생김새·크기·자리(돌 터, 백향목 벽과 기둥, 앞 기둥 줄, 문과 작은 창. 5:11 백향목·목수·석수), 높은 터와 층계, 뜰과 낮은 담,
 *   다윗과 나단이 궁 앞에서 이야기하는 자리(본문에 없음), 다윗의 생김새(tools/blender/people/davidking.json: 어른, 수염, 붉은 겉옷, 왕관 없음)와 나단의 생김새(무리 모형),
 *   7:17 나단이 오는 길(궁 앞 길에서 뜰 입구로)과 때(낮으로 둠), 그 밤의 빛(푸른 밤빛, 별, 집과 궁 창의 불빛), 성 안 집과 길과 오가는 사람, 날씨(맑음),
 *   재료(백향목 조각 7:2 — 궁에서 떨어진 서쪽 길가, 양털 몇 가닥 7:8 — 성 동남쪽 길가, 누구의 것인지 정하지 않음, 돌 부스러기 5:11 석수 — 궁 앞 길 가장자리, 누가 남긴 것인지 정하지 않음).
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  BO3D.scene3d = BO3D.scene3d || {};
  if (!(BO3D.c3d && BO3D.c3d.on('OT-27'))) return;   /* design3d.build가 false면 이야기 카드로만 간다 */
  BO3D.scene3d['OT-27'] = function (api) {
    var T = THREE, M2 = BO3D.models2 || {}, MO = BO3D.models || {}, PR = BO3D.props, FX = api.FX, C3 = BO3D.c3d, R = PR.rng(2711), sm = C3.sm, noise = C3.noise, hash = C3.hash, i;
    var TERR = 2.2, WALL_Z = -22, PAL = [0, -41], PAL_W = 22, PAL_D = 14, FRONT_Z = PAL[1] + PAL_D / 2, PORCH_Z = -31.8;
    var DAV = [-1.3, -31.3], NAT = [1.3, -31.0];
    /* 그려지는 땅. 높은 터의 오르막은 돌 터 상자 밑에 숨긴다(땅 격자가 3.47 간격이라 층계 앞에서 비탈이 드러나지 않게) */
    function groundH(x, z) {
      var terr = sm(-28.2, -31.4, z) * (1 - sm(31.5, 35, Math.abs(x)));
      return (TERR - 0.15) * terr + 0.16 * noise(x * 0.08 + 3, z * 0.08 + 1) * (1 - terr) + sm(110, 220, Math.hypot(x, z)) * 14 * noise(x * 0.02, z * 0.02);
    }
    function onTerr(x, z) { return Math.abs(x) <= 29 && z <= -27.2 && z >= -61; }   /* 궁이 선 조금 높은 돌 터 */
    function height(x, z) { return onTerr(x, z) ? TERR : groundH(x, z); }
    function gy(x, z) {   /* 발 높이: 층계 칸, 앞자리 앞 낮은 칸, 앞자리 바닥을 따른다 */
      var y = height(x, z);
      if (Math.abs(x) < 3.1 && z <= -24.975 && z > -27.2) y = Math.max(y, TERR * (Math.min(3, Math.floor((-24.975 - z) / 0.55)) + 1) / 4);
      if (Math.abs(x) < 3.1 && z <= -29.0 && z > -29.5) y = TERR + 0.3;
      if (Math.abs(x) < PAL_W / 2 && z <= -29.5 && z > FRONT_Z - 0.5) y = TERR + 0.6;
      return y;
    }
    function angTo(a, b, k) { return b + Math.atan2(Math.sin(a - b), Math.cos(a - b)) * k; }
    function walkable(x, z) { return x >= -34 && x <= 34 && z >= -18 && z <= 28; }

    var scene = new T.Scene();
    scene.background = new T.Color('#E8E0CC'); scene.fog = new T.Fog('#E8E0CC', 80, 330);
    var skyG = new T.SphereGeometry(560, 24, 14), sp = skyG.attributes.position, sc = new Float32Array(sp.count * 3), cc = new T.Color(), top = new T.Color('#7FB0D2'), hor = new T.Color('#F1E6CC');
    for (i = 0; i < sp.count; i++) { var tt = Math.max(0, sp.getY(i) / 560); cc.copy(hor).lerp(top, sm(0.02, 0.7, tt)); sc[i * 3] = cc.r; sc[i * 3 + 1] = cc.g; sc[i * 3 + 2] = cc.b; }
    skyG.setAttribute('color', new T.BufferAttribute(sc, 3));
    var skyM = new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false }); scene.add(new T.Mesh(skyG, skyM));
    /* 별(그 밤에만). 특별한 빛은 두지 않는다 */
    var stN = 420, stP = new Float32Array(stN * 3);
    for (i = 0; i < stN; i++) { var th = R() * Math.PI * 2, ph = 0.12 + R() * 1.3; stP[i * 3] = Math.cos(th) * Math.cos(ph) * 520; stP[i * 3 + 1] = Math.sin(ph) * 520; stP[i * 3 + 2] = Math.sin(th) * Math.cos(ph) * 520; }
    var stG = new T.BufferGeometry(); stG.setAttribute('position', new T.BufferAttribute(stP, 3));
    var stars = new T.Points(stG, new T.PointsMaterial({ color: '#DDE6FF', size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 })); stars.visible = false; scene.add(stars);

    var g = new T.PlaneGeometry(520, 520, 150, 150); g.rotateX(-Math.PI / 2);
    var pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color(), s1 = new T.Color('#C7B089'), s2 = new T.Color('#B3A07C'), lane = new T.Color('#D3C39E'), court = new T.Color('#D8CCAE'), terrC = new T.Color('#C9BA98');
    for (i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i), y = groundH(x, z); pos.setY(i, y);
      c.copy(s1).lerp(s2, noise(x * 0.06, z * 0.06));
      if (walkable(x, z) || (Math.abs(x) < 5 && z > 28 && z < 80) || (z > -16 && z < -8 && Math.abs(x) < 80) || (z > 14 && z < 20 && Math.abs(x) < 80)) c.lerp(lane, 0.7);   /* 궁 앞 길과 둘레 길 */
      if (z < WALL_Z && z > -26 && Math.abs(x) < 28) c.lerp(court, 0.85);
      if (z <= -26 && z > -60 && Math.abs(x) < 29) c.lerp(terrC, 0.6);
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
    /* 창: 낮에는 어두운 구멍, 그 밤에는 작은 불빛(본문에 없음, 밤을 알리는 데까지만) */
    var lampM = new T.MeshStandardMaterial({ color: '#3A2E24', emissive: '#FFB45E', emissiveIntensity: 0, flatShading: true, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });   /* 벽보다 앞에 그린다(먼 곳 깊이 줄무늬 막기) */

    /* 성 안의 집들(본문에 생김새 없음): 단순한 네모. 길과 아이들이 걷는 곳은 비워 둔다 */
    var houseM = [std('#E2CBA0'), std('#D6BC90'), std('#E8D5AE')], roofM = std('#BFA57C'), hs = [], wins = [];
    function block(x0, x1, z0, z1) {
      for (var hx = x0; hx < x1; hx += 7 + hash(hx, z0) * 3) for (var hz = z0; hz < z1; hz += 7 + hash(hz, x0) * 3) {
        var w = 5 + hash(hx, hz) * 2.4, d = 5 + hash(hz, hx) * 2.4, h = 3.2 + hash(hx + 3, hz) * 3.0, m = houseM[Math.floor(hash(hx, hz + 7) * 3)];
        if (hx + w > x1 || hz + d > z1) continue;
        var cx = hx + w / 2, cz = hz + d / 2, by = height(cx, cz);
        hs.push(box(w, h, d, m, cx, cz)); hs.push(box(w + 0.3, 0.3, d + 0.3, roofM, cx, cz, by + h));
        if (hash(hx + 1, hz + 2) < 0.85) {   /* 길 쪽(가운데 쪽) 벽에 작은 창 하나 */
          var wn = Math.abs(cx) > Math.abs(cz) * 0.9 ? box(0.6, 1.1, 1.0, lampM, cx - Math.sign(cx) * (w / 2 + 0.1), cz, by + h * 0.42) : box(1.0, 1.1, 0.6, lampM, cx, cz - Math.sign(cz) * (d / 2 + 0.1), by + h * 0.42);   /* 벽에서 0.4 나오게(깊이 줄무늬 막기) */
          wins.push(wn);
        }
      }
    }
    block(-80, -36, -6, 13); block(-80, -36, 21, 50); block(36, 80, -6, 13); block(36, 80, 21, 50);
    block(-70, -6, 31, 66); block(6, 70, 31, 66); block(-80, -32, -70, -18); block(32, 80, -70, -18);
    scene.add(C3.merge(hs));

    /* 왕의 백향목 궁(7:2, 5:11): 돌 터, 백향목 벽과 기둥, 앞 기둥 줄. 꾸밈과 무늬 없이 */
    var stoneM = std('#CDBD9A'), stoneM2 = std('#B9A886'), cedarM = std('#8A5A3C'), cedarD = std('#6E4630'), doorM = std('#2E241C'), pal = [];
    pal.push(box(PAL_W + 1, 0.6, PAL_D + 1, stoneM, PAL[0], PAL[1], TERR));
    pal.push(box(PAL_W, 6.4, PAL_D, cedarM, PAL[0], PAL[1], TERR + 0.6));
    [2.4, 4.8].forEach(function (yy) { pal.push(box(PAL_W + 0.16, 0.28, PAL_D + 0.16, cedarD, PAL[0], PAL[1], TERR + 0.6 + yy)); });   /* 백향목 들보 줄 */
    pal.push(box(PAL_W + 1, 0.5, PAL_D + 1, cedarD, PAL[0], PAL[1], TERR + 7));
    pal.push(box(2.6, 3.6, 0.2, doorM, 0, FRONT_Z + 0.02, TERR + 0.6));
    pal.push(box(PAL_W, 0.6, 4.6, stoneM, 0, PORCH_Z, TERR));                                        /* 앞자리 바닥 */
    pal.push(box(PAL_W + 0.4, 0.4, 4.8, cedarD, 0, PORCH_Z, TERR + 0.6 + 4.4));                         /* 앞자리 지붕 */
    [-10.4, -6.8, -3.3, 3.3, 6.8, 10.4].forEach(function (px) { var cl = new T.Mesh(new T.CylinderGeometry(0.32, 0.36, 4.4, 10), cedarM); cl.position.set(px, TERR + 0.6 + 2.2, PORCH_Z + 1.95); pal.push(cl); });
    for (i = 0; i < 4; i++) pal.push(box(6.4 - i * 0.2, TERR * (i + 1) / 4, 0.55, stoneM2, 0, -25.25 - i * 0.55, 0));   /* 높은 터로 오르는 층계 */
    pal.push(box(58, TERR, 33.8, stoneM, 0, -44.1, 0));                                                    /* 궁이 선 조금 높은 돌 터(z -27.2 ~ -61) */
    pal.push(box(6.4, 0.3, 0.5, stoneM2, 0, -29.25, TERR));                                                 /* 앞자리 앞의 낮은 칸 */
    pal.push(box(25.4, 1.3, 0.5, stoneM2, -15.3, WALL_Z, 0)); pal.push(box(25.4, 1.3, 0.5, stoneM2, 15.3, WALL_Z, 0));                 /* 뜰 앞 낮은 담(가운데는 드나드는 곳) */
    pal.push(box(0.5, 1.3, 4.6, stoneM2, -28, -24.3, 0)); pal.push(box(0.5, 1.3, 4.6, stoneM2, 28, -24.3, 0));
    scene.add(C3.merge(pal));
    [-8.6, -5, 5, 8.6].forEach(function (wx) { wins.push(box(1.0, 0.8, 0.6, lampM, wx, FRONT_Z + 0.1, TERR + 5.8)); });   /* 궁 앞벽 위쪽(앞자리 지붕 위)의 작은 창 */
    var winM = C3.merge(wins); winM.traverse(function (m) { m.castShadow = false; m.receiveShadow = false; }); scene.add(winM);   /* 창에 그림자 줄무늬가 지지 않게 */

    /* 둘레의 땅(멀리): 바위와 떨기만 */
    var deco = [];
    if (MO.rock) for (i = 0; i < 30; i++) { var ro = MO.rock(2730 + i), rx = -170 + R() * 340, rz = -170 + R() * 340; if (Math.abs(rx) < 88 && rz > -80 && rz < 75) continue; ro.scale.multiplyScalar(0.8 + R() * 1.6); ro.position.set(rx, height(rx, rz) - 0.1, rz); deco.push(ro); }
    if (MO.shrub) for (i = 0; i < 26; i++) { var sh = MO.shrub(270 + i), sx = -160 + R() * 320, sz = -160 + R() * 320; if (Math.abs(sx) < 88 && sz > -80 && sz < 75) continue; sh.position.set(sx, height(sx, sz), sz); deco.push(sh); }
    if (deco.length) scene.add(C3.merge(deco));

    /* 사람 */
    function man(seed, opt) { var o = null; try { if (M2.israelite) o = M2.israelite(seed, opt || { kind: 'man', carry: 'none' }); } catch (e) { o = null; } if (!o) o = PR.soldier(seed, '#7A6A54', null); o.group.rotation.order = 'YXZ'; scene.add(o.group); return o; }
    function setAt(o, x, z, ry) { o.group.position.set(x, gy(x, z), z); if (ry !== undefined) o.group.rotation.y = ry; }
    function mkPath(pts) { var L = [], tot = 0; for (var n = 0; n + 1 < pts.length; n++) { var l = Math.hypot(pts[n + 1][0] - pts[n][0], pts[n + 1][1] - pts[n][1]); L.push(l); tot += l; } return { p: pts, L: L, tot: tot }; }
    function pathAt(P, s) { s = Math.min(P.tot, Math.max(0, s)); for (var n = 0; n < P.L.length; n++) { if (s <= P.L[n] || n === P.L.length - 1) { var u = P.L[n] ? Math.min(1, s / P.L[n]) : 1, a = P.p[n], b = P.p[n + 1]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, Math.atan2(b[0] - a[0], b[1] - a[1])]; } s -= P.L[n]; } var e = P.p[P.p.length - 1]; return [e[0], e[1], 0]; }
    function walk(o, P, s, endRy, dt) { var w = pathAt(P, s), mv = s > 0 && s < P.tot; o.group.visible = true; setAt(o, w[0], w[1], mv || endRy === undefined ? w[2] : endRy); if (o.update) o.update(dt, mv ? 1 : 0); return mv; }
    function still(o) { if (o.update) o.update(0.016, 0); }

    var dav = { group: api.fallback('#7A3A3C', 1.75, 0.27), update: function () {} }; dav.group.rotation.order = 'YXZ'; scene.add(dav.group);
    api.person('davidking', function (nm) { nm.group.rotation.order = 'YXZ'; nm.group.position.copy(dav.group.position); nm.group.rotation.copy(dav.group.rotation); nm.group.visible = dav.group.visible; scene.remove(dav.group); scene.add(nm.group); dav = nm; });
    var nat = man(2741);
    var D_RY = Math.PI / 2 - 0.5, N_RY = -Math.PI / 2 + 0.5;                                         /* 서로 마주 보되 길 쪽으로 조금 돌아선다 */
    var N_COME = mkPath([[3.4, -20.2], [0.4, WALL_Z + 1.0], [0.4, WALL_Z - 1.6], [0.3, -27.4], [0.8, -29.8], NAT]);   /* 7:17 궁 앞 길에서 뜰 입구로 들어와 층계를 올라 왕 앞에 선다 */
    /* 성 안을 오가는 사람들(본문에 없음): 둘레 길에서만, 낮에만 */
    var walkers = [];
    for (i = 0; i < 6; i++) { var wk = man(i * 37 + 2750, { carry: 'none' }); wk.P = i % 2 ? mkPath([[-78, 15.5 + i * 0.3], [-38, 15.5 + i * 0.3], [-38, 18], [-78, 18], [-78, 15.5 + i * 0.3]]) : mkPath([[78, -12 + i * 0.3], [38, -12 + i * 0.3], [38, -9.6], [78, -9.6], [78, -12 + i * 0.3]]); wk.ph = i * 9; walkers.push(wk); }

    /* 때에 따른 빛(본문에 없는 빛은 만들지 않는다. 낮과 그 밤만) */
    var LIGHT = {
      day:   ['#E8E0CC', '#FFFFFF', 0.64, 0.76, '#FFF0CF', 80, 330],
      night: ['#121A2C', '#26324E', 0.3, 0.32, '#9DB2DC', 40, 240]
    };
    var SUNOFF = [-30, 50, 30], lightKey = 'day', lightSnap = true, ca = new T.Color();
    function light(dt) {
      var L = LIGHT[lightKey], t = lightSnap ? 1 : Math.min(1, dt * 1.2); lightSnap = false;
      ca.set(L[0]); scene.background.lerp(ca, t); scene.fog.color.copy(scene.background);
      ca.set(L[1]); skyM.color.lerp(ca, t); hemi.intensity += (L[2] - hemi.intensity) * t; sun.intensity += (L[3] - sun.intensity) * t; ca.set(L[4]); sun.color.lerp(ca, t);
      scene.fog.near += (L[5] - scene.fog.near) * t; scene.fog.far += (L[6] - scene.fog.far) * t;
    }

    var phase = 'talk', pt = 0;
    /* 대목마다 모든 상태를 처음부터 정한다('이전'으로 돌아와도 뒤 대목의 것이 남지 않게) */
    function setPhase(p) {
      phase = p; pt = 0;
      var night = p === 'night';
      lightKey = night ? 'night' : 'day'; lightSnap = true; light(0);
      SUNOFF[0] = night ? 30 : -30; SUNOFF[1] = night ? 44 : 50; SUNOFF[2] = night ? 18 : 30;
      lampM.emissiveIntensity = night ? 1.4 : 0; stars.visible = night;
      walkers.forEach(function (o) { o.group.visible = !night; });
      dav.group.visible = !night; setAt(dav, DAV[0], DAV[1], p === 'tell' ? 0.35 : D_RY); still(dav);
      nat.group.visible = !night && p !== 'tell'; setAt(nat, NAT[0], NAT[1], N_RY); still(nat);
      nat.sy = undefined;
      if (p === 'tell') setAt(nat, N_COME.p[0][0], N_COME.p[0][1], pathAt(N_COME, 0.01)[2]);
    }
    if (window.BO3D_TEST) C3.t27 = { skip: function (sec) { pt += sec; } };   /* 시험에서 때를 건너뛰어 볼 때만 쓴다 */
    if (FX) FX.sortLayers(scene);
    setPhase('talk');

    return {
      id: 'OT-27', scene: scene, sun: sun, sunOff: SUNOFF,
      height: height, walkable: walkable,
      edge: function (x, z) {
        if (z < -18) return { who: 'onwoo', text: '궁 뜰 담 쪽으로는 가지 말자. 우리는 지켜보는 사람이야.' };
        if (Math.abs(x) > 34) return { who: 'hyu', text: '이 길 끝까지만 가자. 집들 사이로는 들어가지 말자.' };
        return { who: 'hyu', text: '궁 앞 길과 둘레 길에서만 다니자.' };
      },
      P: { start: [0, 20], machine: [-8, 24], machineRot: 0.4,
        /* 재료가 놓인 곳(quests[i].found): 성 서쪽 길가 / 성 동남쪽 길가 / 궁 앞 길 가장자리. 다윗과 나단(궁 앞, z -31)에서 떨어진 곳 */
        parts: [[-30, 8], [28, 22], [10, -15.5]], lookSpot: [10, -15.5],
        look: { focus: [0, -31], mid: [3, -22], dy: 3, backE: 9, upE: 4.5 } },
      eventCam: function (i) {
        if (i === 2) return { pos: [30, 24, 20], look: [0, 4, -34] };                                    /* 그 밤: 창 너머로 성과 궁을 멀리서 */
        if (i === 3) return { pos: [-62, 32, 44], look: [-4, 0, -22] };
        if (i === 4) return { pos: [58, 36, 52], look: [4, 0, -18] };
        if (i === 5) return { pos: [0, 58, 78], look: [0, 0, -22] };
        return null;
      },
      eventLook: function (i) { if (i === 6) return { focus: [2, -27], mid: [8, -19], dy: 2, backE: 11, upE: 4 }; return null; },   /* 7:17 나단이 오는 길과 궁 앞이 함께 보이게 */
      kidsHidden: function (i) { return i >= 2 && i <= 5; },
      beatNote: function (i) {
        if (i === 2) return '그 밤이에요. 창 너머로 밤의 성을 멀리서 봐요. 나단이 있던 곳은 본문에 없어 그리지 않았어요.';
        if (i === 6) return '나단이 말씀을 전한 때는 성경에 적혀 있지 않아 낮으로 두었어요.';
        return null;
      },
      helpNote: function (after) {
        if (after === 6) return '우리는 궁 앞 길에서 지켜봐요. 궁 뜰 담 안으로는 들어가지 않아요.';
        return null;
      },
      detector: '탐지기', askLabel: '탐지기 물음 풀기',
      intro: { text: '타임머신이 예루살렘 다윗 성, 왕의 궁 앞 길에 내려앉았어요. 북쪽 높은 터에 백향목 궁이 보여요.', say: { who: 'hyu', text: '궁 뜰 담 안으로는 들어가지 말자. 궁 앞 길과 둘레 길에서만 다니자.' } },
      lookText: '사무엘하 7장을 성경에서 찾아 읽은 뒤 다시 골라 보세요.',
      partBeats: [], eventStart: 0,   /* 7:1-2도 궁 앞에서 본다 */
      sceneDoneText: '나단이 말씀을 전하는 것까지 지켜봐야 떠날 수 있어요.',
      dex: [
        { id: 'palace', name: '백향목 궁', desc: '왕이 평안히 거한 백향목 집', ref: '삼하 7:2', hint: '북쪽 높은 터의 궁을 담아 보세요.', range: 90, crop: 0.5, pos: function () { return v3(PAL[0], TERR + 4, FRONT_Z); } },
        { id: 'david', name: '다윗 왕', desc: '궁에 평안히 거하며 나단에게 말한 왕', ref: '삼하 7:1-2', hint: '궁 앞 기둥 아래의 붉은 옷을 입은 사람을 보세요.', range: 60, crop: 0.36, visible: function () { return dav.group.visible; }, pos: function () { var p = dav.group.position; return v3(p.x, p.y + 1.1, p.z); } },
        { id: 'nathan', name: '선지자 나단', desc: '왕에게 대답하고, 그 밤에 받은 말씀을 다윗에게 전한 선지자', ref: '삼하 7:3-4, 7:17', hint: '왕과 마주 선 사람을 보세요.', range: 60, crop: 0.36, visible: function () { return nat.group.visible; }, pos: function () { var p = nat.group.position; return v3(p.x, p.y + 1.1, p.z); } }
      ],
      reset: function () { setPhase('talk'); },
      partFound: function () {},
      partContinue: function () {},
      lookupPose: function () { if (phase !== 'wait') setPhase('wait'); },
      /* 대목 번호(OT-27.json): 0 = 7:1-2, 1 = 7:3, 2 = 7:4-7, 3 = 7:8-11, 4 = 7:11-13, 5 = 7:14-16, 6 = 7:17 */
      beatPose: function (i) { setPhase(['talk', 'answer', 'night', 'night', 'night', 'night', 'tell'][i] || 'wait'); },
      update: function (dt, now) {
        pt += dt; light(dt);
        walkers.forEach(function (o) { if (o.group.visible) { var s = (now * 1.3 + o.ph) % o.P.tot; walk(o, o.P, s < 0.01 ? 0.01 : s, undefined, dt); } });
        if (phase === 'tell') {
          /* 7:17 나단이 걸어온다: 발 높이는 층계 칸을 따라 짧게 부드럽게 오르고, 다 와서는 천천히 왕 쪽으로 돈다 */
          var ns = Math.max(0, pt - 0.3) * 1.8, nw = pathAt(N_COME, ns), nmv = ns > 0 && ns < N_COME.tot, ty = gy(nw[0], nw[1]);
          nat.sy = nat.sy === undefined ? ty : nat.sy + (ty - nat.sy) * Math.min(1, dt * 12);
          nat.group.visible = true; nat.group.position.set(nw[0], nat.sy, nw[1]); nat.group.rotation.y = angTo(nmv ? nw[2] : N_RY, nat.group.rotation.y, Math.min(1, dt * 5));
          if (nat.update) nat.update(dt, nmv ? 1 : 0);
          var arrived = !nmv && pt > 1;
          var np = nat.group.position, dp = dav.group.position, want = arrived ? D_RY : Math.atan2(np.x - dp.x, np.z - dp.z);   /* 오는 나단 쪽으로 돌아선다 */
          dav.group.rotation.y = angTo(want, dav.group.rotation.y, Math.min(1, dt * 2));
        }
        if (dav.group.visible && dav.update) dav.update(dt, false);
        if (nat.group.visible && phase !== 'tell') still(nat);
      },
      audio: function (A) { A.setFlock(999); A.setFire(999); },   /* 말씀과 대화는 소리로 만들지 않는다 */
      menuCam: function (camera, now) { var a = now * 0.05; camera.position.set(Math.sin(a) * 12, 9, 20); camera.lookAt(0, 4, -38); },
      debug: { phase: function () { return { phase: phase, pt: pt }; }, arrived: function () { return phase !== 'talk'; } }
    };
  };
})();
