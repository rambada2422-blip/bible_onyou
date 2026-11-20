/* 시작 화면, 호렙 산 이야기와 관문. game.js가 공유 상태 G를 전달하고 초기화 순서를 정한다. */
BO3D.gameModules = BO3D.gameModules || {};
BO3D.gameModules.story = function (G) {
  'use strict';
  /* ── 처음 화면 ── */
  function menu(fresh) {
    if (G.stopAwe) G.stopAwe();
    G.state = 'menu'; G.cur = 'horeb'; G.dedBtn.hidden = true; G.hud.hidden = true; G.hidePanel(); G.base.hidden = true; G.snd.hidden = true; G.camBtn.hidden = true; G.dexBtn.hidden = true; G.denBtn.hidden = true; G.track.hidden = true;
    if (G.FX) G.FX.audio.pad(false);
    var progress = fresh !== true && G.readProgress();
    if (progress) {
      var age = G.C.tiers.find(function (t) { return t.id === progress.tier; }).label;
      var jordan = ['jordan', 'deduce', 'return'].includes(progress.stage);
      var details = progress.stage === 'route' ? G.C3.route.title : jordan
        ? '추리 수첩 ' + Object.keys(progress.clues).length + ' / ' + G.JD.clues.length
        : '부품 ' + progress.parts + ' / ' + G.PARTS.length;
      G.overlay.className = 'overlay3 menu3 pad';
      G.overlay.replaceChildren(G.el('h1', { class: 'game-title', text: '성경 탐험대' }),
        G.el('p', { class: 'game-sub', text: age + ' · ' + details }),
        G.btn('이어서 탐험하기', G.resume, 'wide'), G.btn('처음부터 다시', G.restart, 'quiet'));
      G.overlay.hidden = false;
      return;
    }
    var tier = G.S.tier, ch = G.S.ch, picked = false;
    var ids = ['choeon', 'hyu', 'onwoo'];
    var tb = G.C.tiers.map(function (t) {
      return G.el('button', { class: 'tier', 'aria-pressed': 'false', on: { click: function () { tier = t.id; if (!picked) ch = t.char; sync(); } } },
        G.el('span', { class: 'age', text: t.label }), G.el('span', { class: 'nm', text: t.name }), G.el('span', { class: 'ds', text: t.desc }));
    });
    var cb = ids.map(function (id) {
      return G.el('button', { class: 'char', 'aria-pressed': 'false', on: { click: function () { ch = id; picked = true; sync(); } } },
        G.avatar(id), G.el('span', { class: 'nm', text: G.C.chars[id].name }), G.el('span', { class: 'ag', text: G.C.chars[id].age + '살' }));
    });
    function sync() {
      G.C.tiers.forEach(function (t, i) { tb[i].setAttribute('aria-pressed', String(t.id === tier)); });
      ids.forEach(function (id, i) { cb[i].setAttribute('aria-pressed', String(id === ch)); });
    }
    sync();
    G.overlay.className = 'overlay3 menu3 pad';
    G.overlay.replaceChildren(
      G.el('div', { class: 'eyebrow', text: '출애굽기 3장 · 3D 한 장면 샘플' }),
      G.el('h1', { class: 'game-title', text: '성경 탐험대' }),
      G.el('p', { class: 'game-sub', text: '직접 걸어가서 그 자리를 지켜봐요' }),
      G.el('h2', { text: '몇 살 탐험대인가요?' }), G.el('div', { class: 'tier-list' }, tb),
      G.el('h2', { text: '누가 되어 탐험할까요?' }), G.el('div', { class: 'char-row' }, cb),
      G.btn('탐험 시작', function () { G.S.tier = tier; G.S.ch = ch; if (G.C3 && BO3D.jordan) G.route(); else begin(); }, 'wide'),
      G.el('p', { class: 'fine', text: '감수 전 샘플입니다. 그래픽은 단순한 3D이며, 탐험하는 구조를 확인하기 위한 것입니다.' }));
    G.overlay.hidden = false;
  }

  function begin(record) {
    if (G.stopAwe) G.stopAwe();
    if (G.preloadAwe) G.preloadAwe();
    G.root.className = 'g3 app ' + G.S.tier;
    G.overlay.hidden = true;
    if (G.FX) { G.FX.audio.start(); G.FX.audio.pad(false); G.snd.hidden = false; }
    G.cur = 'horeb'; G.hudMode();
    G.spawnKids();
    G.step = 0; G.mosesWalking = false; G.mosesArrived = false; G.evIdx = 2;
    G.place(G.moses.group, G.P.mosesStart[0], G.P.mosesStart[1]); G.moses.group.rotation.y = Math.PI * 0.8;
    if (G.moses.setPose) G.moses.setPose('approach');
    G.scraps.forEach(function (s) { s.group.visible = false; s.taken = false; });
    G.ring.material.opacity = 0;
    if (G.hat) { G.hat.parent && G.hat.parent.remove(G.hat); }
    G.hatOn = false; G.sceneDone = false; G.partsFound = 0;
    if (record && record.hatOn === true && (record.stage === 'free' || record.stage === 'end')) G.setHat(true);
    G.detectorPart = -1;
    G.partObjs.forEach(function (po) { po.taken = false; po.group.visible = false; });
    G.partCount.textContent = '부품 0 / ' + G.PARTS.length;
    for (var kk in G.kids) G.kids[kk].group.visible = true;
    G.machine.group.position.y = G.machineY; G.machine.group.rotation.y = -0.5; G.departGlow.material.opacity = 0; G.departGlow.scale.setScalar(5);
    var pos = G.player.group.position;
    G.camYaw = Math.atan2((G.P.flock[0] + G.P.mosesStart[0]) / 2 - pos.x, (G.P.flock[1] + G.P.mosesStart[1]) / 2 - pos.z); G.snapCamera();
    G.count.textContent = '말씀 조각 0 / 3';
    if (record && (record.parts > 0 || 'sheep' in G.dex)) { restoreHoreb(record); return; }
    G.checkpoint('horeb');
    G.state = 'explore';
    G.hidePanel();
    G.hud.hidden = false; G.camBtn.hidden = false; G.dexBtn.hidden = false;
    G.hint.hidden = false;
    G.updateDexBtn();
    G.setObjective('약한 신호가 잡혀요. 멀리 움직이는 무리를 사진에 담아 보세요.');
    G.toast('시간 나침반의 부품 세 개가 튕겨 나갔어요!', G.S.ch === 'onwoo' ? 'hyu' : 'onwoo');
  }

  function restoreHoreb(record) {
    var n = record.parts;
    G.partsFound = n; G.step = Math.min(n, G.PARTS.length - 1);
    for (var i = 0; i < n; i++) { G.partObjs[i].taken = true; G.scraps[i].taken = true; }
    G.partCount.textContent = '부품 ' + n + ' / ' + G.PARTS.length;
    G.count.textContent = '말씀 조각 ' + n + ' / ' + G.PARTS.length;
    G.updateDexBtn();
    if (n) {
      var at = G.PARTS[n - 1].at;
      G.place(G.player.group, at[0], at[1]);
      G.followers.forEach(function (f, k) { G.place(f.group, at[0] + (k ? 1.5 : -1.5), at[1] + 0.5); });
      G.snapCamera();
    }
    if (n >= 2) {
      G.place_.textContent = G.SC.place;
      G.ring.material.opacity = 0.45;
      if (n === 2) G.mosesWalking = true;
      else { G.place(G.moses.group, G.P.mosesEnd[0], G.P.mosesEnd[1]); G.mosesArrived = true; }
    }
    G.hud.hidden = record.stage !== 'horeb'; G.hint.hidden = true;
    if (record.stage === 'horeb') G.showDetector(n);
    else if (record.stage === 'watch') startEvent();
    else if (record.stage === 'gates') startGates(record.question);
    else if (record.stage === 'reward') finish();
    else if (record.stage === 'free') freeExplore();
    else { G.sceneDone = true; G.endCard(); }
  }

  function hasGlossForTier(gloss) {
    return gloss.text[G.S.tier] && (!gloss.review || BO3D.debug.includeReviewRequiredGloss);
  }

  /* ── 말씀 조각 줍기 ── */
  function collect(i) {
    if (G.cur !== 'horeb' || i !== G.step || G.scraps[i].taken || !G.partObjs[i].taken) return;
    var item = G.C3.horeb.quiz[i];
    G.scraps[i].taken = true; G.scraps[i].group.visible = false;
    if (G.FX) G.FX.audio.chime();
    G.count.textContent = '말씀 조각 ' + (i + 1) + ' / 3';
    G.count.classList.remove('pulse'); void G.count.offsetWidth; G.count.classList.add('pulse');
    if (item.beat !== null) {
      G.state = 'caption';
      function nextPart() {
        G.step = i + 1;
        if (i === 1) { G.mosesWalking = true; G.ring.material.opacity = 0.45; }
        G.showDetector(G.step);
      }
      G.showPanel([G.el('div', { class: 'q-kicker', text: '말씀 조각 ' + (i + 1) + ' / 3' }), G.beatNodes(G.SC.beats[item.beat])],
        G.btn('계속 탐험하기', function () {
          var gloss = i === 0 && G.C3.sharon.gloss.find(function (entry) { return entry.at === 'piece1' && hasGlossForTier(entry); });
          if (gloss) G.showPanel([G.sharonGloss(gloss)], G.btn('계속 탐험하기', nextPart));
          else nextPart();
        }));
    } else {
      var look = G.C3.horeb.lookUp, who = G.C.chars[look.who];
      G.state = 'caption'; G.track.hidden = true;
      G.showPanel([G.el('div', { class: 'q-kicker', text: '탐험대 이야기' }),
        G.el('div', { class: 'say' }, G.avatar(look.who), G.el('div', { class: 'bubble' },
          G.el('b', { text: who.name, style: 'color:' + who.color }), look.text))],
        G.btn('다음', function () { G.hidePanel(); startEvent(); }));
    }
  }

  /* ── 사건 목격 ── */
  function startEvent() {
    G.checkpoint('watch');
    G.state = 'event'; G.hud.hidden = true; G.hint.hidden = true; G.root.classList.add('ev');
    G.mosesWalking = false; G.mosesArrived = true;
    G.place(G.moses.group, G.P.mosesEnd[0], G.P.mosesEnd[1]);
    G.moses.group.rotation.y = Math.atan2(G.P.bush[0] - G.P.mosesEnd[0], G.P.bush[1] - G.P.mosesEnd[1]);
    /* 세 아이가 나란히 서서 떨기나무 쪽을 본다 */
    var px = G.player.group.position.x, pz = G.player.group.position.z;
    var face = Math.atan2(G.P.bush[0] - px, G.P.bush[1] - pz);
    G.player.group.rotation.y = face;
    G.followers.forEach(function (f, k) {
      var side = k ? 1 : -1, x = px + Math.cos(face) * 1.25 * side, z = pz - Math.sin(face) * 1.25 * side;
      G.place(f.group, x, z); f.group.rotation.y = face; f.spd = 0;
    });
    G.evIdx = 2;
    if (G.startAwe) {
      G.startAwe(function () {
        if (G.FX) G.FX.audio.pad(true);
        G.evIdx = 2; showBeat();
      });
    } else {
      if (G.FX) G.FX.audio.pad(true);
      showBeat();
    }
  }
  function showBeat() {
    var b = G.SC.beats[G.evIdx], last = G.evIdx === G.SC.beats.length - 1;
    if (G.moses.setPose && b.state) G.moses.setPose(b.state);
    var bx = G.P.bush[0], bz = G.P.bush[1], mx = G.P.mosesEnd[0], mz = G.P.mosesEnd[1];
    if (b.focus === 'moses') G.camLookT.set(mx * 0.75 + bx * 0.25, G.H(mx, mz) + 1.3, mz * 0.75 + bz * 0.25);
    else G.camLookT.set(bx * 0.7 + mx * 0.3, G.H(bx, bz) + 1.2, bz * 0.7 + mz * 0.3);
    G.showPanel([G.el('div', { class: 'q-kicker', text: '지켜보기 ' + (G.evIdx - 1) + ' / ' + (G.SC.beats.length - 2) }), G.beatNodes(b),
      last ? G.btn(G.C3.sharon.reviewTitle, startSharonReview, 'plain') : null],
      [G.evIdx > 2 ? G.btn('이전', function () { G.evIdx--; showBeat(); }, 'plain') : null,
        G.btn(last ? '다음으로 가는 관문' : '다음', function () { if (last) startGates(); else { G.evIdx++; showBeat(); } })]);
  }

  function startSharonReview() {
    var sharon = G.C3.sharon, watchBeats = G.SC.beats.slice(2);
    var pages = sharon.gloss.filter(function (gloss) {
      return gloss.at.startsWith('watch') && hasGlossForTier(gloss);
    });
    if (!pages.length) { startGates(); return; }

    G.state = 'review'; G.hidePanel(); G.camBtn.hidden = true; G.dexBtn.hidden = true;
    function show(index) {
      var gloss = pages[index], last = index === pages.length - 1;
      var beat = watchBeats[Number(gloss.at.slice('watch'.length)) - 1];
      sheetOverlay([
        G.el('h2', { class: 'sharon-review-title', text: sharon.reviewTitle + ' ' + (index + 1) + ' / ' + pages.length }),
        G.el('div', { class: 'sharon-watch' },
          G.el('div', { class: 'narr-meta' }, G.refChip(beat.ref)),
          G.el('p', { class: 'narr', text: G.tx(beat.text) })),
        G.sharonGloss(gloss),
        last ? G.el('p', { class: 'sharon-ask-adult', text: sharon.askAdult }) : null
      ], [
        index > 0 ? G.btn('이전', function () { show(index - 1); }, 'plain') : null,
        G.btn(sharon.skip, startGates, 'plain'),
        G.btn(last ? '다음으로 가는 관문' : '다음', last ? startGates : function () { show(index + 1); })
      ], 'sharon-review');
    }
    show(0);
  }

  /* ── 관문 (2D 시범판과 같은 방식) ── */
  function goodNote(ref, text) { return G.el('div', { class: 'note good fadein' }, G.el('b', { text: text || '성경에 그렇게 기록되어 있어요.' }), ref ? G.refChip(ref) : null); }
  function lookNote(ref, text) {
    return G.el('div', { class: 'note look fadein' }, G.el('b', { text: '성경에서 확인해 볼까요?' }), G.el('span', { text: text || '성경책을 펴서 읽은 뒤 다시 골라 보세요.' }), ref ? G.refChip(ref) : null);
  }
  function choiceBlock(q, ref, onOk) {
    var pics = q.options.some(function (o) { return o.icon; }), noteBox = G.el('div', {});
    var btns = q.options.map(function (o) {
      var b = G.el('button', { class: 'opt', on: { click: function () {
        if (o.ok) { btns.forEach(function (x) { x.disabled = true; if (x !== b) x.classList.add('rest'); }); b.classList.add('ok'); noteBox.replaceChildren(goodNote(ref)); onOk(); }
        else { b.classList.add('rest'); b.disabled = true; noteBox.replaceChildren(lookNote(ref)); }
        noteBox.scrollIntoView({ block: 'nearest' });
      } } }, o.icon ? G.icon(o.icon) : null, G.el('span', { text: o.label }));
      return b;
    });
    return [G.el('p', { class: 'q-prompt', text: q.prompt }), G.el('div', { class: 'opts' + (pics ? ' pics' : '') }, btns), noteBox];
  }
  function findBlock(q, onOk) {
    var after = G.el('div', { style: 'display:flex;flex-direction:column;gap:12px' });
    var rb = G.el('button', { class: 'btn plain', on: { click: function () { rb.disabled = true; rb.textContent = '읽었어요'; G.add(after, choiceBlock(q.confirm, q.ref, onOk)); after.scrollIntoView({ block: 'nearest' }); } } }, '찾아서 읽었어요');
    return [G.el('div', { class: 'findcard' }, G.icon('book'), G.el('div', {}, G.el('div', { class: 'big', text: G.bookName(q.ref) }), G.el('p', { text: G.tx(q.prompt) }))), rb, after];
  }
  function findrefBlock(q, onOk, idp) {
    var ch = G.el('input', { id: 'g-ch-' + idp, type: 'text', inputmode: 'numeric', 'aria-label': '장', autocomplete: 'off', maxlength: '3' });
    var vs = G.el('input', { id: 'g-vs-' + idp, type: 'text', inputmode: 'numeric', 'aria-label': '절', autocomplete: 'off', maxlength: '3' });
    var noteBox = G.el('div', {});
    var check = G.el('button', { class: 'btn plain', on: { click: function () {
      var v = parseInt(ch.value, 10) + ':' + parseInt(vs.value, 10);
      if (q.accept.indexOf(v) >= 0) { ch.disabled = vs.disabled = check.disabled = true; noteBox.replaceChildren(goodNote(null, '맞게 찾았어요. ' + q.book + ' ' + ch.value.trim() + '장 ' + vs.value.trim() + '절.')); onOk(); }
      else noteBox.replaceChildren(G.el('div', { class: 'note look fadein' }, G.el('b', { text: '그 절에는 다른 내용이 적혀 있어요.' }), G.el('span', { text: q.hint })));
      noteBox.scrollIntoView({ block: 'nearest' });
    } } }, '확인');
    return [G.el('p', { class: 'q-prompt', text: q.prompt }), G.el('div', { class: 'refin' }, G.el('span', { text: q.book }), ch, G.el('span', { text: '장' }), vs, G.el('span', { text: '절' }), check), noteBox];
  }
  function blockFor(q, onOk, idp) {
    if (q.type === 'choice') return choiceBlock(q, q.ref, onOk);
    if (q.type === 'find') return findBlock(q, onOk);
    if (q.type === 'findref') return findrefBlock(q, onOk, idp);
    if (q.type === 'order') return BO.orderQuestion(q, onOk, { el: G.el, goodNote: goodNote, lookNote: lookNote });
    return [];
  }
  function sheetOverlay(kids_, foot, extraClass) {
    G.releaseControls();
    var body = G.el('div', { class: 'sheet-body pad' }), ft = G.el('div', { class: 'sheet-foot pad' });
    G.add(body, kids_); G.add(ft, foot);
    G.overlay.className = 'overlay3 sheet3' + (extraClass ? ' ' + extraClass : '');
    G.overlay.replaceChildren(G.el('div', { class: 'sheet' }, body, ft));
    G.overlay.hidden = false;
  }
  function startGates(savedIndex) {
    G.state = 'gates'; G.hidePanel(); G.root.classList.remove('ev'); G.camBtn.hidden = true; G.dexBtn.hidden = true;
    var gates = G.SC.gates[G.S.tier];
    var gi = Number.isInteger(savedIndex) && savedIndex >= 0 && savedIndex < gates.length ? savedIndex : 0;
    (function show() {
      G.checkpoint('gates', gi);
      var q = gates[gi], last = gi === gates.length - 1;
      var nb = G.btn(last ? '관문 통과' : '다음 관문', function () { if (last) finish(); else { gi++; show(); } });
      nb.disabled = true;
      sheetOverlay([G.el('div', { class: 'q-kicker', text: '다음으로 가는 관문 ' + (gi + 1) + ' / ' + gates.length }), blockFor(q, function () {
        nb.disabled = false;
        G.checkpoint(last ? 'reward' : 'gates', gi + 1);
      }, gi)], nb);
    })();
  }
  function makeHat() {
    var g = new G.T.Group();
    var khaki = new G.T.MeshStandardMaterial({ color: '#C9A769', flatShading: true }), band = new G.T.MeshStandardMaterial({ color: G.C.chars[G.S.ch].color, flatShading: true });
    var brim = new G.T.Mesh(new G.T.CylinderGeometry(0.3, 0.32, 0.03, 16), khaki), crown = new G.T.Mesh(new G.T.CylinderGeometry(0.15, 0.18, 0.15, 14), khaki), bd = new G.T.Mesh(new G.T.CylinderGeometry(0.185, 0.185, 0.04, 14), band);
    crown.position.y = 0.08; bd.position.y = 0.035; brim.castShadow = crown.castShadow = true;
    g.add(brim); g.add(crown); g.add(bd);
    return g;
  }
  function wearHat() {
    if (G.hat && G.hat.parent) G.hat.parent.remove(G.hat);
    G.hat = makeHat();
    var box = new G.T.Box3().setFromObject(G.player.group);
    G.hat.position.y = (box.max.y - G.player.group.position.y) - 0.04;
    G.player.group.add(G.hat);
  }
  function finish() {
    G.checkpoint('reward');
    G.state = 'end';
    if (G.FX) G.FX.audio.pad(false);
    var c = G.SC.close[G.S.tier], kids_ = [
      G.el('div', { class: 'q-kicker', text: '탐험을 마치며' }),
      G.el('p', { class: 'q-prompt', text: '탐험 일지에 말씀 카드가 들어왔어요.' }),
      G.el('div', { class: 'vcards' }, G.SC.cards.map(function (cd) {
        return G.el('div', { class: 'vcard pop' }, G.el('div', { class: 'r', text: cd.ref }), G.el('div', { class: 't', text: cd.title }), G.el('div', { class: 'm', text: G.SC.title + ' · 성경책에서 직접 읽어 보세요' }));
      }))];
    if (c.kind === 'prayer') kids_.push(G.el('div', { class: 'closebox' }, G.el('h3', { text: '한 문장 기도' }), G.el('p', { text: c.text })));
    if (c.kind === 'practice') kids_.push(G.el('div', { class: 'closebox' }, G.el('h3', { text: '이번 주 실천 한 가지' }), G.el('p', { text: c.text })));
    if (c.kind === 'note') {
      var note = G.el('textarea', { id: 'g-note', 'aria-label': '기록', placeholder: '여기에 적어 보세요.' });
      note.value = G.horebNote;
      note.addEventListener('input', function () { G.horebNote = note.value; G.checkpoint(); });
      kids_.push(G.el('div', { class: 'closebox' }, G.el('h3', { text: '탐험 기록' }), G.el('p', { text: c.prompt }), note));
      kids_.push(G.el('p', { class: 'pending', text: '뜻과 삶의 적용을 묻는 질문은 목사님 감수를 마친 뒤 이 자리에 열립니다.' }));
    }
    kids_.push(G.el('div', { class: 'closebox' }, G.el('h3', { text: '탐험 도감' }), G.el('p', { text: '지금까지 ' + G.dexCount() + ' / ' + G.DEX.length + '장을 담았어요. 더 둘러보며 남은 사진을 찍을 수 있어요.' })));
    kids_.push(G.el('div', { class: 'closebox reward3' }, G.el('h3', { text: '탐험대 이야기' }), G.el('p', { text: (G.partsFound < G.PARTS.length ? '남은 부품 ' + (G.PARTS.length - G.partsFound) + '개를 찾아 타임머신으로 돌아가요. ' : '부품을 다 찾았으니 타임머신으로 돌아가요. ') + '아지트에서 탐험 모자를 쓸 수 있게 됐어요. 믿음의 점수가 아니라, 다녀온 곳을 기념하는 물건이에요.' })));
    sheetOverlay(kids_, [G.btn('처음부터', G.restart, 'plain'), G.btn('계속 탐험하기', freeExplore)]);
  }
  function freeExplore() {
    G.overlay.hidden = true; G.sceneDone = true; G.state = 'free'; G.hud.hidden = false; G.camBtn.hidden = false; G.dexBtn.hidden = false;
    G.setObjective(G.partsFound < G.PARTS.length ? '남은 부품을 찾아 타임머신으로 돌아가자' : '타임머신으로 돌아가자'); G.ring.material.opacity = 0.45;
    G.checkpoint('free');
  }

  G.menu = menu;
  G.begin = begin;
  G.collect = collect;
  G.goodNote = goodNote;
  G.lookNote = lookNote;
  G.findBlock = findBlock;
  G.findrefBlock = findrefBlock;
  G.sheetOverlay = sheetOverlay;
  G.wearHat = wearHat;
  return function initStory() {


    /* ── 마무리: 말씀 카드와 꾸미기 보상 ── */
    G.hat = null;
  };
};
