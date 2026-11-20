/* 탐험을 이어 갈 구간과 게임 안에서 찍은 사진만 이 기기에 저장한다. */
BO3D.gameModules = BO3D.gameModules || {};
BO3D.gameModules.save = function (G) {
  'use strict';
  var key = 'bo3d.save.v1', stage = null, chosen = null, previous = null;
  var stages = ['route', 'horeb', 'watch', 'gates', 'reward', 'free', 'end', 'jordan', 'deduce', 'return'];

  function photos(value, entries) {
    var kept = {};
    if (!value || typeof value !== 'object') return kept;
    entries.forEach(function (entry) {
      if (!Object.prototype.hasOwnProperty.call(value, entry.id)) return;
      var data = value[entry.id];
      if (typeof data === 'string' && (data === '' || /^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(data))) kept[entry.id] = data;
    });
    return kept;
  }

  G.readProgress = function () {
    try {
      previous = localStorage.getItem(key);
      if (!previous) return null;
      var s = JSON.parse(previous);
      if (!s || stages.indexOf(s.stage) < 0 || !G.C.tiers.some(function (t) { return t.id === s.tier; }) ||
          ['choeon', 'hyu', 'onwoo'].indexOf(s.ch) < 0 || !Number.isInteger(s.parts) ||
          s.parts < 0 || s.parts > G.PARTS.length) return null;
      if (s.stage === 'horeb' && s.parts === G.PARTS.length) return null;
      if (['watch', 'gates', 'reward', 'free', 'end'].includes(s.stage) && s.parts !== G.PARTS.length) return null;
      s.dex = photos(s.dex, G.DEX); s.clues = photos(s.clues, G.JD.clues);
      if (['deduce', 'return'].includes(s.stage) && Object.keys(s.clues).length < G.JD.need[s.tier]) s.stage = 'jordan';
      return s;
    } catch (e) { return null; }
  };

  G.chooseRoute = function (destination) {
    chosen = destination; G.clue = {};
    G.checkpoint(chosen === 'ALT-02' ? 'jordan' : 'horeb');
  };

  G.checkpoint = function (next) {
    if (next) stage = next;
    if (!stage) return;
    if (stage === 'route') chosen = null;
    else if (!chosen) chosen = 'EX-01';
    var data = { stage: stage, route: chosen, tier: G.S.tier, ch: G.S.ch,
      parts: G.cur === 'horeb' && stage !== 'route' && G.state !== 'route' ? G.partsFound : 0,
      dex: G.dex, clues: G.clue, muted: !!(G.FX && G.FX.audio.isMuted()) };
    try {
      // 다른 탭에서 새로 시작했거나 더 진행했다면 이전 화면이 그 저장을 덮지 않는다.
      if (localStorage.getItem(key) !== previous) return;
      var raw = JSON.stringify(data);
      if (raw === previous) return;
      try { localStorage.setItem(key, raw); }
      catch (e) {
        if (e.name !== 'QuotaExceededError') return;
        // 새 사진이 넘칠 때는 이미 저장된 사진과 새 발견 표시를 먼저 지킨다.
        var old;
        try { old = JSON.parse(previous) || {}; } catch (invalid) { old = {}; }
        function reduced(album, stored) {
          var kept = {};
          Object.keys(album).forEach(function (id) { kept[id] = stored && stored[id] === album[id] ? album[id] : ''; });
          return kept;
        }
        data.dex = reduced(G.dex, old.dex); data.clues = reduced(G.clue, old.clues);
        raw = JSON.stringify(data);
        try { localStorage.setItem(key, raw); }
        catch (again) {
          if (again.name !== 'QuotaExceededError') return;
          data.dex = reduced(G.dex); data.clues = reduced(G.clue);
          raw = JSON.stringify(data); localStorage.setItem(key, raw);
        }
      }
      previous = raw;
    } catch (e) { /* 저장할 수 없어도 지금 탐험은 이어진다. */ }
  };

  G.restart = function () {
    stage = null; chosen = null; previous = null; G.dex = {}; G.clue = {};
    try { localStorage.removeItem(key); } catch (e) { /* 기기 저장이 꺼져 있다. */ }
    G.menu(true);
  };

  G.resume = function () {
    var s = G.readProgress();
    if (!s) { G.menu(); return; }
    stage = s.stage; chosen = s.route === 'ALT-02' ? 'ALT-02' : 'EX-01';
    G.S.tier = s.tier; G.S.ch = s.ch; G.dex = s.dex; G.clue = s.clues;
    G.root.className = 'g3 app ' + G.S.tier;
    G.setMuted(s.muted === true);
    if (G.FX) G.FX.audio.start();
    if (stage === 'route') G.route();
    else if (['jordan', 'deduce', 'return'].includes(stage)) G.enterJordan(s);
    else G.begin(s);
  };
};
