/* 화면 크기와 매 프레임 갱신. game.js가 공유 상태 G를 전달하고 초기화 순서를 정한다. */
BO3D.gameModules = BO3D.gameModules || {};
BO3D.gameModules.loop = function (G) {
  'use strict';
  var last;
  function resize() {
    var w = G.root.clientWidth, h = G.root.clientHeight;
    if (!w || !h) return;
    G.renderer.setSize(w, h, false);
    G.camera.aspect = w / h; G.baseFov = w < h ? 62 : 50; G.camera.fov = G.baseFov; G.viewShift = 0; G.camera.clearViewOffset(); G.camera.updateProjectionMatrix();
  }
  function frame(t) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, (t - last) / 1000); last = t; G.now += dt;
    var horeb = G.cur === 'horeb' || !G.JL;
    if (horeb) {
      if (G.bush.update) G.bush.update(G.now);
      if (G.machine.update) G.machine.update(G.now);
      if (G.updateSheep) G.updateSheep(dt);
      G.scraps.forEach(function (s) { if (s.group.visible && s.update) s.update(G.now); });
    } else G.JL.update(dt, G.now);
    if (G.player) {
      if (G.canMove()) {
        G.movePlayer(dt); G.moveFollowers(dt);
        if (horeb) {
          G.partObjs.forEach(function (po, pi) {
            if (po.taken) return;
            po.mesh.rotation.y = G.now * 1.6; po.mesh.position.y = 0.95 + Math.sin(G.now * 2.2 + pi) * 0.1;
            if (G.dist2(G.player.group.position.x, G.player.group.position.z, G.PARTS[pi].at[0], G.PARTS[pi].at[1]) < 1.7) G.takePart(pi);
          });
          if (G.state === 'explore') {
            var s = G.scraps[G.step], pp = G.player.group.position;
            if (s && !s.taken && G.dist2(pp.x, pp.z, s.group.position.x, s.group.position.z) < 1.7) G.collect(G.step);
          }
        }
      } else { G.pspeed = 0; G.followers.forEach(function (f) { f.spd = 0; }); }
      if (horeb) G.moveMoses(dt);
      if (G.player.update) G.player.update(dt, G.pspeed);
      G.followers.forEach(function (f) { if (f.update) f.update(dt, f.spd || 0); });
      if (G.state === 'depart') G.updateDepart(dt);
      if (horeb) G.updateTracker();
      G.updateCamera(dt);
      var pp2 = G.player.group.position, sun = horeb ? G.env.sun : G.JL.sun;
      if (horeb) sun.position.set(pp2.x - 38, pp2.y + 46, pp2.z + 30); else sun.position.set(pp2.x + 30, pp2.y + 50, pp2.z + 34);
      sun.target.position.copy(pp2);
    } else {
      /* 처음 화면 뒤로 보이는 풍경 */
      var a = G.now * 0.05;
      G.camera.position.set(G.P.start[0] + Math.sin(a) * 9, G.H(G.P.start[0], G.P.start[1]) + 5.5, G.P.start[1] + 10);
      G.camera.lookAt(G.P.bush[0], 6, G.P.bush[1] - 30);
    }
    if (horeb && G.bushFx) G.bushFx.update(G.now, G.camera, G.renderer.domElement.height);
    if (G.FX && G.player) G.FX.audio.setFire(horeb ? G.dist2(G.player.group.position.x, G.player.group.position.z, G.P.bush[0], G.P.bush[1]) : 999);
    var rs = horeb ? G.scene : G.JL.scene;
    if (G.post) G.post.render(rs, G.camera); else G.renderer.render(rs, G.camera);
    if (G.wantShot) { G.wantShot = false; if (horeb) G.takeShot(); else G.takeClue(); }
  }

  G.resize = resize;
  G.frame = frame;
  return function initLoop() {

    window.addEventListener('resize', resize);

    last = performance.now();
  };
};
