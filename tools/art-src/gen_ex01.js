const fs = require('fs');
let s = 20261;
function rnd() { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
const R = (a, b) => a + (b - a) * rnd();
const n = v => { const x = Math.round(v * 10) / 10; return (Object.is(x, -0) ? 0 : x) + ''; };
const I = v => Math.round(v) + '';
const o = [];
const P = (fill, d, extra = '') => `<path fill="${fill}" d="${d}"${extra ? ' ' + extra : ''}/>`;

function blob(cx, cy, rx, ry, N, jit, bulge = 0.62) {
  const pts = [];
  const a0 = R(0, 6.28);
  for (let k = 0; k < N; k++) { const a = a0 + k / N * Math.PI * 2; const j = 1 + R(-jit, jit); pts.push([cx + Math.cos(a) * rx * j, cy + Math.sin(a) * ry * j]); }
  let d = `M${I(pts[0][0])} ${I(pts[0][1])}`;
  for (let k = 1; k <= N; k++) { const p = pts[k % N], q = pts[k - 1]; const rr = Math.hypot(p[0] - q[0], p[1] - q[1]) * bulge; d += `A${I(rr)} ${I(rr)} 0 0 1 ${I(p[0])} ${I(p[1])}`; }
  return d + 'Z';
}

function flame(x, y, w, h, lean) {
  const tx = x + lean, ty = y - h;
  return `M${I(x)} ${I(y)}C${I(x - w * .78)} ${I(y - h * .02)} ${I(x - w * .62)} ${I(y - h * .42)} ${I(x - w * .2 + lean * .4)} ${I(y - h * .66)}C${I(x - w * .04 + lean * .8)} ${I(y - h * .8)} ${I(tx - w * .05)} ${I(y - h * .92)} ${I(tx)} ${I(ty)}C${I(tx + w * .12)} ${I(y - h * .78)} ${I(x + w * .62 + lean * .3)} ${I(y - h * .56)} ${I(x + w * .58)} ${I(y - h * .3)}C${I(x + w * .6)} ${I(y - h * .1)} ${I(x + w * .42)} ${I(y)} ${I(x)} ${I(y)}Z`;
}
let flc = 0;
// tongues: [x, baseY, w, h, lean]; drawn colour by colour so the orange merges into one fire body
function fire(list, core = true, op = 1) {
  const base = flc; let g = '';
  const layer = (fill, kx, kw, kh, kl, dy) => list.map((q, k) => `<path class="ex01-fl ex01-f${(base + k) % 5}" fill="${fill}" d="${flame(q[0] + q[4] * kx, q[1] - q[3] * dy, q[2] * kw, q[3] * kh, q[4] * kl)}"/>`).join('');
  g += layer('#EA6A2A', 0, 1, 1, 1, 0);
  g += layer('#F7B733', .1, .6, .68, .7, .02);
  if (core) g += layer('#FFEDA6', .12, .3, .4, .4, .04);
  flc += list.length;
  return op < 1 ? `<g opacity="${op}">${g}</g>` : g;
}

/* ---------- stones / grass ---------- */
function stone(x, y, w, h, lit, sh, cast = true, hi = null) {
  const p = [[-w / 2, 0], [-w * R(.42, .5), -h * R(.4, .6)], [-w * R(.22, .32), -h * R(.82, .95)], [-w * R(0, .1), -h], [w * R(.14, .3), -h * R(.84, .96)], [w * R(.4, .5), -h * R(.4, .6)], [w / 2, -h * R(0, .12)], [w * .44, 0]];
  let out = '';
  if (cast) out += `<ellipse cx="${I(x - w * .35)}" cy="${I(y)}" rx="${I(w * .62)}" ry="${I(Math.max(2, h * .16))}" fill="#6b4136" opacity=".28"/>`;
  const rj = n(Math.min(7, Math.max(2, w * .06)));
  out += P(lit, 'M' + p.map(q => I(x + q[0]) + ' ' + I(y + q[1])).join('L') + 'Z', `stroke="${lit}" stroke-width="${rj}" stroke-linejoin="round"`);
  const m = [w * R(-.1, .06), -h * R(.42, .58)];
  const bx0 = w * R(-.16, .02);
  out += P(sh, `M${I(x + p[0][0])} ${I(y)}L${I(x + p[1][0])} ${I(y + p[1][1])}L${I(x + p[2][0])} ${I(y + p[2][1])}L${I(x + p[3][0])} ${I(y + p[3][1])}L${I(x + m[0])} ${I(y + m[1])}L${I(x + bx0)} ${I(y)}Z`, `stroke="${sh}" stroke-width="${rj}" stroke-linejoin="round"`);
  if (hi) out += P(hi, `M${I(x + p[3][0])} ${I(y + p[3][1])}L${I(x + p[4][0])} ${I(y + p[4][1])}L${I(x + p[5][0])} ${I(y + p[5][1])}L${I(x + w * .2)} ${I(y - h * .5)}L${I(x + m[0])} ${I(y + m[1])}Z`);
  return out;
}
function scrub(x, y, sc) {
  let tw = '', lv = '';
  for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * .33 + R(-.1, .1); const L = R(22, 36) * sc; const ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L; tw += `M${I(x)} ${I(y)}Q${I(x + Math.cos(a) * L * .5 + R(-4, 4))} ${I(y + Math.sin(a) * L * .6)} ${I(ex)} ${I(ey)}`; for (let j = 0; j < 3; j++) { const t = R(.45, 1); const px = x + (ex - x) * t, py = y + (ey - y) * t; const r = R(2.5, 4.5) * sc; lv += `M${I(px - r)} ${I(py)}a${n(r)} ${n(r * .7)} 0 1 0 ${n(r * 2)} 0a${n(r)} ${n(r * .7)} 0 1 0 ${n(-r * 2)} 0`; } }
  return `<ellipse cx="${I(x - 10 * sc)}" cy="${I(y)}" rx="${I(26 * sc)}" ry="${I(4 * sc)}" fill="#6b4136" opacity=".25"/><path class="ex01-st" stroke="#7a5a3c" stroke-width="${n(2 * sc)}" d="${tw}"/>` + P('#8f8f52', lv);
}
function tuftD(x, y, h, k = 5) {
  let d = '';
  for (let j = 0; j < k; j++) { const t = (j / (k - 1)) - .5; const dx = t * h * 1.1 + R(-2, 2); d += `M${I(x + t * 5)} ${I(y)}q${I(dx * .3)} ${I(-h * .6)} ${I(dx)} ${I(-h * R(.7, 1))}`; }
  return d;
}

/* ---------- sheep ---------- */
function sheep(x, y, sc, pose, flip) {
  const sx = flip ? 1 : -1; // world-left in local coords
  let g = `<g transform="translate(${x} ${y}) scale(${flip ? -sc : sc} ${sc})">`;
  const lie = pose === 'lie';
  const by = lie ? -24 : -44;
  g += `<ellipse cx="${sx * 16}" cy="0" rx="54" ry="7" fill="#6b4136" opacity=".3"/>`;
  if (!lie) {
    g += `<path stroke="#4a372c" stroke-width="6" stroke-linecap="round" fill="none" d="M-27 -24L-29 -2M27 -24L28 -2"/>`;
    g += `<path stroke="#5f483a" stroke-width="6" stroke-linecap="round" fill="none" d="M-17 -24L-16 -2M17 -24L16 -2"/>`;
  }
  g += P('#59412f', `M${-46} ${by - 4}q-9 2 -10 12q6 2 12 -4z`);
  g += P('#cdbb9c', blob(0, by, 45, 25, 11, .06));
  g += P('#f7f0df', blob(sx * -5, by - 5, 37, 19, 10, .06));
  if (pose === 'graze') {
    g += P('#f7f0df', blob(42, -30, 13, 14, 6, .05));
    g += `<ellipse cx="52" cy="-13" rx="9" ry="13" transform="rotate(-28 52 -13)" fill="#6b5040"/>`;
    g += `<ellipse cx="42" cy="-25" rx="8" ry="4" transform="rotate(50 42 -25)" fill="#553d2c"/>`;
  } else {
    g += P('#f7f0df', blob(40, by - 14, 13, 13, 6, .05));
    g += `<ellipse cx="52" cy="${by - 20}" rx="13" ry="9" transform="rotate(24 52 ${by - 20})" fill="#6b5040"/>`;
    g += `<ellipse cx="41" cy="${by - 22}" rx="8" ry="4" transform="rotate(-24 41 ${by - 22})" fill="#553d2c"/>`;
    g += P('#f7f0df', blob(45, by - 31, 9, 7, 5, .05));
    g += `<circle cx="55" cy="${by - 23}" r="1.4" fill="#241a14"/>`;
  }
  return g + '</g>';
}

/* ================= SVG ================= */
o.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200" preserveAspectRatio="xMidYMid slice">`);
o.push(`<defs>
<linearGradient id="ex01-g-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f98ac"/><stop offset=".3" stop-color="#8cc7c2"/><stop offset=".55" stop-color="#eedfb2"/><stop offset=".8" stop-color="#f6c486"/><stop offset="1" stop-color="#ef9f62"/></linearGradient>
<radialGradient id="ex01-g-sun" cx="860" cy="380" r="520" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff6cf" stop-opacity=".95"/><stop offset=".35" stop-color="#ffe2a0" stop-opacity=".55"/><stop offset="1" stop-color="#ffd9a0" stop-opacity="0"/></radialGradient>
<linearGradient id="ex01-g-haze" x1="0" y1="330" x2="0" y2="640" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f3c79c" stop-opacity="0"/><stop offset="1" stop-color="#f3c79c" stop-opacity=".62"/></linearGradient>
<linearGradient id="ex01-g-ground" x1="0" y1="630" x2="0" y2="1200" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ecc68c"/><stop offset=".45" stop-color="#dfae6e"/><stop offset="1" stop-color="#bd8650"/></linearGradient>
<radialGradient id="ex01-g-halo" cx="574" cy="660" r="300" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffe08a" stop-opacity=".85"/><stop offset=".45" stop-color="#ffc55c" stop-opacity=".38"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
<radialGradient id="ex01-g-pool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe391" stop-opacity=".9"/><stop offset=".5" stop-color="#ffcf6a" stop-opacity=".45"/><stop offset="1" stop-color="#ffc259" stop-opacity="0"/></radialGradient>
<filter id="ex01-blur" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="16"/></filter>
</defs>`);
o.push(`<style>
.ex01-st{fill:none;stroke-linecap:round;stroke-linejoin:round}
@media (prefers-reduced-motion: no-preference){
.ex01-fl{transform-box:fill-box;transform-origin:50% 100%;animation:ex01-flick 2.6s ease-in-out infinite alternate}
.ex01-f1{animation-duration:2.1s;animation-delay:-.8s}
.ex01-f2{animation-duration:3.1s;animation-delay:-1.7s}
.ex01-f3{animation-duration:1.8s;animation-delay:-.4s}
.ex01-f4{animation-duration:2.4s;animation-delay:-1.2s}
.ex01-glow{animation:ex01-pulse 3.2s ease-in-out infinite alternate}
.ex01-spark{animation:ex01-rise 4.5s ease-out infinite}
.ex01-s1{animation-delay:-1.1s;animation-duration:5.2s}
.ex01-s2{animation-delay:-2.3s;animation-duration:3.9s}
.ex01-s3{animation-delay:-3.4s;animation-duration:6s}
.ex01-cloud{animation:ex01-drift 60s ease-in-out infinite alternate}
.ex01-c1{animation-duration:80s}
@keyframes ex01-flick{0%{transform:scale(1,1) skewX(0deg)}50%{transform:scale(.95,1.07) skewX(2.5deg)}100%{transform:scale(1.04,.95) skewX(-2.5deg)}}
@keyframes ex01-pulse{from{opacity:.78}to{opacity:1}}
@keyframes ex01-rise{0%{transform:translate(0,30px);opacity:0}25%{opacity:.95}100%{transform:translate(10px,-60px);opacity:0}}
@keyframes ex01-drift{from{transform:translateX(-18px)}to{transform:translateX(26px)}}
}
</style>`);

/* ----- sky ----- */
o.push(`<g id="ex01-sky"><rect width="900" height="700" fill="url(#ex01-g-sky)"/><rect width="900" height="700" fill="url(#ex01-g-sun)"/>`);
function cloud(x, y, w, h, cls) {
  return `<g class="ex01-cloud ${cls}"><path fill="#f6d2a6" opacity=".8" d="M${x} ${y + h * .35}q${w * .5} ${h * .5} ${w} 0q-${w * .1} ${h * .3} -${w * .5} ${h * .25}t-${w * .5} -${h * .25}z"/><path fill="#FBF7EE" opacity=".92" d="M${x} ${y + h * .4}c${-w * .04} ${-h * .4} ${w * .12} ${-h * .5} ${w * .2} ${-h * .4}c${w * .04} ${-h * .5} ${w * .22} ${-h * .6} ${w * .3} ${-h * .25}c${w * .1} ${-h * .4} ${w * .26} ${-h * .3} ${w * .28} ${-h * .02}c${w * .14} ${-h * .1} ${w * .24} ${h * .25} ${w * .22} ${h * .67}q${-w * .5} ${h * .22} ${-w} 0z"/></g>`;
}
o.push(cloud(60, 150, 250, 54, 'ex01-c0'));
o.push(cloud(330, 70, 170, 36, 'ex01-c1'));
o.push(cloud(700, 96, 150, 30, 'ex01-c0'));
o.push(cloud(-30, 300, 200, 34, 'ex01-c1'));
o.push(`</g>`);

/* ----- far ranges ----- */
o.push(`<g id="ex01-far">`);
o.push(P('#b7abc9', 'M0 452L48 418L92 436L150 384L196 412L238 398L300 446L360 470L420 500L900 520V700H0Z'));
o.push(P('#cdbfd3', 'M150 384L170 420L160 450L196 412ZM48 418L60 444L92 436Z', 'opacity=".7"'));
o.push(P('#9d8fb6', 'M0 520L40 488L96 500L140 462L186 486L230 470L282 512L330 530L900 560V700H0Z'));
o.push(P('#b8a6c2', 'M140 462L154 492L146 520L186 486ZM230 470L240 500L282 512Z', 'opacity=".7"'));
o.push(`</g>`);

/* ----- Horeb ----- */
o.push(`<g id="ex01-mountain">`);
// main peak: lit base
o.push(P('#dd9d7c', 'M292 700L352 520L398 452L432 380L470 330L506 232L546 204L585 150L622 188L652 182L692 252L732 272L772 342L822 372L862 432L900 452V700Z'));
// brighter lit planes
o.push(P('#efba92', 'M585 150L622 188L652 182L692 252L680 300L650 262L636 300L610 240L596 262Z'));
o.push(P('#efba92', 'M732 272L772 342L822 372L862 432L900 452V500L856 470L820 430L790 440L760 380L740 350Z', 'opacity=".8"'));
// shadow left face
o.push(P('#8a6480', 'M292 700L352 520L398 452L432 380L470 330L506 232L546 204L585 150L574 214L592 262L566 312L598 372L560 442L586 520L564 600L580 700Z'));
// deeper shadow facets
o.push(P('#735070', 'M506 232L546 204L530 262L548 320L512 392L528 470L492 560L500 700H420L452 560L440 480L474 410L462 352L490 300Z'));
o.push(P('#735070', 'M398 452L432 380L426 450L444 520L410 610L420 700H350L372 600L360 540Z', 'opacity=".75"'));
// lit slivers in the shadow face (spurs catching light)
o.push(P('#b98482', 'M546 204L585 150L574 214L556 250L560 300L540 286L548 240Z'));
o.push(P('#b98482', 'M470 330L506 232L490 300L498 350L474 410L480 360Z', 'opacity=".8"'));
// gullies on lit face
o.push(P('#a9717a', 'M652 182L662 250L642 304L670 362L652 424L684 476L668 560L690 700H640L650 560L626 470L640 420L616 360L632 300L620 246L636 300L650 262Z'));
o.push(P('#a9717a', 'M772 342L764 420L792 482L778 546L806 600L800 700H760L770 610L748 548L762 480L740 420L750 372Z', 'opacity=".85"'));
o.push(P('#c58a7c', 'M692 252L704 320L690 380L716 440L700 520L730 600L724 700H700L706 600L682 520L694 440L672 380L686 320L680 300Z', 'opacity=".7"'));
o.push(P('#c58a7c', 'M862 432L852 500L872 560L860 640L900 700V452Z', 'opacity=".7"'));
// left shoulder (nearer)
o.push(P('#c98f7a', 'M120 700L176 610L215 568L262 524L300 508L352 440L388 420L416 462L452 530L480 700Z'));
o.push(P('#7d5a76', 'M120 700L176 610L215 568L262 524L300 508L352 440L388 420L376 470L392 520L364 580L380 640L366 700Z'));
o.push(P('#694a68', 'M262 524L300 508L288 560L304 610L276 660L282 700H226L240 650L222 606L248 566Z', 'opacity=".8"'));
o.push(P('#e2aa88', 'M388 420L416 462L452 530L462 600L436 560L420 580L404 520L392 520L376 470Z', 'opacity=".75"'));
o.push(`<rect y="330" width="900" height="370" fill="url(#ex01-g-haze)"/>`);
o.push(`</g>`);

/* ----- mid-ground foothills & crag behind the bush ----- */
o.push(`<g id="ex01-mid">`);
// left rolling foothill
o.push(P('#d7a57c', 'M0 610C60 590 120 596 180 612C250 628 330 632 420 640L420 720H0Z'));
o.push(P('#b98566', 'M0 610C40 598 70 594 96 598L80 626L104 650L60 690L0 700Z'));
o.push(P('#b98566', 'M180 612L214 618L204 640L236 662L210 700H170L186 664L168 640Z', 'opacity=".8"'));
// dark crag behind the bush (in shadow: sun is behind-right)
o.push(P('#6f4e62', 'M372 720L392 640L418 600L452 566L470 520L508 500L540 462L584 474L622 446L668 456L700 498L742 516L772 560L806 590L834 640L850 720Z'));
o.push(P('#5d4058', 'M470 520L508 500L496 548L516 600L484 650L492 720H440L452 660L436 610L452 566Z'));
o.push(P('#5d4058', 'M584 474L622 446L612 500L634 552L606 610L620 720H566L580 620L556 560L576 510Z'));
o.push(P('#5d4058', 'M742 516L772 560L760 610L786 660L776 720H730L740 660L716 610L730 560Z', 'opacity=".85"'));
// rim light on crag tops (right-facing edges)
o.push(P('#d59474', 'M540 462L584 474L576 510L562 492L548 500Z'));
o.push(P('#d59474', 'M622 446L668 456L700 498L686 520L662 486L640 492L628 470Z'));
o.push(P('#d59474', 'M700 498L742 516L772 560L806 590L834 640L812 630L790 606L764 596L748 560L724 548Z', 'opacity=".9"'));
o.push(P('#b27a6c', 'M418 600L452 566L470 520L474 552L456 590L436 610Z', 'opacity=".6"'));
// right foothill
o.push(P('#dba678', 'M700 720L760 650C800 628 850 620 900 612V720Z'));
o.push(P('#b07c62', 'M760 650L800 634L790 662L816 690L800 720H740Z', 'opacity=".8"'));
o.push(`</g>`);

/* ----- ground ----- */
o.push(`<g id="ex01-ground">`);
o.push(P('url(#ex01-g-ground)', 'M0 668C80 650 170 652 260 664C340 674 420 676 500 668C600 658 700 664 780 672C830 676 870 672 900 664V1200H0Z'));
// terrain bands
o.push(P('#d9a468', 'M0 742C90 724 190 730 270 748C350 766 400 770 470 764L440 790C350 800 250 792 160 780C90 772 40 776 0 786Z', 'opacity=".55"'));
o.push(P('#e9c68c', 'M330 720C420 706 520 712 600 708C700 702 800 716 900 708V736C800 744 700 730 600 738C520 744 420 738 330 742Z', 'opacity=".5"'));
o.push(P('#c88f58', 'M0 930C120 906 240 912 360 934C480 956 600 960 720 946C800 936 860 940 900 948V1010C820 1000 740 1004 660 1016C520 1036 380 1028 260 1004C160 986 70 990 0 1004Z', 'opacity=".4"'));
o.push(P('#a9744a', 'M0 1080C160 1050 320 1060 470 1090C620 1118 780 1110 900 1080V1200H0Z', 'opacity=".45"'));
// dry grass patch behind the sheep
o.push(P('#a89a5c', 'M24 800C60 760 150 750 228 770C262 780 268 806 236 822C170 846 70 846 34 828C18 820 14 810 24 800Z', 'opacity=".55"'));
o.push(P('#8d8a4e', 'M40 836C90 818 190 822 248 846C262 858 240 872 200 876C140 880 70 874 44 860C30 852 30 842 40 836Z', 'opacity=".5"'));
// fire light on the ground
o.push(`<ellipse class="ex01-glow" cx="574" cy="862" rx="330" ry="104" fill="url(#ex01-g-pool)"/>`);
// sand ripples
let rip = '';
for (let k = 0; k < 46; k++) { const x = R(20, 880), y = R(700, 1180), w = R(18, 50) * (0.6 + (y - 700) / 800); rip += `M${I(x)} ${I(y)}q${I(w / 2)} ${I(-R(2, 5))} ${I(w)} 0`; }
o.push(`<path class="ex01-st" stroke="#a8714a" stroke-width="2" opacity=".35" d="${rip}"/>`);
let rip2 = '';
for (let k = 0; k < 30; k++) { const x = R(20, 880), y = R(700, 1180), w = R(14, 40); rip2 += `M${I(x)} ${I(y)}q${I(w / 2)} ${I(-R(2, 4))} ${I(w)} 0`; }
o.push(`<path class="ex01-st" stroke="#f6dca6" stroke-width="2" opacity=".5" d="${rip2}"/>`);
// pebbles
let peb = '', peb2 = '';
for (let k = 0; k < 60; k++) { const x = R(10, 890), y = R(690, 1190), r = R(1.5, 4) * (0.6 + (y - 690) / 700); const d = `M${I(x)} ${I(y)}a${n(r * 1.5)} ${n(r)} 0 1 0 ${n(r * 3)} 0a${n(r * 1.5)} ${n(r)} 0 1 0 ${n(-r * 3)} 0`; if (k % 2) peb += d; else peb2 += d; }
o.push(P('#9c6c4e', peb, 'opacity=".6"'));
o.push(P('#f1d6a4', peb2, 'opacity=".7"'));
// mid-distance stones
const stones = [[60, 706, 44, 22], [330, 700, 36, 18], [404, 716, 60, 30], [455, 742, 34, 18], [770, 704, 70, 38], [850, 730, 46, 26], [720, 742, 36, 18], [30, 900, 50, 26], [420, 960, 44, 20], [820, 860, 58, 34], [760, 900, 30, 14], [260, 1010, 40, 18], [640, 1020, 54, 24], [520, 1000, 26, 12]];
for (const q of stones) o.push(stone(q[0], q[1], q[2], q[3], '#dcae82', '#96685a', true, '#f3d6a6'));
o.push(scrub(360, 742, .8)); o.push(scrub(804, 780, 1)); o.push(scrub(30, 730, .7)); o.push(scrub(760, 960, 1.1)); o.push(scrub(110, 960, 1));
// grass tufts (dry)
let tg = '', tg2 = '';
for (let k = 0; k < 34; k++) { const x = R(10, 890), y = R(700, 1040); if (x > 440 && x < 700 && y > 760 && y < 880) continue; if (x > 220 && x < 390 && y > 820 && y < 960) continue; const h = R(10, 22) * (0.6 + (y - 700) / 600); if (k % 2) tg += tuftD(x, y, h); else tg2 += tuftD(x, y, h, 4); }
o.push(`<path class="ex01-st" stroke="#8a8748" stroke-width="2.4" d="${tg}"/>`);
o.push(`<path class="ex01-st" stroke="#b9a561" stroke-width="2.2" d="${tg2}"/>`);
o.push(`</g>`);

/* ----- sheep (common) ----- */
o.push(`<g id="ex01-sheep">`);
o.push(sheep(196, 772, 0.86, 'up', false));
o.push(sheep(92, 790, 0.95, 'lie', false));
o.push(sheep(64, 838, 0.62, 'up', false));
o.push(sheep(140, 858, 1.22, 'graze', false));
let sg = tuftD(96, 862, 16) + tuftD(214, 866, 18) + tuftD(236, 790, 12) + tuftD(40, 800, 12);
o.push(`<path class="ex01-st" stroke="#7f8346" stroke-width="2.4" d="${sg}"/>`);
o.push(`</g>`);

/* ----- bush ----- */
o.push(`<g id="ex01-bush">`);
o.push(`<circle class="ex01-glow" cx="574" cy="660" r="300" fill="url(#ex01-g-halo)"/>`);
o.push(`<ellipse cx="574" cy="660" rx="120" ry="170" fill="#ffb84a" opacity=".6" filter="url(#ex01-blur)"/>`);
o.push(stone(462, 866, 60, 32, '#eebf80', '#a5745a', true, '#fbe2a4'));
o.push(stone(690, 868, 66, 38, '#e2ad74', '#8e6252', true, '#f6cf8e'));
o.push(stone(732, 886, 34, 18, '#e2ad74', '#8e6252', true, '#f6cf8e'));
// back fire
o.push(`<g id="ex01-fire-back">` + fire([[466, 770, 56, 124, -10], [690, 772, 60, 136, 10], [500, 722, 84, 136, -10], [574, 716, 100, 176, -6], [650, 718, 92, 196, 10], [536, 716, 96, 220, 8], [612, 712, 104, 252, 5]]) + `</g>`);
const bx = 572, by = 852;
const br = [], th = [], lfA = [[], [], [], []], lfB = [[], [], [], []];
const J = (...a) => { let r = ''; a.forEach((v, k) => { const t = I(v); r += (k && t[0] !== '-' ? ' ' : '') + t; }); return r; };
function leaf2(px, py, a, L) {
  const w = L * .42; const mx = Math.cos(a) * L * .5, my = Math.sin(a) * L * .5; const ex = Math.cos(a) * L, ey = Math.sin(a) * L; const qx = -Math.sin(a) * w, qy = Math.cos(a) * w;
  return `M${J(px, py)}q${J(mx + qx, my + qy, ex, ey)}q${J(-mx - qx, -my - qy, -ex, -ey)}`;
}
function addLeaf(px, py, a, L) {
  const d = Math.hypot(px - bx, (py - (by - 100)) * .9);
  let c; const t = rnd();
  if (d < 60) c = t < .45 ? 3 : (t < .85 ? 2 : 1);
  else if (d < 100) c = t < .2 ? 3 : (t < .6 ? 2 : 1);
  else c = t < .12 ? 2 : (t < .62 ? 1 : 0);
  (rnd() < .3 ? lfB : lfA)[c].push(leaf2(px, py, a, L));
}
function grow(x, y, a, len, w, depth) {
  const bend = R(-.25, .25);
  const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
  const cx = (x + x2) / 2 + Math.cos(a + 1.57) * len * bend, cy = (y + y2) / 2 + Math.sin(a + 1.57) * len * bend;
  br.push([w, `M${J(x, y)}Q${J(cx, cy, x2, y2)}`]);
  const steps = Math.max(2, Math.round(len / 16));
  for (let k = 1; k <= steps; k++) {
    const t = k / steps; const u = 1 - t;
    const px = u * u * x + 2 * u * t * cx + t * t * x2, py = u * u * y + 2 * u * t * cy + t * t * y2;
    const side = (k % 2 ? 1 : -1);
    if (depth >= 1) {
      addLeaf(px, py, a + side * R(.6, 1.3), R(13, 19));
      if (depth >= 2 && rnd() < .3) addLeaf(px, py, a - side * R(.5, 1.2), R(12, 17));
    }
    if (rnd() < .45 && depth < 3) { const ta = a - side * R(1.1, 1.6); const tl = R(5, 9); th.push(`M${J(px, py)}l${J(Math.cos(ta) * tl, Math.sin(ta) * tl)}`); }
  }
  if (depth < 3) {
    const kids = depth === 0 ? 3 : 2;
    for (let k = 0; k < kids; k++) {
      const spread = (k - (kids - 1) / 2) * R(.5, .75) + R(-.12, .12);
      let na = a + spread; na = na * .74 + (-Math.PI / 2) * .26;
      grow(x2, y2, na, len * R(.68, .84), w * .62, depth + 1);
    }
  } else {
    for (let k = 0; k < 3; k++) addLeaf(x2, y2, a + R(-1.2, 1.2), R(13, 18));
  }
}
const stems = [-162, -140, -118, -96, -74, -52, -28];
for (const d of stems) grow(bx + R(-8, 8), by - R(0, 6), d * Math.PI / 180 + R(-.06, .06), R(56, 66) * (Math.abs(d + 90) > 55 ? .82 : 1.14), 9, 0);
// side fire licking around the flanks
o.push(fire([[452, 838, 40, 84, -8], [700, 842, 42, 92, 8]], false));
// canopy mass
o.push(P('#3e5a36', blob(bx - 2, by - 98, 88, 80, 14, .1, .56), 'opacity=".85"'));
o.push(P('#4f6f3c', blob(bx + 10, by - 104, 64, 58, 12, .1, .56), 'opacity=".8"'));
o.push(`<ellipse cx="${bx}" cy="${by + 4}" rx="84" ry="11" fill="#5a3526" opacity=".45"/>`);
const brw = {};
for (const b of br) { const k = n(b[0]); (brw[k] = brw[k] || []).push(b[1]); }
for (const k of Object.keys(brw).sort((a, b) => b - a)) o.push(`<path class="ex01-st" stroke="${k > 5 ? '#4a2f1e' : '#5c3b24'}" stroke-width="${k}" d="${brw[k].join('')}"/>`);
o.push(`<path class="ex01-st" stroke="#7a5230" stroke-width="2" d="${th.join('')}"/>`);
// fire inside the bush
o.push(`<g id="ex01-fire-mid">` + fire([[522, 806, 30, 112, -5], [562, 778, 34, 150, 6], [606, 796, 30, 124, -6], [644, 812, 26, 92, 5]], false, .92) + `</g>`);
const lc = ['#3f5c34', '#6F8448', '#93aa52', '#c6cf6c'];
for (let c = 0; c < 4; c++) o.push(P(lc[c], lfA[c].join('')));
// small translucent flamelets in front; leaves stay visible through and over them
o.push(`<g id="ex01-fire-front">` + fire([[506, 842, 20, 50, -3], [548, 730, 22, 62, 4], [622, 846, 22, 56, 4], [630, 716, 20, 54, -4], [664, 790, 18, 46, 4], [494, 766, 16, 42, -3], [584, 690, 18, 48, 3]], false, .8) + `</g>`);
for (let c = 0; c < 4; c++) o.push(P(lc[c], lfB[c].join('')));
// sparks
let sp = '';
const sps = [[516, 520, 3], [560, 404, 2.5], [600, 470, 3], [646, 388, 2.5], [680, 500, 3], [488, 600, 2.5], [708, 590, 2.5], [588, 360, 2], [630, 330, 2], [536, 430, 2]];
sps.forEach((q, k) => { sp += `<circle class="ex01-spark ex01-s${k % 4}" cx="${q[0]}" cy="${q[1]}" r="${q[2]}" fill="${k % 2 ? '#ffe08a' : '#ffc24d'}" opacity=".85"/>`; });
o.push(sp);
o.push(`</g>`);

/* ----- Moses: approach ----- */
const skin = '#c48a5e', skinS = '#a56e47';
o.push(`<g id="ex01-state-approach"><g transform="translate(288 884) scale(1.08)">`);
o.push(`<path fill="#6b4136" opacity=".34" d="M40 -4C0 -10 -90 4 -190 26C-200 34 -180 40 -150 36C-70 24 10 14 60 4Z"/>`);
// staff shadow
o.push(`<path class="ex01-st" stroke="#6b4136" stroke-width="4" opacity=".3" d="M72 0L-120 44"/>`);
// feet + sandals
o.push(P(skinS, 'M-28 -8Q-26 -24 -14 -26L-2 -26Q6 -14 8 -8Z'));
o.push(P('#5a3a22', 'M-32 -8H10Q12 -2 6 -1H-28Q-34 -2 -32 -8Z'));
o.push(P(skin, 'M4 -8Q4 -26 16 -28L26 -28Q40 -16 46 -8Z'));
o.push(P('#6b4526', 'M0 -8H48Q51 -2 45 -1H4Q-2 -2 0 -8Z'));
o.push(`<path class="ex01-st" stroke="#5a3a22" stroke-width="3" d="M8 -22L26 -24M22 -10L28 -24L36 -10M-22 -22L-6 -24M-10 -10L-6 -24"/>`);
// shins
o.push(P(skinS, 'M-20 -62H-4L-6 -22H-18Z'));
o.push(P(skin, 'M10 -62H27L25 -24H13Z'));
// cloak (back) – shadow tone
o.push(P('#84422d', 'M-30 -272C-54 -238 -60 -170 -62 -84Q-40 -72 -14 -80Q0 -82 12 -78C13 -140 15 -200 22 -264Q-2 -278 -30 -272Z'));
// tunic
o.push(P('#eadbb6', 'M-4 -266C-8 -200 -30 -120 -46 -62Q-26 -52 -6 -58Q16 -64 42 -56L36 -132C36 -182 34 -232 26 -264Z'));
o.push(P('#cdb88e', 'M-46 -62Q-26 -52 -6 -58L2 -110L-14 -72Z'));
o.push(P('#cdb88e', 'M12 -252C10 -200 8 -130 2 -66L14 -62C18 -130 20 -200 20 -252Z', 'opacity=".7"'));
o.push(P('#f7efd6', 'M30 -240C36 -190 38 -120 40 -60L34 -60C32 -120 30 -190 26 -240Z'));
// cloak (near side panel)
o.push(P('#9c5438', 'M-32 -272C-54 -238 -60 -170 -62 -84Q-40 -72 -14 -80Q-2 -82 6 -80C6 -140 8 -200 14 -262Q-6 -278 -32 -272Z'));
o.push(P('#7c3f2b', 'M-32 -272C-54 -238 -60 -170 -62 -84Q-52 -78 -40 -77C-42 -150 -40 -220 -24 -270Z'));
o.push(`<path class="ex01-st" stroke="#6a3423" stroke-width="5" opacity=".8" d="M-26 -262C-34 -200 -34 -130 -30 -80M-6 -266C-12 -200 -12 -130 -10 -82"/>`);
o.push(`<path class="ex01-st" stroke="#c98a5a" stroke-width="2.5" opacity=".7" d="M-16 -264C-23 -200 -23 -130 -20 -80M6 -258C0 -200 0 -130 0 -82"/>`);
// hem fringe of cloak
o.push(`<path class="ex01-st" stroke="#6a3423" stroke-width="3" d="M-60 -86Q-40 -76 -14 -82Q-2 -84 6 -82"/>`);
// sash
o.push(P('#4f5d7a', 'M8 -190L35 -186L35 -172L7 -176Z'));
o.push(P('#4f5d7a', 'M12 -176L22 -175L20 -140L12 -142Z'));
// staff
o.push(`<path class="ex01-st" stroke="#5f3d22" stroke-width="7.5" d="M72 -2L62 -330Q60 -356 76 -360Q92 -360 92 -344"/>`);
o.push(`<path class="ex01-st" stroke="#9a6b3c" stroke-width="2.4" d="M74 -6L64.5 -328Q63 -352 76 -357"/>`);
// near arm: sleeve + forearm + hand
o.push(P('#a65c3e', 'M-12 -258C2 -268 22 -256 30 -238L48 -204Q40 -184 22 -186C6 -200 -10 -226 -12 -258Z'));
o.push(P('#7c3f2b', 'M-12 -258C-10 -226 6 -200 22 -186Q28 -186 34 -190C14 -204 0 -228 -4 -260Z'));
o.push(`<path class="ex01-st" stroke="${skin}" stroke-width="13" d="M34 -198L62 -224"/>`);
o.push(`<circle cx="65" cy="-227" r="9.5" fill="${skin}"/>`);
o.push(P(skinS, 'M58 -222q8 6 15 -1l1 5q-8 6 -15 1z'));
// neck
o.push(P(skinS, 'M0 -272L20 -272L18 -258L4 -258Z'));
// head
o.push(`<ellipse cx="15" cy="-302" rx="21" ry="24" fill="${skin}"/>`);
o.push(P(skin, 'M33 -306Q42 -300 40 -294Q36 -292 32 -294Z'));
// beard
o.push(P('#f6f1e6', 'M2 -300C-2 -280 6 -258 18 -240Q28 -226 36 -236C46 -250 44 -274 40 -288Q36 -294 31 -290Q20 -286 12 -298Z'));
o.push(P('#d6cfc0', 'M2 -300C-2 -280 6 -258 18 -240Q24 -232 30 -232C16 -252 10 -276 12 -298Z'));
o.push(P('#f6f1e6', 'M26 -293Q36 -296 42 -289Q36 -284 28 -287Z'));
// headcloth
o.push(P('#f3ead4', 'M-10 -300C-16 -336 14 -342 30 -332Q38 -326 37 -314L-2 -312C-2 -292 -10 -272 -24 -258Q-38 -262 -40 -274C-26 -280 -12 -290 -10 -300Z'));
o.push(P('#d4c6a6', 'M-10 -300C-14 -322 -4 -334 8 -337C-2 -326 -4 -312 -2 -312C-2 -292 -10 -272 -24 -258Q-38 -262 -40 -274C-26 -280 -12 -290 -10 -300Z'));
o.push(`<path class="ex01-st" stroke="#8a4b34" stroke-width="5" d="M-9 -315L36 -316"/>`);
// eye + brow
o.push(`<circle cx="27" cy="-305" r="2.3" fill="#33241c"/>`);
o.push(`<path class="ex01-st" stroke="#f6f1e6" stroke-width="2.4" d="M22 -311L31 -310"/>`);
o.push(`</g></g>`);

/* ----- Moses: hideface (still standing, same spot; face hidden in the crook of his cloaked arm) ----- */
o.push(`<g id="ex01-state-hideface" style="display:none"><g transform="translate(288 884) scale(1.08)">`);
o.push(`<path fill="#6b4136" opacity=".34" d="M44 -2C0 -10 -90 4 -184 24C-194 32 -174 38 -144 34C-66 24 10 14 62 6Z"/>`);
o.push(`<path class="ex01-st" stroke="#6b4136" stroke-width="4" opacity=".3" d="M72 0L-120 44"/>`);
// cloak (back) down to the ground
o.push(P('#84422d', 'M-34 -248C-58 -214 -64 -150 -70 -6Q-44 3 -16 -3Q0 -6 14 -2C14 -90 16 -180 20 -240Q-6 -254 -34 -248Z'));
// tunic: the long hem reaches the ground, the feet are not seen
o.push(P('#eadbb6', 'M-8 -242C-12 -180 -34 -100 -50 -5Q-26 5 -4 -1Q22 -7 50 -1L40 -112C40 -160 36 -208 26 -240Z'));
o.push(P('#cdb88e', 'M-50 -5Q-26 5 -4 -1L2 -90L-16 -30Z'));
o.push(P('#cdb88e', 'M10 -228C8 -180 6 -110 0 -4L13 -3C16 -110 18 -180 18 -228Z', 'opacity=".7"'));
o.push(P('#f7efd6', 'M30 -216C36 -170 40 -100 45 -4L38 -5C34 -100 32 -170 26 -216Z'));
// cloak (near side panel)
o.push(P('#9c5438', 'M-36 -248C-58 -214 -64 -150 -68 -8Q-44 0 -18 -6Q-6 -8 6 -6C6 -90 8 -176 12 -238Q-10 -254 -36 -248Z'));
o.push(P('#7c3f2b', 'M-36 -248C-58 -214 -64 -150 -68 -8Q-56 -3 -44 -3C-46 -100 -44 -196 -28 -246Z'));
o.push(`<path class="ex01-st" stroke="#6a3423" stroke-width="5" opacity=".8" d="M-30 -238C-38 -180 -38 -90 -34 -8M-10 -242C-16 -180 -16 -90 -14 -8"/>`);
o.push(`<path class="ex01-st" stroke="#c98a5a" stroke-width="2.5" opacity=".7" d="M-20 -240C-27 -180 -27 -90 -24 -7M2 -234C-4 -180 -4 -90 -4 -8"/>`);
o.push(`<path class="ex01-st" stroke="#6a3423" stroke-width="3" d="M-66 -10Q-44 -1 -18 -7Q-6 -9 6 -7"/>`);
// sash
o.push(P('#4f5d7a', 'M8 -168L37 -164L37 -150L7 -154Z'));
o.push(P('#4f5d7a', 'M12 -154L22 -153L20 -118L12 -120Z'));
// far arm keeps hold of the staff
o.push(`<path class="ex01-st" stroke="${skinS}" stroke-width="12" d="M30 -198L60 -206"/>`);
o.push(`<path class="ex01-st" stroke="#5f3d22" stroke-width="7.5" d="M72 -2L62 -330Q60 -356 76 -360Q92 -360 92 -344"/>`);
o.push(`<path class="ex01-st" stroke="#9a6b3c" stroke-width="2.4" d="M74 -6L64.5 -328Q63 -352 76 -357"/>`);
o.push(`<circle cx="65" cy="-208" r="9.5" fill="${skinS}"/>`);
// head, bowed
o.push(`<g transform="translate(-4 24) rotate(14 12 -280)">`);
o.push(P(skinS, 'M0 -272L20 -272L18 -256L4 -256Z'));
o.push(`<ellipse cx="15" cy="-302" rx="21" ry="24" fill="${skin}"/>`);
o.push(P('#f6f1e6', 'M2 -300C-2 -280 6 -258 18 -240Q28 -226 36 -236C46 -250 44 -274 40 -288Q36 -294 31 -290Q20 -286 12 -298Z'));
o.push(P('#d6cfc0', 'M2 -300C-2 -280 6 -258 18 -240Q24 -232 30 -232C16 -252 10 -276 12 -298Z'));
o.push(P('#f3ead4', 'M-10 -300C-16 -336 14 -342 30 -332Q38 -326 37 -314L-2 -312C-2 -292 -10 -272 -24 -258Q-38 -262 -40 -274C-26 -280 -12 -290 -10 -300Z'));
o.push(P('#d4c6a6', 'M-10 -300C-14 -322 -4 -334 8 -337C-2 -326 -4 -312 -2 -312C-2 -292 -10 -272 -24 -258Q-38 -262 -40 -274C-26 -280 -12 -290 -10 -300Z'));
o.push(`<path class="ex01-st" stroke="#8a4b34" stroke-width="5" d="M-9 -315L36 -316"/>`);
o.push(`</g>`);
// near arm: cloak sleeve raised, face buried in the crook of the elbow
o.push(P('#a65c3e', 'M-14 -238C0 -252 24 -252 46 -252L64 -248Q70 -238 64 -228C58 -212 46 -198 30 -194C12 -196 -6 -212 -14 -238Z'));
o.push(P('#7c3f2b', 'M-14 -238C-6 -212 12 -196 30 -194C44 -198 54 -208 62 -224C44 -212 14 -214 -6 -238Z'));
o.push(`<path class="ex01-st" stroke="#a65c3e" stroke-width="19" d="M56 -244L34 -282"/>`);
o.push(`<path class="ex01-st" stroke="#6a3423" stroke-width="4.5" opacity=".8" d="M60 -238L40 -276"/>`);
o.push(`<path class="ex01-st" stroke="#c98a5a" stroke-width="2.4" opacity=".7" d="M50 -250L30 -284"/>`);
o.push(P(skin, 'M18 -284C16 -296 24 -304 34 -302Q42 -298 42 -290C40 -280 30 -276 22 -278Z'));
o.push(`<path class="ex01-st" stroke="${skinS}" stroke-width="1.8" d="M24 -298q-3 6 -2 12M31 -300q-3 7 -2 14"/>`);
o.push(`</g></g>`);

/* ----- foreground ----- */
o.push(`<g id="ex01-fore">`);
o.push(scrub(300, 1040, 1.3));
o.push(scrub(590, 1010, 1.1));
o.push(stone(70, 1096, 196, 100, '#b98258', '#6c4638', false, '#d6a06c'));
o.push(stone(176, 1136, 120, 56, '#c99262', '#774e3c', false, '#e2b27c'));
o.push(stone(-10, 1170, 150, 70, '#a8744e', '#5f3d32', false, '#c48e60'));
o.push(stone(826, 1104, 196, 112, '#c08a5c', '#6c4638', false, '#dcaa74'));
o.push(stone(704, 1150, 110, 50, '#cf9a66', '#7a5140', false, '#e6b880'));
o.push(stone(900, 1176, 140, 70, '#a8744e', '#5f3d32', false, '#c48e60'));
let fg = tuftD(212, 1104, 40, 6) + tuftD(24, 1010, 34, 6) + tuftD(740, 1112, 44, 6) + tuftD(884, 1000, 34, 6) + tuftD(610, 1160, 30, 5) + tuftD(400, 1150, 28, 5);
o.push(`<path class="ex01-st" stroke="#6f7a3e" stroke-width="3.2" d="${fg}"/>`);
let fg2 = tuftD(228, 1108, 30, 5) + tuftD(40, 1014, 26, 5) + tuftD(754, 1116, 32, 5) + tuftD(870, 1004, 26, 5) + tuftD(480, 1170, 26, 5);
o.push(`<path class="ex01-st" stroke="#b3a25c" stroke-width="2.8" d="${fg2}"/>`);
o.push(`</g>`);
o.push(`</svg>`);

const out = o.join('\n');
fs.writeFileSync('/home/user/bible_onyou/web/assets/bg/ex01.svg', out);
console.log('ex01.svg', Buffer.byteLength(out), 'bytes', 'leaves', lfA.flat().length + lfB.flat().length, 'branches', br.length);
