/* 3D 장면 설정: OT-31 요나와 니느웨 (욘 1:1-4:11).
 * 방향: 니느웨 성은 서쪽(-X)에 남북으로 길게 서 있다(성벽과 성문 하나). 성문에서 동쪽으로 길이 나 있고, 남쪽 들에 소 떼와 양 떼가 있다(3:7).
 *   성 동쪽 언덕(성문에서 동북쪽)이 요나가 초막을 지은 자리다(4:5). 아이들은 성 밖 동쪽 들과 길에서만 다닌다(성 가까이, 언덕 위, 떼 쪽으로 가지 않는다).
 * 아이들이 다니는 때: 요나가 니느웨에 오기 전(3:3 앞). 1:1-12는 재료를 주울 때 "그 앞의 일"로 글만 읽는다.
 *   1:13-2:10(바다와 바닷가)은 타임머신 창 너머로 멀리서 본다(아이들은 화면에 없음). 3:1-4:11은 니느웨 성 밖에서 지켜본다.
 * 본문에 맞춘 점 (content/ot/OT-31.json design3d)
 *  - 1:13-16: 폭풍 속에서 노를 젓는 배(물결이 높고 배가 흔들린다) → 바다가 곧 잔잔해진다(1:15). 요나가 던져지는 모습은 그리지 않는다(멀리서, 배 위 사람들을 가려 보지 않는다).
 *    1:16의 제물은 그리지 않는다. 1:17: 큰 물고기는 그리지 않고 물속의 어두운 그림자가 배 곁을 지나 사라지는 것까지만.
 *  - 2:10: 바닷가 모래 위에 선 요나와 물결, 바다 쪽으로 사라지는 그림자까지만. 물고기 배 속(2:1-9)은 그리지 않는다(글로만).
 *  - 3:3-4: 요나가 동쪽 길로 와서 성문으로 들어간다. 외치는 소리는 만들지 않는다. 3:5: 굵은 베(어두운 옷)를 입은 백성(어른과 아이)이 성문 밖에 모인다.
 *  - 3:6-9: 왕은 성 안에 있어 그리지 않는다. 3:7-8: 들의 소 떼와 양 떼도 굵은 베를 덮고, 풀을 뜯지 않고 서 있다.
 *  - 4:5: 요나가 성에서 나와 동쪽 언덕에 초막을 짓고 그 그늘에 앉는다(성 쪽을 본다). 4:6: 박 넝쿨이 자라 초막 위를 덮는다.
 *    4:7: 이튿날 새벽에 넝쿨이 시든다(벌레는 그리지 않음). 4:8: 해가 뜨고 뜨거운 동풍(동쪽에서 서쪽으로 날리는 먼지)이 불고, 요나가 몸을 숙인다.
 *    바람은 여호와께서 준비하신 것이지만 하나님의 나타나심으로 그리지 않고 바람으로만. 4:8-9의 죽기를 구하는 말은 그림·소리로 만들지 않는다.
 *  - 하나님의 형상·빛·음성 없음. 니느웨가 무너지는 모습 없음(3:10).
 * 감수가 필요한 설정: 니느웨 성의 방향·성벽·성문·집의 생김새, 바다와 바닷가를 같은 화면 세계의 먼 곳에 둔 것(창 너머), 배의 생김새(돛 하나, 노 여덟)와 뱃사람 수,
 *   물고기를 어두운 그림자로만 둔 것과 그 크기, 바닷가에 선 요나, 요나의 생김새(tools/blender/people/jonah.json: 수염, 푸른 잿빛 겉옷), 요나가 동쪽 길로 온 것,
 *   굵은 베를 입은 백성의 수(20)와 성문 밖에 모인 자리, 굵은 베의 빛깔, 소와 양의 수와 덮은 베의 꼴, 초막과 박 넝쿨의 생김새와 자라는 빠르기,
 *   요나가 앉은 모습(앉는 동작이 없어 몸을 낮춤), 새벽과 뜨거운 동풍의 빛과 먼지, 폭풍 때의 빛, 재료(양털 3:7, 소꼬리 털 3:7, 작은 돌 — 성 밖 길과 들),
 *   초막을 언덕 위에 둔 것(4:5는 성 동편만 말함), 성문에서 동쪽으로 난 길과 들로 난 좁은 길, 남쪽 들의 떼 자리, 배 위의 사람 가운데 요나를 가려 두지 않은 것,
 *   백성이 성문에서 걸어 나와 4장 끝까지 그 자리에 서 있는 것, 초막이 요나가 다다른 뒤 짧게 세워지는 모습(짓는 동작은 없음), 4:7-8의 해가 동쪽에서 낮게 비추는 것,
 *   바다와 바닷가를 서쪽 먼 곳에 두었는데 요나는 동쪽 길로 오는 것(장면 안 지리는 본문에 없음).
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  BO3D.scene3d = BO3D.scene3d || {};
  if (!(BO3D.c3d && BO3D.c3d.on('OT-31'))) return;   /* design3d.build가 false면 이야기 카드로만 간다 */
  BO3D.scene3d['OT-31'] = function (api) {
    var T = THREE, M2 = BO3D.models2 || {}, MO = BO3D.models || {}, PR = BO3D.props, FX = api.FX, C3 = BO3D.c3d, R = PR.rng(3131), sm = C3.sm, noise = C3.noise, hash = C3.hash, i, k;
    var WALL_X = -48, GATE = [-48, 0], BOOTH = [-14, -36], PAST = [0, 46], SEA = [-340, -340], SHORE_J = [-340, -202];
    var SUNOFF = [-30, 50, 30];
    function height(x, z) {
      var hill = 2.4 * sm(15, 4, Math.hypot(x - BOOTH[0], z - BOOTH[1]));
      return hill + 0.35 * noise(x * 0.05 + 4, z * 0.05 + 2) + sm(120, 230, Math.hypot(x, z)) * 12 * noise(x * 0.02, z * 0.02);
    }
    function walkable(x, z) { return x >= -34 && x <= 30 && z >= -22 && z <= 30 && Math.hypot(x - BOOTH[0], z - BOOTH[1]) > 17; }   /* 초막 둘레와 성 가까이는 걷지 않는다 */

    var scene = new T.Scene();
    scene.background = new T.Color('#ECE0C4'); scene.fog = new T.Fog('#ECE0C4', 80, 320);
    var skyG = new T.SphereGeometry(560, 24, 14), sp = skyG.attributes.position, sc = new Float32Array(sp.count * 3), cc = new T.Color(), top = new T.Color('#7DB0D0'), hor = new T.Color('#F2E6C8');
    for (i = 0; i < sp.count; i++) { var tt = Math.max(0, sp.getY(i) / 560); cc.copy(hor).lerp(top, sm(0.02, 0.7, tt)); sc[i * 3] = cc.r; sc[i * 3 + 1] = cc.g; sc[i * 3 + 2] = cc.b; }
    skyG.setAttribute('color', new T.BufferAttribute(sc, 3));
    var skyM = new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false }); scene.add(new T.Mesh(skyG, skyM));
    var g = new T.PlaneGeometry(520, 520, 150, 150); g.rotateX(-Math.PI / 2);
    var pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color(), s1 = new T.Color('#C7B27E'), s2 = new T.Color('#A9A46C'), lane = new T.Color('#D6C59A'), grass = new T.Color('#9EA466');
    for (i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i), y = height(x, z); pos.setY(i, y);
      c.copy(s1).lerp(s2, noise(x * 0.06, z * 0.06));
      if (z > 32 && z < 64 && Math.abs(x) < 34) c.lerp(grass, 0.55 * sm(64, 56, z) * sm(34, 26, Math.abs(x)));   /* 떼가 있는 들 */
      if ((Math.abs(z) < 2.4 && x > WALL_X && x < 80) || (Math.abs(x + 22) < 1.6 && z > 2 && z < 34)) c.lerp(lane, 0.75);   /* 들로 난 좁은 길 */                                         /* 성문에서 동쪽으로 난 길 */
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

    /* 니느웨 성(3:3 큰 성읍): 남북으로 긴 성벽과 성문 하나, 성 안 집의 지붕. 생김새는 본문에 없다 */
    var wallM = std('#C9B08A'), wallM2 = std('#B49A72'), houseM = [std('#D9C08F'), std('#CDB07E'), std('#E2CB9C')], wp = [];
    [[-170, -3.2], [3.2, 170]].forEach(function (seg) { wp.push(box(3, 9, seg[1] - seg[0], wallM, WALL_X, (seg[0] + seg[1]) / 2, 0)); });
    [-4.2, 4.2].forEach(function (dz) { wp.push(box(4.4, 12, 3.6, wallM2, WALL_X, GATE[1] + dz, 0)); });
    wp.push(box(4.4, 2.6, 12, wallM2, WALL_X, GATE[1], 9));
    for (i = 0; i < 70; i++) { var hx = -56 - R() * 70, hz = -150 + R() * 300, hw = 5 + R() * 6, hh = 6 + R() * 7; wp.push(box(hw, hh, 5 + R() * 6, houseM[i % 3], hx, hz, 0)); }
    scene.add(PR.mergeStatic(wp));
    var dark = new T.Mesh(new T.PlaneGeometry(5, 9), new T.MeshBasicMaterial({ color: '#2A2420' })); dark.rotation.y = Math.PI / 2; dark.position.set(WALL_X + 1.3, 4.5, GATE[1]); scene.add(dark);   /* 성문 안 그늘 */

    /* 둘레의 땅: 바위와 떨기(꼭짓점 색을 지켜 합친다). 아이들 길과 재료 자리는 비운다 */
    var deco = [], KEEP = [[-22, 14], [10, 28], [-2, -19], [8, 14], [14, 20]];
    function freeAt(x, z) { if (Math.abs(z) < 4 && x > WALL_X) return false; for (var q = 0; q < KEEP.length; q++) if (Math.hypot(x - KEEP[q][0], z - KEEP[q][1]) < 5) return false; return Math.hypot(x - BOOTH[0], z - BOOTH[1]) > 9 && x > WALL_X + 6; }
    if (MO.rock) for (i = 0; i < 40; i++) { var rx = -40 + R() * 200, rz = -150 + R() * 300; if (!freeAt(rx, rz) || (rz > 32 && rz < 64 && Math.abs(rx) < 34)) continue; var ro = MO.rock(3140 + i); ro.scale.multiplyScalar(0.5 + R() * 1.4); ro.position.set(rx, height(rx, rz) - 0.08, rz); deco.push(ro); }
    if (MO.shrub) for (i = 0; i < 40; i++) { var hx2 = -40 + R() * 200, hz2 = -150 + R() * 300; if (!freeAt(hx2, hz2)) continue; var sh = MO.shrub(310 + i); sh.position.set(hx2, height(hx2, hz2), hz2); deco.push(sh); }
    if (deco.length) scene.add(C3.merge(deco));

    /* 들의 소 떼와 양 떼(3:7). 3:8부터 굵은 베를 덮는다 */
    var flockL = [], blankL = [], sackM = std('#4A433A'), BC = ['#8A6A4A', '#6E5A48', '#C9B79A', '#3E342C'];
    function cow(s, ci) {
      var gr = new T.Group(), m = std(BC[ci]);
      var bd = new T.Mesh(new T.BoxGeometry(0.62 * s, 0.6 * s, 1.35 * s), m); bd.position.y = 0.9 * s; gr.add(bd);
      var hd = new T.Mesh(new T.BoxGeometry(0.34 * s, 0.36 * s, 0.5 * s), m); hd.position.set(0, 1.12 * s, 0.86 * s); gr.add(hd);
      [[-0.2, 0.45], [0.2, 0.45], [-0.2, -0.45], [0.2, -0.45]].forEach(function (q) { var lg = new T.Mesh(new T.BoxGeometry(0.13 * s, 0.62 * s, 0.13 * s), m); lg.position.set(q[0] * s, 0.31 * s, q[1] * s); gr.add(lg); });
      return gr;
    }
    for (i = 0; i < 16; i++) {
      var isCow = i < 5, fx = PAST[0] - 20 + (i % 6) * 7.5 + (hash(i, 2) - 0.5) * 3, fz = PAST[1] - 8 + Math.floor(i / 6) * 7 + (hash(i, 4) - 0.5) * 3, ry = hash(i, 6) * 6.28, o;
      if (isCow) o = cow(1.2, i % 4); else { o = MO.sheep ? MO.sheep(3150 + i).group : cow(0.6, 2); o.traverse(function (q) { if (q.isGroup && Math.abs(q.position.y - 0.5) < 0.01 && Math.abs(q.position.z - 0.2) < 0.01) q.rotation.x = 0.05; }); }   /* 3:7 풀을 뜯지 않는다: 고개를 든다 */
      o.position.set(fx, height(fx, fz), fz); o.rotation.y = ry; flockL.push(o);
      var bw = isCow ? 0.84 : 0.56, bl = isCow ? 1.3 : 0.8, by = isCow ? 1.48 : 0.6, bt = isCow ? 0.07 : 0.08;   /* 등에 덮은 굵은 베(3:8) */
      var bk = new T.Mesh(new T.BoxGeometry(bw, bt, bl), sackM); bk.position.set(fx, height(fx, fz) + by, fz); bk.rotation.y = ry; blankL.push(bk);
    }
    scene.add(C3.merge(flockL)); var blankets = PR.mergeStatic(blankL); scene.add(blankets); blankets.visible = false;

    /* 사람 */
    function man(seed, opt) { var o = null; try { if (M2.israelite) o = M2.israelite(seed, opt || { kind: 'man', carry: 'none' }); } catch (e) { o = null; } if (!o) o = PR.soldier(seed, '#7A6A54', null); o.group.rotation.order = 'YXZ'; scene.add(o.group); return o; }
    function setAt(o, x, z, ry, dy) { o.group.position.set(x, height(x, z) + (dy || 0), z); if (ry !== undefined) o.group.rotation.y = ry; }
    function mkPath(pts) { var L = [], tot = 0; for (var n = 0; n + 1 < pts.length; n++) { var l = Math.hypot(pts[n + 1][0] - pts[n][0], pts[n + 1][1] - pts[n][1]); L.push(l); tot += l; } return { p: pts, L: L, tot: tot }; }
    function pathAt(P, s) { s = Math.min(P.tot, Math.max(0, s)); for (var n = 0; n < P.L.length; n++) { if (s <= P.L[n] || n === P.L.length - 1) { var u = P.L[n] ? Math.min(1, s / P.L[n]) : 1, a = P.p[n], b = P.p[n + 1]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, Math.atan2(b[0] - a[0], b[1] - a[1])]; } s -= P.L[n]; } var e = P.p[P.p.length - 1]; return [e[0], e[1], 0]; }
    function walk(o, P, s, endRy, dt) { var w = pathAt(P, s), mv = s > 0 && s < P.tot; o.group.visible = true; setAt(o, w[0], w[1], mv || endRy === undefined ? w[2] : endRy); if (o.update) o.update(dt, mv ? 1 : 0); return mv; }
    /* 굵은 베(3:5): 목 아래 옷 빛깔만 어둡게 바꾼다(빛깔은 본문에 없음) */
    var SACK = new T.Color('#4E463C'); if (MO.config && MO.config.srgbOutput) SACK.convertSRGBToLinear();
    function sack(o) {
      var rig = o.group.children[0], H = o.group.userData.height || 1.7; if (!rig || !rig.children || !rig.children[0]) return;
      function paint(mesh, test) {
        if (!mesh || !mesh.geometry || !mesh.geometry.attributes.color) return;
        var ca = mesh.geometry.attributes.color, pa = mesh.geometry.attributes.position;
        for (var n = 0; n < ca.count; n++) if (test(pa.getX(n), pa.getY(n), pa.getZ(n))) { var f = 0.82 + 0.3 * hash(n, 3); ca.setXYZ(n, SACK.r * f, SACK.g * f, SACK.b * f); }
        ca.needsUpdate = true;
      }
      paint(rig.children[0], function (x, y) { return y < H * 0.795; });
      var reach = 0.315 * H * 0.88; [rig.children[1], rig.children[2]].forEach(function (a) { paint(a, function (x, y, z) { return Math.hypot(x, y, z) < reach; }); });
    }
    var folk = [];
    for (i = 0; i < 20; i++) {
      var p = man(i * 29 + 900, { carry: 'none' }); sack(p);
      p.spot = [WALL_X + 3 + (i % 4) * 1.8 + (hash(i, 1) - 0.5) * 0.5, -14 + Math.floor(i / 4) * 6 + (i % 2) * 1.2 + (hash(i, 2) - 0.5) * 0.8];
      if (Math.abs(p.spot[1]) < 3) p.spot[1] += p.spot[1] < 0 ? -3 : 3;   /* 성문 앞 길은 비워 둔다 */
      p.ry = Math.PI / 2 + (hash(i, 3) - 0.5) * 0.9; p.group.visible = false; folk.push(p);
    }
    var jonah = { group: api.fallback('#56707E', 1.75, 0.27), update: function () {} }; jonah.group.rotation.order = 'YXZ'; scene.add(jonah.group); jonah.group.visible = false;
    api.person('jonah', function (nm) { nm.group.rotation.order = 'YXZ'; nm.group.position.copy(jonah.group.position); nm.group.rotation.copy(jonah.group.rotation); nm.group.visible = jonah.group.visible; scene.remove(jonah.group); scene.add(nm.group); jonah = nm; });
    var J_IN = mkPath([[-14, 1.2], [-30, 0.8], [WALL_X - 3, 0.2]]), T_IN = 1 + J_IN.tot / 3;                                         /* 3:3-4 동쪽 길로 와서 성에 들어간다 */
    var J_OUT = mkPath([[WALL_X - 1, 0.3], [-30, 0.5], [-24, -12], [BOOTH[0] - 1, BOOTH[1] + 3.2], [BOOTH[0], BOOTH[1] + 0.6]]);   /* 4:5 성에서 나와 동쪽에 앉는다 */

    /* 초막(4:5)과 박 넝쿨(4:6). 생김새는 본문에 없다 */
    var booth = new T.Group(), poleM = std('#7A5A3A'), thatchM = std('#9A8456');
    [[-1.2, -1], [1.2, -1], [-1.2, 1], [1.2, 1]].forEach(function (q) { var pl = new T.Mesh(new T.CylinderGeometry(0.07, 0.08, 2.3, 6), poleM); pl.position.set(q[0], 1.15, q[1]); booth.add(pl); });
    var roofB = new T.Mesh(new T.BoxGeometry(3, 0.22, 2.6), thatchM); roofB.position.y = 2.3; booth.add(roofB);
    booth.position.set(BOOTH[0], height(BOOTH[0], BOOTH[1]), BOOTH[1]); scene.add(booth); booth.visible = false;
    var vine = new T.Group(), vineM = new T.MeshStandardMaterial({ color: '#5E8A3A', flatShading: true, roughness: 0.9 }), LEAF0 = new T.Color('#5E8A3A'), LEAF1 = new T.Color('#8A7A4A');
    var leaves = [];
    for (i = 0; i < 16; i++) { var lf = new T.Mesh(new T.IcosahedronGeometry(0.42 + hash(i, 5) * 0.2, 0), vineM); lf.position.set((hash(i, 1) - 0.5) * 3.2, 2.45 + hash(i, 2) * 0.3, (hash(i, 3) - 0.5) * 2.8); vine.add(lf); leaves.push(lf); }   /* 잎은 지붕 위에서만 자라고 시든다 */
    [-1.2, 1.2].forEach(function (dx) { var st = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 2.3, 5), vineM); st.geometry.translate(0, 1.15, 0); st.position.set(dx + 0.12, 0, 1.1); vine.add(st); leaves.push(st); });
    booth.add(vine); vine.visible = false;
    /* 뜨거운 동풍(4:8): 동쪽에서 서쪽으로 날리는 먼지 */
    var DN = 220, dustG = new T.BufferGeometry(), dp = new Float32Array(DN * 3);
    for (i = 0; i < DN; i++) { dp[i * 3] = BOOTH[0] - 40 + R() * 70; dp[i * 3 + 1] = height(BOOTH[0], BOOTH[1]) + 0.3 + R() * 4; dp[i * 3 + 2] = BOOTH[1] - 25 + R() * 50; }
    dustG.setAttribute('position', new T.BufferAttribute(dp, 3));
    var dustM = new T.PointsMaterial({ color: '#D8C08E', size: 0.22, transparent: true, opacity: 0, depthWrite: false }), dust = new T.Points(dustG, dustM); dust.frustumCulled = false; scene.add(dust);

    /* 창 너머 먼 곳: 바다와 배(1:13-17), 바닷가(2:10). 걷는 곳에서는 안개 너머라 보이지 않는다 */
    var seaG = new T.PlaneGeometry(260, 260, 40, 40); seaG.rotateX(-Math.PI / 2);
    var seaM = new T.MeshStandardMaterial({ color: '#3E6E8A', flatShading: true, roughness: 0.6, metalness: 0.05 }), sea = new T.Mesh(seaG, seaM); sea.position.set(SEA[0], 0, SEA[1]); scene.add(sea);
    var seaP = seaG.attributes.position, amp = 0, ampWant = 0, seaT = 0;
    function waves() {
      for (var n = 0; n < seaP.count; n++) { var wx = seaP.getX(n), wz = seaP.getZ(n); seaP.setY(n, amp * (0.6 * Math.sin(wx * 0.22 + seaT * 1.6) + 0.4 * Math.sin(wz * 0.29 - seaT * 1.2 + wx * 0.05)) + 0.08 * Math.sin(wx * 0.9 + wz * 0.7 + seaT * 2)); }
      seaP.needsUpdate = true; seaG.computeVertexNormals();
    }
    var sand = new T.Mesh(new T.BoxGeometry(120, 0.6, 60), std('#DCC89A')); sand.position.set(SHORE_J[0], -0.05, SHORE_J[1] + 22); sand.receiveShadow = true; scene.add(sand);   /* 바닷가와 그 뒤의 땅 */
    var ship = new T.Group(), hullM = std('#6E4E32'), deckM = std('#8A6A44');
    var hg = new T.BoxGeometry(2.4, 1.2, 8, 1, 1, 4), hp = hg.attributes.position; for (i = 0; i < hp.count; i++) { var zz = hp.getZ(i), f2 = 1 - 0.55 * Math.pow(Math.abs(zz) / 4, 2); hp.setX(i, hp.getX(i) * f2); if (hp.getY(i) < 0) hp.setX(i, hp.getX(i) * 0.7); } hg.computeVertexNormals();
    var hull = new T.Mesh(hg, hullM); hull.position.y = 0.4; ship.add(hull);
    var deck = new T.Mesh(new T.BoxGeometry(1.8, 0.1, 6), deckM); deck.position.y = 1.02; ship.add(deck);
    var mast = new T.Mesh(new T.CylinderGeometry(0.08, 0.1, 6, 6), hullM); mast.position.y = 4; ship.add(mast);
    var sail = new T.Mesh(new T.PlaneGeometry(3.2, 3.4), new T.MeshStandardMaterial({ color: '#E8DCC0', side: T.DoubleSide, flatShading: true })); sail.position.set(0, 4.4, 0.16); ship.add(sail);
    var oars = []; for (i = 0; i < 8; i++) { var side = i < 4 ? -1 : 1, oz = -2.1 + (i % 4) * 1.4, oar = new T.Group(); var ob = new T.Mesh(new T.BoxGeometry(2.8, 0.06, 0.12), deckM); ob.position.x = side * 1.4; oar.add(ob); oar.position.set(side * 0.9, 0.95, oz); oar.rotation.z = side * 0.35; ship.add(oar); oars.push(oar); }
    var crew = []; for (i = 0; i < 5; i++) { var cw = PR.soldier(i + 3170, ['#6A5E4A', '#5A4E6A', '#7A5A44', '#4E5E5A', '#6E6A54'][i], null); cw.group.children[0].children.forEach(function (m) { if (m.geometry && m.geometry.type === 'CylinderGeometry' && m.position.x > 0.2) m.visible = false; }); cw.group.scale.setScalar(0.9); cw.group.position.set((i % 2 ? 0.45 : -0.45), 1.05, -1.8 + i * 0.9); ship.add(cw.group); crew.push(cw); }
    ship.position.set(SEA[0], 0, SEA[1]); scene.add(ship);
    var shadowM = new T.MeshBasicMaterial({ color: '#0A1822', transparent: true, opacity: 0, depthWrite: false }), shadow = new T.Mesh(new T.CircleGeometry(1, 24), shadowM);
    shadow.rotation.x = -Math.PI / 2; shadow.scale.set(2.4, 7, 1); shadow.renderOrder = 3; scene.add(shadow);   /* 1:17 물고기는 그리지 않는다. 물속 그림자까지만 */

    /* 때에 따른 빛(본문에 없는 빛은 만들지 않는다. 폭풍의 어둠, 새벽, 뜨거운 해만) */
    var LIGHT = {
      day:   ['#ECE0C4', '#FFFFFF', 0.64, 0.76, '#FFF0CF', 80, 320],
      storm: ['#7C8A92', '#9AA6AE', 0.46, 0.22, '#C8D0D8', 20, 150],
      calm:  ['#D8E2E6', '#F4FAFF', 0.62, 0.7, '#FFF6E6', 60, 300],
      dawn:  ['#C9A98E', '#E8C4A0', 0.42, 0.34, '#FFB884', 50, 260],
      hot:   ['#F4DCA8', '#FFF0CC', 0.66, 1.0, '#FFE2A0', 60, 260]
    };
    var lightKey = 'day', lightSnap = true, ca = new T.Color();
    function light(dt) {
      var L = LIGHT[lightKey], t = lightSnap ? 1 : Math.min(1, dt * 1.2); lightSnap = false;
      ca.set(L[0]); scene.background.lerp(ca, t); scene.fog.color.copy(scene.background);
      ca.set(L[1]); skyM.color.lerp(ca, t); hemi.intensity += (L[2] - hemi.intensity) * t; sun.intensity += (L[3] - sun.intensity) * t; ca.set(L[4]); sun.color.lerp(ca, t);
      scene.fog.near += (L[5] - scene.fog.near) * t; scene.fog.far += (L[6] - scene.fog.far) * t;
    }

    var phase = 'wait', pt = 0, grow = 0, wither = 0, slump = 0;
    function setPhase(p) {
      phase = p; pt = 0; slump = 0;
      var town = p !== 'sea' && p !== 'shore';
      jonah.group.visible = false; jonah.group.rotation.x = 0; booth.visible = p === 'gourd'; vine.visible = p === 'gourd'; booth.scale.y = 1;
      grow = 0; wither = 0; dustM.opacity = 0; vineM.color.copy(LEAF0); leaves.forEach(function (q) { q.scale.setScalar(0.001); }); SUNOFF[0] = -30; SUNOFF[1] = 50; SUNOFF[2] = 30;
      folk.forEach(function (o) { o.group.visible = p === 'decree' || p === 'booth' || p === 'gourd'; if (o.group.visible) { setAt(o, o.spot[0], o.spot[1], o.ry); if (o.update) o.update(0.016, 0); } });
      blankets.visible = p === 'decree' || p === 'booth' || p === 'gourd';
      shadowM.opacity = 0; seaT = 0;
      lightKey = town ? 'day' : p === 'sea' ? 'storm' : 'calm'; lightSnap = true;
      if (p === 'sea') { amp = 1.7; ampWant = 1.7; }
      if (p === 'shore') { amp = 0.12; ampWant = 0.12; setAt(jonah, SHORE_J[0], SHORE_J[1], 0); jonah.group.position.y = 0.25; jonah.group.visible = true; }
      if (p === 'enter') { setAt(jonah, J_IN.p[0][0], J_IN.p[0][1], -Math.PI / 2); jonah.group.visible = true; }
      if (p === 'booth') { setAt(jonah, J_OUT.p[0][0], J_OUT.p[0][1], Math.PI / 2); jonah.group.visible = true; booth.scale.y = 0.001; }
      if (p === 'gourd') { setAt(jonah, BOOTH[0], BOOTH[1] + 0.6, -Math.PI / 2, -0.45); jonah.group.visible = true; }
      if (town) { amp = 0; waves(); }
      if (town || p === 'shore') { ship.visible = p !== 'shore'; } else ship.visible = true;
      if (jonah.update) jonah.update(0.016, false);
    }
    if (window.BO3D_TEST) C3.t31 = { skip: function (sec) { pt += sec; } };   /* 시험에서 때를 건너뛰어 볼 때만 쓴다 */
    if (FX) FX.sortLayers(scene);
    setPhase('wait');

    return {
      id: 'OT-31', placeLabel: '니느웨', scene: scene, sun: sun, sunOff: SUNOFF,
      height: height, walkable: walkable,
      edge: function (x, z) {
        if (x < -36) return { who: 'hyu', text: '성 가까이로는 가지 말자. 이 들에서만 다니자.' };
        if (z < -22) return { who: 'onwoo', text: '저 언덕 위로는 올라가지 말자. 우리는 지켜보는 사람이야.' };
        if (z > 30) return { who: 'choeon', text: '소 떼와 양 떼 쪽으로는 가지 말자.' };
        return { who: 'hyu', text: '이 길과 들에서만 다니자.' };
      },
      P: { start: [8, 14], machine: [14, 20], machineRot: -0.5,
        /* 재료가 놓인 곳(quests[i].found): 성 밖 길가(요나가 걷는 길에서 13) / 들 가장자리 / 동쪽 언덕 아래. 성문·초막 자리·떼·백성에서 떨어진 곳 */
        parts: [[-22, 14], [10, 28], [-2, -19]], lookSpot: [-2, -19],
        look: { focus: GATE, mid: [-30, 0], dy: 4, backE: 10, upE: 5 } },
      eventCam: function (i) {
        if (i === 2) return { pos: [SEA[0] + 34, 13, SEA[1] + 46], look: [SEA[0], 1.5, SEA[1]] };                 /* 창 너머: 바다 위의 배 */
        if (i === 3) return { pos: [SHORE_J[0] + 9, 6.5, SHORE_J[1] - 30], look: [SHORE_J[0], 1.4, SHORE_J[1]] };   /* 창 너머: 바닷가 */
        if (i === 5) return { pos: [-16, height(-16, 22) + 9, 22], look: [0, 0.8, 46] };   /* 3:7-8 굵은 베를 덮은 소 떼와 양 떼 */
        if (i === 6 && phase === 'booth' && pt < 1.5 + J_OUT.tot / 3.4) { var jp = jonah.group.position, cx = jp.x + 11, cz = jp.z + 13; return { pos: [cx, Math.max(height(cx, cz), jp.y) + 8, cz], look: [jp.x - 2, jp.y + 1.2, jp.z - 4] }; }   /* 4:5 성에서 나와 걷는 요나를 따라간다 */
        if (i === 6 || i === 7) return { pos: [-2, height(-2, -16) + 6, -16], look: [BOOTH[0], height(BOOTH[0], BOOTH[1]) + 1.4, BOOTH[1]] };   /* 성 동쪽 언덕의 초막 */
        return null;
      },
      eventLook: function (i) { if (i === 4) return { focus: [WALL_X + 6, 0], mid: [-30, 6], dy: 2.5, backE: 12, upE: 5 }; return null; },
      kidsHidden: function (i) { return i === 2 || i === 3; },
      beatNote: function (i) {
        if (i === 0) return '그 앞의 일이에요. 요나가 배를 탄 욥바는 여기서 먼 바닷가예요. 우리는 그 뒤의 니느웨 성 밖에 있어요.';
        if (i === 1) return '그 앞의 일이에요. 바다 위 배에서 있었던 일이라 글로만 읽어요.';
        if (i === 2) return '타임머신 창 너머로 바다 위의 배를 멀리서 봐요. 요나가 바다에 던져지는 모습과 큰 물고기는 그리지 않았어요. 물결과 그림자까지만 봐요.';
        if (i === 3) return '타임머신 창 너머로 바닷가를 멀리서 봐요. 물고기 배 속에서 드린 기도는 글로만 읽어요. 물고기는 그리지 않았어요.';
        if (i === 4) return '이제 우리가 있는 니느웨 성 밖의 일이에요.';
        if (i === 5) return '니느웨 왕은 성 안에 있어서 그리지 않았어요.';
        if (i === 7) return '박 넝쿨을 씹은 벌레는 그리지 않았어요.';
        return null;
      },
      helpNote: function (after) {
        if (after === 6) return '우리는 성 동쪽 언덕 아래에서 기다려요. 요나의 초막에는 다가가지 않아요.';
        if (after === 7) return '우리가 머문 언덕 아래 자리만 정리해요.';
        return null;
      },
      detector: '탐지기', askLabel: '탐지기 물음 풀기',
      intro: { text: '타임머신이 니느웨 성 밖 동쪽 들에 내려앉았어요. 서쪽에 큰 성이 보여요.', say: { who: 'hyu', text: '성 가까이로는 가지 말자. 이 들에서만 다니자.' } },
      lookText: '요나 이야기를 성경에서 찾아 읽은 뒤 다시 골라 보세요.',
      partBeats: [0, 1], eventStart: 2,
      sceneDoneText: '니느웨 성 밖의 일을 끝까지 지켜봐야 떠날 수 있어요.',
      dex: [
        { id: 'gate', name: '니느웨 성문', desc: '요나가 들어가 외친 큰 성읍', ref: '욘 3:3-4', hint: '서쪽 성벽의 문을 담아 보세요.', range: 110, crop: 0.5, pos: function () { return v3(WALL_X, 6, GATE[1]); } },
        { id: 'flock', name: '소 떼와 양 떼', desc: '니느웨 사람들이 들에서 기르던 짐승', ref: '욘 3:7', hint: '남쪽 들을 보세요.', range: 70, crop: 0.5, pos: function () { return v3(PAST[0], 1, PAST[1]); } },
        { id: 'booth', name: '요나의 초막', desc: '요나가 성 동쪽에 지은 초막', ref: '욘 4:5', hint: '끝까지 지켜본 뒤 동쪽 언덕을 보세요.', range: 70, crop: 0.4, visible: function () { return booth.visible && booth.scale.y > 0.95; }, pos: function () { return v3(BOOTH[0], height(BOOTH[0], BOOTH[1]) + 1.5, BOOTH[1]); } }
      ],
      reset: function () { setPhase('wait'); },
      partFound: function () {},
      partContinue: function () {},
      lookupPose: function () { if (phase !== 'wait') setPhase('wait'); },
      /* 대목 번호(OT-31.json): 0 = 1:1-3, 1 = 1:4-12, 2 = 1:13-17, 3 = 2:1-10, 4 = 3:1-5, 5 = 3:6-10, 6 = 4:1-5, 7 = 4:6-11 */
      beatPose: function (i) { setPhase(['wait', 'wait', 'sea', 'shore', 'enter', 'decree', 'booth', 'gourd'][i] || 'wait'); },
      update: function (dt, now) {
        pt += dt; light(dt);
        if (phase === 'sea' || phase === 'shore') {
          seaT += dt;
          if (phase === 'sea') {
            if (pt > 9) { ampWant = 0.1; if (lightKey !== 'calm') lightKey = 'calm'; }                          /* 1:15 바다가 곧 잔잔해진다 */
            amp += (ampWant - amp) * Math.min(1, dt * 1.1);
            var rock = Math.min(1, amp / 1.7);
            ship.rotation.z = rock * 0.2 * Math.sin(seaT * 1.9); ship.rotation.x = rock * 0.1 * Math.sin(seaT * 1.3); ship.position.y = amp * 0.5 * Math.sin(seaT * 1.6) - 0.1;
            oars.forEach(function (o, n) { o.rotation.y = (pt < 9 ? 0.4 * Math.sin(seaT * 2.6) : 0) * (n < 4 ? 1 : -1); });   /* 1:13 힘써 노를 젓는다 */
            var s = pt - 11, op = s < 0 ? 0 : s < 2 ? s / 2 : s < 6 ? 1 : Math.max(0, 1 - (s - 6) / 2);         /* 1:17 물속 그림자가 배 곁을 지나 사라진다 */
            shadowM.opacity = 0.42 * op; shadow.position.set(SEA[0] + 5 - Math.max(0, s) * 1.6, 0.32, SEA[1] + 3 + Math.max(0, s) * 0.6); shadow.rotation.z = 0.35;
          } else {
            var s2 = pt, op2 = s2 < 1.5 ? s2 / 1.5 : Math.max(0, 1 - (s2 - 1.5) / 4); shadowM.opacity = 0.3 * op2; shadow.position.set(SHORE_J[0] + 1, 0.32, SHORE_J[1] - 26 - s2 * 1.4); shadow.rotation.z = 0;   /* 2:10 바다 쪽으로 사라지는 그림자 */
            if (jonah.update) jonah.update(dt, false);
          }
          waves();
        }
        if (phase === 'enter') {
          var mv = walk(jonah, J_IN, Math.max(0, pt - 1) * 3, -Math.PI / 2, dt); if (!mv && pt > 2 && jonah.group.position.x < WALL_X) jonah.group.visible = false;
          folk.forEach(function (o, n) { var s3 = (pt - T_IN - 0.5 - n * 0.25) * 1.8; if (s3 > 0) { if (!o.P) o.P = mkPath([[WALL_X - 2, (n % 2 ? 0.6 : -0.6)], [WALL_X + 3, (n % 2 ? 0.6 : -0.6)], o.spot]); walk(o, o.P, s3, o.ry, dt); } });   /* 3:5 그 뒤에 굵은 베를 입은 백성이 성문 밖에 모인다 */
        }
        if (phase === 'booth') {
          var tj = J_OUT.tot / 3.4, wv = walk(jonah, J_OUT, Math.max(0, pt - 1) * 3.4, -Math.PI / 2, dt); booth.visible = !wv && pt > 1 + tj;
          if (!wv && pt > 1 + tj) { booth.scale.y = Math.min(1, Math.max(0.001, (pt - 1 - tj) / 2)); if (booth.scale.y >= 1) { jonah.group.position.y = height(BOOTH[0], BOOTH[1] + 0.6) - 0.45; } }   /* 4:5 초막을 짓고 그 그늘에 앉는다 */
        }
        if (phase === 'gourd') {
          grow = Math.min(1, pt / 6); leaves.forEach(function (q) { q.scale.setScalar(Math.max(0.001, grow * (1 - 0.4 * wither))); });                    /* 4:6 박 넝쿨이 자라 그늘이 된다 */
          if (pt > 8 && lightKey === 'day') lightKey = 'dawn';                                                   /* 4:7 이튿날 새벽 */
          if (pt > 10) { wither = Math.min(1, (pt - 10) / 4); vineM.color.copy(LEAF0).lerp(LEAF1, wither); }
          if (pt > 8) { SUNOFF[0] = 50; SUNOFF[1] = 5 + 11 * sm(8, 15, pt); SUNOFF[2] = 0; }   /* 4:7 새벽부터 해는 동쪽 낮은 곳, 4:8 해가 떠오른다 */
          if (pt > 15) { if (lightKey !== 'hot') lightKey = 'hot'; dustM.opacity = Math.min(0.55, (pt - 15) * 0.2); slump = Math.min(0.32, (pt - 15) * 0.1); }   /* 4:8 해와 뜨거운 동풍 */
          jonah.group.rotation.x = slump;
          if (dustM.opacity > 0) { for (var n = 0; n < DN; n++) { var px = dp[n * 3] - dt * (9 + (n % 7)); if (px < BOOTH[0] - 40) px += 70; dp[n * 3] = px; } dustG.attributes.position.needsUpdate = true; }
          if (jonah.update) jonah.update(dt, false);
        }
      },
      audio: function (A, pp) { var dx = Math.max(0, Math.abs(pp.x + 1) - 19), dz = Math.max(0, Math.abs(pp.z - PAST[1]) - 7); A.setFlock(Math.sqrt(dx * dx + dz * dz)); A.setFire(999); },   /* 3:7 남쪽 들의 떼: 가까이 가면 양 울음이 가끔 들린다(호렙 산과 같은 합성음). 외치는 소리, 바람의 음성 같은 것은 만들지 않는다 */
      menuCam: function (camera, now) { var a = now * 0.05; camera.position.set(10 + Math.sin(a) * 8, 8, 16); camera.lookAt(WALL_X, 4, 0); },
      debug: { phase: function () { return { phase: phase, pt: pt, amp: amp, grow: grow, wither: wither }; }, arrived: function () { return phase !== 'wait'; } }
    };
  };
})();
