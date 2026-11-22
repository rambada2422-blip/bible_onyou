/* bible_onyou 3D 모델 2 (궤·물): 덮개로 덮인 언약궤와 채, 물의 벽, 흐르는 강물 면 */
(function () {
  'use strict';
  var T = window.THREE;
  var BO3D = window.BO3D = window.BO3D || {};
  var K2 = BO3D._jordanKit;
  var PI = K2.PI, TAU = K2.TAU;
  var clamp = K2.clamp, K = K2.K, mat = K2.mat, TR = K2.TR;
  var Builder = K2.Builder, grid = K2.grid;
  var BRASS = K2.BRASS, BRASS_HI = K2.BRASS_HI, BRASS_SH = K2.BRASS_SH;

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

  BO3D.models2 = BO3D.models2 || {};
  BO3D.models2.arkCovered = makeArk;
  BO3D.models2.waterWall = makeWaterWall;
  BO3D.models2.waterSurface = makeWaterSurface;
})();
