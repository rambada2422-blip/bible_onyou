/* 3D 장면 설정: OT-04 바벨에서 흩어짐 (창 11:1-9). 시날 평지. (자동 작업 3d-a. 장면표의 3D 12장면 밖의 추가 제안)
 * 배치: 쌓고 있는 성읍과 탑은 화면 안쪽(-Z) 멀리, 벽돌 굽는 곳은 그 앞(가운데), 아이들은 화면 앞쪽(+Z) 평지 가장자리에서만 다닌다.
 *   본문은 방위를 말하지 않으므로(11:2의 "동방으로 옮기다가"는 오는 길의 말이다) 장면의 방향에는 뜻이 없다. 화면의 글에 방위 말을 쓰지 않는다.
 * 본문에 맞춘 점 (content/ot/OT-04.json design3d)
 *  - 시날 평지(11:2): 넓고 평평한 땅. 강과 산은 본문에 없으므로 만들지 않는다.
 *  - 벽돌을 만들어 굽는다(11:3): 땅에 늘어놓은 굽기 전 벽돌, 낮은 가마와 연기, 구운 벽돌 더미. 돌 대신 벽돌을 쓰므로 성벽·집·탑은 모두 벽돌이다.
 *    진흙 대신 역청을 쓴다(11:3): 벽돌 사이의 줄눈이 검고, 검은 역청이 담긴 통이 놓여 있다.
 *  - 성읍과 탑을 쌓는다(11:4-5): 다 지어지지 않은 모습으로만. 성벽은 높이가 고르지 않고 탑은 꼭대기가 들쭉날쭉하다. 사람들이 벽돌을 날라 성으로 간다.
 *  - 여호와께서 내려오셔서 보신 일과 하신 말씀(11:5-7)은 자막으로만. 형상·빛줄기·음성 없음. 그 대목의 화면은 쌓는 모습 그대로다.
 *  - 흩으심(11:8): 사람들이 일을 멈추고 몇 무리로 나뉘어 여러 쪽으로 멀리 떠나간다. 말소리를 지어 들려주지 않는다. 다투는 모습 없음.
 *    성 쌓기를 그쳤다(11:8): 성읍과 탑은 쌓던 그대로 남는다. 무너지지 않는다. 번개·불·바람 같은 연출 없음.
 *  - 그 이름을 바벨이라 함(11:9): 사람이 없는, 쌓다가 그친 성읍과 탑. 이름을 글자로 새기지 않는다.
 * 감수가 필요한 설정: 탑의 생김새와 높이(네모난 벽돌 탑 하나, 약 17m, 다 지어지지 않은 모습), 성읍의 생김새와 크기(낮은 성벽과 집 몇 채), 가마와 역청 통의 생김새,
 *   사람 수(36명)와 옷차림(이 게임의 백성 모델을 그대로 썼다. 남자와 여자), 성 위에 올라선 사람 몇, 흩어지는 무리의 수(여섯)와 가는 쪽, 한 무리가 아이들이 다니는 곳 곁을 지나가는 것(돕기 "길 비켜 주기"),
 *   마지막 대목에서 가마의 연기가 그친 것(본문은 성 쌓기를 그쳤다고만 한다), 평지의 풀과 덤불, 낮 시간으로 둔 것(본문에 때가 없다).
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  BO3D.scene3d = BO3D.scene3d || {};
  BO3D.scene3d['OT-04'] = function (api) {
    var T = THREE, M2 = BO3D.models2 || {}, MO = BO3D.models || {}, PR = BO3D.props, PA = BO3D.props3da || {}, FX = api.FX, R = PR.rng(411);
    function sm(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
    function hash(ix, iz) { var n = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453; return n - Math.floor(n); }
    function noise(x, z) {
      var ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
      var a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    var TOWER = [-7, -56], CITY = { x0: -46, x1: 32, z0: -90, z1: -28 }, GATE = [-7, -28], KILN = [-12, -4], STACK = [-6, -9], MUSTER = [-6, -15], LEAVE_X = 22;
    function segDist(x, z, a, b) { var vx = b[0] - a[0], vz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * vx + (z - a[1]) * vz) / (vx * vx + vz * vz))); return Math.hypot(x - a[0] - vx * t, z - a[1] - vz * t); }
    /* 땅: 평지(11:2). 아주 낮은 굴곡만 있다. 가마 곁에 진흙을 파낸 얕은 자리 */
    function height(x, z) {
      var h = 0.3 * noise(x * 0.045 + 2, z * 0.045 + 5) + 0.12 * Math.sin(x * 0.03) * Math.cos(z * 0.026);
      h -= 0.5 * sm(7, 2.5, Math.hypot(x + 25, z + 4));
      return h;
    }
    function walkable(x, z) { return x >= -28 && x <= 12 && z >= 34 && z <= 82; }

    var scene = new T.Scene();
    scene.background = new T.Color('#EFE2BE'); scene.fog = new T.Fog('#ECDDB8', 110, 520);
    var skyG = new T.SphereGeometry(600, 24, 14), sp = skyG.attributes.position, sc = new Float32Array(sp.count * 3), cc = new T.Color(), top = new T.Color('#74A9CF'), hor = new T.Color('#F3E6C4'), i;
    for (i = 0; i < sp.count; i++) { var tt = Math.max(0, sp.getY(i) / 600); cc.copy(hor).lerp(top, sm(0.02, 0.7, tt)); sc[i * 3] = cc.r; sc[i * 3 + 1] = cc.g; sc[i * 3 + 2] = cc.b; }
    skyG.setAttribute('color', new T.BufferAttribute(sc, 3));
    scene.add(new T.Mesh(skyG, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false })));
    var g = new T.PlaneGeometry(1000, 1000, 125, 125); g.rotateX(-Math.PI / 2);
    var pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color(), s1 = new T.Color('#C9B078'), s2 = new T.Color('#B9A86A'), gr = new T.Color('#9CA760'), rd = new T.Color('#DCC594'), cl = new T.Color('#8A6A48'), yd = new T.Color('#BFA57A');
    for (i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i), y = height(x, z); pos.setY(i, y);
      c.copy(s1).lerp(s2, noise(x * 0.06, z * 0.06)); c.lerp(gr, 0.55 * sm(0.45, 0.8, noise(x * 0.02 + 4, z * 0.02 + 1)));
      if (x > CITY.x0 - 6 && x < CITY.x1 + 6 && z > CITY.z0 - 6 && z < CITY.z1 + 6) c.lerp(yd, 0.8);                 /* 성읍 안의 다져진 땅 */
      c.lerp(yd, 0.8 * sm(26, 12, Math.hypot(x - KILN[0], z - KILN[1])));                                            /* 벽돌 굽는 마당 */
      c.lerp(rd, 0.7 * sm(5, 1.5, segDist(x, z, STACK, GATE)));                                                      /* 벽돌을 나르는 길 */
      c.lerp(cl, 0.85 * sm(8, 3, Math.hypot(x + 25, z + 4)));                                                        /* 진흙을 파낸 자리 */
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals();
    var ground = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 })); ground.receiveShadow = true; scene.add(ground);
    var hemi = new T.HemisphereLight('#DCEEF2', '#B79A62', 0.64); scene.add(hemi);
    var sun = new T.DirectionalLight('#FFEFCC', 0.74); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    var ss = sun.shadow.camera; ss.left = -26; ss.right = 26; ss.top = 26; ss.bottom = -26; ss.near = 1; ss.far = 150; sun.shadow.bias = -0.0015;
    scene.add(sun); scene.add(sun.target);
    function put(o, x, z, lift) { o.position.set(x, height(x, z) + (lift || 0), z); scene.add(o); return o; }
    function std(cl0, o) { var m = new T.MeshStandardMaterial({ color: cl0, flatShading: true, roughness: 0.95 }); if (o) for (var k in o) m[k] = o[k]; return m; }
    function near(x, z, p, r) { return Math.hypot(x - p[0], z - p[1]) < r; }
    if (MO.shrub) for (i = 0; i < 26; i++) {
      var hx = -170 + R() * 340, hz = -150 + R() * 330;
      if ((hx > CITY.x0 - 10 && hx < CITY.x1 + 10 && hz > CITY.z0 - 10 && hz < CITY.z1 + 10) || near(hx, hz, KILN, 34) || (Math.abs(hx - LEAVE_X) < 6 && hz > -10) || walkable(hx, hz)) continue;
      put(MO.shrub(410 + i), hx, hz, -0.05);
    }

    /* 벽돌(11:3): 벽돌 무늬를 그린 작은 그림 한 장을 큰 상자들에 입힌다. 줄눈은 역청이라 검다. 상자는 모두 한 덩어리로 합친다(그리기 한 번) */
    var cv = document.createElement('canvas'); cv.width = 128; cv.height = 64;
    var cx = cv.getContext('2d'), br, bc;
    cx.fillStyle = '#3B302A'; cx.fillRect(0, 0, 128, 64);
    for (br = 0; br < 4; br++) for (bc = -1; bc < 4; bc++) {
      var sh = 0.86 + hash(br * 7 + 3, bc * 5 + 1) * 0.24;
      cx.fillStyle = 'rgb(' + Math.round(196 * sh) + ',' + Math.round(128 * sh) + ',' + Math.round(84 * sh) + ')';
      cx.fillRect(bc * 32 + (br % 2) * 16 + 1, br * 16 + 1, 30, 14);
    }
    var tex = new T.CanvasTexture(cv); tex.wrapS = tex.wrapT = T.RepeatWrapping; tex.anisotropy = 2;
    var brickMat = new T.MeshStandardMaterial({ map: tex, vertexColors: true, roughness: 0.95 }), BP = [], BN = [], BU = [], BC = [];
    function brick(w, h, d, x, y, z, tint) {   /* y는 상자 밑면의 높이. 무늬 한 장이 가로 2.4m, 세로 1.2m */
      var bg = new T.BoxGeometry(w, h, d).toNonIndexed(), p = bg.attributes.position, n = bg.attributes.normal, u = bg.attributes.uv, k, f, t = tint || 1, gy = height(x, z);
      for (k = 0; k < p.count; k++) {
        f = Math.floor(k / 6);
        BP.push(p.getX(k) + x, p.getY(k) + gy + y + h / 2, p.getZ(k) + z); BN.push(n.getX(k), n.getY(k), n.getZ(k));
        BU.push(u.getX(k) * (f < 2 ? d : w) / 2.4, u.getY(k) * (f === 2 || f === 3 ? d : h) / 1.2); BC.push(t, t, t);
      }
      bg.dispose();
    }
    /* 성벽(11:4): 쌓는 중이라 토막마다 높이가 다르다. 앞쪽(아이들 쪽)에 문 자리가 비어 있다 */
    var wallTop = [], k0, wx, wz, wh;
    for (k0 = 0; k0 < 13; k0++) {
      wx = CITY.x0 + 3 + k0 * 6; if (Math.abs(wx - GATE[0]) < 4) continue;
      wh = 1.2 + hash(k0, 40) * 2.8; brick(6, wh, 2.2, wx, 0, CITY.z1, 0.94 + hash(k0, 41) * 0.12); wallTop.push([wx, CITY.z1, wh]);
      brick(6, 1 + hash(k0, 42) * 3.2, 2.2, wx, 0, CITY.z0, 0.94 + hash(k0, 43) * 0.12);
    }
    for (k0 = 0; k0 < 10; k0++) {
      wz = CITY.z0 + 4 + k0 * 6;
      brick(2.2, 1 + hash(k0, 44) * 3, 6, CITY.x0, 0, wz, 0.94 + hash(k0, 45) * 0.12); brick(2.2, 1.2 + hash(k0, 46) * 3, 6, CITY.x1, 0, wz, 0.94 + hash(k0, 47) * 0.12);
    }
    /* 성읍 안의 집(11:4의 "성"): 낮은 벽돌 집 몇 채. 아직 벽만 선 것도 있다 */
    [[-36, -40, 6, 3, 5], [-34, -54, 5, 1.3, 6], [-37, -70, 6, 3.2, 5], [-26, -80, 7, 2.8, 5], [-24, -42, 5, 2.6, 5], [-22, -64, 5, 1.1, 5], [8, -40, 6, 3, 5], [20, -42, 5, 1.4, 6],
      [22, -56, 6, 3.1, 5], [10, -70, 5, 2.7, 6], [22, -74, 6, 1.2, 5], [8, -82, 7, 3, 5], [-8, -82, 6, 1.5, 5]].forEach(function (q, k) { brick(q[2], q[3], q[4], q[0], 0, q[1], 1.02 + hash(k, 48) * 0.1); });
    /* 탑(11:4-5): 네모난 벽돌 탑 하나. 다 지어지지 않아 꼭대기가 들쭉날쭉하다. 생김새와 높이는 본문에 없다(감수 설정) */
    brick(13, 12, 13, TOWER[0], 0, TOWER[1], 1);
    brick(13, 2.2, 6.5, TOWER[0], 12, TOWER[1] - 3.25, 0.98); brick(6.5, 1.6, 6.5, TOWER[0] - 3.25, 12, TOWER[1] + 3.25, 1.03);
    brick(6.5, 2.6, 4, TOWER[0] + 3.25, 14.2, TOWER[1] - 4.5, 1.02); brick(4, 1.4, 6.5, TOWER[0] - 4.5, 14.2, TOWER[1] - 3.25, 0.97);
    /* 구운 벽돌 더미(11:3) */
    [[STACK[0], STACK[1], 2.4, 1.2, 1.2], [STACK[0] + 3, STACK[1] + 0.4, 2.4, 0.9, 1.2], [STACK[0] - 2.8, STACK[1] - 0.6, 1.2, 0.6, 2.4], [GATE[0] + 6, GATE[1] + 4, 2.4, 0.9, 1.2], [GATE[0] - 7, GATE[1] + 4.5, 2.4, 0.6, 1.2],
      [TOWER[0] + 9, TOWER[1] + 6, 2.4, 0.9, 1.2], [TOWER[0] - 9.5, TOWER[1] + 2, 1.2, 0.6, 2.4]].forEach(function (q) { brick(q[2], q[3], q[4], q[0], 0, q[1], 1.06); });
    var bgeo = new T.BufferGeometry();
    bgeo.setAttribute('position', new T.BufferAttribute(new Float32Array(BP), 3)); bgeo.setAttribute('normal', new T.BufferAttribute(new Float32Array(BN), 3));
    bgeo.setAttribute('uv', new T.BufferAttribute(new Float32Array(BU), 2)); bgeo.setAttribute('color', new T.BufferAttribute(new Float32Array(BC), 3)); bgeo.computeBoundingSphere();
    var bricks = new T.Mesh(bgeo, brickMat); bricks.castShadow = true; bricks.receiveShadow = true; scene.add(bricks);
    var statics = [];
    function keep(o, x, z, lift) { o.position.set(x, height(x, z) + (lift || 0), z); statics.push(o); return o; }
    keep(new T.Mesh(new T.BoxGeometry(2.6, 4.2, 0.3), std('#3A2C24')), TOWER[0], TOWER[1] + 6.45, 2.1);                 /* 탑의 문 자리(어두운 빈 곳) */
    /* 굽기 전의 벽돌(11:3 "벽돌을 만들어"): 마당에 줄지어 늘어놓았다. 한 번에 그린다 */
    var raw = new T.InstancedMesh(new T.BoxGeometry(0.5, 0.16, 0.26), std('#B49A72'), 120), m4 = new T.Matrix4();
    for (i = 0; i < 120; i++) { var rx = KILN[0] - 11 + (i % 12) * 0.75, rz = KILN[1] + 7 + Math.floor(i / 12) * 0.5; m4.makeTranslation(rx, height(rx, rz) + 0.08, rz); raw.setMatrixAt(i, m4); }
    raw.castShadow = false; raw.receiveShadow = true; scene.add(raw);
    /* 가마(11:3 "견고히 굽자"): 낮은 흙 가마 셋. 아궁이의 불빛과 연기 */
    var KILNS = [[KILN[0] - 6, KILN[1] - 3], [KILN[0], KILN[1] - 5], [KILN[0] + 6, KILN[1] - 3]], kilnMat = std('#8C6648'), glowMat = new T.MeshBasicMaterial({ color: '#FF9A48' }), glows = [];
    KILNS.forEach(function (q) {
      var body = new T.Mesh(new T.CylinderGeometry(1.2, 1.9, 2.1, 8), kilnMat); body.castShadow = true; keep(body, q[0], q[1], 1.05);
      keep(new T.Mesh(new T.BoxGeometry(0.9, 0.8, 0.3), std('#2E2420')), q[0], q[1] + 1.72, 0.4);
      var gl = new T.Mesh(new T.BoxGeometry(0.6, 0.45, 0.1), glowMat); put(gl, q[0], q[1] + 1.9, 0.3); glows.push(gl);
    });
    /* 역청(11:3): 검은 역청이 담긴 통 */
    var tubMat = std('#7A5A3E'), pitchMat = std('#141210', { roughness: 0.35 });
    [[KILN[0] + 12, KILN[1] + 1], [KILN[0] + 13.6, KILN[1] + 2.2], [GATE[0] + 5, GATE[1] + 7], [GATE[0] - 5, GATE[1] + 7.5], [TOWER[0] + 8, TOWER[1] + 9]].forEach(function (q) {
      var tb = new T.Mesh(new T.CylinderGeometry(0.62, 0.5, 0.7, 9), tubMat); tb.castShadow = true; keep(tb, q[0], q[1], 0.35);
      keep(new T.Mesh(new T.CylinderGeometry(0.55, 0.55, 0.04, 9), pitchMat), q[0], q[1], 0.71);
    });
    scene.add(PR.mergeStatic(statics));
    /* 가마의 연기: 둥근 덩이뿐 */
    var NPUFF = 16, smoke = PA.puffs ? PA.puffs(KILNS.length * NPUFF, { color: '#D2CCC2', seg: 9 }) : null, smokeAmt = 1, smokeWant = 1;
    if (smoke) scene.add(smoke.mesh);

    /* 사람들(11:3-5): 가마 곁에서 굽는 사람, 벽돌을 나르는 사람, 성과 탑에서 쌓는 사람. 이름과 수는 본문에 없다. 남자와 여자만(백성 모델) */
    var folk = [], NF = 36, carryMat = std('#B8744A');
    /* 흩어지는 길(11:8): 여섯 무리가 저마다 다른 쪽으로. 2번 무리는 아이들이 다니는 곳 곁(길 밖)을 지나간다 */
    var ROUTES = [[[-13, -16], [-260, -40]], [[-11, -10], [-210, 150]], [[-2, -9], [LEAVE_X, 14], [LEAVE_X, 96], [16, 300]], [[1, -15], [260, -40]], [[-10, -20], [-62, -30], [-170, -250]], [[-2, -20], [48, -32], [170, -250]]];
    var RLEN = ROUTES.map(function (r) { var L = [0], k; for (k = 1; k < r.length; k++) L.push(L[k - 1] + Math.hypot(r[k][0] - r[k - 1][0], r[k][1] - r[k - 1][1])); return L; });
    function along(gi, s) {
      var r = ROUTES[gi], L = RLEN[gi], k; s = Math.max(0, s);
      for (k = 1; k < r.length; k++) if (s <= L[k] || k === r.length - 1) { var t = (s - L[k - 1]) / (L[k] - L[k - 1]); return [r[k - 1][0] + (r[k][0] - r[k - 1][0]) * t, r[k - 1][1] + (r[k][1] - r[k - 1][1]) * t, Math.atan2(r[k][0] - r[k - 1][0], r[k][1] - r[k - 1][1])]; }
      return [r[0][0], r[0][1], 0];
    }
    for (i = 0; i < NF; i++) {
      var o = null, role = i < 12 ? 'carry' : i < 20 ? 'kiln' : i < 24 ? 'top' : i < 32 ? 'build' : 'pitch', kind = (i % 3 === 2 && role !== 'top') ? 'woman' : 'man';
      try { if (M2.israelite) o = M2.israelite(i * 23 + 11, { kind: kind, carry: 'none' }); } catch (e) { o = null; }
      if (!o) o = PR.soldier(i, '#7A6A4A', null);
      var f = { o: o, role: role, grp: i % 6, off: [((Math.floor(i / 6) % 2) - 0.5) * 1.5 + (hash(i, 5) - 0.5) * 0.6, (Math.floor(i / 12) - 1) * 1.6 + (hash(i, 6) - 0.5) * 0.6], home: [0, 0], lift: 0, ry: 0, s: 0, load: null };
      if (role === 'carry') { f.load = new T.Mesh(new T.BoxGeometry(0.44, 0.2, 0.26), carryMat); f.load.position.set(0.2, 1.5, 0.02); o.group.add(f.load); }
      if (role === 'kiln') { var kq = KILNS[(i - 12) % 3], ka = [0.5, 1.6, 2.7, 0.9, 2.2, 1.2, 0.2, 2.9][i - 12]; f.home = [kq[0] + Math.cos(ka) * 3.3, kq[1] + Math.sin(ka) * 3.3]; f.ry = Math.atan2(kq[0] - f.home[0], kq[1] - f.home[1]); }
      if (role === 'top') { var wt = wallTop[[3, 5, 7, 9][i - 20]]; f.home = [wt[0] + (hash(i, 7) - 0.5) * 3, wt[1]]; f.lift = wt[2]; f.ry = hash(i, 8) * 6.28; }
      if (role === 'build') { var bi = i - 24; f.home = bi < 4 ? [TOWER[0] - 5 + bi * 3.4, TOWER[1] + 8] : [CITY.x0 + 14 + (bi - 4) * 17, CITY.z1 + 2.2]; f.ry = Math.PI; }
      if (role === 'pitch') { var pq = [[KILN[0] + 12.8, KILN[1] + 3.4], [KILN[0] + 14.8, KILN[1] + 1.2], [GATE[0] + 5, GATE[1] + 8.4], [GATE[0] - 5, GATE[1] + 8.8]][i - 32]; f.home = pq; f.ry = Math.PI; }
      o.group.rotation.order = 'YXZ'; scene.add(o.group); folk.push(f);
    }
    var CARRY_L = Math.hypot(GATE[0] - STACK[0], GATE[1] - 2 - STACK[1] + 2);
    function carryAt(f, s) {   /* 더미와 성문 사이를 오간다. 갈 때는 벽돌을 메고, 올 때는 빈손 */
      var L = CARRY_L, u = s % (2 * L), go = u < L, t = (go ? u : 2 * L - u) / L, ax = STACK[0], az = STACK[1] - 2, bx = GATE[0], bz = GATE[1] + 2, side = go ? 0.9 : -0.9;
      var px = ax + (bx - ax) * t + side, pz = az + (bz - az) * t;
      f.o.group.position.set(px, height(px, pz), pz); f.o.group.rotation.y = Math.atan2((bx - ax) * (go ? 1 : -1), (bz - az) * (go ? 1 : -1)); if (f.load) f.load.visible = go;
    }
    var phase = 'work', goS = 0;
    /* 대목마다 모든 상태를 처음부터 정한다('이전'으로 돌아와도 뒤 대목의 것이 남지 않게) */
    function setPhase(p) {
      phase = p; smokeWant = p === 'babel' ? 0 : 1; if (p === 'work') smokeAmt = 1; if (p === 'babel') smokeAmt = 0;
      glows.forEach(function (gl) { gl.visible = p !== 'babel'; });
      if (p === 'work') folk.forEach(function (f, k) {
        f.o.group.visible = true;
        if (f.role === 'carry') { f.s = k / 12 * 2 * CARRY_L; carryAt(f, f.s); }
        else { f.o.group.position.set(f.home[0], height(f.home[0], f.home[1]) + f.lift, f.home[1]); f.o.group.rotation.set(0, f.ry, 0); }
      });
      if (p === 'scatter') goS = 7;      /* 11:8: 일을 멈추고 무리 지어 떠나기 시작한다 */
      if (p === 'babel') goS = 125;      /* 11:9: 이미 멀리 떠나가고 있다 */
      if (p !== 'work') { folk.forEach(function (f) { if (f.load) f.load.visible = false; }); placeGroups(); }
    }
    function placeGroups() {
      folk.forEach(function (f) {
        var L = RLEN[f.grp], tot = L[L.length - 1], s = goS + f.off[1] * 1.2, q = along(f.grp, s), px = q[0] + Math.cos(q[2]) * f.off[0], pz = q[1] - Math.sin(q[2]) * f.off[0];
        f.o.group.position.set(px, height(px, pz), pz); f.o.group.rotation.set(0, q[2], 0); f.o.group.visible = s < tot - 4;
      });
    }
    function v3(x, y, z) { return new T.Vector3(x, y, z); }
    /* 지켜보기 카메라: 틀이 화면을 위로 20% 올려 주므로 볼 것(t)을 거의 그대로 겨눈다 */
    function cam(p, up, t) {
      var py = height(p[0], p[1]) + up, d = Math.hypot(t[0] - p[0], t[2] - p[1]), el = Math.atan2(t[1] + height(t[0], t[2]) - py, d) - 0.04;
      return { pos: [p[0], py, p[1]], look: [t[0], py + d * Math.tan(el), t[2]] };
    }
    if (FX) FX.sortLayers(scene);
    var PH = ['work', 'work', 'work', 'work', 'scatter', 'babel'];
    setPhase('work');

    return {
      id: 'OT-04', scene: scene, sun: sun, sunOff: [-32, 50, 28],
      height: height, walkable: walkable,
      edge: function (x, z) {
        if (z < 34) return { who: 'onwoo', text: '성과 탑, 벽돌 굽는 곳 쪽으로는 다가가지 말자. 쌓는 일은 우리가 돕지 않아.' };
        if (x > 12) return { who: 'hyu', text: '저쪽은 사람들이 지나다니는 길이야. 길은 비워 두자.' };
        return { who: 'hyu', text: '평지 가장자리에서 너무 멀리 가지는 말자.' };
      },
      P: { start: [-7, 54], machine: [2, 63], machineRot: -2.2,
        /* 재료가 놓인 곳(quests[i].found): 성과 탑에서 멀리 떨어진 평지의 끝 / 벽돌 굽는 곳에서 멀찍이 떨어진 빈 땅 / 성과 탑이 멀리 보이는 평지 가장자리 */
        parts: [[7, 78], [-23, 39], [-7, 38]], lookSpot: [-7, 38],
        look: { focus: TOWER, mid: [-7, -10], dy: 6, backE: 7, upE: 2.6 } },
      eventCam: function (i) {
        if (i === 2) return cam([4, 10], 4.5, [GATE[0], 5.5, GATE[1] - 8]);          /* 11:4: 벽돌을 나르는 사람들 너머로 쌓고 있는 성과 탑 */
        if (i === 3) return cam([36, 12], 11, [TOWER[0] + 2, 6, TOWER[1] + 10]);     /* 11:5-7: 쌓는 모습 그대로. 다른 것은 없다 */
        if (i === 4) return cam([34, 58], 30, [MUSTER[0], 0, MUSTER[1]]);            /* 11:8: 여러 쪽으로 떠나가는 무리를 멀리서 */
        if (i === 5) return cam([8, 36], 9, [TOWER[0], 5, TOWER[1] + 12]);           /* 11:9: 쌓다가 그친 성읍과 탑 */
        return null;
      },
      detector: '탐지기', askLabel: '탐지기 물음 풀기',
      intro: { text: '타임머신이 넓은 평지 가장자리에 내려앉았어요. 저 멀리 연기가 오르고, 사람들이 무엇인가를 쌓고 있어요.', say: { who: 'hyu', text: '우리는 평지 가장자리에서만 다니자.' } },
      lookText: '바벨 이야기를 성경에서 찾아 읽은 뒤 다시 골라 보세요.',
      partBeats: [0, 1], eventStart: 2,
      beatNote: function (i) {
        if (i === 2) return '탑의 생김새와 높이는 성경에 적혀 있지 않아요. 이 모습은 쌓는 중인 단순한 꼴로만 그린 거예요.';
        if (i === 3) return '여호와께서 내려오신 일과 하신 말씀은 모습이나 소리로 만들지 않아요. 성경책에서 읽어요.';
        if (i === 4) return '사람들의 말이 뒤섞인 것은 소리로 들려주지 않아요. 우리는 멀리서 지켜봐요.';
        if (i === 5) return '성경은 성 쌓기를 그쳤다고만 말해요. 탑이 무너졌다는 말은 없어요.';
        return null;
      },
      sceneDoneText: '바벨 이야기를 끝까지 지켜봐야 떠날 수 있어요.',
      dex: [
        { id: 'tower', name: '쌓고 있는 탑', desc: '사람들은 성과 탑을 쌓아 탑 꼭대기를 하늘에 닿게 하자고 했다. 생김새와 높이는 성경에 적혀 있지 않다', ref: '창 11:4', hint: '평지 저편에 쌓고 있는 것을 담아 보세요.', range: 260, crop: 0.5, pos: function () { return v3(TOWER[0], 8, TOWER[1]); } },
        { id: 'city', name: '쌓고 있는 성읍', desc: '여호와께서 사람들을 흩으시자 그들은 성 쌓기를 그쳤다', ref: '창 11:8', hint: '탑을 둘러싼 낮은 성벽을 담아 보세요.', range: 260, crop: 0.8, pos: function () { return v3(GATE[0] + 14, 2, CITY.z1); } },
        { id: 'kiln', name: '벽돌 굽는 곳', desc: '사람들은 서로 벽돌을 만들어 단단히 굽자고 했다. 돌 대신 벽돌을 썼다', ref: '창 11:3', hint: '연기가 오르는 곳을 담아 보세요.', range: 120, crop: 0.5, pos: function () { return v3(KILN[0], 1.5, KILN[1] - 3); } },
        { id: 'pitch', name: '역청', desc: '사람들은 진흙 대신 역청을 썼다', ref: '창 11:3', hint: '벽돌 굽는 곳 곁, 검은 것이 담긴 통이에요.', range: 90, crop: 0.25, pos: function () { return v3(KILN[0] + 12.8, 0.6, KILN[1] + 1.6); } }
      ],
      reset: function () { setPhase('work'); },
      partFound: function () {},
      partContinue: function () {},
      lookupPose: function () {},
      /* 대목 번호(OT-04.json): 0 = 11:1-2, 1 = 11:3, 2 = 11:4, 3 = 11:5-7, 4 = 11:8, 5 = 11:9 */
      beatPose: function (i) { setPhase(PH[i] || 'work'); },
      update: function (dt, now) {
        if (phase === 'work') folk.forEach(function (f) {
          if (f.role === 'carry') { f.s += 1.25 * dt; carryAt(f, f.s); if (f.o.update) f.o.update(dt, 1.0, now); }
          else if (f.o.update) f.o.update(dt, 0, now);
        });
        else { goS += 1.9 * dt; placeGroups(); folk.forEach(function (f) { if (f.o.group.visible && f.o.update) f.o.update(dt, 1.1, now); }); }
        if (Math.abs(smokeAmt - smokeWant) > 0.002) smokeAmt += (smokeWant - smokeAmt) * Math.min(1, dt * 0.8);
        if (smoke) {
          for (var k = 0; k < smoke.n; k++) {
            var q = KILNS[Math.floor(k / NPUFF)], u = ((now * 0.11 + (k % NPUFF) / NPUFF + Math.floor(k / NPUFF) * 0.37) % 1 + 1) % 1;
            smoke.put(k, q[0] - u * u * 6 + Math.sin(k * 2.3 + u * 5) * 0.5, height(q[0], q[1]) + 2.0 + u * 9, q[1] + Math.cos(k * 1.7 + u * 4) * 0.5, (0.65 + u * 1.9) * smokeAmt * (1 - sm(0.75, 1, u)));   /* 덩이들이 서로 겹쳐 한 줄기 연기로 보이게 */
          }
          smoke.commit();
        }
      },
      audio: function (A, pp) { A.setFlock(999); A.setFire(phase === 'babel' || !pp ? 999 : Math.hypot(pp.x - KILN[0], pp.z - KILN[1])); },
      menuCam: function (camera, now) { var a2 = now * 0.05; camera.position.set(-7 + Math.sin(a2) * 6, 8, 50); camera.lookAt(TOWER[0], 6, TOWER[1]); },
      debug: { phase: function () { return { phase: phase, goS: goS, smoke: smokeAmt, shown: folk.filter(function (f) { return f.o.group.visible; }).length }; }, arrived: function () { return true; } }
    };
  };
})();
