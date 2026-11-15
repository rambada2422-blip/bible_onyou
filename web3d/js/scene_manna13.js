/* 3D 장면 설정: OT-13 하늘에서 내린 양식, 만나 (출 16:1-36). 신 광야의 이스라엘 진.
 * 방향: 진은 가운데, 아이들은 진 동쪽 가장자리(+X). 광야 쪽(구름이 나타나는 쪽)은 진 너머 서쪽(-X) 멀리. 아이들 자리에서 진과 구름이 함께 보인다.
 * 본문에 맞춘 점 (content/ot/OT-13.json design3d)
 *  - 광야 쪽에 구름을 두고, 여호와의 영광은 자막으로만 알린다(16:10). 영광의 모양과 빛깔을 지어 그리지 않는다.
 *  - 저녁에 메추라기가 진을 덮고(16:13), 아침에 진 둘레에 이슬이 있다가 마르면 땅 위에 작고 둥글고 서리처럼 가는 흰 것이 있다(16:13-14, 16:31).
 *    만나가 하늘에서 떨어지는 모습은 그리지 않는다. 떡이나 과자 모양으로 그리지 않는다.
 *  - 백성이 나가서 거두고(16:16-18), 여섯째 날에는 갑절을 거두고, 일곱째 날에는 진에 머문다(16:22-30). 몇몇이 나갔다가 얻지 못한다(16:27).
 *  - 아론이 만나 한 오멜을 항아리에 담는다(16:33). 항아리의 생김새는 본문에 없어 단순한 꼴로만. 증거판과 궤는 그리지 않는다.
 *  - 세 아이는 만나나 메추라기를 줍거나 맛보지 않는다. 벌레는 그리지 않는다(16:20은 글로만).
 * 감수가 필요한 설정: 진의 생김새, 구름의 자리, 메추라기와 만나의 양, 모세와 아론의 생김새와 선 자리, 항아리.
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  BO3D.scene3d = BO3D.scene3d || {};
  BO3D.scene3d['OT-13'] = function (api) {
    var T = THREE, M2 = BO3D.models2 || {}, MO = BO3D.models || {}, PR = BO3D.props, FX = api.FX, R = PR.rng(1316);
    function sm(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
    function hash(ix, iz) { var n = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453; return n - Math.floor(n); }
    function noise(x, z) {
      var ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
      var a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    var CAMP = [-10, 0], CAMP_R = 30;
    function height(x, z) { return 0.5 * noise(x * 0.05 + 2, z * 0.05 + 5) + 0.25 * Math.sin(x * 0.04) * Math.cos(z * 0.035) + sm(140, 260, Math.hypot(x, z)) * 12 * noise(x * 0.02, z * 0.02 + 3); }
    function walkable(x, z) { return x >= 26 && x <= 62 && z >= -26 && z <= 26; }

    var scene = new T.Scene();
    scene.background = new T.Color('#F3DDB0'); scene.fog = new T.Fog('#F0D9AC', 70, 320);
    var skyG = new T.SphereGeometry(560, 24, 14), sp = skyG.attributes.position, sc = new Float32Array(sp.count * 3), cc = new T.Color(), top = new T.Color('#6FA6CC'), hor = new T.Color('#F6E3BC'), i;
    for (i = 0; i < sp.count; i++) { var tt = Math.max(0, sp.getY(i) / 560); cc.copy(hor).lerp(top, sm(0.02, 0.7, tt)); sc[i * 3] = cc.r; sc[i * 3 + 1] = cc.g; sc[i * 3 + 2] = cc.b; }
    skyG.setAttribute('color', new T.BufferAttribute(sc, 3));
    var skyM = new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false }); scene.add(new T.Mesh(skyG, skyM));
    var g = new T.PlaneGeometry(520, 520, 160, 160); g.rotateX(-Math.PI / 2);
    var pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color(), s1 = new T.Color('#E4BE7E'), s2 = new T.Color('#D6AE6E'), hl = new T.Color('#B9928A');
    for (i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i), y = height(x, z); pos.setY(i, y);
      c.copy(s1).lerp(s2, noise(x * 0.08, z * 0.08)); if (y > 3) c.lerp(hl, sm(3, 12, y));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals();
    var ground = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 })); ground.receiveShadow = true; scene.add(ground);
    var hemi = new T.HemisphereLight('#D9EEF2', '#B98A55', 0.62); scene.add(hemi);
    var sun = new T.DirectionalLight('#FFE9C4', 0.72); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    var ss = sun.shadow.camera; ss.left = -26; ss.right = 26; ss.top = 26; ss.bottom = -26; ss.near = 1; ss.far = 150; sun.shadow.bias = -0.0015;
    scene.add(sun); scene.add(sun.target);
    function put(o, x, z, lift) { o.position.set(x, height(x, z) + (lift || 0), z); scene.add(o); return o; }
    function std(cl) { return new T.MeshStandardMaterial({ color: cl, flatShading: true, roughness: 0.95 }); }
    if (MO.rock) for (i = 0; i < 40; i++) { var ro = MO.rock(1700 + i); ro.scale.multiplyScalar(0.5 + R() * 1.2); var rx = -150 + R() * 300, rz = -150 + R() * 300; if (Math.hypot(rx - CAMP[0], rz - CAMP[1]) < CAMP_R + 14) continue; put(ro, rx, rz, -0.1); }
    if (MO.shrub) for (i = 0; i < 30; i++) { var sh = MO.shrub(140 + i), hx = -150 + R() * 300, hz = -150 + R() * 300; if (Math.hypot(hx - CAMP[0], hz - CAMP[1]) < CAMP_R + 14) continue; put(sh, hx, hz, -0.05); }

    /* 진과 장막(16:13, 16:16) */
    var tents = [];
    for (i = 0; i < 70; i++) { var a = R() * 6.28, rr = Math.sqrt(R()) * CAMP_R; var tn = PR.tent(i + 120); put(tn, CAMP[0] + Math.cos(a) * rr, CAMP[1] + Math.sin(a) * rr); tn.rotation.y = R() * 6.28; tents.push(tn); }
    /* 백성(16:1, 16:16): 진에 서 있다가 아침에 나가서 거둔다 */
    var people = [];
    for (i = 0; i < 40; i++) {
      var o = null; try { if (M2.israelite) o = M2.israelite(i * 13 + 2); } catch (e) { o = null; }
      if (!o) o = PR.soldier(i, '#7A6A4A', null);
      var ha = hash(i, 1) * 6.28, hr = 6 + hash(i, 2) * (CAMP_R - 8);
      o.home = [CAMP[0] + Math.cos(ha) * hr, CAMP[1] + Math.sin(ha) * hr];
      var fa = hash(i, 3) * 6.28, fr = CAMP_R + 6 + hash(i, 4) * 16; o.field = [CAMP[0] + Math.cos(fa) * fr, CAMP[1] + Math.sin(fa) * fr];
      for (var tr = 0; tr < 12 && o.field[0] > 22; tr++) { fa = hash(i, 7 + tr) * 6.28; o.field = [CAMP[0] + Math.cos(fa) * fr, CAMP[1] + Math.sin(fa) * fr]; }   /* 아이들 쪽(동쪽)으로는 오지 않게 각도를 다시 뽑는다 */
      if (o.field[0] > 22) o.field = [CAMP[0] - fr, CAMP[1]];
      o.t = hash(i, 5) * 4; put(o.group, o.home[0], o.home[1]); o.group.rotation.order = 'YXZ'; o.at = o.home.slice(); people.push(o);
    }
    var bodyOf = function (o) { return o.group; };
    /* 모세와 아론(Blender) */
    var MOS = [16, 4], AAR = [16, 8], moses = { group: api.fallback('#9C5438', 1.75, 0.27), update: function () {} }, aaron = { group: api.fallback('#5A6A86', 1.75, 0.27), update: function () {} };
    put(moses.group, MOS[0], MOS[1]); put(aaron.group, AAR[0], AAR[1]); moses.group.rotation.y = aaron.group.rotation.y = -Math.PI / 2;
    api.person('moses', function (nm) { nm.group.position.copy(moses.group.position); nm.group.rotation.y = moses.group.rotation.y; scene.remove(moses.group); scene.add(nm.group); moses = nm; }, { once: { HideFace: 'hideface' } });
    api.person('aaron', function (nm) { nm.group.position.copy(aaron.group.position); nm.group.rotation.y = aaron.group.rotation.y; scene.remove(aaron.group); scene.add(nm.group); aaron = nm; });
    var jar = new T.Group(), jarM = std('#B88A5A'), jb = new T.Mesh(new T.CylinderGeometry(0.16, 0.12, 0.42, 10), jarM), jn = new T.Mesh(new T.CylinderGeometry(0.08, 0.12, 0.12, 10), jarM);
    jb.position.y = 0.21; jn.position.y = 0.48; jar.add(jb); jar.add(jn); put(jar, AAR[0] - 0.7, AAR[1] + 0.4); jar.visible = false;

    /* 광야 쪽의 구름(16:10): 둥근 구름 덩이만. 영광의 모양과 빛깔은 그리지 않는다 */
    var cloud = new T.Group(), cloudM = new T.MeshStandardMaterial({ color: '#F4F1EA', roughness: 1 });
    for (i = 0; i < 14; i++) { var cs = new T.Mesh(new T.SphereGeometry(10 + R() * 9, 14, 10), cloudM); cs.position.set((R() - 0.5) * 70, 18 + R() * 16, (R() - 0.5) * 22); cs.scale.y = 0.6; cloud.add(cs); }
    cloud.position.set(-200, 0, 30); scene.add(cloud);
    /* 메추라기(16:13): 저녁에 진을 덮는다. 작은 새의 꼴로만 */
    var quailM = std('#A8865A'), quail = new T.InstancedMesh(new T.SphereGeometry(0.13, 6, 4), quailM, 600), qm = new T.Matrix4(), qp = [];
    for (i = 0; i < 600; i++) { var qa = R() * 6.28, qr = Math.sqrt(R()) * (CAMP_R + 4); qp.push([CAMP[0] + Math.cos(qa) * qr, CAMP[1] + Math.sin(qa) * qr, R() * 6.28, R() * 30]); }
    quail.visible = false; scene.add(quail);
    /* 이슬(16:13)과 그 뒤의 작고 둥근 흰 것(16:14, 16:31): 진 둘레의 땅 위 */
    var dew = new T.Mesh(new T.RingGeometry(CAMP_R + 1, CAMP_R + 40, 64), new T.MeshStandardMaterial({ color: '#E8F2F6', transparent: true, opacity: 0, roughness: 0.1, metalness: 0.1, depthWrite: false }));
    dew.rotation.x = -Math.PI / 2; put(dew, CAMP[0], CAMP[1], 0.35); scene.add(dew);
    var NM = 5200, manna = new T.InstancedMesh(new T.SphereGeometry(0.035, 5, 3), new T.MeshStandardMaterial({ color: '#F6F4EE', roughness: 0.6 }), NM), mp = [];
    for (i = 0; i < NM; i++) {
      var ma = R() * 6.28, mr = CAMP_R + 1 + R() * 38, mx = CAMP[0] + Math.cos(ma) * mr, mz = CAMP[1] + Math.sin(ma) * mr;
      for (var tr2 = 0; tr2 < 12 && mx > 22; tr2++) { ma = R() * 6.28; mx = CAMP[0] + Math.cos(ma) * mr; mz = CAMP[1] + Math.sin(ma) * mr; }   /* 아이들 쪽(동쪽)에는 두지 않는다(밟지 않게). 다시 뽑는다 */
      if (mx > 22) { mx = CAMP[0] - mr; mz = CAMP[1]; }
      mp.push([mx, height(mx, mz) + 0.02, mz]); qm.makeScale(1, 0.5, 1); qm.setPosition(mx, height(mx, mz) + 0.02, mz); manna.setMatrixAt(i, qm);
    }
    manna.instanceMatrix.needsUpdate = true; manna.visible = false; scene.add(manna);
    var mannaLeft = NM;

    var phase = 'camp', tod = 0, todWant = 0, cloudOp = 0, cloudWant = 0, dewOp = 0, dewWant = 0, gather = false, gatherT = 0, few = false, qT = 0, melt = 0, faceCloud = false;
    var ca = new T.Color(), cb = new T.Color();
    function applyTod() {
      /* 0 낮, 1 저녁, 2 이른 아침 */
      var A = tod <= 1 ? ['#F3DDB0', '#FFFFFF', 0.62, 0.72, '#FFE9C4'] : ['#E8B49A', '#E8B8A0', 0.5, 0.45, '#FFB078'], B = tod <= 1 ? ['#E8B49A', '#E8B8A0', 0.5, 0.45, '#FFB078'] : ['#EAE0CC', '#F2EADA', 0.58, 0.6, '#FFF0D8'], t = tod <= 1 ? tod : tod - 1;
      ca.set(A[0]); cb.set(B[0]); ca.lerp(cb, t); scene.background.copy(ca); scene.fog.color.copy(ca);
      ca.set(A[1]); cb.set(B[1]); skyM.color.copy(ca.lerp(cb, t)); hemi.intensity = A[2] + (B[2] - A[2]) * t; sun.intensity = A[3] + (B[3] - A[3]) * t; ca.set(A[4]); cb.set(B[4]); sun.color.copy(ca.lerp(cb, t));
    }
    /* 대목마다 모든 상태를 처음부터 정한다('이전'으로 돌아와도 뒤 대목의 것이 남지 않게) */
    function setPhase(p) {
      phase = p;
      quail.visible = false; dewWant = 0; dewOp = 0; manna.visible = false; gather = false; few = false; gatherT = 0; jar.visible = false; mannaLeft = NM; manna.count = NM; qT = 0; melt = 0; faceCloud = false;
      people.forEach(function (o) { o.group.position.set(o.home[0], height(o.home[0], o.home[1]), o.home[1]); o.group.rotation.x = 0; });
      if (p === 'camp') { tod = 0; todWant = 0; applyTod(); cloudWant = 0; cloudOp = 0; }
      if (p === 'cloud') { todWant = 0.3; cloudWant = 1; faceCloud = true; }                      /* 16:10: 백성이 광야 쪽을 바라본다 */
      if (p === 'manna') { todWant = 1; cloudWant = 0.35; quail.visible = true; }                 /* 16:13-15: 저녁 메추라기 → 아침 이슬 → 만나 */
      if (p === 'gather') { todWant = 2; cloudWant = 0.35; manna.visible = true; gather = true; }   /* 16:16-21 */
      if (p === 'sabbath') { todWant = 2; cloudWant = 0.35; few = true; }                        /* 16:22-30 */
      if (p === 'jar') { todWant = 2; cloudWant = 0.35; jar.visible = true; }                    /* 16:31-36 */
    }
    var mannaT = -1;
    function v3(x, y, z) { return new T.Vector3(x, y, z); }
    if (FX) FX.sortLayers(scene);

    return {
      id: 'OT-13', scene: scene, sun: sun, sunOff: [-32, 50, 28],
      height: height, walkable: walkable,
      edge: function (x, z) {
        if (x < 26) return { who: 'onwoo', text: '진 안쪽으로는 들어가지 말자. 우리는 가장자리에서 지켜보는 사람이야.' };
        return { who: 'hyu', text: '진에서 너무 멀리 가지는 말자.' };
      },
      P: { start: [52, -10], machine: [58, -16], machineRot: -1.2,
        /* 재료가 놓인 곳(quests[i].found): 진 바깥의 광야 쪽 / 진 쪽(가장자리) / 이슬이 걷힌 광야 땅(만나가 없는 빈 땅) */
        parts: [[58, 18], [30, -12], [34, 14]], lookSpot: [34, 14],
        look: { focus: CAMP, mid: [10, 10], dy: 2, backE: 8, upE: 4 } },
      eventLook: function (i) {
        if (i === 2) return { focus: [-200, 30], mid: CAMP, dy: 16, backE: 8, upE: 3.4 };   /* 진 너머 광야 쪽의 구름(16:10) */
        if (i === 3) return { focus: [CAMP[0] + 20, CAMP[1] + 22], mid: [CAMP[0] + 20, CAMP[1] + 22], dy: 0.2, backE: 6, upE: 2.6 };
        if (i === 6) return { focus: AAR, mid: AAR, dy: 1, backE: 6, upE: 2.6 };
        return { focus: [CAMP[0] + 10, CAMP[1] + 30], mid: CAMP, dy: 1, backE: 7, upE: 3.2 };
      },
      detector: '탐지기', askLabel: '탐지기 물음 풀기',
      intro: { text: '타임머신이 넓은 광야에 내려앉았어요. 장막이 가득한 진이 보여요.', say: { who: 'hyu', text: '진 가장자리에서만 다니자.' } },
      lookText: '만나 이야기를 성경에서 찾아 읽은 뒤 다시 골라 보세요.',
      partBeats: [0, 1], eventStart: 2,
      sceneDoneText: '만나 장면을 끝까지 지켜봐야 떠날 수 있어요.',
      dex: [
        { id: 'camp', name: '이스라엘의 진', desc: '엘림과 시내 산 사이 신 광야에 친 진', ref: '출 16:1', hint: '장막들을 담아 보세요.', range: 80, pos: function () { return v3(CAMP[0], 1.5, CAMP[1]); } },
        { id: 'moses', name: '모세와 아론', desc: '백성이 원망한 두 사람. 원망은 여호와를 향한 것이라고 말했다', ref: '출 16:2', hint: '진 동쪽에 서 있어요.', range: 40, crop: 0.4, pos: function () { return v3(MOS[0], height(MOS[0], MOS[1]) + 1.1, MOS[1] + 2); } },
        { id: 'cloud', name: '광야 쪽의 구름', desc: '백성이 광야 쪽을 바라보니 구름 속에 여호와의 영광이 나타났다', ref: '출 16:10', hint: '구름이 나타난 뒤 진 너머를 보세요.', range: 600, crop: 0.8,
          visible: function () { return cloudOp > 0.4; }, pos: function () { return v3(cloud.position.x, 26, cloud.position.z); } },
        { id: 'manna', name: '작고 둥근 것', desc: '이슬이 마른 뒤 광야 땅 위에 있던, 서리처럼 가는 작고 둥근 것', ref: '출 16:14', hint: '아침에 진 둘레의 땅을 보세요.', range: 30, crop: 0.4,
          visible: function () { return manna.visible; }, pos: function () { return v3(CAMP[0] + 36, height(CAMP[0] + 36, CAMP[1] + 10), CAMP[1] + 10); } }
      ],
      reset: function () { setPhase('camp'); },
      partFound: function () {},
      partContinue: function () {},
      lookupPose: function () {},
      /* 대목 번호(OT-13.json): 2 = 16:6-12, 3 = 16:13-15, 4 = 16:16-21, 5 = 16:22-30, 6 = 16:31-36 */
      beatPose: function (i) { setPhase(i <= 1 ? 'camp' : ['', '', 'cloud', 'manna', 'gather', 'sabbath', 'jar'][i]); mannaT = i === 3 ? 0 : -1; },
      update: function (dt, now) {
        if (Math.abs(tod - todWant) > 0.003) { tod += (todWant - tod) * Math.min(1, dt * 0.6); applyTod(); }
        cloudOp += (cloudWant - cloudOp) * Math.min(1, dt * 0.5); cloud.scale.setScalar(Math.max(0.01, cloudOp)); cloud.visible = cloudOp > 0.02;
        /* 16:13-14: 저녁 메추라기 → 아침 이슬 → 이슬이 마르면 작고 둥근 것이 보인다 */
        if (mannaT >= 0) {
          mannaT += dt;
          if (mannaT > 6) { quail.visible = false; todWant = 2; }
          if (mannaT > 7 && mannaT < 12) dewWant = 1; else if (mannaT >= 12) { dewWant = 0; manna.visible = true; }
        }
        if (quail.visible) { qT += dt; for (var q = 0; q < qp.length; q++) { var u = Math.min(1, Math.max(0, (qT * 4 - qp[q][3]) / 10));   /* 이 대목이 시작될 때부터 내려앉는다 */ qm.makeRotationY(qp[q][2]); qm.setPosition(qp[q][0], height(qp[q][0], qp[q][1]) + 0.08 + (1 - u) * 12, qp[q][1]); quail.setMatrixAt(q, qm); } quail.instanceMatrix.needsUpdate = true; }
        dewOp += (dewWant - dewOp) * Math.min(1, dt * 0.5); dew.material.opacity = 0.45 * dewOp; dew.visible = dewOp > 0.02;
        /* 16:16-21: 나가서 거둔다(허리를 굽혔다 폈다). 땅의 것은 조금씩 줄어든다 */
        people.forEach(function (o, k) {
          var to = o.home;
          if (faceCloud) { o.group.rotation.y = Math.atan2(cloud.position.x - o.group.position.x, cloud.position.z - o.group.position.z); if (o.update) o.update(dt, 0); return; }
          if (gather) { gatherT += dt / people.length; to = gatherT > 18 ? o.home : o.field; }
          if (few && k % 8 === 0) to = gatherT < 8 ? o.field : o.home;
          if (few) gatherT += dt / people.length;
          var p = o.group.position, dx = to[0] - p.x, dz = to[1] - p.z, d = Math.hypot(dx, dz), mv = d > 0.3;
          if (mv) { var st = Math.min(d, 2.4 * dt); p.x += dx / d * st; p.z += dz / d * st; o.group.rotation.y = Math.atan2(dx, dz); }
          p.y = height(p.x, p.z);
          o.group.rotation.x = (!mv && gather && to === o.field) ? 0.5 + 0.3 * Math.sin(now * 2 + k) : 0;
          if (o.update) o.update(dt, mv ? 1.1 : 0);
        });
        if (gather && manna.visible && mannaLeft > 600) { mannaLeft = Math.max(600, mannaLeft - Math.round(dt * 260)); manna.count = mannaLeft; }
        /* 16:21: 거둔 뒤 해가 뜨겁게 쬐면 남은 것이 스러진다 */
        if (gather && gatherT > 18 && mannaLeft > 0) { melt += dt; mannaLeft = Math.max(0, Math.round(600 * (1 - melt / 6))); manna.count = mannaLeft; if (!mannaLeft) manna.visible = false; }
        if (moses.update) moses.update(dt, false); if (aaron.update) aaron.update(dt, false);
      },
      audio: function (A) { A.setFlock(999); A.setFire(999); },
      menuCam: function (camera, now) { var a = now * 0.05; camera.position.set(46 + Math.sin(a) * 8, 8, -6); camera.lookAt(CAMP[0], 1, CAMP[1]); },
      debug: { phase: function () { return { phase: phase, tod: tod, manna: manna.visible, left: mannaLeft }; }, arrived: function () { return phase !== 'camp'; } }
    };
  };
})();
