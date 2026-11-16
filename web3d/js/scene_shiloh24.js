/* 3D 장면 설정: OT-24 한나의 기도와 사무엘을 부르심 (삼상 1:9-28, 3:1-21). 자동 작업 3d-b가 더한 장면(장면표의 대표 장면 12개 밖의 추가 제안).
 * 방향: 실로 여호와의 집은 북쪽(-Z)에 남쪽을 보고 서 있다. 문 동쪽 문설주 곁에 엘리의 의자, 집 동쪽에 붙은 작은 방이 엘리의 처소.
 *       라마로 가는 길은 집 앞에서 서남쪽으로 뻗는다. 아이들은 집에서 멀찍이 떨어진 남쪽 비탈에서만 다닌다.
 * 아이들이 다니는 때: 한나가 기도하던 날의 낮(1:9-18).
 * 본문에 맞춘 점 (content/ot/OT-24.json design3d)
 *  - 1:9-18: 엘리는 여호와의 전 문설주 곁 의자에 앉아 있고(1:9), 한나는 엘리 곁에 서서 기도한다(1:26). 소리는 들리지 않는다(1:13). 얼굴을 가까이 보이지 않는다.
 *    말을 마친 한나는 식구들에게 돌아간다(1:18 "가서 먹고").
 *  - 1:19-28: 라마의 집과 그 사이 여러 해의 일은 글로만. 한나가 어린 아이를 데리고 수소 셋과 함께 다시 실로에 온다(1:24). 수소를 잡는 모습은 그리지 않고 서 있는 모습만.
 *    아이는 거기서 여호와께 경배한다(1:28. 멀리서 몸을 굽힌 모습으로만).
 *  - 3:1-10: 밤. 엘리는 자기 처소에 눕고(3:2) 사무엘은 여호와의 전 안에 눕는다(3:3). 전 안과 하나님의 궤는 보여 주지 않는다.
 *    부르심은 소리도 빛도 형상도 만들지 않는다. 보이는 것은 문에서 나와 엘리의 처소로 달려갔다가 돌아가는 아이뿐이다(세 번. 3:4-8).
 *    네 번째 부르심(3:10) 때는 아무것도 움직이지 않는다. 문틈의 불빛(하나님의 등불이 아직 꺼지지 않음, 3:3)도 변하지 않는다.
 *  - 3:11-18: 아침에 사무엘이 여호와의 집 문을 열고(3:15), 엘리가 부르자 가서 선다(3:16-18). 말씀의 내용은 자막으로 지어내지 않는다.
 *  - 3:19-21: 자란 사무엘이 선 모습만. 여호와께서 실로에서 나타나신 일은 글로만.
 * 감수가 필요한 설정: 여호와의 집을 문과 문설주가 있는 단순한 돌집으로 그린 것(본문은 "전", "집", "문설주", "문"만 말한다), 엘리의 처소를 집 동쪽에 붙은 방으로 둔 것,
 *   등불빛을 문틈의 불빛으로 나타낸 것, 밤에 아이가 문으로 드나드는 것, 아침에 엘리가 처소 앞에 서서 부르는 것, 엘가나와 식구들의 자리와 장막, 수소의 생김새,
 *   엘리의 흰 수염과 옷 색(tools/blender/people/eli.json. 제사장 옷은 그리지 않았다), 한나·엘가나·사무엘의 생김새(백성 모형), 자란 사무엘을 어른 남자 모형으로 세운 것.
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  BO3D.scene3d = BO3D.scene3d || {};
  if (!BO3D.p3b || !BO3D.p3b.on('OT-24')) return;   /* design3d.build가 false면 이야기 카드로만 */
  BO3D.scene3d['OT-24'] = function (api) {
    var T = THREE, MO = BO3D.models || {}, PR = BO3D.props, B = BO3D.p3b, FX = api.FX;
    var sm = B.sm, noise = B.noise, std = B.std;
    var DOOR = [0, -28], SEAT = [3.3, -26.6], PRAY = [1.2, -23.6], ROOM = [11.5, -27], RDOOR = [11.5, -23.4], CAMP = [-24, -8], COURT = [0, -22];
    var ROAD = [[0, -20], [-5, -8], [-32, 4], [-80, 30], [-180, 64]];                    /* 라마로 가는 길(1:19) */
    function height(x, z) {
      return 1.6 * sm(-4, 24, z) + 2.2 * sm(60, 20, Math.hypot(x, z + 42)) + 0.3 * noise(x * 0.05 + 4, z * 0.05 + 2) + sm(120, 240, Math.hypot(x, z)) * 16 * noise(x * 0.02 + 5, z * 0.02 + 1);
    }
    function walkable(x, z) { return x >= -34 && x <= 42 && z >= 0 && z <= 34 && B.polyDist(ROAD, x, z) > 3.5; }

    var scene = new T.Scene();
    scene.background = new T.Color('#EFE3C4'); scene.fog = new T.Fog('#EFE3C4', 80, 340);
    var skyO = B.sky(scene, 2402);
    var cEarth = new T.Color('#C9B07A'), cGrass = new T.Color('#9FA864'), cRoad = new T.Color('#E6D8B8'), cCourt = new T.Color('#D8C8A2');
    scene.add(B.ground(height, function (x, z, c) {
      c.copy(cEarth).lerp(cGrass, 0.2 + 0.6 * noise(x * 0.07, z * 0.07));
      var rd = B.polyDist(ROAD, x, z); if (rd < 4.5) c.lerp(cRoad, sm(4.5, 2, rd));
      var cd = Math.max(Math.abs(x - 3) / 17, Math.abs(z + 30) / 16); if (cd < 1) c.lerp(cCourt, sm(1, 0.7, cd) * 0.85);
    }, 560, 170));
    var hemi = new T.HemisphereLight('#DCEFF2', '#A99A6A', 0.66); scene.add(hemi);
    var sun = new T.DirectionalLight('#FFF0CF', 0.76); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    var ss = sun.shadow.camera; ss.left = -26; ss.right = 26; ss.top = 26; ss.bottom = -26; ss.near = 1; ss.far = 150; sun.shadow.bias = -0.0015;
    scene.add(sun); scene.add(sun.target);
    /* 때: 0 낮, 1 밤(3:2-10), 2 아침(3:15) */
    var tod = B.tod(scene, skyO, hemi, sun, [['#EFE3C4', '#FFFFFF', 0.66, 0.76, '#FFF0CF', 0], ['#141C34', '#26315A', 0.36, 0.17, '#9FB4E0', 1], ['#EBD6C2', '#F6E0CE', 0.6, 0.6, '#FFE0BC', 0]]);
    function put(o, x, z, lift) { o.position.set(x, height(x, z) + (lift || 0), z); scene.add(o); return o; }
    var i, G0 = height(DOOR[0], DOOR[1]);

    /* 여호와의 집(1:9, 3:15): 단순한 돌집. 남쪽 벽에 문과 두 문설주. 안은 보이지 않는다 */
    var statics = [], wM = std('#D2BC94'), wM2 = std('#BFA67C'), postM = std('#A88C62'), woodM = std('#6E4A2C'), darkM = new T.MeshBasicMaterial({ color: '#0E0C0A' });
    function box(w, h, d, m, x, y, z) { var b = new T.Mesh(new T.BoxGeometry(w, h, d), m); b.position.set(x, G0 + y, z); statics.push(b); return b; }
    box(16, 7, 22, wM, 0, 3.5, -39.2);                                     /* 몸채 */
    box(16.6, 0.5, 22.6, wM2, 0, 7.2, -39.2);                              /* 지붕 턱 */
    [-7.2, -4.6, 4.6, 7.2].forEach(function (bx) { box(0.8, 7, 0.5, wM2, bx, 3.5, -28.05); });   /* 벽의 버팀기둥(밋밋하지 않게. 생김새는 감수 대상) */
    box(6.4, 0.25, 2.2, wM2, 0, 0.12, -27.2); box(17, 0.6, 0.6, wM2, 0, 0.3, -28.1);              /* 문 앞 디딤돌과 벽 밑단 */
    box(0.9, 5.6, 0.9, postM, -2.1, 2.8, -27.9); box(0.9, 5.6, 0.9, postM, 2.1, 2.8, -27.9);   /* 문설주(1:9) */
    box(5.1, 0.7, 1.0, postM, 0, 5.9, -27.9);                              /* 문 위 가로대 */
    box(7, 3.6, 7, wM2, ROOM[0], 1.8, ROOM[1]);                            /* 엘리의 처소(3:2): 자리는 감수 대상 */
    box(7.4, 0.35, 7.4, wM, ROOM[0], 3.7, ROOM[1]);
    box(1.0, 0.5, 0.7, woodM, SEAT[0], 0.25, SEAT[1] - 0.1); box(1.0, 1.0, 0.14, woodM, SEAT[0], 1.0, SEAT[1] - 0.45);   /* 엘리의 의자(1:9) */
    statics.forEach(function (o) { scene.add(o); }); var bld = PR.mergeStatic(statics); statics.forEach(function (o) { scene.remove(o); }); scene.add(bld);
    var inner = new T.Mesh(new T.PlaneGeometry(3.3, 5.0), darkM); inner.position.set(0, G0 + 2.5, -28.19); scene.add(inner);                       /* 문 안쪽은 어둡게만(전 안을 보이지 않는다) */
    var rinner = new T.Mesh(new T.PlaneGeometry(1.3, 2.3), darkM); rinner.position.set(RDOOR[0], G0 + 1.15, ROOM[1] + 3.52); scene.add(rinner);    /* 처소의 문간 */
    var leaves = [];
    [-1, 1].forEach(function (s) { var pv = new T.Group(), lf = new T.Mesh(new T.BoxGeometry(1.65, 5.0, 0.16), woodM); lf.position.set(-s * 0.825, 2.5, 0); lf.castShadow = true; pv.add(lf); pv.position.set(s * 1.65, G0, -28.05); pv.userData.s = s; scene.add(pv); leaves.push(pv); });
    /* 문틈으로 새는 등불빛(3:3 하나님의 등불은 아직 꺼지지 않았다). 등불 자체는 전 안의 것이라 그리지 않는다. 세기가 변하지 않는다 */
    var glowM = new T.MeshBasicMaterial({ color: '#FFC98A', transparent: true, opacity: 0, fog: false }), glow = new T.Group();
    var g1 = new T.Mesh(new T.PlaneGeometry(0.07, 4.9), glowM); g1.position.set(0, 2.5, 0); glow.add(g1); var g2 = new T.Mesh(new T.PlaneGeometry(3.2, 0.06), glowM); g2.position.set(0, 0.06, 0); glow.add(g2);
    glow.position.set(0, G0, -27.94); scene.add(glow);
    var doorOpen = 1, doorWant = 1;
    function doorSet(v, now) { doorWant = v; if (now) doorOpen = v; }
    /* 식구들이 머문 자리(1:9 먹고 마신 곳, 1:21 온 집): 장막 하나와 짐 */
    var campG = new T.Group(); if (PR.tent) { var tn = PR.tent(3); tn.position.set(0, 0, 0); campG.add(tn); }
    for (i = 0; i < 4; i++) { var bd = new T.Mesh(new T.SphereGeometry(0.3, 7, 5), std(['#B89A6A', '#9A7A54', '#C9B38A'][i % 3])); bd.scale.set(1.2, 0.8, 1); bd.position.set(2.2 + (i % 2) * 0.7, 0.24, 1 + Math.floor(i / 2) * 0.7); bd.castShadow = true; campG.add(bd); }
    put(campG, CAMP[0], CAMP[1]);
    [[34, 20, 1], [-14, 26, 2], [22, 6, 3], [-30, 16, 4], [40, 30, 5]].forEach(function (q) { if (MO.acacia) { var tr = MO.acacia(q[2] + 7); put(tr, q[0] + 2.2, q[1] - 1.5); } });
    [[30, 12, 1], [-8, 14, 2], [14, 28, 3], [-22, 30, 4]].forEach(function (q) { if (MO.rock) { var rk = MO.rock(q[2] + 80); put(rk, q[0], q[1], -0.05); } if (MO.shrub) { var sb = MO.shrub(q[2] + 40); put(sb, q[0] + 2.4, q[1] + 1); } });

    /* 사람들 */
    var A = B.actors(height), all = [];
    function mk(o, glb) { var a = A.make(o, glb); scene.add(a.g); all.push(a); return a; }
    var hannah = mk(B.woman(2411)), elkanah = mk(B.man(2423)), kin = [mk(B.woman(2431)), mk(B.man(2447)), mk(B.child(2453))];   /* 한나(1:9), 엘가나(1:19), 온 집(1:21) */
    var boy = mk(B.child(2461)), grown = mk(B.man(2473));                                                                        /* 아이 사무엘(1:24, 3:1), 자란 사무엘(3:19) */
    var eli = mk({ group: api.fallback('#C9BFA4', 1.75, 0.27), update: function () {} });
    api.person('eli', function (nm) { A.swap(eli, nm, scene); });
    var oxen = []; for (i = 0; i < 3; i++) { var ox = mk(B.ox(['#7A5A3E', '#8A6A4A', '#5E4632'][i])); oxen.push(ox); }                /* 수소 셋(1:24) */
    var sack = new T.Mesh(new T.SphereGeometry(0.26, 8, 6), std('#C9B38A')); sack.scale.set(1, 0.85, 0.8); sack.position.set(-0.3, 1.25, -0.1); elkanah.g.add(sack);   /* 가루와 포도주 부대는 짐으로만(1:24) */

    var phase = 'day', pt = 0, runs = 0;
    var RUN = [[1.2, -26.6], [9.5, -24.6], [RDOOR[0], RDOOR[1] + 0.4]];   /* 문에서 엘리의 처소 문간까지 */
    function show(list, v) { list.forEach(function (a) { a.g.visible = v; }); }
    function seatEli() { A.at(eli, SEAT[0], SEAT[1] + 0.5, Math.PI * 0.9); eli.sit = eli.sitWant = 0.7; }   /* 의자 앞쪽에 걸터앉은 높이로(1:9) */
    /* 대목마다 모든 상태를 처음부터 정한다('이전'으로 돌아와도 뒤 대목의 것이 남지 않게) */
    function setPhase(p) {
      phase = p; pt = 0; runs = 0; boy.step = 0;
      var d1 = p === 'day' || p === 'went', night = p === 'night1' || p === 'night2';
      tod.set(night ? 1 : p === 'morning' ? 2 : 0, !night && p !== 'morning');
      glowM.opacity = night ? 0.9 : 0; doorSet(night ? 0 : 1, true);
      hannah.g.visible = d1 || p === 'bring'; elkanah.g.visible = d1 || p === 'bring'; show(kin, d1); campG.visible = d1; sack.visible = p === 'bring';
      eli.g.visible = d1 || p === 'bring' || p === 'morning'; boy.g.visible = p === 'bring'; grown.g.visible = p === 'grown'; show(oxen, p === 'bring');
      A.at(elkanah, CAMP[0] + 3.4, CAMP[1] + 2.6, Math.PI * 0.6); kin.forEach(function (a, n) { A.at(a, CAMP[0] + 1.6 + n * 1.2, CAMP[1] + 3.6 + (n % 2) * 0.8, Math.PI * 0.8); a.sitWant = a.sit = n < 2 ? 0.8 : 0; });
      if (d1) { seatEli(); A.at(hannah, PRAY[0], PRAY[1], Math.PI); }                                   /* 1:9-18 한나는 엘리 곁에 서서 여호와께 기도한다(1:26) */
      if (p === 'went') { A.go(hannah, [[-4, -18], [CAMP[0] + 4.6, CAMP[1] + 1.2]], 1.2, -Math.PI / 2); }   /* 1:18 */
      if (p === 'bring') {                                                                             /* 1:24-28 */
        seatEli();
        A.at(hannah, -9, -7, Math.PI * 0.75); A.go(hannah, [[-5, -9], [-1, -19], [PRAY[0] + 0.3, PRAY[1] + 0.6]], 1.2, Math.PI * 0.95);
        A.at(boy, -10, -6.2, Math.PI * 0.75); A.go(boy, [[-5.8, -8.4], [-2, -18.4], [PRAY[0] - 0.9, PRAY[1] + 0.2]], 1.2, Math.PI);
        A.at(elkanah, -12, -5, Math.PI * 0.75); A.go(elkanah, [[-7, -7.5], [-3.4, -17.5], [PRAY[0] - 2.6, PRAY[1] + 1.4]], 1.2, Math.PI);
        oxen.forEach(function (o, n) { A.at(o, -15 - n * 2.6, -3.5 + n * 1.2, Math.PI * 0.75); A.go(o, [[-9 - n * 1.5, -6], [-7 - n * 1.2, -15], [-7.5 - n * 2.4, -19.5 - (n % 2) * 1.2]], 1.15, Math.PI * 0.6); });
      }
      if (night) { boy.g.visible = false; }
      if (p === 'morning') { A.at(eli, RDOOR[0] - 0.4, RDOOR[1] + 1.2, -Math.PI * 0.55); doorSet(0, true); boy.g.visible = false; }   /* 3:15-18 */
      if (p === 'grown') { A.at(grown, COURT[0] + 1, COURT[1] - 1.5, Math.PI * 0.1); }                 /* 3:19-21 */
    }
    /* 3:4-8: 문에서 나와 엘리의 처소로 달려갔다가 돌아와 다시 눕는다. n번 되풀이 */
    function nightRuns(n, dt) {
      if (runs >= n) { boy.g.visible = false; doorSet(0); return; }
      if (boy.step === 0 && pt > 2.5) { boy.step = 1; boy.g.visible = true; doorSet(0.35); A.at(boy, DOOR[0] + 0.5, DOOR[1] + 0.7, 0); A.go(boy, RUN, 3.0); }
      else if (boy.step === 1 && !A.moving(boy)) { boy.step = 2; boy.g.visible = false; boy.wait = pt + 3.5; }                 /* 처소 안에서 엘리와 말한다(보이지 않는다) */
      else if (boy.step === 2 && pt > boy.wait) { boy.step = 3; boy.g.visible = true; A.go(boy, RUN.slice(0, 2).reverse().concat([[DOOR[0] + 0.5, DOOR[1] + 0.5]]), 1.4); }
      else if (boy.step === 3 && !A.moving(boy)) { boy.step = 0; boy.g.visible = false; runs++; pt = 0; doorSet(0); }
    }
    function v3(x, y, z) { return new T.Vector3(x, y, z); }
    if (FX) { FX.sortLayers(scene); glow.children.forEach(function (m) { m.layers.set(FX.GLOW); }); }

    return {
      id: 'OT-24', scene: scene, sun: sun, sunOff: [-30, 50, 30],
      height: height, walkable: walkable,
      edge: function (x, z) {
        if (z < 0) return { who: 'onwoo', text: '여호와의 집 쪽으로는 더 가지 말자. 우리는 지켜보는 사람이야.' };
        if (B.polyDist(ROAD, x, z) <= 3.5) return { who: 'hyu', text: '길 위로는 올라가지 말자. 길가에서만 다니자.' };
        return { who: 'hyu', text: '이 비탈 위에서만 다니자.' };
      },
      P: { start: [14, 22], machine: [20, 27], machineRot: -0.4,
        /* 재료가 놓인 곳(quests[i].found): 라마로 가는 길가의 빈 땅 / 실로의 비탈 나무 아래 / 여호와의 집이 건너다보이는 길가 */
        parts: [[-22, 14], [33, 19], [6, 2.5]], lookSpot: [6, 2.5],
        look: { focus: [1.5, -27], mid: [1.5, -24], dy: 2.4, backE: 5, upE: 3 } },
      eventLook: function (n) {
        if (n === 2) return { focus: [-1, -24], mid: [-3, -20], dy: 2, backE: 5, upE: 3.2 };
        if (n >= 3 && n <= 5) return { focus: [6, -27], mid: [6, -25], dy: 2.2, backE: 5, upE: 3 };
        return { focus: [1.5, -27], mid: [1.5, -24], dy: 2.4, backE: 5, upE: 3 };
      },
      kidsHidden: function (n) { return n === 6; },
      beatNote: function (n) {
        if (n === 2) return '이 대목은 여러 해에 걸친 일이에요. 라마의 집에서 있었던 일은 여기서 보이지 않아요. 한나가 아이를 데리고 다시 실로에 온 때를 봐요.';
        if (n === 3) return '그 뒤 어느 밤의 일이에요. 여호와의 전 안은 보이지 않아요. 부르시는 음성은 우리가 지어내지 않아요.';
        if (n === 4) return '전 안에서 있었던 일은 보이지 않아요. 하신 말씀은 성경책에서 읽어요.';
        if (n === 6) return '사무엘이 자란 뒤의 일이에요. 타임머신 창 너머로 봐요.';
        return null;
      },
      helpNote: function (after) { return after === 1 ? '이 돕기는 다음 날 아침의 이야기예요(삼상 1:19). 여호와의 집에서 떨어진 식구들의 자리에서 해요.' : null; },
      detector: '탐지기', askLabel: '탐지기 물음 풀기',
      intro: { text: '타임머신이 낮은 비탈에 내려앉았어요. 저쪽에 여호와의 집이 보여요.', say: { who: 'hyu', text: '여호와의 집에는 가까이 가지 말자. 이 비탈 위에서만 다니자.' } },
      lookText: '한나와 사무엘의 이야기를 성경에서 찾아 읽은 뒤 다시 골라 보세요.',
      partBeats: [0, 1], eventStart: 2,
      sceneDoneText: '실로의 장면을 끝까지 지켜봐야 떠날 수 있어요.',
      dex: [
        { id: 'house', name: '실로 여호와의 집', desc: '한나가 기도하고, 뒤에 아이 사무엘을 데려온 곳', ref: '삼상 1:9, 1:24', hint: '비탈 건너편을 보세요.', range: 110, crop: 0.6, pos: function () { return v3(0, G0 + 4, -30); } },
        { id: 'post', name: '문설주와 의자', desc: '제사장 엘리가 문설주 곁 의자에 앉아 있었다', ref: '삼상 1:9', hint: '여호와의 집 문 곁을 보세요.', range: 80, crop: 0.3, pos: function () { return v3(SEAT[0], G0 + 1.2, SEAT[1]); } },
        { id: 'eli', name: '제사장 엘리', desc: '실로 여호와의 전의 제사장', ref: '삼상 1:9', hint: '문설주 곁을 보세요.', range: 80, crop: 0.3, visible: function () { return eli.g.visible; }, pos: function () { var p = eli.g.position; return v3(p.x, p.y + 1.2, p.z); } },
        { id: 'hannah', name: '한나', desc: '여호와 앞에 오래 기도한 여자', ref: '삼상 1:10, 1:12', hint: '엘리 곁을 보세요.', range: 80, crop: 0.3, visible: function () { return hannah.g.visible; }, pos: function () { var p = hannah.g.position; return v3(p.x, p.y + 1.1, p.z); } },
        { id: 'road', name: '라마로 가는 길', desc: '한나의 식구들이 라마의 집으로 돌아간 길', ref: '삼상 1:19', hint: '여호와의 집 앞에서 뻗은 길을 보세요.', range: 90, crop: 0.5, pos: function () { return v3(-20, height(-20, -2) + 0.5, -2); } }
      ],
      reset: function () { setPhase('day'); },
      partFound: function () {},
      partContinue: function (n) { if (n === 1) setPhase('went'); },   /* 1:18 한나가 가서 먹는다 */
      lookupPose: function () {},
      /* 대목 번호(OT-24.json): 0 = 1:9-11, 1 = 1:12-18 (재료를 주울 때) / 2 = 1:19-28, 3 = 3:1-7, 4 = 3:8-10, 5 = 3:11-18, 6 = 3:19-21 */
      beatPose: function (n) { setPhase(['day', 'day', 'bring', 'night1', 'night2', 'morning', 'grown'][n] || 'day'); },
      update: function (dt) {
        pt += dt; tod.update(dt);
        if (phase === 'bring') { var here = !A.moving(boy) && !A.moving(hannah); boy.bendWant = here && pt > 4 ? 0.9 : 0; boy.sitWant = here && pt > 4 ? 0.6 : 0; }   /* 1:28 아이가 거기서 경배한다 */
        if (phase === 'night1') nightRuns(2, dt);        /* 3:4-6 두 번 */
        if (phase === 'night2') nightRuns(1, dt);        /* 3:8-9 세 번째. 그 뒤(3:10)에는 아무것도 움직이지 않는다 */
        if (phase === 'morning') {
          if (boy.step === 0 && pt > 2.5) { boy.step = 1; boy.g.visible = true; A.at(boy, DOOR[0] + 0.3, DOOR[1] + 0.6, 0); doorSet(1); }          /* 3:15 여호와의 집 문을 연다 */
          else if (boy.step === 1 && pt > 9) { boy.step = 2; A.go(boy, [[2, -25.6], [RDOOR[0] - 1.8, RDOOR[1] + 2.2]], 1.3, Math.PI * 0.4); }      /* 3:16 엘리가 부르자 간다 */
        }
        if (Math.abs(doorOpen - doorWant) > 0.002) doorOpen += (doorWant - doorOpen) * Math.min(1, dt * 1.8);
        leaves.forEach(function (l) { l.rotation.y = l.userData.s * doorOpen * 1.5; });
        all.forEach(function (a) { if (a.g.visible) A.step(a, dt); });
      },
      audio: function (Au) { Au.setFlock(999); Au.setFire(999); },
      menuCam: function (camera, now) { var a2 = now * 0.05; camera.position.set(6 + Math.sin(a2) * 8, height(6, 10) + 6, 12); camera.lookAt(0, G0 + 3, -28); },
      debug: { phase: function () { return { phase: phase, t: pt, tod: tod.value(), door: doorOpen, runs: runs, boy: [Math.round(boy.g.position.x), Math.round(boy.g.position.z), boy.g.visible, boy.step] }; }, arrived: function () { return true; } }
    };
  };
})();
