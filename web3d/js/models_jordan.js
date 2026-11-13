/* bible_onyou 3D 모델 2: "요단 강을 건너는 백성" (여호수아 3:1-17) — three.js r128, 전역 THREE
 *
 * 외부 파일 없이 도형과 직접 만든 geometry만 쓴다. 단위는 미터, 바닥이 y=0, 정면이 +Z.
 * models.js와 같은 방식(Builder로 꼭짓점 색을 굽고 재질 몇 개를 함께 쓴다)이며, 도우미는 이 파일 안에 다시 만들었다.
 *
 *   BO3D.models2.israelite(seed)       -> { group, update(dt, speed) }   백성 한 사람(남자·여자·아이)
 *   BO3D.models2.priestSimple(side)    -> { group, update(dt) }          side: 'L'(왼어깨, +X) | 'R'(오른어깨, -X)
 *                                         group.userData.poleY / poleX = 채가 얹히는 어깨 위 지점
 *   BO3D.models2.leaderSimple()        -> { group, update(dt) }          백성을 이끄는 사람. 두 팔을 내리고 곧게 서 있다
 *   BO3D.models2.arkCovered()          -> THREE.Group                    청색 보자기로 덮인 궤와 채 둘
 *   BO3D.models2.waterWall(len, h)     -> { group, update(t) }           멈춰 쌓인 물
 *   BO3D.models2.waterSurface(w, d)    -> { mesh, update(t) }            흐르는 강물 면
 *   BO3D.models2.jericho()             -> THREE.Group
 *   BO3D.models2.palm(seed) / reeds(seed) / grain(seed) -> THREE.Group
 *
 * 덧붙인 것(약속한 것 외):
 *   arkCovered().userData = { poleY, poleX, poleRadius, poleLength }  채 중심의 높이·옆 위치(궤 바닥 기준), 굵기, 길이
 *   priestSimple().group.userData.poleRadius, leaderSimple/israelite의 group.userData.height
 *   waterSurface().mesh.material.uniforms.uFlow (THREE.Vector2, 초당 미터) 흐르는 방향. 기본은 -X(물의 벽과 같은 쪽)
 *   BO3D.models.config.srgbOutput 이 true면 models.js와 똑같이 색을 선형 공간으로 바꿔 굽는다.
 * 그림자: 불투명한 mesh에 castShadow만 켠다(물은 켜지 않는다).
 *
 * 신학 규칙(공통규칙서 3절, 스타일가이드 2절, 장면목록 "ALT-02 그림"):
 *   - 궤는 순청색 보자기로 완전히 덮여 있다(민 4:5-6). 금빛 상자, 뚜껑, 그 위의 형상은 만들지 않았다. 천에는 주름 음영만 있다.
 *   - 물의 벽은 세로 결과 포말뿐이다. 무늬는 세로로 길게 늘인 노이즈여서 얼굴·손·사람 모양을 만들지 않는다.
 *   - 지도자는 짙은 머리와 짙은 수염의 장년이고 지팡이가 없다(이 장면에는 모세가 없다).
 *     수 3장에 손짓이 기록되어 있지 않으므로 팔을 뻗거나 가리키는 자세를 만들지 않았다(물이 멈춘 것은 제사장들의 발이 물에 닿았을 때, 3:15-16).
 *   - 성읍에는 신상·신전 장식이 없다. 어디에도 글자와 기호가 없다.
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
  // 앞(얼굴)은 front 각도까지만, 옆은 side, 뒤는 back 각도까지 내려온다(천정에서 잰 각도, 90 = 귀 높이).
  // hang: 귀 높이 아래에서 머리를 따라 감기는지(0) 곧게 늘어지는지(1). flareX: 늘어질 때 옆으로 더 벌어지는 정도
  // ws: 줄마다 끝 각도의 몇 배까지 내려오는지 직접 정한다. 예: [1, 1, 0.5, 0]
  // ths: 둘째 줄 위로는 줄마다 천정에서 잰 각도를 직접 정한다(줄 수가 적을 때 머리가 삐져나오지 않게). 예: [0, 0, 54, 28, 0]
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
  // o: ua, fa, U, F, r0(어깨) r1(팔꿈치) r2(소매 끝), nu, cut(소매가 끝나는 자리, 아래팔의 0..1), sleeve, inner(소매 안쪽 색), skin, hand, rw(손목)
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

  /* ================================================================== 이스라엘 백성 */
  var KINDS = ['man', 'woman', 'boy', 'man', 'woman', 'girl', 'woman', 'man', 'woman', 'man'];
  // 몸통 둘레 나눔(8칸). 앞(90°) 가운데에 좁은 칸(1번)이 있다.
  var ANG8 = [30, 76, 104, 150, 200, 250, 290, 340].map(function (d) { return d * DEG; });
  var FAM = {
    cream: ['#EADBB6', '#DCCBA2', '#E6D2A8'],
    earth: ['#C9A772', '#B58A5C', '#A9774A'],
    ochre: ['#C89A4A', '#B9873C'],
    olive: ['#7C8C52', '#6F8448', '#93A066'],
    indigo: ['#4F5D7A', '#3F4C66', '#5E6F91'],
    russet: ['#9C5438', '#8A4B34', '#A8643F']
  };
  var TUNIC_FAMS = ['cream', 'cream', 'earth', 'earth', 'ochre', 'olive', 'indigo', 'russet'];
  var CLOAK_FAMS = ['earth', 'olive', 'olive', 'indigo', 'indigo', 'russet', 'russet'];
  var HEADCLOTHS = ['#F3EAD4', '#E4D3AC', '#D9C7A0', '#C9B58A', '#BFC5A4', '#A9B4C4', '#D6B08A', '#B9785A'];
  var SASHES = ['#4F5D7A', '#8A4B34', '#6B4526', '#E4D3AC', '#59683C', '#B9873C'];
  var HAIRS = ['#2B211C', '#33261E', '#3D2B20', '#241C1A'];
  var BEARDS = ['#2B211C', '#3A2A20', '#4A372A', '#5E5650', '#33261E'];

  function makeIsraelite(seed) {
    seed = seed | 0;
    var R = rng(seed * 7 + 4001), sm = mat('smooth');
    var pick = function (a) { return a[Math.min(a.length - 1, Math.floor(R() * a.length))]; };
    var kind = KINDS[((seed % 10) + 10) % 10];
    var man = kind === 'man', woman = kind === 'woman', child = !man && !woman, girl = kind === 'girl';
    var H = man ? 1.62 + R() * 0.14 : woman ? 1.55 + R() * 0.11 : 1.1 + R() * 0.18;     // 머리 꼭대기까지(머리쓰개 제외)
    var k = H / 1.73, q = k * (child ? 1.1 : woman ? 0.94 : 1);
    var hy = (child ? 0.1 : 0.087) * H, hx = hy * 0.88, hz = hy * 0.93;
    var headY = H - hy, neckY = headY - hy * 0.96, shY = neckY - 0.062 * k, waistY = (child ? 0.55 : 0.58) * H;
    var sw = 0.2 * q, ua = 0.165 * H, fa = 0.15 * H;
    var skin = pick(SKINS), SK = skin[0], SK_SH = skin[1];

    var tf = pick(TUNIC_FAMS), TUNIC = pick(FAM[tf]), cf = pick(CLOAK_FAMS);
    if (cf === tf) cf = cf === 'olive' ? 'indigo' : 'olive';
    var CLOAK = pick(FAM[cf]);
    var hasCloak = R() < (man ? 0.78 : woman ? 0.55 : 0.25);
    var striped = man && R() < 0.3;
    var SASH = pick(SASHES), CLOTH = pick(HEADCLOTHS);
    var carry = man ? pick(['none', 'none', 'staff', 'staff', 'sack']) : woman ? pick(['none', 'baby', 'baby', 'head', 'sack']) : pick(['none', 'none', 'none', 'sack']);
    var hemY = man ? (0.15 + R() * 0.1) * k : woman ? 0.055 * k : (0.29 + R() * 0.08) * k;
    var hemW = woman ? 1.08 : 1;

    var group = new T.Group(), rig = new T.Group();
    group.add(rig);
    group.userData.height = H;
    group.userData.kind = kind;

    /* --- 몸: 통옷, 허리띠, 겉옷, 머리를 mesh 하나로 --- */
    var b = new Builder();
    var T_SH = shade(TUNIC, 0.86), T_ST = shade(TUNIC, 0.7);
    var rows = [
      [hemY, 0.25 * q * hemW, 0.212 * q * hemW],
      [lerp(hemY, waistY, 0.52), 0.222 * q, 0.188 * q],
      [waistY - 0.03 * k, 0.19 * q, 0.154 * q],
      [waistY + 0.04 * k, 0.194 * q, 0.158 * q],
      [lerp(waistY, shY, 0.6), 0.2 * q, 0.16 * q],
      [shY + 0.005, 0.168 * q, 0.126 * q],
      [neckY + 0.014 * k, 0.07 * q, 0.066 * q]
    ];
    b.add(loft(rows, 8, ANG8), function (x, y, z, nx, ny, nz, ti) {
      var j = Math.floor(ti / 16), i = Math.floor(ti / 2) % 8;
      if (j === 2) return SASH;
      if (striped) return i % 2 ? T_ST : TUNIC;
      return (i === 3 || i === 6) ? T_SH : TUNIC;
    }, null, [hemY, hemY + 0.5 * k, 0.84]);

    if (hasCloak) {
      // 겉옷(남자·아이: 종아리까지 / 여자: 허리께까지 오는 어깨 덮개). 앞섶은 몸에 붙는다.
      var open = woman ? 52 : 40, nc = 6;
      var chem = woman ? waistY - 0.12 * k : Math.max(hemY + 0.09 * k, 0.24 * k);
      var cr = woman
        ? [[chem, 0.262 * q, 0.214 * q], [lerp(waistY, shY, 0.45), 0.25 * q, 0.2 * q], [shY - 0.05 * k, 0.24 * q, 0.182 * q], [neckY + 0.004, 0.122 * q, 0.104 * q]]
        : [[chem, 0.312 * q, 0.272 * q], [waistY, 0.255 * q, 0.21 * q], [shY - 0.06 * k, 0.244 * q, 0.184 * q], [neckY + 0.004, 0.122 * q, 0.104 * q]];
      var C_SH = shade(CLOAK, 0.8), C_HI = shade(CLOAK, 1.1);
      b.add(grid(nc, cr.length - 1, false, function (u, v, o, ci, j) {
        var r = cr[j], a = (90 + open + u * (360 - 2 * open)) * DEG, edge = Math.pow(Math.abs(u * 2 - 1), 4);
        o.set(r[1] * Math.cos(a) * (1 - 0.15 * edge), r[0], r[2] * Math.sin(a) * (1 - 0.06 * edge) - 0.01 * k);
      }), function (x, y, z, nx, ny, nz, ti) { var c = Math.floor(ti / 2) % nc; return c === 1 || c === 4 ? C_SH : (c === 2 ? C_HI : CLOAK); }, null, [chem, chem + 0.5 * k, 0.85]);
    }

    /* --- 머리 --- */
    var HM = function (x, y, z, rx, ry, rz, sx, sy, sz) { return TR(x, headY + y, z, rx, ry, rz, sx, sy, sz); };
    var ON = function (a, yf, lift, sx, sy, sz) { return onEll(0, headY, 0, hx, hy, hz, a, yf, lift, sx, sy, sz); };
    b.add(ball(8, 4), SK, HM(0, 0, 0, 0, 0, 0, hx, hy, hz));
    [-1, 1].forEach(function (s) { b.add(new T.CircleGeometry(1, 5), EYE, ON(s * 18, child ? -0.06 : 0.02, 0.05, hx * 0.115, hy * (child ? 0.13 : 0.115), 1)); });
    if (man) {
      // 머리쓰개와 머리띠, 수염
      b.add(hairCap(hx, hy, hz, { s: 1.13, sEdge: 1.16, front: 54, side: 158, back: 184, d1: 30, d2: 50, b1: 70, b2: 130, hang: 1, flare: 0.16, flareX: 1.5, backOut: 1.06, nu: 8, nv: 4, ths: [0, 0, 54, 28, 0], tuck: 0.92 }),
        CLOTH, HM(0, 0, 0), [headY - hy * 2.4, headY - hy * 0.2, 0.84]);
      var bandC = pick(['#8A4B34', '#3F4C66', '#6B4526', '#59683C']);
      b.add(loft([[headY + hy * 0.36, hx * 1.1, hz * 1.11], [headY + hy * 0.6, hx * 0.98, hz * 0.99]], 8), bandC);
      b.add(ball(5, 3), pick(BEARDS), HM(0, -hy * 0.7, hz * 0.3, 0.2, 0, 0, hx * 0.84, hy * (0.46 + R() * 0.2), hz * 0.62));
    } else if (woman || girl) {
      // 어깨까지 내려오는 머릿수건
      var L = girl ? 0.8 : 1;
      b.add(hairCap(hx, hy, hz, { s: 1.13, sEdge: 1.17, front: 50, side: 90 + 98 * L, back: 90 + 116 * L, d1: 28, d2: 54, hang: 1, flare: 0.26, flareX: 1.8, backOut: 1.04, nu: 8, nv: 4, ths: [0, 0, 54, 28, 0], tuck: 0.92 }),
        CLOTH, HM(0, 0, 0), [headY - hy * 3, headY - hy * 0.3, 0.84]);
    } else {
      // 사내아이: 맨머리
      b.add(hairCap(hx, hy, hz, { s: 1.12, sEdge: 1.08, front: 52, side: 96, back: 122, d1: 36, d2: 66, hang: 0.3, zig: 3, nu: 8, nv: 4, ths: [0, 0, 52, 27, 0], tuck: 0.9 }), pick(HAIRS), HM(0, 0, 0));
    }

    /* --- 짐 --- */
    var SACK = pick(['#C9B58A', '#B9A27A', '#A98C62', '#D9C7A0']);
    if (carry === 'sack') {
      b.add(displace(ball(5, 3), lumpy(R, 0.1)), function (x, y, z, nx, ny) { return ny < -0.3 ? shade(SACK, 0.78) : SACK; },
        TR(-0.1 * q, shY - 0.14 * k, -0.25 * q, 0.2, 0, 0.15, 0.2 * k, 0.25 * k, 0.16 * k));
    } else if (carry === 'head') {
      b.add(displace(ball(6, 4), lumpy(R, 0.1)), function (x, y, z, nx, ny) { return ny < -0.3 ? shade(SACK, 0.78) : SACK; },
        TR(0, H + 0.115 * k, -0.01, 0, R() * 3, 0, 0.21 * k, 0.13 * k, 0.2 * k));
    } else if (carry === 'baby') {
      // 포대기에 싸서 안은 아기
      var wrap = pick(['#E4D3AC', '#D9C7A0', '#C9B58A']);
      b.add(sbox(0.085 * k, 0.2 * k, 0.085 * k, 0.8, 6, 3), wrap, TR(-0.015 * k, shY - 0.25 * k, 0.185 * q + 0.02, 0.1, 0, 1.0));
      b.add(ball(5, 3), SK, TR(0.155 * k, shY - 0.155 * k, 0.2 * q + 0.02, 0, 0, 0, 0.062 * k, 0.066 * k, 0.064 * k));
    }
    rig.add(b.mesh(sm));

    /* --- 팔 --- */
    var SLEEVE = hasCloak ? CLOAK : TUNIC, S_IN = shade(SLEEVE, 0.6);
    var swing = [1, 1];                          // 왼팔(+X), 오른팔(-X)을 얼마나 흔드는지
    function makeArm(s) {
      var ab = new Builder(), U = V(s * 0.11, -1, 0.02), F = V(s * 0.04, -1, 0.17);
      var idx = s > 0 ? 0 : 1;
      if (carry === 'baby') { U = V(s * 0.1, -1, 0.2); F = V(-s * 0.72, s > 0 ? 0.1 : 0.42, 0.66); swing[idx] = 0; }
      else if (carry === 'head' && s > 0) { U = V(0.62, 0.72, 0.08); F = V(-0.62, 0.78, -0.02); swing[idx] = 0; }
      else if (carry === 'sack' && s < 0) { U = V(-0.12, -1, 0.22); F = V(0.3, 0.92, 0.22); swing[idx] = 0; }
      else if (carry === 'staff' && s < 0) { U = V(-0.1, -1, 0.3); F = V(0.04, -0.28, 1); swing[idx] = 0.28; }
      var a = addArm(ab, { ua: ua, fa: fa, U: U, F: F, r0: 0.07 * q, r1: 0.062 * q, r2: 0.058 * q, nu: 5, cut: 0.97, sleeve: SLEEVE, inner: S_IN, skin: SK, hand: 0.042 * k });
      if (carry === 'staff' && s < 0) {
        var hx_ = a.W.x + a.F.x * 0.03 * k, hz_ = a.W.z + a.F.z * 0.03 * k;
        ab.add(tubeAlong([V(hx_, -shY + 0.02, hz_ + 0.02), V(hx_, a.W.y + 0.34 * k, hz_ - 0.01)], 0.017 * k, 0.014 * k, 4, true), '#6B4526');
      }
      var m = ab.mesh(sm);
      m.position.set(s * sw, shY, 0);
      rig.add(m);
      return m;
    }
    var armL = makeArm(1), armR = makeArm(-1);

    /* --- 발 --- */
    var footX = 0.085 * q;
    function makeFoot(s) {
      var fb = new Builder();
      addFoot(fb, k, SK, SK_SH, woman ? 0 : hemY + 0.1 * k, false);
      var m = fb.mesh(sm);
      m.rotation.y = s * 0.16;
      group.add(m);
      return m;
    }
    var footL = makeFoot(1), footR = makeFoot(-1);

    /* --- 움직임 --- */
    var st = { t: R() * 10, ph: R() * TAU, w: 0 };
    var stride = 0.78 * H, stepHalf = 0.17 * k, liftH = 0.05 * k;
    function update(dt, speed) {
      dt = Math.min(Math.max(dt || 0, 0), 0.1);
      speed = Math.abs(speed || 0);
      st.t += dt;
      st.w += ((speed > 0.03 ? 1 : 0) - st.w) * Math.min(1, dt * 8);
      st.ph += dt * speed / stride * TAU;
      var w = st.w, s = Math.sin(st.ph), c = Math.cos(st.ph), br = Math.sin(st.t * 1.6);
      var amp = clamp(speed / 1.1, 0.5, 1.25);
      footL.position.set(footX, Math.max(0, c) * liftH * w, stepHalf * amp * s * w);
      footR.position.set(-footX, Math.max(0, -c) * liftH * w, -stepHalf * amp * s * w);
      footL.rotation.x = -0.2 * s * w;
      footR.rotation.x = 0.2 * s * w;
      rig.position.y = 0.016 * k * Math.abs(c) * w;
      rig.rotation.set(0.035 * w + 0.005 * br * (1 - w), 0.07 * s * w, 0.018 * c * w);
      var A = 0.4 * amp * w;
      armL.rotation.x = swing[0] * A * s + 0.012 * br * swing[0];
      armR.rotation.x = -swing[1] * A * s + 0.012 * br * swing[1];
    }
    update(0, 0);
    return { group: group, update: update };
  }

  /* ================================================================== 제사장(단순판) */
  var LINEN = '#F6F1E4', LINEN_SH = '#DFD7C4', LINEN_DP = '#C9BFA8';
  var SASH_BLUE = '#3B5FAE', SASH_PURPLE = '#6E3F93', SASH_SCARLET = '#C5372F';
  var _priestCount = 0;

  function makePriest(side) {
    var s = (side === 'R' || side === 'r') ? -1 : 1;        // 채를 메는 어깨: 'L' = +X(왼어깨), 'R' = -X(오른어깨)
    var sm = mat('smooth'), group = new T.Group(), rig = new T.Group();
    group.add(rig);
    var v = _priestCount++ % 4;                              // 네 사람이 조금씩 다르게(피부, 수염 빛깔). 키와 어깨 높이는 같다.
    var H = 1.71, k = H / 1.73, hy = 0.086 * H, hx = hy * 0.88, hz = hy * 0.93;
    var headY = H - hy, neckY = headY - hy * 0.97, shY = neckY - 0.125 * k, waistY = 0.58 * H;      // 채가 턱 아래에 놓이도록 어깨를 조금 낮게 잡았다
    var sw = 0.2 * k, ua = 0.168 * H, fa = 0.152 * H;
    var SK = SKINS[v][0], SK_SH = SKINS[v][1], HAIR = HAIRS[v], BEARD = BEARDS[v === 3 ? 4 : v];
    var poleR = 0.028, poleX = s * 0.186 * k, poleY = shY + 0.064 * k;

    /* --- 몸: 발목까지 오는 흰 세마포 통옷, 청색·자색·홍색 띠 --- */
    var b = new Builder(), nu = 12;
    var rows = [
      [0.045, 0.252 * k, 0.216 * k],
      [lerp(0.045, waistY, 0.5), 0.224 * k, 0.19 * k],
      [waistY - 0.035 * k, 0.189 * k, 0.153 * k],
      [waistY + 0.04 * k, 0.192 * k, 0.156 * k],
      [lerp(waistY, shY, 0.6), 0.2 * k, 0.16 * k],
      [shY + 0.005, 0.172 * k, 0.13 * k],
      [shY + 0.07 * k, 0.12 * k, 0.1 * k],
      [neckY + 0.012 * k, 0.07 * k, 0.066 * k]
    ];
    b.add(loft(rows, nu), function (x, y, z, nx, ny, nz, ti) {
      var j = Math.floor(ti / (2 * nu)), i = Math.floor(ti / 2) % nu;
      if (j === 2) return LINEN_SH;
      return i % 3 === 1 ? LINEN_SH : LINEN;
    }, null, [0.05, 0.6, 0.88]);
    // 띠: 세 가지 색 실이 섞여 짜인 모습(둘레를 따라 색이 번갈아 나온다)
    var SASH3 = [SASH_BLUE, SASH_PURPLE, SASH_SCARLET];
    b.add(loft([[waistY - 0.042 * k, 0.2 * k, 0.164 * k], [waistY + 0.046 * k, 0.203 * k, 0.167 * k]], 12),
      function (x, y, z, nx, ny, nz, ti) { return SASH3[Math.floor(ti / 2) % 3]; });
    // 띠의 늘어진 끝자락 두 가닥
    [[0.05, 0.0, 0.3], [0.1, 0.035, 0.24]].forEach(function (e, n) {
      b.add(grid(1, 3, false, function (u, vv, o) {
        o.set(e[0] * k + (u - 0.5) * 0.046 * k + (1 - vv) * 0.012 * n, waistY - e[2] * k * (1 - vv) - 0.01, 0.172 * k - e[1] * k + 0.02 * k * (1 - vv) * (1 - vv));
      }), function (x, y, z, nx, ny, nz, ti) { return SASH3[(Math.floor(ti / 2) + n) % 3]; });
    });
    b.add(new T.CylinderGeometry(0.056 * k, 0.06 * k, 0.1 * k, 6, 1, true), SK_SH, TR(0, neckY + 0.03 * k, 0.004));

    /* --- 머리: 채 반대쪽으로 조금 기울였다 --- */
    var tilt = TR(0, neckY, 0, 0, 0, s * 0.1).multiply(TR(0, -neckY, 0));
    var HM = function (x, y, z, rx, ry, rz, sx, sy, sz) { return tilt.clone().multiply(TR(x, headY + y, z, rx, ry, rz, sx, sy, sz)); };
    var ON = function (a, yf, lift, sx, sy, sz) { return tilt.clone().multiply(onEll(0, headY, 0, hx, hy, hz, a, yf, lift, sx, sy, sz)); };
    b.add(ball(10, 6), SK, HM(0, 0, 0, 0, 0, 0, hx, hy, hz));
    b.add(ball(4, 2), SK_SH, ON(0, -0.1, 0, hx * 0.13, hy * 0.17, hz * 0.16));
    [-1, 1].forEach(function (e) { b.add(new T.CircleGeometry(1, 6), EYE, ON(e * 21, 0.06, 0.014, hx * 0.085, hy * 0.095, 1)); });
    b.add(hairCap(hx, hy, hz, { s: 1.07, sEdge: 1.09, front: 60, side: 100, back: 128, d1: 38, d2: 64, hang: 0.4, nu: 10, nv: 3, ws: [1, 1, 0.5, 0], tuck: 0.9 }), HAIR, HM(0, 0, 0));
    b.add(ball(7, 4), BEARD, HM(0, -hy * 0.66, hz * 0.22, 0.15, 0, 0, hx * 0.95, hy * 0.52, hz * 0.84));
    b.add(ball(6, 3), BEARD, HM(0, -hy * 1.08, hz * 0.46, 0.3, 0, 0, hx * 0.56, hy * 0.42, hz * 0.4));
    // 흰 두건: 이마 위로 둥글게 감아 올린 관
    var capM = HM(0, hy * 0.2, -hz * 0.03, -0.13, 0, 0);
    b.add(loft([[0, hx * 1.1, hz * 1.11], [hy * 0.27, hx * 1.2, hz * 1.21], [hy * 0.62, hx * 1.15, hz * 1.16], [hy * 0.92, hx * 0.9, hz * 0.92], [hy * 1.1, hx * 0.5, hz * 0.52], [hy * 1.15, 0, 0]], 10),
      function (x, y, z, nx, ny, nz, ti) { return Math.floor(ti / 20) === 0 ? LINEN_SH : LINEN; }, capM);
    rig.add(b.mesh(sm));

    /* --- 팔 --- */
    var armUp = new Builder(), armDn = new Builder();
    var S = V(s * sw, shY, 0), G = V(poleX + s * 0.012, poleY + poleR - 0.02, 0.26 * k);
    var ik = solveArm(S, G, ua, fa, V(s * 0.75, -1, 0.05));
    var base = { ua: ua, fa: fa, r0: 0.074 * k, r1: 0.072 * k, r2: 0.078 * k, nu: 6, cut: 0.62, sleeve: LINEN, inner: LINEN_DP, skin: SK, hand: 0.045 * k, rw: 0.034 * k };
    addArm(armUp, ext(base, { U: ik.U, F: ik.F, cut: 0.5 }));
    addArm(armDn, ext(base, { U: V(-s * 0.1, -1, 0.02), F: V(-s * 0.03, -1, 0.16), cut: 0.78 }));
    var mUp = armUp.mesh(sm), mDn = armDn.mesh(sm);
    mUp.position.copy(S);
    mDn.position.set(-s * sw, shY, 0);
    rig.add(mUp);
    rig.add(mDn);

    /* --- 발 --- */
    var fb = new Builder();
    [-1, 1].forEach(function (e) { addFoot(fb, k, SK, SK_SH, 0, true, TR(e * 0.085 * k, 0, 0, 0, e * 0.18, 0)); });
    group.add(fb.mesh(sm));

    group.userData.poleY = poleY;
    group.userData.poleX = poleX;
    group.userData.poleRadius = poleR;
    group.userData.height = H + hy * 0.5;

    var t = v * 1.7;
    function update(dt) {
      dt = Math.min(Math.max(dt || 0, 0), 0.1);
      t += dt;
      var br = Math.sin(t * 1.35);
      rig.scale.set(1 + 0.0015 * br, 1 + 0.0025 * br, 1 + 0.004 * br);          // 숨쉬기
      rig.rotation.z = 0.003 * Math.sin(t * 0.47);
      mDn.rotation.x = 0.02 * Math.sin(t * 0.8 + 1);
    }
    update(0);
    return { group: group, update: update };
  }

  /* ================================================================== 백성을 이끄는 사람(단순판) */
  function makeLeader() {
    var sm = mat('smooth'), cl = mat('cloth'), group = new T.Group(), rig = new T.Group();
    group.add(rig);
    var H = 1.76, k = H / 1.73, hy = 0.086 * H, hx = hy * 0.88, hz = hy * 0.93;
    var headY = H - hy, neckY = headY - hy * 0.97, shY = neckY - 0.066 * k, waistY = 0.58 * H;
    var sw = 0.205 * k, ua = 0.168 * H, fa = 0.152 * H;
    var SK = '#BE8558', SK_SH = '#9F6B45', HAIR = '#2A201B', HAIR_HI = '#3F3028', BEARD = '#2E231D';
    var TUNIC = '#DCC79A', TUNIC_SH = '#C4AD80', BELT = '#5E4029', BELT_SH = '#4A3220';
    var CLOAK = '#B8352B', CLOAK_SH = '#8C2520', CLOAK_HI = '#D04A38';

    /* --- 몸: 종아리까지 오는 통옷과 가죽 띠 --- */
    var b = new Builder(), nu = 12, hemY = 0.2 * k;
    var rows = [
      [hemY, 0.25 * k, 0.215 * k],
      [lerp(hemY, waistY, 0.5), 0.224 * k, 0.19 * k],
      [waistY - 0.035 * k, 0.19 * k, 0.154 * k],
      [waistY + 0.045 * k, 0.194 * k, 0.158 * k],
      [lerp(waistY, shY, 0.6), 0.204 * k, 0.162 * k],
      [shY + 0.005, 0.176 * k, 0.132 * k],
      [neckY + 0.012 * k, 0.078 * k, 0.072 * k]
    ];
    b.add(loft(rows, nu), function (x, y, z, nx, ny, nz, ti) {
      var j = Math.floor(ti / (2 * nu)), i = Math.floor(ti / 2) % nu;
      if (j === 0 && y < hemY + 0.09 * k) return TUNIC_SH;
      return i % 3 === 0 ? TUNIC_SH : TUNIC;
    }, null, [hemY, 0.75, 0.86]);
    b.add(loft([[waistY - 0.044 * k, 0.201 * k, 0.166 * k], [waistY + 0.05 * k, 0.204 * k, 0.169 * k]], 12),
      function (x, y, z, nx, ny, nz, ti) { return Math.floor(ti / 2) % 4 === 1 ? BELT_SH : BELT; });
    b.add(new T.BoxGeometry(0.05 * k, 0.21 * k, 0.014), BELT, TR(-0.07 * k, waistY - 0.12 * k, 0.178 * k, -0.07, -0.3, -0.05));
    b.add(new T.CylinderGeometry(0.058 * k, 0.063 * k, 0.1 * k, 8, 1, true), SK_SH, TR(0, neckY + 0.03 * k, 0.004));
    rig.add(b.mesh(sm));

    /* --- 붉은 겉옷: 앞이 열려 있고 어깨에서 종아리까지 --- */
    var nc = 12, openHalf = 38, cloakTop = neckY + 0.004;
    var cRows = [[hemY + 0.07 * k, 0.308 * k, 0.274 * k], [lerp(hemY, waistY, 0.5), 0.28 * k, 0.244 * k], [waistY, 0.254 * k, 0.206 * k], [lerp(waistY, shY, 0.7), 0.254 * k, 0.196 * k], [shY - 0.005, 0.24 * k, 0.176 * k], [cloakTop, 0.142 * k, 0.116 * k]];
    var cb = new Builder();
    cb.add(grid(nc, cRows.length - 1, false, function (u, v, o, ci, j) {
      var r = cRows[j], a = (90 + openHalf + u * (360 - 2 * openHalf)) * DEG, edge = Math.pow(Math.abs(u * 2 - 1), 6);
      o.set(r[1] * Math.cos(a) * (1 - 0.1 * edge), r[0], r[2] * Math.sin(a) * (1 - 0.06 * edge) - 0.012 * k);
    }), function (x, y, z, nx, ny, nz, ti) { var c = Math.floor(ti / 2) % nc % 3; return c === 1 ? CLOAK_SH : (c === 2 ? CLOAK : CLOAK_HI); }, null, [hemY, 0.85, 0.84]);
    rig.add(cb.mesh(cl));

    /* --- 머리: 짙은 머리, 짙은 수염, 머리띠 --- */
    var headO = [0, neckY, 0], head = new T.Group();
    head.position.fromArray(headO);
    rig.add(head);
    var hb = new Builder();
    var HM = function (x, y, z, rx, ry, rz, sx, sy, sz) { return TR(x, headY + y, z, rx, ry, rz, sx, sy, sz); };
    var ON = function (a, yf, lift, sx, sy, sz) { return onEll(0, headY, 0, hx, hy, hz, a, yf, lift, sx, sy, sz); };
    hb.add(ball(10, 6), SK, HM(0, 0, 0, 0, 0, 0, hx, hy, hz));
    hb.add(ball(5, 3), SK_SH, ON(0, -0.1, 0, hx * 0.15, hy * 0.2, hz * 0.2));                                   // 코
    [-1, 1].forEach(function (e) {
      hb.add(new T.CircleGeometry(1, 8), EYE, ON(e * 21, 0.07, 0.012, hx * 0.078, hy * 0.088, 1));
      hb.add(new T.BoxGeometry(hx * 0.36, hy * 0.07, hz * 0.06), HAIR, ON(e * 22, 0.27, 0.01, 1, 1, 1).multiply(TR(0, 0, 0, 0, 0, e * -0.16)));     // 짙은 눈썹
      hb.add(new T.BoxGeometry(hx * 0.42, hy * 0.11, hz * 0.1), BEARD, ON(e * 13, -0.37, 0.02, 1, 1, 1).multiply(TR(0, 0, 0, 0, 0, e * 0.36)));     // 콧수염
    });
    hb.add(ball(7, 4), BEARD, HM(0, -hy * 0.64, hz * 0.2, 0.15, 0, 0, hx * 0.99, hy * 0.56, hz * 0.9));           // 턱을 감싼 수염(가슴까지 내려오지 않는다)
    hb.add(ball(7, 4), BEARD, HM(0, -hy * 1.06, hz * 0.46, 0.3, 0, 0, hx * 0.62, hy * 0.5, hz * 0.44));
    hb.add(hairCap(hx, hy, hz, { s: 1.1, sEdge: 1.14, front: 50, side: 112, back: 138, d1: 34, d2: 62, hang: 0.55, flare: 0.1, sweep: 4, zig: 2.5, nu: 12, nv: 5, tuck: 0.88 }),
      function (x, y) { return y > headY + hy * 0.75 ? HAIR_HI : HAIR; }, HM(0, 0, 0));
    hb.add(loft([[headY + hy * 0.42, hx * 1.1, hz * 1.12], [headY + hy * 0.62, hx * 0.99, hz * 1.01]], 12), '#E4D3AC');
    head.add(hb.mesh(sm, headO));

    /* --- 팔: 두 팔을 내리고 곧게 서 있다 (수 3장에는 손짓이 기록되어 있지 않다) --- */
    var base = { ua: ua, fa: fa, r0: 0.078 * k, r1: 0.08 * k, r2: 0.086 * k, nu: 6, cut: 0.74, sleeve: CLOAK, inner: CLOAK_SH, skin: SK, hand: 0.046 * k, rw: 0.036 * k };
    var arms = [1, -1].map(function (e) {
      var ab = new Builder();
      addArm(ab, ext(base, { U: V(e * 0.11, -1, 0.02), F: V(e * 0.035, -1, 0.17) }));
      var m = ab.mesh(sm);
      m.position.set(e * sw, shY, 0);
      rig.add(m);
      return m;
    });

    /* --- 발 --- */
    var fb = new Builder();
    [-1, 1].forEach(function (e) { addFoot(fb, k, SK, SK_SH, hemY + 0.1 * k, true, TR(e * 0.09 * k, 0, 0, 0, e * 0.18, 0)); });
    group.add(fb.mesh(sm));
    group.userData.height = H;

    var t = 0;
    function update(dt) {
      dt = Math.min(Math.max(dt || 0, 0), 0.1);
      t += dt;
      var br = Math.sin(t * 1.4);
      rig.scale.set(1 + 0.0015 * br, 1 + 0.0025 * br, 1 + 0.004 * br);
      rig.rotation.set(0, 0.012 * Math.sin(t * 0.35), 0);
      head.rotation.set(0.012 * Math.sin(t * 0.6), 0.07 * Math.sin(t * 0.42), 0);
      arms[0].rotation.x = 0.02 * Math.sin(t * 0.8 + 1);
      arms[1].rotation.x = 0.02 * Math.sin(t * 0.8 + 2.6);
    }
    update(0);
    return { group: group, update: update };
  }

  /* ================================================================== 덮개로 덮인 언약궤와 채 */
  // 민 4:5-6: 행진할 때 궤는 휘장과 가죽 덮개, 그 위의 순청색 보자기로 덮는다. 그래서 여기에는 청색 천과 채만 있다.
  // 궤의 치수는 출 25:10(길이 2.5규빗 ≈ 1.14m, 너비·높이 1.5규빗 ≈ 0.69m). 긴 쪽이 Z, 채는 양옆(±X)에서 Z 방향.
  function makeArk() {
    var group = new T.Group(), b = new Builder();
    var bx = 0.345, bz = 0.57, top = 0.69, PX = bx + 0.05, PY = 0.345, PRad = 0.028, PLen = 3.4;
    var BLUE = '#3F72D0', BLUE_HI = '#5A8EE2', BLUE_SH = '#3059B0', BLUE_DP = '#16233F';
    var nu = 40, folds = 10;
    // 모서리가 둥근 사각형의 둘레(길이로 고르게 나눈다). o에 점, nrm에 바깥 방향을 적는다.
    function rrect(u, a, c, r, o, nrm) {
      var ex = 2 * (a - r), ez = 2 * (c - r), arc = PI * r / 2, per = 2 * (ex + ez) + 4 * arc;
      var d = (((u % 1) + 1) % 1) * per;
      var seg = [ez / 2, arc, ex, arc, ez, arc, ex, arc, ez / 2], i = 0;
      while (i < 8 && d > seg[i]) { d -= seg[i]; i++; }
      var cx = a - r, cz = c - r, ph;
      if (i === 0) { o.set(a, 0, d); nrm.set(1, 0, 0); }
      else if (i === 2) { o.set(cx - d, 0, c); nrm.set(0, 0, 1); }
      else if (i === 4) { o.set(-a, 0, cz - d); nrm.set(-1, 0, 0); }
      else if (i === 6) { o.set(-cx + d, 0, -c); nrm.set(0, 0, -1); }
      else if (i === 8) { o.set(a, 0, -cz + d); nrm.set(1, 0, 0); }
      else {
        ph = (i - 1) / 2 * (PI / 2) + d / r;
        nrm.set(Math.cos(ph), 0, Math.sin(ph));
        o.set((i === 1 || i === 7 ? cx : -cx) + r * nrm.x, 0, (i === 1 || i === 3 ? cz : -cz) + r * nrm.z);
      }
    }
    // [높이, 반너비 a, 반길이 c, 모서리 반지름, 주름 깊이, 주름 위상]
    var rows = [
      [0.055, 0, 0, 0, 0, 0],                                             // 밑면 가운데(어두운 안쪽)
      [0.03, bx + 0.118, bz + 0.1, 0.15, 0.04, 0.5],                      // 옷단
      [0.14, bx + 0.11, bz + 0.085, 0.14, 0.03, 0.35],
      [0.29, bx + 0.104, bz + 0.064, 0.12, 0.018, 0.15],
      [0.39, bx + 0.098, bz + 0.046, 0.1, 0.008, 0],                      // 채 위에 걸친 자리
      [top - 0.045, bx + 0.03, bz + 0.03, 0.055, 0, 0],
      [top + 0.012, bx + 0.008, bz + 0.008, 0.035, 0, 0],                 // 윗면 모서리
      [top + 0.014, bx * 0.55, bz * 0.72, 0.1, 0, 0],
      [top + 0.014, 0, 0, 0, 0, 0]
    ];
    var nrm = new T.Vector3(), g = grid(nu, rows.length - 1, true, function (u, v, o, i, j) {
      var r = rows[j];
      if (r[1] === 0) { o.set(0, r[0], 0); return; }
      rrect(u, r[1], r[2], r[3], o, nrm);
      var wv = Math.sin(u * TAU * folds + r[5] * TAU + 1.3 * Math.sin(u * TAU * 3));
      o.addScaledVector(nrm, r[4] * wv);
      o.y = r[0] + (j === 1 ? 0.012 * Math.sin(u * TAU * folds * 0.5 + 2) + 0.01 * wv : 0);
    });
    b.add(g, function (x, y, z, nx, ny, nz, ti) {
      var j = Math.floor(ti / (2 * nu)), i = Math.floor(ti / 2) % nu;
      if (j === 0) return BLUE_DP;
      if (j >= 5) return j === 5 ? BLUE : BLUE_HI;
      var u = (i + 0.5) / nu, wv = Math.sin(u * TAU * folds + 0.3 * TAU + 1.3 * Math.sin(u * TAU * 3));
      return wv > 0.35 ? BLUE_HI : wv < -0.35 ? BLUE_SH : BLUE;
    }, null, [0.02, 0.45, 0.88]);
    group.add(b.mesh(mat('smooth')));

    // 채 두 개(금빛)
    var pb = new Builder();
    [-1, 1].forEach(function (s) {
      pb.add(new T.CylinderGeometry(PRad, PRad, PLen, 8, 1), function (x, y, z, nx, ny) { return ny > 0.4 ? BRASS_HI : ny < -0.4 ? BRASS_SH : BRASS; }, TR(s * PX, PY, 0, PI / 2, 0, 0));
    });
    group.add(pb.mesh(mat('brass')));
    group.userData.poleY = PY;
    group.userData.poleX = PX;
    group.userData.poleRadius = PRad;
    group.userData.poleLength = PLen;
    return group;
  }

  /* ================================================================== 물 */
  var W_DEEP = '#1B3E6C', W_MID = '#27799A', W_TOP = '#5CC0BE', W_FOAM = '#F4FAF6';
  var W_SURF_A = '#2A8498', W_SURF_B = '#43A8AC', W_SURF_HI = '#B4E6DC';
  var GLSL_NOISE = [
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }'
  ].join('\n');
  // 강물 면의 색: 큰 얼룩 위에 흐름 방향으로 길쭉한 밝은 물결 줄
  var GLSL_RIVER = [
    'uniform vec3 cSurfA; uniform vec3 cSurfB; uniform vec3 cSurfHi;',
    'vec3 riverCol(vec2 p, float t, vec2 flow){',
    '  vec2 dir = normalize(flow + vec2(-0.0001, 0.0)), q = p - flow * t;',
    '  float al = dot(q, dir), ac = dot(q, vec2(-dir.y, dir.x));',
    '  vec3 c = mix(cSurfA, cSurfB, vnoise(q * 0.11) * 0.8 + vnoise(q * 0.37 + 9.0) * 0.2);',
    '  float n1 = vnoise(vec2(al * 0.3, ac * 1.5 + 0.35 * sin(al * 0.23 + t * 0.3)));',
    '  float n2 = vnoise(vec2(al * 0.8 + 7.0 + t * 0.1, ac * 3.4));',
    '  float hi = smoothstep(0.66, 0.7, n1) * 0.55 + smoothstep(0.75, 0.79, n2) * 0.5;',
    '  float lo = smoothstep(0.34, 0.3, n1) * 0.35;',
    '  c = mix(c, cSurfA * 0.82, lo);',
    '  return mix(c, cSurfHi, clamp(hi, 0.0, 1.0));',
    '}'
  ].join('\n');
  function riverUniforms() { return { cSurfA: { value: K(W_SURF_A) }, cSurfB: { value: K(W_SURF_B) }, cSurfHi: { value: K(W_SURF_HI) } }; }

  /* 멈춰 쌓인 물의 벽 (수 3:13, 16). 벽면(-X를 향한다)은 거의 곧게 서 있고 위에서 앞으로 말려 넘어오지 않는다.
   * 꼭대기에는 낮은 물마루와 포말, 그 뒤(+X, 상류)로 6m쯤 가득 찬 물이 이어진다. */
  function makeWaterWall(length, height) {
    var L = Math.max(2, +length || 40), h = Math.max(1, +height || 6), f = clamp(h / 6, 0.6, 1.4);
    // 단면: [x, y, 물마루 무게, 부분(0 벽면, 1 윗면, 2 뒷면·옆면)]
    var PR = [
      [-0.6 * f, 0, 0, 0], [-0.42 * f, 0.05 * h, 0, 0], [-0.27 * f, 0.16 * h, 0, 0], [-0.15 * f, 0.32 * h, 0.05, 0], [-0.06 * f, 0.5 * h, 0.1, 0],
      [0, 0.68 * h, 0.2, 0], [0.07 * f, 0.82 * h, 0.4, 0], [0.18 * f, 0.92 * h, 0.7, 0], [0.38 * f, 0.985 * h, 0.95, 0], [0.68 * f, h, 1, 0.5],
      [1.1 * f, h - 0.1 * f, 0.8, 1], [1.7 * f, h - 0.22 * f, 0.45, 1], [3 * f, h - 0.28 * f, 0.2, 1], [6, h - 0.3 * f, 0, 1], [6, 0, 0, 2]
    ];
    var np = PR.length, nz = clamp(Math.round(L / 1.5), 8, 120);
    var pos = [], info = [], idx = [], iz, kp, a, c;
    for (iz = 0; iz <= nz; iz++) for (kp = 0; kp < np; kp++) {
      var z = -L / 2 + L * iz / nz;
      pos.push(PR[kp][0], PR[kp][1], z);
      info.push(PR[kp][2], PR[kp][3], z, 0);
    }
    for (iz = 0; iz < nz; iz++) for (kp = 0; kp < np - 1; kp++) {
      a = iz * np + kp; c = (iz + 1) * np + kp;
      idx.push(a, c, a + 1, a + 1, c, c + 1);
    }
    // 양 끝을 막는다(가운데 점에서 부채꼴)
    [-1, 1].forEach(function (e) {
      var base = pos.length / 3, zz = e * L / 2;
      pos.push(2.6, h * 0.45, zz); info.push(0, 2, 2.6 + e * 37, 0);
      for (kp = 0; kp < np; kp++) { pos.push(PR[kp][0], PR[kp][1], zz); info.push(PR[kp][2], 2, PR[kp][0] + e * 37, 0); }
      for (kp = 0; kp < np; kp++) {
        var p0 = base + 1 + kp, p1 = base + 1 + (kp + 1) % np;
        if (e < 0) idx.push(base, p0, p1); else idx.push(base, p1, p0);
      }
    });
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(new Float32Array(pos), 3));
    geo.setAttribute('aInfo', new T.BufferAttribute(new Float32Array(info), 4));
    geo.setIndex(idx);
    geo.computeVertexNormals();

    var uniforms = T.UniformsUtils.merge([T.UniformsLib.fog, {
      uTime: { value: 0 }, uH: { value: h },
      cDeep: { value: K(W_DEEP) }, cMid: { value: K(W_MID) }, cTop: { value: K(W_TOP) }, cFoam: { value: K(W_FOAM) }
    }, riverUniforms()]);
    var VS = [
      'uniform float uTime; uniform float uH;',
      'attribute vec4 aInfo;',
      'varying vec3 vP; varying vec3 vN; varying vec3 vW; varying vec4 vInfo;',
      '#include <fog_pars_vertex>',
      'void main(){',
      '  vec3 p = position; float z = p.z;',
      // 물마루: 제자리에서 천천히 오르내린다(앞으로 밀려오지 않는다)
      '  float sw = sin(z * 0.55 + uTime * 0.33) * 0.5 + sin(z * 1.37 - uTime * 0.21 + 1.7) * 0.3 + sin(z * 2.9 + uTime * 0.45) * 0.14;',
      '  p.y += aInfo.x * 0.15 * sw;',
      // 벽면: 아주 약하게 부풀었다 가라앉는다
      '  float fw = (1.0 - step(0.75, aInfo.y)) * smoothstep(0.0, 0.3 * uH, p.y);',
      '  p.x += fw * 0.06 * sin(z * 0.8 + p.y * 0.9 - uTime * 0.4);',
      '  vP = p; vInfo = aInfo;',
      '  vN = normalize(mat3(modelMatrix) * normal);',
      '  vec4 wp = modelMatrix * vec4(p, 1.0); vW = wp.xyz;',
      '  vec4 mvPosition = viewMatrix * wp;',
      '  gl_Position = projectionMatrix * mvPosition;',
      '  #include <fog_vertex>',
      '}'
    ].join('\n');
    var FS = [
      'uniform float uTime; uniform float uH;',
      'uniform vec3 cDeep; uniform vec3 cMid; uniform vec3 cTop; uniform vec3 cFoam;',
      'varying vec3 vP; varying vec3 vN; varying vec3 vW; varying vec4 vInfo;',
      '#include <fog_pars_fragment>',
      GLSL_NOISE, GLSL_RIVER,
      'void main(){',
      '  float part = vInfo.y, s = vInfo.z, y = vP.y, t = clamp(y / uH, 0.0, 1.0);',
      '  vec3 N = normalize(vN), Vd = normalize(cameraPosition - vW);',
      // 세로 결: 벽을 따라가는 방향으로는 촘촘하고 위아래로는 길게 늘인 노이즈. 결이 좌우로 아주 천천히 일렁인다.
      '  float wob = 0.13 * sin(y * 0.7 + uTime * 0.22 + s * 0.31) + 0.05 * sin(y * 1.9 - uTime * 0.37 + s * 1.3);',
      '  float sc = s + wob;',
      '  float n1 = vnoise(vec2(sc * 1.1, y * 0.09 - uTime * 0.02));',
      '  float n2 = vnoise(vec2(sc * 3.3 + 11.0, y * 0.2 + uTime * 0.03));',
      '  float n3 = vnoise(vec2(sc * 9.0 + 5.0, y * 0.45 - uTime * 0.05));',
      '  float st = n1 * 0.42 + n2 * 0.36 + n3 * 0.22;',
      '  vec3 col = mix(cDeep, cMid, smoothstep(0.0, 0.62, t));',
      '  col = mix(col, cTop, smoothstep(0.5, 1.0, t) * 0.75);',
      '  col = mix(col, cTop, smoothstep(0.55, 0.59, st) * 0.26);',
      '  col = mix(col, cDeep, smoothstep(0.45, 0.41, st) * 0.34);',
      '  col = mix(col, cFoam, smoothstep(0.8, 0.84, n3) * smoothstep(0.25, 0.9, t) * 0.3);',
      // 포말: 물마루를 따라 들쭉날쭉하고, 가는 줄기로 조금 흘러내리다 멈췄다
      '  float edge = uH - 0.2 - 0.55 * vnoise(vec2(s * 1.4, uTime * 0.05)) - 1.5 * pow(vnoise(vec2(sc * 5.0 + 3.0, 1.7)), 3.0);',
      '  float foam = smoothstep(edge - 0.14, edge + 0.04, y);',
      '  float foot = smoothstep(0.4, 0.0, y) * (0.3 + 0.45 * vnoise(vec2(s * 2.0, uTime * 0.08)));',
      '  float alpha = mix(0.93, 0.78, t);',
      // 윗면: 가득 찬 강물. 물마루 가까이에만 포말
      '  float topw = smoothstep(0.5, 1.0, part) * (1.0 - step(1.5, part));',
      '  vec3 surf = riverCol(vP.xz, uTime, vec2(-0.05, 0.0));',
      '  float tf = smoothstep(2.1, 0.75, vP.x + 0.9 * vnoise(vec2(s * 0.9, uTime * 0.05)) - 0.5 * vnoise(vec2(s * 3.1 + 2.0, vP.x * 1.3)));',
      '  col = mix(col, surf, topw); foam = mix(foam, tf, topw); foot *= 1.0 - topw; alpha = mix(alpha, 0.86, topw);',
      // 옆면·뒷면은 결 없이 깊이에 따른 색만
      '  float capw = step(1.5, part);',
      '  col = mix(col, cFoam, clamp(foam * 0.9 + foot * 0.5, 0.0, 1.0));',
      '  alpha = mix(alpha, 0.97, clamp(foam, 0.0, 1.0));',
      '  float nl = dot(N, normalize(vec3(-0.57, 0.69, 0.45)));',
      '  col *= 0.86 + 0.18 * nl;',
      '  col += cTop * pow(1.0 - abs(dot(N, Vd)), 3.0) * 0.2 * (1.0 - capw * 0.5);',
      '  gl_FragColor = vec4(col, alpha);',
      '  #include <fog_fragment>',
      '}'
    ].join('\n');
    var material = new T.ShaderMaterial({ uniforms: uniforms, vertexShader: VS, fragmentShader: FS, transparent: true, fog: true });
    var mesh = new T.Mesh(geo, material);
    mesh.renderOrder = 2;
    var group = new T.Group();
    group.add(mesh);
    return { group: group, update: function (t) { uniforms.uTime.value = +t || 0; } };
  }

  /* 잔잔히 흐르는 강물 면. XZ 평면의 w × d 사각형, 원점 중심, y = 0. */
  function makeWaterSurface(w, d) {
    w = +w || 40; d = +d || 40;
    var geo = new T.BufferGeometry(), hw = w / 2, hd = d / 2;
    geo.setAttribute('position', new T.BufferAttribute(new Float32Array([-hw, 0, -hd, -hw, 0, hd, hw, 0, hd, hw, 0, -hd]), 3));
    geo.setAttribute('normal', new T.BufferAttribute(new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]), 3));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    var uniforms = T.UniformsUtils.merge([T.UniformsLib.fog, { uTime: { value: 0 }, uFlow: { value: new T.Vector2(-0.22, 0) }, uOpacity: { value: 0.88 } }, riverUniforms()]);
    var VS = [
      'varying vec3 vP; varying vec3 vW;',
      '#include <fog_pars_vertex>',
      'void main(){',
      '  vP = position;',
      '  vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz;',
      '  vec4 mvPosition = viewMatrix * wp;',
      '  gl_Position = projectionMatrix * mvPosition;',
      '  #include <fog_vertex>',
      '}'
    ].join('\n');
    var FS = [
      'uniform float uTime; uniform vec2 uFlow; uniform float uOpacity;',
      'varying vec3 vP; varying vec3 vW;',
      '#include <fog_pars_fragment>',
      GLSL_NOISE, GLSL_RIVER,
      'void main(){',
      '  vec3 col = riverCol(vP.xz, uTime, uFlow);',
      '  vec3 Vd = normalize(cameraPosition - vW);',
      '  col = mix(col, cSurfHi, pow(1.0 - abs(Vd.y), 4.0) * 0.35);',          // 멀리 눕혀 볼수록 하늘빛
      '  gl_FragColor = vec4(col, uOpacity);',
      '  #include <fog_fragment>',
      '}'
    ].join('\n');
    var material = new T.ShaderMaterial({ uniforms: uniforms, vertexShader: VS, fragmentShader: FS, transparent: true, fog: true });
    var mesh = new T.Mesh(geo, material);
    mesh.renderOrder = 1;
    return { mesh: mesh, update: function (t) { uniforms.uTime.value = +t || 0; } };
  }

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
      var gy2 = groundY(hx2, hz2), hh = 4.2 + R() * 3 + (1 - rr) * 1.2, hc = HOUSES[Math.floor(R() * HOUSES.length)], ry = (R() - 0.5) * 0.3;
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

  /* ================================================================== 내보내기 */
  BO3D.models2 = {
    israelite: makeIsraelite,
    priestSimple: makePriest,
    leaderSimple: makeLeader,
    arkCovered: makeArk,
    waterWall: makeWaterWall,
    waterSurface: makeWaterSurface,
    jericho: makeJericho,
    palm: makePalm,
    reeds: makeReeds,
    grain: makeGrain
  };
})();
