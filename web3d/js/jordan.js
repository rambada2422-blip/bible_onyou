/* 3D 샘플의 두 번째 장소: 요단 강을 건너는 백성 (여호수아 3:1-17).
 * 타임머신에 이름을 잘못 넣었을 때 도착하는 곳이다. 본문 그대로 보여 주고, 아이가 단서를 찾아 추리한다.
 * 본문에 맞춘 점: 물은 "멀리" 쌓였으므로(수 3:16) 물이 쌓인 곳을 상류 먼 곳에 두고, 가까운 강바닥은 양쪽 다 말라 있다.
 *               궤는 덮개로 덮어 멘다(민 4:5-6). 이 장면에 모세는 없다.
 * 세 아이는 이쪽 둑 위에서만 다닌다. 강바닥과 백성의 행렬 안으로는 들어가지 않는다.
 */
window.BO3D = window.BO3D || {};
(function () {
  'use strict';
  var T = THREE;
  var JP = {
    start: [3, 22], machine: [9, 30], leader: [20.6, 12.4], ark: [2, -6],
    wallX: -118, bedY: -2.4, bankZ: 9.6, maxX: 17, minX: -40, maxZ: 44,
    jericho: [14, -150],
    path: [[42, 62], [31, 26], [27.5, 11], [25.5, 2], [22, -15], [20, -22], [15, -85]]
  };
  function sm(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function hash(ix, iz) { var n = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453; return n - Math.floor(n); }
  function noise(x, z) {
    var ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
    var a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function channel(z) { return sm(8.6, 4.4, z) * sm(-20.6, -16.4, z); }
  function height(x, z) {
    var base = 0.3 + 0.25 * Math.sin(x * 0.09) * Math.cos(z * 0.07) + 0.15 * Math.sin(x * 0.21 + z * 0.13) + 0.3 * noise(x * 0.07 + 3, z * 0.07 + 8);
    base += sm(8.6, 15, z) * 2.2;                                                      /* 아이들이 서는 둑은 조금 높아 강바닥이 내려다보인다 */
    base += sm(47, 85, z) * 9 * (0.6 + 0.5 * noise(x * 0.03, z * 0.03));            /* 뒤쪽 언덕 */
    base += sm(-70, -150, z) * 3.2;                                                   /* 성읍이 선 둔덕 */
    base += sm(-175, -240, z) * 26 * (0.5 + 0.6 * noise(x * 0.02 + 5, 1));            /* 먼 산 */
    base += sm(75, 125, Math.abs(x)) * 7 * (0.5 + 0.6 * noise(1, z * 0.03 + 4));
    var d = channel(z);
    return base * (1 - d) + (JP.bedY + 0.12 * noise(x * 0.3, z * 0.3)) * d;
  }
  function walkable(x, z) { return z >= JP.bankZ && z <= JP.maxZ && x >= JP.minX && x <= JP.maxX; }
  function edge(x, z) { return z < JP.bankZ ? 'river' : (x > JP.maxX ? 'crowd' : 'far'); }

  function terrain() {
    var g = new T.PlaneGeometry(420, 420, 150, 150); g.rotateX(-Math.PI / 2);
    var pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color();
    var green = new T.Color('#8EA85C'), green2 = new T.Color('#A9B66A'), sand = new T.Color('#DCC48E'), bed = new T.Color('#B79C74'), bedWet = new T.Color('#9C8463'), far = new T.Color('#C9B98E'), hill = new T.Color('#A996A6');
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i) - 60; pos.setZ(i, z);
      var y = height(x, z); pos.setY(i, y);
      var d = channel(z), n = noise(x * 0.08 + 2, z * 0.08 + 6);
      c.copy(green).lerp(green2, n);
      c.lerp(sand, sm(0.45, 0.8, noise(x * 0.05 + 9, z * 0.05 + 1)) * 0.7);
      if (z < -24) c.lerp(far, sm(-24, -90, z) * 0.8);
      if (y > 6) c.lerp(hill, sm(6, 22, y));
      if (d > 0.02) c.lerp(n > 0.55 ? bedWet : bed, sm(0.02, 0.6, d));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3));
    g.computeVertexNormals();
    var m = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, metalness: 0 }));
    m.receiveShadow = true;
    return m;
  }
  function sky() {
    var g = new T.SphereGeometry(520, 24, 16), pos = g.attributes.position, col = new Float32Array(pos.count * 3);
    var top = new T.Color('#5E9FCB'), mid = new T.Color('#BFE1E6'), hor = new T.Color('#F1E7C4'), c = new T.Color();
    for (var i = 0; i < pos.count; i++) {
      var t = pos.getY(i) / 520;
      if (t > 0.16) c.copy(mid).lerp(top, sm(0.16, 0.85, t)); else c.copy(hor).lerp(mid, sm(-0.02, 0.16, t));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3));
    return new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false }));
  }
  function box(w, h, d, color) { var m = new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshStandardMaterial({ color: color, flatShading: true })); m.castShadow = true; return m; }
  function simplePerson(color, h) {
    var g = new T.Group(), b = new T.Mesh(new T.CylinderGeometry(0.16, 0.26, h * 0.78, 8), new T.MeshStandardMaterial({ color: color, flatShading: true }));
    b.position.y = h * 0.39; b.castShadow = true; g.add(b);
    var hd = new T.Mesh(new T.SphereGeometry(0.15, 8, 6), new T.MeshStandardMaterial({ color: '#B98A62', flatShading: true })); hd.position.y = h * 0.9; g.add(hd);
    return g;
  }

  function build() {
    var M2 = BO3D.models2 || {}, M = BO3D.models || {};
    var scene = new T.Scene(), ups = [], i, o;
    scene.background = new T.Color('#F1E7C4');
    scene.fog = new T.Fog('#E9E6CC', 70, 330);
    scene.add(sky()); scene.add(terrain());
    scene.add(new T.HemisphereLight('#DCEFF2', '#9FA86A', 0.66));
    var sun = new T.DirectionalLight('#FFF0CF', 0.74);
    sun.position.set(30, 50, 34); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    var sc = sun.shadow.camera; sc.left = -26; sc.right = 26; sc.top = 26; sc.bottom = -26; sc.near = 1; sc.far = 150; sun.shadow.bias = -0.0015;
    scene.add(sun); scene.add(sun.target);
    function put(obj, x, z, lift) { obj.position.set(x, height(x, z) + (lift || 0), z); scene.add(obj); return obj; }
    function safe(name, arg, fb) { try { if (M2[name]) return M2[name](arg); } catch (e) { console.error('model2 ' + name, e); } return fb(); }

    /* 상류 먼 곳에 멈추어 쌓인 물과, 그 뒤로 가득 찬 강물 */
    var wall = null;
    try { if (M2.waterWall) wall = M2.waterWall(30, 11); } catch (e) { console.error(e); }
    if (!wall) { var wm = new T.Mesh(new T.BoxGeometry(6, 11, 30), new T.MeshBasicMaterial({ color: '#4FA3B8', transparent: true, opacity: 0.8, fog: false })); wm.position.set(3, 5.5, 0); var wg = new T.Group(); wg.add(wm); wall = { group: wg, update: function () {} }; }
    wall.group.position.set(JP.wallX, JP.bedY, -6); wall.group.rotation.y = Math.PI; scene.add(wall.group); ups.push(function (dt, t) { wall.update(t); });
    var surf = null;
    try { if (M2.waterSurface) surf = M2.waterSurface(120, 30); } catch (e) { console.error(e); }
    if (!surf) surf = { mesh: new T.Mesh(new T.PlaneGeometry(120, 30).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: '#5DAFC0', transparent: true, opacity: 0.85 })), update: function () {} };
    surf.mesh.position.set(JP.wallX - 62, 0.35, -6); scene.add(surf.mesh); ups.push(function (dt, t) { surf.update(t); });

    /* 강 한가운데 마른 땅에 선 제사장들과 덮개로 덮인 궤 */
    var ark = safe('arkCovered', null, function () { var g = new T.Group(), b = box(0.69, 0.69, 1.14, '#2F5FA8'); b.position.y = 0.345; g.add(b); [-0.42, 0.42].forEach(function (x) { var p = box(0.05, 0.05, 3.4, '#B98A3A'); p.position.set(x, 0.345, 0); g.add(p); }); return g; });
    var priests = [], poleY = 1.42, poleX = 0.42;
    [['L', 1.25], ['R', 1.25], ['L', -1.25], ['R', -1.25]].forEach(function (s) {
      var pr = safe('priestSimple', s[0], function () { return { group: simplePerson('#F3EEE2', 1.72), update: function () {} }; });
      if (pr.group.userData && pr.group.userData.poleY) { poleY = pr.group.userData.poleY; poleX = Math.abs(pr.group.userData.poleX || poleX); }
      var sx = s[0] === 'L' ? -1 : 1;
      pr.side = s[0]; pr.dz = s[1]; priests.push(pr);
      pr.group.rotation.y = Math.PI;
      put(pr.group, JP.ark[0] + sx * 0.62, JP.ark[1] + s[1]);
      ups.push(function (dt) { if (pr.update) pr.update(dt); });
    });
    put(ark, JP.ark[0], JP.ark[1], Math.max(0, poleY - 0.345));
    ark.rotation.y = Math.PI;

    /* 이쪽 둑에서 백성을 이끄는 사람 */
    var leader = safe('leaderSimple', null, function () { return { group: simplePerson('#A8322C', 1.76), update: function () {} }; });
    leader.group.rotation.y = Math.PI; put(leader.group, JP.leader[0], JP.leader[1]);
    ups.push(function (dt) { if (leader.update) leader.update(dt); });

    /* 마른 땅을 밟고 건너는 백성의 긴 행렬 */
    var path = JP.path, segs = [], total = 0;
    for (i = 0; i < path.length - 1; i++) { var dx = path[i + 1][0] - path[i][0], dz = path[i + 1][1] - path[i][1], len = Math.sqrt(dx * dx + dz * dz); segs.push({ a: path[i], dx: dx / len, dz: dz / len, len: len, at: total }); total += len; }
    var crowd = [], N = 46;
    for (i = 0; i < N; i++) {
      (function (k) {
        var per = safe('israelite', k * 7 + 3, function () { return { group: simplePerson(['#8A6A4A', '#5F7350', '#4E5E7A', '#9A4E3C'][k % 4], 1.4 + (k % 5) * 0.08), update: function () {} }; });
        per.s = (k / N) * total + hash(k, 2) * 2; per.off = (hash(k, 5) - 0.5) * 3.4; per.v = 1.05 + hash(k, 9) * 0.3;
        scene.add(per.group); crowd.push(per);
      })(i);
    }
    ups.push(function (dt) {
      crowd.forEach(function (per) {
        per.s = (per.s + per.v * dt) % total;
        var sg = segs[0]; for (var q = 0; q < segs.length; q++) if (per.s >= segs[q].at) sg = segs[q];
        var u = per.s - sg.at, x = sg.a[0] + sg.dx * u - sg.dz * per.off, z = sg.a[1] + sg.dz * u + sg.dx * per.off;
        per.group.position.set(x, height(x, z), z);
        per.group.rotation.y = Math.atan2(sg.dx, sg.dz);
        if (per.update) per.update(dt, per.v);
      });
    });

    /* 건너편 멀리 성읍과 종려나무, 강가의 풀과 곡식밭 */
    var city = safe('jericho', null, function () { var g = new T.Group(), w = box(80, 9, 5, '#B8946A'); w.position.y = 4.5; g.add(w); return g; });
    put(city, JP.jericho[0], JP.jericho[1]);
    var r = BO3D.world ? BO3D.world.rng(909) : function () { return Math.random(); };
    for (i = 0; i < 26; i++) { if (!M2.palm) break; o = M2.palm(i); var px = JP.jericho[0] + (r() * 2 - 1) * 70, pz = JP.jericho[1] + 14 + r() * 40; put(o, px, pz); }
    for (i = 0; i < 9; i++) { if (!M2.palm) break; o = M2.palm(40 + i); put(o, -36 + r() * 46, 12 + r() * 30 + (i % 2 ? 0 : 6)); if (walkable(o.position.x, o.position.z) && Math.abs(o.position.x - JP.start[0]) < 5) o.position.x -= 12; }
    for (i = 0; i < 34; i++) { if (!M2.reeds) break; o = M2.reeds(i); var rx = -70 + r() * 140, side = i % 2; put(o, rx, side ? 8.9 + r() * 0.6 : -21.2 - r() * 0.8); o.rotation.y = r() * 6; }
    for (i = 0; i < 16; i++) { if (!M2.grain) break; o = M2.grain(i); put(o, -74 + (i % 8) * 4.4 - (i < 8 ? 0 : 2), 14 + (i < 8 ? 0 : 4.6)); }
    for (i = 0; i < 18; i++) { if (!M2.grain) break; o = M2.grain(20 + i); put(o, -30 + (i % 9) * 4.4, -30 - (i < 9 ? 0 : 4.6)); }
    if (M.rock) for (i = 0; i < 26; i++) { o = M.rock(300 + i); o.scale.multiplyScalar(0.5 + r() * 0.9); var bx = -60 + r() * 130, bz = -15 + r() * 18; if (Math.abs(bx - JP.ark[0]) < 5 || Math.abs(bx - 24) < 5) continue; put(o, bx, bz, -0.08); }

    /* 탐험대의 타임머신 */
    var machine = null;
    try { if (M.timeMachine) machine = M.timeMachine(); } catch (e) { console.error(e); }
    if (machine) { put(machine.group, JP.machine[0], JP.machine[1]); machine.group.rotation.y = -0.6; ups.push(function (dt, t) { if (machine.update) machine.update(t); }); }

    function v(x, y, z) { return new T.Vector3(x, y, z); }
    var targets = {
      water: { range: 420, crop: 0.42, pos: function () { return v(JP.wallX, JP.bedY + 6, -6); } },
      ark: { range: 46, crop: 0.4, pos: function () { return v(JP.ark[0], JP.bedY + poleY, JP.ark[1]); } },
      leader: { range: 28, crop: 0.4, pos: function () { return v(JP.leader[0], height(JP.leader[0], JP.leader[1]) + 1.1, JP.leader[1]); } },
      people: { range: 75, crop: 0.5, pos: function () { return v(23.5, JP.bedY + 1, -7); } },
      jericho: { range: 480, crop: 0.34, pos: function () { return v(JP.jericho[0], height(JP.jericho[0], JP.jericho[1]) + 5, JP.jericho[1]); } }
    };
    /* Blender로 만든 인물로 바꿔 끼울 때 쓰는 손잡이 */
    return {
      scene: scene, sun: sun, P: JP, height: height, walkable: walkable, edge: edge, targets: targets,
      priests: priests, leader: leader, ark: ark, poleY: function () { return poleY; },
      update: function (dt, t) { for (var q = 0; q < ups.length; q++) ups[q](dt, t); },
      addUpdate: function (fn) { ups.push(fn); }
    };
  }

  BO3D.jordan = { build: build, P: JP, height: height };
})();
