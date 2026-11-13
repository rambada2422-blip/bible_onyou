// alt03 요셉이 애굽 온 땅을 다스리게 됨 — SVG generator
const fs = require('fs');
let seed = 5;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const R = (a, b) => a + (b - a) * rnd();
const n = v => +(+v).toFixed(1);
const i0 = v => Math.round(v);
const out = [];
const P = s => out.push(s);

const BLUE = '#2F5D8C', TURQ = '#3FA7A6', RED = '#C4553D', GOLD = '#F2C14E', GOLDD = '#D99A1C', GREEN = '#6F8448', IVORY = '#FBF7EE';
const SK_P = '#A2683C', SK_Pd = '#8A552F', SK_J = '#C8935F', SK_Jd = '#AD7947';
const cuff = (a, b, w, c) => `<path d="M${a.join(',')}L${b.join(',')}" stroke="${c}" stroke-width="${w}" fill="none"/>`;
const limb = (pts, w, c) => `<path d="M${pts.map(p => p.join(',')).join('L')}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;

P(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200" preserveAspectRatio="xMidYMid slice">`);
P(`<defs>
<linearGradient id="alt03-g-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7E8C4"/><stop offset="1" stop-color="#E4C993"/></linearGradient>
<linearGradient id="alt03-g-floor" gradientUnits="userSpaceOnUse" x1="0" y1="796" x2="0" y2="1200"><stop offset="0" stop-color="#F4E5C2"/><stop offset="1" stop-color="#DFC594"/></linearGradient>
<linearGradient id="alt03-g-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A9DDD8"/><stop offset="1" stop-color="#FFF7E0"/></linearGradient>
<linearGradient id="alt03-g-shaft" gradientUnits="userSpaceOnUse" x1="0" y1="190" x2="0" y2="840"><stop offset="0" stop-color="#FFF6D6" stop-opacity=".55"/><stop offset=".6" stop-color="#FFF6D6" stop-opacity=".2"/><stop offset="1" stop-color="#FFF6D6" stop-opacity="0"/></linearGradient>
<linearGradient id="alt03-g-tap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E6480"/><stop offset="1" stop-color="#1F4763"/></linearGradient>
<linearGradient id="alt03-g-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F8D062"/><stop offset="1" stop-color="#DDA02E"/></linearGradient>
<filter id="alt03-f-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="5"/></filter>
<clipPath id="alt03-cp-apron"><path d="M-8,-194L22,-194L28,-78L8,-58L-12,-78Z"/></clipPath>
<clipPath id="alt03-cp-nemes"><path d="M32,-339Q31,-360 8,-362Q-21,-362 -27,-336L-40,-296Q-43,-282 -34,-277L-12,-282Q-14,-300 -8,-313Q-5,-333 12,-341ZM-25,-296L-8,-298L-3,-244L-22,-244Z"/></clipPath>
<clipPath id="alt03-cp-torso"><path d="M-36,-200L-38,-262Q-38,-284 -16,-292L18,-292Q38,-284 38,-262L36,-200Z"/></clipPath>
<g id="alt03-lotus"><path d="M0,0Q-17,-6 -21,-22Q-8,-16 0,0ZM0,0Q17,-6 21,-22Q8,-16 0,0Z" fill="#3FA7A6"/><path d="M0,0Q-11,-12 -9,-27Q-1,-16 0,0ZM0,0Q11,-12 9,-27Q1,-16 0,0Z" fill="#2F5D8C"/><path d="M0,0Q-5,-16 0,-30Q5,-16 0,0Z" fill="#F2C14E"/><path d="M-6,0Q0,-9 6,0Z" fill="#C4553D"/></g>
<g id="alt03-bud"><path d="M0,0Q-6,-10 0,-21Q6,-10 0,0Z" fill="#C4553D"/><path d="M-4,0Q0,-6 4,0Z" fill="#6F8448"/></g>
<g id="alt03-pap"><path d="M0,0V-70" stroke="#6F8448" stroke-width="3" fill="none"/><path d="M-15,-74Q0,-56 15,-74Q0,-94 -15,-74Z" fill="#7C9A4C"/><path d="M-15,-74Q0,-84 15,-74Q0,-94 -15,-74Z" fill="#F2C14E"/></g>
</defs>`);
P(`<style>
@media (prefers-reduced-motion: no-preference){
.alt03-mote{animation:alt03-float 9s ease-in-out infinite alternate}
.alt03-mote2{animation:alt03-float 12s ease-in-out 2s infinite alternate-reverse}
.alt03-glint{animation:alt03-twinkle 2.8s ease-in-out infinite}
.alt03-glint2{animation:alt03-twinkle 3.6s ease-in-out 1.2s infinite}
.alt03-shafts{animation:alt03-breathe 8s ease-in-out infinite}
@keyframes alt03-float{from{transform:translate(0,0)}to{transform:translate(10px,-16px)}}
@keyframes alt03-twinkle{0%,100%{opacity:.3}50%{opacity:1}}
@keyframes alt03-breathe{0%,100%{opacity:.85}50%{opacity:1}}

}
</style>`);
P(`<g id="alt03-state-main">`);

/* ---------- back wall ---------- */
P(`<g id="alt03-wall"><rect width="900" height="800" fill="url(#alt03-g-wall)"/>`);
// stone joints
let j = '';
for (const y of [118, 320, 408, 496]) j += `M0,${y}H900`;
for (let r = 0; r < 4; r++) for (let x = (r % 2) * 60 + 30; x < 900; x += 120) j += `M${x},${[54, 320, 408, 496][r]}V${[118, 408, 496, 566][r]}`;
P(`<path d="${j}" stroke="#DCC190" stroke-width="2" fill="none" opacity=".6"/>`);
// top beam with colored blocks
P(`<path d="M0,0H900V28H0Z" fill="#B88A4E"/>`);
let bl = { [BLUE]: '', [RED]: '', [TURQ]: '' }; const cols3 = [BLUE, RED, TURQ];
for (let x = 6, k = 0; x < 900; x += 26, k++) bl[cols3[k % 3]] += `M${x},5h16v18h-16z`;
for (const c in bl) P(`<path d="${bl[c]}" fill="${c}"/>`);
P(`<path d="M0,24H900V28H0Z" fill="#8F6535"/>`);
// cavetto band with stripes
P(`<path d="M0,28H900V52H0Z" fill="#F6E9C6"/><path d="M0,28H900V33H0Z" fill="${GOLD}"/>`);
let cv = { [BLUE]: '', [RED]: '', [GREEN]: '' }; const cols4 = [BLUE, RED, GREEN];
for (let x = 4, k = 0; x < 900; x += 14, k++) cv[cols4[k % 3]] += `M${x},35h6v15h-6z`;
for (const c in cv) P(`<path d="${cv[c]}" fill="${c}"/>`);
P(`<path d="M0,52H900V58H0Z" fill="#D4B37A"/>`);
// high windows
const winX = [295, 361, 427, 493, 559];
for (const x of winX) P(`<path d="M${x - 7},68h60v140h-60z" fill="#D2B27A"/><path d="M${x - 7},68h60v6h-60z" fill="#B8955C"/><rect x="${x}" y="76" width="46" height="126" fill="url(#alt03-g-sky)"/><path d="M${x + 13},76h5v126h-5zM${x + 28},76h5v126h-5z" fill="#EAD3A0"/><path d="M${x + 16},76h2v126h-2zM${x + 31},76h2v126h-2z" fill="#C9A970"/><path d="M${x - 11},202h68v9h-68z" fill="#F8ECCB"/><path d="M${x - 11},208h68v4h-68z" fill="#CDAE78"/>`);
// lotus frieze
P(`<path d="M0,236H900V294H0Z" fill="#FBF3DC"/><path d="M0,236H900V241H0ZM0,289H900V294H0Z" fill="${BLUE}"/><path d="M0,243H900V246H0ZM0,284H900V287H0Z" fill="${RED}"/>`);
let fr = '', stem = '';
for (let x = 14, k = 0; x < 900; x += 34, k++) { fr += `<use href="#alt03-${k % 2 ? 'bud' : 'lotus'}" x="${x}" y="${k % 2 ? 279 : 281}"/>`; stem += `M${x},282q17,6 34,0`; }
P(`<path d="${stem}" stroke="${GREEN}" stroke-width="2" fill="none"/>${fr}`);
// zigzag band
P(`<path d="M0,566H900V602H0Z" fill="#FBF3DC"/><path d="M0,566H900V570H0ZM0,598H900V602H0Z" fill="${GOLDD}"/>`);
let zz = 'M0,590'; for (let x = 0; x < 900; x += 20) zz += `l10,-12l10,12`;
P(`<path d="${zz}" stroke="${BLUE}" stroke-width="4" fill="none"/><path d="${zz}" stroke="${TURQ}" stroke-width="2.5" fill="none" transform="translate(0,7)"/>`);
// dado with papyrus pattern
P(`<path d="M0,640H900V800H0Z" fill="#D6AF6E"/><path d="M0,640H900V648H0Z" fill="${BLUE}"/><path d="M0,648H900V653H0Z" fill="${GOLD}"/><path d="M0,653H900V657H0Z" fill="${RED}"/>`);
let pp = '';
for (let x = 20, k = 0; x < 900; x += 30, k++) { if ((x > 250 && x < 650)) continue; pp += `<use href="#alt03-pap" transform="translate(${x},782) scale(${k % 2 ? '.8,.8' : '1,1.15'})"/>`; }
P(pp);
P(`<path d="M0,780H900V800H0Z" fill="#B98C52"/><path d="M0,780H900V784H0Z" fill="#CDA468"/>`);
P(`</g>`);

/* ---------- canopy, tapestry, throne, dais ---------- */
P(`<g id="alt03-canopy">`);
P(`<rect x="292" y="368" width="316" height="410" fill="url(#alt03-g-tap)"/>`);
let dm = '', dt = '';
for (let r = 0; r < 9; r++) for (let c = 0; c < 8; c++) { const x = 312 + c * 40 + (r % 2) * 20, y = 420 + r * 40; if (x > 596) continue; dm += `M${x},${y - 7}l6,7l-6,7l-6,-7z`; dt += `M${x + 20},${y - 2.5}l2.5,2.5l-2.5,2.5l-2.5,-2.5z`; }
P(`<path d="${dm}" fill="#E0B24A" opacity=".85"/><path d="${dt}" fill="#7AD0C8" opacity=".7"/>`);
// valance
let vl = '';
for (let x = 292; x < 608; x += 22.6) vl += `M${n(x)},392l${11.3},16l${11.3},-16z`;
P(`<path d="M292,368H608V392H292Z" fill="#A8432F"/><path d="${vl}" fill="${GOLD}"/><path d="M292,386H608V392H292Z" fill="${GOLDD}"/>`);
// tapestry inner shadow at the left (canopy post shadow)
P(`<path d="M292,368H322V778H292Z" fill="#000" opacity=".12"/>`);
// canopy posts
for (const x of [270, 608]) {
  P(`<path d="M${x},772V398h22V772Z" fill="#F0D9A4"/><path d="M${x + 14},772V398h8V772Z" fill="#CFAF78"/><path d="M${x},772V398h5V772Z" fill="#FBEBC2"/>`);
  let rg = '';
  for (const y of [470, 560, 650, 730]) rg += `<path d="M${x},${y}h22v6h-22z" fill="${BLUE}"/><path d="M${x},${y + 6}h22v4h-22z" fill="${GOLD}"/><path d="M${x},${y + 10}h22v5h-22z" fill="${RED}"/>`;
  P(rg);
  P(`<path d="M${x - 2},400Q${x - 4},384 ${x - 12},372H${x + 34}Q${x + 26},384 ${x + 24},400Z" fill="${TURQ}"/><path d="M${x + 6},400Q${x + 5},384 ${x + 2},372H${x + 20}Q${x + 17},384 ${x + 16},400Z" fill="${BLUE}"/><path d="M${x - 2},400h26v5h-26z" fill="${GOLD}"/><path d="M${x - 5},772h32v10h-32z" fill="#E6CFA0"/>`);
}
// cornice
P(`<path d="M256,358H644V372H256Z" fill="#DDB870"/><path d="M256,366H644V372H256Z" fill="#B98C52"/>`);
P(`<path d="M260,358Q256,338 246,326H654Q644,338 640,358Z" fill="#F6E9C6"/>`);
let cs = { [BLUE]: '', [RED]: '', [GREEN]: '' };
for (let k = 0; k < 28; k++) { const xb = 266 + k * 13.6, xt = 254 + k * 14.5; cs[cols4[k % 3]] += `M${n(xb)},356L${n(xt)},329h7L${n(xb + 6)},356Z`; }
for (const c in cs) P(`<path d="${cs[c]}" fill="${c}"/>`);
P(`<path d="M242,314H658V327H242Z" fill="#EBCB86"/><path d="M242,322H658V327H242Z" fill="#C79E5E"/><path d="M256,355H644V359H256Z" fill="${GOLD}"/>`);
// dais
P(`<path d="M266,772H634L644,786H256Z" fill="#F7EBCB"/><path d="M256,786H644V800H256Z" fill="#D9BD88"/>
<path d="M244,800H656L668,814H232Z" fill="#F7EBCB"/><path d="M232,814H668V832H232Z" fill="#D2B47E"/><path d="M232,820H668V824H232Z" fill="${BLUE}" opacity=".8"/><path d="M256,791H644V794H256Z" fill="${RED}" opacity=".8"/>`);
// throne
P(`<g id="alt03-throne">
<path d="M402,772V572Q402,546 450,542Q498,546 498,572V772Z" fill="url(#alt03-g-gold)"/>
<path d="M412,672V577Q412,557 450,554Q488,557 488,577V672Z" fill="#B5482F"/>
<path d="M450,566l14,16l-14,16l-14,-16zM450,602l14,16l-14,16l-14,-16zM450,638l14,16l-14,16l-14,-16z" fill="#E9B43A"/>
<path d="M450,574l7,8l-7,8l-7,-8zM450,610l7,8l-7,8l-7,-8zM450,646l7,8l-7,8l-7,-8z" fill="#2F5D8C"/>
<path d="M386,640h18v132h-18zM496,640h18v132h-18z" fill="#DDA02E"/><path d="M382,630h26v11h-26zM492,630h26v11h-26z" fill="#F8D062"/>
<path d="M396,664h108v14h-108z" fill="${TURQ}"/><path d="M396,673h108v5h-108z" fill="#2E8482"/>
<path d="M390,678h120v11h-120z" fill="#F2C14E"/>
<path d="M398,689h104v83h-104z" fill="#22446B"/><path d="M405,696h90v69h-90z" fill="none" stroke="#E0B24A" stroke-width="2"/>
<path d="M414,768h72v6h-72z" fill="#F8D062"/><path d="M416,774h68v12h-68z" fill="#2F5D8C"/><path d="M416,774h68v3h-68z" fill="#DDA02E"/>
</g>`);
P(`</g>`);

/* ---------- mid columns ---------- */
const midCol = cx => {
  let s = `<g>`;
  s += `<path d="M${cx - 37},790L${cx - 33},138H${cx + 33}L${cx + 37},790Z" fill="#EBCF96"/><path d="M${cx + 10},138H${cx + 33}L${cx + 37},790H${cx + 12}Z" fill="#D2B07A"/><path d="M${cx - 33},138h9L${cx - 27},790h-10Z" fill="#F8E6BA"/>`;
  [BLUE, GOLD, TURQ, GOLD, RED, GOLD].forEach((c, k) => { s += `<path d="M${cx - 33.5},${138 + k * 8}h67v8h-67z" fill="${c}"/>`; });
  s += `<path d="M${cx + 10},138h23.500v48h-23.500z" fill="#000" opacity=".14"/>`;
  // mid band
  s += `<path d="M${cx - 35},430h70v46h-70z" fill="${BLUE}"/><path d="M${cx - 35},430h70v5h-70zM${cx - 35},471h70v5h-70z" fill="${GOLD}"/>`;
  let z = `M${cx - 35},462`; for (let k = 0; k < 7; k++) z += `l5,-18l5,18`;
  s += `<path d="${z}" stroke="${GOLD}" stroke-width="3" fill="none"/><path d="M${cx + 11},430h24.500v46h-24.500z" fill="#000" opacity=".16"/>`;
  // sheath leaves
  for (let k = -2; k <= 2; k++) s += `<path d="M${cx + k * 14.5 - 8},790L${cx + k * 14.2},${k % 2 ? 716 : 694}L${cx + k * 14.5 + 8},790Z" fill="${k % 2 ? TURQ : GREEN}"/>`;
  s += `<path d="M${cx + 12},790V700L${cx + 37},790Z" fill="#000" opacity=".12"/>`;
  s += `<path d="M${cx - 50},788h100v18h-100z" fill="#F3E3BE"/><path d="M${cx + 16},788h34v18h-34z" fill="#CDB184"/><path d="M${cx - 50},788h100v4h-100z" fill="#FBF1D6"/>`;
  // capital (open papyrus)
  s += `<path d="M${cx - 33},138Q${cx - 38},98 ${cx - 76},60V52H${cx + 76}V60Q${cx + 38},98 ${cx + 33},138Z" fill="#F1DCA6"/>`;
  for (let k = -3; k <= 3; k++) { const bx = cx + k * 9.5, tx = cx + k * 21, mx = (bx + tx) / 2 + k * 1.5; s += `<path d="M${n(bx - 5)},138Q${n(mx - 9)},102 ${n(tx)},66Q${n(mx + 9)},102 ${n(bx + 5)},138Z" fill="${k % 2 ? GREEN : TURQ}"/>`; }
  for (let k = -3; k <= 2; k++) { const tx = cx + (k + .5) * 21; s += `<circle cx="${n(tx)}" cy="74" r="3.200" fill="${RED}"/>`; }
  s += `<path d="M${cx - 76},52h152v9h-152z" fill="${BLUE}"/><path d="M${cx - 76},52h152v3h-152z" fill="${GOLD}"/>`;
  s += `<path d="M${cx + 14},138Q${cx + 26},98 ${cx + 44},61H${cx + 76}Q${cx + 38},98 ${cx + 33},138Z" fill="#000" opacity=".14"/>`;
  s += `<path d="M${cx - 36},28h72v24h-72z" fill="#E6C98D"/><path d="M${cx + 12},28h24v24h-24z" fill="#C7A66C"/>`;
  return s + `</g>`;
};
P(`<g id="alt03-columns">${midCol(190)}${midCol(710)}</g>`.replace(/\.(\d)00/g, '.$1'));

/* ---------- light shafts ---------- */
let sf = '';
for (const x of winX) sf += `<path d="M${x},204h46L${x + 330},840H${x + 226}Z"/>`;
P(`<g id="alt03-light" class="alt03-shafts"><g fill="url(#alt03-g-shaft)" filter="url(#alt03-f-soft)">${sf}</g></g>`);

/* ---------- floor ---------- */
P(`<g id="alt03-floor"><path d="M0,796H900V1200H0Z" fill="url(#alt03-g-floor)"/>`);
const VPx = 450, VPy = 615;
const rows = [796, 838, 890, 952, 1028, 1120, 1232];
const xAt = (xb, y) => VPx + (xb - VPx) * (y - VPy) / (1200 - VPy);
let tiles = '', tl = '';
const xbs = []; for (let xb = -750; xb <= 1650; xb += 150) xbs.push(xb);
for (let r = 0; r < rows.length - 1; r++) for (let c = 0; c < xbs.length - 1; c++) {
  if ((r + c) % 2) continue;
  const y0 = rows[r], y1 = Math.min(rows[r + 1], 1200);
  const a = xAt(xbs[c], y0), b = xAt(xbs[c + 1], y0), d = xAt(xbs[c + 1], y1), e = xAt(xbs[c], y1);
  if (b < 0 || a > 900) { if (d < 0 || e > 900) continue; }
  tiles += `M${i0(a)},${y0}L${i0(b)},${y0}L${i0(d)},${y1}L${i0(e)},${y1}Z`;
}
for (const xb of xbs) tl += `M${i0(xAt(xb, 796))},796L${xb},1200`;
for (const y of rows.slice(1, -1)) tl += `M0,${y}H900`;
P(`<path d="${tiles}" fill="#E7CFA0" opacity=".55"/><path d="${tl}" stroke="#CDB07C" stroke-width="1.6" fill="none" opacity=".7"/>`);
// wall base shadow on floor
P(`<path d="M0,796H900V806H0Z" fill="#B98C52" opacity=".35"/>`);
// carpet
const cx0 = 832, hw = y => 78 * (y - VPy) / (cx0 - VPy);
const cq = (f0, f1, y0 = cx0, y1 = 1200) => `M${n(450 + f0 * hw(y0))},${y0}L${n(450 + f1 * hw(y0))},${y0}L${n(450 + f1 * hw(y1))},${y1}L${n(450 + f0 * hw(y1))},${y1}Z`;
P(`<path d="${cq(-1, 1)}" fill="#A8432F"/><path d="${cq(-1, -.84)}${cq(.84, 1)}" fill="#8C3325"/><path d="${cq(-.84, -.78)}${cq(.78, .84)}" fill="${GOLD}"/><path d="${cq(-.72, -.7)}${cq(.7, .72)}" fill="#D99A1C"/>`);
// carpet diamonds along the border in perspective
let cd = '';
for (let k = 0; k < 9; k++) { const y = VPy + (cx0 - VPy) * Math.pow(1.17, k + 0.4); if (y > 1190) break; const w = hw(y) * .05, h = (y - VPy) * .045; for (const f of [-.92, .92]) { const x = 450 + f * hw(y); cd += `M${n(x)},${n(y - h)}L${n(x + w)},${n(y)}L${n(x)},${n(y + h)}L${n(x - w)},${n(y)}Z`; } }
P(`<path d="${cd}" fill="${GOLD}"/>`);
// light pools on the floor
P(`<g fill="#FFF6D6" opacity=".4" filter="url(#alt03-f-soft)"><path d="M560,846h70l44,60h-84z"/><path d="M660,846h66l50,60h-80z"/><path d="M760,850h60l54,56h-74z"/></g>`);
P(`</g>`);

/* ---------- courtiers ---------- */
const courtier = (x, y, h, dir, o) => {
  const s = n(h / 290), sk = o.skin, skd = o.skinD;
  let g = `<g transform="translate(${x},${y}) scale(${s})">`;
  g += `<ellipse cx="34" cy="3" rx="62" ry="9" fill="#5A3A1E" opacity=".2"/>`;
  g += `<g transform="scale(${dir},1)">${limb([[-20, -236], [-25, -192], [-22, -152]], 12, skd)}<circle cx="-22" cy="-146" r="7" fill="${skd}"/></g>`;
  g += `<path d="M-22,-9h18v9h-21zM6,-9h18v9h-21z" fill="${skd}"/><path d="M-26,-2h23v3h-23zM2,-2h23v3h-23z" fill="#7A5230"/>`;
  g += `<path d="M-27,-170L-33,-18L35,-18L27,-170Z" fill="#FAF5E6"/><path d="M12,-170L17,-18L35,-18L27,-170Z" fill="#DCD3BF"/><path d="M-7,-166L7,-166L14,-40L-12,-40Z" fill="#FFFEF8"/><path d="M-19,-166L-24,-22M19,-166L25,-22" stroke="#E3DAC6" stroke-width="2" fill="none"/>`;
  g += `<path d="M-28,-172L-31,-228Q-30,-246 -12,-250L14,-250Q32,-246 33,-228L28,-172Z" fill="#FAF5E6"/><path d="M13,-172L14,-250Q32,-246 33,-228L28,-172Z" fill="#DCD3BF"/>`;
  g += `<path d="M-28,-180H28V-167H-28Z" fill="${o.belt}"/><path d="M12,-180H28V-167H12Z" fill="#000" opacity=".15"/>`;
  g += `<path d="M-25,-250Q-25,-216 1,-216Q27,-216 27,-250Z" fill="${o.c1}"/><path d="M-18,-250Q-18,-225 1,-225Q20,-225 20,-250Z" fill="${o.c2}"/><path d="M-11,-250Q-11,-234 1,-234Q13,-234 13,-250Z" fill="${o.c1}"/>`;
  g += `<path d="M-8,-264h18v15h-18z" fill="${skd}"/>`;
  g += `<g transform="scale(${dir},1)">`;
  g += `<circle cx="3" cy="-277" r="19" fill="${sk}"/><path d="M20,-283L28,-275L21,-272Z" fill="${sk}"/><path d="M9,-281q5,-3 9,0q-4,3 -9,0z" fill="#22160F"/><path d="M15,-265q3,2 6,0" stroke="${skd}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
  g += `<path d="M-18,-272Q-20,-299 4,-299Q26,-298 24,-284Q13,-291 3,-285L2,-270L4,-250L-18,-250Z" fill="#231D1F"/><path d="M-18,-284Q4,-296 24,-287L24,-284Q4,-292 -18,-280Z" fill="${GOLD}"/>`;
  const pose = o.pose;
  if (pose === 'staff') g += `<path d="M43,-270L45,-2" stroke="#8A5A2B" stroke-width="5" stroke-linecap="round"/><circle cx="43" cy="-272" r="6" fill="${GOLD}"/>${limb([[20, -234], [30, -200], [42, -192]], 12, sk)}<circle cx="43" cy="-192" r="7.500" fill="${sk}"/>`;
  if (pose === 'clasp') g += `${limb([[20, -234], [27, -194], [8, -180]], 12, sk)}<circle cx="6" cy="-180" r="7.500" fill="${sk}"/>`;
  if (pose === 'raise') g += `${limb([[20, -234], [44, -224], [52, -262]], 12, sk)}<path d="M46,-262Q44,-276 50,-282L58,-282Q62,-272 58,-260Z" fill="${sk}"/>`;
  if (pose === 'scroll') g += `${limb([[20, -234], [27, -198], [46, -198]], 12, sk)}<path d="M43,-222h11v48h-11z" fill="#F8EFD6"/><path d="M43,-222h11v6h-11zM43,-180h11v6h-11z" fill="#D8C59A"/><path d="M43,-202h11v6h-11z" fill="${RED}"/><circle cx="48" cy="-198" r="7.500" fill="${sk}"/>`;
  if (pose === 'chest') g += `${limb([[20, -234], [33, -204], [10, -218]], 12, sk)}<circle cx="8" cy="-219" r="7.500" fill="${sk}"/>`;
  g += `<path d="M12,-248Q30,-244 31,-228L22,-222Q18,-236 10,-240Z" fill="#EDE6D2"/>`;
  g += `</g></g>`;
  return g.replace(/\.(\d)00/g, '.$1');
};
P(`<g id="alt03-figures" transform="translate(450,940) scale(1.1) translate(-450,-940)">`);
P(`<g id="alt03-courtiers">
${courtier(618, 886, 266, -1, { skin: '#B57B4C', skinD: '#9A6238', belt: GOLD, c1: RED, c2: GOLD, pose: 'clasp' })}
${courtier(252, 902, 280, 1, { skin: '#A86E42', skinD: '#8E5A33', belt: GOLD, c1: BLUE, c2: GOLD, pose: 'staff' })}
${courtier(668, 906, 282, -1, { skin: '#A86E42', skinD: '#8E5A33', belt: TURQ, c1: TURQ, c2: GOLD, pose: 'scroll' })}
${courtier(172, 928, 292, 1, { skin: '#B57B4C', skinD: '#9A6238', belt: RED, c1: TURQ, c2: GOLD, pose: 'chest' })}
${courtier(732, 930, 294, -1, { skin: '#9A6238', skinD: '#82512C', belt: BLUE, c1: BLUE, c2: RED, pose: 'raise' })}
</g>`);

/* ---------- Pharaoh ---------- */
let ap = '';
[[-180, 12, BLUE], [-156, 8, RED], [-136, 12, BLUE], [-112, 8, TURQ], [-92, 12, BLUE], [-70, 14, RED]].forEach(([y, h, c]) => { ap += `<path d="M-20,${y}h60v${h}h-60z" fill="${c}"/>`; });
let nm = '';
for (let y = -356; y < -246; y += 11) nm += `M-44,${y}h84v5h-84z`;
let collar = '';
[[41, 54, BLUE], [35, 47, GOLD], [29, 40, TURQ], [23, 33, RED], [17, 26, GOLD]].forEach(([w, d, c]) => { collar += `<ellipse cx="1" cy="-292" rx="${w}" ry="${d}" fill="${c}"/>`; });
P(`<g id="alt03-pharaoh" transform="translate(370,940)">
<ellipse cx="40" cy="4" rx="80" ry="12" fill="#000" opacity=".2"/>
<path d="M-24,-292Q-54,-274 -60,-200Q-66,-110 -58,-38L-36,-28L-30,-196L-36,-262Z" fill="#27497A"/>
<path d="M-24,-292Q-54,-274 -60,-200Q-66,-110 -58,-38L-50,-34Q-57,-110 -51,-200Q-46,-262 -24,-292Z" fill="#3D6CA6"/>
<path d="M-58,-38L-36,-28L-36,-39L-59,-49Z" fill="${GOLD}"/>
${limb([[22, -272], [46, -242], [57, -222]], 15, SK_Pd)}${cuff([51.5, -232], [54.3, -227], 16.5, GOLDD)}
<path d="M-28,-14L0,-14Q10,-11 14,-3L-30,-3ZM4,-14L32,-14Q42,-11 46,-3L2,-3Z" fill="${SK_Pd}"/><path d="M-32,-4h48v5h-48zM0,-4h48v5h-48z" fill="#C9962E"/>
<path d="M-34,-198L-42,-20L46,-20L34,-198Z" fill="#FCF8EC"/><path d="M16,-198L24,-20L46,-20L34,-198Z" fill="#DDD4C0"/>
<path d="M-23,-190L-30,-32M-14,-190L-18,-32M32,-150L36,-32" stroke="#E6DECB" stroke-width="2" fill="none"/>
<path d="M-41.600,-30L45.500,-30L46,-20L-42,-20Z" fill="#EBCB7A"/>
<g clip-path="url(#alt03-cp-apron)"><path d="M-20,-196h60v140h-60z" fill="${GOLD}"/>${ap}</g>
<path d="M-36,-208H36V-193H-36Z" fill="#E9B43A"/><path d="M-36,-197H36V-193H-36Z" fill="#C48D26"/><ellipse cx="7" cy="-201" rx="8" ry="5.500" fill="${BLUE}"/>
<path d="M-36,-200L-38,-262Q-38,-284 -16,-292L18,-292Q38,-284 38,-262L36,-200Z" fill="#FCF8EC"/><path d="M20,-200L22,-291Q38,-284 38,-262L36,-200Z" fill="#DDD4C0"/>
<g clip-path="url(#alt03-cp-torso)">${collar}</g>
<path d="M-7,-306L13,-306L15,-287Q4,-281 -9,-287Z" fill="${SK_Pd}"/>
<circle cx="6" cy="-324" r="23" fill="${SK_P}"/><path d="M27,-331L36,-321L28,-317Z" fill="${SK_P}"/>
<path d="M12,-328q6,-4 12,0q-6,3.500 -12,0z" fill="#22160F"/><path d="M11,-335q7,-4 14,-1" stroke="#22160F" stroke-width="2" fill="none" stroke-linecap="round"/>
<path d="M20,-309q4,2.500 8,0" stroke="${SK_Pd}" stroke-width="1.600" fill="none" stroke-linecap="round"/>
<g clip-path="url(#alt03-cp-nemes)"><path d="M-44,-366h84v120h-84z" fill="${GOLD}"/><path d="${nm}" fill="${BLUE}"/><path d="M-12,-298L-8,-298L-3,-244L-9,-244Z" fill="#000" opacity=".14"/></g>
<path d="M10,-343L33,-340L33,-333L10,-336Z" fill="${GOLDD}"/>
${limb([[18, -266], [34, -208], [64, -188]], 15, SK_P)}
<path d="M12,-291Q36,-286 40,-262L28,-248Q20,-262 10,-270Z" fill="#F1EAD8"/>
${cuff([22.5, -249], [24.6, -241.5], 17, GOLD)}${cuff([53, -195.3], [58.5, -191.7], 16.5, GOLD)}
</g>`.replace(/\.(\d)00/g, '.$1'));

/* ---------- Joseph ---------- */
P(`<g id="alt03-joseph" transform="translate(540,940)">
<ellipse cx="42" cy="4" rx="78" ry="12" fill="#000" opacity=".2"/>
${limb([[38, -212], [40, -180]], 12, SK_Jd)}<circle cx="40" cy="-172" r="7.500" fill="${SK_Jd}"/><path d="M20,-288Q42,-280 45,-250L49,-206L28,-204Z" fill="#E4DBC7"/><path d="M28,-204L49,-206L48.500,-212L28.500,-210Z" fill="#CDAE62"/>
<path d="M28,-14L0,-14Q-10,-11 -14,-3L30,-3ZM-4,-14L-32,-14Q-42,-11 -46,-3L-2,-3Z" fill="${SK_Jd}"/><path d="M32,-4h-48v5h48zM0,-4h-48v5h48z" fill="#9A6A3C"/>
<path d="M-38,-20L-32,-200Q-36,-262 -30,-274Q-20,-292 0,-294Q22,-292 32,-272Q36,-240 32,-200L40,-20Z" fill="#FDFAF0"/>
<path d="M16,-20L18,-292Q30,-286 33,-270Q36,-240 32,-200L40,-20Z" fill="#DFD6C2"/>
<path d="M-22,-190L-27,-30M-10,-190L-12,-30M4,-190L5,-30M27,-190L32,-30" stroke="#E9E1CE" stroke-width="2" fill="none"/>
<path d="M-37.700,-29L39.600,-29L40,-20L-38,-20Z" fill="#EBCB7A"/>
<path d="M-33,-209H33V-196H-33Z" fill="#EBCB7A"/><path d="M17,-209H33V-196H17Z" fill="#CDAE62"/>
<path d="M-17,-197L-4,-197L-2,-116L-19,-116Z" fill="#EBCB7A"/><path d="M-10,-197L-4,-197L-2,-116L-9,-116Z" fill="#CDAE62"/><path d="M-19,-116h17v6h-17z" fill="${GOLDD}"/>
<g id="alt03-chain"><path d="M-15,-288Q-21,-238 -1,-232Q19,-238 15,-288" stroke="#B9801A" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M-15,-288Q-21,-238 -1,-232Q19,-238 15,-288" stroke="#F4BE3A" stroke-width="6.500" fill="none" stroke-dasharray="7 3.500"/><path d="M-15,-288Q-21,-238 -1,-232Q19,-238 15,-288" stroke="#FFE594" stroke-width="2" fill="none" stroke-dasharray="4 6.500" stroke-dashoffset="-1.500"/></g>
<path d="M-11,-308L8,-308L10,-289Q0,-283 -13,-289Z" fill="${SK_Jd}"/>
<g transform="rotate(-7 0 -298)">
<circle cx="-4" cy="-327" r="23" fill="${SK_J}"/><path d="M-25,-334L-34,-324L-26,-320Z" fill="${SK_J}"/>
<ellipse cx="7" cy="-324" rx="4" ry="6.500" fill="${SK_Jd}"/>
<circle cx="-15" cy="-330" r="2.400" fill="#22160F"/><path d="M-23,-337q6,-3 11,-1" stroke="#3A271C" stroke-width="2" fill="none" stroke-linecap="round"/>
<path d="M-24,-312q3,3 8,1" stroke="${SK_Jd}" stroke-width="1.600" fill="none" stroke-linecap="round"/>
<path d="M-26,-339Q-25,-355 -2,-353Q23,-353 22,-326Q22,-312 13,-306Q12,-316 11,-322Q4,-326 3,-335Q-8,-343 -26,-339Z" fill="#3A271C"/>
<path d="M-18,-346Q-6,-352 6,-348Q-6,-349 -18,-346Z" fill="#5A4030"/>
</g>
<path d="M-8,-293Q-30,-289 -37,-270L-60,-232L-41,-217L-17,-248Z" fill="#FDFAF0"/><path d="M-60,-232L-41,-217L-37,-225L-54,-239Z" fill="#EBCB7A"/><path d="M-17,-248L-41,-217L-37,-225L-20,-256Z" fill="#E4DBC7"/>
${limb([[-51, -225], [-76, -204]], 13, SK_J)}
</g>`.replace(/\.(\d)00/g, '.$1'));

/* ---------- hands & ring ---------- */
const glint = (x, y, s, cls) => `<path class="${cls}" transform="translate(${x},${y}) scale(${s})" d="M0,-8L2,-2L8,0L2,2L0,8L-2,2L-8,0L-2,-2Z" fill="#FFFDF2"/>`;
P(`<g id="alt03-ring">
<path d="M428,749Q452,745 476,751Q483,757 478,763Q454,768 432,763Q424,757 428,749Z" fill="${SK_P}"/>
<path d="M432,763Q454,768 478,763Q481,760 480,757Q456,763 430,758Z" fill="${SK_Pd}"/>
<path d="M482,728Q466,725 458,729L456,747Q466,752 482,749Z" fill="${SK_J}"/>
<path d="M457,745L443,748Q438,751 443,754L459,752Z" fill="#96673C"/>
<path d="M457,738L433,741.500Q428,745 433,748.500L457,748Z" fill="${SK_Jd}"/>
<path d="M458,729L429,732.500Q423,736.500 429,740.500L458,740Z" fill="${SK_J}"/>
<path d="M476,729Q467,720 456,723.500Q453,728 460,731Z" fill="${SK_J}"/>
<ellipse cx="438" cy="736.500" rx="4" ry="8" fill="none" stroke="${GOLDD}" stroke-width="4"/>
<path d="M438,728.500a4,8 0 0 0 0,16" stroke="#FFE08A" stroke-width="1.800" fill="none"/>
<ellipse cx="438" cy="727.500" rx="7.500" ry="5" fill="#F9D667"/><ellipse cx="438" cy="727.500" rx="4.400" ry="2.800" fill="#C4861C"/>
<path d="M418,712Q426,702 438,707L445,715L434,723L424,722Z" fill="${SK_P}"/>
<path d="M438,707Q448,711 449,721Q448,727 444,725.500L439,716Z" fill="${SK_Pd}"/>
<path d="M425,718L435,721L433.500,728.500Q430,731 427.500,727Z" fill="${SK_P}"/>
${glint(455, 712, 1.2, 'alt03-glint')}${glint(424, 742, .6, 'alt03-glint2')}
</g></g>`.replace(/\.(\d)00/g, '.$1'));

/* ---------- front columns (frame) ---------- */
const frontCol = (cx) => {
  let s = `<g>`;
  s += `<path d="M${cx - 86},0H${cx + 86}L${cx + 90},1000H${cx - 90}Z" fill="#CBA56A"/><path d="M${cx + 26},0H${cx + 86}L${cx + 90},1000H${cx + 30}Z" fill="#AC8650"/><path d="M${cx - 86},0h22L${cx - 66},1000h-24Z" fill="#E2C288"/>`;
  [[300, [BLUE, GOLD, TURQ, GOLD, RED, GOLD]], [70, [GOLD, BLUE, GOLD]]].forEach(([y0, cs]) => cs.forEach((c, k) => { s += `<path d="M${cx - 88},${y0 + k * 13}h176v13h-176z" fill="${c}"/>`; }));
  s += `<path d="M${cx + 27},300h61v78h-61zM${cx + 26},70h61v39h-61z" fill="#000" opacity=".2"/>`;
  for (let k = -2; k <= 2; k++) s += `<path d="M${cx + k * 35 - 19},1000L${cx + k * 34.500},${k % 2 ? 870 : 836}L${cx + k * 35 + 19},1000Z" fill="${k % 2 ? TURQ : GREEN}"/><path d="M${cx + k * 35 - 4},1000L${cx + k * 34.500},${k % 2 ? 900 : 870}L${cx + k * 35 + 4},1000Z" fill="${GOLD}"/>`;
  s += `<path d="M${cx + 30},1000V850L${cx + 90},1000Z" fill="#000" opacity=".16"/><path d="M${cx - 40},122V296M${cx - 40},382V836M${cx + 4},122V296M${cx + 4},382V870M${cx + 52},122V296M${cx + 52},382V836" stroke="#8F6A38" stroke-width="3" opacity=".3" fill="none"/>`;
  s += `<path d="M${cx - 108},998h216v64h-216z" fill="#E9D7AE"/><path d="M${cx + 36},998h72v64h-72z" fill="#C2A878"/><path d="M${cx - 108},998h216v7h-216z" fill="#F6EBCC"/><path d="M${cx - 108},1062h216v8h-216z" fill="#9A7A4C" opacity=".35"/>`;
  return s + `</g>`;
};
P(`<g id="alt03-frontcols">${frontCol(6)}${frontCol(894)}</g>`.replace(/\.(\d)00/g, '.$1'));

/* ---------- dust motes in the light ---------- */
let mt = '';
for (let i = 0; i < 16; i++) { const y = R(260, 760); const x = R(330, 620) + (y - 204) * 0.42; mt += `<circle class="alt03-mote${i % 2 ? '2' : ''}" cx="${i0(x)}" cy="${i0(y)}" r="${n(R(1.4, 3))}"/>`; }
P(`<g id="alt03-motes" fill="#FFF8DC" opacity=".8">${mt}</g>`);

P(`</g></svg>`);
const svg = out.join('\n').replace(/\n+/g, '\n').replace(/>\n</g, '><');
fs.writeFileSync(process.argv[2], svg);
console.log('bytes', Buffer.byteLength(svg));
