/* bible_onyou 3D 모델 — 불붙은 떨기나무, 말씀 조각, 광야 소품. web3d/js/models.js 다음에 읽는다. */
(function () {
  'use strict';
  var kit = window.BO3D._modelKit;
  var T = kit.T, PI = kit.PI, TAU = kit.TAU, DEG = kit.DEG, config = kit.config, rng = kit.rng, lerp = kit.lerp, clamp = kit.clamp, smooth = kit.smooth, ease = kit.ease, spow = kit.spow, K = kit.K, mix = kit.mix, mat = kit.mat, glowTex = kit.glowTex, glowSprite = kit.glowSprite, TR = kit.TR, Builder = kit.Builder, _e = kit._e, _q = kit._q, _p = kit._p, _s = kit._s, _m3 = kit._m3, _a = kit._a, _b = kit._b, _c = kit._c, _n = kit._n, grid = kit.grid, fixPole = kit.fixPole, loft = kit.loft, limb = kit.limb, ball = kit.ball, sbox = kit.sbox, tubeAlong = kit.tubeAlong, curvePts = kit.curvePts, V = kit.V, displace = kit.displace, lumpy = kit.lumpy, hairCap = kit.hairCap, onEll = kit.onEll, SKIN = kit.SKIN, SKIN_SH = kit.SKIN_SH, EYE = kit.EYE, LEATHER = kit.LEATHER, LEATHER_SH = kit.LEATHER_SH, BRASS = kit.BRASS, BRASS_HI = kit.BRASS_HI, BRASS_SH = kit.BRASS_SH, BRASS_DP = kit.BRASS_DP;

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

  window.BO3D.models.bush = makeBush;
  window.BO3D.models.scrap = makeScrap;
  window.BO3D.models.rock = makeRock;
  window.BO3D.models.shrub = makeShrub;
  window.BO3D.models.acacia = makeAcacia;
})();
