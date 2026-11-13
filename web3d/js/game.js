/* 성경 탐험대 3D 샘플 — 떨기나무 장면 하나.
 * 주인공을 직접 움직여 탐험하고, 말씀 조각 3개를 모으고, 사건을 지켜본 뒤 관문을 지난다.
 * 대본은 2D 시범판과 같은 web/js/content.js(독립 검증을 거친 문장)를 그대로 쓴다.
 */
(function () {
  'use strict';
  var T = THREE, C = BO.content, IC = BO.icons, W = BO3D.world, M = BO3D.models || {}, AV = BO3D.avatars || {}, FX = BO3D.fx || null;
  var P = W.P, SC = C.scenes['EX-01'];
  var C3 = BO.content3d || null, JD = C3 ? C3.jordan : null, ALT = C.scenes['ALT-02'];
  /* 지금 있는 장소: 'horeb'(호렙 산) 또는 'jordan'(요단 강). 높이와 걸을 수 있는 곳은 장소마다 다르다. */
  var cur = 'horeb', JL = null;
  function H(x, z) { return cur === 'jordan' && JL ? JL.height(x, z) : W['height'](x, z); }
  function WALK(x, z) { return cur === 'jordan' && JL ? JL.walkable(x, z) : W['walkable'](x, z); }
  var S = { tier: 't2', ch: 'hyu' };
  var root = document.getElementById('game'), canvas = document.getElementById('c'), ui = document.getElementById('ui');

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
  function tx(v) { return typeof v === 'string' ? v : (v[S.tier] || v.t2); }
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
    var g = new T.Group();
    var body = new T.Mesh(new T.CylinderGeometry(r * 0.8, r, h * 0.7, 10), new T.MeshStandardMaterial({ color: color, flatShading: true }));
    body.position.y = h * 0.35; body.castShadow = true;
    var head = new T.Mesh(new T.SphereGeometry(r * 0.9, 10, 8), new T.MeshStandardMaterial({ color: '#E8B48A', flatShading: true }));
    head.position.y = h * 0.85; head.castShadow = true;
    g.add(body); g.add(head);
    return g;
  }
  function mk(name, arg, fb) { try { if (M[name]) return M[name](arg); } catch (e) { console.error('model ' + name, e); } return fb(); }
  function mkKid(key) { return mk('kid', key, function () { return { group: fallback(C.chars[key].color, { choeon: 1.35, hyu: 1.55, onwoo: 1.72 }[key], 0.24), update: function () {} }; }); }

  /* ── 장면 구성 ── */
  var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!window.BO3D_TEST });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(58, 1, 0.3, 700);
  var env = W.build(scene);
  camera.layers.enable(1); camera.layers.enable(2);
  var post = FX ? new FX.Post(renderer) : null;

  function place(obj, x, z, lift) { obj.position.set(x, H(x, z) + (lift || 0), z); return obj; }

  var machine = mk('timeMachine', null, function () { return { group: fallback('#D9A441', 2.4, 0.9), update: function () {} }; });
  scene.add(place(machine.group, P.machine[0], P.machine[1]));
  machine.group.rotation.y = -0.5;

  var bush = mk('bush', null, function () {
    var g = fallback('#6F8448', 1.6, 1.0); var l = new T.PointLight('#FF9A3C', 1.4, 18); l.position.y = 1.4; g.add(l);
    return { group: g, update: function () {} };
  });
  scene.add(place(bush.group, P.bush[0], P.bush[1]));
  var bushFx = FX ? FX.upgradeBush(bush.group) : null;

  var moses = mk('moses', null, function () { return { group: fallback('#8A5A3C', 1.75, 0.27), setPose: function () {}, update: function () {} }; });
  scene.add(place(moses.group, P.mosesStart[0], P.mosesStart[1]));
  moses.group.rotation.y = Math.PI * 0.8;
  if (moses.setPose) moses.setPose('approach');

  /* Blender로 만든 모세(뼈대와 동작이 있는 GLB)가 있으면 읽어서 바꿔 끼운다 */
  (function loadMosesGlb() {
    var data = BO3D.glbData && BO3D.glbData.moses;
    if (!data || !T.GLTFLoader) return;
    try {
      var bin = atob(data), buf = new Uint8Array(bin.length), i;
      for (i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      new T.GLTFLoader().parse(buf.buffer, '', function (gltf) {
        var g = gltf.scene, mixer = new T.AnimationMixer(g), act = {}, cur = null, pose = 'approach';
        g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
        gltf.animations.forEach(function (c) { act[c.name] = mixer.clipAction(c); });
        if (!act.Idle) return;
        if (act.HideFace) { act.HideFace.setLoop(T.LoopOnce, 1); act.HideFace.clampWhenFinished = true; }
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
        g.position.copy(moses.group.position); g.rotation.y = moses.group.rotation.y;
        scene.remove(moses.group); scene.add(g);
        moses = nm;
        if (FX) FX.sortLayers(g);
      }, function (e) { console.error('moses glb', e); });
    } catch (e) { console.error('moses glb', e); }
  })();

  var sheep = [], sr = W.rng(5);
  for (var si = 0; si < 7; si++) {
    var sh = mk('sheep', si, function () { var g = new T.Mesh(new T.SphereGeometry(0.42, 8, 6), new T.MeshStandardMaterial({ color: '#F4EFE4', flatShading: true })); g.position.y = 0.45; var gg = new T.Group(); gg.add(g); return { group: gg, update: function () {} }; });
    var sx = P.flock[0] + (sr() * 2 - 1) * 4.2, sz = P.flock[1] + (sr() * 2 - 1) * 3.4;
    scene.add(place(sh.group, sx, sz)); sh.group.rotation.y = sr() * 6.28;
    sheep.push(sh);
  }

  var scraps = P.scraps.map(function (p) {
    var s = mk('scrap', null, function () {
      var g = new T.Group(), m = new T.Mesh(new T.BoxGeometry(0.42, 0.55, 0.04), new T.MeshStandardMaterial({ color: '#FFF1C2', emissive: '#F7B733', emissiveIntensity: 0.9 }));
      m.position.y = 1.1; g.add(m); return { group: g, update: function (t) { m.rotation.y = t * 1.4; m.position.y = 1.1 + Math.sin(t * 2) * 0.1; } };
    });
    place(s.group, p[0], p[1]); s.group.visible = false; scene.add(s.group);
    /* 멀리서도 보이는 빛기둥 */
    var beam = new T.Mesh(new T.CylinderGeometry(0.08, 0.34, 9, 10, 1, true), new T.MeshBasicMaterial({ color: '#FFE08A', transparent: true, opacity: 0.13, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false }));
    beam.position.y = 4.6; s.group.add(beam);
    if (FX) s.group.traverse(function (o) { if (o.isSprite || (o.material && o.material.transparent)) o.layers.set(FX.GLOW); });
    return s;
  });

  /* 지켜보는 자리의 경계선 */
  var ring = new T.Mesh(new T.RingGeometry(P.witnessRadius - 0.07, P.witnessRadius + 0.07, 96), new T.MeshBasicMaterial({ color: '#FFF6E0', transparent: true, opacity: 0.0, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; place(ring, P.bush[0], P.bush[1], 0.12); scene.add(ring);

  var kids = {}, player = null, followers = [];
  function spawnKids() {
    var sc = cur === 'jordan' ? JL.scene : scene, st = cur === 'jordan' ? JL.P.start : P.start;
    ['choeon', 'hyu', 'onwoo'].forEach(function (k) {
      if (kids[k]) { scene.remove(kids[k].group); if (JL) JL.scene.remove(kids[k].group); }
      kids[k] = mkKid(k); sc.add(kids[k].group);
    });
    player = kids[S.ch];
    followers = ['choeon', 'hyu', 'onwoo'].filter(function (k) { return k !== S.ch; }).map(function (k) { return kids[k]; });
    place(player.group, st[0], st[1]);
    player.group.rotation.y = Math.PI;
    followers.forEach(function (f, i) { place(f.group, st[0] + (i ? 1.5 : -1.5), st[1] + 0.5); f.group.rotation.y = Math.PI; f.spd = 0; });
    trail = [];
    if (FX) FX.sortLayers(sc);
  }

  /* ── 상태 ── */
  var state = 'menu';         /* menu | explore | caption | event | gates | end | free */
  var step = 0;               /* 0: 양 떼 쪽, 1: 모세를 따라, 2: 더 가까이 */
  var camYaw = Math.PI, camPitchH = 1.45, camDist = 7.4, lastDrag = -9, now = 0;
  var camPos = new T.Vector3(), camLook = new T.Vector3(), camLookT = new T.Vector3();
  var stick = { x: 0, y: 0, id: null, bx: 0, by: 0 }, drag = { id: null, x: 0 }, keys = {};
  var trail = [], mosesWalking = false, mosesArrived = false, lastToast = -9, evIdx = 2, pspeed = 0;
  var baseFov = 62, viewShift = 0;
  var OBJ = ['양 떼가 있는 곳에서 빛나는 말씀 조각을 찾아보자', '모세가 가는 쪽으로 따라가 보자', '떨기나무가 보이는 곳까지 조금 더 가 보자'];

  /* ── 화면 위 UI ── */
  var place_ = el('span', { class: 'place', text: SC.place });
  var objText = el('span', { text: '' });
  var count = el('span', { class: 'count', text: '말씀 조각 0 / 3' });
  var partCount = el('span', { class: 'count teal', text: '부품 0 / 3' });
  var trackArrow = el('i', {}, icon('arrow')), trackText = el('span', { text: '' });
  var track = el('div', { class: 'track3', hidden: '' }, trackArrow, trackText);
  var hudRef = refChip(SC.ref, true), clueCount = el('span', { class: 'count teal', hidden: '', text: '단서 0 / 5' });
  var hud = el('div', { class: 'hud3 pad', hidden: '' },
    el('div', { class: 'row' }, place_, hudRef),
    el('div', { class: 'row' }, count, partCount, clueCount),
    el('div', { class: 'obj' }, icon('compass'), objText), track);
  var knob = el('i', {}), base = el('div', { class: 'stick', hidden: '' }, knob);
  var hint = el('div', { class: 'hint', hidden: '' }, '왼쪽 아래를 누른 채 밀면 걸어요. 오른쪽을 밀면 둘러봐요. 사진기 버튼으로 본 것을 찍어 도감에 담아요.');
  var toastEl = el('div', { class: 'toast3', hidden: '' });
  var panelBody = el('div', { class: 'sheet-body pad' }), panelFoot = el('div', { class: 'sheet-foot pad' });
  var panel = el('div', { class: 'panel3 sheet', hidden: '' }, panelBody, panelFoot);
  var overlay = el('div', { class: 'overlay3', hidden: '' });
  var touch = el('div', { class: 'touch3' });
  var snd = el('button', { class: 'snd3', hidden: '', 'aria-label': '소리 끄기', 'aria-pressed': 'false', on: { click: function () {
    var m = !FX.audio.isMuted(); FX.audio.mute(m); snd.setAttribute('aria-pressed', String(m)); snd.setAttribute('aria-label', m ? '소리 켜기' : '소리 끄기');
  } } }, icon('speaker'));
  var dexLabel = el('span', { text: '도감 0 / 5' });
  var dexBtn = el('button', { class: 'dex3', hidden: '', on: { click: function () { if (cur === 'jordan') openClues(); else openDex(); } } }, icon('journal'), dexLabel);
  var camBtn = el('button', { class: 'cam3', hidden: '', 'aria-label': '사진 찍기', on: { click: function () { wantShot = true; } } }, icon('camera'));
  var flash = el('div', { class: 'flash3', hidden: '' });
  var denBtn = el('button', { class: 'den3', hidden: '', on: { click: function () { openDen(); } } }, '타임머신에 타기');
  var dedBtn = el('button', { class: 'den3', hidden: '', on: { click: function () { startDeduce(); } } }, '추리하기');
  add(ui, [touch, hud, base, hint, toastEl, dexBtn, camBtn, denBtn, dedBtn, snd, flash, panel, overlay]);

  function setObjective(t) { objText.textContent = t; }
  function toast(html, who) {
    toastEl.replaceChildren();
    if (who) { add(toastEl, [avatar(who), el('span', {}, el('b', { text: C.chars[who].name + ' ', style: 'color:' + C.chars[who].color }), html)]); }
    else add(toastEl, el('span', { text: html }));
    toastEl.hidden = false; toastEl.classList.remove('show'); void toastEl.offsetWidth; toastEl.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.hidden = true; }, 4200);
  }
  function showPanel(kids_, foot) {
    panelBody.replaceChildren(); panelFoot.replaceChildren();
    add(panelBody, kids_); add(panelFoot, foot);
    panel.hidden = false; panelBody.scrollTop = 0;
    base.hidden = true; stick.x = stick.y = 0; stick.id = null;
  }
  function hidePanel() { panel.hidden = true; }
  function btn(label, fn, cls) { return el('button', { class: 'btn ' + (cls || 'onpaper'), on: { click: fn } }, label); }

  function beatNodes(b) {
    var who = b.say && C.chars[b.say.who];
    return [
      el('div', { class: 'narr-meta' }, refChip(b.ref)),
      el('p', { class: 'narr', text: tx(b.text) }),
      b.say ? el('div', { class: 'say' }, avatar(b.say.who), el('div', { class: 'bubble' }, el('b', { text: who.name, style: 'color:' + who.color }), b.say.text)) : null,
      b.open ? el('div', { class: 'openbible' }, icon('book'), el('span', {}, '하나님이 하신 말씀은 성경책에서 직접 읽어요. ', el('b', { text: bookName(b.open) }))) : null
    ];
  }


  /* ── 사진과 탐험 도감 ──
   * 세 아이는 목격자다. 본 것을 사진으로 담아 도감을 채운다. 설명은 본문에 있는 사실만 적는다. */
  function v3(x, y, z) { return new T.Vector3(x, y, z); }
  var DEX = [
    { id: 'sheep', name: '양 떼', desc: '모세가 치던 장인 이드로의 양 떼', ref: '출 3:1', hint: '출발한 곳에서 가까운 곳에 모여 있어요.', range: 17,
      pos: function () { return v3(P.flock[0], H(P.flock[0], P.flock[1]) + 0.6, P.flock[1]); } },
    { id: 'moses', name: '모세', desc: '미디안 제사장 이드로의 사위. 장인의 양 떼를 치고 있었다', ref: '출 3:1', hint: '양 떼 가까이에서 찾아보세요.', range: 19,
      pos: function () { var p = moses.group.position; return v3(p.x, p.y + 1.1, p.z); } },
    { id: 'horeb', name: '하나님의 산 호렙', desc: '모세가 양 떼를 이끌고 이른 산', ref: '출 3:1', hint: '가장 높은 봉우리를 화면 가운데에 담아 보세요.', range: 500, crop: 0.95,
      pos: function () { return v3(P.mountain[0], H(P.mountain[0], P.mountain[1]) * 0.62, P.mountain[1]); } },
    { id: 'bush', name: '불붙은 떨기나무', desc: '불이 붙었으나 타서 없어지지 않은 떨기나무', ref: '출 3:2', hint: '모세가 가는 쪽으로 따라가면 보여요.', range: 36,
      pos: function () { return v3(P.bush[0], H(P.bush[0], P.bush[1]) + 1.3, P.bush[1]); } },
    { id: 'machine', name: '타임머신', desc: '탐험대가 타고 온 놋쇠 타임머신. 성경에 나오는 물건은 아니다', ref: null, hint: '처음 도착한 자리에 서 있어요.', range: 17,
      pos: function () { return v3(P.machine[0], H(P.machine[0], P.machine[1]) + 1.3, P.machine[1]); } }
  ];
  var dex = {}, wantShot = false;
  function dexCount() { return Object.keys(dex).length; }
  function updateDexBtn() { dexLabel.textContent = '도감 ' + dexCount() + ' / ' + DEX.length; }
  function takeShot() {
    var cw = canvas.width, ch = canvas.height, found = [], best = null;
    DEX.forEach(function (d) {
      var wp = d.pos(), cs = wp.clone().applyMatrix4(camera.matrixWorldInverse);
      if (cs.z > -0.5 || wp.distanceTo(camera.position) > d.range) return;
      var n = wp.clone().project(camera);
      if (Math.abs(n.x) > 0.82 || Math.abs(n.y) > 0.86) return;
      var item = { d: d, n: n, c: n.x * n.x + n.y * n.y };
      found.push(item); if (!best || item.c < best.c) best = item;
    });
    flash.hidden = false; flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
    setTimeout(function () { flash.hidden = true; }, 420);
    if (FX) FX.audio.shutter();
    if (!found.length) { toast('사진에 담긴 것이 없어요. 찍고 싶은 것을 화면 가운데에 놓고 다시 찍어 보세요.'); return; }
    var fresh = found.filter(function (f) { return !dex[f.d.id]; });
    fresh.forEach(function (f) {
      var size = Math.min(cw, ch) * (f.d.crop || 0.5), sx = (f.n.x * 0.5 + 0.5) * cw - size / 2, sy = (1 - (f.n.y * 0.5 + 0.5)) * ch - size / 2;
      sx = Math.max(0, Math.min(cw - size, sx)); sy = Math.max(0, Math.min(ch - size, sy));
      var cv = document.createElement('canvas'); cv.width = cv.height = 220;
      try { cv.getContext('2d').drawImage(canvas, sx, sy, size, size, 0, 0, 220, 220); dex[f.d.id] = cv.toDataURL('image/jpeg', 0.82); }
      catch (e) { dex[f.d.id] = ''; }
    });
    updateDexBtn();
    if (fresh.length) {
      if (FX) FX.audio.chime();
      dexBtn.classList.remove('pulse'); void dexBtn.offsetWidth; dexBtn.classList.add('pulse');
      toast('도감에 새로 담았어요: ' + fresh.map(function (f) { return f.d.name; }).join(', ') + (dexCount() === DEX.length ? '. 도감을 모두 채웠어요!' : ''));
    } else toast('이미 도감에 있는 사진이에요: ' + best.d.name);
  }
  function openDex() {
    stick.x = stick.y = 0; stick.id = null; base.hidden = true;
    var cells = DEX.map(function (d) {
      var has = d.id in dex;
      return el('div', { class: 'dexcell' + (has ? '' : ' none') },
        has && dex[d.id] ? el('img', { src: dex[d.id], alt: d.name }) : el('div', { class: 'ph', text: has ? '' : '?' }),
        el('b', { text: has ? d.name : '아직 못 찍었어요' }),
        el('span', { text: has ? d.desc : d.hint }),
        has && d.ref ? refChip(d.ref) : null);
    });
    var prevClass = overlay.className, prevKids = Array.prototype.slice.call(overlay.childNodes), wasHidden = overlay.hidden;
    sheetOverlay([el('div', { class: 'q-kicker', text: '탐험 도감 ' + dexCount() + ' / ' + DEX.length }),
      el('p', { class: 'q-prompt', text: '본 것을 사진으로 담아 도감을 채워요.' }),
      el('div', { class: 'dexgrid' }, cells)],
      btn('닫기', function () { overlay.className = prevClass; overlay.replaceChildren.apply(overlay, prevKids); overlay.hidden = wasHidden; }));
  }


  /* ── 탐험대 이야기: 타임머신 고장과 부품 찾기, 아지트 ──
   * 세 아이만의 이야기이며 성경 내용이 아니다. 화면에 "탐험대 이야기"라고 적어 본문과 구분한다.
   * 원칙: 과거에 아무것도 남기지 않고, 가져오는 것은 사진과 기록뿐이다. */
  var PARTS = [
    { id: 'gear', name: '톱니바퀴', at: [-17, 31], line: '톱니바퀴를 찾았어!' },
    { id: 'needle', name: '나침반 바늘', at: [15.5, 22], line: '나침반 바늘이 여기 있었네!' },
    { id: 'lens', name: '등불 유리', at: [-11, 3], line: '등불 유리를 찾았어!' }
  ];
  var partsFound = 0, sceneDone = false, flagColor = null, hatOn = false, flag = null, departT = 0, machineY = machine.group.position.y;
  var brass = new T.MeshStandardMaterial({ color: '#D9A441', metalness: 0.55, roughness: 0.35, flatShading: true });
  function partMesh(kind) {
    var g = new T.Group(), i, m;
    if (kind === 'gear') {
      g.add(new T.Mesh(new T.TorusGeometry(0.2, 0.065, 6, 14), brass));
      for (i = 0; i < 8; i++) { m = new T.Mesh(new T.BoxGeometry(0.09, 0.1, 0.11), brass); m.position.set(Math.cos(i * 0.785) * 0.29, Math.sin(i * 0.785) * 0.29, 0); m.rotation.z = i * 0.785; g.add(m); }
    } else if (kind === 'needle') {
      m = new T.Mesh(new T.ConeGeometry(0.09, 0.36, 4), new T.MeshStandardMaterial({ color: '#EE7B62', flatShading: true })); m.position.y = 0.18; m.scale.z = 0.35; g.add(m);
      m = new T.Mesh(new T.ConeGeometry(0.09, 0.36, 4), new T.MeshStandardMaterial({ color: '#FBF7EE', flatShading: true })); m.position.y = -0.18; m.rotation.z = Math.PI; m.scale.z = 0.35; g.add(m);
      g.add(new T.Mesh(new T.SphereGeometry(0.06, 8, 6), brass));
    } else {
      m = new T.Mesh(new T.SphereGeometry(0.2, 12, 8), new T.MeshStandardMaterial({ color: '#7AD0C8', emissive: '#2F9C95', emissiveIntensity: 0.5, roughness: 0.2, flatShading: true })); m.scale.z = 0.4; g.add(m);
      g.add(new T.Mesh(new T.TorusGeometry(0.21, 0.035, 6, 16), brass));
    }
    g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
    return g;
  }
  var partObjs = PARTS.map(function (p, i) {
    var grp = new T.Group(), mesh = partMesh(p.id);
    mesh.position.y = 0.95; grp.add(mesh);
    var beam = new T.Mesh(new T.CylinderGeometry(0.05, 0.22, 5, 8, 1, true), new T.MeshBasicMaterial({ color: '#8FE3DA', transparent: true, opacity: 0.16, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false }));
    beam.position.y = 2.7; if (FX) beam.layers.set(FX.GLOW); grp.add(beam);
    place(grp, p.at[0], p.at[1]); scene.add(grp);
    if (M.rock) { var rk = M.rock(40 + i); rk.scale.multiplyScalar(1.7); place(rk, p.at[0] + 1.5, p.at[1] - 1.1, -0.05); scene.add(rk); }
    return { group: grp, mesh: mesh, taken: false };
  });
  function takePart(i) {
    var po = partObjs[i]; po.taken = true; po.group.visible = false; partsFound++;
    partCount.textContent = '부품 ' + partsFound + ' / ' + PARTS.length;
    partCount.classList.remove('pulse'); void partCount.offsetWidth; partCount.classList.add('pulse');
    if (FX) FX.audio.chime();
    var all = partsFound === PARTS.length;
    toast(PARTS[i].line + (all ? ' 이제 다 모았어. 타임머신에 끼우러 가자.' : ' 남은 부품은 ' + (PARTS.length - partsFound) + '개야.'), S.ch);
    if (all && (state === 'free')) setObjective('타임머신으로 돌아가자');
  }
  function updateTracker() {
    var p = player.group.position, best = null, bd = 1e9;
    partObjs.forEach(function (po, i) { if (po.taken) return; var d = dist2(p.x, p.z, PARTS[i].at[0], PARTS[i].at[1]); if (d < bd) { bd = d; best = PARTS[i]; } });
    var show = (state === 'explore' || state === 'free');
    denBtn.hidden = !(show && dist2(p.x, p.z, P.machine[0], P.machine[1]) < 6.5);
    var target = best ? best.at : ((sceneDone || partsFound === PARTS.length) ? P.machine : null);
    if (!show || !target) { track.hidden = true; return; }
    var d = dist2(p.x, p.z, target[0], target[1]);
    if (!best && d < 6.5) { track.hidden = true; return; }
    track.hidden = false;
    var rel = Math.atan2(target[0] - p.x, target[1] - p.z) - camYaw;
    trackArrow.style.transform = 'rotate(' + (-rel) + 'rad)';
    trackText.textContent = (best ? '부품 탐지기 ' : '타임머신까지 ') + Math.round(d) + 'm';
  }
  function setFlag(color) {
    flagColor = color;
    if (flag) { machine.group.remove(flag); flag = null; }
    if (!color) return;
    flag = new T.Group();
    var pole = new T.Mesh(new T.CylinderGeometry(0.018, 0.018, 1.0, 6), brass); pole.position.y = 0.5; flag.add(pole);
    var shape = new T.Shape(); shape.moveTo(0, 0); shape.lineTo(0.5, -0.14); shape.lineTo(0, -0.28); shape.lineTo(0, 0);
    var pen = new T.Mesh(new T.ShapeGeometry(shape), new T.MeshStandardMaterial({ color: color, side: T.DoubleSide, flatShading: true })); pen.position.y = 0.98; flag.add(pen);
    flag.position.set(0.62, 1.75, 0); flag.rotation.z = -0.12;
    machine.group.add(flag);
  }
  function setHat(on) {
    hatOn = on;
    if (hat && hat.parent) hat.parent.remove(hat);
    if (on) wearHat();
  }
  function openDen() {
    var prev = state; state = 'den'; stick.x = stick.y = 0; stick.id = null; base.hidden = true;
    function render() {
      var ready = partsFound === PARTS.length && sceneDone;
      var slots = PARTS.map(function (p, i) {
        var on = partObjs[i].taken;
        return el('div', { class: 'slot' + (on ? ' on' : '') }, icon(p.id === 'needle' ? 'compass' : p.id), el('b', { text: p.name }), el('span', { text: on ? '끼웠어요' : '아직 못 찾았어요' }));
      });
      var frames = DEX.map(function (d) {
        var has = d.id in dex;
        return el('div', { class: 'frame' + (has ? '' : ' empty') }, has && dex[d.id] ? el('img', { src: dex[d.id], alt: d.name }) : el('div', { class: 'ph' }), el('span', { text: has ? d.name : '빈 액자' }));
      });
      var cols = [null, '#EE7B62', '#2F9C95', '#4E5FB0', '#F7D774'];
      var sw = cols.map(function (c) {
        return el('button', { class: 'sw' + (c ? '' : ' none'), 'aria-pressed': String(flagColor === c), 'aria-label': c ? '깃발 색' : '깃발 없음', style: c ? 'background:' + c : '', on: { click: function () { setFlag(c); render(); } } }, c ? null : '없음');
      });
      var hatBtn = el('button', { class: 'tog', 'aria-pressed': String(hatOn), on: { click: function () { setHat(!hatOn); render(); } } }, hatOn ? '쓰고 있어요' : '쓰기');
      if (!sceneDone) hatBtn.disabled = true;
      var msg = ready ? '부품을 모두 끼웠고 이 시대의 탐험도 마쳤어요. 이제 떠날 수 있어요.'
        : [partsFound < PARTS.length ? '시간 나침반의 부품이 ' + (PARTS.length - partsFound) + '개 모자라요.' : '부품은 모두 끼웠어요.',
          sceneDone ? '' : '떨기나무 장면을 끝까지 지켜봐야 떠날 수 있어요.'].join(' ');
      var go = btn('다음 시대로 출발', depart, 'wide'); go.disabled = !ready;
      overlay.className = 'overlay3 den3ov pad';
      overlay.replaceChildren(
        el('div', { class: 'eyebrow', text: '탐험대 이야기' }),
        el('h1', { class: 'den-title', text: '타임머신 아지트' }),
        el('p', { class: 'den-lead', text: '과거에는 아무것도 남기지 않고, 가져오는 것은 사진과 기록뿐이에요.' }),
        el('h2', { text: '시간 나침반 수리' }), el('div', { class: 'slots' }, slots), el('p', { class: 'den-msg', text: msg }),
        el('h2', { text: '사진 벽' }), el('div', { class: 'frames' }, frames),
        el('h2', { text: '꾸미기' }),
        el('div', { class: 'deco' }, el('span', { text: '타임머신 깃발' }), el('div', { class: 'sws' }, sw)),
        el('div', { class: 'deco' }, el('span', { text: sceneDone ? '탐험 모자' : '탐험 모자 (첫 장면을 마치면 열려요)' }), hatBtn),
        el('div', { class: 'den-foot' }, btn('밖으로 나가기', function () { overlay.hidden = true; state = prev; }, 'quiet'), go));
      overlay.hidden = false;
    }
    render();
  }
  var departGlow = (function () {
    var cv = document.createElement('canvas'); cv.width = cv.height = 128;
    var cx = cv.getContext('2d'), gr = cx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,236,170,0.55)'); gr.addColorStop(1, 'rgba(255,220,140,0)');
    cx.fillStyle = gr; cx.fillRect(0, 0, 128, 128);
    var sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(cv), transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
    sp.scale.setScalar(5); return sp;
  })();
  departGlow.position.y = 1.3; if (FX) departGlow.layers.set(FX.GLOW); machine.group.add(departGlow);
  function depart() {
    overlay.hidden = true; state = 'depart'; departT = 0;
    hud.hidden = true; camBtn.hidden = true; dexBtn.hidden = true; denBtn.hidden = true; track.hidden = true; hint.hidden = true;
    for (var k in kids) kids[k].group.visible = false;
    if (FX) FX.audio.rise();
  }
  function updateDepart(dt) {
    departT += dt;
    var u = Math.min(1, departT / 3.8), e = u * u * u;
    machine.group.position.y = machineY + e * 22;
    machine.group.rotation.y += dt * (0.6 + u * 7);
    departGlow.material.opacity = Math.min(0.6, departT * 0.3); departGlow.scale.setScalar(5 + u * 5);
    if (departT > 4.3) endCard();
  }
  function endCard() {
    state = 'end2';
    overlay.className = 'overlay3 den3ov pad';
    overlay.replaceChildren(
      el('div', { class: 'eyebrow', text: '출애굽기 3장 탐험 완료' }),
      el('h1', { class: 'den-title', text: '다음 시대로!' }),
      el('p', { class: 'den-lead', text: '타임머신이 다시 떠올랐어요. 과거에는 아무것도 남기지 않았어요.' }),
      el('div', { class: 'slots' },
        el('div', { class: 'slot on' }, icon('book'), el('b', { text: '말씀 카드' }), el('span', { text: SC.cards.length + '장' })),
        el('div', { class: 'slot on' }, icon('camera'), el('b', { text: '탐험 도감' }), el('span', { text: dexCount() + ' / ' + DEX.length })),
        el('div', { class: 'slot on' }, icon('gear'), el('b', { text: '찾은 부품' }), el('span', { text: partsFound + ' / ' + PARTS.length }))),
      el('p', { class: 'den-msg', text: '다음 장면(하나님의 이름과 세 가지 표징, 출 3:13-4:17)은 목사님 감수를 마친 뒤 열립니다.' }),
      el('div', { class: 'den-foot' }, btn('처음부터 다시', menu, 'quiet'), btn('다른 이름으로 가 보기', function () { if (C3 && BO3D.jordan) route(); else menu(); }, 'wide')));
    overlay.hidden = false;
  }


  /* ── 시대 추리: 이름을 잘못 넣으면 성경의 다른 실제 장면으로 간다 ──
   * 도착한 곳이 언제, 어디인지 모르는 채로 사진으로 단서를 모으고, 증거를 골라 추리한 뒤 성경에서 확인한다. */
  function hudMode() {
    var j = cur === 'jordan';
    place_.textContent = j ? JD.unknownPlace : SC.place;
    hudRef.hidden = j; count.hidden = j; partCount.hidden = j; clueCount.hidden = !j;
    dedBtn.hidden = true;
    if (j) { track.hidden = true; denBtn.hidden = true; }
  }
  function route() {
    state = 'route'; hud.hidden = true; hidePanel(); camBtn.hidden = true; dexBtn.hidden = true; denBtn.hidden = true; dedBtn.hidden = true; track.hidden = true;
    root.className = 'g3 app ' + S.tier;
    if (FX) { FX.audio.start(); FX.audio.pad(false); }
    var opts = C.route.options.map(function (o) {
      var ready = o.to === 'EX-01' || o.to === 'ALT-02';
      var b = btn(ready ? o.label : C3.route.locked, function () {
        warpTo(C3.route.warpTitle, function () { if (o.to === 'ALT-02') enterJordan(); else begin(); });
      }, 'wide');
      if (!ready) b.disabled = true;
      return b;
    });
    overlay.className = 'overlay3 den3ov pad';
    overlay.replaceChildren(
      el('div', { class: 'eyebrow', text: '탐험대 이야기' }),
      el('h1', { class: 'den-title', text: C3.route.title }),
      el('p', { class: 'den-lead', text: C3.route.lead }),
      el('div', { class: 'route-q' },
        el('p', { text: tx(C.scenes['EX-00'].beats[3].text) }), refChip(C3.route.contextRef, true),
        el('p', { class: 'ask', text: tx(C.route.prompt) })),
      el('div', { class: 'route-opts' }, opts),
      el('p', { class: 'den-msg', text: C3.route.hint }));
    overlay.hidden = false;
  }
  function warpTo(title, fn) {
    overlay.className = 'overlay3 den3ov warp3 pad';
    overlay.replaceChildren(el('div', { class: 'eyebrow', text: '시간 이동' }), el('h1', { class: 'den-title', text: title }), el('p', { class: 'den-lead', text: '타임머신이 이름을 따라 시대를 찾고 있어요.' }));
    overlay.hidden = false;
    if (FX) FX.audio.chime();
    setTimeout(fn, 1500);
  }
  function loadGlb(name, cb) {
    var data = BO3D.glbData && BO3D.glbData[name];
    if (!data || !T.GLTFLoader) return;
    try {
      var bin = atob(data), buf = new Uint8Array(bin.length), i;
      for (i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      new T.GLTFLoader().parse(buf.buffer, '', cb, function (e) { console.error('glb ' + name, e); });
    } catch (e) { console.error('glb ' + name, e); }
  }
  /* Blender로 만든 여호수아와 제사장이 있으면 단순 모형과 바꿔 끼운다 */
  function swapGlb(name, old, clipName, once, mirror, after) {
    loadGlb(name, function (gltf) {
      var g = gltf.scene, mixer = new T.AnimationMixer(g), clip = null;
      g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
      gltf.animations.forEach(function (c) { if (c.name === clipName) clip = c; });
      if (!clip) clip = gltf.animations[0];
      if (clip) { var a = mixer.clipAction(clip); if (once) { a.setLoop(T.LoopOnce, 1); a.clampWhenFinished = true; } a.play(); }
      g.position.copy(old.group.position); g.rotation.y = old.group.rotation.y;
      if (mirror) g.scale.x = -1;
      JL.scene.remove(old.group); JL.scene.add(g); old.group = g;
      if (after) after(g);
      JL.addUpdate(function (dt) { mixer.update(dt); });
      if (FX) FX.sortLayers(g);
    });
  }
  function loadJordanGlb() {
    swapGlb('joshua', JL.leader, 'Idle', false, false);
    /* Blender 제사장은 채가 모델 기준 (x -0.156, y 1.393)을 지난다. 오른쪽 어깨용이며 왼쪽은 좌우를 뒤집어 쓴다. */
    var PX = 0.156, PY = 1.393, a = JL.P.ark, bed = JL.height(a[0], a[1]);
    JL.priests.forEach(function (pr) {
      swapGlb('priest', pr, 'Carry', false, pr.side === 'L', function (g) {
        g.position.x = a[0] + (pr.side === 'R' ? -1 : 1) * (JL.arkPole.x + PX);
        g.position.y = JL.height(g.position.x, g.position.z);
        JL.ark.position.y = bed + PY - JL.arkPole.y;
      });
    });
  }
  var clue = {}, dedReady = false;
  function clueN() { return Object.keys(clue).length; }
  function enterJordan() {
    if (!JL) { JL = BO3D.jordan.build(); loadJordanGlb(); }
    cur = 'jordan'; overlay.hidden = true; clue = {}; dedReady = false;
    spawnKids(); hudMode();
    camYaw = Math.PI; snapCamera();
    clueCount.textContent = '단서 0 / ' + JD.clues.length; dexLabel.textContent = '추리 수첩 0 / ' + JD.clues.length;
    setObjective(JD.objective); hud.hidden = false; snd.hidden = false;
    state = 'caption';
    var sy = JD.story.say, who = C.chars[sy.who];
    showPanel([el('div', { class: 'q-kicker', text: '탐험대 이야기' }), el('p', { class: 'narr', text: tx(JD.story.text) }),
      el('div', { class: 'say' }, avatar(sy.who), el('div', { class: 'bubble' }, el('b', { text: who.name, style: 'color:' + who.color }), sy.text))],
      btn('둘러보자', function () {
        hidePanel(); state = 'explore'; camBtn.hidden = false; dexBtn.hidden = false; hint.hidden = false;
        setTimeout(function () { hint.hidden = true; }, 9000);
      }));
  }
  function shutterFx() {
    flash.hidden = false; flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
    setTimeout(function () { flash.hidden = true; }, 420);
    if (FX) FX.audio.shutter();
  }
  function thumbAt(n, crop) {
    var cw = canvas.width, ch = canvas.height, size = Math.min(cw, ch) * (crop || 0.5);
    var sx = Math.max(0, Math.min(cw - size, (n.x * 0.5 + 0.5) * cw - size / 2)), sy = Math.max(0, Math.min(ch - size, (1 - (n.y * 0.5 + 0.5)) * ch - size / 2));
    var cv = document.createElement('canvas'); cv.width = cv.height = 220;
    try { cv.getContext('2d').drawImage(canvas, sx, sy, size, size, 0, 0, 220, 220); return cv.toDataURL('image/jpeg', 0.82); } catch (e) { return ''; }
  }
  function takeClue() {
    var found = [];
    JD.clues.forEach(function (c) {
      var t = JL.targets[c.id], wp = t.pos(), cs = wp.clone().applyMatrix4(camera.matrixWorldInverse);
      if (cs.z > -0.5 || wp.distanceTo(camera.position) > t.range) return;
      var n = wp.clone().project(camera);
      if (Math.abs(n.x) > 0.82 || Math.abs(n.y) > 0.86) return;
      found.push({ c: c, t: t, n: n });
    });
    shutterFx();
    if (!found.length) { toast('사진에 단서가 담기지 않았어요. 눈에 띄는 것을 화면 가운데에 놓고 찍어 보세요.'); return; }
    var fresh = found.filter(function (f) { return !(f.c.id in clue); });
    fresh.forEach(function (f) { clue[f.c.id] = thumbAt(f.n, f.t.crop); });
    clueCount.textContent = '단서 ' + clueN() + ' / ' + JD.clues.length; dexLabel.textContent = '추리 수첩 ' + clueN() + ' / ' + JD.clues.length;
    if (fresh.length) {
      if (FX) FX.audio.chime();
      clueCount.classList.remove('pulse'); void clueCount.offsetWidth; clueCount.classList.add('pulse');
      toast('단서를 찾았어요: ' + fresh.map(function (f) { return f.c.name; }).join(', '));
    } else toast('이미 찾은 단서예요: ' + found[0].c.name);
    if (!dedReady && clueN() >= JD.need[S.tier]) { dedReady = true; dedBtn.hidden = false; setObjective(JD.objectiveReady); }
  }
  function clueCell(c) {
    var has = c.id in clue;
    return el('div', { class: 'dexcell' + (has ? '' : ' none') },
      has && clue[c.id] ? el('img', { src: clue[c.id], alt: c.name }) : el('div', { class: 'ph', text: has ? '' : '?' }),
      el('b', { text: has ? c.name : '아직 못 찾은 단서' }),
      el('span', { text: has ? tx(c.text) : '눈에 띄는 것을 사진으로 찍어 보세요.' }),
      has ? refChip(c.ref) : null,
      has && c.aside ? el('span', { class: 'aside', text: c.aside }) : null);
  }
  function openClues() {
    stick.x = stick.y = 0; stick.id = null; base.hidden = true;
    sheetOverlay([el('div', { class: 'q-kicker', text: '추리 수첩 ' + clueN() + ' / ' + JD.clues.length }),
      el('p', { class: 'q-prompt', text: '찍은 사진이 단서예요. 장절을 성경책에서 찾아보면 더 알 수 있어요.' }),
      el('div', { class: 'dexgrid' }, JD.clues.map(clueCell))],
      btn('닫기', function () { overlay.hidden = true; }));
  }
  function multiBlock(q, onOk) {
    var noteBox = el('div', {});
    var btns = q.options.map(function (o) {
      var b = el('button', { class: 'opt', 'aria-pressed': 'false', on: { click: function () { b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); } } },
        el('span', { class: 'mark' }, icon('check')), el('span', { text: o.label }));
      return b;
    });
    var check = el('button', { class: 'btn plain', on: { click: function () {
      var ok = q.options.every(function (o, k) { return (btns[k].getAttribute('aria-pressed') === 'true') === !!o.ok; });
      if (ok) {
        btns.forEach(function (b, k) { b.disabled = true; b.classList.add(q.options[k].ok ? 'ok' : 'rest'); }); check.disabled = true;
        noteBox.replaceChildren(el('div', { class: 'note good fadein' }, el('b', { text: '다른 점을 모두 찾았어요.' }),
          el('div', { style: 'display:flex;gap:6px;flex-wrap:wrap' }, q.options.filter(function (o) { return o.ref; }).map(function (o) { return refChip(o.ref); }))));
        onOk();
      } else noteBox.replaceChildren(el('div', { class: 'note look fadein' }, el('b', { text: '다시 살펴볼까요?' }), el('span', { text: '방금 본 장면에 있었던 것만 골라 보세요.' })));
      noteBox.scrollIntoView({ block: 'nearest' });
    } } }, '확인');
    return [el('p', { class: 'q-prompt', text: q.prompt }), el('div', { class: 'opts' }, btns), check, noteBox];
  }
  function backToExplore() { overlay.hidden = true; state = 'explore'; camBtn.hidden = false; dexBtn.hidden = false; dedBtn.hidden = false; }
  function evidenceBlock(ev, onOk) {
    var noteBox = el('div', {}), have = JD.clues.filter(function (c) { return c.id in clue; });
    if (!have.some(function (c) { return ev.ok.indexOf(c.id) >= 0; })) {
      return [el('p', { class: 'q-prompt', text: tx(ev.q) }),
        el('div', { class: 'note look' }, el('b', { text: '이 물음에 맞는 단서를 아직 못 찾았어요.' }), el('span', { text: '조금 더 둘러보며 사진을 찍고 다시 추리해 보세요.' })),
        el('button', { class: 'btn plain', on: { click: backToExplore } }, '더 찾아보기')];
    }
    var btns = have.map(function (c) {
      var b = el('button', { class: 'evi', on: { click: function () {
        if (ev.ok.indexOf(c.id) >= 0) {
          btns.forEach(function (x) { x.disabled = true; if (x !== b) x.classList.add('rest'); }); b.classList.add('ok');
          if (ev.find) noteBox.replaceChildren(el('div', { style: 'display:flex;flex-direction:column;gap:12px' }, findBlock(ev.find, onOk)));
          else {
            var nt = (ev.notes && ev.notes[c.id]) || ev.note, rf = nt.ref;
            if (rf && typeof rf === 'object') rf = rf[S.tier];
            noteBox.replaceChildren(goodNote(rf || null, tx(nt.text))); onOk();
          }
        } else {
          b.classList.add('rest'); b.disabled = true;
          noteBox.replaceChildren(el('div', { class: 'note look fadein' }, el('b', { text: '그 사진만으로는 알 수 없어요.' }), el('span', { text: '다른 단서를 골라 보세요.' })));
        }
        noteBox.scrollIntoView({ block: 'nearest' });
      } } }, clue[c.id] ? el('img', { src: clue[c.id], alt: '' }) : el('div', { class: 'ph' }), el('span', { text: c.name }));
      return b;
    });
    return [el('p', { class: 'q-prompt', text: tx(ev.q) }), el('div', { class: 'evigrid' }, btns), noteBox];
  }
  function startDeduce() {
    state = 'deduce'; stick.x = stick.y = 0; stick.id = null; base.hidden = true;
    dedBtn.hidden = true; camBtn.hidden = true; dexBtn.hidden = true; hint.hidden = true;
    var evs = JD.evidence.filter(function (e) { return e.tiers.indexOf(S.tier) >= 0; }), steps = [];
    evs.forEach(function (e) { steps.push({ k: '증거 고르기', make: function (ok) { return evidenceBlock(e, ok); } }); });
    steps.push({ k: '성경에서 확인', make: function (ok) { return findBlock(JD.river, ok); } });
    if (S.tier === 't2') steps.push({ k: '마지막 추리', make: function (ok) { return multiBlock(ALT.spot.t2, ok); } });
    if (S.tier === 't3') steps.push({ k: '마지막 추리', make: function (ok) { return findrefBlock(ALT.spot.t3, ok, 'ded'); } });
    var i = 0;
    (function show() {
      var st = steps[i], last = i === steps.length - 1;
      var nb = btn(last ? '추리 결과 보기' : '다음', function () { if (last) conclude(); else { i++; show(); } }); nb.disabled = true;
      sheetOverlay([el('div', { class: 'q-kicker', text: '추리 ' + (i + 1) + ' / ' + steps.length + ' · ' + st.k }), st.make(function () { nb.disabled = false; })], nb);
    })();
  }
  function conclude() {
    var cc = JD.conclusion, who = C.chars[cc.say.who];
    sheetOverlay([el('div', { class: 'q-kicker', text: '추리 결과' }),
      el('p', { class: 'q-prompt', text: JD.place }),
      el('p', { class: 'narr', text: tx(cc.text) }),
      el('div', { style: 'display:flex;gap:6px;flex-wrap:wrap' }, cc.refs.map(function (r) { return refChip(r); })),
      el('div', { class: 'found-list' }, cc.found.map(function (f) { return el('div', { class: 'it' }, el('span', {}, f.text + ' '), refChip(f.ref)); })),
      el('div', { class: 'say' }, avatar(cc.say.who), el('div', { class: 'bubble' }, el('b', { text: who.name, style: 'color:' + who.color }), cc.say.text))],
      btn('타임머신 다시 맞추기', function () {
        var nb = btn('다음', function () {
          sheetOverlay([el('div', { class: 'q-kicker', text: '돌아가는 길에 찾은 말씀' }),
            el('p', { class: 'q-prompt', text: '길을 잘못 들었지만, 성경의 다른 장면을 직접 보고 왔어요.' }),
            el('div', { class: 'vcards' }, ALT.cards.map(function (cd) {
              return el('div', { class: 'vcard pop' }, el('div', { class: 'r', text: cd.ref }), el('div', { class: 't', text: cd.title }), el('div', { class: 'm', text: ALT.title + ' · 성경책에서 직접 읽어 보세요' }), el('span', { class: 'tag', text: '돌아가는 길에 찾은 말씀' }));
            }))],
            btn('모세가 있는 곳으로', function () { warpTo(C3.route.warpTitle, begin); }));
        }); nb.disabled = true;
        sheetOverlay([el('div', { class: 'q-kicker', text: '타임머신 다시 맞추기' }),
          findBlock({ ref: ALT.back.ref, prompt: ALT.back.prompt, confirm: ALT.back.confirm }, function () { nb.disabled = false; })], nb);
      }));
  }

  /* ── 처음 화면 ── */
  function menu() {
    state = 'menu'; cur = 'horeb'; dedBtn.hidden = true; hud.hidden = true; hidePanel(); base.hidden = true; snd.hidden = true; camBtn.hidden = true; dexBtn.hidden = true; denBtn.hidden = true; track.hidden = true;
    if (FX) FX.audio.pad(false);
    var tier = S.tier, ch = S.ch, picked = false;
    var ids = ['choeon', 'hyu', 'onwoo'];
    var tb = C.tiers.map(function (t) {
      return el('button', { class: 'tier', 'aria-pressed': 'false', on: { click: function () { tier = t.id; if (!picked) ch = t.char; sync(); } } },
        el('span', { class: 'age', text: t.label }), el('span', { class: 'nm', text: t.name }), el('span', { class: 'ds', text: t.desc }));
    });
    var cb = ids.map(function (id) {
      return el('button', { class: 'char', 'aria-pressed': 'false', on: { click: function () { ch = id; picked = true; sync(); } } },
        avatar(id), el('span', { class: 'nm', text: C.chars[id].name }), el('span', { class: 'ag', text: C.chars[id].age + '살' }));
    });
    function sync() {
      C.tiers.forEach(function (t, i) { tb[i].setAttribute('aria-pressed', String(t.id === tier)); });
      ids.forEach(function (id, i) { cb[i].setAttribute('aria-pressed', String(id === ch)); });
    }
    sync();
    overlay.className = 'overlay3 menu3 pad';
    overlay.replaceChildren(
      el('div', { class: 'eyebrow', text: '출애굽기 3장 · 3D 한 장면 샘플' }),
      el('h1', { class: 'game-title', text: '성경 탐험대' }),
      el('p', { class: 'game-sub', text: '직접 걸어가서 그 자리를 지켜봐요' }),
      el('h2', { text: '몇 살 탐험대인가요?' }), el('div', { class: 'tier-list' }, tb),
      el('h2', { text: '누가 되어 탐험할까요?' }), el('div', { class: 'char-row' }, cb),
      btn('탐험 시작', function () { S.tier = tier; S.ch = ch; if (C3 && BO3D.jordan) route(); else begin(); }, 'wide'),
      el('p', { class: 'fine', text: '감수 전 샘플입니다. 그래픽은 단순한 3D이며, 탐험하는 구조를 확인하기 위한 것입니다.' }));
    overlay.hidden = false;
  }

  function begin() {
    root.className = 'g3 app ' + S.tier;
    overlay.hidden = true;
    if (FX) { FX.audio.start(); FX.audio.pad(false); snd.hidden = false; }
    cur = 'horeb'; hudMode();
    spawnKids();
    step = 0; mosesWalking = false; mosesArrived = false; evIdx = 2;
    place(moses.group, P.mosesStart[0], P.mosesStart[1]); moses.group.rotation.y = Math.PI * 0.8;
    if (moses.setPose) moses.setPose('approach');
    scraps.forEach(function (s, i) { s.group.visible = i === 0; s.taken = false; });
    ring.material.opacity = 0;
    if (hat) { hat.parent && hat.parent.remove(hat); }
    hatOn = false; sceneDone = false; partsFound = 0;
    partObjs.forEach(function (po) { po.taken = false; po.group.visible = true; });
    partCount.textContent = '부품 0 / ' + PARTS.length;
    for (var kk in kids) kids[kk].group.visible = true;
    machine.group.position.y = machineY; machine.group.rotation.y = -0.5; departGlow.material.opacity = 0; departGlow.scale.setScalar(5);
    camYaw = Math.PI; snapCamera();
    count.textContent = '말씀 조각 0 / 3';
    setObjective(OBJ[0]); hud.hidden = false;
    updateDexBtn();
    state = 'caption';
    var teller = S.ch === 'onwoo' ? 'hyu' : 'onwoo';
    showPanel([el('div', { class: 'q-kicker', text: '탐험대 이야기' }),
      el('p', { class: 'narr', text: '타임머신이 모래 위에 거칠게 내려앉았어요. 시간 나침반의 부품 세 개가 튕겨 나갔어요. 부품을 모두 찾아야 다시 떠날 수 있어요.' }),
      el('div', { class: 'say' }, avatar(teller), el('div', { class: 'bubble' }, el('b', { text: C.chars[teller].name, style: 'color:' + C.chars[teller].color }), '과거에는 아무것도 남기면 안 돼. 탐지기를 보면서 부품을 꼭 다 찾자.'))],
      btn('출발하자', function () {
        hidePanel(); state = 'explore'; hint.hidden = false; camBtn.hidden = false; dexBtn.hidden = false;
        setTimeout(function () { hint.hidden = true; }, 9000);
        toast('저기 빛나는 곳부터 가 보자! 부품 탐지기도 잊지 마.', followers.length ? keyOf(followers[0]) : null);
      }));
  }
  function keyOf(k) { for (var n in kids) if (kids[n] === k) return n; return null; }

  /* ── 말씀 조각 줍기 ── */
  function collect(i) {
    scraps[i].taken = true; scraps[i].group.visible = false;
    if (FX) FX.audio.chime();
    count.textContent = '말씀 조각 ' + (i + 1) + ' / 3';
    count.classList.remove('pulse'); void count.offsetWidth; count.classList.add('pulse');
    if (i < 2) {
      state = 'caption';
      showPanel([el('div', { class: 'q-kicker', text: '말씀 조각 ' + (i + 1) + ' / 3' }), beatNodes(SC.beats[i])],
        btn('계속 탐험하기', function () {
          hidePanel(); state = 'explore'; step = i + 1; setObjective(OBJ[step]);
          scraps[i + 1].group.visible = true;
          if (i === 0) mosesWalking = true;
          if (i === 1) ring.material.opacity = 0.45;
        }));
    } else startEvent();
  }

  /* ── 사건 목격 ── */
  function startEvent() {
    state = 'event'; hud.hidden = true; hint.hidden = true; root.classList.add('ev');
    if (FX) FX.audio.pad(true);
    mosesWalking = false; mosesArrived = true;
    place(moses.group, P.mosesEnd[0], P.mosesEnd[1]);
    moses.group.rotation.y = Math.atan2(P.bush[0] - P.mosesEnd[0], P.bush[1] - P.mosesEnd[1]);
    /* 세 아이가 나란히 서서 떨기나무 쪽을 본다 */
    var px = player.group.position.x, pz = player.group.position.z;
    var face = Math.atan2(P.bush[0] - px, P.bush[1] - pz);
    player.group.rotation.y = face;
    followers.forEach(function (f, k) {
      var side = k ? 1 : -1, x = px + Math.cos(face) * 1.25 * side, z = pz - Math.sin(face) * 1.25 * side;
      place(f.group, x, z); f.group.rotation.y = face; f.spd = 0;
    });
    evIdx = 2; showBeat();
  }
  function showBeat() {
    var b = SC.beats[evIdx], last = evIdx === SC.beats.length - 1;
    if (moses.setPose && b.state) moses.setPose(b.state);
    var bx = P.bush[0], bz = P.bush[1], mx = P.mosesEnd[0], mz = P.mosesEnd[1];
    if (b.focus === 'moses') camLookT.set(mx * 0.75 + bx * 0.25, H(mx, mz) + 1.3, mz * 0.75 + bz * 0.25);
    else camLookT.set(bx * 0.7 + mx * 0.3, H(bx, bz) + 1.2, bz * 0.7 + mz * 0.3);
    showPanel([el('div', { class: 'q-kicker', text: '지켜보기 ' + (evIdx - 1) + ' / ' + (SC.beats.length - 2) }), beatNodes(b)],
      [evIdx > 2 ? btn('이전', function () { evIdx--; showBeat(); }, 'plain') : null,
        btn(last ? '다음으로 가는 관문' : '다음', function () { if (last) startGates(); else { evIdx++; showBeat(); } })]);
  }

  /* ── 관문 (2D 시범판과 같은 방식) ── */
  function goodNote(ref, text) { return el('div', { class: 'note good fadein' }, el('b', { text: text || '성경에 그렇게 기록되어 있어요.' }), ref ? refChip(ref) : null); }
  function lookNote(ref, text) {
    return el('div', { class: 'note look fadein' }, el('b', { text: '성경에서 확인해 볼까요?' }), el('span', { text: text || '성경책을 펴서 읽은 뒤 다시 골라 보세요.' }), ref ? refChip(ref) : null);
  }
  function choiceBlock(q, ref, onOk) {
    var pics = q.options.some(function (o) { return o.icon; }), noteBox = el('div', {});
    var btns = q.options.map(function (o) {
      var b = el('button', { class: 'opt', on: { click: function () {
        if (o.ok) { btns.forEach(function (x) { x.disabled = true; if (x !== b) x.classList.add('rest'); }); b.classList.add('ok'); noteBox.replaceChildren(goodNote(ref)); onOk(); }
        else { b.classList.add('rest'); b.disabled = true; noteBox.replaceChildren(lookNote(ref)); }
        noteBox.scrollIntoView({ block: 'nearest' });
      } } }, o.icon ? icon(o.icon) : null, el('span', { text: o.label }));
      return b;
    });
    return [el('p', { class: 'q-prompt', text: q.prompt }), el('div', { class: 'opts' + (pics ? ' pics' : '') }, btns), noteBox];
  }
  function findBlock(q, onOk) {
    var after = el('div', { style: 'display:flex;flex-direction:column;gap:12px' });
    var rb = el('button', { class: 'btn plain', on: { click: function () { rb.disabled = true; rb.textContent = '읽었어요'; add(after, choiceBlock(q.confirm, q.ref, onOk)); after.scrollIntoView({ block: 'nearest' }); } } }, '찾아서 읽었어요');
    return [el('div', { class: 'findcard' }, icon('book'), el('div', {}, el('div', { class: 'big', text: bookName(q.ref) }), el('p', { text: tx(q.prompt) }))), rb, after];
  }
  function findrefBlock(q, onOk, idp) {
    var ch = el('input', { id: 'g-ch-' + idp, type: 'text', inputmode: 'numeric', 'aria-label': '장', autocomplete: 'off', maxlength: '3' });
    var vs = el('input', { id: 'g-vs-' + idp, type: 'text', inputmode: 'numeric', 'aria-label': '절', autocomplete: 'off', maxlength: '3' });
    var noteBox = el('div', {});
    var check = el('button', { class: 'btn plain', on: { click: function () {
      var v = parseInt(ch.value, 10) + ':' + parseInt(vs.value, 10);
      if (q.accept.indexOf(v) >= 0) { ch.disabled = vs.disabled = check.disabled = true; noteBox.replaceChildren(goodNote(null, '맞게 찾았어요. ' + q.book + ' ' + ch.value.trim() + '장 ' + vs.value.trim() + '절.')); onOk(); }
      else noteBox.replaceChildren(el('div', { class: 'note look fadein' }, el('b', { text: '그 절에는 다른 내용이 적혀 있어요.' }), el('span', { text: q.hint })));
      noteBox.scrollIntoView({ block: 'nearest' });
    } } }, '확인');
    return [el('p', { class: 'q-prompt', text: q.prompt }), el('div', { class: 'refin' }, el('span', { text: q.book }), ch, el('span', { text: '장' }), vs, el('span', { text: '절' }), check), noteBox];
  }
  function orderBlock(q, onOk) {
    var n = q.items.length, perm = [], i, picked = [], noteBox = el('div', {});
    for (i = 1; i < n; i += 2) perm.push(i);
    for (i = n - 1 - ((n - 1) % 2); i >= 0; i -= 2) perm.push(i);
    var btns = perm.map(function (orig) {
      var num = el('span', { class: 'num', text: '' });
      var b = el('button', { class: 'opt', 'aria-pressed': 'false', on: { click: function () {
        if (picked.indexOf(orig) >= 0) return;
        picked.push(orig); num.textContent = String(picked.length); b.setAttribute('aria-pressed', 'true');
        if (picked.length === n) check();
      } } }, num, el('span', { text: q.items[orig] }));
      b._num = num; return b;
    });
    function reset() { picked = []; btns.forEach(function (b) { b._num.textContent = ''; b.setAttribute('aria-pressed', 'false'); }); }
    function check() {
      if (picked.every(function (v, k) { return v === k; })) { btns.forEach(function (b) { b.classList.add('ok'); b.disabled = true; }); rb.disabled = true; noteBox.replaceChildren(goodNote(q.ref, '성경에 기록된 순서예요.')); onOk(); }
      else { noteBox.replaceChildren(lookNote(q.ref, '순서를 다시 살펴볼까요? 성경책을 차례로 읽으며 다시 눌러 보세요.')); reset(); }
      noteBox.scrollIntoView({ block: 'nearest' });
    }
    var rb = el('button', { class: 'btn plain', on: { click: function () { reset(); noteBox.replaceChildren(); } } }, '다시 놓기');
    return [el('p', { class: 'q-prompt', text: q.prompt }), el('div', { class: 'opts' }, btns), rb, noteBox];
  }
  function blockFor(q, onOk, idp) {
    if (q.type === 'choice') return choiceBlock(q, q.ref, onOk);
    if (q.type === 'find') return findBlock(q, onOk);
    if (q.type === 'findref') return findrefBlock(q, onOk, idp);
    if (q.type === 'order') return orderBlock(q, onOk);
    return [];
  }
  function sheetOverlay(kids_, foot) {
    var body = el('div', { class: 'sheet-body pad' }), ft = el('div', { class: 'sheet-foot pad' });
    add(body, kids_); add(ft, foot);
    overlay.className = 'overlay3 sheet3';
    overlay.replaceChildren(el('div', { class: 'sheet' }, body, ft));
    overlay.hidden = false;
  }
  function startGates() {
    state = 'gates'; hidePanel(); root.classList.remove('ev'); camBtn.hidden = true; dexBtn.hidden = true;
    var gates = SC.gates[S.tier], gi = 0;
    (function show() {
      var q = gates[gi], last = gi === gates.length - 1;
      var nb = btn(last ? '관문 통과' : '다음 관문', function () { if (last) finish(); else { gi++; show(); } });
      nb.disabled = true;
      sheetOverlay([el('div', { class: 'q-kicker', text: '다음으로 가는 관문 ' + (gi + 1) + ' / ' + gates.length }), blockFor(q, function () { nb.disabled = false; }, gi)], nb);
    })();
  }

  /* ── 마무리: 말씀 카드와 꾸미기 보상 ── */
  var hat = null;
  function makeHat() {
    var g = new T.Group();
    var khaki = new T.MeshStandardMaterial({ color: '#C9A769', flatShading: true }), band = new T.MeshStandardMaterial({ color: C.chars[S.ch].color, flatShading: true });
    var brim = new T.Mesh(new T.CylinderGeometry(0.3, 0.32, 0.03, 16), khaki), crown = new T.Mesh(new T.CylinderGeometry(0.15, 0.18, 0.15, 14), khaki), bd = new T.Mesh(new T.CylinderGeometry(0.185, 0.185, 0.04, 14), band);
    crown.position.y = 0.08; bd.position.y = 0.035; brim.castShadow = crown.castShadow = true;
    g.add(brim); g.add(crown); g.add(bd);
    return g;
  }
  function wearHat() {
    if (hat && hat.parent) hat.parent.remove(hat);
    hat = makeHat();
    var box = new T.Box3().setFromObject(player.group);
    hat.position.y = (box.max.y - player.group.position.y) - 0.04;
    player.group.add(hat);
  }
  function finish() {
    state = 'end';
    if (FX) FX.audio.pad(false);
    var c = SC.close[S.tier], kids_ = [
      el('div', { class: 'q-kicker', text: '탐험을 마치며' }),
      el('p', { class: 'q-prompt', text: '탐험 일지에 말씀 카드가 들어왔어요.' }),
      el('div', { class: 'vcards' }, SC.cards.map(function (cd) {
        return el('div', { class: 'vcard pop' }, el('div', { class: 'r', text: cd.ref }), el('div', { class: 't', text: cd.title }), el('div', { class: 'm', text: SC.title + ' · 성경책에서 직접 읽어 보세요' }));
      }))];
    if (c.kind === 'prayer') kids_.push(el('div', { class: 'closebox' }, el('h3', { text: '한 문장 기도' }), el('p', { text: c.text })));
    if (c.kind === 'practice') kids_.push(el('div', { class: 'closebox' }, el('h3', { text: '이번 주 실천 한 가지' }), el('p', { text: c.text })));
    if (c.kind === 'note') {
      kids_.push(el('div', { class: 'closebox' }, el('h3', { text: '탐험 기록' }), el('p', { text: c.prompt }), el('textarea', { id: 'g-note', 'aria-label': '기록', placeholder: '여기에 적어 보세요.' })));
      kids_.push(el('p', { class: 'pending', text: '뜻과 삶의 적용을 묻는 질문은 목사님 감수를 마친 뒤 이 자리에 열립니다.' }));
    }
    kids_.push(el('div', { class: 'closebox' }, el('h3', { text: '탐험 도감' }), el('p', { text: '지금까지 ' + dexCount() + ' / ' + DEX.length + '장을 담았어요. 더 둘러보며 남은 사진을 찍을 수 있어요.' })));
    kids_.push(el('div', { class: 'closebox reward3' }, el('h3', { text: '탐험대 이야기' }), el('p', { text: (partsFound < PARTS.length ? '남은 부품 ' + (PARTS.length - partsFound) + '개를 찾아 타임머신으로 돌아가요. ' : '부품을 다 찾았으니 타임머신으로 돌아가요. ') + '아지트에서 탐험 모자를 쓸 수 있게 됐어요. 믿음의 점수가 아니라, 다녀온 곳을 기념하는 물건이에요.' })));
    sheetOverlay(kids_, [btn('처음부터', menu, 'plain'), btn('계속 탐험하기', function () {
      overlay.hidden = true; sceneDone = true; state = 'free'; hud.hidden = false; camBtn.hidden = false; dexBtn.hidden = false;
      setObjective(partsFound < PARTS.length ? '남은 부품을 찾아 타임머신으로 돌아가자' : '타임머신으로 돌아가자'); ring.material.opacity = 0.45;
    })]);
  }

  /* ── 입력 ── */
  function zoneLeft(e) { var r = root.getBoundingClientRect(); return (e.clientX - r.left) < r.width * 0.55 && (e.clientY - r.top) > r.height * 0.42; }
  touch.addEventListener('pointerdown', function (e) {
    if (state !== 'explore' && state !== 'free') return;
    var r = root.getBoundingClientRect();
    if (stick.id === null && zoneLeft(e)) {
      stick.id = e.pointerId; stick.bx = e.clientX - r.left; stick.by = e.clientY - r.top;
      base.style.left = stick.bx + 'px'; base.style.top = stick.by + 'px'; base.hidden = false; knob.style.transform = 'translate(-50%,-50%)';
      hint.hidden = true;
    } else if (drag.id === null) { drag.id = e.pointerId; drag.x = e.clientX; }
    try { touch.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
  });
  touch.addEventListener('pointermove', function (e) {
    var r = root.getBoundingClientRect();
    if (e.pointerId === stick.id) {
      var dx = e.clientX - r.left - stick.bx, dy = e.clientY - r.top - stick.by, m = Math.sqrt(dx * dx + dy * dy), R = 52;
      if (m > R) { dx *= R / m; dy *= R / m; }
      stick.x = dx / R; stick.y = -dy / R;
      knob.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
    } else if (e.pointerId === drag.id) { camYaw -= (e.clientX - drag.x) * 0.008; drag.x = e.clientX; lastDrag = now; }
  });
  function up(e) {
    if (e.pointerId === stick.id) { stick.id = null; stick.x = stick.y = 0; base.hidden = true; }
    if (e.pointerId === drag.id) drag.id = null;
  }
  touch.addEventListener('pointerup', up); touch.addEventListener('pointercancel', up);
  window.addEventListener('keydown', function (e) { keys[e.key.toLowerCase()] = true; });
  window.addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });

  /* ── 매 프레임 ── */
  function snapCamera() {
    var p = player ? player.group.position : new T.Vector3(P.start[0], H(P.start[0], P.start[1]), P.start[1]);
    var fx = Math.sin(camYaw), fz = Math.cos(camYaw);
    camPos.set(p.x - fx * camDist, p.y + camPitchH + 1.3, p.z - fz * camDist);
    camLook.set(p.x, p.y + 1.35, p.z); camLookT.copy(camLook);
  }
  function movePlayer(dt) {
    var ix = stick.x, iy = stick.y;
    if (keys.a || keys.arrowleft) ix -= 1; if (keys.d || keys.arrowright) ix += 1;
    if (keys.w || keys.arrowup) iy += 1; if (keys.s || keys.arrowdown) iy -= 1;
    var m = Math.sqrt(ix * ix + iy * iy);
    if (m > 1) { ix /= m; iy /= m; m = 1; }
    pspeed = 0;
    if (m < 0.12) return;
    var fx = Math.sin(camYaw), fz = Math.cos(camYaw), rx = -fz, rz = fx;
    var mx = fx * iy + rx * ix, mz = fz * iy + rz * ix, sp = 4.6 * m;
    var p = player.group.position, nx = p.x + mx / m * sp * dt, nz = p.z + mz / m * sp * dt;
    /* 지켜보는 자리의 경계 */
    var d = dist2(nx, nz, P.bush[0], P.bush[1]);
    if (cur === 'horeb' && d < P.witnessRadius) {
      var k = P.witnessRadius / Math.max(d, 0.001);
      nx = P.bush[0] + (nx - P.bush[0]) * k; nz = P.bush[1] + (nz - P.bush[1]) * k;
      if (now - lastToast > 7) { lastToast = now; ring.material.opacity = 0.45; toast('여기까지만 가자. 우리는 지켜보는 사람이야.', S.ch === 'onwoo' ? 'hyu' : 'onwoo'); }
    }
    if (!WALK(nx, nz)) {
      if (cur === 'jordan' && now - lastToast > 7) { var eg = JL.edge(nx, nz); if (eg !== 'far') { lastToast = now; toast(eg === 'river' ? JD.edgeRiver : JD.edgeCrowd, S.ch === 'onwoo' ? 'hyu' : 'onwoo'); } }
      if (WALK(nx, p.z)) nz = p.z; else if (WALK(p.x, nz)) nx = p.x; else return;
    }
    var moved = dist2(nx, nz, p.x, p.z);
    p.set(nx, H(nx, nz), nz);
    player.group.rotation.y = lerpAngle(player.group.rotation.y, Math.atan2(mx, mz), Math.min(1, dt * 12));
    pspeed = moved / Math.max(dt, 0.001);
    if (!trail.length || dist2(trail[trail.length - 1][0], trail[trail.length - 1][1], nx, nz) > 0.3) { trail.push([nx, nz]); if (trail.length > 80) trail.shift(); }
    if (now - lastDrag > 1.6 && iy > -0.3) camYaw = lerpAngle(camYaw, Math.atan2(mx, mz), Math.min(1, dt * 0.9));
  }
  function moveFollowers(dt) {
    followers.forEach(function (f, k) {
      var idx = trail.length - 1 - 3, tgt = idx >= 0 ? trail[idx] : null, p = f.group.position;
      f.spd = 0;
      if (!tgt) return;
      var hd = player.group.rotation.y, side = k ? 1.3 : -1.3;
      var dx = tgt[0] + Math.cos(hd) * side - p.x, dz = tgt[1] - Math.sin(hd) * side - p.z, d = Math.sqrt(dx * dx + dz * dz);
      if (d < 0.15) return;
      var sp = Math.min(5.2, d * 4), st = Math.min(d, sp * dt);
      p.x += dx / d * st; p.z += dz / d * st; p.y = H(p.x, p.z);
      f.group.rotation.y = lerpAngle(f.group.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 10));
      f.spd = st / Math.max(dt, 0.001);
    });
  }
  function moveMoses(dt) {
    if (!mosesWalking) { if (moses.update) moses.update(dt, false); return; }
    var p = moses.group.position, dx = P.mosesEnd[0] - p.x, dz = P.mosesEnd[1] - p.z, d = Math.sqrt(dx * dx + dz * dz);
    if (d < 0.2) {
      mosesWalking = false; mosesArrived = true;
      moses.group.rotation.y = Math.atan2(P.bush[0] - p.x, P.bush[1] - p.z);
      if (moses.update) moses.update(dt, false);
      return;
    }
    var st = Math.min(d, 2.1 * dt);
    p.x += dx / d * st; p.z += dz / d * st; p.y = H(p.x, p.z);
    moses.group.rotation.y = lerpAngle(moses.group.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 6));
    if (moses.update) moses.update(dt, true);
  }
  function updateCamera(dt) {
    var p = player.group.position, k = 1 - Math.exp(-dt * 6), want = new T.Vector3();
    if (state === 'depart' || state === 'end2') {
      var mp = machine.group.position;
      want.set(P.machine[0] - 4, H(P.machine[0], P.machine[1]) + 3.2, P.machine[1] + 10.5);
      camLookT.set(mp.x, mp.y + 1.4, mp.z); k = 1 - Math.exp(-dt * 3);
    } else if (state === 'event' || state === 'gates' || state === 'end') {
      /* 아이들 어깨 너머로 떨기나무와 모세를 본다 */
      var ax = p.x - P.bush[0], az = p.z - P.bush[1], al = Math.sqrt(ax * ax + az * az) || 1;
      want.set(p.x + ax / al * 3.6 + az / al * 1.5, p.y + 2.5, p.z + az / al * 3.6 - ax / al * 1.5);
      k = 1 - Math.exp(-dt * 2.2);
    } else {
      var fx = Math.sin(camYaw), fz = Math.cos(camYaw);
      want.set(p.x - fx * camDist, p.y + camPitchH + 1.3, p.z - fz * camDist);
      camLookT.set(p.x + fx * 4.5, p.y + 1.75, p.z + fz * 4.5);
    }
    var ground = H(want.x, want.z) + 1.0;
    if (want.y < ground) want.y = ground;
    camPos.lerp(want, k); camLook.lerp(camLookT, k);
    camera.position.copy(camPos); camera.lookAt(camLook);
    /* 자막 창이 열리면 장면을 화면 위쪽으로 올리고, 사건을 볼 때는 당겨 본다 */
    var wantShift = (state === 'event') ? 0.2 : (state === 'caption' ? 0.14 : 0);
    var wantFov = (state === 'event') ? 46 : baseFov;
    if (Math.abs(wantShift - viewShift) > 0.001 || Math.abs(wantFov - camera.fov) > 0.05) {
      viewShift += (wantShift - viewShift) * Math.min(1, dt * 3);
      camera.fov += (wantFov - camera.fov) * Math.min(1, dt * 3);
      var vw = root.clientWidth, vh = root.clientHeight;
      if (viewShift > 0.002) camera.setViewOffset(vw, vh, 0, vh * viewShift, vw, vh); else camera.clearViewOffset();
      camera.updateProjectionMatrix();
    }
  }
  function resize() {
    var w = root.clientWidth, h = root.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; baseFov = w < h ? 62 : 50; camera.fov = baseFov; viewShift = 0; camera.clearViewOffset(); camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  var last = performance.now();
  function frame(t) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, (t - last) / 1000); last = t; now += dt;
    var horeb = cur === 'horeb' || !JL;
    if (horeb) {
      if (bush.update) bush.update(now);
      if (machine.update) machine.update(now);
      sheep.forEach(function (s) { if (s.update) s.update(dt); });
      scraps.forEach(function (s) { if (s.group.visible && s.update) s.update(now); });
    } else JL.update(dt, now);
    if (player) {
      if (state === 'explore' || state === 'free') {
        movePlayer(dt); moveFollowers(dt);
        if (horeb) {
          partObjs.forEach(function (po, pi) {
            if (po.taken) return;
            po.mesh.rotation.y = now * 1.6; po.mesh.position.y = 0.95 + Math.sin(now * 2.2 + pi) * 0.1;
            if (dist2(player.group.position.x, player.group.position.z, PARTS[pi].at[0], PARTS[pi].at[1]) < 1.7) takePart(pi);
          });
          if (state === 'explore') {
            var s = scraps[step], pp = player.group.position;
            if (s && !s.taken && dist2(pp.x, pp.z, s.group.position.x, s.group.position.z) < 1.7) collect(step);
          }
        }
      } else { pspeed = 0; followers.forEach(function (f) { f.spd = 0; }); }
      if (horeb) moveMoses(dt);
      if (player.update) player.update(dt, pspeed);
      followers.forEach(function (f) { if (f.update) f.update(dt, f.spd || 0); });
      if (state === 'depart') updateDepart(dt);
      if (horeb) updateTracker();
      updateCamera(dt);
      var pp2 = player.group.position, sun = horeb ? env.sun : JL.sun;
      if (horeb) sun.position.set(pp2.x - 38, pp2.y + 46, pp2.z + 30); else sun.position.set(pp2.x + 30, pp2.y + 50, pp2.z + 34);
      sun.target.position.copy(pp2);
    } else {
      /* 처음 화면 뒤로 보이는 풍경 */
      var a = now * 0.05;
      camera.position.set(P.start[0] + Math.sin(a) * 9, H(P.start[0], P.start[1]) + 5.5, P.start[1] + 10);
      camera.lookAt(P.bush[0], 6, P.bush[1] - 30);
    }
    if (horeb && bushFx) bushFx.update(now, camera, renderer.domElement.height);
    if (FX && player) FX.audio.setFire(horeb ? dist2(player.group.position.x, player.group.position.z, P.bush[0], P.bush[1]) : 999);
    var rs = horeb ? scene : JL.scene;
    if (post) post.render(rs, camera); else renderer.render(rs, camera);
    if (wantShot) { wantShot = false; if (horeb) takeShot(); else takeClue(); }
  }

  /* 자동 점검용 (화면에는 영향 없음) */
  BO3D.debug = {
    level: function () { return cur; },
    clues: function () { return Object.keys(clue); },
    jordan: function () { return JL ? { P: JL.P, targets: Object.keys(JL.targets).map(function (k) { var v = JL.targets[k].pos(); return [k, v.x, v.y, v.z]; }) } : null; },
    parts: function () { return { found: partsFound, at: PARTS.map(function (p) { return p.at; }), done: sceneDone }; },
    dex: function () { return Object.keys(dex); },
    state: function () { return { state: state, step: step, x: player && player.group.position.x, z: player && player.group.position.z, mosesArrived: mosesArrived }; },
    stick: function (x, y) { stick.x = x; stick.y = y; },
    yaw: function (v) { camYaw = v; lastDrag = now + 999; },
    goto: function (x, z) { player.group.position.set(x, H(x, z), z); trail.push([x, z]); }
  };

  resize(); menu(); requestAnimationFrame(frame);
})();
