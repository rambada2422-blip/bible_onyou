/* 3D 샘플의 두 번째 장소: 요단 강을 건너는 백성 (여호수아 3:1-17).
 * 타임머신에 이름을 잘못 넣었을 때 도착하는 곳이다. 본문 그대로 보여 주고, 아이가 단서를 찾아 추리한다.
 *
 * 방향: 아이들은 동쪽 둑에 서서 서쪽(화면 앞, -Z)의 여리고를 본다. 오른쪽(+X)이 북쪽, 곧 상류다(수 3:16, 4:19).
 * 본문에 맞춘 점
 *  - 물은 "심히 멀리" 쌓였고(수 3:16) 건너는 곳에서 보였다는 말이 없으므로 쌓인 물은 그리지 않는다.
 *    보이는 것은 물이 끊어져 드러난 강바닥이다.
 *  - 백성은 궤와 거리를 두라는 명을 받았다(수 3:4, 약 이천 규빗). 화면에 담기 위해 축척을 줄였지만,
 *    행렬과 아이들의 자리를 궤에서 멀리 둔다.
 *  - 궤는 덮개로 덮어 멘다(민 4:5-6). 이 장면에 모세는 없다.
 *  - 지도자는 서 있을 뿐, 강을 가리키거나 손을 내밀지 않는다. 물이 멈춘 것은 제사장들의 발이 물에 닿았을 때다(수 3:15-16).
 * 본문에 근거가 없어 감수가 필요한 설정: 지도자가 선 자리, 제사장의 수(넷), 제사장 옷의 색, 백성이 건너는 쪽,
 *  강가에서 성읍이 보이는 것, 강가의 풀과 곡식밭.
 * 세 아이는 이쪽 둑 위에서만 다닌다. 강바닥과 백성의 행렬 안으로는 들어가지 않는다.
 */
window.BO3D = window.BO3D || {};
(function () {
  'use strict';
  var T = THREE;
  var JP = {
    start: [-3, 22], machine: [-10, 30], leader: [-39, 13.2], ark: [34, -6],
    bedY: -2.4, bankZ: 9.6, minX: -22, maxX: 12, maxZ: 40,
    jericho: [-10, -150],
    bedView: [58, -6],
    path: [[-64, 64], [-52, 26], [-48.5, 11], [-46.5, 2], [-43, -15], [-41, -22], [-36, -88]]
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
    base += sm(-175, -240, z) * 26 * (0.5 + 0.6 * noise(x * 0.02 + 5, 1));            /* 성읍 뒤의 먼 산 (수 2:16, 2:22) */
    base += sm(95, 150, Math.abs(x)) * 7 * (0.5 + 0.6 * noise(1, z * 0.03 + 4));
    var d = channel(z);
    return base * (1 - d) + (JP.bedY + 0.12 * noise(x * 0.3, z * 0.3)) * d;
  }
  function walkable(x, z) { return z >= JP.bankZ && z <= JP.maxZ && x >= JP.minX && x <= JP.maxX; }
  function edge(x, z) { return z < JP.bankZ ? 'river' : (x < JP.minX ? 'crowd' : 'far'); }

  function terrain() {
    var g = new T.PlaneGeometry(460, 420, 160, 150); g.rotateX(-Math.PI / 2);
    var pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color();
    var green = new T.Color('#8EA85C'), green2 = new T.Color('#A9B66A'), sand = new T.Color('#DCC48E'), bed = new T.Color('#B79C74'), bedWet = new T.Color('#9C8463'), far = new T.Color('#C9B98E'), hill = new T.Color('#A996A6');
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i) - 60; pos.setZ(i, z);
      var y = height(x, z); pos.setY(i, y);
      var d = channel(z), n = noise(x * 0.08 + 2, z * 0.08 + 6);
      c.copy(green).lerp(green2, n);
      c.lerp(sand, sm(0.45, 0.8, noise(x * 0.05 + 9, z * 0.05 + 1)) * 0.7);
      if (z < -24) c.lerp(far, sm(-24, -90, z) * 0.8);
      if (y > 7) c.lerp(hill, sm(7, 24, y));
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

  /* opts.staged: OT-18 3D 장면용. 백성은 처음에 진에 서 있고(setCrowd로 'camp' | 'cross' | 'west'), 타임머신은 장면 틀이 따로 둔다 */
  function build(opts) {
    opts = opts || {};
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

    /* 강 한가운데 마른 땅에 선 제사장들과 덮개로 덮인 궤 (수 3:17) */
    var ark = safe('arkCovered', null, function () { var g = new T.Group(), b = box(0.69, 0.69, 1.14, '#2F5FA8'); b.position.y = 0.345; g.add(b); [-0.42, 0.42].forEach(function (x) { var p = box(0.05, 0.05, 3.4, '#B98A3A'); p.position.set(x, 0.345, 0); g.add(p); }); return g; });
    /* 궤와 제사장은 모두 서쪽(-Z)을 보도록 반 바퀴 돌려 세운다. 제사장은 채의 바깥쪽에 서서 안쪽 어깨로 멘다. */
    var au = ark.userData || {}, arkPoleX = au.poleX || 0.395, arkPoleY = au.poleY || 0.345, poleR = au.poleRadius || 0.028;
    var priests = [], poleY = 1.36, shoulderX = 0.184;
    [['R', 1.25], ['L', 1.25], ['R', -1.25], ['L', -1.25]].forEach(function (s) {
      var pr = safe('priestSimple', s[0], function () { return { group: simplePerson('#F3EEE2', 1.72), update: function () {} }; });
      if (pr.group.userData && pr.group.userData.poleY) { poleY = pr.group.userData.poleY; shoulderX = Math.abs(pr.group.userData.poleX || shoulderX); }
      /* 궤 기준 자리: 'R'은 +X쪽 채의 바깥, 'L'은 -X쪽 채의 바깥. 반 바퀴 돌렸으므로 세계 좌표에서는 부호가 뒤집힌다. */
      var lx = (s[0] === 'R' ? 1 : -1) * (arkPoleX + shoulderX);
      pr.side = s[0]; pr.lx = lx; pr.lz = s[1]; priests.push(pr);
      pr.group.rotation.y = Math.PI;
      put(pr.group, JP.ark[0] - lx, JP.ark[1] - s[1]);
      ups.push(function (dt) { if (pr.update) pr.update(dt); });
    });
    put(ark, JP.ark[0], JP.ark[1], Math.max(0, poleY + poleR - arkPoleY));
    ark.rotation.y = Math.PI;

    /* 백성을 이끄는 사람. 본문에 그가 선 자리는 없다. 백성 곁에 서 있게만 한다. */
    var leader = safe('leaderSimple', null, function () { return { group: simplePerson('#A8322C', 1.76), update: function () {} }; });
    leader.group.rotation.y = Math.PI; put(leader.group, JP.leader[0], JP.leader[1]);
    ups.push(function (dt) { if (leader.update) leader.update(dt); });

    /* 마른 땅을 밟고 건너는 백성의 긴 행렬. 궤에서 멀리 떨어진 하류 쪽으로 건넌다. */
    var path = JP.path, segs = [], total = 0;
    for (i = 0; i < path.length - 1; i++) { var dx = path[i + 1][0] - path[i][0], dz = path[i + 1][1] - path[i][1], len = Math.sqrt(dx * dx + dz * dz); segs.push({ a: path[i], dx: dx / len, dz: dz / len, len: len, at: total }); total += len; }
    var crowd = [], N = 46, crowdMode = opts.staged ? 'camp' : 'cross';
    for (i = 0; i < N; i++) {
      (function (k) {
        var per = safe('israelite', k * 7 + 3, function () { return { group: simplePerson(['#8A6A4A', '#5F7350', '#4E5E7A', '#9A4E3C'][k % 4], 1.4 + (k % 5) * 0.08), update: function () {} }; });
        per.s = (k / N) * total + hash(k, 2) * 2; per.off = (hash(k, 5) - 0.5) * 3.4; per.v = 1.05 + hash(k, 9) * 0.3;
        /* 진(요단 동쪽 강가, 수 3:1)과 건넌 뒤(서쪽, 수 4:19)에 서 있는 자리 */
        per.camp = [-74 + hash(k, 11) * 46, 18 + hash(k, 13) * 30]; per.west = [-62 + hash(k, 17) * 34, -30 - hash(k, 19) * 26];
        scene.add(per.group); crowd.push(per);
      })(i);
    }
    ups.push(function (dt) {
      crowd.forEach(function (per) {
        if (crowdMode !== 'cross') {
          var st = crowdMode === 'camp' ? per.camp : per.west;
          per.group.position.set(st[0], height(st[0], st[1]), st[1]); per.group.rotation.y = Math.PI;
          if (per.update) per.update(dt, 0);
          return;
        }
        per.s = (per.s + per.v * dt) % total;
        var sg = segs[0]; for (var q = 0; q < segs.length; q++) if (per.s >= segs[q].at) sg = segs[q];
        var u = per.s - sg.at, x = sg.a[0] + sg.dx * u - sg.dz * per.off, z = sg.a[1] + sg.dz * u + sg.dx * per.off;
        per.group.position.set(x, height(x, z), z);
        per.group.rotation.y = Math.atan2(sg.dx, sg.dz);
        if (per.update) per.update(dt, per.v);
      });
    });

    /* 건너편 멀리 성읍(수 3:16)과 그 둘레의 종려나무(신 34:3) */
    var city = safe('jericho', null, function () { var g = new T.Group(), w = box(80, 9, 5, '#B8946A'); w.position.y = 4.5; g.add(w); return g; });
    put(city, JP.jericho[0], JP.jericho[1]);
    var r = BO3D.world ? BO3D.world.rng(909) : function () { return Math.random(); };
    for (i = 0; i < 26; i++) { if (!M2.palm) break; o = M2.palm(i); put(o, JP.jericho[0] + (r() * 2 - 1) * 70, JP.jericho[1] + 14 + r() * 40); }
    /* 추수 때(수 3:15)의 곡식밭과 강가의 풀. 본문에 직접 나오지는 않는 풍경이라 조금만 둔다. */
    for (i = 0; i < 10; i++) { if (!M2.reeds) break; o = M2.reeds(i); put(o, -80 + r() * 170, i % 2 ? 9.0 + r() * 0.5 : -21.3 - r() * 0.8); o.rotation.y = r() * 6; }
    for (i = 0; i < 12; i++) { if (!M2.grain) break; o = M2.grain(i); put(o, 22 + (i % 6) * 4.4, 15 + (i < 6 ? 0 : 4.6)); }
    for (i = 0; i < 12; i++) { if (!M2.grain) break; o = M2.grain(20 + i); put(o, -10 + (i % 6) * 4.4, -32 - (i < 6 ? 0 : 4.6)); }
    if (M.rock) for (i = 0; i < 30; i++) { o = M.rock(300 + i); o.scale.multiplyScalar(0.5 + r() * 0.9); var bx = -80 + r() * 170, bz = -15 + r() * 18; if (Math.abs(bx - JP.ark[0]) < 6 || Math.abs(bx + 45) < 7) continue; put(o, bx, bz, -0.08); }

    /* 탐험대의 타임머신 */
    var machine = null;
    try { if (M.timeMachine) machine = M.timeMachine(); } catch (e) { console.error(e); }
    if (machine && !opts.staged) { put(machine.group, JP.machine[0], JP.machine[1]); machine.group.rotation.y = 0.6; ups.push(function (dt, t) { if (machine.update) machine.update(t); }); }

    function v(x, y, z) { return new T.Vector3(x, y, z); }
    var targets = {
      bed: { range: 130, crop: 0.5, pos: function () { return v(JP.bedView[0], JP.bedY + 0.4, JP.bedView[1]); } },
      ark: { range: 75, crop: 0.34, pos: function () { return v(JP.ark[0], JP.bedY + poleY, JP.ark[1]); } },
      leader: { range: 34, crop: 0.36, pos: function () { return v(JP.leader[0], height(JP.leader[0], JP.leader[1]) + 1.1, JP.leader[1]); } },
      people: { range: 85, crop: 0.5, pos: function () { return v(-44.5, JP.bedY + 1, -7); } },
      jericho: { range: 480, crop: 0.34, pos: function () { return v(JP.jericho[0], height(JP.jericho[0], JP.jericho[1]) + 5, JP.jericho[1]); } }
    };
    return {
      scene: scene, sun: sun, P: JP, height: height, walkable: walkable, edge: edge, targets: targets,
      priests: priests, leader: leader, ark: ark, poleY: function () { return poleY; }, arkPole: { x: arkPoleX, y: arkPoleY, r: poleR },
      crowd: crowd, setCrowd: function (m) { crowdMode = m; }, put: put,
      update: function (dt, t) { for (var q = 0; q < ups.length; q++) ups[q](dt, t); },
      addUpdate: function (fn) { ups.push(fn); }
    };
  }

  BO3D.jordan = { build: build, P: JP, height: height };
})();
