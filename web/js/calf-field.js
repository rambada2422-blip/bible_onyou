/* 금송아지 사건을 목격하는 탐험대의 관찰지와 파노라마 필름. 세 친구는 기록만 편집한다. */
(function () {
  'use strict';
  const el=BO.app2d.el;
  const views=[
    {key:'rings',title:'백성이 가져온 금고리',place:'진영에서',verse:'32:3',beat:0,music:'wild-calf-camp',alt:'산 아래 장막에서 여러 사람이 아론에게 금 귀고리를 가져오는 모습'},
    {key:'tablets',title:'산 아래 깨진 두 돌판',place:'산기슭에서',verse:'32:19',beat:4,music:'wild-calf-stone',alt:'산기슭 앞에 깨진 돌판이 놓여 있고 그 뒤로 진영과 송아지 형상이 보이는 모습'},
    {key:'return',title:'다시 나아가는 모세',place:'다음 날',verse:'32:30',beat:6,music:'wild-calf-return',alt:'다음 날 진영을 뒤로하고 산으로 다시 나아가는 모세'}
  ];
  const hintLines=['금고리들이 모인 천 위를 살펴보세요.','산 능선과 땅이 이어지는 두 필름을 골라 자리를 바꿔 보세요.','장절을 읽고 그때의 풍경을 띠에 끼워 보세요.'];
  const actions=['고리 자국을 수집하기','끊어진 기록 필름 잇기','장절에 현장 기록 끼우기'];
  const source=v=>BO.calfImages?.[v.key]||'assets/calf/'+v.key+'.webp';
  const button=(words,click,cls='sf-button')=>el('button',{type:'button',class:cls,on:{click}},words);
  const maxView=p=>Math.min(p.phase,2);
  function view(p){
    if(Number.isInteger(p.calfView)&&p.calfView>=0&&p.calfView<=maxView(p))return views[p.calfView];
    return views[p.phase===3&&p.reviewEarly?0:maxView(p)];
  }
  function mount({p,s,stage,advance,book,play,save,redraw,ask,progress,restart,journal}){
    const phase=p.phase, done=phase===3, current=view(p), index=views.indexOf(current);
    const lead=BO.wildField.crew[maxView(p)];
    const root=el('div',{class:'sf-game cf-game'}), head=el('h2',{class:'sf-task-title',tabindex:'-1'},done?'모은 세 장의 기록':actions[phase]);
    const board=el('div',{class:'cf-board'},el('img',{src:source(current),alt:current.alt,draggable:'false'}));
    const bar=el('div',{class:'cf-bar'});
    const scene=el('section',{class:'sf-scene cf-scene','aria-label':'산 아래 현장'},
      el('div',{class:'sf-scene-title'},el('span',{},current.place),el('strong',{},current.title)),board,bar);
    const caption=el('p',{class:'cf-caption'});
    scene.insertBefore(caption,bar);
    const feedback=el('p',{class:'cf-feedback',role:'status'});
    const prompt=el('p',{class:'cf-hint',role:'status',hidden:true});
    const credit=el('div',{class:'sf-credit'},BO.wildFeel.portrait(lead.id,done?'smile':'neutral'),
      el('span',{},'『탐험대 이야기』 '+lead.name));
    const panel=el('div',{class:'sf-panel cf-panel'},credit,prompt,head);
    const story=el('p',{class:'cf-account'});
    const account=el('section',{class:'cf-story','aria-label':'사건 안내'},el('b',{},'사건 기록 · 출 '+stage.beats[current.beat].ref),story);
    const scripture=BO.wildScripture;
    if(index===1){
      const detail=el('details',{class:'cf-inspect'},el('summary',{},'돌판 너머의 진영 확대'));
      const crop=el('div',{class:'cf-crop',role:'img','aria-label':'진영에 모여 있는 백성과 작은 금송아지'});
      crop.style.backgroundImage='url("'+source(current)+'")';
      detail.append(crop);scene.insertBefore(detail,bar);
      detail.addEventListener('toggle',()=>{if(detail.open)play('found');});
    }
    let hintTarget=null;
    function turn(i){
      if(i===index)return;
      p.calfView=i;save();play('tap');redraw();
    }
    function finishStep(){
      delete p.calfView;delete p.reviewEarly;
      s.actor=Math.min(2,phase+1);advance();
    }
    function addReading(ref){
      scene.append(el('aside',{class:'sf-scripture','aria-label':'말씀 기록'},el('small',{},'말씀 기록 · '+scripture.edition),
        el('blockquote',{},scripture.verses[ref]),button('출 '+ref+' 두루마리 열기',()=>book(ref),'sf-verse')));
    }
    function drawViewChooser(){
      const nav=el('div',{class:'cf-views',role:'group','aria-label':'모은 현장 다시 보기'});
      views.slice(0,maxView(p)+1).forEach((v,i)=>{
        const b=button(v.place,()=>turn(i));b.setAttribute('aria-pressed',String(i===index));nav.append(b);
      });
      scene.insertBefore(nav,board);
    }
    if(phase>0)drawViewChooser();
    if(phase===0){
      // 실제 귀고리에는 손을 대지 않고 탐험대 관찰지의 세 창을 문지른다.
      const target=button('⌕',openLens,'cf-pin');
      target.setAttribute('aria-label','금고리가 모인 자리 확대');board.append(target);
      const leadIn=el('strong',{},'그림에서 천 위에 모인 금고리를 찾으세요.');
      const rub=el('div',{class:'cf-rub',role:'group','aria-label':'금고리 확대 관찰지'});
      rub.style.backgroundImage='url("'+source(current)+'")';
      const cells=[0,1,2].map(i=>{
        const b=button('',()=>expose(i),'cf-paper');b.setAttribute('aria-label',['왼쪽','가운데','오른쪽'][i]+' 관찰창 문지르기');
        rub.append(b);return b;
      });
      let mask=Number.isInteger(p.rubMask)?p.rubMask&7:0;
      const record=button('기록하고 휴 부르기',finishStep,'sf-shutter');
      function sync(){
        rub.hidden=!p.lensOpen;record.hidden=!p.lensOpen;record.disabled=mask!==7;target.hidden=!!p.lensOpen;
        for(const [i,b] of cells.entries()){
          const open=Boolean(mask&(1<<i));b.classList.toggle('cf-clear',open);b.setAttribute('aria-pressed',String(open));
        }
        leadIn.textContent=!p.lensOpen?'그림에서 천 위에 모인 금고리를 찾으세요.':mask!==7?'확대 관찰지를 손가락으로 쓸거나 세 칸을 누르세요.':'세 창에 금고리 자국이 남았어요.';
        hintTarget=!p.lensOpen?target:mask!==7?cells.find((_,i)=>!(mask&(1<<i))):record;
      }
      function openLens(){
        p.lensOpen=true;save();play('found');sync();progress();cells[0].focus({preventScroll:true});
      }
      function expose(i){
        if(mask&(1<<i))return;
        mask|=1<<i;p.rubMask=mask;save();play(mask===7?'found':'sand');sync();progress();
      }
      let rubbing=null;
      function sweep(event){
        const box=rub.getBoundingClientRect();
        if(event.clientY<box.top||event.clientY>box.bottom||event.clientX<box.left||event.clientX>box.right)return;
        expose(Math.min(2,Math.floor((event.clientX-box.left)*3/box.width)));
      }
      rub.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button!==0)return;rubbing=e.pointerId;rub.setPointerCapture(rubbing);sweep(e);});
      rub.addEventListener('pointermove',e=>{if(e.pointerId===rubbing)sweep(e);});rub.addEventListener('lostpointercapture',()=>{rubbing=null;});
      bar.append(leadIn,rub,record);sync();
    }else if(phase===1&&index===1){
      let order=Array.isArray(p.filmOrder)&&p.filmOrder.slice().sort().join(',')==='0,1,2'?p.filmOrder.slice():
        (p.dial===stage.aim?[0,1,2]:[1,2,0]);
      let selected=Number.isInteger(p.filmPick)&&order[p.filmPick]!==undefined?p.filmPick:-1;
      const strips=el('div',{class:'cf-strips',role:'group','aria-label':'휴의 세 조각 기록 필름'});
      const pieces=order.map((_,i)=>{
        const b=button('',()=>choose(i),'cf-strip');strips.append(b);return b;
      });
      const tip=el('strong',{},'어긋난 사진 두 칸을 골라 서로 바꾸세요.');
      const lock=button('필름 고정하고 온우 부르기',()=>{
        if(order.some((n,i)=>n!==i)){
          feedback.textContent='바위와 산 능선이 경계에서 끊겨 있어요. 위 풍경을 보며 필름을 이어 보세요.';play('tap');
          tip.textContent='위 그림과 같은 풍경이 되도록 두 칸을 바꿔 보세요.';return;
        }
        finishStep();
      },'sf-shutter');
      function sync(){
        for(const [i,b] of pieces.entries()){
          const frame=order[i];
          b.style.backgroundImage='url("'+source(current)+'")';b.style.backgroundPosition=(frame*50)+'% center';
          b.setAttribute('aria-pressed',String(selected===i));b.setAttribute('aria-label',(i+1)+'번째 필름 · '+['왼쪽 풍경','가운데 풍경','오른쪽 풍경'][frame]);
        }
        hintTarget=order.every((n,i)=>n===i)?lock:pieces[order.findIndex((n,i)=>n!==i)];
      }
      function choose(i){
        if(selected<0){selected=i;tip.textContent='이 필름과 자리를 바꿀 칸을 고르세요.';}
        else if(selected===i){selected=-1;tip.textContent='자리를 바꿀 두 필름을 고르세요.';}
        else{
          [order[selected],order[i]]=[order[i],order[selected]];selected=-1;
          const aligned=order.every((n,k)=>n===k);
          tip.textContent=aligned?'사진의 능선이 온전히 이어졌어요.':'두 필름의 자리를 바꿨어요.';
          feedback.textContent='';play(aligned?'found':'wood');
        }
        p.filmOrder=order.slice();p.filmPick=selected;save();sync();progress();
      }
      bar.append(tip,strips,lock);sync();
    }else if(phase===1){
      const back=button('필름 맞추기로 돌아가기',()=>turn(1),'sf-shutter');bar.append(back);hintTarget=back;
    }else if(phase===2){
      const line=el('strong',{}), rail=el('div',{class:'cf-rail',role:'group','aria-label':'온우의 장절 기록 띠'});
      const choices=[2,0,1].map(i=>{
        const tile=button('',()=>attach(i),'cf-card');
        tile.append(el('img',{src:source(views[i]),alt:''}),el('span',{},views[i].title));rail.append(tile);return tile;
      });
      const ref=button('',()=>book(views[Math.min(p.mapped,2)].verse),'sf-verse');
      const finish=button('현장 수첩에 보관',()=>{if(p.mapped===3)finishStep();},'sf-shutter');
      function sync(){
        const all=p.mapped===3;
        line.textContent=all?'세 장의 현장 기록을 이었어요.':(p.mapped+1)+' / 3 · 출 '+views[p.mapped].verse+'에 어울리는 기록을 골라 끼우세요.';
        ref.textContent=all?'다시 읽기 · 출 32:30':'이 칸의 말씀 · 출 '+views[p.mapped].verse;
        choices.forEach((tile,k)=>{tile.disabled=[2,0,1][k]<p.mapped;});
        finish.hidden=!all;hintTarget=all?finish:choices[[2,0,1].indexOf(p.mapped)];
      }
      function attach(i){
        if(i!==p.mapped){feedback.textContent='이 풍경의 말씀은 출 '+views[i].verse+'에 있어요. 지금 열려 있는 칸의 말씀을 살펴보세요.';play('tap');return;}
        p.mapped++;save();feedback.textContent=views[i].title+' 기록을 끼웠어요.';play('found');sync();progress();
      }
      bar.append(line,ref,rail,finish);sync();
    }else{
      bar.append(el('strong',{},'현장 수첩 · 관찰 기록 세 장'));
      panel.append(el('strong',{},stage.card+' 관찰 카드'),button('말씀 인장 · 출 '+stage.seal,()=>book(stage.seal),'sf-verse'),
        el('p',{class:'sf-saved'},'고정 선반 · '+stage.pin),button('시내산 수첩으로',journal,'sf-shutter'),button('이 장소 다시 답사',restart));
    }
    addReading(current.verse);
    if(!done)panel.append(feedback,button('동료에게 묻기',ask,'sf-hint'));
    const ending=el('div',{class:'cf-ending'});
    if(index===2){
      ending.append(button('모세의 간구 · 출 32:32',()=>book('32:32'),'sf-verse'),
        button('백성에게 일어난 일 · 출 32:35',()=>book('32:35'),'sf-verse'));
      account.append(ending);
    }
    if(index===1)account.append(button('그날 진에서 겪은 일 · 출 32:28',()=>book('32:28'),'sf-verse'));
    function updateStory(){
      const notes=stage.beats[current.beat].notes[s.mode];
      const first=notes.indexOf('. ')+1;
      caption.textContent=first?notes.slice(0,first):notes;
      story.textContent=first?notes.slice(first).trim():'';
    }
    updateStory();root.append(scene,el('div',{class:'sf-desk'},panel,account));
    return {root,head,onMode(){updateStory();this.hint(0);},hint(level){
      prompt.hidden=!level;
      const line=phase===0&&p.lensOpen?'세 관찰창을 손가락으로 쓸어 보세요.':hintLines[phase];
      prompt.textContent=level?lead.name+' · '+line:'';
      credit.classList.toggle('sf-pulse',level>=2);
      root.querySelectorAll('.cf-guide').forEach(n=>n.classList.remove('cf-guide'));
      if(level>=3)hintTarget?.classList.add('cf-guide');
    }};
  }
  BO.calfField={mount,view};
})();
