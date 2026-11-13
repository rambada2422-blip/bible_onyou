/* 성경 탐험대 3D 샘플 — 떨기나무 장면 하나.
 * 주인공을 직접 움직여 탐험하고, 말씀 조각 3개를 모으고, 사건을 지켜본 뒤 관문을 지난다.
 * 대본은 2D 시범판과 같은 web/js/content.js(독립 검증을 거친 문장)를 그대로 쓴다.
 */
(function () {
  'use strict';
  var T = THREE, C = BO.content, IC = BO.icons, W = BO3D.world, M = BO3D.models || {}, AV = BO3D.avatars || {}, FX = BO3D.fx || null;
  var P = W.P, SC = C.scenes['EX-01'];
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
    return ref.replace(/^출 /, '출애굽기 ').replace(/^창 /, '창세기 ').replace(/(\d+):/, '$1장 ').replace(/$/, '절');
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

  function place(obj, x, z, lift) { obj.position.set(x, W.height(x, z) + (lift || 0), z); return obj; }

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
    ['choeon', 'hyu', 'onwoo'].forEach(function (k) { if (kids[k]) scene.remove(kids[k].group); kids[k] = mkKid(k); scene.add(kids[k].group); });
    player = kids[S.ch];
    followers = ['choeon', 'hyu', 'onwoo'].filter(function (k) { return k !== S.ch; }).map(function (k) { return kids[k]; });
    place(player.group, P.start[0], P.start[1]);
    player.group.rotation.y = Math.PI;
    followers.forEach(function (f, i) { place(f.group, P.start[0] + (i ? 1.5 : -1.5), P.start[1] + 0.5); f.group.rotation.y = Math.PI; f.spd = 0; });
    trail = [];
    if (FX) FX.sortLayers(scene);
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
  var hud = el('div', { class: 'hud3 pad', hidden: '' },
    el('div', { class: 'row' }, place_, refChip(SC.ref, true), count),
    el('div', { class: 'obj' }, icon('compass'), objText));
  var knob = el('i', {}), base = el('div', { class: 'stick', hidden: '' }, knob);
  var hint = el('div', { class: 'hint', hidden: '' }, '왼쪽 아래를 누른 채 밀면 걸어요. 오른쪽을 밀면 둘러봐요.');
  var toastEl = el('div', { class: 'toast3', hidden: '' });
  var panelBody = el('div', { class: 'sheet-body pad' }), panelFoot = el('div', { class: 'sheet-foot pad' });
  var panel = el('div', { class: 'panel3 sheet', hidden: '' }, panelBody, panelFoot);
  var overlay = el('div', { class: 'overlay3', hidden: '' });
  var touch = el('div', { class: 'touch3' });
  var snd = el('button', { class: 'snd3', hidden: '', 'aria-label': '소리 끄기', 'aria-pressed': 'false', on: { click: function () {
    var m = !FX.audio.isMuted(); FX.audio.mute(m); snd.setAttribute('aria-pressed', String(m)); snd.setAttribute('aria-label', m ? '소리 켜기' : '소리 끄기');
  } } }, icon('speaker'));
  add(ui, [touch, hud, base, hint, toastEl, snd, panel, overlay]);

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

  /* ── 처음 화면 ── */
  function menu() {
    state = 'menu'; hud.hidden = true; hidePanel(); base.hidden = true; snd.hidden = true;
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
      btn('탐험 시작', function () { S.tier = tier; S.ch = ch; begin(); }, 'wide'),
      el('p', { class: 'fine', text: '감수 전 샘플입니다. 그래픽은 단순한 3D이며, 탐험하는 구조를 확인하기 위한 것입니다.' }));
    overlay.hidden = false;
  }

  function begin() {
    root.className = 'g3 app ' + S.tier;
    overlay.hidden = true;
    if (FX) { FX.audio.start(); FX.audio.pad(false); snd.hidden = false; }
    spawnKids();
    step = 0; mosesWalking = false; mosesArrived = false; evIdx = 2;
    place(moses.group, P.mosesStart[0], P.mosesStart[1]); moses.group.rotation.y = Math.PI * 0.8;
    if (moses.setPose) moses.setPose('approach');
    scraps.forEach(function (s, i) { s.group.visible = i === 0; s.taken = false; });
    ring.material.opacity = 0;
    if (hat) { hat.parent && hat.parent.remove(hat); }
    camYaw = Math.PI; snapCamera();
    count.textContent = '말씀 조각 0 / 3';
    setObjective(OBJ[0]); hud.hidden = false; hint.hidden = false;
    setTimeout(function () { hint.hidden = true; }, 7000);
    state = 'explore';
    toast('타임머신이 도착했어. 저기 빛나는 곳부터 가 보자!', followers.length ? keyOf(followers[0]) : null);
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
    state = 'event'; hud.hidden = true; hint.hidden = true;
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
    if (b.focus === 'moses') camLookT.set(mx * 0.75 + bx * 0.25, W.height(mx, mz) + 1.3, mz * 0.75 + bz * 0.25);
    else camLookT.set(bx * 0.7 + mx * 0.3, W.height(bx, bz) + 1.2, bz * 0.7 + mz * 0.3);
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
    state = 'gates'; hidePanel();
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
    kids_.push(el('div', { class: 'closebox reward3' }, el('h3', { text: '탐험대 꾸미기' }), el('p', { text: '첫 장면을 끝까지 탐험해서 탐험 모자를 얻었어요. 믿음의 점수가 아니라, 다녀온 곳을 기념하는 물건이에요.' })));
    sheetOverlay(kids_, [btn('처음부터', menu, 'plain'), btn('모자 쓰고 더 둘러보기', function () {
      overlay.hidden = true; wearHat(); state = 'free'; hud.hidden = false; setObjective('자유롭게 둘러보세요'); ring.material.opacity = 0.45;
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
    var p = player ? player.group.position : new T.Vector3(P.start[0], W.height(P.start[0], P.start[1]), P.start[1]);
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
    if (d < P.witnessRadius) {
      var k = P.witnessRadius / Math.max(d, 0.001);
      nx = P.bush[0] + (nx - P.bush[0]) * k; nz = P.bush[1] + (nz - P.bush[1]) * k;
      if (now - lastToast > 7) { lastToast = now; ring.material.opacity = 0.45; toast('여기까지만 가자. 우리는 지켜보는 사람이야.', S.ch === 'onwoo' ? 'hyu' : 'onwoo'); }
    }
    if (!W.walkable(nx, nz)) { if (W.walkable(nx, p.z)) nz = p.z; else if (W.walkable(p.x, nz)) nx = p.x; else return; }
    var moved = dist2(nx, nz, p.x, p.z);
    p.set(nx, W.height(nx, nz), nz);
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
      p.x += dx / d * st; p.z += dz / d * st; p.y = W.height(p.x, p.z);
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
    p.x += dx / d * st; p.z += dz / d * st; p.y = W.height(p.x, p.z);
    moses.group.rotation.y = lerpAngle(moses.group.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 6));
    if (moses.update) moses.update(dt, true);
  }
  function updateCamera(dt) {
    var p = player.group.position, k = 1 - Math.exp(-dt * 6), want = new T.Vector3();
    if (state === 'event' || state === 'gates' || state === 'end') {
      /* 아이들 어깨 너머로 떨기나무와 모세를 본다 */
      var ax = p.x - P.bush[0], az = p.z - P.bush[1], al = Math.sqrt(ax * ax + az * az) || 1;
      want.set(p.x + ax / al * 3.6 + az / al * 1.5, p.y + 2.5, p.z + az / al * 3.6 - ax / al * 1.5);
      k = 1 - Math.exp(-dt * 2.2);
    } else {
      var fx = Math.sin(camYaw), fz = Math.cos(camYaw);
      want.set(p.x - fx * camDist, p.y + camPitchH + 1.3, p.z - fz * camDist);
      camLookT.set(p.x + fx * 4.5, p.y + 1.75, p.z + fz * 4.5);
    }
    var ground = W.height(want.x, want.z) + 1.0;
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
    if (bush.update) bush.update(now);
    if (machine.update) machine.update(now);
    sheep.forEach(function (s) { if (s.update) s.update(dt); });
    scraps.forEach(function (s) { if (s.group.visible && s.update) s.update(now); });
    if (player) {
      if (state === 'explore' || state === 'free') {
        movePlayer(dt); moveFollowers(dt);
        if (state === 'explore') {
          var s = scraps[step], pp = player.group.position;
          if (s && !s.taken && dist2(pp.x, pp.z, s.group.position.x, s.group.position.z) < 1.7) collect(step);
        }
      } else { pspeed = 0; followers.forEach(function (f) { f.spd = 0; }); }
      moveMoses(dt);
      if (player.update) player.update(dt, pspeed);
      followers.forEach(function (f) { if (f.update) f.update(dt, f.spd || 0); });
      updateCamera(dt);
      var pp2 = player.group.position;
      env.sun.position.set(pp2.x - 38, pp2.y + 46, pp2.z + 30); env.sun.target.position.copy(pp2);
    } else {
      /* 처음 화면 뒤로 보이는 풍경 */
      var a = now * 0.05;
      camera.position.set(P.start[0] + Math.sin(a) * 9, W.height(P.start[0], P.start[1]) + 5.5, P.start[1] + 10);
      camera.lookAt(P.bush[0], 6, P.bush[1] - 30);
    }
    if (bushFx) bushFx.update(now, camera, renderer.domElement.height);
    if (FX && player) FX.audio.setFire(dist2(player.group.position.x, player.group.position.z, P.bush[0], P.bush[1]));
    if (post) post.render(scene, camera); else renderer.render(scene, camera);
  }

  /* 자동 점검용 (화면에는 영향 없음) */
  BO3D.debug = {
    state: function () { return { state: state, step: step, x: player && player.group.position.x, z: player && player.group.position.z, mosesArrived: mosesArrived }; },
    stick: function (x, y) { stick.x = x; stick.y = y; },
    yaw: function (v) { camYaw = v; lastDrag = now + 999; },
    goto: function (x, z) { player.group.position.set(x, W.height(x, z), z); trail.push([x, z]); }
  };

  resize(); menu(); requestAnimationFrame(frame);
})();
