const fs = require('fs');
let s = 4107;
function rnd() { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
const R = (a, b) => a + (b - a) * rnd();
const n = v => { const x = Math.round(v * 10) / 10; return (Object.is(x, -0) ? 0 : x) + ''; };
const I = v => Math.round(v) + '';
const o = [];
const P = (fill, d, extra = '') => `<path fill="${fill}" d="${d}"${extra ? ' ' + extra : ''}/>`;
const S = (stroke, w, d, extra = '') => `<path class="ex00-st" stroke="${stroke}" stroke-width="${w}" d="${d}"${extra ? ' ' + extra : ''}/>`;

/* ---------- figures ---------- */
const SK = '#b97c4f', SKS = '#935d38';
function fig(x, y, sc, dir, p, st) {
  const skin = st.skin || SK, skinS = st.skinS || SKS;
  const limb = (a, b, c, w, col) => S(col, w, `M${a[0]} ${a[1]}L${b[0]} ${b[1]}L${c[0]} ${c[1]}`);
  let g = `<g transform="translate(${x} ${y}) scale(${n(dir * sc)} ${n(sc)})">`;
  if (st.shadow !== false) g += `<ellipse cx="${dir * 12}" cy="2" rx="${st.shw || 24}" ry="4.5" fill="#5e3b24" opacity=".32"/>`;
  if (st.pre) g += st.pre;
  const { hip, sh, head, aN, aF, lN, lF } = p;
  // far leg, far arm
  g += limb(hip, lF[0], lF[1], 8, skinS);
  g += S(skinS, 5, `M${lF[1][0]} ${lF[1][1]}l5 0`);
  if (aF) { g += limb(sh, aF[0], aF[1], 6, skinS); g += `<circle cx="${aF[1][0]}" cy="${aF[1][1]}" r="3.4" fill="${skinS}"/>`; }
  // near leg
  g += limb(hip, lN[0], lN[1], 8.5, skin);
  g += S(skin, 5, `M${lN[1][0]} ${lN[1][1]}l5 0`);
  // torso
  g += S(st.top || skin, 17, `M${sh[0]} ${sh[1]}L${hip[0]} ${hip[1]}`);
  if (!st.top) g += S(skinS, 6, `M${sh[0] - 5} ${sh[1] + 2}L${hip[0] - 5} ${hip[1]}`, 'opacity=".55"');
  // skirt / kilt
  const kx = (lN[0][0] + lF[0][0]) / 2, ky = (lN[0][1] + lF[0][1]) / 2; const L = st.len || .72;
  const ex = hip[0] + (kx - hip[0]) * L, ey = hip[1] + (ky - hip[1]) * L;
  const px = -(ey - hip[1]), py = (ex - hip[0]); const pl = Math.hypot(px, py) || 1; const ux = px / pl, uy = py / pl;
  const w0 = 9.5, w1 = st.flare || 12.5;
  g += P(st.kilt, `M${n(hip[0] + ux * w0)} ${n(hip[1] - 5 + uy * w0)}L${n(ex + ux * w1)} ${n(ey + uy * w1)}L${n(ex - ux * w1)} ${n(ey - uy * w1)}L${n(hip[0] - ux * w0)} ${n(hip[1] - 5 - uy * w0)}Z`);
  g += P(st.kiltS, `M${n(hip[0] + ux * w0)} ${n(hip[1] - 5 + uy * w0)}L${n(ex + ux * w1)} ${n(ey + uy * w1)}L${n(ex + ux * 5)} ${n(ey + uy * 5)}L${n(hip[0] + ux * 4)} ${n(hip[1] - 5 + uy * 4)}Z`);
  if (st.belt) g += S(st.belt, 4, `M${n(hip[0] - 8)} ${n(hip[1] - 5)}L${n(hip[0] + 8)} ${n(hip[1] - 6)}`);
  if (st.mid) g += st.mid;
  // head
  const hx = head[0], hy = head[1];
  g += S(skin, 7, `M${sh[0]} ${sh[1]}L${hx} ${hy}`);
  g += `<circle cx="${hx}" cy="${hy}" r="8.6" fill="${skin}"/>`;
  if (st.beard) g += P(st.beard, `M${hx - 1} ${hy + 2}q7 2 9 -1q1 9 -5 12q-5 -2 -4 -11z`);
  if (st.wig) {
    g += P(st.wig, `M${hx + 8.5} ${hy - 4}A9.6 9.6 0 0 0 ${hx - 9.6} ${hy - 2}L${hx - 10.5} ${hy + 11}L${hx - 2} ${hy + 11}L${hx - 1} ${hy - 3}Z`);
    g += S('#e2b23c', 2, `M${hx - 9.4} ${hy - 4}L${hx + 8.6} ${hy - 5.5}`);
  } else {
    g += P(st.cap, `M${hx + 8.8} ${hy - 3}A9.4 9.4 0 0 0 ${hx - 9.2} ${hy}L${hx - 12} ${hy + 9}L${hx - 6} ${hy + 8}L${hx - 4} ${hy - 1}Z`);
    g += S(st.band || '#8a5a3a', 2, `M${hx - 8.6} ${hy - 2}L${hx + 8.8} ${hy - 4}`);
  }
  g += `<circle cx="${hx + 5.4}" cy="${hy - .5}" r="1.1" fill="#2a1c14"/>`;
  // near arm
  if (st.post0) g += st.post0;
  g += limb(sh, aN[0], aN[1], 6.5, skin);
  g += `<circle cx="${aN[1][0]}" cy="${aN[1][1]}" r="3.6" fill="${skin}"/>`;
  if (st.post) g += st.post;
  return g + '</g>';
}
// small brick stack (local units): cols x rows of 9x4 bricks
function load(x, y, cols, rows) {
  let d = '';
  for (let r = 0; r < rows; r++) d += `M${x + (r % 2 ? 2 : 0)} ${y - r * 4.6}h${cols * 9.6 - (r % 2 ? 4 : 0)}`;
  return `<path stroke="#8a5c38" stroke-width="5.4" fill="none" d="${d}"/><path stroke="#cf9d68" stroke-width="3.6" stroke-dasharray="8.4 1.2" fill="none" d="${d}"/>`;
}
const styles = [
  { top: '#efe5cc', kilt: '#efe5cc', kiltS: '#cfc2a2', cap: '#d9c7a0', beard: '#3b2a20', belt: '#8a5a3a' },
  { kilt: '#c9a262', kiltS: '#a8834a', cap: '#efe5cc', beard: '#4a372b', belt: '#7a4a30' },
  { top: '#c7a66e', kilt: '#c7a66e', kiltS: '#a78752', cap: '#a85f3f', beard: '#3b2a20', belt: '#6e4a34' },
  { kilt: '#efe5cc', kiltS: '#cfc2a2', cap: '#7d93a8', beard: '#5a4636', belt: '#8a5a3a' },
  { top: '#a9b3a6', kilt: '#a9b3a6', kiltS: '#8a9488', cap: '#efe5cc', beard: '#3b2a20', belt: '#6e4a34' },
];
const st = (k, extra) => Object.assign({}, styles[k % styles.length], extra || {});
// poses (facing right; units: standing height ~100)
const poseYoke = { hip: [0, -45], sh: [13, -69], head: [23, -77], lN: [[12, -25], [9, 0]], lF: [[-7, -23], [-21, -2]], aN: [[22, -58], [27, -70]], aF: [[2, -62], [-2, -73]] };
const poseYoke2 = { hip: [0, -45], sh: [14, -68], head: [24, -75], lN: [[-6, -23], [-18, -2]], lF: [[13, -26], [11, 0]], aN: [[23, -57], [28, -69]], aF: [[2, -62], [-2, -73]] };
const yoke = S('#6b4526', 3.4, 'M-36 -74L58 -70') + S('#7a5a3c', 1.2, 'M-33 -74L-38 -50M-33 -74L-26 -50M55 -70L48 -46M55 -70L62 -46') + load(-41, -47, 2, 3) + load(45, -43, 2, 3);
const poseBack = { hip: [0, -44], sh: [17, -64], head: [28, -69], lN: [[13, -24], [9, 0]], lF: [[-7, -22], [-20, -2]], aN: [[24, -62], [14, -76]], aF: [[20, -66], [8, -78]] };
const backLoad = `<g transform="rotate(-24 6 -76)">${load(-8, -79, 3, 4)}<path stroke="#6b4526" stroke-width="2.4" fill="none" d="M-10 -75.5h32"/></g>`;
const poseHoe = { hip: [0, -42], sh: [21, -60], head: [32, -64], lN: [[9, -20], [5, 0]], lF: [[-10, -20], [-15, 0]], aN: [[30, -46], [41, -37]], aF: [[27, -50], [35, -45]] };
const hoe = S('#6b4526', 3.4, 'M27 -52L56 -16') + P('#4a3526', 'M52 -20L60 -12L48 -2L44 -8Z');
const poseBrow = { hip: [0, -46], sh: [5, -73], head: [12, -84], lN: [[6, -23], [5, 0]], lF: [[-7, -23], [-10, 0]], aN: [[18, -70], [13, -89]], aF: [[-8, -62], [-15, -58]] };
const hoeUp = S('#6b4526', 3.4, 'M-15 -66L-17 0') + P('#4a3526', 'M-19 -2L-6 -4L-4 3L-20 4Z');
const poseMold = { hip: [0, -22], sh: [19, -43], head: [29, -48], lN: [[22, -4], [-18, -2]], lF: [[16, -5], [-12, -4]], aN: [[27, -30], [35, -14]], aF: [[24, -32], [42, -15]] };
const mold = P('#6b4526', 'M28 -12h28v9h-28z') + P('#8a5a38', 'M31 -10h10v5h-10zM43 -10h10v5h-10z');
const poseStand = { hip: [0, -48], sh: [0, -77], head: [0, -90], lN: [[5, -24], [7, 0]], lF: [[-5, -24], [-9, 0]], aN: [[12, -62], [21, -60]], aF: [[-13, -62], [-7, -50]] };
const poseField = { hip: [0, -44], sh: [20, -58], head: [30, -58], lN: [[8, -22], [5, 0]], lF: [[-8, -22], [-12, 0]], aN: [[28, -42], [34, -26]], aF: [[24, -44], [30, -30]] };

/* ---------- plants / props ---------- */
function palm(x, y, h, lean, c1, c2, tr) {
  const tx = x + lean, ty = y - h;
  let g = S(tr, n(Math.max(2, h * .075)), `M${I(x)} ${I(y)}Q${I(x + lean * .15)} ${I(y - h * .55)} ${I(tx)} ${I(ty)}`);
  const A = [-205, -170, -135, -100, -70, -40, -8, 22];
  let d1 = '', d2 = '';
  A.forEach((a, k) => {
    const r = a * Math.PI / 180, l = h * R(.34, .42);
    const ex = tx + Math.cos(r) * l, ey = ty + Math.sin(r) * l * .75 + l * .28;
    const cx = tx + Math.cos(r) * l * .55, cy = ty + Math.sin(r) * l * .6 - l * .22;
    const d = `M${I(tx)} ${I(ty)}Q${I(cx)} ${I(cy)} ${I(ex)} ${I(ey)}Q${I(cx)} ${I(cy + l * .26)} ${I(tx)} ${I(ty)}`;
    if (k % 2) d1 += d; else d2 += d;
  });
  return g + P(c1, d1) + P(c2, d2);
}
function jar(x, y, sc) {
  return `<g transform="translate(${x} ${y}) scale(${sc})"><ellipse cx="8" cy="1" rx="17" ry="4" fill="#5e3b24" opacity=".3"/><path fill="#b9683c" d="M-6 -44h12l-2 8c10 6 14 16 12 26c-2 8 -8 12 -16 12c-8 0 -14 -4 -16 -12c-2 -10 2 -20 12 -26z"/><path fill="#8f4a2a" d="M2 -36c10 6 14 16 12 26c-2 8 -8 12 -16 12c8 -4 10 -12 9 -20c-1 -8 -3 -13 -5 -18z"/><path fill="#d9905c" d="M-8 -46h16v4h-16z"/><path class="ex00-st" stroke="#e8c79a" stroke-width="2" d="M-12 -18q10 5 24 0"/></g>`;
}
function rowBricks(xs, y, cnt, w, g, h, sx, sy, ct = '#c08a56', cf = '#8a5c38') {
  let top = '', fr = '', shd = '';
  for (let k = 0; k < cnt; k++) { const x0 = xs + k * (w + g); top += `M${I(x0)} ${I(y)}l${sx} ${-sy}h${w}l${-sx} ${sy}z`; fr += `M${I(x0)} ${I(y)}h${w}v${h}h${-w}z`; shd += `M${I(x0 + w)} ${I(y + h)}l${sx + 7} ${-sy + 1}v${-h + 2}l-7 ${sy - 3}z`; }
  return P('#5e3b24', shd, 'opacity=".3"') + P(cf, fr) + P(ct, top);
}
function brickFace(x, y, cols, rows, bw, bh, base, lit) {
  let d = '', d2 = '';
  for (let r = 0; r < rows; r++) { const yy = y - r * bh - bh / 2; if (r % 2) d2 += `M${x} ${n(yy)}h${cols * bw}`; else d += `M${x} ${n(yy)}h${cols * bw}`; }
  return `<path fill="${base}" d="M${x} ${y}h${cols * bw}v${-rows * bh}h${-cols * bw}z"/><path fill="none" stroke="${lit}" stroke-width="${n(bh - 1.6)}" stroke-dasharray="${n(bw - 1.6)} 1.6" d="${d}"/><path fill="none" stroke="${lit}" stroke-width="${n(bh - 1.6)}" stroke-dasharray="${n(bw - 1.6)} 1.6" stroke-dashoffset="${n(bw / 2)}" d="${d2}"/>`;
}
function stack(x, y, cols, rows, bw, bh) { // with lit top face
  const w = cols * bw, h = rows * bh;
  return `<path fill="#5e3b24" opacity=".3" d="M${x + w} ${y}l26 -6l8 -10v${-h * .5}l-34 ${n(h * .5 + 16)}z"/>` + brickFace(x, y, cols, rows, bw, bh, '#8a5c38', '#b8834f') + P('#d7a56a', `M${x} ${y - h}l14 -9h${w}l-14 9z`) + P('#f1d29c', `M${x} ${y - h}l14 -9h${w}l-3 2h${-w + 4}z`, 'opacity=".7"');
}
function tuftD(x, y, h, k = 5) { let d = ''; for (let j = 0; j < k; j++) { const t = (j / (k - 1)) - .5; const dx = t * h * 1.1 + R(-2, 2); d += `M${I(x + t * 5)} ${I(y)}q${I(dx * .3)} ${I(-h * .6)} ${I(dx)} ${I(-h * R(.7, 1))}`; } return d; }

/* ================= SVG ================= */
o.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200" preserveAspectRatio="xMidYMid slice">`);
o.push(`<defs>
<linearGradient id="ex00-g-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3fa6b8"/><stop offset=".45" stop-color="#7AD0C8"/><stop offset=".8" stop-color="#cfeed6"/><stop offset="1" stop-color="#f6efcf"/></linearGradient>
<radialGradient id="ex00-g-sun" cx="150" cy="118" r="330" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fffbe4"/><stop offset=".16" stop-color="#fff6c8" stop-opacity=".9"/><stop offset=".5" stop-color="#fff0b4" stop-opacity=".32"/><stop offset="1" stop-color="#fff0b4" stop-opacity="0"/></radialGradient>
<linearGradient id="ex00-g-ground" x1="0" y1="520" x2="0" y2="1200" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#efd09a"/><stop offset=".4" stop-color="#e6bd80"/><stop offset="1" stop-color="#c8935a"/></linearGradient>
<linearGradient id="ex00-g-haze" x1="0" y1="330" x2="0" y2="590" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fbf1d2" stop-opacity=".5"/><stop offset="1" stop-color="#fbf1d2" stop-opacity="0"/></linearGradient>
<linearGradient id="ex00-g-nile" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5cbdc0"/><stop offset=".6" stop-color="#8fd9cf"/><stop offset="1" stop-color="#bfe9d8"/></linearGradient>
</defs>`);
o.push(`<style>
.ex00-st{fill:none;stroke-linecap:round;stroke-linejoin:round}
@media (prefers-reduced-motion: no-preference){
.ex00-sunglow{transform-box:fill-box;transform-origin:50% 50%;animation:ex00-shimmer 5s ease-in-out infinite alternate}
.ex00-water{animation:ex00-flow 7s ease-in-out infinite alternate}
.ex00-dust{animation:ex00-dustdrift 9s ease-in-out infinite alternate}
.ex00-d1{animation-duration:12s;animation-delay:-4s}
.ex00-frond{transform-box:fill-box;transform-origin:50% 60%;animation:ex00-sway 6s ease-in-out infinite alternate}
@keyframes ex00-shimmer{from{transform:scale(.96);opacity:.88}to{transform:scale(1.04);opacity:1}}
@keyframes ex00-flow{from{transform:translateX(-10px)}to{transform:translateX(12px)}}
@keyframes ex00-dustdrift{from{transform:translate(-8px,2px);opacity:.3}to{transform:translate(14px,-6px);opacity:.6}}
@keyframes ex00-sway{from{transform:rotate(-1.6deg)}to{transform:rotate(1.6deg)}}
}
</style>`);

/* ----- sky ----- */
o.push(`<g id="ex00-sky"><rect width="900" height="460" fill="url(#ex00-g-sky)"/><circle class="ex00-sunglow" cx="150" cy="118" r="330" fill="url(#ex00-g-sun)"/><circle cx="150" cy="118" r="40" fill="#fffdf0"/>`);
o.push(P('#FBF7EE', 'M520 150q40 -14 90 -6q50 -12 110 2q50 4 70 16q-70 8 -140 4q-70 6 -130 -16z', 'opacity=".55"'));
o.push(P('#FBF7EE', 'M330 250q30 -10 70 -4q40 -8 80 4q-40 8 -80 6q-40 4 -70 -6z', 'opacity=".45"'));
o.push(P('#FBF7EE', 'M700 268q30 -8 60 -3q36 -6 70 5q-36 7 -70 4q-34 4 -60 -6z', 'opacity=".4"'));
o.push(`</g>`);

/* ----- far: desert cliffs, Nile, fields ----- */
o.push(`<g id="ex00-far">`);
o.push(P('#ecd0a6', 'M0 344L44 340L70 332L128 334L150 342L214 338L262 346L300 340L352 344L396 334L452 338L486 348L560 344L610 350L676 340L740 344L800 336L900 340V420H0Z'));
o.push(P('#d9b48c', 'M0 356L70 350L128 352L150 358L262 360L352 356L452 354L486 362L610 362L740 356L900 354V372H0Z', 'opacity=".7"'));
o.push(S('#c9a27a', 1.6, 'M70 334l-4 16M150 343l4 14M300 341l-3 16M396 335l4 18M560 345l-4 16M676 341l3 14M800 337l-4 16', 'opacity=".6"'));
o.push(P('#e2c097', 'M0 372L900 366V420H0Z'));
// far bank greenery
o.push(P('#8fb06a', 'M0 388C120 378 260 382 400 386C560 390 720 380 900 384V404H0Z'));
o.push(P('#a9c47c', 'M0 388C120 378 260 382 400 386C560 390 720 380 900 384V390C720 386 560 396 400 392C260 388 120 384 0 394Z'));
for (const q of [[40, 392, 44, 4], [150, 388, 54, -5], [182, 390, 38, 4], [300, 390, 48, 5], [420, 392, 40, -4]]) o.push(palm(q[0], q[1], q[2], q[3], '#6f9a58', '#86ad62', '#a58a66'));
// Nile
o.push(P('url(#ex00-g-nile)', 'M0 402C150 396 300 404 450 402C600 400 750 396 900 400V440C750 436 600 444 450 442C300 440 150 446 0 440Z'));
o.push(`<path class="ex00-st ex00-water" stroke="#e4f6ea" stroke-width="2.4" opacity=".8" d="M40 414h70M180 422h110M360 412h60M470 426h90M620 414h70M760 424h80M110 432h50M560 434h40"/>`);
// near bank & fields
o.push(P('#7fa35a', 'M0 436C150 442 300 436 450 438C600 440 750 432 900 436V620H0Z'));
o.push(P('#a2bd66', 'M0 452L470 446L500 468L0 478Z'));
o.push(P('#d8bf62', 'M0 478L500 468L470 496L0 508Z'));
o.push(P('#8fae58', 'M0 508L470 496L440 530L0 546Z'));
o.push(P('#c2b05a', 'M0 546L440 530L424 600L0 600Z'));
let fur = '';
for (let k = 0; k < 16; k++) { const x = 20 + k * 29; fur += `M${x} 455L${x - 8} 476M${x + 8} 482L${x - 2} 505M${x - 4} 512L${x - 16} 542`; }
o.push(S('#6c8a48', 1.6, fur, 'opacity=".5"'));
// reeds on the bank
let reed = '';
for (let k = 0; k < 26; k++) { const x = R(0, 520); reed += `M${I(x)} 448q${I(R(-3, 3))} -8 ${I(R(-4, 4))} ${I(-R(10, 18))}`; }
o.push(S('#5f8848', 2, reed));
// tiny field workers
o.push(fig(120, 500, .36, 1, poseField, st(0, { shadow: false })));
o.push(fig(250, 524, .42, -1, poseField, st(2, { shadow: false })));
o.push(fig(350, 492, .34, 1, poseField, st(3, { shadow: false })));
o.push(`</g>`);

o.push(`<rect y="330" width="900" height="260" fill="url(#ex00-g-haze)"/>`);
/* ----- ground (behind the city) ----- */
o.push(P('url(#ex00-g-ground)', 'M0 566C140 552 300 566 420 580L900 600V1200H0Z', 'id="ex00-ground-base"'));
/* ----- city under construction ----- */
o.push(`<g id="ex00-city">`);
// distant finished wall + tower (hazy)
o.push(P('#d6b182', 'M410 610V452H470V424H520V452H640V610Z'));
o.push(P('#e9cb9c', 'M410 452H470V424H520V452H640V458H410Z', 'opacity=".8"'));
o.push(P('#bd966a', 'M500 424H520V610H500Z', 'opacity=".6"'));
o.push(P('#8a6444', 'M484 478h14v22h-14zM560 500h16v60h-16z', 'opacity=".7"'));
// vaulted storehouses behind the main wall
for (let k = 0; k < 3; k++) { const x = 716 + k * 62; o.push(P('#dcb684', `M${x} 500V404A31 31 0 0 1 ${x + 62} 404V500Z`)); o.push(P('#b78d60', `M${x + 44} 380A31 31 0 0 1 ${x + 62} 404V500H${x + 44}Z`, 'opacity=".75"')); o.push(P('#7d5a3e', `M${x + 20} 500V428A10 10 0 0 1 ${x + 40} 428V500Z`)); }
// gate tower
o.push(P('#c79a66', 'M586 600L600 318H718L732 600Z'));
o.push(P('#e3ba84', 'M586 600L600 318H628L618 600Z'));
o.push(P('#a67a4c', 'M700 318H718L732 600H708Z'));
o.push(P('#ecc993', 'M592 318L598 300H720L726 318Z'));
o.push(P('#c79a66', 'M598 300H720L718 294H600Z'));
// geometric band
let band = '';
for (let k = 0; k < 9; k++) band += `M${606 + k * 12} 336h8v10h-8z`;
o.push(P('#3aa7a0', band));
let band2 = '';
for (let k = 0; k < 9; k++) band2 += `M${606 + k * 12} 352l4 -5l4 5z`;
o.push(P('#b5553a', band2));
o.push(P('#6e4c34', 'M640 600V456H680V600Z'));
o.push(P('#e3ba84', 'M634 456H686V446H634Z'));
// palms near the city
o.push(`<g class="ex00-frond">${palm(548, 566, 150, 10, '#5f8a4a', '#7fa457', '#8a6a48')}</g>`);
o.push(`<g class="ex00-frond">${palm(510, 570, 110, -8, '#5f8a4a', '#7fa457', '#8a6a48')}</g>`);
// main wall under construction: stepped top
const steps = [[430, 586], [560, 548], [704, 476], [806, 440], [900, 440]];
let wallD = 'M430 668';
for (let k = 0; k < steps.length - 1; k++) wallD += `V${steps[k][1]}H${steps[k + 1][0]}`;
wallD += 'V690L430 668Z';
o.push(P('#a97a4c', wallD));
// brick courses on the wall face (dash trick)
let c1 = '', c2 = '';
for (let y = 446, r = 0; y < 684; y += 9, r++) { let xs = 900; for (let k = 0; k < steps.length - 1; k++) if (y - 4 >= steps[k][1]) { xs = steps[k][0]; break; } if (xs >= 900) continue; const d = `M${xs + 1} ${y}H900`; if (r % 2) c2 += d; else c1 += d; }
o.push(`<path fill="none" stroke="#c4925e" stroke-width="7.2" stroke-dasharray="18 2" d="${c1}"/><path fill="none" stroke="#c4925e" stroke-width="7.2" stroke-dasharray="18 2" stroke-dashoffset="10" d="${c2}"/>`);
// lit top faces of each step
for (let k = 0; k < steps.length - 1; k++) { const y = steps[k][1], x1 = steps[k][0], x2 = steps[k + 1][0]; o.push(P('#efcd96', `M${x1} ${y}L${x1 + 18} ${y - 11}H${x2 + (k < steps.length - 2 ? 0 : 18)}L${x2} ${y}Z`)); }
// loose bricks on top + scaffold
o.push(stack(822, 429, 4, 3, 13, 6));
o.push(S('#7a5230', 4, 'M792 440V352M868 440V346M786 396H876M786 366H876'));
o.push(S('#9a6e44', 3, 'M800 440L846 352'));
o.push(P('#c79a66', 'M784 392h94v6h-94z'));
// tiny workers on the wall top
o.push(fig(740, 474, .52, 1, poseMold, st(1, { shadow: false })));
o.push(fig(836, 392, .5, -1, poseBack, st(0, { shadow: false, post0: backLoad })));
o.push(fig(596, 546, .5, 1, poseMold, st(2, { shadow: false })));
// shadow at the wall foot
o.push(P('#6e4a30', 'M430 668L900 690V700L430 678Z', 'opacity=".35"'));
o.push(`</g>`);

/* ----- ground ----- */
o.push(`<g id="ex00-ground">`);
// low earth dike at the field edge
o.push(P('#d2a56c', 'M0 566C140 552 300 566 420 580L420 592C300 580 140 568 0 584Z'));
// trodden path of the carriers
o.push(P('#f3d9a8', 'M0 718C120 704 260 700 380 696C420 694 440 696 460 700L500 712C470 720 420 724 380 726C260 738 120 744 0 760Z', 'opacity=".6"'));
o.push(P('#d7a76c', 'M0 990C140 1000 300 1010 470 1000C600 992 760 1000 900 986V1016C760 1030 600 1022 470 1030C300 1040 140 1030 0 1020Z', 'opacity=".45"'));
o.push(P('#b98452', 'M0 1070C180 1044 360 1052 520 1076C680 1100 800 1090 900 1066V1200H0Z', 'opacity=".5"'));
o.push(`</g>`);

/* ----- ramp ----- */
o.push(`<g id="ex00-ramp">`);
o.push(P('#8e6440', 'M500 714L704 476V690Z'));
o.push(P('#a3764a', 'M500 714L704 476V520L560 716Z', 'opacity=".6"'));
o.push(S('#7a5436', 2, 'M560 690l40 4M600 640l50 6M640 590l40 5M664 548l30 4M610 690l60 6', 'opacity=".5"'));
o.push(P('#f1d6a2', 'M356 702L640 476H704L500 714Z'));
o.push(P('#dcb884', 'M430 708L672 476H704L500 714Z', 'opacity=".55"'));
o.push(S('#c79e6c', 2, 'M420 690l50 6M470 646l44 5M520 602l38 4M566 560l30 3M604 524l26 3', 'opacity=".7"'));
// carriers climbing the ramp
o.push(fig(644, 506, .5, 1, poseBack, st(2, { post0: backLoad, shw: 20 })));
o.push(fig(590, 566, .72, 1, poseBack, st(4, { post0: backLoad, shw: 20 })));
o.push(fig(512, 650, 1.0, 1, poseBack, st(1, { post0: backLoad, shw: 20 })));
o.push(`</g>`);

/* ----- brick stacks & props (mid-left) ----- */
o.push(`<g id="ex00-props" transform="translate(0 -24)">`);
o.push(stack(14, 668, 5, 6, 17, 8));
o.push(stack(104, 676, 3, 3, 17, 8));
o.push(stack(196, 660, 4, 4, 15, 7));
o.push(`</g>`);

/* ----- workers carrying bricks ----- */
o.push(`<g id="ex00-workers" transform="translate(0 -24)">`);
o.push(fig(120, 752, 1.42, 1, poseYoke2, st(3, { post: yoke, shw: 40 })));
o.push(fig(262, 742, 1.38, 1, poseBack, st(0, { post0: backLoad })));
o.push(fig(392, 734, 1.34, 1, poseYoke, st(2, { post: yoke, shw: 40 })));
o.push(`<ellipse class="ex00-dust" cx="200" cy="756" rx="60" ry="8" fill="#f6e3ba" opacity=".45"/><ellipse class="ex00-dust ex00-d1" cx="340" cy="744" rx="50" ry="7" fill="#f6e3ba" opacity=".45"/>`);
o.push(`</g>`);

/* ----- taskmaster ----- */
o.push(`<g id="ex00-taskmaster" transform="translate(0 -24)">`);
o.push(P('#d9ac72', 'M650 824C670 806 720 800 770 804C800 806 820 814 826 826C780 836 700 836 650 824Z'));
o.push(P('#b98452', 'M650 824C700 836 780 836 826 826C800 842 700 844 650 824Z'));
const tmPost = S('#5a3a22', 3.6, 'M23 -112L23 0') + S('#e2b23c', 3.6, 'M23 -112L23 -104');
const tmMid = P('#3aa7a0', 'M-9 -78q9 7 18 0l1 6q-10 8 -20 0z') + P('#e2b23c', 'M-8 -73q8 6 16 0l0 3q-8 6 -16 0z') + P('#FBF7EE', 'M-3 -44l8 0l3 20l-9 1z') + S('#e2b23c', 2.4, 'M10 -66l5 1M-15 -66l5 -1');
o.push(fig(742, 818, 1.8, -1, poseStand, { skin: '#a8623a', skinS: '#86492a', kilt: '#FBF7EE', kiltS: '#d9d2c0', wig: '#221a1c', belt: '#3aa7a0', len: .86, flare: 13, post: tmPost, mid: tmMid }));
o.push(`</g>`);

/* ----- mud pit ----- */
o.push(`<g id="ex00-mudpit" transform="translate(0 -46)">`);
o.push(P('#b98452', 'M54 906C50 858 140 828 264 826C392 824 514 846 532 902C548 958 476 1012 330 1022C184 1030 60 990 54 906Z'));
o.push(P('#8a5c3a', 'M70 908C68 866 150 842 264 840C384 838 498 858 514 904C528 952 462 998 330 1006C196 1014 74 980 70 908Z'));
o.push(P('#6b4329', 'M84 914C84 878 160 856 264 854C376 852 484 870 498 908C510 948 450 986 330 992C206 998 86 972 84 914Z'));
o.push(S('#8d6040', 4, 'M130 900q40 -14 90 -6M300 880q50 -8 100 6M150 950q60 16 120 6M330 960q50 10 110 -8M420 910q30 -4 50 8M210 920q40 8 80 0', 'opacity=".9"'));
o.push(S('#b28a64', 2.4, 'M140 890q30 -8 60 -4M320 872q30 -4 60 4M180 962q40 8 70 4M360 950q30 4 60 -6', 'opacity=".8"'));
// straw heap + jars at the edge
o.push(P('#c99a3a', 'M34 870C40 836 80 824 110 838C134 848 140 866 136 878C100 888 60 884 34 870Z'));
o.push(P('#e6c25a', 'M44 864C52 840 82 832 104 842C120 850 126 862 124 870C96 876 66 874 44 864Z'));
o.push(S('#f4dc86', 2, 'M54 862l14 -18M70 866l10 -24M88 866l6 -20M104 864l10 -14M40 874l-14 6M120 880l16 8M96 884l4 10', 'opacity=".9"'));
o.push(jar(566, 868, 1.05) + jar(598, 880, .9));
// workers in the pit
o.push(fig(196, 962, 1.85, 1, poseHoe, st(1, { post0: hoe, shadow: false })));
o.push(fig(368, 950, 1.8, -1, poseBrow, st(0, { pre: hoeUp, shadow: false })));
o.push(P('#7a5034', 'M150 960a44 9 0 1 0 100 0a44 9 0 1 0 -100 0M326 948a40 8 0 1 0 90 0a40 8 0 1 0 -90 0'));
o.push(S('#a47a54', 2.4, 'M160 962q30 8 70 2M336 950q26 7 60 2'));
// brick-maker kneeling with a mould
o.push(fig(470, 1008, 1.8, 1, poseMold, st(2, { post: mold })));
o.push(`</g>`);

/* ----- bricks drying in rows ----- */
o.push(`<g id="ex00-bricks" transform="translate(0 -50)">`);
o.push(rowBricks(628, 890, 6, 32, 9, 9, 10, 9, '#cf9c66', '#9a6a42'));
o.push(rowBricks(612, 926, 6, 36, 10, 10, 11, 10, '#c9955f', '#93643e'));
o.push(rowBricks(596, 966, 6, 40, 11, 11, 12, 11, '#bd8852', '#885a38'));
o.push(rowBricks(586, 1012, 6, 44, 12, 12, 13, 12, '#a87648', '#7a4f32'));
o.push(`</g>`);

/* ----- foreground ground detail ----- */
o.push(`<g id="ex00-fore">`);
let peb = '', peb2 = '';
for (let k = 0; k < 70; k++) { const x = R(10, 890), y = R(700, 1190); if (x > 40 && x < 550 && y > 770 && y < 990) continue; if (x > 570 && y > 810 && y < 990) continue; const r = R(1.5, 3.6) * (0.6 + (y - 700) / 700); const d = `M${I(x)} ${I(y)}a${n(r * 1.5)} ${n(r)} 0 1 0 ${n(r * 3)} 0a${n(r * 1.5)} ${n(r)} 0 1 0 ${n(-r * 3)} 0`; if (k % 2) peb += d; else peb2 += d; }
o.push(P('#a87448', peb, 'opacity=".6"'));
o.push(P('#f6e0b0', peb2, 'opacity=".7"'));
let strw = '';
for (let k = 0; k < 40; k++) { const x = R(10, 890), y = R(1040, 1190); const a = R(0, 3.14); const l = R(8, 18); strw += `M${I(x)} ${I(y)}l${I(Math.cos(a) * l)} ${I(-Math.sin(a) * l * .4)}`; }
o.push(S('#e8c766', 2, strw, 'opacity=".8"'));
let crk = '';
for (let k = 0; k < 14; k++) { const x = R(20, 860), y = R(1050, 1180); crk += `M${I(x)} ${I(y)}l${I(R(8, 20))} ${I(R(-5, 5))}l${I(R(6, 16))} ${I(R(-6, 6))}`; }
o.push(S('#9c6c44', 1.8, crk, 'opacity=".5"'));
// a dropped brick or two, hoe on the ground
o.push(rowBricks(40, 1034, 1, 44, 0, 12, 12, 10));
o.push(S('#8a8748', 2.6, tuftD(26, 1060, 26) + tuftD(880, 1070, 24) + tuftD(700, 1170, 22)));
o.push(`</g>`);
o.push(`</svg>`);

const out = o.join('\n');
fs.writeFileSync('/home/user/bible_onyou/web/assets/bg/ex00.svg', out);
console.log('ex00.svg', Buffer.byteLength(out), 'bytes');
