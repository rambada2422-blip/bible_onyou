/* 3D 장면 설정: OT-09 불붙은 떨기나무와 부르심 (출 3:1-12). 호렙 산 기슭.
 * game.js(3D 장면 틀)가 이 설정을 읽어 장면을 만든다. 새 3D 장면은 이 파일처럼 "설정 + 지형 함수"를 쓴다(web3d/js/scenes.md 참고).
 * 이 장면만의 것: 모세(B-2 GLB, 걷는 길과 자세), 떨기나무의 불(부품 2 뒤부터), 양 떼 40마리, 압도 장면 영상.
 * 지형과 소품 배치는 web3d/js/world.js. 본문에 맞춘 점과 감수가 필요한 설정은 world.js와 docs/06_호렙산_부품퀴즈.md에 있다.
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  BO3D.scene3d = BO3D.scene3d || {};
  BO3D.scene3d['OT-09'] = function (api) {
    var T = THREE, W = BO3D.world, P = W.P, FX = api.FX, C3 = BO.content3d || null, HQ = C3 ? C3.horeb : null;
    var scene = new T.Scene(), env = W.build(scene);
    function H(x, z) { return W.height(x, z); }
    function place(obj, x, z, lift) { obj.position.set(x, H(x, z) + (lift || 0), z); return obj; }

    /* 떨기나무: 불은 3:2 대목(부품 2를 찾은 뒤)부터 보인다. 그 전에는 초록 덤불이다 */
    var bush = api.mk('bush', null, function () {
      var g = api.fallback('#6F8448', 1.6, 1.0); var l = new T.PointLight('#FF9A3C', 1.4, 18); l.position.y = 1.4; g.add(l);
      return { group: g, update: function () {} };
    });
    scene.add(place(bush.group, P.bush[0], P.bush[1]));
    var bushFx = FX ? FX.upgradeBush(bush.group) : null, bushGlow = [], bushLit = false;
    bush.group.traverse(function (o) { if (o !== bush.group && o.visible && (o.isLight || o.isPoints || o.isSprite || (o.material && (o.material.transparent || o.material.isShaderMaterial)))) bushGlow.push(o); });
    if (bushFx) bushGlow.push(bushFx.group);
    function setBushLit(on) { bushLit = on; bushGlow.forEach(function (o) { o.visible = on; }); }
    setBushLit(false);

    /* 모세: Blender로 만든 GLB(뼈대와 Idle·Walk·HideFace)가 있으면 바꿔 끼운다.
       2026-11-14 대표 승인으로 B-2 모세(tools/blender/moses_b2.py + moses_b2_rig.py)가 기본이다. 기존 모세는 web3d/assets/old/ */
    var moses = api.mk('moses', null, function () { return { group: api.fallback('#8A5A3C', 1.75, 0.27), setPose: function () {}, update: function () {} }; });
    scene.add(place(moses.group, P.mosesStart[0], P.mosesStart[1]));
    moses.group.rotation.y = Math.PI * 0.8;
    if (moses.setPose) moses.setPose('approach');
    var mosesPose = 'approach';
    api.person('moses', function (nm) {
      nm.group.position.copy(moses.group.position); nm.group.rotation.y = moses.group.rotation.y;
      scene.remove(moses.group); scene.add(nm.group);
      var setP = nm.setPose; nm.setPose = function (name) { mosesPose = name; setP(name); };
      moses = nm;
      if (mosesPose !== 'approach') { nm.setPose(mosesPose); nm.update(1, false); }
    }, { once: { HideFace: 'hideface' } });

    /* 양 떼 (출 3:1). 40마리를 한 번에 그린다 (web3d/js/flock.js) */
    var flock = null;
    try { if (BO3D.flock) flock = BO3D.flock.create(scene, W, { count: 40 }); } catch (e) { console.error('flock', e); }

    /* 모세는 양 떼 곁에서 출발해 언덕의 완만한 서쪽 어깨로 올라가 떨기나무 앞에 선다 */
    var walking = false, arrived = false, leg = 0, hold = 0;
    function lerpAngle(a, b, t) { var d = Math.atan2(Math.sin(b - a), Math.cos(b - a)); return a + d * t; }
    function moveMoses(dt) {
      if (!walking) { if (moses.update) moses.update(dt, false); return; }
      var p = moses.group.position, tg = P.mosesPath[leg], dx = tg[0] - p.x, dz = tg[1] - p.z, d = Math.sqrt(dx * dx + dz * dz);
      if (d < 0.25) {
        leg++;
        if (hold && leg >= hold) { walking = false; if (moses.update) moses.update(dt, false); return; }
        if (leg >= P.mosesPath.length) {
          walking = false; arrived = true;
          moses.group.rotation.y = Math.atan2(P.bush[0] - p.x, P.bush[1] - p.z);
          if (moses.update) moses.update(dt, false);
        }
        return;
      }
      var st = Math.min(d, 1.9 * dt);
      p.x += dx / d * st; p.z += dz / d * st; p.y = H(p.x, p.z);
      moses.group.rotation.y = lerpAngle(moses.group.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 5));
      if (moses.update) moses.update(dt, true);
    }
    function v3(x, y, z) { return new T.Vector3(x, y, z); }
    function dist2(ax, az, bx, bz) { var dx = ax - bx, dz = az - bz; return Math.sqrt(dx * dx + dz * dz); }

    return {
      id: 'OT-09', scene: scene, sun: env.sun, sunOff: [-38, 46, 30],
      height: W.height, walkable: W.walkable,
      /* 언덕에는 오르지 않는다 (세 아이는 목격자) */
      edge: function (x, z) { return W.hill(x, z) >= 0.75 ? (HQ ? HQ.edge : { who: 'onwoo', text: '여기까지만 가자. 우리는 지켜보는 사람이야.' }) : null; },
      P: { start: P.start, machine: P.machine, machineRot: -0.5, parts: P.parts, lookSpot: P.lookSpot,
        look: { focus: P.bush, mid: P.mosesEnd, dy: -0.6 } },
      partRocks: true,
      detector: HQ ? HQ.detector : '탐지기', askLabel: HQ ? HQ.askLabel : '탐지기 물음 풀기',
      intro: HQ ? HQ.intro : null, quests: HQ ? HQ.quests : null,
      lookText: '모세가 하나님의 산에 이른 이야기를 성경에서 찾아 읽은 뒤 다시 골라 보세요.',
      /* 재료(부품) i를 찾은 뒤 보여 주는 대목 번호. 나머지 대목은 eventStart부터 지켜보기에서 */
      partBeats: [0, 1], eventStart: 2,
      vision: HQ ? HQ.vision : null, visionKey: 'bush',
      sceneDoneText: '떨기나무 장면을 끝까지 지켜봐야 떠날 수 있어요.',
      dex: [
        { id: 'sheep', name: '양 떼', desc: '모세가 치던 장인 이드로의 양 떼', ref: '출 3:1', hint: '출발한 곳에서 가까운 곳에 모여 있어요.', range: 17,
          pos: function () { if (flock) { var c = flock.center(); return v3(c.x, c.y + 0.6, c.z); } return v3(P.flock[0], H(P.flock[0], P.flock[1]) + 0.6, P.flock[1]); } },
        { id: 'moses', name: '모세', desc: '미디안 제사장 이드로의 사위. 장인의 양 떼를 치고 있었다', ref: '출 3:1', hint: '양 떼 가까이에서 찾아보세요.', range: 19,
          pos: function () { var p = moses.group.position; return v3(p.x, p.y + 1.1, p.z); } },
        { id: 'horeb', name: '하나님의 산 호렙', desc: '모세가 양 떼를 이끌고 이른 산', ref: '출 3:1', hint: '가장 높은 봉우리를 화면 가운데에 담아 보세요.', range: 500, crop: 0.95,
          pos: function () { return v3(P.mountain[0], H(P.mountain[0], P.mountain[1]) * 0.62, P.mountain[1]); } },
        { id: 'bush', name: '불붙은 떨기나무', desc: '불이 붙었으나 타서 없어지지 않은 떨기나무', ref: '출 3:2', hint: '모세가 가는 쪽으로 따라가면 보여요.', range: 36,
          visible: function () { return bushLit; },
          pos: function () { return v3(P.bush[0], H(P.bush[0], P.bush[1]) + 1.3, P.bush[1]); } }
      ],
      reset: function () {
        walking = false; arrived = false; leg = 0; hold = 0; setBushLit(false);
        place(moses.group, P.mosesStart[0], P.mosesStart[1]); moses.group.rotation.y = Math.PI * 0.8;
        if (moses.setPose) moses.setPose('approach');
        if (flock) flock.reset();
      },
      /* 부품 i를 주운 때: 부품 2(출 3:2-3 대목) 뒤부터 떨기나무의 불이 보인다 */
      partFound: function (i) { if (i === 1) setBushLit(true); },
      /* 대목을 읽고 다시 탐험할 때: 3:1 뒤에는 언덕 기슭까지만, 3:2-3(보려고 감) 뒤에 언덕에 오른다 */
      partContinue: function (i) {
        if (i === 0) { walking = true; leg = 0; hold = P.mosesFoot; }
        if (i === 1) { hold = 0; if (leg < P.mosesPath.length) walking = true; }
      },
      lookupPose: function () {
        walking = false; arrived = true; setBushLit(true);
        place(moses.group, P.mosesEnd[0], P.mosesEnd[1]);
        moses.group.rotation.y = Math.atan2(P.bush[0] - P.mosesEnd[0], P.bush[1] - P.mosesEnd[1]);
        if (flock) flock.settle();
      },
      /* 대목마다 모세의 자세. 영상에서 이미 얼굴을 가렸으면 그대로 둔다 */
      beatPose: function (i, afterVision) {
        var hide = i >= 4; /* 출 3:6부터 얼굴을 가림 */
        if (moses.setPose) moses.setPose(afterVision || hide ? 'hideface' : 'approach');
      },
      update: function (dt, now, ctx) {
        if (bush.update) bush.update(now);
        if (flock) { flock.setAvoid(ctx.player); flock.update(dt, now, moses.group.position, walking, leg); }
        moveMoses(dt);
      },
      render: function (camera, renderer) { if (bushFx && bushLit) bushFx.update(api.now(), camera, renderer.domElement.height); },
      audio: function (A, pp) {
        if (flock) { var c = flock.center(); A.setFlock(dist2(pp.x, pp.z, c.x, c.z)); } else A.setFlock(999);
        A.setFire(bushLit ? dist2(pp.x, pp.z, P.bush[0], P.bush[1]) : 999);
      },
      menuCam: function (camera, now) {
        var a = now * 0.05;
        camera.position.set(P.start[0] + Math.sin(a) * 9, H(P.start[0], P.start[1]) + 5.5, P.start[1] + 10);
        camera.lookAt(P.bush[0], 6, P.bush[1] - 30);
      },
      debug: {
        moses: function () { return { key: moses.key || 'code', pose: mosesPose }; },
        flock: function () { return flock ? { n: flock.count, c: flock.center() } : null; },
        arrived: function () { return arrived; },
        P: P
      }
    };
  };
})();
