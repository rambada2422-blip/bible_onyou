/* 3D 장면 설정: OT-17 라합과 두 정탐꾼 (수 2:1-24). 자동 작업 3d-b가 더한 장면(장면표의 대표 장면 12개 밖의 추가 제안).
 * 방향: 여리고 성은 북쪽(-Z). 성문은 남쪽 성벽에, 라합의 집은 서남쪽 성벽 위에 있다. 요단으로 가는 길은 성문에서 동쪽으로, 산은 서쪽 멀리.
 *       성의 자리와 생김새는 여리고 장면(OT-19, scene_jericho19.js)과 같게 다시 지었다(그 파일은 고치지 않았다). 아이들은 성 밖 남쪽 빈 땅에서만 다닌다.
 * 아이들이 다니는 때: 해 질 무렵. 첫 재료를 주울 때 두 사람이 성으로 들어가고(2:1), 그 뒤 밤이 된다(2:2).
 * 본문에 맞춘 점 (content/ot/OT-17.json design3d)
 *  - 2:1: 두 사람이 길을 걸어 성문으로 들어간다. 싯딤과 여호수아는 그리지 않는다(강 건너의 일. 글로만).
 *  - 2:2-3: 왕과 왕이 보낸 사람들은 그리지 않는다(성 안의 일. 글로만). 왕의 생김새·궁전 없음.
 *  - 2:4-7: 지붕에 삼대가 널려 있고 두 사람은 보이지 않는다(2:6 숨겼다). 쫓는 사람들이 성문을 나가 요단으로 가는 길로 가고, 그들이 나가자 곧 성문이 닫힌다(2:7).
 *  - 2:8-14: 라합이 지붕에 올라와 있고 두 사람은 아직 눕기 전이라 앉아 있다(2:8). 멀리 위에서 바라본 모습으로만. 얼굴을 가까이 보이지 않는다.
 *  - 2:15-21: 집이 성벽 위에 있어 창에서 줄로 달아 내린다(2:15). 두 사람은 서쪽 산 쪽으로 간다(2:16, 2:22). 그 뒤 창문에 붉은 줄이 매인다(2:21).
 *    달아 내린 줄은 밤이라 어두운 줄로만 보인다(붉은 줄과 같은 줄인지 그림으로 단정하지 않는다. 2:15, 2:18).
 *  - 2:22-24: 쫓는 사람들이 길에서 돌아온다(2:22 만나지 못했다). 두 사람이 숨은 산과 강 건너 여호수아에게 간 일은 글로만.
 *  - 라합의 가족은 세우지 않는다(이 장에서는 말 속에만 나온다). 라합의 직업을 드러내는 것은 아무것도 그리지 않는다. 싸움·붙잡힘 없음.
 *  - 하나님이 말씀하시거나 나타나시는 대목이 없다. 빛·구름·소리를 만들지 않는다. 붉은 줄에 다른 뜻을 덧붙이지 않는다.
 * 감수가 필요한 설정: 성의 크기와 성벽 높이, 라합의 집이 성벽의 서남쪽에 있는 것과 집·창·지붕의 생김새, 삼대의 모양, 성문의 자리,
 *   요단으로 가는 길을 동쪽으로·산을 서쪽으로 둔 것(본문은 방향을 말하지 않는다), 쫓는 사람 수(넷. 횃불·무기 없음), 두 사람이 해 질 무렵 요단 쪽 길로 들어오는 것,
 *   창에서 달아 내릴 때 라합을 보이지 않게 한 것(2:15의 주어는 라합. 집 안에 있다), 쫓는 사람들이 돌아와 성문으로 들어가는 것(2:22는 돌아갔다고만 한다),
 *   두 사람·라합의 옷 색과 생김새(백성 모형), 지붕 위의 일을 높은 데서 바라보는 화면으로 보여 주는 것, 사흘(2:22)을 한 대목 안에서 새벽빛으로 넘긴 것.
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  BO3D.scene3d = BO3D.scene3d || {};
  if (!BO3D.p3b || !BO3D.p3b.on('OT-17')) return;   /* design3d.build가 false면 이야기 카드로만 */
  BO3D.scene3d['OT-17'] = function (api) {
    var T = THREE, MO = BO3D.models || {}, PR = BO3D.props, B = BO3D.p3b, FX = api.FX, R = PR.rng(1701);
    var sm = B.sm, noise = B.noise, std = B.std;
    var CITY = [0, -70], EA = 34, EB = 24, WH = 8.5, NSEG = 34, GATE = [0, -46];
    var ROAD = [[0, -45], [1, -37], [14, -29], [60, -25], [175, -21]];                    /* 성문에서 요단으로 가는 길(2:7) */
    function ell(x, z, a, b) { var dx = (x - CITY[0]) / a, dz = (z - CITY[1]) / b; return Math.sqrt(dx * dx + dz * dz); }
    function height(x, z) {
      var h = 0.4 + 0.35 * noise(x * 0.05 + 2, z * 0.05 + 9) + 1.0 * sm(-6, 22, z);
      h += 3.2 * sm(1.25, 0.82, ell(x, z, EA + 6, EB + 6));
      h += sm(-100, -230, x) * 36 * (0.5 + 0.6 * noise(4, z * 0.02)) + sm(160, 240, x) * 6 * noise(3, z * 0.02) + sm(-150, -250, z) * 14 * noise(x * 0.02, 7);
      return h;
    }
    function walkable(x, z) { return x >= -44 && x <= 42 && z >= -14 && z <= 24; }

    var scene = new T.Scene();
    scene.background = new T.Color('#D9A27A'); scene.fog = new T.Fog('#D9A27A', 70, 330);
    var skyO = B.sky(scene, 1702);
    var cSand = new T.Color('#D9BE88'), cGrass = new T.Color('#A9B270'), cMound = new T.Color('#C7A070'), cHill = new T.Color('#B49A8E'), cRoad = new T.Color('#E6D4AC');
    scene.add(B.ground(height, function (x, z, c) {
      c.copy(cSand).lerp(cGrass, sm(0.45, 0.8, noise(x * 0.04 + 5, z * 0.04)) * 0.6);
      if (ell(x, z, EA + 6, EB + 6) < 1.2) c.lerp(cMound, 0.6);
      var rd = B.polyDist(ROAD, x, z); if (rd < 5) c.lerp(cRoad, sm(5, 2, rd));
      var y = height(x, z); if (y > 7) c.lerp(cHill, sm(7, 24, y));
    }, 560, 170));
    var hemi = new T.HemisphereLight('#DCEFF2', '#A99A6A', 0.6); scene.add(hemi);
    var sun = new T.DirectionalLight('#FFF0CF', 0.7); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    var ss = sun.shadow.camera; ss.left = -26; ss.right = 26; ss.top = 26; ss.bottom = -26; ss.near = 1; ss.far = 150; sun.shadow.bias = -0.0015;
    scene.add(sun); scene.add(sun.target);
    /* 때: 0 해 질 무렵, 1 밤(2:2), 2 새벽(사흘 뒤까지, 2:22) */
    var tod = B.tod(scene, skyO, hemi, sun, [['#D9A27A', '#F0B890', 0.52, 0.5, '#FFB070', 0], ['#141C34', '#26315A', 0.36, 0.17, '#9FB4E0', 1], ['#E6D2C0', '#F2DCCB', 0.58, 0.55, '#FFE2C0', 0]]);
    var i, k;

    /* 성: 둔덕 위의 집들과 둘레의 성벽, 망대(OT-19와 같은 꼴). 움직이지 않으므로 한 덩어리로 합친다 */
    var statics = [], houseM = [std('#E2C090'), std('#D6AE7C'), std('#EACB9A'), std('#CBA070')], wallM = std('#C2905F'), wallM2 = std('#AD7850'), capM = std('#D6AA76'), doorM = std('#5A3A22');
    for (i = 0; i < 60; i++) {
      var a = R() * 6.28, rr = Math.sqrt(R()) * 0.78, hx = CITY[0] + Math.cos(a) * EA * rr, hz = CITY[1] + Math.sin(a) * EB * rr, hw = 3 + R() * 3, hh = 2.5 + R() * 2.5;
      var hs = new T.Mesh(new T.BoxGeometry(hw, hh, 2.5 + R() * 3), houseM[i % 4]); hs.position.set(hx, height(hx, hz) + hh / 2 - 0.2, hz); hs.rotation.y = R() * 0.6; statics.push(hs);
    }
    var GI = Math.round(NSEG * 0.25) - 1, gateG = null;
    for (i = 0; i < NSEG; i++) {
      var t0 = (i / NSEG) * 6.283, t1 = ((i + 1) / NSEG) * 6.283, x0 = CITY[0] + Math.cos(t0) * EA, z0 = CITY[1] + Math.sin(t0) * EB, x1 = CITY[0] + Math.cos(t1) * EA, z1 = CITY[1] + Math.sin(t1) * EB;
      var len = Math.sqrt((x1 - x0) * (x1 - x0) + (z1 - z0) * (z1 - z0)) + 0.4, mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, seg = new T.Group();
      seg.position.set(mx, height(mx, mz) - 0.3, mz); seg.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
      if (i === GI) {   /* 성문(2:5, 2:7): 양쪽 기둥과 문 위의 벽. 문짝은 따로 움직인다 */
        [-1, 1].forEach(function (s) { var pier = new T.Mesh(new T.BoxGeometry((len - 3.6) / 2, WH + 2.4, 3.4), wallM2); pier.position.set(s * (1.8 + (len - 3.6) / 4), (WH + 2.4) / 2, 0); seg.add(pier); });
        var lin = new T.Mesh(new T.BoxGeometry(3.7, WH - 4.9, 2.4), wallM); lin.position.y = 4.9 + (WH - 4.9) / 2; seg.add(lin);
        gateG = seg; GATE = [mx, mz];
      } else {
        var wall = new T.Mesh(new T.BoxGeometry(len, WH, 2.4), i % 3 ? wallM : wallM2); wall.position.y = WH / 2; seg.add(wall);
        for (k = 0; k < 4; k++) { var cr = new T.Mesh(new T.BoxGeometry(len / 8, 0.8, 2.5), capM); cr.position.set(-len / 2 + len / 8 * (k * 2 + 0.5), WH + 0.4, 0); seg.add(cr); }
        if (i % 5 === 0) { var tw = new T.Mesh(new T.BoxGeometry(4.2, WH + 3, 4.2), wallM2); tw.position.y = (WH + 3) / 2; seg.add(tw); }
      }
      statics.push(seg);
    }
    /* 성벽 위에 있는 라합의 집(2:15): 서남쪽 성벽 위. 바깥쪽 벽에 창 하나, 평평한 지붕에 삼대(2:6). 집의 생김새는 본문에 없다 */
    var TH = 128 * Math.PI / 180, HX = CITY[0] + Math.cos(TH) * EA, HZ = CITY[1] + Math.sin(TH) * EB, nx0 = Math.cos(TH) / EA, nz0 = Math.sin(TH) / EB, nl = Math.hypot(nx0, nz0), NX = nx0 / nl, NZ = nz0 / nl, HR = Math.atan2(NX, NZ);
    var HB = height(HX, HZ) - 0.3 + WH - 0.4, HH = 4, HW = 7.4, HD = 4.6, HOFF = 0.5, ROOF = HB + HH, WINY = HB + 1.9;
    function hw2(lx, lz) { return [HX + lx * Math.cos(HR) + lz * Math.sin(HR), HZ - lx * Math.sin(HR) + lz * Math.cos(HR)]; }   /* 집의 자리(왼오른, 안팎) → 땅의 자리. lz가 클수록 성 밖 */
    var houseG = new T.Group(); houseG.position.set(HX, HB, HZ); houseG.rotation.y = HR;
    var hbM = std('#DDB98A'), hb = new T.Mesh(new T.BoxGeometry(HW, HH, HD), hbM); hb.position.set(0, HH / 2, HOFF); houseG.add(hb);
    [[0, HD / 2, HW + 0.2, 0.25], [0, -HD / 2, HW + 0.2, 0.25], [HW / 2, 0, 0.25, HD], [-HW / 2, 0, 0.25, HD]].forEach(function (q) { var pp = new T.Mesh(new T.BoxGeometry(q[2], 0.45, q[3]), capM); pp.position.set(q[0], HH + 0.22, HOFF + q[1]); houseG.add(pp); });
    var flaxM = [std('#B9A26A'), std('#A08A54')];
    for (i = 0; i < 90; i++) { var fl = new T.Mesh(new T.BoxGeometry(1.8 + R() * 0.9, 0.05, 0.05), flaxM[i % 2]); fl.position.set((R() - 0.5) * (HW - 2.4), HH + 0.05 + R() * 0.28, HOFF + (R() - 0.5) * (HD - 1.4)); fl.rotation.y = (R() - 0.5) * 0.7; fl.rotation.z = (R() - 0.5) * 0.12; houseG.add(fl); }
    statics.push(houseG);
    statics.forEach(function (o) { scene.add(o); }); var city = PR.mergeStatic(statics); statics.forEach(function (o) { scene.remove(o); }); scene.add(city);
    /* 창(2:15): 밤에는 안의 불빛이 비친다. 달아 내린 줄(어두운 줄)과 붉은 줄(2:18, 2:21) */
    var WIN = hw2(0.6, HOFF + HD / 2 + 0.16), winM = new T.MeshBasicMaterial({ color: '#FFCF8A' }), win = new T.Mesh(new T.PlaneGeometry(1.0, 1.2), winM); win.position.set(WIN[0], WINY, WIN[1]); win.rotation.y = HR; scene.add(win);
    var frame = new T.Mesh(new T.BoxGeometry(1.3, 1.5, 0.1), doorM); var FR = hw2(0.6, HOFF + HD / 2 + 0.05); frame.position.set(FR[0], WINY, FR[1]); frame.rotation.y = HR; scene.add(frame);
    var DROP = hw2(0.6, HOFF + HD / 2 + 0.55), dropY = height(DROP[0], DROP[1]), ropeL = WINY - 0.6 - dropY - 0.2;
    var rope = new T.Mesh(new T.CylinderGeometry(0.028, 0.028, ropeL, 5), std('#3A2E26')); rope.position.set(DROP[0], dropY + 0.2 + ropeL / 2, DROP[1]); rope.visible = false; scene.add(rope);
    var CD = hw2(0.6, HOFF + HD / 2 + 0.1), cord = new T.Group(), cordM = new T.MeshStandardMaterial({ color: '#B3261E', flatShading: true, roughness: 0.9 });   /* 스스로 빛나지 않는다: 밤에는 어둡고, 날이 밝으면 붉게 보인다 */
    var c1 = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 1.5, 5), cordM); c1.position.y = -0.75; cord.add(c1); var c2 = new T.Mesh(new T.SphereGeometry(0.1, 6, 5), cordM); cord.add(c2);
    cord.position.set(CD[0], WINY - 0.6, CD[1]); cord.visible = false; scene.add(cord);
    /* 성문 문짝 둘(여닫는다) */
    var leaves = [];
    [-1, 1].forEach(function (s) { var pv = new T.Group(), lf = new T.Mesh(new T.BoxGeometry(1.8, 4.8, 0.25), doorM); lf.position.set(-s * 0.9, 2.4, 0); pv.add(lf); pv.position.set(s * 1.8, 0, -1.0); pv.userData.s = s; gateG.add(pv); leaves.push(pv); });
    var gateTop = new T.Group(); gateTop.position.copy(gateG.position); gateTop.rotation.copy(gateG.rotation); leaves.forEach(function (l) { gateTop.add(l); }); scene.add(gateTop);
    var gateOpen = 1, gateWant = 1;
    function gateSet(v, now) { gateWant = v; if (now) gateOpen = v; }
    /* 성 밖 빈 땅의 덤불과 바위(자리 표시용) */
    [[-41, 5, 1], [-30, 12, 2], [12, 12, 3], [38, -4, 4], [26, 18, 5], [-14, 20, 6], [-41, 4, 7]].forEach(function (q) { if (MO.shrub) { var sb = MO.shrub(q[2] + 30); sb.position.set(q[0] - 1.6, height(q[0] - 1.6, q[1] + 1), q[1] + 1); scene.add(sb); } if (MO.rock && q[2] % 2) { var rk = MO.rock(q[2] + 60); rk.position.set(q[0] + 1.7, height(q[0] + 1.7, q[1] - 1) - 0.05, q[1] - 1); scene.add(rk); } });

    /* 사람들: 두 사람(2:1), 라합(2:1), 쫓는 사람들(2:7) */
    var A = B.actors(height), all = [];
    function mk(o) { var a = A.make(o); scene.add(a.g); all.push(a); return a; }
    var spies = [mk(B.man(1711)), mk(B.man(1723))], rahab = mk(B.woman(1741)), chasers = [];
    for (i = 0; i < 4; i++) chasers.push(mk(B.man(1750 + i * 9)));   /* 횃불·무기는 들리지 않는다(본문에 없음) */
    var roofLift = function (p) { return ROOF + 0.08 - height(p[0], p[1]); };
    var SP = [hw2(-1.6, HOFF + 0.3), hw2(-0.4, HOFF - 0.5)], RH = hw2(1.5, HOFF - 0.2);
    var OUT = [[GATE[0], GATE[1] - 4], [GATE[0], GATE[1] + 1], [1, -37], [14, -29], [60, -25], [150, -21.5]];
    var HILL = [[DROP[0] - 6, DROP[1] + 5], [-60, -44], [-110, -48], [-160, -52]];

    var phase = 'dusk', pt = 0, seen7 = false;
    function show(list, v) { list.forEach(function (a) { a.g.visible = v; }); }
    /* 대목마다 모든 상태를 처음부터 정한다('이전'으로 돌아와도 뒤 대목의 것이 남지 않게) */
    function setPhase(p) {
      phase = p; pt = 0; if (p === 'dusk') seen7 = false; if (p === 'pursue') seen7 = true;
      show(spies, p === 'enter' || p === 'roof' || p === 'oath' || p === 'window'); rahab.g.visible = p === 'roof' || p === 'oath'; show(chasers, p === 'pursue' || p === 'after');
      rope.visible = false; cord.visible = p === 'after'; spies.forEach(function (s) { s.down = 0; s.gone = false; });
      tod.set(p === 'dusk' || p === 'enter' ? 0 : p === 'after' ? 2 : 1, p !== 'night' && p !== 'after');
      winM.color.set(p === 'dusk' || p === 'enter' ? '#C9A070' : p === 'after' ? '#8A6A4A' : '#FFCF8A');
      gateSet(p === 'dusk' || p === 'enter' || p === 'night' || p === 'pursue' ? 1 : 0, true);
      if (p === 'enter') { spies.forEach(function (s, n) { A.at(s, 44 + n * 1.3, -26 + n * 0.9, -Math.PI / 2); A.go(s, [[14 + n, -29 + n * 0.6], [1 + n * 0.5, -37], [GATE[0], GATE[1] + 1], [GATE[0] + n * 0.4, GATE[1] - 6]], 1.5); }); }   /* 2:1 */
      if (p === 'pursue') { chasers.forEach(function (c, n) { A.at(c, GATE[0] + (n % 2 ? 0.7 : -0.7), GATE[1] - 4 - n * 1.6, 0); c.g.visible = false; c.out = false; }); }   /* 2:7: 성문으로 나간다. 지붕의 삼대(2:6)는 이 대목 뒤의 '곁에서 보기'와 다음 대목에서 본다 */
      if (p === 'roof' || p === 'oath') {                                                                                      /* 2:8-14 */
        spies.forEach(function (s, n) { A.at(s, SP[n][0], SP[n][1], HR + Math.PI / 2 + 0.3 - n * 0.5, roofLift(SP[n])); s.sitWant = s.sit = p === 'roof' ? 1 : 0; });
        A.at(rahab, RH[0], RH[1], HR - Math.PI / 2, roofLift(RH));
      }
      if (p === 'window') { rope.visible = true; spies.forEach(function (s, n) { A.at(s, DROP[0], DROP[1], HR + Math.PI, WINY - 1.4 - dropY); s.g.visible = n === 0; }); }   /* 2:15 */
      if (p === 'after') { chasers.forEach(function (c, n) { var back = OUT.slice(1, 5).reverse().map(function (q) { return [q[0] + (n % 2 ? 0.7 : -0.7), q[1]]; }); A.at(c, back[0][0] + n * 2.2, back[0][1], -Math.PI / 2); A.go(c, back.concat([[GATE[0], GATE[1] - 6]]), 1.3); }); gateSet(1, true); }   /* 2:22 */
    }
    function v3(x, y, z) { return new T.Vector3(x, y, z); }
    if (FX) FX.sortLayers(scene);
    var camRoof = { pos: [HX + NX * 25, ROOF + 7.5, HZ + NZ * 25], look: [HX, ROOF + 0.4, HZ] };
    var camWin = { pos: [HX + NX * 24 - 6, height(HX + NX * 24, HZ + NZ * 24) + 5, HZ + NZ * 24], look: [DROP[0], (WINY + dropY) / 2 + 1, DROP[1]] };
    var camGate = { pos: [-16, height(-16, -20) + 6.5, -20], look: [7, height(4, -40) + 3, -39] };

    return {
      id: 'OT-17', scene: scene, sun: sun, sunOff: [-30, 50, 30],
      height: height, walkable: walkable,
      edge: function (x, z) {
        if (z < -14) return { who: 'onwoo', text: '성과 길 쪽으로는 가지 말자. 우리는 지켜보는 사람이야.' };
        return { who: 'hyu', text: '성에서 멀찍이 떨어진 이 땅에서만 다니자.' };
      },
      P: { start: [0, 16], machine: [6, 21], machineRot: -0.4,
        /* 재료가 놓인 곳(quests[i].found): 성에서 멀찍이 떨어진 성 밖 빈 땅 / 요단으로 가는 길이 보이는 땅 / 산이 보이는 쪽 땅 */
        parts: [[10, 6], [36, -8], [-40, 3]], lookSpot: [-40, 3],
        look: { focus: [HX, HZ], mid: [HX + NX * 6, HZ + NZ * 6], dy: WH + 2, backE: 6, upE: 3 } },
      eventLook: function () { return null; },
      /* 성벽 위와 성문의 일은 아이들 자리에서 멀어, 멀찍이 떨어진 자리(지붕은 높은 데)에서 바라보는 화면으로 보여 준다 */
      eventCam: function (i) {
        if (i === 2) return camGate;
        if (i === 3 || i === 4) return camRoof;
        if (i === 5) return camWin;
        if (i === 6) return pt < 7 ? camWin : { pos: [-16, height(-16, -20) + 6.5, -20], look: [16, height(14, -30) + 2, -31] };
        return null;
      },
      beatNote: function (i) {
        if (i === 1) return '성 안에서 있었던 일이라 여기서는 보이지 않아요.';
        if (i === 3 || i === 4) return '성벽 위 지붕의 일은 타임머신의 망원 화면으로 멀리서 봐요.';
        if (i === 5) return '두 사람이 줄을 타고 내려와 떠난 뒤에, 창문에 붉은 줄이 매여요(수 2:21). 끝까지 지켜봐요.';
        if (i === 6) return '사흘 뒤까지 이어서 봐요. 두 사람이 숨은 산과 강 건너는 여기서 보이지 않아요.';
        return null;
      },
      detector: '탐지기', askLabel: '탐지기 물음 풀기',
      intro: { text: '타임머신이 성 밖 빈 땅에 내려앉았어요. 해가 지고 있어요. 저쪽에 성벽으로 둘린 성이 보여요.', say: { who: 'hyu', text: '성과 성문 쪽으로는 가지 말자. 성에서 멀찍이 떨어진 이 땅에서만 다니자.' } },
      lookText: '라합과 두 정탐꾼의 이야기를 성경에서 찾아 읽은 뒤 다시 골라 보세요.',
      partBeats: [0, 1], eventStart: 2,
      sceneDoneText: '라합의 집 장면을 끝까지 지켜봐야 떠날 수 있어요.',
      dex: [
        { id: 'wall', name: '여리고 성벽', desc: '라합의 집이 그 위에 있던 성벽', ref: '수 2:15', hint: '성벽을 넓게 담아 보세요.', range: 130, crop: 0.6, pos: function () { return v3(CITY[0], height(CITY[0], CITY[1] + EB) + 5, CITY[1] + EB); } },
        { id: 'gate', name: '성문', desc: '쫓는 사람들이 나가자 곧 닫힌 문', ref: '수 2:7', hint: '성벽 한가운데를 보세요.', range: 110, crop: 0.34, visible: function () { return seen7; }, pos: function () { return v3(GATE[0], height(GATE[0], GATE[1]) + 3, GATE[1]); } },
        { id: 'house', name: '성벽 위의 집', desc: '라합이 살던 집. 성벽 위에 있었다', ref: '수 2:15', hint: '성문 왼쪽 성벽 위를 보세요.', range: 110, crop: 0.34, pos: function () { return v3(HX, HB + 2, HZ); } },
        { id: 'road', name: '요단으로 가는 길', desc: '쫓는 사람들이 나루턱까지 따라간 길', ref: '수 2:7', hint: '성문에서 오른쪽으로 뻗어 있어요.', range: 90, crop: 0.5, visible: function () { return seen7; }, pos: function () { return v3(40, height(40, -26) + 0.5, -26); } },
        { id: 'cord', name: '창문의 붉은 줄', desc: '라합이 두 사람을 보낸 뒤 창문에 맨 줄', ref: '수 2:21', hint: '성벽 위 집의 창을 보세요.', range: 110, crop: 0.3, visible: function () { return cord.visible; }, pos: function () { return v3(CD[0], WINY - 1, CD[1]); } }
      ],
      reset: function () { setPhase('dusk'); },
      partFound: function (n) { if (n === 0) setPhase('enter'); },      /* 2:1: 두 사람이 성으로 들어간다 */
      partContinue: function (n) { if (n === 0) setPhase('night'); },   /* 그 뒤 밤이 된다(2:2) */
      lookupPose: function () { if (phase === 'dusk' || phase === 'enter') setPhase('night'); },
      /* 대목 번호(OT-17.json): 0 = 2:1, 1 = 2:2-3 (재료를 주울 때) / 2 = 2:4-7, 3 = 2:8-11, 4 = 2:12-14, 5 = 2:15-21, 6 = 2:22-24 */
      beatPose: function (n) { setPhase(['enter', 'night', 'pursue', 'roof', 'oath', 'window', 'after'][n] || 'night'); },
      update: function (dt, now) {
        pt += dt; tod.update(dt);
        if (phase === 'pursue' && pt > 1.5) chasers.forEach(function (c, n) { if (!c.out) { c.out = true; c.g.visible = true; A.go(c, OUT.map(function (q) { return [q[0] + (n % 2 ? 0.7 : -0.7), q[1] + (n > 1 ? 0.8 : 0)]; }), 3.1); } });
        if (phase === 'pursue' && chasers[3].g.position.z > GATE[1] + 3) gateSet(0);                 /* 그들이 나가자 곧 성문을 닫았다(2:7) */
        if (phase === 'after' && pt > 0.5 && !A.moving(chasers[3])) gateSet(0);
        if (Math.abs(gateOpen - gateWant) > 0.002) gateOpen += (gateWant - gateOpen) * Math.min(1, dt * 1.6);
        leaves.forEach(function (l) { l.rotation.y = -l.userData.s * gateOpen * 1.45; });
        if (phase === 'enter') spies.forEach(function (s) { if (!A.moving(s)) s.g.visible = false; });
        if ((phase === 'pursue' && pt > 2) || phase === 'after') chasers.forEach(function (c) { if (!A.moving(c)) c.g.visible = false; });
        if (phase === 'window') {
          /* 창에서 줄로 한 사람씩 내려온다(2:15). 그 뒤 산 쪽으로 가고(2:16, 2:22), 창문에 붉은 줄이 매인다(2:21) */
          spies.forEach(function (s, n) {
            var t0 = 1.5 + n * 6, u = Math.min(1, Math.max(0, (pt - t0) / 5));
            if (pt >= t0) s.g.visible = !s.gone || A.moving(s);
            if (!s.gone) { s.lift = (WINY - 1.4 - dropY) * (1 - u); if (u >= 1 && !s.down) { s.down = 1; A.go(s, [[DROP[0] + NX * (2.2 + n * 1.2) + (n ? 1.2 : -1.2), DROP[1] + NZ * (2.2 + n * 1.2)]], 1.2, HR + Math.PI); } }
          });
          if (pt > 21 && !spies[0].gone) { spies.forEach(function (s, n) { s.gone = true; s.lift = 0; A.go(s, HILL.map(function (q) { return [q[0] + n * 1.2, q[1] + n * 0.8]; }), 1.7); }); }
          if (pt > 15) rope.visible = pt < 25; cord.visible = pt > 27;
          spies.forEach(function (s) { if (s.gone && !A.moving(s)) s.g.visible = false; });
        }
        all.forEach(function (a) { if (a.g.visible) A.step(a, dt); });
      },
      audio: function (Au) { Au.setFlock(999); Au.setFire(999); },
      menuCam: function (camera, now) { var a2 = now * 0.05; camera.position.set(Math.sin(a2) * 10, height(0, 14) + 7, 16); camera.lookAt(HX * 0.5, 6, CITY[1] + EB); },
      debug: { phase: function () { return { phase: phase, t: pt, tod: tod.value(), gate: gateOpen, cord: cord.visible, rope: rope.visible, spies: spies.map(function (s) { return [Math.round(s.g.position.x), Math.round(s.g.position.y), Math.round(s.g.position.z), s.g.visible]; }) }; }, arrived: function () { return true; } }
    };
  };
})();
