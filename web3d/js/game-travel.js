/* 타임머신 아지트, 출발과 장소 이동. game.js가 공유 상태 G를 전달하고 초기화 순서를 정한다. */
BO3D.gameModules = BO3D.gameModules || {};
BO3D.gameModules.travel = function (G) {
  'use strict';
  function setFlag(color) {
    G.flagColor = color;
    if (G.flag) { G.machine.group.remove(G.flag); G.flag = null; }
    if (!color) return;
    G.flag = new G.T.Group();
    var pole = new G.T.Mesh(new G.T.CylinderGeometry(0.018, 0.018, 1.0, 6), G.brass); pole.position.y = 0.5; G.flag.add(pole);
    var shape = new G.T.Shape(); shape.moveTo(0, 0); shape.lineTo(0.5, -0.14); shape.lineTo(0, -0.28); shape.lineTo(0, 0);
    var pen = new G.T.Mesh(new G.T.ShapeGeometry(shape), new G.T.MeshStandardMaterial({ color: color, side: G.T.DoubleSide, flatShading: true })); pen.position.y = 0.98; G.flag.add(pen);
    G.flag.position.set(0.62, 1.75, 0); G.flag.rotation.z = -0.12;
    G.machine.group.add(G.flag);
  }
  function setHat(on) {
    G.hatOn = on;
    if (G.hat && G.hat.parent) G.hat.parent.remove(G.hat);
    if (on) G.wearHat();
  }
  function openDen() {
    var prev = G.state; G.state = 'den'; G.releaseControls();
    function render() {
      var ready = G.partsFound === G.PARTS.length && G.sceneDone;
      var slots = G.PARTS.map(function (p, i) {
        var on = G.partObjs[i].taken;
        return G.el('div', { class: 'slot' + (on ? ' on' : '') }, G.icon(p.id === 'needle' ? 'compass' : p.id), G.el('b', { text: p.name }), G.el('span', { text: on ? '끼웠어요' : '아직 못 찾았어요' }));
      });
      var frames = G.DEX.map(function (d) {
        var has = d.id in G.dex;
        return G.el('div', { class: 'frame' + (has ? '' : ' empty') }, has && G.dex[d.id] ? G.el('img', { src: G.dex[d.id], alt: d.name }) : G.el('div', { class: 'ph' }), G.el('span', { text: has ? d.name : '빈 액자' }));
      });
      var cols = [null, '#EE7B62', '#2F9C95', '#4E5FB0', '#F7D774'];
      var sw = cols.map(function (c) {
        return G.el('button', { class: 'sw' + (c ? '' : ' none'), 'aria-pressed': String(G.flagColor === c), 'aria-label': c ? '깃발 색' : '깃발 없음', style: c ? 'background:' + c : '', on: { click: function () { setFlag(c); render(); } } }, c ? null : '없음');
      });
      var hatBtn = G.el('button', { class: 'tog', 'aria-pressed': String(G.hatOn), on: { click: function () { setHat(!G.hatOn); render(); } } }, G.hatOn ? '쓰고 있어요' : '쓰기');
      if (!G.sceneDone) hatBtn.disabled = true;
      var msg = ready ? '부품을 모두 끼웠고 이 시대의 탐험도 마쳤어요. 이제 떠날 수 있어요.'
        : [G.partsFound < G.PARTS.length ? '시간 나침반의 부품이 ' + (G.PARTS.length - G.partsFound) + '개 모자라요.' : '부품은 모두 끼웠어요.',
          G.sceneDone ? '' : '떨기나무 장면을 끝까지 지켜봐야 떠날 수 있어요.'].join(' ');
      var go = G.btn('다음 시대로 출발', depart, 'wide'); go.disabled = !ready;
      G.overlay.className = 'overlay3 den3ov pad';
      G.overlay.replaceChildren(
        G.el('div', { class: 'eyebrow', text: '탐험대 이야기' }),
        G.el('h1', { class: 'den-title', text: '타임머신 아지트' }),
        G.el('p', { class: 'den-lead', text: '과거에는 아무것도 남기지 않고, 가져오는 것은 사진과 기록뿐이에요.' }),
        G.el('h2', { text: '시간 나침반 수리' }), G.el('div', { class: 'slots' }, slots), G.el('p', { class: 'den-msg', text: msg }),
        G.el('h2', { text: '사진 벽' }), G.el('div', { class: 'frames' }, frames),
        G.el('h2', { text: '꾸미기' }),
        G.el('div', { class: 'deco' }, G.el('span', { text: '타임머신 깃발' }), G.el('div', { class: 'sws' }, sw)),
        G.el('div', { class: 'deco' }, G.el('span', { text: G.sceneDone ? '탐험 모자' : '탐험 모자 (첫 장면을 마치면 열려요)' }), hatBtn),
        G.el('div', { class: 'den-foot' }, G.btn('밖으로 나가기', function () { G.overlay.hidden = true; G.state = prev; }, 'quiet'), go));
      G.overlay.hidden = false;
    }
    render();
  }
  function depart() {
    G.overlay.hidden = true; G.state = 'depart'; G.departT = 0;
    G.hud.hidden = true; G.camBtn.hidden = true; G.dexBtn.hidden = true; G.denBtn.hidden = true; G.track.hidden = true; G.hint.hidden = true;
    for (var k in G.kids) G.kids[k].group.visible = false;
    if (G.FX) G.FX.audio.rise();
  }
  function updateDepart(dt) {
    G.departT += dt;
    var u = Math.min(1, G.departT / 3.8), e = u * u * u;
    G.machine.group.position.y = G.machineY + e * 22;
    G.machine.group.rotation.y += dt * (0.6 + u * 7);
    G.departGlow.material.opacity = Math.min(0.6, G.departT * 0.3); G.departGlow.scale.setScalar(5 + u * 5);
    if (G.departT > 4.3) endCard();
  }
  function endCard() {
    G.state = 'end2'; G.checkpoint('end');
    G.overlay.className = 'overlay3 den3ov pad';
    G.overlay.replaceChildren(
      G.el('div', { class: 'eyebrow', text: '출애굽기 3장 탐험 완료' }),
      G.el('h1', { class: 'den-title', text: '다음 시대로!' }),
      G.el('p', { class: 'den-lead', text: '타임머신이 다시 떠올랐어요. 과거에는 아무것도 남기지 않았어요.' }),
      G.el('div', { class: 'slots' },
        G.el('div', { class: 'slot on' }, G.icon('book'), G.el('b', { text: '말씀 카드' }), G.el('span', { text: G.SC.cards.length + '장' })),
        G.el('div', { class: 'slot on' }, G.icon('camera'), G.el('b', { text: '탐험 도감' }), G.el('span', { text: G.dexCount() + ' / ' + G.DEX.length })),
        G.el('div', { class: 'slot on' }, G.icon('gear'), G.el('b', { text: '찾은 부품' }), G.el('span', { text: G.partsFound + ' / ' + G.PARTS.length }))),
      G.el('p', { class: 'den-msg', text: '다음 장면(하나님의 이름과 세 가지 표징, 출 3:13-4:17)은 목사님 감수를 마친 뒤 열립니다.' }),
      G.el('div', { class: 'den-foot' }, G.btn('처음부터 다시', G.restart, 'quiet'), G.btn('다른 이름으로 가 보기', function () { if (G.C3 && BO3D.jordan) route(); else G.menu(); }, 'wide')));
    G.overlay.hidden = false;
  }


  /* ── 시대 추리: 이름을 잘못 넣으면 성경의 다른 실제 장면으로 간다 ──
   * 도착한 곳이 언제, 어디인지 모르는 채로 사진으로 단서를 모으고, 증거를 골라 추리한 뒤 성경에서 확인한다. */
  function hudMode() {
    var j = G.cur === 'jordan';
    G.place_.textContent = j ? G.JD.unknownPlace : '광야';
    G.hudRef.hidden = j; G.count.hidden = j; G.partCount.hidden = j; G.clueCount.hidden = !j;
    G.dedBtn.hidden = true;
    if (j) { G.track.hidden = true; G.denBtn.hidden = true; }
  }
  function route() {
    G.checkpoint('route');
    G.state = 'route'; G.hud.hidden = true; G.hidePanel(); G.camBtn.hidden = true; G.dexBtn.hidden = true; G.denBtn.hidden = true; G.dedBtn.hidden = true; G.track.hidden = true;
    G.root.className = 'g3 app ' + G.S.tier;
    if (G.FX) { G.FX.audio.start(); G.FX.audio.pad(false); }
    var opts = G.C.route.options.map(function (o) {
      var ready = o.to === 'EX-01' || o.to === 'ALT-02';
      var b = G.btn(ready ? o.label : G.C3.route.locked, function () {
        G.chooseRoute(o.to);
        warpTo(G.C3.route.warpTitle, function () { if (o.to === 'ALT-02') G.enterJordan(); else G.begin(); });
      }, 'wide');
      if (!ready) b.disabled = true;
      return b;
    });
    G.overlay.className = 'overlay3 den3ov pad';
    G.overlay.replaceChildren(
      G.el('div', { class: 'eyebrow', text: '탐험대 이야기' }),
      G.el('h1', { class: 'den-title', text: G.C3.route.title }),
      G.el('p', { class: 'den-lead', text: G.C3.route.lead }),
      G.el('div', { class: 'route-q' },
        G.el('p', { text: G.tx(G.C.scenes['EX-00'].beats[3].text) }), G.refChip(G.C3.route.contextRef, true),
        G.el('p', { class: 'ask', text: G.tx(G.C.route.prompt) })),
      G.el('div', { class: 'route-opts' }, opts),
      G.el('p', { class: 'den-msg', text: G.C3.route.hint }));
    G.overlay.hidden = false;
  }
  function warpTo(title, fn) {
    G.overlay.className = 'overlay3 den3ov warp3 pad';
    G.overlay.replaceChildren(G.el('div', { class: 'eyebrow', text: '시간 이동' }), G.el('h1', { class: 'den-title', text: title }), G.el('p', { class: 'den-lead', text: '타임머신이 이름을 따라 시대를 찾고 있어요.' }));
    G.overlay.hidden = false;
    if (G.FX) G.FX.audio.chime();
    setTimeout(fn, 1500);
  }
  function loadGlb(name, cb) {
    var data = BO3D.glbData && BO3D.glbData[name];
    if (!data || !G.T.GLTFLoader) return;
    try {
      var bin = atob(data), buf = new Uint8Array(bin.length), i;
      for (i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      new G.T.GLTFLoader().parse(buf.buffer, '', cb, function (e) { console.error('glb ' + name, e); });
    } catch (e) { console.error('glb ' + name, e); }
  }
  /* Blender로 만든 여호수아와 제사장이 있으면 단순 모형과 바꿔 끼운다 */
  function swapGlb(name, old, clipName, once, mirror, after) {
    loadGlb(name, function (gltf) {
      var g = gltf.scene, mixer = new G.T.AnimationMixer(g), clip = null;
      g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
      gltf.animations.forEach(function (c) { if (c.name === clipName) clip = c; });
      if (!clip) clip = gltf.animations[0];
      if (clip) { var a = mixer.clipAction(clip); if (once) { a.setLoop(G.T.LoopOnce, 1); a.clampWhenFinished = true; } a.play(); }
      g.position.copy(old.group.position); g.rotation.y = old.group.rotation.y;
      if (mirror) g.scale.x = -1;
      G.JL.scene.remove(old.group); G.JL.scene.add(g); old.group = g;
      if (after) after(g);
      G.JL.addUpdate(function (dt) { mixer.update(dt); });
      if (G.FX) G.FX.sortLayers(g);
    });
  }
  function loadJordanGlb() {
    swapGlb('joshua', G.JL.leader, 'Idle', false, false);
    /* Blender 제사장은 채가 모델 기준 (x -0.156, y 1.393)을 지난다. 오른쪽 어깨용이며 왼쪽은 좌우를 뒤집어 쓴다. */
    var PX = 0.156, PY = 1.393, a = G.JL.P.ark, bed = G.JL.height(a[0], a[1]);
    G.JL.priests.forEach(function (pr) {
      swapGlb('priest', pr, 'Carry', false, pr.side === 'L', function (g) {
        g.position.x = a[0] + (pr.side === 'R' ? -1 : 1) * (G.JL.arkPole.x + PX);
        g.position.y = G.JL.height(g.position.x, g.position.z);
        G.JL.ark.position.y = bed + PY - G.JL.arkPole.y;
      });
    });
  }

  G.endCard = endCard;
  G.openDen = openDen;
  G.updateDepart = updateDepart;
  G.hudMode = hudMode;
  G.route = route;
  G.warpTo = warpTo;
  G.loadJordanGlb = loadJordanGlb;
  return function initTravel() {

    G.departGlow = (function () {
      var cv = document.createElement('canvas'); cv.width = cv.height = 128;
      var cx = cv.getContext('2d'), gr = cx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,236,170,0.55)'); gr.addColorStop(1, 'rgba(255,220,140,0)');
      cx.fillStyle = gr; cx.fillRect(0, 0, 128, 128);
      var sp = new G.T.Sprite(new G.T.SpriteMaterial({ map: new G.T.CanvasTexture(cv), transparent: true, opacity: 0, blending: G.T.AdditiveBlending, depthWrite: false, fog: false }));
      sp.scale.setScalar(5); return sp;
    })();
    G.departGlow.position.y = 1.3; if (G.FX) G.departGlow.layers.set(G.FX.GLOW); G.machine.group.add(G.departGlow);
  };
};
