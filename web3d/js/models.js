/* bible_onyou 3D 모델 (three.js r128, 전역 THREE)
 *
 * 외부 파일 없이 도형과 직접 만든 geometry만 쓴다. 단위는 미터, 발이 y=0, 정면이 +Z.
 *
 *   BO3D.models.kid(key)       -> { group, update(dt, speed) }      key: 'choeon' | 'hyu' | 'onwoo'
 *   BO3D.models.moses()        -> { group, setPose(name), update(dt, moving) }   name: 'approach' | 'hideface'
 *   BO3D.models.sheep(seed)    -> { group, update(dt) }
 *   BO3D.models.bush()         -> { group, update(t) }
 *   BO3D.models.timeMachine()  -> { group, update(t) }
 *   BO3D.models.scrap()        -> { group, update(t) }
 *   BO3D.models.rock(seed) / shrub(seed) / acacia(seed) -> THREE.Group
 *
 * 덧붙인 것(약속한 것 외): moses().setPose(name, true)는 보간 없이 바로 바꾼다.
 *   BO3D.models.config.srgbOutput = true 로 두고 모델을 만들면 색을 선형 공간으로 바꿔 굽는다
 *   (renderer.outputEncoding = THREE.sRGBEncoding 을 쓸 때만. 기본값은 false).
 * 그림자: 모든 mesh에 castShadow만 켠다. receiveShadow는 필요하면 게임 쪽에서 켠다.
 *
 * 색은 꼭짓점 색(vertex color)으로 굽고 재질 몇 개를 모든 모델이 함께 쓴다.
 * 한 관절 묶음 안의 조각은 mesh 하나로 합쳐 draw call을 줄였다.
 *
 * 신학 규칙(공통규칙서 3절, 스타일가이드 2절): 떨기나무에는 불꽃, 불티, 빛만 있다.
 * 사람, 얼굴, 손, 눈, 천사 모양은 만들지 않는다. 책과 양피지에는 글자와 기호가 없다.
 */
(function () {
  'use strict';
  var T = window.THREE;
  var BO3D = window.BO3D = window.BO3D || {};
  var PI = Math.PI, TAU = PI * 2, DEG = PI / 180;

  // renderer.outputEncoding을 sRGBEncoding으로 쓰는 경우, 모델을 만들기 전에 true로 바꾸면 색을 선형 공간으로 바꿔 굽는다.
  var config = { srgbOutput: false };

  /* ------------------------------------------------------------------ 작은 도구 */
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
  function ease(k) { return k * k * (3 - 2 * k); }
  function spow(c, e) { return (c < 0 ? -1 : 1) * Math.pow(Math.abs(c), e); }

  var _colors = {};
  function K(hex) {
    if (hex && hex.isColor) return hex;
    var key = hex + (config.srgbOutput ? 'L' : '');
    var c = _colors[key];
    if (!c) { c = new T.Color(hex); if (config.srgbOutput) c.convertSRGBToLinear(); _colors[key] = c; }
    return c;
  }
  function mix(a, b, t) { return K(a).clone().lerp(K(b), t); }

  var _mats = {};
  function mat(name) {
    var m = _mats[name];
    if (m) return m;
    var S = T.MeshStandardMaterial;
    if (name === 'smooth' || name === 'sheepWalk') m = new S({ vertexColors: true, roughness: 0.8, metalness: 0, morphTargets: name === 'sheepWalk' });
    else if (name === 'cloth') m = new S({ vertexColors: true, roughness: 0.9, metalness: 0, side: T.DoubleSide });
    else if (name === 'flat') m = new S({ vertexColors: true, roughness: 0.92, metalness: 0, flatShading: true });
    else if (name === 'leaf') m = new S({ vertexColors: true, roughness: 0.9, metalness: 0, flatShading: true, side: T.DoubleSide });
    else if (name === 'brass') m = new S({ vertexColors: true, roughness: 0.38, metalness: 0.22 });
    _mats[name] = m;
    return m;
  }

  var _glow;
  function glowTex() {
    if (_glow) return _glow;
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    gr.addColorStop(0.7, 'rgba(255,255,255,0.14)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    _glow = new T.CanvasTexture(c);
    return _glow;
  }
  function glowSprite(hex, size, opacity) {
    var s = new T.Sprite(new T.SpriteMaterial({
      map: glowTex(), color: K(hex), transparent: true, opacity: opacity,
      blending: T.AdditiveBlending, depthWrite: false, fog: false
    }));
    s.scale.set(size, size, 1);
    return s;
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
  // grad: [y0, y1, mul]  높이 y0 아래는 mul만큼 어둡게, y1 위는 그대로(꼭짓점 단위로 부드럽게 이어진다)
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
  // 관절에서 아래(-y)로 뻗는 팔다리. capTop/capBot: 끝을 둥글게 닫을지
  function limb(r0, r1, len, nu, capTop, capBot) {
    var rows = [];
    if (capBot) rows.push([-len - r1, 0, 0], [-len - r1 * 0.72, r1 * 0.7, r1 * 0.7]);
    rows.push([-len, r1, r1], [0, r0, r0]);
    if (capTop) rows.push([r0 * 0.72, r0 * 0.7, r0 * 0.7], [r0, 0, 0]);
    return loft(rows, nu);
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

  // 머리카락·머리쓰개: 머리(타원체 hx, hy, hz)를 덮는 껍질.
  // 앞(얼굴)은 front 각도까지만, 옆은 side, 뒤는 back 각도까지 내려온다(천정에서 잰 각도, 90 = 귀 높이).
  // hang: 귀 높이 아래에서 머리를 따라 감기는지(0) 곧게 늘어지는지(1)
  function hairCap(hx, hy, hz, o) {
    var nu = o.nu || 14, nv = o.nv || 6;
    return grid(nu, nv, true, function (u, v, out, i, j) {
      var a = u * TAU, ca = Math.cos(a), sa = Math.sin(a);
      var d = Math.acos(clamp(sa, -1, 1)) / DEG;
      var open = smooth(o.d1, o.d2, d), back = smooth(o.b1 || 95, o.b2 || 150, d);
      var front = o.front + (o.sweep || 0) * ca + (o.zig || 0) * (i % 2 ? 1 : -1);
      var end = lerp(front, lerp(o.side, o.back, back), open);
      var w = j === 0 ? 0 : (j - 1) / (nv - 1);
      var th = end * Math.pow(1 - w, o.pow || 1) * DEG;
      var s = lerp(o.sEdge || o.s, o.s, w);
      var st = Math.sin(th), ct = Math.cos(th), x, y, z;
      if (th <= PI / 2) { x = hx * s * st * ca; y = hy * s * ct; z = hz * s * st * sa; }
      else {
        var e = th - PI / 2, f = 1 + (o.flare || 0) * e, h = o.hang;
        x = lerp(hx * s * st * ca, hx * s * ca * f, h);
        y = lerp(hy * s * ct, -hy * s * e, h);
        z = lerp(hz * s * st * sa, hz * s * sa * f * (sa < 0 ? (o.backOut || 1) : 1), h);
      }
      if (j === 0) { var tk = o.tuck || 0.88; x *= tk; z *= tk; y += hy * 0.012; }
      out.set(x, y, z);
      if (o.shape) o.shape(out, ca, sa, w);
    });
  }

  /* ================================================================== 세 주인공 */
  var SKIN = '#F6CFAB', SKIN_SH = '#E8B28B', EYE = '#2B2530', LEATHER = '#9A6238', LEATHER_SH = '#7A4A28';
  var BRASS = '#DDA945', BRASS_HI = '#F4D27A', BRASS_SH = '#B9832F', BRASS_DP = '#8C5E24';

  // 타원체 겉면의 한 점에 물건을 붙이는 행렬. aDeg: 정면에서 옆으로 돈 각, yf: 높이(-1..1). 물건의 +z가 바깥을 향한다.
  function onEll(cx, cy, cz, hx, hy, hz, aDeg, yf, lift, sx, sy, sz) {
    var a = aDeg * DEG, c = Math.sqrt(1 - yf * yf), l = 1 + (lift || 0);
    var px = hx * c * Math.sin(a), py = hy * yf, pz = hz * c * Math.cos(a);
    var q = new T.Quaternion().setFromUnitVectors(_b.set(0, 0, 1), _c.set(px / (hx * hx), py / (hy * hy), pz / (hz * hz)).normalize());
    return new T.Matrix4().compose(new T.Vector3(cx + px * l, cy + py * l, cz + pz * l), q, new T.Vector3(sx, sy, sz));
  }

  /* 나눈 모델 파일들이 함께 쓰는 도구 묶음 */
  BO3D._modelKit = {
    T: T, PI: PI, TAU: TAU, DEG: DEG, config: config, rng: rng, lerp: lerp, clamp: clamp, smooth: smooth, ease: ease, spow: spow, K: K, mix: mix, mat: mat, glowTex: glowTex, glowSprite: glowSprite, TR: TR, Builder: Builder, _e: _e, _q: _q, _p: _p, _s: _s, _m3: _m3, _a: _a, _b: _b, _c: _c, _n: _n, grid: grid, fixPole: fixPole, loft: loft, limb: limb, ball: ball, sbox: sbox, tubeAlong: tubeAlong, curvePts: curvePts, V: V, displace: displace, lumpy: lumpy, hairCap: hairCap, onEll: onEll, SKIN: SKIN, SKIN_SH: SKIN_SH, EYE: EYE, LEATHER: LEATHER, LEATHER_SH: LEATHER_SH, BRASS: BRASS, BRASS_HI: BRASS_HI, BRASS_SH: BRASS_SH, BRASS_DP: BRASS_DP
  };
  BO3D.models = { config: config };
})();
