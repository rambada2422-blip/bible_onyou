/* 3D 장면 설정: OT-23 룻과 나오미 (룻 1:1-22, 2:1-23, 4:13-17). 자동 작업 3d-b가 더한 장면(장면표의 대표 장면 12개 밖의 추가 제안).
 * 방향: 아이들은 남쪽(+Z)의 낮은 비탈에서만 다닌다. 비탈 앞에 동서로 길이 지나고, 길 건너 북쪽에 보리밭, 서북쪽 언덕에 베들레헴 성읍이 있다.
 * 아이들이 다니는 때: 두 사람이 베들레헴에 이르기 바로 전, 보리 추수를 시작할 때(1:22). 밭에서는 베는 사람들이 일하고 있다.
 * 본문에 맞춘 점 (content/ot/OT-23.json design3d)
 *  - 모압 지방의 일(1:1-5)과 돌아오는 길 위의 일(1:6-18)은 3D로 보여 주지 않는다. 재료 1·2를 주울 때 글로만 전한다("그 앞의 일").
 *  - 1:19-22: 나오미와 룻 두 사람이 길을 걸어 성읍 어귀에 이르고, 성읍 사람들이 모여 선다. 오르바는 없다(1:14-15).
 *  - 2:1-7: 룻이 베는 사람들을 따라가며 이삭을 줍는다(2:3). 보아스가 베들레헴 쪽에서 밭으로 와서(2:4) 베는 사람들을 거느린 사환 곁에 선다(2:5-6).
 *  - 2:8-16: 룻이 보아스 앞에서 땅에 엎드려 절한다(2:10. 멀리서). 식사할 때 룻이 베는 사람들 곁에 앉는다(2:14). 떡·초·볶은 곡식은 작아서 그리지 않는다.
 *  - 2:17-23: 저녁까지 줍고(2:17), 주운 것을 떨어 보따리로 들고 성읍으로 들어가 나오미에게 보인다(2:18). 보리 한 에바쯤은 보따리로만.
 *  - 4:13-17: 추수를 마친 뒤(2:23)의 일. 밭은 다 벤 모습. 나오미가 아기를 품에 안고(4:16) 여인들이 둘러선다(4:14, 4:17). 아기는 싸개로만, 얼굴 없음. 멀리서.
 *  - 하나님이 말씀하시거나 나타나시는 대목이 없다. 빛·구름·소리를 만들지 않는다. 보아스가 말한 "날개"(2:12)는 그리지 않는다.
 *  - 베는 사람들의 연장은 그리지 않는다(본문에 없음). 몸을 굽혔다 펴는 모습만.
 * 감수가 필요한 설정: 성읍·길·밭의 자리와 방향, 성읍에 성벽을 그리지 않은 것, 나오미가 선 집의 자리, 사람 수(베는 사람 여섯, 소녀 셋, 소년 둘, 성읍 사람들),
 *   소녀들이 밭에서 하는 일(본문은 말하지 않아 서 있기만 한다), 보아스·룻·나오미의 옷 색과 생김새(tools/blender/people/boaz.json. 룻과 나오미는 백성 모형),
 *   4:13-17을 추수가 끝난 빈 밭으로 그린 것, 그 대목에 룻과 보아스를 세우지 않은 것(본문은 여인들과 나오미와 아기만 말한다).
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  BO3D.scene3d = BO3D.scene3d || {};
  if (!BO3D.p3b || !BO3D.p3b.on('OT-23')) return;   /* design3d.build가 false면 이야기 카드로만 */
  BO3D.scene3d['OT-23'] = function (api) {
    var T = THREE, M2 = BO3D.models2 || {}, MO = BO3D.models || {}, PR = BO3D.props, B = BO3D.p3b, FX = api.FX, R = PR.rng(2301);
    var sm = B.sm, noise = B.noise, hash = B.hash, std = B.std;
    var ROAD = [[170, 7], [60, 4], [0, 3], [-30, 1], [-46, -8], [-56, -17]];           /* 베들레헴 성읍으로 이어지는 길(1:19) */
    var FX0 = -24, FX1 = 46, FZ0 = -36, FZ1 = -7, REAPX = 8;                            /* 보리밭(2:3). REAPX의 동쪽은 아직 베지 않은 보리 */
    var TOWNC = [-80, -44], HOME = [-55, -20], JARS = [-20, -9.5], MEAL = [-13, -12], SERV = [3, -9.5], FIELDC = [8, -20];
    function inField(x, z) { return x > FX0 && x < FX1 && z > FZ0 && z < FZ1; }
    function height(x, z) {
      return 2.6 * sm(5, 20, z) + 7 * sm(46, 12, Math.hypot(x - TOWNC[0], z - TOWNC[1])) + 0.35 * noise(x * 0.05 + 3, z * 0.05 + 8) + sm(130, 240, Math.hypot(x, z)) * 14 * noise(x * 0.02 + 1, z * 0.02);
    }
    function walkable(x, z) { return x >= -36 && x <= 50 && z >= 9 && z <= 36; }

    var scene = new T.Scene();
    scene.background = new T.Color('#EFE3C4'); scene.fog = new T.Fog('#EFE3C4', 80, 340);
    var skyO = B.sky(scene, 2302);
    var cEarth = new T.Color('#C9B07A'), cGrass = new T.Color('#A9A565'), cRoad = new T.Color('#E9DCBE'), cStub = new T.Color('#D3B768'), cBar = new T.Color('#B8963F'), cTown = new T.Color('#D2BE96');
    scene.add(B.ground(height, function (x, z, c) {
      c.copy(cEarth).lerp(cGrass, 0.25 + 0.6 * noise(x * 0.07, z * 0.07));
      if (inField(x, z)) c.copy(x > REAPX + 1 ? cBar : cStub).lerp(cEarth, 0.25 * noise(x * 0.3, z * 0.3));
      var rd = B.polyDist(ROAD, x, z); if (rd < 5) c.lerp(cRoad, sm(5, 2.2, rd));
      var td = Math.hypot(x - TOWNC[0], z - TOWNC[1]); if (td < 40) c.lerp(cTown, sm(40, 22, td) * 0.8);
    }, 560, 170));
    var hemi = new T.HemisphereLight('#DCEFF2', '#A99A6A', 0.66); scene.add(hemi);
    var sun = new T.DirectionalLight('#FFF0CF', 0.76); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    var ss = sun.shadow.camera; ss.left = -26; ss.right = 26; ss.top = 26; ss.bottom = -26; ss.near = 1; ss.far = 150; sun.shadow.bias = -0.0015;
    scene.add(sun); scene.add(sun.target);
    /* 때: 0 낮, 1 저녁(2:17) */
    var tod = B.tod(scene, skyO, hemi, sun, [['#EFE3C4', '#FFFFFF', 0.66, 0.76, '#FFF0CF', 0], ['#E8B98C', '#F4C49A', 0.5, 0.52, '#FFB074', 0]]);
    function put(o, x, z, lift) { o.position.set(x, height(x, z) + (lift || 0), z); scene.add(o); return o; }
    var i, k;

    /* 베들레헴 성읍(1:19, 2:18): 언덕 위의 집들. 생김새는 본문에 없어 단순한 상자 집으로만. 성벽은 그리지 않는다 */
    var hm = [std('#E4C99C'), std('#D8B888'), std('#ECD4AA')], hs = [];
    for (i = 0; i < 44; i++) {
      var ha = R() * 6.28, hr = 4 + R() * 30, hx = TOWNC[0] + Math.cos(ha) * hr, hz = TOWNC[1] + Math.sin(ha) * hr * 0.8, hw = 4 + R() * 4, hh = 2.8 + R() * 2.6;
      if (Math.hypot(hx - HOME[0], hz - HOME[1]) < 9 || B.polyDist(ROAD, hx, hz) < 6) continue;
      var hb = B.house(hw, hh, 4 + R() * 3, hm[i % 3]); hb.position.set(hx, height(hx, hz) + hh / 2 - 0.3, hz); hb.rotation.y = 0.3 + R() * 0.9; hs.push(hb);
    }
    var nh = B.house(6, 3.4, 5, hm[1]); nh.position.set(HOME[0] - 5.5, height(HOME[0] - 5.5, HOME[1] - 4.5) + 1.5, HOME[1] - 4.5); nh.rotation.y = 0.5; hs.push(nh);   /* 나오미가 선 자리 뒤의 집(자리는 감수 대상) */
    hs.forEach(function (h) { scene.add(h); }); var town = PR.mergeStatic(hs); hs.forEach(function (h) { scene.remove(h); }); scene.add(town);

    /* 보리밭(1:22, 2:3): 아직 베지 않은 보리(동쪽)와 벤 자리의 곡식 단(2:7, 2:15) */
    var standing = new T.Group(), grainOk = !!M2.grain;
    if (grainOk) {
      var gs = [];
      for (var gx = REAPX + 3; gx < FX1 - 1; gx += 4) for (var gz = FZ0 + 2; gz < FZ1 - 1; gz += 4) { var gp = M2.grain(gx * 7 + gz); gp.position.set(gx, height(gx, gz), gz); gp.rotation.y = Math.floor(R() * 4) * Math.PI / 2; gs.push(gp); }
      gs.forEach(function (o) { scene.add(o); }); standing = B.mergeColored(gs); gs.forEach(function (o) { scene.remove(o); });
      standing.children.forEach(function (m) { m.castShadow = false; });
    }
    scene.add(standing);
    var NSH = 44, shG = new T.CylinderGeometry(0.1, 0.27, 0.85, 7), shM = std('#D9B450'), sheaves = new T.InstancedMesh(shG, shM, NSH), tieG = new T.CylinderGeometry(0.17, 0.17, 0.08, 7), ties = new T.InstancedMesh(tieG, std('#A8843A'), NSH), mt = new T.Matrix4(), SH = [];
    for (i = 0; i < NSH; i++) {
      var sx = FX0 + 3 + R() * (REAPX - FX0 - 7), sz = FZ0 + 2 + R() * (FZ1 - FZ0 - 4);
      if (Math.hypot(sx - MEAL[0], sz - MEAL[1]) < 5 || Math.hypot(sx - JARS[0], sz - JARS[1]) < 3) { sx += 7; sz -= 6; }
      SH.push([sx, sz]); mt.makeTranslation(sx, height(sx, sz) + 0.42, sz); sheaves.setMatrixAt(i, mt); mt.makeTranslation(sx, height(sx, sz) + 0.5, sz); ties.setMatrixAt(i, mt);
    }
    sheaves.castShadow = true; scene.add(sheaves); scene.add(ties);
    /* 소년들이 길어 온 물을 담은 그릇(2:9) */
    var jars = new T.Group(); for (i = 0; i < 3; i++) { var jr = B.jar(0.85 - i * 0.1); jr.position.set(i * 0.7 - 0.7, 0, (i % 2) * 0.5); jars.add(jr); } put(jars, JARS[0], JARS[1]);
    /* 비탈의 나무와 바위(자리 표시용. 본문에 없는 것이라 수를 적게) */
    [[-30, 16, 1], [22, 20, 2], [44, 26, 3], [-16, 30, 4], [34, 13, 5]].forEach(function (q) { if (MO.acacia) { var tr = MO.acacia(q[2]); put(tr, q[0], q[1]); } });
    [[-33, 12, 1], [40, 11, 2], [12, 11, 3], [-8, 18, 4], [26, 30, 5], [-24, 26, 6]].forEach(function (q) { if (MO.rock) { var rk = MO.rock(q[2] + 50); put(rk, q[0] + 1.6, q[1] + 0.8, -0.05); } if (MO.shrub) { var sb = MO.shrub(q[2] + 20); put(sb, q[0] - 1.8, q[1] + 1.2); } });

    /* 사람들 */
    var A = B.actors(height), all = [];
    function mk(o, glb) { var a = A.make(o, glb); scene.add(a.g); all.push(a); return a; }
    var reapers = [], girls = [], boys = [], folk = [], women = [];
    for (i = 0; i < 6; i++) { var rp = mk(B.man(2310 + i * 7)); rp.home = [REAPX + 0.2, -11 - i * 4.2]; rp.ph = i * 1.7; rp.seat = [MEAL[0] - 2.6 + (i % 3) * 2.6, MEAL[1] - 1.2 - Math.floor(i / 3) * 1.6]; reapers.push(rp); }   /* 베는 사람들(2:3-4) */
    for (i = 0; i < 3; i++) { var gl = mk(B.woman(2360 + i * 11)); gl.home = [REAPX - 4.5, -13 - i * 7]; girls.push(gl); }                                    /* 보아스의 소녀들(2:8) */
    for (i = 0; i < 2; i++) { var by = mk(B.man(2390 + i * 13)); by.home = [JARS[0] + 1.6 + i * 1.4, JARS[1] - 1.6 - i * 0.6]; boys.push(by); }                   /* 소년들(2:9, 2:15) */
    var serv = mk(B.man(2401));                                                                                                                               /* 베는 사람들을 거느린 사환(2:5) */
    var ruth = mk(B.woman(2412)), naomi = mk(B.woman(2437));                                                                                                  /* 룻(1:4), 나오미(1:2) */
    var sack = new T.Mesh(new T.SphereGeometry(0.24, 8, 6), std('#C9B38A')); sack.scale.set(1, 0.8, 0.8); sack.position.set(0.02, 0.98, 0.3); sack.visible = false; ruth.g.add(sack);   /* 떨어 낸 보리 보따리(2:17-18) */
    var baby = new T.Mesh(new T.SphereGeometry(0.17, 8, 6), std('#EFE6D2')); baby.scale.set(1.5, 0.75, 0.8); baby.position.set(0, 1.02, 0.24); baby.visible = false; naomi.g.add(baby);   /* 품에 안긴 아기(4:16): 싸개로만 */
    var boaz = mk({ group: api.fallback('#8A5A3C', 1.75, 0.27), update: function () {} });
    api.person('boaz', function (nm) { A.swap(boaz, nm, scene); });
    for (i = 0; i < 14; i++) { var fk = mk(i % 2 ? B.woman(2450 + i * 5) : B.man(2450 + i * 5)); fk.home = [HOME[0] + 3.2 + (i % 5) * 1.5 + hash(i, 2) * 0.6, HOME[1] + 1 + Math.floor(i / 5) * 1.5 - (i % 5) * 0.5]; folk.push(fk); }   /* 성읍 사람들(1:19) */
    for (i = 0; i < 8; i++) { var wm = mk(B.woman(2520 + i * 9)), wa = -0.9 + i * 0.42; wm.home = [HOME[0] + 1.2 + Math.cos(wa) * 2.6, HOME[1] + 1.6 + Math.sin(wa) * 2.6 + 1.2]; women.push(wm); }   /* 여인들과 이웃 여인들(4:14, 4:17) */

    var phase = 'explore', pt = 0, arrived = false;
    function show(list, v) { list.forEach(function (a) { a.g.visible = v; }); }
    function face(a, to) { return Math.atan2(to[0] - a.g.position.x, to[1] - a.g.position.z); }
    /* 대목마다 모든 상태를 처음부터 정한다('이전'으로 돌아와도 뒤 대목의 것이 남지 않게) */
    function setPhase(p) {
      phase = p; pt = 0; ruth.meal = false; ruth.home = false; reapers.forEach(function (a) { a.meal = false; });
      var harvest = p !== 'baby';
      standing.visible = harvest; sheaves.visible = harvest; ties.visible = harvest; jars.visible = harvest;
      show(reapers, harvest); show(girls, harvest); show(boys, harvest); serv.g.visible = harvest;
      reapers.forEach(function (a) { A.at(a, a.home[0], a.home[1], Math.PI / 2); });
      girls.forEach(function (a) { A.at(a, a.home[0], a.home[1], Math.PI / 2); });
      boys.forEach(function (a) { A.at(a, a.home[0], a.home[1], Math.PI * 0.2); });
      A.at(serv, SERV[0], SERV[1], Math.PI / 4);
      show(folk, p === 'arrive'); folk.forEach(function (a) { A.at(a, a.home[0], a.home[1], Math.PI / 2); });
      show(women, p === 'baby'); women.forEach(function (a) { A.at(a, a.home[0], a.home[1], Math.atan2(HOME[0] - a.home[0], HOME[1] - a.home[1])); });
      ruth.g.visible = p !== 'explore' && p !== 'baby'; naomi.g.visible = p === 'arrive' || p === 'evening' || p === 'baby'; boaz.g.visible = p === 'glean' || p === 'boaz';
      sack.visible = false; baby.visible = p === 'baby';
      tod.set(p === 'evening' ? 1 : 0, p !== 'evening');
      if (p === 'arrive') {                                   /* 1:19-22: 두 사람이 길을 걸어 성읍 어귀에 이른다 */
        A.at(naomi, -14, 2.2, -Math.PI / 2); A.at(ruth, -12.6, 3.2, -Math.PI / 2);
        A.go(naomi, [[-30, 1], [-46, -8], [HOME[0] + 2.6, HOME[1] + 2.2]], 1.25, -Math.PI * 0.6); A.go(ruth, [[-29, 2], [-44.6, -7], [HOME[0] + 2.2, HOME[1] + 3.6]], 1.25, -Math.PI * 0.6);
      }
      if (p === 'glean') {                                    /* 2:1-7: 룻은 베는 사람들을 따라 줍고, 보아스가 베들레헴 쪽에서 온다 */
        A.at(ruth, REAPX - 7, -14, 0);
        A.at(boaz, -44, -7, Math.PI / 2); A.go(boaz, [[-30, -4], [-22, -8.5], [SERV[0] - 2.2, SERV[1] - 0.2]], 1.5, Math.PI * 0.35);
      }
      if (p === 'boaz') {                                     /* 2:8-16: 룻이 보아스 앞에서 엎드려 절하고, 식사할 때 베는 사람들 곁에 앉는다 */
        A.at(boaz, SERV[0] - 2.2, SERV[1] - 0.2, Math.PI * 0.75); A.at(ruth, SERV[0] - 0.6, SERV[1] - 2.2, -Math.PI * 0.25);
      }
      if (p === 'evening') {                                  /* 2:17-23: 저녁까지 줍고, 떨어서 성읍으로 가져간다 */
        A.at(ruth, REAPX - 8, -16, Math.PI); A.at(naomi, HOME[0], HOME[1], Math.PI * 0.4);
      }
      if (p === 'baby') { A.at(naomi, HOME[0], HOME[1] + 0.6, Math.PI * 0.3); }   /* 4:13-17 */
    }
    function gleanWalk(t) {   /* 베는 사람들 뒤를 따라가며 굽혀 줍는다(2:3, 2:7) */
      var u = (Math.sin(t * 0.16) + 1) / 2, z = -13 - u * 15, x = REAPX - 6.5 + Math.sin(t * 0.5) * 1.2;
      ruth.g.rotation.y = Math.cos(t * 0.16) < 0 ? 0 : Math.PI; ruth.g.position.x = x; ruth.g.position.z = z; var dn = Math.sin(t * 1.3) > 0.1; ruth.bendWant = dn ? 0.6 : 0.05; ruth.sitWant = dn ? 0.45 : 0;
    }
    function v3(x, y, z) { return new T.Vector3(x, y, z); }
    function near(a, dy) { var p = a.g.position; return v3(p.x, p.y + (dy || 1.1), p.z); }
    if (FX) FX.sortLayers(scene);

    return {
      id: 'OT-23', scene: scene, sun: sun, sunOff: [-30, 50, 30],
      height: height, walkable: walkable,
      edge: function (x, z) {
        if (z < 9) return { who: 'onwoo', text: '길과 밭 쪽으로는 내려가지 말자. 우리는 지켜보는 사람이야.' };
        if (x < -36) return { who: 'hyu', text: '성읍 쪽으로는 더 가지 말자.' };
        return { who: 'hyu', text: '이 비탈 위에서만 다니자.' };
      },
      P: { start: [8, 25], machine: [14, 30], machineRot: -0.4,
        /* 재료가 놓인 곳(quests[i].found): 베들레헴으로 이어지는 길가의 빈 땅 / 성읍으로 들어가는 길목이 보이는 비탈 / 보리밭이 건너다보이는 비탈 */
        parts: [[40, 10.5], [-31, 12], [8, 10.5]], lookSpot: [8, 10.5],
        look: { focus: FIELDC, mid: [2, -12], dy: 1.4, backE: 7, upE: 6 } },
      eventLook: function (i) {
        if (i === 3) return { focus: [REAPX - 2, -18], mid: [SERV[0], SERV[1]], dy: 1.2, backE: 6, upE: 5 };
        return { focus: [SERV[0] - 6, SERV[1] - 2], mid: [SERV[0], SERV[1]], dy: 1.2, backE: 5, upE: 4 };
      },
      /* 성읍 어귀의 일(1:19-22, 2:18, 4:14-17)은 아이들 자리에서 멀어, 길 건너에서 멀찍이 바라보는 자리로 카메라를 옮긴다 */
      eventCam: function (i) {
        if (i === 2) return { pos: [-22, height(-22, 8) + 6.5, 8], look: [HOME[0] + 6, height(HOME[0], HOME[1]) + 1.5, HOME[1] + 6] };
        if (i === 5 && pt > 9) return { pos: [-30, height(-30, 2) + 7, 2], look: [HOME[0] + 2, height(HOME[0], HOME[1]) + 1.5, HOME[1] + 2] };
        if (i === 6) return { pos: [-34, height(-34, -2) + 6.5, -2], look: [HOME[0] + 1, height(HOME[0], HOME[1]) + 1.4, HOME[1] + 1] };
        return null;
      },
      kidsHidden: function (i) { return i === 6; },
      beatNote: function (i) {
        if (i === 0) return '그 앞의 일이에요. 모압 지방에서 있었던 일이라 여기서는 보이지 않아요.';
        if (i === 1) return '그 앞의 일이에요. 유다 땅으로 돌아오는 길 위에서 있었던 일이라 여기서는 보이지 않아요.';
        if (i === 6) return '보리 추수와 밀 추수를 마친 뒤의 일이에요. 타임머신 창 너머로 봐요.';
        return null;
      },
      /* 3D에서는 대목 4(2:8-16) 뒤에 저녁때의 돕기(2:17-18)가 먼저 나오므로 때를 밝힌다(배치 독립 검증, 2026-11-16) */
      helpNote: function (after) { return after === 4 ? '이 돕기는 저녁때의 일이에요(룻 2:17-18). 바로 다음 대목에서 그때의 모습을 멀리서 봐요.' : null; },
      detector: '탐지기', askLabel: '탐지기 물음 풀기',
      intro: { text: '타임머신이 낮은 비탈에 내려앉았어요. 길 건너 밭에서 사람들이 보리를 베고 있어요.', say: { who: 'hyu', text: '길과 밭에는 들어가지 말자. 이 비탈 위에서만 다니자.' } },
      lookText: '룻과 나오미의 이야기를 성경에서 찾아 읽은 뒤 다시 골라 보세요.',
      partBeats: [0, 1], eventStart: 2,
      sceneDoneText: '룻과 나오미의 장면을 끝까지 지켜봐야 떠날 수 있어요.',
      dex: [
        { id: 'field', name: '보리밭', desc: '보리 추수를 시작할 때의 보리밭', ref: '룻 1:22', hint: '길 건너편을 보세요.', range: 90, crop: 0.6, pos: function () { return v3(FIELDC[0] + 14, height(FIELDC[0], FIELDC[1]) + 1, FIELDC[1]); } },
        { id: 'sheaf', name: '곡식 단', desc: '룻이 그 사이에서 이삭을 줍게 해 달라고 한 단', ref: '룻 2:7, 2:15', hint: '벤 자리에 서 있어요.', range: 60, crop: 0.3, visible: function () { return sheaves.visible; }, pos: function () { return v3(SH[0][0], height(SH[0][0], SH[0][1]) + 0.5, SH[0][1]); } },
        { id: 'town', name: '베들레헴', desc: '나오미와 룻이 이른 성읍', ref: '룻 1:19', hint: '길이 이어지는 쪽 멀리를 보세요.', range: 150, crop: 0.5, pos: function () { return v3(TOWNC[0] + 12, height(TOWNC[0], TOWNC[1]) + 3, TOWNC[1] + 10); } },
        { id: 'reapers', name: '베는 사람들', desc: '밭에서 보리를 베는 사람들', ref: '룻 2:3', hint: '밭 한가운데 줄지어 있어요.', range: 70, crop: 0.4, visible: function () { return reapers[0].g.visible; }, pos: function () { return near(reapers[2]); } },
        { id: 'ruth', name: '룻', desc: '나오미를 따라 모압 지방에서 온 며느리. 베는 사람들을 따라 이삭을 주웠다', ref: '룻 1:22, 2:3', hint: '베는 사람들 뒤쪽을 보세요.', range: 70, crop: 0.34, visible: function () { return ruth.g.visible; }, pos: function () { return near(ruth); } },
        { id: 'boaz', name: '보아스', desc: '엘리멜렉의 친족. 베들레헴에서 밭으로 왔다', ref: '룻 2:1, 2:4', hint: '밭 가장자리를 보세요.', range: 70, crop: 0.34, visible: function () { return boaz.g.visible; }, pos: function () { return near(boaz); } }
      ],
      reset: function () { setPhase('explore'); },
      partFound: function () {},
      lookupPose: function () {},
      /* 대목 번호(OT-23.json): 0 = 1:1-5, 1 = 1:6-18 (글로만) / 2 = 1:19-22, 3 = 2:1-7, 4 = 2:8-16, 5 = 2:17-23, 6 = 4:13-17 */
      beatPose: function (i) { setPhase(['explore', 'explore', 'arrive', 'glean', 'boaz', 'evening', 'baby'][i] || 'explore'); },
      update: function (dt, now) {
        pt += dt; tod.update(dt);
        var work = phase === 'explore' || phase === 'arrive' || phase === 'glean' || (phase === 'boaz' && pt < 14) || (phase === 'evening' && pt < 6);
        if (phase !== 'baby') reapers.forEach(function (a) {
          if (phase === 'boaz' && pt >= 14) { if (!a.meal) { a.meal = true; A.go(a, [a.seat], 1.4, Math.atan2(MEAL[0] - a.seat[0], MEAL[1] - a.seat[1])); } a.bendWant = 0; a.sitWant = A.moving(a) ? 0 : 1; }   /* 식사할 때(2:14) */
          else { a.meal = false; a.bendWant = work ? 0.3 + 0.25 * Math.sin(now * 1.5 + a.ph) : 0; a.sitWant = 0; }
        });
        if (phase === 'glean') { gleanWalk(pt + 20); }
        if (phase === 'boaz') {
          if (pt < 3) { ruth.bendWant = 0; ruth.sitWant = 0; }
          else if (pt < 10) { ruth.bendWant = 1; ruth.sitWant = 1; }                                   /* 2:10 땅에 엎드려 절한다(멀리서) */
          else if (pt < 14) { ruth.bendWant = 0; ruth.sitWant = 0; }
          else {                                                                                       /* 2:14 베는 사람들 곁에 앉는다 */
            if (!ruth.meal) { ruth.meal = true; A.go(ruth, [[MEAL[0] + 4.6, MEAL[1] - 1.4]], 1.3, -Math.PI / 2); A.go(boaz, [[MEAL[0] + 1, MEAL[1] + 1.6]], 1.3, Math.PI); }
            ruth.bendWant = 0; ruth.sitWant = A.moving(ruth) ? 0 : 1;
          }
        } else ruth.meal = false;
        if (phase === 'evening') {
          if (pt < 6) gleanWalk(pt + 4);                                                               /* 저녁까지 줍는다(2:17) */
          else if (pt < 9) { ruth.bendWant = 0.6; ruth.sitWant = 0.6; }                                /* 주운 것을 떤다(2:17). 자세한 동작은 그리지 않는다 */
          else if (!ruth.home) { ruth.home = true; sack.visible = true; ruth.bendWant = 0; ruth.sitWant = 0; A.at(ruth, -42, -5.5, -Math.PI / 2); sack.visible = true; A.go(ruth, [[-46, -8], [HOME[0] + 1.8, HOME[1] + 1.4]], 1.3, Math.atan2(-1.8, -1.4)); }   /* 성읍으로 들어가 시어머니에게 보인다(2:18). 길은 건너뛰어 성읍 어귀부터 */
        } else ruth.home = false;
        if (phase === 'arrive') { arrived = !A.moving(naomi); folk.forEach(function (a) { a.g.rotation.y = face(a, [naomi.g.position.x, naomi.g.position.z]); }); }
        all.forEach(function (a) { if (a.g.visible) A.step(a, dt); });
      },
      audio: function (Au) { Au.setFlock(999); Au.setFire(999); },
      menuCam: function (camera, now) { var a = now * 0.05; camera.position.set(6 + Math.sin(a) * 10, height(6, 22) + 7, 24); camera.lookAt(FIELDC[0], 2, FIELDC[1]); },
      debug: { phase: function () { return { phase: phase, t: pt, tod: tod.value(), ruth: [ruth.g.position.x, ruth.g.position.z, ruth.g.visible], boaz: [boaz.g.position.x, boaz.g.position.z, boaz.g.visible], naomi: [naomi.g.position.x, naomi.g.position.z, naomi.g.visible] }; }, arrived: function () { return true; } }
    };
  };
})();
