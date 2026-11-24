/* 광야 관찰창의 배경. 인물은 현장에 머무르고 플레이어와 탐사 장비만 이동한다. */
(function () {
  'use strict';
  const themes = {
    marah:['#4a697d','#e8b498','#f6d39b','#b58979','#977164','#ecc48d','#b17b53'],
    elim:['#669eae','#c4dabb','#f5dfaa','#9fa78a','#778d78','#e6c58d','#ac825b'],
    manna:['#666e92','#ddb4b4','#f6d3ac','#ab9296','#8b7e85','#e4be97','#ac8c77'],
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
    function palm(x,y,h){
      g.save();g.translate(x,y);g.scale(h/100,h/100);
      poly([[-4,0],[-3,-42],[4,-91],[8,-93],[3,-40],[5,0]],'#80684d');
      for(let j=0;j<9;j++)line(-2+j*.5,-8-j*9,3+j*.45,-10-j*9,'#c69f72',1.2);
      for(let j=0;j<11;j++){
        const angle=-Math.PI+.19+j*(Math.PI-.38)/10, rx=Math.cos(angle)*44, ry=Math.sin(angle)*32;
        const hue=['#315e55','#437562','#527d60','#759364'][j%4];
        g.beginPath();g.moveTo(5,-89);g.quadraticCurveTo(6+rx*.58,-100+ry*.9,5+rx,-87+ry*.35);g.strokeStyle=hue;g.lineWidth=2.3;g.stroke();
        for(let n=1;n<8;n++){
          const t=n/8, px=5+rx*t,py=-89+ry*.35*t-4*(1-t)*t*(11-ry*.6);
          poly([[px,py],[px+rx*.07,py+2],[px+rx*.15,py+7+4*t]],hue);
        }
      }
      g.restore();
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
    function pool(x,y,rx,ry){
      oval(x,y+3,rx+7,ry+4,'#a68562');
      oval(x,y,rx,ry,grad(y-ry,y+ry,['#9bc6b7','#5e9a96','#467d80']));
      for(let i=0;i<95;i++){
        const a=rand()*6.28,r=Math.sqrt(rand()),px=x+Math.cos(a)*rx*r*.94,py=y+Math.sin(a)*ry*r*.9;
        line(px,py,px+3+rand()*9,py-.5,'#e0edcd85',.8+rand()*.7);
      }
    }
    function tent(x,y,k){
      poly([[x-22*k,y],[x-5*k,y-17*k],[x+11*k,y-13*k],[x+27*k,y+1]],'#ad8469');
      poly([[x-20*k,y],[x-5*k,y-17*k],[x+1*k,y]],'#d1ae83');
      poly([[x-13*k,y],[x-6*k,y-10*k],[x-4*k,y]],'#65635c');
    }
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
    }else if(id==='marah'){
      pool(410,264,281,42);pool(94,312,70,11);
      for(let i=0;later&&i<5;i++){
        g.beginPath();g.ellipse(325,262,8+i*13,2+i*2.9,0,.1,5.75);g.strokeStyle='#ffe5abbd';g.lineWidth=1.6;g.stroke();
      }
      if(later)line(310,261,345,256,'#7d6647',3.2);
      for(let i=0;i<8;i++)person(591+i*18,246+i%3*4,21+i%3*4,i,false);
    }else if(id==='elim'){
      for(let i=0;i<25;i++)palm(12+rand()*773,210+rand()*18,30+rand()*28);
      for(let i=0;later&&i<5;i++)tent(499+i*43,230+Math.sin(i)*5,.65+rand()*.2);
      pool(366,272,242,40);pool(599,306,117,15);
      palm(110,288,109);palm(145,276,85);palm(625,270,102);palm(696,279,137);
      person(485,254,25,2,false);person(506,255,20,3,false);
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
