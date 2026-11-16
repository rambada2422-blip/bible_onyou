/* 3D 장면 설정: OT-15 열두 정탐꾼 (민 13:1-14:38). 바란 광야 가데스. (자동 작업 3d-a. 장면표의 3D 12장면 밖의 추가 제안)
 * 방향: 산지(13:17)를 화면의 북쪽(-Z) 멀리에 두었다. 모세와 아론, 회중은 가운데. 회막은 북서쪽 멀리, 진의 장막들이 그 사면을 둘러 있다(민 2:2, 2:17). 아이들은 동쪽 가장자리(+X)에서만 다닌다.
 * 본문에 맞춘 점 (content/ot/OT-15.json design3d)
 *  - 모세가 바란 광야에서 열두 사람을 보낸다(13:3). 그들은 북쪽 산지 쪽으로 올라가(13:17, 13:21) 보이지 않게 되고, 사십 일 뒤 돌아온다(13:25-26).
 *    에스골 골짜기와 헤브론은 먼 가나안 땅이므로 만들지 않는다(글로만). 아이들은 가데스에서 돌아오는 모습만 본다.
 *  - 포도 한 송이가 달린 가지를 두 사람이 막대기에 꿰어 멘다(13:23). 포도송이는 사람보다 작다. 석류와 무화과(13:23)는 두 사람이 한 손에 든 작은 열매로만(신 1:25).
 *  - 돌아와 모세와 아론과 온 회중에게 보고하고 열매를 보인다(13:26). 갈렙이 모세 앞에서 말한다(13:30).
 *  - 밤새 운 일(14:1)은 밤으로 바뀐 하늘과 글로만. 우는 소리와 원망하는 소리는 만들지 않는다.
 *  - 모세와 아론이 온 회중 앞에 엎드린다(14:5). 여호수아와 갈렙이 회중에게 말한다(14:6-9. 옷을 찢은 모습은 멀리서라 그리지 않는다).
 *    돌은 그리지 않는다(14:10은 치려 했다고만 한다). 회막 위에는 구름이 덮여 있고 밤에는 불 모양처럼 은은히 빛난다(민 9:15-16, 10:12, 14:14).
 *    영광이 회막에서 나타난 일(14:10)은 회중이 회막 쪽을 바라보는 모습과 자막으로만. 본문에 없는 빛줄기를 지어 그리지 않는다.
 *  - 14:36-38은 글로만. 마지막 대목에는 여호수아와 갈렙만 모세 곁에 서 있다(다른 열 사람은 보이지 않는다). 죽는 모습은 없다.
 * 감수가 필요한 설정: 진과 회막의 자리와 생김새(회막은 출 26-27장의 뜰 휘장과 장막을 따라 단순하게), 북쪽 산의 모양, 사람 수, 모세·아론·여호수아·갈렙의 생김새와 선 자리,
 *   산지를 북쪽에 둔 것, 회막 위 구름의 생김새, 14:5-10을 아침 빛으로 둔 것(본문에 때가 없다), 엎드린 방향(회중 쪽), 포도송이의 크기(약 0.5m),
 *   마지막 대목에서 열 사람을 보이지 않게 한 것, 엎드린 모습을 멀리서 보여 주는 것.
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  BO3D.scene3d = BO3D.scene3d || {};
  BO3D.scene3d['OT-15'] = function (api) {
    var T = THREE, M2 = BO3D.models2 || {}, MO = BO3D.models || {}, PR = BO3D.props, PA = BO3D.props3da || {}, FX = api.FX, R = PR.rng(1513);
    function sm(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
    function hash(ix, iz) { var n = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453; return n - Math.floor(n); }
    function noise(x, z) {
      var ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
      var a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    var MOS = [10, 2], AAR = [10, 5.5], TAB = [-62, -30], CAMP = TAB, CAMP_R = 70, NORTH = -100;
    /* 땅: 광야. 북쪽으로 갈수록 조금씩 높아지고(산지로 올라가는 길, 13:17) 멀리 산이 선다 */
    function height(x, z) {
      var h = 0.5 * noise(x * 0.05 + 2, z * 0.05 + 5) + 0.25 * Math.sin(x * 0.04) * Math.cos(z * 0.035);
      h += sm(-45, -110, z) * 7 + sm(-130, -250, z) * (26 + 30 * noise(x * 0.018 + 7, z * 0.018));
      h += sm(150, 270, Math.hypot(x, z)) * 10 * noise(x * 0.02, z * 0.02 + 3);
      return h;
    }
    function walkable(x, z) { return x >= 26 && x <= 62 && z >= -30 && z <= 26; }

    var scene = new T.Scene();
    scene.background = new T.Color('#F1DCB2'); scene.fog = new T.Fog('#EED8AE', 80, 360);
    var skyG = new T.SphereGeometry(600, 24, 14), sp = skyG.attributes.position, sc = new Float32Array(sp.count * 3), cc = new T.Color(), top = new T.Color('#6FA6CC'), hor = new T.Color('#F6E3BC'), i;
    for (i = 0; i < sp.count; i++) { var tt = Math.max(0, sp.getY(i) / 600); cc.copy(hor).lerp(top, sm(0.02, 0.7, tt)); sc[i * 3] = cc.r; sc[i * 3 + 1] = cc.g; sc[i * 3 + 2] = cc.b; }
    skyG.setAttribute('color', new T.BufferAttribute(sc, 3));
    var skyM = new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false }); scene.add(new T.Mesh(skyG, skyM));
    var g = new T.PlaneGeometry(600, 600, 170, 170); g.rotateX(-Math.PI / 2);
    var pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color(), s1 = new T.Color('#E2BC7C'), s2 = new T.Color('#D3AA6C'), hl = new T.Color('#A98E7E'), gr = new T.Color('#9AA06A'), rd = new T.Color('#EACB92');
    for (i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i), y = height(x, z); pos.setY(i, y);
      c.copy(s1).lerp(s2, noise(x * 0.08, z * 0.08));
      c.lerp(rd, sm(4, 1.5, Math.abs(x - 16)) * sm(-2, -12, z) * 0.6);          /* 북쪽으로 난 길 */
      if (y > 9) c.lerp(hl, sm(9, 30, y)); if (z < -150) c.lerp(gr, sm(-150, -230, z) * 0.45 * noise(x * 0.05, z * 0.05));   /* 먼 산지의 푸른 기운 */
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals();
    var ground = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 })); ground.receiveShadow = true; scene.add(ground);
    var hemi = new T.HemisphereLight('#D9EEF2', '#B98A55', 0.62); scene.add(hemi);
    var sun = new T.DirectionalLight('#FFE9C4', 0.72); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    var ss = sun.shadow.camera; ss.left = -26; ss.right = 26; ss.top = 26; ss.bottom = -26; ss.near = 1; ss.far = 150; sun.shadow.bias = -0.0015;
    scene.add(sun); scene.add(sun.target);
    function put(o, x, z, lift) { o.position.set(x, height(x, z) + (lift || 0), z); scene.add(o); return o; }
    function std(cl, o) { var m = new T.MeshStandardMaterial({ color: cl, flatShading: true, roughness: 0.95 }); if (o) for (var k in o) m[k] = o[k]; return m; }
    function near(x, z, p, r) { return Math.hypot(x - p[0], z - p[1]) < r; }
    var statics = [];
    if (MO.rock) for (i = 0; i < 44; i++) { var ro = MO.rock(1500 + i); ro.scale.multiplyScalar(0.5 + R() * 1.3); var rx = -160 + R() * 320, rz = -170 + R() * 330; if (near(rx, rz, CAMP, CAMP_R + 8) || near(rx, rz, [4, 6], 26) || (Math.abs(rx - 16) < 6 && rz < 0)) continue; put(ro, rx, rz, -0.1); }
    if (MO.shrub) for (i = 0; i < 30; i++) { var sh = MO.shrub(150 + i), hx = -160 + R() * 320, hz = -170 + R() * 330; if (near(hx, hz, CAMP, CAMP_R + 8) || near(hx, hz, [4, 6], 26) || (Math.abs(hx - 16) < 6 && hz < 0)) continue; put(sh, hx, hz, -0.05); }

    /* 진의 장막들(민 12:16): 회막을 사면으로 둘러 친다(민 2:2, 2:17). 회중이 모인 곳과 길은 비워 둔다 */
    for (i = 0; i < 90; i++) { var a = R() * 6.28, rr = 38 + Math.sqrt(R()) * (CAMP_R - 38), tx = TAB[0] + Math.cos(a) * rr * 1.15, tz = TAB[1] + Math.sin(a) * rr; if (near(tx, tz, [-4, 9], 24) || tx > 4) continue; var tn = PR.tent(i + 150); tn.position.set(tx, height(tx, tz), tz); tn.rotation.y = R() * 6.28; statics.push(tn); }
    /* 회막(14:10): 멀리, 단순한 꼴. 뜰의 흰 휘장(출 27:9-18)과 그 안의 장막(출 26장). 안은 보이지 않는다 */
    var tab = PA.tabernacle ? PA.tabernacle() : new T.Group(); tab.position.set(TAB[0], height(TAB[0], TAB[1]), TAB[1]); statics.push(tab);
    scene.add(PR.mergeStatic(statics));
    /* 회막 위의 구름(민 9:15-16, 10:12, 14:14): 낮에는 구름이 덮고 밤에는 불 모양이 있었다. 둥근 구름 덩이만, 얼굴·사람 모양 없음 */
    var cloud = PR.cloudPillar ? PR.cloudPillar(20) : null;
    if (cloud) { cloud.group.scale.set(1.5, 1, 0.9); cloud.group.position.set(TAB[0] - 11, height(TAB[0], TAB[1]) + 5.5, TAB[1]); scene.add(cloud.group); }

    /* 온 회중(13:26, 14:1): 모세와 아론의 서쪽·남쪽에 멀리서 선 모습으로만 */
    var crowd = [];
    for (i = 0; i < 44; i++) {
      var o = null; try { if (M2.israelite) o = M2.israelite(i * 17 + 5); } catch (e) { o = null; }
      if (!o) o = PR.soldier(i, '#7A6A4A', null);
      var cx = -17 + hash(i, 1) * 22, cz = -1 + hash(i, 2) * 24; if (cx > 3 && cz < 9) cx -= 9;     /* 모세와 아론 둘레는 비워 둔다 */
      put(o.group, cx, cz); o.group.rotation.order = 'YXZ'; crowd.push(o);
      o.group.traverse(function (m) { if (m.isMesh) m.castShadow = false; });   /* 그리기 호출을 줄이려고 멀리 선 회중은 그림자를 그리지 않는다(OT-21과 같은 방법) */
    }
    /* 모세와 아론(Blender) */
    var moses = { group: api.fallback('#9C5438', 1.75, 0.27), update: function () {} }, aaron = { group: api.fallback('#5A6A86', 1.75, 0.27), update: function () {} };
    put(moses.group, MOS[0], MOS[1]); put(aaron.group, AAR[0], AAR[1]);
    function swap(holder, nm) { nm.group.position.copy(holder.group.position); nm.group.rotation.copy(holder.group.rotation); nm.group.rotation.order = 'YXZ'; scene.remove(holder.group); scene.add(nm.group); return nm; }
    moses.group.rotation.order = aaron.group.rotation.order = 'YXZ';
    api.person('moses', function (nm) { moses = swap(moses, nm); });
    api.person('aaron', function (nm) { aaron = swap(aaron, nm); });

    /* 열두 사람(13:4-15). 10·11번이 여호수아와 갈렙(Blender), 0·1번이 막대기를 멘다 */
    var spies = [], SP_HOME = [14, -7];
    for (i = 0; i < 12; i++) {
      var so = null;
      if (i < 10) { try { if (M2.israelite) so = M2.israelite(i * 29 + 3, { kind: 'man', carry: 'none' }); } catch (e2) { so = null; } if (!so) so = PR.soldier(i + 50, '#6E5A44', null); }
      else so = { group: api.fallback(i === 10 ? '#4E6A4A' : '#7A4A3A', 1.75, 0.27), update: function () {} };
      var colN = i % 2, rowN = Math.floor(i / 2), s = { o: so, col: colN, row: rowN, home: [SP_HOME[0] + (colN ? 1.1 : -1.1) + (rowN % 2) * 0.3, SP_HOME[1] - rowN * 1.5], to: null, hid: false };
      if (i < 2) s.home = [SP_HOME[0] + 3.4, SP_HOME[1] - 1 - i * 1.9];     /* 막대기를 멘 두 사람은 한 줄로 */
      s.to = s.home.slice(); put(so.group, s.home[0], s.home[1]); so.group.rotation.order = 'YXZ'; spies.push(s);
    }
    api.person('joshua', function (nm) { spies[10].o = swap(spies[10].o, nm); });
    api.person('caleb', function (nm) { spies[11].o = swap(spies[11].o, nm); });
    /* 막대기에 꿴 포도송이(13:23)와 보고할 때 보인 열매(13:26) */
    var pole = PA.grapePole ? PA.grapePole() : new T.Group(); pole.visible = false; scene.add(pole);
    var fruit = new T.Group();   /* 2·3번 사람이 한 손에 든 석류와 무화과 */
    if (PA.handFruit) [['pomegranate', 2], ['fig', 3]].forEach(function (q) { var hf = PA.handFruit(q[0]); hf.position.set(-0.3, 0.82, 0.06); spies[q[1]].o.group.add(hf); fruit.add(new T.Object3D()); spies[q[1]].fruit = hf; hf.visible = false; });
    function showFruit(v) { fruit.visible = v; spies.forEach(function (s) { if (s.fruit) s.fruit.visible = v; }); }

    var phase = 'idle', tod = 0, todWant = 0, faceTab = false, stoneT = -1, ca = new T.Color(), cb = new T.Color();
    var TOD = [['#F1DCB2', '#FFFFFF', 0.62, 0.72, '#FFE9C4'], ['#EADCC4', '#F2EADA', 0.58, 0.6, '#FFF0D8'], ['#1C2740', '#3A4A72', 0.3, 0.12, '#9FB4E0']];   /* 0 낮, 1 아침, 2 밤 */
    function applyTod() {
      var k = Math.min(1.999, Math.max(0, tod)), A = TOD[Math.floor(k)], B = TOD[Math.floor(k) + 1], t = k - Math.floor(k);
      ca.set(A[0]); cb.set(B[0]); ca.lerp(cb, t); scene.background.copy(ca); scene.fog.color.copy(ca);
      ca.set(A[1]); cb.set(B[1]); skyM.color.copy(ca.lerp(cb, t)); hemi.intensity = A[2] + (B[2] - A[2]) * t; sun.intensity = A[3] + (B[3] - A[3]) * t; ca.set(A[4]); cb.set(B[4]); sun.color.copy(ca.lerp(cb, t));
    }
    function stand(o, p, ry) { o.group.position.set(p[0], height(p[0], p[1]), p[1]); o.group.rotation.set(0, ry, 0); }
    function lie(o, p, ry) { o.group.position.set(p[0], height(p[0], p[1]) + 0.22, p[1]); o.group.rotation.set(1.45, ry, 0); }     /* 엎드림(14:5) */
    function faceTo(o, p) { o.group.rotation.y = Math.atan2(p[0] - o.group.position.x, p[1] - o.group.position.z); }
    function spyAt(s, p) { s.o.group.position.set(p[0], height(p[0], p[1]), p[1]); s.to = p.slice(); }
    /* 대목마다 모든 상태를 처음부터 정한다('이전'으로 돌아와도 뒤 대목의 것이 남지 않게) */
    function setPhase(p, keepTime) {
      phase = p; faceTab = false; stoneT = -1; pole.visible = false; showFruit(false);
      stand(moses, MOS, Math.PI); stand(aaron, AAR, Math.PI);
      spies.forEach(function (s) { s.hid = false; s.o.group.visible = true; spyAt(s, s.home); s.o.group.rotation.set(0, 0, 0); });
      if (!keepTime) { todWant = 0; if (p === 'idle' || p === 'send' || p === 'return') { tod = 0; applyTod(); } }
      if (p === 'send') spies.forEach(function (s) { s.to = [16 + (s.col ? 1 : -1), NORTH - 6 - s.row * 1.6]; });                          /* 13:17, 13:21: 북쪽 산지 쪽으로 올라간다 */
      if (p === 'return') { spies.forEach(function (s, k) { spyAt(s, [16 + (k < 2 ? 0 : s.col ? 1.3 : -1.3), NORTH + (k < 2 ? k * 1.9 : 3 + s.row * 1.6)]); s.to = s.home.slice(); }); pole.visible = true; showFruit(true); }   /* 13:25-26 */
      if (p === 'report' || p === 'caleb') { pole.visible = true; showFruit(true); }                                                 /* 13:26-27 */
      if (p === 'caleb') { spyAt(spies[11], [11.5, -2.2]); faceTo(spies[11].o, [-6, 10]); }                                               /* 13:30: 모세 앞에서 백성에게 */
      if (p === 'night') { todWant = 2; }                                                                           /* 14:1 */
      if (p === 'stone' || p === 'tab') {
        todWant = 1; spyAt(spies[10], [7, 7.6]); spyAt(spies[11], [8.3, 9.8]); faceTo(spies[10].o, [-6, 10]); faceTo(spies[11].o, [-6, 10]);   /* 14:6-9: 온 회중에게 말한다 */
        if (p === 'stone') { lie(moses, MOS, -0.93); lie(aaron, AAR, -0.93); stoneT = 0; } else faceTab = true;                             /* 14:5 */
      }
      if (p === 'wild') { todWant = 0; spies.forEach(function (s, k) { if (k < 10) { s.hid = true; s.o.group.visible = false; } }); spyAt(spies[10], [12.6, 0.6]); spyAt(spies[11], [13, 3.4]); stand(moses, MOS, 1.2); stand(aaron, AAR, 1.2); }   /* 14:38 */
    }
    function v3(x, y, z) { return new T.Vector3(x, y, z); }
    /* 지켜보기 카메라: 틀이 지켜보기 동안 화면을 위로 20% 올려 주므로(글 상자 자리), 볼 것(t)을 거의 그대로 겨눈다 */
    function cam(p, up, t) {
      var py = height(p[0], p[1]) + up, d = Math.hypot(t[0] - p[0], t[2] - p[1]), el = Math.atan2(t[1] + height(t[0], t[2]) - py, d) - 0.04;
      return { pos: [p[0], py, p[1]], look: [t[0], py + d * Math.tan(el), t[2]] };
    }
    if (FX) FX.sortLayers(scene);
    var PH = ['send', 'return', 'report', 'caleb', 'night', 'stone', 'tab', 'wild'];

    return {
      id: 'OT-15', scene: scene, sun: sun, sunOff: [-32, 50, 28],
      height: height, walkable: walkable,
      edge: function (x, z) {
        if (x < 26) return { who: 'onwoo', text: '회중 안쪽으로는 들어가지 말자. 우리는 가장자리에서 지켜보는 사람이야.' };
        if (z < -30) return { who: 'hyu', text: '저 길은 그 사람들이 산지로 올라간 길이야. 우리는 여기까지만 가자.' };
        return { who: 'hyu', text: '회중에서 너무 멀리 가지는 말자.' };
      },
      P: { start: [50, -6], machine: [57, -12], machineRot: -1.2,
        /* 재료가 놓인 곳(quests[i].found): 회중에서 멀리 떨어진 광야 쪽 / 산지로 올라가는 길 쪽 / 회중에서 떨어진 가장자리의 빈 땅 */
        parts: [[58, 16], [30, -25], [32, 12]], lookSpot: [32, 12],
        look: { focus: MOS, mid: [14, -4], dy: 1.4, backE: 7, upE: 3.2 } },
      /* 지켜보기의 카메라: 아이들이 선 동쪽에서 본다 */
      eventCam: function (i) {
        if (i === 2) return cam([27, -19], 3.6, [14.2, 1.2, -5.5]);   /* 열두 사람과 포도송이 너머로 모세·아론·회중 */
        if (i === 3) return cam([21, -10], 3, [10.6, 1.3, 0]);
        if (i === 4) return cam([28, 26], 7, [-8, 1, 6]);
        if (i === 5) return stoneT > 7 ? cam([30, 12], 8, [TAB[0], 3, TAB[1]]) : cam([20, -10], 3.8, [9, 0.8, 5]);   /* 엎드린 두 사람은 옆에서 멀찍이 */
        if (i === 6) return cam([24, 8], 9, [TAB[0], 3, TAB[1]]);
        if (i === 7) return cam([31, -5], 4.2, [11.5, 1.3, 2.6]);
        return null;
      },
      detector: '탐지기', askLabel: '탐지기 물음 풀기',
      intro: { text: '타임머신이 넓은 광야에 내려앉았어요. 사람들이 많이 모여 있고, 저 멀리 산들이 보여요.', say: { who: 'hyu', text: '사람들이 모인 곳 가장자리에서만 다니자.' } },
      lookText: '열두 사람 이야기를 성경에서 찾아 읽은 뒤 다시 골라 보세요.',
      partBeats: [0, 1], eventStart: 2,
      beatNote: function (i) { return i === 1 ? '사십 일이 지난 뒤예요(13:25). 에스골 골짜기와 헤브론은 여기서 먼 가나안 땅이라, 우리는 가데스에서 돌아오는 사람들을 봐요.' : null; },
      sceneDoneText: '열두 사람 이야기를 끝까지 지켜봐야 떠날 수 있어요.',
      dex: [
        { id: 'moses', name: '모세와 아론', desc: '땅을 살피고 온 사람들이 돌아와 보고한 두 사람', ref: '민 13:26', hint: '회중 앞에 서 있어요.', range: 45, crop: 0.4, pos: function () { return v3(MOS[0], height(MOS[0], MOS[1]) + 1.1, MOS[1] + 1.7); } },
        { id: 'hills', name: '멀리 보이는 산지', desc: '모세는 그 사람들에게 산지로 올라가서 그 땅을 살펴보라고 했다', ref: '민 13:17', hint: '길이 뻗은 쪽 멀리 산들을 담아 보세요.', range: 600, crop: 0.8, pos: function () { return v3(16, 30, -230); } },
        { id: 'grapes', name: '막대기에 꿴 포도송이', desc: '에스골 골짜기에서 벤, 포도 한 송이가 달린 가지. 두 사람이 막대기에 꿰어 메었다', ref: '민 13:23', hint: '사람들이 돌아온 뒤에 찾아보세요.', range: 45, crop: 0.3,
          visible: function () { return pole.visible; }, pos: function () { return pole.position.clone(); } },
        { id: 'camp', name: '이스라엘의 진', desc: '백성은 하세롯을 떠나 바란 광야에 진을 쳤다', ref: '민 12:16', hint: '장막들을 담아 보세요.', range: 160, pos: function () { return v3(TAB[0] + 30, 1.5, TAB[1] + 44); } },
        { id: 'tab', name: '회막', desc: '여호와의 영광이 회막에서 이스라엘 모든 자손에게 나타났다', ref: '민 14:10', hint: '장막들 가운데 흰 휘장을 두른 곳이에요.', range: 160, crop: 0.5, pos: function () { return v3(TAB[0], height(TAB[0], TAB[1]) + 2.5, TAB[1]); } }
      ],
      reset: function () { setPhase('idle'); },
      partFound: function (i) { if (i === 0) setPhase('send'); if (i === 1) setPhase('return'); },
      partContinue: function () {},
      lookupPose: function () {},
      /* 대목 번호(OT-15.json): 0 = 13:1-20, 1 = 13:21-25, 2 = 13:26-29, 3 = 13:30-33, 4 = 14:1-4, 5 = 14:5-10, 6 = 14:11-25, 7 = 14:26-38 */
      beatPose: function (i) { setPhase(PH[i] || 'idle', i >= 2); },
      update: function (dt, now) {
        if (Math.abs(tod - todWant) > 0.003) { tod += (todWant - tod) * Math.min(1, dt * 1.3); applyTod(); }
        if (stoneT >= 0) { stoneT += dt; if (stoneT > 6) faceTab = true; }                                          /* 14:10: 회막 쪽을 본다 */
        spies.forEach(function (s, k) {
          if (s.hid) return;
          var p = s.o.group.position, dx = s.to[0] - p.x, dz = s.to[1] - p.z, d = Math.hypot(dx, dz), mv = d > 0.25;
          if (mv) { var st = Math.min(d, 2.7 * dt); p.x += dx / d * st; p.z += dz / d * st; s.o.group.rotation.y = Math.atan2(dx, dz); p.y = height(p.x, p.z); }
          else if (phase === 'idle' || phase === 'report' || phase === 'return' || phase === 'night') faceTo(s.o, MOS);
          s.o.group.visible = !(phase === 'send' && p.z < NORTH);                                                     /* 올라간 뒤에는 보이지 않는다 */
          if (s.o.update) s.o.update(dt, mv ? 1.1 : 0, now);
        });
        if (pole.visible) {   /* 막대기는 두 사람의 어깨 사이에 */
          var a0 = spies[0].o.group.position, b0 = spies[1].o.group.position;
          pole.position.set((a0.x + b0.x) / 2 + 0.2, (a0.y + b0.y) / 2 + 1.42, (a0.z + b0.z) / 2); pole.rotation.y = Math.atan2(b0.x - a0.x, b0.z - a0.z);
          if (phase !== 'return' || Math.hypot(spies[0].to[0] - a0.x, spies[0].to[1] - a0.z) < 0.3) { spies[0].o.group.rotation.y = pole.rotation.y; spies[1].o.group.rotation.y = pole.rotation.y; }
        }
        crowd.forEach(function (o) { faceTo(o, faceTab ? TAB : [11, -3]); if (o.update) o.update(dt, 0, now); });
        if (cloud) { cloud.setNight(sm(1.2, 2, tod)); cloud.update(now); }
        if (moses.update) moses.update(dt, false); if (aaron.update) aaron.update(dt, false);
      },
      audio: function (A) { A.setFlock(999); A.setFire(999); },
      menuCam: function (camera, now) { var a2 = now * 0.05; camera.position.set(44 + Math.sin(a2) * 8, 8, -4); camera.lookAt(MOS[0], 1, MOS[1]); },
      debug: { phase: function () { return { phase: phase, tod: tod, pole: pole.visible, faceTab: faceTab, spy0: [spies[0].o.group.position.x, spies[0].o.group.position.z] }; }, arrived: function () { return phase !== 'idle'; } }
    };
  };
})();
