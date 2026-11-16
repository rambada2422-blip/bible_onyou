// 지금 이야기 화면(.ot3)의 물음(관문·재료 찾기 물음)을 푼다. wrongFirst면 맞지 않는 보기를 먼저 눌러 안내가 나오는지 본다.
// walkOT.js와 walkPlay.js가 함께 쓴다. 돌려주는 값: { type, ok, good, look }
module.exports = async function solve(p, wrongFirst) {
  return p.evaluate(async ({ wrongFirst }) => {
      const q = BO3D.story.debug.q(), sheet = document.querySelector('.ot3 .sheet-body');
      const wait = () => new Promise((res) => setTimeout(res, 30));
      const opts = () => [...sheet.querySelectorAll('.opt')];
      const pick = async (label) => { const o = opts().find((x) => x.textContent.trim().endsWith(label.trim())); if (!o) return false; o.click(); await wait(); return true; };
      let look = null;
      const choice = async (cq) => {
        if (wrongFirst) { const w = cq.options.find((o) => !o.ok); await pick(w.label); look = !!sheet.querySelector('.note.look, .note.detour'); }
        return pick(cq.options.find((o) => o.ok).label);
      };
      let ok = false;
      if (q.type === 'choice') ok = await choice(q);
      else if (q.type === 'find') { const rb = [...sheet.querySelectorAll('.btn')].find((x) => x.textContent === '찾아서 읽었어요'); rb.click(); await wait(); ok = await choice(q.confirm); }
      else if (q.type === 'multi') {   /* 여러 개 고르기(13.8): 틀린 것 하나를 섞어 확인을 눌러 안내를 본 뒤, 맞는 것만 */
        const rb = [...sheet.querySelectorAll('.btn')].find((x) => x.textContent === '찾아서 읽었어요'); rb.click(); await wait();
        const btn = () => [...sheet.querySelectorAll('.btn')].find((x) => x.textContent === '다 골랐어요');
        const o = q.confirm.options, setTo = async (want) => { for (const it of o) { const el = opts().find((x) => x.textContent.trim().endsWith(it.label.trim())); if (el && (el.getAttribute('aria-pressed') === 'true') !== want(it)) { el.click(); await wait(); } } };
        if (wrongFirst) { await setTo((it) => it === o.find((x) => !x.ok)); btn().click(); await wait(); look = !!sheet.querySelector('.note.look, .note.detour'); }
        await setTo((it) => !!it.ok); btn().click(); await wait(); ok = true;
      } else if (q.type === 'match') {   /* 잇기(13.8): 구절을 누르고 맞는 내용을 누른다 */
        const L = () => [...sheet.querySelectorAll('.match3 .mref')], Rt = () => [...sheet.querySelectorAll('.match3 .mtext')];
        if (wrongFirst && q.pairs.length > 1) { L().find((x) => x.textContent.trim().endsWith(q.pairs[0].ref)).click(); await wait(); Rt().find((x) => x.textContent.trim() === q.pairs[1].text.trim()).click(); await wait(); look = !!sheet.querySelector('.note.look'); }
        for (const pr of q.pairs) { L().find((x) => x.textContent.trim().endsWith(pr.ref)).click(); await wait(); Rt().find((x) => x.textContent.trim() === pr.text.trim()).click(); await wait(); }
        ok = true;
      } else if (q.type === 'order') {
        if (wrongFirst) { for (const it of [...q.items].reverse()) await pick(it); look = !!sheet.querySelector('.note.look, .note.detour'); }
        for (const it of q.items) ok = await pick(it);
      } else if (q.type === 'findref') {
        const ins = sheet.querySelectorAll('.refin input'), btn = sheet.querySelector('.refin .btn');
        if (wrongFirst) { ins[0].value = '99'; ins[1].value = '99'; btn.click(); await wait(); look = !!sheet.querySelector('.note.look, .note.detour'); }
        const cv = q.accept[0].split(':'); ins[0].value = cv[0]; ins[1].value = cv[1]; btn.click(); await wait(); ok = true;
      }
      return { type: q.type, ok, good: !!sheet.querySelector('.note.good'), look };
  }, { wrongFirst });
};
