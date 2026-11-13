// Generator for the three explorers + time machine. Output: web/assets/char/*.svg
const fs = require('fs'), path = require('path');
const OUT = '/home/user/bible_onyou/web/assets/char';

const C = {
  skin: '#F6CFAB', skinSh: '#E8B28B', blush: '#F0907C', eye: '#2B2530', mouth: '#B8574B',
  ivory: '#FBF7EE', cream: '#F3E9D6', creamSh: '#DCCDB2',
  brass: '#DDA945', brassHi: '#F4D27A', brassSh: '#B9832F', brassDp: '#8C5E24',
  leather: '#9A6238', leatherSh: '#7A4A28', navy: '#16233F',
};

// limb: thick rounded stroke with a one-step-darker shade along its lower-right side
const limb = (p, d, w, base, sh, k = 3.5) =>
  `<path class="${p}l" d="${d}" stroke="${sh}" stroke-width="${w}"/>` +
  `<path class="${p}l" d="${d}" transform="translate(${-k / 2} ${-k / 4})" stroke="${base}" stroke-width="${w - k}"/>`;

const grip = (p, x, y, a = 0) => `<path class="${p}l" transform="rotate(${a} ${x} ${y})" d="M${x - 3.5} ${y - 1.5}q3.500 2 7 0M${x - 3} ${y + 3}q3 2 6 0" stroke="${C.skinSh}" stroke-width="1.500"/>`;
const hand = (x, y, r = 9, tx = 0, ty = 0) =>
  `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.05}" fill="${C.skinSh}"/>` +
  `<ellipse cx="${x - 1}" cy="${y - .8}" rx="${r - 1.2}" ry="${r * 1.05 - 1.2}" fill="${C.skin}"/>` +
  (tx || ty ? `<ellipse cx="${x + tx}" cy="${y + ty}" rx="${r * .42}" ry="${r * .55}" fill="${C.skin}"/>` : '');

// small brass compass badge shared by all three (echoes the time machine dial)
const badge = (x, y, r = 6) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.brassSh}"/><circle cx="${x - .5}" cy="${y - .5}" r="${r - 1.3}" fill="${C.brassHi}"/>` +
  `<path d="M${x} ${y - r + 2}l1.4 ${r - 3.4}l${r - 3.4} 1.4l${-(r - 3.4)} 1.4l-1.4 ${r - 3.4}l-1.4 ${-(r - 3.4)}l${-(r - 3.4)}-1.4l${r - 3.4}-1.4z" fill="${C.brassDp}"/>`;

// shoe/boot. Local origin = ankle centre, sole bottom at y=34. dir -1 = toe to the left.
function shoe(x, footY, sc, dir, o) {
  const t = `translate(${x} ${footY - 34 * sc}) scale(${dir * -sc} ${sc})`;
  let s = `<g transform="${t}">`;
  s += `<path d="M-11 0h22q2 0 2 2v18q0 14-12 14h-15q-11 0-10-9q1-7 9-10q5-2 4-8z" fill="${o.base}"/>`;
  if (o.toe) s += `<path d="M-24 25q1-7 9-10q3-1 4-3q2 9-3 17q-10 3-10-4z" fill="${o.toe}"/>`;
  if (dir < 0) s += `<path d="M13 6v14q0 14-12 14h-6q10-3 10-16v-12z" fill="${o.sh}"/>`;
  else if (!o.toe) s += `<path d="M-24 25q1-7 9-10q3-1 4-3q2 9-3 17q-10 3-10-4z" fill="${o.sh}" opacity=".75"/>`;
  else s += `<path d="M-15 14q4 8 0 19h-6q5-9 2-17z" fill="${o.sole}" opacity=".7"/>`;
  s += `<path d="M-23.5 27q0 7 9.500 7h15q8 0 11-7q-18 3-35.500 0z" fill="${o.sole}"/>`;
  if (o.cuff) s += `<rect x="-12.500" y="-3" width="27" height="8" rx="3.500" fill="${o.cuff}"/>`;
  if (o.lace) s += `<path class="${o.p}l" d="M-9 11q4-2 8 0M-11 16q5-2 10 0" stroke="${o.lace}" stroke-width="2"/>`;
  return s + '</g>';
}

// ---------- head (unit coords: face about 92 wide, centre 0,0) ----------
function head(p, o) {
  const { jy, jw, chin } = o.face;
  const face = `M-46-6C-46-38-28-52 0-52C28-52 46-38 46-6C46 ${jy} ${jw} ${chin} 0 ${chin}C${-jw} ${chin}-46 ${jy}-46-6Z`;
  let s = '';
  s += `<path d="${o.hairBack}" fill="${o.hairSh}"/>`;
  if (o.ears) {
    s += `<ellipse cx="-46" cy="7" rx="7.500" ry="10" fill="${C.skin}"/><ellipse cx="47" cy="7" rx="7.500" ry="10" fill="${C.skinSh}"/>`;
    s += `<ellipse cx="-47" cy="8" rx="3" ry="5" fill="${C.skinSh}"/>`;
  }
  s += `<path d="${face}" fill="${C.skin}"/>`;
  s += `<clipPath id="${p}fc"><path d="${face}"/></clipPath><g clip-path="url(#${p}fc)">`;
  s += `<path d="M47-14C47 ${jy} ${jw + 2} ${chin + 1} 2 ${chin + 2}C${jw - 8} ${chin - 5} 38 ${jy - 6} 39-14Z" fill="${C.skinSh}" opacity=".7"/>`;
  s += `<path d="${o.hairFront}" transform="translate(1.500 5.500)" fill="${C.skinSh}"/>`;
  s += `<ellipse cx="-28" cy="20" rx="9.500" ry="6.500" fill="${C.blush}" opacity=".5"/><ellipse cx="29" cy="20" rx="9.500" ry="6.500" fill="${C.blush}" opacity=".55"/>`;
  s += '</g>';
  const e = o.eye;
  for (const x of [-19, 19]) {
    s += `<ellipse cx="${x}" cy="6" rx="${e[0]}" ry="${e[1]}" fill="${C.eye}"/><circle cx="${x - 1.6}" cy="${6 - e[1] * .4}" r="1.500" fill="#fff"/>`;
  }
  s += `<path class="${p}l" d="${o.brows}" stroke="${o.hairSh}" stroke-width="${o.browW || 2.6}"/>`;
  s += `<path class="${p}l" d="M-2.500 15.500q2.500 3 5.500 0" stroke="${C.skinSh}" stroke-width="2.400"/>`;
  s += o.mouth;
  if (o.glasses) s += o.glasses;
  s += `<path d="${o.hairFront}" fill="${o.hair}"/>`;
  s += o.hairExtra || '';
  return s;
}

const mouthLine = (p, d) => `<path class="${p}l" d="${d}" stroke="${C.mouth}" stroke-width="2.800"/>`;

// ====================== CHOEON (10, girl) ======================
function choeon(p, av) {
  const hair = '#5E3D2E', hairHi = '#80573F', hairSh = '#452B20';
  const co = '#EE7B62', coSh = '#D2604A', coHi = '#F7A48E', ye = '#F6D078', yeSh = '#DFB054',
    de = '#5F7FAE', deSh = '#4A6690', deHi = '#8AA6CE', bo = '#F2B544', boSh = '#D4952C';
  let s = '';
  // backpack peeking behind
  s += `<rect x="109" y="266" width="82" height="80" rx="18" fill="#6F8448"/><path d="M182 268q9 4 9 16v44q0 13-9 17z" fill="#566D38"/>`;
  if (!av) {
    s += limb(p, 'M131 386L130 448', 17, C.skin, C.skinSh) + limb(p, 'M169 386L171 448', 17, C.skin, C.skinSh);
    s += `<path class="${p}l" d="M126 420q4 3 8 0M167 420q4 3 8 0" stroke="${C.skinSh}" stroke-width="2.200"/>`;
    // socks
    for (const x of [121, 162]) s += `<rect x="${x}" y="438" width="18" height="32" rx="2" fill="#F6EEDD"/><rect x="${x + 13.5}" y="438" width="4.500" height="32" fill="${C.creamSh}"/>`;
    s += `<path d="M121 444h18M121 451h18M162 444h18M162 451h18" stroke="${co}" stroke-width="3.200" fill="none"/>`;
    const b = { p, base: bo, sh: boSh, sole: C.brassDp, cuff: '#F8CD6E' };
    s += shoe(129, 500, 1, -1, b) + shoe(172, 500, 1, 1, b);
    // shorts
    s += `<path d="M115 346h70l3 44q-17 4-34 1l-4-14l-4 14q-17 3-34-1z" fill="${de}"/>`;
    s += `<path d="M115 346h70l.8 12q-36 6-71.500 0z" fill="${deSh}"/><path d="M177 352h8.400l2.600 38l-9 1.800q1-20-2-39.800z" fill="${deSh}"/>`;
    s += `<path d="M138 362q1 15-2 29l10 .5l4-14.500z" fill="${deSh}" opacity=".55"/>`;
    s += `<path class="${p}l" d="M113.500 386q16 4 31.500 1M155 387q16 3 32-1" stroke="${deHi}" stroke-width="4.500"/>`;
  }
  // arms (bare, short yellow sleeves)
  s += limb(p, 'M122 277L113 309L111 337', 14, C.skin, C.skinSh);
  s += limb(p, 'M122 275L116 294', 20, ye, yeSh);
  s += hand(111, 341, 8.5, 5.5, -1);
  s += limb(p, 'M178 277L195 303L205 279', 14, C.skin, C.skinSh);
  s += limb(p, 'M178 275L187 292', 20, ye, yeSh);
  // neck
  s += `<path d="M143 244h14v20q-7 6-14 0z" fill="${C.skin}"/><path d="M143 246h14v10q-7 5-14 0z" fill="${C.skinSh}"/>`;
  // tee
  s += `<path d="M134 261q16 12 32 0l14 5l3 86h-66l3-86z" fill="${ye}"/><path d="M137 263q13 11 27 .5q-3 9-13.500 9q-10 0-13.500-9.500z" fill="${yeSh}"/>`;
  // vest
  const vest = 'M136 260L150 296L164 260L179 265Q184 267 183 274Q179 286 181 300L184 349Q150 360 116 349L119 300Q121 286 117 274Q116 267 121 265Z';
  s += `<path d="${vest}" fill="${co}"/><clipPath id="${p}vc"><path d="${vest}"/></clipPath><g clip-path="url(#${p}vc)">`;
  s += `<path d="M174 255Q169 310 173 365H192V255Z" fill="${coSh}"/>`;
  s += `<path d="M110 340q40 12 80 0v25h-80z" fill="${coSh}" opacity=".55"/>`;
  s += '</g>';
  s += `<path d="M136 260L150 296L141.500 289L129.500 267.500Z" fill="${coHi}"/><path d="M164 260L150 296L158.500 289L170.500 267.500Z" fill="#F38F78"/>`;
  s += `<path d="M150 296V353" stroke="#FBE6B8" stroke-width="2.400" fill="none"/><rect x="148" y="297" width="4" height="8" rx="1.500" fill="${C.brassSh}"/>`;
  // pockets
  for (const x of [124, 157]) {
    s += `<rect x="${x}" y="319" width="19" height="22" rx="3.500" fill="#F38F78"/><path d="M${x - 1} 317h21v6l-10.500 4.500l-10.500-4.500z" fill="${coSh}"/><circle cx="${x + 9.5}" cy="323.500" r="1.700" fill="${C.brassHi}"/>`;
  }
  // straps + badge
  s += `<path class="${p}l" d="M127 263Q122 288 120 314" stroke="${C.leather}" stroke-width="6.500"/><path class="${p}l" d="M173 263Q178 288 180 314" stroke="${C.leatherSh}" stroke-width="6.500"/>`;
  s += `<rect x="119.500" y="290" width="7" height="6" rx="1.500" fill="${C.brassHi}"/><rect x="174.500" y="290" width="7" height="6" rx="1.500" fill="${C.brass}"/>`;
  s += badge(136, 305, 5.5);
  // spyglass + right hand
  s += `<g transform="translate(206 276) rotate(${av ? 5 : 24})">`;
  s += `<rect x="-4.500" y="-4" width="9" height="22" rx="2" fill="${C.brassSh}"/>`;
  s += `<rect x="-6.500" y="-26" width="13" height="24" rx="2" fill="${C.brass}"/><rect x="2" y="-26" width="4.500" height="24" rx="2" fill="${C.brassSh}"/>`;
  s += `<rect x="-9" y="-52" width="18" height="28" rx="2.500" fill="${C.brass}"/><rect x="3.500" y="-52" width="5.500" height="28" rx="2.500" fill="${C.brassSh}"/><rect x="-6" y="-48" width="2.600" height="21" rx="1.300" fill="${C.brassHi}"/>`;
  s += `<rect x="-11" y="-58" width="22" height="8" rx="3" fill="${C.brassDp}"/><ellipse cx="0" cy="-58" rx="11" ry="3.800" fill="#7AD0C8"/><ellipse cx="-3" cy="-58.500" rx="4.500" ry="1.500" fill="#DDF4F0"/>`;
  s += '</g>';
  s += hand(206, 277, 8.5, -6, 2) + grip(p, 207, 277, 24);
  // head
  const hf = 'M-60-8C-62-48-36-71 0-71C36-71 62-48 60-8C61 10 63 28 60 40C57 50 46 51 41 44C44 28 45 8 43-10C42-15 40-17 36-17C24-13 12-12 5-14L1-20L-3-14C-14-12-26-13-36-17C-40-17-42-15-43-10C-45 8-44 28-41 44C-46 51-57 50-60 40C-63 28-61 10-60-8Z';
  const o = {
    hair, hairSh, face: { jy: 24, jw: 31, chin: 44 }, eye: [5, 6.2],
    hairBack: 'M-58-8C-60-48-36-70 0-70C36-70 60-48 58-8C59 12 61 28 58 42C50 50 40 50 36 47H-36C-40 50-50 50-58 42C-61 28-59 12-58-8Z',
    hairFront: hf,
    brows: 'M-25-7q6-4 12-2M13-9q6-2 12 2',
    mouth: `<path d="M-8.500 24.500q8.500 3 17 0q-1 11-8.500 11q-7.500 0-8.500-11z" fill="${C.mouth}"/><path d="M-4.500 32q4.500-3 9 0q-2 3.500-4.500 3.500q-2.500 0-4.500-3.500z" fill="#EE8E7E"/>`,
    hairExtra:
      `<path d="M-48-20C-47-46-29-61-6-64C-25-56-38-42-41-19Z" fill="${hairHi}"/>` +
      `<path d="M-24-36q2 12 0 20q4-9 3-20zM20-38q0 13 3 22q2-11 0-22z" fill="${hairSh}" opacity=".7"/>` +
      `<path d="M55 6q3 18 0 34q5-16 3-34z" fill="${hairSh}" opacity=".6"/>` +
      `<g transform="rotate(-20 36 -24)"><rect x="27" y="-30" width="17" height="5" rx="2.500" fill="${co}"/><rect x="27" y="-22.500" width="17" height="5" rx="2.500" fill="${coHi}"/></g>`,
  };
  s += `<g transform="translate(150 218) rotate(-3) scale(.8)">${head(p, o)}</g>`;
  return s;
}

// ====================== HYU (13, boy) ======================
function hyu(p, av) {
  const hair = '#4A382F', hairHi = '#6C5445', hairSh = '#352721';
  const nb = av ? 14 : 0;
  const te = '#2F9C95', teSh = '#237A75', teHi = '#52B8B0', br = '#A9744A', brSh = '#8A5B38', brHi = '#C08C60';
  let s = '';
  s += `<rect x="105" y="212" width="90" height="92" rx="18" fill="#E0A93B"/>`;
  if (!av) {
    const b = { p, base: '#E4BE7E', sh: '#C99E5C', sole: C.leatherSh, lace: C.ivory, toe: '#EDD09A' };
    s += shoe(128, 500, 1.12, -1, b) + shoe(172, 500, 1.12, 1, b);
    const pants = 'M111 320h78l1 24l-4 126h-31l-4-116h-2l-4 116h-31l-4-126z';
    s += `<path d="${pants}" fill="${br}"/><clipPath id="${p}pc"><path d="${pants}"/></clipPath><g clip-path="url(#${p}pc)">`;
    s += `<path d="M100 318h100v16q-50 8-100 0z" fill="${brSh}"/>`;
    s += `<path d="M179 330Q184 400 178 472H194V330Z" fill="${brSh}"/><path d="M149 354Q144 410 136 472H150Z" fill="${brSh}"/>`;
    s += `<rect x="112" y="460" width="36" height="12" fill="${brHi}"/><rect x="152" y="460" width="36" height="12" fill="${brHi}"/>`;
    s += `<rect x="140" y="460" width="8" height="12" fill="${br}"/><rect x="180" y="460" width="8" height="12" fill="${br}"/>`;
    s += '</g>';
    s += `<rect x="161" y="384" width="19" height="24" rx="2.500" fill="${brHi}"/><path d="M160 382h21v7l-10.500 3l-10.500-3z" fill="${brSh}"/>`;
    s += `<path class="${p}l" d="M120 412q6 4 13 1M158 420q5 3 11 1" stroke="${brSh}" stroke-width="2.400"/>`;
  }
  // neck
  s += `<path d="M142 188h16v22q-8 7-16 0z" fill="${C.skin}"/><path d="M142 190h16v10q-8 6-16 0z" fill="${C.skinSh}"/>`;
  // jumper body
  const body = 'M133 202Q150 216 167 202L186 209Q193 212 193 221L190 320Q150 329 110 320L107 221Q107 212 114 209Z';
  s += `<path d="${body}" fill="${te}"/><clipPath id="${p}bc"><path d="${body}"/></clipPath><g clip-path="url(#${p}bc)">`;
  s += `<path d="M180 200Q175 270 180 335H200V200Z" fill="${teSh}" opacity=".75"/>`;
  s += `<path d="M100 309Q150 318 200 309V335H100Z" fill="${teSh}"/>`;
  s += '</g>';
  s += `<path d="M150 214V319" stroke="${teSh}" stroke-width="2.600" fill="none"/>`;
  s += `<path d="M130 200Q150 220 170 200L173 207Q150 231 127 207Z" fill="${teHi}"/><path d="M150 216Q162 211 170 200L173 207Q162 222 150 225Z" fill="${te}"/>`;
  s += `<rect x="147.500" y="218" width="5" height="9" rx="2" fill="${C.cream}"/>`;
  s += `<path class="${p}l" d="M118 286l7 15M182 286l-7 15" stroke="${teSh}" stroke-width="3"/>`;
  s += `<path class="${p}l" d="M131 205Q126 222 124 236" stroke="${C.leather}" stroke-width="6.500"/><path class="${p}l" d="M169 205Q174 222 176 236" stroke="${C.leatherSh}" stroke-width="6.500"/>`;
  s += badge(166, 230, 5.5);
  // pencil (tip goes behind the notebook)
  s += `<g transform="translate(175 246) rotate(20)"><rect x="-3.200" y="-36" width="6.400" height="52" fill="#F6C343"/><rect x=".6" y="-36" width="2.600" height="52" fill="#DCA02C"/><path d="M-3.200 16h6.400l-3.200 9z" fill="#EBCFA3"/><path d="M-1.200 21.500h2.400l-1.200 3.500z" fill="#3B3340"/><rect x="-3.400" y="-41" width="6.800" height="6" fill="#D9D3C4"/><rect x="-3.400" y="-49" width="6.800" height="9" rx="2.800" fill="#EE7B62"/></g>`;
  // notebook
  s += `<g transform="translate(147 ${270 + nb}) rotate(-7)"><rect x="-21" y="-25" width="46" height="56" rx="3" fill="${C.creamSh}"/><rect x="-23" y="-28" width="46" height="56" rx="3.500" fill="#F2B544"/><rect x="15" y="-28" width="8" height="56" rx="3.500" fill="#D4952C"/><rect x="10" y="-28" width="3.600" height="56" fill="#EE7B62"/><rect x="-16" y="-14" width="20" height="13" rx="2" fill="${C.ivory}"/>`;
  for (let i = 0; i < 7; i++) s += `<rect x="${-19 + i * 6}" y="-32" width="2.800" height="8" rx="1.400" fill="#8A7F74"/>`;
  s += '</g>';
  // left arm (holds the notebook from below)
  s += limb(p, `M114 222L101 270L${121} ${288 + nb}`, 19, te, teSh);
  s += cuff(p, [113.5, 281.5 + nb], [116.5, 284 + nb], 19, C.cream) + cuff(p, [117, 284.5 + nb], [123, 290 + nb], 20, teSh);
  s += `<path class="${p}l" d="M95 266q6 5 12 3" stroke="${teSh}" stroke-width="2.400"/>`;
  s += hand(129, 295 + nb, 9.5, 2, -7) + grip(p, 129, 296 + nb, -10);
  // right arm (pencil)
  s += limb(p, 'M186 222L201 268L185 255', 19, te, teSh);
  s += cuff(p, [192, 260.5], [189.5, 258.500], 19, C.cream) + cuff(p, [189, 258], [182.5, 253], 20, teSh);
  s += `<path class="${p}l" d="M196 262q5 3 9-1" stroke="${teSh}" stroke-width="2.400"/>`;
  s += hand(175, 247, 9.5, -5, -4) + grip(p, 176, 247, 20);
  // head
  const o = {
    hair, hairSh, ears: 1, face: { jy: 22, jw: 28, chin: 46 }, eye: [4.2, 5],
    hairBack: 'M-51 0C-57-44-35-68 0-68C35-68 57-44 51 0L46 4H-46Z',
    hairFront: 'M-50-2C-57-44-35-69 0-69C35-69 57-44 50-2L45-4C45-10 45-16 43-22C30-19 8-22-8-31C-13-34-17-37-19-42C-23-32-32-25-43-22C-45-16-45-10-45-4Z',
    brows: 'M-25-12q6-2 12 0M13-12q6-2 12 0',
    mouth: mouthLine(p, 'M-6 27q6 5 13-1'),
    glasses:
      `<circle cx="-19.500" cy="6" r="14" fill="#fff" opacity=".28"/><circle cx="19.500" cy="6" r="14" fill="#fff" opacity=".28"/>` +
      `<path class="${p}l" d="M-5.500 4q5.500-4 11 0M-33.500 4L-46 1M33.500 4L46 1" stroke="#2E5F66" stroke-width="3"/>` +
      `<circle cx="-19.500" cy="6" r="14" fill="none" stroke="#2E5F66" stroke-width="3.200"/><circle cx="19.500" cy="6" r="14" fill="none" stroke="#2E5F66" stroke-width="3.200"/>` +
      `<path class="${p}l" d="M-28 0q3-5 8-6M11 0q3-5 8-6" stroke="#fff" stroke-width="2" opacity=".7"/>`,
    hairExtra:
      `<path d="M2-67C3-77 12-82 19-77C13-76 10-72 10-66Z" fill="${hair}"/>` +
      `<path d="M-46-24C-45-48-27-61-5-63C-23-56-36-44-39-25Z" fill="${hairHi}"/>` +
      `<path d="M-14-48C0-38 18-32 38-29C20-36 4-44-9-54Z" fill="${hairHi}" opacity=".8"/>` +
      `<path d="M-19-42q-2-8 2-16q-1 9 2 16z" fill="${hairSh}"/>`,
  };
  s += `<g transform="translate(150 161) rotate(2) scale(.78)">${head(p, o)}</g>`;
  return s;
}

// ====================== ONWOO (16, boy) ======================
function onwoo(p, av) {
  const hair = '#3F3540', hairHi = '#625468', hairSh = '#2C252E';
  const ind = '#4E5FB0', inSh = '#3C4B92', inHi = '#7080CC', sa = '#DCC293', saSh = '#BFA070', saHi = '#EDDAB4';
  const lift = av ? 30 : 0;
  let s = '';
  s += `<rect x="106" y="170" width="88" height="96" rx="18" fill="${C.leather}"/>`;
  if (!av) {
    const b = { p, base: '#5565B5', sh: inSh, sole: '#CDBFA3', toe: '#F3EBDB', lace: C.ivory };
    s += shoe(127, 500, 1.2, -1, b) + shoe(173, 500, 1.2, 1, b);
    const pants = 'M110 288h80l1 28l-5 156h-31l-4-146h-2l-4 146h-31l-5-156z';
    s += `<path d="${pants}" fill="${sa}"/><clipPath id="${p}pc"><path d="${pants}"/></clipPath><g clip-path="url(#${p}pc)">`;
    s += `<path d="M100 286h100v20q-50 8-100 0z" fill="${saSh}"/>`;
    s += `<path d="M179 300Q185 390 178 474H196V300Z" fill="${saSh}"/><path d="M149 328Q144 400 135 474H150Z" fill="${saSh}"/>`;
    s += `<rect x="108" y="459" width="38" height="14" fill="${saHi}"/><rect x="154" y="459" width="38" height="14" fill="${saHi}"/>`;
    s += `<rect x="138" y="459" width="8" height="14" fill="${sa}"/><rect x="180" y="459" width="8" height="14" fill="${sa}"/>`;
    s += '</g>';
    s += `<path class="${p}l" d="M118 312q8 6 6 20M182 312q-8 6-6 20M119 392q7 4 14 1M158 400q6 3 12 1" stroke="${saSh}" stroke-width="2.600"/>`;
  }
  // neck
  s += `<path d="M141 142h18v26q-9 7-18 0z" fill="${C.skin}"/><path d="M141 144h18v11q-9 6-18 0z" fill="${C.skinSh}"/>`;
  // tee
  s += `<path d="M137 160Q150 173 163 160L192 170V296H108V170Z" fill="${C.ivory}"/>`;
  s += `<path d="M137 160Q150 173 163 160L165 164Q150 180 135 164Z" fill="${C.creamSh}"/>`;
  s += `<path d="M132 170h9l-2 130h-7zM159 170h9v130h-7z" fill="${C.creamSh}"/>`;
  s += `<path d="M130 232h40v5h-40zM130 242h40v5h-40z" fill="${inHi}" opacity=".8"/>`;
  // jacket panels
  const jl = 'M137 159L109 169Q102 172 102 181L105 300Q120 305 135 302L136 200Q136 180 142 167Z';
  const jr = 'M163 159L191 169Q198 172 198 181L195 300Q180 305 165 302L164 200Q164 180 158 167Z';
  s += `<path d="${jl}" fill="${ind}"/><path d="${jr}" fill="${ind}"/>`;
  s += `<clipPath id="${p}jc"><path d="${jl}"/><path d="${jr}"/></clipPath><g clip-path="url(#${p}jc)">`;
  s += `<path d="M184 160Q178 230 184 310H200V160Z" fill="${inSh}"/><path d="M129 190Q132 250 129 310H140V190Z" fill="${inSh}" opacity=".6"/>`;
  s += `<path d="M98 287q52 9 104 0v20H98z" fill="${inSh}"/>`;
  s += '</g>';
  s += `<path d="M137 158L146 167L139 188L126 168Z" fill="${inHi}"/><path d="M163 158L154 167L161 188L174 168Z" fill="${inHi}"/>`;
  s += `<path class="${p}l" d="M112 262l10 14" stroke="${inSh}" stroke-width="3"/>`;
  s += `<path d="M137.500 186Q136 194 136 202V288M162.500 186Q164 194 164 202V288" stroke="#AEB8E6" stroke-width="1.600" fill="none"/>`;
  s += `<path class="${p}l" d="M125 166Q119 196 116 226" stroke="${C.leather}" stroke-width="6.500"/><path class="${p}l" d="M175 166Q181 196 184 226" stroke="${C.leatherSh}" stroke-width="6.500"/>`;
  s += badge(122, 212, 6);
  // left arm relaxed
  s += limb(p, 'M107 183L100 240L102 290', 21, ind, inSh);
  s += cuff(p, [102, 283], [102.2, 292], 21, inSh);
  s += `<path class="${p}l" d="M93 236q6 5 12 2" stroke="${inSh}" stroke-width="2.400"/>`;
  s += hand(102.5, 305, 10, 6, -1);
  // book (no marks on the cover)
  s += `<g transform="translate(173 ${214 - lift}) rotate(5)">`;
  s += `<path d="M2 28v32l4-5l4 5v-32z" fill="#D9503F"/>`;
  s += `<rect x="-19" y="-29" width="45" height="64" rx="3" fill="${C.creamSh}"/><rect x="-19" y="-30" width="43.500" height="62.500" rx="2" fill="${C.cream}"/>`;
  s += `<rect x="-23" y="-33" width="45" height="64" rx="3.500" fill="#8A5230"/><rect x="-23" y="-33" width="8" height="64" rx="3.500" fill="#6B3C20"/>`;
  s += `<rect x="-10" y="-26" width="27" height="50" rx="2.500" fill="none" stroke="#A8693F" stroke-width="1.600"/>`;
  s += `<path d="M14-33h4.500q3.500 0 3.500 3.500v57q0 3.500-3.500 3.500h-4.500z" fill="#77442A"/>`;
  s += '</g>';
  // right arm carries the book
  s += limb(p, `M193 183L205 ${242 - lift * .75}L178 ${248.5 - lift}`, 21, ind, inSh);
  s += cuff(p, [185, 246.7 - lift], [176, 249 - lift], 21, inSh);
  s += `<path class="${p}l" d="M199 ${236 - lift * .75}q5 4 10 1" stroke="${inSh}" stroke-width="2.400"/>`;
  s += hand(166, 248 - lift, 10, 3, -8) + grip(p, 166, 249 - lift, 5);
  // head
  const o = {
    hair, hairSh, ears: 1, face: { jy: 20, jw: 25, chin: 49 }, eye: [4.2, 5], browW: 3.2,
    hairBack: 'M-51 0C-58-46-36-73 2-73C38-73 58-46 51 0L46 4H-46Z',
    hairFront: 'M-50-2C-58-46-36-74 2-74C38-74 58-46 50-2L45-4C45-12 44-18 42-24C36-26 28-33 23-43C16-31 2-23-12-20C-20-18-28-16-35-11C-36-17-40-22-43-24C-45-18-45-10-45-4Z',
    brows: 'M-26-10q7-3 13-1M13-11q6-2 13 1',
    mouth: mouthLine(p, 'M-7 28q7 6 15-1'),
    hairExtra:
      `<path d="M-46-28C-46-52-28-66-6-68C-24-60-37-46-39-28Z" fill="${hairHi}"/>` +
      `<path d="M19-50C6-37-12-29-30-22C-12-31 2-42 11-55Z" fill="${hairHi}" opacity=".8"/>` +
      `<path d="M23-43q3-9 0-17q-4 9 0 17z" fill="${hairSh}"/>`,
  };
  s += `<g transform="translate(150 115) rotate(-2) scale(.76)">${head(p, o)}</g>`;
  return s;
}

// ====================== wrappers ======================
const WHO = {
  choeon: { fn: choeon, head: [150, 218], k: 1.42, tint: '#FBD8CD', tint2: '#F7C2B3' },
  hyu: { fn: hyu, head: [150, 161], k: 1.44, tint: '#CBEAE5', tint2: '#A9DBD5' },
  onwoo: { fn: onwoo, head: [150, 115], k: 1.46, tint: '#D6DBF2', tint2: '#BCC4EA' },
};
const style = p => `<style>.${p}l{fill:none;stroke-linecap:round;stroke-linejoin:round}.${p}b{fill:none}</style>`;
// cuff: flat band across the end of a sleeve, from a to b
const cuff = (p, a, b, w, c) => `<path class="${p}b" d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" stroke="${c}" stroke-width="${w}"/>`;

function full(key) {
  const p = `${key}-full-`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 520">${style(p)}<g id="${p}body">${WHO[key].fn(p, false)}</g></svg>\n`;
}
function avatar(key) {
  const p = `${key}-av-`, w = WHO[key];
  const tx = 120 - w.head[0] * w.k, ty = 116 - w.head[1] * w.k;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">${style(p)}` +
    `<clipPath id="${p}clip"><circle cx="120" cy="120" r="120"/></clipPath><g clip-path="url(#${p}clip)">` +
    `<circle id="${p}bg" cx="120" cy="120" r="120" fill="${w.tint}"/>` +
    `<path d="M0 176Q120 136 240 176V240H0Z" fill="${w.tint2}"/>` +
    `<g id="${p}body" transform="translate(${+tx.toFixed(1)} ${+ty.toFixed(1)}) scale(${w.k})">${w.fn(p, true)}</g></g></svg>\n`;
}

// ====================== TIME MACHINE ======================
function timemachine() {
  const p = 'tm-', B = C.brass, Hi = C.brassHi, Sh = C.brassSh, Dp = C.brassDp;
  const r2 = n => +n.toFixed(1);
  const cubic = (a, b, c, d, t) => { const u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d; };
  const rivet = (x, y, r = 3.2) => `<circle cx="${r2(x + .7)}" cy="${r2(y + .8)}" r="${r}" fill="${Dp}"/><circle cx="${r2(x)}" cy="${r2(y)}" r="${r - .5}" fill="${Hi}"/>`;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480">`;
  s += `<style>.${p}l{fill:none;stroke-linecap:round;stroke-linejoin:round}@media (prefers-reduced-motion:no-preference){.${p}needle{transform-origin:0 0;animation:${p}spin 60s linear infinite}.${p}hour{transform-origin:0 0;animation:${p}spin 420s linear infinite}.${p}glow{animation:${p}pulse 4s ease-in-out infinite}@keyframes ${p}spin{to{transform:rotate(360deg)}}@keyframes ${p}pulse{50%{opacity:.25}}}</style>`;
  // ground shadow
  s += `<ellipse cx="240" cy="466" rx="150" ry="9" fill="${C.navy}" opacity=".14"/>`;
  // legs
  s += `<path class="${p}l" d="M240 400V448" stroke="${Dp}" stroke-width="20"/><ellipse cx="240" cy="452" rx="24" ry="8" fill="#6F4A1C"/>`;
  for (const d of [-1, 1]) {
    const x = v => 240 + d * v;
    s += `<path class="${p}l" d="M${x(84)} 384L${x(120)} 446" stroke="${Sh}" stroke-width="24"/>`;
    s += `<path class="${p}l" d="M${x(84) - 3} 384L${x(120) - 3} 446" stroke="${B}" stroke-width="14"/>`;
    s += `<ellipse cx="${x(124)}" cy="458" rx="32" ry="10" fill="${Dp}"/><ellipse cx="${x(124) - 2}" cy="455" rx="30" ry="8" fill="${Sh}"/>`;
  }
  // side handles
  for (const d of [-1, 1]) {
    const x = v => 240 + d * v;
    s += `<path class="${p}l" d="M${x(150)} 212C${x(186)} 212 ${x(186)} 296 ${x(150)} 296" stroke="${d < 0 ? Sh : Dp}" stroke-width="10"/>`;
  }
  // top lamp + hatch
  s += `<circle class="${p}glow" cx="240" cy="24" r="22" fill="#F7B733" opacity=".45"/>`;
  s += `<rect x="233" y="30" width="14" height="22" fill="${Sh}"/><circle cx="240" cy="24" r="12" fill="#F7B733"/><circle cx="236" cy="20" r="4.500" fill="#FCE9A8"/>`;
  s += `<path d="M192 70C192 34 288 34 288 70Z" fill="${B}"/><path d="M262 44C280 50 288 60 288 70H268C272 60 270 52 262 44Z" fill="${Sh}"/>`;
  // body
  const body = 'M240 60C334 60 402 136 402 244C402 348 336 422 240 422C144 422 78 348 78 244C78 136 146 60 240 60Z';
  s += `<path d="${body}" fill="${Sh}"/><clipPath id="${p}bc"><path d="${body}"/></clipPath><g clip-path="url(#${p}bc)">`;
  s += `<ellipse cx="222" cy="226" rx="162" ry="180" fill="${B}"/>`;
  s += `<ellipse cx="176" cy="160" rx="84" ry="96" fill="#E8BA57"/>`;
  s += `<path d="M112 150C124 112 152 88 186 80C150 96 130 122 122 154Z" fill="${Hi}"/>`;
  // bottom band
  s += `<path d="M60 304Q240 414 420 304V338Q240 448 60 338Z" fill="#C08A34"/><path d="M60 304Q240 414 420 304V310Q240 420 60 310Z" fill="${Hi}" opacity=".7"/>`;
  // top collar
  s += `<path d="M70 124Q240 44 410 124V102Q240 22 70 102Z" fill="#C08A34"/><path d="M70 124Q240 44 410 124V119Q240 39 70 119Z" fill="${Dp}" opacity=".35"/>`;
  s += '</g>';
  // rivets on the band
  for (let i = 0; i <= 12; i++) {
    const t = .14 + i * (.72 / 12), u = 1 - t;
    s += rivet(u * u * 60 + 2 * u * t * 240 + t * t * 420, u * u * 318 + 2 * u * t * 428 + t * t * 318);
  }
  // panel seams
  for (const d of [-1, 1]) {
    const X = [240 + d * 70, 240 + d * 128, 240 + d * 128, 240 + d * 76], Y = [76, 150, 300, 372];
    s += `<path class="${p}l" d="M${X[0]} ${Y[0]}C${X[1]} ${Y[1]} ${X[2]} ${Y[2]} ${X[3]} ${Y[3]}" stroke="${d < 0 ? '#C08A34' : Dp}" stroke-width="3" opacity="${d < 0 ? 1 : .6}"/>`;
    for (const t of [.12, .26, .42, .58, .74, .88]) s += rivet(cubic(...X, t) + d * 9, cubic(...Y, t), 2.8);
  }
  // three little lamps (the three explorers' colours)
  [['#EE7B62', 204, 392], ['#2F9C95', 240, 398], ['#4E5FB0', 276, 392]].forEach(([c, x, y]) => {
    s += `<circle cx="${x}" cy="${y}" r="8.500" fill="${Dp}"/><circle cx="${x}" cy="${y}" r="6" fill="${c}"/><circle cx="${x - 2}" cy="${y - 2}" r="2" fill="#fff" opacity=".7"/>`;
  });
  // window
  s += `<circle cx="241.500" cy="123.500" r="40" fill="${Dp}"/><circle cx="240" cy="122" r="40" fill="${Sh}"/><circle cx="240" cy="122" r="35" fill="${Hi}"/><circle cx="240" cy="122" r="28" fill="#2C6F73"/>`;
  s += `<clipPath id="${p}wc"><circle cx="240" cy="122" r="28"/></clipPath><g clip-path="url(#${p}wc)"><circle cx="243" cy="126" r="28" fill="#7AD0C8"/><path d="M200 150Q240 128 280 150V160H200Z" fill="#4FB0AC"/><path d="M214 122L236 92h12L226 122ZM232 130L254 100h5L237 130Z" fill="#fff" opacity=".6"/></g>`;
  for (let i = 0; i < 8; i++) { const a = (i + .5) * Math.PI / 4; s += `<circle cx="${r2(240 + 31.5 * Math.cos(a))}" cy="${r2(122 + 31.5 * Math.sin(a))}" r="2" fill="${Dp}"/>`; }
  // ---- dial ----
  s += `<g transform="translate(240 260)">`;
  s += `<circle cx="2" cy="3" r="92" fill="${Dp}" opacity=".5"/><circle r="90" fill="${Dp}"/><circle r="86" fill="${Hi}"/><circle cx="1" cy="1.500" r="80" fill="${B}"/><circle r="74" fill="${Sh}"/>`;
  s += `<circle r="71" fill="#E6DBC3"/><circle cx="1.500" cy="2.500" r="69" fill="${C.ivory}"/>`;
  // bezel studs at the four quarters
  for (let i = 0; i < 4; i++) s += `<path d="M0-88l5 8h-10z" transform="rotate(${i * 90})" fill="${Dp}"/>`;
  // ticks
  let maj = '', min = '';
  for (let i = 0; i < 60; i++) {
    const a = i * Math.PI / 30, c = Math.sin(a), d = -Math.cos(a);
    if (i % 5 === 0) maj += `M${r2(c * 66)} ${r2(d * 66)}L${r2(c * (i % 15 === 0 ? 53 : 57))} ${r2(d * (i % 15 === 0 ? 53 : 57))}`;
    else min += `M${r2(c * 66)} ${r2(d * 66)}L${r2(c * 61.5)} ${r2(d * 61.5)}`;
  }
  s += `<path class="${p}l" d="${min}" stroke="#B59A78" stroke-width="1.600"/><path class="${p}l" d="${maj}" stroke="#3B4A6B" stroke-width="3.400"/>`;
  s += `<circle r="47" fill="none" stroke="#E4BE7E" stroke-width="1.800"/>`;
  // compass rose: 4 diagonal short points, 4 long points
  for (let i = 0; i < 4; i++) s += `<g transform="rotate(${45 + i * 90})"><path d="M0-30L5.500-5.500L0 0Z" fill="#C9A56A"/><path d="M0-30L-5.500-5.500L0 0Z" fill="#E4BE7E"/></g>`;
  for (let i = 0; i < 4; i++) s += `<g transform="rotate(${i * 90})"><path d="M0-46L8-8L0 0Z" fill="#2F9C95"/><path d="M0-46L-8-8L0 0Z" fill="#7AD0C8"/></g>`;
  // hands
  s += `<g class="${p}hour"><g transform="rotate(-62)"><path d="M-3.500 8L-2-34Q0-40 2-34L3.500 8Z" fill="#3B4A6B"/><circle cy="-27" r="5" fill="none" stroke="#3B4A6B" stroke-width="2.400"/></g></g>`;
  s += `<g class="${p}needle"><g transform="rotate(34)"><path d="M0-60L7 0H-7Z" fill="#EE7B62"/><path d="M0-60L7 0H0Z" fill="#D2604A"/><path d="M0 40L7 0H-7Z" fill="#4E5FB0"/><path d="M0 40L7 0H0Z" fill="#3C4B92"/></g></g>`;
  s += `<circle r="9" fill="${Dp}"/><circle cx="-.5" cy="-.5" r="7" fill="${Hi}"/><circle r="2.500" fill="${Dp}"/>`;
  // glass glint
  s += `<path d="M-58-22C-52-44-36-58-16-64C-34-52-46-38-50-20Z" fill="#fff" opacity=".7"/>`;
  s += `</g></svg>\n`;
  return s;
}

// ---------- write ----------
const clean = s => s.replace(/(\d)\.(\d)00\b/g, '$1.$2').replace(/(\d)\.0\b/g, '$1');
const files = {};
for (const k of Object.keys(WHO)) { files[`${k}-avatar.svg`] = avatar(k); files[`${k}-full.svg`] = full(k); }
files['timemachine.svg'] = timemachine();
for (const [n, s] of Object.entries(files)) {
  const out = clean(s);
  fs.writeFileSync(path.join(OUT, n), out);
  console.log(n, Buffer.byteLength(out));
}
