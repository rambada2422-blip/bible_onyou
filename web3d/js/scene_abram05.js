/* 3D 장면 설정: OT-05 아브람을 부르시고 언약을 주심 (창 12:1-9, 15:1-6).
 * 아이들이 다니는 때: 아브람이 벧엘 동쪽 산에 장막을 친 때(창 12:8). 장막과 제단, 일행이 있다.
 * 지켜보기: 하란을 떠나 가나안에 들어오는 길(12:4-5)과 모레 상수리나무의 제단(12:6-7)은 장막을 치기 전의 일이므로 장막을 숨기고 길과 먼 나무를 보여 준다(탐험대 이야기 한 줄로 알림).
 *   12:8-9 장막과 제단 → 15:1-4 (장소 이름 없음) → 15:5-6 밖에서 하늘의 뭇별을 본다(압도 장면 후보, 게임 안 효과로).
 * 본문에 맞춘 점 (content/ot/OT-05.json design3d)
 *  - 하나님의 형상·손·빛은 없다. 별은 하나님이 보라고 하신 것이다. 별똥별과 별자리 그림은 없다.
 *  - 아브람은 서 있기만 한다(손가락으로 세거나 무릎 꿇지 않는다). 제단 위의 제물과 불은 없다. 낙타와 양 떼는 없다.
 *  - 롯은 12장 대목까지만 있고 15장 대목에는 없다(창 13:11). 별을 보는 곳에는 지명 표지를 붙이지 않는다.
 * 감수가 필요한 설정: 산과 길의 생김새, 장막과 제단의 자리, 일행의 수, 15장의 자리를 같은 장막 곁으로 둔 것(본문은 장소를 말하지 않는다).
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  BO3D.scene3d = BO3D.scene3d || {};
  BO3D.scene3d['OT-05'] = function (api) {
    var T = THREE, M2 = BO3D.models2 || {}, MO = BO3D.models || {}, PR = BO3D.props, FX = api.FX, R = PR.rng(512);
    function sm(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
    function hash(ix, iz) { var n = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453; return n - Math.floor(n); }
    function noise(x, z) {
      var ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
      var a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    var TENT = [-6, -8], ALTAR = [-16, -4], ABR = [-1, -2], OAK = [-150, 120];   /* 제단은 아이들 자리에서 장막과 함께 보이는 쪽에 */
    var ROAD = [[90, -110], [62, -60], [40, -20], [24, -8], [8, -4]];
    function height(x, z) {
      var r = Math.hypot(x + 4, z + 6), h = 3 - sm(30, 140, r) * 18 + 0.8 * noise(x * 0.05, z * 0.05 + 4);
      h += sm(140, 260, r) * 16 * noise(x * 0.02 + 3, z * 0.02);
      return h;
    }
    function walkable(x, z) { return x >= 12 && x <= 50 && z >= -4 && z <= 36; }

    var scene = new T.Scene();
    scene.background = new T.Color('#F1E4C6'); scene.fog = new T.Fog('#EEE0C0', 80, 360);
    var skyG = new T.SphereGeometry(600, 24, 14), sp = skyG.attributes.position, sc = new Float32Array(sp.count * 3), cc = new T.Color(), top = new T.Color('#79AFCF'), hor = new T.Color('#F4E6C4'), i;
    for (i = 0; i < sp.count; i++) { var tt = Math.max(0, sp.getY(i) / 600); cc.copy(hor).lerp(top, sm(0.02, 0.7, tt)); sc[i * 3] = cc.r; sc[i * 3 + 1] = cc.g; sc[i * 3 + 2] = cc.b; }
    skyG.setAttribute('color', new T.BufferAttribute(sc, 3));
    var skyM = new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false }); scene.add(new T.Mesh(skyG, skyM));
    /* 하늘의 뭇별(창 15:5): 세 무리로 나눠 은은하게 깜빡인다 */
    var starGroups = [];
    for (var sgi = 0; sgi < 3; sgi++) {
      var sgG = new T.BufferGeometry(), spp = [];
      for (i = 0; i < 1400; i++) { var a = R() * 6.283, el = 0.08 + Math.pow(R(), 0.7) * 1.45; spp.push(Math.cos(a) * Math.cos(el) * 560, Math.sin(el) * 560, Math.sin(a) * Math.cos(el) * 560); }
      sgG.setAttribute('position', new T.Float32BufferAttribute(spp, 3));
      var sgm = new T.PointsMaterial({ color: ['#FFF6D8', '#FFFFFF', '#E8EEFF'][sgi], size: [1.6, 2.4, 1.2][sgi], sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
      var pts = new T.Points(sgG, sgm); scene.add(pts); starGroups.push(sgm);
    }
    var g = new T.PlaneGeometry(560, 560, 160, 160); g.rotateX(-Math.PI / 2);
    var pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color(), g1 = new T.Color('#A9AE6E'), g2 = new T.Color('#C2B47E'), rk = new T.Color('#A69A86'), road = new T.Color('#CDB68A');
    function roadDist(x, z) { var best = 1e9; for (var k = 0; k + 1 < ROAD.length; k++) { var a0 = ROAD[k], b0 = ROAD[k + 1], vx = b0[0] - a0[0], vz = b0[1] - a0[1], t = Math.max(0, Math.min(1, ((x - a0[0]) * vx + (z - a0[1]) * vz) / (vx * vx + vz * vz))), dx = x - a0[0] - vx * t, dz = z - a0[1] - vz * t; best = Math.min(best, Math.hypot(dx, dz)); } return best; }
    for (i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i), y = height(x, z); pos.setY(i, y);
      c.copy(g1).lerp(g2, noise(x * 0.06, z * 0.06)); c.lerp(rk, sm(0.6, 0.85, noise(x * 0.1 + 3, z * 0.1)) * 0.6);
      c.lerp(road, sm(3, 1.2, roadDist(x, z)) * 0.7);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals();
    var ground = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 })); ground.receiveShadow = true; scene.add(ground);
    var hemi = new T.HemisphereLight('#DCEFF2', '#A99A6A', 0.64); scene.add(hemi);
    var sun = new T.DirectionalLight('#FFF0CF', 0.74); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    var ss = sun.shadow.camera; ss.left = -26; ss.right = 26; ss.top = 26; ss.bottom = -26; ss.near = 1; ss.far = 150; sun.shadow.bias = -0.0015;
    scene.add(sun); scene.add(sun.target);
    function put(o, x, z, lift) { o.position.set(x, height(x, z) + (lift || 0), z); scene.add(o); return o; }
    if (MO.rock) for (i = 0; i < 50; i++) { var ro = MO.rock(1900 + i); ro.scale.multiplyScalar(0.5 + R() * 1.3); var rx = -140 + R() * 280, rz = -140 + R() * 280; if (roadDist(rx, rz) < 4 || Math.hypot(rx - TENT[0], rz - TENT[1]) < 16 || (rx > 10 && rx < 52 && rz > -6 && rz < 38)) continue; put(ro, rx, rz, -0.1); }
    if (MO.shrub) for (i = 0; i < 50; i++) { var sh = MO.shrub(200 + i), hx = -140 + R() * 280, hz = -140 + R() * 280; if (roadDist(hx, hz) < 4 || Math.hypot(hx - TENT[0], hz - TENT[1]) < 14) continue; put(sh, hx, hz, -0.05); }
    /* 모레 상수리나무(창 12:6): 세겜 땅이므로 먼 배경의 큰 나무 하나 */
    var oak = MO.acacia ? MO.acacia(7) : new T.Group(); oak.scale.setScalar(3.4); put(oak, OAK[0], OAK[1]);
    var altarFar = PR.stoneHeap(612, 12); altarFar.scale.setScalar(2.2); put(altarFar, OAK[0] + 8, OAK[1] - 6); altarFar.visible = false;
    /* 장막(창 12:8)과 제단(12:8) */
    var camp = new T.Group(); scene.add(camp);
    var tents = [];
    for (i = 0; i < 6; i++) { var tn = PR.tent(i + 300); tn.scale.setScalar(1.3); tn.position.set(TENT[0] + (i % 3) * 5.5 - 5, height(TENT[0] + (i % 3) * 5.5 - 5, TENT[1] - Math.floor(i / 3) * 6) , TENT[1] - Math.floor(i / 3) * 6); tn.rotation.y = 0.4 + i * 0.7; camp.add(tn); tents.push(tn); }
    var altarNear = PR.stoneHeap(820, 14); altarNear.scale.setScalar(2); altarNear.position.set(ALTAR[0], height(ALTAR[0], ALTAR[1]), ALTAR[1]); camp.add(altarNear);
    /* 일행(창 12:5): 아브람(Blender), 사래, 롯, 하란에서 얻은 사람들 */
    var abram = { group: api.fallback('#8A6A3E', 1.75, 0.27), update: function () {} };
    put(abram.group, ABR[0], ABR[1]); abram.group.rotation.y = Math.PI * 0.75;
    api.person('abraham', function (nm) { nm.group.position.copy(abram.group.position); nm.group.rotation.y = abram.group.rotation.y; scene.remove(abram.group); scene.add(nm.group); abram = nm; });
    var party = [];
    /* 0 사래(여자), 1 롯(남자), 나머지는 하란에서 얻은 사람들(어른 남녀). 아이와 아기는 넣지 않는다(본문이 말하지 않음) */
    for (i = 0; i < 12; i++) { var o = null, kd = i === 0 ? 'woman' : i === 1 ? 'man' : (i % 2 ? 'man' : 'woman'); try { if (M2.israelite) o = M2.israelite(i * 29 + 5, { kind: kd, carry: i > 3 && i % 3 === 0 ? 'sack' : 'none' }); } catch (e) { o = null; } if (!o) o = PR.soldier(i, '#7A6A54', null); o.k = i; o.lot = i === 1; o.home = [TENT[0] - 10 + (i % 4) * 3.2, TENT[1] + 12 + Math.floor(i / 4) * 2.4]; put(o.group, o.home[0], o.home[1]); party.push(o); }
    /* 짐(창 12:5의 재산): 단순한 꾸러미. 짐승은 그리지 않는다 */
    var bundles = []; for (i = 0; i < 8; i++) { var bd = new T.Mesh(new T.DodecahedronGeometry(0.35, 0), new T.MeshStandardMaterial({ color: '#B8946A', flatShading: true })); bd.scale.set(1.2, 0.8, 1); put(bd, TENT[0] + 6 + (i % 4) * 1.1, TENT[1] + 2 + Math.floor(i / 4), 0.25); bundles.push(bd); }

    function roadAt(s) { var tot = 0, segs = [], k; for (k = 0; k + 1 < ROAD.length; k++) { var l = Math.hypot(ROAD[k + 1][0] - ROAD[k][0], ROAD[k + 1][1] - ROAD[k][1]); segs.push([ROAD[k], ROAD[k + 1], tot, l]); tot += l; } s = Math.max(0, Math.min(tot, s)); for (k = 0; k < segs.length; k++) if (s <= segs[k][2] + segs[k][3]) { var u = (s - segs[k][2]) / segs[k][3]; return [segs[k][0][0] + (segs[k][1][0] - segs[k][0][0]) * u, segs[k][0][1] + (segs[k][1][1] - segs[k][0][1]) * u, Math.atan2(segs[k][1][0] - segs[k][0][0], segs[k][1][1] - segs[k][0][1]), tot]; } return [ROAD[ROAD.length - 1][0], ROAD[ROAD.length - 1][1], 0, tot]; }
    var phase = 'camp', walkS = 0, night = 0, nightWant = 0, JOURNEY = [84, 100];   /* 길 위에서 걷기 시작하는 곳과 멈추는 곳(길의 거리) */
    var ca = new T.Color(), cb = new T.Color();
    function applyNight() {
      /* 0 낮, 0.5 해 질 녘, 1 별이 보이는 하늘 */
      var t = night;
      ca.set('#F1E4C6'); cb.set(t < 0.5 ? '#E8B49A' : '#141C34'); var u = t < 0.5 ? t * 2 : (t - 0.5) * 2;
      if (t >= 0.5) { ca.set('#E8B49A'); }
      ca.lerp(cb, u); scene.background.copy(ca); scene.fog.color.copy(ca);
      ca.set(t < 0.5 ? '#FFFFFF' : '#E8B8A0'); cb.set(t < 0.5 ? '#E8B8A0' : '#26315A'); skyM.color.copy(ca.lerp(cb, u));
      hemi.intensity = 0.64 - 0.28 * t; sun.intensity = 0.74 - 0.56 * t; ca.set('#FFF0CF'); cb.set('#9FB4E0'); sun.color.copy(ca.lerp(cb, t));
      starGroups.forEach(function (m) { m.opacity = Math.max(0, (t - 0.6) / 0.4) * 0.95; });
    }
    function showCamp(on) { camp.visible = on; bundles.forEach(function (b) { b.visible = on; }); }
    function setPhase(p) {
      phase = p;
      /* 사람의 자리와 방향은 대목마다 처음부터 정한다('이전'으로 돌아와도 뒤 대목의 것이 남지 않게) */
      function home(o) { o.group.visible = true; o.group.position.set(o.home[0], height(o.home[0], o.home[1]), o.home[1]); o.group.rotation.y = Math.PI * 0.75; }
      function abrAt(x, z, ry) { abram.group.visible = true; abram.group.position.set(x, height(x, z), z); abram.group.rotation.y = ry; }
      if (p === 'camp') { night = 0; nightWant = 0; applyNight(); showCamp(true); altarFar.visible = false; walkS = 0; party.forEach(home); abrAt(ABR[0], ABR[1], Math.PI * 0.75); }
      if (p === 'journey') { nightWant = 0; showCamp(false); altarFar.visible = false; walkS = JOURNEY[0]; }   /* 12:4-5: 길을 따라 들어온다(장막 자리까지는 오지 않는다) */
      if (p === 'moreh') { nightWant = 0; showCamp(false); altarFar.visible = true;                    /* 12:6-7: 일행은 먼 나무 곁에 있다 */
        party.forEach(function (o) { var x = OAK[0] + 14 + (o.k % 4) * 2.4, z = OAK[1] - 10 + Math.floor(o.k / 4) * 2.2; o.group.visible = true; o.group.position.set(x, height(x, z), z); o.group.rotation.y = -Math.PI * 0.6; });
        abrAt(OAK[0] + 11, OAK[1] - 7, -Math.PI * 0.6); }
      if (p === 'tent') { nightWant = 0; showCamp(true); altarFar.visible = true; party.forEach(home); abrAt(ABR[0], ABR[1], Math.PI * 0.75); } /* 12:8-9 */
      if (p === 'vision') { nightWant = 0.5; showCamp(true); altarFar.visible = false; party.forEach(function (o) { home(o); o.group.visible = !o.lot && o.k < 6; }); abrAt(ABR[0], ABR[1], Math.PI * 0.75); }   /* 15:1-4: 롯은 없다(13:11) */
      if (p === 'stars') { nightWant = 1; showCamp(true); altarFar.visible = false; party.forEach(function (o) { o.group.visible = false; }); abrAt(ABR[0] + 4, ABR[1] + 4, Math.PI * 0.8); } /* 15:5-6 */
    }
    function v3(x, y, z) { return new T.Vector3(x, y, z); }
    if (FX) FX.sortLayers(scene);

    return {
      id: 'OT-05', scene: scene, sun: sun, sunOff: [-30, 50, 30],
      height: height, walkable: walkable,
      edge: function (x, z) {
        if (x < 12) return { who: 'onwoo', text: '장막 쪽으로는 가지 말자. 우리는 멀리서 지켜보는 사람이야.' };
        return { who: 'hyu', text: '이 언덕 위에서만 다니자.' };
      },
      P: { start: [40, 22], machine: [46, 28], machineRot: -0.9,
        /* 재료가 놓인 곳(quests[i].found): 일행이 들어온 길가 / 장막이 건너다보이는 언덕 가장자리(멀찍이) / 장막에서 멀리 떨어진 트인 땅 */
        parts: [[22, -3], [14, 6], [28, 26]], lookSpot: [28, 26],
        look: { focus: TENT, mid: ABR, dy: 1.6, backE: 7, upE: 3 } },
      eventLook: function (i) {
        if (i === 2) { var w = roadAt(walkS); return { focus: [w[0], w[1]], mid: [w[0], w[1]], dy: 1.2, backE: 7, upE: 3.4 }; }
        if (i === 3) return { focus: OAK, mid: OAK, dy: 8, backE: 8, upE: 3 };
        if (i === 4 || i === 5) return { focus: TENT, mid: ABR, dy: 1.4, backE: 7, upE: 3 };
        return null;
      },
      eventCam: function (i) {
        if (i !== 6) return null;
        var p = abram.group.position;
        return { pos: [p.x + 6, p.y + 1.2, p.z + 6], look: [p.x - 30, p.y + 40, p.z - 30] };
      },
      beatNote: function (i) { return i === 2 || i === 3 ? '이 대목은 아브람이 이곳에 장막을 치기 전의 일이에요. 장막을 잠시 걷어 내고 보여 줘요.' : null; },
      helpNote: function (after) { return after === 2 ? '이 돕기도 장막을 치기 전, 일행이 이 땅에 막 들어오던 때의 이야기예요. 우리가 재료를 주운 길은 이 일행이 지나간 뒤의 길이에요.' : null; },   /* 3D에서는 재료를 먼저 모으므로 때를 밝힌다(시대 2 독립 대조, 2026-11-16) */
      quietAt: function () { return [[ALTAR[0], ALTAR[1], 6]]; },   /* 제단 둘레 6m는 끔 */
      detector: '탐지기', askLabel: '탐지기 물음 풀기',
      intro: { text: '타임머신이 언덕 위에 내려앉았어요. 저쪽에 장막 몇 채가 보여요.', say: { who: 'hyu', text: '장막에서 멀리 떨어진 곳에서만 다니자.' } },
      lookText: '아브람을 부르신 이야기를 성경에서 찾아 읽은 뒤 다시 골라 보세요.',
      partBeats: [0, 1], eventStart: 2,
      sceneDoneText: '아브람 장면을 끝까지 지켜봐야 떠날 수 있어요.',
      dex: [
        { id: 'abram', name: '아브람', desc: '하나님이 부르신 사람. 몇 살에 무엇을 따라 하란을 떠났는지는 창세기 12장 4절에 있어요.', ref: '창 12:4', hint: '장막 가까이에 서 있어요.', range: 50, crop: 0.36, pos: function () { var p = abram.group.position; return v3(p.x, p.y + 1.1, p.z); } },   /* 관문·뜻 묻기의 답(나이, 말씀을 따름)은 성경에서 찾게(규칙서 13.9) */
        { id: 'tent', name: '장막', desc: '벧엘 동쪽 산에 친 아브람의 장막', ref: '창 12:8', hint: '언덕 아래를 보세요.', range: 70, pos: function () { return v3(TENT[0], height(TENT[0], TENT[1]) + 1.5, TENT[1]); } },
        { id: 'altar', name: '제단', desc: '아브람이 여호와께 쌓은 제단', ref: '창 12:8', hint: '장막 너머를 보세요.', range: 70, crop: 0.4, pos: function () { return v3(ALTAR[0], height(ALTAR[0], ALTAR[1]) + 0.8, ALTAR[1]); } },
        { id: 'stars', name: '우러러본 하늘', desc: '하나님이 아브람을 밖으로 이끌고 나가 우러러보게 하신 하늘. 무엇을 세어 보라고 하셨는지는 창세기 15장 5절에 있어요.', ref: '창 15:5', hint: '마지막에 하늘을 보세요.', range: 2000, crop: 0.9,
          visible: function () { return night > 0.8; }, pos: function () { return v3(0, 300, -300); } }
      ],
      reset: function () { setPhase('camp'); },
      partFound: function () {},
      partContinue: function () {},
      lookupPose: function () {},
      /* 대목 번호(OT-05.json): 2 = 12:4-5, 3 = 12:6-7, 4 = 12:8-9, 5 = 15:1-4, 6 = 15:5-6 */
      beatPose: function (i) { setPhase(i <= 1 ? 'camp' : ['', '', 'journey', 'moreh', 'tent', 'vision', 'stars'][i]); },
      update: function (dt, now) {
        if (Math.abs(night - nightWant) > 0.003) { night += (nightWant - night) * Math.min(1, dt * 0.45); applyNight(); }
        if (night > 0.6) starGroups.forEach(function (m, k) { m.opacity = Math.max(0, (night - 0.6) / 0.4) * (0.75 + 0.25 * Math.sin(now * (1.3 + k * 0.7) + k)); });
        /* 12:4-5: 일행이 길을 따라 들어온다 */
        if (phase === 'journey') {
          var moving = walkS < JOURNEY[1]; walkS = Math.min(JOURNEY[1], walkS + dt * 2.2);
          [abram].concat(party).forEach(function (o, k) {
            var w = roadAt(walkS - k * 1.8), off = (k % 3 - 1) * 0.9;   /* 멈춘 뒤에도 길 위에 줄지어 선다 */
            o.group.visible = true; o.group.position.set(w[0] + Math.cos(w[2]) * off, height(w[0], w[1]), w[1] - Math.sin(w[2]) * off); o.group.rotation.y = w[2];
            if (o.update) o.update(dt, moving ? 1 : 0);
          });
        } else {
          if (abram.update) abram.update(dt, false);
          party.forEach(function (o) { if (o.update) o.update(dt, 0); });
        }
      },
      audio: function (A) { A.setFlock(999); A.setFire(999); },
      menuCam: function (camera, now) { var a = now * 0.05; camera.position.set(40 + Math.sin(a) * 8, 9, 34); camera.lookAt(TENT[0], 2, TENT[1]); },
      debug: { phase: function () { return { phase: phase, night: night, walk: walkS }; }, arrived: function () { return phase !== 'camp'; } }
    };
  };
})();
