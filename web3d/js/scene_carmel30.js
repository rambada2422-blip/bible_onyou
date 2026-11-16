/* 3D 장면 설정: OT-30 갈멜 산의 엘리야 (왕상 18:20-39). 18:40은 다루지 않는다.
 * 간접 연출(규칙서 13.8, 2026-11-16, 감수 전): 불이 내려올 때 합성 땅울림과 흔들림(불과 땅의 소리일 뿐, 하나님의 음성은 만들지 않는다). 움직임 줄이기 설정이면 흔들지 않는다.
 * 방향: 아이들은 산비탈 동쪽(+X)에서 서쪽을 본다. 백성은 가운데, 바알의 단은 서쪽 멀리, 여호와의 단은 그 앞쪽.
 * 본문에 맞춘 점 (content/ot/OT-30.json design3d)
 *  - 바알의 선지자들은 자기 단 둘레를 돌며 아침부터 저녁까지 부르지만 대답이 없다(18:26-29). 몸을 상하게 하는 모습은 그리지 않는다(18:28은 글로만).
 *  - 엘리야는 무너진 여호와의 단을 열두 돌로 고쳐 쌓고 둘레에 도랑을 만든다(18:30-32). 물이 단 둘레로 흐르고 도랑에 찬다(18:35).
 *  - 여호와의 불은 위에서 단으로 내리는 불로만(18:38). 번개·벼락·구름·빛줄기 기둥이나 형상은 없다. 불은 번제물과 나무와 돌과 흙을 태우고 도랑의 물을 핥는다.
 *  - 백성이 엎드린다(18:39). 송아지를 잡는 모습은 그리지 않는다(나무 위에 놓인 것은 단순한 덩이로만).
 * 감수가 필요한 설정: 단의 자리와 크기, 백성과 선지자의 수(일부만 그림), 물을 붓는 사람(그리지 않음), 하늘빛(아침→저녁), 엘리야의 생김새(본문에 없음).
 * 세 아이는 단에서 멀리 떨어진 산비탈에서만 다닌다(목격자).
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  BO3D.scene3d = BO3D.scene3d || {};
  BO3D.scene3d['OT-30'] = function (api) {
    var T = THREE, M2 = BO3D.models2 || {}, MO = BO3D.models || {}, PR = BO3D.props, FX = api.FX, R = PR.rng(3018);
    function sm(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
    function hash(ix, iz) { var n = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453; return n - Math.floor(n); }
    function noise(x, z) {
      var ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
      var a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    var ALT = [0, -8], BAAL = [-26, -36];
    function height(x, z) {
      var h = 0.6 * noise(x * 0.05 + 3, z * 0.05 + 1) + 0.04 * x + 0.02 * z * (z > 0 ? 1 : 0.3);   /* 동쪽이 조금 높은 넓은 산 어깨 */
      h += sm(50, 120, -z) * 18 * (0.5 + 0.6 * noise(x * 0.02, 5)) + sm(80, 160, Math.abs(x)) * 14 * noise(2, z * 0.02);
      h -= 0.35 * sm(5.6, 4.6, Math.hypot(x - ALT[0], z - ALT[1])) * sm(3.4, 4.4, Math.hypot(x - ALT[0], z - ALT[1])) * 1;  /* 도랑 */
      return h;
    }
    function walkable(x, z) { return x >= 22 && x <= 58 && z >= -2 && z <= 40; }

    var scene = new T.Scene();
    scene.background = new T.Color('#EFE6CC'); scene.fog = new T.Fog('#ECE2C6', 70, 300);
    var skyG = new T.SphereGeometry(560, 24, 14), sp = skyG.attributes.position, sc = new Float32Array(sp.count * 3), cc = new T.Color(), top = new T.Color('#7EB0D2'), hor = new T.Color('#F2E8CC'), i;
    for (i = 0; i < sp.count; i++) { var tt = Math.max(0, sp.getY(i) / 560); cc.copy(hor).lerp(top, sm(0.02, 0.7, tt)); sc[i * 3] = cc.r; sc[i * 3 + 1] = cc.g; sc[i * 3 + 2] = cc.b; }
    skyG.setAttribute('color', new T.BufferAttribute(sc, 3));
    var skyM = new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false }); scene.add(new T.Mesh(skyG, skyM));
    var g = new T.PlaneGeometry(520, 460, 170, 150); g.rotateX(-Math.PI / 2);
    var pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color(), g1 = new T.Color('#9DA866'), g2 = new T.Color('#B8B47A'), rk = new T.Color('#A89C8A'), earth = new T.Color('#9A7E5A');
    for (i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i), y = height(x, z); pos.setY(i, y);
      c.copy(g1).lerp(g2, noise(x * 0.06, z * 0.06)); c.lerp(rk, sm(0.55, 0.85, noise(x * 0.09 + 7, z * 0.09)) * 0.6);
      var da = Math.hypot(x - ALT[0], z - ALT[1]); if (da < 6.5) c.lerp(earth, sm(6.5, 4.5, da));
      if (y > 8) c.lerp(rk, sm(8, 20, y) * 0.7);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals();
    var ground = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 })); ground.receiveShadow = true; scene.add(ground);
    var hemi = new T.HemisphereLight('#DCEFF2', '#9FA86A', 0.64); scene.add(hemi);
    var sun = new T.DirectionalLight('#FFF0CF', 0.76); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    var ss = sun.shadow.camera; ss.left = -26; ss.right = 26; ss.top = 26; ss.bottom = -26; ss.near = 1; ss.far = 150; sun.shadow.bias = -0.0015;
    scene.add(sun); scene.add(sun.target);
    function put(o, x, z, lift) { o.position.set(x, height(x, z) + (lift || 0), z); scene.add(o); return o; }
    function std(cl) { return new T.MeshStandardMaterial({ color: cl, flatShading: true, roughness: 0.95 }); }
    if (MO.rock) for (i = 0; i < 70; i++) { var rr = MO.rock(1200 + i); rr.scale.multiplyScalar(0.6 + R() * 1.5); var rx = -120 + R() * 240, rz = -90 + R() * 160; if (Math.hypot(rx - ALT[0], rz - ALT[1]) < 9 || Math.hypot(rx - BAAL[0], rz - BAAL[1]) < 9 || (rx > 20 && rz > -4 && rz < 42) || (Math.abs(rx) < 26 && rz > 4 && rz < 30)) continue; put(rr, rx, rz, -0.1); }
    if (MO.shrub) for (i = 0; i < 70; i++) { var sh = MO.shrub(70 + i), hx = -120 + R() * 240, hz = -90 + R() * 160; if (Math.hypot(hx - ALT[0], hz - ALT[1]) < 9 || (Math.abs(hx) < 26 && hz > 4 && hz < 30)) continue; put(sh, hx, hz, -0.05); }

    /* 바알의 선지자들이 쌓은 단(18:26)과 그 위의 나무 */
    var stoneM = std('#A89C88'), stoneM2 = std('#958A78'), woodM = std('#7A5232'), lumpM = std('#8A5A40');
    function altar(x, z, n, seed) {
      var gr = new T.Group(), r = PR.rng(seed), k;
      for (k = 0; k < n; k++) {
        var lay = Math.floor(k / 6), a = (k % 6) / 6 * 6.28 + lay * 0.5, rad = 0.85 - lay * 0.22;
        var st = new T.Mesh(new T.DodecahedronGeometry(0.42 + r() * 0.1, 0), k % 2 ? stoneM : stoneM2); st.scale.set(1.1, 0.75, 1); st.position.set(Math.cos(a) * rad, 0.3 + lay * 0.5, Math.sin(a) * rad); st.castShadow = true; gr.add(st);
      }
      var wood = new T.Group();
      for (k = 0; k < 6; k++) { var w = new T.Mesh(new T.CylinderGeometry(0.06, 0.07, 1.6, 5), woodM); w.rotation.z = Math.PI / 2; w.rotation.y = k * 0.5; w.position.y = 0.3 + Math.floor(n / 6) * 0.5 + (k % 2) * 0.12; wood.add(w); }
      var lump = new T.Mesh(new T.BoxGeometry(0.9, 0.35, 0.55), lumpM); lump.position.y = 0.55 + Math.floor(n / 6) * 0.5; wood.add(lump);   /* 나무 위의 번제물(단순한 덩이) */
      gr.add(wood); put(gr, x, z); return { group: gr, wood: wood };
    }
    var baal = altar(BAAL[0], BAAL[1], 12, 11);
    /* 여호와의 단: 처음에는 무너져 있다(18:30). 고쳐 쌓으면 열두 돌의 단이 된다(18:31-32) */
    var ruinM = std('#9A9080'), ruin = new T.Group();
    for (i = 0; i < 9; i++) { var rs = new T.Mesh(new T.DodecahedronGeometry(0.4, 0), ruinM); rs.position.set((R() - 0.5) * 2.4, 0.15, (R() - 0.5) * 2.4); rs.rotation.set(R() * 3, R() * 3, 0); ruin.add(rs); }
    put(ruin, ALT[0], ALT[1]);
    var yah = altar(ALT[0], ALT[1], 12, 31); yah.group.visible = false;
    /* 도랑(18:32)과 그 물(18:35) */
    var trench = new T.Mesh(new T.RingGeometry(3.6, 4.6, 40), new T.MeshStandardMaterial({ color: '#6B5A42', roughness: 1 })); trench.rotation.x = -Math.PI / 2; put(trench, ALT[0], ALT[1], 0.02); trench.visible = false;
    var waterM = new T.MeshStandardMaterial({ color: '#5E9AB0', transparent: true, opacity: 0.85, roughness: 0.2 }), water = new T.Mesh(new T.RingGeometry(3.65, 4.55, 40), waterM);
    water.rotation.x = -Math.PI / 2; put(water, ALT[0], ALT[1], 0.05); water.visible = false;
    var wetM = std('#6E6658');

    /* 여호와의 불(18:38): 위에서 단으로 내려오는 불. 단 위에서 타오른 뒤 단과 물이 사라진다 */
    var fire = FX ? FX.fire() : null, fireT = -1;
    if (fire) { fire.group.scale.setScalar(1.7); fire.group.visible = false; put(fire.group, ALT[0], ALT[1], 0.4); }
    var fallCv = document.createElement('canvas'); fallCv.width = 32; fallCv.height = 128;
    var fcx = fallCv.getContext('2d'), fgr = fcx.createLinearGradient(0, 0, 0, 128);
    fgr.addColorStop(0, 'rgba(255,200,90,0)'); fgr.addColorStop(0.6, 'rgba(255,170,60,0.7)'); fgr.addColorStop(1, 'rgba(255,240,170,1)'); fcx.fillStyle = fgr; fcx.fillRect(0, 0, 32, 128);
    var hg = fcx.createLinearGradient(0, 0, 32, 0); hg.addColorStop(0, 'rgba(0,0,0,1)'); hg.addColorStop(0.5, 'rgba(0,0,0,0)'); hg.addColorStop(1, 'rgba(0,0,0,1)');
    fcx.globalCompositeOperation = 'destination-out'; fcx.fillStyle = hg; fcx.fillRect(0, 0, 32, 128);
    var fall = new T.Mesh(new T.PlaneGeometry(2.4, 9), new T.MeshBasicMaterial({ map: new T.CanvasTexture(fallCv), transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false }));
    put(fall, ALT[0], ALT[1], 30); if (FX) fall.layers.set(FX.GLOW);
    var flash = new T.PointLight('#FFB060', 0, 60, 1.6); put(flash, ALT[0], ALT[1], 3);

    /* 백성(18:21, 18:30, 18:39)과 바알의 선지자들(18:22, 멀리서만) */
    var people = [], prophets = [];
    for (i = 0; i < 46; i++) {
      var o = null; try { if (M2.israelite) o = M2.israelite(i * 9 + 4); } catch (e) { o = null; }
      if (!o) o = PR.soldier(i, '#7A6A4A', null);
      o.home = [-18 + (i % 12) * 3.1 + (hash(i, 2) - 0.5) * 1.4, 10 + Math.floor(i / 12) * 3.2 + hash(i, 4) * 1.5]; o.near = [o.home[0] * 0.7, o.home[1] - 5];
      put(o.group, o.home[0], o.home[1]); o.group.rotation.order = 'YXZ'; o.group.rotation.y = Math.PI; o.at = o.home.slice(); people.push(o);   /* YXZ: 엎드릴 때 바라보는 쪽(단 쪽)으로 기운다 */
    }
    for (i = 0; i < 40; i++) { var pp = PR.soldier(i + 500, ['#A84A32', '#8E5A3E', '#B0623A'][i % 3], null); pp.group.children[0].children.forEach(function (m) { if (m.geometry && m.geometry.type === 'CylinderGeometry' && m.position.x > 0.2) m.visible = false; }); pp.a = i / 40 * 6.283; pp.r = 5 + (i % 3) * 1.4; put(pp.group, BAAL[0] + Math.cos(pp.a) * pp.r, BAAL[1] + Math.sin(pp.a) * pp.r); prophets.push(pp); }
    /* 엘리야(Blender, 지팡이 없음) */
    var ELI0 = [8, 4], eli = { group: api.fallback('#7A6248', 1.75, 0.27), update: function () {} };
    put(eli.group, ELI0[0], ELI0[1]); eli.group.rotation.y = -Math.PI * 0.6;
    api.person('elijah', function (nm) { nm.group.position.copy(eli.group.position); nm.group.rotation.y = eli.group.rotation.y; scene.remove(eli.group); scene.add(nm.group); eli = nm; });

    var phase = 'gather', dusk = 0, duskWant = 0, waterLv = 0, waterWant = 0, prophetsDancing = false, bow = 0, bowWant = 0, nearWant = false, eliTo = null;
    var ca = new T.Color(), cb = new T.Color();
    function applyDusk() {
      ca.set('#EFE6CC'); cb.set('#E8B49A'); ca.lerp(cb, dusk); scene.background.copy(ca); scene.fog.color.copy(ca);
      ca.set('#FFFFFF'); cb.set('#F0B8A0'); skyM.color.copy(ca.lerp(cb, dusk)); hemi.intensity = 0.64 - 0.12 * dusk;
      ca.set('#FFF0CF'); cb.set('#FFB078'); sun.color.copy(ca.lerp(cb, dusk)); sun.intensity = 0.76 - 0.2 * dusk;
    }
    function setPhase(p) {
      phase = p;
      baal.wood.visible = p !== 'gather';
      if (p === 'fire') yah.wood.visible = true;
      if (p === 'gather') { dusk = 0; duskWant = 0; applyDusk(); prophetsDancing = false; ruin.visible = true; yah.group.visible = false; trench.visible = false; water.visible = false; waterLv = 0; waterWant = 0;
        yah.group.children.forEach(function (m) { if (m.material === wetM) m.material = stoneM; }); fireT = -1; if (fire) fire.group.visible = false; fall.material.opacity = 0; flash.intensity = 0; bow = 0; bowWant = 0; nearWant = false; eliTo = null;
        eli.group.position.set(ELI0[0], height(ELI0[0], ELI0[1]), ELI0[1]); yah.group.scale.set(1, 1, 1); }
      if (p !== 'fire' && p !== 'gather') { fireT = -1; if (fire) fire.group.visible = false; fall.material.opacity = 0; flash.intensity = 0; bow = 0; bowWant = 0; yah.group.scale.set(1, 1, 1); }   /* '이전'으로 돌아올 때 뒤 대목의 상태를 지운다 */
      if (p === 'baal') { prophetsDancing = true; duskWant = 0.55; nearWant = false; eliTo = null; ruin.visible = true; yah.group.visible = false; trench.visible = false; water.visible = false; waterLv = 0; waterWant = 0; }                                       /* 18:26-29 아침부터 저녁 소제 때까지 */
      if (p === 'altar') { prophetsDancing = false; duskWant = 0.7; nearWant = true; ruin.visible = false; yah.group.visible = true; trench.visible = true; eliTo = [3.4, -3.6]; water.visible = false; waterLv = 0; waterWant = 0; yah.wood.visible = false;
        yah.group.children.forEach(function (m) { if (m.material === wetM) m.material = stoneM; }); } /* 18:30-32 */
      if (p === 'water') { duskWant = 0.75; nearWant = true; ruin.visible = false; yah.group.visible = true; yah.wood.visible = true; trench.visible = true; water.visible = true; waterWant = 1; /* 18:33-35 */
        yah.group.children.forEach(function (m) { if (m.material === stoneM || m.material === stoneM2) m.material = wetM; }); }
      if (p === 'pray') { yah.wood.visible = true; duskWant = 0.85; nearWant = true; eliTo = [2.6, -2.6]; if (!water.visible) { water.visible = true; waterWant = 1; } ruin.visible = false; yah.group.visible = true; trench.visible = true; } /* 18:36-37 */
      if (p === 'fire') { duskWant = 0.85; if (fireT < 0) fireT = 0; }                                     /* 18:38-39 */
    }
    function v3(x, y, z) { return new T.Vector3(x, y, z); }
    if (FX) FX.sortLayers(scene);
    if (fire) fire.group.traverse(function (o2) { o2.layers.mask = o2.layers.mask; });

    return {
      id: 'OT-30', scene: scene, sun: sun, sunOff: [-30, 50, 30],
      height: height, walkable: walkable,
      edge: function (x, z) {
        if (x < 22) return { who: 'onwoo', text: '단 쪽으로는 가지 말자. 우리는 산비탈에서 지켜보는 사람이야.' };
        return null;
      },
      P: { start: [46, 30], machine: [52, 36], machineRot: -0.8,
        /* 재료가 놓인 곳(quests[i].found): 백성이 모여 선 쪽(뒤쪽 땅) / 단과 도랑이 보이는 쪽 / 젖은 단이 멀리 보이는 산비탈 */
        parts: [[25, 30], [30, 6], [36, 1]], lookSpot: [36, 1],
        look: { focus: ALT, mid: [-6, 6], dy: 1.6, backE: 7, upE: 3.2 } },
      eventLook: function (i) {
        if (i === 2) return { focus: BAAL, mid: BAAL, dy: 1.6, backE: 8, upE: 3.5 };
        if (i === 6) return { focus: ALT, mid: ALT, dy: 2.2, backE: 9, upE: 5 };
        return { focus: ALT, mid: [-4, 2], dy: 1.4, backE: 7, upE: 3.2 };
      },
      detector: '탐지기', askLabel: '탐지기 물음 풀기',
      intro: { text: '타임머신이 넓은 산비탈에 내려앉았어요. 많은 사람이 모여 있어요.', say: { who: 'hyu', text: '사람들과 단에서 멀리 떨어진 비탈에서만 다니자.' } },
      lookText: '갈멜 산 이야기를 성경에서 찾아 읽은 뒤 다시 골라 보세요.',
      partBeats: [0, 1], eventStart: 2,
      sceneDoneText: '갈멜 산 장면을 끝까지 지켜봐야 떠날 수 있어요.',
      dex: [   /* 도감·안내 글에서 관문·탐지기 물음의 답(산 이름, 백성이 대답하지 않음, 돌 열두 개)은 성경에서 찾게(규칙서 13.9) */
        { id: 'carmel', name: '갈멜 산', desc: '아합이 이스라엘 자손과 선지자들을 모은 산', ref: '왕상 18:20', hint: '모여 선 사람들 너머를 담아 보세요.', range: 200, crop: 0.7, pos: function () { return v3(-20, height(-20, -40) + 4, -40); } },
        { id: 'elijah', name: '엘리야', desc: '백성에게 가까이 가서 둘 사이에서 머뭇거리지 말라고 한 사람', ref: '왕상 18:21', hint: '백성 앞쪽에 서 있어요.', range: 40, crop: 0.36,
          pos: function () { var p = eli.group.position; return v3(p.x, p.y + 1.1, p.z); } },
        { id: 'people', name: '모든 백성', desc: '엘리야의 물음을 들은 백성. 백성이 어떻게 했는지는 열왕기상 18장 21절에 있어요.', ref: '왕상 18:21', hint: '모여 선 사람들을 담아 보세요.', range: 60, pos: function () { return v3(-2, height(-2, 15) + 1, 15); } },
        { id: 'altar', name: '여호와의 단', desc: '엘리야가 고쳐 쌓은 단과 둘레의 도랑. 돌을 몇 개 썼는지는 열왕기상 18장 31절에 있어요.', ref: '왕상 18:31-32', hint: '단이 고쳐 쌓인 뒤에 찍을 수 있어요.', range: 60, crop: 0.4,
          visible: function () { return yah.group.visible; }, pos: function () { return v3(ALT[0], height(ALT[0], ALT[1]) + 1, ALT[1]); } }
      ],
      reset: function () { setPhase('gather'); },
      partFound: function () {},
      partContinue: function () {},
      lookupPose: function () { if (phase === 'gather') setPhase('gather'); },
      /* 대목 번호(OT-30.json): 2 = 18:25-29, 3 = 18:30-32, 4 = 18:33-35, 5 = 18:36-37, 6 = 18:38-39 */
      beatPose: function (i) { setPhase(i <= 1 ? 'gather' : ['', '', 'baal', 'altar', 'water', 'pray', 'fire'][i]); },
      update: function (dt, now) {
        if (Math.abs(dusk - duskWant) > 0.003) { dusk += (duskWant - dusk) * Math.min(1, dt * 0.5); applyDusk(); }
        prophets.forEach(function (pp, k) {
          if (prophetsDancing) pp.a += dt * 0.25;
          var x = BAAL[0] + Math.cos(pp.a) * pp.r, z = BAAL[1] + Math.sin(pp.a) * pp.r;
          pp.group.position.set(x, height(x, z), z); pp.group.rotation.y = pp.a + Math.PI; pp.update(dt, prophetsDancing ? 1 : 0, now);
        });
        people.forEach(function (o) {
          var to = nearWant ? o.near : o.home, p = o.group.position;
          p.x += (to[0] - p.x) * Math.min(1, dt * 0.8); p.z += (to[1] - p.z) * Math.min(1, dt * 0.8); p.y = height(p.x, p.z) - bow * 0.35;
          o.group.rotation.y = Math.PI; o.group.rotation.x = bow * 1.25;                                  /* 18:39 엎드림 */
          if (o.update) o.update(dt, 0);
        });
        if (eliTo) { var ep = eli.group.position, dx = eliTo[0] - ep.x, dz = eliTo[1] - ep.z, d = Math.hypot(dx, dz); if (d > 0.05) { var st = Math.min(d, 1.4 * dt); ep.x += dx / d * st; ep.z += dz / d * st; ep.y = height(ep.x, ep.z); eli.group.rotation.y = Math.atan2(dx, dz); if (eli.update) eli.update(dt, true); } else { eli.group.rotation.y = Math.atan2(ALT[0] - ep.x, ALT[1] - ep.z); if (eli.update) eli.update(dt, false); } }
        else if (eli.update) eli.update(dt, false);
        waterLv += (waterWant - waterLv) * Math.min(1, dt * 0.6); water.position.y = height(ALT[0] + 4, ALT[1]) - 0.3 + waterLv * 0.3;
        /* 불: 0~0.9초 위에서 내려옴 → 단 위에서 탐 → 단·나무·물이 사라짐 → 백성이 엎드림 */
        if (fireT >= 0) {
          if (fireT === 0) { if (FX) FX.audio.rumble(3, 0.6); if (api.shake) api.shake(0.3, 1.6); }   /* 불이 내려올 때 땅울림(18:38, 간접 연출. 소리는 불과 땅의 소리일 뿐이다) */
          fireT += dt;
          var fd = Math.min(1, fireT / 0.9);
          fall.position.y = height(ALT[0], ALT[1]) + 16 - 11 * fd; fall.material.opacity = fireT < 2.4 ? Math.min(1, fireT * 2) : Math.max(0, 1 - (fireT - 2.4));
          fall.lookAt(api.camera().position.x, fall.position.y, api.camera().position.z);
          if (fire && fireT > 0.7) fire.group.visible = fireT < 9;
          flash.intensity = fireT > 0.7 && fireT < 9 ? 2.4 + Math.sin(fireT * 9) * 0.4 : 0;
          var burn = Math.min(1, Math.max(0, (fireT - 2.5) / 4));
          yah.group.scale.set(1 - burn * 0.98, 1 - burn * 0.98, 1 - burn * 0.98); yah.group.visible = burn < 0.99;
          waterWant = 0; water.visible = waterLv > 0.04; waterM.opacity = 0.85 * Math.min(1, waterLv * 2);
          trench.visible = true;
          if (fireT > 5) bowWant = 1;
        }
        bow += (bowWant - bow) * Math.min(1, dt * 0.9);
        if (fire && fire.group.visible) fire.update(now, api.camera(), 900);
      },
      audio: function (A, pp) { A.setFlock(999); A.setFire(fire && fire.group.visible ? Math.hypot(pp.x - ALT[0], pp.z - ALT[1]) : 999); },
      menuCam: function (camera, now) { var a = now * 0.05; camera.position.set(40 + Math.sin(a) * 8, 8, 30); camera.lookAt(-6, 1, -6); },
      debug: { phase: function () { return { phase: phase, fire: fireT, water: waterLv, bow: bow }; }, arrived: function () { return phase !== 'gather'; } }
    };
  };
})();
