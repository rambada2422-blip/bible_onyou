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
    if (name === 'smooth') m = new S({ vertexColors: true, roughness: 0.8, metalness: 0 });
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
  var KIDS = {
    choeon: {
      H: 1.35, ratio: 4.1, legFrac: 0.39, sw: 0.125, hem: 1.12,
      top: '#EE7B62', topSh: '#D2604A', collar: '#F6D078', sleeve: '#F6D078', cuff: null,
      pants: '#5F7FAE', pantsHi: '#8AA6CE',
      shoe: '#F2B544', shoeHi: '#F8CD6E', sole: '#8C5E24',
      pack: '#6F8448', packSh: '#566D38', packHi: '#8FA658', packSize: [0.11, 0.112, 0.058],
      hair: '#5E3D2E', hairHi: '#7A5440'
    },
    hyu: {
      H: 1.55, ratio: 4.5, legFrac: 0.42, sw: 0.15, hem: 1.06,
      top: '#2F9C95', topSh: '#237A75', collar: '#52B8B0', sleeve: null, cuff: '#F3E9D6',
      pants: '#A9744A', pantsHi: '#C08C60',
      shoe: '#E4BE7E', shoeHi: '#EDD09A', sole: '#7A4A28',
      pack: '#E0A93B', packSh: '#C48E28', packHi: '#F2C867', packSize: [0.13, 0.152, 0.066],
      hair: '#4A382F', hairHi: '#65503F'
    },
    onwoo: {
      H: 1.72, ratio: 4.9, legFrac: 0.45, sw: 0.172, hem: 1.06,
      top: '#4E5FB0', topSh: '#3C4B92', collar: '#7080CC', sleeve: null, cuff: '#3C4B92',
      pants: '#DCC293', pantsHi: '#EDDAB4',
      shoe: '#5565B5', shoeHi: '#F3EBDB', sole: '#F3EBDB',
      pack: '#9A6238', packSh: '#7A4A28', packHi: '#B57A48', packSize: [0.14, 0.172, 0.07],
      hair: '#3F3540', hairHi: '#5A4D5E'
    }
  };
  // 몸통 둘레를 나누는 각도. 앞(90°) 가운데에 좁은 칸(2번)을 두어 여민 옷 사이의 속옷을 칠할 수 있게 한다.
  var TORSO_ANG = [15, 45, 70, 110, 135, 165, 195, 225, 250, 290, 315, 345].map(function (d) { return d * DEG; });

  // 타원체 겉면의 한 점에 물건을 붙이는 행렬. aDeg: 정면에서 옆으로 돈 각, yf: 높이(-1..1). 물건의 +z가 바깥을 향한다.
  function onEll(cx, cy, cz, hx, hy, hz, aDeg, yf, lift, sx, sy, sz) {
    var a = aDeg * DEG, c = Math.sqrt(1 - yf * yf), l = 1 + (lift || 0);
    var px = hx * c * Math.sin(a), py = hy * yf, pz = hz * c * Math.cos(a);
    var q = new T.Quaternion().setFromUnitVectors(_b.set(0, 0, 1), _c.set(px / (hx * hx), py / (hy * hy), pz / (hz * hz)).normalize());
    return new T.Matrix4().compose(new T.Vector3(cx + px * l, cy + py * l, cz + pz * l), q, new T.Vector3(sx, sy, sz));
  }

  function makeKid(key) {
    if (!KIDS[key]) key = 'choeon';
    var d = KIDS[key], girl = key === 'choeon';
    var H = d.H, sw = d.sw;
    var hy = H / d.ratio / 2, hx = hy * 0.95, hz = hy * 0.96;
    var headY = H - hy * 1.15;
    var shY = headY - hy - 0.018 * H;                // 목 밑(몸통 꼭대기)
    var hipY = H * d.legFrac, L = shY - hipY;
    var ankle = 0.05 * H, thigh = (hipY - ankle) * 0.5, shin = thigh;
    var hipX = sw * 0.5, armX = sw * 0.98, armY = hipY + L * 0.83;
    var ua = 0.145 * H, fa = 0.135 * H, handR = 0.034 * H;
    var rArm = sw * 0.33, rLeg = sw * 0.5;
    var Y = function (f) { return hipY + L * f; };
    var sm = mat('smooth');

    var group = new T.Group();
    var rig = new T.Group();
    group.add(rig);

    /* --- 골반(바지) --- */
    var pel = new Builder();
    pel.add(loft([[Y(-0.085), 0, 0], [Y(-0.07), sw * 0.66, sw * 0.52], [Y(-0.01), sw * 0.98, sw * 0.7], [Y(0.08), sw * 0.97, sw * 0.71], [Y(0.2), sw * 0.9, sw * 0.66]], 12, TORSO_ANG), d.pants);
    rig.add(pel.mesh(sm));

    /* --- 윗몸 --- */
    var chestO = [0, Y(0.1), 0];
    var chest = new T.Group();
    chest.position.fromArray(chestO);
    rig.add(chest);
    var tor = new Builder(), hw = d.hem;
    var topCol = function (x, y, z, nx, ny, nz, ti) {
      var j = Math.floor(ti / 24), i = Math.floor(ti / 2) % 12;
      if (key === 'onwoo' && i === 2 && j >= 1) return '#FBF7EE';        // 열어 입은 재킷 사이의 티셔츠
      if (girl && i === 2 && j >= 5) return d.sleeve;                     // 조끼 목선 사이의 노란 티셔츠
      return j <= 1 ? d.topSh : d.top;
    };
    var topRows = [[Y(0.115), sw * 0.86, sw * 0.62], [Y(0.10), sw * hw, sw * hw * 0.74], [Y(0.185), sw * (hw - 0.03), sw * (hw - 0.03) * 0.74], [Y(0.32), sw * 0.97, sw * 0.72],
      [Y(0.60), sw * 1.0, sw * 0.76], [Y(0.84), sw * 1.0, sw * 0.71], [Y(0.95), sw * 0.72, sw * 0.54], [Y(1.0), sw * 0.38, sw * 0.36]];
    tor.add(loft(topRows, 12, TORSO_ANG), topCol, null, [Y(0.1), Y(0.7), 0.9]);
    // 몸통 겉면: 높이 y에서 x 자리의 앞뒤 두께, x 자리의 어깨 높이
    var surfZ = function (x, y) {
      for (var k = 1; k < topRows.length - 1; k++) if (y <= topRows[k + 1][0]) break;
      k = Math.min(k, topRows.length - 2);
      var t = clamp((y - topRows[k][0]) / (topRows[k + 1][0] - topRows[k][0]), 0, 1), rx = lerp(topRows[k][1], topRows[k + 1][1], t), rz = lerp(topRows[k][2], topRows[k + 1][2], t);
      return rz * Math.sqrt(Math.max(0, 1 - (x * x) / (rx * rx)));
    };
    var topAt = function (x) {
      for (var k = topRows.length - 1; k > 1; k--) if (topRows[k - 1][1] >= Math.abs(x)) break;
      return lerp(topRows[k - 1][0], topRows[k][0], clamp((topRows[k - 1][1] - Math.abs(x)) / (topRows[k - 1][1] - topRows[k][1]), 0, 1));
    };
    tor.add(new T.TorusGeometry(1, 0.26, 3, 8), d.collar, TR(0, Y(0.985), 0, PI / 2, 0, 0, sw * 0.37, sw * 0.36, sw * 0.42));       // 깃
    tor.add(new T.CylinderGeometry(sw * 0.25, sw * 0.27, headY - hy * 0.8 - Y(0.96), 8, 1, true), SKIN_SH, TR(0, (headY - hy * 0.8 + Y(0.96)) / 2, 0));
    if (girl) {
      // 조끼 주머니
      [-1, 1].forEach(function (s) { tor.add(new T.BoxGeometry(sw * 0.44, sw * 0.36, sw * 0.1), '#F7A48E', TR(s * sw * 0.5, Y(0.31), sw * 0.69, -0.03, s * 0.4, 0)); });
    } else if (key === 'hyu') {
      tor.add(new T.BoxGeometry(sw * 0.07, L * 0.74, sw * 0.06), d.topSh, TR(0, Y(0.53), sw * 0.735, -0.02, 0, 0));           // 지퍼 선
    } else {
      [-1, 1].forEach(function (s) { tor.add(sbox(sw * 0.14, L * 0.2, sw * 0.05, 0.6, 4, 2), d.collar, TR(s * sw * 0.36, Y(0.77), sw * 0.71, -0.12, s * 0.4, s * -0.2)); });    // 라펠
    }
    // 배낭
    var pk = d.packSize, pz = -(sw * 0.7 + pk[2] * 0.72), py = Y(0.56);
    tor.add(sbox(pk[0], pk[1], pk[2], 0.55, 8, 4), d.pack, TR(0, py, pz), [py - pk[1], py + pk[1], 0.86]);
    tor.add(sbox(pk[0] * 1.04, pk[1] * 0.42, pk[2] * 1.06, 0.55, 8, 3), d.packSh, TR(0, py + pk[1] * 0.62, pz - 0.004));
    tor.add(sbox(pk[0] * 0.7, pk[1] * 0.36, pk[2] * 0.5, 0.6, 6, 3), d.packHi, TR(0, py - pk[1] * 0.42, pz - pk[2] * 0.78));
    tor.add(new T.CircleGeometry(0.02, 8), BRASS_HI, TR(0, py + pk[1] * 0.32, pz - pk[2] * 1.075, 0, PI, 0));
    [-1, 1].forEach(function (s) {       // 어깨끈: 몸통 겉면을 따라 앞가슴에서 어깨를 넘어 배낭까지
      tor.add(grid(1, 9, false, function (u, v, o) {
        var x = s * sw * 0.56 + (0.5 - u) * sw * 0.2, front = v < 0.56;
        var y = Math.min(front ? lerp(Y(0.46), Y(1.0), v / 0.56) : lerp(Y(1.0), Y(0.62), (v - 0.56) / 0.44), topAt(x));
        o.set(x, y + 0.006, (front ? 1 : -1) * (surfZ(x, y) + 0.007));
      }), s > 0 ? LEATHER : LEATHER_SH);
    });
    chest.add(tor.mesh(sm, chestO));

    /* --- 머리 --- */
    var headO = [0, headY - hy * 0.9, 0];
    var head = new T.Group();
    head.position.set(0, headO[1] - chestO[1], 0);
    chest.add(head);
    var hb = new Builder();
    var HM = function (x, y, z, rx, ry, rz, sx, sy, sz) { return TR(x, headY + y, z, rx, ry, rz, sx, sy, sz); };
    var ON = function (a, yf, lift, sx, sy, sz) { return onEll(0, headY, 0, hx, hy, hz, a, yf, lift, sx, sy, sz); };
    hb.add(ball(12, 7), SKIN, HM(0, 0, 0, 0, 0, 0, hx, hy, hz), [headY - hy, headY - hy * 0.3, 0.93]);
    [-1, 1].forEach(function (s) {
      hb.add(new T.CircleGeometry(1, 10), EYE, ON(s * 21, -0.15, 0.012, hx * 0.1, hy * (girl ? 0.145 : 0.13), 1));
      hb.add(new T.CircleGeometry(1, 5), '#FFFFFF', ON(s * 21 - 1.6, -0.1, 0.02, hx * 0.03, hy * 0.035, 1));
      hb.add(new T.CircleGeometry(1, 6), mix(SKIN, '#F0907C', 0.6), ON(s * 41, -0.43, 0.012, hx * 0.15, hy * 0.09, 1));
      if (!girl) hb.add(ball(5, 3), SKIN, HM(s * hx * 0.97, -0.13 * hy, -hz * 0.03, 0, 0, 0, hx * 0.11, hy * 0.17, hz * 0.12));
    });
    hb.add(new T.CircleGeometry(1, 6, PI, PI), '#B8574B', ON(0, -0.47, 0.012, hx * (girl ? 0.115 : 0.095), hy * (girl ? 0.09 : 0.06), 1));
    var hairCol = function (x, y) { return mix(d.hair, d.hairHi, smooth(headY + hy * 0.1, headY + hy * 1.15, y) * 0.85); };
    if (girl) {
      hb.add(hairCap(hx, hy, hz, { s: 1.17, sEdge: 1.22, front: 69, side: 150, back: 146, d1: 24, d2: 44, hang: 1, flare: -0.1, nu: 14, nv: 6, pow: 0.92, tuck: 0.8 }), hairCol, HM(0, 0, 0));
      // 머리핀
      hb.add(sbox(hx * 0.2, hy * 0.045, hz * 0.06, 0.6, 4, 2), '#EE7B62', ON(-44, 0.42, 0.2, 1, 1, 1).multiply(TR(0, 0, 0, 0, 0, 0.5)));
      hb.add(sbox(hx * 0.2, hy * 0.045, hz * 0.06, 0.6, 4, 2), '#F7A48E', ON(-47, 0.28, 0.2, 1, 1, 1).multiply(TR(0, 0, 0, 0, 0, 0.5)));
    } else if (key === 'hyu') {
      hb.add(hairCap(hx, hy, hz, { s: 1.18, sEdge: 1.12, front: 62, side: 80, back: 116, d1: 44, d2: 78, hang: 0.25, sweep: 6, zig: 4, nu: 14, nv: 5, tuck: 0.87 }), hairCol, HM(0, 0, 0));
      hb.add(sbox(hx * 0.1, hy * 0.2, hz * 0.1, 1.5, 5, 3), d.hair, HM(hx * 0.12, hy * 1.2, -hz * 0.1, 0.2, 0, -0.55));       // 삐친 머리
      hb.add(sbox(hx * 0.34, hy * 0.17, hz * 0.14, 1.2, 6, 3), d.hair, ON(-14, 0.56, 0.13, 1, 1, 1).multiply(TR(0, 0, 0, 0, 0, 0.3)));        // 앞머리 가닥
      // 동그란 안경
      [-1, 1].forEach(function (s) {
        hb.add(new T.TorusGeometry(hx * 0.235, hx * 0.03, 3, 9), '#2E5F66', ON(s * 22, -0.15, 0.075, 1, 1, 1));
        hb.add(new T.BoxGeometry(hx * 0.04, hy * 0.035, hz * 0.62), '#2E5F66', HM(s * hx * 0.93, -0.13 * hy, hz * 0.48, 0, s * 0.2, 0));
      });
      hb.add(new T.BoxGeometry(hx * 0.2, hy * 0.035, hz * 0.03), '#2E5F66', ON(0, -0.12, 0.085, 1, 1, 1));
    } else {
      hb.add(hairCap(hx, hy, hz, {
        s: 1.2, sEdge: 1.12, front: 57, side: 77, back: 112, d1: 42, d2: 74, hang: 0.2, sweep: -11, zig: 3, nu: 14, nv: 6, tuck: 0.87,
        shape: function (p, ca, sa, w) { if (sa > 0) { p.z += hz * 0.1 * sa * Math.sin(w * PI); p.y += hy * 0.05 * sa * Math.sin(w * PI); } }       // 앞머리를 띄운다
      }), hairCol, HM(0, 0, 0));
      hb.add(sbox(hx * 0.5, hy * 0.19, hz * 0.16, 1.2, 6, 3), d.hair, ON(-10, 0.6, 0.15, 1, 1, 1).multiply(TR(0, 0, 0, 0, 0, 0.42)));        // 옆으로 넘긴 앞머리
      hb.add(sbox(hx * 0.26, hy * 0.14, hz * 0.14, 1.2, 6, 3), d.hair, ON(34, 0.6, 0.13, 1, 1, 1).multiply(TR(0, 0, 0, 0, 0, -0.5)));
    }
    head.add(hb.mesh(sm, headO));

    /* --- 팔 --- */
    function makeArm(s) {
      var sh = new T.Group(), el = new T.Group();
      sh.position.set(s * armX, armY - chestO[1], 0);
      el.position.set(0, -ua, 0);
      var up = new Builder(), lo = new Builder();
      if (d.sleeve) {
        up.add(limb(rArm * 0.92, rArm * 0.88, ua, 6, false, true), SKIN);
        up.add(limb(rArm * 1.3, rArm * 1.26, ua * 0.52, 6, true, false), d.sleeve);
        lo.add(limb(rArm * 0.88, rArm * 0.76, fa, 6), SKIN);
      } else {
        up.add(limb(rArm * 1.18, rArm * 1.04, ua, 6, true, true), d.top);
        lo.add(limb(rArm * 1.04, rArm * 0.94, fa * 0.94, 6), d.top);
        lo.add(limb(rArm * 1.0, rArm * 1.0, fa * 0.13, 6), d.cuff, TR(0, -fa * 0.87, 0));
      }
      lo.add(ball(6, 4), SKIN, TR(0, -fa - handR * 0.5, 0, 0, 0, 0, handR * 0.8, handR, handR * 0.92));
      if (key === 'onwoo' && s < 0) {
        // 책: 표지에는 아무 표시도 없다
        var bm = TR(-0.012, -fa - handR * 1.4 - 0.075, 0.02, 0.1, 0, 0);
        lo.add(new T.BoxGeometry(0.046, 0.16, 0.215), '#8A5230', bm);
        lo.add(new T.BoxGeometry(0.034, 0.146, 0.206), '#F3E9D6', bm.clone().multiply(TR(0, -0.003, 0.008)));
        lo.add(new T.BoxGeometry(0.05, 0.164, 0.03), '#6B3C20', bm.clone().multiply(TR(0, 0, -0.096)));
        lo.add(new T.BoxGeometry(0.006, 0.05, 0.014), '#D9503F', bm.clone().multiply(TR(0.004, -0.1, 0.05)));
      }
      sh.add(up.mesh(sm));
      el.add(lo.mesh(sm));
      sh.add(el);
      chest.add(sh);
      return { sh: sh, el: el };
    }
    var armL = makeArm(1), armR = makeArm(-1);

    /* --- 다리 --- */
    function makeLeg(s) {
      var hip = new T.Group(), knee = new T.Group();
      hip.position.set(s * hipX, hipY, 0);
      knee.position.set(0, -thigh, 0);
      var up = new Builder(), lo = new Builder();
      if (girl) {
        up.add(limb(rLeg * 0.86, rLeg * 0.78, thigh, 7, false, true), SKIN);
        up.add(limb(rLeg * 1.1, rLeg * 1.16, thigh * 0.5, 7), d.pants);                               // 반바지
        up.add(limb(rLeg * 1.18, rLeg * 1.2, thigh * 0.09, 7), d.pantsHi, TR(0, -thigh * 0.47, 0));
        lo.add(limb(rLeg * 0.78, rLeg * 0.7, shin * 0.5, 7), SKIN);
        lo.add(limb(rLeg * 0.76, rLeg * 0.74, shin * 0.16, 7), '#F6EEDD', TR(0, -shin * 0.38, 0));    // 양말
        lo.add(limb(rLeg * 0.96, rLeg * 0.92, shin * 0.5, 7), d.shoe, TR(0, -shin * 0.52, 0));        // 장화 목
        lo.add(limb(rLeg * 1.06, rLeg * 1.04, shin * 0.09, 7), d.shoeHi, TR(0, -shin * 0.5, 0));
      } else {
        up.add(limb(rLeg * 1.0, rLeg * 0.88, thigh, 7, false, true), d.pants);
        lo.add(limb(rLeg * 0.88, rLeg * 0.8, shin * 0.97, 7), d.pants);
        lo.add(limb(rLeg * 0.86, rLeg * 0.85, shin * 0.1, 7), d.pantsHi, TR(0, -shin * 0.87, 0));     // 바짓단
      }
      var ry = ankle * 0.62, shoe = displace(sbox(rLeg * (girl ? 1.0 : 0.98), ry, 0.082 * H, 0.72, 8, 5), function (v) { if (v.y < -ry * 0.8) v.y = -ry * 0.8; });
      lo.add(shoe, function (x, y) { return y < -shin - ankle + ry * 0.36 ? d.sole : d.shoe; }, TR(0, -shin - ankle + ry * 0.8, 0.032 * H));
      hip.add(up.mesh(sm));
      knee.add(lo.mesh(sm));
      hip.add(knee);
      rig.add(hip);
      return { hip: hip, knee: knee };
    }
    var legL = makeLeg(1), legR = makeLeg(-1);

    /* --- 움직임 --- */
    var st = { t: (key === 'hyu' ? 1.3 : key === 'onwoo' ? 2.7 : 0), ph: 0, w: 0, run: 0 };
    var legLen = hipY - ankle;
    function legPose(l, s, c, A, Kn, w, r) {      // 다리 하나를 놓고, 엉덩이에서 발목까지의 높이를 돌려준다
      l.hip.rotation.x = -A * s * w - 0.06 * r * w;
      l.knee.rotation.x = (Kn * Math.max(0, c) * (0.55 + 0.45 * (1 - Math.abs(s))) + 0.12 * Math.max(0, s)) * w;
      return thigh * Math.cos(l.hip.rotation.x) + shin * Math.cos(l.hip.rotation.x + l.knee.rotation.x);
    }
    function update(dt, speed) {
      dt = Math.min(Math.max(dt || 0, 0), 0.1);
      speed = Math.abs(speed || 0);
      st.t += dt;
      var moving = speed > 0.03;
      st.w += ((moving ? 1 : 0) - st.w) * Math.min(1, dt * 9);
      st.run += (clamp((speed - 1.7) / 2.2, 0, 1) - st.run) * Math.min(1, dt * 6);
      // 걸음 박자는 속도에 비례하고, 빨라지면 보폭도 조금 길어진다
      var stride = legLen * (1.75 + 0.75 * Math.max(0, speed - 1.2));
      st.ph += dt * speed / stride * TAU;
      var w = st.w, r = st.run, s = Math.sin(st.ph), c = Math.cos(st.ph);
      var A = lerp(0.2, 0.52, clamp(speed / 1.1, 0, 1)) + 0.26 * r;
      var Kn = lerp(0.85, 1.45, r), br = Math.sin(st.t * 1.9);

      var reach = Math.max(legPose(legL, s, c, A, Kn, w, r), legPose(legR, -s, -c, A, Kn, w, r));
      rig.position.y = reach - legLen + r * w * 0.035 * Math.abs(Math.sin(st.ph));

      var lean = (0.04 + 0.13 * r) * w;
      chest.rotation.set(lean, 0.09 * s * w, 0);
      chest.position.y = chestO[1] + 0.004 * br * (1 - w);
      head.rotation.set(-lean * 0.7 + 0.02 * Math.sin(st.t * 0.8) * (1 - w), -0.06 * s * w + 0.05 * Math.sin(st.t * 0.37) * (1 - w), 0);

      var B = A * 0.95, bend = lerp(0.22, 1.25, r), splay = 0.13 + 0.015 * br * (1 - w);
      armL.sh.rotation.set(B * s * w, 0, splay);
      armL.el.rotation.x = -(0.12 + (bend + 0.25 * Math.max(0, -s)) * w);
      if (key === 'onwoo') {      // 책 든 팔은 덜 흔든다
        armR.sh.rotation.set(-B * 0.4 * s * w + 0.05, 0, -splay);
        armR.el.rotation.x = -(0.3 + 0.1 * w + 0.5 * r * w);
      } else {
        armR.sh.rotation.set(-B * s * w, 0, -splay);
        armR.el.rotation.x = -(0.12 + (bend + 0.25 * Math.max(0, s)) * w);
      }
    }
    update(0, 0);
    return { group: group, update: update };
  }

  /* ================================================================== 모세 */
  var M_SKIN = '#C48A5E', M_SKIN_SH = '#A56E47';
  var DOWN = new T.Vector3(0, -1, 0), XAX = new T.Vector3(1, 0, 0);

  function makeMoses() {
    var sm = mat('smooth'), cl = mat('cloth');
    var hy = 0.146, hx = 0.128, hz = 0.136;
    var headY = 1.585, waistY = 1.0, shY = 1.365, sw = 0.2;
    var ua = 0.29, fa = 0.26;
    var TUNIC = '#EADBB6', STRIPE = '#B58A5C', CLOAK = '#9C5438', CLOAK_SH = '#6A3423', CLOAK_HI = '#B4683F', BEARD = '#F6F1E6';
    var group = new T.Group();

    // 줄무늬를 위한 둘레 나눔: 넓은 칸(짝수 번)과 좁은 칸(홀수 번)이 번갈아 나온다
    var ANG = [], i, a0 = 90 - 15.5;
    for (i = 0; i < 16; i++) { ANG.push(a0 * DEG); a0 += (i % 2 === 0) ? 31 : 14; }
    var tunicCol = function (x, y, z, nx, ny, nz, ti) { return (Math.floor(ti / 2) % 16) % 2 ? STRIPE : TUNIC; };

    /* --- 발(샌들). hideface에서는 옷자락에 가려 보이지 않는다 --- */
    var feet = new T.Group();
    group.add(feet);
    function makeFoot(s) {
      var g = new T.Group(), b = new Builder();
      b.add(sbox(0.052, 0.034, 0.118, 0.75, 8, 3), function (x, y) { return y < 0.024 ? '#5A3A22' : M_SKIN; }, TR(0, 0.036, 0.045));
      b.add(new T.BoxGeometry(0.112, 0.016, 0.03), '#5A3A22', TR(0, 0.062, 0.085, 0.25, 0, 0));
      b.add(new T.CylinderGeometry(0.04, 0.036, 0.2, 6, 1, true), M_SKIN_SH, TR(0, 0.15, -0.02));
      g.add(b.mesh(sm));
      g.rotation.y = s * 0.18;
      feet.add(g);
      return g;
    }
    var footL = makeFoot(1), footR = makeFoot(-1);

    /* --- 통옷 아랫자락(허리 아래) --- */
    var skirtB = new Builder();
    skirtB.add(loft([[0.135, 0.19, 0.165], [0.13, 0.255, 0.22], [0.5, 0.225, 0.195], [0.82, 0.2, 0.165], [1.0, 0.186, 0.15]], 16, ANG), tunicCol, null, [0.1, 0.7, 0.86]);
    var skirt = skirtB.mesh(sm, [0, waistY, 0]);
    skirt.position.set(0, waistY, 0);
    group.add(skirt);

    /* --- 윗몸 --- */
    var upper = new T.Group();
    upper.position.set(0, waistY, 0);
    group.add(upper);
    var ch = new Builder();
    ch.add(loft([[0.98, 0.188, 0.152], [1.24, 0.2, 0.158], [1.37, 0.17, 0.13], [1.43, 0.075, 0.07]], 16, ANG), tunicCol);
    ch.add(new T.CylinderGeometry(0.055, 0.06, 0.1, 8, 1, true), M_SKIN_SH, TR(0, 1.46, 0.005));
    // 허리띠와 늘어진 끝자락
    ch.add(loft([[0.965, 0.185, 0.15], [0.972, 0.2, 0.166], [1.035, 0.2, 0.166], [1.042, 0.186, 0.15]], 10), '#4F5D7A');
    ch.add(new T.BoxGeometry(0.05, 0.2, 0.014), '#4F5D7A', TR(0.075, 0.885, 0.176, -0.07, 0.3, 0.06));
    ch.add(new T.BoxGeometry(0.044, 0.16, 0.014), '#3F4C66', TR(0.115, 0.9, 0.165, -0.07, 0.5, -0.05));
    upper.add(ch.mesh(sm, [0, waistY, 0]));

    /* --- 겉옷: 앞이 열려 있고 어깨에서 종아리까지 내려온다 --- */
    var cloakTop = 1.4, nc = 12, openHalf = 36;
    var cloakRows = [[0.2, 0.3, 0.268], [0.6, 0.272, 0.24], [1.0, 0.246, 0.2], [1.25, 0.246, 0.19], [1.36, 0.232, 0.17], [1.425, 0.14, 0.115]];
    var cloakG = grid(nc, cloakRows.length - 1, false, function (u, v, o, ci, j) {
      var r = cloakRows[j], a = (90 + openHalf + u * (360 - 2 * openHalf)) * DEG;
      var edge = Math.pow(Math.abs(u * 2 - 1), 6);             // 앞섶은 몸 쪽으로 살짝 말린다
      o.set(r[1] * Math.cos(a) * (1 - 0.1 * edge), r[0], r[2] * Math.sin(a) * (1 - 0.06 * edge) - 0.012);
    });
    var cloakCol = function (x, y, z, nx, ny, nz, ti) { var k = Math.floor(ti / 2) % nc % 3; return k === 1 ? CLOAK_SH : (k === 2 ? CLOAK : CLOAK_HI); };
    var cloakB = new Builder();
    cloakB.add(cloakG, cloakCol, null, [0.15, 0.8, 0.86]);
    var cloak = cloakB.mesh(cl, [0, cloakTop, 0]);
    cloak.position.set(0, cloakTop - waistY, 0);
    upper.add(cloak);

    /* --- 머리 --- */
    var headO = [0, 1.455, 0];
    var head = new T.Group();
    head.position.set(0, headO[1] - waistY, 0);
    upper.add(head);
    var hb = new Builder();
    var HM = function (x, y, z, rx, ry, rz, sx, sy, sz) { return TR(x, headY + y, z, rx, ry, rz, sx, sy, sz); };
    var ON = function (a, yf, lift, sx, sy, sz) { return onEll(0, headY, 0, hx, hy, hz, a, yf, lift, sx, sy, sz); };
    hb.add(ball(10, 6), M_SKIN, HM(0, 0, 0, 0, 0, 0, hx, hy, hz));
    hb.add(ball(5, 3), M_SKIN_SH, ON(0, -0.1, 0, hx * 0.15, hy * 0.2, hz * 0.2));                                   // 코
    [-1, 1].forEach(function (s) {
      hb.add(new T.CircleGeometry(1, 8), '#33241C', ON(s * 21, 0.07, 0.012, hx * 0.075, hy * 0.085, 1));
      hb.add(ball(5, 3), BEARD, ON(s * 22, 0.27, 0.01, hx * 0.2, hy * 0.05, hz * 0.07).multiply(TR(0, 0, 0, 0, 0, s * -0.16)));     // 흰 눈썹
      hb.add(ball(5, 3), BEARD, ON(s * 14, -0.37, 0.03, hx * 0.3, hy * 0.11, hz * 0.13).multiply(TR(0, 0, 0, 0, 0, s * 0.4)));      // 콧수염
    });
    // 수염: 턱을 감싸고 가슴까지 내려온다
    hb.add(ball(7, 4), BEARD, HM(0, -hy * 0.66, hz * 0.2, 0.15, 0, 0, hx * 0.99, hy * 0.6, hz * 0.9), [headY - hy * 1.3, headY - hy * 0.5, 0.9]);
    hb.add(ball(7, 4), BEARD, HM(0, -hy * 1.28, hz * 0.52, 0.3, 0, 0, hx * 0.64, hy * 0.74, hz * 0.44), [headY - hy * 2.1, headY - hy * 1.1, 0.86]);
    // 머리쓰개와 머리띠
    hb.add(hairCap(hx, hy, hz, { s: 1.12, sEdge: 1.14, front: 56, side: 168, back: 192, d1: 34, d2: 52, b1: 70, b2: 130, hang: 1, flare: 0.24, backOut: 1.06, nu: 12, nv: 6, pow: 0.85, tuck: 0.9 }),
      '#F3EAD4', HM(0, 0, 0), [headY - hy * 2.4, headY - hy * 0.2, 0.84]);
    hb.add(new T.TorusGeometry(1, 0.085, 3, 10), '#8A4B34', HM(0, hy * 0.5, 0, PI / 2 - 0.1, 0, 0, hx * 1.03, hz * 1.04, hy * 1.0));
    head.add(hb.mesh(sm, headO));

    /* --- 팔: 넓은 겉옷 소매 --- */
    function makeArm(s) {
      var sh = new T.Group(), el = new T.Group(), S = new T.Vector3(s * sw, shY - waistY, 0);
      sh.position.copy(S);
      el.position.set(0, -ua, 0);
      var up = new Builder(), lo = new Builder();
      up.add(limb(0.076, 0.08, ua, 6, true, true), CLOAK);
      lo.add(loft([[-fa * 0.74, 0.036, 0.036], [-fa * 0.8, 0.082, 0.082], [-fa * 0.4, 0.082, 0.082], [0, 0.077, 0.077]], 6),
        function (x, y, z, nx, ny, nz, ti) { return ti < 12 ? CLOAK_SH : CLOAK; });                                        // 소매 끝 안쪽은 어둡게
      lo.add(limb(0.04, 0.034, fa, 6), M_SKIN);
      lo.add(ball(6, 4), M_SKIN, TR(0, -fa - 0.03, 0, 0, 0, 0, 0.041, 0.052, 0.046));
      sh.add(up.mesh(sm));
      el.add(lo.mesh(sm));
      sh.add(el);
      upper.add(sh);
      return { sh: sh, el: el, S: S };
    }
    var armL = makeArm(1), armR = makeArm(-1);

    /* --- 자세 --- */
    var restU = V(0.12, -1, 0.02).normalize(), restF = V(0.06, -1, 0.16).normalize();
    var hideU = V(-0.295, 0.362, 0.885).normalize(), hideF = V(-0.8, 0.42, -0.43).normalize();

    // 얼굴을 가릴 때 든 팔에서 늘어지는 넓은 소매(hideface에서만 보인다). 팔뚝을 감싸고 아래로 처진 자루 모양.
    var drapeE = armL.S.clone().addScaledVector(hideU, ua), drapeW = drapeE.clone().addScaledVector(hideF, fa);
    var dAx = hideF.clone(), dUp = V(0, 1, 0).addScaledVector(dAx, -dAx.y).normalize(), dFw = dAx.clone().cross(dUp);
    var DR = [[-0.16, 0.085, 0.08, 0.1], [0.12, 0.09, 0.085, 0.17], [0.42, 0.092, 0.088, 0.27], [0.74, 0.092, 0.09, 0.35], [0.98, 0.088, 0.088, 0.37], [1.0, 0, 0, 0]];   // [팔뚝 위의 자리, 앞뒤, 위, 처진 깊이]
    var drapeG = grid(8, DR.length - 1, true, function (u, v, o, ci, j) {
      var r = DR[j], a = u * TAU + 0.39, sa = Math.sin(a);
      o.copy(drapeE).lerp(drapeW, r[0]).addScaledVector(dFw, r[1] * Math.cos(a)).addScaledVector(dUp, sa > 0 ? r[2] * sa : r[3] * sa);
    });
    var drapeB = new Builder();
    drapeB.add(drapeG, function (x, y, z, nx, ny, nz, ti) {
      if (ti >= 64) return '#4E2416';
      var k = Math.floor(ti / 2) % 8 % 4;
      return k === 1 ? CLOAK_SH : (k === 3 ? CLOAK_HI : CLOAK);
    });
    var drapeO = [0, drapeE.y + 0.09, 0];
    var drape = drapeB.mesh(sm, drapeO);
    drape.position.fromArray(drapeO);
    drape.visible = false;
    upper.add(drape);

    /* --- 목자의 지팡이: 위가 굽었다 --- */
    var staffPts = [V(0, 0, 0), V(0, 0.5, 0), V(0, 1.0, 0), V(0, 1.5, 0)].concat(
      curvePts([V(0, 1.6, 0), V(0, 1.72, 0.012), V(0, 1.81, 0.06), V(0, 1.835, 0.13), V(0, 1.79, 0.19), V(0, 1.71, 0.2)], 7));
    var staffB = new Builder();
    staffB.add(tubeAlong(staffPts, function (t) { return lerp(0.024, 0.017, t); }, 0, 4, true), '#6B4526');
    var staff = staffB.mesh(sm);
    group.add(staff);
    var GRIP = 1.1;

    /* --- 움직임 --- */
    var pose = { approach: 0, hideface: 1 };
    var st = { k: 0, target: 0, w: 0, ph: 0, t: 0 };
    var dU = new T.Vector3(), dF = new T.Vector3(), qa = new T.Quaternion(), qb = new T.Quaternion(), qx = new T.Quaternion();
    var G = new T.Vector3(), E = new T.Vector3(), nv_ = new T.Vector3(), pole = new T.Vector3();

    function aim(arm, u, f) {
      qa.setFromUnitVectors(DOWN, u);
      arm.sh.quaternion.copy(qa);
      qb.setFromUnitVectors(DOWN, f);
      arm.el.quaternion.copy(qa).invert().multiply(qb);
    }
    function update(dt, moving) {
      dt = Math.min(Math.max(dt || 0, 0), 0.1);
      st.t += dt;
      st.k += clamp(st.target - st.k, -dt / 0.45, dt / 0.45);
      st.w += ((moving ? 1 : 0) - st.w) * Math.min(1, dt * 7);
      st.ph += dt * 4.6 * st.w;
      var k = ease(st.k), w = st.w * (1 - k), s = Math.sin(st.ph), c = Math.cos(st.ph), br = Math.sin(st.t * 1.5);

      // 옷자락: hideface에서는 땅까지 내려와 발을 가린다
      skirt.scale.y = lerp(1, (waistY + 0.012) / (waistY - 0.13), k);
      cloak.scale.y = lerp(1, (cloakTop + 0.008) / (cloakTop - 0.2), k);
      feet.visible = st.k < 0.55;
      skirt.rotation.x = 0.035 * s * w;
      footL.position.set(0.085, Math.max(0, c) * 0.045 * w, 0.14 * s * w);
      footR.position.set(-0.085, Math.max(0, -c) * 0.045 * w, -0.14 * s * w);

      upper.position.y = waistY + 0.012 * Math.abs(c) * w;
      upper.rotation.set(0.08 * k + 0.03 * w + 0.004 * br, 0.05 * s * w, 0);
      head.rotation.set(0.55 * k + 0.02 * w, 0.03 * Math.sin(st.t * 0.5) * (1 - k) * (1 - w), 0);

      // 왼팔: 내린 팔 ↔ 얼굴을 가린 팔
      dU.copy(restU).lerp(hideU, k).normalize();
      dF.copy(restF).lerp(hideF, k).normalize();
      if (w > 0.001) { qx.setFromAxisAngle(XAX, 0.3 * s * w); dU.applyQuaternion(qx); dF.applyQuaternion(qx); }
      aim(armL, dU, dF);
      drape.visible = st.k > 0.55;
      if (drape.visible) drape.scale.set(1, smooth(0.55, 1, st.k), 1);

      // 지팡이: 걸을 때 앞뒤로 짚는다
      staff.position.set(-0.36, Math.max(0, c) * 0.06 * w, 0.3 + 0.17 * s * w);
      staff.rotation.set(-0.05 - 0.16 * s * w, 0, 0.03);
      // 오른손이 지팡이를 잡도록 어깨와 팔꿈치를 푼다(2관절 IK)
      G.set(0, GRIP, 0).applyEuler(staff.rotation).add(staff.position);
      G.sub(upper.position).applyQuaternion(qa.copy(upper.quaternion).invert());
      nv_.subVectors(G, armR.S);
      var dist = Math.min(nv_.length(), ua + fa - 0.004);
      nv_.normalize();
      var al = (ua * ua - fa * fa + dist * dist) / (2 * dist), hh = Math.sqrt(Math.max(0, ua * ua - al * al));
      pole.set(-0.3, -0.75, -0.6);
      pole.addScaledVector(nv_, -pole.dot(nv_)).normalize();
      E.copy(armR.S).addScaledVector(nv_, al).addScaledVector(pole, hh);
      dU.subVectors(E, armR.S).normalize();
      dF.copy(armR.S).addScaledVector(nv_, dist).sub(E).normalize();
      aim(armR, dU, dF);
    }
    // instant가 true면 보간 없이 바로 바꾼다
    function setPose(name, instant) {
      if (!pose.hasOwnProperty(name)) return;
      st.target = pose[name];
      if (instant) { st.k = st.target; update(0, false); }
    }
    update(0, false);
    return { group: group, setPose: setPose, update: update };
  }

  /* ================================================================== 양 */
  function makeSheep(seed) {
    var R = rng((seed | 0) + 11), sm = mat('smooth');
    var sc = 0.86 + R() * 0.22;
    var WOOL = mix('#F7F0DF', '#E9DCC0', R() * 0.6), FACE = '#6B5040', EAR = '#553D2C', LEG = '#4A372C';
    var group = new T.Group(), body = new T.Group();
    group.add(body);
    group.scale.setScalar(sc);

    var b = new Builder(), i;
    var cy = 0.42, cz = -0.06, grad = [0.2, 0.5, 0.8];
    b.add(ball(10, 7), WOOL, TR(0, cy, cz, 0, 0, 0, 0.235, 0.215, 0.36), grad);
    for (i = 0; i < 11; i++) {
      var az = (i / 11) * TAU + R() * 0.5, el = 0.15 + R() * 1.1, r = 0.105 + R() * 0.05;
      b.add(ball(6, 4), WOOL, TR(Math.cos(az) * Math.cos(el) * 0.2, cy + Math.sin(el) * 0.175 - 0.01, cz + Math.sin(az) * Math.cos(el) * 0.31, R(), R(), 0, r, r * 0.86, r * 1.05), grad);
    }
    b.add(ball(6, 4), WOOL, TR(0, cy + 0.03, cz - 0.38, 0.5, 0, 0, 0.06, 0.075, 0.055), grad);        // 꼬리
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(function (q) {
      b.add(new T.CylinderGeometry(0.046, 0.034, 0.26, 6, 1, true), LEG, TR(q[0] * 0.115, 0.165, cz + q[1] * 0.2 + 0.01, q[1] * -0.05, 0, q[0] * -0.04));
      b.add(new T.CylinderGeometry(0.036, 0.04, 0.05, 6, 1), '#2E221B', TR(q[0] * 0.12, 0.025, cz + q[1] * 0.207 + 0.01));
    });
    body.add(b.mesh(sm));

    // 머리(목에서 숙인다)
    var neckO = [0, 0.5, 0.2];
    var neck = new T.Group();
    neck.position.fromArray(neckO);
    body.add(neck);
    var h = new Builder(), HM = function (x, y, z, rx, ry, rz, sx, sy, sz) { return TR(x, neckO[1] + y, neckO[2] + z, rx, ry, rz, sx, sy, sz); };
    h.add(ball(7, 5), WOOL, HM(0, 0.0, 0.03, 0.4, 0, 0, 0.14, 0.15, 0.15), [0.36, 0.56, 0.84]);
    h.add(ball(8, 6), FACE, HM(0, 0.035, 0.2, 0.42, 0, 0, 0.08, 0.088, 0.14));
    h.add(ball(6, 4), '#58402F', HM(0, -0.012, 0.31, 0.42, 0, 0, 0.052, 0.045, 0.045));
    h.add(ball(6, 4), WOOL, HM(0, 0.115, 0.115, 0.2, 0, 0, 0.085, 0.07, 0.085));
    var ears = [];
    [-1, 1].forEach(function (s) {
      h.add(ball(5, 3), '#1E1511', HM(s * 0.066, 0.064, 0.235, 0, 0, 0, 0.017, 0.019, 0.015));
      var eb = new Builder();
      eb.add(ball(6, 4), EAR, TR(s * 0.055, -0.012, 0, 0, 0, 0, 0.062, 0.024, 0.036));
      var ear = eb.mesh(sm);
      ear.position.set(s * 0.066, 0.085, 0.13);
      ear.rotation.z = s * -0.5;
      neck.add(ear);
      ears.push(ear);
    });
    neck.add(h.mesh(sm, neckO));

    var st = { t: R() * 40, off: R(), flick: 0, mv: 0 };
    function update(dt, spd) {
      dt = Math.min(Math.max(dt || 0, 0), 0.1);
      st.t += dt;
      st.mv = lerp(st.mv, clamp(spd || 0, 0, 1), Math.min(1, dt * 6));
      var t = st.t, mv = st.mv, cyc = (t * 0.07 + st.off) % 1;
      var g = smooth(0.0, 0.1, cyc) * (1 - smooth(0.66, 0.76, cyc)) * (1 - mv * 0.85); // 1: 풀을 뜯는 중
      var step = Math.sin(t * 7.5 + st.off * TAU);
      neck.rotation.x = lerp(0.05, 0.98, g) + g * 0.06 * Math.sin(t * 6.5) + (1 - g) * (0.03 * Math.sin(t * 1.1) + mv * 0.06 * step);
      neck.rotation.y = 0.12 * Math.sin(t * 0.43 + st.off * 9) * (1 - 0.6 * g);
      body.position.y = Math.abs(step) * 0.025 * mv;
      body.rotation.x = g * 0.05;
      body.rotation.z = step * 0.032 * mv;
      body.scale.set(1 + 0.012 * Math.sin(t * 1.7), 1, 1);
      var fl = Math.max(0, Math.sin(t * 0.9 + st.off * 20) - 0.93) * 14;
      ears[0].rotation.z = 0.5 + fl * 0.5;
      ears[1].rotation.z = -0.5 - fl * 0.5;
    }
    update(0, 0);
    return { group: group, update: update };
  }

  /* ================================================================== 불붙은 떨기나무 */
  var FLAME_VS = [
    'uniform float uTime;',
    'attribute vec3 aOrigin; attribute vec2 aSize; attribute vec4 aAnim;',
    'varying float vH; varying float vRim; varying float vBig;',
    'void main() {',
    '  float h = position.y;',
    '  vBig = smoothstep(0.26, 0.42, aSize.x);',
    '  float t = uTime * aAnim.y + aAnim.x;',
    '  float pulse = 0.86 + 0.14 * sin(t * 2.3) + 0.08 * sin(t * 3.7 + 1.3);',
    '  vec3 p = position;',
    '  p.xz *= 1.0 + 0.16 * sin(h * 6.5 - t * 4.2);',
    '  float sw = h * h;',
    '  p.x += (sin(t * 1.9 + h * 3.1) * 0.30 + sin(t * 3.3 + h * 5.2) * 0.12) * sw;',
    '  p.z += (cos(t * 1.6 + h * 2.7) * 0.26 + cos(t * 2.9 + h * 4.4) * 0.10) * sw;',
    '  vec3 q = aOrigin + vec3(p.x * aSize.x, p.y * aSize.y * pulse, p.z * aSize.x) + vec3(aAnim.z, 0.0, aAnim.w) * sw * aSize.y;',
    '  vec4 mv = modelViewMatrix * vec4(q, 1.0);',
    '  vec3 n = normalize(normalMatrix * (normal / vec3(aSize.x, aSize.y, aSize.x)));',
    '  vH = h;',
    '  vRim = abs(dot(n, normalize(-mv.xyz)));',
    '  gl_Position = projectionMatrix * mv;',
    '}'
  ].join('\n');
  var FLAME_FS = [
    'uniform vec3 uCore; uniform vec3 uGold; uniform vec3 uOrange; uniform float uGain;',
    'varying float vH; varying float vRim; varying float vBig;',
    'void main() {',
    '  float c = vRim * (1.0 - 0.72 * vH);',
    '  vec3 col = mix(uOrange, uGold, smoothstep(0.30, 0.40, c));',
    '  col = mix(col, uCore, smoothstep(0.62, 0.74, c) * vBig);',
    '  float a = smoothstep(0.03, 0.26, vRim) * (1.0 - smoothstep(0.78, 1.0, vH)) * smoothstep(0.0, mix(0.34, 0.14, vBig), vH);',
    '  gl_FragColor = vec4(col * uGain, a * 0.94);',
    '  #include <encodings_fragment>',
    '}'
  ].join('\n');

  function makeBush() {
    var R = rng(3106), group = new T.Group();
    var wood = new Builder(), leaf = new Builder();
    var BARK = '#7A5234', BARK_SH = '#5C3B26', THORN = '#D8C49A';
    var GREENS = ['#6F8448', '#7E9650', '#5B7040', '#93A85A', '#657A44', '#88A04E'];
    var UP = V(0, 1, 0), stemPts = [], i, j;
    var pick = function () { return GREENS[Math.floor(R() * GREENS.length)]; };

    function thorns(pts, n, len) {
      for (var k = 0; k < n; k++) {
        var p = pts[1 + Math.floor(R() * (pts.length - 1))];
        var dir = V(R() - 0.5, R() * 0.7 - 0.1, R() - 0.5).normalize();
        wood.add(new T.ConeGeometry(0.013, len, 3, 1, true), THORN, new T.Matrix4().compose(p.clone().addScaledVector(dir, len * 0.5), new T.Quaternion().setFromUnitVectors(UP, dir), V(1, 1, 1)));
      }
    }
    // 잎 한 장: 가운데가 살짝 접힌 뾰족한 잎
    function blade(p, dir, len, wid, col) {
      var g = new T.BufferGeometry(), f = wid * 0.5;
      g.setAttribute('position', new T.BufferAttribute(new Float32Array([0, 0, 0, wid, len * 0.45, f, 0, len, 0, 0, 0, 0, 0, len, 0, -wid, len * 0.45, f]), 3));
      leaf.add(g, col, new T.Matrix4().compose(p, new T.Quaternion().setFromUnitVectors(UP, dir), V(1, 1, 1)).multiply(TR(0, 0, 0, 0, R() * TAU, 0)));
    }
    // 잎 뭉치: 작은 속심 둘레로 잎이 사방으로 난다. 불 속에서도 초록 그대로다.
    function clump(p, r) {
      var col = pick(), outward = V(p.x, 0, p.z).normalize();
      leaf.add(new T.OctahedronGeometry(1, 0), mix(col, '#42562F', 0.45), TR(p.x, p.y, p.z, R() * 3, R() * 3, R() * 3, r * 0.62, r * 0.5, r * 0.62));
      for (var k = 0; k < 8; k++) {
        var dir = V(R() * 2 - 1, R() * 2 - 0.7, R() * 2 - 1).normalize().addScaledVector(outward, 0.45).normalize();
        blade(p.clone().addScaledVector(dir, r * 0.15), dir, r * (1.15 + R() * 0.5), r * (0.44 + R() * 0.14), k % 3 === 0 ? mix(col, '#B4C56C', 0.4) : (k % 3 === 1 ? col : pick()));
      }
    }
    // 밑동에서 뻗는 줄기
    for (i = 0; i < 8; i++) {
      var central = i >= 6;
      var a = central ? R() * TAU : (i / 6) * TAU + (R() - 0.5) * 0.5;
      var re = central ? 0.14 + R() * 0.16 : 0.6 + R() * 0.22, he = central ? 1.22 + R() * 0.15 : 0.7 + R() * 0.45;
      var ca = Math.cos(a), sa = Math.sin(a), jx = (R() - 0.5) * 0.16, jz = (R() - 0.5) * 0.16;
      var b0 = central ? 0.05 : 0.11 + R() * 0.07;
      var pts = curvePts([V(ca * b0, -0.02, sa * b0), V(ca * (b0 + re * 0.26) + jx, he * 0.42, sa * re * 0.3 + jz), V(ca * re * 0.72 - jx, he * 0.8, sa * re * 0.72 - jz), V(ca * re, he, sa * re)], 4);
      wood.add(tubeAlong(pts, 0.046, 0.015, 5), function (x, y, z, nx, ny) { return ny < -0.1 ? BARK_SH : BARK; });
      thorns(pts, 3, 0.1);
      clump(pts[4].clone(), 0.15 + R() * 0.04);
      for (j = 1; j < 5; j++) stemPts.push(pts[j]);
    }
    // 둥근 수관을 채우는 잔가지와 잎 뭉치
    for (i = 0; i < 30; i++) {
      var a2 = i * 2.39996 + R() * 0.5, el = 0.12 + (i % 5) * 0.22 + R() * 0.16, rr = 0.84 + R() * 0.12;
      var tip = V(Math.cos(a2) * Math.cos(el) * rr, 0.4 + Math.sin(el) * 1.04, Math.sin(a2) * Math.cos(el) * rr), from = stemPts[0], best = 1e9;
      stemPts.forEach(function (q) { var dd = q.distanceToSquared(tip); if (dd < best) { best = dd; from = q; } });
      var mid = from.clone().lerp(tip, 0.5); mid.y += 0.06 + R() * 0.06;
      var tw = [from.clone(), mid, tip];
      wood.add(tubeAlong(tw, 0.019, 0.006, 3), BARK_SH);
      thorns(tw, 1, 0.09);
      clump(tip, 0.14 + R() * 0.05);
      if (i % 2 === 0) blade(mid.clone(), V(R() - 0.5, 0.8, R() - 0.5).normalize(), 0.17, 0.06, pick());
    }
    group.add(wood.mesh(mat('flat')));
    var leafMat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, flatShading: true, side: T.DoubleSide, emissive: K('#2C3D18'), emissiveIntensity: 0.5 });
    group.add(leaf.mesh(leafMat));

    // 불꽃 혀들. 크기·높이·자리를 고르지 않게 흩어, 어느 쪽에서 봐도 사람·얼굴·눈 같은 짝지은 모양이 생기지 않게 한다.
    var tongues = [];
    function tongue(rad, ang, y, w, h) {
      tongues.push({ x: Math.cos(ang) * rad, y: y, z: Math.sin(ang) * rad, w: w, h: h, ph: R() * TAU, sp: 0.75 + R() * 0.6, lx: (R() - 0.5) * 0.3, lz: (R() - 0.5) * 0.3 });
    }
    for (i = 0; i < 6; i++) tongue(0.1 + R() * 0.36, i * 2.39996 + R() * 0.6, 0.18 + i * 0.07 + R() * 0.1, 0.46 + R() * 0.26, 0.75 + (i % 3) * 0.2 + R() * 0.2);
    for (i = 0; i < 5; i++) tongue(0.2 + R() * 0.42, i * 2.39996 + 1.1 + R() * 0.6, 0.86 + i * 0.09 + R() * 0.1, 0.32 + R() * 0.18, 0.55 + (i % 2) * 0.22 + R() * 0.22);
    for (i = 0; i < 7; i++) tongue(0.5 + R() * 0.28, i * 2.39996 + 0.4 + R() * 0.6, 0.48 + (i * 3 % 7) * 0.11 + R() * 0.08, 0.18 + (i % 3) * 0.06, 0.38 + ((i + 1) % 3) * 0.14);
    var prof = [[0, 0], [0.07, 0.33], [0.24, 0.5], [0.5, 0.4], [0.78, 0.19], [1, 0]].map(function (p) { return [p[0], p[1], p[1]]; });
    var base = loft(prof, 8), bp = base.attributes.position, bn = base.attributes.normal, bi = base.index.array;
    var fp = [], fn = [], fo = [], fs = [], fa = [], fi = [];
    tongues.forEach(function (tg, k) {
      var off = k * bp.count, q;
      for (q = 0; q < bp.count; q++) {
        fp.push(bp.getX(q), bp.getY(q), bp.getZ(q));
        fn.push(bn.getX(q), bn.getY(q), bn.getZ(q));
        fo.push(tg.x, tg.y, tg.z); fs.push(tg.w, tg.h); fa.push(tg.ph, tg.sp, tg.lx, tg.lz);
      }
      for (q = 0; q < bi.length; q += 3) {
        _a.fromBufferAttribute(bp, bi[q]); _b.fromBufferAttribute(bp, bi[q + 1]); _c.fromBufferAttribute(bp, bi[q + 2]);
        if (_b.sub(_a).cross(_c.sub(_a)).lengthSq() < 1e-12) continue;
        fi.push(bi[q] + off, bi[q + 1] + off, bi[q + 2] + off);
      }
    });
    base.dispose();
    var fg = new T.BufferGeometry();
    fg.setAttribute('position', new T.Float32BufferAttribute(fp, 3));
    fg.setAttribute('normal', new T.Float32BufferAttribute(fn, 3));
    fg.setAttribute('aOrigin', new T.Float32BufferAttribute(fo, 3));
    fg.setAttribute('aSize', new T.Float32BufferAttribute(fs, 2));
    fg.setAttribute('aAnim', new T.Float32BufferAttribute(fa, 4));
    fg.setIndex(fi);
    fg.boundingSphere = new T.Sphere(new T.Vector3(0, 1, 0), 2.6);
    var flameMat = new T.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uCore: { value: K('#FFEDA6') }, uGold: { value: K('#F7B733') }, uOrange: { value: K('#EA6A2A') }, uGain: { value: 1 } },
      vertexShader: FLAME_VS, fragmentShader: FLAME_FS, transparent: true, depthWrite: false
    });
    var flames = new T.Mesh(fg, flameMat);
    flames.frustumCulled = false;
    flames.renderOrder = 2;
    group.add(flames);

    // 빛 번짐, 땅에 번지는 빛, 불티
    var halo = glowSprite('#FF9E38', 3.6, 0.24);
    halo.position.set(0, 1.1, 0);
    halo.renderOrder = 1;
    group.add(halo);
    var pool = new T.Mesh(new T.CircleGeometry(2.6, 24), new T.MeshBasicMaterial({ map: glowTex(), color: K('#FF9A30'), transparent: true, opacity: 0.15, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
    pool.rotation.x = -PI / 2;
    pool.position.y = 0.03;
    pool.renderOrder = 1;
    group.add(pool);
    var nSp = 14, spP = new Float32Array(nSp * 3), spD = [];
    for (i = 0; i < nSp; i++) spD.push({ a: R() * TAU, r: 0.15 + R() * 0.75, sp: 0.16 + R() * 0.16, ph: R(), wob: 0.6 + R() * 1.2 });
    var spG = new T.BufferGeometry();
    spG.setAttribute('position', new T.BufferAttribute(spP, 3));
    spG.boundingSphere = new T.Sphere(new T.Vector3(0, 1.5, 0), 3);
    var sparks = new T.Points(spG, new T.PointsMaterial({ map: glowTex(), color: K('#FFD873'), size: 0.13, transparent: true, opacity: 0.95, depthWrite: false, fog: false }));
    sparks.renderOrder = 3;
    group.add(sparks);

    var light = new T.PointLight(K('#FF9A3C'), 0.8, 8, 2);
    light.position.set(0, 1.15, 0);
    group.add(light);

    function update(t) {
      t = t || 0;
      flameMat.uniforms.uTime.value = t;
      var f = 0.5 * Math.sin(t * 7.3) + 0.3 * Math.sin(t * 12.1 + 1.0) + 0.2 * Math.sin(t * 3.1 + 2.0);
      light.intensity = 0.8 + 0.18 * f;
      light.position.x = 0.06 * Math.sin(t * 5.1);
      halo.material.opacity = 0.23 + 0.05 * f;
      halo.scale.setScalar(3.6 + 0.2 * Math.sin(t * 2.1));
      pool.material.opacity = 0.15 + 0.04 * f;
      for (var q = 0; q < nSp; q++) {
        var d = spD[q], u = (t * d.sp + d.ph) % 1;
        spP[q * 3] = Math.cos(d.a) * d.r * (1 - 0.3 * u) + 0.1 * Math.sin(t * d.wob + q);
        spP[q * 3 + 1] = 0.7 + u * 1.9;
        spP[q * 3 + 2] = Math.sin(d.a) * d.r * (1 - 0.3 * u) + 0.1 * Math.cos(t * d.wob * 0.8 + q);
      }
      spG.attributes.position.needsUpdate = true;
    }
    update(0);
    return { group: group, update: update };
  }

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

  /* ================================================================== 말씀 조각 */
  function makeScrap() {
    var group = new T.Group(), inner = new T.Group();
    group.add(inner);
    var R = rng(77), W = 0.62, Hh = 0.34, nu = 16, nv = 3, i;
    // 양 끝이 안으로 말린 종이의 단면
    var steps = 240, x = 0, z = 0, half = [];
    for (i = 0; i <= steps; i++) {
      var s = i / steps, th = 0.35 * s + 5.2 * Math.pow(s, 4);
      half.push([x, z]);
      x += Math.cos(th) * (W / 2) / steps;
      z += Math.sin(th) * (W / 2) / steps;
    }
    var jag = [];
    for (i = 0; i <= nu; i++) jag.push([(R() - 0.5) * 0.022, (R() - 0.5) * 0.022]);
    var g = grid(nu, nv, false, function (u, v, o, ci) {
      var sgn = u < 0.5 ? -1 : 1, q = half[Math.round(Math.abs(u * 2 - 1) * steps)];
      var y = (v - 0.5) * Hh + (v === 0 ? jag[ci][0] : v === 1 ? jag[ci][1] : 0);
      o.set(sgn * q[0], y + 0.02 * sgn * q[0] / W, q[1] - 0.05);
    });
    var pb = new Builder();
    pb.add(g, function (px, py, pz, nx, ny, nz, ti) { var c = Math.floor(ti / 2) % nu; return c < 4 || c >= nu - 4 ? '#D9BC80' : (Math.abs(py) > Hh * 0.3 ? '#E8D29C' : '#F6E8C2'); });
    var paperMat = new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, roughness: 0.9, metalness: 0, emissive: K('#E8A020'), emissiveIntensity: 0.3 });
    var paper = pb.mesh(paperMat);
    paper.rotation.set(-0.12, 0, 0.08);
    inner.add(paper);

    var ringMat = new T.MeshBasicMaterial({ color: K('#FFC233'), transparent: true, opacity: 0.8, depthWrite: false, side: T.DoubleSide, fog: false });
    var ring = new T.Mesh(new T.RingGeometry(0.3, 0.335, 32), ringMat);
    ring.rotation.x = -PI / 2;
    ring.position.y = -0.25;
    inner.add(ring);
    var solid = new T.Mesh(new T.TorusGeometry(0.315, 0.012, 4, 28), new T.MeshStandardMaterial({ color: K('#F7B733'), emissive: K('#F7B733'), emissiveIntensity: 0.8, roughness: 0.5 }));
    solid.rotation.x = -PI / 2;
    solid.position.y = -0.25;
    inner.add(solid);
    var glow = glowSprite('#FFB02E', 1.3, 0.4);
    inner.add(glow);
    // 땅 위의 빛 고리(멀리서도 자리가 보이게)
    var gMat = ringMat.clone();
    var ground = new T.Mesh(new T.RingGeometry(0.4, 0.46, 32), gMat);
    ground.rotation.x = -PI / 2;
    ground.position.y = 0.03;
    group.add(ground);
    var spot = new T.Mesh(new T.CircleGeometry(0.7, 20), new T.MeshBasicMaterial({ map: glowTex(), color: K('#FFB02E'), transparent: true, opacity: 0.4, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
    spot.rotation.x = -PI / 2;
    spot.position.y = 0.025;
    group.add(spot);
    var nS = 6, sP = new Float32Array(nS * 3), sG = new T.BufferGeometry();
    sG.setAttribute('position', new T.BufferAttribute(sP, 3));
    sG.boundingSphere = new T.Sphere(new T.Vector3(0, 1, 0), 1.5);
    var sparks = new T.Points(sG, new T.PointsMaterial({ map: glowTex(), color: K('#FFE9A0'), size: 0.09, transparent: true, opacity: 0.95, depthWrite: false, fog: false }));
    group.add(sparks);

    function update(t) {
      t = t || 0;
      inner.position.y = 1.05 + 0.07 * Math.sin(t * 1.7);
      inner.rotation.y = t * 0.9;
      var p = 0.5 + 0.5 * Math.sin(t * 2.6);
      paperMat.emissiveIntensity = 0.22 + 0.2 * p;
      glow.material.opacity = 0.26 + 0.18 * p;
      ringMat.opacity = 0.5 + 0.3 * p;
      var e = (t * 0.5) % 1;
      ground.scale.setScalar(0.7 + 1.1 * e);
      gMat.opacity = 0.85 * (1 - e);
      spot.material.opacity = 0.28 + 0.12 * p;
      for (var q = 0; q < nS; q++) {
        var u = (t * 0.28 + q / nS) % 1, a = q * 2.4 + t * 0.6;
        sP[q * 3] = Math.cos(a) * (0.34 - 0.1 * u);
        sP[q * 3 + 1] = 0.55 + u * 0.95;
        sP[q * 3 + 2] = Math.sin(a) * (0.34 - 0.1 * u);
      }
      sG.attributes.position.needsUpdate = true;
    }
    update(0);
    return { group: group, update: update };
  }

  /* ================================================================== 광야 소품 */
  var ROCK_TONES = [['#D6A06C', '#B98258', '#8C5E46', '#6C4638'], ['#E2B27C', '#C99262', '#96684A', '#774E3C'], ['#C48E60', '#A8744E', '#7E5440', '#5F3D32']];
  function rockPiece(b, R, x, z, size, tone) {
    var g = displace(new T.IcosahedronGeometry(1, 1), lumpy(R, 0.2));
    var sx = size * (0.5 + R() * 0.16), sy = size * (0.34 + R() * 0.22), sz = size * (0.42 + R() * 0.16), cut = -0.42;
    displace(g, function (v) {
      v.x = Math.round(v.x * 3.2) / 3.2 * 0.5 + v.x * 0.5;       // 면을 조금 각지게
      if (v.y < cut) v.y = cut;
      v.y -= cut;
    });
    b.add(g, function (px, py, pz, nx, ny, nz) {
      var lit = ny * 0.75 + nx * 0.25 + nz * 0.12;
      return lit > 0.62 ? tone[0] : lit > 0.15 ? tone[1] : lit > -0.25 ? tone[2] : tone[3];
    }, TR(x, 0, z, 0, R() * TAU, 0, sx, sy, sz));
  }
  function makeRock(seed) {
    var R = rng((seed | 0) + 101), b = new Builder(), group = new T.Group();
    var size = 0.38 + Math.pow(R(), 1.4) * 1.2, tone = ROCK_TONES[Math.floor(R() * ROCK_TONES.length)];
    rockPiece(b, R, 0, 0, size, tone);
    var n = R() < 0.3 ? 0 : (R() < 0.6 ? 1 : 2);
    for (var i = 0; i < n; i++) {
      var a = R() * TAU, d = size * (0.42 + R() * 0.16);
      rockPiece(b, R, Math.cos(a) * d, Math.sin(a) * d, size * (0.3 + R() * 0.25), tone);
    }
    group.add(b.mesh(mat('flat')));
    return group;
  }
  function makeShrub(seed) {
    var R = rng((seed | 0) + 211), wood = new Builder(), leaf = new Builder(), group = new T.Group();
    var size = 0.45 + R() * 0.5, n = 7 + Math.floor(R() * 4), i, j, UP = V(0, 1, 0);
    var LEAVES = ['#8F8F52', '#A79C5E', '#7A8246', '#B3A25C', '#6F7A3E'];
    function sprig(pts, count) {       // 가지 위쪽에 마른 잎을 단다
      for (var k = 0; k < count; k++) {
        var t = 0.35 + 0.65 * (k + R() * 0.6) / count, p = pts[1].clone().lerp(pts[2], t);
        var dir = pts[2].clone().sub(pts[1]).normalize().add(V(R() - 0.5, R() * 0.5, R() - 0.5).multiplyScalar(1.5)).normalize();
        var len = size * (0.13 + R() * 0.09), wid = len * 0.34, g = new T.BufferGeometry();
        g.setAttribute('position', new T.BufferAttribute(new Float32Array([0, 0, 0, wid, len * 0.45, wid * 0.5, 0, len, 0, 0, 0, 0, 0, len, 0, -wid, len * 0.45, wid * 0.5]), 3));
        leaf.add(g, LEAVES[Math.floor(R() * LEAVES.length)], new T.Matrix4().compose(p, new T.Quaternion().setFromUnitVectors(UP, dir), V(1, 1, 1)).multiply(TR(0, 0, 0, 0, R() * TAU, 0)));
      }
    }
    for (i = 0; i < n; i++) {
      var a = (i / n) * TAU + R() * 0.6, lean = 0.3 + R() * 0.8, len = size * (0.7 + R() * 0.5);
      var dx = Math.cos(a) * Math.sin(lean), dz = Math.sin(a) * Math.sin(lean), dy = Math.cos(lean);
      var pts = [V(dx * 0.03, -0.01, dz * 0.03), V(dx * len * 0.42 + (R() - 0.5) * 0.08, dy * len * 0.55, dz * len * 0.42 + (R() - 0.5) * 0.08), V(dx * len, dy * len, dz * len)];
      wood.add(tubeAlong(pts, 0.014 * (0.7 + size), 0.004, 4), i % 2 ? '#7A5A3C' : '#8A6A48');
      sprig(pts, 5);
      // 곁가지
      var side = V(-dz + (R() - 0.5), 0.5 + R() * 0.5, dx + (R() - 0.5)).normalize(), sl = len * (0.35 + R() * 0.2);
      var sp = [pts[1].clone(), pts[1].clone().addScaledVector(side, sl * 0.5).add(V(dx, 0, dz).multiplyScalar(sl * 0.2)), pts[1].clone().addScaledVector(side, sl).add(V(dx, 0, dz).multiplyScalar(sl * 0.5))];
      wood.add(tubeAlong(sp, 0.008 * (0.7 + size), 0.003, 3), '#8A6A48');
      sprig(sp, 3);
    }
    group.add(wood.mesh(mat('flat')));
    group.add(leaf.mesh(mat('leaf')));
    return group;
  }
  function makeAcacia(seed) {
    var R = rng((seed | 0) + 307), wood = new Builder(), leaf = new Builder(), group = new T.Group();
    var h = 3 + R() * 2, lean = (R() - 0.5) * 0.5, la = R() * TAU, i;
    var BARK = '#7A5638', BARK_SH = '#5E4029';
    var forkY = h * (0.42 + R() * 0.1), fork = V(Math.cos(la) * lean * h * 0.25, forkY, Math.sin(la) * lean * h * 0.25);
    var trunk = curvePts([V(0, 0, 0), V(fork.x * 0.25 + (R() - 0.5) * 0.15, forkY * 0.5, fork.z * 0.25 + (R() - 0.5) * 0.15), fork], 4);
    var barkCol = function (px, py, pz, nx, ny, nz) { return nx * 0.7 + nz * 0.3 > 0.1 ? BARK : BARK_SH; };
    wood.add(tubeAlong(trunk, function (t) { return lerp(0.2, 0.11, Math.pow(t, 0.6)) * (h / 4); }, 0, 6), barkCol);
    wood.add(new T.CylinderGeometry(0.2 * h / 4, 0.3 * h / 4, 0.14, 6, 1, true), barkCol, TR(0, 0.07, 0));
    var nb = 3 + Math.floor(R() * 2), spread = h * (0.34 + R() * 0.1), top = h * 0.86;
    var pad = function (p, r) {
      var g = displace(new T.IcosahedronGeometry(1, 1), lumpy(R, 0.16));
      leaf.add(g, function (px, py, pz, nx, ny) { return ny > 0.45 ? '#93A85A' : ny > -0.2 ? '#6F8448' : '#4E6238'; }, TR(p.x, p.y, p.z, 0, R() * TAU, 0, r, r * (0.2 + R() * 0.07), r * (0.82 + R() * 0.3)));
    };
    for (i = 0; i < nb; i++) {
      var a = (i / nb) * TAU + R() * 0.7, rr = spread * (0.6 + R() * 0.4), ty = top - 0.12 * h * R();
      var end = V(fork.x + Math.cos(a) * rr, ty, fork.z + Math.sin(a) * rr);
      var mid = fork.clone().lerp(end, 0.55); mid.y -= (ty - forkY) * 0.12;
      wood.add(tubeAlong(curvePts([fork, mid, end], 4), 0.1 * h / 4, 0.035 * h / 4, 5), barkCol);
      pad(V(end.x, end.y + 0.05 * h, end.z), h * (0.24 + R() * 0.08));
    }
    wood.add(ball(6, 4), BARK, TR(fork.x, fork.y, fork.z, 0, 0, 0, 0.125 * h / 4));
    pad(V(fork.x, top + 0.07 * h, fork.z), h * (0.3 + R() * 0.06));
    group.add(wood.mesh(mat('flat')));
    group.add(leaf.mesh(mat('flat')));
    return group;
  }

  /* ================================================================== 내보내기 */
  BO3D.models = {
    config: config,
    kid: makeKid,
    moses: makeMoses,
    sheep: makeSheep,
    bush: makeBush,
    timeMachine: makeTimeMachine,
    scrap: makeScrap,
    rock: makeRock,
    shrub: makeShrub,
    acacia: makeAcacia
  };
})();
