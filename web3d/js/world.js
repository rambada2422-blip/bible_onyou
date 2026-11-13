/* 3D 샘플의 세계: 지형, 하늘, 빛, 소품 배치.
 * 장면: 출 3:1-6, 광야와 하나님의 산 호렙. 단위는 미터. 북쪽(-Z)에 호렙 산.
 */
window.BO3D = window.BO3D || {};
(function () {
  'use strict';
  var T = THREE;

  /* 장소 좌표 (x, z)
   * 떨기나무는 호렙 산 기슭의 언덕 위에 있다. 언덕은 아이들 쪽(남쪽)이 가파른 바위 비탈이고,
   * 서쪽은 완만한 어깨라서 모세는 그쪽으로 올라간다. 세 아이는 언덕 아래에서 올려다본다(목격자). */
  var P = {
    start: [2, 46],
    machine: [6.5, 50],
    hill: [8, -14],
    hillTop: 6.2,
    bush: [8.2, -10.2],
    flock: [-10, 24],
    flockGraze: [-4.5, -1.5],
    mosesStart: [-7.5, 20.5],
    mosesPath: [[-6.8, 12], [-5.6, 3], [-5.2, -4.5], [-1.2, -9.4], [2.8, -11.6], [5.2, -10.4], [6.65, -9.25]],
    /* 떨기나무 앞쪽 왼편. 떨기나무를 바라보므로 아래에서는 뒷모습이 보인다 (Blender 영상과 같은 자리) */
    mosesEnd: [6.65, -9.25],
    mosesFoot: 3, /* 부품 2를 찾기 전까지 모세는 mosesPath의 이 번호 자리(언덕 기슭)에서 기다린다 */
    lookSpot: [7.4, 0.2],
    /* 부품이 떨어진 곳: 양 떼 사이, 호렙으로 가는 길목, 언덕 아래 우묵한 곳 */
    parts: [[-12.5, 27], [-1.6, 7.6], [7.4, 0.2]],
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
  function gauss(d, w) { return Math.exp(-(d * d) / (w * w)); }
  function angDist(a, b) { var d = a - b; return Math.atan2(Math.sin(d), Math.cos(d)); }
  /* 떨기나무 언덕. 꼭대기는 거의 평평하고, 남쪽은 가파른 바위 비탈, 서쪽과 북쪽은 완만하다 */
  function hillShape(x, z) {
    var dx = x - P.hill[0], dz = z - P.hill[1], r = Math.sqrt(dx * dx + dz * dz);
    if (r > 25) return { h: 0, s: 0 };
    var a = Math.atan2(dz, dx);
    var rt = 5.2 + 0.45 * Math.sin(a * 3 + 1.2) + 0.25 * Math.sin(a * 5 + 0.4);
    var w = 4.2 + 12.5 * gauss(angDist(a, 2.75), 0.6) + 9 * gauss(angDist(a, -1.57), 1.0) + 2.2 * gauss(angDist(a, 0.15), 0.55);
    var h, n = 0.18 * (noise(x * 0.55 + 3, z * 0.55 + 8) - 0.5);
    if (r <= rt) return { h: P.hillTop + 0.3 * (1 - (r / rt) * (r / rt)) + n, s: 0 };
    var t = (r - rt) / w;
    if (t >= 1) return { h: 0, s: 0 };
    var u = 1 - t, prof = u * u * (3 - 2 * u);
    /* 가파른 쪽에는 바위 턱이 층층이 진다 */
    var steep = 1 - smooth(4.5, 9, w);
    prof += steep * 0.035 * Math.sin(prof * 3.14159 * 5) * (1 - t) * t * 4;
    h = P.hillTop * prof + n * prof;
    return { h: h, s: steep * (1 - t) };
  }
  /* 언덕은 호렙 산에서 뻗어 내려온 산줄기의 끝이다. 언덕 뒤(북쪽)로 산줄기가 산 본체까지 이어진다 */
  var RIDGE_END = [13, -58];
  function ridge(x, z) {
    var ax = RIDGE_END[0] - P.hill[0], az = RIDGE_END[1] - P.hill[1], L2 = ax * ax + az * az;
    var s = ((x - P.hill[0]) * ax + (z - P.hill[1]) * az) / L2;
    if (s <= 0.02) return 0;
    var cs = Math.min(s, 1), px = P.hill[0] + ax * cs, pz = P.hill[1] + az * cs;
    var d = Math.sqrt((x - px) * (x - px) + (z - pz) * (z - pz)) + (s > 1 ? (s - 1) * Math.sqrt(L2) : 0);
    var wr = 7 + 9 * cs, hr = P.hillTop + 0.2 + 15 * Math.pow(Math.max(0, cs - 0.05), 1.25);
    var ramp = smooth(0.02, 0.22, s);
    return hr * ramp * (1 - smooth(0.35 * wr, wr, d)) * (0.92 + 0.16 * noise(x * 0.2 + 1, z * 0.2 + 5));
  }
  function hill(x, z) { return Math.max(hillShape(x, z).h, ridge(x, z)); }
  /* 마지막 부품이 떨어진 언덕 아래의 우묵한 곳 */
  function hollow(x, z) {
    var dx = x - P.lookSpot[0], dz = z - P.lookSpot[1];
    return -0.35 * gauss(Math.sqrt(dx * dx + dz * dz), 2.4);
  }
  function height(x, z) {
    var h = 0.7 * Math.sin(x * 0.06 + 1.3) * Math.cos(z * 0.045) + 0.42 * Math.sin(x * 0.17 + z * 0.12) + 0.18 * Math.sin(z * 0.33 - x * 0.1);
    h += 0.5 * noise(x * 0.08 + 20, z * 0.08 + 11);
    /* 언덕 기슭은 평평하게 */
    var bx = x - P.hill[0], bz = z - P.hill[1];
    var flat = 1 - smooth(12, 30, Math.sqrt(bx * bx + bz * bz));
    h = h * (1 - 0.8 * flat);
    /* 사방을 두르는 낮은 언덕 */
    var r = Math.sqrt(x * x + (z - 8) * (z - 8));
    h += smooth(78, 128, r) * 15 * (0.55 + 0.6 * noise(x * 0.03 + 2, z * 0.03 + 9));
    return h + Math.max(mountain(x, z), hill(x, z)) + hollow(x, z);
  }
  /* 아이들은 언덕에 오르지 않는다. 기슭까지만 간다 */
  function walkable(x, z) {
    var r = Math.sqrt(x * x + (z - 8) * (z - 8));
    return r < 72 && mountain(x, z) < 3.2 && hill(x, z) < 0.75;
  }

  var HS = 28; /* 언덕을 촘촘하게 그리는 네모의 반지름 */
  var SAND = new T.Color('#E6C182'), SAND2 = new T.Color('#D9AC6B'), ROCK = new T.Color('#A06B47'), HIGH = new T.Color('#86708F'), PEAK = new T.Color('#C9B4C0');
  var CLIFF = new T.Color('#B07A52'), CLIFF2 = new T.Color('#8E5E3F'), CLIFF3 = new T.Color('#C99263'), TOPS = new T.Color('#D6A774');
  function groundColor(c, x, z) {
    var m = mountain(x, z), n = noise(x * 0.09 + 5, z * 0.09 + 1);
    c.copy(SAND).lerp(SAND2, n * 0.8);
    if (m > 0.5) c.lerp(ROCK, smooth(0.5, 9, m));
    if (m > 12) c.lerp(HIGH, smooth(12, 34, m));
    if (m > 40) c.lerp(PEAK, smooth(40, 60, m) * 0.7);
    var rr = Math.sqrt(x * x + (z - 8) * (z - 8));
    if (rr > 80 && m < 1) c.lerp(ROCK, smooth(80, 120, rr) * 0.55);
    return c;
  }
  function terrain() {
    var size = 300, seg = 128;
    var g = new T.PlaneGeometry(size, size, seg, seg);
    g.rotateX(-Math.PI / 2);
    var pos = g.attributes.position, col = new Float32Array(pos.count * 3);
    var c = new T.Color();
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i) + 8, y;
      pos.setZ(i, z);
      y = height(x, z);
      /* 언덕 자리는 촘촘한 그물(hillMesh)이 덮는다. 굵은 그물은 그 아래로 내려 둔다 */
      if (Math.abs(x - P.hill[0]) < HS - 2.5 && Math.abs(z - P.hill[1]) < HS - 2.5) y -= 3;
      pos.setY(i, y);
      groundColor(c, x, z);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3));
    g.computeVertexNormals();
    var mesh = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, metalness: 0 }));
    mesh.receiveShadow = true;
    return mesh;
  }
  /* 떨기나무 언덕: 0.56m 간격의 촘촘한 그물. 비탈은 층진 바위 색, 꼭대기는 자갈 섞인 흙 */
  function hillMesh() {
    var seg = 100, g = new T.PlaneGeometry(HS * 2, HS * 2, seg, seg);
    g.rotateX(-Math.PI / 2);
    g.translate(P.hill[0], 0, P.hill[1]);
    var pos = g.attributes.position, i, x, z;
    for (i = 0; i < pos.count; i++) { x = pos.getX(i); z = pos.getZ(i); pos.setY(i, height(x, z)); }
    g = g.toNonIndexed();
    g.computeVertexNormals();
    pos = g.attributes.position;
    var nor = g.attributes.normal, col = new Float32Array(pos.count * 3), c = new T.Color(), k;
    for (i = 0; i < pos.count; i += 3) {
      /* 삼각형 하나에 한 색 */
      x = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3; z = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
      var y = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3, ny = nor.getY(i);
      var hh = hill(x, z);
      groundColor(c, x, z);
      if (hh > 0.05) {
        var slope = 1 - smooth(0.55, 0.9, ny);
        var band = Math.sin(y * 2.3 + noise(x * 0.4, z * 0.4) * 2.2);
        var rc = band > 0.35 ? CLIFF3 : (band < -0.4 ? CLIFF2 : CLIFF);
        c.lerp(rc, slope * smooth(0.05, 0.8, hh));
        if (hh > P.hillTop - 0.2) c.lerp(TOPS, 0.55 * (1 - slope) * noise(x * 1.3, z * 1.3));
      }
      for (k = 0; k < 3; k++) { col[(i + k) * 3] = c.r; col[(i + k) * 3 + 1] = c.g; col[(i + k) * 3 + 2] = c.b; }
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3));
    var mesh = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, metalness: 0 }));
    mesh.receiveShadow = true; mesh.castShadow = true;
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
    scene.add(hillMesh());

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
    function segDist(x, z, a, b) {
      var vx = b[0] - a[0], vz = b[1] - a[1], t = ((x - a[0]) * vx + (z - a[1]) * vz) / (vx * vx + vz * vz);
      t = Math.max(0, Math.min(1, t));
      var dx = x - a[0] - vx * t, dz = z - a[1] - vz * t; return Math.sqrt(dx * dx + dz * dz);
    }
    function clear(x, z) {
      var d = function (p, rad) { var dx = x - p[0], dz = z - p[1]; return dx * dx + dz * dz < rad * rad; };
      if (d(P.bush, 4) || d(P.start, 5) || d(P.machine, 5) || d(P.flock, 7) || d(P.flockGraze, 6) || d(P.lookSpot, 3.2) || d(P.mosesEnd, 2)) return false;
      if (hill(x, z) > 0.3) return false;
      /* 출발점에서 언덕 아래까지 이어지는 길과 모세가 걷는 길은 비워 둔다 */
      if (segDist(x, z, P.start, [P.lookSpot[0], P.lookSpot[1] + 3]) < 3.2) return false;
      var path = [P.mosesStart].concat(P.mosesPath);
      for (var k = 0; k + 1 < path.length; k++) if (segDist(x, z, path[k], path[k + 1]) < 2.2) return false;
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

    /* 언덕의 바위: 남쪽 비탈 기슭에 큰 바위, 비탈 중간에 박힌 바위.
     * 아래에서 떨기나무와 모세를 올려다보는 시선(비탈 가운데)은 가리지 않는다. */
    if (M.rock) {
      var rr2 = rng(808), a, rad, box = new T.Box3(), sz = new T.Vector3();
      for (i = 0; i < 30; i++) {
        a = 0.3 + rr2() * 2.45; /* 남동~남서 */
        var foot = i % 3 === 0;
        rad = foot ? 9.4 + rr2() * 1.8 : 6.2 + rr2() * 2.6;
        if (!foot && a > 1.2 && a < 2.5) continue;
        if (foot && a > 1.35 && a < 2.0) continue;
        x = P.hill[0] + Math.cos(a) * rad; z = P.hill[1] + Math.sin(a) * rad;
        o = M.rock(500 + i);
        box.setFromObject(o).getSize(sz);
        var want = foot ? 1.3 + rr2() * 0.9 : 0.9 + rr2() * 0.7;
        o.scale.multiplyScalar(want / Math.max(sz.x, sz.y, sz.z, 0.1));
        o.position.set(x, height(x, z) - 0.2, z); o.rotation.y = rr2() * 6.28;
        scene.add(o);
      }
      /* 시선 쪽 비탈 아래쪽에는 작은 바위만 */
      for (i = 0; i < 9; i++) {
        a = 1.25 + rr2() * 1.2; rad = 7.4 + rr2() * 2.2;
        x = P.hill[0] + Math.cos(a) * rad; z = P.hill[1] + Math.sin(a) * rad;
        o = M.rock(600 + i); box.setFromObject(o).getSize(sz);
        o.scale.multiplyScalar((0.45 + rr2() * 0.4) / Math.max(sz.x, sz.y, sz.z, 0.1));
        o.position.set(x, height(x, z) - 0.08, z); o.rotation.y = rr2() * 6.28; scene.add(o);
      }
      /* 우묵한 곳을 둘러싼 바위 (부품이 굴러 들어간 자리) */
      [[-2.4, -0.4, 1.3], [2.5, -0.7, 1.5], [-2.0, 1.9, 0.8], [2.2, 1.7, 0.7]].forEach(function (q, k) {
        var ox = P.lookSpot[0] + q[0], oz = P.lookSpot[1] + q[1], ro = M.rock(700 + k);
        box.setFromObject(ro).getSize(sz); ro.scale.multiplyScalar(q[2] / Math.max(sz.x, sz.y, sz.z, 0.1)); ro.position.set(ox, height(ox, oz) - 0.12, oz); ro.rotation.y = k * 1.7; scene.add(ro);
      });
    }

    return { sun: sun, hemi: hemi };
  }

  BO3D.world = { P: P, height: height, hill: hill, walkable: walkable, build: build, rng: rng };
})();
