/* 3D 장면 설정: OT-07 벧엘에서 야곱이 꾼 꿈 (창 28:10-22). 브엘세바에서 하란으로 가는 길의 한 곳. (자동 작업 3d-a. 장면표의 3D 12장면 밖의 추가 제안)
 * 방향: 길이 화면 앞(+Z, 브엘세바 쪽)에서 안쪽(-Z, 하란 쪽)으로 지나간다. 본문은 방위를 말하지 않으므로 화면의 글에 방위 말을 쓰지 않는다.
 *   야곱이 머무는 곳은 길가(JAC). 아이들은 길과 그곳에서 멀리 떨어진 들 가장자리(+X)에서만 다닌다. 실제 거리를 줄여서 만들었다.
 * 본문에 맞춘 점 (content/ot/OT-07.json design3d)
 *  - 야곱이 브엘세바를 떠나 하란으로 홀로 길을 간다(28:10). 아이들이 들에서 재료를 찾는 동안 길을 걸어와 한 곳에 멈춘다.
 *  - 해가 진다(28:11). 야곱은 그곳의 돌 하나를 베개로 삼아 눕는다. 돌을 드는 동작은 만들지 않는다(누운 모습과 머리맡의 돌만).
 *  - 꿈(28:12-15): 사닥다리, 하나님의 사자들, 그 위에 서신 여호와, 말씀하시는 음성은 만들지 않는다. 화면에는 잠든 야곱과 별이 뜬 밤하늘만 있다.
 *    밤하늘에 빛 기둥이나 특별한 빛을 두지 않는다(이 본문에는 불·구름·빛이 없다).
 *  - 잠이 깬 야곱(28:16-17)은 동이 트기 전, 누웠던 곳 곁에 선 모습으로만. 두려워하는 얼굴이나 무릎 꿇은 모습은 만들지 않는다.
 *  - 아침(28:18-19): 베개로 삼았던 그 돌이 기둥으로 서 있고 꼭대기가 기름에 젖어 짙다. 붓는 동작과 그릇은 만들지 않는다. 이름(벧엘)은 글로만.
 *  - 서원(28:20-22): 기둥 곁에 선 야곱. 말은 글로만.
 * 감수가 필요한 설정: 그곳의 지형(낮은 둔덕과 흩어진 돌. 본문은 '돌이 있는 땅'만 말한다), 길의 생김새와 자리, 야곱이 걸어오는 쪽, 야곱의 생김새(수염, 어두운 올리브빛 겉옷, 지팡이·짐 없음),
 *   돌의 크기와 모양(베개일 때 길이 약 0.6m, 기둥일 때 높이 약 0.7m), 누운 방향, 잠든 동안 아이들이 지켜보는 거리, 해 질 녘·밤·동트기 전·아침의 빛(28:11 해가 짐, 28:18 아침),
 *   별이 뜬 밤하늘(본문은 밤이라고만 한다), 잠이 깬 때를 동트기 전으로 둔 것(28:16은 때를 말하지 않는다), 기름을 기둥 꼭대기의 짙은 빛으로만 둔 것, 루스 성을 만들지 않은 것(28:19).
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  BO3D.scene3d = BO3D.scene3d || {};
  BO3D.scene3d['OT-07'] = function (api) {
    var T = THREE, MO = BO3D.models || {}, PR = BO3D.props, FX = api.FX, R = PR.rng(728);
    function sm(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
    function hash(ix, iz) { var n = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453; return n - Math.floor(n); }
    function noise(x, z) {
      var ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
      var a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    /* 자리: 야곱이 머무는 곳(길가), 머리맡의 돌, 길(브엘세바 쪽 +Z → 하란 쪽 -Z) */
    var JAC = [2.4, 0], STONE = [2.4, -1.95];
    var ROAD = [[12, 190], [6, 70], [0.5, 6], [-4, -60], [-18, -210]], RL = [0], k0;
    for (k0 = 1; k0 < ROAD.length; k0++) RL.push(RL[k0 - 1] + Math.hypot(ROAD[k0][0] - ROAD[k0 - 1][0], ROAD[k0][1] - ROAD[k0 - 1][1]));
    function roadAt(s) { s = Math.max(0, Math.min(RL[RL.length - 1], s)); for (var k = 1; k < ROAD.length; k++) if (s <= RL[k]) { var t = (s - RL[k - 1]) / (RL[k] - RL[k - 1]); return [ROAD[k - 1][0] + (ROAD[k][0] - ROAD[k - 1][0]) * t, ROAD[k - 1][1] + (ROAD[k][1] - ROAD[k - 1][1]) * t, Math.atan2(ROAD[k][0] - ROAD[k - 1][0], ROAD[k][1] - ROAD[k - 1][1])]; } return [ROAD[0][0], ROAD[0][1], 0]; }
    function roadDist(x, z) { var best = 1e9; for (var k = 0; k + 1 < ROAD.length; k++) { var a0 = ROAD[k], b0 = ROAD[k + 1], vx = b0[0] - a0[0], vz = b0[1] - a0[1], t = Math.max(0, Math.min(1, ((x - a0[0]) * vx + (z - a0[1]) * vz) / (vx * vx + vz * vz))); best = Math.min(best, Math.hypot(x - a0[0] - vx * t, z - a0[1] - vz * t)); } return best; }
    var S_START = 72, S_STOP = RL[2] + 3;   /* 야곱이 걷기 시작하는 길의 자리(브엘세바 쪽)와 멈추는 자리(그곳 곁) */
    function height(x, z) {
      var h = 1.6 * (noise(x * 0.03 + 2, z * 0.03 + 5) - 0.5) + 0.5 * Math.sin(x * 0.05) * Math.cos(z * 0.04);
      h += sm(60, 200, Math.hypot(x - 10, z)) * (6 + 14 * noise(x * 0.012 + 3, z * 0.012));      /* 멀리 둘러싼 낮은 둔덕 */
      h *= sm(1.5, 5, roadDist(x, z)) * 0.5 + 0.5;                                                /* 길은 조금 판판하게 */
      return h;
    }
    function walkable(x, z) { return x >= 26 && x <= 58 && z >= -24 && z <= 40; }   /* 길과 그곳에서 멀리 떨어진 들 가장자리 */

    var scene = new T.Scene();
    scene.background = new T.Color('#EADFC4'); scene.fog = new T.Fog('#E6DCC2', 110, 520);
    var skyG = new T.SphereGeometry(600, 24, 14), sp = skyG.attributes.position, sc = new Float32Array(sp.count * 3), cc = new T.Color(), top = new T.Color('#6FA6CC'), hor = new T.Color('#F1E6CA'), i;
    for (i = 0; i < sp.count; i++) { var tt = Math.max(0, sp.getY(i) / 600); cc.copy(hor).lerp(top, sm(0.02, 0.7, tt)); sc[i * 3] = cc.r; sc[i * 3 + 1] = cc.g; sc[i * 3 + 2] = cc.b; }
    skyG.setAttribute('color', new T.BufferAttribute(sc, 3));
    var skyM = new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false }); scene.add(new T.Mesh(skyG, skyM));
    /* 별(밤에만). 점 하나의 묶음이라 그리기 한 번 */
    var stG = new T.BufferGeometry(), stP = new Float32Array(700 * 3);
    for (i = 0; i < 700; i++) { var th = R() * 6.2832, ph = Math.acos(1 - R() * 0.92), rr = 560; stP[i * 3] = Math.sin(ph) * Math.cos(th) * rr; stP[i * 3 + 1] = Math.cos(ph) * rr + 10; stP[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * rr; }
    stG.setAttribute('position', new T.BufferAttribute(stP, 3));
    var stM = new T.PointsMaterial({ color: '#F4F2FF', size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }), stars = new T.Points(stG, stM); stars.visible = false; scene.add(stars);
    var g = new T.PlaneGeometry(700, 700, 160, 160); g.rotateX(-Math.PI / 2);
    var pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color(), f1 = new T.Color('#C9B886'), f2 = new T.Color('#B5A672'), grn = new T.Color('#A3A469'), rk = new T.Color('#A39886'), rd = new T.Color('#DCCBA0');
    for (i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i), y = height(x, z); pos.setY(i, y);
      c.copy(f1).lerp(f2, noise(x * 0.07, z * 0.07)); c.lerp(grn, 0.35 * sm(0.55, 0.85, noise(x * 0.025 + 7, z * 0.025)));
      c.lerp(rk, 0.45 * sm(0.6, 0.9, noise(x * 0.13 + 3, z * 0.13 + 1)));                             /* 돌이 있는 땅(28:11) */
      c.lerp(rd, sm(3.2, 1.2, roadDist(x, z)) * 0.7);                                                  /* 길(28:10, 28:20) */
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals();
    var ground = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 })); ground.receiveShadow = true; scene.add(ground);
    var hemi = new T.HemisphereLight('#DCEFF2', '#B59A66', 0.62); scene.add(hemi);
    var sun = new T.DirectionalLight('#FFF0CF', 0.74); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    var ss = sun.shadow.camera; ss.left = -26; ss.right = 26; ss.top = 26; ss.bottom = -26; ss.near = 1; ss.far = 150; sun.shadow.bias = -0.0015;
    scene.add(sun); scene.add(sun.target);
    function put(o, x, z, lift) { o.position.set(x, height(x, z) + (lift || 0), z); scene.add(o); return o; }
    function near(x, z, p, r) { return Math.hypot(x - p[0], z - p[1]) < r; }
    /* 흩어진 돌(28:11 '그곳의 한 돌'). 길과 야곱이 머무는 자리, 아이들이 다니는 곳은 비워 둔다 */
    if (MO.rock) {
      for (i = 0; i < 70; i++) { var ro = MO.rock(700 + i); ro.scale.multiplyScalar(0.3 + R() * 1.1); var rx = -150 + R() * 260, rz = -160 + R() * 300; if (roadDist(rx, rz) < 4 || near(rx, rz, JAC, 6) || (rx > 22 && rx < 62 && rz > -28 && rz < 44)) continue; put(ro, rx, rz, -0.1); }
      for (i = 0; i < 9; i++) { var ra = 0.4 + i * 0.7, rd2 = 3.2 + hash(i, 4) * 4, sr = MO.rock(790 + i); sr.scale.multiplyScalar(0.18 + hash(i, 5) * 0.2); var sx = JAC[0] + Math.cos(ra) * rd2, sz = JAC[1] + Math.sin(ra) * rd2; if (roadDist(sx, sz) < 2) continue; put(sr, sx, sz, -0.05); }   /* 그곳의 작은 돌들 */
    }
    /* 베개로 삼은 돌(28:11) → 아침에 기둥으로 세운 돌(28:18). 같은 돌 하나. 기름(28:18)은 꼭대기의 짙은 빛으로만 */
    var stoneMat = new T.MeshStandardMaterial({ color: '#8E8577', roughness: 0.95, flatShading: true });
    var stoneGeo = new T.DodecahedronGeometry(0.5, 0); stoneGeo.scale(0.38, 0.74, 0.3);
    var stone = new T.Mesh(stoneGeo, stoneMat); stone.castShadow = true; stone.receiveShadow = true; scene.add(stone);
    var oil = new T.Mesh(new T.SphereGeometry(0.13, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: '#615446', roughness: 0.2, metalness: 0.05 }));
    oil.scale.set(1.05, 0.22, 0.9); scene.add(oil);   /* 기름에 젖은 꼭대기(그릇·붓는 동작 없음) */
    function stoneLying() { stone.rotation.set(0, 0.3, Math.PI / 2); stone.position.set(STONE[0], height(STONE[0], STONE[1]) + 0.16, STONE[1]); oil.visible = false; }
    function stonePillar() { stone.rotation.set(0, 0.3, 0); stone.position.set(STONE[0], height(STONE[0], STONE[1]) + 0.33, STONE[1]); oil.position.set(STONE[0], stone.position.y + 0.3, STONE[1]); oil.visible = true; }
    stoneLying();

    /* 야곱(Blender) */
    var jacob = { group: api.fallback('#5E5A44', 1.75, 0.27), update: function () {} };
    jacob.group.rotation.order = 'YXZ'; scene.add(jacob.group);
    api.person(BO3D.glbData && BO3D.glbData.jacob ? 'jacob' : 'moses', function (nm) {
      nm.group.position.copy(jacob.group.position); nm.group.rotation.order = 'YXZ'; nm.group.rotation.copy(jacob.group.rotation); nm.group.visible = jacob.group.visible;
      scene.remove(jacob.group); scene.add(nm.group); jacob = nm;
    });

    var phase = 'idle', walkS = S_START, lying = false, tod = 0, todWant = 0, todRate = 1, ca = new T.Color(), cb = new T.Color();
    /* 0 낮(기운 해), 1 해 질 녘, 2 밤, 3 동트기 전, 4 아침. 대목 순서대로 이웃한 값이 되게 늘어놓았다 */
    var TOD = [['#EADFC4', '#FFFFFF', 0.62, 0.72, '#FFEED0', '#DCEFF2', '#B59A66'], ['#E2AE88', '#EEB08C', 0.5, 0.5, '#FFA466', '#F0D0B8', '#9A7A56'], ['#141C33', '#1E2844', 0.3, 0.04, '#8090C0', '#5A6A9C', '#2A2A30'],
      ['#55587A', '#7E7AA0', 0.34, 0.14, '#E0A890', '#9A98C0', '#5A5048'], ['#EAD9C0', '#FFF6E8', 0.62, 0.74, '#FFE8C8', '#E4F0F2', '#B8A070']];   /* 바탕, 하늘, 반구광 세기, 해 세기, 해 빛, 반구광 하늘 빛, 반구광 땅 빛 */
    function applyTod() {
      var kk = Math.min(3.999, Math.max(0, tod)), A = TOD[Math.floor(kk)], B = TOD[Math.floor(kk) + 1], t = kk - Math.floor(kk);
      ca.set(A[0]); cb.set(B[0]); ca.lerp(cb, t); scene.background.copy(ca); scene.fog.color.copy(ca);
      ca.set(A[1]); cb.set(B[1]); skyM.color.copy(ca.lerp(cb, t)); hemi.intensity = A[2] + (B[2] - A[2]) * t; sun.intensity = A[3] + (B[3] - A[3]) * t; ca.set(A[4]); cb.set(B[4]); sun.color.copy(ca.lerp(cb, t));
      ca.set(A[5]); cb.set(B[5]); hemi.color.copy(ca.lerp(cb, t)); ca.set(A[6]); cb.set(B[6]); hemi.groundColor.copy(ca.lerp(cb, t));
      stM.opacity = sm(1.3, 2, tod) * (1 - sm(2.2, 3, tod)); stars.visible = stM.opacity > 0.01;
    }
    function jacobWalkAt(s) { var q = roadAt(s); jacob.group.position.set(q[0], height(q[0], q[1]), q[1]); jacob.group.rotation.set(0, q[2], 0); lying = false; }
    function jacobLie() { jacob.group.position.set(JAC[0], height(JAC[0], JAC[1]) + 0.14, JAC[1] + 0.1); jacob.group.rotation.set(-Math.PI / 2, 0, 0); lying = true; }   /* 등을 대고 누움. 머리는 돌 쪽 */
    function jacobStand(face) { jacob.group.position.set(JAC[0] + 0.5, height(JAC[0] + 0.5, JAC[1] - 0.4), JAC[1] - 0.4); jacob.group.rotation.set(0, face, 0); lying = false; }
    /* 대목마다 모든 상태를 처음부터 정한다('이전'으로 돌아와도 뒤 대목의 것이 남지 않게) */
    function setPhase(p) {
      phase = p; todRate = 1; jacob.group.visible = true;
      if (p === 'idle') { walkS = S_START; jacobWalkAt(walkS); stoneLying(); tod = todWant = 0; applyTod(); }
      if (p === 'sleep' || p === 'dream') { jacobLie(); stoneLying(); todWant = 2; if (p === 'sleep') { if (tod > 1) tod = 1; todRate = 0.28; } }   /* 28:11: 해가 진다. 천천히 밤이 된다 */
      if (p === 'wake') { jacobStand(Math.PI); stoneLying(); todWant = 3; }                                                                       /* 28:16-17: 잠이 깬 야곱(동트기 전) */
      if (p === 'pillar' || p === 'vow') { stonePillar(); jacobStand(Math.atan2(STONE[0] - JAC[0] - 0.5, STONE[1] - JAC[1] + 0.4) + 0.35); todWant = 4; }   /* 28:18-22: 아침. 기둥으로 세운 돌 곁 */
      if (p === 'sleep' || p === 'dream' || p === 'wake' || p === 'pillar' || p === 'vow') walkS = S_STOP;
    }
    function v3(x, y, z) { return new T.Vector3(x, y, z); }
    /* 지켜보기 카메라: 틀이 화면을 위로 20% 올려 주므로 볼 것(t)을 거의 그대로 겨눈다 */
    function cam(p, up, t) {
      var py = height(p[0], p[1]) + up, d = Math.hypot(t[0] - p[0], t[2] - p[1]), el = Math.atan2(t[1] + height(t[0], t[2]) - py, d) - 0.04;
      return { pos: [p[0], py, p[1]], look: [t[0], py + d * Math.tan(el), t[2]] };
    }
    if (FX) FX.sortLayers(scene);
    var PH = ['sleep', 'dream', 'dream', 'dream', 'wake', 'pillar', 'vow'];

    return {
      id: 'OT-07', scene: scene, sun: sun, sunOff: [-32, 50, 28],
      height: height, walkable: walkable,
      edge: function (x, z) {
        if (x < 26) return { who: 'hyu', text: '길 쪽으로는 가지 말자. 길을 가는 사람이 머무는 곳에서 멀리 떨어져 있자.' };
        return { who: 'onwoo', text: '들에서 너무 멀리 가지는 말자.' };
      },
      P: { start: [52, 30], machine: [56, 37], machineRot: -2.4,
        /* 재료가 놓인 곳(quests[i].found): 길에서 멀리 떨어진 들 가장자리 / 길가의 그곳이 멀리 바라보이는 빈 땅 / 우리가 밤을 지낸 자리 가까운 들 가장자리.
           재료를 주울 때 화면은 걸어온 쪽을 보므로, 재료 2(28:10-11 대목)는 야곱이 머무는 곳 쪽으로 곧게 걸어가며 줍게 둔다 */
        parts: [[44, 10], [30.3, 6.9], [36, -14]], lookSpot: [36, -14],
        look: { focus: JAC, mid: [18, -4], dy: 0.6, backE: 7, upE: 2.2 } },
      eventCam: function (i) {
        if (i === 1) return cam([11, 3], 1.1, [JAC[0], 2.6, JAC[1] - 0.8]);                  /* 28:12: 잠든 야곱 위로 별이 뜬 밤하늘. 꿈에서 본 것은 그리지 않는다 */
        if (i === 2) return cam([9, -7], 1.2, [JAC[0], 0.3, JAC[1] - 0.8]);                 /* 28:13-14 */
        if (i === 3) return cam([12, 6], 1.3, [JAC[0], 0.3, JAC[1] - 0.8]);                 /* 28:15 */
        if (i === 4) return cam([11, 3], 2.0, [JAC[0] + 0.5, 1.1, JAC[1] - 0.4]);           /* 28:16-17: 잠이 깬 야곱 */
        if (i === 5) return cam([8, 2], 1.8, [STONE[0], 0.7, STONE[1] + 0.5]);               /* 28:18-19: 기둥으로 세운 돌과 야곱 */
        if (i === 6) return cam([9, -6], 2.0, [JAC[0], 1.0, JAC[1] - 1.2]);                  /* 28:20-22 */
        return null;
      },
      detector: '탐지기', askLabel: '탐지기 물음 풀기',
      intro: { text: '타임머신이 돌이 많은 들 가장자리에 내려앉았어요. 멀리 길이 하나 지나가요.', say: { who: 'hyu', text: '길에서 떨어진 들 가장자리에서만 다니자.' } },
      lookText: '벧엘 이야기를 성경에서 찾아 읽은 뒤 다시 골라 보세요.',
      partBeats: [null, 0], eventStart: 1,
      beatNote: function (i) {
        if (i === 0) return '우리는 길에서 멀리 떨어진 들에서 지켜봐요.';
        if (i >= 1 && i <= 3) return '꿈에서 본 것과 들은 말씀은 화면으로 만들지 않았어요. 성경책에서 읽어요.';
        return null;
      },
      sceneDoneText: '벧엘 이야기를 끝까지 지켜봐야 떠날 수 있어요.',
      dex: [
        { id: 'jacob', name: '야곱', desc: '브엘세바에서 떠나 하란으로 향하여 간 사람', ref: '창 28:10', hint: '길을 가는 사람을 담아 보세요.', range: 160, crop: 0.35,
          pos: function () { var p0 = jacob.group.position; return lying ? v3(p0.x, p0.y + 0.3, p0.z - 0.8) : v3(p0.x, p0.y + 1.1, p0.z); } },
        { id: 'road', name: '하란으로 가는 길', desc: '야곱이 브엘세바를 떠나 하란으로 향하여 간 길', ref: '창 28:10', hint: '들 너머로 지나가는 길을 담아 보세요.', range: 260, crop: 0.7, pos: function () { var q = roadAt(RL[2] + 30); return v3(q[0], height(q[0], q[1]) + 0.3, q[1]); } },
        { id: 'stone', name: '베개로 삼은 돌', desc: '야곱이 그곳의 한 돌을 가져다 베개로 삼고 누워 잤다', ref: '창 28:11', hint: '해가 진 뒤, 그 사람이 누운 곳의 머리맡을 담아 보세요.', range: 120, crop: 0.25,
          visible: function () { return phase === 'sleep' || phase === 'dream'; }, pos: function () { return v3(STONE[0], height(STONE[0], STONE[1]) + 0.2, STONE[1]); } },
        { id: 'pillar', name: '기둥으로 세운 돌', desc: '야곱이 아침 일찍 일어나 베개로 삼았던 돌을 기둥으로 세우고 그 위에 기름을 부었다', ref: '창 28:18', hint: '아침에 그곳을 담아 보세요.', range: 120, crop: 0.25,
          visible: function () { return phase === 'pillar' || phase === 'vow'; }, pos: function () { return v3(STONE[0], height(STONE[0], STONE[1]) + 0.4, STONE[1]); } }
      ],
      reset: function () { setPhase('idle'); },
      partFound: function (i) { if (i === 1) setPhase('sleep'); },
      partContinue: function () {},
      lookupPose: function () {},
      /* 대목 번호(OT-07.json): 0 = 28:10-11, 1 = 28:12, 2 = 28:13-14, 3 = 28:15, 4 = 28:16-17, 5 = 28:18-19, 6 = 28:20-22 */
      beatPose: function (i) { setPhase(PH[i] || 'idle'); },
      update: function (dt, now) {
        if (Math.abs(tod - todWant) > 0.003) { tod += Math.sign(todWant - tod) * Math.min(Math.abs(todWant - tod), dt * todRate * Math.max(0.15, Math.abs(todWant - tod))); applyTod(); }
        var mv = false;
        if (phase === 'idle' && walkS < S_STOP) { walkS = Math.min(S_STOP, walkS + 1.15 * dt); jacobWalkAt(walkS); mv = walkS < S_STOP; if (!mv) jacob.group.rotation.y = Math.PI; }   /* 28:10-11: 길을 걸어와 그곳에 멈춘다 */
        if (!lying && jacob.update) jacob.update(dt, mv);
      },
      audio: function (A) { A.setFlock(999); A.setFire(999); },
      menuCam: function (camera, now) { var a2 = now * 0.05; camera.position.set(40 + Math.sin(a2) * 6, 6, 28); camera.lookAt(JAC[0], 1, JAC[1]); },
      debug: { phase: function () { return { phase: phase, tod: tod, walkS: walkS, lying: lying, stars: stM.opacity }; }, arrived: function () { return true; } }
    };
  };
})();
