/* 3D 장면 설정: OT-18 요단 강을 건너다 (수 3:1-4:24). 시대 추리에 쓰던 요단 강 세계(jordan.js)를 그대로 쓴다.
 * 방향: 아이들은 동쪽 둑(+Z)에 서서 서쪽(-Z, 여리고 쪽)을 본다. 오른쪽(+X)이 상류다(수 3:16).
 * 본문에 맞춘 점 (content/ot/OT-18.json design3d)
 *  - 처음에 요단은 언덕까지 넘친다(수 3:15). 제사장들의 발이 물가에 잠기자 물이 끊어지고 강바닥이 마른다(수 3:15-17).
 *    물이 쌓인 곳은 "심히 멀리" 아담 읍 쪽이므로(수 3:16) 물 벽은 그리지 않는다. 보이는 것은 물이 빠지고 드러난 마른 땅이다.
 *  - 제사장들은 궤를 멘 채 요단 가운데 마른 땅에 서 있고, 백성은 궤에서 멀리 떨어진 하류 쪽으로 건넌다(수 3:4, 3:17).
 *  - 제사장들이 올라와 발바닥이 뭍을 밟자 물이 제자리로 돌아와 언덕까지 넘친다(수 4:18).
 *  - 여호수아는 서 있기만 한다. 지팡이를 들거나 손을 내밀지 않는다. 궤는 덮개로 덮여 있고 빛나지 않는다. 하나님은 말씀 자막으로만.
 * 감수가 필요한 설정: 진과 장막의 자리, 제사장의 수(넷), 백성이 건너는 자리, 제사장들이 올라온 쪽(서쪽으로 둠), 재료가 놓인 곳.
 * 세 아이는 동쪽 둑 위에서만 다닌다(목격자).
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  BO3D.scene3d = BO3D.scene3d || {};
  BO3D.scene3d['OT-18'] = function (api) {
    var T = THREE, J = BO3D.jordan, JP = J.P, M2 = BO3D.models2 || {}, FX = api.FX;
    var JL = J.build({ staged: true }), scene = JL.scene, H = JL.height;
    var BANK = [22, 10.6], MID = [22, -6], WEST = [22, -24.5], CROSS = [-44, -6], GILGAL = [-45, -42];

    /* 강물: 처음에는 언덕까지 넘치고(수 3:15), 물이 끊어지면 강바닥 아래로 내려간다 */
    var FULL = 0.55, LOW = JP.bedY - 0.9, level = FULL, want = FULL, water = null;
    try {
      if (M2.waterSurface) {
        water = M2.waterSurface(460, 32);
        water.mesh.position.set(0, FULL, -6);
        scene.add(water.mesh);
      }
    } catch (e) { console.error('water', e); water = null; }
    if (!water) {
      var wm = new T.Mesh(new T.PlaneGeometry(460, 32), new T.MeshStandardMaterial({ color: '#3E8FA6', transparent: true, opacity: 0.86, roughness: 0.25 }));
      wm.rotation.x = -Math.PI / 2; wm.position.set(0, FULL, -6); scene.add(wm); water = { mesh: wm, update: function () {} };
    }

    /* 진의 장막(수 3:14). 모양은 본문에 없다. 단순한 천막으로 둔다 */
    function tent(seed) {
      var g = new T.Group(), r = BO3D.world ? BO3D.world.rng(seed) : Math.random, cols = ['#8A6A4A', '#6E5A44', '#9A7A54', '#5E4E3E'];
      var w = 2.4 + r() * 1.4, d = 2.0 + r() * 1.2, h = 1.4 + r() * 0.5, c = cols[seed % 4];
      var geo = new T.CylinderGeometry(0.02, 1, 1, 4, 1, true); geo.rotateY(Math.PI / 4);
      var m = new T.Mesh(geo, new T.MeshStandardMaterial({ color: c, flatShading: true, side: T.DoubleSide, roughness: 1 }));
      m.scale.set(w * 0.72, h, d * 0.72); m.position.y = h / 2; m.castShadow = true; g.add(m);
      var pole = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, h + 0.3, 5), new T.MeshStandardMaterial({ color: '#5A4430', flatShading: true }));
      pole.position.y = (h + 0.3) / 2; g.add(pole);
      return g;
    }
    var tr = BO3D.world ? BO3D.world.rng(1818) : Math.random;
    for (var i = 0; i < 26; i++) {
      var tx = -84 + tr() * 58, tz = 22 + tr() * 36;
      if (tx > -24 && tz < 42) continue;
      var t = tent(i); JL.put(t, tx, tz); t.rotation.y = tr() * 6.28;
    }

    /* 궤와 제사장: 처음에는 동쪽 강가 물가에서 기다린다. 함께 움직이게 자리 차이를 기억해 둔다 */
    var carriers = JL.priests.map(function (pr) { return { pr: pr, dx: pr.group.position.x - JP.ark[0], dz: pr.group.position.z - JP.ark[1] }; });
    var arkY0 = JL.ark.position.y - J.height(JP.ark[0], JP.ark[1]);
    var arkAt = BANK.slice(), arkTo = null, onDone = null;
    function setArk(x, z) {
      arkAt = [x, z];
      JL.ark.position.set(x, H(x, z) + arkY0, z);
      carriers.forEach(function (c) { var px = x + c.dx, pz = z + c.dz; c.pr.group.position.set(px, H(px, pz), pz); });
    }
    /* GLB 제사장으로 바뀌면 자리 차이를 다시 잰다(game.js의 요단 강 시대 추리와 같은 방식) */
    var PX = 0.156, PY = 1.393;
    JL.priests.forEach(function (pr, k) {
      api.loadGlb('priest', function (gltf) {
        var g = gltf.scene, mixer = new T.AnimationMixer(g), clip = null;
        g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
        gltf.animations.forEach(function (c) { if (c.name === 'Carry') clip = c; });
        if (!clip) clip = gltf.animations[0];
        if (clip) mixer.clipAction(clip).play();
        g.rotation.y = pr.group.rotation.y; if (pr.side === 'L') g.scale.x = -1;
        scene.remove(pr.group); scene.add(g); pr.group = g;
        carriers[k].dx = (pr.side === 'R' ? -1 : 1) * (JL.arkPole.x + PX);
        arkY0 = PY - JL.arkPole.y;
        JL.addUpdate(function (dt) { mixer.update(dt); });
        setArk(arkAt[0], arkAt[1]);
        if (FX) FX.sortLayers(g);
      });
    });
    api.person('joshua', function (nm) {
      nm.group.position.copy(JL.leader.group.position); nm.group.rotation.y = JL.leader.group.rotation.y;
      scene.remove(JL.leader.group); scene.add(nm.group); JL.leader = nm;
    });
    setArk(BANK[0], BANK[1]);

    function v3(x, y, z) { return new T.Vector3(x, y, z); }
    var phase = 'camp';
    function setPhase(p) {
      phase = p;
      if (p === 'camp') { want = FULL; level = FULL; JL.setCrowd('camp'); arkTo = null; setArk(BANK[0], BANK[1]); }
      /* 수 3:14-16: 제사장들이 물가에 발을 담그자 물이 끊어진다 */
      if (p === 'stop') { JL.setCrowd('camp'); arkTo = [BANK[0], 8.4]; onDone = function () { want = LOW; arkTo = [MID[0], MID[1]]; onDone = null; }; }
      /* 수 3:17: 제사장들은 가운데 마른 땅에 서 있고 백성이 건넌다 */
      if (p === 'cross') { want = LOW; level = Math.min(level, LOW + 0.3); if (!arkTo) setArk(MID[0], MID[1]); JL.setCrowd('cross'); }
      if (p === 'stones') { want = LOW; JL.setCrowd('cross'); arkTo = null; setArk(MID[0], MID[1]); }
      /* 수 4:15-18: 제사장들이 올라오자 물이 돌아온다 */
      if (p === 'return') { JL.setCrowd('west'); arkTo = [WEST[0], WEST[1]]; onDone = function () { want = FULL; onDone = null; }; }
      if (p === 'gilgal') { JL.setCrowd('west'); arkTo = null; setArk(WEST[0], WEST[1]); want = FULL; }
    }
    function lerpAngle(a, b, t) { var d = Math.atan2(Math.sin(b - a), Math.cos(b - a)); return a + d * t; }
    function dist2(ax, az, bx, bz) { var dx = ax - bx, dz = az - bz; return Math.sqrt(dx * dx + dz * dz); }

    return {
      id: 'OT-18', scene: scene, sun: JL.sun, sunOff: [30, 50, 34],
      height: H, walkable: JL.walkable,
      edge: function (x, z) {
        var e = JL.edge(x, z);
        if (e === 'river') return { who: 'onwoo', text: '강으로는 내려가지 말자. 우리는 둑 위에서 지켜보는 사람이야.' };
        if (e === 'crowd') return { who: 'hyu', text: '백성의 진 안으로는 들어가지 말자. 여기서 지켜보자.' };
        return null;
      },
      P: { start: JP.start, machine: JP.machine, machineRot: 0.6,
        /* 재료가 놓인 곳: 진 가장자리 / 물이 닿지 않는 강 언덕 위쪽(상류) / 강 아래쪽 언덕(하류) — quests[i].found */
        parts: [[-20.5, 34], [10.5, 13.2], [-14.5, 12.6]], lookSpot: [-14.5, 12.6],
        look: { focus: BANK, mid: [8, 8], dy: 0.4, backE: 9, upE: 3.6 } },
      /* 대목마다 카메라가 볼 곳: 물가의 제사장들 → 건너는 백성 → 가운데 선 제사장들 → 올라오는 제사장들과 돌아오는 물 → 길갈 쪽 */
      eventLook: function (i) {
        if (i === 2) return { focus: [BANK[0], 8.6], mid: [6, 4], dy: 0.4, backE: 9, upE: 3.6 };
        if (i === 3) return { focus: CROSS, mid: CROSS, dy: 1.4, backE: 9, upE: 4.5 };
        if (i === 4) return { focus: MID, mid: MID, dy: 1.2, backE: 9, upE: 4.5 };
        if (i === 5) return { focus: [WEST[0], -16], mid: [WEST[0], -16], dy: 1.0, backE: 9, upE: 4.5 };
        if (i === 6) return { focus: GILGAL, mid: GILGAL, dy: 1.5, backE: 10, upE: 6 };
        return null;
      },
      detector: '탐지기', askLabel: '탐지기 물음 풀기',
      intro: { text: '타임머신이 넓은 강가에 내려앉았어요. 맞은편 멀리 성이 보여요.', say: { who: 'hyu', text: '강물이 언덕까지 차올랐어. 둑 위에서만 다니자.' } },
      lookText: '요단 강을 건넌 이야기를 성경에서 찾아 읽은 뒤 다시 골라 보세요.',
      partBeats: [0, 1], eventStart: 2,
      sceneDoneText: '요단 강을 건너는 장면을 끝까지 지켜봐야 떠날 수 있어요.',
      dex: [
        { id: 'river', name: '요단 강', desc: '곡식 거두는 때라 언덕까지 넘친 요단', ref: '수 3:15', hint: '아이들이 선 둑 바로 앞이에요.', range: 60,
          pos: function () { return v3(-4, level, -2); } },
        { id: 'ark', name: '언약궤를 멘 제사장들', desc: '언약궤를 메고 백성보다 앞서 간 제사장들', ref: '수 3:14', hint: '상류 쪽(오른쪽) 강가를 보세요.', range: 80, crop: 0.34,
          pos: function () { return v3(arkAt[0], H(arkAt[0], arkAt[1]) + 1.4, arkAt[1]); } },
        { id: 'leader', name: '여호수아', desc: '백성을 이끌던 사람. 아침 일찍 일어나 백성과 함께 요단에 이르렀다', ref: '수 3:1', hint: '진 가까운 강가에 서 있어요.', range: 40, crop: 0.36,
          pos: function () { var p = JL.leader.group.position; return v3(p.x, p.y + 1.1, p.z); } },
        { id: 'jericho', name: '여리고', desc: '백성이 건너간 맞은편의 성', ref: '수 3:16', hint: '강 건너 멀리 보이는 성이에요.', range: 480, crop: 0.34,
          pos: function () { return v3(JP.jericho[0], H(JP.jericho[0], JP.jericho[1]) + 5, JP.jericho[1]); } }
      ],
      reset: function () { setPhase('camp'); },
      partFound: function () {},
      partContinue: function () {},
      lookupPose: function () { setPhase('camp'); },
      /* 대목 번호(OT-18.json): 2 = 3:14-16, 3 = 3:17, 4 = 4:1-9, 5 = 4:14-18, 6 = 4:19-24 */
      beatPose: function (i) { setPhase(i <= 1 ? 'camp' : i === 2 ? 'stop' : i === 3 ? 'cross' : i === 4 ? 'stones' : i === 5 ? 'return' : 'gilgal'); },
      update: function (dt, now) {
        JL.update(dt, now);
        if (arkTo) {
          var d = dist2(arkAt[0], arkAt[1], arkTo[0], arkTo[1]);
          if (d < 0.05) { setArk(arkTo[0], arkTo[1]); arkTo = null; if (onDone) onDone(); }
          else { var st = Math.min(d, 1.3 * dt); setArk(arkAt[0] + (arkTo[0] - arkAt[0]) / d * st, arkAt[1] + (arkTo[1] - arkAt[1]) / d * st); }
        }
        /* 물높이: 끊어질 때는 몇 초에 걸쳐 빠지고, 돌아올 때도 몇 초에 걸쳐 찬다 */
        if (Math.abs(level - want) > 0.002) { level += (want - level) * Math.min(1, dt * 0.45); }
        water.mesh.position.y = level; water.mesh.visible = level > LOW + 0.05;
        if (water.update) water.update(now);
      },
      audio: function (A) { A.setFlock(999); A.setFire(999); },
      menuCam: function (camera, now) {
        var a = now * 0.05;
        camera.position.set(JP.start[0] + Math.sin(a) * 9, H(JP.start[0], JP.start[1]) + 5.5, JP.start[1] + 10);
        camera.lookAt(-10, 1, -40);
      },
      debug: { phase: function () { return { phase: phase, level: level, ark: arkAt }; }, arrived: function () { return phase !== 'camp'; } }
    };
  };
})();
