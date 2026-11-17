// 날아간 양털(시범 2026-11-17, den.js): 처음 양털을 얻을 때 한 번 나온다. 지금 화면에 있으면 걸린 덤불 세 곳을 눌러 끝낸다. 없으면 null.
// walkOT.js·pilot.js가 함께 쓴다.
module.exports = async function doWind(p) {
  return p.evaluate(async () => {
    const w = document.querySelector('.ot3:not([hidden]) .wind3'); if (!w || !window.BO3D || !BO3D.den) return null;
    const spots = BO3D.den.debug.windSpots(), t = [...w.querySelectorAll('.wind-t')];
    const other = t.find((x, i) => spots.indexOf(i) < 0); if (other) other.click();
    await new Promise((r) => setTimeout(r, 30));
    for (const k of spots) { t[k].click(); await new Promise((r) => setTimeout(r, 30)); }
    await new Promise((r) => setTimeout(r, 150));
    return { missed: !!other && other.classList.contains('miss'), card: !!document.querySelector('.ot3:not([hidden]) .matcard') };
  });
};
