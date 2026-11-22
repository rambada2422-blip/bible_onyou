/* bible_onyou 3D 모델 2 (배경·소품): 여리고 성읍, 종려나무, 갈대, 곡식밭 */
(function () {
  'use strict';
  var T = window.THREE;
  var BO3D = window.BO3D = window.BO3D || {};
  var K2 = BO3D._jordanKit;
  var PI = K2.PI, TAU = K2.TAU;
  var rng = K2.rng, lerp = K2.lerp, clamp = K2.clamp, shade = K2.shade, mat = K2.mat, TR = K2.TR;
  var Builder = K2.Builder, loft = K2.loft, ball = K2.ball, tubeAlong = K2.tubeAlong, curvePts = K2.curvePts;
  var V = K2.V, displace = K2.displace, lumpy = K2.lumpy, triGeo = K2.triGeo, face = K2.face, along = K2.along;

  /* ================================================================== 여리고: 멀리 보이는 성벽 도시 */
  // 폭 약 80m(X), 깊이 약 55m(Z), 성벽 높이 약 9m. 성문은 +Z 쪽. 낮은 둔덕 위에 서 있다.
  function makeJericho() {
    var R = rng(7331), b = new Builder(), group = new T.Group();
    var A = 36.5, B = 23, Y0 = 2, WH = 9, TH = 2.6, N = 16, i, j;
    var WALLS = ['#C2905F', '#B98258', '#AD7850'], STONE = '#8F6E54', STONE_SH = '#7A5C46', TOWER = '#C99A68', TOWER_SH = '#A8784E', CAP = '#D6AA76';
    var HOUSES = ['#E2C090', '#D6AE7C', '#EACB9A', '#CBA070', '#DDB886', '#D9B584'], ROOF = '#F1DCB0', DARK = '#3E2A1E', WOOD = '#6E4A2C';
    var UP = V(0, 1, 0);
    var tone = function (c0, c1) { return function (x, y, z, nx, ny, nz) { return ny > 0.5 ? CAP : (nx * 0.55 + nz * 0.45 > -0.1 ? c0 : c1); }; };

    /* 둔덕과 성 안의 오르막 */
    b.add(loft([[0, A + 5.5, B + 5.5], [0.9, A + 3.6, B + 3.6], [Y0, A + 1.6, B + 1.6], [Y0 + 0.4, A - 3, B - 3], [Y0 + 6.4, A * 0.5, B * 0.5], [Y0 + 11.6, 0.01, 0.01]], 24),
      function (x, y, z, nx, ny) { return y > Y0 ? '#C7A070' : ny > 0.75 ? '#D9BA86' : '#CBA672'; });
    var groundY = function (x, z) { var r = Math.sqrt(x * x / (A * A) + z * z / (B * B)); return Y0 + 11.4 * clamp(1 - r / 0.96, 0, 1) + 0.3; };

    /* 성벽 꼭짓점: 타원을 따라가되 조금씩 들쭉날쭉하게. 0번과 N-1번 사이가 성문 */
    var ring = [];
    for (i = 0; i < N; i++) {
      var th = PI / 2 + (i + 0.5) / N * TAU, jit = (i === 0 || i === N - 1) ? 1 : 0.965 + R() * 0.07;
      ring.push(V(Math.cos(th) * A * jit, 0, Math.sin(th) * B * jit));
    }
    ring[0].set(-6.6, 0, B - 0.3);
    ring[N - 1].set(6.6, 0, B - 0.3);

    function yaw(dir) { return Math.atan2(-dir.z, dir.x); }
    for (i = 0; i < N; i++) {
      var p = ring[i], q = ring[(i + 1) % N], gate = i === N - 1;
      var dir = q.clone().sub(p), len = dir.length();
      dir.normalize();
      var out = V(dir.z, 0, -dir.x), topY = Y0 + WH + (gate ? 1.4 : 0), th2 = gate ? TH + 1 : TH;
      var P = function (pt, off, y) { return V(pt.x + out.x * off, y, pt.z + out.z * off); };
      var wc = WALLS[i % 3];
      face(b, [P(p, 0.75, Y0 - 0.4), P(q, 0.75, Y0 - 0.4), P(q, 0.2, Y0 + 2.7), P(p, 0.2, Y0 + 2.7)], i % 2 ? STONE : STONE_SH, out);      // 돌 기초
      face(b, [P(p, 0.2, Y0 + 2.7), P(q, 0.2, Y0 + 2.7), P(q, 0, topY), P(p, 0, topY)], wc, out);                                              // 진흙 벽돌 벽
      face(b, [P(p, 0, topY), P(q, 0, topY), P(q, -th2, topY), P(p, -th2, topY)], CAP, UP);
      face(b, [P(p, -th2, topY), P(q, -th2, topY), P(q, -th2, Y0 + 0.5), P(p, -th2, Y0 + 0.5)], shade(wc, 0.8), out.clone().negate());
      // 성가퀴
      var nm = Math.max(2, Math.round(len / 4.6)), mid = p.clone().lerp(q, 0.5);
      for (j = 0; j < nm; j++) {
        var mp = p.clone().lerp(q, (j + 0.5) / nm);
        if (gate && Math.abs((j + 0.5) / nm - 0.5) > 0.4) continue;
        b.add(new T.BoxGeometry(len / nm * 0.56, 1.05, 0.8), tone(wc, shade(wc, 0.86)), TR(mp.x - out.x * 0.4, topY + 0.52, mp.z - out.z * 0.4, 0, yaw(dir), 0));
      }
      if (gate) {
        /* 성문: 앞으로 조금 나온 문루, 어두운 문간, 나무 문짝 */
        var zf = mid.z + 1.5, gy = Y0 - 0.3;
        b.add(new T.BoxGeometry(8.2, 8.6, 2.2), tone('#CFA06C', '#B08052'), TR(0, gy + 4.3, mid.z + 0.42));
        face(b, [V(-2.3, gy, zf + 0.03), V(2.3, gy, zf + 0.03), V(2.3, gy + 5.9, zf + 0.03), V(-2.3, gy + 5.9, zf + 0.03)], DARK, V(0, 0, 1));
        face(b, [V(-1.95, gy, zf + 0.07), V(-0.08, gy, zf + 0.07), V(-0.08, gy + 5.3, zf + 0.07), V(-1.95, gy + 5.3, zf + 0.07)], WOOD, V(0, 0, 1));
        face(b, [V(0.08, gy, zf + 0.07), V(1.95, gy, zf + 0.07), V(1.95, gy + 5.3, zf + 0.07), V(0.08, gy + 5.3, zf + 0.07)], shade(WOOD, 0.9), V(0, 0, 1));
        b.add(new T.BoxGeometry(5.6, 0.55, 0.4), '#5A3A22', TR(0, gy + 6.15, zf + 0.12));
        /* 성문으로 올라가는 길 */
        var r0 = [V(-2.6, Y0 - 0.25, zf), V(2.6, Y0 - 0.25, zf)], r1 = [V(-3.6, 0.9, zf + 4.5), V(3.6, 0.9, zf + 4.5)], r2 = [V(-4.6, 0.03, zf + 9), V(4.6, 0.03, zf + 9)];
        face(b, [r0[0], r0[1], r1[1], r1[0]], '#E2CA9C', UP);
        face(b, [r1[0], r1[1], r2[1], r2[0]], '#DCC292', UP);
        [0, 1].forEach(function (e) {
          var sx = e ? 1 : -1;
          face(b, [r0[e], r1[e], V(r1[e].x, 0, r1[e].z), V(r0[e].x, 0, r0[e].z)], '#C29C6A', V(sx, 0, 0));
          face(b, [r1[e], r2[e], V(r1[e].x, 0, r1[e].z)], '#C29C6A', V(sx, 0, 0));
        });
      }
    }

    /* 망대: 꼭짓점 하나 건너 하나씩. 성문 양옆의 둘은 더 크다 */
    for (i = 0; i < N; i++) {
      var tp = ring[i], big = i === 0 || i === N - 1;
      if (!big && i % 2) continue;
      var od = V(tp.x / (A * A), 0, tp.z / (B * B)).normalize();
      if (big) od.set(0, 0, 1);
      var tw = big ? 5.6 : 4.0 + R() * 0.8, thh = WH + (big ? 3.8 : 1.9 + R() * 0.9), ty = Y0 - 0.5, ya = big ? 0 : Math.atan2(od.x, od.z);
      var cx = tp.x + od.x * (big ? 0.9 : 0.7), cz = tp.z + od.z * (big ? 0.9 : 0.7);
      b.add(new T.CylinderGeometry(tw / Math.SQRT2, (tw + 1.2) / Math.SQRT2, thh, 4, 1), tone(TOWER, TOWER_SH), TR(cx, ty + thh / 2, cz, 0, ya + PI / 4, 0));
      b.add(new T.BoxGeometry(tw + 0.9, 0.9, tw + 0.9), tone(shade(TOWER, 1.05), shade(TOWER_SH, 1.02)), TR(cx, ty + thh + 0.3, cz, 0, ya, 0));
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (c2) {
        var o2 = V(c2[0] * (tw + 0.9 - 1.5) / 2, 0, c2[1] * (tw + 0.9 - 1.5) / 2).applyAxisAngle(UP, ya);
        b.add(new T.BoxGeometry(1.5, 1.1, 1.5), tone(TOWER, TOWER_SH), TR(cx + o2.x, ty + thh + 1.25, cz + o2.z, 0, ya, 0));
      });
    }

    /* 성 안의 납작 지붕 집들: 안쪽으로 갈수록 높은 자리에 있어 성벽 위로 보인다 */
    var placed = [], tries = 0;
    while (placed.length < 44 && tries++ < 900) {
      var a2 = R() * TAU, rr = Math.sqrt(R()) * 0.84, hx2 = Math.cos(a2) * rr * (A - 3), hz2 = Math.sin(a2) * rr * (B - 3);
      var w2 = 4.2 + R() * 3.4, d2 = 4 + R() * 2.8, ok = true;
      for (j = 0; j < placed.length; j++) if (Math.abs(placed[j][0] - hx2) < (placed[j][2] + w2) * 0.46 && Math.abs(placed[j][1] - hz2) < (placed[j][3] + d2) * 0.46) { ok = false; break; }
      if (!ok) continue;
      placed.push([hx2, hz2, w2, d2]);
      var gy2 = groundY(hx2, hz2), hh = 4.4 + R() * 3 + (1 - rr) * 2.2, hc = HOUSES[Math.floor(R() * HOUSES.length)], ry = (R() - 0.5) * 0.3;
      var houseCol = (function (c0) { return function (x, y, z, nx, ny, nz) { return ny > 0.5 ? ROOF : (nx * 0.55 + nz * 0.45 > -0.1 ? c0 : shade(c0, 0.8)); }; })(hc);
      b.add(new T.BoxGeometry(w2, hh + 1.5, d2), houseCol, TR(hx2, gy2 + (hh - 1.5) / 2, hz2, 0, ry, 0));
      var front = hz2 >= 0 ? 1 : -1, wm = TR(hx2, gy2, hz2, 0, ry, 0), nwin = 1 + Math.floor(R() * 2);
      for (j = 0; j < nwin; j++) {
        var wx = (j - (nwin - 1) / 2) * w2 * 0.42 + (R() - 0.5) * 0.4, wy = hh - 1.5 - R() * 0.6;
        var wq = [V(wx - 0.4, wy, front * (d2 / 2 + 0.04)), V(wx + 0.4, wy, front * (d2 / 2 + 0.04)), V(wx + 0.4, wy + 1.0, front * (d2 / 2 + 0.04)), V(wx - 0.4, wy + 1.0, front * (d2 / 2 + 0.04))];
        wq.forEach(function (pt) { pt.applyMatrix4(wm); });
        face(b, wq, DARK, V(0, 0, front));
      }
      if (R() < 0.45) {      // 지붕 위의 작은 다락방
        var uw = w2 * (0.4 + R() * 0.15), ud = d2 * (0.45 + R() * 0.15), o3 = V((R() < 0.5 ? -1 : 1) * (w2 - uw) / 2, 0, -(d2 - ud) / 2).applyAxisAngle(UP, ry);
        b.add(new T.BoxGeometry(uw, 2.4, ud), houseCol, TR(hx2 + o3.x, gy2 + hh + 1.2, hz2 + o3.z, 0, ry, 0));
      }
    }
    /* 성벽 위에 붙여 지은 집 몇 채 (수 2:15) */
    [3, 10, 13].forEach(function (si, n) {
      var p3 = ring[si], q3 = ring[si + 1], m3 = p3.clone().lerp(q3, 0.35 + 0.2 * n), d3 = q3.clone().sub(p3).normalize(), o4 = V(d3.z, 0, -d3.x);
      var hc2 = HOUSES[n], ww = 5 + n * 0.6, hh2 = 3.2 + n * 0.5, ya2 = yaw(d3), topY2 = Y0 + WH;
      b.add(new T.BoxGeometry(ww, hh2, TH + 1.6), function (x, y, z, nx, ny, nz) { return ny > 0.5 ? ROOF : (nx * 0.55 + nz * 0.45 > -0.1 ? hc2 : shade(hc2, 0.8)); },
        TR(m3.x - o4.x * (TH / 2 + 0.75), topY2 + hh2 / 2 - 0.05, m3.z - o4.z * (TH / 2 + 0.75), 0, ya2, 0));
      var wm2 = TR(m3.x + o4.x * 0.1, topY2 + hh2 * 0.42, m3.z + o4.z * 0.1, 0, ya2, 0);
      var wq2 = [V(-0.45, 0, 0), V(0.45, 0, 0), V(0.45, 1.1, 0), V(-0.45, 1.1, 0)];
      wq2.forEach(function (pt) { pt.applyMatrix4(wm2); });
      face(b, wq2, DARK, o4);
    });

    group.add(b.mesh(mat('flat')));
    return group;
  }

  /* ================================================================== 강가 소품 */
  /* 종려나무: 높이 6~9m. 고리 무늬 줄기 끝에 깃 모양 잎이 사방으로 휘어 늘어진다. */
  function makePalm(seed) {
    var R = rng((seed | 0) + 401), wood = new Builder(), leaf = new Builder(), group = new T.Group();
    var h = 6 + R() * 3, la = R() * TAU, lean = 0.04 + R() * 0.1, sc = h / 7.5, i, j;
    var topP = V(Math.cos(la) * lean * h, h * 0.77, Math.sin(la) * lean * h);          // 잎 끝까지 합쳐 높이 h쯤
    var trunk = curvePts([V(0, 0, 0), V(topP.x * 0.2 + (R() - 0.5) * 0.25, h * 0.4, topP.z * 0.2 + (R() - 0.5) * 0.25), topP], 9);
    var BARK = ['#8E7150', '#7A5E40', '#A08460'];
    wood.add(tubeAlong(trunk, function (t) { return (0.2 + 0.14 * Math.pow(1 - t, 5) - 0.05 * t) * sc; }, 0, 6),
      function (x, y, z, nx, ny, nz, ti) { var r = Math.floor(ti / 12); return nx * 0.7 + nz * 0.3 > 0.1 ? BARK[r % 2 ? 0 : 2] : BARK[1]; });
    wood.add(displace(ball(6, 4), lumpy(R, 0.08)), '#7A6238', TR(topP.x, topP.y + 0.05 * sc, topP.z, 0, 0, 0, 0.3 * sc, 0.42 * sc, 0.3 * sc));
    // 대추야자 송이
    var nd = 2 + Math.floor(R() * 2);
    for (i = 0; i < nd; i++) {
      var da = R() * TAU;
      wood.add(displace(ball(5, 3), lumpy(R, 0.1)), i % 2 ? '#B5652A' : '#C97A2E', TR(topP.x + Math.cos(da) * 0.34 * sc, topP.y - 0.3 * sc, topP.z + Math.sin(da) * 0.34 * sc, 0, 0, 0, 0.15 * sc, 0.3 * sc, 0.15 * sc));
    }
    var GREENS = ['#5E7F3C', '#6F8448', '#7E9950', '#55733A'], DRY = ['#B59A5E', '#A58A52'];
    var UPV = V(0, 1, 0);
    // 잎 하나: 가운데 잎맥을 따라 휘고, 양옆 조각은 아래로 처져 ∧ 모양 단면. 가장자리는 톱니처럼 들쭉날쭉.
    function frond(az, el, len, droop, cols, wid) {
      var d = V(Math.cos(az), 0, Math.sin(az)), side = V(-d.z, 0, d.x), n = 6, p = topP.clone().add(V(0, 0.12 * sc, 0)).addScaledVector(d, 0.12 * sc);
      var rib = [p.clone()], lft = [], rgt = [], t, ph, w;
      for (j = 1; j <= n; j++) {
        t = j / n; ph = el - droop * Math.pow(t, 1.4);
        p.addScaledVector(d, Math.cos(ph) * len / n).addScaledVector(UPV, Math.sin(ph) * len / n);
        rib.push(p.clone());
      }
      for (j = 0; j <= n; j++) {
        t = j / n;
        w = wid * Math.pow(Math.sin(PI * (0.06 + 0.94 * t)), 0.55) * (j % 2 ? 1 : 0.7) * (j === n ? 0 : 1);
        lft.push(rib[j].clone().addScaledVector(side, w).addScaledVector(UPV, -w * 0.45));
        rgt.push(rib[j].clone().addScaledVector(side, -w).addScaledVector(UPV, -w * 0.45));
      }
      var L = [], Rr = [];
      for (j = 0; j < n; j++) {
        [[rib[j], rib[j + 1], lft[j + 1]], [rib[j], lft[j + 1], lft[j]]].forEach(function (tr) { tr.forEach(function (q) { L.push(q.x, q.y, q.z); }); });
        [[rib[j], rgt[j + 1], rib[j + 1]], [rib[j], rgt[j], rgt[j + 1]]].forEach(function (tr) { tr.forEach(function (q) { Rr.push(q.x, q.y, q.z); }); });
      }
      leaf.add(triGeo(L), cols[0]);
      leaf.add(triGeo(Rr), cols[1]);
    }
    var nf = 12 + Math.floor(R() * 3), LEN = (2.9 + R() * 0.5) * sc;
    for (i = 0; i < nf; i++) {
      var f = i / (nf - 1), c0 = GREENS[Math.floor(R() * GREENS.length)];
      frond(i * 2.39996 + R() * 0.3, lerp(1.25, -0.1, Math.pow(f, 0.8)), LEN * (0.72 + 0.28 * Math.sin(PI * (0.25 + 0.75 * f))), lerp(0.9, 1.75, f) + R() * 0.2, [c0, shade(c0, 0.84)], 0.42 * sc);
    }
    for (i = 0; i < 3; i++) frond(i * 2.1 + R(), -0.75 - R() * 0.3, LEN * 0.62, 0.55, [DRY[0], DRY[1]], 0.3 * sc);       // 마른 잎 몇 장이 줄기 쪽으로 처져 있다
    group.add(wood.mesh(mat('flat')));
    group.add(leaf.mesh(mat('leaf')));
    return group;
  }

  /* 갈대 덤불: 지름 1.5m쯤. 가늘고 긴 잎과 이삭 달린 줄기. */
  function makeReeds(seed) {
    var R = rng((seed | 0) * 3 + 509), b = new Builder(), group = new T.Group();
    var n = 30 + Math.floor(R() * 10), i;
    var GREENS = ['#7E9950', '#93A85A', '#6F8448', '#889C4E', '#A8B066'], TAN = ['#C7A36B', '#B08A58', '#D2B480'];
    for (i = 0; i < n; i++) {
      var a = R() * TAU, d = Math.sqrt(R()) * 0.5, bx = Math.cos(a) * d, bz = Math.sin(a) * d;
      var h = (1.25 + R() * 1.25) * (1.12 - d * 0.5), la = a + (R() - 0.5) * 1.6, lean = 0.04 + d * 0.22 + R() * 0.1;
      var dir = V(Math.cos(la), 0, Math.sin(la)), side = V(-dir.z, 0, dir.x).applyAxisAngle(dir, R() * PI), w = 0.035 + R() * 0.025;
      var p0 = V(bx, 0, bz), p1 = p0.clone().addScaledVector(dir, h * lean * 0.35).add(V(0, h * 0.55, 0)), p2 = p0.clone().addScaledVector(dir, h * lean).add(V(0, h, 0));
      var plume = i % 3 === 0, col = GREENS[Math.floor(R() * GREENS.length)];
      var l0 = p0.clone().addScaledVector(side, w), r0 = p0.clone().addScaledVector(side, -w), l1 = p1.clone().addScaledVector(side, w * 0.7), r1 = p1.clone().addScaledVector(side, -w * 0.7);
      b.add(triGeo([l0.x, l0.y, l0.z, r0.x, r0.y, r0.z, r1.x, r1.y, r1.z, l0.x, l0.y, l0.z, r1.x, r1.y, r1.z, l1.x, l1.y, l1.z, l1.x, l1.y, l1.z, r1.x, r1.y, r1.z, p2.x, p2.y, p2.z]), col, null, [0, h * 0.6, 0.72]);
      if (plume) {
        // 이삭: 줄기 끝에서 한쪽으로 숙은 갸름한 덩이
        var pd = p2.clone().sub(p1).normalize().add(dir.clone().multiplyScalar(0.35)).normalize();
        b.add(new T.SphereGeometry(1, 4, 2), TAN[i % 3], along(p2.clone().addScaledVector(pd, 0.14), pd.clone().negate(), 0.045, 0.2, 0.045));
      } else {
        // 옆으로 뻗은 긴 잎
        var q0 = p0.clone().lerp(p1, 0.55 + R() * 0.3), ld = dir.clone().applyAxisAngle(V(0, 1, 0), (R() - 0.5) * 2.4), ll = 0.3 + R() * 0.3;
        var q1 = q0.clone().addScaledVector(ld, ll).add(V(0, ll * (0.5 - R() * 0.5), 0)), q2 = q0.clone().add(V(0, 0.14, 0));
        b.add(triGeo([q0.x, q0.y, q0.z, q1.x, q1.y, q1.z, q2.x, q2.y, q2.z]), shade(col, 1.08));
      }
    }
    group.add(b.mesh(mat('leaf')));
    return group;
  }

  /* 누렇게 익은 곡식밭 한 뙈기: 4m × 4m쯤 (수 3:15, 곡식 거두는 시기). 촘촘한 줄기 덩어리 위로 이삭이 솟아 있다. */
  function makeGrain(seed) {
    var R = rng((seed | 0) * 5 + 613), b = new Builder(), lb = new Builder(), group = new T.Group();
    var S = 2, nq = 6, i, j;
    var GOLD = ['#E3BA4C', '#D9AA3E', '#EBC65E', '#CFA038'], STALK = '#B7933E', STALK_SH = '#8F7230';
    var hts = [];
    for (j = 0; j <= nq; j++) { hts.push([]); for (i = 0; i <= nq; i++) hts[j].push(0.62 + R() * 0.16); }
    var px = function (i2) { return -S + 2 * S * i2 / nq; };
    var topH = function (x, z) {      // 격자 위 높이(이삭을 세울 자리)
      var fx = clamp((x + S) / (2 * S) * nq, 0, nq - 1e-4), fz = clamp((z + S) / (2 * S) * nq, 0, nq - 1e-4), ix = Math.floor(fx), iz = Math.floor(fz);
      return lerp(lerp(hts[iz][ix], hts[iz][ix + 1], fx - ix), lerp(hts[iz + 1][ix], hts[iz + 1][ix + 1], fx - ix), fz - iz);
    };
    // 윗면
    var arr = [];
    for (j = 0; j < nq; j++) for (i = 0; i < nq; i++) {
      var x0 = px(i), x1 = px(i + 1), z0 = px(j), z1 = px(j + 1);
      arr.push(x0, hts[j][i], z0, x0, hts[j + 1][i], z1, x1, hts[j][i + 1], z0, x1, hts[j][i + 1], z0, x0, hts[j + 1][i], z1, x1, hts[j + 1][i + 1], z1);
    }
    b.add(triGeo(arr), function (x, y, z, nx, ny, nz, ti) { return GOLD[(ti * 7 + Math.floor(ti / 3)) % 4]; });
    // 옆면: 아래로 갈수록 어두운 줄기 색, 밑동이 조금 들어가 있다
    var sideArr = [];
    function sideQuad(ax, az, ah, bx2, bz2, bh, ox, oz) {
      var a0 = [ax - ox * 0.12, 0, az - oz * 0.12], b0 = [bx2 - ox * 0.12, 0, bz2 - oz * 0.12], a1 = [ax, ah, az], b1 = [bx2, bh, bz2];
      var qd = ox + oz > 0 ? [a0, a1, b0, b0, a1, b1] : [a0, b0, a1, b0, b1, a1];
      if (oz !== 0) qd = ox + oz > 0 ? [a0, b0, a1, b0, b1, a1] : [a0, a1, b0, b0, a1, b1];
      qd.forEach(function (p) { sideArr.push(p[0], p[1], p[2]); });
    }
    for (i = 0; i < nq; i++) {
      sideQuad(px(i), -S, hts[0][i], px(i + 1), -S, hts[0][i + 1], 0, -1);
      sideQuad(px(i), S, hts[nq][i], px(i + 1), S, hts[nq][i + 1], 0, 1);
      sideQuad(-S, px(i), hts[i][0], -S, px(i + 1), hts[i + 1][0], -1, 0);
      sideQuad(S, px(i), hts[i][nq], S, px(i + 1), hts[i + 1][nq], 1, 0);
    }
    b.add(triGeo(sideArr), function (x, y, z, nx, ny, nz, ti) { return Math.floor(ti / 2) % 2 ? STALK : STALK_SH; }, null, [0, 0.6, 0.7]);
    group.add(b.mesh(mat('flat')));
    // 이삭: 줄지어 선 뾰족한 잎 모양. 두 방향으로 엇갈리게 세운다.
    var rowsN = 9, teeth = 13;
    for (j = 0; j < rowsN; j++) for (i = 0; i < teeth; i++) {
      for (var dirn = 0; dirn < 2; dirn++) {
        var u = -S + 0.1 + (2 * S - 0.2) * (i + R() * 0.7) / teeth, v = -S + 0.15 + (2 * S - 0.3) * (j + 0.5 + (R() - 0.5) * 0.5) / rowsN;
        var cx = dirn ? v : u, cz = dirn ? u : v, hw = 0.1 + R() * 0.06, eh = 0.24 + R() * 0.16, y0 = topH(cx, cz) - 0.06;
        var ax = dirn ? 0 : hw, az = dirn ? hw : 0, lx = (R() - 0.5) * 0.16, lz = (R() - 0.5) * 0.16;
        lb.add(triGeo([cx - ax, y0, cz - az, cx + ax, y0, cz + az, cx + lx, y0 + eh, cz + lz]), GOLD[Math.floor(R() * 4)]);
      }
    }
    // 가장자리의 줄기 몇 가닥
    for (i = 0; i < 40; i++) {
      var e = i % 4, tt = -S + 2 * S * R(), ex = e === 0 ? -S : e === 1 ? S : tt, ez = e === 2 ? -S : e === 3 ? S : tt;
      var ox = e === 0 ? -1 : e === 1 ? 1 : 0, oz = e === 2 ? -1 : e === 3 ? 1 : 0, lw = 0.05, eh2 = 0.75 + R() * 0.3, ln = 0.1 + R() * 0.22;
      lb.add(triGeo([ex - oz * lw, 0, ez - ox * lw, ex + oz * lw, 0, ez + ox * lw, ex + ox * ln, eh2, ez + oz * ln]), i % 3 ? STALK : GOLD[i % 4], null, [0, 0.5, 0.8]);
    }
    group.add(lb.mesh(mat('leaf')));
    return group;
  }

  BO3D.models2 = BO3D.models2 || {};
  BO3D.models2.jericho = makeJericho;
  BO3D.models2.palm = makePalm;
  BO3D.models2.reeds = makeReeds;
  BO3D.models2.grain = makeGrain;
})();
