/* 출애굽기 14–15장. 아이들은 관찰 위치와 수첩 속 장단만 조작한다. */
(function () {
  'use strict';
  const app=BO.app2d, el=app.el;
  const titles=['바다 앞에 갇히다','바다 사이의 마른 길','미리암의 소고','홍해를 건넌 뒤'];
  const friends=[['choeon','최온'],['hyu','휴'],['onwoo','온우']];
  const views={
    camp:['바닷가의 진영', '백성이 떠났다는 말을 듣고 바로와 그의 신하들이 마음이 변했다.', '출 14:5'],
    shore:['앞에 놓인 바다', '하나님이 바닷가에 장막을 치게 하셨고, 백성이 그대로 했다.', '출 14:2–4'],
    rear:['뒤따라온 병거', '바로가 이스라엘 자손의 뒤를 쫓아 바닷가에 장막 친 곳에서 따라잡았다. 이스라엘 자손이 심히 두려워하여 여호와께 부르짖었다.', '출 14:8–10'],
    moses:['모세가 전한 말', '모세가 백성에게 두려워하지 말라고 했다. 그 자리에 서서 하나님이 그날 이루실 구원을 지켜보라고 했다.', '출 14:13–14']
  };
  const artLabels={
    camp:'좁은 해안을 따라 가족들이 길게 모여 있다. 오른쪽에는 바다, 왼쪽 산길에는 먼지를 일으키는 병거들이 보인다.',
    shore:'물가에 선 가족들의 어깨 너머로 수평선까지 바다가 이어진다.',
    rear:'두 말이 끄는 선두 병거의 바퀴가 눈앞에 보이고, 먼지 속으로 다른 병거들이 길게 이어진다.',
    wind:'바람에 옷자락이 날리고 가족들 앞에 모래와 돌이 드러난 밤길이 펼쳐진다.',
    walls:'아이의 눈높이에서 올려다본 양쪽 물벽 사이로 백성이 마른 땅을 걷는다.',
    bank:'건너편 돌 비탈을 오르는 가족들 너머에 물벽과 건너오는 사람들이 보인다.',
    return:'건너편 언덕에서 가족들이 방금 건넌 자리로 돌아오는 물결을 바라본다.',
    song:'아침 물가에서 미리암이 둥근 소고를 들고 여인들이 소고를 치며 춤춘다.'
  };
  const tracks={camp:'coast',shore:'coast',rear:'chase',wind:'passage',walls:'passage',bank:'morning',return:'morning',song:'morning'};
  const crossing=[
    ['밤새 분 동풍','모세가 손을 내밀자 하나님이 밤새 강한 동풍을 불게 하셔서 바닷물이 물러가고 바닥이 마른 땅이 되었다.','출 14:21'],
    ['바다 가운데서','이스라엘 자손이 바다 가운데를 마른 땅으로 걸어갔고, 양쪽에서 물이 벽처럼 섰다.','출 14:22'],
    ['건너편 물가','백성이 건너왔다. 건너온 바다 쪽으로 돌아보자.','출 14:29–30'],
    ['되돌아온 물','모세가 다시 손을 내밀자 물이 돌아와 바로의 군대를 덮었다. 그날 하나님이 이스라엘을 애굽 사람의 손에서 구원하셨다.','출 14:26–30']
  ];
  const song=['바닷가에서 부른 노래','모세와 이스라엘 자손이 하나님께 노래했다. 미리암은 소고를 들었고 여인들도 소고를 들고 춤추며 따랐다.','출 15:1, 15:20–21'];
  function fresh() { return {chapter:0,view:'camp',seen:0,distance:0,returned:false,beat:0,finished:false}; }
  function valid(s) {
    if (!s || !Number.isInteger(s.chapter) || s.chapter<0 || s.chapter>3 ||
        !Object.hasOwn(views,s.view) || !Number.isInteger(s.seen) || s.seen<0 || s.seen>3 ||
        !Number.isInteger(s.distance) || s.distance<0 || s.distance>100 ||
        !Number.isInteger(s.beat) || s.beat<0 || s.beat>3 ||
        typeof s.returned!=='boolean' || typeof s.finished!=='boolean') return false;
    return true;
  }
  function button(label,fn,cls) { return el('button',{type:'button',class:cls||'rs-control',on:{click:fn}},label); }
  function note(record) {
    return el('section',{class:'rs-note'},el('h2',{},record[0]),el('p',{},record[1]),app.refChip(record[2]));
  }
  function open(leave,onward,{coastEntry=false,revisit=false,entry=0,sideTrip=false}={}) {
    let s=app.state.redSea;
    if(sideTrip){
      const visit=history.state?.redSeaStage;
      s=visit?.entry===entry && valid(visit.progress)?visit.progress:{...fresh(),chapter:entry};
    }else{
      if(!valid(s))s=app.state.redSea=fresh();
      if(entry)s.chapter=entry;
    }
    if(s.echoBeat!==undefined && (s.beat!==3 || !Number.isInteger(s.echoBeat) || s.echoBeat<0 || s.echoBeat>5))delete s.echoBeat;
    if(s.looked!==undefined && (!Number.isInteger(s.looked)||s.looked<0||s.looked>3))delete s.looked;
    const music=BO.sceneMusic.create(),instrument=BO.redSeaPlay.instrument();
    const sound={close:instrument.close,hit(kind){
      if(kind!=='step')music.duck();
      instrument.hit(kind);
    }};
    let stopAction=()=>{};
    function saveProgress(){
      if(!sideTrip){app.save();return;}
      try{history.replaceState({redSeaStage:{entry,progress:s}},'');}catch(_){}
    }
    // 이미 건너는 중이면 바닷가 재관람은 이 방문 기록에서만 진행한다.
    if(revisit){
      const previous=history.state?.redSeaCoast;
      s={...fresh()};
      if(previous && Object.hasOwn(views,previous.view) && [0,1,2,3].includes(previous.seen)){
        s.view=previous.view;s.seen=previous.seen;
      }
    }else if(coastEntry) s.view='camp';
    function saveCoast(){
      if(!revisit){saveProgress();return;}
      try { history.replaceState({redSeaCoast:{view:s.view,seen:s.seen}},''); } catch (_) {}
    }
    function quiet(){stopAction();sound.close();}
    function exit(fn){
      quiet();music.close();window.removeEventListener('pagehide',quiet);window.removeEventListener('blur',quiet);fn();
    }
    function turn(chapter){s.chapter=chapter;if(chapter===3)s.finished=true;saveProgress();draw(true);}
    function draw(focus) {
      quiet();stopAction=()=>{};
      const chapter=s.chapter, actor=friends[Math.min(chapter,2)];
      const heading=el('h1',{tabindex:'-1'},titles[chapter]);
      const stage=el('canvas',{class:'rs-picture',role:'img'});
      const picture=el('div',{class:'rs-frame'},stage);
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
      function illustrate(key,scene,view='',dist=0){
        music.setCue('red-sea-'+(chapter===3?'morning':tracks[key]),chapter===0 && key==='rear'?.055:.42);
        const fallback=()=>{
          BO.drawRedSea(stage,scene,view,dist);stage.setAttribute('aria-label',artLabels[key]);
        };
        if(picture.dataset.view===key){
          if(picture.firstElementChild===stage)fallback();
          return;
        }
        const art=el('img',{class:chapter===0?'rs-art rs-coast-art':'rs-art',alt:artLabels[key],width:1440,height:810});
        art.addEventListener('error',()=>{
          if(picture.firstElementChild===art){art.replaceWith(stage);fallback();}
        },{once:true});
        art.src=BO.redSeaImages?.[key] || 'assets/red-sea/'+key+'.webp';
        picture.replaceChildren(art);picture.dataset.view=key;
      }
      if(chapter===0){
        const choices=[['shore','앞바다 보기',1],['rear','뒤쪽 길 보기',2]];
        const knobs=choices.map(([view,label,bit])=>button(label,()=>{
          s.view=view;s.seen|=bit;saveCoast();coast();
        }));
        const moses=button('모세가 전한 말 살피기',()=>{
          s.view='moses';saveCoast();coast();next.focus({preventScroll:true});
        });
        const next=button(revisit?'보던 탐험으로 돌아가기':'바다 가운데로',
          revisit?()=>exit(app.openRedSea):()=>turn(1),'rs-primary');
        function coast(){
          const r=views[s.view], key=s.view==='moses'?'camp':s.view;
          illustrate(key,'coast',s.view);story.replaceChildren(note(r));
          knobs.forEach((b,i)=>{ b.setAttribute('aria-pressed',String(s.view===choices[i][0])); });
          moses.hidden=s.seen!==3 || s.view==='moses';next.hidden=!revisit && s.view!=='moses';
        }
        controls.append(...knobs);footer.append(moses,next);coast();
      }else if(chapter===1){
        const slider=el('input',{type:'range',class:'rs-range',min:'0',max:'100',step:'5','aria-label':'마른 길에서 나의 위치'});
        const walking=BO.redSeaPlay.walkingButton;
        const back=walking('뒤로 걷기',()=>step(-5)),forward=walking('앞으로 걷기',()=>step(5));
        stopAction=()=>{back.stop();forward.stop();};
        const reverse=button('건너온 바다 돌아보기',()=>{s.returned=true;saveProgress();cross();next.focus({preventScroll:true});},'rs-primary');
        const next=button('노랫소리를 따라가기',()=>turn(2),'rs-primary');
        const distanceLabel=el('span',{}), track=el('label',{class:'rs-track'},distanceLabel,slider);
        slider.addEventListener('input',()=>move(Number(slider.value)));
        const route=el('ol',{class:'rs-route','aria-label':'건너는 길'},['바람 부는 입구','물벽 사이','건너편'].map(t=>el('li',{},t)));
        const help=el('small',{class:'rs-walk-help'},'한 번 누르면 한 걸음, 길게 누르면 계속 걸어요.');
        const sightings=[['water','물벽 올려다보기',1],['ground','발밑 내려다보기',2]];
        const observation=el('div',{class:'rs-look',role:'group','aria-label':'휴의 관찰 수첩'});
        const tally=el('small',{class:'rs-sighting-count'});
        const lookButtons=sightings.map(([key,label,bit])=>button(label,()=>{
          s.gaze=s.gaze===key?'ahead':key;s.looked=(s.looked||0)|bit;saveProgress();cross();
        }));
        observation.append(tally,...lookButtons);
        let previous=-1;
        function cross(){
          const i=s.returned?3:s.distance===100?2:s.distance>=35?1:0;
          const r=crossing[i];
          illustrate(['wind','walls','bank','return'][i],s.returned?'return':'cross','',s.distance);
          observation.hidden=i!==1;
          const look=i===1 && sightings.some(([key])=>key===s.gaze)?s.gaze:'ahead';
          picture.dataset.gaze=look;
          lookButtons.forEach((control,index)=>control.setAttribute('aria-pressed',String(look===sightings[index][0])));
          tally.textContent='휴의 관찰 수첩 · '+sightings.filter(([, ,bit])=>s.looked&bit).length+' / 2';
          const within=i===0?s.distance/35:i===1?(s.distance-35)/65:0;
          picture.style.setProperty('--rs-depth',String(1+.15*within));
          Array.from(route.children).forEach((mark,index)=>{
            if(index===Math.min(i,2))mark.setAttribute('aria-current','step');else mark.removeAttribute('aria-current');
          });
          if(i!==previous){story.replaceChildren(note(r));previous=i;}
          slider.value=String(s.distance); slider.setAttribute('aria-valuetext',s.distance===100?'건너편 도착':s.distance+'퍼센트 건넘');
          distanceLabel.textContent=s.distance===100?'건너편 도착':'건넌 길 '+s.distance+'%';
          back.control.disabled=s.distance===0;forward.control.disabled=s.distance===100;
          controls.hidden=s.returned;reverse.hidden=s.distance!==100||s.returned;next.hidden=!s.returned;
        }
        function move(value){
          const next=Math.max(0,Math.min(100,value));
          if(next===s.distance)return;
          const focused=document.activeElement===forward.control;
          s.distance=next;s.gaze='ahead';saveProgress();cross();
          if(focused && next===100)reverse.focus({preventScroll:true});
        }
        function step(delta){
          move(s.distance+delta);sound.hit('step');
          return s.distance>0 && s.distance<100;
        }
        controls.append(route,track,back.control,forward.control,help,observation);footer.append(reverse,next);cross();
      }else if(chapter===2){
        illustrate('song','song');story.append(note(song));
        const done=button('홍해 탐험 일지 열기',()=>turn(3),'rs-primary');
        stopAction=BO.redSeaPlay.drumGame({state:s,save:saveProgress,sound,controls,status,footer,done});
      }else{
        illustrate('song','song');
        story.append(el('h2',{},'바닷가에서 노래하기까지'));
        [views.rear,crossing[3],song].forEach((r,i)=>{
          const d=el('details',{name:'rs-memory'},el('summary',{},['무엇이 두려웠을까','백성은 어떻게 되었을까','왜 노래했을까'][i]),el('p',{},r[1]),app.refChip(r[2]));
          if(i===1 && s.looked){
            const observed=['물벽','마른 땅'].filter((word,index)=>s.looked&(1<<index));
            d.append(el('p',{class:'rs-journal-look'},'휴와 살핀 곳 · '+observed.join(' · ')));
          }
          d.addEventListener('toggle',()=>{
            if(d.open)illustrate(['rear','return','song'][i],['coast','return','song'][i],i===0?'rear':'');
          });
          d.open=i===2;story.append(d);
        });
        controls.append(button('홍해 다시 목격하기',()=>{s=fresh();if(!sideTrip)app.state.redSea=s;s.finished=true;turn(0);}));
        footer.append(button('마라로 떠나기',()=>exit(app.openWilderness),'rs-primary'),button('광야 수첩으로 이어가기',()=>exit(onward)));
      }
      if(sideTrip)footer.append(button('보던 탐험으로 돌아가기',()=>exit(app.openRedSea)));
      app.show(el('main',{class:'screen rs-screen',on:{click:music.gesture,keydown:music.gesture,pointerup:music.gesture}},el('nav',{class:'rs-nav'},button('탐험 입구',()=>exit(leave),'rs-link'),music.button,el('span',{},tag)),
        el('div',{class:chapter===0?'rs-scroll rs-coast':'rs-scroll rs-journey'},el('header',{class:'rs-heading'},el('p',{},['출애굽기 14:1–14','출애굽기 14:15–31','출애굽기 15:1–21','출애굽기 14–15장'][chapter]),heading),
          picture,companion,controls,status,story,footer)));
      if(focus) heading.focus({preventScroll:true});
    }
    window.addEventListener('pagehide',quiet);
    window.addEventListener('blur',quiet);
    saveProgress();draw(false);
  }
  app.redSea={open};
})();
