/* 같은 진 바깥 자리에서 본 장막과 시내산. 탐험대의 표식은 화면 쪽에만 얹는다. */
BO.drawSinaiCamp = function(canvas, storm) {
  const w=800,h=396,g=canvas.getContext('2d');
  canvas.width=w*2; canvas.height=h*2;g.scale(2,2);
  let seed=1941;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  function wash(top,bottom,colors) {
    const v=g.createLinearGradient(0,top,0,bottom);
    colors.forEach((c,i)=>v.addColorStop(i/(colors.length-1),c));return v;
  }
  function fill(path,ink){g.fillStyle=ink;g.fill(new Path2D(path));}
  function line(path,ink,width){g.strokeStyle=ink;g.lineWidth=width;g.lineCap='round';g.stroke(new Path2D(path));}
  function oval(x,y,rx,ry,ink){g.fillStyle=ink;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();}
  g.fillStyle=wash(0,240,storm?['#233c51','#87969a','#dfb58a']:['#527f96','#b9d5cf','#ffe1a3']);g.fillRect(0,0,w,h);
  const sun=g.createRadialGradient(189,88,8,189,88,155);
  sun.addColorStop(0,'#fff5ba');sun.addColorStop(.12,'#ffebad99');sun.addColorStop(1,'#ffebaa00');
  if(!storm){g.fillStyle=sun;g.fillRect(28,0,323,244);}
  function ridge(y,scale,shade,offset){
    const pts=[];
    for(let x=-12;x<=817;x+=12)pts.push([x,y-scale*(.38*Math.sin(x/99+offset)+.25*Math.sin(x/37+offset)+random()*.14)]);
    fill('M-12 300 L'+pts.map(a=>a.join(' ')).join(' L')+' L817 300Z',shade);
  }
  ridge(173,59,'#8c9590',1);ridge(197,48,'#858478',2);
  // 아래로 뻗은 능선과 각기 다른 암벽의 파임이 산의 크기와 방향을 보여 준다.
  const crest=[[0,204],[57,185],[98,188],[150,162],[188,172],[249,135],[278,144],[341,92],[375,104],[427,57],[462,62],[493,31],[515,43],[536,25],[554,48],[589,69],[606,65],[641,110],[669,117],[710,147],[748,142],[801,180]];
  const mountain=new Path2D('M0 246 L'+crest.map(a=>a.join(' ')).join(' L')+' L800 251Z');
  g.fillStyle=wash(29,247,storm?['#77685f','#665659','#474c50']:['#ba8562','#986b56','#705f55']);g.fill(mountain);
  g.save();g.clip(mountain);
  for(let i=1;i<crest.length-1;i++){
    const [x,y]=crest[i],base=x-58-random()*48;
    const edge='M'+x+' '+y+' Q'+(x-7)+' '+(y+24)+' '+(x-24)+' '+(y+50)+' T'+base+' 229';
    fill(edge+' L'+(base+45)+' 235 Q'+(x+8)+' '+(y+47)+' '+x+' '+y+'Z',i%2?'#eabe8a85':'#4a465265');
    for(let k=0;k<9;k++){
      const dx=random()*34-19,dy=16+random()*62;
      line('M'+(x+dx)+' '+(y+dy)+' q-5 12 -11 19 t-14 22',k%2?'#4f474a80':'#f1c49288',.6+random()*1.4);
    }
  }
  for(let j=0;j<2400;j++){const x=random()*w,y=random()*230;line('M'+x+' '+y+' l'+(-2-random()*6)+' '+(1+random()*5),j%2?'#f7d6a233':'#372f382b',.9);}
  g.restore();
  if(storm){
    const rng=()=>random()-.5;
    for(let i=0;i<98;i++){
      const x=489+rng()*328,y=70+rng()*59;
      const v=g.createRadialGradient(x,y,1,x,y,40);
      v.addColorStop(0,i%2?'#454b57ce':'#7b777bba');v.addColorStop(1,'#57637300');
      g.save();g.translate(x,y);g.scale(1.6,.64);g.translate(-x,-y);oval(x,y,41,41,v);g.restore();
    }
    line('M526 68 l-16 19 7 -2 -14 16','#ece2bc',1.6);
  }
  fill('M0 215 Q182 187 396 216 T800 209 L800 396 H0Z',wash(200,396,['#cfa77e','#d9b68a','#a77f59']));
  fill('M553 218 Q328 244 255 293 Q203 324 279 396 H480 Q337 329 383 289 Q406 260 583 217Z','#ecce9c80');
  function tent(x,y,k,ink){
    g.save();g.translate(x,y);g.scale(k,k);
    oval(6,0,49,5,'#50423b44');
    line('M-32 -19 L-52 2 M28 -16 L47 4','#635344',1.4);
    fill('M-42 -4 Q-28 -16 -19 -38 Q-3 -29 23 -31 Q35 -17 45 -7 L18 0Z',ink);
    fill('M-41 -4 Q-27 -18 -19 -38 Q-17 -17 -6 -5 L-10 0Z','#ddac7e');
    fill('M-30 -3 L-20 -25 -13 -2Z','#413c38');
    fill('M-5 -5 L41 -10 38 0 0 2Z','#785641');
    for(let j=0;j<4;j++)line('M'+(-13+j*9)+' '+(-34+Math.sin(j)*2)+' q5 14 13 24','#e9bd8966',1.7);
    line('M-20 -39 L-20 0 M23 -31 L28 -5','#644b3c',1.5);g.restore();
  }
  for(let j=0;j<2;j++)for(let i=0;i<17;i++)tent(i*55+random()*13,213+j*12+random()*8,.18+j*.10+random()*.10,i%3?'#927059':'#a78166');
  tent(393,237,.65,'#a06b4c');tent(233,241,.58,'#86634e');tent(194,256,.77,'#ae795b');
  tent(116,275,1.75,'#965d43');tent(21,270,.87,'#a57959');tent(751,250,.83,'#886550');
  function figure(x,y,k,i){
    g.save();g.translate(x,y);g.scale(k,k);
    const colors=['#7e4950','#47666c','#aa7047','#5e5761','#9a805e','#6d765c'];
    oval(2,0,6,1.2,'#52413560');
    fill('M-3 -15 Q-1 -17 2 -15 L5 -3 4 -1 -5 -1Z',colors[i%6]);
    line('M0 -12 Q1 -7 0 -4','#e6c09483',1);
    oval(0,-18,2.4,3,'#a26a49');fill('M-3 -18 Q-3 -23 1 -22 Q4 -21 3 -18 L0 -19 -2 -14Z',i%3?'#e3c69c':'#77574b');
    line('M-1 -1 l-1 2 M3 -1 l1 2','#59473a',1);g.restore();
  }
  if(storm){
    for(let i=0;i<66;i++)figure(548+random()*179,257+random()*25,.38+random()*.5,i);
    for(let i=0;i<8;i++)figure(580+i*15,301+Math.sin(i)*5,1.06+random()*.42,i);
  }else for(let i=0;i<17;i++)figure(176+random()*218,246+random()*27,.55+random()*.37,i);
  for(let i=0;i<1450;i++){
    const x=random()*800,y=280+random()*116;
    oval(x,y,.5+random()*2,.32+random()*.6,i%2?'#fff0c348':'#5c483a2e');
  }
};
