/* 요단 강 단서 수집과 추리 진행. game.js가 공유 상태 G를 전달하고 초기화 순서를 정한다. */
BO3D.gameModules = BO3D.gameModules || {};
BO3D.gameModules.jordan = function (G) {
  'use strict';
  var dedReady;

  function clueN() { return Object.keys(G.clue).length; }
  function enterJordan(record) {
    if (!G.JL) { G.JL = BO3D.jordan.build(); G.loadJordanGlb(); }
    G.cur = 'jordan'; G.overlay.hidden = true; G.clue = record ? record.clues : {}; dedReady = clueN() >= G.JD.need[G.S.tier];
    G.spawnKids(); G.hudMode();
    G.camYaw = Math.PI; G.snapCamera();
    G.clueCount.textContent = '단서 ' + clueN() + ' / ' + G.JD.clues.length; G.dexLabel.textContent = '추리 수첩 ' + clueN() + ' / ' + G.JD.clues.length;
    G.setObjective(dedReady ? G.JD.objectiveReady : G.JD.objective); G.hud.hidden = false; G.snd.hidden = false;
    G.state = 'caption';
    function explore() {
      G.hidePanel(); G.state = 'explore'; G.camBtn.hidden = false; G.dexBtn.hidden = false; G.dedBtn.hidden = !dedReady; G.hint.hidden = false;
      setTimeout(function () { G.hint.hidden = true; }, 9000);
    }
    if (record) {
      explore();
      if (record.stage === 'deduce') startDeduce();
      else if (record.stage === 'return') { prepareDeduction(); conclude(); }
      return;
    }
    G.checkpoint('jordan');
    var sy = G.JD.story.say, who = G.C.chars[sy.who];
    G.showPanel([G.el('div', { class: 'q-kicker', text: '탐험대 이야기' }), G.el('p', { class: 'narr', text: G.tx(G.JD.story.text) }),
      G.el('div', { class: 'say' }, G.avatar(sy.who), G.el('div', { class: 'bubble' }, G.el('b', { text: who.name, style: 'color:' + who.color }), sy.text))],
      G.btn('둘러보자', explore));
  }
  function shutterFx() {
    G.flash.hidden = false; G.flash.classList.remove('go'); void G.flash.offsetWidth; G.flash.classList.add('go');
    setTimeout(function () { G.flash.hidden = true; }, 420);
    if (G.FX) G.FX.audio.shutter();
  }
  function thumbAt(n, crop) {
    var cw = G.canvas.width, ch = G.canvas.height, size = Math.min(cw, ch) * (crop || 0.5);
    var sx = Math.max(0, Math.min(cw - size, (n.x * 0.5 + 0.5) * cw - size / 2)), sy = Math.max(0, Math.min(ch - size, (1 - (n.y * 0.5 + 0.5)) * ch - size / 2));
    var cv = document.createElement('canvas'); cv.width = cv.height = 220;
    try { cv.getContext('2d').drawImage(G.canvas, sx, sy, size, size, 0, 0, 220, 220); return cv.toDataURL('image/jpeg', 0.82); } catch (e) { return ''; }
  }
  function takeClue() {
    var found = [];
    G.JD.clues.forEach(function (c) {
      var t = G.JL.targets[c.id], wp = t.pos(), cs = wp.clone().applyMatrix4(G.camera.matrixWorldInverse);
      if (cs.z > -0.5 || wp.distanceTo(G.camera.position) > t.range) return;
      var n = wp.clone().project(G.camera);
      if (Math.abs(n.x) > 0.82 || Math.abs(n.y) > 0.86) return;
      found.push({ c: c, t: t, n: n });
    });
    shutterFx();
    if (!found.length) { G.toast('사진에 단서가 담기지 않았어요. 눈에 띄는 것을 화면 가운데에 놓고 찍어 보세요.'); return; }
    var fresh = found.filter(function (f) { return !(f.c.id in G.clue); });
    var missing = found.filter(function (f) { return !G.clue[f.c.id]; });
    missing.forEach(function (f) { G.clue[f.c.id] = thumbAt(f.n, f.t.crop); });
    G.clueCount.textContent = '단서 ' + clueN() + ' / ' + G.JD.clues.length; G.dexLabel.textContent = '추리 수첩 ' + clueN() + ' / ' + G.JD.clues.length;
    if (missing.length) G.checkpoint('jordan');
    if (fresh.length) {
      if (G.FX) G.FX.audio.chime();
      G.clueCount.classList.remove('pulse'); void G.clueCount.offsetWidth; G.clueCount.classList.add('pulse');
      G.toast('단서를 찾았어요: ' + fresh.map(function (f) { return f.c.name; }).join(', '));
    } else G.toast('이미 찾은 단서예요: ' + found[0].c.name);
    if (!dedReady && clueN() >= G.JD.need[G.S.tier]) { dedReady = true; G.dedBtn.hidden = false; G.setObjective(G.JD.objectiveReady); }
  }
  function clueCell(c) {
    var has = c.id in G.clue;
    return G.el('div', { class: 'dexcell' + (has ? '' : ' none') },
      has && G.clue[c.id] ? G.el('img', { src: G.clue[c.id], alt: c.name }) : G.el('div', { class: 'ph', text: has ? '' : '?' }),
      G.el('b', { text: has ? c.name : '아직 못 찾은 단서' }),
      G.el('span', { text: has ? G.tx(c.text) : '눈에 띄는 것을 사진으로 찍어 보세요.' }),
      has ? G.refChip(c.ref) : null,
      has && c.aside ? G.el('span', { class: 'aside', text: c.aside }) : null);
  }
  function openClues() {
    G.sheetOverlay([G.el('div', { class: 'q-kicker', text: '추리 수첩 ' + clueN() + ' / ' + G.JD.clues.length }),
      G.el('p', { class: 'q-prompt', text: '찍은 사진이 단서예요. 장절을 성경책에서 찾아보면 더 알 수 있어요.' }),
      G.el('div', { class: 'dexgrid' }, G.JD.clues.map(clueCell))],
      G.btn('닫기', function () { G.overlay.hidden = true; }));
  }
  function multiBlock(q, onOk) {
    var noteBox = G.el('div', {});
    var btns = q.options.map(function (o) {
      var b = G.el('button', { class: 'opt', 'aria-pressed': 'false', on: { click: function () { b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); } } },
        G.el('span', { class: 'mark' }, G.icon('check')), G.el('span', { text: o.label }));
      return b;
    });
    var check = G.el('button', { class: 'btn plain', on: { click: function () {
      var ok = q.options.every(function (o, k) { return (btns[k].getAttribute('aria-pressed') === 'true') === !!o.ok; });
      if (ok) {
        btns.forEach(function (b, k) { b.disabled = true; b.classList.add(q.options[k].ok ? 'ok' : 'rest'); }); check.disabled = true;
        noteBox.replaceChildren(G.el('div', { class: 'note good fadein' }, G.el('b', { text: '다른 점을 모두 찾았어요.' }),
          G.el('div', { style: 'display:flex;gap:6px;flex-wrap:wrap' }, q.options.filter(function (o) { return o.ref; }).map(function (o) { return G.refChip(o.ref); }))));
        onOk();
      } else noteBox.replaceChildren(G.el('div', { class: 'note look fadein' }, G.el('b', { text: '다시 살펴볼까요?' }), G.el('span', { text: '방금 본 장면에 있었던 것만 골라 보세요.' })));
      noteBox.scrollIntoView({ block: 'nearest' });
    } } }, '확인');
    return [G.el('p', { class: 'q-prompt', text: q.prompt }), G.el('div', { class: 'opts' }, btns), check, noteBox];
  }
  function backToExplore() { G.checkpoint('jordan'); G.overlay.hidden = true; G.state = 'explore'; G.camBtn.hidden = false; G.dexBtn.hidden = false; G.dedBtn.hidden = false; }
  function evidenceBlock(ev, onOk) {
    var noteBox = G.el('div', {}), have = G.JD.clues.filter(function (c) { return c.id in G.clue; });
    if (!have.some(function (c) { return ev.ok.indexOf(c.id) >= 0; })) {
      return [G.el('p', { class: 'q-prompt', text: G.tx(ev.q) }),
        G.el('div', { class: 'note look' }, G.el('b', { text: '이 물음에 맞는 단서를 아직 못 찾았어요.' }), G.el('span', { text: '조금 더 둘러보며 사진을 찍고 다시 추리해 보세요.' })),
        G.el('button', { class: 'btn plain', on: { click: backToExplore } }, '더 찾아보기')];
    }
    var btns = have.map(function (c) {
      var b = G.el('button', { class: 'evi', on: { click: function () {
        if (ev.ok.indexOf(c.id) >= 0) {
          btns.forEach(function (x) { x.disabled = true; if (x !== b) x.classList.add('rest'); }); b.classList.add('ok');
          if (ev.find) noteBox.replaceChildren(G.el('div', { style: 'display:flex;flex-direction:column;gap:12px' }, G.findBlock(ev.find, onOk)));
          else {
            var nt = (ev.notes && ev.notes[c.id]) || ev.note, rf = nt.ref;
            if (rf && typeof rf === 'object') rf = rf[G.S.tier];
            noteBox.replaceChildren(G.goodNote(rf || null, G.tx(nt.text))); onOk();
          }
        } else {
          b.classList.add('rest'); b.disabled = true;
          noteBox.replaceChildren(G.el('div', { class: 'note look fadein' }, G.el('b', { text: '그 사진만으로는 알 수 없어요.' }), G.el('span', { text: '다른 단서를 골라 보세요.' })));
        }
        noteBox.scrollIntoView({ block: 'nearest' });
      } } }, G.clue[c.id] ? G.el('img', { src: G.clue[c.id], alt: '' }) : G.el('div', { class: 'ph' }), G.el('span', { text: c.name }));
      return b;
    });
    return [G.el('p', { class: 'q-prompt', text: G.tx(ev.q) }), G.el('div', { class: 'evigrid' }, btns), noteBox];
  }
  function prepareDeduction() {
    G.state = 'deduce';
    G.dedBtn.hidden = true; G.camBtn.hidden = true; G.dexBtn.hidden = true; G.hint.hidden = true;
  }
  function startDeduce() {
    prepareDeduction(); G.checkpoint('deduce');
    var evs = G.JD.evidence.filter(function (e) { return e.tiers.indexOf(G.S.tier) >= 0; }), steps = [];
    evs.forEach(function (e) { steps.push({ k: '증거 고르기', make: function (ok) { return evidenceBlock(e, ok); } }); });
    steps.push({ k: '성경에서 확인', make: function (ok) { return G.findBlock(G.JD.river, ok); } });
    if (G.S.tier === 't2') steps.push({ k: '마지막 추리', make: function (ok) { return multiBlock(G.ALT.spot.t2, ok); } });
    if (G.S.tier === 't3') steps.push({ k: '마지막 추리', make: function (ok) { return G.findrefBlock(G.ALT.spot.t3, ok, 'ded'); } });
    var i = 0;
    (function show() {
      var st = steps[i], last = i === steps.length - 1;
      var nb = G.btn(last ? '추리 결과 보기' : '다음', function () { if (last) conclude(); else { i++; show(); } }); nb.disabled = true;
      G.sheetOverlay([G.el('div', { class: 'q-kicker', text: '추리 ' + (i + 1) + ' / ' + steps.length + ' · ' + st.k }), st.make(function () { nb.disabled = false; })], nb);
    })();
  }
  function conclude() {
    G.checkpoint('return');
    var cc = G.JD.conclusion, who = G.C.chars[cc.say.who];
    G.sheetOverlay([G.el('div', { class: 'q-kicker', text: '추리 결과' }),
      G.el('p', { class: 'q-prompt', text: G.JD.place }),
      G.el('p', { class: 'narr', text: G.tx(cc.text) }),
      G.el('div', { style: 'display:flex;gap:6px;flex-wrap:wrap' }, cc.refs.map(function (r) { return G.refChip(r); })),
      G.el('div', { class: 'found-list' }, cc.found.map(function (f) { return G.el('div', { class: 'it' }, G.el('span', {}, f.text + ' '), G.refChip(f.ref)); })),
      G.el('div', { class: 'say' }, G.avatar(cc.say.who), G.el('div', { class: 'bubble' }, G.el('b', { text: who.name, style: 'color:' + who.color }), cc.say.text))],
      G.btn('타임머신 다시 맞추기', function () {
        var nb = G.btn('다음', function () {
          G.sheetOverlay([G.el('div', { class: 'q-kicker', text: '돌아가는 길에 찾은 말씀' }),
            G.el('p', { class: 'q-prompt', text: '길을 잘못 들었지만, 성경의 다른 장면을 직접 보고 왔어요.' }),
            G.el('div', { class: 'vcards' }, G.ALT.cards.map(function (cd) {
              return G.el('div', { class: 'vcard pop' }, G.el('div', { class: 'r', text: cd.ref }), G.el('div', { class: 't', text: cd.title }), G.el('div', { class: 'm', text: G.ALT.title + ' · 성경책에서 직접 읽어 보세요' }), G.el('span', { class: 'tag', text: '돌아가는 길에 찾은 말씀' }));
            }))],
            G.btn('모세가 있는 곳으로', function () { G.warpTo(G.C3.route.warpTitle, G.begin); }));
        }); nb.disabled = true;
        G.sheetOverlay([G.el('div', { class: 'q-kicker', text: '타임머신 다시 맞추기' }),
          G.findBlock({ ref: G.ALT.back.ref, prompt: G.ALT.back.prompt, confirm: G.ALT.back.confirm }, function () { nb.disabled = false; })], nb);
      }));
  }

  G.enterJordan = enterJordan;
  G.takeClue = takeClue;
  G.openClues = openClues;
  G.startDeduce = startDeduce;
  return function initJordan() {
    G.clue = {}, dedReady = false;
  };
};
