// alt02 요단 강을 건넘 — SVG generator
const fs = require('fs');
let seed = 11;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const R = (a, b) => a + (b - a) * rnd();
const pick = a => a[Math.floor(rnd() * a.length)];
const n = v => +(+v).toFixed(1);
const i0 = v => Math.round(v);
const shade = (hex, f) => {
  const c = hex.replace('#', '');
  const ch = i => Math.max(0, Math.min(255, Math.round(parseInt(c.substr(i, 2), 16) * f)));
  return '#' + [0, 2, 4].map(i => ch(i).toString(16).padStart(2, '0')).join('');
};
const out = [];
const P = s => out.push(s);
const T = (x, y, s, r) => `transform="translate(${i0(x)},${i0(y)})${r ? ` rotate(${i0(r)})` : ''}${s !== undefined && s !== 1 ? ` scale(${Array.isArray(s) ? s.map(n).join(',') : n(s)})` : ''}"`;

P(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200" preserveAspectRatio="xMidYMid slice">`);
P(`<defs>
<linearGradient id="alt02-g-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FC6C9"/><stop offset=".5" stop-color="#BFE3D6"/><stop offset="1" stop-color="#FCEFD3"/></linearGradient>
<radialGradient id="alt02-g-sun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFF8DC" stop-opacity=".95"/><stop offset=".35" stop-color="#FFF3CC" stop-opacity=".55"/><stop offset="1" stop-color="#FFF3CC" stop-opacity="0"/></radialGradient>
<linearGradient id="alt02-g-plain" gradientUnits="userSpaceOnUse" x1="0" y1="262" x2="0" y2="520"><stop offset="0" stop-color="#D6D8A6"/><stop offset="1" stop-color="#A3B966"/></linearGradient>
<linearGradient id="alt02-g-bed" gradientUnits="userSpaceOnUse" x1="560" y1="420" x2="200" y2="1000"><stop offset="0" stop-color="#F0D7A2"/><stop offset=".5" stop-color="#E6C283"/><stop offset="1" stop-color="#D9AC6B"/></linearGradient>
<linearGradient id="alt02-g-wall" gradientUnits="userSpaceOnUse" x1="700" y1="300" x2="690" y2="560"><stop offset="0" stop-color="#8FDDD2"/><stop offset=".4" stop-color="#52B6B8"/><stop offset="1" stop-color="#23788F"/></linearGradient>
<linearGradient id="alt02-g-bank" gradientUnits="userSpaceOnUse" x1="0" y1="700" x2="0" y2="1200"><stop offset="0" stop-color="#93AD55"/><stop offset=".5" stop-color="#74904A"/><stop offset="1" stop-color="#57713A"/></linearGradient>
<g id="alt02-pb"><path d="M-10,-1h8v4h-9zM3,-1h8v4h-9z" fill="#7A5230"/><path d="M-12,0L-14,-58Q-14,-77 0,-78Q14,-77 14,-58L13,0Z"/><path d="M3,0L5,-77Q14,-75 14,-58L13,0Z" fill="#000" opacity=".2"/></g>
<g id="alt02-ph"><path d="M-2,-72L-17,-50L-12,-46L4,-62Z"/><path d="M-2,-72L-17,-50L-12,-46L4,-62Z" fill="#000" opacity=".1"/><circle cx="-16" cy="-47" r="3.4" fill="#B8824F"/><circle cx="0" cy="-87" r="9.5" fill="#B8824F"/><path d="M-10,-89Q-10,-100 0,-100Q11,-100 11,-87L13,-70L5,-74L5,-86Q0,-94 -10,-89Z" fill="currentColor"/><path d="M-10,-90Q0,-96 8,-92L8,-89Q0,-93 -10,-87Z" fill="#000" opacity=".3"/></g>
<g id="alt02-pv"><path d="M-2,-72L-17,-50L-12,-46L4,-62Z"/><path d="M-2,-72L-17,-50L-12,-46L4,-62Z" fill="#000" opacity=".1"/><circle cx="-16" cy="-47" r="3.4" fill="#A8703F"/><circle cx="0" cy="-87" r="9.5" fill="#A8703F"/><path d="M-9,-90Q-10,-100 0,-100Q11,-100 12,-87L15,-48L5,-52L5,-86Q0,-94 -9,-90Z" fill="currentColor"/></g>
<g id="alt02-pt"><path d="M-12,0L-13,-60Q-13,-78 0,-78Q14,-77 14,-58L13,0Z"/><path d="M3,0L5,-77Q14,-75 14,-58L13,0Z" fill="#000" opacity=".2"/><circle cx="0" cy="-88" r="11" fill="currentColor"/></g>
<path id="alt02-tf" d="M-9,2L-13,-13L-6,-3L-5,-19L-1,-4L3,-23L5,-4L10,-16L9,-2L15,-10L11,2Z"/>
<g id="alt02-st"><ellipse cx="6" cy="2" rx="17" ry="5" fill="#5A3A1E" opacity=".25"/><path d="M-14,2Q-16,-8 -6,-12Q6,-16 13,-8Q18,-2 14,2Z"/><path d="M0,2Q6,-4 4,-13Q10,-12 13,-8Q18,-2 14,2Z" fill="#000" opacity=".2"/><path d="M-11,-5Q-8,-11 -1,-12Q-6,-8 -8,-3Z" fill="#FFF" opacity=".25"/></g>
<g id="alt02-pm"><path d="M-2,0Q-4,-22 1,-44L4,-44Q0,-22 3,0Z" fill="#8C6B48"/><path d="M2,-44q-21,-3 -27,-18q16,3 27,18zM2,-44q-9,-18 -22,-26q5,-1 22,26zM2,-44q-6,-20 -1,-31q7,12 1,31zM2,-44q6,-19 18,-25q-3,14 -18,25zM2,-44q14,-14 28,-12q-10,10 -28,12zM2,-44q16,-5 26,5q-14,2 -26,-5zM2,-44q-17,-2 -25,9q14,0 25,-9z"/><circle cx="2" cy="-44" r="3.5" fill="#000" opacity=".2"/></g>
<g id="alt02-rd"><path d="M0,0Q3,-36 2,-60" stroke="currentColor" stroke-width="2.4" fill="none"/><ellipse cx="2" cy="-68" rx="3.2" ry="10"/><path d="M0,0Q-8,-24 -13,-38Q-3,-24 3,0Z" fill="currentColor"/></g>
<g id="alt02-gr"><path d="M0,0Q3,-36 2,-60" stroke="currentColor" stroke-width="2" fill="none"/><path d="M2,-80Q7,-70 2,-58Q-3,-70 2,-80ZM2,-62L9,-72L4,-58ZM2,-62L-5,-72L0,-58Z"/></g>
<g id="alt02-bu"><ellipse cx="0" cy="-14" rx="26" ry="17"/><ellipse cx="-16" cy="-8" rx="15" ry="11"/><ellipse cx="18" cy="-8" rx="15" ry="10"/><path d="M0,-30Q26,-28 26,-12Q30,-4 18,2H2Q14,-10 0,-30Z" fill="#000" opacity=".16"/><g fill="currentColor"><circle cx="-10" cy="-20" r="2.6"/><circle cx="4" cy="-14" r="2.4"/><circle cx="-20" cy="-9" r="2.2"/><circle cx="14" cy="-22" r="2.2"/><circle cx="20" cy="-8" r="2"/></g></g>
</defs>`);
P(`<style>
@media (prefers-reduced-motion: no-preference){
.alt02-cloud{animation:alt02-drift 70s linear infinite alternate}
.alt02-cloud2{animation:alt02-drift 95s linear infinite alternate-reverse}
.alt02-glint{animation:alt02-twinkle 3.2s ease-in-out infinite}
.alt02-glint2{animation:alt02-twinkle 4.1s ease-in-out 1.3s infinite}
.alt02-sheen{animation:alt02-sheen 5s ease-in-out infinite}
@keyframes alt02-drift{from{transform:translateX(-18px)}to{transform:translateX(26px)}}
@keyframes alt02-twinkle{0%,100%{opacity:.25}50%{opacity:1}}
@keyframes alt02-sheen{0%,100%{opacity:.4}50%{opacity:.75}}

}
</style>`);
P(`<g id="alt02-state-main">`);

/* ---------- sky ---------- */
P(`<g id="alt02-sky"><rect width="900" height="340" fill="url(#alt02-g-sky)"/>
<circle cx="130" cy="96" r="150" fill="url(#alt02-g-sun)"/><circle cx="130" cy="96" r="30" fill="#FFF9E3"/>`);
const cloud = (x, y, s, cls) => `<g class="${cls}"><g ${T(x, y, s)}><path d="M-70,10Q-78,-8 -56,-12Q-52,-34 -24,-30Q-10,-50 18,-38Q40,-48 54,-26Q80,-26 78,-4Q92,6 70,12Z" fill="#FBF7EE"/><path d="M-70,10Q-60,2 -40,6Q-10,-2 16,5Q44,0 78,-2Q90,6 70,12Z" fill="#E9E6DA"/></g></g>`;
P(cloud(400, 84, 1.25, 'alt02-cloud') + cloud(660, 150, 0.8, 'alt02-cloud2') + cloud(600, 40, 0.6, 'alt02-cloud2') + cloud(262, 172, 0.55, 'alt02-cloud'));
P(`</g>`);

/* ---------- far hills ---------- */
P(`<g id="alt02-hills">
<path d="M0,246C50,226 110,206 180,220S290,200 372,214S520,186 610,204S770,178 900,200V340H0Z" fill="#B9B4D4"/>
<path d="M180,220C215,212 250,206 290,204L318,226L270,232Z" fill="#C8C3DE"/><path d="M610,204C660,192 700,186 740,184L770,210L690,214Z" fill="#C8C3DE"/>
<path d="M0,270C80,250 150,262 240,254S400,236 500,250S700,230 900,246V340H0Z" fill="#A9B5C6"/>
<path d="M0,286C120,270 260,276 400,268S700,262 900,268V340H0Z" fill="#B7C3A8"/>
</g>`);

/* ---------- far plain with fields ---------- */
P(`<g id="alt02-plain"><path d="M0,292C200,276 500,270 900,276V620H0Z" fill="url(#alt02-g-plain)"/>`);
const fld = (pts, c) => `<path d="M${pts.map(p => p.join(',')).join('L')}Z" fill="${c}"/>`;
P(fld([[0, 318], [120, 306], [150, 316], [0, 334]], '#E3CF8B'));
P(fld([[330, 292], [470, 286], [500, 296], [350, 304]], '#E6D393'));
P(fld([[380, 312], [530, 300], [556, 316], [400, 330]], '#DCC06B'));
P(fld([[300, 336], [395, 322], [420, 340], [318, 356]], '#9FB565'));
P(fld([[330, 364], [470, 336], [500, 352], [352, 384]], '#E2C56A'));
P(fld([[0, 352], [70, 342], [96, 356], [0, 372]], '#9FB565'));
P(fld([[0, 384], [110, 366], [150, 384], [0, 410]], '#E4C96F'));
P(fld([[170, 372], [300, 348], [322, 366], [196, 392]], '#D9BC5E'));
P(fld([[0, 426], [150, 394], [196, 412], [0, 456]], '#93AC5C'));
P(fld([[214, 408], [330, 384], [360, 398], [240, 428]], '#EACF78'));
P(fld([[0, 470], [200, 424], [236, 440], [0, 496]], '#E0C165'));
let fur = '';
for (let i = 0; i < 5; i++) fur += `M${i0(8 + i * 4)},${i0(478 + i * 4)}L${i0(206 + i * 6)},${i0(430 + i * 3)}`;
for (let i = 0; i < 4; i++) fur += `M${i0(336 + i * 5)},${i0(368 + i * 4)}L${i0(474 + i * 6)},${i0(340 + i * 3.4)}`;
for (let i = 0; i < 3; i++) fur += `M4,${i0(390 + i * 6)}L${i0(118 + i * 9)},${i0(370 + i * 5)}`;
for (let i = 0; i < 3; i++) fur += `M${i0(220 + i * 6)},${i0(412 + i * 5)}L${i0(334 + i * 7)},${i0(388 + i * 4)}`;
P(`<path d="${fur}" stroke="#C7A548" stroke-width="1.6" fill="none" opacity=".7"/>`);
let sh = '';
for (const [x, y] of [[40, 474], [96, 462], [150, 448], [70, 486], [128, 470]]) sh += `M${x - 4},${y}l2,-9l-3,-4l5,2l5,-2l-3,4l2,9z`;
P(`<path d="${sh}" fill="#C89F3C"/></g>`);

/* ---------- Jericho ---------- */
const palm = (x, y, s, c = '#5E8048') => `<use href="#alt02-pm" ${T(x, y, s)} fill="${c}"/>`;
P(`<g id="alt02-jericho">
<path d="M34,304C70,276 130,268 210,268S340,276 384,304Z" fill="#C9C08F"/>
<path d="M60,300C90,284 140,278 210,278S320,284 356,300Z" fill="#B9AE7C"/>`);
const houses = [[118, 236, 26, 22], [146, 228, 30, 30], [178, 222, 24, 36], [204, 230, 34, 28], [240, 224, 26, 34], [268, 232, 30, 26], [296, 240, 20, 18], [100, 244, 20, 14]];
let hs1 = '', hs2 = '', hs3 = '';
for (const [x, y, w, h] of houses) { hs1 += `M${x},${y}h${w}v${h}h${-w}z`; hs2 += `M${n(x + w * 0.62)},${y}h${n(w * 0.38)}v${h}h${n(-w * 0.38)}z`; hs3 += `M${x + 4},${y + 6}h3v5h-3z`; }
P(`<path d="${hs1}M186,214h10v10h-10z" fill="#F1E0BA"/><path d="${hs2}M192,214h4v10h-4z" fill="#D5BD8F"/><path d="${hs3}" fill="#9A7B5A"/>`);
const crenel = (x0, x1, y, t = 4) => { let d = `M${x0},${y}`; let x = x0, up = true; while (x < x1 - 0.01) { const w = Math.min(t, x1 - x); d += up ? `v${-t}h${n(w)}v${t}` : `h${n(w)}`; x += w; up = !up; } return d; };
P(`<path d="M92,288L92,254L330,254L330,288Q210,280 92,288Z" fill="#E9D4A6"/>`);
P(`<path d="${crenel(92, 330, 254)}V258H92Z" fill="#E9D4A6"/>`);
P(`<path d="M92,274Q210,266 330,274V288Q210,280 92,288Z" fill="#D8BF8E"/>`);
for (const [x, w, top] of [[84, 22, 240], [150, 18, 242], [218, 34, 236], [292, 18, 242], [326, 20, 244]]) {
  P(`<path d="M${x},292V${top}h${w}V292Z${crenel(x, x + w, top, 4.4)}v3H${x}Z" fill="#EEDBB0"/><path d="M${n(x + w * 0.6)},292V${top}h${n(w * 0.4)}V292Z" fill="#CBB081"/><path d="M${x + 5},${top + 10}h3v6h-3z" fill="#9A7B5A"/>`);
}
P(`<path d="M229,292V270Q235,261 241,270V292Z" fill="#8A6C50"/>`);
P(palm(60, 304, 0.8) + palm(46, 310, 0.6) + palm(362, 306, 0.85) + palm(382, 312, 0.62) + palm(404, 306, 0.5) + palm(128, 306, 0.6) + palm(268, 308, 0.66) + palm(24, 314, 0.7) + palm(430, 300, 0.42) + palm(196, 310, 0.5));
P(`</g>`);

/* ---------- trees on the far plain ---------- */
P(palm(250, 420, 1.0, '#58793F') + palm(276, 414, 0.75, '#648547') + palm(420, 372, 0.8, '#58793F') + palm(486, 352, 0.6, '#648547') + palm(22, 452, 1.25, '#527238'));
for (const [x, y, s] of [[200, 380, 1], [520, 322, .7], [160, 340, .6], [300, 326, .6], [470, 318, .5]]) P(`<g ${T(x, y, s)}><ellipse cx="0" cy="-9" rx="14" ry="10" fill="#6E8B4B"/><ellipse cx="5" cy="-6" rx="9" ry="7" fill="#5B7740"/><path d="M-1,0v-6h2v6z" fill="#7A5B3C"/></g>`);

/* ---------- piled-up water (upstream, right) ---------- */
// crest of the standing face
const crest = `M544,318C566,304 590,312 620,310C652,308 676,298 712,302C748,306 774,318 808,316C842,314 872,320 905,326`;
P(`<g id="alt02-water">
<path d="M590,292C616,270 646,258 680,266C706,244 752,236 794,250C828,232 868,228 905,234V470H590Z" fill="#B4E5DA"/>
<path d="M680,266C706,244 752,236 794,250C772,252 752,262 746,274C722,264 700,262 680,266Z" fill="#D2F0E6"/>
<path d="M794,250C828,232 868,228 905,234V250C870,244 838,250 820,264Z" fill="#D2F0E6"/>
<path d="M562,312C596,286 636,280 676,296C710,272 772,268 818,288C852,272 884,272 905,276V480H562Z" fill="#86D3CA"/>
<path d="M676,296C710,272 772,268 818,288C792,290 772,298 762,310C732,298 702,294 676,296Z" fill="#AEE4DA"/>
<path d="M562,312C596,286 636,280 676,296C644,296 622,306 610,318Z" fill="#AEE4DA"/>
<path d="${crest}V566C790,514 662,456 560,412Z" fill="url(#alt02-g-wall)"/>`);
// lit band near the top, deep band at the base
P(`<path d="M548,350C584,340 606,352 636,352C672,350 700,340 730,344C764,350 790,364 820,362C852,360 878,366 905,372V396C876,388 850,382 820,386C788,388 762,372 730,366C700,362 676,374 640,376C610,376 586,364 552,372Z" fill="#C5F1E7" opacity=".3"/>`);
P(`<path d="M560,412C662,456 790,514 905,566V506C800,462 690,420 562,378Z" fill="#165F7A" opacity=".4"/>`);
let st = '';
for (let i = 0; i < 15; i++) {
  const x = 570 + i * 23 + R(-8, 8);
  const yc = 314 + (x - 546) * 0.03 + R(10, 50);
  const yb = 412 + (x - 560) * 0.447 - R(16, 50);
  if (yb - yc < 24) continue;
  st += `M${i0(x)},${i0(yc)}C${i0(x - 5)},${i0(yc + (yb - yc) * .35)} ${i0(x + 4)},${i0(yc + (yb - yc) * .7)} ${i0(x - 2)},${i0(yb)}`;
}
P(`<path class="alt02-sheen" d="${st}" stroke="#D3F6EE" stroke-width="3.4" stroke-linecap="round" fill="none" opacity=".6"/>`);
// crest foam
P(`<path d="${crest}V337C872,330 842,324 808,327C774,329 748,317 712,313C676,309 652,319 620,321C590,323 568,315 546,330Z" fill="#FBF7EE"/>`);
let foam = '';
for (let i = 0; i < 24; i++) { const x = 552 + i * 14.6 + R(-3, 3); const y = 322 + (x - 546) * 0.03 + R(6, 16); foam += `<circle cx="${i0(x)}" cy="${i0(y)}" r="${n(R(2, 4.4))}"/>`; }
P(`<g fill="#FBF7EE" opacity=".9">${foam}</g>`);
P(`<path d="M562,312C596,286 636,280 676,296C710,272 772,268 818,288C852,272 884,272 905,276V281C884,278 852,278 820,294C772,275 712,279 678,302C636,287 598,292 564,317Z" fill="#F4F7EE"/>`);
P(`<path d="M590,292C616,270 646,258 680,266C706,244 752,236 794,250C828,232 868,228 905,234V238C868,233 830,237 796,255C752,242 708,249 682,271C646,264 618,275 593,296Z" fill="#F4F7EE" opacity=".9"/>`);
// wet sand + base foam
P(`<path d="M548,414C660,462 790,520 905,572V598C780,548 650,486 540,430Z" fill="#B98F56" opacity=".55"/>`);
let bf = '';
for (let i = 0; i < 34; i++) { const t = i / 33; const x = 560 + t * 345 + R(-3, 3); const y = 412 + t * 154 + R(-3, 5); bf += `<ellipse cx="${i0(x)}" cy="${i0(y)}" rx="${n(R(4, 9))}" ry="${n(R(2, 4))}"/>`; }
P(`<g fill="#FBF7EE">${bf}</g>`);
const glint = (x, y, s, cls) => `<path class="${cls}" ${T(x, y, s)} d="M0,-7L1.800,-1.800L7,0L1.800,1.800L0,7L-1.800,1.800L-7,0L-1.800,-1.800Z" fill="#FFFDF2"/>`.replace(/\.(\d)00/g, '.$1');
P(glint(642, 372, 1, 'alt02-glint') + glint(742, 410, 1.2, 'alt02-glint2') + glint(836, 384, .9, 'alt02-glint') + glint(700, 282, .8, 'alt02-glint2') + glint(850, 462, 1.1, 'alt02-glint2') + glint(596, 362, .7, 'alt02-glint'));
P(`</g>`);

/* ---------- far bank slope ---------- */
P(`<g id="alt02-farbank">
<path d="M0,498C120,468 220,440 310,416S480,350 546,322L562,414C470,432 380,456 300,478S110,536 0,566Z" fill="#B88D5A"/>
<path d="M0,532C110,502 210,472 300,450S470,404 558,384L562,414C470,432 380,456 300,478S110,536 0,566Z" fill="#A27747"/>
<path d="M0,514C110,484 210,456 300,432S470,378 552,350L553,358C470,386 390,412 300,438S110,492 0,522Z" fill="#C79C68" opacity=".8"/>
`);
const lipPts = [];
for (let i = 0; i <= 40; i++) { const t = 1 - i / 40; const x = 546 * t; const y = 496 - (496 - 320) * Math.pow(t, 1.14); lipPts.push([x, y]); }
let lipd = '';
lipPts.forEach(([x, y], i) => { lipd += `L${i0(x)},${i0(y + (i % 2 ? R(9, 17) : R(3, 7)))}`; });
P(`<path d="M0,490C120,460 220,432 310,408S480,342 546,314L548,330${lipd}Z" fill="#7C9A4C"/>`);
P(`<path d="M0,490C120,460 220,432 310,408S480,342 546,314L547,321C480,348 400,390 310,414S120,466 0,496Z" fill="#A3BC64"/>`);
P(`<path d="M88,546C98,514 112,484 128,456C150,448 172,442 196,438C190,468 196,496 214,516C174,530 128,540 88,546Z" fill="#DDBB82"/>
<path d="M196,438C190,468 196,496 214,516L196,522C180,500 176,470 180,442Z" fill="#B88D5A"/>
<path d="M128,456C150,448 172,442 196,438L194,446C172,450 150,456 124,464Z" fill="#EBD09A"/>`);
P(`</g>`);

/* ---------- riverbed ---------- */
P(`<g id="alt02-riverbed">
<path d="M0,562C110,534 220,500 300,478S470,432 560,412C662,456 790,514 905,566V1200H0Z" fill="url(#alt02-g-bed)"/>
<path d="M0,566C110,538 220,504 300,482S470,436 560,416L548,432C470,448 390,470 310,494S120,552 0,584Z" fill="#C79C60" opacity=".55"/>
<path d="M520,470C440,510 330,560 240,620S90,720 0,760V790C100,744 180,690 270,640S450,548 560,500Z" fill="#D6AD6E" opacity=".55"/>
<path d="M700,560C600,600 520,640 440,700S330,800 290,860L330,870C370,810 430,750 500,700S640,620 740,590Z" fill="#D2A867" opacity=".5"/>
<path d="M430,560C380,580 320,612 270,640L300,646C350,620 400,594 452,572Z" fill="#F3DCA8" opacity=".7"/>
<path d="M130,640C100,656 60,672 20,692L40,700C80,680 120,664 156,648Z" fill="#F3DCA8" opacity=".7"/>
<path d="M640,640C600,656 560,676 530,700L556,706C590,684 630,664 668,650Z" fill="#F3DCA8" opacity=".6"/>`);
let rip = '';
for (let i = 0; i < 24; i++) { const x = R(30, 860), y = R(600, 880); const w = R(18, 40); rip += `M${i0(x)},${i0(y)}q${i0(w / 2)},${i0(-w * .22 - 3)} ${i0(w)},${i0(-w * .3)}`; }
P(`<path d="${rip}" stroke="#C99F63" stroke-width="2" stroke-linecap="round" fill="none" opacity=".7"/>`);
// cracked mud
P(`<path d="M60,800l14,-10l16,4l10,-12M90,794l6,14l16,6M330,700l12,8l18,-4l8,10M360,704l-4,-14M560,820l14,-8l12,6l16,-8M586,818l4,12M720,620l10,6l14,-4M150,600l10,8l16,-2l6,10" stroke="#BF945A" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".8"/>`);
const puddle = (x, y, w, h) => `<ellipse cx="${x}" cy="${y}" rx="${w + 4}" ry="${h + 2.5}" fill="#C79C60"/><ellipse cx="${x}" cy="${y}" rx="${w}" ry="${h}" fill="#7AD0C8"/><ellipse cx="${n(x - w * .25)}" cy="${n(y - h * .25)}" rx="${n(w * .45)}" ry="${n(h * .3)}" fill="#C6EDE2"/>`;
P(puddle(250, 690, 34, 9) + puddle(96, 620, 22, 6) + puddle(672, 676, 26, 7) + puddle(362, 836, 30, 8) + puddle(742, 636, 16, 4.5));
const stone = (x, y, s, c = '#A2917B') => `<use href="#alt02-st" ${T(x, y, s)} fill="${c}"/>`;
const stones = [[60, 720, 1.2], [84, 730, .7], [300, 600, .7], [320, 606, .45], [200, 580, .5], [600, 640, .8], [622, 648, .5], [716, 712, 1.0], [470, 880, 1.1], [500, 888, .6], [30, 600, .6], [820, 650, .7], [160, 700, .5], [560, 770, .7], [340, 770, .6], [250, 850, .9], [276, 858, .5]];
for (const [x, y, s] of stones) P(stone(x, y, s, pick(['#A2917B', '#B09C82', '#8F8272'])));
let peb = '';
for (let i = 0; i < 56; i++) { const x = R(10, 880), y = R(470, 900); const top = x < 560 ? 562 - x * 0.27 + 14 : 412 + (x - 560) * 0.447 + 30; if (y < top) continue; peb += `<ellipse cx="${i0(x)}" cy="${i0(y)}" rx="${n(R(1.5, 4))}" ry="${n(R(1, 2.2))}"/>`; }
P(`<g fill="#B48E5C" opacity=".8">${peb}</g>`);
P(`</g>`);

/* ---------- people ---------- */
const robes = ['#D2A95F', '#8E6B4A', '#5F8189', '#EFE6D2', '#7E8C52', '#C58E5E', '#B9A07A', '#6E7FA0', '#E3CFA0', '#9C7A9A'];
const cloths = ['#FBF7EE', '#E9DDBF', '#C9B287', '#8FA6B0', '#D9C08C'];
const shadowsOut = [];
const person = (x, y, h, dir, o = {}) => {
  const s = h / 100;
  const robe = o.robe || pick(robes), cl = o.cloth || pick(cloths);
  const lean = o.lean === undefined ? dir * R(1, 5) : o.lean;
  if (!o.noShadow) shadowsOut.push(`<ellipse cx="${i0(x + h * .16)}" cy="${i0(y + h * .012)}" rx="${n(h * .24)}" ry="${n(h * .05)}"/>`);
  if (h < 26) return `<use href="#alt02-pt" ${T(x, y, s)} fill="${robe}" color="${cl}"/>`;
  let g = `<g ${T(x, y, s, lean)} fill="${robe}" color="${cl}">`;
  if (o.bundle) g += `<ellipse cx="${-dir * 13}" cy="-64" rx="10" ry="13" fill="${o.bundle}"/>`;
  g += `<use href="#alt02-pb"/>`;
  if (o.sash) g += `<path d="M-14,-50h28v6h-28z" fill="${o.sash}"/>`;
  if (o.staff) g += `<path d="M${dir * 19},-84L${dir * 21},0" stroke="#6B4A2C" stroke-width="2.6" stroke-linecap="round"/>`;
  g += `<use href="#alt02-${o.veil ? 'pv' : 'ph'}"${dir > 0 ? ' transform="scale(-1,1)"' : ''}/></g>`;
  return g;
};
const path = [[905, 628], [820, 610], [720, 584], [620, 554], [520, 528], [420, 518], [330, 528], [250, 544], [180, 548], [140, 522], [124, 480], [150, 446], [205, 414], [262, 388]];
const hAt = y => Math.max(11, 0.3 * (y - 332));
const ppl = [];
const segLen = []; let tot = 0;
for (let i = 1; i < path.length; i++) { const d = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); segLen.push(d); tot += d; }
const at = t => { let d = t * tot; for (let i = 0; i < segLen.length; i++) { if (d <= segLen[i]) { const k = d / segLen[i]; return [path[i][0] + (path[i + 1][0] - path[i][0]) * k, path[i][1] + (path[i + 1][1] - path[i][1]) * k, i]; } d -= segLen[i]; } return [...path[path.length - 1], segLen.length - 1]; };
const N = 46;
for (let i = 0; i < N; i++) {
  const t = (i + R(0.1, 0.9)) / N;
  let [x, y, si] = at(t);
  const h = hAt(y);
  const spread = si >= 9 ? h * 0.25 : h * 0.34;
  x += R(-6, 6); y += R(-spread, spread);
  const dir = si >= 10 ? 1 : -1;
  const o = {};
  if (rnd() < .3) o.veil = true;
  if (rnd() < .22) o.staff = true;
  if (rnd() < .28) o.bundle = pick(['#C9A66B', '#B58F5A', '#D9C39A']);
  if (rnd() < .3) o.sash = pick(['#8A5A3A', '#C9A04A', '#4F6F8A']);
  ppl.push({ x, y, h: hAt(y) * R(.92, 1.06), dir, o });
  if (rnd() < .2 && h > 30) ppl.push({ x: x + dir * h * .26, y: y + R(2, 5), h: hAt(y) * R(.55, .68), dir, o: {} });
}
for (let i = 0; i < 16; i++) { const x = R(170, 330), y = 402 + (330 - x) * 0.14 + R(-14, 16); ppl.push({ x, y, h: hAt(y) * R(.95, 1.1), dir: rnd() < .5 ? 1 : -1, o: { lean: 0, veil: rnd() < .3 } }); }
ppl.sort((a, b) => a.y - b.y);
const pplSvg = ppl.map(p => person(p.x, p.y, p.h, p.dir, p.o)).join('');
P(`<g id="alt02-people"><g fill="#9A6238" opacity=".3">${shadowsOut.join('')}</g>${pplSvg}</g>`);

/* ---------- ark & priests ---------- */
const priestBody = (x, y, s) => `<g ${T(x, y, s)}><path d="M-11,-1h9v5h-10zM3,-1h9v5h-10z" fill="#7A5230"/><path d="M-15,0L-17,-72Q-18,-99 -2,-101Q16,-100 17,-76L16,0Z" fill="#FAF5E8"/><path d="M4,0L6,-100Q16,-98 17,-76L16,0Z" fill="#D9D0BC"/><path d="M-7,0L-6,-52L-3,0Z" fill="#E6DECB"/><path d="M-15,-6h31v3h-31z" fill="#3E6C9E"/><path d="M-17,-63L17,-63L17,-55L-17,-55Z" fill="#3E6C9E"/><path d="M5,-63H17V-55H5Z" fill="#2F5580"/><path d="M-9,-56L-3,-56L-4,-26L-10,-26Z" fill="#3E6C9E"/><path d="M-10,-26h6v4h-6z" fill="#E0A52E"/></g>`;
const priestHead = (x, y, s) => `<g ${T(x, y, s)}><path d="M7,-88L-15,-95L-14,-108L9,-101Z" fill="#EDE6D4"/><circle cx="-15" cy="-102" r="5" fill="#B8824F"/><circle cx="-2" cy="-113" r="11" fill="#B8824F"/><path d="M-13,-112Q-14,-98 -5,-97Q2,-98 4,-106Q-4,-102 -13,-112Z" fill="#3B2A20"/><path d="M-14,-115Q-15,-130 -1,-130Q12,-129 10,-113Q-2,-120 -14,-115Z" fill="#FAF5E8"/><path d="M2,-118Q11,-122 10,-113Q8,-117 2,-118Z" fill="#D9D0BC"/><path d="M-14,-116Q-2,-122 10,-115L10,-112Q-2,-119 -14,-113Z" fill="#3E6C9E"/><circle cx="-8.500" cy="-112.500" r="1.300" fill="#2B1D16"/></g>`.replace(/\.(\d)00/g, '.$1');
const pole = (x0, x1, y) => `<path d="M${x0},${y - 4}H${x1}V${y + 4}H${x0}Z" fill="#DDA02E"/><path d="M${x0},${y - 4}H${x1}V${y - 1.5}H${x0}Z" fill="#F7D36B"/><path d="M${x0},${y + 2}H${x1}V${y + 4}H${x0}Z" fill="#AE7A1E"/><circle cx="${x0}" cy="${y}" r="5" fill="#F7D36B"/><circle cx="${x1}" cy="${y}" r="5" fill="#C48D26"/>`;
P(`<g id="alt02-arkgroup" transform="translate(480,776) scale(1.08)">
<g fill="#9A6238" opacity=".3"><ellipse cx="-98" cy="2" rx="34" ry="7"/><ellipse cx="138" cy="2" rx="34" ry="7"/><ellipse cx="-66" cy="-18" rx="30" ry="6"/><ellipse cx="170" cy="-18" rx="30" ry="6"/><ellipse cx="40" cy="-4" rx="78" ry="12"/></g>
<g id="alt02-priests-far">${priestBody(-84, -20, .93)}${priestBody(152, -20, .93)}${pole(-124, 190, -114)}${priestHead(-84, -20, .93)}${priestHead(152, -20, .93)}</g>
<g id="alt02-ark">
<path d="M-67,-171L66,-171L102,-192L-31,-192Z" fill="#5587C4"/>
<path d="M-31,-192L102,-192L99,-189L-27,-189Z" fill="#6494CD"/>
<path d="M-67,-171L66,-171L68,-88Q58,-81 48,-86Q38,-92 26,-85Q14,-79 2,-85Q-10,-91 -22,-85Q-36,-79 -48,-85Q-60,-90 -69,-83Z" fill="#37649F"/>
<path d="M66,-171L102,-192L104,-110Q96,-101 88,-104Q78,-93 68,-88Z" fill="#264B7D"/>
<path d="M-67,-171L66,-171L66,-166L-67,-166Z" fill="#6494CD"/>
<path d="M-46,-166Q-49,-128 -53,-86L-46,-84Q-43,-128 -41,-166ZM10,-166Q7,-126 4,-85L12,-82Q14,-126 16,-166ZM40,-166Q40,-128 36,-88L43,-88Q46,-128 46,-166Z" fill="#2D5890"/>
<path d="M-24,-166Q-22,-124 -27,-83L-20,-84Q-16,-126 -18,-166ZM26,-166Q28,-128 24,-85L29,-86Q33,-128 31,-166ZM-62,-166Q-62,-128 -66,-85L-61,-88Q-58,-128 -58,-166Z" fill="#4A7BB8"/>
<path d="M58,-171L66,-171L68,-88L61,-86Q65,-130 58,-171Z" fill="#264B7D"/>
<path d="M80,-179L87,-183L89,-104L83,-99ZM96,-188L102,-192L104,-110L99,-106Z" fill="#1F3F6B"/>
</g>
<g id="alt02-priests-near">${priestBody(-118, 0, 1)}${priestBody(118, 0, 1)}${pole(-158, 158, -98)}
${priestHead(-118, 0, 1)}${priestHead(118, 0, 1)}</g>
</g>`);

/* ---------- people going down the near bank (lower bodies hidden by the bank edge) ---------- */
shadowsOut.length = 0;
P(`<g id="alt02-descending">${person(800, 778, 128, -1, { robe: '#C58E5E', cloth: '#E9DDBF', noShadow: 1, bundle: '#B58F5A', lean: -3 })}${person(872, 760, 90, -1, { robe: '#D2A95F', cloth: '#C9B287', noShadow: 1, lean: -2 })}${person(846, 772, 134, -1, { robe: '#5F8189', cloth: '#FBF7EE', noShadow: 1, veil: 1, lean: -3 })}</g>`);

/* ---------- near bank ---------- */
const edge = `M0,806C50,776 150,768 232,798C284,820 300,878 384,894S530,876 604,828S770,724 905,690`;
P(`<g id="alt02-nearbank"><path d="${edge}V1200H0Z" fill="url(#alt02-g-bank)"/>`);
P(`<path d="${edge}V702C770,738 690,790 610,840S470,908 384,906S286,840 230,812C150,784 60,790 0,820Z" fill="#A9C264" opacity=".8"/>`);
// trodden path where the people come down
P(`<path d="M905,716C860,728 830,744 812,770C790,810 800,880 770,950S660,1100 640,1200H820C830,1100 880,1000 905,940Z" fill="#CDBE8A" opacity=".6"/>
<path d="M905,760C870,770 850,790 842,820C830,870 840,930 812,990S740,1120 730,1200H790C800,1110 850,1020 880,960L905,930Z" fill="#DDCB95" opacity=".55"/>`);
P(`<path d="M300,960C360,940 450,950 500,980S440,1030 370,1020S270,980 300,960Z" fill="#6A8644" opacity=".7"/>
<path d="M0,1010C80,990 200,1000 260,1040S180,1100 90,1090S0,1060 0,1010Z" fill="#5F7B3E" opacity=".6"/>
<path d="M380,1090C460,1070 560,1076 620,1110S580,1170 500,1166S330,1130 380,1090Z" fill="#5A753B" opacity=".6"/>
<path d="M50,956C94,946 224,946 264,960S224,980 164,980S24,970 50,956Z" fill="#4F6936" opacity=".55"/>`);
const tuftsBy = {};
const tuft = (x, y, s, c) => { (tuftsBy[c] = tuftsBy[c] || []).push(`<use href="#alt02-tf" ${T(x, y, s)}/>`); };
const flushTufts = () => { let o = ''; for (const c in tuftsBy) { o += `<g fill="${c}">${tuftsBy[c].join('')}</g>`; delete tuftsBy[c]; } return o; };
const edgeY = x => {
  const pts = [[0, 806], [60, 782], [150, 774], [232, 798], [290, 850], [384, 894], [470, 892], [540, 866], [604, 828], [700, 772], [800, 724], [905, 690]];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const k = (x - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]); return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k; }
  return 690;
};
for (let x = 6; x < 900; x += R(13, 24)) tuft(x, edgeY(x) + R(1, 5), R(.8, 1.3), pick(['#7C9A4C', '#8FAA55', '#6F8C45']));
for (let i = 0; i < 52; i++) { const x = R(0, 900); const y = R(edgeY(x) + 30, 1190); tuft(x, y, R(.9, 1.9) * (0.7 + (y - 700) / 900), pick(['#89A552', '#6A8644', '#9AB45C', '#5F7B3E'])); }
P(flushTufts());
// reeds
let rd = '';
for (let i = 0; i < 9; i++) { const x = 676 + i * 12 + R(-3, 3); rd += `<use href="#alt02-rd" ${T(x, edgeY(x) + 16, [R(.8, 1.1), R(.7, 1.1)], R(-9, 9))}/>`; }
for (let i = 0; i < 6; i++) { const x = 318 + i * 11 + R(-3, 3); rd += `<use href="#alt02-rd" ${T(x, edgeY(x) + 16, [R(.7, 1), R(.5, .8)], R(-9, 9))}/>`; }
P(`<g fill="#8A6238" color="#6F8C45">${rd}</g>`);
// bushes
P(`<use href="#alt02-bu" ${T(34, 900, 1.3)} fill="#5F7F42" color="#F3C9C0"/><use href="#alt02-bu" ${T(560, 1010, 1.9)} fill="#567540" color="#FBF7EE"/><use href="#alt02-bu" ${T(330, 1150, 2.2)} fill="#4E6C3A" color="#F3C9C0"/>`);
// ripe grain on the lower right
let gr = '';
for (let i = 0; i < 30; i++) { const x = R(600, 760) + (i % 3) * 40, y = R(1000, 1130); gr += `<use href="#alt02-gr" ${T(x, y, [R(.9, 1.2), R(.9, 1.4)], R(-10, 12))}/>`; }
P(`<g fill="#E9CB6A" color="#C9A548">${gr}</g>`);
let fl = '';
for (let i = 0; i < 30; i++) { const x = R(10, 890); const y = R(edgeY(x) + 40, 1180); fl += `<circle cx="${i0(x)}" cy="${i0(y)}" r="${n(R(2, 3.4))}" fill="${pick(['#FBF7EE', '#F7D36B', '#F3E3B0'])}"/>`; }
P(fl);
P(stone(430, 990, 1.6, '#9C8F7C') + stone(468, 1000, .9, '#8F8272') + stone(300, 930, 1.2, '#A2917B') + stone(744, 868, 1.2, '#9C8F7C') + stone(540, 926, .8, '#A2917B') + stone(180, 1100, 1.5, '#8F8272'));
P(`</g>`);

/* ---------- Joshua ---------- */
P(`<g id="alt02-leader" transform="translate(150,952) scale(1.14)">
<ellipse cx="30" cy="2" rx="54" ry="9" fill="#3F5529" opacity=".45"/>
<path d="M-18,-6h20v8h-23zM8,-6h22v8h-25z" fill="#6B4528"/><path d="M-12,-14h10v9h-10zM12,-14h10v9h-10z" fill="#B07A48"/>
<path d="M-20,-12L-22,-110Q-20,-150 2,-158Q22,-152 24,-112L28,-12Z" fill="#F0E4C6"/>
<path d="M12,-12L13,-150Q22,-146 24,-112L28,-12Z" fill="#D9CBA6"/>
<path d="M-20,-12H28V-19H-20Z" fill="#C9A04A"/>
<path d="M2,-99L26,-101V-91L2,-89Z" fill="#8A5A3A"/><path d="M17,-100L26,-101V-91L17,-90Z" fill="#6E452B"/>
<path d="M-31,-30Q-37,-100 -29,-138Q-23,-160 -2,-165Q11,-163 15,-152L11,-120Q4,-70 7,-30Q-12,-24 -31,-30Z" fill="#A63A2E"/>
<path d="M-31,-30Q-37,-100 -29,-138Q-25,-152 -16,-159Q-23,-100 -19,-28Z" fill="#C5533D"/>
<path d="M-3,-28Q-5,-80 3,-130L11,-120Q4,-70 7,-30Z" fill="#7F2A24"/>
<path d="M-31,-30Q-12,-24 7,-30L6.600,-39Q-12,-33 -31.800,-39Z" fill="#E3B54C"/><path d="M-32,-43Q-12,-37 6.400,-43L6.300,-46Q-12,-40 -32.300,-46Z" fill="#E3B54C"/>
<path d="M4,-158L66,-184L72,-171Q42,-150 23,-110L11,-120Z" fill="#A63A2E"/>
<path d="M23,-110Q42,-150 72,-171L66,-166Q40,-144 30,-112Z" fill="#7F2A24"/>
<path d="M-2,-164Q14,-160 22,-166L66,-184L64,-188L20,-171Q10,-166 -2,-164Z" fill="#C5533D"/>
<path d="M60,-185L86,-195L90,-184L66,-172Z" fill="#F0E4C6"/><path d="M63,-176L88,-187L90,-184L66,-172Z" fill="#D9CBA6"/>
<path d="M84,-195L100,-201L103,-192L88,-185Z" fill="#B07A48"/>
<path d="M98,-201Q106,-204 109,-199L118,-202L119,-198.500L110,-195Q108,-190 102,-191Z" fill="#B07A48"/>
<path d="M-1,-162h12v9h-12z" fill="#A06C3E"/>
<circle cx="6" cy="-180" r="17" fill="#B07A48"/>
<path d="M21,-183L27,-177L21,-174Z" fill="#B07A48"/>
<path d="M-11,-180Q-14,-199 6,-198.500Q23,-198 22,-187Q11,-192 -1,-186L-4,-170Q-11,-172 -11,-180Z" fill="#33241C"/>
<path d="M0,-172Q5,-160 15,-162Q23,-166 22,-175Q15,-170 7,-174Z" fill="#33241C"/>
<path d="M-11,-187Q5,-196 22,-190L22,-186Q5,-192 -11,-183Z" fill="#2F5D7C"/><path d="M-11,-187L-22,-178L-20,-171L-10,-182Z" fill="#2F5D7C"/>
<circle cx="15" cy="-181" r="1.800" fill="#22160F"/>
</g>`.replace(/\.(\d)00/g, '.$1'));
// foreground grasses
tuft(104, 964, 1.8, '#5F7B3E'); tuft(206, 968, 1.6, '#6A8644'); tuft(40, 1050, 2.6, '#4F6936'); tuft(860, 1030, 2.4, '#4F6936'); tuft(470, 1070, 2.2, '#57713A');
P(`<g id="alt02-fore">${flushTufts()}</g>`);

P(`</g></svg>`);
const svg = out.join('\n').replace(/\n+/g, '\n').replace(/>\n</g, '><');
fs.writeFileSync(process.argv[2], svg);
console.log('bytes', Buffer.byteLength(svg));
