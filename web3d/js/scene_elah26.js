/* 3D 장면 설정: OT-26 다윗과 골리앗 (삼상 17:1-54). 엘라 골짜기.
 * 간접 연출(규칙서 13.8, 2026-11-16, 감수 전): 골리앗이 엎드러질 때 합성 쿵 소리와 작은 흔들림. 움직임 줄이기 설정이면 흔들지 않는다.
 * 방향: 골짜기는 동서(X)로 길다. 이스라엘이 선 산은 남쪽(+Z), 블레셋이 선 산은 북쪽(-Z), 그 사이 골짜기에 시내가 흐른다(삼상 17:3, 17:40).
 * 본문에 맞춘 점 (content/ot/OT-26.json design3d)
 *  - 골리앗은 블레셋 진에서 나와 골짜기에 서서 외친다(17:4, 17:8). 방패 든 사람이 앞서 간다(17:7, 17:41). 키와 무기는 적힌 만큼(투구, 갑옷, 창).
 *  - 다윗은 소년이며 젊다(17:33, 17:42). 손에 막대기를 들고 시내에서 돌을 고른 뒤 나아간다(17:40). 물매와 주머니는 작아서 그리지 않는다.
 *  - 골리앗이 땅에 엎드러지는 것은 멀리서만 보인다(17:49). 돌이 박히는 모습, 피, 머리를 베는 모습은 그리지 않는다(17:51은 글로만).
 *  - 블레셋 사람들이 달아나고 이스라엘이 뒤쫓는 것은 멀리서 진영이 움직이는 것으로만(17:52). 쓰러진 사람은 그리지 않는다.
 *  - 이 본문에는 하나님이 나타나시는 대목이 없다. 불·구름·빛을 만들지 않는다. 사자와 곰은 그리지 않는다(다윗의 말이다).
 * 감수가 필요한 설정: 두 진영의 자리와 사람 수, 시내의 자리(본문에 없음), 짐 두는 곳, 사울의 모습(그리지 않음), 다윗의 옷 색,
 *   골리앗의 키(여섯 규빗 한 뼘을 약 2.9m로 환산), 두 사람이 마주친 자리.
 * 세 아이는 이스라엘이 선 산 쪽 가장자리에서만 다니고 골짜기로 내려가지 않는다(목격자).
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  BO3D.scene3d = BO3D.scene3d || {};
  BO3D.scene3d['OT-26'] = function (api) {
    var T = THREE, M2 = BO3D.models2 || {}, MO = BO3D.models || {}, PR = BO3D.props, FX = api.FX, R = PR.rng(2617);
    function sm(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
    function hash(ix, iz) { var n = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453; return n - Math.floor(n); }
    function noise(x, z) {
      var ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
      var a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    var BROOK_Z = 2;
    function height(x, z) {
      var dz = z - BROOK_Z, q = Math.min(Math.abs(dz), 55), h = 0.0034 * q * q + Math.max(0, Math.abs(dz) - 55) * 0.22 + 0.9 * noise(x * 0.04 + 1, z * 0.04 + 6) + 0.4 * Math.sin(x * 0.03);
      h -= 0.5 * sm(2.2, 0.6, Math.abs(dz));                             /* 시내 바닥 */
      h += sm(90, 160, Math.abs(dz)) * 10 * noise(x * 0.02, 2);
      return h;
    }
    function walkable(x, z) { return x >= 16 && x <= 56 && z >= 14 && z <= 48; }   /* 이스라엘 진영의 동쪽 옆. 진영 앞 골짜기로는 가지 않는다 */

    var scene = new T.Scene();
    scene.background = new T.Color('#EFE6CC'); scene.fog = new T.Fog('#ECE2C6', 70, 300);
    var skyG = new T.SphereGeometry(560, 24, 14), sp = skyG.attributes.position, sc = new Float32Array(sp.count * 3), cc = new T.Color(), top = new T.Color('#7EB0D2'), hor = new T.Color('#F2E8CC'), i;
    for (i = 0; i < sp.count; i++) { var tt = Math.max(0, sp.getY(i) / 560); cc.copy(hor).lerp(top, sm(0.02, 0.7, tt)); sc[i * 3] = cc.r; sc[i * 3 + 1] = cc.g; sc[i * 3 + 2] = cc.b; }
    skyG.setAttribute('color', new T.BufferAttribute(sc, 3)); scene.add(new T.Mesh(skyG, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false })));
    var g = new T.PlaneGeometry(520, 420, 170, 140); g.rotateX(-Math.PI / 2);
    var pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color(), gr1 = new T.Color('#9DAA62'), gr2 = new T.Color('#B6B474'), dry = new T.Color('#C9B07A'), rock = new T.Color('#A69A86'), mud = new T.Color('#8A7A58');
    for (i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i), y = height(x, z); pos.setY(i, y);
      c.copy(gr1).lerp(gr2, noise(x * 0.07, z * 0.07)); c.lerp(dry, sm(0.5, 0.85, noise(x * 0.03 + 4, z * 0.03)) * 0.7);
      if (y > 9) c.lerp(rock, sm(9, 20, y) * 0.7);
      if (Math.abs(z - BROOK_Z) < 3) c.lerp(mud, sm(3, 1.2, Math.abs(z - BROOK_Z)));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals();
    var ground = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 })); ground.receiveShadow = true; scene.add(ground);
    var hemi = new T.HemisphereLight('#DCEFF2', '#9FA86A', 0.64); scene.add(hemi);
    var sun = new T.DirectionalLight('#FFF0CF', 0.76); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    var ss = sun.shadow.camera; ss.left = -26; ss.right = 26; ss.top = 26; ss.bottom = -26; ss.near = 1; ss.far = 150; sun.shadow.bias = -0.0015;
    scene.add(sun); scene.add(sun.target);
    function put(o, x, z, lift) { o.position.set(x, height(x, z) + (lift || 0), z); scene.add(o); return o; }

    /* 시내(삼상 17:40): 골짜기 가운데를 흐르는 좁은 물. 매끄러운 돌이 깔려 있다 */
    var brook = null;
    try { if (M2.waterSurface) { brook = M2.waterSurface(520, 2.6); brook.mesh.material.uniforms.uFlow.value.set(-0.25, 0); } } catch (e) { brook = null; }
    if (!brook) { var bm = new T.Mesh(new T.PlaneGeometry(520, 2.6), new T.MeshStandardMaterial({ color: '#4E8FA6', transparent: true, opacity: 0.85 })); bm.rotation.x = -Math.PI / 2; brook = { mesh: bm, update: function () {} }; }
    brook.mesh.position.set(0, -0.32, BROOK_Z); scene.add(brook.mesh);
    var pebM = new T.MeshStandardMaterial({ color: '#B8B0A0', flatShading: true });
    for (i = 0; i < 60; i++) { var pb = new T.Mesh(new T.DodecahedronGeometry(0.1 + R() * 0.08, 0), pebM); pb.scale.y = 0.55; put(pb, -40 + R() * 80, BROOK_Z + (R() - 0.5) * 3.4, 0.02); }
    if (MO.rock) for (i = 0; i < 50; i++) { var rk = MO.rock(900 + i); rk.scale.multiplyScalar(0.6 + R() * 1.4); var rx = -110 + R() * 220, rz = -70 + R() * 150; if (Math.abs(rz - BROOK_Z) < 5 || (rx > 12 && rx < 60 && rz > 6 && rz < 50)) continue; put(rk, rx, rz, -0.1); }
    if (MO.shrub) for (i = 0; i < 60; i++) { var sh = MO.shrub(40 + i); var hx = -120 + R() * 240, hz = -80 + R() * 170; if (Math.abs(hz - BROOK_Z) < 4) continue; put(sh, hx, hz, -0.05); }

    /* 두 진영(삼상 17:2-3, 17:20-21): 이스라엘은 남쪽 산, 블레셋은 북쪽 산에 줄지어 선다 */
    var isr = [], phi = [];
    for (i = 0; i < 42; i++) {
      var o = null;
      try { if (M2.israelite) o = M2.israelite(i * 11 + 7, { kind: 'man', carry: 'none' }); } catch (e) { o = null; }   /* 싸움에 나선 군대(17:20-21): 어른 남자 */
      if (!o) o = PR.soldier(i, '#7A6A4A', null);
      o.home = [-46 + (i % 14) * 4.1 + (hash(i, 1) - 0.5) * 1.2, 15 + Math.floor(i / 14) * 3.6 + hash(i, 3)];
      put(o.group, o.home[0], o.home[1]); o.group.rotation.y = Math.PI; o.at = o.home.slice(); isr.push(o);
    }
    for (i = 0; i < 48; i++) {
      var ph = PR.soldier(i + 300, ['#8E4A34', '#7A5A3A', '#9A6A3E'][i % 3], '#B98A3E');
      ph.home = [-48 + (i % 16) * 4.0 + (hash(i, 5) - 0.5) * 1.2, -12 - Math.floor(i / 16) * 3.6 - hash(i, 7)];
      put(ph.group, ph.home[0], ph.home[1]); ph.at = ph.home.slice(); phi.push(ph);
    }
    /* 짐 두는 곳과 짐 지키는 사람(삼상 17:22), 이스라엘 진의 장막(17:54의 다윗의 장막은 따로 그리지 않음) */
    var bagM = new T.MeshStandardMaterial({ color: '#B8946A', flatShading: true });
    for (i = 0; i < 9; i++) { var bg = new T.Mesh(new T.DodecahedronGeometry(0.35, 0), bagM); bg.scale.set(1, 0.8, 1.2); put(bg, 10 + (i % 3) * 1.1, 41 + Math.floor(i / 3) * 1.1, 0.25); }
    var keeper = null; try { keeper = M2.israelite ? M2.israelite(77, { kind: 'man' }) : null; } catch (e) { keeper = null; }
    if (keeper) { put(keeper.group, 13.6, 40.6); keeper.group.rotation.y = Math.PI * 0.8; }
    for (i = 0; i < 18; i++) { var tn = PR.tent(i + 70); put(tn, -60 + R() * 120, 46 + R() * 22); tn.rotation.y = R() * 6.28; }

    /* 골리앗(Blender, 삼상 17:4-7)과 방패 든 사람(17:7, 17:41). 키는 여섯 규빗 한 뼘(약 2.9m)으로 늘인다 */
    var GOL0 = [-8, -10], gol = { group: api.fallback('#5A4632', 2.9, 0.4), update: function () {} }, golAt = GOL0.slice(), golTo = null, golFall = 0, golFallWant = 0;
    put(gol.group, GOL0[0], GOL0[1]); gol.group.visible = false; gol.group.rotation.order = 'YXZ';   /* 엎드러질 때 바라보는 쪽으로 */
    api.person('goliath', function (nm) { nm.group.scale.setScalar(1.65); nm.group.rotation.order = 'YXZ'; nm.group.position.copy(gol.group.position); nm.group.visible = gol.group.visible; scene.remove(gol.group); scene.add(nm.group); gol = nm; });
    var bearer = PR.soldier(999, '#7A5A3A', '#B98A3E'), bShield = PR.shield('#8A6A3A'); bShield.position.set(0, 0, 0.38); bearer.group.add(bShield);
    put(bearer.group, GOL0[0] + 1.2, GOL0[1] + 2.2); bearer.group.visible = false;
    /* 다윗(Blender, 소년. 삼상 17:33, 17:42): 진에 이르러(17:20, 17:22) 시내로 가서(17:40) 나아간다 */
    var DAV0 = [12.5, 44],   /* 짐 두는 곳에서 진영으로(17:22) */ dav = { group: api.fallback('#7A8A4A', 1.55, 0.22), update: function () {} }, davAt = DAV0.slice(), davTo = null, davRun = false;
    put(dav.group, DAV0[0], DAV0[1]); dav.group.visible = false;
    var davBones = null, pickT = -1, STOOP = 1, eSt = new T.Euler(), qSt = new T.Quaternion();
    api.person('david', function (nm) {
      var bb = {}; nm.group.traverse(function (o) { if (o.isBone) bb[o.name.replace(/[^a-zA-Z]/g, '').toLowerCase()] = o; });
      if (bb.spine && bb.chest) davBones = bb;
      nm.group.scale.setScalar(0.9); nm.group.position.copy(dav.group.position); nm.group.visible = dav.group.visible; scene.remove(dav.group); scene.add(nm.group); dav = nm; });

    var phase = 'arrayed', flee = 0, fallPending = false;
    function setPhase(p) {
      phase = p;
      if (p !== 'fall') { golFall = 0; golFallWant = 0; fallPending = false; davRun = false; flee = 0; phi.forEach(function (o) { o.at = o.home.slice(); o.group.visible = true; o.group.position.set(o.home[0], height(o.home[0], o.home[1]), o.home[1]); }); bearer.group.visible = gol.group.visible || p !== 'arrayed'; }   /* '이전'으로 돌아올 때 */
      if (p === 'arrayed') { gol.group.visible = false; bearer.group.visible = false; dav.group.visible = false; golAt = GOL0.slice(); golTo = null; golFall = 0; golFallWant = 0; davAt = DAV0.slice(); davTo = null; flee = 0;
        isr.forEach(function (o) { o.at = o.home.slice(); }); phi.forEach(function (o) { o.at = o.home.slice(); o.group.visible = true; }); }
      if (p === 'goliath') { gol.group.visible = true; bearer.group.visible = true; golTo = [-6, -6]; }                         /* 17:4-10 */
      if (p === 'david') { gol.group.visible = true; bearer.group.visible = true; dav.group.visible = true; davTo = [8, 22]; } /* 17:20-23 */
      if (p === 'fear') { isr.forEach(function (o) { o.at = [o.home[0], o.home[1] + 4]; }); davTo = [6, 24]; golTo = [-5, -4]; } /* 17:24 */
      if (p === 'saul') { isr.forEach(function (o) { o.at = [o.home[0], o.home[1] + 4]; }); davTo = [-4, 22]; }               /* 17:31-37 */
      if (p === 'brook') { davTo = [-3, BROOK_Z + 1.6]; }                                                                     /* 17:40 */
      pickT = p === 'brook' ? 0 : -1;
      if (p === 'near') { davTo = [-3, BROOK_Z + 1.2]; golTo = [-4, -3.2]; }                                                    /* 17:41-47: 골리앗이 다윗 쪽으로 다가온다 */
      if (p === 'fall') { davTo = [-3.6, BROOK_Z + 0.4]; davRun = true; golTo = [-4, -2.2]; fallPending = true; flee = 0.001; }  /* 17:48-52: 서로 다가간 뒤 골리앗이 엎드러진다 */
    }
    function step(o, at, to, spd, dt) {
      var p = o.group.position, dx = to[0] - at[0], dz = to[1] - at[1], d = Math.sqrt(dx * dx + dz * dz);
      if (d < 0.05) return true;
      var st = Math.min(d, spd * dt); at[0] += dx / d * st; at[1] += dz / d * st;
      p.set(at[0], height(at[0], at[1]), at[1]); o.group.rotation.y = Math.atan2(dx, dz);
      return false;
    }
    /* 17:40 "시내에서 매끄러운 돌 다섯을 골라서": 시내에 이른 다윗이 몸을 굽혀 돌을 고르고 일어서기를 다섯 번 한다(허리·가슴 뼈만 굽힘).
       돌을 줍는 손과 주머니는 작아서 그리지 않는다 */
    function stoop(t) {
      if (!davBones) return;
      var CY = 1.7, k = Math.floor(t / CY), u = (t % CY) / CY, a = 0;
      if (k >= 5) return;
      if (u < 0.3) a = u / 0.3; else if (u < 0.6) a = 1; else if (u < 0.9) a = 1 - (u - 0.6) / 0.3;
      a = a * a * (3 - 2 * a);
      if (a < 0.001) return;
      eSt.set(STOOP * 0.6 * a, 0, 0); qSt.setFromEuler(eSt); davBones.spine.quaternion.multiply(qSt);
      eSt.set(STOOP * 0.45 * a, 0, 0); qSt.setFromEuler(eSt); davBones.chest.quaternion.multiply(qSt);
    }
    /* 17:51-52 뒤쫓는 이스라엘 사람들은 쓰러진 골리앗과 그 곁의 다윗을 밟지 않고 비켜 지나간다 */
    function around(x, z) {
      var cx = golAt[0], cz = golAt[1] + 1.8, dz = z - cz, w = Math.exp(-(dz * dz) / 32), dx = x - cx, need = 4.2;
      if (Math.abs(dx) >= need || w < 0.01) return x;
      return x + (dx >= 0 ? 1 : -1) * (need - Math.abs(dx)) * w;
    }
    function isrNear() {   /* 시험용: 이스라엘 사람과 쓰러진 골리앗(발→머리 선분)·다윗 사이의 가장 가까운 거리 */
      var g = 9e9, d = 9e9;
      isr.forEach(function (o) {
        var p = o.group.position, tz = Math.max(golAt[1], Math.min(golAt[1] + 2.9, p.z)), gx = p.x - golAt[0], gz = p.z - tz, dx = p.x - davAt[0], dz = p.z - davAt[1];
        g = Math.min(g, Math.sqrt(gx * gx + gz * gz)); d = Math.min(d, Math.sqrt(dx * dx + dz * dz));
      });
      return [Math.round(g * 100) / 100, Math.round(d * 100) / 100];
    }
    function v3(x, y, z) { return new T.Vector3(x, y, z); }
    if (FX) FX.sortLayers(scene);

    return {
      id: 'OT-26', scene: scene, sun: sun, sunOff: [-30, 50, 34],
      height: height, walkable: walkable,
      edge: function (x, z) {
        if (z < 9) return { who: 'onwoo', text: '골짜기로는 내려가지 말자. 우리는 여기서 지켜보는 사람이야.' };
        if (x < 16) return { who: 'hyu', text: '이스라엘 진영 안으로는 들어가지 말자.' };
        return null;
      },
      P: { start: [44, 32], machine: [50, 38], machineRot: -0.5,
        /* 재료가 놓인 곳(quests[i].found): 이스라엘이 선 산 쪽 / 짐 지키는 사람이 있는 쪽 / 시내 쪽 */
        parts: [[24, 30], [18.5, 43], [21, 15]], lookSpot: [21, 15],
        look: { focus: GOL0, mid: [-4, 2], dy: 1.8, backE: 6, upE: 3 } },
      eventLook: function (i) {
        if (i === 2 || i === 3) return { focus: davAt, mid: davAt, dy: 1.0, backE: 6, upE: 3 };
        if (i === 4) return { focus: davAt, mid: [-4, 22], dy: 1.0, backE: 6, upE: 3 };
        if (i === 5) return { focus: davAt, mid: davAt, dy: 0.8, backE: 6, upE: 2.6 };
        if (i === 7 && flee > 0) { var f = Math.min(1, flee * 1.6), fc = [golAt[0] + (-14 - golAt[0]) * f, golAt[1] + (-26 - golAt[1]) * f]; return { focus: fc, mid: fc, dy: 1.6, backE: 7, upE: 3.4 }; }   /* 17:51-52: 뒤쫓을 때는 달아나는 쪽과 뒤쫓는 진영을 본다 */
        return { focus: golAt, mid: i === 7 ? davAt : golAt, dy: 1.6, backE: 7, upE: 3.4 };
      },
      detector: '탐지기', askLabel: '탐지기 물음 풀기',
      intro: { text: '타임머신이 산비탈에 내려앉았어요. 아래로 골짜기가 길게 보여요.', say: { who: 'hyu', text: '골짜기로는 내려가지 말고 이쪽 비탈에서만 다니자.' } },
      lookText: '엘라 골짜기 이야기를 성경에서 찾아 읽은 뒤 다시 골라 보세요.',
      partBeats: [0, 1], eventStart: 2,
      sceneDoneText: '엘라 골짜기 장면을 끝까지 지켜봐야 떠날 수 있어요.',
      dex: [
        { id: 'valley', name: '엘라 골짜기', desc: '이스라엘과 블레셋이 두 산에 서서 맞선 사이의 골짜기', ref: '삼상 17:2-3', hint: '두 산 사이를 화면에 담아 보세요.', range: 140, crop: 0.7, pos: function () { return v3(-10, 1, -2); } },
        { id: 'brook', name: '시내', desc: '다윗이 매끄러운 돌 다섯을 고른 시내', ref: '삼상 17:40', hint: '골짜기 가운데를 보세요.', range: 40, pos: function () { return v3(10, 0, BROOK_Z); } },
        { id: 'goliath', name: '골리앗', desc: '블레셋 진에서 나와 싸움을 건 가드 사람', ref: '삼상 17:4', hint: '골짜기 건너편을 보세요.', range: 70, crop: 0.4,
          visible: function () { return gol.group.visible; }, pos: function () { var p = gol.group.position; return v3(p.x, p.y + 2.2, p.z); } },
        { id: 'david', name: '다윗', desc: '이새의 막내아들. 형들의 안부를 살피러 진에 왔다', ref: '삼상 17:17', hint: '진 쪽에서 찾아보세요.', range: 50, crop: 0.4,
          visible: function () { return dav.group.visible; }, pos: function () { var p = dav.group.position; return v3(p.x, p.y + 1.0, p.z); } }
      ],
      reset: function () { setPhase('arrayed'); },
      partFound: function (i) { if (i === 1) setPhase('goliath'); },
      partContinue: function () {},
      lookupPose: function () { if (phase === 'arrayed') setPhase('goliath'); },
      /* 대목 번호(OT-26.json): 2 = 17:12-23, 3 = 17:24-31, 4 = 17:32-37, 5 = 17:38-40, 6 = 17:41-47, 7 = 17:48-54 */
      beatPose: function (i) { setPhase(i <= 1 ? 'goliath' : ['', '', 'david', 'fear', 'saul', 'brook', 'near', 'fall'][i]); },
      update: function (dt, now) {
        if (golTo && gol.group.visible) { step(gol, golAt, golTo, 0.9, dt); bearer.group.position.set(golAt[0] + 1.1, height(golAt[0] + 1.1, golAt[1] + 2.0), golAt[1] + 2.0); bearer.group.rotation.y = gol.group.rotation.y = Math.PI * 0.02; }
        if (davTo && dav.group.visible) { var ar = step(dav, davAt, davTo, davRun ? 4.5 : 1.6, dt); if (dav.update) dav.update(dt, !ar); if (ar && pickT >= 0) { pickT += dt; stoop(pickT); } if (ar && fallPending) { fallPending = false; golFallWant = 1; golTo = null; setTimeout(function () { if (FX) FX.audio.thud(0.7); if (api.shake) api.shake(0.25, 0.8); }, 700); }   /* 골리앗이 땅에 엎드러질 때 쿵(17:49, 간접 연출) */ } else if (dav.update) dav.update(dt, false);
        if (gol.update) gol.update(dt, !!golTo);
        /* 17:49: 땅에 엎드러짐(멀리서). 앞으로 천천히 눕는다 */
        golFall += (golFallWant - golFall) * Math.min(1, dt * (golFallWant ? 0.9 : 3));
        gol.group.rotation.x = golFall * 1.45; gol.group.position.y = height(golAt[0], golAt[1]) + golFall * 0.15;
        if (golFallWant) bearer.group.visible = golFall < 0.5;
        /* 17:51-52: 블레셋 사람들이 달아나고 이스라엘이 뒤쫓는다(멀리서 진영이 움직이는 것으로만) */
        if (flee > 0 && golFall > 0.9) {
          flee = Math.min(1, flee + dt * 0.08);
          phi.forEach(function (o, k) { o.at = [o.home[0], o.home[1] - flee * 60]; o.group.position.set(o.at[0], height(o.at[0], o.at[1]), o.at[1]); o.group.rotation.y = Math.PI; o.update(dt, 1, now); o.group.visible = flee < 0.9; });
          isr.forEach(function (o) { var az = o.home[1] - flee * 34; o.at = [around(o.home[0], az), az]; o.group.position.set(o.at[0], height(o.at[0], o.at[1]), o.at[1]); o.group.rotation.y = Math.PI; if (o.update) o.update(dt, 1.2); });
        } else {
          isr.forEach(function (o) { var p = o.group.position; p.x += (o.at[0] - p.x) * Math.min(1, dt * 2); p.z += (o.at[1] - p.z) * Math.min(1, dt * 2); p.y = height(p.x, p.z); o.group.rotation.y = Math.PI; if (o.update) o.update(dt, 0); });
          phi.forEach(function (o) { o.update(dt, 0, now); });
        }
        if (brook.update) brook.update(now);
      },
      audio: function (A) { A.setFlock(999); A.setFire(999); },
      menuCam: function (camera, now) { var a = now * 0.05; camera.position.set(34 + Math.sin(a) * 8, 12, 36); camera.lookAt(-6, 2, -6); },
      debug: { phase: function () { return { phase: phase, gol: golAt, dav: davAt, fall: golFall, pick: pickT, bones: !!davBones, flee: flee, near: isrNear() }; }, arrived: function () { return phase !== 'arrayed'; } }
    };
  };
})();
