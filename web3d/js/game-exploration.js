/* 사진 도감과 부품 찾기. game.js가 공유 상태 G를 전달하고 초기화 순서를 정한다. */
BO3D.gameModules = BO3D.gameModules || {};
BO3D.gameModules.exploration = function (G) {
  'use strict';

  /* ── 사진과 탐험 도감 ──
   * 세 아이는 목격자다. 본 것을 사진으로 담아 도감을 채운다. 설명은 본문에 있는 사실만 적는다. */
  function v3(x, y, z) { return new G.T.Vector3(x, y, z); }
  function dexCount() { return Object.keys(G.dex).length; }
  function updateDexBtn() { G.dexLabel.textContent = '도감 ' + dexCount() + ' / ' + G.DEX.length; }
  function takeShot() {
    var cw = G.canvas.width, ch = G.canvas.height, found = [], best = null;
    G.DEX.forEach(function (d) {
      var wp = d.pos(), cs = wp.clone().applyMatrix4(G.camera.matrixWorldInverse);
      if (cs.z > -0.5 || wp.distanceTo(G.camera.position) > d.range) return;
      var n = wp.clone().project(G.camera);
      if (Math.abs(n.x) > 0.82 || Math.abs(n.y) > 0.86) return;
      var item = { d: d, n: n, c: n.x * n.x + n.y * n.y };
      found.push(item); if (!best || item.c < best.c) best = item;
    });
    G.flash.hidden = false; G.flash.classList.remove('go'); void G.flash.offsetWidth; G.flash.classList.add('go');
    setTimeout(function () { G.flash.hidden = true; }, 420);
    if (G.FX) G.FX.audio.shutter();
    if (!found.length) { G.toast('사진에 담긴 것이 없어요. 찍고 싶은 것을 화면 가운데에 놓고 다시 찍어 보세요.'); return; }
    var fresh = found.filter(function (f) { return !G.dex[f.d.id]; });
    fresh.forEach(function (f) {
      var size = Math.min(cw, ch) * (f.d.crop || 0.5), sx = (f.n.x * 0.5 + 0.5) * cw - size / 2, sy = (1 - (f.n.y * 0.5 + 0.5)) * ch - size / 2;
      sx = Math.max(0, Math.min(cw - size, sx)); sy = Math.max(0, Math.min(ch - size, sy));
      var cv = document.createElement('canvas'); cv.width = cv.height = 220;
      try { cv.getContext('2d').drawImage(G.canvas, sx, sy, size, size, 0, 0, 220, 220); G.dex[f.d.id] = cv.toDataURL('image/jpeg', 0.82); }
      catch (e) { G.dex[f.d.id] = ''; }
    });
    updateDexBtn();
    if (fresh.length) {
      if (G.FX) G.FX.audio.chime();
      G.dexBtn.classList.remove('pulse'); void G.dexBtn.offsetWidth; G.dexBtn.classList.add('pulse');
      G.toast('도감에 새로 담았어요: ' + fresh.map(function (f) { return f.d.name; }).join(', ') + (dexCount() === G.DEX.length ? '. 도감을 모두 채웠어요!' : ''));
    } else G.toast('이미 도감에 있는 사진이에요: ' + best.d.name);
  }
  function openDex() {
    G.stick.x = G.stick.y = 0; G.stick.id = null; G.base.hidden = true;
    var cells = G.DEX.map(function (d) {
      var has = d.id in G.dex;
      return G.el('div', { class: 'dexcell' + (has ? '' : ' none') },
        has && G.dex[d.id] ? G.el('img', { src: G.dex[d.id], alt: d.name }) : G.el('div', { class: 'ph', text: has ? '' : '?' }),
        G.el('b', { text: has ? d.name : '아직 못 찍었어요' }),
        G.el('span', { text: has ? d.desc : d.hint }),
        has && d.ref ? G.refChip(d.ref) : null);
    });
    var prevClass = G.overlay.className, prevKids = Array.prototype.slice.call(G.overlay.childNodes), wasHidden = G.overlay.hidden;
    G.sheetOverlay([G.el('div', { class: 'q-kicker', text: '탐험 도감 ' + dexCount() + ' / ' + G.DEX.length }),
      G.el('p', { class: 'q-prompt', text: '본 것을 사진으로 담아 도감을 채워요.' }),
      G.el('div', { class: 'dexgrid' }, cells)],
      G.btn('닫기', function () { G.overlay.className = prevClass; G.overlay.replaceChildren.apply(G.overlay, prevKids); G.overlay.hidden = wasHidden; }));
  }
  function partMesh(kind) {
    var g = new G.T.Group(), i, m;
    if (kind === 'gear') {
      g.add(new G.T.Mesh(new G.T.TorusGeometry(0.2, 0.065, 6, 14), G.brass));
      for (i = 0; i < 8; i++) { m = new G.T.Mesh(new G.T.BoxGeometry(0.09, 0.1, 0.11), G.brass); m.position.set(Math.cos(i * 0.785) * 0.29, Math.sin(i * 0.785) * 0.29, 0); m.rotation.z = i * 0.785; g.add(m); }
    } else if (kind === 'needle') {
      m = new G.T.Mesh(new G.T.ConeGeometry(0.09, 0.36, 4), new G.T.MeshStandardMaterial({ color: '#EE7B62', flatShading: true })); m.position.y = 0.18; m.scale.z = 0.35; g.add(m);
      m = new G.T.Mesh(new G.T.ConeGeometry(0.09, 0.36, 4), new G.T.MeshStandardMaterial({ color: '#FBF7EE', flatShading: true })); m.position.y = -0.18; m.rotation.z = Math.PI; m.scale.z = 0.35; g.add(m);
      g.add(new G.T.Mesh(new G.T.SphereGeometry(0.06, 8, 6), G.brass));
    } else {
      m = new G.T.Mesh(new G.T.SphereGeometry(0.2, 12, 8), new G.T.MeshStandardMaterial({ color: '#7AD0C8', emissive: '#2F9C95', emissiveIntensity: 0.5, roughness: 0.2, flatShading: true })); m.scale.z = 0.4; g.add(m);
      g.add(new G.T.Mesh(new G.T.TorusGeometry(0.21, 0.035, 6, 16), G.brass));
    }
    g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
    return g;
  }
  function showDetector(i) {
    var item = G.C3.horeb.quiz[i];
    G.detectorPart = -1; G.state = 'detector';
    G.track.hidden = true; G.hint.hidden = true; G.hudRef.hidden = true;
    G.camBtn.hidden = true; G.dexBtn.hidden = true; G.denBtn.hidden = true;
    G.detectorQuestion(item, i, function () {
      G.detectorPart = i; G.partObjs[i].group.visible = true;
      G.hidePanel(); G.state = 'explore'; G.hudRef.hidden = false;
      G.camBtn.hidden = false; G.dexBtn.hidden = false;
      G.setObjective(item.objective);
      if (i === 0) { G.hint.hidden = false; setTimeout(function () { G.hint.hidden = true; }, 9000); }
    });
  }
  function takePart(i) {
    if (G.cur !== 'horeb' || G.state !== 'explore' || i !== G.detectorPart || G.partObjs[i].taken) return;
    var po = G.partObjs[i]; po.taken = true; po.group.visible = false; G.partsFound++;
    G.detectorPart = -1;
    G.partCount.textContent = '부품 ' + G.partsFound + ' / ' + G.PARTS.length;
    G.partCount.classList.remove('pulse'); void G.partCount.offsetWidth; G.partCount.classList.add('pulse');
    if (G.FX) G.FX.audio.chime();
    var all = G.partsFound === G.PARTS.length;
    G.toast(all ? G.C3.horeb.lastPart : G.PARTS[i].line + ' 남은 부품은 ' + (G.PARTS.length - G.partsFound) + '개야.', G.S.ch);
    G.collect(i);
  }
  function updateTracker() {
    var p = G.player.group.position;
    var best = G.detectorPart >= 0 && !G.partObjs[G.detectorPart].taken ? G.PARTS[G.detectorPart] : null;
    var show = (G.state === 'explore' || G.state === 'free');
    G.denBtn.hidden = !(show && G.dist2(p.x, p.z, G.P.machine[0], G.P.machine[1]) < 6.5);
    var target = best ? best.at : (G.sceneDone ? G.P.machine : null);
    if (!show || !target) { G.track.hidden = true; return; }
    var d = G.dist2(p.x, p.z, target[0], target[1]);
    if (!best && d < 6.5) { G.track.hidden = true; return; }
    G.track.hidden = false;
    var rel = Math.atan2(target[0] - p.x, target[1] - p.z) - G.camYaw;
    G.trackArrow.style.transform = 'rotate(' + (-rel) + 'rad)';
    G.trackText.textContent = (best ? G.C3.sharon.track : '타임머신까지 ') + Math.round(d) + 'm';
  }

  G.dexCount = dexCount;
  G.updateDexBtn = updateDexBtn;
  G.takeShot = takeShot;
  G.openDex = openDex;
  G.showDetector = showDetector;
  G.takePart = takePart;
  G.updateTracker = updateTracker;
  return function initExploration() {

    G.DEX = [
      { id: 'sheep', name: '양 떼', desc: '모세가 치던 장인 이드로의 양 떼', ref: '출 3:1', hint: '출발한 곳에서 가까운 곳에 모여 있어요.', range: 17,
        pos: function () { return v3(G.P.flock[0], G.H(G.P.flock[0], G.P.flock[1]) + 0.6, G.P.flock[1]); } },
      { id: 'moses', name: '모세', desc: '미디안 제사장 이드로의 사위. 장인의 양 떼를 치고 있었다', ref: '출 3:1', hint: '양 떼 가까이에서 찾아보세요.', range: 19,
        pos: function () { var p = G.moses.group.position; return v3(p.x, p.y + 1.1, p.z); } },
      { id: 'horeb', name: '하나님의 산 호렙', desc: '모세가 양 떼를 이끌고 이른 산', ref: '출 3:1', hint: '가장 높은 봉우리를 화면 가운데에 담아 보세요.', range: 500, crop: 0.95,
        pos: function () { return v3(G.P.mountain[0], G.H(G.P.mountain[0], G.P.mountain[1]) * 0.62, G.P.mountain[1]); } },
      { id: 'bush', name: '불붙은 떨기나무', desc: '불이 붙었으나 타서 없어지지 않은 떨기나무', ref: '출 3:2', hint: '언덕 아래에서 올려다보면 보여요.', range: 36,
        pos: function () { return v3(G.P.bush[0], G.H(G.P.bush[0], G.P.bush[1]) + 1.3, G.P.bush[1]); } },
      { id: 'machine', name: '타임머신', desc: '탐험대가 타고 온 놋쇠 타임머신. 성경에 나오는 물건은 아니다', ref: null, hint: '처음 도착한 자리에 서 있어요.', range: 17,
        pos: function () { return v3(G.P.machine[0], G.H(G.P.machine[0], G.P.machine[1]) + 1.3, G.P.machine[1]); } }
    ];
    G.dex = {}, G.wantShot = false;


    /* ── 탐험대 이야기: 타임머신 고장과 부품 찾기, 아지트 ──
     * 세 아이만의 이야기이며 성경 내용이 아니다. 화면에 "탐험대 이야기"라고 적어 본문과 구분한다.
     * 원칙: 과거에 아무것도 남기지 않고, 가져오는 것은 사진과 기록뿐이다. */
    G.PARTS = [
      { id: 'gear', name: '톱니바퀴', at: [1, 28], line: '톱니바퀴를 찾았어!' },
      { id: 'needle', name: '나침반 바늘', at: [12, 14], line: '나침반 바늘이 여기 있었네!' },
      { id: 'lens', name: '등불 유리', at: [-9.5, -3.5], line: '등불 유리를 찾았어!' }
    ];
    G.partsFound = 0, G.sceneDone = false, G.flagColor = null, G.hatOn = false, G.flag = null, G.departT = 0, G.machineY = G.machine.group.position.y;
    G.detectorPart = -1;
    G.brass = new G.T.MeshStandardMaterial({ color: '#D9A441', metalness: 0.55, roughness: 0.35, flatShading: true });
    G.partObjs = G.PARTS.map(function (p, i) {
      var grp = new G.T.Group(), mesh = partMesh(p.id);
      mesh.position.y = 0.95; grp.add(mesh);
      var beam = new G.T.Mesh(new G.T.CylinderGeometry(0.05, 0.22, 5, 8, 1, true), new G.T.MeshBasicMaterial({ color: '#8FE3DA', transparent: true, opacity: 0.16, blending: G.T.AdditiveBlending, depthWrite: false, side: G.T.DoubleSide, fog: false }));
      beam.position.y = 2.7; if (G.FX) beam.layers.set(G.FX.GLOW); grp.add(beam);
      G.place(grp, p.at[0], p.at[1]); grp.visible = false; G.scene.add(grp);
      if (G.M.rock) { var rk = G.M.rock(40 + i); rk.scale.multiplyScalar(1.7); G.place(rk, p.at[0] + 1.5, p.at[1] - 1.1, -0.05); G.scene.add(rk); }
      return { group: grp, mesh: mesh, taken: false };
    });
  };
};
