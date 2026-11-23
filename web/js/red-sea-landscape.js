/* 홍해 관찰창. 지형과 사람들의 위치를 같은 좌표계로 그려 걸은 거리에 따라 시점이 바뀐다. */
(function () {
  'use strict';
  const W = 800, H = 430;
  const cloth = ['#a84636','#527677','#d6a554','#344a58','#ba7458','#f1d3a0'];
  const skins = ['#784934','#9e6447','#724438','#b47d55'];
  function landscape(canvas, scene, view, distance) {
    const g = canvas.getContext('2d');
    if (!g) return;
    canvas.width = W; canvas.height = H;
    let seed = 621781;
    function random() { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; }
    function shape(color, pts) {
      g.fillStyle = color; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
      for (const p of pts.slice(1)) g.lineTo(p[0],p[1]);
      g.closePath(); g.fill();
    }
    function stroke(color, width, pts) {
      g.strokeStyle=color; g.lineWidth=width; g.lineCap='round';
      g.beginPath(); g.moveTo(pts[0][0],pts[0][1]);
      for(const p of pts.slice(1)) g.lineTo(p[0],p[1]);
      g.stroke();
    }
    function oval(color,x,y,rx,ry) {
      g.fillStyle=color; g.beginPath(); g.ellipse(x,y,rx,ry,0,0,Math.PI*2); g.fill();
    }
    function fade(y1,y2,colors) {
      const f=g.createLinearGradient(0,y1,0,y2);
      colors.forEach((c,i)=>f.addColorStop(i/(colors.length-1),c));return f;
    }
    function ridge(y,color,height,offset) {
      const pts=[[-5,H],[-5,y]];
      for(let x=-30;x<=850;x+=23) {
        pts.push([x,y-height*(.55+.27*Math.sin(x/68+offset)+.3*Math.sin(x/129-offset)+.22*random())]);
      }
      shape(color,pts.concat([[850,H]]));
    }
    const passage = scene === 'cross', morning = scene === 'song' || scene === 'return';
    const rear = scene === 'coast' && view === 'rear';
    const sunset = !morning && !passage;
    g.fillStyle = fade(0,282,passage ? ['#163a52','#6b9e9d','#ffdb96'] : morning ?
      ['#6098a9','#d9d7aa','#ffdc9b'] : ['#31445e','#a0777d','#ffc78a']);
    g.fillRect(0,0,W,H);
    const sunX = rear ? 222 : passage ? 424 : 588;
    const sunY = passage ? 171 : morning ? 104 : 149;
    for(const [r,c] of [[63,'#ffe0ac10'],[48,'#ffe0ac24'],[31,'#ffe0ac38'],[24,'#ffdf9f']]) oval(c,sunX,sunY,r,r);
    for(let i=0;i<33;i++) {
      const x=random()*820,y=23+random()*120,length=12+random()*78;
      stroke('#ffe6b926',1+random()*2,[[x,y],[x+length*.4,y-2],[x+length,y-1]]);
    }
    ridge(202,sunset?'#b68b83':'#a3b4a4',40,1.1);
    ridge(209,sunset?'#977779':'#819c99',27,4.1);
    function water() {
      g.fillStyle=fade(196,H,morning?['#97b7ac','#548f94','#295d70']:['#8b9392','#466e80','#234f64']);
      g.fillRect(0,196,W,H-196);
      for(let i=0;i<360;i++){
        const x=random()*W,y=198+random()*235;
        const len=(3+random()*29)*(.3+(y-197)/190);
        stroke(x>sunX-70 && x<sunX+64?'#ffe4ae8a':'#c5d8cb55',.7+random(),[[x,y],[x+len*.32,y-1],[x+len,y]]);
      }
    }
    function shore(points) {
      shape(fade(201,H,['#edc38a','#c38d60','#95674f']),points);
      g.save();g.clip();
      for(let i=0;i<250;i++){
        const x=random()*W,y=210+random()*230;
        stroke('#724c393a',1,[[x,y],[x+3+random()*16,y-1]]);
      }
      g.restore();
    }
    function person(x,y,h,i,dancing,drum) {
      g.save();g.translate(x,y);g.scale(h/48,h/48);
      oval('#332d292e',4,1,12,2.2);
      const ink='#403e3e', robe=cloth[i%cloth.length], skin=skins[i%skins.length];
      stroke(ink,2,[[-3,-8],[-4,0],[-7,0]]);
      stroke(ink,2,[[3,-8],[dancing?8:5,dancing?-3:0],[dancing?11:8,dancing?-3:0]]);
      shape(robe,[[-4,-34],[4,-34],[6,-24],[9,-5],[3,-3],[-8,-5],[-5,-22]]);
      shape('#27394553',[[1,-33],[5,-28],[8,-6],[3,-5]]);
      shape('#f0d7a64d',[[-4,-32],[-1,-31],[-2,-9],[-6,-6]]);
      stroke('#523f396b',1,[[-5,-21],[1,-20],[6,-22]]);
      stroke('#f3d6a255',1,[[2,-17],[4,-8]]);
      if(i%3===1) shape('#d6b684',[[-5,-33],[-1,-33],[5,-19],[3,-17]]);
      oval(skin,0,-39,4.3,5.3);
      shape(i%2?'#e5d1ae':'#514b45',[[-5,-39],[-4,-45],[1,-46],[5,-42],[5,-35],[1,-40]]);
      if(i%2) shape('#c9a87d',[[-5,-42],[-2,-43],[-3,-35],[-7,-26],[-7,-35]]);
      stroke(skin,2.5,[[-3,-31],[-8,dancing?-33:-24],[-10,dancing?-38:-22]]);
      stroke(skin,2.5,[[4,-31],[8,dancing?-35:-26],[11,dancing?-40:-24]]);
      if(drum){
        oval('#754e32',14,-43,7.8,8.2);
        oval('#f5d39b',14,-44,6.6,6.8);
        stroke('#cb9e61',.8,[[10,-39],[14,-48],[17,-40]]);
      }
      g.restore();
    }
    function tent(x,y,k) {
      g.save();g.translate(x,y);g.scale(k,k);
      shape('#765e55',[[-45,0],[-7,-33],[39,-4],[46,1]]);
      shape('#c08d65',[[-45,0],[-8,-34],[1,-2]]);
      shape('#e1b387',[[-9,-34],[19,-23],[46,1],[1,-2]]);
      shape('#4e514d',[[-12,-19],[-5,-4],[-22,-3]]);
      stroke('#65554d',1,[[-7,-34],[-56,2]]);
      stroke('#65554d',1,[[19,-24],[53,0]]);
      g.restore();
    }
    function chariot(x,y,k) {
      g.save();g.translate(x,y);g.scale(k,k);
      const ink='#524d50';
      for(const shift of [0,9]) {
        oval(ink,20+shift,-9,8,3.5);
        shape(ink,[[24+shift,-10],[26+shift,-17],[30+shift,-19],[33+shift,-16],[29+shift,-14],[27+shift,-8]]);
        stroke(ink,1.4,[[17+shift,-8],[14+shift,-2],[12+shift,0]]);
        stroke(ink,1.4,[[24+shift,-8],[29+shift,-2],[31+shift,-1]]);
      }
      stroke(ink,1.4,[[1,-6],[18,-8]]);
      shape(ink,[[-10,-13],[4,-13],[3,-7],[-8,-7]]);
      g.strokeStyle=ink;g.lineWidth=2;g.beginPath();g.arc(-5,-5,4,0,Math.PI*2);g.stroke();
      oval(ink,-3,-19,2.1,2.3);stroke(ink,2.3,[[-3,-17],[-3,-12]]);
      g.restore();
    }
    function wall(left, t) {
      g.save(); if(!left){ g.translate(W,0);g.scale(-1,1); }
      const inner=left?355:325;
      g.beginPath();g.moveTo(-10,-15);
      g.bezierCurveTo(55,3,71,48,113,42);
      g.bezierCurveTo(141,42,134,70,157,76);
      g.bezierCurveTo(193,73,187,110,218,120);
      g.bezierCurveTo(254,118,247,148,289,153);
      g.bezierCurveTo(314,159,320,177,inner,185);
      g.lineTo(inner,203);
      g.bezierCurveTo(303,225,207,256,140,300);g.bezierCurveTo(75,344,12,379,-16,402);g.closePath();
      g.fillStyle=fade(0,389,['#176375','#58aaad','#246378','#16495c']);g.fill();
      g.save();g.clip();
      for(let band=0;band<14;band++){
        const x=band*27-50, skew=left?0:10;
        g.fillStyle=band%2?'#97d6c328':'#053c5626';
        g.beginPath();g.moveTo(x-65,-18);
        g.bezierCurveTo(x+37,38+skew,x+72,97,x+37,147);
        g.bezierCurveTo(x+10,199,x+17,247,x-78,355);
        g.bezierCurveTo(x-36,249,x+21,175,x+15,127);
        g.bezierCurveTo(x+34,66,x-8,29,x-65,-18);g.fill();
      }
      for(let i=0;i<220;i++){
        const x=random()*380, y=random()*320, size=(1-x/440)*(.6+random());
        g.strokeStyle=i%4?'#b1e4d029':'#e6f6d45e';g.lineWidth=.7+size*1.5;
        g.beginPath();g.moveTo(x,y);
        g.bezierCurveTo(x+13*size,y-11*size,x+5*size,y-24*size,x+23*size,y-28*size);g.stroke();
      }
      g.restore();
      g.strokeStyle='#c6e6d3';g.lineWidth=2.5;g.beginPath();g.moveTo(-4,-5);
      g.bezierCurveTo(55,3,71,48,113,42);g.bezierCurveTo(141,42,134,70,157,76);
      g.bezierCurveTo(193,73,187,110,218,120);g.bezierCurveTo(254,118,247,148,289,153);
      g.bezierCurveTo(314,159,320,177,inner,185);g.stroke();
      for(const [x,y,scale] of [[90,43,1],[148,73,.72],[208,116,.58],[277,150,.41]]) {
        for(let i=0;i<24;i++){
          const dx=(random()-.5)*32*scale;
          oval('#e4efcb98',x+dx,y-2-random()*14*scale,1.3*scale,1.1*scale);
        }
      }
      for(let i=0;i<65;i++){
        const v=random(), y=201+190*v*v;
        const x=inner*(1-Math.pow(v,1.24))+Math.sin(v*6+t)*5;
        stroke('#daebd49c',1+v*2,[[x,y],[x+7+v*8,y-1]]);
      }
      g.restore();
    }
    if(passage){
      const t=distance/100;
      shore([[0,202],[800,190],[800,H],[0,H]]);
      for(let i=0;i<220;i++){
        const depth=(random()+t*.43)%1, x=400+(random()-.5)*depth*900, y=201+220*depth*depth;
        stroke('#ffe4a287',.6+depth*2,[[x,y],[x+3+depth*9,y]]);
      }
      wall(true,t);wall(false,t);
      for(let i=0;i<29;i++){
        const depth=(i/29+t*.33)%1;
        const x=404+Math.sin(i*2.12)*depth*126;
        person(x,201+depth*depth*139,6+depth*36,i,false,false);
      }
      const near=1-t*.55;
      person(190+62*t,393-79*t,95*near,1,false,false);
      person(241+49*t,395-78*t,63*near,3,false,false);
      person(646-71*t,389-68*t,83*near,4,false,false);
    } else {
      water();
      if(rear){
        ridge(248,'#ac8770',39,2.4);
        shore([[0,266],[230,230],[470,246],[650,215],[800,226],[800,H],[0,H]]);
        for(let i=0;i<8;i++) chariot(48+i*84,243+Math.sin(i*2)*7,.42+i%3*.10);
        chariot(553,273,1.05);chariot(645,282,1.27);
        for(let i=0;i<26;i++) oval('#e1c59838',583+random()*152,257+random()*19,3+random()*10,2+random()*3);
        tent(91,325,.68);
      } else {
        shore([[0,214],[105,225],[200,246],[333,252],[508,286],[562,301],[712,319],[800,346],[800,H],[0,H]]);
        if(scene==='coast' && view!=='shore') {
          tent(48,265,.69);tent(150,277,.81);tent(55,327,1.08);
        }
      }
      if(scene==='song'){
        for(let i=0;i<20;i++){
          const x=41+i*38, y=275+x*.095+Math.sin(i*.77)*13;
          person(x,y,28+i%3*5,i+3,true,i%3===0);
        }
        person(505,384,84,4,true,true);person(634,391,99,3,true,true);
        person(345,408,133,1,true,true);person(199,391,93,5,true,true);
      }else{
        const total=rear?8:view==='shore'?5:20;
        for(let i=0;i<total;i++){
          const x=95+(i*67)%570,y=286+x*.083+Math.sin(i)*11;
          person(x,y,22+(i%5)*4,i,false,false);
        }
        if(rear){ person(207,405,102,1,false,false);person(256,398,61,3,false,false); }
        if(scene==='return'){ person(535,376,69,5,false,false);person(588,388,58,2,false,false); }

      }
    }
    for(let i=0;i<5000;i++){
      g.fillStyle=i%2?'#f5eac410':'#1535460b';g.fillRect(random()*W,random()*H,1+random()*1.8,1);
    }
  }
  BO.drawRedSea = landscape;
})();
