/* 현장 채집은 렌즈·집음기·수첩만 조작한다. 원문은 별도 고정 판본에서 읽는다. */
(function () {
  'use strict';
  const el=BO.app2d.el;
  const camp=[
    {label:'빈 항아리',x:23,y:66}, {label:'마른 물길',x:59,y:51}, {label:'진영의 가족',x:83,y:53}
  ];
  // 하류에서 상류로 되짚을 때 보이는 실제 그림의 세 지점.
  const stream=[
    {label:'물을 뜨는 자리',x:66,y:82}, {label:'자갈 사이 여울',x:46,y:63}, {label:'반석의 물줄기',x:11,y:22}
  ];
  // 실제 여울의 굽이에 맞춰 노트에 자기 관찰선을 잇는다.
  const bends=[[[62,78],[57,74],[53,71],[50,67]],[[38,62],[33,58],[32,54],[26,49],[23,46],[18,41],[15,38],[13,31]]];
  function drawTrail(canvas,count){
    const g=canvas.getContext('2d');g.clearRect(0,0,canvas.width,canvas.height);
    if(count<2)return;
    g.beginPath();g.moveTo(stream[0].x*10,stream[0].y*5.62);
    for(let i=1;i<count;i++){
      for(const [x,y] of bends[i-1])g.lineTo(x*10,y*5.62);
      g.lineTo(stream[i].x*10,stream[i].y*5.62);
    }
    g.lineJoin='round';g.lineCap='round';g.strokeStyle='#173f44';g.lineWidth=7;g.stroke();
    g.strokeStyle='#f7e6a1';g.lineWidth=3;g.stroke();
  }
  const titles=['진영에 남은 물의 흔적','반석의 물소리 채집','물길을 거슬러 그리기','두 장소의 현장 기록'];
  const directions=[
    '그림 속 세 곳을 눌러 확대해 보세요. 물이 비어 있는 그릇을 찾으면 수첩에 담으세요.',
    '이미 흐르는 물을 들어 보세요. 집음기를 좌우로 돌려 바위에서 물이 나오는 자리를 녹음하세요.',
    '백성이 물을 뜨는 자리에서 출발하세요. 여울을 지나 물이 처음 나오는 곳까지 그림을 쓸거나 차례로 누르세요.'
  ];
  const crew=BO.wildField.crew;
  const src=key=>BO.rephidimImages?.[key]||'assets/rephidim/'+key+'.webp';
  const button=(label,fn,css='sf-button')=>el('button',{type:'button',class:css,on:{click:fn}},label);
  const position=(node,pt)=>{node.style.left=pt.x+'%';node.style.top=pt.y+'%';};
  function mount({p,stage,s,advance,book,play,save,review,ask,progress,restart,next,journal}){
    const phase=p.phase, early=phase===0||!!p.reviewEarly, complete=phase===3;
    const active=crew[Math.min(phase,2)], key=early?'camp':'stream';
    const root=el('div',{class:'sf-game rp-game'}), head=el('h2',{class:'sf-task-title',tabindex:'-1'},titles[phase]);
    const board=el('div',{class:'rp-board','data-view':key,role:'group','aria-label':early?'르비딤 진영 현장':'호렙 반석 현장'});
    const picture=el('img',{class:'sf-world',src:src(key),draggable:'false',
      alt:early?'메마른 골짜기 진영 앞에 빈 항아리가 놓여 있고, 사람들이 물을 기다리는 풍경':'큰 바위에서 나온 물이 자갈 사이로 흘러 사람들이 물을 뜨는 풍경'});
    board.append(picture);
    const caption=el('strong',{},early?'마실 물이 없던 진영':'바위에서 흘러나온 물');
    const portrait=BO.wildFeel.portrait(active.id,complete?'smile':'neutral');
    const credit=el('div',{class:'sf-credit'},portrait,el('span',{},'『탐험대 이야기』 '+active.name));
    const status=el('p',{class:'rp-feedback',role:'status'}), action=el('div',{class:'rp-actions'});
    const panel=el('section',{class:'sf-panel rp-panel'},credit,head);
    const card=el('section',{class:'sf-scene rp-scene'},el('header',{class:'sf-scene-title'},
      el('span',{},early?'르비딤 · 출 17:1':'호렙 · 출 17:6'),caption),board,action);
    const hintText=el('p',{class:'rp-aside',role:'status'}), askButton=button('동료에게 묻기',ask,'sf-hint');
    const scripture=BO.wildScripture;
    const reading=(ref)=>el('aside',{class:'sf-scripture','aria-label':'말씀 기록'},
      el('small',{},'말씀 기록 · '+scripture.edition+' · 출 '+ref),el('blockquote',{},scripture.verses[ref]),
      button('출 '+ref+' 두루마리 열기',()=>book(ref),'sf-verse'));
    const viewOnly=phase>0&&early;
    let hintTarget=null, modeText;
    function crop(point){
      const detail=el('div',{class:'rp-cut',role:'img','aria-label':point.label+' 확대'});
      detail.style.backgroundImage='url("'+src(key)+'")';
      detail.style.backgroundPosition=[point.x,point.y].map(n=>Math.max(0,Math.min(100,(n-16)/.68))+'%').join(' ');
      return detail;
    }
    function marker(point,select){
      const pin=button('',select,'rp-pin');
      pin.setAttribute('aria-label',point.label+' 살피기');
      position(pin,point);board.append(pin);return pin;
    }
    if(!complete)panel.append(hintText,el('p',{class:'sf-direction'},viewOnly?'처음 진영을 다시 보고 있어요. 물길 답사를 이어가려면 호렙을 펼치세요.':directions[phase]));
    if(phase>0){
      const views=el('div',{class:'sf-review rp-views',role:'group','aria-label':'두 장소 다시 보기'});
      [['르비딤 진영',true],['호렙 물길',false]].forEach(([name,before])=>{
        const tab=button(name,()=>{if(early!==before)review(before);});
        tab.setAttribute('aria-pressed',String(early===before));views.append(tab);
      });
      card.insertBefore(views,board);
    }
    if(phase===0){
      const detail=el('div',{class:'rp-detail','aria-label':'최온의 돋보기'});
      let selected=Number.isInteger(p.campSpot)&&camp[p.campSpot]?p.campSpot:-1;
      const pins=camp.map((pt,i)=>marker(pt,()=>select(i)));
      const record=button('기록하고 휴 부르기',()=>{
        if(selected!==0)return;
        play('cup');s.actor=1;delete p.reviewEarly;advance();
      },'sf-shutter');
      function render(){
        detail.replaceChildren();
        if(selected>=0)detail.append(crop(camp[selected]),el('strong',{},camp[selected].label));
        else detail.append(el('strong',{},'그림에서 빈 항아리를 찾아 누르세요.'));
        pins.forEach((pin,i)=>pin.setAttribute('aria-pressed',String(i===selected)));
        record.disabled=selected!==0;
      }
      function select(i){
        selected=i;p.campSpot=i;save();render();
        play(['cup','sand','dirt'][i]);
        status.textContent=['항아리 안쪽 바닥까지 보여요. 이 흔적을 수첩에 담으세요.','자갈과 모래가 드러나 있어요. 가까이 있는 그릇도 살펴보세요.','가족들이 진영에서 쉬고 있어요. 곁에 놓인 그릇을 살펴보세요.'][i];
      }
      action.append(detail,record);render();hintTarget=pins[0];
    }else if(phase===1&&!early){
      const spring=stream[2];
      let bearing=Number.isFinite(p.bearing)?Math.max(0,Math.min(100,p.bearing)):[spring.x,76,96][p.dial];
      const cursor=el('i',{class:'rp-listener','aria-hidden':'true'});
      board.append(cursor);
      const meter=el('span',{class:'rp-meter','aria-hidden':'true'});
      for(let i=0;i<13;i++)meter.append(el('i',{}));
      const output=el('output',{class:'rp-bearing'});
      const slider=el('input',{type:'range',min:'0',max:'100',step:'1','aria-label':'집음기 방향'});
      const accept=button('녹음하고 온우 부르기',()=>{
        if(!near()){status.textContent='집음기를 물이 솟는 바위 쪽으로 돌려 보세요.';play('tap');return;}
        play('brook');s.actor=2;advance();
      },'sf-shutter');
      function near(){return Math.abs(bearing-spring.x)<=9;}
      function tune(audible){
        slider.value=String(bearing);
        const strength=Math.max(1,13-Math.floor(Math.abs(bearing-spring.x)/4));
        const name=near()?'반석의 물소리':bearing>spring.x+9?'자갈밭 쪽':'바위 가장자리';
        output.textContent=name;slider.setAttribute('aria-valuetext',name+' · '+strength+'칸');
        Array.from(meter.children).forEach((bar,i)=>bar.classList.toggle('rp-loud',i<strength));
        position(cursor,{x:bearing,y:spring.y});cursor.classList.toggle('rp-in-tune',near());
        if(audible)play(near()?'brook':'stone');
      }
      function setBearing(value,audible){
        bearing=Math.min(100,Math.max(0,Math.round(value)));p.bearing=bearing;save();tune(audible);
      }
      slider.oninput=()=>setBearing(Number(slider.value),false);
      slider.onchange=()=>tune(true);
      board.addEventListener('click',e=>{
        const box=board.getBoundingClientRect();
        setBearing(100*(e.clientX-box.left)/box.width,true);
      });
      const guide=el('span',{class:'rp-guide','aria-hidden':'true',hidden:true});position(guide,spring);board.append(guide);
      action.append(el('label',{class:'rp-receiver'},el('span',{},'휴의 집음기',meter),slider,output),accept);
      tune(false);hintTarget=guide;
    }else if(phase===2&&!early){
      const line=el('canvas',{class:'rp-line',width:1000,height:562,'aria-hidden':'true'});
      board.append(line);board.classList.add('rp-trace');
      const pins=stream.map((pt,i)=>marker(pt,()=>visit(i)));
      const counter=el('strong',{}), finish=button('물길을 수첩에 보관',()=>{if(p.mapped===3)advance();},'sf-shutter');
      function update(){
        drawTrail(line,p.mapped);
        pins.forEach((pin,i)=>{pin.classList.toggle('rp-marked',i<p.mapped);pin.setAttribute('aria-pressed',String(i<p.mapped));});
        counter.textContent=p.mapped===3?'백성이 있는 곳부터 반석까지 이었어요.':(p.mapped+1)+' / 3 · '+stream[p.mapped].label+' 찾기';
        finish.disabled=p.mapped<3;hintTarget=pins[p.mapped]||finish;
      }
      function visit(i){
        if(i!==p.mapped){
          if(i>p.mapped)status.textContent='먼저 '+stream[p.mapped].label+'에서 이어 보세요.';
          return;
        }
        p.mapped++;save();play(i===2?'found':'ripple');update();progress();status.textContent=stream[i].label+'에 표식을 남겼어요.';
      }
      let tracing=null;
      function follow(e){
        const r=board.getBoundingClientRect(),pt=stream[p.mapped];
        if(!pt)return;
        const dx=e.clientX-r.left-pt.x*r.width/100,dy=e.clientY-r.top-pt.y*r.height/100;
        if(Math.hypot(dx,dy)<=Math.max(23,r.width*.045))visit(p.mapped);
      }
      board.addEventListener('pointerdown',e=>{
        if(!e.isPrimary||e.button!==0)return;
        tracing=e.pointerId;board.setPointerCapture(tracing);follow(e);
      });
      board.addEventListener('pointermove',e=>{if(e.pointerId===tracing)follow(e);});
      board.addEventListener('lostpointercapture',()=>{tracing=null;});
      action.append(counter,finish);update();
    }else if(viewOnly&&!complete){
      action.append(button('물길 답사 이어가기',()=>review(false),'sf-shutter'));
    }
    if(phase>=2&&!early)panel.append(button('반석의 물소리 듣기',()=>play('brook')));
    if(!complete){
      panel.append(status,askButton);
      if(phase===0)panel.append(button('백성이 겪은 일 · 출 17:3',()=>book('17:3'),'sf-verse'));
      if(phase===1)panel.append(button('모세가 부르짖은 때 · 출 17:4–5',()=>book('17:4'),'sf-verse'));
    }else{
      modeText=el('p',{class:'sf-direction'},stage.notes[s.mode]);
      panel.append(el('strong',{},stage.card+' 관찰 카드'),modeText,
        button('말씀 인장 · 출 '+stage.seal,()=>book(stage.seal),'sf-verse'),
        el('p',{class:'sf-saved'},'고정 선반 · '+stage.pin),
        button('시내산 본편으로',next,'sf-shutter'),button('시내산 수첩으로',journal),button('이 장소 다시 답사',restart));
      if(!early){
        const chart=el('canvas',{class:'rp-line',width:1000,height:562,'aria-hidden':'true'});
        board.append(chart);drawTrail(chart,3);
        const show=button('물길 선 숨기기',()=>{
          chart.hidden=!chart.hidden;show.setAttribute('aria-pressed',String(!chart.hidden));
          show.textContent=chart.hidden?'물길 선 보기':'물길 선 숨기기';
        });
        show.setAttribute('aria-pressed','true');action.append(show);
      }else action.remove();
    }
    card.append(reading(early?'17:1':phase===1?'17:5':'17:6'));
    root.append(card,el('div',{class:'sf-desk'},panel));
    return {root,head,onMode(){if(modeText)modeText.textContent=stage.notes[s.mode];},hint(level){
      hintText.hidden=!level;
      hintText.textContent=level?active.name+' · '+(viewOnly?'호렙 물길을 다시 펼쳐 봐.':['항아리 안을 들여다볼까?','물줄기가 바위에서 나오는 곳을 찾아봐.','그림에서 물을 뜨는 자리부터 거꾸로 따라가 봐.'][phase]):'';
      credit.classList.toggle('sf-pulse',level>=2);askButton.classList.toggle('sf-pulse',level>=2);
      board.querySelectorAll('.rp-highlight').forEach(n=>n.classList.remove('rp-highlight'));
      if(hintTarget){hintTarget.classList.toggle('rp-highlight',level>=3);if(hintTarget.classList.contains('rp-guide'))hintTarget.hidden=level<3;}
    }};
  }
  BO.rephidimField={mount};
})();
