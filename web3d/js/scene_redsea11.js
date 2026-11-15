/* 3D 장면 설정: OT-11 바다가 갈라지다 (출 14:1-31). 바다와 믹돌 사이 비하히롯 앞 바닷가.
 * 방향: 바다는 북쪽(-Z), 이스라엘 진은 바닷가(+Z), 애굽 진은 그 뒤 멀리 남쪽(+Z 멀리)에서 다가온다. 갈라진 길은 x=0을 따라 북쪽으로.
 * 본문에 맞춘 점 (content/ot/OT-11.json design3d)
 *  - 구름 기둥이 진 앞에서 뒤로 옮겨 두 진 사이에 서고, 밤에 이스라엘 쪽을 비춘다(출 14:19-20). 둥근 구름 덩이만, 형상 없음.
 *  - 큰 동풍으로 밤새 물이 물러가 마른 땅이 되고, 물은 좌우에서 벽이 된다(출 14:21-22). 바람은 소리로만.
 *  - 모세는 지팡이를 들고 손을 바다 위로 내민다(출 14:16, 14:21, 14:26). 지팡이로 바다를 치지 않는다.
 *  - 새벽에 물이 돌아와 병거를 덮는다(출 14:27-28). 멀리서만 보이고, 물이 덮을 때 병거는 물에 가려진다. 사람이 빠지는 모습·주검은 그리지 않는다.
 *  - 이스라엘 자손이 건너며 노래하거나 환호하지 않는다(이 본문에 없음). 세 아이는 진 가장자리 바닷가에서만 다닌다.
 * 감수가 필요한 설정: 진과 길의 자리와 방향, 물 벽의 높이, 병거의 수(육백 대 가운데 일부만 그림), 병거에 사람을 태우지 않은 것, 모세가 선 자리, 하늘빛(밤과 새벽).
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  BO3D.scene3d = BO3D.scene3d || {};
  BO3D.scene3d['OT-11'] = function (api) {
    var T = THREE, M2 = BO3D.models2 || {}, MO = BO3D.models || {}, PR = BO3D.props, FX = api.FX;
    var rng = PR.rng, R = rng(1114);
    function sm(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
    function hash(ix, iz) { var n = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453; return n - Math.floor(n); }
    function noise(x, z) {
      var ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
      var a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    var BED = -3.2, FAR = -150, HALF = 10;
    /* 땅: 바닷가 모래 둔덕, 남쪽 멀리 낮은 산, 바다 밑은 BED, 건너편 바닷가는 FAR 너머 */
    function height(x, z) {
      var land = 0.45 + 0.35 * noise(x * 0.06 + 3, z * 0.06 + 7) + 0.25 * Math.sin(x * 0.05) * Math.cos(z * 0.04);
      land += sm(150, 260, z) * 22 * (0.6 + 0.5 * noise(x * 0.02, 3)) + sm(120, 220, Math.abs(x)) * 8 * noise(1, z * 0.02 + 5);
      var bed = BED + 0.25 * noise(x * 0.12, z * 0.12);
      var farShore = 0.4 + 0.3 * noise(x * 0.05, z * 0.05 + 2) + sm(FAR - 20, FAR - 90, z) * 14;
      if (z >= 2) return land;
      if (z > -8) return land + (bed - land) * sm(2, -8, z);
      if (z > FAR + 10) return bed;
      return bed + (farShore - bed) * sm(FAR + 10, FAR - 2, z);
    }
    function walkable(x, z) { return x >= 20 && x <= 60 && z >= 3.2 && z <= 50; }

    var scene = new T.Scene(), ups = [];
    scene.background = new T.Color('#F3DDB0');
    scene.fog = new T.Fog('#F0D9AC', 60, 260);
    /* 하늘: 위아래 빛깔을 꼭짓점 색으로, 낮·밤·새벽은 재질 색을 곱해 바꾼다 */
    var skyG = new T.SphereGeometry(560, 24, 14), sp = skyG.attributes.position, sc = new Float32Array(sp.count * 3), cc = new T.Color(), top = new T.Color('#6FA6CC'), hor = new T.Color('#F6E3BC');
    for (var i = 0; i < sp.count; i++) { var tt = Math.max(0, sp.getY(i) / 560); cc.copy(hor).lerp(top, sm(0.02, 0.7, tt)); sc[i * 3] = cc.r; sc[i * 3 + 1] = cc.g; sc[i * 3 + 2] = cc.b; }
    skyG.setAttribute('color', new T.BufferAttribute(sc, 3));
    var skyM = new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false });
    scene.add(new T.Mesh(skyG, skyM));
    var starG = new T.BufferGeometry(), starP = [];
    for (i = 0; i < 400; i++) { var a = R() * 6.28, el = 0.12 + R() * 1.3; starP.push(Math.cos(a) * Math.cos(el) * 520, Math.sin(el) * 520, Math.sin(a) * Math.cos(el) * 520); }
    starG.setAttribute('position', new T.Float32BufferAttribute(starP, 3));
    var starM = new T.PointsMaterial({ color: '#FFF6D8', size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
    scene.add(new T.Points(starG, starM));

    /* 땅 */
    var g = new T.PlaneGeometry(520, 470, 170, 150); g.rotateX(-Math.PI / 2);
    var pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color();
    var sand = new T.Color('#E4BE7E'), sand2 = new T.Color('#D8AE6C'), wet = new T.Color('#A88A5E'), bed = new T.Color('#9A8462'), hill = new T.Color('#B9928A');
    for (i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i) - 20; pos.setZ(i, z);
      var y = height(x, z); pos.setY(i, y);
      c.copy(sand).lerp(sand2, noise(x * 0.09, z * 0.09));
      if (z < 4) c.lerp(wet, sm(4, -2, z));
      if (y < BED + 0.8 && z < 0) c.copy(bed).lerp(wet, noise(x * 0.2, z * 0.2) * 0.5);
      if (y > 3) c.lerp(hill, sm(3, 16, y));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals();
    var ground = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 })); ground.receiveShadow = true; scene.add(ground);

    var hemi = new T.HemisphereLight('#D9EEF2', '#B98A55', 0.62); scene.add(hemi);
    var sun = new T.DirectionalLight('#FFE9C4', 0.72); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    var ss = sun.shadow.camera; ss.left = -26; ss.right = 26; ss.top = 26; ss.bottom = -26; ss.near = 1; ss.far = 150; sun.shadow.bias = -0.0015;
    scene.add(sun); scene.add(sun.target);
    function put(o, x, z, lift) { o.position.set(x, height(x, z) + (lift || 0), z); scene.add(o); return o; }

    /* 바다: 왼쪽·오른쪽 물과 가운데 길 위의 물. 갈라지면 가운데 물은 내려가고 좌우에 물 벽이 선다 */
    function surf(w, d, x, z) {
      var s = null;
      try { if (M2.waterSurface) { s = M2.waterSurface(w, d); s.mesh.material.uniforms.uFlow.value.set(0, 0.05); } } catch (e) { s = null; }
      if (!s) { var m = new T.Mesh(new T.PlaneGeometry(w, d), new T.MeshStandardMaterial({ color: '#3E7FA0', transparent: true, opacity: 0.88 })); m.rotation.x = -Math.PI / 2; s = { mesh: m, update: function () {} }; }
      s.mesh.position.set(x, 0, z); scene.add(s.mesh); return s;
    }
    var SEA_D = 158, SEA_Z = -3 - SEA_D / 2;
    var seaL = surf(250, SEA_D, -HALF - 125, SEA_Z), seaR = surf(250, SEA_D, HALF + 125, SEA_Z), seaC = surf(HALF * 2 + 0.6, SEA_D, 0, SEA_Z);
    var walls = [];
    try {
      if (M2.waterWall) [1, -1].forEach(function (sd) {
        var w = M2.waterWall(SEA_D - 8, 8.6); w.group.position.set(sd * HALF, BED, SEA_Z - 2); if (sd < 0) w.group.rotation.y = Math.PI;
        w.group.scale.y = 0.02; w.group.visible = false; scene.add(w.group); walls.push(w);
      });
    } catch (e) { console.error('wall', e); }
    var part = 0, partWant = 0; /* 0 바다, 1 갈라짐 */

    /* 진의 장막 (출 14:2, 14:9) */
    for (i = 0; i < 46; i++) {
      var tx = -90 + R() * 150, tz = 8 + R() * 50;
      if (tx > 16 && tz < 54) continue;   /* 아이들이 다니는 곳(진 가장자리)에는 장막을 두지 않는다 */
      if (Math.abs(tx) < 9 && tz < 22) continue;
      var tn = PR.tent(i); put(tn, tx, tz); tn.rotation.y = R() * 6.28;
    }
    /* 이스라엘 자손: 진에 서 있다가 갈라진 길로 건너 건너편에 선다 */
    var people = [], NP = 54;
    for (i = 0; i < NP; i++) (function (k) {
      var per = null;
      try { if (M2.israelite) per = M2.israelite(k * 13 + 5); } catch (e) { per = null; }
      if (!per) per = { group: api.fallback(['#8A6A4A', '#5F7350', '#4E5E7A', '#9A4E3C'][k % 4], 1.5, 0.22), update: function () {} };
      per.camp = [-66 + hash(k, 3) * 70, 9 + hash(k, 7) * 30]; if (Math.abs(per.camp[0]) < 8) per.camp[0] -= 16;
      per.lane = ((k % 5) - 2) * 2.6; per.far = [per.lane + (hash(k, 9) - 0.5) * 6, FAR - 6 - Math.floor(k / 5) * 1.7];
      per.leg = 0; per.delay = k * 0.35; per.t = 0;
      put(per.group, per.camp[0], per.camp[1]); per.group.rotation.y = Math.PI;
      people.push(per);
    })(i);
    var crossing = 'camp';
    function movePeople(dt) {
      people.forEach(function (per) {
        var p = per.group.position, sp = 0;
        if (crossing === 'camp') { p.set(per.camp[0], height(per.camp[0], per.camp[1]), per.camp[1]); per.group.rotation.y = Math.PI; }
        else if (crossing === 'far') { p.set(per.far[0], height(per.far[0], per.far[1]), per.far[1]); per.group.rotation.y = Math.PI; }
        else {
          if (part < 0.9) { if (per.update) per.update(dt, 0); return; }   /* 마른 땅이 된 뒤에 들어간다(14:21-22) */
          per.t += dt; if (per.t < per.delay) { if (per.update) per.update(dt, 0); return; }
          var tg = per.leg === 0 ? [per.lane, 1.5] : per.far, dx = tg[0] - p.x, dz = tg[1] - p.z, d = Math.sqrt(dx * dx + dz * dz);
          if (d < 0.4) { if (per.leg === 0) per.leg = 1; }
          else { sp = Math.min(d, 4.2 * dt); p.x += dx / d * sp; p.z += dz / d * sp; p.y = height(p.x, p.z); per.group.rotation.y = Math.atan2(dx, dz); }
        }
        if (per.update) per.update(dt, sp > 0 ? 1.2 : 0);
      });
    }
    /* 애굽의 병거 (출 14:7, 14:9). 육백 대 가운데 일부만 그린다. 사람은 태우지 않는다 */
    var chariots = [], NC = 26, chMode = 'far';
    for (i = 0; i < NC; i++) {
      var ch = PR.chariot(i); ch.home = [-36 + (i % 9) * 9 + (hash(i, 2) - 0.5) * 3, 104 + Math.floor(i / 9) * 9]; ch.start = [ch.home[0] * 1.2, ch.home[1] + 90];
      ch.lane = ((i % 3) - 1) * 4; ch.t = 0; ch.delay = i * 0.25; ch.leg = 0;
      put(ch.group, ch.start[0], ch.start[1]); ch.group.rotation.y = Math.PI; chariots.push(ch);
    }
    function moveChariots(dt, now) {
      chariots.forEach(function (ch) {
        var p = ch.group.position, tg = null, sp = 0;
        if (chMode === 'far') { p.set(ch.start[0], height(ch.start[0], ch.start[1]), ch.start[1]); ch.group.visible = true; }
        else if (chMode === 'approach' || chMode === 'camp') tg = ch.home;
        else if (chMode === 'pursue') { ch.t += dt; tg = [ch.lane, -24 - (ch.delay * 9) % 44]; }
        if (tg) {
          var dx = tg[0] - p.x, dz = tg[1] - p.z, d = Math.sqrt(dx * dx + dz * dz);
          if (d < 0.5) { if (chMode === 'pursue' && ch.leg === 0) ch.leg = 1; }
          else { sp = Math.min(d, (chMode === 'camp' ? 40 : 7) * dt); p.x += dx / d * sp; p.z += dz / d * sp; p.y = height(p.x, p.z); ch.group.rotation.y = Math.atan2(dx, dz); }
        }
        /* 물이 돌아와 덮으면(출 14:28) 물에 가려진다 */
        if (p.z < -2 && seaC.mesh.position.y > p.y + 0.6) ch.group.visible = false;
        ch.update(dt, sp / Math.max(dt, 1e-3), now);
      });
    }

    /* 구름 기둥: 처음에는 진 앞(바다 쪽), 출 14:19-20부터 두 진 사이 */
    var pillar = PR.cloudPillar(40), PIL_FRONT = [-30, 4], PIL_MID = [0, 74], pilAt = PIL_FRONT.slice(), pilTo = null;
    put(pillar.group, pilAt[0], pilAt[1]);

    /* 모세 (출 14:1, 14:16): 바닷가에 서 있다. 손을 내밀 때는 지팡이 든 오른팔을 바다 쪽으로 든다 */
    var MOS = [11.5, 3.2], MOS_FAR = [5, FAR - 4];
    var moses = { group: api.fallback('#8A5A3C', 1.75, 0.27), update: function () {} }, stretch = 0, stretchWant = 0, armBones = null;
    put(moses.group, MOS[0], MOS[1]); moses.group.rotation.y = Math.PI;
    api.person('moses', function (nm) {
      nm.group.position.copy(moses.group.position); nm.group.rotation.y = moses.group.rotation.y;
      scene.remove(moses.group); scene.add(nm.group); moses = nm;
      var bones = {};
      nm.group.traverse(function (o) { if (o.isBone) bones[o.name.replace(/[^a-zA-Z]/g, '').toLowerCase()] = o; });
      if (bones.upperarmr && bones.staff) armBones = { ua: bones.upperarmr, fa: bones.forearmr, staff: bones.staff, root: bones.root };
    });
    var tmpV = new T.Vector3(), tmpQ = new T.Quaternion(), eStretch = new T.Euler();
    function poseArm() {
      if (!armBones || stretch < 0.01) return;
      /* 오른팔을 앞(바다 쪽)으로 들고, 지팡이 뼈는 손을 따라 기울인다 */
      eStretch.set(-1.25 * stretch, 0, 0.15 * stretch);
      tmpQ.setFromEuler(eStretch); armBones.ua.quaternion.premultiply(tmpQ);
      if (armBones.fa) { eStretch.set(-0.25 * stretch, 0, 0); tmpQ.setFromEuler(eStretch); armBones.fa.quaternion.premultiply(tmpQ); }
      eStretch.set(-0.75 * stretch, 0, 0); tmpQ.setFromEuler(eStretch); armBones.staff.quaternion.premultiply(tmpQ);
      armBones.staff.position.y += 0.35 * stretch; armBones.staff.position.z -= 0.25 * stretch;
    }

    /* 낮 → 밤 → 새벽 (출 14:20-21, 14:24, 14:27) */
    var tod = 0, todWant = 0;
    var DAY = { bg: '#F3DDB0', sky: '#FFFFFF', hs: '#D9EEF2', hg: '#B98A55', hi: 0.62, sc: '#FFE9C4', si: 0.72 };
    var NIGHT = { bg: '#141C34', sky: '#26315A', hs: '#4E5C88', hg: '#2A2A38', hi: 0.42, sc: '#A9BCE6', si: 0.22 };
    var DAWN = { bg: '#E7B9A0', sky: '#F2C8B0', hs: '#E8D4E0', hg: '#9A7A6A', hi: 0.55, sc: '#FFD2A0', si: 0.6 };
    var ca = new T.Color(), cb = new T.Color();
    function mixc(a, b, t) { ca.set(a); cb.set(b); return ca.lerp(cb, t).clone(); }
    function applyTod() {
      var A = tod <= 1 ? DAY : NIGHT, B = tod <= 1 ? NIGHT : DAWN, t = tod <= 1 ? tod : tod - 1;
      var bg = mixc(A.bg, B.bg, t); scene.background.copy(bg); scene.fog.color.copy(bg);
      skyM.color.copy(mixc(A.sky, B.sky, t)); hemi.color.copy(mixc(A.hs, B.hs, t)); hemi.groundColor.copy(mixc(A.hg, B.hg, t)); hemi.intensity = A.hi + (B.hi - A.hi) * t;
      sun.color.copy(mixc(A.sc, B.sc, t)); sun.intensity = A.si + (B.si - A.si) * t;
      var night = tod <= 1 ? tod : Math.max(0, 1 - (tod - 1) * 1.6);
      starM.opacity = night * 0.9; pillar.setNight(night);
    }
    applyTod();

    var phase = 'camp';
    function setPhase(p) {
      phase = p;
      if (p !== 'return' && p !== 'shore' && p !== 'camp') { retT = 0; if (chMode === 'pursue' || chMode === 'gone') { chMode = 'camp'; chariots.forEach(function (ch) { ch.group.visible = true; ch.group.position.set(ch.home[0], height(ch.home[0], ch.home[1]), ch.home[1]); ch.group.rotation.y = Math.PI; }); }
        moses.group.position.set(MOS[0], height(MOS[0], MOS[1]), MOS[1]); moses.group.rotation.y = Math.PI; if (p !== 'part') { partWant = 0; crossing = 'camp'; stretchWant = 0; } }   /* '이전'으로 돌아올 때 */
      if (p === 'camp') { todWant = 0; tod = 0; partWant = 0; part = 0; crossing = 'camp'; chMode = 'far'; pilAt = PIL_FRONT.slice(); pilTo = null; stretchWant = 0; stretch = 0;
        moses.group.position.set(MOS[0], height(MOS[0], MOS[1]), MOS[1]); moses.group.rotation.y = Math.PI;
        people.forEach(function (per) { per.leg = 0; per.t = 0; }); chariots.forEach(function (ch) { ch.leg = 0; ch.t = 0; ch.group.visible = true; }); }
      if (p === 'approach') chMode = chMode === 'far' ? 'approach' : chMode;          /* 출 14:9-10: 애굽 진이 가까이 */
      if (p === 'command') { todWant = 0.55; chMode = 'camp'; }                         /* 출 14:15-18: 저녁 */
      if (p === 'pillar') { todWant = 1; chMode = 'camp'; pilTo = PIL_MID; }            /* 출 14:19-20: 밤, 구름 기둥이 두 진 사이로 */
      if (p === 'part') { todWant = 1; chMode = 'camp'; pilTo = null; pilAt = PIL_MID.slice(); stretchWant = 1; partWant = 1; crossing = 'cross'; if (FX) FX.audio.wind(0.5); }
      if (p === 'return') { todWant = 2; crossing = 'far'; partWant = 1; part = Math.max(part, 0.95); stretchWant = 0;
        /* 14:23: 애굽 사람들이 뒤쫓아 바다 가운데로 들어온다. 길 어귀에서 시작해 안으로 달린다 */
        if (chMode !== 'pursue') chariots.forEach(function (ch, k) { var ex = ch.lane + ((k % 2) - 0.5) * 1.5, ez = 6 + Math.floor(k / 3) * 7; ch.group.visible = true; ch.group.position.set(ex, height(ex, ez), ez); ch.group.rotation.y = Math.PI; ch.t = 0; });
        chMode = 'pursue';
        moses.group.position.set(MOS_FAR[0], height(MOS_FAR[0], MOS_FAR[1]), MOS_FAR[1]); if (FX) FX.audio.wind(0.16); }
      if (p === 'shore') { todWant = 2; crossing = 'far'; chMode = 'gone'; partWant = 0; chariots.forEach(function (ch) { ch.group.visible = false; }); }
    }
    var retT = 0;
    function v3(x, y, z) { return new T.Vector3(x, y, z); }
    function dist2(ax, az, bx, bz) { var dx = ax - bx, dz = az - bz; return Math.sqrt(dx * dx + dz * dz); }
    if (FX) FX.sortLayers(scene);

    return {
      id: 'OT-11', scene: scene, sun: sun, sunOff: [-30, 50, 26],
      height: height, walkable: walkable,
      edge: function (x, z) {
        if (z < 3.2) return { who: 'onwoo', text: '바다 쪽으로는 들어가지 말자. 우리는 바닷가에서 지켜보는 사람이야.' };
        if (x < 20) return { who: 'hyu', text: '진 안쪽으로는 들어가지 말자. 여기 가장자리에서 지켜보자.' };
        if (z > 50) return { who: 'onwoo', text: '애굽 진 쪽으로는 가지 말자.' };
        return null;
      },
      P: { start: [48, 16], machine: [54, 22], machineRot: -0.4,
        /* 재료가 놓인 곳(quests[i].found): 바닷가 장막들 쪽 / 진 뒤쪽 / 물이 갈라진 바다 쪽 */
        parts: [[40, 6.5], [46, 47], [24.5, 4.6]], lookSpot: [24.5, 4.6],
        look: { focus: MOS, mid: [0, -20], dy: 1.4, backE: 7, upE: 2.6 } },
      eventLook: function (i) {
        if (i === 2) return { focus: MOS, mid: [0, -24], dy: 1.4, backE: 7, upE: 2.6 };
        if (i === 3) return { focus: pilTo ? pilAt : PIL_MID, mid: pilTo ? pilAt : PIL_MID, dy: 14, backE: 9, upE: 4 };
        if (i === 4) return { focus: [0, -46], mid: [4, -12], dy: 5.5, backE: 10, upE: 6 };
        if (i === 5) return { focus: [0, -36], mid: [2, 30], dy: 4, backE: 10, upE: 6 };
        if (i === 6) return { focus: [0, FAR], mid: [0, -60], dy: 3, backE: 10, upE: 6 };
        return null;
      },
      detector: '탐지기', askLabel: '탐지기 물음 풀기',
      intro: { text: '타임머신이 넓은 바닷가에 내려앉았어요. 장막이 끝없이 늘어서 있어요.', say: { who: 'hyu', text: '진 가장자리에서만 다니자.' } },
      lookText: '바다가 갈라진 이야기를 성경에서 찾아 읽은 뒤 다시 골라 보세요.',
      partBeats: [0, 1], eventStart: 2,
      sceneDoneText: '바다가 갈라지는 장면을 끝까지 지켜봐야 떠날 수 있어요.',
      dex: [
        { id: 'sea', name: '바다', desc: '이스라엘 자손이 장막을 친 바닷가 앞의 바다', ref: '출 14:2', hint: '진 앞에 펼쳐진 바다를 담아 보세요.', range: 90, pos: function () { return v3(14, 0.5, -24); } },
        { id: 'camp', name: '이스라엘 자손의 장막', desc: '바닷가에 친 이스라엘 자손의 진', ref: '출 14:2', hint: '진 가장자리에서 장막들을 보세요.', range: 40, pos: function () { return v3(26, height(26, 34) + 1, 34); } },
        { id: 'moses', name: '모세', desc: '하나님이 지팡이를 들고 손을 바다 위로 내밀라고 하신 사람', ref: '출 14:16', hint: '바닷가에 서 있어요.', range: 40, crop: 0.36,
          pos: function () { var p = moses.group.position; return v3(p.x, p.y + 1.1, p.z); } },
        { id: 'pillar', name: '구름 기둥', desc: '이스라엘 진 앞에서 뒤로 옮겨 두 진 사이에 선 구름 기둥', ref: '출 14:19', hint: '하늘까지 닿은 구름을 화면 가운데에 담아 보세요.', range: 220, crop: 0.8,
          pos: function () { return v3(pilAt[0], height(pilAt[0], pilAt[1]) + 18, pilAt[1]); } },
        { id: 'chariots', name: '애굽의 병거', desc: '바로가 이끌고 뒤쫓아 온 병거', ref: '출 14:7', hint: '진 뒤 멀리 남쪽을 보세요.', range: 260, crop: 0.5,
          visible: function () { return chMode !== 'far' && chMode !== 'gone'; }, pos: function () { return v3(0, height(0, 110) + 1.2, 110); } }
      ],
      reset: function () { setPhase('camp'); },
      partFound: function (i) { if (i === 0) setPhase('approach'); },
      partContinue: function () {},
      lookupPose: function () { if (phase === 'camp') setPhase('approach'); chMode = 'camp'; },
      /* 대목 번호(OT-11.json): 2 = 14:15-18, 3 = 14:19-20, 4 = 14:21-22, 5 = 14:23-28, 6 = 14:29-31 */
      beatPose: function (i) { setPhase(i <= 1 ? 'approach' : i === 2 ? 'command' : i === 3 ? 'pillar' : i === 4 ? 'part' : i === 5 ? 'return' : 'shore'); retT = 0; },
      update: function (dt, now) {
        if (Math.abs(tod - todWant) > 0.002) { tod += (todWant - tod) * Math.min(1, dt * 0.6); applyTod(); }
        if (pilTo) {
          var d = dist2(pilAt[0], pilAt[1], pilTo[0], pilTo[1]);
          if (d < 0.2) { pilAt = pilTo.slice(); pilTo = null; } else { var st = Math.min(d, 14 * dt); pilAt[0] += (pilTo[0] - pilAt[0]) / d * st; pilAt[1] += (pilTo[1] - pilAt[1]) / d * st; }
          pillar.group.position.set(pilAt[0], height(pilAt[0], pilAt[1]), pilAt[1]);
        }
        pillar.update(now);
        stretch += (stretchWant - stretch) * Math.min(1, dt * 1.5);
        /* 출 14:26-27: 새벽, 병거가 길 가운데로 들어온 뒤 모세가 다시 손을 내밀고 물이 돌아온다 */
        /* 14:26-27: 병거들이 길 가운데로 들어온 뒤 모세가 다시 손을 내밀고, 새벽에 물이 돌아온다 */
        if (phase === 'return') { retT += dt; var inside = chariots.filter(function (ch) { return ch.group.position.z < -16; }).length;
          if (retT > 3 && (inside >= chariots.length * 0.8 || retT > 14)) { stretchWant = 1; if (retT > 5) partWant = 0; } }
        part += (partWant - part) * Math.min(1, dt * (partWant > part ? 0.35 : 0.45));
        seaC.mesh.position.y = (BED - 0.8) * Math.min(1, part * 1.15);
        seaC.mesh.visible = part < 0.97;
        walls.forEach(function (w) { w.group.visible = part > 0.03; w.group.scale.y = Math.max(0.02, part); if (w.update) w.update(now); });
        [seaL, seaR, seaC].forEach(function (s) { if (s.update) s.update(now); });
        movePeople(dt); moveChariots(dt, now);
        if (moses.update) moses.update(dt, false);
        poseArm();
      },
      audio: function (A) { A.setFlock(999); A.setFire(999); },
      menuCam: function (camera, now) { var a = now * 0.05; camera.position.set(40 + Math.sin(a) * 9, 7, 26); camera.lookAt(0, 1, -40); },
      debug: { phase: function () { return { phase: phase, tod: tod, part: part, arm: !!armBones, pil: pilAt, pilY: pillar.group.position.y, pilIn: !!pillar.group.parent }; }, arrived: function () { return phase !== 'camp'; } }
    };
  };
})();
