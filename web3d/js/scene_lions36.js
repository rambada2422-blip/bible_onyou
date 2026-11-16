/* 3D 장면 설정: OT-36 사자 굴의 다니엘 (단 6:1-28).
 * 간접 연출(규칙서 13.8, 2026-11-16, 감수 전): 굴을 봉한 밤에 합성 낮은 고동(긴장). 사자의 모습과 소리는 만들지 않는다(6:22). 움직임 줄이기 설정이면 흔들지 않는다.
 * 방향: 아이들은 남쪽 빈터(+Z)에 있고, 북쪽에 왼쪽부터 왕궁(서), 사자 굴(가운데), 다니엘의 집(동)이 있다. 다니엘의 집 위층 방의 창은 예루살렘 쪽(서쪽)으로 열려 있다(6:10).
 * 본문에 맞춘 점 (content/ot/OT-36.json design3d)
 *  - 창가의 다니엘은 멀리서만 보인다(가까이 들여다보지 않는다). 기도의 말은 지어내지 않는다.
 *  - 해 질 때까지 왕이 근심하고(6:14), 다니엘을 굴에 넣은 뒤 돌로 어귀를 막고 도장을 찍는다(6:16-17). 밤(6:18), 이튿날 새벽(6:19).
 *  - 굴은 땅의 구덩이와 어귀(본문은 크기·깊이·사자의 수를 말하지 않는다). 굴 안은 보이지 않는다. 사자의 입을 막는 손·빛·천사는 그리지 않는다.
 *  - 다니엘이 굴에서 올려지고 몸에 상한 데가 없다(6:23). 6:24의 일은 그리지 않는다(글로만).
 * 감수가 필요한 설정: 왕궁·굴·집의 자리와 생김새, 도시, 사람 수, 굴의 생김새(구덩이와 어귀를 막는 돌), 다니엘과 왕의 생김새,
 *   사자를 보이지 않게 한 것(6:16, 6:22), 다니엘을 굴에서 올린 사람들(6:23)을 그리지 않고 어귀 가장자리에서 올라오게 한 것.
 * 세 아이는 남쪽 빈터에서만 다닌다. 굴과 집과 왕궁 가까이에 가지 않는다(목격자).
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  BO3D.scene3d = BO3D.scene3d || {};
  BO3D.scene3d['OT-36'] = function (api) {
    var T = THREE, M2 = BO3D.models2 || {}, MO = BO3D.models || {}, PR = BO3D.props, FX = api.FX, R = PR.rng(3606);
    function sm(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
    function hash(ix, iz) { var n = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453; return n - Math.floor(n); }
    function noise(x, z) {
      var ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
      var a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    var PALACE = [-40, -46], DEN = [0, -40], HOUSE = [38, -34];
    function height(x, z) {
      var h = 0.3 * noise(x * 0.05 + 2, z * 0.05 + 5) + sm(120, 220, Math.hypot(x, z)) * 10 * noise(x * 0.02, z * 0.02);
      var dd = Math.hypot(x - DEN[0], z - DEN[1]); h += 1.6 * sm(9, 4, dd);   /* 굴 둘레의 바위 둔덕 */
      return h;
    }
    function walkable(x, z) { return x >= -24 && x <= 46 && z >= -6 && z <= 34; }

    var scene = new T.Scene();
    scene.background = new T.Color('#F1E3C2'); scene.fog = new T.Fog('#EEDDBA', 70, 300);
    var skyG = new T.SphereGeometry(560, 24, 14), sp = skyG.attributes.position, sc = new Float32Array(sp.count * 3), cc = new T.Color(), top = new T.Color('#79AFCF'), hor = new T.Color('#F4E6C4'), i;
    for (i = 0; i < sp.count; i++) { var tt = Math.max(0, sp.getY(i) / 560); cc.copy(hor).lerp(top, sm(0.02, 0.7, tt)); sc[i * 3] = cc.r; sc[i * 3 + 1] = cc.g; sc[i * 3 + 2] = cc.b; }
    skyG.setAttribute('color', new T.BufferAttribute(sc, 3));
    var skyM = new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false }); scene.add(new T.Mesh(skyG, skyM));
    var starG = new T.BufferGeometry(), stp = []; for (i = 0; i < 500; i++) { var sa = R() * 6.28, se = 0.1 + R() * 1.3; stp.push(Math.cos(sa) * Math.cos(se) * 520, Math.sin(se) * 520, Math.sin(sa) * Math.cos(se) * 520); }
    starG.setAttribute('position', new T.Float32BufferAttribute(stp, 3)); var starM = new T.PointsMaterial({ color: '#FFF6D8', size: 1.8, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }); scene.add(new T.Points(starG, starM));
    var g = new T.PlaneGeometry(520, 520, 150, 150); g.rotateX(-Math.PI / 2);
    var pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color(), s1 = new T.Color('#D9BE88'), s2 = new T.Color('#CBAE78'), rk = new T.Color('#9A8E7C'), path = new T.Color('#E2CC9C');
    for (i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i), y = height(x, z); pos.setY(i, y);
      c.copy(s1).lerp(s2, noise(x * 0.08, z * 0.08)); if (Math.hypot(x - DEN[0], z - DEN[1]) < 9) c.lerp(rk, 0.7);
      if (Math.abs(z + 26) < 2.5 && x > -46 && x < 44) c.lerp(path, 0.6);
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
    /* 도시의 집들(멀리), 왕궁(6:18), 다니엘의 집(6:10) */
    var wallM = [std('#E2C090'), std('#D6AE7C'), std('#EACB9A')];
    for (i = 0; i < 40; i++) { var hx = -140 + R() * 280, hz = -140 - R() * 90; var hw = 5 + R() * 6, hh = 3 + R() * 5, hs = new T.Mesh(new T.BoxGeometry(hw, hh, 4 + R() * 5), wallM[i % 3]); hs.castShadow = true; put(hs, hx, hz, hh / 2); }
    var palace = new T.Group(), pm = std('#D9B87E'), pm2 = std('#C9A26A');
    var base = new T.Mesh(new T.BoxGeometry(34, 2, 22), pm2); base.position.y = 1; palace.add(base);
    var hall = new T.Mesh(new T.BoxGeometry(28, 9, 16), pm); hall.position.y = 6.5; hall.castShadow = true; palace.add(hall);
    for (i = 0; i < 8; i++) { var cl = new T.Mesh(new T.CylinderGeometry(0.6, 0.7, 9, 8), std('#EAD7AA')); cl.position.set(-12 + i * 3.4, 6.5, 8.6); palace.add(cl); }
    var roof = new T.Mesh(new T.BoxGeometry(30, 1, 18), pm2); roof.position.y = 11.5; palace.add(roof);
    put(palace, PALACE[0], PALACE[1]);
    var house = new T.Group(), hm1 = std('#E6CC9E'), hdark = std('#3E2E22');
    var h1 = new T.Mesh(new T.BoxGeometry(9, 4.5, 8), hm1); h1.position.y = 2.25; h1.castShadow = true; house.add(h1);
    var h2 = new T.Mesh(new T.BoxGeometry(6, 3.5, 6), hm1); h2.position.set(-1, 6.25, 0); h2.castShadow = true; house.add(h2);   /* 위층 방 */
    var win = new T.Mesh(new T.BoxGeometry(0.2, 1.4, 1.6), std('#2E241C')); win.position.set(-4.05, 6.4, 0); house.add(win);   /* 서쪽(예루살렘 쪽)으로 열린 창. 특별한 빛으로 읽히지 않게 어두운 창으로 둔다 */
    var dr = new T.Mesh(new T.BoxGeometry(0.2, 2.4, 1.4), hdark); dr.position.set(-4.55, 1.2, 2); house.add(dr);
    put(house, HOUSE[0], HOUSE[1]);
    /* 사자 굴(6:16-17): 바위 둔덕의 어귀. 굴 안은 보이지 않는다. 어귀를 막는 돌 */
    var den = new T.Group(), rockM = std('#8E8272');
    for (i = 0; i < 14; i++) { var a = i / 14 * 6.28, rs = new T.Mesh(new T.DodecahedronGeometry(1.4 + R() * 0.8, 0), rockM); rs.position.set(Math.cos(a) * 4.2, 0.6, Math.sin(a) * 4.2); rs.rotation.set(R() * 3, R() * 3, 0); rs.castShadow = true; den.add(rs); }
    var hole = new T.Mesh(new T.CircleGeometry(2.6, 20), new T.MeshBasicMaterial({ color: '#120E0A' })); hole.rotation.x = -Math.PI / 2; hole.position.y = 0.9; den.add(hole);
    put(den, DEN[0], DEN[1]);
    var stone = new T.Mesh(new T.CylinderGeometry(2.9, 3.1, 0.9, 14), std('#A89C88')); stone.castShadow = true; scene.add(stone);
    var STONE_OFF = [DEN[0] + 7, DEN[1] + 2], stoneOn = 0, stoneWant = 0;
    var sealM = new T.MeshStandardMaterial({ color: '#8E3A2E' }), seal = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 0.08, 10), sealM); seal.visible = false; scene.add(seal);   /* 도장 자국 */
    if (MO.rock) for (i = 0; i < 30; i++) { var ro = MO.rock(2100 + i); ro.scale.multiplyScalar(0.5 + R() * 1.0); var rx = -120 + R() * 240, rz = -100 + R() * 160; if (Math.hypot(rx - DEN[0], rz - DEN[1]) < 14 || (rx > -26 && rx < 48 && rz > -8 && rz < 36)) continue; put(ro, rx, rz, -0.1); }

    /* 다니엘(Blender), 다리오 왕(Blender), 총리와 방백들, 다니엘을 데려가는 사람들 */
    var dan = { group: api.fallback('#4E5E7E', 1.75, 0.27), update: function () {} }, king = { group: api.fallback('#7A3E4E', 1.75, 0.27), update: function () {} };
    var DAN0 = [HOUSE[0] - 6, HOUSE[1] + 6], KING0 = [PALACE[0] + 4, PALACE[1] + 14];
    put(dan.group, DAN0[0], DAN0[1]); put(king.group, KING0[0], KING0[1]);
    api.person('daniel', function (nm) { nm.group.position.copy(dan.group.position); nm.group.rotation.y = dan.group.rotation.y; nm.group.visible = dan.group.visible; scene.remove(dan.group); scene.add(nm.group); dan = nm; });
    api.person('darius', function (nm) { nm.group.position.copy(king.group.position); nm.group.rotation.y = king.group.rotation.y; scene.remove(king.group); scene.add(nm.group); king = nm; });
    var officials = [];
    for (i = 0; i < 8; i++) { var of = PR.soldier(i + 900, ['#6E4A5A', '#5A5A3E', '#7A5A3A'][i % 3], null, { spear: false }); of.home = [PALACE[0] + 16 + (i % 4) * 1.6, PALACE[1] + 16 + Math.floor(i / 4) * 1.6]; put(of.group, of.home[0], of.home[1]); officials.push(of); }

    var phase = 'day', tod = 0, todWant = 0, danTo = null, kingTo = null, danIn = false, lift = 0, liftWant = 0, offTo = null, accT = 0, offHide = false;
    var ca = new T.Color(), cb = new T.Color();
    var TOD = [['#F1E3C2', '#FFFFFF', 0.64, 0.74, '#FFF0CF'], ['#E8B49A', '#E8B8A0', 0.5, 0.45, '#FFB078'], ['#141C34', '#26315A', 0.34, 0.16, '#9FB4E0'], ['#E2C2B6', '#F0C8B8', 0.52, 0.5, '#FFD0A0']];
    function applyTod() {
      var a = Math.min(2, Math.floor(tod)), t = tod - a, A = TOD[a], B = TOD[Math.min(3, a + 1)];
      ca.set(A[0]); cb.set(B[0]); ca.lerp(cb, t); scene.background.copy(ca); scene.fog.color.copy(ca);
      ca.set(A[1]); cb.set(B[1]); skyM.color.copy(ca.lerp(cb, t)); hemi.intensity = A[2] + (B[2] - A[2]) * t; sun.intensity = A[3] + (B[3] - A[3]) * t; ca.set(A[4]); cb.set(B[4]); sun.color.copy(ca.lerp(cb, t));
      starM.opacity = Math.max(0, 1 - Math.abs(tod - 2)) * 0.9;
    }
    /* 대목마다 모든 상태를 처음부터 정한다('이전'으로 돌아와도 뒤 대목의 것이 남지 않게) */
    function at(o, x, z) { o.group.position.set(x, height(x, z), z); }
    function setPhase(p) {
      phase = p; if (FX) FX.audio.pulse(false);
      stoneWant = 0; stoneOn = 0; seal.visible = false; danIn = false; lift = 0; liftWant = 0; danTo = null; kingTo = null; offTo = null; accT = 0; offHide = false;
      dan.group.visible = true; at(dan, DAN0[0], DAN0[1]); at(king, KING0[0], KING0[1]); king.group.visible = true;
      officials.forEach(function (o) { o.group.visible = true; at(o, o.home[0], o.home[1]); });
      if (p === 'day') { tod = 0; todWant = 0; applyTod(); }
      if (p === 'window') { todWant = 0.2; dan.group.visible = false; }                                  /* 6:10: 위층 방(창 너머, 멀리서) */
      if (p === 'accuse') { todWant = 1; dan.group.visible = false; offTo = [HOUSE[0] - 14, HOUSE[1] + 8]; }   /* 6:11-15: 모여 발견하고(집 앞), 왕에게 나아간다(왕궁 앞). 해 질 때까지 */
      if (p === 'den') { todWant = 2; at(dan, DEN[0] + 16, DEN[1] + 9); danTo = [DEN[0] + 3.2, DEN[1] + 1]; at(king, DEN[0] - 14, DEN[1] + 9); kingTo = [DEN[0] - 6, DEN[1] + 6];   /* 6:16-18: 끌어다가 굴에 던져 넣는다(굴로 가는 길 중간부터 보여 준다) */
        officials.forEach(function (o, k) { at(o, DEN[0] + 16 + (k % 4) * 1.2 - 1.8, DEN[1] + 10.4 + Math.floor(k / 4) * 1.2); }); }
      if (p === 'dawn') { todWant = 3; danIn = true; dan.group.visible = false; stoneWant = 1; stoneOn = 1; seal.visible = true; kingTo = [DEN[0] - 4, DEN[1] + 4]; offHide = true; } /* 6:19-23: 새벽에 왕이 왕궁에서 급히 굴로 */
      if (p === 'decree') { todWant = 3; at(dan, DEN[0] - 2, DEN[1] + 6); dan.group.rotation.y = Math.PI * 0.2; at(king, DEN[0] - 4, DEN[1] + 4); kingTo = [KING0[0], KING0[1]]; offHide = true; } /* 6:24-28: 참소한 사람들의 일은 그리지 않는다 */
      if (offHide) officials.forEach(function (o) { o.group.visible = false; });
    }
    var denT = -1, dawnT = -1, dawnArr = 0;
    function step(o, to, spd, dt) { var p = o.group.position, dx = to[0] - p.x, dz = to[1] - p.z, d = Math.hypot(dx, dz); if (d < 0.2) return false; var st = Math.min(d, spd * dt); p.x += dx / d * st; p.z += dz / d * st; p.y = height(p.x, p.z); o.group.rotation.y = Math.atan2(dx, dz); return true; }
    function v3(x, y, z) { return new T.Vector3(x, y, z); }
    if (FX) FX.sortLayers(scene);

    return {
      id: 'OT-36', scene: scene, sun: sun, sunOff: [-30, 50, 30],
      height: height, walkable: walkable,
      edge: function (x, z) {
        if (z < -6) return { who: 'onwoo', text: '굴과 집 쪽으로는 가지 말자. 우리는 멀리서 지켜보는 사람이야.' };
        return { who: 'hyu', text: '이 빈터 안에서만 다니자.' };
      },
      P: { start: [24, 24], machine: [30, 30], machineRot: -0.6,
        /* 재료가 놓인 곳(quests[i].found): 다니엘의 집 쪽(길가) / 사자 굴 어귀 쪽(멀찍이) / 왕궁에서 굴로 가는 쪽 */
        parts: [[36, -2], [4, -2], [-18, -2]], lookSpot: [-18, -2],
        look: { focus: DEN, mid: [-10, -30], dy: 1.4, backE: 7, upE: 4 } },
      eventLook: function (i) {
        if (i === 2) return { focus: HOUSE, mid: HOUSE, dy: 5, backE: 7, upE: 3 };
        if (i === 3) return { focus: [HOUSE[0] - 14, HOUSE[1] + 8], mid: PALACE, dy: 2, backE: 8, upE: 4 };
        return { focus: DEN, mid: DEN, dy: 1.4, backE: 7, upE: 4 };
      },
      detector: '탐지기', askLabel: '탐지기 물음 풀기',
      intro: { text: '타임머신이 큰 도시 바깥의 빈터에 내려앉았어요. 멀리 왕궁이 보여요.', say: { who: 'hyu', text: '빈터 안에서만 다니자. 집과 왕궁에는 가까이 가지 말자.' } },
      lookText: '다니엘 이야기를 성경에서 찾아 읽은 뒤 다시 골라 보세요.',
      partBeats: [0, 1], eventStart: 2,
      sceneDoneText: '사자 굴 장면을 끝까지 지켜봐야 떠날 수 있어요.',
      dex: [
        { id: 'house', name: '다니엘의 집', desc: '위층 방에 예루살렘 쪽으로 열린 창이 있는 집', ref: '단 6:10', hint: '동쪽(오른쪽)을 보세요.', range: 90, crop: 0.5, pos: function () { return v3(HOUSE[0], height(HOUSE[0], HOUSE[1]) + 5, HOUSE[1]); } },
        { id: 'den', name: '사자 굴', desc: '사람을 던져 넣고 어귀를 돌로 막은 굴', ref: '단 6:16-17', hint: '가운데 바위 둔덕을 보세요.', range: 70, crop: 0.4, pos: function () { return v3(DEN[0], height(DEN[0], DEN[1]) + 1, DEN[1]); } },
        { id: 'king', name: '다리오 왕', desc: '조서에 도장을 찍고, 이튿날 새벽에 급히 사자 굴로 간 왕', ref: '단 6:9, 6:19', hint: '왕궁 앞에서 찾아보세요.', range: 60, crop: 0.36, pos: function () { var p = king.group.position; return v3(p.x, p.y + 1.1, p.z); } }
      ],
      reset: function () { setPhase('day'); },
      partFound: function () {},
      partContinue: function () {},
      lookupPose: function () {},
      /* 대목 번호(OT-36.json): 2 = 6:10, 3 = 6:11-15, 4 = 6:16-18, 5 = 6:19-23, 6 = 6:24-28 */
      beatPose: function (i) { setPhase(i <= 1 ? 'day' : ['', '', 'window', 'accuse', 'den', 'dawn', 'decree'][i]); denT = i === 4 ? 0 : -1; dawnT = i === 5 ? 0 : -1; dawnArr = 0; },
      update: function (dt, now) {
        if (Math.abs(tod - todWant) > 0.003) { tod += (todWant - tod) * Math.min(1, dt * 0.6); applyTod(); }
        if (danTo && dan.group.visible) { var dm = step(dan, danTo, 2.6, dt); if (dan.update) dan.update(dt, dm); if (!dm && phase === 'den') { dan.group.visible = false; danIn = true; danTo = null; } } else if (dan.update) dan.update(dt, false);
        /* 6:18: 굴을 봉한 뒤 왕은 궁으로 돌아간다 */
        if (phase === 'den' && seal.visible && denT > 3) kingTo = [KING0[0], KING0[1]];
        if (kingTo) { var km = step(king, kingTo, phase === 'dawn' ? 4.2 : 3, dt); if (king.update) king.update(dt, km); } else if (king.update) king.update(dt, false);
        if (phase === 'accuse') { accT += dt; if (accT > 7) offTo = [KING0[0] + 3, KING0[1] + 2]; }   /* 6:12: 발견한 뒤 왕에게 나아간다 */
        officials.forEach(function (o, k) {
          var to = offTo ? [offTo[0] + (k % 4) * 1.5, offTo[1] + Math.floor(k / 4) * 1.5] : o.home;
          if (phase === 'den') { var dp = dan.group.position; to = dan.group.visible ? [dp.x + (k % 4) * 1.2 - 1.8, dp.z + 1.4 + Math.floor(k / 4) * 1.2] : [DEN[0] + 8 + (k % 4) * 1.5, DEN[1] + 6 + Math.floor(k / 4) * 1.5]; }   /* 다니엘을 데리고 함께 간다 */
          var om = step(o, to, phase === 'den' ? 2.8 : 2.4, dt); o.update(dt, om ? 1 : 0, now);
        });
        /* 6:17: 다니엘이 굴에 들어간 뒤 돌이 어귀를 막고 도장 자국이 남는다 */
        if (denT >= 0) { denT += dt; if (danIn) stoneWant = 1; if (stoneOn > 0.95 && !seal.visible) { seal.visible = true; if (FX) FX.audio.pulse(true); } if (stoneOn > 0.95) seal.visible = true; }   /* 굴을 봉한 밤: 낮은 고동으로 긴장(간접 연출. 사자의 소리·모습은 만들지 않는다, 6:22) */
        stoneOn += (stoneWant - stoneOn) * Math.min(1, dt * 0.8);
        var sx = STONE_OFF[0] + (DEN[0] - STONE_OFF[0]) * stoneOn, sz = STONE_OFF[1] + (DEN[1] - STONE_OFF[1]) * stoneOn;
        stone.position.set(sx, height(sx, sz) + 0.45 + stoneOn * 0.9, sz); stone.rotation.x = stoneOn * 0.4 - 0.4; seal.position.set(DEN[0] + 2.2, stone.position.y + 0.5, DEN[1] + 1.6);
        /* 6:19-23: 새벽, 돌을 치우고 다니엘을 굴에서 올린다 */
        if (dawnT >= 0) {
          dawnT += dt;
          var kp = king.group.position, kArr = Math.hypot(kp.x - (DEN[0] - 4), kp.z - (DEN[1] + 4)) < 0.6;
          if (kArr && dawnT > 2) { if (!dawnArr) dawnArr = dawnT; if (dawnT - dawnArr > 2) { stoneWant = 0; seal.visible = false; } if (dawnT - dawnArr > 4) liftWant = 1; }
          if (liftWant > 0) { lift += (liftWant - lift) * Math.min(1, dt * 0.6); dan.group.visible = lift > 0.05;   /* 굴 어귀 가장자리에서 올라온다(올린 사람들은 그리지 않는다) */
            var lx = DEN[0] + 2.4, lz = DEN[1] + 1.8; dan.group.position.set(lx, height(lx, lz) - 1.4 + lift * 1.4, lz); dan.group.rotation.y = Math.PI * 0.2; if (dan.update) dan.update(dt, false); }
        }
      },
      audio: function (A) { A.setFlock(999); A.setFire(999); },
      menuCam: function (camera, now) { var a = now * 0.05; camera.position.set(10 + Math.sin(a) * 8, 8, 28); camera.lookAt(DEN[0], 2, DEN[1]); },
      debug: { phase: function () { return { phase: phase, tod: tod, stone: stoneOn, lift: lift, danIn: danIn }; }, arrived: function () { return phase !== 'day'; } }
    };
  };
})();
