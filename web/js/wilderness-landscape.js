/* 광야 관찰창의 배경. 인물은 현장에 머무르고 플레이어와 탐사 장비만 이동한다. */
(function () {
  'use strict';
  const themes = {
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
    function illustratedCamp(){
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
      function grains(x,y,rx,ry,count,size){
        for(let i=0;i<count;i++){
          const a=rand()*Math.PI*2,r=Math.sqrt(rand()),xx=x+Math.cos(a)*rx*r,yy=y+Math.sin(a)*ry*r;
          const k=size*(.4+rand()*.7);
          oval(xx+.2,yy+.65,k*1.05,k*.55,'#876b5b8a');
          oval(xx,yy,k,k*.63,['#fff3d4','#eddfc1','#f7e7c5'][i%3]);
        }
      }
      // 옆으로 굽힌 허리와 땅으로 뻗는 팔을 한 윤곽으로 읽을 수 있게 그린다.
      function gatherer(x,y,k,colours,flip){
        const [robe,light,wrap]=colours;
        g.save();g.translate(x,y);g.scale(k*(flip?-1:1),k);
        shape('M-54 1 Q-34 -4 -6 -4 L28 -3 Q34 -2 27 1 L-28 4Z','#715b653e');
        shape('M-23 -23 Q-31 -20 -34 -12 L-41 -7 Q-43 -4 -38 -3 L-27 -4 Q-21 -13 -13 -12 L1 -7 L13 -6 L15 -9 L4 -14 L-5 -24Z','#795440');
        shape('M-27 -25 Q-25 -37 -13 -46 Q-4 -52 6 -48 L13 -40 Q15 -32 2 -25 L-3 -16 L5 -10 L17 -7 Q19 -2 8 -2 L-12 -4 L-21 -9 L-38 -6 Q-42 -6 -42 -11 Q-32 -15 -27 -25Z',robe);
        shape('M-24 -26 Q-19 -37 -9 -40 L2 -44 L6 -40 Q-3 -33 -11 -24 L-15 -14 L-3 -8 L-15 -10 L-27 -9 L-20 -17Z',light);
        stroke('M-18 -11 Q-12 -17 -10 -22 M-12 -13 Q-9 -16 -5 -20','#493c472f',1.5);
        shape('M-6 -45 Q0 -54 9 -53 L17 -48 L18 -42 L21 -37 L18 -36 L16 -33 L9 -34 L5 -39 L0 -38Z','#bb805a');
        shape('M-14 -43 Q-9 -51 -4 -54 Q7 -61 16 -53 L19 -48 Q12 -49 6 -46 L0 -42 L-3 -35 Q-12 -35 -17 -38Z',wrap);
        stroke('M-10 -45 Q0 -53 10 -53','#f8d5a783',1.45);
        stroke('M12 -43 L14 -42','#604d47',.9);
        shape('M-5 -38 Q-1 -40 3 -39 Q8 -35 12 -28 L18 -23 L13 -19 Q4 -21 -3 -29 Q-6 -33 -5 -38Z',light);
        stroke('M15 -21 Q17 -17 23 -13 L30 -7 L28 -5 M28 -8 L33 -7','#b47a56',3.4);
        g.restore();
      }
      function dish(x,y,k,full){
        g.save();g.translate(x,y);g.scale(k,k);
        oval(-5,1,28,3.8,'#755e5845');
        shape('M-22 -12 Q-19 -1 -6 1 Q3 4 14 0 L23 -12Z',grad(-12,2,['#c78a59','#a56647','#81513e']));
        oval(0,-12,22.6,6.2,'#d9a574');oval(0,-12,19.8,4.65,'#76513e');
        if(full){oval(0,-12.3,18.8,3.9,'#e6d0a6');grains(0,-13,17,3,47,.85);}
        stroke('M-20 -11 Q0 -1 21 -11','#e5b27d',1.4);g.restore();
      }
      function twoDaysInCamp(){
        // 같은 언덕에서 본 두 기록. 능선, 길, 장막, 그릇 관찰점은 고정한다.
        g.fillStyle=grad(0,172,later?['#526e86','#acb4b5','#edd4ae']:['#637792','#d2b1ac','#f7d7a5']);
        g.fillRect(0,0,W,H);
        const sunlight=g.createRadialGradient(96,114,2,96,114,196);
        sunlight.addColorStop(0,'#fff1baaf');sunlight.addColorStop(.57,'#ffe1ad45');sunlight.addColorStop(1,'#ffe1ad00');
        g.fillStyle=sunlight;g.fillRect(0,0,302,207);
        shape('M0 54 Q51 48 100 52 Q137 55 157 52 Q128 60 87 58 T0 60Z M245 47 Q299 39 331 43 Q359 47 391 43 Q365 53 316 49 T245 47Z M471 77 Q517 71 555 74 Q595 77 625 73 Q603 83 559 80 T471 77Z','#fff0d44f');
        shape('M0 155 L0 113 L29 115 L55 106 L92 111 L121 98 L147 98 L165 88 L190 92 L216 83 L247 83 L262 75 L278 75 L290 82 L305 80 L334 102 L360 103 L380 111 L400 110 L437 128 L468 124 L496 129 L518 123 L543 127 L569 116 L605 118 L642 103 L670 104 L705 91 L735 94 L753 89 L800 91 L800 187Z',grad(74,176,['#a39aa4','#c5aaa5','#e4c5aa']));
        shape('M-3 152 L20 146 L38 146 L74 129 L90 127 L113 116 L142 117 L156 111 L180 112 L204 96 L241 96 L253 87 L277 87 L297 101 L316 104 L343 121 L366 122 L390 133 L411 133 L452 151 L485 151 L502 168 L0 180Z',grad(87,177,['#af8f8a','#c09c8c','#cfaf92']));
        shape('M45 148 L83 132 L97 129 L110 120 L139 120 L124 126 L122 132 L105 139 L99 146 L76 151Z M134 152 L172 131 L186 128 L199 117 L226 109 L240 98 L252 97 L260 90 L275 89 L267 100 L255 105 L250 114 L230 122 L219 132 L197 139 L181 147Z M267 136 L289 117 L301 112 L312 111 L297 122 L292 130Z','#927e80');
        stroke('M78 129 L96 125 L112 116 L142 117 M180 113 L204 97 L242 97 L254 88 L275 88 M318 106 L343 121 L367 123','#ebc49f',1.7);
        shape('M425 165 L453 154 L484 156 L509 143 L528 141 L549 131 L576 128 L599 115 L624 116 L644 104 L673 104 L691 92 L711 89 L724 85 L750 85 L774 72 L800 70 L800 179Z',grad(73,174,['#867f8b','#a48e91','#b99f91']));
        shape('M584 148 L603 133 L619 131 L637 118 L650 116 L661 108 L669 107 L658 118 L653 126 L630 136 L622 143Z M690 133 L710 115 L722 112 L732 100 L746 96 L756 87 L769 84 L753 103 L740 108 L732 118 L714 126Z','#837c86');
        shape('M0 164 Q143 151 250 159 Q364 170 489 153 Q610 139 802 153 L802 398 L-2 398Z',grad(152,396,later?['#c7ac8c','#d0ae84','#ad8a70','#8b7065']:['#d5b795','#deb98c','#bd9473','#917363']));
        shape('M0 182 Q125 163 231 173 T452 166 Q554 156 688 159 Q530 153 418 174 Q321 189 208 178 Q113 174 0 194Z','#f5d2a06e');
        // 가늘어지는 옛길이 들판에서 장막들 사이로 들어간다.
        shape('M-12 348 Q120 292 242 287 Q377 280 432 251 Q503 215 560 210 Q520 211 461 241 Q395 280 257 274 Q116 267 -12 314Z',grad(210,349,['#e9c79d','#f2ce9d','#d7ac85']));
        for(let i=0;i<1150;i++){
          const x=rand()*W,y=167+rand()*229,depth=(y-167)/229;
          line(x,y,x+1+rand()*8*depth,y-.2-rand()*.5,i%2?'#fff0bd50':'#705c6242',.5+depth*.75);
        }
        for(let i=0;i<21;i++){
          const x=36+i*36+Math.sin(i)*8,y=171+Math.sin(i*.73)*3;
          stripedTent(x,y,.16+(i%4)*.038);
        }
        for(const [x,y,k] of [[17,188,.73],[119,175,.33],[403,182,.49],[458,179,.44],[502,178,.41],[699,178,.4],[771,191,.86]])
          stripedTent(x,y,k);
        for(const [x,y,k,id] of [[74,188,.19,2],[79,189,.22,0],[427,184,.22,3],[471,186,.21,2],[726,190,.24,1]])traveller(x,y,k,people[id]);
        // 횡으로 긴 천막의 햇빛 든 주름과 열린 그늘을 두 날의 공통 표지로 삼는다.
        shape('M473 225 L512 211 L621 209 Q645 214 705 230 L668 236 L567 228Z','#63576138');
        shape('M485 222 L508 196 L532 156 L555 151 L612 140 L642 148 L661 173 L687 215 L693 220 L631 224Z',grad(140,224,['#8a564c','#995e49','#714c42']));
        shape('M488 220 Q516 194 532 156 Q555 156 611 140 Q599 163 589 179 L563 181 Q534 185 522 185 L501 222Z',grad(143,218,['#e7be8c','#c69b74','#b77d57']));
        shape('M522 185 Q555 185 590 177 L608 219 L521 223Z',grad(176,224,['#493d40','#655049','#80614d']));
        shape('M587 177 L612 140 Q622 175 633 188 L638 222 Q618 215 610 218Z','#bd8058');
        shape('M611 142 L642 149 Q655 176 673 196 L690 219 L646 217 Q628 177 611 142Z','#a77158');
        for(const x of [529,551,572]){
          const y=157-(x-529)*.26;
          stroke('M'+x+' '+y+' q-6 13 -17 28','#754c4657',2.4);
          stroke('M'+(x+3)+' '+y+' q-6 14 -18 28','#f3c99585',1.3);
        }
        stroke('M484 226 Q517 189 532 154 M613 137 L612 142 M612 141 Q659 179 704 223 M517 183 L514 223 M599 178 L604 220','#775847',2);
        stroke('M522 185 Q547 185 568 180 T590 176','#efd0a2',2);
        jar(652,223,.66);jar(664,226,.44);
        // 테두리가 있는 자루·토기는 수확물의 다양한 용기다.
        function sack(x,y,k){
          g.save();g.translate(x,y);g.scale(k,k);
          shape('M-13 1 Q-18 -5 -12 -15 L-6 -25 L-10 -31 L0 -29 L8 -32 L5 -25 Q17 -13 17 -4 Q19 1 10 3Z',grad(-30,3,['#ceaf7c','#b58a5b','#8f694c']));
          stroke('M-6 -24 Q0 -22 6 -25 M-9 -6 Q-11 -13 -7 -17 M4 -13 Q8 -10 8 -4','#845f46',1.5);
          stroke('M-8 -28 L-1 -25 L5 -29 M-11 0 Q-5 2 3 1','#edd0a0',1.1);
          g.restore();
        }
        // 옷자락을 펼치고 무릎에 손을 얹어, 몸을 굽혀 줍는 자세와 구별한다.
        function seated(x,y,k,colours,flip){
          const [robe,light,wrap]=colours;
          g.save();g.translate(x,y);g.scale((flip?-1:1)*k,k);
          oval(0,1,23,3,'#51444d38');
          shape('M-8 -20 Q-2 -21 3 -16 Q12 -22 16 -18 Q21 -13 27 -5 Q31 0 23 1 L-9 1 Q-20 1 -19 -6Z',robe);
          shape('M2 -13 Q14 -24 18 -15 L26 -5 L17 -5 L9 -11 L-1 -5 L-11 -3Z',light);
          shape('M-14 -36 Q-14 -42 -5 -43 Q4 -42 7 -35 L8 -24 L4 -14 L-5 -7 L-17 -6 Q-22 -12 -17 -23Z',robe);
          shape('M-11 -34 Q-12 -29 -10 -22 L-11 -14 L-16 -9 Q-19 -15 -16 -24Z',light);
          shape('M-8 -44 Q-13 -50 -10 -55 Q-8 -61 0 -60 Q7 -59 6 -53 L9 -49 L7 -48 L6 -45 L1 -44 L1 -41 L-5 -40Z','#bd8762');
          shape('M-15 -52 Q-16 -59 -9 -63 Q2 -67 6 -58 L7 -56 Q0 -57 -3 -54 L-6 -44 L-13 -38 L-17 -40 Q-14 -46 -15 -52Z',wrap);
          stroke('M-14 -56 Q-6 -61 3 -59','#f6d6a8aa',1.3);
          stroke('M-3 -35 Q-1 -29 3 -23 L14 -17',light,5.7);
          stroke('M12 -18 L17 -16 L21 -17','#c89269',3.3);
          stroke('M0 -7 Q4 -11 7 -11 M-9 -2 Q-3 -3 1 -7','#4d414748',1.3);
          g.restore();
        }
        if(later){
          // 안식에 이른 대목. 빈 들을 거쳐 온 흔적은 남기고 장막 그늘의 사람에 시선을 둔다.
          for(const [x,y,k] of [[328,268,.9],[344,263,.84],[360,263,.78],[376,257,.7],[393,257,.63],[407,252,.54],[425,249,.48],[440,244,.43]]){
            g.save();g.translate(x,y);g.rotate(-.3);oval(0,0,3.8*k,1.5*k,'#99775e77');g.restore();
          }
          for(const [x,y,k,i,flip] of [[446,190,.29,1,false],[463,191,.25,0,true],[722,199,.36,0,true],[734,201,.38,2,false]])seated(x,y,k,people[i],flip);
          shape('M513 229 L583 224 L625 236 L544 243Z','#876256');
          stroke('M530 233 L582 229 M542 239 L612 234','#c9a477',1.7);
          seated(538,233,.65,people[2],false);seated(558,235,.64,people[1],false);
          seated(583,240,.99,people[0],true);seated(611,233,.65,people[3],true);
          sack(637,236,.53);dish(626,234,.47,false);
        }else{
          for(const [x,y,rx,ry,n,k] of [[95,216,95,11,115,1],[239,230,116,15,175,1.05],[321,263,122,15,210,1.4],[180,269,105,17,147,1.5],[401,222,59,6,62,.85]])
            grains(x,y,rx,ry,n,k);
          for(const [x,y,k,i,flip] of [[74,209,.36,1,false],[154,199,.27,2,true],[208,204,.34,0,true],[286,200,.28,3,false],[326,208,.39,2,false],[380,214,.44,1,true],[427,205,.31,0,false]])
            gatherer(x,y,k,people[i],flip);
          traveller(102,222,.58,people[3],false,true);sack(115,207,.29);
          traveller(367,231,.63,people[2],false,true);sack(380,215,.39);
          traveller(467,226,.52,people[1]);sack(455,212,.34);
          gatherer(178,239,.67,people[2],false);dish(207,239,.48,false);
          traveller(222,250,.91,people[1],false,true);sack(241,225,.47);
          gatherer(267,264,1.12,people[0],false);
          dish(302,272,.62,true);
          gatherer(109,280,1.04,people[3],false);sack(149,281,.71);
        }
        // 얕은 골과 바위 테두리로 두 엽서가 같은 시점임을 확인할 수 있다.
        shape('M-2 353 Q79 322 166 331 Q234 346 324 330 T463 324 Q608 335 695 309 Q752 298 802 306 L802 397 L-2 397Z',grad(310,396,['#c5a282','#aa8870','#806962']));
        stroke('M0 352 Q85 322 162 331 M210 338 Q267 341 321 331 M526 328 Q596 332 659 317','#e8c59b',2);
        function shale(x,y,k){
          g.save();g.translate(x,y);g.scale(k,k);
          shape('M-22 0 L-10 -5 L4 -4 L18 -1 L10 3 L-7 4Z','#74626868');
          shape('M-14 -1 L-7 -9 L4 -12 L12 -9 L17 -4 L11 0 L0 2Z','#8e7970');
          shape('M-14 -1 L-7 -9 L4 -12 L12 -9 L3 -8 L-2 -3Z','#c6a78b');
          stroke('M-8 -8 L4 -11 L10 -9','#e2c09b',1.4);g.restore();
        }
        seed=28713;
        for(let i=0;i<230;i++){
          const x=rand()*W,y=350+rand()*46;
          line(x,y,x+2+rand()*9,y-.9,i%2?'#e8c9a66b':'#65546656',.65+rand()*.8);
        }
        for(const [x,y,k] of [[34,363,2.5],[55,345,.83],[164,301,.72],[375,277,.4],[477,292,.75],[759,322,1.6],[793,332,2.46]])shale(x,y,k);
        for(let i=0;i<4500;i++){
          g.fillStyle=i%2?'#fff7df21':'#51414d19';g.fillRect(rand()*W,rand()*H,1+rand(),.6);
        }
      }
      function mannaMorning(){
        // 바닥의 홈과 돌, 장막과 그 그림자는 두 기록에서 같은 자리에 둔다.
        g.fillStyle=grad(0,195,['#435c7e','#ad9aac','#e8b69d','#fae3b4']);g.fillRect(0,0,W,H);
        const dawn=g.createRadialGradient(610,139,6,610,139,190);
        dawn.addColorStop(0,'#fff8d9dc');dawn.addColorStop(.42,'#ffdaac81');dawn.addColorStop(1,'#f8d49d00');
        g.fillStyle=dawn;g.fillRect(420,0,380,236);oval(610,139,14,14,'#fff2c6');
        for(let i=0;i<32;i++){
          const x=rand()*860-45,y=14+rand()*116,w=18+rand()*109;
          shape('M'+x+' '+y+' q'+(w*.27)+' -5 '+w+' -2 q-'+(w*.37)+' .2 -'+(w*.84)+' 3Z','#fce4d225');
        }
        shape('M0 169 L46 152 L78 154 L123 138 L164 143 L190 135 L223 139 L268 117 L283 119 L301 112 L342 125 L391 121 L425 132 L472 121 L509 141 L556 135 L603 148 L653 137 L692 144 L738 119 L798 124 L803 207 L0 207Z',
          grad(115,190,['#b6a2a4','#e9c1a8']));
        shape('M0 167 L25 149 L64 147 L78 136 L117 137 L125 128 L142 125 L166 125 L176 117 L205 118 L224 132 L247 132 L269 145 L284 145 L308 154 L337 153 L360 164 L402 163 L459 179 L478 193 L0 193Z',
          grad(119,195,['#a7898d','#b08e8e','#c4a49a']));
        shape('M-2 173 L53 153 L66 153 L84 139 L119 139 L111 145 L111 153 L89 159 L78 170 L51 175 L30 186 L-2 190Z M111 169 L129 154 L138 146 L149 144 L155 136 L164 134 L170 125 L179 119 L202 120 L196 131 L184 138 L175 149 L164 151 L152 160 L135 165 L126 175Z M208 158 L218 142 L227 140 L237 138 L245 137 L234 149 L222 153 L214 163Z','#917c87');
        stroke('M67 149 L82 138 L118 138 M127 129 L143 126 L165 126 L177 118 L201 119 M173 137 L181 132 L184 126 M248 135 L269 146 L282 146','#ecc2a3a8',1.6);
        shape('M438 192 L481 180 L516 179 L551 170 L591 172 L620 164 L655 163 L675 156 L710 155 L730 142 L759 141 L775 130 L802 128 L802 204 L438 204Z',
          grad(131,201,['#bd9390','#d5ac93']));
        shape('M685 175 L714 159 L733 155 L748 146 L765 145 L760 153 L743 158 L731 166 L712 170 L697 177Z M773 159 L785 142 L802 133 L802 155Z','#a88a86');
        shape('M0 191 Q98 178 186 188 Q295 200 390 187 T570 185 Q701 173 801 186 L801 396 L0 396Z',
          grad(185,396,['#c8a38a','#d5aa83','#c39472','#a17b68']));
        shape('M0 209 Q160 189 285 200 T486 190 Q604 182 721 190 Q658 187 527 200 Q424 211 319 206 T110 208 L0 221Z','#e9c69c');
        for(let i=0;i<1200;i++){
          const x=rand()*800,y=194+rand()*202,d=(y-194)/202;
          line(x,y,x+1+rand()*8*d,y-.2-rand()*.7,i%2?'#f8d5a366':'#765d6136',.5+d*.6);
        }
        for(let i=0;i<20;i++)stripedTent(27+i*39,196+Math.sin(i*.45)*4,.23+(i%5)*.034);
        for(const [x,y,k] of [[45,212,.95],[108,206,.68],[173,203,.56],[486,198,.41],[700,209,.88],[774,212,1.13]])stripedTent(x,y,k);
        jar(67,213,.37);jar(747,216,.42);
        // 동일한 지형의 밝은 턱과 자갈은 아이가 관찰경의 같은 부분을 찾는 기준점이다.
        const swale='M-7 256 Q89 236 149 247 Q245 261 329 244 Q386 230 464 236 T597 223 Q644 216 706 223 Q741 227 805 216 L805 244 Q756 249 680 242 Q595 241 535 263 Q470 280 384 273 Q323 270 283 290 Q218 315 167 312 Q80 305 -7 332Z';
        shape(swale,grad(229,328,['#bb997e','#bf9979','#ad8166']));
        stroke('M0 333 Q76 306 152 312 M168 313 Q219 318 274 295 M390 273 Q457 281 508 270','#f1c59a',1.8);
        if(!later){
          // 이슬은 지면과 풀에 얇게 맺힌다. 햇볕 든 마른 흙이 서리빛 사이로 비친다.
          for(const [x,y,rx,ry] of [[62,259,119,16],[220,272,118,19],[283,252,109,13],[450,249,101,12],
              [645,230,141,11],[201,295,103,20],[647,282,98,15]]){
            g.save();g.translate(x,y);g.scale(rx,ry);
            const sheen=g.createRadialGradient(0,0,.03,0,0,1);
            sheen.addColorStop(0,'#bdc7c9c7');sheen.addColorStop(.55,'#b8c3ca8f');sheen.addColorStop(1,'#bad0d000');
            oval(0,0,1,1,sheen);g.restore();
            for(let i=0;i<86;i++){
              const angle=rand()*Math.PI*2,r=Math.sqrt(rand()),dx=x+Math.cos(angle)*r*rx,dy=y+Math.sin(angle)*r*ry;
              const drop=.4+rand()*.85;
              oval(dx,dy,drop*1.15,drop*.8,'#a0aba9');oval(dx-.25,dy-.15,drop*.67,drop*.48,'#fff5dd');
            }
          }
        }
        function shale(x,y,k){
          g.save();g.translate(x,y);g.scale(k,k);
          shape('M-22 1 L-13 -2 L2 -3 L16 0 L9 3Z','#826a655f');
          shape('M-12 0 L-6 -7 L5 -9 L13 -4 L10 0 L2 2Z','#a08574');
          shape('M-12 0 L-6 -7 L5 -9 L1 -4 L-7 0Z','#b99e85');
          stroke('M-6 -6 L4 -8 L11 -4','#e2c19c',1.2);g.restore();
        }
        const fixedSeed=83081;
        seed=fixedSeed;
        for(let i=0;i<34;i++){
          const x=rand()*800,y=218+rand()*108;
          shale(x,y,.1+(y-218)*.003);
        }
        shale(156,312,.98);shale(277,290,.71);shale(312,284,.34);shale(39,304,1.15);shale(688,271,.55);
        // 작은 낟알은 타원형 한 줌 단위에서만 그림자와 붓 끝 하이라이트가 구별된다.
        if(later){
          for(const [x,y,rx,ry,n,k] of [[80,257,78,12,79,1.15],[222,267,88,11,85,1.25],[380,255,84,15,131,1.15],
              [477,247,69,8,71,1.12],[661,235,96,9,63,1],[219,294,96,18,217,1.65],[461,281,88,18,138,1.6],[672,288,77,15,94,1.45]])grains(x,y,rx,ry,n,k);
        }
        function herbs(x,y,k){
          g.save();g.translate(x,y);g.scale(k,k);
          stroke('M0 0 Q-4 -15 -18 -20 M-1 -1 Q1 -16 -4 -30 M1 -1 Q5 -12 13 -19 M-2 -8 L-12 -9 M5 -9 L16 -12','#847a61',1.4);
          if(!later)for(const [dx,dy] of [[-18,-19],[-4,-29],[13,-18],[-12,-8],[16,-11]]){
            oval(dx,dy+1,2,2.7,'#71929a');oval(dx-.4,dy+.4,1.25,1.5,'#f1ece0');
          }
          g.restore();
        }
        herbs(187,304,.86);herbs(268,288,.51);herbs(63,283,.56);herbs(744,277,.78);
        if(later){
          for(const [x,y,k,i,flip] of [[70,235,.36,1,false],[166,225,.32,0,true],[243,232,.36,3,false],[327,224,.34,2,false],
              [566,228,.37,0,true],[660,226,.41,2,false],[742,240,.44,3,true]]){
            if(x===166||x===566){
              traveller(x,y,k*.96,people[i],false,flip);dish(x+(flip?7:-7),y-10*k,k*.51,true);
            }else{
              gatherer(x,y,k,people[i],flip);dish(x+(flip?-16:16),y+1,k*.65,false);
            }
          }
          gatherer(367,246,.65,people[3],true);dish(341,247,.49,true);
          gatherer(418,263,1.03,people[0],false);dish(469,264,.76,true);
          traveller(485,245,.78,people[1],false,true);
          // 물건과 사람의 크기 관계만 나타낸다. 그릇 크기가 곧 한 오멜이라는 눈금은 그리지 않는다.
          traveller(622,305,1.42,people[2],true);
          stroke('M612 268 Q609 275 600 277 L591 274','#e4b983',8);
          stroke('M603 277 Q596 279 589 275 L580 274','#bd855f',5);
          g.save();g.translate(580,263);g.rotate(-.38);
          shape('M-11 -4 L11 -4 L9 13 Q0 16 -8 12Z',grad(-4,14,['#cfa276','#966748']));
          oval(0,-4,11.5,3.6,'#e9c299');oval(0,-4,9,2.4,'#906740');grains(-1,-4,7,1.2,17,.65);g.restore();
          stroke('M581 275 Q584 278 590 275 M581 272 Q585 275 590 272','#ce996e',1.9);
          dish(550,309,1.54,true);dish(503,306,.72,true);jar(675,297,.73);
        }else{
          traveller(339,213,.25,people[3]);traveller(362,214,.28,people[1],false,true);
          traveller(654,216,.31,people[0]);jar(637,217,.32);
        }
        shape('M-2 367 Q114 334 230 346 T458 355 Q593 335 802 343 L802 398 L-2 398Z',grad(339,396,['#ceaa84','#b88f72','#987564']));
        stroke('M0 365 Q93 341 154 344 M341 355 Q419 362 487 351 M594 344 Q643 341 683 343','#e7c69c',1.6);
        seed=349822;
        for(let i=0;i<360;i++){
          const x=rand()*W,y=362+rand()*38;
          line(x,y,x+1+rand()*7,y-.5,i%2?'#e5c79880':'#76585c42',.55+rand()*.8);
        }
        shale(10,365,2.2);shale(786,352,1.9);herbs(20,366,1.14);
        for(let i=0;i<5400;i++){
          g.fillStyle=i%2?'#fff8d71c':'#46384d15';g.fillRect(rand()*W,rand()*H,.8+rand()*1.4,.6);
        }
      }
      if(id==='manna'){mannaMorning();return;}
      if(id==='sabbath'){twoDaysInCamp();return;}
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
    if(id==='marah'||id==='elim'||id==='manna'||id==='sabbath'){illustratedCamp();return;}
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
    const sx=172,sy=76;
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
