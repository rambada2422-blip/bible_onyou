/* 3D 장면 설정: OT-21 기드온과 삼백 명 (삿 6:11-16, 7:1-22). 오브라(6장)는 이야기 카드로만, 3D는 하롯 샘과 골짜기(7장).
 * 방향: 이스라엘 진과 하롯 샘은 남쪽 높은 곳(+Z), 미디안의 진은 북쪽 모레 산 앞 골짜기(-Z)(삿 7:1, 7:8).
 * 본문에 맞춘 점 (content/ot/OT-21.json design3d)
 *  - 두려워 떠는 사람들이 돌아간다(7:3). 물가에서 손으로 떠 핥아 마신 삼백 명과 무릎 꿇고 마신 사람들(7:5-6). 삼백 명만 남는다(7:8).
 *  - 밤에 기드온과 부라가 진 가로 내려간다(7:10-11). 꿈 이야기는 그리지 않는다(7:13은 말로만).
 *  - 삼백 명은 세 무리로 나뉘어 나팔과 빈 항아리(속에 횃불)를 든다(7:16). 이경 초에 항아리를 깨고 횃불을 들고 진을 둘러 제자리에 선다(7:19-21).
 *  - 미디안 군대는 달아난다(7:21-22). 싸우는 모습, 서로 치는 모습, 불타는 장막은 그리지 않는다. 횃불은 사람들이 든 물건일 뿐이다.
 *  - 여호와의 사자는 그리지 않는다. 사람 수는 줄여 그린다(삼백 명을 서른으로).
 * 감수가 필요한 설정: 샘과 진의 자리, 사람·낙타·장막의 수, 물가에서 마시는 모습의 표현, 세 무리가 선 자리.
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  BO3D.scene3d = BO3D.scene3d || {};
  BO3D.scene3d['OT-21'] = function (api) {
    var T = THREE, M2 = BO3D.models2 || {}, MO = BO3D.models || {}, PR = BO3D.props, FX = api.FX, R = PR.rng(2107);
    function sm(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
    function hash(ix, iz) { var n = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453; return n - Math.floor(n); }
    function noise(x, z) {
      var ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
      var a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    var SPRING = [-2, 10], ICAMP = [-14, 32], MCAMP = [0, -62];
    function height(x, z) {
      var h = 6 * sm(-30, 20, z) + 0.8 * noise(x * 0.05 + 2, z * 0.05 + 7);                /* 남쪽이 높고 북쪽 골짜기가 낮다 */
      h -= 1.4 * sm(5.5, 2.5, Math.hypot(x - SPRING[0], z - SPRING[1]));                   /* 샘 */
      h += sm(-110, -170, z) * 26 * (0.6 + 0.5 * noise(x * 0.02, 3)) + sm(110, 200, Math.abs(x)) * 10 * noise(2, z * 0.02);   /* 모레 산 */
      return h;
    }
    function walkable(x, z) { return x >= 18 && x <= 56 && z >= -6 && z <= 40; }

    var scene = new T.Scene();
    scene.background = new T.Color('#EFE6CC'); scene.fog = new T.Fog('#ECE2C6', 70, 330);
    var skyG = new T.SphereGeometry(560, 24, 14), sp = skyG.attributes.position, sc = new Float32Array(sp.count * 3), cc = new T.Color(), top = new T.Color('#7EB0D2'), hor = new T.Color('#F2E8CC'), i;
    for (i = 0; i < sp.count; i++) { var tt = Math.max(0, sp.getY(i) / 560); cc.copy(hor).lerp(top, sm(0.02, 0.7, tt)); sc[i * 3] = cc.r; sc[i * 3 + 1] = cc.g; sc[i * 3 + 2] = cc.b; }
    skyG.setAttribute('color', new T.BufferAttribute(sc, 3));
    var skyM = new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false }); scene.add(new T.Mesh(skyG, skyM));
    var starG = new T.BufferGeometry(), stp = []; for (i = 0; i < 500; i++) { var sa = R() * 6.28, se = 0.1 + R() * 1.3; stp.push(Math.cos(sa) * Math.cos(se) * 520, Math.sin(se) * 520, Math.sin(sa) * Math.cos(se) * 520); }
    starG.setAttribute('position', new T.Float32BufferAttribute(stp, 3)); var starM = new T.PointsMaterial({ color: '#FFF6D8', size: 1.8, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }); scene.add(new T.Points(starG, starM));
    var g = new T.PlaneGeometry(520, 520, 170, 170); g.rotateX(-Math.PI / 2);
    var pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color(), g1 = new T.Color('#9DAA62'), g2 = new T.Color('#B6B474'), rk = new T.Color('#A69A86'), wet = new T.Color('#7A7A58');
    for (i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i), y = height(x, z); pos.setY(i, y);
      c.copy(g1).lerp(g2, noise(x * 0.07, z * 0.07)); if (y > 12) c.lerp(rk, sm(12, 24, y) * 0.7);
      if (Math.hypot(x - SPRING[0], z - SPRING[1]) < 7) c.lerp(wet, 0.5);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals();
    var ground = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 })); ground.receiveShadow = true; scene.add(ground);
    var hemi = new T.HemisphereLight('#DCEFF2', '#9FA86A', 0.64); scene.add(hemi);
    var sun = new T.DirectionalLight('#FFF0CF', 0.76); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    var ss = sun.shadow.camera; ss.left = -26; ss.right = 26; ss.top = 26; ss.bottom = -26; ss.near = 1; ss.far = 150; sun.shadow.bias = -0.0015;
    scene.add(sun); scene.add(sun.target);
    function put(o, x, z, lift) { o.position.set(x, height(x, z) + (lift || 0), z); scene.add(o); return o; }
    function std(cl) { return new T.MeshStandardMaterial({ color: cl, flatShading: true, roughness: 0.95 }); }
    if (MO.shrub) for (i = 0; i < 60; i++) { var sh = MO.shrub(260 + i), hx = -140 + R() * 280, hz = -120 + R() * 200; if (Math.hypot(hx - SPRING[0], hz - SPRING[1]) < 9 || (hx > 16 && hx < 58 && hz > -8 && hz < 42)) continue; put(sh, hx, hz, -0.05); }
    /* 하롯 샘(7:1) */
    var springW = null; try { if (M2.waterSurface) springW = M2.waterSurface(9, 7); } catch (e) { springW = null; }
    if (!springW) { var sw = new T.Mesh(new T.PlaneGeometry(9, 7), new T.MeshStandardMaterial({ color: '#4E8FA6', transparent: true, opacity: 0.85 })); sw.rotation.x = -Math.PI / 2; springW = { mesh: sw, update: function () {} }; }
    springW.mesh.position.set(SPRING[0], height(SPRING[0], SPRING[1]) + 0.45, SPRING[1]); scene.add(springW.mesh);
    /* 이스라엘 사람들의 장막(7:8)과 미디안의 장막(6:5), 낙타(7:12) */
    for (i = 0; i < 26; i++) { var tn = PR.tent(i + 400); put(tn, ICAMP[0] + (R() - 0.5) * 44, ICAMP[1] + R() * 20); tn.rotation.y = R() * 6.28; }
    var mtents = [];
    for (i = 0; i < 46; i++) { var mt = PR.tent(i + 470); mt.scale.setScalar(1.15); put(mt, MCAMP[0] + (R() - 0.5) * 110, MCAMP[1] + (R() - 0.5) * 44); mt.rotation.y = R() * 6.28; mtents.push(mt); }
    var camelM = std('#B08A5E'), camels = new T.Group();
    for (i = 0; i < 44; i++) {
      var cm = new T.Group(), bd = new T.Mesh(new T.BoxGeometry(0.7, 0.55, 1.5), camelM), hm = new T.Mesh(new T.SphereGeometry(0.32, 6, 4), camelM), nk = new T.Mesh(new T.BoxGeometry(0.22, 0.9, 0.24), camelM), hd = new T.Mesh(new T.BoxGeometry(0.26, 0.24, 0.5), camelM);
      bd.position.y = 0.32; hm.position.set(0, 0.68, -0.05); nk.position.set(0, 0.78, 0.82); nk.rotation.x = 0.5; hd.position.set(0, 1.16, 1.05); cm.add(bd); cm.add(hm); cm.add(nk); cm.add(hd);
      var cx2 = MCAMP[0] + (R() - 0.5) * 120, cz2 = MCAMP[1] + (R() - 0.5) * 50; cm.position.set(cx2, height(cx2, cz2), cz2); cm.rotation.y = R() * 6.28; camels.add(cm);   /* 엎드려 누운 낙타 */
    }
    scene.add(camels);
    /* 골짜기에 누운 사람들(7:12): 멀리서 보이는 꼴. 달아날 때(7:21) 일어나 북쪽으로 */
    var midian = [];
    for (i = 0; i < 40; i++) { var mm = PR.soldier(i + 700, ['#7A4A3A', '#6E5A3A', '#8A5A3E'][i % 3], null); mm.home = [MCAMP[0] + (R() - 0.5) * 100, MCAMP[1] + (R() - 0.5) * 36]; put(mm.group, mm.home[0], mm.home[1], 0.1); mm.group.rotation.x = -1.45; mm.group.rotation.y = R() * 6; midian.push(mm); }
    /* 이스라엘 백성(7:1-8): 많이 모였다가 돌아가고, 물가로 내려가고, 서른(삼백 명의 표시)이 남는다 */
    var men = [], N = 60;
    for (i = 0; i < N; i++) {
      var o = null; try { if (M2.israelite) o = M2.israelite(i * 7 + 19); } catch (e) { o = null; }
      if (!o) o = PR.soldier(i, '#7A6A4A', null);
      o.k = i; o.keep = i % 2 === 0; o.chosen = i % 2 === 0;   /* 반쯤은 7:3에서 돌아가고(실제는 셋 가운데 둘), 남은 이들 가운데 서른이 삼백 명을 나타낸다 */
      o.home = [ICAMP[0] + (i % 12) * 2.6 - 14, ICAMP[1] - 8 + Math.floor(i / 12) * 2.2]; o.leave = [o.home[0] - 30 - hash(i, 2) * 20, o.home[1] + 60];
      o.water = [SPRING[0] + Math.cos(i * 0.21) * 5.4, SPRING[1] + Math.sin(i * 0.21) * 4.4];
      var grp = i % 3, ang = [-0.9, 0, 0.9][grp] + (hash(i, 4) - 0.5) * 0.35, rad = 48 + hash(i, 6) * 6;
      o.ring = [MCAMP[0] + Math.sin(ang) * rad, MCAMP[1] + Math.cos(ang) * rad * 0.62];
      o.three = [ICAMP[0] - 14 + grp * 12 + (i % 4) * 1.4, ICAMP[1] - 14 + (hash(i, 8) - 0.5) * 3];
      put(o.group, o.home[0], o.home[1]); o.at = o.home.slice();
      var jar = new T.Mesh(new T.SphereGeometry(0.13, 6, 5), std('#B88A5A')); jar.position.set(-0.3, 1.0, 0.18); jar.visible = false; o.group.add(jar); o.jar = jar;
      var horn = new T.Mesh(new T.ConeGeometry(0.05, 0.42, 5), std('#D8C7A0')); horn.position.set(0.3, 1.25, 0.2); horn.rotation.x = -1; horn.visible = false; o.group.add(horn); o.horn = horn;
      var fl = new T.Mesh(new T.ConeGeometry(0.1, 0.36, 6), new T.MeshBasicMaterial({ color: '#FFB040', fog: false })); fl.position.set(-0.3, 1.75, 0.2); fl.visible = false; o.group.add(fl); o.flame = fl;
      men.push(o);
    }
    /* 기드온(Blender)과 부라 */
    var GID = [8, 20], gid = { group: api.fallback('#6A5A3A', 1.75, 0.27), update: function () {} }; put(gid.group, GID[0], GID[1]); gid.group.rotation.y = Math.PI;
    api.person('gideon', function (nm) { nm.group.position.copy(gid.group.position); nm.group.rotation.y = gid.group.rotation.y; scene.remove(gid.group); scene.add(nm.group); gid = nm; });
    var purah = null; try { purah = M2.israelite ? M2.israelite(901) : null; } catch (e) { purah = null; } if (!purah) purah = PR.soldier(901, '#6E5A44', null); put(purah.group, GID[0] + 1.6, GID[1] + 0.8); purah.group.rotation.y = Math.PI;
    var torchLights = [0, 1, 2].map(function (k) { var l = new T.PointLight('#FFA040', 0, 22, 2); scene.add(l); return l; });   /* 횃불 무리 둘레만 밝힌다(진이 타는 것처럼 보이지 않게) */

    var phase = 'camp', night = 0, nightWant = 0, gidTo = null, flee = 0;
    var ca = new T.Color(), cb = new T.Color();
    function applyNight() {
      ca.set('#EFE6CC'); cb.set('#141C34'); ca.lerp(cb, night); scene.background.copy(ca); scene.fog.color.copy(ca);
      ca.set('#FFFFFF'); cb.set('#26315A'); skyM.color.copy(ca.lerp(cb, night)); hemi.intensity = 0.64 - 0.3 * night; sun.intensity = 0.76 - 0.56 * night; starM.opacity = night * 0.9;
    }
    function setPhase(p) {
      phase = p;
      if (p === 'camp') { night = 0; nightWant = 0; applyNight(); flee = 0; gidTo = null; gid.group.position.set(GID[0], height(GID[0], GID[1]), GID[1]); purah.group.position.set(GID[0] + 1.6, height(GID[0] + 1.6, GID[1] + 0.8), GID[1] + 0.8);
        men.forEach(function (o) { o.group.visible = true; o.target = o.home; o.kneel = 0; o.jar.visible = o.horn.visible = o.flame.visible = false; o.group.position.set(o.home[0], height(o.home[0], o.home[1]), o.home[1]); });
        midian.forEach(function (m) { m.group.visible = true; m.group.rotation.x = -1.45; m.group.position.set(m.home[0], height(m.home[0], m.home[1]) + 0.1, m.home[1]); }); torchLights.forEach(function (l) { l.intensity = 0; }); }
      if (p === 'leave') { nightWant = 0; men.forEach(function (o) { o.target = o.keep ? o.home : o.leave; }); }                 /* 7:3 */
      if (p === 'water') { nightWant = 0.15; men.forEach(function (o) { o.target = o.keep ? o.water : o.leave; }); }            /* 7:4-8 */
      if (p === 'down') { nightWant = 1; gidTo = [MCAMP[0] + 30, MCAMP[1] + 28]; men.forEach(function (o) { o.kneel = 0; o.target = o.keep && o.chosen ? o.three : o.leave; }); }  /* 7:9-15 */
      if (p === 'jars') { nightWant = 1; gidTo = [ICAMP[0] - 2, ICAMP[1] - 16]; men.forEach(function (o) { o.target = o.keep && o.chosen ? o.three : o.leave; o.jar.visible = o.horn.visible = o.keep && o.chosen; }); } /* 7:16-18 */
      if (p === 'torches') { nightWant = 1; gidTo = [MCAMP[0], MCAMP[1] + 50]; men.forEach(function (o) { o.target = o.keep && o.chosen ? o.ring : o.leave; o.jar.visible = false; o.horn.visible = o.keep && o.chosen; }); } /* 7:19-22 */
    }
    var torchT = -1;
    function step(o, to, spd, dt) { var p = o.group.position, dx = to[0] - p.x, dz = to[1] - p.z, d = Math.hypot(dx, dz); if (d < 0.2) return false; var st = Math.min(d, spd * dt); p.x += dx / d * st; p.z += dz / d * st; p.y = height(p.x, p.z); o.group.rotation.y = Math.atan2(dx, dz); return true; }
    function v3(x, y, z) { return new T.Vector3(x, y, z); }
    if (FX) FX.sortLayers(scene);

    return {
      id: 'OT-21', scene: scene, sun: sun, sunOff: [-30, 50, 32],
      height: height, walkable: walkable,
      edge: function (x, z) {
        if (x < 18) return { who: 'onwoo', text: '진과 샘 쪽으로는 가지 말자. 우리는 지켜보는 사람이야.' };
        if (z < -6) return { who: 'hyu', text: '골짜기 아래로는 내려가지 말자.' };
        return null;
      },
      P: { start: [44, 30], machine: [50, 36], machineRot: -0.8,
        /* 재료가 놓인 곳(quests[i].found): 하롯 샘 쪽(물가에서 떨어진 땅) / 골짜기가 내려다보이는 쪽 / 이스라엘 진 쪽(진 바깥 빈 땅) */
        parts: [[20, 10], [36, -4], [22, 30]], lookSpot: [22, 30],
        look: { focus: SPRING, mid: ICAMP, dy: 1.2, backE: 7, upE: 3.4 } },
      eventLook: function (i) {
        if (i === 2) return { focus: ICAMP, mid: [ICAMP[0] - 20, ICAMP[1] + 20], dy: 1.2, backE: 8, upE: 4 };
        if (i === 3) return { focus: SPRING, mid: SPRING, dy: 0.6, backE: 6, upE: 3 };
        if (i === 4) return { focus: [MCAMP[0] + 20, MCAMP[1] + 10], mid: MCAMP, dy: 1, backE: 8, upE: 4 };
        if (i === 5) return { focus: [ICAMP[0] - 2, ICAMP[1] - 14], mid: [ICAMP[0] - 2, ICAMP[1] - 14], dy: 1, backE: 6, upE: 3 };
        return { focus: MCAMP, mid: MCAMP, dy: 1, backE: 9, upE: 5 };
      },
      detector: '탐지기', askLabel: '탐지기 물음 풀기',
      intro: { text: '타임머신이 높은 비탈에 내려앉았어요. 아래쪽 골짜기에 장막이 가득해요.', say: { who: 'hyu', text: '비탈 위에서만 다니자. 골짜기로는 내려가지 말자.' } },
      lookText: '기드온 이야기를 성경에서 찾아 읽은 뒤 다시 골라 보세요.',
      partBeats: [0, 1], eventStart: 2,
      sceneDoneText: '기드온 장면을 끝까지 지켜봐야 떠날 수 있어요.',
      dex: [
        { id: 'spring', name: '하롯 샘', desc: '기드온과 백성이 진을 친 곳 곁의 샘', ref: '삿 7:1', hint: '진 아래쪽을 보세요.', range: 60, pos: function () { return v3(SPRING[0], height(SPRING[0], SPRING[1]) + 0.6, SPRING[1]); } },
        { id: 'midian', name: '미디안의 진', desc: '모레 산 앞 골짜기에 메뚜기 떼처럼 많이 누운 사람들과 셀 수 없는 낙타', ref: '삿 7:12', hint: '북쪽 골짜기를 담아 보세요.', range: 200, crop: 0.7, pos: function () { return v3(MCAMP[0], height(MCAMP[0], MCAMP[1]) + 1, MCAMP[1]); } },
        { id: 'gideon', name: '기드온', desc: '요아스의 아들. 삼백 명을 세 무리로 나눈 사람', ref: '삿 7:16', hint: '진 앞쪽에서 찾아보세요.', range: 50, crop: 0.36, pos: function () { var p = gid.group.position; return v3(p.x, p.y + 1.1, p.z); } }
      ],
      reset: function () { setPhase('camp'); },
      partFound: function () {},
      partContinue: function () {},
      lookupPose: function () {},
      /* 대목 번호(OT-21.json): 2 = 7:1-3, 3 = 7:4-8, 4 = 7:9-15, 5 = 7:16-18, 6 = 7:19-22 */
      beatPose: function (i) { setPhase(i <= 1 ? 'camp' : ['', '', 'leave', 'water', 'down', 'jars', 'torches'][i]); torchT = i === 6 ? 0 : -1; },
      update: function (dt, now) {
        if (Math.abs(night - nightWant) > 0.003) { night += (nightWant - night) * Math.min(1, dt * 0.5); applyNight(); }
        men.forEach(function (o, k) {
          var to = o.target || o.home, mv = step(o, to, to === o.leave ? 4.4 : 3.8, dt);
          if (to === o.leave) { var dl = Math.hypot(o.group.position.x - o.leave[0], o.group.position.z - o.leave[1]); o.group.visible = dl > 2; }
          /* 7:5-6: 물가에 이른 뒤, 삼백 명(chosen)은 서서 손을 입에 대고, 나머지는 무릎을 꿇는다 */
          var atW = to === o.water && !mv; o.group.rotation.x = 0; if (atW) { o.group.position.y = height(o.group.position.x, o.group.position.z) - (o.chosen ? 0 : 0.45); o.group.rotation.x = o.chosen ? 0.25 : 0.1; o.group.rotation.y = Math.atan2(SPRING[0] - o.group.position.x, SPRING[1] - o.group.position.z); }
          if (o.update) o.update(dt, mv ? 1.1 : 0);
          o.flame.visible = torchT > 1.2 && o.keep && o.chosen;
        });
        if (gidTo) { var gm = step(gid, gidTo, 2.8, dt); if (gid.update) gid.update(dt, gm); purah.group.position.set(gid.group.position.x + 1.4, height(gid.group.position.x + 1.4, gid.group.position.z + 0.8), gid.group.position.z + 0.8); purah.group.rotation.y = gid.group.rotation.y; if (purah.update) purah.update(dt, gm ? 1 : 0); }
        else if (gid.update) gid.update(dt, false);
        /* 7:19-22: 횃불이 진을 둘러 서고, 미디안 사람들은 일어나 달아난다(멀리서) */
        if (torchT >= 0) {
          torchT += dt;
          torchLights.forEach(function (l, k) { var a = [-0.9, 0, 0.9][k]; l.position.set(MCAMP[0] + Math.sin(a) * 51, height(MCAMP[0], MCAMP[1]) + 3, MCAMP[1] + Math.cos(a) * 32); l.intensity = torchT > 1.2 ? 0.7 + Math.sin(now * 8 + k) * 0.1 : 0; });
          if (torchT > 3) { flee = Math.min(1, flee + dt * 0.12); midian.forEach(function (m) { m.group.rotation.x = 0; m.group.position.set(m.home[0], height(m.home[0], m.home[1] - flee * 80), m.home[1] - flee * 80); m.group.rotation.y = Math.PI; m.update(dt, 1, now); m.group.visible = flee < 0.85; }); }
        }
        if (springW.update) springW.update(now);
      },
      audio: function (A) { A.setFlock(999); A.setFire(999); },
      menuCam: function (camera, now) { var a = now * 0.05; camera.position.set(40 + Math.sin(a) * 8, 14, 34); camera.lookAt(MCAMP[0], 0, MCAMP[1] + 20); },
      debug: { phase: function () { return { phase: phase, night: night, flee: flee, torch: torchT }; }, arrived: function () { return phase !== 'camp'; } }
    };
  };
})();
