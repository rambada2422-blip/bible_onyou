/* EX-00. 아이가 움직이는 것은 관찰경과 자기 수첩이다. 사건은 검토된 네 대목으로 진행한다. */
(function () {
  'use strict';
  const app=BO.app2d, el=app.el;
  const spots={
    wall:{x:55,y:31,name:'짓고 있는 성'}, load:{x:31,y:73,name:'운반 중인 벽돌 바구니'},
    ramp:{x:77,y:56,name:'성으로 오르는 운반길'}, hands:{x:46,y:67,name:'서로 손을 잡은 백성'},
    mold:{x:31,y:78,name:'짚 섞인 흙과 나무틀'}, bricks:{x:79,y:74,name:'말리는 벽돌'}
  };
  const views={
    yard:['국고성 건설 현장','쌓이고 있는 성벽과 무거운 벽돌 바구니를 나르는 일꾼들'],
    clay:['성 아래 벽돌 일터','작업대의 나무틀과 곁에 줄지어 놓인 흙벽돌'],
    cry:['여러 해 뒤, 백성이 부르짖은 때','일하던 사람들이 함께 앉아 서로를 부축하는 모습']
  };
  const actors=['choeon','choeon','hyu','hyu','onwoo'];
  const titles=['짓고 있는 성을 찾아보세요','성 아래, 무엇을 나르고 있을까요?','벽돌이 어디서 오는지 따라가세요','휴의 관찰경에 두 자리를 담으세요','온우와 부르짖음의 기록을 펼치세요'];
  const refs=['1:8','1:8','1:11','1:14','2:24'];
  const image=key=>BO.bondageImages?.[key]||'assets/bondage/'+key+'.webp';
  function button(text,click,cls){
    return el('button',{type:'button',class:cls||'by-secondary',on:{click}},text);
  }
  function openFieldScroll(range,verses,ref,onClose){
    const previous=document.activeElement;
    const close=button('닫기',()=>dialog.close());
    const dialog=el('dialog',{class:'wf-dialog by-scroll','aria-label':'말씀 두루마리'},
      el('header',{},el('h2',{},'말씀 두루마리'),close));
    const content=el('div',{class:'wf-dialog-body'},el('p',{class:'wf-edition'},BO.wildScripture.edition+' · 출애굽기 '+range));
    for(const [verse,text] of Object.entries(verses)){
      content.append(el('p',{class:'wf-verse',tabindex:'-1','data-verse':verse},el('b',{},verse),el('span',{},text)));
    }
    dialog.append(content);document.body.append(dialog);dialog.showModal();
    content.querySelector('[data-verse="'+ref+'"]').focus();
    dialog.addEventListener('close',()=>{dialog.remove();onClose?.();if(previous?.isConnected)previous.focus({preventScroll:true});},{once:true});
  }
  app.openFieldScroll=openFieldScroll;
  function scroll(ref,onClose){
    openFieldScroll('1:8–14, 2:23–25',BO.bondageVerses,ref,onClose);
  }
  function create(sc,actions){
    const music=BO.sceneMusic.create(),sound=BO.wildFeel.audio();
    const root=el('main',{class:'screen scene by-screen'});
    const leave=button('시간표로 돌아가기',actions.leave);
    const nav=el('nav',{class:'by-nav','aria-label':'현장 탐사'},leave,music.button);
    const area=el('div',{class:'by-area'});root.append(nav,area);
    let hintTimer,level=0,hintIndex=0,thresholds=[],target,thought,crew,tip,bookOpen=false,closed=false;
    function pauseHints(){clearTimeout(hintTimer);}
    function showHint(){
      if(!thought)return;
      thought.hidden=level===0;thought.textContent=level?tip:'';
      crew.classList.toggle('by-signal',level>=2);
      root.querySelectorAll('.by-guide').forEach(node=>node.classList.remove('by-guide'));
      if(level===3&&target)target.classList.add('by-guide');
    }
    function scheduleHint(){
      pauseHints();
      if(closed||bookOpen||document.hidden||hintIndex>=thresholds.length||level>=3)return;
      const last=hintIndex?thresholds[hintIndex-1]:0;
      hintTimer=setTimeout(()=>{hintIndex++;level=Math.min(3,level+1);showHint();scheduleHint();},(thresholds[hintIndex]-last)*1000);
    }
    function resetHint(){hintIndex=0;level=0;showHint();scheduleHint();}
    function manual(){pauseHints();level=Math.min(3,level+1);showHint();scheduleHint();}
    function openBook(ref){
      bookOpen=true;pauseHints();app.stopReading();sound.stop();music.setPaused(true);
      scroll(ref,()=>{bookOpen=false;if(!closed){music.setPaused(false);scheduleHint();}});
    }
    function blur(){pauseHints();sound.stop();app.stopReading();}
    function resume(){if(!document.hidden)scheduleHint();}
    function visibility(){if(document.hidden)blur();else resume();}
    window.addEventListener('blur',blur);window.addEventListener('focus',resume);
    document.addEventListener('visibilitychange',visibility);
    for(const type of ['pointerdown','keydown','click'])root.addEventListener(type,music.gesture);
    function close(){
      closed=true;pauseHints();app.stopReading();music.close();sound.stop();
      window.removeEventListener('blur',blur);window.removeEventListener('focus',resume);
      document.removeEventListener('visibilitychange',visibility);
    }
    function render(i,mask,review){
      const stage=i+1, comparing=i===2, past=i===3&&review;
      const key=past||comparing?'clay':i===3?'cry':'yard';
      const beat=sc.beats[past?2:i], actor=BO.content.chars[actors[stage]];
      music.setCue(key==='cry'?'bondage-cry':'bondage-yard',.12);
      const picture=el('img',{src:image(key),alt:views[key][1],draggable:'false'});
      const board=el('div',{class:'by-picture'},picture);
      const label=el('div',{class:'by-location'},el('span',{},'출애굽기 · '+(beat?beat.ref.slice(2):'1:8–14')),el('b',{},views[key][0]));
      const scene=el('section',{class:'by-scene','aria-label':'현장 풍경'},label,board);
      const desk=el('section',{class:'by-desk'});
      const head=el('h2',{tabindex:'-1'},titles[stage]);
      crew=el('div',{class:'by-crew'},app.pic(actors[stage]+'-avatar','',''),el('span',{},'『탐험대 이야기』 '+actor.name));
      thought=el('p',{class:'by-thought',role:'status',hidden:true});
      desk.append(crew,head,thought);
      const log=el('div',{class:'by-account'});
      if(beat){
        const text=app.tx(beat.text),status=el('p',{role:'status',hidden:true});
        scene.append(el('p',{class:'narr by-caption'},text));
        if(app.state.tier==='t1'&&app.canReadAloud){
          log.append(app.readButton(text,status,speaking=>music.setPaused(bookOpen||speaking)),status);
        }
        if(beat.say){
          const who=BO.content.chars[beat.say.who];
          log.append(el('p',{class:'by-say'},el('b',{},'『탐험대 이야기』 '+who.name+' '),beat.say.text));
        }
      }
      log.append(button('말씀 두루마리 · 출 '+refs[past?3:stage],()=>openBook(refs[past?3:stage]),'by-verse'));
      const commands=el('div',{class:'sheet-foot by-commands'});
      const status=el('p',{class:'by-status',role:'status'});
      const primary=(name,fn)=>button(name,fn,'btn onpaper by-primary');
      function action(){sound.play('found','yard');actions.next();}
      function pin(id,fn){
        const spot=spots[id],node=button('',fn,'by-pin');
        node.setAttribute('aria-label',spot.name+' 살펴보기');node.dataset.spot=id;
        node.style.left=spot.x+'%';node.style.top=spot.y+'%';
        board.append(node);return node;
      }
      if(i<2){
        const id=i===-1?'wall':'load';
        if(i===1){
          target=pin('ramp',action);commands.append(primary('벽돌 일터로 가까이 가기',action));
          tip='짐을 살폈다면 성 아래 벽돌 일터로 가 보세요.';
        }else{
          target=pin(id,action);commands.append(primary(i===-1?'둘러보기':'짐을 나르는 사람 살피기',action));
          tip=spots[id].name+'에 있는 둥근 표식을 눌러 보세요.';
        }
      }else if(comparing){
        const keys=['mold','bricks'];
        const notes=el('div',{class:'by-prints','aria-label':'휴의 비교 관찰지'});
        const advance=primary('부르짖음의 기록으로',action);
        const cells=[], pins=[];
        function pick(k){
          if(!(mask&(1<<k))){mask|=1<<k;actions.mark(mask);sound.play(mask===3?'found':'shutter','yard');}
          status.textContent=mask===3?'두 자리를 나란히 기록했어요.':spots[keys[k]].name+' 기록을 남겼어요.';
          sync();resetHint();
        }
        function sync(){
          keys.forEach((key,k)=>{
            const on=!!(mask&(1<<k));cells[k].setAttribute('aria-pressed',String(on));pins[k].setAttribute('aria-pressed',String(on));
            cells[k].querySelector('b').textContent=(on?'기록함 · ':'')+spots[key].name;
          });
          advance.disabled=mask!==3;target=mask===3?advance:pins[mask===1?1:0];
          tip=mask===3?'두 기록 아래의 단추로 다음 현장을 열어 보세요.':spots[keys[mask===1?1:0]].name+'를 그림에서 찾거나 해당 관찰창을 눌러 보세요.';
        }
        keys.forEach((id,k)=>{
          pins.push(pin(id,()=>pick(k)));
          const sample=el('span',{class:'by-sample','aria-hidden':'true'});
          sample.style.backgroundImage='url("'+image(key)+'")';
          sample.style.backgroundPosition=spots[id].x+'% '+spots[id].y+'%';
          const cell=button('',()=>pick(k),'by-print');cell.append(sample,el('b'));
          cells.push(cell);notes.append(cell);
        });
        let start=null;
        board.addEventListener('pointerdown',e=>{
          const id=e.target.closest('.by-pin')?.dataset.spot;
          if(!id||e.button!==0||!e.isPrimary)return;
          start={pointer:e.pointerId,id};e.target.setPointerCapture(e.pointerId);
        });
        board.addEventListener('pointerup',e=>{
          if(start?.pointer!==e.pointerId)return;
          const end=document.elementFromPoint(e.clientX,e.clientY)?.closest('.by-pin')?.dataset.spot;
          if(end&&end!==start.id){pick(keys.indexOf(start.id));pick(keys.indexOf(end));}
          start=null;
        });
        board.addEventListener('pointercancel',()=>{start=null;});
        desk.append(notes);commands.append(advance);sync();
      }else{
        const toggle=button(past?'백성이 부르짖은 때로 돌아가기':'앞서 본 벽돌 일터',()=>{
          actions.review(!past);render(i,mask,!past);
        });
        scene.append(toggle);
        if(!past)pin('hands',()=>openBook('2:23'));
        target=button(past?'일터의 원문 · 출 1:14':'하나님이 들으신 일 · 출 2:24',()=>openBook(past?'1:14':'2:24'),'by-seal');
        desk.append(target);commands.append(primary('다음으로 가는 관문',actions.next));
        tip='기록의 인장을 눌러 장절을 펼쳐 보세요.';
      }
      desk.append(status,commands);
      const aides=el('div',{class:'by-aides'},button('동료에게 묻기',manual));
      if(i>=0)aides.append(button('이전',actions.prev));
      desk.append(aides,log);area.replaceChildren(scene,desk);
      if(!root.isConnected)app.show(root);
      area.scrollTop=0;
      thresholds=BO.wildField.hintModes[['t1','t2','t3'].indexOf(app.state.tier)].seconds;
      resetHint();
      if(stage>0)head.focus({preventScroll:true});
    }
    return {render,close};
  }
  BO.bondageField={create,scroll};
})();
