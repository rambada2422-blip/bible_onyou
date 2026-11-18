/* 장면 구성, 모델 배치, 공통 도구. game.js가 공유 상태 G를 전달하고 초기화 순서를 정한다. */
BO3D.gameModules = BO3D.gameModules || {};
BO3D.gameModules.scene = function (G) {
  'use strict';
  var IC, W, AV, sr, si, sh, sx, sz;

  function H(x, z) { return G.cur === 'jordan' && G.JL ? G.JL.height(x, z) : W['height'](x, z); }
  function WALK(x, z) { return G.cur === 'jordan' && G.JL ? G.JL.walkable(x, z) : W['walkable'](x, z); }

  /* ── 작은 도구 ── */
  function el(tag, props) {
    var n = document.createElement(tag), i, k;
    props = props || {};
    for (k in props) {
      if (k === 'class') n.className = props[k];
      else if (k === 'text') n.textContent = props[k];
      else if (k === 'html') n.innerHTML = props[k];
      else if (k === 'on') { for (var ev in props.on) n.addEventListener(ev, props.on[ev]); }
      else if (props[k] !== null && props[k] !== undefined && props[k] !== false) n.setAttribute(k, props[k]);
    }
    for (i = 2; i < arguments.length; i++) add(n, arguments[i]);
    return n;
  }
  function add(n, kid) {
    if (kid === null || kid === undefined || kid === false) return;
    if (Array.isArray(kid)) kid.forEach(function (x) { add(n, x); });
    else n.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
  }
  function tx(v) { return typeof v === 'string' ? v : (v[G.S.tier] || v.t2); }
  function icon(name) { return el('span', { html: IC[name] || '' }).firstChild; }
  function refChip(ref, dark) { return el('span', { class: 'ref' + (dark ? ' dark' : '') }, icon('bookline'), ref); }
  function avatar(key) {
    if (!AV[key]) return el('span', { class: 'avatar' });
    return el('img', { class: 'avatar', alt: '', src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(AV[key]) });
  }
  function bookName(ref) {
    return ref.replace(/^출 /, '출애굽기 ').replace(/^창 /, '창세기 ').replace(/^수 /, '여호수아 ').replace(/(\d+):/, '$1장 ').replace(/$/, '절');
  }
  function dist2(ax, az, bx, bz) { var dx = ax - bx, dz = az - bz; return Math.sqrt(dx * dx + dz * dz); }
  function lerpAngle(a, b, t) { var d = Math.atan2(Math.sin(b - a), Math.cos(b - a)); return a + d * t; }

  /* ── 모델 (없으면 단순한 대체 모형) ── */
  function fallback(color, h, r) {
    var g = new G.T.Group();
    var body = new G.T.Mesh(new G.T.CylinderGeometry(r * 0.8, r, h * 0.7, 10), new G.T.MeshStandardMaterial({ color: color, flatShading: true }));
    body.position.y = h * 0.35; body.castShadow = true;
    var head = new G.T.Mesh(new G.T.SphereGeometry(r * 0.9, 10, 8), new G.T.MeshStandardMaterial({ color: '#E8B48A', flatShading: true }));
    head.position.y = h * 0.85; head.castShadow = true;
    g.add(body); g.add(head);
    return g;
  }
  function mk(name, arg, fb) { try { if (G.M[name]) return G.M[name](arg); } catch (e) { console.error('model ' + name, e); } return fb(); }
  function mkKid(key) { return mk('kid', key, function () { return { group: fallback(G.C.chars[key].color, { choeon: 1.35, hyu: 1.55, onwoo: 1.72 }[key], 0.24), update: function () {} }; }); }

  function place(obj, x, z, lift) { obj.position.set(x, H(x, z) + (lift || 0), z); return obj; }
  function spawnKids() {
    var sc = G.cur === 'jordan' ? G.JL.scene : G.scene, st = G.cur === 'jordan' ? G.JL.P.start : G.P.start;
    ['choeon', 'hyu', 'onwoo'].forEach(function (k) {
      if (G.kids[k]) { G.scene.remove(G.kids[k].group); if (G.JL) G.JL.scene.remove(G.kids[k].group); }
      G.kids[k] = mkKid(k); sc.add(G.kids[k].group);
    });
    G.player = G.kids[G.S.ch];
    G.followers = ['choeon', 'hyu', 'onwoo'].filter(function (k) { return k !== G.S.ch; }).map(function (k) { return G.kids[k]; });
    place(G.player.group, st[0], st[1]);
    G.player.group.rotation.y = Math.PI;
    G.followers.forEach(function (f, i) { place(f.group, st[0] + (i ? 1.5 : -1.5), st[1] + 0.5); f.group.rotation.y = Math.PI; f.spd = 0; });
    G.trail = [];
    if (G.FX) G.FX.sortLayers(sc);
  }

  G.H = H;
  G.WALK = WALK;
  G.el = el;
  G.add = add;
  G.tx = tx;
  G.icon = icon;
  G.refChip = refChip;
  G.avatar = avatar;
  G.bookName = bookName;
  G.dist2 = dist2;
  G.lerpAngle = lerpAngle;
  G.place = place;
  G.spawnKids = spawnKids;
  return function initScene() {
    G.T = THREE, G.C = BO.content, IC = BO.icons, W = BO3D.world, G.M = BO3D.models || {}, AV = BO3D.avatars || {}, G.FX = BO3D.fx || null;
    G.P = W.P, G.SC = G.C.scenes['EX-01'];
    G.C3 = BO.content3d || null, G.JD = G.C3 ? G.C3.jordan : null, G.ALT = G.C.scenes['ALT-02'];
    /* 지금 있는 장소: 'horeb'(호렙 산) 또는 'jordan'(요단 강). 높이와 걸을 수 있는 곳은 장소마다 다르다. */
    G.cur = 'horeb', G.JL = null;
    G.S = { tier: 't2', ch: 'hyu' };
    G.root = document.getElementById('game'), G.canvas = document.getElementById('c'), G.ui = document.getElementById('ui');

    /* ── 장면 구성 ── */
    G.renderer = new G.T.WebGLRenderer({ canvas: G.canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!window.BO3D_TEST });
    G.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    G.renderer.shadowMap.enabled = true;
    G.renderer.shadowMap.type = G.T.PCFSoftShadowMap;
    G.scene = new G.T.Scene();
    G.camera = new G.T.PerspectiveCamera(58, 1, 0.3, 700);
    G.env = W.build(G.scene);
    G.camera.layers.enable(1); G.camera.layers.enable(2);
    G.post = G.FX ? new G.FX.Post(G.renderer) : null;

    G.machine = mk('timeMachine', null, function () { return { group: fallback('#D9A441', 2.4, 0.9), update: function () {} }; });
    G.scene.add(place(G.machine.group, G.P.machine[0], G.P.machine[1]));
    G.machine.group.rotation.y = -0.5;

    G.bush = mk('bush', null, function () {
      var g = fallback('#6F8448', 1.6, 1.0); var l = new G.T.PointLight('#FF9A3C', 1.4, 18); l.position.y = 1.4; g.add(l);
      return { group: g, update: function () {} };
    });
    G.scene.add(place(G.bush.group, G.P.bush[0], G.P.bush[1]));
    G.bushFx = G.FX ? G.FX.upgradeBush(G.bush.group) : null;

    G.moses = mk('moses', null, function () { return { group: fallback('#8A5A3C', 1.75, 0.27), setPose: function () {}, update: function () {} }; });
    G.scene.add(place(G.moses.group, G.P.mosesStart[0], G.P.mosesStart[1]));
    G.moses.group.rotation.y = Math.PI * 0.8;
    if (G.moses.setPose) G.moses.setPose('approach');

    /* Blender로 만든 모세(뼈대와 동작이 있는 GLB)가 있으면 읽어서 바꿔 끼운다 */
    (function loadMosesGlb() {
      var data = BO3D.glbData && BO3D.glbData.moses;
      if (!data || !G.T.GLTFLoader) return;
      try {
        var bin = atob(data), buf = new Uint8Array(bin.length), i;
        for (i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
        new G.T.GLTFLoader().parse(buf.buffer, '', function (gltf) {
          var g = gltf.scene, mixer = new G.T.AnimationMixer(g), act = {}, cur = null, pose = 'approach';
          g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
          gltf.animations.forEach(function (c) { act[c.name] = mixer.clipAction(c); });
          if (!act.Idle) return;
          if (act.HideFace) { act.HideFace.setLoop(G.T.LoopOnce, 1); act.HideFace.clampWhenFinished = true; }
          function play(name, fade) {
            var a = act[name]; if (!a || a === cur) return;
            a.reset(); a.play();
            if (cur) cur.crossFadeTo(a, fade, false);
            cur = a;
          }
          play('Idle', 0);
          var nm = {
            group: g,
            setPose: function (name) { pose = name; play(name === 'hideface' ? 'HideFace' : 'Idle', 0.35); },
            update: function (dt, moving) { if (pose !== 'hideface') play(moving && act.Walk ? 'Walk' : 'Idle', 0.25); mixer.update(dt); }
          };
          g.position.copy(G.moses.group.position); g.rotation.y = G.moses.group.rotation.y;
          G.scene.remove(G.moses.group); G.scene.add(g);
          G.moses = nm;
          if (G.FX) G.FX.sortLayers(g);
        }, function (e) { console.error('moses glb', e); });
      } catch (e) { console.error('moses glb', e); }
    })();

    G.sheep = [], sr = W.rng(5);
    for (si = 0; si < 7; si++) {
      sh = mk('sheep', si, function () { var g = new G.T.Mesh(new G.T.SphereGeometry(0.42, 8, 6), new G.T.MeshStandardMaterial({ color: '#F4EFE4', flatShading: true })); g.position.y = 0.45; var gg = new G.T.Group(); gg.add(g); return { group: gg, update: function () {} }; });
      sx = G.P.flock[0] + (sr() * 2 - 1) * 4.2, sz = G.P.flock[1] + (sr() * 2 - 1) * 3.4;
      G.scene.add(place(sh.group, sx, sz)); sh.group.rotation.y = sr() * 6.28;
      G.sheep.push(sh);
    }

    G.scraps = G.P.scraps.map(function (p) {
      var s = mk('scrap', null, function () {
        var g = new G.T.Group(), m = new G.T.Mesh(new G.T.BoxGeometry(0.42, 0.55, 0.04), new G.T.MeshStandardMaterial({ color: '#FFF1C2', emissive: '#F7B733', emissiveIntensity: 0.9 }));
        m.position.y = 1.1; g.add(m); return { group: g, update: function (t) { m.rotation.y = t * 1.4; m.position.y = 1.1 + Math.sin(t * 2) * 0.1; } };
      });
      place(s.group, p[0], p[1]); s.group.visible = false; G.scene.add(s.group);
      /* 멀리서도 보이는 빛기둥 */
      var beam = new G.T.Mesh(new G.T.CylinderGeometry(0.08, 0.34, 9, 10, 1, true), new G.T.MeshBasicMaterial({ color: '#FFE08A', transparent: true, opacity: 0.13, blending: G.T.AdditiveBlending, depthWrite: false, side: G.T.DoubleSide, fog: false }));
      beam.position.y = 4.6; s.group.add(beam);
      if (G.FX) s.group.traverse(function (o) { if (o.isSprite || (o.material && o.material.transparent)) o.layers.set(G.FX.GLOW); });
      return s;
    });

    /* 지켜보는 자리의 경계선 */
    G.ring = new G.T.Mesh(new G.T.RingGeometry(G.P.witnessRadius - 0.07, G.P.witnessRadius + 0.07, 96), new G.T.MeshBasicMaterial({ color: '#FFF6E0', transparent: true, opacity: 0.0, depthWrite: false }));
    G.ring.rotation.x = -Math.PI / 2; place(G.ring, G.P.bush[0], G.P.bush[1], 0.12); G.scene.add(G.ring);

    G.kids = {}, G.player = null, G.followers = [];
  };
};
