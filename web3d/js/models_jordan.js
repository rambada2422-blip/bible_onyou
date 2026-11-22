/* bible_onyou 3D 모델 2 공통 도구: "요단 강을 건너는 백성" (여호수아 3:1-17) — three.js r128, 전역 THREE
 *
 * 외부 파일 없이 도형과 직접 만든 geometry만 쓴다. 단위는 미터, 바닥이 y=0, 정면이 +Z.
 * 실제 모형 함수는 역할별로 나눈 파일들이 BO3D.models2에 붙인다:
 *   models_jordan-people.js    -> israelite, priestSimple, leaderSimple
 *   models_jordan-ark-water.js -> arkCovered, waterWall, waterSurface
 *   models_jordan-world.js     -> jericho, palm, reeds, grain
 */
(function () {
  'use strict';
  var T = window.THREE;
  var BO3D = window.BO3D = window.BO3D || {};
  var PI = Math.PI, TAU = PI * 2, DEG = PI / 180;

  /* ------------------------------------------------------------------ 작은 도구 (models.js와 같다) */
  function rng(seed) {
    var s = ((seed | 0) * 2654435761 + 20261) | 0;
    return function () {
      s = (s + 0x6D2B79F5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function smooth(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
  function spow(c, e) { return (c < 0 ? -1 : 1) * Math.pow(Math.abs(c), e); }

  function srgb() { return !!(BO3D.models && BO3D.models.config && BO3D.models.config.srgbOutput); }
  var _colors = {};
  function K(hex) {
    if (hex && hex.isColor) return hex;
    var lin = srgb(), key = hex + (lin ? 'L' : '');
    var c = _colors[key];
    if (!c) { c = new T.Color(hex); if (lin) c.convertSRGBToLinear(); _colors[key] = c; }
    return c;
  }
  function mix(a, b, t) { return K(a).clone().lerp(K(b), t); }
  function shade(hex, f) { return K(hex).clone().multiplyScalar(f); }

  var _mats = {};
  function mat(name) {
    var m = _mats[name];
    if (m) return m;
    var S = T.MeshStandardMaterial;
    if (name === 'smooth') m = new S({ vertexColors: true, roughness: 0.8, metalness: 0 });
    else if (name === 'cloth') m = new S({ vertexColors: true, roughness: 0.9, metalness: 0, side: T.DoubleSide });
    else if (name === 'flat') m = new S({ vertexColors: true, roughness: 0.92, metalness: 0, flatShading: true });
    else if (name === 'leaf') m = new S({ vertexColors: true, roughness: 0.9, metalness: 0, flatShading: true, side: T.DoubleSide });
    else if (name === 'brass') m = new S({ vertexColors: true, roughness: 0.38, metalness: 0.22 });
    _mats[name] = m;
    return m;
  }

  var _e = new T.Euler(), _q = new T.Quaternion(), _p = new T.Vector3(), _s = new T.Vector3();
  // 이동 · 회전(XYZ) · 크기 행렬
  function TR(px, py, pz, rx, ry, rz, sx, sy, sz) {
    if (sx === undefined) sx = 1;
    if (sy === undefined) sy = sx;
    if (sz === undefined) sz = sx;
    _q.setFromEuler(_e.set(rx || 0, ry || 0, rz || 0));
    return new T.Matrix4().compose(_p.set(px || 0, py || 0, pz || 0), _q, _s.set(sx, sy, sz));
  }

  /* ------------------------------------------------------------------ Builder: 조각들을 색과 함께 한 geometry로 합친다 */
  function Builder() { this.pos = []; this.nor = []; this.col = []; }
  var _m3 = new T.Matrix3(), _a = new T.Vector3(), _b = new T.Vector3(), _c = new T.Vector3(), _n = new T.Vector3();
  // color: '#hex' | THREE.Color | function(x, y, z, nx, ny, nz, ti) (삼각형 중심, 면 법선, 삼각형 번호) -> '#hex' | Color
  // grid로 만든 geometry에서 ti는 줄(j)마다 2*nu개씩, 칸(i)마다 2개씩 늘어난다.
  // grad: [y0, y1, mul]  높이 y0 아래는 mul만큼 어둡게, y1 위는 그대로
  Builder.prototype.add = function (geo, color, mtx, grad) {
    var g = geo.index ? geo.toNonIndexed() : geo;
    var P = g.attributes.position.array, N = g.attributes.normal ? g.attributes.normal.array : null;
    var flip = false, isFn = typeof color === 'function', base = isFn ? null : K(color);
    if (mtx) { _m3.getNormalMatrix(mtx); flip = mtx.determinant() < 0; }
    var v = [_a, _b, _c], i, k, o, col, f;
    var tp = new Float32Array(9), tn = new Float32Array(9);
    for (i = 0; i < P.length; i += 9) {
      for (k = 0; k < 3; k++) {
        o = i + k * 3;
        v[k].set(P[o], P[o + 1], P[o + 2]);
        if (mtx) v[k].applyMatrix4(mtx);
        tp[k * 3] = v[k].x; tp[k * 3 + 1] = v[k].y; tp[k * 3 + 2] = v[k].z;
      }
      _n.subVectors(_b, _a).cross(_s.subVectors(_c, _a));
      if (_n.lengthSq() < 1e-14) continue;          // 넓이 없는 삼각형은 버린다
      _n.normalize();
      if (flip) _n.negate();
      for (k = 0; k < 3; k++) {
        o = i + k * 3;
        if (N) {
          _s.set(N[o], N[o + 1], N[o + 2]);
          if (mtx) _s.applyMatrix3(_m3).normalize();
          tn[k * 3] = _s.x; tn[k * 3 + 1] = _s.y; tn[k * 3 + 2] = _s.z;
        } else { tn[k * 3] = _n.x; tn[k * 3 + 1] = _n.y; tn[k * 3 + 2] = _n.z; }
      }
      col = base;
      if (isFn) col = K(color((_a.x + _b.x + _c.x) / 3, (_a.y + _b.y + _c.y) / 3, (_a.z + _b.z + _c.z) / 3, _n.x, _n.y, _n.z, i / 9));
      for (k = 0; k < 3; k++) {
        o = (flip && k > 0 ? 3 - k : k) * 3;
        f = grad ? lerp(grad[2], 1, smooth(grad[0], grad[1], tp[o + 1])) : 1;
        this.pos.push(tp[o], tp[o + 1], tp[o + 2]);
        this.nor.push(tn[o], tn[o + 1], tn[o + 2]);
        this.col.push(col.r * f, col.g * f, col.b * f);
      }
    }
    if (g !== geo) g.dispose();
    geo.dispose();
    return this;
  };
  // origin: 이 점이 mesh의 원점이 되게 옮긴다(관절 묶음에 넣을 때)
  Builder.prototype.mesh = function (material, origin, noShadow) {
    var p = new Float32Array(this.pos), i;
    if (origin) for (i = 0; i < p.length; i += 3) { p[i] -= origin[0]; p[i + 1] -= origin[1]; p[i + 2] -= origin[2]; }
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(p, 3));
    g.setAttribute('normal', new T.BufferAttribute(new Float32Array(this.nor), 3));
    g.setAttribute('color', new T.BufferAttribute(new Float32Array(this.col), 3));
    var m = new T.Mesh(g, material);
    m.castShadow = !noShadow;
    return m;
  };

  /* ------------------------------------------------------------------ geometry 만들기 */
  // u(둘레 0..1), v(아래 0 → 위 1) 격자. x = cos(2πu), z = sin(2πu) 방향으로 감으면 바깥이 앞면이 된다.
  function grid(nu, nv, closed, fn) {
    var cols = closed ? nu : nu + 1, rows = nv + 1, v3 = new T.Vector3();
    var pos = new Float32Array(cols * rows * 3), idx = [], i, j, k = 0;
    for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) {
      fn(i / nu, j / nv, v3, i, j);
      pos[k++] = v3.x; pos[k++] = v3.y; pos[k++] = v3.z;
    }
    for (j = 0; j < nv; j++) for (i = 0; i < nu; i++) {
      var i2 = closed ? (i + 1) % cols : i + 1;
      var a = j * cols + i, c = j * cols + i2, b = (j + 1) * cols + i, d = (j + 1) * cols + i2;
      idx.push(a, b, c, b, d, c);
    }
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    fixPole(g, 0, cols);
    fixPole(g, nv * cols, cols);
    return g;
  }
  function fixPole(g, start, n) {
    var p = g.attributes.position.array, nr = g.attributes.normal.array, o = start * 3, i;
    var x = p[o], y = p[o + 1], z = p[o + 2], sx = 0, sy = 0, sz = 0;
    for (i = 0; i < n; i++) {
      o = (start + i) * 3;
      if (Math.abs(p[o] - x) + Math.abs(p[o + 1] - y) + Math.abs(p[o + 2] - z) > 1e-6) return;
      sx += nr[o]; sy += nr[o + 1]; sz += nr[o + 2];
    }
    var l = Math.sqrt(sx * sx + sy * sy + sz * sz);
    if (l < 1e-6) return;
    for (i = 0; i < n; i++) { o = (start + i) * 3; nr[o] = sx / l; nr[o + 1] = sy / l; nr[o + 2] = sz / l; }
  }
  // rows: 아래에서 위로 [y, rx, rz, cx, cz]. angles: 둘레를 고르지 않게 나눌 때의 각도 표(라디안)
  function loft(rows, nu, angles) {
    var nv = rows.length - 1;
    return grid(nu, nv, true, function (u, v, o, i, j) {
      var r = rows[j], a = angles ? angles[i % nu] : u * TAU;
      o.set((r[3] || 0) + r[1] * Math.cos(a), r[0], (r[4] || 0) + r[2] * Math.sin(a));
    });
  }
  function ball(nu, nv) { return new T.SphereGeometry(1, nu || 8, nv || 6); }
  // 모서리가 둥근 상자(초타원체). e가 작을수록 상자에 가깝다.
  function sbox(rx, ry, rz, e, nu, nv) {
    return grid(nu, nv, true, function (u, v, o) {
      var lat = -PI / 2 + PI * v, lon = TAU * u + PI / nu;
      var cl = spow(Math.cos(lat), e);
      o.set(rx * cl * spow(Math.cos(lon), e), ry * spow(Math.sin(lat), e), rz * cl * spow(Math.sin(lon), e));
    });
  }
  // 점들을 따라가는 관. r0: 숫자 또는 function(t 0..1)
  function tubeAlong(pts, r0, r1, nu, caps) {
    var n = pts.length, tang = [], N = [], B = [], i;
    for (i = 0; i < n; i++) tang.push(pts[Math.min(n - 1, i + 1)].clone().sub(pts[Math.max(0, i - 1)]).normalize());
    var nrm = new T.Vector3(1, 0, 0);
    if (Math.abs(tang[0].x) > 0.9) nrm.set(0, 0, 1);
    for (i = 0; i < n; i++) {
      nrm.addScaledVector(tang[i], -nrm.dot(tang[i])).normalize();
      N.push(nrm.clone());
      B.push(nrm.clone().cross(tang[i]));
    }
    var rows = caps ? n + 2 : n;
    return grid(nu, rows - 1, true, function (u, v, o, ci, j) {
      var k = caps ? clamp(j - 1, 0, n - 1) : j, t = k / (n - 1);
      var r = (caps && (j === 0 || j === rows - 1)) ? 0 : (typeof r0 === 'function' ? r0(t) : lerp(r0, r1, t));
      var a = u * TAU;
      o.copy(pts[k]).addScaledVector(N[k], Math.cos(a) * r).addScaledVector(B[k], Math.sin(a) * r);
    });
  }
  function curvePts(ctrl, n) { return new T.CatmullRomCurve3(ctrl).getPoints(n); }
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  // 위치에만 의존하는 변형(겹친 꼭짓점이 같이 움직인다)
  function displace(geo, fn) {
    var p = geo.attributes.position, i;
    for (i = 0; i < p.count; i++) {
      _a.fromBufferAttribute(p, i);
      fn(_a);
      p.setXYZ(i, _a.x, _a.y, _a.z);
    }
    return geo;
  }
  function lumpy(R, amp) {
    var d = [], i;
    for (i = 0; i < 4; i++) d.push([R() * 2 - 1, R() * 2 - 1, R() * 2 - 1, 1.6 + R() * 2.4, R() * TAU]);
    return function (v) {
      var n = 0;
      for (var k = 0; k < 4; k++) n += Math.sin((v.x * d[k][0] + v.y * d[k][1] + v.z * d[k][2]) * d[k][3] + d[k][4]);
      v.multiplyScalar(1 + amp * n * 0.5);
    };
  }
  // 삼각형 꼭짓점 좌표(평평한 배열)로 만든 geometry. 법선은 Builder가 면마다 계산한다.
  function triGeo(arr) {
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(new Float32Array(arr), 3));
    return g;
  }
  // 볼록 다각형 하나를 Builder에 넣는다. hint: 앞면이 향해야 할 쪽(없으면 주어진 순서 그대로)
  function face(b, pts, col, hint) {
    var arr = [], i, a = pts[0];
    if (hint) {
      _n.subVectors(pts[1], a).cross(_s.subVectors(pts[2], a));
      if (_n.dot(hint) < 0) pts = pts.slice().reverse();
      a = pts[0];
    }
    for (i = 1; i < pts.length - 1; i++) arr.push(a.x, a.y, a.z, pts[i].x, pts[i].y, pts[i].z, pts[i + 1].x, pts[i + 1].y, pts[i + 1].z);
    b.add(triGeo(arr), col);
  }

  // 머리카락·머리쓰개: 머리(타원체 hx, hy, hz)를 덮는 껍질.
  function hairCap(hx, hy, hz, o) {
    var nu = o.nu || 14, nv = o.nv || 6;
    return grid(nu, nv, true, function (u, v, out, i, j) {
      var a = u * TAU, ca = Math.cos(a), sa = Math.sin(a);
      var d = Math.acos(clamp(sa, -1, 1)) / DEG;
      var open = smooth(o.d1, o.d2, d), back = smooth(o.b1 || 95, o.b2 || 150, d);
      var front = o.front + (o.sweep || 0) * ca + (o.zig || 0) * (i % 2 ? 1 : -1);
      var end = lerp(front, lerp(o.side, o.back, back), open);
      var w = j === 0 ? 0 : (j - 1) / (nv - 1), fr = Math.pow(1 - w, o.pow || 1);
      if (o.ws) { fr = o.ws[j]; w = 1 - fr; }
      var th = end * fr * DEG;
      if (o.ths) { th = (j <= 1 ? end : Math.min(end, o.ths[j])) * DEG; w = j <= 1 ? 0 : 1 - o.ths[j] / 90; }
      var s = lerp(o.sEdge || o.s, o.s, w);
      var st = Math.sin(th), ct = Math.cos(th), x, y, z;
      if (th <= PI / 2) { x = hx * s * st * ca; y = hy * s * ct; z = hz * s * st * sa; }
      else {
        var e = th - PI / 2, f = 1 + (o.flare || 0) * e, fx = 1 + (o.flare || 0) * (o.flareX || 1) * e, h = o.hang;
        x = lerp(hx * s * st * ca, hx * s * ca * fx, h);
        y = lerp(hy * s * ct, -hy * s * e, h);
        z = lerp(hz * s * st * sa, hz * s * sa * f * (sa < 0 ? (o.backOut || 1) : 1), h);
      }
      if (j === 0) { var tk = o.tuck || 0.88; x *= tk; z *= tk; y += hy * 0.012; }
      out.set(x, y, z);
      if (o.shape) o.shape(out, ca, sa, w);
    });
  }
  // 타원체 겉면의 한 점에 물건을 붙이는 행렬. aDeg: 정면에서 옆으로 돈 각, yf: 높이(-1..1). 물건의 +z가 바깥을 향한다.
  function onEll(cx, cy, cz, hx, hy, hz, aDeg, yf, lift, sx, sy, sz) {
    var a = aDeg * DEG, c = Math.sqrt(1 - yf * yf), l = 1 + (lift || 0);
    var px = hx * c * Math.sin(a), py = hy * yf, pz = hz * c * Math.cos(a);
    var q = new T.Quaternion().setFromUnitVectors(_b.set(0, 0, 1), _c.set(px / (hx * hx), py / (hy * hy), pz / (hz * hz)).normalize());
    return new T.Matrix4().compose(new T.Vector3(cx + px * l, cy + py * l, cz + pz * l), q, new T.Vector3(sx, sy, sz));
  }

  /* ================================================================== 사람 공통 */
  var SKINS = [['#C48A5E', '#A56E47'], ['#B87E54', '#9A6642'], ['#CE9869', '#B07C52'], ['#AD764C', '#8E5C3A']];
  var SOLE = '#5A3A22', EYE = '#33241C';
  var DOWN = new T.Vector3(0, -1, 0);
  var BRASS = '#DDA945', BRASS_HI = '#F4D27A', BRASS_SH = '#B9832F';

  // 점 p에 놓고 -Y축이 dir을 향하게 하는 행렬(팔다리, 손)
  function along(p, dir, sx, sy, sz) {
    if (sy === undefined) sy = sx;
    if (sz === undefined) sz = sx;
    return new T.Matrix4().compose(p, new T.Quaternion().setFromUnitVectors(DOWN, dir.clone().normalize()), new T.Vector3(sx, sy, sz));
  }
  // 팔 하나를 Builder에 넣는다. 원점이 어깨이고 U 방향으로 위팔, 이어서 F 방향으로 아래팔.
  function addArm(b, o) {
    var U = o.U.clone().normalize(), F = o.F.clone().normalize(), nu = o.nu;
    var E = U.clone().multiplyScalar(o.ua), W = E.clone().addScaledVector(F, o.fa), C = E.clone().lerp(W, o.cut);
    b.add(tubeAlong([V(0, 0, 0), E, C], function (t) { return t < 0.5 ? lerp(o.r0, o.r1, t * 2) : lerp(o.r1, o.r2, t * 2 - 1); }, 0, nu, true),
      function (x, y, z, nx, ny, nz, ti) { return ti >= nu * 6 ? o.inner : o.sleeve; });
    if (o.cut < 0.95) b.add(tubeAlong([C.clone().addScaledVector(F, -0.02), W], o.rw * 1.1, o.rw, nu), o.skin);
    b.add(ball(o.hnu || 5, o.hnv || 3), o.skin, along(W.clone().addScaledVector(F, o.hand * 0.7), F, o.hand * 0.8, o.hand * 1.15, o.hand * 0.95));
    return { E: E, W: W, F: F };
  }
  // 어깨 S에서 손 G까지 닿게 하는 위팔·아래팔 방향(2관절). hint: 팔꿈치가 가는 쪽
  function solveArm(S, G, ua, fa, hint) {
    var n = G.clone().sub(S), dist = Math.min(n.length(), ua + fa - 0.004);
    n.normalize();
    var al = (ua * ua - fa * fa + dist * dist) / (2 * dist), hh = Math.sqrt(Math.max(0, ua * ua - al * al));
    var pole = hint.clone().addScaledVector(n, -hint.dot(n)).normalize();
    var E = n.clone().multiplyScalar(al).addScaledVector(pole, hh);
    return { U: E.clone().normalize(), F: n.clone().multiplyScalar(dist).sub(E).normalize() };
  }
  // 샌들 신은 발. 원점은 발목 바로 아래 바닥. detail이 true면 조금 더 둥글게. M: 놓을 자리(없으면 원점)
  function addFoot(b, k, skin, skinSh, ankleTop, detail, M) {
    var at = function (m) { return M ? M.clone().multiply(m) : m; };
    if (detail) {
      b.add(sbox(0.05 * k, 0.034 * k, 0.116 * k, 0.75, 8, 3), function (x, y) { return y < 0.024 * k ? SOLE : skin; }, at(TR(0, 0.036 * k, 0.045 * k)));
      b.add(new T.BoxGeometry(0.108 * k, 0.016 * k, 0.03 * k), SOLE, at(TR(0, 0.062 * k, 0.085 * k, 0.25, 0, 0)));
    } else {
      b.add(new T.BoxGeometry(0.082 * k, 0.05 * k, 0.17 * k), function (x, y, z, nx, ny) { return ny < -0.5 || (Math.abs(ny) < 0.5 && y < 0.018 * k) ? SOLE : skin; }, at(TR(0, 0.026 * k, 0.035 * k)));
    }
    if (ankleTop > 0.07 * k) b.add(new T.CylinderGeometry(0.036 * k, 0.032 * k, ankleTop - 0.04 * k, detail ? 6 : 4, 1, true), skinSh, at(TR(0, (ankleTop + 0.04 * k) / 2, -0.01 * k, 0, PI / 4, 0)));
  }
  function ext(a, b) { var o = {}, key; for (key in a) o[key] = a[key]; for (key in b) o[key] = b[key]; return o; }

  BO3D._jordanKit = {
    PI: PI, TAU: TAU, DEG: DEG,
    rng: rng, lerp: lerp, clamp: clamp, smooth: smooth, spow: spow,
    K: K, mix: mix, shade: shade, mat: mat, TR: TR,
    Builder: Builder, grid: grid, loft: loft, ball: ball, sbox: sbox,
    tubeAlong: tubeAlong, curvePts: curvePts, V: V, displace: displace,
    lumpy: lumpy, triGeo: triGeo, face: face, hairCap: hairCap, onEll: onEll,
    SKINS: SKINS, SOLE: SOLE, EYE: EYE, DOWN: DOWN,
    BRASS: BRASS, BRASS_HI: BRASS_HI, BRASS_SH: BRASS_SH,
    along: along, addArm: addArm, solveArm: solveArm, addFoot: addFoot, ext: ext
  };
  BO3D.models2 = BO3D.models2 || {};
})();
