/* 자동 점검용 BO3D.debug. game.js가 공유 상태 G를 전달하고 초기화 순서를 정한다. */
BO3D.gameModules = BO3D.gameModules || {};
BO3D.gameModules.debug = function (G) {
  'use strict';



  return function initDebug() {
    /* 자동 점검용 (화면에는 영향 없음) */
    BO3D.debug = {
      level: function () { return G.cur; },
      clues: function () { return Object.keys(G.clue); },
      jordan: function () { return G.JL ? { P: G.JL.P, targets: Object.keys(G.JL.targets).map(function (k) { var v = G.JL.targets[k].pos(); return [k, v.x, v.y, v.z]; }) } : null; },
      parts: function () { return { found: G.partsFound, at: G.PARTS.map(function (p) { return p.at; }), done: G.sceneDone }; },
      dex: function () { return Object.keys(G.dex); },
      sheep: function () { return G.sheep ? G.sheep.length : 0; },
      awe: function (view, pic) { return G.showAwe ? G.showAwe(view, pic) : null; },
      aweRect: function () { return G.aweRect ? G.aweRect() : null; },
      aweNext: function (arg) { return G.aweNext ? G.aweNext(arg) : null; },
      aweState: function () { return G.aweState ? G.aweState() : null; },
      /* 전체 소리 크기와 바람, 불, 음악의 크기. fireMax는 넘지 못하는 선에 섰을 때의 불 소리 크기 */
      audioLevels: function () {
        var A = G.FX && G.FX.audio, L = A && A.levels ? A.levels() : null;
        if (L) { var top = A.fireLevel(G.P.witnessRadius); L.fireMax = top.fire; L.crackleMax = top.crackle; }
        return L;
      },
      state: function () { return { state: G.state, step: G.step, x: G.player && G.player.group.position.x, z: G.player && G.player.group.position.z, mosesArrived: G.mosesArrived }; },
      stick: function (x, y) { G.stick.x = x; G.stick.y = y; },
      yaw: function (v) { G.camYaw = v; G.lastDrag = G.now + 999; },
      goto: function (x, z) { G.player.group.position.set(x, G.H(x, z), z); G.trail.push([x, z]); }
    };
  };
};
