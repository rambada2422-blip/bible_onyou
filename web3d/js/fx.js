/* 3D 샘플의 시각 효과: 떨기나무 불꽃, 빛 번짐(블룸). 소리는 fx-audio.js에 있다.
 * 그림 파일 없이 전부 코드로 만든다.
 * 신학 규칙: 불과 빛만 그린다. 불꽃은 무작위 노이즈로 만들어 얼굴·사람 모양을 그리지 않는다.
 *           타서 없어지지 않는 나무이므로 연기와 재는 만들지 않는다.
 */
window.BO3D = window.BO3D || {};
(function () {
  'use strict';
  var T = THREE;
  var GLOW = 1, SOFT = 2; /* layer 1: 빛을 내는 것, layer 2: 빛은 안 내는 반투명 */

  var NOISE = [
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }',
    'float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }'
  ].join('\n');

  /* ── 불꽃 ── */
  function fire() {
    var group = new T.Group(), planes = [], i;
    var VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
    var FS = [
      'precision highp float;',
      'uniform float uTime; uniform float uSeed; uniform float uGain; uniform float uAlpha;',
      'varying vec2 vUv;', NOISE,
      'void main(){',
      '  float t = uTime, y = vUv.y, x = (vUv.x - 0.5) * 2.0, x0 = x;',
      '  x += (fbm(vec2(y * 2.0 + uSeed, t * 0.8)) - 0.5) * 0.7 * y;',
      '  float n = fbm(vec2(x * 1.9 + uSeed * 3.1, y * 2.3 - t * 2.1));',
      '  float n2 = fbm(vec2(x * 4.2 - uSeed, y * 4.6 - t * 3.6));',
      '  float width = mix(0.8, 0.1, pow(y, 0.75));',
      '  float body = 1.0 - smoothstep(width * 0.5, width, abs(x));',
      '  float f = body * (1.0 - y * 0.92) + (n * 0.95 + n2 * 0.45 - 0.66) * (0.5 + y);',
      '  float a = smoothstep(0.06, 0.4, f) * smoothstep(0.0, 0.07, y);',
      '  a *= smoothstep(1.0, 0.7, abs(x0)) * smoothstep(1.0, 0.86, y);',
      '  float heat = clamp(f * 1.55, 0.0, 1.0);',
      '  vec3 col = mix(vec3(0.82, 0.18, 0.04), vec3(0.96, 0.5, 0.1), smoothstep(0.08, 0.4, heat));',
      '  col = mix(col, vec3(1.0, 0.76, 0.22), smoothstep(0.4, 0.78, heat));',
      '  col = mix(col, vec3(1.0, 0.92, 0.6), smoothstep(0.86, 1.0, heat));',
      '  gl_FragColor = vec4(col * a * uGain * uAlpha, a * 0.74 * uAlpha);',
      '}'
    ].join('\n');
    /* [x, z, 바닥 높이, 너비, 높이] */
    var spec = [[0, 0, 0.45, 1.7, 3.3], [0.32, 0.1, 0.6, 1.3, 2.6], [-0.36, 0.18, 0.55, 1.25, 2.8], [0.1, -0.4, 0.7, 1.1, 2.3],
      [-0.12, 0.42, 0.5, 1.0, 2.0], [0.55, -0.28, 0.75, 0.85, 1.8], [-0.58, -0.18, 0.7, 0.9, 1.7], [0.0, 0.0, 1.15, 1.0, 3.0]];
    /* 나무를 감싸는 낮은 불길. 반쯤 비쳐서 그 뒤의 초록 잎이 그대로 보인다 */
    for (i = 0; i < 7; i++) { var ra = i * 0.8976 + 0.3; spec.push([Math.cos(ra) * 0.82, Math.sin(ra) * 0.82, 0.12 + (i % 3) * 0.12, 0.75 + (i % 2) * 0.2, 1.25 + (i % 4) * 0.22, 0.5]); }
    spec.forEach(function (s, k) {
      var g = new T.PlaneGeometry(1, 1, 1, 1); g.translate(0, 0.5, 0);
      var m = new T.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uSeed: { value: 1.7 + k * 2.31 }, uGain: { value: 0.92 }, uAlpha: { value: s[5] || 1 } },
        vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, side: T.DoubleSide,
        blending: T.CustomBlending, blendSrc: T.OneFactor, blendDst: T.OneMinusSrcAlphaFactor, premultipliedAlpha: true, fog: false
      });
      var p = new T.Mesh(g, m);
      p.position.set(s[0], s[2], s[1]); p.scale.set(s[3], s[4], 1);
      p.renderOrder = 4 + k; p.frustumCulled = false; p.layers.set(GLOW);
      p.userData.sp = 0.85 + (k % 3) * 0.14;
      group.add(p); planes.push(p);
    });

    /* 불티: 위로 돌며 올라가다 사라진다 */
    var N = 150, seed = new Float32Array(N * 4), pos = new Float32Array(N * 3);
    for (i = 0; i < N; i++) { seed[i * 4] = Math.random() * 6.283; seed[i * 4 + 1] = 0.1 + Math.random() * 0.85; seed[i * 4 + 2] = 0.07 + Math.random() * 0.12; seed[i * 4 + 3] = Math.random(); }
    var eg = new T.BufferGeometry();
    eg.setAttribute('position', new T.BufferAttribute(pos, 3));
    eg.setAttribute('aSeed', new T.BufferAttribute(seed, 4));
    eg.boundingSphere = new T.Sphere(new T.Vector3(0, 3, 0), 8);
    var em = new T.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uScale: { value: 300 } },
      vertexShader: [
        'attribute vec4 aSeed; uniform float uTime; uniform float uScale; varying float vA;',
        'void main(){',
        '  float u = fract(uTime * aSeed.z + aSeed.w);',
        '  float ang = aSeed.x + u * 2.6 + sin(uTime * 0.9 + aSeed.w * 20.0) * 0.5;',
        '  float r = aSeed.y * (0.7 + u * 1.5);',
        '  vec3 p = vec3(cos(ang) * r, 0.7 + u * 6.2, sin(ang) * r);',
        '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
        '  vA = sin(u * 3.14159) * (0.6 + 0.4 * sin(uTime * 9.0 + aSeed.w * 40.0));',
        '  gl_PointSize = uScale * (0.035 + 0.05 * aSeed.y) * (1.0 - u * 0.6) / -mv.z;',
        '  gl_Position = projectionMatrix * mv;',
        '}'].join('\n'),
      fragmentShader: [
        'precision highp float; varying float vA;',
        'void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.05, d) * vA;',
        '  gl_FragColor = vec4(mix(vec3(1.0, 0.5, 0.12), vec3(1.0, 0.93, 0.6), smoothstep(0.25, 0.0, d)) * a, a); }'].join('\n'),
      transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false
    });
    var embers = new T.Points(eg, em);
    embers.frustumCulled = false; embers.renderOrder = 20; embers.layers.set(GLOW);
    group.add(embers);

    /* 주변을 물들이는 불빛 */
    var light = new T.PointLight('#FF8A32', 0.95, 15, 1.8);
    light.position.set(0, 1.6, 0);
    group.add(light);

    var world = new T.Vector3();
    function update(t, camera, pxScale) {
      group.getWorldPosition(world);
      var yaw = Math.atan2(camera.position.x - world.x, camera.position.z - world.z);
      planes.forEach(function (p) { p.rotation.y = yaw - group.rotation.y; p.material.uniforms.uTime.value = t * p.userData.sp; });
      em.uniforms.uTime.value = t; em.uniforms.uScale.value = pxScale || 300;
      var f = 0.5 * Math.sin(t * 7.3) + 0.3 * Math.sin(t * 12.1 + 1.0) + 0.2 * Math.sin(t * 3.1 + 2.0);
      light.intensity = 0.95 + 0.25 * f;
      light.position.x = 0.12 * Math.sin(t * 5.1);
    }
    return { group: group, update: update };
  }

  /* 모델에 들어 있던 단순한 불꽃과 불티는 숨기고, 빛 번짐과 땅의 빛은 빛나는 층으로 옮긴다 */
  function upgradeBush(bushGroup) {
    bushGroup.children.slice().forEach(function (c) {
      if (c.isPoints || (c.isMesh && c.material && c.material.isShaderMaterial)) c.visible = false;
      else if (c.isLight) c.visible = false;
      else if (c.isSprite) c.visible = false;
      else if (c.material && c.material.transparent) c.layers.set(GLOW);
    });
    var f = fire();
    bushGroup.add(f.group);
    return f;
  }

  /* 빛나지 않는 반투명 물체는 깊이용 그리기에서 빼기 위해 layer 2로 */
  function sortLayers(root) {
    root.traverse(function (o) {
      if (o.layers.mask !== 1) return; /* 이미 지정된 것은 그대로 */
      if (o.isSprite || o.isPoints || (o.material && o.material.transparent)) o.layers.set(SOFT);
    });
  }

  /* ── 빛 번짐(블룸) ── */
  function Post(renderer) {
    var ok = true, w = 2, h = 2, self = this;
    var quadScene = new T.Scene(), quadCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    var quad = new T.Mesh(new T.PlaneGeometry(2, 2), null); quad.frustumCulled = false; quadScene.add(quad);
    var QVS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
    var rtScene, rtGlow, rtA, rtB;
    var black = new T.MeshBasicMaterial({ color: 0x000000, fog: false });
    var blurMat = new T.ShaderMaterial({
      uniforms: { tex: { value: null }, dir: { value: new T.Vector2() } }, vertexShader: QVS, depthTest: false, depthWrite: false,
      fragmentShader: ['precision highp float; uniform sampler2D tex; uniform vec2 dir; varying vec2 vUv;',
        'void main(){ vec4 c = texture2D(tex, vUv) * 0.227;',
        '  c += (texture2D(tex, vUv + dir * 1.385) + texture2D(tex, vUv - dir * 1.385)) * 0.316;',
        '  c += (texture2D(tex, vUv + dir * 3.231) + texture2D(tex, vUv - dir * 3.231)) * 0.070;',
        '  gl_FragColor = c; }'].join('\n')
    });
    var mixMat = new T.ShaderMaterial({
      uniforms: { tScene: { value: null }, tGlow: { value: null }, uStrength: { value: 0.6 } }, vertexShader: QVS, depthTest: false, depthWrite: false,
      fragmentShader: ['precision highp float; uniform sampler2D tScene; uniform sampler2D tGlow; uniform float uStrength; varying vec2 vUv;',
        'void main(){ vec3 c = texture2D(tScene, vUv).rgb; vec3 g = texture2D(tGlow, vUv).rgb;',
        '  c = 1.0 - (1.0 - c) * (1.0 - clamp(g * uStrength, 0.0, 1.0));',
        '  vec2 q = vUv - 0.5; c *= 1.0 - dot(q, q) * 0.38;',
        '  gl_FragColor = vec4(c, 1.0); }'].join('\n')
    });
    function make(ww, hh, depth, msaa) {
      var opt = { minFilter: T.LinearFilter, magFilter: T.LinearFilter, format: T.RGBAFormat, depthBuffer: depth, stencilBuffer: false };
      if (msaa && renderer.capabilities.isWebGL2 && T.WebGLMultisampleRenderTarget) return new T.WebGLMultisampleRenderTarget(ww, hh, opt);
      return new T.WebGLRenderTarget(ww, hh, opt);
    }
    this.strength = 0.6;
    this.setSize = function () {
      var v = new T.Vector2(); renderer.getDrawingBufferSize(v);
      if (v.x === w && v.y === h && rtScene) return;
      w = Math.max(2, v.x); h = Math.max(2, v.y);
      [rtScene, rtGlow, rtA, rtB].forEach(function (r) { if (r) r.dispose(); });
      try {
        var gw = Math.max(2, Math.round(w / 3)), gh = Math.max(2, Math.round(h / 3));
        rtScene = make(w, h, true, true); rtGlow = make(gw, gh, true, false); rtA = make(gw, gh, false, false); rtB = make(gw, gh, false, false);
      } catch (e) { ok = false; }
    };
    this.render = function (scene, camera) {
      if (!ok) { renderer.setRenderTarget(null); renderer.render(scene, camera); return; }
      self.setSize();
      var bg = scene.background, fog = scene.fog, mask = camera.layers.mask;
      /* 1. 평소 장면 */
      renderer.setRenderTarget(rtScene); renderer.setClearColor(0x000000, 1); renderer.clear();
      renderer.render(scene, camera);
      /* 2. 빛나는 것만: 먼저 다른 물체를 검게 그려 가림을 만들고, 그 위에 빛나는 층을 그린다 */
      scene.background = null; scene.fog = null;
      renderer.setRenderTarget(rtGlow); renderer.clear();
      scene.overrideMaterial = black; camera.layers.set(0); renderer.render(scene, camera);
      scene.overrideMaterial = null; camera.layers.set(GLOW);
      var ac = renderer.autoClear; renderer.autoClear = false; renderer.render(scene, camera); renderer.autoClear = ac;
      camera.layers.mask = mask; scene.background = bg; scene.fog = fog;
      /* 3. 번지게 하기 (두 번) */
      quad.material = blurMat;
      var src = rtGlow, n;
      for (n = 0; n < 2; n++) {
        blurMat.uniforms.tex.value = src.texture; blurMat.uniforms.dir.value.set((1 + n) / rtA.width, 0);
        renderer.setRenderTarget(rtA); renderer.render(quadScene, quadCam);
        blurMat.uniforms.tex.value = rtA.texture; blurMat.uniforms.dir.value.set(0, (1 + n) / rtA.height);
        renderer.setRenderTarget(rtB); renderer.render(quadScene, quadCam);
        src = rtB;
      }
      /* 4. 합치기 */
      quad.material = mixMat; mixMat.uniforms.tScene.value = rtScene.texture; mixMat.uniforms.tGlow.value = rtB.texture; mixMat.uniforms.uStrength.value = self.strength;
      renderer.setRenderTarget(null); renderer.render(quadScene, quadCam);
    };
  }

  BO3D.fx = BO3D.fx || {};
  BO3D.fx.fire = fire;
  BO3D.fx.upgradeBush = upgradeBush;
  BO3D.fx.sortLayers = sortLayers;
  BO3D.fx.Post = Post;
  BO3D.fx.GLOW = GLOW;
  BO3D.fx.SOFT = SOFT;
})();
