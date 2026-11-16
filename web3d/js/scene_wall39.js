/* 3D 장면 설정: OT-39 느헤미야의 성벽과 율법책 낭독 (느 2:11-20, 6:15-16, 8:1-12).
 * 방향: 예루살렘 성벽은 북쪽(-Z)에 동서로 길게 서 있다. 서쪽에 골짜기 문, 동쪽에 수문과 그 앞 광장. 아이들은 성벽 바깥 남쪽 비탈에서만 다닌다.
 * 아이들이 다니는 때: 성벽이 무너져 있을 때(2:13). 재료 1은 밤(2:12-15), 재료 2·3은 그 뒤 낮.
 * 본문에 맞춘 점 (content/ot/OT-39.json design3d)
 *  - 무너진 성벽과 불탄 성문(2:13). 밤에 느헤미야가 짐승을 타고 몇 사람과 골짜기 문으로 나가 성벽을 살피고 다시 들어온다(2:12-15).
 *    짐승과 탄 사람은 어떤 짐승인지 정하지 않고 어둠 속 그림자로만.
 *  - 성벽을 쌓는 과정은 보여 주지 않는다(느 3-4장은 범위 밖). 6:15 대목에서 다 쌓은 모습으로 바뀐다.
 *  - 산발랏·도비야·게셈은 멀리서 서 있기만 한다(2:19, 무기·공격 없음).
 *  - 수문 앞 광장에 백성이 모이고(8:1), 에스라가 나무 강단에 선다(8:4. 오른쪽에 여섯, 왼쪽에 일곱, 모두 어른 남자). 백성은 서서 듣고(8:5),
 *    무릎을 꿇어 몸을 굽힌다(8:6. 손을 드는 모습은 멀리서라 그리지 않는다). 그 뒤 돌아가 먹고 마신다(8:12). 모두 멀리서.
 *  - 율법의 구절과 낭독 소리는 지어내지 않는다. 얼굴을 가까이 보이지 않는다.
 * 감수가 필요한 설정: 성벽의 높이·재료·자리, 문과 광장의 생김새, 광장이 성벽 바깥에 있는 것(본문은 말하지 않는다), 사람 수, 강단의 모양.
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  BO3D.scene3d = BO3D.scene3d || {};
  BO3D.scene3d['OT-39'] = function (api) {
    var T = THREE, M2 = BO3D.models2 || {}, MO = BO3D.models || {}, PR = BO3D.props, FX = api.FX, R = PR.rng(3907);
    function sm(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
    function hash(ix, iz) { var n = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453; return n - Math.floor(n); }
    function noise(x, z) {
      var ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
      var a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    var WALL_Z = -24, VGATE = [-34, WALL_Z], WGATE = [44, WALL_Z], SQUARE = [44, -10], STAND = [44, -16];
    function height(x, z) { return 2.5 * sm(30, -30, z) + 0.6 * noise(x * 0.05 + 2, z * 0.05 + 6) - 1.2 * sm(-2, 10, z) * sm(40, 80, Math.abs(x)) + sm(120, 220, Math.hypot(x, z)) * 12 * noise(x * 0.02, z * 0.02); }
    function walkable(x, z) { return x >= -42 && x <= 32 && z >= -6 && z <= 30; }

    var scene = new T.Scene();
    scene.background = new T.Color('#F1E3C2'); scene.fog = new T.Fog('#EEDDBA', 70, 320);
    var skyG = new T.SphereGeometry(560, 24, 14), sp = skyG.attributes.position, sc = new Float32Array(sp.count * 3), cc = new T.Color(), top = new T.Color('#79AFCF'), hor = new T.Color('#F4E6C4'), i;
    for (i = 0; i < sp.count; i++) { var tt = Math.max(0, sp.getY(i) / 560); cc.copy(hor).lerp(top, sm(0.02, 0.7, tt)); sc[i * 3] = cc.r; sc[i * 3 + 1] = cc.g; sc[i * 3 + 2] = cc.b; }
    skyG.setAttribute('color', new T.BufferAttribute(sc, 3));
    var skyM = new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false }); scene.add(new T.Mesh(skyG, skyM));
    var starG = new T.BufferGeometry(), stp = []; for (i = 0; i < 500; i++) { var sa = R() * 6.28, se = 0.1 + R() * 1.3; stp.push(Math.cos(sa) * Math.cos(se) * 520, Math.sin(se) * 520, Math.sin(sa) * Math.cos(se) * 520); }
    starG.setAttribute('position', new T.Float32BufferAttribute(stp, 3)); var starM = new T.PointsMaterial({ color: '#FFF6D8', size: 1.8, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }); scene.add(new T.Points(starG, starM));
    var g = new T.PlaneGeometry(520, 520, 150, 150); g.rotateX(-Math.PI / 2);
    var pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color(), s1 = new T.Color('#C9B07A'), s2 = new T.Color('#A9A06A'), pave = new T.Color('#D8C49A');
    for (i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i), y = height(x, z); pos.setY(i, y);
      c.copy(s1).lerp(s2, noise(x * 0.06, z * 0.06)); if (Math.hypot(x - SQUARE[0], z - SQUARE[1]) < 14) c.lerp(pave, 0.7);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals();
    var ground = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 })); ground.receiveShadow = true; scene.add(ground);
    var hemi = new T.HemisphereLight('#DCEFF2', '#A99A6A', 0.64); scene.add(hemi);
    var sun = new T.DirectionalLight('#FFF0CF', 0.74); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    var ss = sun.shadow.camera; ss.left = -26; ss.right = 26; ss.top = 26; ss.bottom = -26; ss.near = 1; ss.far = 150; sun.shadow.bias = -0.0015;
    scene.add(sun); scene.add(sun.target);
    function put(o, x, z, lift) { o.position.set(x, height(x, z) + (lift || 0), z); scene.add(o); return o; }
    function std(cl) { return new T.MeshStandardMaterial({ color: cl, flatShading: true, roughness: 0.95 }); }
    /* 성 안의 집들(멀리) */
    var houseM = [std('#E2C090'), std('#D6AE7C'), std('#EACB9A')];
    for (i = 0; i < 46; i++) { var hx = -80 + R() * 160, hz = WALL_Z - 8 - R() * 60, hw = 4 + R() * 5, hh = 3 + R() * 4, hs = new T.Mesh(new T.BoxGeometry(hw, hh, 4 + R() * 4), houseM[i % 3]); hs.castShadow = true; put(hs, hx, hz, hh / 2); }
    /* 성벽: 무너진 모습(2:13)과 다 쌓은 모습(6:15) 두 벌 */
    var ruin = new T.Group(), built = new T.Group(), wm = std('#C9A878'), wm2 = std('#B8966A'), rubM = std('#A8926E'), charM = std('#2E2620');
    for (var xx = -90; xx <= 90; xx += 6) {
      var gateHere = Math.abs(xx - VGATE[0]) < 4 || Math.abs(xx - WGATE[0]) < 4;
      if (!gateHere) {
        var full = new T.Mesh(new T.BoxGeometry(6.1, 8, 2.8), (xx / 6) % 2 ? wm : wm2); full.position.set(xx, height(xx, WALL_Z) + 4, WALL_Z); full.castShadow = true; built.add(full);
        for (var k = 0; k < 3; k++) { var cr = new T.Mesh(new T.BoxGeometry(1.2, 0.8, 2.9), wm); cr.position.set(xx - 2 + k * 2, height(xx, WALL_Z) + 8.4, WALL_Z); built.add(cr); }
        var hgt = 0.6 + hash(xx, 3) * 2.6, stub = new T.Mesh(new T.BoxGeometry(6.1, hgt, 2.8), (xx / 6) % 2 ? wm : wm2); stub.position.set(xx, height(xx, WALL_Z) + hgt / 2, WALL_Z); stub.castShadow = true; ruin.add(stub);
        for (k = 0; k < 4; k++) { var rb = new T.Mesh(new T.DodecahedronGeometry(0.5 + R() * 0.4, 0), rubM); rb.position.set(xx + (R() - 0.5) * 6, height(xx, WALL_Z + 2) + 0.3, WALL_Z + 1.8 + R() * 2.5); rb.rotation.set(R() * 3, R() * 3, 0); ruin.add(rb); }
      }
    }
    [VGATE, WGATE].forEach(function (gt) {
      [-3.2, 3.2].forEach(function (dx) { var tw = new T.Mesh(new T.BoxGeometry(3, 10, 3.6), wm2); tw.position.set(gt[0] + dx, height(gt[0], WALL_Z) + 5, WALL_Z); tw.castShadow = true; built.add(tw);
        var tws = new T.Mesh(new T.BoxGeometry(3, 3.2, 3.6), wm2); tws.position.set(gt[0] + dx, height(gt[0], WALL_Z) + 1.6, WALL_Z); ruin.add(tws); });
      var door = new T.Mesh(new T.BoxGeometry(3.2, 5, 0.4), std('#6E4A2C')); door.position.set(gt[0], height(gt[0], WALL_Z) + 2.5, WALL_Z + 1.2); built.add(door);
      var burnt = new T.Mesh(new T.BoxGeometry(3, 1.2, 0.4), charM); burnt.position.set(gt[0] + 0.4, height(gt[0], WALL_Z) + 0.6, WALL_Z + 1.6); burnt.rotation.z = 0.3; ruin.add(burnt);   /* 불탄 성문 */
    });
    scene.add(ruin); scene.add(built); built.visible = false;
    /* 수문 앞 광장의 나무 강단(8:4) */
    var stand = new T.Group(), woodM = std('#8A6240'); var plat = new T.Mesh(new T.BoxGeometry(7, 1.6, 3.5), woodM); plat.position.y = 0.8; stand.add(plat); var step1 = new T.Mesh(new T.BoxGeometry(2, 0.8, 1.2), woodM); step1.position.set(0, 0.4, 2.3); stand.add(step1);
    put(stand, STAND[0], STAND[1]); stand.visible = false;
    var book = new T.Mesh(new T.BoxGeometry(0.4, 0.08, 0.3), std('#5A3E28')); book.visible = false; scene.add(book);   /* 율법책: 생김새는 본문에 없음 */

    /* 느헤미야(Blender), 함께 나간 몇 사람, 탄 짐승(그림자로만), 에스라(Blender), 강단 위 열세 사람, 백성, 산발랏·도비야·게셈 */
    var NEH0 = [-20, -14], neh = { group: api.fallback('#3E6E62', 1.75, 0.27), update: function () {} }; put(neh.group, NEH0[0], NEH0[1]);
    api.person('nehemiah', function (nm) { nm.group.position.copy(neh.group.position); nm.group.rotation.y = neh.group.rotation.y; nm.group.visible = neh.group.visible; scene.remove(neh.group); scene.add(nm.group); neh = nm; });
    var ezra = { group: api.fallback('#6A5E8A', 1.75, 0.27), update: function () {} }; put(ezra.group, STAND[0], STAND[1], 1.6); ezra.group.visible = false;
    api.person('ezra', function (nm) { nm.group.position.copy(ezra.group.position); nm.group.rotation.y = ezra.group.rotation.y; nm.group.visible = ezra.group.visible; scene.remove(ezra.group); scene.add(nm.group); ezra = nm; });
    var beast = new T.Group(), bm = std('#1E1A18'), bb = new T.Mesh(new T.BoxGeometry(0.55, 0.6, 1.5), bm); bb.position.y = 1.1; beast.add(bb);
    var rb1 = new T.Mesh(new T.CylinderGeometry(0.2, 0.3, 0.9, 8), bm); rb1.position.set(0, 1.85, -0.1); beast.add(rb1); var rb2 = new T.Mesh(new T.SphereGeometry(0.16, 8, 6), bm); rb2.position.set(0, 2.42, -0.1); beast.add(rb2);   /* 짐승을 탄 느헤미야(그림자) */ var bn = new T.Mesh(new T.BoxGeometry(0.3, 0.7, 0.35), bm); bn.position.set(0, 1.5, 0.8); bn.rotation.x = -0.5; beast.add(bn);
    [[-0.18, 0.55], [0.18, 0.55], [-0.18, -0.55], [0.18, -0.55]].forEach(function (q) { var lg = new T.Mesh(new T.BoxGeometry(0.12, 0.85, 0.12), bm); lg.position.set(q[0], 0.42, q[1]); beast.add(lg); });
    scene.add(beast);
    var few = []; for (i = 0; i < 3; i++) { var fo = PR.soldier(i + 1100, '#4E4A44', null); fo.group.children[0].children.forEach(function (m) { if (m.geometry && m.geometry.type === 'CylinderGeometry' && m.position.x > 0.2) m.visible = false; }); scene.add(fo.group); few.push(fo); }
    var foes = []; for (i = 0; i < 3; i++) { var fe = PR.soldier(i + 1200, ['#7A3E3E', '#3E5A6E', '#6E6A3A'][i], null); fe.group.children[0].children.forEach(function (m) { if (m.geometry && m.geometry.type === 'CylinderGeometry' && m.position.x > 0.2) m.visible = false; }); put(fe.group, -58 + i * 2.2, 7 + i * 0.6); fe.group.rotation.y = Math.PI / 2; fe.group.visible = false; foes.push(fe); }
    var people = [];
    for (i = 0; i < 60; i++) {
      var o = null; try { if (M2.israelite) o = M2.israelite(i * 17 + 9, { carry: 'none' }); } catch (e) { o = null; }   /* 알아들을 만한 모든 사람(8:2): 아기를 안거나 짐을 인 사람은 두지 않는다 */ if (!o) o = PR.soldier(i, '#7A6A54', null);
      o.k = i; o.home = [36 + (i % 10) * 2.0 + (hash(i, 1) - 0.5) * 0.8, SQUARE[1] + 2 + Math.floor(i / 10) * 1.9]; o.away = [76 + hash(i, 3) * 30, o.home[1] + (hash(i, 5) - 0.5) * 12];   /* 8:12 돌아갈 때는 동쪽으로(아이들 쪽이 아닌 곳) */
      put(o.group, o.home[0], o.home[1]); o.group.rotation.order = 'YXZ'; o.group.rotation.y = Math.PI; o.group.visible = false; people.push(o);
    }
    /* 8:4: 에스라(남쪽을 봄)의 오른쪽(-X)에 여섯, 왼쪽(+X)에 일곱. 두 줄로 강단 안에 선다 */
    var side = []; for (i = 0; i < 13; i++) { var sm2 = null; try { sm2 = M2.israelite ? M2.israelite(i * 31 + 300, { kind: 'man', carry: 'none' }) : null; } catch (e) { sm2 = null; } if (!sm2) sm2 = PR.soldier(i, '#6E5A44', null); sm2.group.visible = false;
      var right = i < 6, li = right ? i : i - 6, per = right ? 3 : 4, sx = STAND[0] + (right ? -1 : 1) * (0.9 + (li % per) * 0.78), sz = STAND[1] - 0.5 - Math.floor(li / per) * 0.9; put(sm2.group, sx, sz, 1.6); sm2.group.rotation.y = 0; side.push(sm2); }

    var phase = 'night', tod = 0, todWant = 0, walkT = 0, bowAmt = 0, bowWant = 0, disperse = 0;
    var ca = new T.Color(), cb = new T.Color();
    var TOD = [['#141C34', '#26315A', 0.34, 0.16, '#9FB4E0'], ['#F1E3C2', '#FFFFFF', 0.64, 0.74, '#FFF0CF'], ['#E8DCC4', '#F2E6D0', 0.6, 0.66, '#FFF0D8']];
    function applyTod() {
      var a = Math.min(1, Math.floor(tod)), t = tod - a, A = TOD[a], B = TOD[a + 1];
      ca.set(A[0]); cb.set(B[0]); ca.lerp(cb, t); scene.background.copy(ca); scene.fog.color.copy(ca);
      ca.set(A[1]); cb.set(B[1]); skyM.color.copy(ca.lerp(cb, t)); hemi.intensity = A[2] + (B[2] - A[2]) * t; sun.intensity = A[3] + (B[3] - A[3]) * t; ca.set(A[4]); cb.set(B[4]); sun.color.copy(ca.lerp(cb, t));
      starM.opacity = Math.max(0, 1 - tod) * 0.9;
    }
    /* 2:13-15: 골짜기 문으로 나가 성벽을 따라 살피고, 돌아와 다시 골짜기 문으로 들어간다(되풀이). 느헤미야는 짐승 위의 그림자 */
    var NW = [[VGATE[0], WALL_Z - 3], [VGATE[0], WALL_Z + 9], [12, WALL_Z + 9], [VGATE[0] + 2, WALL_Z + 11], [VGATE[0], WALL_Z + 9], [VGATE[0], WALL_Z - 3]], NWL = [], NWT = 0;
    for (var nw = 0; nw + 1 < NW.length; nw++) { var l2 = Math.hypot(NW[nw + 1][0] - NW[nw][0], NW[nw + 1][1] - NW[nw][1]); NWL.push(l2); NWT += l2; }
    function nwAt(s) { s = ((s % NWT) + NWT) % NWT; for (var q = 0; q < NWL.length; q++) { if (s <= NWL[q]) { var u = s / NWL[q], a = NW[q], b = NW[q + 1]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, Math.atan2(b[0] - a[0], b[1] - a[1])]; } s -= NWL[q]; } return [NW[0][0], NW[0][1], 0]; }
    function nightWalk(s) {
      var w = nwAt(s), inside = w[1] < WALL_Z + 0.5;
      beast.visible = !inside; beast.position.set(w[0], height(w[0], w[1]), w[1]); beast.rotation.y = w[2];
      neh.group.visible = false;
      few.forEach(function (f, k) { var v = nwAt(s - 2.2 - k * 1.6), fin = v[1] < WALL_Z + 0.5; f.group.visible = !fin; f.group.position.set(v[0], height(v[0], v[1]), v[1]); f.group.rotation.y = v[2]; });
    }
    /* 대목마다 모든 상태를 처음부터 정한다('이전'으로 돌아와도 뒤 대목의 것이 남지 않게) */
    function nehAt(x, z, ry) { neh.group.visible = true; neh.group.position.set(x, height(x, z), z); neh.group.rotation.y = ry; }
    function setPhase(p) {
      phase = p;
      ruin.visible = p !== 'built' && p !== 'square' && p !== 'read' && p !== 'feast'; built.visible = !ruin.visible;
      var sq = p === 'square' || p === 'read' || p === 'feast';
      stand.visible = sq; ezra.group.visible = sq; book.visible = sq; side.forEach(function (o) { o.group.visible = p === 'read' || p === 'feast'; }); people.forEach(function (o) { o.group.visible = sq; });
      foes.forEach(function (f) { f.group.visible = p === 'mock'; });
      beast.visible = false; few.forEach(function (f) { f.group.visible = false; }); neh.group.visible = false;
      bowWant = 0; bowAmt = 0; disperse = 0; people.forEach(function (o) { o.group.position.set(o.home[0], height(o.home[0], o.home[1]), o.home[1]); o.group.rotation.y = Math.PI; o.group.rotation.x = 0; });
      if (p === 'night') { tod = 0; todWant = 0; applyTod(); walkT = 0; nightWalk(0); }
      if (p === 'day') { todWant = 1; nehAt(NEH0[0], NEH0[1], Math.PI); }                                   /* 2:17-18 */
      if (p === 'mock') { todWant = 1; nehAt(NEH0[0], NEH0[1], Math.PI); }                                  /* 2:19-20 */
      if (p === 'built') { todWant = 1; nehAt(NEH0[0], NEH0[1], Math.PI); }                                 /* 6:15-16 */
      if (p === 'square') { todWant = 2; }                                                                   /* 8:1-3 새벽부터. 에스라는 아직 강단 아래 */
      if (p === 'read') { todWant = 2; }                                                                     /* 8:4-8 */
      if (p === 'feast') { todWant = 1; nehAt(STAND[0] - 6, STAND[1] + 1, 0); }                             /* 8:9-12 */
      if (ezra.group.visible) {
        var up = p !== 'square', ez = up ? STAND[1] : STAND[1] + 3;   /* 8:4에서 강단에 선다 */
        ezra.group.position.set(STAND[0], height(STAND[0], ez) + (up ? 1.6 : 0), ez); ezra.group.rotation.y = 0; book.position.set(STAND[0], ezra.group.position.y + 1.02, ez + 0.42);   /* 백성(남쪽)을 보고 선다 */
      }
    }
    var readT = -1;
    function v3(x, y, z) { return new T.Vector3(x, y, z); }
    if (FX) FX.sortLayers(scene);

    return {
      id: 'OT-39', scene: scene, sun: sun, sunOff: [-30, 50, 30],
      height: height, walkable: walkable,
      edge: function (x, z) {
        if (z < -6) return { who: 'onwoo', text: '성벽 쪽으로는 더 가지 말자. 우리는 지켜보는 사람이야.' };
        if (x > 32) return { who: 'hyu', text: '광장 안으로는 들어가지 말자.' };
        return { who: 'hyu', text: '이 비탈 위에서만 다니자.' };
      },
      P: { start: [0, 22], machine: [6, 27], machineRot: -0.4,
        /* 재료가 놓인 곳(quests[i].found): 골짜기 문 쪽(길에서 떨어진 땅) / 성벽 쪽 길가 / 수문 앞 광장 가장자리 */
        parts: [[-38, -2], [6, -4], [29, -1]], lookSpot: [29, -1],
        look: { focus: STAND, mid: SQUARE, dy: 1.6, backE: 9, upE: 7 } },
      eventLook: function (i) {
        if (i === 2) return { focus: [-56, 8], mid: [-56, 8], dy: 1.2, backE: 6, upE: 2.6 };
        if (i === 3) return { focus: [0, WALL_Z], mid: [10, WALL_Z], dy: 5, backE: 9, upE: 4 };
        return { focus: STAND, mid: SQUARE, dy: 1.2, backE: 9, upE: 7 };
      },
      quietAt: function () { return [[STAND[0], STAND[1], 8]]; },   /* 율법책을 읽는 강단 둘레 8m는 끔 */
      detector: '탐지기', askLabel: '탐지기 물음 풀기',
      intro: { text: '타임머신이 성 밖 비탈에 내려앉았어요. 밤이에요. 성벽이 무너져 있어요.', say: { who: 'hyu', text: '성벽에는 가까이 가지 말자. 이 비탈 위에서만 다니자.' } },
      lookText: '느헤미야의 성벽 이야기를 성경에서 찾아 읽은 뒤 다시 골라 보세요.',
      partBeats: [0, 1], eventStart: 2,
      sceneDoneText: '성벽 장면을 끝까지 지켜봐야 떠날 수 있어요.',
      dex: [
        { id: 'wall', name: '예루살렘 성벽', desc: '무너졌던 성벽. 며칠 만에 다 쌓았는지는 느헤미야 6장 15절에 있어요.', ref: '느 2:13, 6:15', hint: '북쪽 성벽을 담아 보세요.', range: 120, crop: 0.6, pos: function () { return v3(0, height(0, WALL_Z) + 4, WALL_Z); } },   /* 탐지기 물음의 답(쌓은 날수)은 성경에서 찾게(규칙서 13.9) */
        { id: 'vgate', name: '골짜기 문', desc: '느헤미야가 밤에 나가 성벽을 살핀 문', ref: '느 2:13', hint: '서쪽 성문을 보세요.', range: 80, crop: 0.4, pos: function () { return v3(VGATE[0], height(VGATE[0], WALL_Z) + 3, WALL_Z); } },
        { id: 'nehemiah', name: '느헤미야', desc: '예루살렘에 이르러 성을 다시 쌓자고 한 사람', ref: '느 2:17', hint: '성벽 가까이에서 찾아보세요.', range: 50, crop: 0.36, visible: function () { return neh.group.visible; }, pos: function () { var p = neh.group.position; return v3(p.x, p.y + 1.1, p.z); } },
        { id: 'square', name: '수문 앞 광장', desc: '모든 백성이 한꺼번에 모인 광장', ref: '느 8:1', hint: '동쪽 성문 앞을 보세요.', range: 80, pos: function () { return v3(SQUARE[0], height(SQUARE[0], SQUARE[1]) + 1, SQUARE[1]); } }
      ],
      reset: function () { setPhase('night'); },
      partFound: function () {},
      partContinue: function (i) { if (i === 0) setPhase('day'); },   /* 밤 대목(2:11-16)을 본 뒤에 낮으로 */
      lookupPose: function () { if (phase === 'night') setPhase('day'); },
      /* 대목 번호(OT-39.json): 0 = 2:11-16(밤), 1 = 2:17-18, 2 = 2:19-20, 3 = 6:15-16, 4 = 8:1-3, 5 = 8:4-8, 6 = 8:9-12 */
      beatPose: function (i) { setPhase(['night', 'day', 'mock', 'built', 'square', 'read', 'feast'][i] || 'day'); readT = i === 5 ? 0 : -1; },
      update: function (dt, now) {
        if (Math.abs(tod - todWant) > 0.003) { tod += (todWant - tod) * Math.min(1, dt * 0.6); applyTod(); }
        if (phase === 'night') { walkT += dt; nightWalk(walkT * 2.2); few.forEach(function (f) { f.update(dt, 1, now); }); }
        if (neh.update) neh.update(dt, false);
        if (ezra.update) ezra.update(dt, false);
        /* 8:5-6: 책을 펴자 서서 듣고, 무릎을 꿇어 몸을 굽혀 엎드린다(멀리서) */
        if (readT >= 0) { readT += dt; bowWant = readT > 4 && readT < 10 ? 1 : 0; }
        bowAmt += (bowWant - bowAmt) * Math.min(1, dt * 1.2);
        people.forEach(function (o) {
          if (phase === 'feast') { disperse = Math.min(1, disperse + dt * 0.04); var x = o.home[0] + (o.away[0] - o.home[0]) * disperse, z = o.home[1] + (o.away[1] - o.home[1]) * disperse; o.group.position.set(x, height(x, z), z); o.group.rotation.y = Math.atan2(o.away[0] - o.home[0], o.away[1] - o.home[1]); o.group.rotation.x = 0; if (o.update) o.update(dt, disperse < 1 ? 1 : 0); }
          else { o.group.rotation.x = bowAmt * 0.7; o.group.position.y = height(o.group.position.x, o.group.position.z) - bowAmt * 0.45; if (o.update) o.update(dt, 0); }   /* 무릎 꿇은 높이로 낮추고 몸을 굽힌다(발이 땅에 묻히지 않게 기울기는 작게) */
        });
        foes.forEach(function (f) { f.update(dt, 0, now); });
      },
      audio: function (A) { A.setFlock(999); A.setFire(999); },
      menuCam: function (camera, now) { var a = now * 0.05; camera.position.set(0 + Math.sin(a) * 10, 9, 26); camera.lookAt(0, 3, WALL_Z); },
      debug: { phase: function () { return { phase: phase, tod: tod, bow: bowAmt, disperse: disperse }; }, arrived: function () { return phase !== 'night'; } }
    };
  };
})();
