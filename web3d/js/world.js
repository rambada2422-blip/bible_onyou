/* 3D 샘플의 세계: 지형, 하늘, 빛, 소품 배치.
 * 장면: 출 3:1-6, 광야와 하나님의 산 호렙. 단위는 미터. 북쪽(-Z)에 호렙 산.
 */
window.BO3D = window.BO3D || {};
(function () {
  'use strict';
  var T = THREE;

  /* 장소 좌표 (x, z) */
  var P = {
    start: [2, 46],
    machine: [6.5, 50],
    flock: [-8, 19],
    mosesStart: [-4.5, 16.5],
    mosesEnd: [2.2, -5.6],
    bush: [7, -9],
    scraps: [[1, 28], [12, 14], [-9.5, -3.5]],
    witnessRadius: 15.5,
    mountain: [14, -96]
  };

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a += 0x6D2B79F5; var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(ix, iz) {
    var n = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453;
    return n - Math.floor(n);
  }
  function noise(x, z) {
    var ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
    var u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
    var a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function smooth(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

  function mountain(x, z) {
    var dx = x - P.mountain[0], dz = z - P.mountain[1];
    var d = Math.sqrt(dx * dx + dz * dz), R = 82;
    if (d >= R) return 0;
    var t = 1 - d / R;
    var ridge = 1 - Math.abs(noise(x * 0.045 + 7, z * 0.045 + 3) * 2 - 1);
    return Math.pow(t, 1.55) * 62 * (0.7 + 0.42 * ridge) + t * 7 * noise(x * 0.12, z * 0.12);
  }
  function height(x, z) {
    var h = 0.7 * Math.sin(x * 0.06 + 1.3) * Math.cos(z * 0.045) + 0.42 * Math.sin(x * 0.17 + z * 0.12) + 0.18 * Math.sin(z * 0.33 - x * 0.1);
    h += 0.5 * noise(x * 0.08 + 20, z * 0.08 + 11);
    /* 떨기나무 주변은 평평하게 한 뒤, 꼭대기(7, -9) 높이 5.2, 반경 15에서 둘레 땅과 고르게 이어지는 언덕을 세운다 */
    var bx = x - P.bush[0], bz = z - P.bush[1];
    var bd = Math.sqrt(bx * bx + bz * bz);
    var flat = 1 - smooth(12, 22, bd);
    h = h * (1 - 0.85 * flat);
    var hd = Math.max(0, Math.sqrt(bd * bd + 0.25) - 0.5);
    var hill = hd < 14.5 ? 5.2 * (1 - hd / 14.5) : 0;
    /* 사방을 두르는 낮은 언덕 */
    var r = Math.sqrt(x * x + (z - 8) * (z - 8));
    h += smooth(78, 128, r) * 15 * (0.55 + 0.6 * noise(x * 0.03 + 2, z * 0.03 + 9));
    return h + hill + mountain(x, z);
  }
  function walkable(x, z) {
    var r = Math.sqrt(x * x + (z - 8) * (z - 8));
    return r < 72 && mountain(x, z) < 3.2;
  }

  function terrain() {
    var size = 300, seg = 128;
    var g = new T.PlaneGeometry(size, size, seg, seg);
    g.rotateX(-Math.PI / 2);
    var pos = g.attributes.position, col = new Float32Array(pos.count * 3);
    var sand = new T.Color('#E6C182'), sand2 = new T.Color('#D9AC6B'), rock = new T.Color('#A06B47'), high = new T.Color('#86708F'), peak = new T.Color('#C9B4C0');
    var c = new T.Color();
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i) + 8 - 0, y;
      pos.setZ(i, z);
      y = height(x, z);
      pos.setY(i, y);
      var m = mountain(x, z);
      var n = noise(x * 0.09 + 5, z * 0.09 + 1);
      c.copy(sand).lerp(sand2, n * 0.8);
      if (m > 0.5) c.lerp(rock, smooth(0.5, 9, m));
      if (m > 12) c.lerp(high, smooth(12, 34, m));
      if (m > 40) c.lerp(peak, smooth(40, 60, m) * 0.7);
      var rr = Math.sqrt(x * x + (z - 8) * (z - 8));
      if (rr > 80 && m < 1) c.lerp(rock, smooth(80, 120, rr) * 0.55);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3));
    g.computeVertexNormals();
    var mesh = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, metalness: 0 }));
    mesh.receiveShadow = true;
    return mesh;
  }

  function sky() {
    var g = new T.SphereGeometry(420, 24, 16);
    var pos = g.attributes.position, col = new Float32Array(pos.count * 3);
    var top = new T.Color('#5FA9C4'), mid = new T.Color('#BFE0DC'), hor = new T.Color('#F8DDAE'), c = new T.Color();
    for (var i = 0; i < pos.count; i++) {
      var t = pos.getY(i) / 420;
      if (t > 0.18) c.copy(mid).lerp(top, smooth(0.18, 0.85, t));
      else c.copy(hor).lerp(mid, smooth(-0.02, 0.18, t));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3));
    return new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false }));
  }

  function clouds() {
    var grp = new T.Group(), r = rng(77);
    var mat = new T.MeshBasicMaterial({ color: '#FFF6E4', transparent: true, opacity: 0.9, fog: false });
    for (var i = 0; i < 9; i++) {
      var cl = new T.Group(), n = 3 + Math.floor(r() * 3);
      for (var k = 0; k < n; k++) {
        var s = new T.Mesh(new T.SphereGeometry(6 + r() * 7, 8, 6), mat);
        s.position.set(k * 9 - n * 4.5 + r() * 3, r() * 2, r() * 4);
        s.scale.y = 0.42;
        cl.add(s);
      }
      var ang = r() * Math.PI * 2, dist = 230 + r() * 90;
      cl.position.set(Math.cos(ang) * dist, 70 + r() * 60, Math.sin(ang) * dist);
      cl.lookAt(0, cl.position.y, 0);
      grp.add(cl);
    }
    return grp;
  }

  function farHills() {
    var grp = new T.Group(), r = rng(31);
    var cols = ['#B79AB0', '#A88FA6', '#C6A6A6'];
    for (var i = 0; i < 14; i++) {
      var ang = (i / 14) * Math.PI * 2 + r() * 0.3;
      if (Math.abs(ang - Math.PI * 1.5) < 0.5) continue; /* 호렙 쪽은 비워 둔다 */
      var h = 26 + r() * 30, w = 50 + r() * 45;
      /* 피라미드처럼 보이지 않게, 둥글고 낮은 바위산 덩어리로 만든다 */
      var m = new T.Mesh(new T.DodecahedronGeometry(1, 1), new T.MeshStandardMaterial({ color: cols[i % 3], flatShading: true, roughness: 1 }));
      m.scale.set(w * (0.9 + r() * 0.5), h * 0.75, w * (0.6 + r() * 0.5));
      m.position.set(Math.cos(ang) * (195 + r() * 30), -h * 0.12, Math.sin(ang) * (195 + r() * 30) + 8);
      m.rotation.y = r() * 3;
      grp.add(m);
    }
    return grp;
  }

  function build(scene) {
    var M = BO3D.models || {};
    scene.background = new T.Color('#F8DDAE');
    scene.fog = new T.Fog('#F3D7A8', 55, 235);
    scene.add(sky());
    scene.add(clouds());
    scene.add(farHills());
    scene.add(terrain());

    var hemi = new T.HemisphereLight('#D9EEF2', '#B98A55', 0.62);
    scene.add(hemi);
    var sun = new T.DirectionalLight('#FFE9C4', 0.72);
    sun.position.set(-38, 46, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    var sc = sun.shadow.camera;
    sc.left = -24; sc.right = 24; sc.top = 24; sc.bottom = -24; sc.near = 1; sc.far = 140;
    sun.shadow.bias = -0.0015;
    scene.add(sun); scene.add(sun.target);

    /* 소품 흩뿌리기 */
    var r = rng(2024), i, x, z, o;
    function clear(x, z) {
      var d = function (p, rad) { var dx = x - p[0], dz = z - p[1]; return dx * dx + dz * dz < rad * rad; };
      if (d(P.bush, 16) || d(P.start, 5) || d(P.machine, 5) || d(P.flock, 5) || d(P.mosesEnd, 2.5)) return false;
      if (P.scraps.some(function (p) { return d(p, 2.5); })) return false;
      /* 출발점에서 떨기나무까지 이어지는 길은 비워 둔다 */
      var t = (z - P.bush[1]) / (P.start[1] - P.bush[1]);
      if (t > 0 && t < 1) { var px = P.bush[0] + (P.start[0] - P.bush[0]) * t - 3 * Math.sin(t * Math.PI); if (Math.abs(x - px) < 3.2) return false; }
      return true;
    }
    function scatter(n, make, rad, minS, maxS) {
      for (i = 0; i < n; i++) {
        x = (r() * 2 - 1) * rad; z = 8 + (r() * 2 - 1) * rad;
        if (!clear(x, z) || mountain(x, z) > 1.5) continue;
        o = make(Math.floor(r() * 9999));
        if (!o) continue;
        var s = minS + r() * (maxS - minS);
        o.scale.multiplyScalar(s);
        o.position.set(x, height(x, z) - 0.05, z);
        o.rotation.y = r() * Math.PI * 2;
        scene.add(o);
      }
    }
    if (M.rock) scatter(90, M.rock, 82, 0.7, 1.9);
    if (M.shrub) scatter(110, M.shrub, 76, 0.8, 1.4);
    if (M.acacia) scatter(16, M.acacia, 70, 0.9, 1.3);

    return { sun: sun, hemi: hemi };
  }

  BO3D.world = { P: P, height: height, walkable: walkable, build: build, rng: rng };
})();
