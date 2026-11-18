// 현장 돕기 한 단계를 끝낸다(규칙서 13.6). 이야기 화면(.ot3)에서 돕기 버튼을 모두 누르고, 기다리기를 누르고, 뜻 묻기의 성경 물음을 푼다.
// walkOT.js(이야기 카드)와 walk3dScene.js(3D의 이야기 조각)가 함께 쓴다. 지금 단계가 돕기가 아니면 null.
module.exports = async function doHelp(p) {
  return p.evaluate(async () => {
    const h = BO3D.story.debug.help(); if (!h) return null;
    const sh = document.querySelector('.ot3 .sheet-body'), wait = () => new Promise((r) => setTimeout(r, 40));
    /* 겹친 그림 무대(stage2d.js)가 맡은 돕기는 무대에서 마친다 */
    if (BO3D.stage2d && BO3D.stage2d.debug.state() && BO3D.stage2d.has(BO3D.story.debug.state().id) && BO3D.stage2d.debug.finish()) await wait();
    if (h.kind === 'do') for (const b of [...sh.querySelectorAll('.help-task')]) { b.click(); await wait(); }
    if (h.kind === 'stay') { const b = [...sh.querySelectorAll('.btn')].find((x) => x.textContent === h.wait); if (b) b.click(); await wait(); }
    if (h.kind === 'ask') {
      const q = BO3D.story.debug.q();
      const rb = [...sh.querySelectorAll('.btn')].find((x) => x.textContent === '찾아서 읽었어요'); if (rb) { rb.click(); await wait(); }
      const ok = q.confirm.options.find((o) => o.ok).label, o = [...sh.querySelectorAll('.opt')].find((x) => x.textContent.trim().endsWith(ok.trim()));
      if (o) o.click(); await wait();
    }
    await wait();
    const nb = [...document.querySelectorAll('.ot3 .sheet-foot .btn')].pop();
    return { kind: h.kind, title: h.title, enabled: !!nb && !nb.disabled, good: h.kind !== 'ask' || !!sh.querySelector('.note.good'), said: h.kind !== 'do' || !!sh.querySelector('.help-got .say') };
  });
};
