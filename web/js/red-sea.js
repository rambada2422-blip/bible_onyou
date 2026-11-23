/* 출애굽기 14–15장. 아이들은 관찰 위치와 수첩 속 장단만 조작한다. */
(function () {
  'use strict';
  const app=BO.app2d, el=app.el;
  const titles=['바다 앞에 갇히다','바다 사이의 마른 길','미리암의 소고','홍해를 건넌 뒤'];
  const friends=[['choeon','최온'],['hyu','휴'],['onwoo','온우']];
  const pattern=['가운데','가장자리','가운데'];
  const views={
    camp:['바닷가의 진영', '백성이 떠났다는 말을 듣고 바로와 그의 신하들이 마음이 변했다.', '출 14:5'],
    shore:['앞에 놓인 바다', '하나님이 바닷가에 장막을 치게 하셨고, 백성이 그대로 했다.', '출 14:2–4'],
    rear:['뒤따라온 병거', '바로가 이스라엘 자손의 뒤를 쫓아 바닷가에 장막 친 곳에서 따라잡았다. 이스라엘 자손이 심히 두려워하여 여호와께 부르짖었다.', '출 14:8–10'],
    moses:['모세가 전한 말', '모세가 백성에게 두려워하지 말라고 했다. 그 자리에 서서 하나님이 그날 이루실 구원을 지켜보라고 했다.', '출 14:13–14']
  };
  const crossing=[
    ['밤새 분 동풍','모세가 손을 내밀자 하나님이 밤새 강한 동풍을 불게 하셔서 바닷물이 물러가고 바닥이 마른 땅이 되었다.','출 14:21'],
    ['바다 가운데서','이스라엘 자손이 바다 가운데를 마른 땅으로 걸어갔고, 양쪽에서 물이 벽처럼 섰다.','출 14:22'],
    ['건너편 물가','백성이 건너왔다. 건너온 바다 쪽으로 돌아보자.','출 14:29–30'],
    ['되돌아온 물','모세가 다시 손을 내밀자 물이 돌아와 바로의 군대를 덮었다. 그날 하나님이 이스라엘을 애굽 사람의 손에서 구원하셨다.','출 14:26–30']
  ];
  const song=['바닷가에서 부른 노래','모세와 이스라엘 자손이 하나님께 노래했다. 미리암은 소고를 들었고 여인들도 소고를 들고 춤추며 따랐다.','출 15:1, 15:20–21'];
  function fresh() { return {chapter:0,view:'camp',seen:0,distance:0,returned:false,beat:0,finished:false}; }
  function saved() {
    const s=app.state.redSea;
    if (!s || !Number.isInteger(s.chapter) || s.chapter<0 || s.chapter>3 ||
        !Object.hasOwn(views,s.view) || !Number.isInteger(s.seen) || s.seen<0 || s.seen>3 ||
        !Number.isInteger(s.distance) || s.distance<0 || s.distance>100 ||
        !Number.isInteger(s.beat) || s.beat<0 || s.beat>3 ||
        typeof s.returned!=='boolean' || typeof s.finished!=='boolean') return app.state.redSea=fresh();
    return s;
  }
  function button(label,fn,cls) { return el('button',{type:'button',class:cls||'rs-control',on:{click:fn}},label); }
  function note(record) {
    return el('section',{class:'rs-note'},el('h2',{},record[0]),el('p',{},record[1]),app.refChip(record[2]));
  }
  function open(leave,onward) {
    let s=saved(), audio, timers=[];
    function quiet() {
      timers.forEach(clearTimeout); timers=[];
      if(audio){ audio.close().catch(()=>{}); audio=null; }
    }
    function exit(fn){ quiet(); window.removeEventListener('pagehide',quiet); fn(); }
    function beatTone(rim) {
      const Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio) return;
      try {
        if(!audio) audio=new Audio();
        audio.resume().catch(()=>{});
        const osc=audio.createOscillator(), gain=audio.createGain(), now=audio.currentTime;
        osc.type='sine';osc.frequency.setValueAtTime(rim?480:170,now);
        osc.frequency.exponentialRampToValueAtTime(rim?220:70,now+.11);
        gain.gain.setValueAtTime(.001,now);gain.gain.exponentialRampToValueAtTime(.22,now+.007);
        gain.gain.exponentialRampToValueAtTime(.001,now+.18);osc.connect(gain);gain.connect(audio.destination);
        osc.start(now);osc.stop(now+.19);
      }catch(_){ /* 시각 장단으로도 끝까지 플레이한다. */ }
    }
    function turn(chapter) { s.chapter=chapter; if(chapter===3) s.finished=true; app.save(); draw(true); }
    function draw(focus) {
      quiet();
      const chapter=s.chapter, actor=friends[Math.min(chapter,2)];
      const heading=el('h1',{tabindex:'-1'},titles[chapter]);
      const stage=el('canvas',{class:'rs-picture',role:'img'});
      const place=el('span',{class:'rs-place'});
      const picture=el('div',{class:'rs-frame'},stage,place);
      const companion=el('p',{class:'rs-friend'},app.pic(actor[0]+'-avatar','',''),el('span',{},
        el('b',{},'『탐험대 이야기』 '+actor[1]),el('span',{},[
          '앞바다와 뒤쪽 길을 번갈아 보자. 백성이 왜 두려워했을까?',
          '내 곁에서 걸어 봐. 건너편에 닿으면 함께 뒤를 돌아보자.',
          '구원받은 백성이 지금 무엇을 하는지 봐. 우리도 소고로 답해 볼까?',
          '바닷가에서 지켜본 일을 일지에 모았어.'
        ][chapter])));
      const story=el('div',{class:'rs-story','aria-live':'polite'});
      const controls=el('div',{class:'rs-controls'});
      const footer=el('div',{class:'rs-footer'});
      const status=el('p',{class:'rs-status',role:'status'});
      const tag=chapter===3?'탐험 일지':'홍해 본편 · '+(chapter+1)+' / 3';
      function paint(scene,view,dist,label){
        BO.drawRedSea(stage,scene,view,dist);
        stage.setAttribute('aria-label',label);place.textContent=label;
      }
      if(chapter===0){
        const choices=[['shore','앞바다 보기',1],['rear','뒤쪽 길 보기',2]];
        const knobs=choices.map(([view,label,bit])=>button(label,()=>{
          s.view=view;s.seen|=bit;app.save();coast();
        }));
        const moses=button('모세가 전한 말 살피기',()=>{
          s.view='moses';app.save();coast();next.focus({preventScroll:true});
        });
        const next=button('바다 가운데로',()=>turn(1),'rs-primary');
        function coast(){
          const r=views[s.view];paint('coast',s.view,0,r[0]);story.replaceChildren(note(r));
          knobs.forEach((b,i)=>{ b.setAttribute('aria-pressed',String(s.view===choices[i][0])); });
          moses.hidden=s.seen!==3 || s.view==='moses';next.hidden=s.view!=='moses';
        }
        controls.append(...knobs);footer.append(moses,next);coast();
      }else if(chapter===1){
        const slider=el('input',{type:'range',class:'rs-range',min:'0',max:'100',step:'5','aria-label':'마른 길에서 나의 위치'});
        const back=button('뒤로 걷기',()=>move(s.distance-20)),forward=button('앞으로 걷기',()=>move(s.distance+20));
        const reverse=button('건너온 바다 돌아보기',()=>{s.returned=true;app.save();cross();next.focus({preventScroll:true});},'rs-primary');
        const next=button('노랫소리를 따라가기',()=>turn(2),'rs-primary');
        const distanceLabel=el('span',{}), track=el('label',{class:'rs-track'},distanceLabel,slider);
        slider.addEventListener('input',()=>move(Number(slider.value)));
        let previous=-1;
        function cross(){
          const i=s.returned?3:s.distance===100?2:s.distance>=35?1:0;
          const r=crossing[i];
          paint(s.returned?'return':'cross','',s.distance,s.returned?'건너편에서 되돌아본 바다':r[0]);
          if(i!==previous){story.replaceChildren(note(r));previous=i;}
          slider.value=String(s.distance); slider.setAttribute('aria-valuetext',s.distance===100?'건너편 도착':s.distance+'퍼센트 건넘');
          distanceLabel.textContent=s.distance===100?'건너편 도착':'건넌 길 '+s.distance+'%';
          back.disabled=s.distance===0;forward.disabled=s.distance===100;
          controls.hidden=s.returned;reverse.hidden=s.distance!==100||s.returned;next.hidden=!s.returned;
        }
        function move(value){s.distance=Math.max(0,Math.min(100,value)); app.save();cross();if(s.distance===100 && document.activeElement===forward) reverse.focus({preventScroll:true});}
        controls.append(track,back,forward);footer.append(reverse,next);cross();
      }else if(chapter===2){
        paint('song','',0,'소고를 들고 춤추는 미리암과 여인들');story.append(note(song));
        const hits=el('div',{class:'rs-beats','aria-label':'탐험대 장단'},pattern.map(word=>el('span',{},word)));
        const instruments=['가운데','가장자리'].map((label,i)=>button(label+' 치기',()=>{
          quiet();beatTone(i===1);
          if(label===pattern[s.beat]) {
            s.beat++;app.save();rhythm(s.beat===3?'세 박자가 이어졌어.':'다음 박자를 쳐 보자.');
          }else rhythm('같은 자리에서 다시 해 보자. 다음은 '+pattern[s.beat]+'야.');
        }));
        const listen=button('장단 들어 보기',()=>{
          quiet(); Array.from(hits.children).forEach(e=>e.classList.remove('sounding')); beatTone(false);pulse(0);
          [1,2].forEach(i=>timers.push(setTimeout(()=>{beatTone(i===1);pulse(i);},400*i)));
        });
        const done=button('홍해 탐험 일지 열기',()=>turn(3),'rs-primary');
        function pulse(i){
          const e=hits.children[i];e.classList.add('sounding');timers.push(setTimeout(()=>e.classList.remove('sounding'),220));
        }
        function rhythm(msg){
          Array.from(hits.children).forEach((b,i)=>{b.classList.remove('sounding');b.classList.toggle('struck',i<s.beat);});
          instruments.forEach(b=>{b.disabled=s.beat===3;});status.textContent=msg;
          if(s.beat===3)done.focus({preventScroll:true});
        }
        controls.append(el('strong',{class:'rs-wide'},'탐험대 장단'),hits,listen,...instruments);
        footer.append(done);rhythm(s.beat===3?'세 박자를 모두 쳤어요.':'장단을 따라 치거나 바로 일지를 열 수 있어요.');
      }else{
        paint('song','',0,'건너편에서 부른 노래');
        story.append(el('h2',{},'바닷가에서 노래하기까지'));
        [views.rear,crossing[3],song].forEach((r,i)=>{
          const d=el('details',{},el('summary',{},['무엇이 두려웠을까','백성은 어떻게 되었을까','왜 노래했을까'][i]),el('p',{},r[1]),app.refChip(r[2]));
          d.open=i===2;story.append(d);
        });
        controls.append(button('홍해 다시 목격하기',()=>{s=app.state.redSea=fresh();s.finished=true;turn(0);}));
        footer.append(button('광야 수첩으로 이어가기',()=>exit(onward),'rs-primary'));
      }
      app.show(el('main',{class:'screen rs-screen'},el('nav',{class:'rs-nav'},button('탐험 입구',()=>exit(leave),'rs-link'),el('span',{},tag)),
        el('div',{class:'rs-scroll'},el('header',{class:'rs-heading'},el('p',{},['출애굽기 14:1–14','출애굽기 14:15–31','출애굽기 15:1–21','출애굽기 14–15장'][chapter]),heading),
          picture,companion,controls,status,story,footer)));
      if(focus) heading.focus({preventScroll:true});
    }
    window.addEventListener('pagehide',quiet);
    app.save();draw(false);
  }
  app.redSea={open};
})();
