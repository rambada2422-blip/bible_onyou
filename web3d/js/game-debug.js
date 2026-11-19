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
      state: function () { return { state: G.state, step: G.step, x: G.player && G.player.group.position.x, z: G.player && G.player.group.position.z, mosesArrived: G.mosesArrived }; },
      stick: function (x, y) { G.stick.x = x; G.stick.y = y; },
      yaw: function (v) { G.camYaw = v; G.lastDrag = G.now + 999; },
      goto: function (x, z) { G.player.group.position.set(x, G.H(x, z), z); G.trail.push([x, z]); }
    };
  };
};
