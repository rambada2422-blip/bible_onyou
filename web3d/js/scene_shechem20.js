/* 3D 장면 설정: OT-20 세겜에서 언약을 다시 세움 (수 24:1-28). 자동 작업 3d-b가 더한 장면(장면표의 대표 장면 12개 밖의 추가 제안).
 * 방향: 백성이 모인 자리는 북쪽(-Z). 그 북쪽 끝에 상수리나무가 있고, 여호수아는 나무 앞에서 남쪽의 백성을 보고 선다. 아이들은 남쪽 비탈에서만 다닌다.
 * 아이들이 다니는 때: 지파들이 세겜으로 모여드는 때(24:1).
 * 본문에 맞춘 점 (content/ot/OT-20.json design3d)
 *  - 24:1: 모든 지파가 모이고, 장로들·우두머리들·재판장들·관리들이 앞줄에 선다. 모두 서 있다("하나님 앞에 보인지라").
 *  - 24:2-24: 여호수아가 말하고 백성이 대답한다. 말씀과 대답은 소리나 자막으로 지어내지 않는다(글은 대목 카드와 성경책으로).
 *    애굽·홍해·발람·왕벌은 그리지 않는다(24:5-12는 말씀 속의 일). 백성이 울거나 무릎 꿇거나 이방 신을 꺼내는 몸짓은 없다(24:23은 말만 적는다).
 *  - 24:25-27: 여호수아가 율법 책에 적고(작은 두루마리로만), 큰 돌을 상수리나무 아래 세운다. 돌에 글자를 새기지 않는다.
 *  - 24:28: 백성이 저마다 흩어져 돌아간다(아이들 쪽이 아닌 곳으로).
 *  - 여호와의 성소(24:26)는 그리지 않는다(본문은 "성소 곁"이라고만 한다). 세겜의 성과 산도 그리지 않는다. 하나님을 나타내는 빛·구름·소리 없음.
 * 감수가 필요한 설정: 모인 자리와 상수리나무의 자리, 사람 수(백성 예순넷, 앞줄 열둘. 일부만 그림)와 남녀·아이가 섞인 것, 감람원·포도원을 비탈 가장자리에 둔 것(24:13은 주신 땅을 두고 하신 말씀),
 *   율법 책을 두루마리로 그리고 적는 몸짓 없이 들고만 있는 것, 돌의 크기와 여호수아가 혼자 곁에서 몸을 굽혀 일으켜 세우는 모습(본문은 "취하여 세우고"), 돌이 처음에 나무 곁에 누워 있는 것,
 *   백성이 서·북·동쪽에서만 오고 그쪽으로 돌아가는 것(24:28 "각기 기업으로"에는 남쪽 지파의 땅도 있다. 아이들이 있는 남쪽을 비우려고 그렇게 함), 대목 6을 15초쯤으로 줄인 것, 여호수아의 생김새(joshua.glb).
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  BO3D.scene3d = BO3D.scene3d || {};
  if (!BO3D.p3b || !BO3D.p3b.on('OT-20')) return;   /* design3d.build가 false면 이야기 카드로만 */
  BO3D.scene3d['OT-20'] = function (api) {
    var T = THREE, MO = BO3D.models || {}, PR = BO3D.props, B = BO3D.p3b, FX = api.FX, R = PR.rng(2001);
    var sm = B.sm, noise = B.noise, hash = B.hash, std = B.std;
    var OAK = [10, -36], STONE = [7.6, -32.6], LAY = [9.6, -32.0], JOSH = [2, -30], CROWD = [2, -16];
    function height(x, z) {
      return 2.4 * sm(0, 22, z) + 0.35 * noise(x * 0.05 + 6, z * 0.05 + 3) + sm(110, 230, Math.hypot(x, z + 10)) * 22 * (0.4 + 0.6 * noise(x * 0.015 + 2, z * 0.015));
    }
    function walkable(x, z) { return x >= -36 && x <= 42 && z >= 5 && z <= 34; }

    var scene = new T.Scene();
    scene.background = new T.Color('#EFE3C4'); scene.fog = new T.Fog('#EFE3C4', 90, 360);
    var skyO = B.sky(scene, 2002);
    var cEarth = new T.Color('#C6AE78'), cGrass = new T.Color('#98A862'), cTrod = new T.Color('#D6C49A');
    scene.add(B.ground(height, function (x, z, c) {
      c.copy(cEarth).lerp(cGrass, 0.3 + 0.6 * noise(x * 0.07, z * 0.07));
      var d = Math.max(Math.abs(x - 2) / 30, Math.abs(z + 20) / 22); if (d < 1) c.lerp(cTrod, sm(1, 0.6, d) * 0.7);
    }, 560, 160));
    var hemi = new T.HemisphereLight('#DCEFF2', '#A99A6A', 0.66); scene.add(hemi);
    var sun = new T.DirectionalLight('#FFF0CF', 0.76); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    var ss = sun.shadow.camera; ss.left = -26; ss.right = 26; ss.top = 26; ss.bottom = -26; ss.near = 1; ss.far = 150; sun.shadow.bias = -0.0015;
    scene.add(sun); scene.add(sun.target);
    function put(o, x, z, lift) { o.position.set(x, height(x, z) + (lift || 0), z); scene.add(o); return o; }
    var i;

    /* 상수리나무(24:26)와 큰 돌(24:26). 성소는 그리지 않는다 */
    put(B.tree(7, 12), OAK[0], OAK[1]);
    var stone = new T.Mesh(new T.DodecahedronGeometry(0.8, 0), std('#A49C8C')); stone.scale.set(0.8, 1.45, 0.65); stone.castShadow = true; scene.add(stone);
    var raise = 0, raiseWant = 0;
    function stoneAt(u) {   /* 0 = 나무 곁에 누워 있음, 1 = 상수리나무 아래 세워짐 */
      var x = LAY[0] + (STONE[0] - LAY[0]) * u, z = LAY[1] + (STONE[1] - LAY[1]) * u;
      stone.position.set(x, height(x, z) + 0.5 + 0.6 * u, z); stone.rotation.z = (1 - u) * Math.PI / 2;
    }
    /* 감람원과 포도원(24:13): 비탈 가장자리의 나무 몇 그루와 덩굴 줄로만 */
    var statics = [];
    [[33, 12], [39, 17], [34, 24], [41, 28], [45, 12], [46, 22], [38, 33]].forEach(function (q, n) { var ol = B.olive(n); ol.position.set(q[0], height(q[0], q[1]), q[1]); statics.push(ol); });
    var vineM = std('#6E8A44'), stakeM = std('#7A5E40');
    for (i = 0; i < 5; i++) for (var j = 0; j < 6; j++) { var vx = -52 + i * 3.2, vz = 10 + j * 4, vn = new T.Mesh(new T.BoxGeometry(0.9, 0.7, 3.2), vineM); vn.position.set(vx, height(vx, vz) + 0.95, vz); statics.push(vn); var sk = new T.Mesh(new T.BoxGeometry(0.1, 1.0, 0.1), stakeM); sk.position.set(vx, height(vx, vz) + 0.5, vz); statics.push(sk); }
    statics.forEach(function (o) { scene.add(o); }); var grove = PR.mergeStatic(statics); statics.forEach(function (o) { scene.remove(o); }); scene.add(grove);
    [[-20, 12, 1], [14, 26, 2], [-6, 30, 3], [22, 9, 4]].forEach(function (q) { if (MO.rock) put(MO.rock(q[2] + 90), q[0], q[1], -0.05); if (MO.shrub) put(MO.shrub(q[2] + 50), q[0] + 2.2, q[1] + 1.2); });

    /* 사람들: 여호수아(24:1), 앞줄의 장로들·우두머리들·재판장들·관리들(24:1), 모든 지파(24:1) */
    var A = B.actors(height), all = [], people = [];
    function mk(o, glb) { var a = A.make(o, glb); scene.add(a.g); all.push(a); return a; }
    var josh = mk({ group: api.fallback('#8A4B34', 1.78, 0.27), update: function () {} });
    api.person('joshua', function (nm) { A.swap(josh, nm, scene); if (scroll) nm.group.add(scroll); });
    var scroll = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.42, 8), std('#EFE4C8')); scroll.rotation.z = Math.PI / 2; scroll.position.set(0.05, 1.12, 0.3); scroll.visible = false; josh.g.add(scroll);   /* 하나님의 율법 책(24:26): 생김새는 본문에 없음 */
    for (i = 0; i < 12; i++) { var ld = mk(B.lite(B.man(2010 + i * 7), true)); ld.home = [JOSH[0] - 11 + i * 2.0, JOSH[1] + 6 + Math.abs(i - 5.5) * 0.25]; people.push(ld); }
    for (i = 0; i < 64; i++) {
      var kd = i % 9 === 8 ? B.child(2100 + i * 3) : (i % 2 ? B.woman(2100 + i * 3) : B.man(2100 + i * 3)), pp = mk(B.lite(kd, false)), row = Math.floor(i / 13), col = i % 13;   /* 뒤쪽 백성은 한 덩이로(휴대폰 가볍게) */
      pp.home = [CROWD[0] - 14.4 + col * 2.4 + (hash(i, 3) - 0.5) * 0.9 + (row % 2) * 1.1, JOSH[1] + 9 + row * 2.3 + (hash(i, 7) - 0.5) * 0.7]; people.push(pp);
    }
    people.forEach(function (a, n) {
      var ang = Math.PI * (0.15 + 1.7 * hash(n, 11)) + Math.PI / 2;          /* 서·북·동쪽에서 온다(아이들이 있는 남쪽이 아닌 곳) */
      a.away = [a.home[0] + Math.cos(ang) * (70 + hash(n, 13) * 50), a.home[1] - Math.abs(Math.sin(ang)) * (40 + hash(n, 17) * 40) - 10];
      a.near = [a.home[0] + (a.away[0] - a.home[0]) * (0.12 + 0.25 * hash(n, 19)), a.home[1] + (a.away[1] - a.home[1]) * (0.12 + 0.25 * hash(n, 19))];
      /* 24:28 돌아갈 때의 길: 여호수아·큰 돌·상수리나무가 있는 북쪽 가운데(x -3~15)를 비켜 서쪽이나 동쪽으로 먼저 빠진다 */
      var west = a.home[0] < 6, sx = west ? Math.min(a.home[0], -5) - hash(n, 23) * 3 : Math.max(a.home[0], 17) + hash(n, 23) * 3;
      a.leave = [[sx, a.home[1] - 1], [west ? Math.min(a.away[0], sx - 6) : Math.max(a.away[0], sx + 6), a.away[1]]];
    });

    var phase = 'gather', pt = 0;
    function faceJ(a) { return Math.atan2(JOSH[0] - a.home[0], JOSH[1] - a.home[1]); }
    /* 대목마다 모든 상태를 처음부터 정한다('이전'으로 돌아와도 뒤 대목의 것이 남지 않게) */
    function setPhase(p) {
      phase = p; pt = 0; josh.did = 0; josh.thud = false;
      raise = raiseWant = 0; stoneAt(0); scroll.visible = false;
      A.at(josh, JOSH[0], JOSH[1], 0);
      people.forEach(function (a) { a.left = false; if (p === 'gather') { A.at(a, a.near[0], a.near[1], 0); A.go(a, [a.home], 1.1 + hash(a.home[0], 2) * 0.4, faceJ(a)); } else A.at(a, a.home[0], a.home[1], faceJ(a)); });
    }
    function v3(x, y, z) { return new T.Vector3(x, y, z); }
    if (FX) FX.sortLayers(scene);
    var gy = height(JOSH[0], JOSH[1]);

    return {
      id: 'OT-20', scene: scene, sun: sun, sunOff: [-30, 50, 30],
      height: height, walkable: walkable,
      edge: function (x, z) {
        if (z < 5) return { who: 'onwoo', text: '모인 사람들 쪽으로는 더 가지 말자. 우리는 지켜보는 사람이야.' };
        return { who: 'hyu', text: '이 비탈 위에서만 다니자.' };
      },
      P: { start: [10, 22], machine: [16, 27], machineRot: -0.4,
        /* 재료가 놓인 곳(quests[i].found): 감람원 가장자리 땅 / 포도원 가장자리 땅 / 모인 백성이 건너다보이는 빈 땅 */
        parts: [[29, 19], [-32, 20], [-10, 8]], lookSpot: [2, 7.5],
        look: { focus: JOSH, mid: CROWD, dy: 1.6, backE: 6, upE: 5 } },
      eventLook: function (n) {
        if (n <= 3) return { focus: JOSH, mid: [JOSH[0], JOSH[1] + 6], dy: 1.4, backE: 6, upE: 5 };
        return null;
      },
      /* 대목마다 보는 자리를 바꾼다: 여호수아 쪽(24:14-15), 대답하는 백성 쪽(24:16-24), 상수리나무와 큰 돌 쪽(24:25-28). 모두 멀찍이 */
      eventCam: function (n) {
        if (n === 4) return { pos: [-16, gy + 5.5, -8], look: [JOSH[0], gy + 1.4, JOSH[1]] };
        if (n === 5) return { pos: [-10, gy + 6, -42], look: [JOSH[0], gy + 1.2, JOSH[1] + 4] };   /* 여호수아와 대답하는 백성을 함께. 상수리나무는 화면 밖 */
        if (n === 6) return josh.did < 3 || pt < josh.t3 + 4 ? { pos: [27, gy + 3, -19], look: [(LAY[0] + STONE[0]) / 2, gy + 0.6, (LAY[1] + STONE[1]) / 2] } : { pos: [24, gy + 13, 4], look: [CROWD[0], gy + 1, CROWD[1] - 6] };   /* 돌을 세우는 동안은 나무 아래, 백성이 흩어질 때는 넓게 */
        return null;
      },
      detector: '탐지기', askLabel: '탐지기 물음 풀기',
      intro: { text: '타임머신이 낮은 비탈에 내려앉았어요. 사람들이 사방에서 한곳으로 모여들고 있어요.', say: { who: 'hyu', text: '사람들이 모이는 자리에는 들어가지 말자. 이 비탈 위에서만 다니자.' } },
      lookText: '세겜에서 있었던 일을 성경에서 찾아 읽은 뒤 다시 골라 보세요.',
      partBeats: [0, 1], eventStart: 2,
      sceneDoneText: '세겜의 장면을 끝까지 지켜봐야 떠날 수 있어요.',
      dex: [
        { id: 'tribes', name: '세겜에 모인 지파들', desc: '여호수아가 세겜에 모은 이스라엘의 모든 지파', ref: '수 24:1', hint: '비탈 아래 넓은 땅을 보세요.', range: 90, crop: 0.6, pos: function () { return v3(CROWD[0], gy + 1.2, CROWD[1]); } },
        { id: 'joshua', name: '여호수아', desc: '모든 지파를 세겜에 모으고 백성에게 말한 사람', ref: '수 24:1-2', hint: '모인 사람들 앞을 보세요.', range: 80, crop: 0.3, pos: function () { var p = josh.g.position; return v3(p.x, p.y + 1.2, p.z); } },
        { id: 'oak', name: '상수리나무', desc: '여호와의 성소 곁에 있던 나무. 그 아래 큰 돌을 세웠다', ref: '수 24:26', hint: '모인 사람들 뒤쪽의 큰 나무를 보세요.', range: 110, crop: 0.5, pos: function () { return v3(OAK[0], gy + 7, OAK[1]); } },
        { id: 'stone', name: '큰 돌', desc: '여호수아가 상수리나무 아래 세운 돌. 증거가 될 것이라고 했다', ref: '수 24:26-27', hint: '상수리나무 아래를 보세요.', range: 90, crop: 0.3, visible: function () { return raise > 0.95; }, pos: function () { return v3(STONE[0], gy + 1.2, STONE[1]); } }
      ],
      reset: function () { setPhase('gather'); },
      partFound: function () {},
      lookupPose: function () {},
      /* 대목 번호(OT-20.json): 0 = 24:1, 1 = 24:2-4 (재료를 주울 때) / 2 = 24:5-7, 3 = 24:8-13, 4 = 24:14-15, 5 = 24:16-24, 6 = 24:25-28 */
      beatPose: function (n) { setPhase(n === 6 ? 'covenant' : 'stand'); },
      update: function (dt) {
        pt += dt;
        if (phase === 'covenant') {
          /* 15초쯤 안에 끝나게: 율법 책에 적고(24:26) → 누워 있던 큰 돌로 가서 → 곁에서 몸을 굽혀 일으켜 세우고(24:26) → 백성에게 말하고(24:27) → 백성이 돌아간다(24:28) */
          scroll.visible = pt > 0.5 && pt < 4;
          if (pt > 4 && josh.did === 0) { josh.did = 1; A.go(josh, [[STONE[0] + 0.4, STONE[1] + 1.7]], 1.4, Math.PI * 0.85); }
          if (josh.did === 1 && !A.moving(josh)) { josh.did = 2; raiseWant = 1; }                                                   /* 돌은 여호수아가 곁에 선 뒤에만 움직인다 */
          josh.bendWant = josh.did === 2 && raise < 0.9 ? 0.55 : 0;
          if (josh.did === 2 && raise > 0.97) { josh.did = 3; josh.t3 = pt; A.go(josh, [[STONE[0] - 1.6, STONE[1] + 1.4]], 0.8, 0); }   /* 24:27 돌 곁에서 백성을 보고 말한다 */
          if (josh.did === 3 && pt > josh.t3 + 3) people.forEach(function (a) { if (!a.left) { a.left = true; A.go(a, a.leave, 1.3); } });   /* 24:28 */
          if (Math.abs(raise - raiseWant) > 0.002) { raise += (raiseWant - raise) * Math.min(1, dt * 1.1); stoneAt(raise); }
          if (raise > 0.97 && !josh.thud) { josh.thud = true; if (FX) FX.audio.thud(0.35); }   /* 큰 돌이 서는 소리(24:26). 한 번만 */
        }
        all.forEach(function (a) { if (a.g.visible) A.step(a, dt); });
      },
      audio: function (Au) { Au.setFlock(999); Au.setFire(999); },
      menuCam: function (camera, now) { var a2 = now * 0.05; camera.position.set(4 + Math.sin(a2) * 10, height(4, 16) + 8, 18); camera.lookAt(JOSH[0], gy + 2, JOSH[1]); },
      debug: { phase: function () { return { phase: phase, t: pt, raise: raise, did: josh.did, josh: [Math.round(josh.g.position.x), Math.round(josh.g.position.z)] }; }, arrived: function () { return true; } }
    };
  };
})();
