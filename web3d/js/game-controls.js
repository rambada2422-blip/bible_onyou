/* 입력, 이동과 카메라. game.js가 공유 상태 G를 전달하고 초기화 순서를 정한다. */
BO3D.gameModules = BO3D.gameModules || {};
BO3D.gameModules.controls = function (G) {
  'use strict';
  /* ── 입력 ── */
  function zoneLeft(e) { var r = G.root.getBoundingClientRect(); return (e.clientX - r.left) < r.width * 0.55 && (e.clientY - r.top) > r.height * 0.42; }
  function up(e) {
    if (e.pointerId === G.stick.id) { G.stick.id = null; G.stick.x = G.stick.y = 0; G.base.hidden = true; }
    if (e.pointerId === G.drag.id) G.drag.id = null;
  }

  /* ── 매 프레임 ── */
  function snapCamera() {
    var p = G.player ? G.player.group.position : new G.T.Vector3(G.P.start[0], G.H(G.P.start[0], G.P.start[1]), G.P.start[1]);
    var fx = Math.sin(G.camYaw), fz = Math.cos(G.camYaw);
    G.camPos.set(p.x - fx * G.camDist, p.y + G.camPitchH + 1.3, p.z - fz * G.camDist);
    G.camLook.set(p.x, p.y + 1.35, p.z); G.camLookT.copy(G.camLook);
  }
  function movePlayer(dt) {
    var ix = G.stick.x, iy = G.stick.y;
    if (G.keys.a || G.keys.arrowleft) ix -= 1; if (G.keys.d || G.keys.arrowright) ix += 1;
    if (G.keys.w || G.keys.arrowup) iy += 1; if (G.keys.s || G.keys.arrowdown) iy -= 1;
    var m = Math.sqrt(ix * ix + iy * iy);
    if (m > 1) { ix /= m; iy /= m; m = 1; }
    G.pspeed = 0;
    if (m < 0.12) return;
    var fx = Math.sin(G.camYaw), fz = Math.cos(G.camYaw), rx = -fz, rz = fx;
    var mx = fx * iy + rx * ix, mz = fz * iy + rz * ix, sp = 4.6 * m;
    var p = G.player.group.position, nx = p.x + mx / m * sp * dt, nz = p.z + mz / m * sp * dt;
    /* 지켜보는 자리의 경계 */
    var d = G.dist2(nx, nz, G.P.bush[0], G.P.bush[1]);
    if (G.cur === 'horeb' && d < G.P.witnessRadius) {
      var k = G.P.witnessRadius / Math.max(d, 0.001);
      nx = G.P.bush[0] + (nx - G.P.bush[0]) * k; nz = G.P.bush[1] + (nz - G.P.bush[1]) * k;
      if (G.now - G.lastToast > 7) { G.lastToast = G.now; G.ring.material.opacity = 0.45; G.toast('여기까지만 가자. 우리는 지켜보는 사람이야.', G.S.ch === 'onwoo' ? 'hyu' : 'onwoo'); }
    }
    if (!G.WALK(nx, nz)) {
      if (G.cur === 'jordan' && G.now - G.lastToast > 7) { var eg = G.JL.edge(nx, nz); if (eg !== 'far') { G.lastToast = G.now; G.toast(eg === 'river' ? G.JD.edgeRiver : G.JD.edgeCrowd, G.S.ch === 'onwoo' ? 'hyu' : 'onwoo'); } }
      if (G.WALK(nx, p.z)) nz = p.z; else if (G.WALK(p.x, nz)) nx = p.x; else return;
    }
    var moved = G.dist2(nx, nz, p.x, p.z);
    p.set(nx, G.H(nx, nz), nz);
    G.player.group.rotation.y = G.lerpAngle(G.player.group.rotation.y, Math.atan2(mx, mz), Math.min(1, dt * 12));
    G.pspeed = moved / Math.max(dt, 0.001);
    if (!G.trail.length || G.dist2(G.trail[G.trail.length - 1][0], G.trail[G.trail.length - 1][1], nx, nz) > 0.3) { G.trail.push([nx, nz]); if (G.trail.length > 80) G.trail.shift(); }
    if (G.now - G.lastDrag > 1.6 && iy > -0.3) G.camYaw = G.lerpAngle(G.camYaw, Math.atan2(mx, mz), Math.min(1, dt * 0.9));
  }
  function moveFollowers(dt) {
    G.followers.forEach(function (f, k) {
      var idx = G.trail.length - 1 - 3, tgt = idx >= 0 ? G.trail[idx] : null, p = f.group.position;
      f.spd = 0;
      if (!tgt) return;
      var hd = G.player.group.rotation.y, side = k ? 1.3 : -1.3;
      var dx = tgt[0] + Math.cos(hd) * side - p.x, dz = tgt[1] - Math.sin(hd) * side - p.z, d = Math.sqrt(dx * dx + dz * dz);
      if (d < 0.15) return;
      var sp = Math.min(5.2, d * 4), st = Math.min(d, sp * dt);
      p.x += dx / d * st; p.z += dz / d * st; p.y = G.H(p.x, p.z);
      f.group.rotation.y = G.lerpAngle(f.group.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 10));
      f.spd = st / Math.max(dt, 0.001);
    });
  }
  function moveMoses(dt) {
    if (!G.mosesWalking) { if (G.moses.update) G.moses.update(dt, false); return; }
    var p = G.moses.group.position, dx = G.P.mosesEnd[0] - p.x, dz = G.P.mosesEnd[1] - p.z, d = Math.sqrt(dx * dx + dz * dz);
    if (d < 0.2) {
      G.mosesWalking = false; G.mosesArrived = true;
      G.moses.group.rotation.y = Math.atan2(G.P.bush[0] - p.x, G.P.bush[1] - p.z);
      if (G.moses.update) G.moses.update(dt, false);
      return;
    }
    var st = Math.min(d, 2.1 * dt);
    p.x += dx / d * st; p.z += dz / d * st; p.y = G.H(p.x, p.z);
    G.moses.group.rotation.y = G.lerpAngle(G.moses.group.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 6));
    if (G.moses.update) G.moses.update(dt, true);
  }
  function updateCamera(dt) {
    var p = G.player.group.position, k = 1 - Math.exp(-dt * 6), want = new G.T.Vector3();
    if (G.state === 'depart' || G.state === 'end2') {
      var mp = G.machine.group.position;
      want.set(G.P.machine[0] - 4, G.H(G.P.machine[0], G.P.machine[1]) + 3.2, G.P.machine[1] + 10.5);
      G.camLookT.set(mp.x, mp.y + 1.4, mp.z); k = 1 - Math.exp(-dt * 3);
    } else if (G.state === 'event' || G.state === 'gates' || G.state === 'end') {
      /* 아이들 어깨 너머로 떨기나무와 모세를 본다 */
      var ax = p.x - G.P.bush[0], az = p.z - G.P.bush[1], al = Math.sqrt(ax * ax + az * az) || 1;
      want.set(p.x + ax / al * 3.6 + az / al * 1.5, p.y + 2.5, p.z + az / al * 3.6 - ax / al * 1.5);
      k = 1 - Math.exp(-dt * 2.2);
    } else {
      var fx = Math.sin(G.camYaw), fz = Math.cos(G.camYaw);
      want.set(p.x - fx * G.camDist, p.y + G.camPitchH + 1.3, p.z - fz * G.camDist);
      G.camLookT.set(p.x + fx * 4.5, p.y + 1.75, p.z + fz * 4.5);
    }
    var ground = G.H(want.x, want.z) + 1.0;
    if (want.y < ground) want.y = ground;
    G.camPos.lerp(want, k); G.camLook.lerp(G.camLookT, k);
    G.camera.position.copy(G.camPos); G.camera.lookAt(G.camLook);
    /* 자막 창이 열리면 장면을 화면 위쪽으로 올리고, 사건을 볼 때는 당겨 본다 */
    var wantShift = (G.state === 'event') ? 0.2 : (G.state === 'caption' ? 0.14 : 0);
    var wantFov = (G.state === 'event') ? 46 : G.baseFov;
    if (Math.abs(wantShift - G.viewShift) > 0.001 || Math.abs(wantFov - G.camera.fov) > 0.05) {
      G.viewShift += (wantShift - G.viewShift) * Math.min(1, dt * 3);
      G.camera.fov += (wantFov - G.camera.fov) * Math.min(1, dt * 3);
      var vw = G.root.clientWidth, vh = G.root.clientHeight;
      if (G.viewShift > 0.002) G.camera.setViewOffset(vw, vh, 0, vh * G.viewShift, vw, vh); else G.camera.clearViewOffset();
      G.camera.updateProjectionMatrix();
    }
  }

  G.snapCamera = snapCamera;
  G.movePlayer = movePlayer;
  G.moveFollowers = moveFollowers;
  G.moveMoses = moveMoses;
  G.updateCamera = updateCamera;
  return function initControls() {

    G.touch.addEventListener('pointerdown', function (e) {
      if (G.state !== 'explore' && G.state !== 'free') return;
      var r = G.root.getBoundingClientRect();
      if (G.stick.id === null && zoneLeft(e)) {
        G.stick.id = e.pointerId; G.stick.bx = e.clientX - r.left; G.stick.by = e.clientY - r.top;
        G.base.style.left = G.stick.bx + 'px'; G.base.style.top = G.stick.by + 'px'; G.base.hidden = false; G.knob.style.transform = 'translate(-50%,-50%)';
        G.hint.hidden = true;
      } else if (G.drag.id === null) { G.drag.id = e.pointerId; G.drag.x = e.clientX; }
      try { G.touch.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
    });
    G.touch.addEventListener('pointermove', function (e) {
      var r = G.root.getBoundingClientRect();
      if (e.pointerId === G.stick.id) {
        var dx = e.clientX - r.left - G.stick.bx, dy = e.clientY - r.top - G.stick.by, m = Math.sqrt(dx * dx + dy * dy), R = 52;
        if (m > R) { dx *= R / m; dy *= R / m; }
        G.stick.x = dx / R; G.stick.y = -dy / R;
        G.knob.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
      } else if (e.pointerId === G.drag.id) { G.camYaw -= (e.clientX - G.drag.x) * 0.008; G.drag.x = e.clientX; G.lastDrag = G.now; }
    });
    G.touch.addEventListener('pointerup', up); G.touch.addEventListener('pointercancel', up);
    window.addEventListener('keydown', function (e) { G.keys[e.key.toLowerCase()] = true; });
    window.addEventListener('keyup', function (e) { G.keys[e.key.toLowerCase()] = false; });
  };
};
