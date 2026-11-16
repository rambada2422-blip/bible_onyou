// 처음 화면에서 고른 장면의 3D까지 들어가는 공용 단계 (walk3d.js, walkJ.js가 쓴다)
// 처음 화면 → 탐험 시작 → (비상 착륙 이야기) → 시대 지도 → 장면 → "걸어서 탐험 (3D)"
module.exports = async function enter3d(p, ti, id) {
  await p.click('.tier >> nth=' + ti);
  await p.click('text=탐험 시작'); await p.waitForTimeout(400);
  const st = () => p.evaluate(() => (BO3D.story ? BO3D.story.debug.state().screen : 'none'));
  if ((await st()) === 'none') return; // 구약 흐름이 없는 옛 판
  for (let i = 0; i < 8 && (await st()) === 'intro'; i++) { await p.click('.ot3 .sheet-foot .btn >> nth=-1'); await p.waitForTimeout(150); }
  await p.evaluate(() => { BO3D.story.debug.unlockAll(); BO3D.story.openMap(); });   /* 시험은 시대 잠금을 풀고 들어간다 */
  await p.waitForTimeout(200);
  await p.click('.otc[data-id="' + id + '"]'); await p.waitForTimeout(300);
  await p.click('.ot3 .sheet-foot .btn:has-text("걸어서 탐험")'); await p.waitForTimeout(1600);
};
