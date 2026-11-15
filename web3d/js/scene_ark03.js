/* 3D 장면 설정: OT-03 노아의 방주와 무지개 언약 (창 6:9-9:17).
 * 아이들이 다니는 때: 방주가 아라랏 산에 머문 뒤 땅이 마른 때(창 8:4-5, 8:13-14). 방주의 문은 아직 닫혀 있다(8:16 앞).
 *   까마귀(8:7)와 비둘기가 감람 잎을 물고 온 일(8:11)은 이미 지난 뒤라, 재료(까마귀 깃털, 감람나무 잔가지)와 맞는다.
 * 그 앞의 일(창 6:9-22, 재료를 주울 때 보는 대목)에는 "그 앞의 일"이라는 한 줄을 붙인다.
 * 방주에 들어가고 물이 불어 높은 산들이 덮이는 대목(창 7:1-24)은 design3d대로 "타임머신 창 너머로 보는 장면"으로 보여 준다(아이들은 화면에 없음).
 *   이때는 비와 짙은 안개로 땅을 가린다(방주를 탄 곳은 본문에 없다).
 * 본문에 맞춘 점 (content/ot/OT-03.json design3d)
 *  - 방주: 길이 삼백, 너비 오십, 높이 삼십 규빗(약 135×22.5×13.5m, 한 규빗을 0.45m로), 삼 층, 옆의 문, 위의 창, 역청(창 6:14-16). 나무 종류는 단정하지 않는다.
 *  - 까마귀와 비둘기(창 8:6-12), 가족과 짐승·새가 나옴(창 8:18-19), 단은 멀리서만(창 8:20), 구름 속 무지개(창 9:13-14).
 *  - 물에 빠진 사람·짐승·주검, 문을 닫는 손, 하나님의 형상, 무지개를 활이나 무기로 그리는 것은 없다. 짐승의 이름은 본문에 없어 단순한 꼴로만.
 * 감수가 필요한 설정: 방주의 생김새(지붕, 문과 창의 자리, 문 앞 경사판), 산의 생김새, 가족의 생김새, 짐승의 수와 모양, 단의 자리, 무지개의 자리,
 *   7장의 일을 아라랏 자리에서(안개로 가려) 보여 주는 것.
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  BO3D.scene3d = BO3D.scene3d || {};
  BO3D.scene3d['OT-03'] = function (api) {
    var T = THREE, M2 = BO3D.models2 || {}, MO = BO3D.models || {}, PR = BO3D.props, FX = api.FX, R = PR.rng(309);
    function sm(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
    function hash(ix, iz) { var n = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453; return n - Math.floor(n); }
    function noise(x, z) {
      var ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
      var a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    var ARK = [-48, -40], ARK_ROT = 0.35, AL = 135, AW = 22.5, AH = 13.5;
    /* 땅: 산 위의 넓은 등성이(아이들이 다니는 곳), 둘레로 내려가는 비탈, 멀리 다른 봉우리들(창 8:5) */
    var PEAKS = [[-260, -120, 140], [180, -260, 150], [300, 60, 130], [-200, 220, 125], [60, 320, 120], [-340, -40, 115]];   /* 꼭대기가 아이들 등성이보다 높게(창 8:5). 홍수는 이보다 높다(7:19-20) */
    function height(x, z) {
      var r = Math.hypot(x + 10, z + 10), h = 1.2 * noise(x * 0.04 + 1, z * 0.04 + 3) - sm(70, 220, r) * 70;
      PEAKS.forEach(function (p) { var d = Math.hypot(x - p[0], z - p[1]); h += p[2] * Math.pow(sm(120, 0, d), 1.6) * (0.8 + 0.3 * noise(x * 0.03, z * 0.03)); });
      return h;
    }
    function walkable(x, z) { return x >= 8 && x <= 52 && z >= -2 && z <= 44; }

    var scene = new T.Scene();
    scene.background = new T.Color('#E8E2D2'); scene.fog = new T.Fog('#E4DECE', 90, 520);
    var skyG = new T.SphereGeometry(900, 24, 14), sp = skyG.attributes.position, sc = new Float32Array(sp.count * 3), cc = new T.Color(), top = new T.Color('#86AFC8'), hor = new T.Color('#EDE6D4'), i;
    for (i = 0; i < sp.count; i++) { var tt = Math.max(0, sp.getY(i) / 900); cc.copy(hor).lerp(top, sm(0.02, 0.7, tt)); sc[i * 3] = cc.r; sc[i * 3 + 1] = cc.g; sc[i * 3 + 2] = cc.b; }
    skyG.setAttribute('color', new T.BufferAttribute(sc, 3));
    var skyM = new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false }); scene.add(new T.Mesh(skyG, skyM));
    var g = new T.PlaneGeometry(900, 900, 180, 180); g.rotateX(-Math.PI / 2);
    var pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color(), rk = new T.Color('#9A8E7C'), rk2 = new T.Color('#B0A48E'), mud = new T.Color('#7E6E58'), moss = new T.Color('#8E9A66');
    for (i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i), y = height(x, z); pos.setY(i, y);
      c.copy(rk).lerp(rk2, noise(x * 0.05, z * 0.05)); if (y < -10) c.lerp(mud, sm(-10, -30, y) * 0.7); if (y > -4 && y < 4) c.lerp(moss, 0.25 * noise(x * 0.1, z * 0.1));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals();
    var ground = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 })); ground.receiveShadow = true; scene.add(ground);
    var hemi = new T.HemisphereLight('#DCE8F0', '#8E8270', 0.62); scene.add(hemi);
    var sun = new T.DirectionalLight('#FFF4DC', 0.72); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    var ss = sun.shadow.camera; ss.left = -30; ss.right = 30; ss.top = 30; ss.bottom = -30; ss.near = 1; ss.far = 170; sun.shadow.bias = -0.0015;
    scene.add(sun); scene.add(sun.target);
    function put(o, x, z, lift) { o.position.set(x, height(x, z) + (lift || 0), z); scene.add(o); return o; }
    function std(cl) { return new T.MeshStandardMaterial({ color: cl, flatShading: true, roughness: 0.95 }); }
    if (MO.rock) for (i = 0; i < 60; i++) { var ro = MO.rock(1500 + i); ro.scale.multiplyScalar(0.7 + R() * 1.6); var rx = -90 + R() * 160, rz = -80 + R() * 140; if (Math.hypot(rx - ARK[0], rz - ARK[1]) < 80 && Math.abs(rz - ARK[1]) < 20) continue; if (rx > 6 && rx < 54 && rz > -4 && rz < 46 && R() > 0.3) continue; put(ro, rx, rz, -0.1); }

    /* 물: 처음에는 골짜기에만(창 8:5), 그때로 돌아가 보는 대목에서는 산을 다 덮는다(창 7:19-20) */
    var water = null;
    try { if (M2.waterSurface) { water = M2.waterSurface(1700, 1700); water.mesh.material.uniforms.uFlow.value.set(0.04, 0.02); } } catch (e) { water = null; }
    if (!water) { var wm = new T.Mesh(new T.PlaneGeometry(1700, 1700), new T.MeshStandardMaterial({ color: '#5A8AA0', transparent: true, opacity: 0.9 })); wm.rotation.x = -Math.PI / 2; water = { mesh: wm, update: function () {} }; }
    scene.add(water.mesh);
    var LOW = -16, FLOOD = 130, GONE = -85, level = GONE, levelWant = GONE;

    /* 방주(창 6:14-16): 길쭉한 상자 배, 삼 층, 옆에 문, 지붕 아래 창(한 규빗), 역청을 칠한 어두운 빛 */
    var ark = new T.Group(), pitch = std('#3E3226'), pitch2 = std('#4A3C2C'), dark = std('#1E1814');
    var hull = new T.Mesh(new T.BoxGeometry(AL, AH * 0.82, AW), pitch); hull.position.y = AH * 0.41; hull.castShadow = true; ark.add(hull);
    for (i = 1; i < 3; i++) { var rib = new T.Mesh(new T.BoxGeometry(AL + 0.2, 0.25, AW + 0.2), pitch2); rib.position.y = AH * 0.82 * i / 3; ark.add(rib); }
    var win = new T.Mesh(new T.BoxGeometry(AL - 2, 0.45, AW - 1), dark); win.position.y = AH * 0.82 + 0.22; ark.add(win);
    var roof = new T.Mesh(new T.CylinderGeometry(0.1, AW * 0.62, AH * 0.2, 4, 1), pitch2); roof.rotation.y = Math.PI / 4; roof.scale.set(AL / (AW * 0.88), 1, 1); roof.position.y = AH * 0.82 + 0.45 + AH * 0.1; roof.castShadow = true; ark.add(roof);
    var door = new T.Mesh(new T.BoxGeometry(5, 4.5, 0.4), dark); door.position.set(AL * 0.18, 2.6, AW / 2 + 0.05); ark.add(door);
    var ramp = new T.Mesh(new T.BoxGeometry(5, 0.3, 7), pitch2); ramp.position.set(AL * 0.18, 0.9, AW / 2 + 3.4); ramp.rotation.x = 0.22; ramp.visible = false; ark.add(ramp);
    ark.rotation.y = ARK_ROT; scene.add(ark);
    var arkRestY = height(ARK[0], ARK[1]) - 0.8;
    function doorWorld(dz) { var lx = AL * 0.18, lz = AW / 2 + (dz || 0); return [ARK[0] + Math.cos(ARK_ROT) * lx + Math.sin(ARK_ROT) * lz, ARK[1] - Math.sin(ARK_ROT) * lx + Math.cos(ARK_ROT) * lz]; }

    /* 비(창 7:12): 그때로 돌아가 보는 대목에만 */
    var rainG = new T.BufferGeometry(), rp = [];
    for (i = 0; i < 900; i++) { var rx2 = (R() - 0.5) * 220, ry = R() * 90, rz2 = (R() - 0.5) * 220; rp.push(rx2, ry, rz2, rx2 + 0.3, ry - 3, rz2); }
    rainG.setAttribute('position', new T.Float32BufferAttribute(rp, 3));
    var rain = new T.LineSegments(rainG, new T.LineBasicMaterial({ color: '#C8D4DE', transparent: true, opacity: 0.45 })); rain.visible = false; scene.add(rain);

    /* 가족(창 7:13, 8:18): 노아(Blender)와 일곱 사람. 처음에는 방주 안에 있다(보이지 않음) */
    var family = [], noah = { group: api.fallback('#5E6E7A', 1.75, 0.27), update: function () {} };
    scene.add(noah.group); noah.group.visible = false;
    api.person('noah', function (nm) { nm.group.position.copy(noah.group.position); nm.group.visible = noah.group.visible; scene.remove(noah.group); scene.add(nm.group); noah = nm; family[0].o = nm; });
    family.push({ o: noah, k: 0 });
    /* 세 아들과 아내, 세 며느리(창 7:13): 1~3은 어른 남자, 4~7은 어른 여자 */
    for (i = 1; i < 8; i++) { var fo = null; try { fo = M2.israelite ? M2.israelite(i * 23 + 11, { kind: i <= 3 ? 'man' : 'woman', carry: 'none' }) : null; } catch (e) { fo = null; } if (!fo) fo = PR.soldier(i, '#7A6A54', null); scene.add(fo.group); fo.group.visible = false; family.push({ o: fo, k: i }); }
    /* 짐승과 새(창 8:19): 이름을 정하지 않은 단순한 꼴 */
    var animals = [], birds = [];
    function beast(seed) {
      var r = PR.rng(seed), gr = new T.Group(), cl = ['#8A6A4A', '#C9B79A', '#5E4A3A', '#9A8A70', '#E2D8C4', '#6E5E4A'][seed % 6], m = std(cl), s = 0.5 + r() * 1.6;
      var bd = new T.Mesh(new T.BoxGeometry(0.5 * s, 0.45 * s, 1.0 * s), m); bd.position.y = 0.7 * s; gr.add(bd);
      var hd = new T.Mesh(new T.BoxGeometry(0.3 * s, 0.3 * s, 0.4 * s), m); hd.position.set(0, 0.95 * s, 0.6 * s); gr.add(hd);
      [[-0.18, 0.35], [0.18, 0.35], [-0.18, -0.35], [0.18, -0.35]].forEach(function (q) { var lg = new T.Mesh(new T.BoxGeometry(0.1 * s, 0.5 * s, 0.1 * s), m); lg.position.set(q[0] * s, 0.25 * s, q[1] * s); gr.add(lg); });
      gr.traverse(function (o) { if (o.isMesh) o.castShadow = true; }); return gr;
    }
    for (i = 0; i < 22; i++) { var bt = beast(i + 3); scene.add(bt); bt.visible = false; animals.push({ g: bt, k: i, tgt: [ARK[0] + 30 + (hash(i, 3) - 0.5) * 50, ARK[1] + 26 + hash(i, 5) * 30] }); }
    var birdM = std('#F0EEE8'), ravenM = std('#26262E');
    function bird(m) { var gr = new T.Group(); [-1, 1].forEach(function (sd) { var w = new T.Mesh(new T.BoxGeometry(0.7, 0.05, 0.22), m); w.position.x = sd * 0.35; w.rotation.z = sd * 0.35; gr.add(w); }); var b = new T.Mesh(new T.BoxGeometry(0.16, 0.14, 0.5), m); gr.add(b); return gr; }
    var raven = bird(ravenM), dove = bird(birdM); raven.visible = false; dove.visible = false; scene.add(raven); scene.add(dove);
    var leaf = new T.Mesh(new T.BoxGeometry(0.12, 0.03, 0.2), std('#6E9A4A')); leaf.position.set(0, -0.02, 0.32); leaf.visible = false; dove.add(leaf);   /* 감람 새 잎사귀(8:11) */
    for (i = 0; i < 12; i++) { var bb = bird(i % 3 ? birdM : ravenM); bb.visible = false; scene.add(bb); birds.push({ g: bb, ph: R() * 6, r: 20 + R() * 40, h: 18 + R() * 20 }); }
    /* 단(창 8:20): 멀리서 단만 */
    var altar = PR.stoneHeap(820, 14); altar.scale.setScalar(2.2); put(altar, ARK[0] + 44, ARK[1] + 46); altar.visible = false;
    /* 구름과 무지개(창 9:13-14): 하늘의 빛깔 띠. 활이나 무기 모양으로 그리지 않는다 */
    var bow = new T.Group(), bands = ['#E85A4A', '#F09A3A', '#F2D24A', '#7EC06A', '#4A9AD8', '#5A62C0', '#8A5AB8'];
    bands.forEach(function (bc, k) { var tor = new T.Mesh(new T.TorusGeometry(260 - k * 7, 3.6, 6, 80, Math.PI), new T.MeshBasicMaterial({ color: bc, transparent: true, opacity: 0, depthWrite: false, fog: false })); bow.add(tor); });
    /* 아이들 자리에서 보아 방주 너머에 선다 */
    var KID = [24, 0.5], bdx = ARK[0] - KID[0], bdz = ARK[1] - KID[1], bdl = Math.hypot(bdx, bdz), BOW = [ARK[0] + bdx / bdl * 330, ARK[1] + bdz / bdl * 330];
    bow.position.set(BOW[0], -30, BOW[1]); bow.rotation.y = Math.atan2(-bdx, -bdz); scene.add(bow);
    var clouds = new T.Group(), cloudM = new T.MeshStandardMaterial({ color: '#DADCE0', roughness: 1, transparent: true, opacity: 0 });
    for (i = 0; i < 16; i++) { var cl = new T.Mesh(new T.SphereGeometry(18 + R() * 16, 12, 8), cloudM); cl.position.set(BOW[0] * 0.8 + (R() - 0.5) * 420, 120 + R() * 50, BOW[1] * 0.8 + (R() - 0.5) * 160); cl.scale.y = 0.45; clouds.add(cl); }
    /* 무지개 둘레와 뒤의 구름(9:13-14) */
    var bux = Math.cos(bow.rotation.y), buz = -Math.sin(bow.rotation.y);
    for (i = 0; i < 12; i++) { var th = 0.12 * Math.PI + (i / 11) * 0.76 * Math.PI, cr = 250 + R() * 40, cl2 = new T.Mesh(new T.SphereGeometry(30 + R() * 22, 12, 8), cloudM);
      cl2.position.set(BOW[0] + bux * Math.cos(th) * cr + bdx / bdl * 40, -30 + Math.sin(th) * cr, BOW[1] + buz * Math.cos(th) * cr + bdz / bdl * 40); cl2.scale.y = 0.5; clouds.add(cl2); }
    scene.add(clouds);

    var phase = 'rest', gray = 0, grayWant = 0, bowOp = 0, bowWant = 0, outT = -1, inT = -1, birdT = -1;
    var ca = new T.Color(), cb = new T.Color();
    function applyGray() {
      ca.set('#E8E2D2'); cb.set('#8A929C'); ca.lerp(cb, gray); scene.background.copy(ca); scene.fog.color.copy(ca);
      ca.set('#FFFFFF'); cb.set('#7E8892'); skyM.color.copy(ca.lerp(cb, gray)); hemi.intensity = 0.62 - 0.2 * gray; sun.intensity = 0.72 - 0.42 * gray;
    }
    function hideAll() {
      family.forEach(function (f) { f.o.group.visible = false; }); animals.forEach(function (a) { a.g.visible = false; }); birds.forEach(function (b) { b.g.visible = false; });
      raven.visible = false; dove.visible = false; leaf.visible = false; altar.visible = false; ramp.visible = false; door.visible = true;
      outT = -1; inT = -1; birdT = -1; bowWant = 0; bowOp = 0; rain.visible = false; scene.fog.near = 90; scene.fog.far = 520;
    }
    /* 대목마다 모든 상태를 처음부터 정한다('이전'으로 돌아와도 뒤 대목의 것이 남지 않게) */
    function setPhase(p) {
      phase = p; hideAll();
      if (p === 'rest') { levelWant = GONE; level = GONE; grayWant = 0; gray = 0; applyGray(); }                       /* 아이들 때: 땅이 마름(8:13-14) */
      if (p === 'enter') { levelWant = GONE; level = GONE; grayWant = 1; rain.visible = true; inT = 0; ramp.visible = true; door.visible = false; scene.fog.near = 20; scene.fog.far = 240; }   /* 창 7:1-16: 들어가고, 비가 내리고, 문이 닫힘 */
      if (p === 'flood') { levelWant = FLOOD; level = Math.max(Math.min(level, arkRestY - 3), arkRestY - 3); grayWant = 1; rain.visible = true; scene.fog.near = 20; scene.fog.far = 300; }   /* 창 7:17-24 */
      if (p === 'recede') { levelWant = GONE; level = LOW; grayWant = 0.2; birdT = 0; }                                   /* 창 8:1-14 */
      if (p === 'out') { levelWant = GONE; level = GONE; grayWant = 0; outT = 0; ramp.visible = true; door.visible = false; altar.visible = true; }   /* 창 8:15-22 */
      if (p === 'bow') { levelWant = GONE; level = GONE; grayWant = 0.1; bowWant = 1; outT = 30; ramp.visible = true; door.visible = false; altar.visible = true; }  /* 창 9:1-17 */
    }
    function v3(x, y, z) { return new T.Vector3(x, y, z); }
    if (FX) FX.sortLayers(scene);

    return {
      id: 'OT-03', scene: scene, sun: sun, sunOff: [-34, 52, 26],
      height: height, walkable: walkable,
      edge: function (x, z) {
        if (x < 8 || z < -2) return { who: 'onwoo', text: '방주 쪽으로는 더 가지 말자. 우리는 멀리서 지켜보는 사람이야.' };
        return { who: 'hyu', text: '비탈이 가팔라. 이 등성이 위에서만 다니자.' };
      },
      P: { start: [40, 32], machine: [47, 38], machineRot: -0.7,
        /* 재료가 놓인 곳(quests[i].found): 방주 쪽(멀찍이 돌 틈) / 물이 줄어 드러난 산봉우리 쪽 / 등성이 끝 마른 땅 */
        parts: [[12, 6], [50, 4], [24, 0.5]], lookSpot: [24, 0.5],
        look: { focus: ARK, mid: ARK, dy: 6, backE: 9, upE: 5 } },
      eventCam: function (i) {
        if (i === 2 || i === 3) { var lv = Math.max(level, 0); return { pos: [ARK[0] + 120, lv + 28, ARK[1] + 150], look: [ARK[0], lv + 4, ARK[1]] }; }
        return null;
      },
      kidsHidden: function (i) { return i === 2 || i === 3; },
      beatNote: function (i) {
        if (i <= 1) return '그 앞의 일이에요. 지금 방주는 아라랏 산에 머물러 있어요.';
        if (i === 2 || i === 3) return '타임머신 창 너머로 그 앞의 일을 봐요. 물이 넘치는 동안 땅에는 설 곳이 없었어요.';
        if (i === 4) return '물이 줄어 땅이 마르기까지, 그 앞의 일을 이어서 봐요.';
        return null;
      },
      eventLook: function (i) {
        if (i === 4) return { focus: ARK, mid: [ARK[0] + 20, ARK[1] - 10], dy: 14, backE: 9, upE: 5 };
        if (i === 5) { var dw = doorWorld(12), am = [(dw[0] + altar.position.x) / 2, (dw[1] + altar.position.z) / 2]; return { focus: am, mid: am, dy: 3, backE: 9, upE: 5 }; }   /* 나온 가족과 단을 함께 */
        if (i === 6) return { focus: ARK, mid: ARK, dy: 30, backE: 14, upE: 7 };
        return null;
      },
      detector: '탐지기', askLabel: '탐지기 물음 풀기',
      intro: { text: '타임머신이 높은 산 위에 내려앉았어요. 땅이 말라 있어요. 방주의 문은 아직 닫혀 있어요.', say: { who: 'hyu', text: '비탈이 가팔라. 등성이 위에서만 다니자.' } },
      lookText: '노아의 방주 이야기를 성경에서 찾아 읽은 뒤 다시 골라 보세요.',
      partBeats: [0, 1], eventStart: 2,
      sceneDoneText: '방주 장면을 끝까지 지켜봐야 떠날 수 있어요.',
      dex: [
        { id: 'ark', name: '방주', desc: '길이 삼백, 너비 오십, 높이 삼십 규빗에 삼 층으로 지은 방주', ref: '창 6:15-16', hint: '등성이 아래쪽을 보세요.', range: 260, crop: 0.7, pos: function () { return v3(ARK[0], ark.position.y + AH * 0.5, ARK[1]); } },
        { id: 'peaks', name: '산봉우리들', desc: '물이 줄어 드러난 산들의 봉우리', ref: '창 8:5', hint: '멀리 솟은 봉우리를 담아 보세요.', range: 900, crop: 0.8, pos: function () { return v3(PEAKS[0][0], height(PEAKS[0][0], PEAKS[0][1]) - 4, PEAKS[0][1]); } },
        { id: 'noah', name: '노아', desc: '의인이고 하나님과 동행한 사람', ref: '창 6:9', hint: '방주에서 나온 뒤에 찍을 수 있어요.', range: 70, crop: 0.36,
          visible: function () { return noah.group.visible; }, pos: function () { var p = noah.group.position; return v3(p.x, p.y + 1.1, p.z); } },
        { id: 'bow', name: '구름 속의 무지개', desc: '하나님이 구름 속에 두신 언약의 증거', ref: '창 9:13', hint: '마지막에 하늘을 보세요.', range: 1200, crop: 0.9,
          visible: function () { return bowOp > 0.3; }, pos: function () { return v3(bow.position.x, bow.position.y + 180, bow.position.z); } }
      ],
      reset: function () { setPhase('rest'); },
      partFound: function () {},
      partContinue: function () {},
      lookupPose: function () { if (phase !== 'rest') setPhase('rest'); },
      /* 대목 번호(OT-03.json): 2 = 7:1-16, 3 = 7:17-24, 4 = 8:1-14, 5 = 8:15-22, 6 = 9:1-17 */
      beatPose: function (i) { setPhase(i <= 1 ? 'rest' : ['', '', 'enter', 'flood', 'recede', 'out', 'bow'][i]); },
      update: function (dt, now) {
        if (Math.abs(gray - grayWant) > 0.003) { gray += (grayWant - gray) * Math.min(1, dt * 0.6); applyGray(); }
        level += (levelWant - level) * Math.min(1, dt * (levelWant > level ? 0.18 : 0.12));
        water.mesh.position.y = level; water.mesh.visible = level > -75; if (water.update) water.update(now);
        /* 방주: 물이 땅보다 높으면 물 위에 뜨고, 아니면 아라랏 산 위에 머문다(창 7:18, 8:4) */
        var floatY = level - AH * 0.25;
        ark.position.set(ARK[0], Math.max(arkRestY, floatY) + (floatY > arkRestY ? Math.sin(now * 0.6) * 0.3 : 0), ARK[1]);
        if (rain.visible) { rain.position.set(ARK[0] + 60, Math.max(level, 0) + ((-now * 30) % 3), ARK[1] + 70); }
        /* 까마귀(8:7)와 비둘기 세 번(8:8-12): 돌아옴 → 감람 새 잎을 물고 돌아옴 → 다시 돌아오지 않음 */
        if (birdT >= 0) {
          birdT += dt; raven.visible = birdT < 10;
          raven.position.set(ARK[0] + Math.cos(now * 0.5) * 40, ark.position.y + AH + 16 + Math.sin(now) * 2, ARK[1] + Math.sin(now * 0.5) * 40); raven.rotation.y = -now * 0.5;
          var trip = birdT < 10 ? (birdT - 3) / 6 : birdT < 17 ? (birdT - 10) / 6 : (birdT - 17) / 5, last = birdT >= 17, dd;
          if (birdT < 3) dd = -1; else if (!last) dd = trip >= 1 ? 0 : 60 * Math.sin(Math.min(1, trip) * Math.PI); else dd = trip >= 1 ? -1 : 160 * trip;
          dove.visible = dd > 0.5; leaf.visible = birdT > 13 && birdT < 17;
          if (dd > 0) { dove.position.set(ARK[0] + dd, ark.position.y + AH + 10 + dd * 0.2, ARK[1] + dd * 0.4); dove.rotation.y = (trip % 1) < 0.5 || last ? Math.atan2(1, 0.4) : Math.atan2(-1, -0.4); }
        } else { raven.visible = false; dove.visible = false; }
        /* 들어감(7:7-9, 7:13-16): 가족과 짐승이 문으로 들어가고, 모두 들어가면 문이 닫힌다(닫는 손은 그리지 않는다) */
        if (inT >= 0) {
          inT += dt;
          family.forEach(function (f) {
            var u = Math.min(1, Math.max(0, (inT - 6 - f.k * 0.5) / 5)), a = doorWorld(2), b = doorWorld(14 + (f.k % 4) * 2.2);
            var x = b[0] + (a[0] - b[0]) * u + (f.k - 3.5) * 1.5 * (1 - u), z = b[1] + (a[1] - b[1]) * u;
            f.o.group.visible = u < 1; f.o.group.position.set(x, height(x, z), z); f.o.group.rotation.y = ARK_ROT + Math.PI; if (f.o.update) f.o.update(dt, u > 0 && u < 1);
          });
          animals.forEach(function (an) {
            var u = Math.min(1, Math.max(0, (inT - an.k * 0.25) / 7)), a = doorWorld(2);
            var x = an.tgt[0] + (a[0] - an.tgt[0]) * u, z = an.tgt[1] + (a[1] - an.tgt[1]) * u;
            an.g.visible = u < 1; an.g.position.set(x, height(x, z), z); an.g.rotation.y = Math.atan2(a[0] - an.tgt[0], a[1] - an.tgt[1]);
          });
          if (inT > 16) { door.visible = true; ramp.visible = false; }
        }
        /* 나옴(창 8:18-19): 가족이 문에서 나와 서고, 짐승이 뒤따라 흩어진다. 새가 날아오른다 */
        if (outT >= 0) {
          outT += dt;
          family.forEach(function (f) {
            var u = Math.min(1, Math.max(0, (outT - f.k * 0.6) / 6)), a = doorWorld(2), b = doorWorld(14 + (f.k % 4) * 2.2);
            var x = a[0] + (b[0] - a[0]) * u + (f.k - 3.5) * 1.5 * u, z = a[1] + (b[1] - a[1]) * u;
            f.o.group.visible = outT > f.k * 0.6; f.o.group.position.set(x, height(x, z), z); f.o.group.rotation.y = ARK_ROT; if (f.o.update) f.o.update(dt, u < 1);
          });
          animals.forEach(function (an) {
            var u = Math.min(1, Math.max(0, (outT - 6 - an.k * 0.35) / 9)), a = doorWorld(2);
            var x = a[0] + (an.tgt[0] - a[0]) * u, z = a[1] + (an.tgt[1] - a[1]) * u;
            an.g.visible = outT > 6 + an.k * 0.35; an.g.position.set(x, height(x, z), z); an.g.rotation.y = Math.atan2(an.tgt[0] - a[0], an.tgt[1] - a[1]);
          });
          birds.forEach(function (b) { b.g.visible = outT > 8; var t = now * 0.4 + b.ph; b.g.position.set(ARK[0] + Math.cos(t) * b.r, ark.position.y + AH + b.h, ARK[1] + Math.sin(t) * b.r); b.g.rotation.y = -t; });
        }
        bowOp += (bowWant - bowOp) * Math.min(1, dt * 0.35);
        bow.children.forEach(function (tor) { tor.material.opacity = 0.42 * bowOp; }); bow.visible = bowOp > 0.01;
        cloudM.opacity = 0.75 * Math.max(bowOp, gray);
        clouds.visible = cloudM.opacity > 0.02;
      },
      audio: function (A) { A.setFlock(999); A.setFire(999); },
      menuCam: function (camera, now) { var a = now * 0.05; camera.position.set(40 + Math.sin(a) * 8, 10, 40); camera.lookAt(ARK[0], 4, ARK[1]); },
      debug: { phase: function () { return { phase: phase, level: level, out: outT, bow: bowOp }; }, arrived: function () { return phase !== 'rest'; } }
    };
  };
})();
