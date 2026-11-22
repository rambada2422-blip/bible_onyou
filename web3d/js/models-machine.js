/* bible_onyou 3D 모델 — 타임머신. web3d/js/models.js 다음에 읽는다. */
(function () {
  'use strict';
  var kit = window.BO3D._modelKit;
  var T = kit.T, PI = kit.PI, TAU = kit.TAU, DEG = kit.DEG, config = kit.config, rng = kit.rng, lerp = kit.lerp, clamp = kit.clamp, smooth = kit.smooth, ease = kit.ease, spow = kit.spow, K = kit.K, mix = kit.mix, mat = kit.mat, glowTex = kit.glowTex, glowSprite = kit.glowSprite, TR = kit.TR, Builder = kit.Builder, _e = kit._e, _q = kit._q, _p = kit._p, _s = kit._s, _m3 = kit._m3, _a = kit._a, _b = kit._b, _c = kit._c, _n = kit._n, grid = kit.grid, fixPole = kit.fixPole, loft = kit.loft, limb = kit.limb, ball = kit.ball, sbox = kit.sbox, tubeAlong = kit.tubeAlong, curvePts = kit.curvePts, V = kit.V, displace = kit.displace, lumpy = kit.lumpy, hairCap = kit.hairCap, onEll = kit.onEll, SKIN = kit.SKIN, SKIN_SH = kit.SKIN_SH, EYE = kit.EYE, LEATHER = kit.LEATHER, LEATHER_SH = kit.LEATHER_SH, BRASS = kit.BRASS, BRASS_HI = kit.BRASS_HI, BRASS_SH = kit.BRASS_SH, BRASS_DP = kit.BRASS_DP;

  /* ================================================================== 타임머신 */
  function makeTimeMachine() {
    var br = mat('brass'), sm = mat('smooth');
    var group = new T.Group(), b = new Builder(), i;
    var CY = 1.25, RR = 0.8, RT = 0.98, RB = 0.82;
    function eggR(y) { var q = (y - CY) / (y > CY ? RT : RB); return RR * Math.sqrt(Math.max(0, 1 - q * q)); }
    // 몸통(달걀꼴 캡슐)
    var rows = [], nRow = 11;
    for (i = 0; i <= nRow; i++) { var ph = -PI / 2 + PI * i / nRow, y = CY + Math.sin(ph) * (ph > 0 ? RT : RB), r = RR * Math.cos(ph); rows.push([y, r, r]); }
    b.add(loft(rows, 20), mix(BRASS, '#E8BA57', 0.5), null, [0.45, 1.5, 0.74]);
    // 띠 두 줄과 대갈못
    function band(y0, y1, col, n, rivetCol) {
      var bandRows = [[y0 - 0.006, eggR(y0) - 0.01], [y0, eggR(y0) + 0.02], [(y0 + y1) / 2, eggR((y0 + y1) / 2) + 0.024], [y1, eggR(y1) + 0.02], [y1 + 0.006, eggR(y1) - 0.01]];
      b.add(loft(bandRows.map(function (q) { return [q[0], q[1], q[1]]; }), 20), col);
      var ym = (y0 + y1) / 2, rm = eggR(ym) + 0.03;
      for (var k = 0; k < n; k++) { var a = (k + 0.5) / n * TAU; b.add(new T.OctahedronGeometry(0.022, 0), rivetCol, TR(Math.cos(a) * rm, ym, Math.sin(a) * rm, 0, -a, 0)); }
    }
    band(0.8, 0.93, '#C08A34', 18, BRASS_HI);
    band(1.93, 2.03, '#C08A34', 12, BRASS_HI);
    // 이음매
    [45, 135, 225, 315].forEach(function (deg) {
      var pts = [], a = deg * DEG;
      for (var k = 0; k <= 7; k++) { var y = lerp(0.95, 1.92, k / 7), r = eggR(y) + 0.004; pts.push(V(Math.cos(a) * r, y, Math.sin(a) * r)); }
      b.add(tubeAlong(pts, 0.014, 0.014, 3), '#B07C2E');
    });
    // 다리 셋
    [30, 150, 270].forEach(function (deg) {
      var a = deg * DEG, ca = Math.cos(a), sa = Math.sin(a);
      var p0 = V(ca * 0.47, 0.66, sa * 0.47), p1 = V(ca * 0.7, 0.42, sa * 0.7), p2 = V(ca * 0.9, 0.06, sa * 0.9);
      b.add(tubeAlong([p0, p0.clone().lerp(p1, 0.5), p1], 0.085, 0.07, 6), BRASS_SH);
      b.add(tubeAlong([p1, p1.clone().lerp(p2, 0.5), p2], 0.056, 0.05, 6), BRASS);
      b.add(ball(7, 5), BRASS_DP, TR(p1.x, p1.y, p1.z, 0, 0, 0, 0.088));
      b.add(new T.CylinderGeometry(0.13, 0.17, 0.07, 10), function (x, y, z, nx, ny) { return ny > 0.5 ? BRASS_SH : BRASS_DP; }, TR(p2.x, 0.035, p2.z));
    });
    // 옆 손잡이
    [-1, 1].forEach(function (s) {
      b.add(new T.TorusGeometry(0.21, 0.028, 5, 10, PI), BRASS_DP, new T.Matrix4().makeScale(s, 1, 1).multiply(TR(eggR(1.3) - 0.03, 1.3, 0, 0, 0, -PI / 2, 1, 0.6, 1)));
    });
    // 꼭대기 덮개와 등불 받침
    b.add(new T.SphereGeometry(0.3, 12, 4, 0, TAU, 0, PI * 0.42), BRASS, TR(0, 2.05, 0));
    b.add(new T.TorusGeometry(0.285, 0.03, 4, 14), BRASS_DP, TR(0, 2.13, 0, PI / 2, 0, 0));
    b.add(new T.CylinderGeometry(0.028, 0.04, 0.16, 6), BRASS_SH, TR(0, 2.41, 0));
    b.add(new T.CylinderGeometry(0.06, 0.05, 0.03, 8), BRASS_DP, TR(0, 2.475, 0));
    // 둥근 창
    var wy = 1.84, wr = eggR(wy), tilt = -Math.atan2((wy - CY) / (RT * RT), wr / (RR * RR));
    var WM = function (z, rx, sx, sy, sz) { return TR(0, wy, wr, tilt, 0, 0).multiply(TR(0, 0, z, rx || 0, 0, 0, sx, sy, sz)); };
    b.add(new T.TorusGeometry(0.215, 0.04, 5, 16), BRASS_HI, WM(0.012));
    b.add(new T.TorusGeometry(0.262, 0.022, 4, 16), BRASS_DP, WM(-0.006));
    b.add(new T.SphereGeometry(1, 12, 3, 0, TAU, 0, 0.5), '#7AD0C8', WM(-0.34, PI / 2, 0.42, 0.42, 0.42), [wy - 0.2, wy + 0.15, 0.72]);
    b.add(sbox(0.022, 0.085, 0.004, 0.8, 4, 2), '#DDF4F0', WM(0.03).multiply(TR(-0.06, 0.03, 0, 0, 0, -0.65)));
    b.add(sbox(0.011, 0.05, 0.004, 0.8, 4, 2), '#DDF4F0', WM(0.03).multiply(TR(-0.005, 0.0, 0, 0, 0, -0.65)));
    // 세 주인공 색의 작은 등
    ['#EE7B62', '#2F9C95', '#4E5FB0'].forEach(function (c, k) {
      var a = (90 + (k - 1) * 17) * DEG, y = 0.68, r = eggR(y) + 0.01;
      b.add(ball(6, 4), BRASS_DP, TR(Math.cos(a) * r, y, Math.sin(a) * r, 0, 0, 0, 0.058));
      b.add(ball(6, 4), c, TR(Math.cos(a) * (r + 0.03), y - 0.012, Math.sin(a) * (r + 0.03), 0, 0, 0, 0.044));
    });
    // 뒤쪽 문
    function doorPatch(hw, y0, y1, off, col) {
      return [grid(6, 6, false, function (u, v, o) {
        var y = lerp(y0, y1, v), wv = Math.pow(1 - Math.pow(Math.abs(v * 2 - 1), 4), 0.4), a = (270 + (u - 0.5) * 2 * hw * Math.max(0.3, wv)) * DEG, r = eggR(y) + off;
        o.set(Math.cos(a) * r, y, Math.sin(a) * r);
      }), col];
    }
    var d1 = doorPatch(31, 0.98, 1.84, 0.012, BRASS_DP), d2 = doorPatch(27, 1.02, 1.8, 0.028, '#E3B24E');
    b.add(d1[0], d1[1]); b.add(d2[0], d2[1]);
    var dy = 1.5, dr = eggR(dy) + 0.03, dt = -Math.atan2((dy - CY) / (RT * RT), dr / (RR * RR));
    var DM = function (x, y, z, rx, sx) { return TR(0, 0, 0, 0, PI, 0).multiply(TR(0, dy, dr, dt, 0, 0)).multiply(TR(x, y, z, rx || 0, 0, 0, sx)); };
    b.add(new T.TorusGeometry(0.12, 0.026, 4, 12), BRASS_HI, DM(0, 0.03, 0.012));
    b.add(new T.CircleGeometry(0.11, 12), '#4FB0AC', DM(0, 0.03, 0.012));
    b.add(new T.TorusGeometry(0.07, 0.016, 4, 10), BRASS_DP, DM(0.17, -0.33, 0.07));
    b.add(new T.CylinderGeometry(0.014, 0.014, 0.08, 5), BRASS_DP, DM(0.17, -0.33, 0.035, PI / 2));
    // 나침반 겸 시계 다이얼의 받침과 테
    var dz = 0.845, DY = 1.22;
    b.add(new T.CylinderGeometry(0.43, 0.46, 0.2, 20, 1, true), BRASS_DP, TR(0, DY, dz - 0.1, PI / 2, 0, 0));
    b.add(new T.CircleGeometry(0.43, 20), BRASS_SH, TR(0, DY, dz));
    b.add(new T.TorusGeometry(0.405, 0.036, 5, 24), BRASS_HI, TR(0, DY, dz + 0.01));
    for (i = 0; i < 4; i++) b.add(new T.OctahedronGeometry(0.03, 0), BRASS_DP, TR(Math.sin(i * PI / 2) * 0.405, DY + Math.cos(i * PI / 2) * 0.405, dz + 0.04));
    group.add(b.mesh(br));

    // 다이얼 판: 눈금과 방위 무늬(글자·숫자 없음)
    var f = new Builder(), FZ = dz + 0.012;
    f.add(new T.CircleGeometry(0.37, 24), '#FBF7EE', TR(0, DY, FZ));
    f.add(new T.RingGeometry(0.2, 0.212, 24), '#E4BE7E', TR(0, DY, FZ + 0.004));
    for (i = 0; i < 60; i++) {
      var maj = i % 5 === 0, q = i % 15 === 0, len = q ? 0.07 : maj ? 0.05 : 0.022, wd = maj ? 0.016 : 0.007, rad = 0.34 - len / 2;
      f.add(new T.PlaneGeometry(wd, len), maj ? '#3B4A6B' : '#B59A78', TR(Math.sin(i * TAU / 60) * rad, DY + Math.cos(i * TAU / 60) * rad, FZ + 0.004, 0, 0, -i * TAU / 60));
    }
    function point(len, hw, colA, colB, ang, z) {       // 두 색으로 나뉜 뾰족한 무늬
      var g1 = new T.BufferGeometry(), g2 = new T.BufferGeometry();
      g1.setAttribute('position', new T.BufferAttribute(new Float32Array([0, 0, 0, hw, hw, 0, 0, len, 0]), 3));
      g2.setAttribute('position', new T.BufferAttribute(new Float32Array([0, 0, 0, 0, len, 0, -hw, hw, 0]), 3));
      f.add(g1, colA, TR(0, DY, z, 0, 0, ang));
      f.add(g2, colB, TR(0, DY, z, 0, 0, ang));
    }
    for (i = 0; i < 4; i++) point(0.15, 0.028, '#C9A56A', '#E4BE7E', PI / 4 + i * PI / 2, FZ + 0.006);
    for (i = 0; i < 4; i++) point(0.24, 0.04, '#2F9C95', '#7AD0C8', i * PI / 2, FZ + 0.009);
    group.add(f.mesh(new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, flatShading: true, emissive: K('#5A5346'), emissiveIntensity: 0.6 }), null, true));

    // 바늘 둘
    var hourB = new Builder();
    hourB.add(new T.BoxGeometry(0.022, 0.2, 0.008), '#3B4A6B', TR(0, 0.08, 0));
    hourB.add(new T.TorusGeometry(0.026, 0.008, 3, 8), '#3B4A6B', TR(0, 0.145, 0));
    var hour = hourB.mesh(sm, null, true);
    hour.position.set(0, DY, FZ + 0.022);
    group.add(hour);
    var needleB = new Builder();
    var tri = function (pts, col) { var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array(pts), 3)); needleB.add(g, col); };
    tri([0, 0, 0, 0.034, 0, 0, 0, 0.31, 0], '#D2604A'); tri([0, 0, 0, 0, 0.31, 0, -0.034, 0, 0], '#EE7B62');
    tri([0, 0, 0, 0, -0.2, 0, 0.034, 0, 0], '#3C4B92'); tri([0, 0, 0, -0.034, 0, 0, 0, -0.2, 0], '#4E5FB0');
    var needle = needleB.mesh(mat('flat'), null, true);
    needle.position.set(0, DY, FZ + 0.034);
    group.add(needle);
    var capB = new Builder();
    capB.add(new T.CylinderGeometry(0.04, 0.046, 0.03, 10), BRASS_HI, TR(0, DY, FZ + 0.045, PI / 2, 0, 0));
    capB.add(new T.CylinderGeometry(0.016, 0.016, 0.04, 6), BRASS_DP, TR(0, DY, FZ + 0.05, PI / 2, 0, 0));
    group.add(capB.mesh(br, null, true));

    // 꼭대기 등불
    var lampMat = new T.MeshStandardMaterial({ color: K('#F7B733'), emissive: K('#F7B733'), emissiveIntensity: 0.9, roughness: 0.4 });
    var lamp = new T.Mesh(new T.SphereGeometry(0.075, 10, 7), lampMat);
    lamp.position.set(0, 2.525, 0);
    group.add(lamp);
    var glow = glowSprite('#FFD070', 0.7, 0.6);
    glow.position.copy(lamp.position);
    group.add(glow);

    function update(t) {
      t = t || 0;
      needle.rotation.z = -0.6 - t * TAU / 24;
      hour.rotation.z = 1.08 - t * TAU / 160;
      var p = 0.5 + 0.5 * Math.sin(t * 1.6);
      lampMat.emissiveIntensity = 0.55 + 0.6 * p;
      glow.material.opacity = 0.3 + 0.45 * p;
      glow.scale.setScalar(0.6 + 0.25 * p);
    }
    update(0);
    return { group: group, update: update };
  }

  window.BO3D.models.timeMachine = makeTimeMachine;
})();
