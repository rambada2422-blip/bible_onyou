/* 광야 관찰창의 배경. 인물은 현장에 머무르고 플레이어와 탐사 장비만 이동한다. */
(function () {
  'use strict';
  const themes = {
    manna:['#666e92','#ddb4b4','#f6d3ac','#ab9296','#8b7e85','#e4be97','#ac8c77'],
    sabbath:['#8496ad','#ebc2a5','#fae1ab','#b79585','#967964','#e6c18e','#bb9062'],
    sinai:['#596e83','#b9c9c8','#edd3a4','#a1988d','#868278','#dcbf8f','#ae8562'],
    calf:['#617e91','#c9c8ae','#efcd95','#a29c84','#8b8271','#ddbe91','#ac876a'],
    rock:['#537d8d','#c3ced0','#efdcab','#aaa396','#8c877b','#dcb88d','#aa8565']
  };
  BO.drawWilderness = function(canvas,id,later){
    const g=canvas.getContext('2d'); if(!g)return;
    const W=800,H=396, c=themes[id];
    canvas.width=W; canvas.height=H;
    let seed=73254+id.length*807;
    const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    function grad(y,z,colors){
      const v=g.createLinearGradient(0,y,0,z);colors.forEach((s,i)=>v.addColorStop(i/(colors.length-1),s));return v;
    }
    function poly(pts,color){
      g.fillStyle=color;g.beginPath();g.moveTo(...pts[0]);for(const p of pts.slice(1))g.lineTo(...p);g.closePath();g.fill();
    }
    function oval(x,y,w,h,col){
      g.fillStyle=col;g.beginPath();g.ellipse(x,y,w,h,0,0,Math.PI*2);g.fill();
    }
    function line(x,y,xx,yy,col,width){
      g.beginPath();g.strokeStyle=col;g.lineWidth=width;g.lineCap='round';g.moveTo(x,y);g.lineTo(xx,yy);g.stroke();
    }
    function ridge(y,amp,col,phase){
      const pts=[[0,H]];
      for(let x=0;x<=816;x+=16)pts.push([x,y-amp*(.65+.35*Math.sin(x/86+phase)+.23*Math.sin(x/41)+.12*rand())]);
      poly(pts.concat([[816,H]]),col);
    }
    function person(x,y,h,i,kneel){
      g.save();g.translate(x,y);g.scale(h/44,h/44);
      const robe=['#79604b','#af7754','#476d71','#9c5c49','#dab77e'][i%5];
      oval(3,0,11,2,'#614e493b');
      if(kneel)g.transform(1,.1,-.22,.72,0,0);
      poly([[-4,-29],[3,-30],[7,-19],[9,-3],[-7,-2],[-5,-16]],robe);
      poly([[1,-28],[4,-25],[8,-4],[4,-3]],'#35464a50');
      oval(-1,-34,4.5,5.5,'#9b674a');
      poly([[-6,-34],[-5,-39],[1,-40],[4,-36],[2,-33],[-2,-35],[-5,-28]],'#e6cba4');
      line(-3,-24,-7,kneel?-14:-17,'#9e6a50',2.2);
      line(3,-23,10,kneel?-12:-20,'#9e6a50',2.2);
      g.restore();
    }
    function tent(x,y,k){
      poly([[x-22*k,y],[x-5*k,y-17*k],[x+11*k,y-13*k],[x+27*k,y+1]],'#ad8469');
      poly([[x-20*k,y],[x-5*k,y-17*k],[x+1*k,y]],'#d1ae83');
      poly([[x-13*k,y],[x-6*k,y-10*k],[x-4*k,y]],'#65635c');
    }
    function springs(){
      const oasis=id==='elim';
      const shape=(path,ink)=>{g.fillStyle=ink;g.fill(new Path2D(path));};
      function stroke(path,ink,width){
        g.strokeStyle=ink;g.lineWidth=width;g.lineCap='round';g.lineJoin='round';g.stroke(new Path2D(path));
      }
      function jar(x,y,k){
        g.save();g.translate(x,y);g.scale(k,k);
        stroke('M4 -19 C17 -23 13 -7 7 -8','#724c3c',2.5);
        shape('M-5 -22 L4 -22 L4 -17 C7 -14 12 -12 10 -6 Q9 1 3 3 L-3 3 Q-11 -1 -10 -8 Q-10 -14 -4 -17Z',
          grad(-21,4,['#d29d69','#b97650','#85513f']));
        stroke('M-7 -10 Q-8 -7 -6 -4','#e8b886',1.8);oval(-.5,-22,5.4,1.5,'#745040');g.restore();
      }
      // A contour drawn in profile. Bent knees and extended arms change the action at the shore.
      function traveller(x,y,k,clothes,stoop=false,mirror=false){
        g.save();g.translate(x,y);g.scale((mirror?-1:1)*k,k);
        const [robe,light,wrap]=clothes;
        shape('M-38 1 Q-12 -4 12 -2 L23 0 Q12 4 -38 3Z','#453d432d');
        if(stoop){
          shape('M-8 -28 Q-17 -22 -18 -12 Q-17 -6 -9 -6 L3 -11 L16 -5 L23 -5 Q26 -7 23 -10 L7 -21Z','#665348');
          shape('M-16 -36 Q-8 -41 0 -35 Q6 -28 10 -22 L19 -15 Q23 -12 19 -9 L7 -9 Q1 -10 -5 -18 Q-10 -7 -21 -9 L-24 -13 Q-18 -20 -16 -36Z',robe);
          shape('M-14 -35 Q-9 -37 -6 -34 Q-7 -27 3 -23 L10 -17 Q1 -16 -7 -21 L-16 -14Z',light);
          g.translate(-2,14);g.rotate(-.30);
        }else{
          shape('M-8 -12 L-8 -3 L-16 -1 L-16 1 L-4 1 L0 -11 M5 -12 L6 -1 L15 1 L17 0 L12 -4 L12 -14Z','#5e4439');
          shape('M-6 -53 C-14 -46 -13 -38 -12 -28 L-17 -10 Q-7 -6 -1 -10 Q5 -6 15 -9 L11 -34 L8 -47Z',robe);
          shape('M-4 -50 Q-13 -42 -10 -33 L-13 -14 L-7 -12 L-2 -28 L-3 -10 L2 -11 L4 -40Z',light);
          stroke('M5 -34 Q4 -21 7 -12 M10 -30 L12 -13','#4c49453e',1.5);
        }
        shape('M-6 -63 L4 -65 L7 -58 L5 -48 Q4 -45 -1 -46 L-4 -51 L-9 -52 L-10 -55 L-12 -56 L-10 -58Z','#ac7654');
        shape('M-7 -62 L-3 -62 L-4 -58 L-9 -56 L-11 -56 L-9 -60Z','#dfac78');
        shape('M-10 -60 Q-10 -70 0 -70 Q9 -69 10 -61 Q11 -49 15 -43 L9 -43 Q5 -49 3 -57 L2 -61 L-4 -62Z',wrap);
        stroke('M-9 -63 Q-3 -66 5 -64','#f1d8a184',1.3);
        shape('M-5 -51 Q0 -54 7 -50 L9 -44 L3 -39 L-8 -46Z',wrap);
        stroke('M-9 -59 L-7 -59.3','#755342',.7);
        stroke('M-4 -46 Q2 -44 6 -47','#e9cba35c',1.05);
        if(stoop){
          stroke('M-4 -44 Q-11 -40 -13 -34 L-24 -29',light,6);
          stroke('M-14 -34 L-24 -29 L-30 -29','#b6815d',3.5);
        }else{
          stroke('M-5 -43 L-11 -32 L-20 -35',light,6);
          stroke('M-12 -32 L-21 -36 L-24 -36','#b6815d',3.6);
        }
        g.restore();
      }
      const people=[['#38656e','#69888b','#ded1ac'],['#a65340','#ca7856','#edc391'],
        ['#c5945d','#e4b983','#776559'],['#685566','#95818a','#d8b480']];
      function datePalm(x,y,h,lean,far){
        g.save();g.translate(x,y);g.scale(h/100,h/100);
        shape('M-5 0 Q-3 -53 '+(lean-2)+' -86 L'+(lean+3)+' -86 Q4 -45 4 0Z',far?'#777f67':'#796344');
        stroke('M-3 -1 Q-2 -50 '+lean+' -84',far?'#9b9775':'#b6975d',1.8);
        for(let i=5;i<82;i+=6){
          const xx=lean*(i/86)**1.5;stroke('M'+(xx-2.5)+' '+(-i)+' l4 -2.7',far?'#77836b':'#514d3e',1.35);
        }
        g.translate(lean,-86);
        // A rising midrib with pairs of narrow, drooping leaflets on either side.
        const leaves=[[-56,19,-36],[-44,-5,-36],[-30,-13,-38],[-16,-23,-40],[13,-27,-40],[34,-18,-36],[51,-3,-34],[55,19,-28],[-40,32,-18],[37,34,-14]];
        leaves.forEach(([dx,dy,bend],i)=>{
          const shade=far?['#738b76','#839779','#91a080'][i%3]:['#285953','#306455','#49775a','#849153','#628452'][i%5];
          g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(dx*.58,bend,dx,dy);
          g.strokeStyle=shade;g.lineWidth=1.05;g.stroke();
          for(let j=1;j<13;j++){
            const t=j/13,mt=1-t,px=dx*(2*mt*t*.58+t*t),py=2*mt*t*bend+t*t*dy;
            const spread=(2+11*Math.sin(t*Math.PI)**.65)*(i<8?1:.83);
            poly([[px-1,py],[px+dx*.055,py+(dy-bend)*.052],[px+Math.sign(dx)*spread*.63,py+spread]],shade);
            poly([[px,py],[px+dx*.051,py+(dy-bend)*.066],[px+Math.sign(dx)*spread*.52,py-spread*.42]],shade);
          }
        });
        if(!far){oval(2,3,3,5,'#96703d');oval(-2.5,0,2,4,'#bc9253');}
        g.restore();
      }
      function stripedTent(x,y,k){
        g.save();g.translate(x,y);g.scale(k,k);
        shape('M-38 0 L-32 -4 L-5 -31 L15 -25 L37 -3 L41 1Z','#835440');
        shape('M-35 -3 Q-20 -12 -5 -31 Q-3 -19 4 -2Z','#cd9870');
        shape('M-4 -30 Q8 -24 16 -25 L36 -3 L5 -2Z','#b67a56');
        shape('M-21 -2 L-9 -21 L-5 -3Z','#514f46');
        for(let i=0;i<3;i++)stroke('M'+(i*4+1)+' '+(-27+i*.85)+' q4 11 14 23','#e1ac7920',2);
        stroke('M-5 -33 L-5 -30 M-5 -29 Q-21 -12 -44 1 M16 -25 Q27 -12 45 0','#785944',.9);
        g.restore();
      }
      function cliffs(y,xStep,amplitude,palette,phase){
        const points=[];
        for(let x=-xStep;x<W+2*xStep;x+=xStep){
          const top=y+amplitude*(Math.sin(x/116+phase)*.5+Math.sin(x/51+phase)*.28+rand()*.38);
          points.push([x,top]);
        }
        poly([...points,[W+xStep,206],[-xStep,206]],grad(y-amplitude,207,palette.slice(0,2)));
        for(let i=1;i<points.length-1;i++){
          const [x,top]=points[i], [nx,ny]=points[i+1];
          const knee=[x-4-rand()*11,top+(198-top)*.35];
          poly([[x,top],[nx,ny],knee,[x-14,top+(198-top)*.77]],i%3===0?palette[2]:palette[3]);
          for(let j=0;j<3;j++){
            const t=.14+j*.16,px=x+(nx-x)*t,py=top+(ny-top)*t;
            line(px,py+1,px-9,py+(195-py)*.22,palette[3],.9);
          }
        }
      }
      g.fillStyle=grad(0,195,oasis?['#6099ab','#bdd5c4','#f6dba6']:['#738a9b','#e6b499','#ffdc9f']);g.fillRect(0,0,W,H);
      const sunX=oasis?465:246;
      const glow=g.createRadialGradient(sunX,97,3,sunX,97,128);
      glow.addColorStop(0,'#fff0c2d9');glow.addColorStop(1,'#ffe6ab00');g.fillStyle=glow;g.fillRect(sunX-130,0,260,229);
      oval(sunX,97,16,16,'#ffefbf');
      for(let i=0;i<14;i++){
        const x=rand()*870-90,y=10+rand()*89,w=16+rand()*90;
        shape('M'+x+' '+y+' q'+w*.32+' -7 '+w+' -3 q-'+w*.45+' 2 -'+w*1.13+' 5Z','#fff6d935');
      }
      cliffs(149,25,26,oasis?['#92aaa0','#ceccab','#b6beb0','#9cae9e']:['#c19c93','#edc19a','#d8aca0','#c79e91'],1);
      cliffs(137,37,57,oasis?['#9ca98e','#bec6a2','#8f9b86','#b7bc96']:['#bb897b','#dea982','#ac7c75','#d29b7d'],1.4);
      cliffs(164,23,33,oasis?['#8d9273','#c7be90','#8a9077','#a3a582']:['#af785b','#d49b70','#956b5b','#c18a65'],4.9);
      function escarpment(x,y,k,flip){
        g.save();g.translate(x,y);g.scale(flip?-k:k,k);
        const cliff='M-40 2 L-18 -80 L0 -84 L11 -76 L47 -75 L53 -59 L76 -58 L84 -52 L101 -51 L105 -35 L125 -33 L141 -21 L158 -20 L169 -12 L195 -1 L218 4 L225 12 L-45 12Z';
        const colors=oasis?['#a5a186','#818771','#c6b38b','#6f7d6e']:['#bb846c','#8b6966','#dda374','#826663'];
        shape(cliff,grad(-78,10,[colors[2],colors[0],colors[1]]));
        g.save();g.clip(new Path2D(cliff));
        shape('M-8 -85 L10 -75 L46 -75 L42 -64 L28 -55 L25 -37 L12 -32 L12 -17 L-8 5 L-22 6Z',colors[1]);
        shape('M51 -63 L76 -59 L80 -52 L73 -45 L54 -41 L43 -26 L39 -12 L20 3 L47 -1 L64 -12 L76 -18 L77 -28 L85 -36 L96 -42 L102 -51 L77 -69Z',colors[1]);
        shape('M103 -37 L105 -31 L123 -31 L125 -26 L118 -17 L98 -11 L87 0 L74 4 L94 -18Z',colors[1]);
        for(let j=0;j<42;j++){
          const sx=rand()*205-15,sy=-79+rand()*86,l=5+rand()*23;
          stroke('M'+sx+' '+sy+' l'+l*.55+' -1 l'+l*.45+' .8',j%3?'#ffdb9e47':'#6d5e5440',.75+rand()*.8);
        }
        g.restore();
        shape('M-37 0 L-16 -7 L3 -5 L25 -12 L44 -9 L53 -12 L72 -9 L91 -13 L122 -4 L136 -7 L177 1 L191 0 L217 7 L190 9 L126 6 L84 11 L12 8 L-37 10Z',colors[0]);
        g.restore();
      }
      escarpment(-6,182,oasis?.72:1.26,false);escarpment(812,185,oasis?.86:.82,true);
      g.fillStyle=grad(180,H,oasis?['#cfbc8c','#dfc99a','#a88a5d']:['#deb180','#edc193','#ae7957']);g.fillRect(0,198,W,H-198);
      shape('M-2 196 Q103 174 232 187 T462 186 Q575 176 802 186 L802 209 Q645 195 423 202 T-2 212Z',oasis?'#c7bb90':'#dbaa7d');
      shape('M533 183 Q442 190 471 196 T386 208 Q329 213 279 222 Q297 209 398 200 T437 191 Q435 187 533 183Z',oasis?'#e8d5a6':'#f1ce9b');
      for(let i=0;i<620;i++){
        const x=rand()*W,y=197+rand()*196,k=(y-185)/180;
        line(x,y,x+1+rand()*7*k,y-.5,rand()>.42?'#775e4c2a':'#ffe9ad7a',.6+rand()*k);
      }
      if(!oasis){
        // The narrowing trail and dust connect the rows of travellers back into the wilderness.
        shape('M543 182 Q514 183 491 188 T434 195 Q427 199 439 199 Q452 200 426 203 Q367 211 311 219 Q348 209 398 202 Q422 200 414 198 Q411 194 458 190 Q503 186 511 184Z','#ffe2b879');
        for(let i=0;i<9;i++){
          const x=468+i*16,y=194+Math.sin(i*.62)*2;
          oval(x,y,11+rand()*14,2+rand()*2,'#e3c29785');
        }
      }
      if(oasis){
        for(let i=0;i<40;i++){
          const x=(i*41)%820-10,y=198+7*Math.sin(i*.69),h=15+10*(1+Math.sin(i*1.33));
          datePalm(x,y,h,Math.sin(i)*15,true);
        }
      }else{
        for(let i=0;i<35;i++){
          const x=465+i*8.4,y=197+4*Math.sin(i*.14);
          person(x,y,5+i*.22,i,false);
        }
      }
      // A scalloped stone lip, deep water and sand bars follow the same shore in both records.
      const basin=oasis?
        'M-8 257 Q35 241 105 244 Q166 246 194 231 Q237 211 309 223 Q348 230 399 218 Q445 208 494 221 Q541 238 613 237 Q655 241 642 250 Q630 266 562 269 Q514 273 488 289 Q435 311 328 297 Q282 287 222 303 Q137 323 79 300 Q46 282 -8 283Z':
        'M-9 249 Q36 240 95 242 Q151 247 198 233 Q258 214 327 226 Q378 237 426 227 Q484 213 548 220 Q603 226 668 224 Q712 225 710 237 Q690 248 628 249 Q577 251 538 269 Q500 288 441 287 Q381 286 334 298 Q261 317 187 298 Q129 286 58 301 Q15 307 -9 299Z';
      g.save();g.translate(0,5);shape(basin,oasis?'#86896a':'#997658');g.restore();
      shape(basin,grad(214,308,oasis?['#9fc6ad','#72ad9c','#3d8583','#497b73']:['#90a89a','#749999','#507f83','#678d86']));
      g.save();g.clip(new Path2D(basin));
      for(let i=0;i<510;i++){
        const x=rand()*740,y=213+rand()*103,k=rand();
        line(x,y,x+1+k*k*27,y+.3*Math.sin(i),i%3?'#e9e9c477':'#325d6860',.6+k*.65);
      }
      g.restore();
      // Broken glints near the edge and wet shore shadows give the pool a recessed rim.
      stroke(oasis?'M10 282 Q38 283 78 299 Q123 315 160 311 M327 298 Q410 308 458 293 M554 270 Q589 264 610 265':'M5 301 Q35 302 61 298 M192 299 Q254 313 294 302 M440 288 Q484 289 520 272',
        '#f4dcb2b8',1.8);
      if(oasis){
        for(const [x,y,rx,ry] of [[60,218,42,4],[206,207,33,2.8],[419,204,27,2],[704,262,55,5],[721,288,38,4]]) {
          oval(x,y+2,rx+2,ry+1,'#b09e77');oval(x,y,rx,ry,'#7ea89a');line(x-rx*.55,y,x+rx*.24,y,'#c6d2ac',1.2);
        }
        datePalm(655,241,67,-11,false);datePalm(721,225,51,19,false);
        if(later){
          stripedTent(483,215,.49);stripedTent(526,218,.73);stripedTent(568,229,1.24);stripedTent(623,222,.63);
          traveller(550,235,.28,people[0]);traveller(597,236,.33,people[1],true);
          jar(605,236,.34);
        }else{
          traveller(542,224,.31,people[1]);traveller(559,224,.29,people[0]);traveller(585,220,.25,people[2]);
        }
        datePalm(103,277,115,20,false);datePalm(53,268,75,-11,false);
        datePalm(662,263,112,-23,false);datePalm(749,271,151,16,false);
      }else{
        for(let i=0;i<14;i++)person(560+i*15,223+Math.sin(i*2)*4,18+i%4*3,i,false);
        if(later){
          for(let i=0;i<7;i++){
            const rx=12+i*12,ry=3+i*2.5;
            g.strokeStyle=i%2?'#ebdeb2ce':'#bdd2bcbf';g.lineWidth=i<3?2.1:1.35;
            for(const [start,end] of [[.25,2.65],[3.25,5.85]]){
              g.beginPath();g.ellipse(322,262,rx,ry,-.055,start,end);g.stroke();
            }
          }
          shape('M293 266 Q306 260 317 260 L331 253 L333 254 L326 260 L349 255 L351 257 Q330 264 319 265 L298 269Z','#695540');
          stroke('M298 266 Q314 262 322 263 L346 257','#c9a677',1.7);
          traveller(635,244,.62,people[2],true);traveller(667,239,.66,people[0],true);
          traveller(695,236,.60,people[1]);jar(616,246,.46);
        }else{
          traveller(632,230,.63,people[2]);traveller(661,236,.70,people[0]);traveller(697,235,.65,people[1]);jar(644,237,.50);
        }
      }
      // Foreground banks frame the low footpath; the centre stays clear for the three explorers.
      shape('M-8 314 Q62 289 122 307 Q176 323 247 312 Q318 302 384 319 Q475 340 546 306 Q637 278 703 281 Q755 284 807 262 L808 397 L-8 397Z',
        grad(273,396,oasis?['#c0aa75','#dfc496','#99845f']:['#d5a075','#deb489','#997154']));
      shape('M-8 350 Q147 317 278 331 T491 337 Q627 322 807 341 L807 353 Q627 334 500 350 Q388 365 273 344 Q137 330 -8 364Z',oasis?'#e4cda1':'#efc79b');
      for(let i=0;i<780;i++){
        const x=rand()*809,y=319+rand()*83;
        line(x,y,x+1+rand()*5,y-.4,i%3?'#72534524':'#fbe8bb6e',.5+rand());
      }
      function stone(x,y,k){
        g.save();g.translate(x,y);g.scale(k,k);
        shape('M-13 0 L-9 -7 L-1 -9 L9 -6 L13 -1 L5 1Z',oasis?'#9c9778':'#a28169');
        poly([[-12,-1],[-8,-6],[-1,-8],[2,-4]],oasis?'#c9c49a':'#d4b08a');
        line(0,1,15,1,'#795f4d60',1.4);g.restore();
      }
      for(const [x,y,k] of [[21,319,1.2],[99,312,.64],[218,317,.68],[420,327,.48],[518,320,.44],[563,301,.67],[673,291,.55],[772,282,.98],[29,376,1.1],[754,363,.95]])stone(x,y,k);
      for(const [x,y,k] of [[-5,362,2.7],[19,367,1.8],[49,372,1],[785,337,2.1],[809,340,3.5]]){
        stone(x,y,k);
        for(let j=0;j<6;j++){
          const dx=(rand()-.5)*15*k,dy=(3+rand()*11)*k;
          stroke('M'+x+' '+(y+1)+' q'+dx*.45+' -'+dy*.8+' '+dx+' -'+dy,oasis?'#6f7952':'#9c815a',1.15*k);
        }
      }
      if(oasis){
        for(const [x,y,k] of [[0,319,1.3],[65,317,.9],[94,309,.55],[480,302,.5],[627,288,.75],[787,294,.9]]){
          for(let j=0;j<17;j++){
            const dx=(rand()-.5)*42*k,dy=(8+rand()*23)*k;
            poly([[x-2*k,y],[x+dx*.6,y-dy*.8],[x+dx,y-dy],[x+3*k,y]],['#647253','#7e8557','#97935f'][j%3]);
          }
        }
        if(later){stripedTent(799,305,1.26);jar(766,311,.65);}
      }else{
        if(later){
          traveller(115,325,1.04,people[0],true,true);jar(144,322,.78);
          traveller(76,321,1.14,people[1],false,true);
        }else{
          traveller(77,322,1.17,people[1],false,true);traveller(118,329,.93,people[0],false,true);
          jar(145,329,.86);jar(164,325,.59);
        }
      }
      for(let i=0;i<12500;i++){
        g.fillStyle=i%2?'#fbe5bf20':'#47344412';g.fillRect(rand()*W,rand()*H,1+rand()*1.4,.6+rand()*.7);
      }
    }
    if(id==='marah'||id==='elim'){springs();return;}
    function mountainCamp(){
      const clouded=id==='sinai'&&later;
      const peak=[[0,219],[80,190],[137,201],[231,138],[266,155],[353,111],[396,117],
        [478,57],[504,67],[533,50],[563,83],[601,95],[640,143],[686,163],[743,152],[800,187],[800,244],[0,244]];
      poly(peak,grad(48,244,clouded?['#4e515b','#717174','#a0947c']:['#a88567','#b79c77','#a18c72']));
      for(const [a,b,c] of [[0,2,1],[2,4,3],[4,6,5],[6,8,7],[8,10,9],[10,12,11],[12,14,13],[14,16,15]]){
        const [px,py]=peak[c];
        poly([peak[a],peak[c],[px-36,py+75],[px-89,222]],clouded?'#384c565e':'#695e5b65');
        poly([peak[c],peak[b],[px+18,py+39]],clouded?'#c2beb059':'#e2c397aa');
      }
      if(clouded){
        const glow=g.createRadialGradient(507,110,2,507,110,73);
        glow.addColorStop(0,'#eea56dbd');glow.addColorStop(1,'#ac785300');
        g.fillStyle=glow;g.fillRect(431,32,155,157);
        // 서로 겹치는 낮은 구름층과 연무. 산꼭대기는 구름 뒤에 가려진다.
        for(let i=0;i<65;i++){
          const x=335+rand()*330,y=38+rand()*64;
          oval(x,y,24+rand()*62,9+rand()*14,['#566170bb','#667380bf','#475a69a8'][i%3]);
        }
        for(let i=0;i<70;i++){
          const y=99+rand()*57,x=490+Math.sin(y/21)*18+(rand()-.5)*57;
          oval(x,y,14+rand()*24,3+rand()*6,'#7a716b6e');
        }
      }
      for(let i=0;i<11;i++)tent(26+i*74,226+Math.sin(i*2)*8,.74);
      tent(119,264,1.25);tent(175,258,.9);tent(449,242,1.05);
      for(let i=0;i<6;i++)person(311+i*17,242+i%2*4,20+i%3*3,i,false);
      if(id==='sinai'){
        if(later){
          for(let i=0;i<13;i++){
            const x=536+i*14,y=281+Math.sin(i*2.1)*9+i%4*3;
            person(x,y,27+i%3*4,i,false);
          }
        }
      }else{
        // 진 문은 장막 사이의 통로로 남긴다. 판의 글자나 심판 장면을 그리지 않는다.
        tent(578,284,1.05);tent(713,284,1.1);
        if(later){
          person(638,287,37,1,false);
          for(let i=0;i<6;i++)person(603-i*13,296+i%3*5,27+i%2*4,i,false);
        }else{
          const bronze='#a7864c';
          poly([[301,253],[307,247],[330,246],[343,238],[350,239],[348,248],[341,253],
            [337,264],[334,264],[334,254],[316,255],[312,265],[309,265],[310,254],[303,254]],bronze);
          line(302,250,299,258,'#826a44',1.8);
          line(345,239,346,235,bronze,2);
          for(let i=0;i<7;i++)person(220+i*12,268+i%3*3,27,i,false);
        }
      }
    }
    g.fillStyle=grad(0,190,c.slice(0,3));g.fillRect(0,0,W,H);
    const sx=id==='manna'?574:172,sy=id==='manna'?130:76;
    for(const [r,color] of [[52,'#fff4cd14'],[34,'#fff0b925'],[19,'#ffedba']])oval(sx,sy,r,r,color);
    for(let i=0;i<28;i++){
      const x=rand()*W,y=rand()*130;
      line(x,y,x+10+rand()*74,y-1,'#fff1d536',1+rand());
    }
    ridge(184,61,c[3],1.4);ridge(200,48,c[4],3.7);
    ridge(223,28,grad(180,H,c.slice(5)),1);
    for(let i=0;i<650;i++){
      const x=rand()*W,y=204+rand()*200;
      line(x,y,x+1+rand()*8,y-.6,rand()<.5?'#6b53472d':'#ffedbf60',.5+rand());
    }
    if(id==='sinai'||id==='calf'){
      mountainCamp();
    }else if(id==='sabbath'){
      // 두 기록은 같은 지형과 같은 시점에 겹친다. 움직이는 것은 탐험대의 관찰창이다.
      for(let i=0;i<7;i++)tent(43+i*111,210+Math.sin(i)*6,.7);
      tent(600,245,1.9);tent(710,234,1.24);
      for(const offset of [0,64]){
        line(555+offset,243,584+offset,208,'#7e614a',1.5);
        line(555+offset,243,551+offset,248,'#644932',2);
      }
      if(later){
        person(553,246,27,1,false);person(576,249,22,3,false);
        person(617,248,25,0,false);
        oval(351,289,61,5,'#95744e44');
      }else{
        for(let i=0;i<143;i++){
          const x=110+rand()*355,y=241+rand()*50;
          oval(x,y,1.6,.9,'#f5e2bd');
        }
        for(const [x,y,h,i] of [[192,255,37,1],[249,268,44,3],[286,265,47,2],[359,246,31,0]]){
          person(x,y,h,i,true);
          oval(x+15,y+1,9,4.3,'#856347');oval(x+15,y-1,8,2.3,'#f4dfb6');
        }
      }
      for(let i=0;i<3;i++){
        const x=100+i*198;
        poly([[x,315],[x+6,305],[x+19,303],[x+28,311],[x+24,316]],'#aa8d69');
        line(x+7,306,x+17,304,'#d9bc8f',2);
      }
    }else if(id==='manna'){
      for(let i=0;i<8;i++)tent(70+i*92,215+Math.sin(i)*6,.8);
      if(!later){g.fillStyle=grad(216,336,['#d0dee7a0','#fcf5de50']);g.beginPath();g.ellipse(397,261,413,43,0,0,Math.PI*2);g.fill();}
      for(let i=0;later&&i<250;i++){
        const x=rand()*W,y=228+rand()*115; const r=.7+(y-228)/76;
        oval(x,y,r*1.5,r*.7,'#f9e6c6');line(x-1,y+1,x+1,y+1,'#98847788',.65);
      }
      for(let i=0;later&&i<12;i++){
        const x=50+i*61,y=247+18*Math.sin(i*2.1);person(x,y,30+i%4*5,i,i%3!==0);
        oval(x+12,y+1,7.5,3.5,'#936e54');oval(x+12,y-1,7,2,'#e6cbae');
      }
      if(later){person(519,304,65,2,true);oval(545,303,13,6,'#906c54');oval(545,300,12,3,'#ebceaa');}
    }else if(!later){
      for(let i=0;i<10;i++)tent(35+i*74,220+Math.sin(i)*6,.8);
      for(let i=0;i<55;i++){
        const x=rand()*760,y=236+rand()*80;
        oval(x,y,3+rand()*7,2+rand()*2,'#988974');
      }
      for(let i=0;i<7;i++)person(408+i*29,252+i%3*7,32+i%3*4,i,false);
    }else{
      const rock=[[350,256],[372,218],[409,200],[400,176],[431,131],[474,123],[498,101],[557,112],[574,139],[618,154],[627,192],[658,227],[643,252]];
      poly(rock,grad(106,260,['#c7b49d','#a18c79','#766f68']));
      poly([[400,176],[431,131],[474,123],[463,151],[437,161],[422,196]],'#e1c8a3');
      poly([[498,101],[557,112],[535,128],[506,142],[463,151]],'#d7c3a6');
      poly([[549,142],[574,139],[618,154],[627,192],[596,206],[578,173]],'#837971');
      poly([[404,221],[451,196],[487,201],[474,223],[437,234]],'#655f59');
      g.beginPath();g.moveTo(466,207);g.bezierCurveTo(471,236,428,237,454,254);g.bezierCurveTo(502,287,325,267,291,301);g.bezierCurveTo(255,333,355,334,234,370);
      g.lineWidth=12;g.strokeStyle='#599a9d';g.stroke();g.lineWidth=4;g.strokeStyle='#d5e7cc';g.stroke();
      for(let i=0;i<50;i++){const x=190+rand()*390,y=267+rand()*70;oval(x,y,3+rand()*6,1.5+rand()*2,'#8f8778');}
      person(590,262,35,2,false);person(630,263,37,4,false);
    }
    // 탐험대가 다니는 전경. 성경 장면과 별도로 조작한다.
    g.fillStyle=grad(337,398,['#d1af7d','#b79168']);g.beginPath();g.moveTo(0,355);g.quadraticCurveTo(215,327,408,348);g.quadraticCurveTo(620,369,800,340);g.lineTo(800,H);g.lineTo(0,H);g.closePath();g.fill();
    for(let i=0;i<1300;i++){
      g.fillStyle=i%2?'#fff4cc17':'#263f4610';g.fillRect(rand()*W,rand()*H,rand()*2+1,1);
    }
  };
})();
