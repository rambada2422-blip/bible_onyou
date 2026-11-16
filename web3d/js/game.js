/* 성경 탐험대 3D 장면 틀.
 * 주인공을 직접 움직여 탐험하고, 재료 3개를 모으고(탐험대 이야기), 사건을 지켜본 뒤 관문을 지난다.
 * 장면마다 다른 것(지형, 인물, 소품, 재료 3곳, 지켜보는 자리, 카메라)은 장면 설정 파일에 있다: BO3D.scene3d['OT-NN'] (예: scene_horeb.js).
 * 대본(대목, 관문, 물음, 임무)은 content/ot/OT-NN.json(web3d/js/otdata.js로 묶임). 요단 강 시대 추리(jordan.js)는 따로 돈다.
 */
(function () {
  'use strict';
  var T = THREE, C = BO.content, IC = BO.icons, M = BO3D.models || {}, FX = BO3D.fx || null;
  var C3 = BO.content3d || null, JD = C3 ? C3.jordan : null, ALT = C.scenes['ALT-02'];
  /* 지금 있는 곳: 'scene'(장면 틀로 만든 3D 장면, SCN) 또는 'jordan'(요단 강 시대 추리). 높이와 걸을 수 있는 곳은 장소마다 다르다. */
  var cur = 'scene', JL = null, SCN = null, P = null, SC = null;
  /* 장면 배경음악(bgm.js·bgmplan.js, 2026-11-16). play는 표에 지금 장면의 그 칸이 있으면 틀고 true, 없으면 false(예전 소리 그대로) */
  function BGM(fn, arg) {
    var b = BO3D.bgm, p = BO3D.bgmPlan; if (!b) return false;
    try {
      if (fn !== 'play') { b[fn](arg); return true; }
      if (!p || !SCN || !p[SCN.id] || !p[SCN.id][arg]) return false;
      b.play(SCN.id, arg); return true;
    } catch (e) { return false; }
  }
  function H(x, z) { return cur === 'jordan' && JL ? JL.height(x, z) : SCN.height(x, z); }
  function WALK(x, z) { return cur === 'jordan' && JL ? JL.walkable(x, z) : SCN.walkable(x, z); }
  /* 화면 부품은 web3d/js/ui.js에 모았다(이야기 카드 장면과 함께 쓴다). 나이 단계와 고른 아이는 BO3D.S */
  var U = BO3D.ui, S = U.S;
  var root = document.getElementById('game'), canvas = document.getElementById('c'), ui = document.getElementById('ui');

  /* ── 작은 도구 ── */
  var el = U.el, add = U.add, tx = U.tx, icon = U.icon, refChip = U.refChip, avatar = U.avatar, bookName = U.bookName;
  var goodNote = U.goodNote, lookNote = U.lookNote, choiceBlock = U.choiceBlock, findBlock = U.findBlock, findrefBlock = U.findrefBlock, orderBlock = U.orderBlock, blockFor = U.blockFor;
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
  /* 탐험대 장비 단계(growth.js). 장면을 시작할 때 정하고, 끝 카드에서 저장이 끝난 뒤에만 바뀐다 */
  var gearStage = 0;
  function GW() { return BO3D.growth || null; }
  function mkKid(key) {
    try { if (M.kid) return M.kid(key, { gear: gearStage }); } catch (e) { console.error('model kid', e); }
    return { group: fallback(C.chars[key].color, { choeon: 1.35, hyu: 1.55, onwoo: 1.72 }[key], 0.24), update: function () {} };
  }

  /* ── 장면 구성 ── */
  var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!window.BO3D_TEST });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  var camera = new T.PerspectiveCamera(58, 1, 0.3, 700);
  camera.layers.enable(1); camera.layers.enable(2);
  var post = FX ? new FX.Post(renderer) : null;
  var scene = null, env = null; /* 지금 장면의 THREE.Scene과 해 (useScene이 바꾼다) */

  function place(obj, x, z, lift) { obj.position.set(x, H(x, z) + (lift || 0), z); return obj; }

  /* Blender로 만든 인물(뼈대와 동작이 있는 GLB)을 읽는다. 동작: Idle, Walk, 그리고 장면마다 한 번만 하는 동작(once: {클립 이름: 자세 이름}).
     읽기가 끝나면 cb({group, key, setPose(name), update(dt, moving)}). 없으면 부르지 않는다(장면은 대체 모형으로 돈다). */
  /* 성경 인물 공통 목록(빛 규칙 R5): person()과 swapGlb()로 만든 인물을 모두 올린다. 장면마다 요청한 수(FIGREQ)보다 덜 올라오면 빛을 끈다 */
  var FIGS = [], FIGREQ = {}, buildingId = null;
  function figure(sid, holder) { if (!sid || !holder) return; for (var i = 0; i < FIGS.length; i++) if (FIGS[i].h === holder) return; FIGS.push({ sid: sid, h: holder }); }
  function person(key, cb, opts) {
    opts = opts || {};
    var sid = buildingId, cb0 = cb; if (sid) FIGREQ[sid] = (FIGREQ[sid] || 0) + 1;
    cb = function (o) { figure(sid, o); cb0(o); };
    loadGlb(key, function (gltf) {
      var g = gltf.scene, mixer = new T.AnimationMixer(g), act = {}, curA = null, pose = 'idle', once = opts.once || {}, byPose = {};
      g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
      gltf.animations.forEach(function (c) { act[c.name] = mixer.clipAction(c); });
      if (!act.Idle) { var first = gltf.animations[0]; if (!first) return; act.Idle = mixer.clipAction(first); }
      Object.keys(once).forEach(function (clip) { if (act[clip]) { act[clip].setLoop(T.LoopOnce, 1); act[clip].clampWhenFinished = true; byPose[once[clip]] = clip; } });
      function play(name, fade) {
        var a = act[name]; if (!a || a === curA) return;
        a.reset(); a.play();
        if (curA) curA.crossFadeTo(a, fade, false);
        curA = a;
      }
      play('Idle', 0); mixer.update(0); /* 시작 화면에서는 동작 갱신이 없으므로, 팔 벌린 기본 자세가 보이지 않게 Idle 첫 자세를 바로 적용한다 */
      cb({
        group: g, key: key,
        setPose: function (name) { pose = name; play(byPose[name] || 'Idle', 0.35); },
        update: function (dt, moving) { if (!byPose[pose]) play(moving && act.Walk ? 'Walk' : 'Idle', 0.25); mixer.update(dt); }
      });
      if (FX) FX.sortLayers(g);
    });
  }
  var shakeT = 0, shakeDur = 1, shakeAmp = 0, calm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var api = { T: T, M: M, FX: FX, mk: mk, fallback: fallback, person: person, shake: function (amp, sec) { if (calm) return; shakeAmp = amp; shakeDur = shakeT = sec || 1; }, loadGlb: function (k, cb) { loadGlb(k, cb); }, now: function () { return now; }, camera: function () { return camera; } };

  /* 장면 만들기: 장면 설정(BO3D.scene3d[id])이 지형·인물·소품을 만들고, 틀이 타임머신·재료·도감을 더한다. 한 번 만든 장면은 다시 쓴다. */
  var built = {}, machine = null, PARTS = [], partObjs = [], DEX = [], machineY = 0, departGlow = null;
  function otData(id) {
    var d = BO3D.ot && BO3D.ot.scenes[id];
    if (d) return d;
    if (id === 'OT-09') { var ex = C.scenes['EX-01'], o = {}, k; for (k in ex) o[k] = ex[k]; o.id = 'OT-09'; o.quests = C3 && C3.horeb ? C3.horeb.quests : []; return o; }
    return null;
  }
  function buildScene(id) {
    if (built[id]) return built[id];
    buildingId = id; var rt = BO3D.scene3d[id](api), sv = SCN, svc = cur; buildingId = null; SCN = rt; cur = 'scene';
    rt.data = otData(id);
    var mats = (rt.data.mission && rt.data.mission.materials) || [], qs = rt.data.quests || rt.quests || [];
    rt.PARTS = qs.map(function (q, i) {
      var m = mats[i];
      return { id: q.part, name: m ? m.name : q.name, at: rt.P.parts[i], line: m ? m.line : q.line, q: q, mat: m || null };
    });
    rt.machine = mk('timeMachine', null, function () { return { group: fallback('#D9A441', 2.4, 0.9), update: function () {} }; });
    rt.scene.add(place(rt.machine.group, rt.P.machine[0], rt.P.machine[1]));
    rt.machine.group.rotation.y = rt.P.machineRot || 0;
    rt.machineY = rt.machine.group.position.y;
    rt.partObjs = rt.PARTS.map(function (p, i) {
      var grp = new T.Group(), mesh = p.mat ? matMesh(p.mat) : partMesh(p.id);
      mesh.position.y = 0.95; grp.add(mesh);
      var beam = new T.Mesh(new T.CylinderGeometry(0.05, 0.22, 5, 8, 1, true), new T.MeshBasicMaterial({ color: '#8FE3DA', transparent: true, opacity: 0.16, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false }));
      beam.position.y = 2.7; if (FX) beam.layers.set(FX.GLOW); grp.add(beam);
      place(grp, p.at[0], p.at[1]); rt.scene.add(grp);
      if (rt.partRocks && M.rock && i < 2) { var rk = M.rock(40 + i); rk.scale.multiplyScalar(1.7); place(rk, p.at[0] + 1.5, p.at[1] - 1.1, -0.05); rt.scene.add(rk); }
      return { group: grp, mesh: mesh, taken: false };
    });
    rt.departGlow = makeGlow(); rt.departGlow.position.y = 1.3; if (FX) rt.departGlow.layers.set(FX.GLOW); rt.machine.group.add(rt.departGlow);
    rt.DEX = (rt.dex || []).concat([{ id: 'machine', name: '타임머신', desc: '탐험대가 타고 온 놋쇠 타임머신. 성경에 나오는 물건은 아니다', ref: null, hint: '처음 도착한 자리에 서 있어요.', range: 17,
      pos: function () { return new T.Vector3(rt.P.machine[0], rt.height(rt.P.machine[0], rt.P.machine[1]) + 1.3, rt.P.machine[1]); } }]);
    if (FX) FX.sortLayers(rt.scene);
    built[id] = rt; SCN = sv || rt; cur = svc;
    return rt;
  }
  function useScene(id) {
    var rt = buildScene(id);
    SCN = rt; cur = 'scene'; scene = rt.scene; env = { sun: rt.sun }; P = rt.P; SC = rt.data; if (U.setScene) U.setScene(SC);
    machine = rt.machine; PARTS = rt.PARTS; partObjs = rt.partObjs; DEX = rt.DEX; machineY = rt.machineY; departGlow = rt.departGlow;
    dex = rt.dexShots = rt.dexShots || {};
    return rt;
  }

  var kids = {}, player = null, followers = [];
  function spawnKids() {
    var sc = cur === 'jordan' ? JL.scene : scene, st = cur === 'jordan' ? JL.P.start : P.start;
    ['choeon', 'hyu', 'onwoo'].forEach(function (k) {
      if (kids[k] && kids[k].group.parent) kids[k].group.parent.remove(kids[k].group);
      kids[k] = mkKid(k); sc.add(kids[k].group);
    });
    ['choeon', 'hyu', 'onwoo'].forEach(function (k) { if (kids[k].wrist) { kids[k].glow = wristGlow(); kids[k].wrist.add(kids[k].glow); } });
    player = kids[S.ch];
    followers = ['choeon', 'hyu', 'onwoo'].filter(function (k) { return k !== S.ch; }).map(function (k) { return kids[k]; });
    place(player.group, st[0], st[1]);
    player.group.rotation.y = Math.PI;
    followers.forEach(function (f, i) { place(f.group, st[0] + (i ? 1.5 : -1.5), st[1] + 0.5); f.group.rotation.y = Math.PI; f.spd = 0; });
    trail = [];
    if (FX) FX.sortLayers(sc);
  }

  /* ── 상태 ── */
  var state = 'menu';         /* menu | caption | quiz | explore | lookup | event | gates | end | free | den | depart */
  var quest = 0, questOpen = false; /* 지금 찾는 부품 번호, 탐지기 물음을 풀었는가 */
  var camYaw = Math.PI, camPitchH = 1.45, camDist = 7.4, lastDrag = -9, now = 0;
  var camPos = new T.Vector3(), camLook = new T.Vector3(), camLookT = new T.Vector3();
  var stick = { x: 0, y: 0, id: null, bx: 0, by: 0 }, drag = { id: null, x: 0 }, keys = {};
  var trail = [], afterVision = false, lastToast = -9, evIdx = 2, pspeed = 0, lookT = 0;
  var baseFov = 62, viewShift = 0;

  /* ── 화면 위 UI ── */
  var place_ = el('span', { class: 'place', text: '' });
  /* 성능 확인용: 장소 이름을 세 번 빠르게 누르면(또는 주소 끝에 #fps) 화면 왼쪽 아래에 초당 장면 수가 나온다 */
  var fpsEl = el('div', { class: 'fps3', hidden: '' }), fpsOn = /fps/.test(location.hash), fpsN = 0, fpsT = 0, taps = [];
  if (fpsOn) fpsEl.hidden = false;
  place_.addEventListener('click', function () { var t = performance.now(); taps = taps.filter(function (x) { return t - x < 1500; }); taps.push(t); if (taps.length >= 3) { taps = []; fpsOn = !fpsOn; fpsEl.hidden = !fpsOn; } });
  var objText = el('span', { text: '' });
  var partCount = el('span', { class: 'count teal', text: '부품 0 / 3' });
  var trackArrow = el('i', {}, icon('arrow')), trackText = el('span', { text: '' });
  /* 손목 탐지기(3단계) 도감 탐지: 아직 사진에 담지 않은 도감 대상이 사진 거리 안에 있으면 알린다. 부품 안내(아래 track)는 모두에게 그대로 */
  var dexDetArrow = el('i', {}, icon('arrow')), dexDetText = el('span', { text: '' }), dexDet = el('div', { class: 'dexdet3', hidden: '' }, dexDetArrow, dexDetText), dexDetT = 0;
  var track = el('button', { class: 'track3', hidden: '', on: { click: function () { if (!questOpen && (state === 'explore')) openQuiz(); } } }, trackArrow, trackText);
  var hudRef = refChip('', true), clueCount = el('span', { class: 'count teal', hidden: '', text: '단서 0 / 5' });
  var hud = el('div', { class: 'hud3 pad', hidden: '' },
    el('div', { class: 'row' }, place_, hudRef),
    el('div', { class: 'row' }, partCount, clueCount),
    el('div', { class: 'obj' }, icon('compass'), objText), track, dexDet);
  var knob = el('i', {}), base = el('div', { class: 'stick', hidden: '' }, knob);
  var hint = el('div', { class: 'hint', hidden: '' }, '왼쪽 아래를 누른 채 밀면 걸어요. 오른쪽을 밀면 둘러봐요. 사진기 버튼으로 본 것을 찍어 도감에 담아요.');
  var toastEl = el('div', { class: 'toast3', hidden: '' });
  var panelBody = el('div', { class: 'sheet-body pad' }), panelFoot = el('div', { class: 'sheet-foot pad' });
  var panel = el('div', { class: 'panel3 sheet', hidden: '' }, panelBody, panelFoot);
  var overlay = el('div', { class: 'overlay3', hidden: '' });
  var touch = el('div', { class: 'touch3' });
  var snd = el('button', { class: 'snd3', hidden: '', 'aria-label': '소리 끄기', 'aria-pressed': 'false', on: { click: function () {
    var m = !FX.audio.isMuted(); FX.audio.mute(m); BGM('mute', m); snd.setAttribute('aria-pressed', String(m)); snd.setAttribute('aria-label', m ? '소리 켜기' : '소리 끄기');
  } } }, icon('speaker'));
  var dexLabel = el('span', { text: '도감 0 / 5' });
  var dexBtn = el('button', { class: 'dex3', hidden: '', on: { click: function () { if (cur === 'jordan') openClues(); else openDex(); } } }, icon('journal'), dexLabel);
  var camBtn = el('button', { class: 'cam3', hidden: '', 'aria-label': '사진 찍기', on: { click: function () { wantShot = true; } } }, icon('camera'));
  var flash = el('div', { class: 'flash3', hidden: '' });
  var denBtn = el('button', { class: 'den3', hidden: '', on: { click: function () { openDen(); } } }, '타임머신에 타기');
  var dedBtn = el('button', { class: 'den3', hidden: '', on: { click: function () { startDeduce(); } } }, '추리하기');
  add(ui, [touch, hud, base, hint, toastEl, dexBtn, camBtn, denBtn, dedBtn, snd, flash, panel, overlay, fpsEl]);

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
      b.open ? el('div', { class: 'openbible' }, icon('book'), el('span', {}, '하나님이 하신 말씀은 성경책에서 직접 읽어요. ', el('b', { text: bookName(U.openFor ? U.openFor(b, U.S.tier) : b.open) }))) : null
    ];
  }


  /* ── 사진과 탐험 도감 ──
   * 세 아이는 목격자다. 본 것을 사진으로 담아 도감을 채운다. 설명은 본문에 있는 사실만 적는다. */
  /* 도감에 담을 것은 장면 설정의 dex와 타임머신이다(buildScene) */
  var dex = {}, wantShot = false;
  function dexCount() { return Object.keys(dex).length; }
  function updateDexBtn() { dexLabel.textContent = '도감 ' + dexCount() + ' / ' + DEX.length; }
  function takeShot() {
    var cw = canvas.width, ch = canvas.height, found = [], best = null;
    DEX.forEach(function (d) {
      if (d.visible && !d.visible()) return;
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
  var partsFound = 0, sceneDone = false, flagColor = null, hatOn = false, flag = null, departT = 0;
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
      /* 나사: 납작한 머리, 홈, 나선 홈이 팬 몸통 */
      m = new T.Mesh(new T.CylinderGeometry(0.17, 0.15, 0.08, 14), brass); m.position.y = 0.22; g.add(m);
      m = new T.Mesh(new T.BoxGeometry(0.26, 0.03, 0.045), new T.MeshStandardMaterial({ color: '#5E4A22', flatShading: true })); m.position.y = 0.265; g.add(m);
      m = new T.Mesh(new T.CylinderGeometry(0.065, 0.065, 0.36, 10), brass); m.position.y = 0.0; g.add(m);
      for (i = 0; i < 5; i++) { m = new T.Mesh(new T.TorusGeometry(0.07, 0.016, 4, 12), brass); m.rotation.x = Math.PI / 2 + 0.18; m.position.y = -0.14 + i * 0.07; g.add(m); }
      m = new T.Mesh(new T.ConeGeometry(0.065, 0.12, 10), brass); m.rotation.x = Math.PI; m.position.y = -0.24; g.add(m);
      g.rotation.z = 0.5;
    }
    g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
    return g;
  }
  /* 재료(탐험대 이야기)를 바닥에 놓인 작은 물건으로 보여 준다. 이름에 따라 모양만 고른다 */
  function matMesh(m) {
    var g = new T.Group(), nm = (m.name || '') + ' ' + (m.key || ''), mat, i, o;
    function std(c) { return new T.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.85 }); }
    if (/돌|stone|pebble|rock/.test(nm)) { o = new T.Mesh(new T.DodecahedronGeometry(0.2, 0), std('#A8A090')); o.scale.set(1.2, 0.8, 1); g.add(o); }
    else if (/털|wool|깃|feather/.test(nm)) { mat = std(/깃|feather/.test(nm) ? '#3A3A44' : '#F2EBDD'); for (i = 0; i < 5; i++) { o = new T.Mesh(new T.IcosahedronGeometry(0.1 + (i % 2) * 0.03, 0), mat); o.position.set(Math.cos(i * 1.3) * 0.11, Math.sin(i * 2.1) * 0.05, Math.sin(i * 1.3) * 0.11); g.add(o); } }
    else if (/뿔|horn/.test(nm)) { o = new T.Mesh(new T.ConeGeometry(0.07, 0.42, 7), std('#D8C7A0')); o.rotation.z = 1.1; g.add(o); }
    else if (/갈대|풀|짚|이삭|reed|straw|grass|stalk/.test(nm)) { mat = std('#C9B46A'); for (i = 0; i < 5; i++) { o = new T.Mesh(new T.CylinderGeometry(0.015, 0.015, 0.5, 4), mat); o.rotation.z = 1.3 + i * 0.06; o.position.y = i * 0.02; g.add(o); } }
    else if (/가지|나무|막대|장작|stick|twig|branch|wood|bark/.test(nm)) { o = new T.Mesh(new T.CylinderGeometry(0.03, 0.04, 0.5, 5), std('#7A5232')); o.rotation.z = 1.4; g.add(o); o = new T.Mesh(new T.CylinderGeometry(0.015, 0.02, 0.18, 4), std('#7A5232')); o.position.set(0.08, 0.06, 0); o.rotation.z = 0.6; g.add(o); }
    else if (/벽돌|조각|brick|shard|tile|그릇|potsherd/.test(nm)) { o = new T.Mesh(new T.BoxGeometry(0.3, 0.1, 0.18), std('#B5673E')); o.rotation.y = 0.4; g.add(o); }
    else if (/흙|모래|진흙|clay|soil|sand|dust/.test(nm)) { o = new T.Mesh(new T.SphereGeometry(0.17, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), std('#8A6A44')); g.add(o); }
    else if (/줄|끈|실|천|가죽|rope|cord|thread|cloth|leather/.test(nm)) { o = new T.Mesh(new T.TorusGeometry(0.13, 0.04, 5, 12), std('#B89A6A')); o.rotation.x = 1.3; g.add(o); }
    else if (/씨|열매|seed|fruit|grain|nut/.test(nm)) { mat = std('#7A5A2A'); for (i = 0; i < 6; i++) { o = new T.Mesh(new T.SphereGeometry(0.05, 6, 4), mat); o.position.set(Math.cos(i) * 0.09, (i % 2) * 0.04, Math.sin(i) * 0.09); g.add(o); } }
    else { o = new T.Mesh(new T.DodecahedronGeometry(0.16, 0), std('#C9A769')); g.add(o); }
    g.traverse(function (x) { if (x.isMesh) x.castShadow = true; });
    return g;
  }
  function takePart(i) {
    var po = partObjs[i]; po.taken = true; po.group.visible = false; partsFound++;
    partCount.textContent = partWord() + ' ' + partsFound + ' / ' + PARTS.length;
    partCount.classList.remove('pulse'); void partCount.offsetWidth; partCount.classList.add('pulse');
    if (FX) FX.audio.chime();
    questOpen = false; track.hidden = true;
    var pm = PARTS[i].mat;
    if (pm && BO3D.story) BO3D.story.take(SCN.id, pm.key);
    if (i < PARTS.length - 1) {
      /* 재료를 주운 자리에서 본 것: 장면 설정이 정한 대목을 보여 준다 */
      state = 'caption';
      if (SCN.partFound) SCN.partFound(i);
      var bi = SCN.partBeats ? SCN.partBeats[i] : null;
      showPanel([el('div', { class: 'q-kicker', text: (pm ? '재료 ' : '부품 ') + partsFound + ' / ' + PARTS.length + ' · ' + PARTS[i].name }),
        el('div', { class: 'say' }, avatar(S.ch), el('div', { class: 'bubble' }, el('b', { text: C.chars[S.ch].name, style: 'color:' + C.chars[S.ch].color }), PARTS[i].line)),
        pm ? matNote(pm) : null,
        bi !== null && bi !== undefined && SC.beats[bi] ? [el('div', { class: 'q-kicker', text: '지켜보기' }), storyNote(SCN.beatNote ? SCN.beatNote(bi) : null), beatNodes(SC.beats[bi])] : null],
        btn('계속 탐험하기', function () {
          hidePanel();
          if (SCN.partContinue) SCN.partContinue(i);
          var go2 = function () { quest = i + 1; openQuiz(); };
          if (bi !== null && bi !== undefined && hasHelp(bi)) seg('help:' + bi, go2); else go2();   /* 이 대목 뒤의 현장 돕기(규칙서 13.6) */
        }));
    } else { if (SCN.partFound) SCN.partFound(i); startLookup(); }
  }
  /* 대목 앞에 붙이는 탐험대 이야기 한 줄(예: 그 앞의 일을 타임머신 창으로 봄). 재료를 주울 때 보여 주는 대목에도 쓴다 */
  function storyNote(t) { return t ? el('div', { class: 'note story3' }, el('span', {}, el('small', { text: '탐험대 이야기' }), el('b', { text: t }))) : null; }
  function partWord() { return PARTS.length && PARTS[0].mat ? '재료' : '부품'; }
  /* 재료를 얻었을 때 최현 박사의 통신(탐험대 이야기) */
  function matNote(m) {
    return el('div', { class: 'note story3 found3' }, icon('compass'), el('span', {}, el('small', { text: '탐험대 이야기 · 최현 박사' }), el('b', { text: m.use })));
  }
  /* ── 부품 탐지기 물음: 이 시대의 성경 이야기로 답하면, 답에 나오는 곳을 가리킨다 ── */
  function companion(pref) { return pref && pref !== S.ch ? pref : (followers.length ? keyOf(followers[0]) : null); }
  /* 잘못 골랐을 때 보여 주는 장절: 8~10세는 장까지, 11~13세는 장절, 14~19세는 장절 없이 주제만 (규칙서 5절) */
  function quizTier(q) { return U.quizTier(q, SCN.lookText); }
  function openQuiz() {
    var Q = PARTS[quest].q, q = Q.q[S.tier] || Q.q.t2;
    state = 'quiz'; stick.x = stick.y = 0; stick.id = null; base.hidden = true; track.hidden = true;
    var who = companion(Q.say && Q.say.who), go = btn('찾으러 가기', function () {
      overlay.hidden = true; questOpen = true; state = 'explore';
      setObjective(Q.found);
      if (Q.say && who) toast(Q.say.text, who);
    }, 'wide');
    go.disabled = true;
    var foundBox = el('div', {});
    /* 탐지기는 탐험대 이야기, 물음은 성경 물음이다. 성경 찾기 안내는 나이 단계에 따라 (규칙서 5절) */
    var where = S.tier === 't1' ? U.chapterOf(q.ref || SC.ref) : (S.tier === 't2' ? bookName(q.ref || SC.ref) : U.bookOf(SC.ref) + '에서 찾아보세요');
    sheetOverlay([el('div', { class: 'eyebrow', text: '탐험대 이야기' }),
      el('div', { class: 'q-kicker', text: SCN.detector + ' ' + (quest + 1) + ' / ' + PARTS.length + ' · ' + PARTS[quest].name }),
      el('div', { class: 'bibleq3' }, icon('bookline'), el('span', { text: '성경 물음 · ' + where })),
      blockFor(quizTier(q), function () {
        go.disabled = false;
        foundBox.replaceChildren();
        add(foundBox, [
          q.after ? el('div', { class: 'note good fadein' }, el('b', { text: q.after }), refChip(q.ref || SC.ref)) : null,
          el('div', { class: 'note story3 found3 fadein' }, icon('compass'), el('span', {}, el('small', { text: '탐험대 이야기' }), el('b', { text: Q.found })))]);
        foundBox.scrollIntoView({ block: 'nearest' });
      }, 'q' + quest), foundBox], go);
  }
  function updateTracker() {
    var p = player.group.position, show = (state === 'explore' || state === 'free');
    denBtn.hidden = !(show && dist2(p.x, p.z, P.machine[0], P.machine[1]) < 6.5);
    var best = (quest < PARTS.length && !partObjs[quest].taken) ? PARTS[quest] : null;
    if (best && !questOpen) {
      track.hidden = !show; trackArrow.style.transform = 'none'; track.classList.add('ask');
      trackText.textContent = SCN.askLabel;
      return;
    }
    track.classList.remove('ask');
    var target = best ? best.at : ((sceneDone || partsFound === PARTS.length) ? P.machine : null);
    if (!show || !target) { track.hidden = true; return; }
    var d = dist2(p.x, p.z, target[0], target[1]);
    if (!best && d < 6.5) { track.hidden = true; return; }
    track.hidden = false;
    var rel = Math.atan2(target[0] - p.x, target[1] - p.z) - camYaw;
    trackArrow.style.transform = 'rotate(' + (-rel) + 'rad)';
    trackText.textContent = (best ? SCN.detector + ' ' : '타임머신까지 ') + Math.round(d) + 'm';
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
    takeOffHats();
    if (on) wearHat();
  }
  function openDen() {
    var prev = state; state = 'den'; stick.x = stick.y = 0; stick.id = null; base.hidden = true;
    function render() {
      var ready = partsFound === PARTS.length && sceneDone;
      var slots = PARTS.map(function (p, i) {
        var on = partObjs[i].taken;
        return el('div', { class: 'slot' + (on ? ' on' : '') }, icon(p.mat ? 'gear' : (p.id === 'needle' ? 'compass' : p.id)), el('b', { text: p.name }), el('span', { text: on ? (p.mat ? '얻었어요' : '끼웠어요') : '아직 못 찾았어요' }));
      });
      var frames = DEX.map(function (d) {
        var has = d.id in dex;
        return el('div', { class: 'frame' + (has ? '' : ' empty') }, has && dex[d.id] ? el('img', { src: dex[d.id], alt: d.name }) : el('div', { class: 'ph' }), el('span', { text: has ? d.name : '빈 액자' }));
      });
      /* 깃발 색은 시대 부속을 고칠 때마다 하나씩 열린다(흥미 개선: 모은 재료가 무엇을 열게) */
      var gw = GW(), cols = gw ? gw.FLAGS : [null, '#EE7B62', '#2F9C95', '#4E5FB0', '#F7D774', '#9C6ADE', '#E35D8C', '#5BAE5A', '#E8913A', '#3E8FD4', '#C8A15A', '#7A8794'];
      var openN = gw ? gw.flagsOpen() : 2 + (BO3D.story && BO3D.story.fixedEras ? BO3D.story.fixedEras() : 0);
      var sw = cols.map(function (c, k) {
        var locked = k >= openN;
        var b = el('button', { class: 'sw' + (c ? '' : ' none') + (locked ? ' locked' : ''), 'aria-pressed': String(flagColor === c), 'aria-label': locked ? '잠긴 깃발 색' : c ? '깃발 색' : '깃발 없음', style: c ? 'background:' + c : '', on: { click: function () { if (locked) return; setFlag(c); if (gw) gw.prefs.setFlag(c); render(); } } }, c ? (locked ? '🔒' : null) : '없음');
        if (locked) b.disabled = true;
        return b;
      });
      var hatBtn = el('button', { class: 'tog', 'aria-pressed': String(hatOn), on: { click: function () { setHat(!hatOn); if (gw && gearStage >= 1) gw.prefs.setHat(hatOn); render(); } } }, hatOn ? '쓰고 있어요' : '쓰기');
      if (!sceneDone && gearStage < 1) hatBtn.disabled = true;
      var fxBtn = gw && gearStage >= 3 ? el('button', { class: 'tog', 'aria-pressed': String(gw.prefs.fx()), on: { click: function () { gw.prefs.setFx(!gw.prefs.fx()); render(); } } }, gw.prefs.fx() ? '켜져 있어요' : '꺼져 있어요') : null;
      var gi = gw && gearStage ? gw.info(gearStage) : null;
      var mt = PARTS.length && PARTS[0].mat, wd = mt ? '재료' : '부품';
      var msg = ready ? wd + '를 모두 모았고 이 시대의 탐험도 마쳤어요. 이제 떠날 수 있어요.'
        : [partsFound < PARTS.length ? (mt ? '수리에 쓸 재료가 ' : '시간 나침반의 부품이 ') + (PARTS.length - partsFound) + '개 모자라요.' : wd + '는 모두 모았어요.',
          sceneDone ? '' : (SCN.sceneDoneText || '이 장면을 끝까지 지켜봐야 떠날 수 있어요.')].join(' ');
      var go = btn('다음 시대로 출발', depart, 'wide'); go.disabled = !ready;
      overlay.className = 'overlay3 den3ov pad';
      overlay.replaceChildren(
        el('div', { class: 'eyebrow', text: '탐험대 이야기' }),
        el('h1', { class: 'den-title', text: '타임머신 아지트' }),
        el('p', { class: 'den-lead', text: mt ? '과거에는 아무것도 남기지 않아요. 가져오는 것은 사진과 기록, 수리에 쓸 재료뿐이에요.' : '과거에는 아무것도 남기지 않고, 가져오는 것은 사진과 기록뿐이에요.' }),
        el('h2', { text: mt ? '타임머신 수리' : '시간 나침반 수리' }), el('div', { class: 'slots' }, slots), el('p', { class: 'den-msg', text: msg }),
        el('h2', { text: '사진 벽' }), el('div', { class: 'frames' }, frames),
        el('h2', { text: '꾸미기' }),
        el('div', { class: 'deco' }, el('span', { text: '타임머신 깃발 (시대 부속을 고칠 때마다 색이 하나씩 열려요 · ' + Math.min(cols.length - 1, openN - 1) + ' / ' + (cols.length - 1) + ')' }), el('div', { class: 'sws' }, sw)),
        el('div', { class: 'deco' }, el('span', { text: sceneDone || gearStage >= 1 ? '탐험 모자 (세 아이가 함께 써요)' : '탐험 모자 (첫 장면을 마치면 열려요)' }), hatBtn),
        gi ? el('div', { class: 'deco' }, el('span', { text: '탐험 장비 ' + gearStage + '단계 · ' + gi.name + ' · ' + gi.fn }), btn('기록장', function () { overlay.hidden = true; state = prev; toMap(); if (BO3D.story.openRecord) BO3D.story.openRecord('gear'); }, 'quiet')) : null,
        fxBtn ? el('div', { class: 'deco' }, el('span', { text: '손목 탐지기 빛 (끄면 빛만 없어지고 기능은 그대로)' }), fxBtn) : null,
        el('div', { class: 'den-foot' }, btn('밖으로 나가기', function () { overlay.hidden = true; state = prev; }, 'quiet'), go));
      overlay.hidden = false;
    }
    render();
  }
  /* ── 손목 탐지기의 빛(타임머신 장비의 빛, 창작) — 켜고 끄는 규칙은 growth.js의 auraRule 하나(보완-4, 보완2-3) ──
   * 탐색(explore·free) 중에만, 성경 인물 6m 밖, 조용한 자리 밖, 장면 설정이 off가 아닐 때. 어기면 그 프레임에 바로 끈다. 켤 때만 서서히 */
  var auraTex = null, auraLast = { on: false, reason: 'init' }, auraLevel = 0, _av = null;
  function wristGlow() {
    if (!auraTex) {
      var cv = document.createElement('canvas'); cv.width = cv.height = 64;
      var cx = cv.getContext('2d'), gr = cx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(230,255,252,1)'); gr.addColorStop(0.3, 'rgba(127,224,214,0.6)'); gr.addColorStop(1, 'rgba(127,224,214,0)');
      cx.fillStyle = gr; cx.fillRect(0, 0, 64, 64); auraTex = new T.CanvasTexture(cv);
    }
    var sp = new T.Sprite(new T.SpriteMaterial({ map: auraTex, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
    sp.scale.setScalar(0.3); sp.visible = false; return sp;
  }
  function figureCtx() {
    var sid = cur === 'jordan' ? 'jordan' : SCN.id, sc = cur === 'jordan' ? JL.scene : scene, p = player.group.position, best = Infinity, n = 0;
    if (!_av) _av = new T.Vector3();
    FIGS.forEach(function (f) {
      if (f.sid !== sid || !f.h || !f.h.group) return;
      var r = f.h.group; while (r.parent) r = r.parent;
      if (r !== sc) return;
      n++; f.h.group.getWorldPosition(_av);
      var d = Math.sqrt((_av.x - p.x) * (_av.x - p.x) + (_av.z - p.z) * (_av.z - p.z)); if (d < best) best = d;
    });
    return { ready: n >= (FIGREQ[sid] || 0), near: best };
  }
  function quietCtx() {
    var p = player.group.position, zs = [];
    if (cur === 'jordan') { if (JL.ark) { if (!_av) _av = new T.Vector3(); JL.ark.getWorldPosition(_av); zs.push([_av.x, _av.z, 10]); } }
    else if (SCN.quietAt) zs = SCN.quietAt() || [];
    return zs.some(function (z) { return (p.x - z[0]) * (p.x - z[0]) + (p.z - z[1]) * (p.z - z[1]) < z[2] * z[2]; });
  }
  function updateAura(dt) {
    var gw = GW(), glows = ['choeon', 'hyu', 'onwoo'].map(function (k) { return kids[k] && kids[k].glow; }).filter(Boolean);
    if (!gw || !player || !glows.length) { auraLast = { on: false, reason: glows.length ? 'no-growth' : 'stage' }; return; }
    var fc = figureCtx();
    var r = gw.auraRule({ stage: gearStage, fx: gw.prefs.fx(), state: state, overlayOpen: !overlay.hidden, sceneAura: cur === 'jordan' ? 'dim' : (SCN.aura || 'on'),
      figuresReady: fc.ready, nearFigure: fc.near, inQuiet: quietCtx(), visible: !document.hidden, reduced: calm });
    auraLast = { on: r.on, dim: !!r.dim, reason: r.reason, near: fc.near, ready: fc.ready };
    if (!r.on) { auraLevel = 0; glows.forEach(function (g) { g.visible = false; g.material.opacity = 0; }); return; }   /* 즉시 끔 */
    auraLevel = Math.min(1, auraLevel + dt / 0.4);                                                                     /* 켤 때만 0.4초 */
    var base = r.dim ? 0.32 : 0.58, pulse = r.dim ? 0 : 0.14 * Math.sin(now * 3.2);
    glows.forEach(function (g) { g.visible = true; g.material.opacity = (base + pulse) * auraLevel; });
  }
  /* 손목 탐지기(3단계) 도감 탐지 */
  function updateDexDet(dt) {
    dexDetT -= dt; if (dexDetT > 0) return; dexDetT = 0.3;
    var show = gearStage >= 3 && (cur === 'scene' || !JL) && (state === 'explore' || state === 'free') && player;
    if (!show) { dexDet.hidden = true; return; }
    var p = player.group.position, cnt = 0, bd = Infinity, bp = null;
    DEX.forEach(function (d) {
      if (d.id in dex) return; if (d.visible && !d.visible()) return;
      var wp = d.pos(), dd = Math.sqrt((wp.x - p.x) * (wp.x - p.x) + (wp.z - p.z) * (wp.z - p.z));
      if (dd < d.range) { cnt++; if (dd < bd) { bd = dd; bp = wp; } }
    });
    if (!cnt) { dexDet.hidden = true; return; }
    dexDet.hidden = false;
    dexDetText.textContent = '손목 탐지기 · 사진에 담을 것 ' + cnt + '개';
    var rel = Math.atan2(bp.x - p.x, bp.z - p.z) - camYaw; dexDetArrow.style.transform = 'rotate(' + (-rel) + 'rad)';
  }
  function makeGlow() {
    var cv = document.createElement('canvas'); cv.width = cv.height = 128;
    var cx = cv.getContext('2d'), gr = cx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,236,170,0.55)'); gr.addColorStop(1, 'rgba(255,220,140,0)');
    cx.fillStyle = gr; cx.fillRect(0, 0, 128, 128);
    var sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(cv), transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
    sp.scale.setScalar(5); return sp;
  }
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
    if (BO3D.story) BO3D.story.complete3d(SCN.id);
    /* 새 장비는 저장(complete3d)이 끝난 바로 뒤에만 확정한다(보완2-2). 말씀 카드 화면·자유 걷기에서는 보이지 않는다 */
    var gw = GW(), newGear = gw ? gw.pending() : [];
    if (newGear.length) { gw.markSeen(); gearStage = gw.stage(); }
    overlay.className = 'overlay3 den3ov pad';
    overlay.replaceChildren(
      el('div', { class: 'eyebrow', text: SC.title + ' · 탐험 완료' }),
      el('h1', { class: 'den-title', text: '다음 시대로!' }),
      el('p', { class: 'den-lead', text: '타임머신이 다시 떠올랐어요. 과거에는 아무것도 남기지 않았어요.' }),
      el('div', { class: 'slots' },
        el('div', { class: 'slot on' }, icon('book'), el('b', { text: '말씀 카드' }), el('span', { text: SC.cards.length + '장' })),
        el('div', { class: 'slot on' }, icon('camera'), el('b', { text: '탐험 도감' }), el('span', { text: dexCount() + ' / ' + DEX.length })),
        el('div', { class: 'slot on' }, icon('gear'), el('b', { text: PARTS.length && PARTS[0].mat ? '모은 재료' : '찾은 부품' }), el('span', { text: partsFound + ' / ' + PARTS.length }))),
      newGear.length && BO3D.story.gearCard ? BO3D.story.gearCard(newGear) : null,
      el('p', { class: 'den-msg', text: BO3D.story ? '시대 지도에서 다음 장면으로 갈 수 있어요.' : '다음 장면(하나님의 이름과 세 가지 표징, 출 3:13-4:17)은 목사님 감수를 마친 뒤 열립니다.' }),
      el('div', { class: 'den-foot' }, BO3D.story && SCN.id === 'OT-09' ? btn('다른 이름으로 가 보기', function () { if (C3 && BO3D.jordan) route(); else menu(); }, 'quiet') : btn('처음부터 다시', menu, 'quiet'),
        BO3D.story ? btn('시대 지도로', toMap, 'wide') : btn('다른 이름으로 가 보기', function () { if (C3 && BO3D.jordan) route(); else menu(); }, 'wide')));
    overlay.hidden = false;
  }


  /* ── 시대 추리: 이름을 잘못 넣으면 성경의 다른 실제 장면으로 간다 ──
   * 도착한 곳이 언제, 어디인지 모르는 채로 사진으로 단서를 모으고, 증거를 골라 추리한 뒤 성경에서 확인한다. */
  function hudMode() {
    var j = cur === 'jordan';
    place_.textContent = j ? JD.unknownPlace : SC.place;
    if (!j && hudRef.lastChild) hudRef.lastChild.textContent = SC.ref;
    hudRef.hidden = j; partCount.hidden = j; clueCount.hidden = !j;
    dedBtn.hidden = true;
    if (j) { track.hidden = true; denBtn.hidden = true; }
  }
  function route() {
    state = 'route'; hud.hidden = true; hidePanel(); camBtn.hidden = true; dexBtn.hidden = true; denBtn.hidden = true; dedBtn.hidden = true; track.hidden = true;
    root.className = 'g3 app ' + S.tier;
    if (FX) { FX.audio.start(); FX.audio.pad(false); }
    BGM('stop');
    var opts = C.route.options.map(function (o) {
      var ready = o.to === 'EX-01' || o.to === 'ALT-02';
      var b = btn(ready ? o.label : C3.route.locked, function () {
        warpTo(C3.route.warpTitle, function () { if (o.to === 'ALT-02') enterJordan(); else { useScene('OT-09'); begin(); } });
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
    figure('jordan', JL.leader); JL.priests.forEach(function (pr) { figure('jordan', pr); });   /* 요단 경로의 여호수아·제사장도 인물 목록에(빛 규칙) */
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
    gearStage = GW() ? GW().stage() : 0; spawnKids(); hudMode();
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
            btn('모세가 있는 곳으로', function () { warpTo(C3.route.warpTitle, function () { useScene('OT-09'); begin(); }); }));
        }); nb.disabled = true;
        sheetOverlay([el('div', { class: 'q-kicker', text: '타임머신 다시 맞추기' }),
          findBlock({ ref: ALT.back.ref, prompt: ALT.back.prompt, confirm: ALT.back.confirm }, function () { nb.disabled = false; })], nb);
      }));
  }

  /* ── 처음 화면 ── */
  function menu() {
    paused = false; if (BO3D.story) BO3D.story.close();
    state = 'menu'; cur = 'scene'; dedBtn.hidden = true; hud.hidden = true; hidePanel(); base.hidden = true; snd.hidden = true; camBtn.hidden = true; dexBtn.hidden = true; denBtn.hidden = true; track.hidden = true;
    if (FX) { FX.audio.pad(false); FX.audio.quietMusic(false); FX.audio.silence(false, 0.5); FX.audio.fire(-1); }
    BGM('stop');
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
      el('div', { class: 'eyebrow', text: BO3D.ot ? '구약 전체 · 10개 시대 40장면' : '출애굽기 3장 · 3D 한 장면 샘플' }),
      el('h1', { class: 'game-title', text: '성경 탐험대' }),
      el('p', { class: 'game-sub', text: '직접 걸어가서 그 자리를 지켜봐요' }),
      el('h2', { text: '몇 살 탐험대인가요?' }), el('div', { class: 'tier-list' }, tb),
      el('h2', { text: '누가 되어 탐험할까요?' }), el('div', { class: 'char-row' }, cb),
      btn('탐험 시작', function () { S.tier = tier; S.ch = ch; if (BO3D.story) { paused = true; BO3D.story.open(); } else if (C3 && BO3D.jordan) route(); else begin(); }, 'wide'),
      el('p', { class: 'fine', text: '감수 전 시험판입니다. 목사님 감수를 마치기 전에는 아이들에게 공개하지 않습니다.' }));
    overlay.hidden = false;
  }

  function begin() {
    root.className = 'g3 app ' + S.tier;
    overlay.hidden = true;
    if (FX) { FX.audio.start(); FX.audio.pad(false); snd.hidden = false; var m0 = FX.audio.isMuted(); snd.setAttribute('aria-pressed', String(m0)); snd.setAttribute('aria-label', m0 ? '소리 켜기' : '소리 끄기'); }
    useScene(SCN.id); hudMode(); makeVision();
    BGM('play', 'explore');
    gearStage = GW() ? GW().stage() : 0;
    spawnKids();
    quest = 0; questOpen = false; evIdx = SCN.eventStart || 0; afterVision = false;
    if (SCN.reset) SCN.reset();
    takeOffHats();
    hatOn = false; sceneDone = false; partsFound = 0;
    var gw0 = GW(); if (gw0) { if (gearStage >= 1 && gw0.prefs.hat()) setHat(true); setFlag(gw0.prefs.flag()); }   /* 저장한 모자·깃발(bo3d.gear.v1) */
    partObjs.forEach(function (po) { po.taken = false; po.group.visible = true; });
    partCount.textContent = partWord() + ' 0 / ' + PARTS.length;
    for (var kk in kids) kids[kk].group.visible = true;
    machine.group.position.y = machineY; machine.group.rotation.y = -0.5; departGlow.material.opacity = 0; departGlow.scale.setScalar(5);
    camYaw = Math.PI; snapCamera();
    setObjective(SCN.askLabel); hud.hidden = false;
    updateDexBtn();
    state = 'caption';
    /* 도착: 임무가 있으면 최현 박사의 통신, 없으면 장면 설정의 탐험대 이야기 */
    var mi = SC.mission, intro = SCN.intro || { text: '', say: { who: 'onwoo', text: '' } }, teller = companion(intro.say.who);
    showPanel(mi && mi.call ? [el('div', { class: 'q-kicker', text: '탐험대 이야기 · ' + SC.title }),
      el('div', { class: 'note story3 found3' }, icon('compass'), el('span', {}, el('small', { text: '최현 박사의 통신' }), el('b', { text: tx(mi.call) }))),
      el('div', { class: 'say' }, avatar(teller), el('div', { class: 'bubble' }, el('b', { text: C.chars[teller].name, style: 'color:' + C.chars[teller].color }), '우리는 지켜보는 사람이야. 사건이 일어나는 자리에는 다가가지 말자.'))]
      : [el('div', { class: 'q-kicker', text: '탐험대 이야기' }),
      el('p', { class: 'narr', text: intro.text }),
      el('div', { class: 'say' }, avatar(teller), el('div', { class: 'bubble' }, el('b', { text: C.chars[teller].name, style: 'color:' + C.chars[teller].color }), intro.say.text))],
      btn('출발하자', function () {
        hidePanel();
        seg('before', function () {
          camBtn.hidden = false; dexBtn.hidden = false;
          hint.hidden = false; setTimeout(function () { hint.hidden = true; }, 9000);
          openQuiz();
        });
      }));
  }
  /* 동행 문답·오늘의 물음(story.js의 조각)을 3D 화면 위에 띄운다. 그 동안 아이들은 움직이지 않는다 */
  function seg(kind, done) {
    if (!BO3D.story || !BO3D.story.segment) { done(); return; }
    var prev = state; state = 'seg'; base.hidden = true; stick.x = stick.y = 0; stick.id = null;
    BO3D.story.segment(SCN.id, kind, function () { state = prev; done(); }, SCN.helpNote || null);
  }
  /* 현장 돕기(규칙서 13.6): 이 대목 뒤에 돕기 단계가 있는가. 3D에서도 이야기 카드 조각(seg)으로 보여 준다 */
  function hasHelp(i) { var h = SC && SC.mission && SC.mission.help; return !!(h && h.steps.some(function (x) { return x.after === i; })); }
  function keyOf(k) { for (var n in kids) if (kids[n] === k) return n; return null; }

  /* ── 올려다보기: 마지막 부품을 주운 뒤, 언덕 위 떨기나무 앞에 선 모세를 올려다본다 ──
   * 아이들 어깨 너머에서 카메라가 천천히 위로 올라간다. 아이들은 화면 아래에 작게 남는다. */
  function lookupPose() {
    var px = P.lookSpot[0], pz = P.lookSpot[1], fo = P.look.focus;
    var face = Math.atan2(fo[0] - px, fo[1] - pz);
    place(player.group, px, pz); player.group.rotation.y = face;
    followers.forEach(function (f, k) {
      var side = k ? 1 : -1, x = px + Math.cos(face) * 1.05 * side, z = pz - Math.sin(face) * 1.05 * side;
      place(f.group, x - Math.sin(face) * 0.4, z - Math.cos(face) * 0.4); f.group.rotation.y = face; f.spd = 0;
    });
    if (SCN.lookupPose) SCN.lookupPose();
  }
  function startLookup() {
    state = 'lookup'; lookT = 0; hud.hidden = true; hint.hidden = true; camBtn.hidden = true; dexBtn.hidden = true; track.hidden = true; base.hidden = true;
    stick.x = stick.y = 0; stick.id = null;
    lookupPose();
    BGM('play', 'event');   /* 사건 음악은 올려다보는 순간부터. OT-09는 'silence'라 여기서 음악이 멎는다 */
    toast(PARTS[PARTS.length - 1].line, S.ch);
  }
  function updateLookup(dt) {
    lookT += dt;
    if (lookT > 7.5 && state === 'lookup') { if (visionReady()) playVision(); else { state = 'event'; startEvent(); } }
  }

  /* ── 압도 장면: 미리 그린 사실적인 영상 (지시서 6.5) ──
   * 처음에는 끝까지 보고, 다시 볼 때는 건너뛸 수 있다. 하나님의 음성은 소리로 만들지 않는다.
   * 부르시는 순간에는 모든 효과음을 멎게 하고 자막(간접 표현 + 장절)만 띄운다. 영상이 없으면 바로 지켜보기로 간다. */
  var VS = null, vision = null, visions = {};
  function seenKey() { return 'bo3d.vision.' + (SCN.visionKey || SCN.id) + '.seen'; }
  function wasSeen() { try { return localStorage.getItem(seenKey()) === '1'; } catch (e) { return false; } }
  function markSeen() { try { localStorage.setItem(seenKey(), '1'); } catch (e) { /* 무시 */ } }
  /* 장면마다 영상이 있으면 한 번 만들어 둔다 */
  function makeVision() {
    VS = SCN.vision || null; vision = visions[SCN.id] || null;
    if (!VS || vision) return;
    var v = el('video', { playsinline: '', 'webkit-playsinline': '', muted: '', preload: 'auto', src: VS.src });
    v.muted = true;
    var cap = el('div', { class: 'vcap3' }), skip = el('button', { class: 'vskip3', hidden: '' }, VS.skip);
    var box = el('div', { class: 'vision3', hidden: '' }, v, cap, skip);
    add(root, box);
    var V = vision = visions[SCN.id] = { v: v, cap: cap, skip: skip, box: box, ok: false, failed: false, cue: -1, silenced: false, music: false, done: false };
    v.addEventListener('canplay', function () { V.ok = true; });
    v.addEventListener('loadeddata', function () { V.ok = true; });
    v.addEventListener('error', function () { V.failed = true; });
    v.addEventListener('ended', function () { endVision(); });
    skip.addEventListener('click', function () { endVision(); });
  }
  function visionReady() { return !!(vision && !vision.failed && (vision.ok || vision.v.readyState >= 2)); }
  function playVision() {
    state = 'vision';
    var V = vision; V.cue = -1; V.silenced = false; V.music = false; V.done = false;
    V.cap.className = 'vcap3'; V.cap.replaceChildren();
    V.skip.hidden = !wasSeen();
    V.box.hidden = false; void V.box.offsetWidth; V.box.classList.add('on');
    try { V.v.currentTime = 0; } catch (e) { /* 무시 */ }
    var pr = V.v.play(); if (pr && pr.catch) pr.catch(function () { endVision(); });
    if (FX) { FX.audio.wind(0.03); FX.audio.fire(0.9); }
  }
  function updateVision() {
    var V = vision, t = V.v.currentTime, i, k = -1;
    for (i = 0; i < VS.cues.length; i++) if (t >= VS.cues[i].at && t < VS.cues[i].until) k = i;
    if (k !== V.cue) {
      V.cue = k;
      if (k < 0) V.cap.classList.remove('on');
      else {
        V.cap.replaceChildren(el('span', { class: 't', text: VS.cues[k].text }), refChip(VS.cues[k].ref, true));
        V.cap.classList.remove('on'); void V.cap.offsetWidth; V.cap.classList.add('on');
      }
    }
    if (!V.silenced && t >= VS.silence) { V.silenced = true; if (FX) FX.audio.silence(true, 0.5); }
    if (!V.music && t >= VS.music) { V.music = true; if (FX) FX.audio.quietMusic(true); }
  }
  function endVision() {
    var V = vision;
    if (!V || V.done || state !== 'vision') return;
    V.done = true; markSeen(); afterVision = true;
    try { V.v.pause(); } catch (e) { /* 무시 */ }
    if (FX) { if (!V.music) FX.audio.quietMusic(true); FX.audio.fire(-1); FX.audio.wind(0.16); setTimeout(function () { FX.audio.silence(false, 3); }, 3500); }
    V.box.classList.remove('on'); V.cap.classList.remove('on');
    setTimeout(function () { V.box.hidden = true; }, 950);
    state = 'event'; startEvent();
    toast(VS.back, companion('onwoo'));
  }

  /* ── 사건 목격 ── */
  function startEvent() {
    state = 'event'; hud.hidden = true; hint.hidden = true; root.classList.add('ev');
    if (!BGM('play', 'event') && FX) FX.audio.pad(true);
    lookupPose();
    evIdx = SCN.eventStart || 0; showBeat();
  }
  function showBeat() {
    var b = SC.beats[evIdx], last = evIdx === SC.beats.length - 1, e0 = SCN.eventStart || 0;
    /* 인물의 자세는 장면 설정이 정한다(호렙: 영상에서 이미 얼굴을 가렸으면 그대로 둔다) */
    if (SCN.beatPose) SCN.beatPose(evIdx, afterVision);
    /* 장면 설정이 이 대목에서 아이들을 숨기거나(예: 타임머신 창으로 보는 장면) 탐험대 이야기 한 줄을 덧붙일 수 있다 */
    var hideK = !!(SCN.kidsHidden && SCN.kidsHidden(evIdx)), bn = SCN.beatNote ? SCN.beatNote(evIdx) : null;
    for (var kk2 in kids) kids[kk2].group.visible = !hideK;
    showPanel([el('div', { class: 'q-kicker', text: '지켜보기 ' + (evIdx - e0 + 1) + ' / ' + (SC.beats.length - e0) }),
      storyNote(bn), beatNodes(b)],
      [evIdx > e0 ? btn('이전', function () { evIdx--; showBeat(); }, 'plain') : null,
        btn(last ? '다음으로 가는 관문' : '다음', function () { var go2 = function () { if (last) { hidePanel(); startGates(); } else { evIdx++; showBeat(); } }; if (hasHelp(evIdx)) { hidePanel(); seg('help:' + evIdx, go2); } else go2(); })]);
  }

  /* ── 관문 (2D 시범판과 같은 방식) ── */
  function sheetOverlay(kids_, foot) {
    var body = el('div', { class: 'sheet-body pad' }), ft = el('div', { class: 'sheet-foot pad' });
    add(body, kids_); add(ft, foot);
    overlay.className = 'overlay3 sheet3';
    overlay.replaceChildren(el('div', { class: 'sheet' }, body, ft));
    overlay.hidden = false;
  }
  function startGates() {
    state = 'gates'; hidePanel(); root.classList.remove('ev'); camBtn.hidden = true; dexBtn.hidden = true;
    for (var kk3 in kids) kids[kk3].group.visible = true;
    var gates = SC.gates[S.tier], gi = 0;
    (function show() {
      var q = gates[gi], last = gi === gates.length - 1;
      var nb = btn(last ? '관문 통과' : '다음 관문', function () { if (last) { overlay.hidden = true; seg('after', function () { seg('help:gates', function () { seg('today', finish); }); }); } else { gi++; show(); } });
      nb.disabled = true;
      sheetOverlay([el('div', { class: 'q-kicker', text: '다음으로 가는 관문 ' + (gi + 1) + ' / ' + gates.length }), blockFor(q, function () { nb.disabled = false; }, gi)], nb);
    })();
  }

  /* ── 마무리: 말씀 카드와 꾸미기 보상 ── */
  var hat = null, hats = [];
  function makeHat(bandColor) {
    var g = new T.Group();
    var khaki = new T.MeshStandardMaterial({ color: '#C9A769', flatShading: true }), band = new T.MeshStandardMaterial({ color: bandColor || C.chars[S.ch].color, flatShading: true });
    var brim = new T.Mesh(new T.CylinderGeometry(0.3, 0.32, 0.03, 16), khaki), crown = new T.Mesh(new T.CylinderGeometry(0.15, 0.18, 0.15, 14), khaki), bd = new T.Mesh(new T.CylinderGeometry(0.185, 0.185, 0.04, 14), band);
    crown.position.y = 0.08; bd.position.y = 0.035; brim.castShadow = crown.castShadow = true;
    g.add(brim); g.add(crown); g.add(bd);
    return g;
  }
  function takeOffHats() { hats.forEach(function (h) { if (h.parent) h.parent.remove(h); }); hats = []; if (hat && hat.parent) hat.parent.remove(hat); hat = null; }
  /* 탐험 모자: 세 아이가 함께 쓴다(탐험대 장비, 띠는 각자의 색) */
  function wearHat() {
    takeOffHats();
    ['choeon', 'hyu', 'onwoo'].forEach(function (k) {
      var kd = kids[k]; if (!kd || !kd.group.parent) return;
      var h = makeHat(C.chars[k].color), box = new T.Box3().setFromObject(kd.group);
      h.position.y = (box.max.y - kd.group.position.y) - 0.04; kd.group.add(h); hats.push(h);
    });
    hat = hats[0] || null;
  }
  function finish() {
    state = 'end';
    if (FX) { FX.audio.pad(false); FX.audio.quietMusic(false); FX.audio.silence(false, 1); }
    BGM('play', 'after');
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
    var wd = PARTS.length && PARTS[0].mat ? '재료' : '부품';
    kids_.push(el('div', { class: 'closebox reward3' }, el('h3', { text: '탐험대 이야기' }), el('p', { text: (partsFound < PARTS.length ? '남은 ' + wd + ' ' + (PARTS.length - partsFound) + '개를 찾아 타임머신으로 돌아가요. ' : wd + '를 다 찾았으니 타임머신으로 돌아가요. ') + '아지트에서 탐험 모자를 쓸 수 있게 됐어요. 믿음의 점수가 아니라, 다녀온 곳을 기념하는 물건이에요.' })));
    sheetOverlay(kids_, [btn('처음부터', menu, 'plain'), btn('계속 탐험하기', function () {
      overlay.hidden = true; sceneDone = true; state = 'free'; hud.hidden = false; camBtn.hidden = false; dexBtn.hidden = false;
      setObjective(partsFound < PARTS.length ? '남은 ' + wd + '를 찾아 타임머신으로 돌아가자' : '타임머신으로 돌아가자')
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
    if (!WALK(nx, nz)) {
      /* 언덕에는 오르지 않는다 */
      if (cur === 'scene' && SCN.edge && now - lastToast > 7) { var eg0 = SCN.edge(nx, nz); if (eg0) { lastToast = now; toast(eg0.text, companion(eg0.who)); } }
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
  function updateCamera(dt) {
    var p = player.group.position, k = 1 - Math.exp(-dt * 6), want = new T.Vector3();
    if (state === 'depart' || state === 'end2') {
      var mp = machine.group.position;
      want.set(P.machine[0] - 4, H(P.machine[0], P.machine[1]) + 3.2, P.machine[1] + 10.5);
      camLookT.set(mp.x, mp.y + 1.4, mp.z); k = 1 - Math.exp(-dt * 3);
    } else if (state === 'event' && SCN.eventCam && SCN.eventCam(evIdx)) {
      /* 장면 설정이 이 대목의 카메라를 직접 정한다(아이들 어깨 너머가 아닌 곳) */
      var ec = SCN.eventCam(evIdx);
      want.set(ec.pos[0], ec.pos[1], ec.pos[2]); camLookT.set(ec.look[0], ec.look[1], ec.look[2]); k = 1 - Math.exp(-dt * 1.6);
    } else if (state === 'lookup' || state === 'vision' || state === 'event' || state === 'gates' || state === 'end') {
      /* 언덕 아래에서 올려다본다. 처음엔 아이들 어깨 너머, 천천히 위로 올라가며 언덕 위를 담는다 */
      /* 지켜보기 동안은 장면 설정이 대목마다 볼 곳을 바꿀 수 있다(eventLook) */
      var LK = (state === 'event' && SCN.eventLook && SCN.eventLook(evIdx)) || P.look, bx = LK.focus[0], bz = LK.focus[1], ax = p.x - bx, az = p.z - bz, al = Math.sqrt(ax * ax + az * az) || 1;
      ax /= al; az /= al;
      var u = state === 'lookup' ? Math.min(1, Math.max(0, (lookT - 0.8) / 5.5)) : 1, e = u * u * (3 - 2 * u);
      var back = 2.6 + (LK.backE || 8.6) * e, up = 1.5 + (LK.upE || 1.9) * e, side = 0.5 * e;
      want.set(p.x + ax * back - az * side, p.y + up, p.z + az * back + ax * side);
      var top = H(bx, bz), mx = LK.mid[0], mz = LK.mid[1];
      var tx = bx * 0.55 + mx * 0.45, tz = bz * 0.55 + mz * 0.45;
      camLookT.set(p.x + (tx - p.x) * (0.25 + 0.75 * e), p.y + 1.2 + (top + (LK.dy || 0) - p.y - 1.2) * e, p.z + (tz - p.z) * (0.25 + 0.75 * e));
      k = state === 'lookup' ? 1 - Math.exp(-dt * 4) : 1 - Math.exp(-dt * 2.2);
    } else {
      var fx = Math.sin(camYaw), fz = Math.cos(camYaw);
      want.set(p.x - fx * camDist, p.y + camPitchH + 1.3, p.z - fz * camDist);
      camLookT.set(p.x + fx * 4.5, p.y + 1.75, p.z + fz * 4.5);
    }
    var ground = H(want.x, want.z) + 1.0;
    if (want.y < ground) want.y = ground;
    camPos.lerp(want, k); camLook.lerp(camLookT, k);
    camera.position.copy(camPos); camera.lookAt(camLook);
    if (shakeT > 0) { shakeT -= dt; var sk = shakeAmp * Math.max(0, shakeT / shakeDur); camera.position.x += (Math.random() - 0.5) * sk; camera.position.y += (Math.random() - 0.5) * sk * 0.6; }   /* 3D 절정의 땅 흔들림(13.8) */
    /* 자막 창이 열리면 장면을 화면 위쪽으로 올리고, 사건을 볼 때는 당겨 본다 */
    var wantShift = (state === 'event') ? 0.2 : (state === 'caption' ? 0.14 : 0);
    var wantFov = (state === 'event') ? 50 : (state === 'lookup' ? baseFov - 8 * Math.min(1, lookT / 6) : baseFov);
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
    var rdt = (t - last) / 1000, dt = Math.min(0.05, rdt); last = t;
    if (paused) return; /* 이야기 카드·시대 지도가 화면을 덮는 동안은 3D를 그리지 않는다(휴대폰 전지와 시험 속도) */
    now += dt;
    if (fpsOn) { fpsN++; fpsT += rdt; if (fpsT > 0.5) { fpsEl.textContent = Math.round(fpsN / fpsT) + ' fps'; fpsN = 0; fpsT = 0; } }
    var horeb = cur === 'scene' || !JL; /* 장면 틀로 만든 3D 장면 */
    if (horeb) {
      if (machine.update) machine.update(now);
      if (SCN.update) SCN.update(dt, now, { player: player ? player.group.position : null, state: state });
    } else JL.update(dt, now);
    if (player) {
      if (state === 'explore' || state === 'free') {
        movePlayer(dt); moveFollowers(dt);
        if (horeb) {
          partObjs.forEach(function (po, pi) {
            if (po.taken) return;
            po.mesh.rotation.y = now * 1.6; po.mesh.position.y = 0.95 + Math.sin(now * 2.2 + pi) * 0.1;
            if (state === 'explore' && pi === quest && questOpen && dist2(player.group.position.x, player.group.position.z, PARTS[pi].at[0], PARTS[pi].at[1]) < 1.7) takePart(pi);
          });
        }
      } else { pspeed = 0; followers.forEach(function (f) { f.spd = 0; }); }
      if (player.update) player.update(dt, pspeed);
      followers.forEach(function (f) { if (f.update) f.update(dt, f.spd || 0); });
      if (state === 'depart') updateDepart(dt);
      if (state === 'lookup') updateLookup(dt);
      if (state === 'vision' && vision) updateVision();
      if (horeb) updateTracker();
      updateAura(dt); updateDexDet(dt);
      updateCamera(dt);
      var pp2 = player.group.position, sun = horeb ? env.sun : JL.sun;
      var so = horeb ? (SCN.sunOff || [-38, 46, 30]) : [30, 50, 34];
      sun.position.set(pp2.x + so[0], pp2.y + so[1], pp2.z + so[2]);
      sun.target.position.copy(pp2);
    } else {
      /* 처음 화면 뒤로 보이는 풍경 */
      if (SCN.menuCam) SCN.menuCam(camera, now);
      else { var a = now * 0.05, fo = P.look.focus; camera.position.set(P.start[0] + Math.sin(a) * 9, H(P.start[0], P.start[1]) + 5.5, P.start[1] + 10); camera.lookAt(fo[0], 4, fo[1]); }
    }
    if (horeb && SCN.render) SCN.render(camera, renderer);
    if (FX && player) {
      if (horeb && SCN.audio) SCN.audio(FX.audio, player.group.position); else { FX.audio.setFlock(999); FX.audio.setFire(999); }
    }
    var rs = horeb ? SCN.scene : JL.scene;
    renderer.info.autoReset = false; renderer.info.reset();   /* 한 화면(후처리 포함)의 그리기 수를 모아 센다(perf3d.js) */
    if (post) post.render(rs, camera); else renderer.render(rs, camera);
    if (wantShot) { wantShot = false; if (horeb) takeShot(); else takeClue(); }
  }

  /* ── 구약 전체 흐름(story.js)과 잇는 곳 ── */
  var paused = false;
  function hideAll3d() { hud.hidden = true; hidePanel(); base.hidden = true; snd.hidden = true; camBtn.hidden = true; dexBtn.hidden = true; denBtn.hidden = true; dedBtn.hidden = true; track.hidden = true; hint.hidden = true; overlay.hidden = true; root.classList.remove('ev'); }
  function toMap() { if (FX) { FX.audio.pad(false); FX.audio.quietMusic(false); FX.audio.silence(false, 0.5); FX.audio.fire(-1); } BGM('stop'); BO3D.story.open(); }
  BO3D.scenes3d = {}; Object.keys(BO3D.scene3d || {}).forEach(function (k) { BO3D.scenes3d[k] = true; });
  BO3D.game = {
    toStory: function () { state = 'story'; paused = true; hideAll3d(); },
    menu: menu,
    start3d: function (id) {
      paused = false; hideAll3d(); root.className = 'g3 app ' + S.tier;
      if (id === 'OT-09' && C3 && BO3D.jordan) { useScene('OT-09'); route(); }
      else if (BO3D.scene3d[id]) { useScene(id); begin(); }
    }
  };

  /* 자동 점검용 (화면에는 영향 없음) */
  BO3D.debug = {
    level: function () { return cur; },
    moses: function () { return SCN.debug && SCN.debug.moses ? SCN.debug.moses() : null; },
    scene: function () { return { id: SCN.id, P: P, parts: PARTS.map(function (p) { return { at: p.at, name: p.name, mat: !!p.mat }; }), eventStart: SCN.eventStart || 0, dex: DEX.map(function (d) { return d.id; }), cur: cur }; },
    clues: function () { return Object.keys(clue); },
    jordan: function () { return JL ? { P: JL.P, targets: Object.keys(JL.targets).map(function (k) { var v = JL.targets[k].pos(); return [k, v.x, v.y, v.z]; }) } : null; },
    parts: function () { return { found: partsFound, at: PARTS.map(function (p) { return p.at; }), done: sceneDone }; },
    dex: function () { return Object.keys(dex); },
    quest: function () { return { quest: quest, open: questOpen, at: P.parts }; },
    vision: function () { return vision ? { ok: visionReady(), t: vision.v.currentTime, seen: wasSeen() } : null; },
    lookup: function () { overlay.hidden = true; hidePanel(); quest = PARTS.length - 1; partObjs.forEach(function (po) { po.taken = true; po.group.visible = false; }); partsFound = PARTS.length; startLookup(); },
    flock: function () { return SCN.debug && SCN.debug.flock ? SCN.debug.flock() : null; },
    phase: function () { return SCN.debug && SCN.debug.phase ? SCN.debug.phase() : null; },
    state: function () { return { state: state, quest: quest, x: player && player.group.position.x, z: player && player.group.position.z, mosesArrived: !!(SCN.debug && SCN.debug.arrived && SCN.debug.arrived()) }; },
    stick: function (x, y) { stick.x = x; stick.y = y; },
    yaw: function (v) { camYaw = v; lastDrag = now + 999; },
    goto: function (x, z) { player.group.position.set(x, H(x, z), z); trail.push([x, z]); },
    render: function () { var r = renderer.info.render, m = renderer.info.memory; return { calls: r.calls, tris: r.triangles, geo: m.geometries, tex: m.textures }; },   /* 장면이 무거워지지 않았는지 비교용 */
    aura: function () { var vis = ['choeon', 'hyu', 'onwoo'].some(function (k) { return kids[k] && kids[k].glow && kids[k].glow.visible && kids[k].glow.material.opacity > 0; }); return { visible: vis, on: auraLast.on, reason: auraLast.reason, near: auraLast.near, ready: auraLast.ready, state: state, gear: gearStage, cur: cur, id: SCN && SCN.id }; },
    figures: function () { return FIGS.map(function (f) { return f.sid; }); }, figreq: function () { return FIGREQ; },
    dexDet: function () { return dexDet.hidden ? null : dexDetText.textContent; }
  };

  useScene('OT-09'); hudMode();
  resize(); menu(); requestAnimationFrame(frame);
})();
