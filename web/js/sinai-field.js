/* 시내산에서 탐험대가 남긴 두 사진. 원문은 고정 판본에서 읽고 기록하는 것은 카메라 위치뿐이다. */
(function(){
  'use strict';
  const app=BO.app2d, el=app.el, scripture=BO.wildScripture;
  const views={
    arrival:{name:'산 앞에 친 장막',verse:'19:2',aim:[14,62],radius:[13,19],alt:'아침 햇빛이 비치는 산 아래, 직물 장막들이 늘어선 이스라엘 진영'},
    witness:{name:'멀리 선 백성',verse:'20:18',aim:[84,69],radius:[14,17],alt:'시내산 위에 빽빽한 구름과 연기가 있고, 백성이 산에서 떨어져 모여 선 모습'}
  };
  function source(key){return BO.sinaiImages?.[key]||'assets/sinai/'+key+'.webp';}
  function button(words,click,css='sf-button'){
    return el('button',{type:'button',class:css,on:{click}},words);
  }
  function bounded(value,min,max){return Math.max(min,Math.min(max,value));}
  function point(value,fallback){
    return Array.isArray(value)&&value.length===2&&value.every(n=>Number.isFinite(n)&&n>=0&&n<=100)?value:fallback;
  }
  function setCrop(image,xy){
    image.style.backgroundPosition=xy.map(n=>bounded((n-20)/.6,0,100)+'%').join(' ');
  }
  function crop(key,xy){
    const image=el('span',{class:'sf-crop',role:'img','aria-label':views[key].name+' 확대'});
    image.style.backgroundImage='url("'+source(key)+'")';
    setCrop(image,xy);
    return image;
  }
  function mount({p,stage,s,advance,book,play,save,redraw,ask,refreshHints,next,restart}){
    const phase=p.phase, complete=phase===3, repair=phase===1;
    const comparing=phase===2&&!!point(p.crowdPhoto,null);
    const key=phase<2||phase===2&&p.backLook&&!comparing||complete&&p.reviewEarly?'arrival':'witness', scene=views[key];
    const crew=BO.wildField.crew, lead=crew[Math.min(phase,2)];
    const task=complete?'시내산 관찰 기록':comparing?'말씀 곁에 사진 붙이기':
      ['백성이 처음 장막을 친 곳','끊어진 산 능선 잇기','백성이 멈춰 선 자리'][phase];
    const instruction=comparing?'출애굽기 20장 18절을 읽고, 두 사진 중 그 순간을 찍은 사진을 골라 보세요.':
      ['풍경에서 큰 장막을 찾아 초점을 옮기고 사진을 찍으세요.',
       '관측기 아래쪽 필름이 밀렸어요. 좌우로 밀어 경계에서 끊긴 산 능선을 이어 보세요.',
       '산에서 눈을 돌려 보세요. 멀리 모여 선 백성을 찾아 사진에 담으세요.'][phase];
    const status=el('p',{class:'sf-feedback',role:'status'});
    const root=el('div',{class:'sf-game'});
    const board=el('div',{class:'sf-board','data-phase':String(phase)});
    const img=el('img',{class:'sf-world',src:source(key),alt:scene.alt,draggable:'false'});
    board.append(img);
    const note=el('section',{class:'sf-note','aria-label':'탐험대 현장 수첩'});
    const head=el('h2',{class:'sf-task-title',tabindex:'-1'},task);
    const panel=el('div',{class:'sf-panel'});
    const photoFor=k=>point(k==='arrival'?p.tentPhoto:p.crowdPhoto,views[k].aim);
    function reading(ref){
      const block=el('aside',{class:'sf-scripture','aria-label':'말씀 기록'},
        el('small',{},'말씀 기록 · '+scripture.edition),el('blockquote',{},scripture.verses[ref]),
        button('출애굽기 '+ref+' 두루마리',()=>book(ref),'sf-verse'));
      return block;
    }
    function card(k,select){
      const name=views[k].name;
      const card=select?button('',()=>select(k),'sf-print sf-pick'):el('figure',{class:'sf-print'});
      if(select)card.setAttribute('aria-label',name+' 사진 붙이기');
      card.append(crop(k,photoFor(k)),el(select?'span':'figcaption',{}, name));
      return card;
    }
    const personal=el('figure',{class:'sf-print sf-personal'});
    function showPersonal(){
      const shot=p.personalPhoto,valid=shot&&Object.hasOwn(views,shot.scene)&&point(shot.xy,null);
      personal.hidden=!valid;
      if(valid)personal.replaceChildren(crop(shot.scene,shot.xy),el('figcaption',{},'내가 고른 풍경'));
    }
    showPersonal();
    const badge=el('div',{class:'sf-credit'},BO.wildFeel.portrait(lead.id,complete?'smile':'neutral'),el('span',{},'탐험대 수첩 · '+lead.name));
    panel.append(badge,head);
    if(!complete)panel.append(el('p',{class:'sf-direction'},instruction));
    const viewTitle=el('div',{class:'sf-scene-title'},
      el('span',{},phase<2?'출애굽기 19장':'출애굽기 19–20장'),
      el('strong',{},key==='witness'?'시내산에 덮인 구름':repair?'셋째 날을 기다리며':'산 앞에 친 진영'));
    const photo=el('section',{class:'sf-scene','aria-label':'시내산 현장'},viewTitle,board);
    const tools=el('div',{class:'sf-tools'});
    let hintTarget;
    if(!complete&&!comparing){
      board.tabIndex=0;board.setAttribute('role','group');
      board.setAttribute('aria-label',repair?'필름 정렬. 좌우 방향키로 필름을 움직이세요.':'현장 카메라. 방향키로 조준하고 엔터로 촬영하세요.');
      const reticle=el('span',{class:'sf-reticle','aria-hidden':'true'},el('i',{}),el('i',{}),el('i',{}),el('i',{}));
      const subject=views[phase===0?'arrival':'witness'];
      const target=subject.aim;
      let xy=point(p.finder,[49,46]).slice();
      let offset=Number.isFinite(p.filmOffset)?bounded(p.filmOffset,-21,21):15;
      let strip;
      if(repair){
        strip=el('div',{class:'sf-film-strip','aria-hidden':'true'},
          el('img',{src:source(key),alt:'',draggable:'false'}));
        board.append(strip,el('span',{class:'sf-seam','aria-hidden':'true'}));
      }else board.append(reticle);
      const marker=el('span',{class:'sf-hint-mark',hidden:true,'aria-hidden':'true'});
      marker.style.left=(repair?50:target[0])+'%';marker.style.top=(repair?35:target[1])+'%';board.append(marker);
      hintTarget=marker;
      const preview=el('div',{class:'sf-lens-preview','aria-label':'관측창 확대'});
      const lens=repair?null:crop(key,xy);
      if(lens){preview.append(lens,el('span',{},'관측창'));tools.append(preview);}
      const targeted=()=>!(phase===2&&p.backLook)&&Math.hypot((xy[0]-target[0])/subject.radius[0],(xy[1]-target[1])/subject.radius[1])<=1;
      const aligned=()=>Math.abs(offset)<=2;
      const announce=()=>{status.textContent=repair?(aligned()?'능선이 이어졌어요. 관측창을 고정해 보세요.':'그림의 위아래 경계에서 능선이 어긋난 만큼 움직이세요.'):
        targeted()?'관찰 대상이 렌즈 안에 들어왔어요.':'지금 렌즈에 담긴 풍경이에요.';};
      const refresh=()=>{
        board.classList.toggle('sf-ready',repair?aligned():targeted());
        if(repair){strip.firstChild.style.transform='translateX('+offset+'%)';return;}
        reticle.style.left=xy[0]+'%';reticle.style.top=xy[1]+'%';
        setCrop(lens,xy);
      };
      function record(){
        if(repair){
          if(!aligned()){status.textContent=offset>0?'아래 능선이 오른쪽으로 밀렸어요. 왼쪽으로 조금 옮겨 보세요.':'아래 능선이 왼쪽으로 밀렸어요. 오른쪽으로 조금 옮겨 보세요.';play('tap');return;}
          delete p.finder;advance();return;
        }
        if(phase===2&&p.backLook){status.textContent='이 길에 누가 나타났을까요? 구름이 덮인 풍경에서 같은 자리를 보세요.';return;}
        play('shutter');
        if(!targeted()){
          p.personalPhoto={scene:key,xy:xy.slice()};save();showPersonal();
          status.textContent=phase===0?'이 풍경을 수첩에 담았어요. 큰 장막도 찾아볼까요?':'이 풍경을 수첩에 담았어요. 이번엔 멀리 선 백성을 찾아보세요.';
          return;
        }
        delete p.finder;
        if(phase===0){p.tentPhoto=xy.slice();advance();}
        else{p.crowdPhoto=xy.slice();save();play('found');refreshHints();redraw();}
      }
      function nudge(dx,dy){
        if(repair){offset=bounded(offset+dx*2,-21,21);p.filmOffset=offset;}
        else{xy=[bounded(xy[0]+dx*5,2,98),bounded(xy[1]+dy*5,3,97)];p.finder=xy;}
        refresh();announce();save();play('tap');
      }
      const arrows=el('div',{class:'sf-arrows',role:'group','aria-label':repair?'필름 움직이기':'렌즈 움직이기'});
      for(const [symbol,label,dx,dy] of [['◀','왼쪽',-1,0],['▲','위',0,-1],['▼','아래',0,1],['▶','오른쪽',1,0]]){
        if(repair&&dy)continue;
        const b=button(symbol,()=>nudge(dx,dy));b.setAttribute('aria-label',(repair?'필름 ':'렌즈 ')+label);arrows.append(b);
      }
      let drag=null;
      function aim(event){
        const r=board.getBoundingClientRect();
        if(repair){offset=bounded(drag.offset+100*(event.clientX-drag.x)/r.width,-21,21);p.filmOffset=offset;}
        else{xy=[bounded(100*(event.clientX-r.left)/r.width,2,98),bounded(100*(event.clientY-r.top)/r.height,3,97)];p.finder=xy;}
        refresh();
      }
      board.addEventListener('pointerdown',e=>{
        if(!e.isPrimary||e.button!==0)return;
        drag={id:e.pointerId,x:e.clientX,offset};board.setPointerCapture(e.pointerId);aim(e);
      });
      board.addEventListener('pointermove',e=>{if(drag?.id===e.pointerId)aim(e);});
      board.addEventListener('lostpointercapture',()=>{if(drag){drag=null;save();announce();}});
      board.addEventListener('keydown',e=>{
        const direction={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
        if(direction){e.preventDefault();nudge(...direction);}
        if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!e.repeat)record();}
      });
      const shutter=button(repair?'관측창 고정':'사진 찍기',record,'sf-shutter');
      tools.append(arrows);refresh();
      panel.append(tools,status,button('동료에게 묻기',ask,'sf-hint'));
      photo.append(el('div',{class:'sf-action-bar'},
        el('span',{},repair?'휴 · 아래 필름을 좌우로 밀어 보세요.':phase===0?'최온 · 큰 장막에 초점을 맞춰 보세요.':'온우 · 백성이 선 곳에 초점을 맞춰 보세요.'),shutter));
      if(phase===2){
        const times=el('div',{class:'sf-review',role:'group','aria-label':'같은 자리의 두 풍경'});
        for(const k of ['arrival','witness']){
          const b=button(k==='arrival'?'장막을 친 때':'구름이 덮인 때',()=>{p.backLook=k==='arrival';save();redraw();});
          b.setAttribute('aria-pressed',String(key===k));times.append(b);
        }
        photo.append(times);
      }
    }else if(comparing){
      photo.append(el('div',{class:'sf-caption'},'탐험대가 촬영한 두 기록'));
      const select=k=>{
        if(k==='arrival'){status.textContent='이 사진은 진영에 도착했을 때 찍었어요. 출 19:2에 보관했어요.';play('tap');return;}
        delete p.backLook;advance();
      };
      panel.append(reading('20:18'),el('div',{class:'sf-prints'},card('arrival',select),card('witness',select)),status);
    }else{
      panel.append(el('div',{class:'sf-prints'},card('arrival'),card('witness')),
        el('p',{class:'sf-saved'},stage.card+' 관찰 카드 · '+stage.pin),
        button('말씀 인장 · 출 '+stage.seal,()=>book(stage.seal),'sf-verse'),
        button('금송아지 사건으로',next,'sf-shutter'),
        button('이 장소 다시 답사',restart,'sf-hint'));
      photo.append(el('div',{class:'sf-review'},['arrival','witness'].map(k=>{
        const b=button(views[k].name,()=>{p.reviewEarly=k==='arrival';save();redraw();});
        b.setAttribute('aria-pressed',String(key===k));return b;
      })));
    }
    if(phase===1){
      const kept=button('',()=>book('19:2'),'sf-kept');
      kept.append(crop('arrival',photoFor('arrival')),el('span',{},'보관한 첫 사진 · 산 앞의 장막'));note.append(kept);
    }
    if(!comparing)photo.append(reading(complete?'20:18':phase===0?'19:2':phase===1?'19:11':'20:2'));
    if(phase>=2)note.append(button('십계명 원문 펼치기 · 출 20:1–17',()=>book('20:1'),'sf-verse'));
    const recordIndex=complete||comparing?6:[0,2,3][phase];
    const caption=el('p',{class:'sf-event'},stage.beats[recordIndex].notes[s.mode]);
    const report=el('details',{class:'sf-report'},el('summary',{},'이때 무슨 일이 있었나요?'),caption);
    note.append(report,personal);
    const progress=el('ol',{class:'sf-progress','aria-label':'탐사 진행'});
    ['최온 · 장막','휴 · 산마루','온우 · 백성'].forEach((label,i)=>{
      const li=el('li',{'aria-current':i===phase?'step':null},(i<phase?'✓ ':'')+label);
      if(i<phase)li.classList.add('sf-done');progress.append(li);
    });
    root.append(photo,progress,el('div',{class:'sf-desk'},panel,note));
    return {root,head,onMode(){caption.textContent=stage.beats[recordIndex].notes[s.mode];},hint(level){
      if(level<1||complete||comparing)return;
      status.textContent=repair?'휴 · 경계선에서 산의 비탈이 이어지는 곳을 찾아봐.':phase===0?'최온 · 천 지붕 아래 어두운 입구가 보여.':'온우 · 산에서 떨어져 선 사람들을 찾아보자.';
      badge.classList.toggle('sf-pulse',level>=2);
      if(hintTarget)hintTarget.hidden=level<3;
    }};
  }
  BO.sinaiField={mount};
})();
