// 성장 시스템(탐험대 장비) 시험 도우미 — docs/14 보완 2차의 T4·T13·T14·T20·T23·T24.
// seed: 페이지가 열리기 전에 진행 자료(bo3d.ot.v1)에 마친 장면 n개를 넣는다(시험에서만. 형식은 게임이 쓰는 그대로 { t }).
// install: 3D 손목 빛을 그리는 매 화면 뒤에 표본을 떠서, 빛이 보이면 안 되는 때 보였는지 센다. 새 장비 카드가 언제 나왔는지 적는다.
const IDS = Array.from({ length: 40 }, (_, i) => 'OT-' + String(i + 1).padStart(2, '0'));
const AT = [[1, 1], [4, 2], [8, 3]];   /* growth.js의 구현된 단계(장면 수 → 단계) */
const stageAt = (n) => AT.reduce((s, x) => (n >= x[0] ? x[1] : s), 0);

async function seed(p, n, opt) {
  opt = opt || {};
  const done = {}; IDS.filter((id) => !(opt.exclude || []).includes(id)).slice(0, n).forEach((id) => { done[id] = { t: opt.tier || 't2' }; });
  const gear = opt.gear === null ? null : Object.assign({ seen: stageAt(n), tiers: {} }, opt.gear || {});
  await p.addInitScript(([done, gear]) => {
    try {
      if (sessionStorage.getItem('gr-seeded')) return;   /* 새로고침 때는 다시 넣지 않는다 */
      sessionStorage.setItem('gr-seeded', '1');
      localStorage.setItem('bo3d.ot.v1', JSON.stringify({ done, mats: {}, notes: {} }));
      if (gear) localStorage.setItem('bo3d.gear.v1', JSON.stringify(gear)); else localStorage.removeItem('bo3d.gear.v1');
    } catch (e) { /* 시험 준비 실패는 아래 검사에서 드러난다 */ }
  }, [done, gear]);
}

async function install(p) {
  await p.evaluate(() => {
    if (window.__gr) return;
    const G = window.__gr = { frames: 0, vis: 0, maxOp: 0, maxOpDim: 0, bad: [], cards: [], dex: 0, figs: 0 };
    const states = { explore: 1, free: 1 };
    const tick = () => {
      requestAnimationFrame(tick);   /* 게임의 화면 갱신 뒤에 돈다(먼저 등록된 쪽이 먼저) */
      const a = window.BO3D && BO3D.debug && BO3D.debug.aura ? BO3D.debug.aura() : null;
      if (!a || a.paused) return;
      G.frames++;
      if (BO3D.debug.dexDet && BO3D.debug.dexDet()) G.dex++;
      if (!a.visible) return;
      G.vis++; G.maxOp = Math.max(G.maxOp, a.op); if (a.sa === 'dim') G.maxOpDim = Math.max(G.maxOpDim, a.op);
      const why = [];
      if (!states[a.state]) why.push('state ' + a.state);
      if (a.overlay) why.push('overlay');
      if (a.gear < 3) why.push('gear ' + a.gear);
      if (a.sa === 'off' || a.id === 'OT-09' && a.cur !== 'jordan') why.push('scene off');
      if (typeof a.near === 'number' && a.near < 6) why.push('near ' + a.near.toFixed(1));
      if (a.p && (a.quiet || []).some((z) => Math.hypot(a.p[0] - z[0], a.p[1] - z[1]) < z[2])) why.push('quiet');
      if (a.sa === 'dim' && a.op > 0.33) why.push('dim op ' + a.op.toFixed(2));
      if (document.hidden) why.push('hidden');
      if (why.length && G.bad.length < 20) G.bad.push(why.join(',') + ' @' + (a.p || []).map((v) => v.toFixed(1)).join(','));
    };
    requestAnimationFrame(tick);
    new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((nd) => {
      if (nd.nodeType !== 1) return;
      const cs = nd.matches && nd.matches('.gearnew') ? [nd] : [...nd.querySelectorAll('.gearnew')];
      cs.forEach((c) => G.cards.push({ text: c.querySelector('h3') ? c.innerText.replace(/\s+/g, ' ').slice(0, 80) : '', state: BO3D.debug && BO3D.debug.state ? BO3D.debug.state().state : '?' }));
    }))).observe(document.body, { childList: true, subtree: true });
  });
}
async function report(p) { return p.evaluate(() => Object.assign({}, window.__gr, { figs: BO3D.debug.figures ? BO3D.debug.figures().length : 0 })); }

module.exports = { IDS, stageAt, seed, install, report };
