/* 광야와 시내산의 관찰 장소. 저장되는 변화는 탐험대의 위치·장비·수집 기록이다. */
(function () {
  'use strict';
  const app=BO.app2d, el=app.el, {stages,crew,hintModes,restoration}=BO.wildField, bible=BO.wildScripture;
  const firstMountain=stages.findIndex(st=>st.id==='sinai');
  const stageIds=stages.map(st=>st.id);
  const previousIds=['marah','elim','manna','rock','sinai','calf'];
  const labels=['살펴보기','장비 맞추기','기록 대조'];
  const surfaces=[['흙','dirt'],['모래','sand'],['돌','stone'],['나무 발판','wood']];
  const freshStop=()=>({pos:1,phase:0,dial:1,mapped:0});
  const inRange=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
  function load(){
    let s=app.state.wilderness;
    if(!s||typeof s!=='object'||!Array.isArray(s.stops)) s=app.state.wilderness={stops:[]};
    // 옛 수첩은 순번으로 저장했다. 새 장소가 사이에 들어와도 원래 장소에 기록을 돌려준다.
    const oldIds=Array.isArray(s.stageIds)?s.stageIds:previousIds;
    if(oldIds.length!==stageIds.length||stageIds.some((id,i)=>oldIds[i]!==id)){
      const stops=s.stops, earned=Array.isArray(s.earned)?s.earned:[];
      s.stops=stageIds.map(id=>{
        const i=oldIds.indexOf(id);
        if(i<0)return freshStop();
        const stop=stops[i]&&typeof stops[i]==='object'?stops[i]:freshStop();
        if(i>0&&earned[i-1]===true)stop.available=true;
        return stop;
      });
      s.earned=stageIds.map(id=>earned[oldIds.indexOf(id)]===true);
      for(const key of ['index','desertIndex','mountainIndex'])s[key]=stageIds.indexOf(oldIds[s[key]]);
    }
    s.stageIds=stageIds;
    if(!inRange(s.index,0,stages.length-1))s.index=0;
    if(!inRange(s.desertIndex,0,firstMountain-1))s.desertIndex=s.index<firstMountain?s.index:0;
    if(!inRange(s.mountainIndex,firstMountain,stages.length-1))s.mountainIndex=firstMountain;
    if(!inRange(s.mode,0,2))s.mode=Math.max(0,['t1','t2','t3'].indexOf(app.state.tier));
    if(!inRange(s.actor,0,2))s.actor=Math.max(0,crew.findIndex(a=>a.id===app.state.char));
    if(!Array.isArray(s.earned))s.earned=[];
    s.earned=stages.map((_,i)=>s.earned[i]===true);
    if(typeof s.sound!=='boolean')s.sound=true;
    if(!inRange(s.baseCount,0,6+stages.length))s.baseCount=0;
    stages.forEach((_,i)=>{
      const p=s.stops[i];
      if(!p||!inRange(p.pos,0,8)||!inRange(p.phase,0,3)||!inRange(p.dial,0,2))s.stops[i]=freshStop();
      if(!inRange(s.stops[i].mapped,0,stages[i].trail.length))s.stops[i].mapped=0;
      if(stages[i].frames){
        const stop=s.stops[i];
        if(!inRange(stop.frame,0,1))stop.frame=0;
        if(!inRange(stop.observed,0,3))stop.observed=0;
        stop.mapped=Number(!!(stop.observed&1))+Number(!!(stop.observed&2));
      }
      if(stages[i].beats&&!inRange(s.stops[i].beat,0,stages[i].beats.length-1))s.stops[i].beat=0;
      if(s.stops[i].phase===3)s.earned[i]=true;
    });
    return s;
  }
  function button(text,action,cls){
    return el('button',{type:'button',class:cls||'wf-button',on:{click:action}},text);
  }
  function refs(stage){
    const [first,last=first]=stage.range.split('–');
    const end=last.includes(':')?last:first.split(':')[0]+':'+last;
    const keys=Object.keys(bible.verses);
    return keys.slice(keys.indexOf(first),keys.indexOf(end)+1);
  }
  function open(leave,trail,showShelf,mountain=false,entry){
    const s=load(),sound=BO.wildFeel.audio();
    const start=mountain?firstMountain:0, end=mountain?stages.length-1:firstMountain-1;
    const bookmark=mountain?'mountainIndex':'desertIndex';
    s.index=entry?stageIds.indexOf(entry):s[bookmark];
    let music,dialog,timer,startTime=null,elapsed=0,hint=0,closed=false,ui,stage,p;
    const play=key=>{if(s.sound&&!document.hidden)sound.play(key,stage.id);};
    function pause(){
      clearTimeout(timer);
      if(startTime!==null)elapsed+=performance.now()-startTime;
      startTime=null;
    }
    function schedule(){
      pause();
      if(closed||dialog||document.hidden||p.phase===3)return;
      const levels=hintModes[s.mode].seconds;
      if(hint>=levels.length)return;
      startTime=performance.now();
      timer=setTimeout(()=>{pause();hint++;showHint();schedule();},Math.max(0,levels[hint]*1000-elapsed));
    }
    function resetHints(){pause();elapsed=0;hint=0;}
    function visibility(){
      if(document.hidden){pause();sound.stop();}else schedule();
    }
    function pageHide(){pause();sound.stop();}
    function route(fn){closed=true;pause();sound.stop();music?.close();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',pageHide);fn();}
    function updateScore(){
      if(!stage.observations)return;
      let stopView=Math.min(p.phase,2);
      if(p.phase===0&&p.pos===stage.spots[0])stopView=1;
      if(p.phase===3&&p.reviewEarly)stopView=0;
      const index=inRange(p.inspection,0,stage.observations.length-1)?p.inspection:stopView;
      music.setPaused(!s.sound||Boolean(dialog?.querySelector('.wf-edition')));
      music.setCue('wild-'+stage.observations[index].music);
      music.button.disabled=!s.sound;
      music.button.title=s.sound?'':'탐사 설정에서 소리 켜기';
    }
    function openDialog(title,fill,afterClose){
      pause();sound.stop();
      const trigger=document.activeElement;
      const d=el('dialog',{class:'wf-dialog','aria-labelledby':'wf-dialog-title'});
      const box=el('div',{class:'wf-dialog-body'}), h=el('h2',{id:'wf-dialog-title',tabindex:'-1'},title);
      d.append(el('header',{},h,button('닫기',()=>d.close())),box);
      fill(box);dialog=d;ui.screen.append(d);d.showModal();h.focus();updateScore();
      d.addEventListener('close',()=>{d.remove();dialog=null;if(trigger?.isConnected)trigger.focus({preventScroll:true});afterClose?.();updateScore();schedule();},{once:true});
      return box;
    }
    function scrollText(i,seal){
      const st=stages[i];
      const body=openDialog('말씀 두루마리',box=>{
        box.append(el('p',{class:'wf-edition'},bible.edition+' · 출애굽기 '+st.range));
        for(const ref of refs(st)){
          box.append(el('p',{class:'wf-verse',tabindex:'-1','data-verse':ref},el('b',{},ref),el('span',{},bible.verses[ref])));
        }
      });
      if(seal)body.querySelector('[data-verse="'+(seal===true?st.seal:seal)+'"]').focus();
    }
    function inspectVerse(index){
      p.inspection=index;p.readInspection=true;app.save();
      scrollText(s.index,stage.observations[index].verse);
      dialog.addEventListener('close',()=>{
        delete p.readInspection;
        inspect(index,false);
      },{once:true});
    }
    function inspect(index,feedback=true){
      const views=stage.observations;
      let openVerse=false;
      p.inspection=index;app.save();
      const body=openDialog('탐험대 관찰경',box=>{
        const picture=el('canvas',{class:'wf-closeup',role:'img'});
        const title=el('h3',{'aria-live':'polite'}), sourceFrames=new Map();
        const tabs=views.map((view,i)=>button(view.label,()=>select(i),'wf-observe-tab'));
        const verse=button('',()=>{openVerse=true;dialog.close();});
        function select(i,withSound=true){
          const view=views[i];
          if(!sourceFrames.has(view.later)){
            const source=el('canvas',{});
            BO.drawWilderness(source,stage.id,view.later);
            sourceFrames.set(view.later,source);
          }
          const [x,y,w,h]=view.crop;
          picture.width=w*2;picture.height=h*2;
          picture.getContext('2d')?.drawImage(sourceFrames.get(view.later),x,y,w,h,0,0,w*2,h*2);
          picture.setAttribute('aria-label',stage.title+' · '+view.label+' 확대');
          title.textContent=view.caption;
          verse.textContent='두루마리 열기 · 출 '+view.verse;
          tabs.forEach((tab,k)=>tab.setAttribute('aria-pressed',String(k===i)));
          p.inspection=i;app.save();updateScore();
          if(withSound)play(view.sound);
        }
        box.append(title,picture,el('div',{class:'wf-view-tabs',role:'group','aria-label':'관찰 시점'},tabs),verse);
        select(index,feedback);
      },()=>{
        const last=p.inspection;
        if(openVerse)inspectVerse(last);
        else{delete p.inspection;app.save();}
      });
      body.closest('dialog').classList.add('wf-optics');
    }
    function baseCount(){
      const past=['EX-00','EX-01','EX-09'].filter(id=>app.state.done[id]).length+
        Number(!!app.state.palace?.finished)+Number(!!app.passover.completed())+Number(!!app.state.redSea?.finished);
      s.baseCount=Math.max(s.baseCount,past+s.earned.filter(Boolean).length);
      return s.baseCount;
    }
    function shelf(){
      const count=baseCount();app.save();
      openDialog('타임머신 관측대',box=>{
        const restored=restoration.filter(part=>count>=part.count).length;
        const cabinet=el('div',{class:'wf-cabinet'},app.pic('timemachine','','타임머신'));
        const switches=el('ol',{'aria-label':'아지트 복구 상태'});
        for(const part of restoration){
          const on=count>=part.count;
          switches.append(el('li',{class:on?'wf-lit':''},part.name,el('small',{},on?'가동 중':part.count+'곳 답사')));
        }
        cabinet.append(switches);
        box.append(el('h3',{},'아지트 복구 '+restored+' / 4'),cabinet);
        stages.forEach((st,i)=>{
          const slot=el('section',{class:'wf-slot'});
          if(s.earned[i]){
            slot.classList.add('wf-filled','wf-slot-'+st.id);
            slot.append(el('i',{'aria-hidden':'true'},st.glyph),el('b',{},st.pin),el('p',{},st.card+' 관찰 카드'),el('p',{},st.notes[s.mode]),button('말씀 인장 · 출 '+st.seal,()=>{
              const d=dialog;d.addEventListener('close',()=>scrollText(i,true),{once:true});d.close();
            }));
          }else slot.append(el('span',{},st.title+' · 빈 자리'));
          box.append(slot);
        });
      });
    }
    function showHint(){
      if(!ui||p.phase===3)return;
      const a=crew[p.phase];
      ui.aside.textContent=hint?a.name+' · '+a.lines[s.mode]:'';
      ui.roles.forEach((b,i)=>b.classList.toggle('wf-glow',hint>=2&&i===p.phase));
      ui.pin.classList.toggle('wf-ring',hint>=3&&!ui.pin.hidden);
      ui.landmarks.forEach((b,k)=>b.classList.toggle('wf-ring',hint>=3&&k===p.mapped&&!b.hidden));
      if(ui.frames&&p.phase===2){
        const need=stage.trail.findIndex((_,i)=>!(p.observed&(1<<i)));
        ui.frames.forEach((b,i)=>b.classList.toggle('wf-ring',hint>=3&&i===need&&i!==p.frame));
        ui.landmarks.forEach((b,i)=>b.classList.toggle('wf-ring',hint>=3&&i===need&&!b.hidden));
      }
      ui.thought.hidden=!hint;
      ui.thought.textContent=a.name+' · '+['여길 볼까?','눈금을 보자!','기록을 펴 볼까?'][p.phase];
      ui.thought.style.left=x(crewPlace(p.phase));
    }
    function target(){return stage.spots[p.phase===2?1:0];}
    function spotName(){return stage.marks[p.phase===2?1:0];}
    function x(pos){return (8+pos*10.5)+'%';}
    // 다른 두 친구도 같은 탐사로 위에 남아, 호출할 때 선두와 자리를 바꾼다.
    function crewPlace(actor){
      if(actor===s.actor)return p.pos;
      const which=crew.filter((_,i)=>i!==s.actor).indexOf(crew[actor]);
      const dir=p.pos<2?1:-1;
      return p.pos+dir*(which+1)*.68;
    }
    function placeCrew(){
      ui.friends.forEach((node,i)=>{
        node.hidden=i===s.actor;
        node.style.left=x(crewPlace(i));
      });
      if(ui.thought)ui.thought.style.left=x(crewPlace(p.phase));
    }
    function walk(pos){
      if(p.phase===3||p.pos===pos)return;
      p.pos=pos;app.save();updateScore();
      const surface=surfaces[(pos+s.index)%4];
      play(surface[1]);
      ui.sprite.classList.remove('wf-walk');void ui.sprite.offsetWidth;ui.sprite.classList.add('wf-walk');
      ui.status.textContent=surface[0]+' · '+(p.pos===target()?spotName()+'에 도착했어요.':'한 걸음 옮겼어요.');
      position();
    }
    function position(){
      ui.sprite.style.left=x(p.pos);ui.pin.style.left=x(target());placeCrew();
      ui.pin.textContent=spotName();ui.left.disabled=p.pos===0;ui.right.disabled=p.pos===8;
      ui.field.setAttribute('aria-label',stage.title+'의 탐사로. 현재 '+(p.pos+1)+'번째 칸.');
      ui.track.textContent=p.pos===target()?'도착 · '+spotName():(p.pos<target()?'오른쪽':'왼쪽')+' '+Math.abs(target()-p.pos)+'칸 · '+spotName();
      ui.panel.hidden=!(s.actor===p.phase&&p.pos===target());
      const charting=p.phase===2&&!ui.panel.hidden&&p.mapped<stage.trail.length;
      ui.pin.hidden=charting||!!(stage.frames&&p.phase===2&&!ui.panel.hidden);
      if(charting)ui.track.textContent=stage.trail[p.mapped][0]+' 찾기 · '+(p.mapped+1)+' / '+stage.trail.length;
      ui.landmarks.forEach((b,i)=>{
        b.hidden=!charting;
        b.setAttribute('aria-pressed',String(i<p.mapped));
      });
      if(p.phase===2){
        ui.prompt.textContent=charting?'풍경에서 '+stage.trail[p.mapped][0]+' 찾기 · '+(p.mapped+1)+' / '+stage.trail.length:'관찰을 담았어요. 수첩에 붙일 이름표를 골라 보세요.';
        if(ui.frames) {
          ui.frameBar.hidden=ui.panel.hidden;
          ui.frames.forEach((b,i)=>{
            b.setAttribute('aria-pressed',String(p.frame===i));
            b.textContent=stage.frames[i]+((p.observed&(1<<i))?' ✓':'');
          });
          ui.landmarks.forEach((b,i)=>{
            b.hidden=!charting||i!==p.frame;
            b.setAttribute('aria-pressed',String(!!(p.observed&(1<<i))));
          });
          if(charting){
            ui.track.textContent='두 날의 풍경 · '+p.mapped+' / 2';
            ui.prompt.textContent=(p.observed&(1<<p.frame))?'다른 날의 관찰창을 열어 보세요.':stage.frames[p.frame]+' 풍경에서 '+stage.trail[p.frame][0]+' 찾기';
          }
        }
        ui.tags.hidden=charting;
      }
      showHint();
    }
    function advance(){
      p.phase++;resetHints();
      if(stage.beats)p.beat=(stage.beatSteps||[0,2,4,stage.beats.length-1])[p.phase];
      if(p.phase===3){s.earned[s.index]=true;baseCount();play('clear');}
      else play('found');
      app.save();draw(true);
    }
    function call(i){
      s.actor=i;app.save();play('talk');
      ui.roles.forEach((b,k)=>b.setAttribute('aria-pressed',String(i===k)));
      ui.sprite.replaceChildren(app.pic(crew[i].id+'-full','',''));
      const right=i===p.phase,near=p.pos===target();
      showFace(i,right&&near?'smile':'surprised');
      ui.status.textContent=!near?'먼저 '+spotName()+'에 가 보세요.':right?'도구를 쓸 준비가 됐어요.':crew[p.phase].name+'의 '+labels[p.phase]+'가 필요해요.';
      position();
      if(right&&near&&ui.frames)ui.frames[p.frame].focus();
    }
    function showFace(i,expression){
      ui.talk.replaceChildren(BO.wildFeel.portrait(crew[i].id,expression),el('div',{},el('b',{},'『탐험대 이야기』 '+crew[i].name),el('span',{},crew[i].lines[s.mode])));
    }
    function currentEvidence(){
      return stage.evidence[p.phase===2?(stage.frames?p.frame:1):0];
    }
    function controls(){
      const evidence=currentEvidence();
      ui.evidence=button(evidence[0]+' · 출 '+evidence[1],()=>scrollText(s.index,currentEvidence()[1]));
      ui.panel.append(el('div',{class:'wf-evidence'},ui.evidence));
      if(p.phase===0){
        ui.panel.append(button('접사 렌즈로 살펴보기',advance,'wf-primary'));
      }else if(p.phase===1){
        const value=el('output',{}),glass=el('canvas',{width:'130',height:'60','aria-hidden':'true'});
        const dial=el('input',{type:'range',min:'0',max:'2',step:'1','aria-label':stage.adjust});
        const sync=()=>{
          value.textContent=stage.units[p.dial];dial.value=String(p.dial);dial.setAttribute('aria-valuetext',stage.units[p.dial]);
          const g=glass.getContext('2d');if(!g)return;
          const scale=1+(p.dial+1)*.4,[px,py]=stage.lens;
          const w=137/scale,h=66/scale;g.clearRect(0,0,130,60);g.drawImage(ui.canvas,px-w/2+(p.dial-stage.aim)*14,py-h/2,w,h,0,0,130,60);
          g.strokeStyle='#fceaac';g.beginPath();g.moveTo(56,30);g.lineTo(74,30);g.moveTo(65,22);g.lineTo(65,38);g.stroke();
        };
        dial.addEventListener('input',()=>{p.dial=Number(dial.value);app.save();sync();play('tap');});
        ui.panel.append(el('label',{class:'wf-adjust'},glass,el('span',{},stage.adjust,el('small',{},'기준 눈금 · '+stage.units[stage.aim])),dial,value),
          button('장비 고정',()=>{if(p.dial===stage.aim)advance();else{ui.status.textContent='기준 눈금은 '+stage.units[stage.aim]+'예요. 다시 맞춰 보세요.';play('tap');}},'wf-primary'));sync();
      }else{
        ui.prompt=el('strong',{'aria-live':'polite'});
        ui.tags=el('div',{class:'wf-tags'});
        ui.panel.append(ui.prompt,button('말씀과 나란히 살피기',()=>scrollText(s.index,true)),ui.tags);
        stage.choices.forEach((name,i)=>ui.tags.append(button(name,()=>{
          if(i===stage.match)advance();
          else{play('tap');ui.status.textContent='다른 장소의 이름표예요. '+spotName()+'의 모습을 다시 보세요.';}
        })));
      }
    }
    function storyRecord(){
      const counter=el('b',{}), copy=el('p',{}), verse=button('',()=>{
        scrollText(s.index,stage.beats[p.beat].ref.split('–')[0]);
      });
      const back=button('앞 대목',()=>turn(-1)), next=button('뒤 대목',()=>turn(1));
      function render(){
        const beat=stage.beats[p.beat];
        counter.textContent='장면 안내 · '+(p.beat+1)+' / '+stage.beats.length;
        copy.textContent=beat.notes[s.mode];
        verse.textContent='이 대목의 원문 · 출 '+beat.ref;
        back.disabled=p.beat===0;next.disabled=p.beat===stage.beats.length-1;
      }
      function turn(delta){p.beat+=delta;app.save();render();play('tap');}
      ui.updateRecord=render;render();
      return el('section',{class:'wf-record',tabindex:'-1','aria-label':'사건의 앞뒤 기록'},
        el('div',{class:'wf-record-heading'},counter,back,next),copy,verse);
    }
    function settings(){
      openDialog('탐사 설정',box=>{
        const mode=el('select',{'aria-label':'플레이어 연령 모드'},hintModes.map(({age},i)=>el('option',{value:String(i)},age+'세 모드')));
        mode.value=String(s.mode);
        mode.onchange=()=>{s.mode=Number(mode.value);resetHints();app.save();ui.updateRecord?.();
          if(p.phase<3){showFace(s.actor,'neutral');showHint();}else ui.cardText.textContent=stage.notes[s.mode];};
        const toggle=button('',()=>{s.sound=!s.sound;app.save();toggle.textContent=s.sound?'소리 켜짐':'소리 꺼짐';toggle.setAttribute('aria-pressed',String(s.sound));if(s.sound)play('tap');else sound.stop();updateScore();});
        toggle.textContent=s.sound?'소리 켜짐':'소리 꺼짐';toggle.setAttribute('aria-pressed',String(s.sound));
        box.append(el('label',{},'플레이어 연령 ',mode),toggle,el('p',{},'동료는 현장에서 따로 선택할 수 있어요.'));
      });
    }
    function draw(focus){
      s[bookmark]=s.index;stage=stages[s.index];p=s.stops[s.index];ui={};
      const complete=p.phase===3, heading=el('h1',{tabindex:'-1'},stage.title);
      if(stage.observations){
        if(!music)music=BO.sceneMusic.create();
        updateScore();
      }else if(music){music.close();music=null;}
      const nav=el('nav',{class:'wf-nav'},button('탐험 입구',()=>route(leave)),button('말씀 두루마리',()=>scrollText(s.index,false)),button('관측대',shelf),button('설정',settings));
      if(music)nav.append(music.button);
      ui.canvas=el('canvas',{class:'wf-picture',role:'img','aria-label':stage.title+' · '+stage.card});
      p.available=true;
      const later=p.phase>=2&&(!stage.frames||complete||p.frame===1)&&!(stage.observations&&complete&&p.reviewEarly);
      BO.drawWilderness(ui.canvas,stage.id,later);
      ui.field=el('div',{class:'wf-field',tabindex:'0',role:'group'},ui.canvas);
      if(stage.observations){
        ui.ripple=el('i',{class:'wf-ripple wf-ripple-'+stage.id,'aria-hidden':'true'});
        ui.ripple.hidden=stage.id==='marah'&&!later;
        ui.field.append(ui.ripple);
      }
      ui.sprite=el('div',{class:'wf-sprite','aria-hidden':'true'},app.pic(crew[s.actor].id+'-full','',''));
      ui.friends=crew.map(a=>el('div',{class:'wf-friend','aria-hidden':'true'},app.pic(a.id+'-full','','')));
      ui.field.append(...ui.friends,ui.sprite);ui.sprite.style.left=x(p.pos);placeCrew();
      const frameLabel=(stage.frames?stage.frames[Number(later)]:later?'나중 기록':'처음 기록')+' · '+stage.evidence[later?1:0][0];
      ui.field.append(stage.beats ? button(frameLabel,()=>ui.record.focus(),'wf-frame-label wf-read-frame') :
        el('span',{class:'wf-frame-label'},frameLabel));
      const content=el('div',{class:'wf-body'});
      if(!complete){
        ui.thought=el('span',{class:'wf-thought','aria-hidden':'true'});ui.field.append(ui.thought);
        ui.pin=button(spotName(),()=>walk(target()),'wf-pin');ui.field.append(ui.pin);
        ui.landmarks=stage.trail.map(([name,cx,cy],i)=>{
          const mark=button('⌖',()=>{
            if(stage.frames){
              if(i!==p.frame||(p.observed&(1<<i)))return;
              p.observed|=1<<i;
            }else if(i!==p.mapped){
              ui.status.textContent='먼저 '+stage.trail[p.mapped][0]+' 쪽을 살펴보세요.';
              play('tap');return;
            }
            p.mapped++;app.save();play('found');resetHints();position();schedule();
            ui.status.textContent=name+' 위치를 수첩에 표시했어요.';
            if(p.mapped===stage.trail.length)ui.tags.querySelector('button').focus({preventScroll:true});
          },'wf-landmark');
          mark.setAttribute('aria-label',name+' 관찰');mark.style.left=cx+'%';mark.style.top=cy+'%';
          ui.field.append(mark);return mark;
        });
        ui.field.addEventListener('click',event=>{
          if(event.target.closest('button'))return;
          const r=ui.field.getBoundingClientRect();walk(Math.max(0,Math.min(8,Math.round(((event.clientX-r.left)/r.width*100-8)/10.5))));
        });
        ui.field.addEventListener('keydown',e=>{
          if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();if(!e.repeat)walk(Math.max(0,Math.min(8,p.pos+(e.key==='ArrowLeft'?-1:1))));}
        });
        ui.left=button('왼쪽 한 칸',()=>walk(p.pos-1));ui.right=button('오른쪽 한 칸',()=>walk(p.pos+1));
        ui.track=el('span',{});ui.aside=el('p',{class:'wf-aside',role:'status'});
        ui.status=el('p',{class:'wf-status',role:'status'});ui.talk=el('div',{class:'wf-talk'});
        ui.roles=crew.map((a,i)=>button(a.name+' · '+a.age+'세',()=>call(i),'wf-role'));
        ui.roles.forEach((b,i)=>{b.setAttribute('aria-pressed',String(s.actor===i));b.setAttribute('aria-label',crew[i].name+' 호출 · '+crew[i].role);});
        ui.panel=el('section',{class:'wf-tool','aria-label':'현장 장비'});controls();
        if(stage.frames&&p.phase===2){
          ui.frames=stage.frames.map((label,i)=>button(label,()=>{
            p.frame=i;app.save();play('tap');
            BO.drawWilderness(ui.canvas,stage.id,i===1);
            ui.field.querySelector('.wf-frame-label').textContent=label+' · '+stage.evidence[i][0];
            const evidence=currentEvidence();ui.evidence.textContent=evidence[0]+' · 출 '+evidence[1];
            position();
          }));
          ui.frames.forEach((b,i)=>b.setAttribute('aria-label',stage.frames[i]));
          ui.frameBar=el('div',{class:'wf-days',role:'group','aria-label':'두 날의 관찰창'},ui.frames);
        }
        const ask=button('동료에게 묻기',()=>{hint=Math.min(3,hint+1);showHint();schedule();});
        content.append(el('div',{class:'wf-goal'},el('strong',{},labels[p.phase]+' · '+crew[p.phase].name),ui.track),
          el('div',{class:'wf-row'},ui.left,ui.right,ask),ui.aside,
          el('div',{class:'wf-team','aria-label':'동료 호출'},ui.roles),ui.talk,ui.panel,ui.status);
        showFace(s.actor,'neutral');position();showHint();
      }else{
        ui.cardText=el('p',{},stage.notes[s.mode]);
        const reward=el('section',{class:'wf-prize'},el('h2',{},'현장 기록 보관 완료'),el('b',{},stage.card+' 관찰 카드'),ui.cardText,
          button('말씀 인장 · 출 '+stage.seal,()=>scrollText(s.index,true)),
          button(stage.observations&&p.reviewEarly?'나중 기록 다시 보기':'처음 기록 다시 보기',event=>{
            const earlier=event.currentTarget.textContent==='처음 기록 다시 보기';
            if(stage.observations){p.reviewEarly=earlier;app.save();updateScore();}
            if(stage.beats){
              p.beat=earlier?0:(stage.beatSteps?.[3]??stage.beats.length-1);ui.updateRecord();app.save();
            }
            BO.drawWilderness(ui.canvas,stage.id,!earlier);
            if(ui.ripple)ui.ripple.hidden=stage.id==='marah'&&earlier;
            ui.field.querySelector('.wf-frame-label').textContent=(earlier?'처음 기록':'나중 기록')+' · '+stage.evidence[earlier?0:1][0];
            event.currentTarget.textContent=earlier?'나중 기록 다시 보기':'처음 기록 다시 보기';
          }),el('span',{},'고정 선반 · '+stage.pin));
        const next=button(s.index<end?(mountain?'금송아지 사건으로':stages[s.index+1].title+' 답사하기'):mountain?'시내산 수첩으로':'시내산 본편으로',()=>{
          if(s.index===end){route(mountain?trail:app.openSinai);return;}
          sound.stop();s.index++;resetHints();draw(true);app.save();
        },'wf-primary');
        content.append(reward,next);
        if(!mountain&&s.index===end)content.append(button('시내산 수첩으로',()=>route(trail)));
        content.append(button('이 장소 다시 답사',()=>{
          s.stops[s.index]=freshStop();if(stage.beats)s.stops[s.index].beat=0;
          if(stage.frames)Object.assign(s.stops[s.index],{frame:0,observed:0});
          resetHints();draw(true);app.save();
        }));
      }
      if(stage.beats){
        ui.record=storyRecord();
        if(complete)content.insertBefore(ui.record,content.children[1]);else content.append(ui.record);
      }
      const regionName=mountain?'시내산':'광야';
      const stops=el('details',{class:'wf-stops'},el('summary',{},regionName+' 답사 경로'));
      stages.forEach((st,i)=>{
        if(i<start||i>end)return;
        const b=button(st.title+(s.earned[i]?' · 기록 있음':''),()=>{sound.stop();s.index=i;resetHints();draw(true);app.save();});
        b.disabled=i!==start&&!s.earned[i-1]&&!s.stops[i].available&&!s.earned[i];stops.append(b);
      });
      content.append(stops);
      let view=ui.frameBar?el('div',{class:'wf-pair'},ui.field,ui.frameBar):ui.field;
      if(stage.observations){
        const sights=stage.observations.map((v,i)=>button(v.label,()=>inspect(i),'wf-observe-tab'));
        view=el('div',{class:'wf-observation-field'},ui.field,el('div',{class:'wf-view-strip'},
          el('strong',{},'관찰경'),el('div',{class:'wf-view-tabs',role:'group','aria-label':'확대할 풍경'},sights)));
      }
      const gesture=e=>music?.gesture(e);
      ui.screen=el('main',{class:'screen wf-screen',on:{pointerdown:gesture,keydown:gesture,click:gesture}},nav,el('div',{class:'wf-scroll'},el('header',{class:'wf-heading'},el('p',{},regionName+' 답사 '+(s.index-start+1)+' / '+(end-start+1)+' · 출 '+stage.range),heading),view,content));
      app.show(ui.screen);if(focus)heading.focus({preventScroll:true});schedule();
    }
    document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',pageHide);
    draw(false);app.save();
    if(showShelf)shelf();
    else if(stage.observations&&inRange(p.inspection,0,stage.observations.length-1)){
      if(p.readInspection)inspectVerse(p.inspection);else inspect(p.inspection,false);
    }
  }
  app.wilderness={open,
    hasRecord:id=>!!app.state.wilderness&&load().earned[stageIds.indexOf(id)],
    inMountain:()=>!!app.state.wilderness&&load().index>=firstMountain
  };
})();
