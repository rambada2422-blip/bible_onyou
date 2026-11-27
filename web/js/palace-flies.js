/* 개역성경 KorRV · Public Domain · scrollmapper/bible_databases 59b18c5af5845728c275d5b7178ad0d024172b1f */
(function () {
  'use strict';
  const app = BO.app2d, el = app.el;
  const verses = {
    "8:20": "여호와께서 모세에게 이르시되 아침에 일찍이 일어나 바로 앞에 서라 그가 물로 나오리니 그에게 이르기를 여호와의 말씀에 내 백성을 보내라 그들이 나를 섬길 것이니라",
    "8:21": "네가 만일 내 백성을 보내지 아니하면 내가 너와 네 신하와 네 백성을 보내지 아니하면 내가 너와 네 신하와 네 백성과 네 집들에 파리 떼를 보내리니 애굽 사람의 집집에 파리 떼가 가득할 것이며 그들의 거하는 땅에도 그러하리라",
    "8:22": "그 날에 내가 내 백성의 거하는 고센 땅을 구별하여 그곳에는 파리 떼가 없게 하리니 이로 말미암아 나는 세상 중의 여호와인 줄을 네가 알게 될 것이라",
    "8:23": "내가 내 백성과 네 백성 사이에 구별을 두리니 내일 이 표징이 있으리라 하셨다 하라 하시고",
    "8:24": "여호와께서 그와 같이 하시니 무수한 파리 떼가 바로의 궁에와 그 신하의 집에와 애굽 전국에 이르니 파리 떼로 인하여 땅이 해를 받더라",
    "8:25": "바로가 모세와 아론을 불러 이르되 너희는 가서 이 땅에서 너희 하나님께 희생을 드리라",
    "8:26": "모세가 가로되 그리함은 불가하니이다 우리가 우리 하나님 여호와께 희생을 드리는 것은 애굽 사람의 미워하는 바이온즉 우리가 만일 애굽 사람의 목전에서 희생을 드리면 그들이 그것을 미워하여 우리를 돌로 치지 아니하리이까",
    "8:27": "우리가 사흘길쯤 광야로 들어가서 우리 하나님 여호와께 희생을 드리되 우리에게 명하시는 대로 하려하나이다",
    "8:28": "바로가 가로되 내가 너희를 보내리니 너희가 너희 하나님 여호와께 광야에서 희생을 드릴 것이나 너무 멀리는 가지 말라 그런즉 너희는 나를 위하여 기도하라",
    "8:29": "모세가 가로되 내가 왕을 떠나 가서 여호와께 기도하리니 내일이면 파리 떼가 바로와 바로의 신하와 바로의 백성을 떠나려니와 바로는 이 백성을 보내어 여호와께 희생을 드리는 일에 다시 거짓을 행치 마소서 하고",
    "8:30": "모세가 바로를 떠나 나와서 여호와께 기도하니",
    "8:31": "여호와께서 모세의 말대로 하사 파리를 바로와 그 신하와 그 백성에게 몰수히 떠나게 하시니라",
    "8:32": "그러나 바로가 이 때에도 마음을 완강케 하여 백성을 보내지 아니하였더라"
  };
  const clues = BO.palaceWatchScenes[3].clues;
  const labels = {village:'고센의 마을',bowl:'그릇에 앉은 파리',house:clues[0].name,goshen:'고센의 밭',court:'파리 떼가 떠난 뜰',king:'바로의 거절'};
  const button = (text,click) => el('button',{type:'button',class:'pf-action',on:{click}},text);
  function photo(key,alt) {
    if(key==='goshen')return app.pic('plague-goshen','',alt);
    return el('img',{src:BO.palaceWatchImages?.[key] || 'assets/palace-watch/'+key+'.jpg',alt,draggable:'false'});
  }
  function pin(label,x,y,click) {
    return el('button',{type:'button',class:'pf-pin','aria-label':label,
      style:'left:clamp(23px,'+x+'%,calc(100% - 23px));top:clamp(23px,'+y+'%,calc(100% - 23px))',
      on:{click}},el('span',{'aria-hidden':'true'}));
  }
  function page(ref,close) {app.openFieldScroll('8:20–32',verses,ref,close);}

  function field(hero,slot,view,s,openBook,switchView,shutter,setMusic) {
    hero.dataset.fliesView=view;
    const marks=app.state.palace.fliesMarks ||= {};
    const title=el('b',{class:'pf-place'});
    const feedback=el('p',{class:'pf-feedback',role:'status'});
    const tools=el('div',{class:'pf-tools'},title);
    slot.replaceChildren(tools);
    function mark(key){marks[key]=true;app.save();}
    let music=null;
    if(view==='compare'){
      title.textContent='휴의 관찰창 · 두 곳 나란히 보기';
      const house=photo('covered','애굽 집에서 가족이 식탁 위 음식을 천으로 덮고 파리를 쫓는다');
      const goshen=photo('goshen','고센의 초록 밭과 물길, 마을');
      house.classList.add('flies-house');
      goshen.classList.add('flies-goshen');
      const seam=el('span',{class:'flies-seam','aria-hidden':'true'});
      const slider=el('input',{type:'range',min:0,max:100,step:1,class:'flies-slider','aria-label':'애굽 집과 고센 밭 비교'});
      const message=el('p',{class:'pf-feedback'});
      const houseJump=button('애굽 집',()=>change(0,true));
      const goshenJump=button('고센 밭',()=>change(100,true));
      const controls=el('div',{class:'flies-controls'},houseJump,slider,goshenJump);
      const count=()=>Number(!!marks.house)+Number(!!marks.goshen);
      const here=key=>{
        mark(key);shutter();
        feedback.textContent=(key==='house' ? clues[0].note : '고센에서는 파리 떼가 보이지 않아요.')+' · 관찰 '+count()+'/2';
        change(Number(slider.value),false);
      };
      const leftPin=pin(labels.house,clues[0].x,clues[0].y,()=>here('house'));
      const rightPin=pin(labels.goshen,30,57,()=>here('goshen'));
      const houseLabel=el('span',{class:'flies-caption house'},'애굽 집');
      const fieldLabel=el('span',{class:'flies-caption goshen'},'고센 밭');
      const strip=el('div',{class:'flies-strip'},house,goshen,seam,houseLabel,fieldLabel);
      hero.replaceChildren(strip,leftPin,rightPin);
      let drag,activePointer;
      strip.addEventListener('pointerdown',event=>{
        if(!event.isPrimary || event.button!==0)return;
        drag={x:event.clientX,value:Number(slider.value)};activePointer=event.pointerId;
        strip.setPointerCapture(event.pointerId);
      });
      strip.addEventListener('pointermove',event=>{
        if(!drag || event.pointerId!==activePointer)return;
        const travel=(drag.x-event.clientX)*100/strip.clientWidth;
        change(Math.round(Math.max(0,Math.min(100,drag.value+travel))),true);
      });
      strip.addEventListener('lostpointercapture',()=>{drag=null;});
      function change(value,save) {
        slider.value=value;
        const place=value>=50?'goshen':'house';
        const cue='palace-flies-'+place;
        hero.style.setProperty('--field-reveal',value+'%');
        slider.setAttribute('aria-valuetext',value===0?'애굽 집 전체':value===100?'고센 밭 전체':'두 곳 비교 · 고센 '+value+'%');
        leftPin.hidden=value!==0;rightPin.hidden=value!==100;
        houseLabel.hidden=value>76;fieldLabel.hidden=value<24;
        message.textContent=count()===2?'두 곳의 기록이 모였어요. 왕궁에서 바로와 모세가 나눈 말을 들어 보세요.':
          '사진이나 손잡이를 밀어 보세요. 한 곳을 크게 보면 기록할 고리가 나타나요.';
        houseJump.setAttribute('aria-pressed',String(value===0));goshenJump.setAttribute('aria-pressed',String(value===100));
        leftPin.setAttribute('aria-pressed',String(!!marks.house));rightPin.setAttribute('aria-pressed',String(!!marks.goshen));
        if(save){
          if(s.fliesDial!==value){s.fliesDial=value;app.save();}
          feedback.textContent=(place==='house'?'애굽 집이 보입니다.':'고센 밭이 보입니다.')+' · 관찰 '+count()+'/2';
        }
        if(cue!==music){music=cue;setMusic(cue);}
      }
      slider.addEventListener('input',()=>change(Number(slider.value),true));
      const old=Number.isInteger(s.fliesDial) ? Math.min(100,Math.max(0,s.fliesDial)) : 0;
      change(old,false);
      feedback.textContent='관찰 '+count()+'/2';
      tools.append(controls,message);
    }else if(view==='village'||view==='bowl'){
      const village=view==='village';
      title.textContent=village?'경고에 나오는 땅 · 고센':'가족의 식탁 · 그릇 가장자리';
      hero.replaceChildren(village?photo('goshen','밭과 물길 너머 집들이 모인 고센'):photo('flies-bowl','그릇 가장자리에 파리 한 마리가 앉아 있다'));
      const ref=village?'8:22':'8:24';
      hero.append(pin(labels[view],village?79:55.5,village?48:44.5,()=>{mark(view);openBook(ref);}));
      feedback.textContent=village?'『탐험대 이야기』 최온과 마을을 짚어 보세요. 고센에 관해 어떤 말씀이 있었을까요?':
        '최온과 그릇 가장자리를 살펴본 뒤, 영상을 열어 가족에게 어떤 일이 생겼는지 보세요.';
      music=village?'palace-flies-goshen':null;
    }else if(view==='audience'||view==='brothers'){
      const royal=view==='audience';
      title.textContent=royal?'왕궁 · 바로의 말':'왕궁 · 모세의 대답';
      hero.replaceChildren(photo(royal?'throne':'audience',royal?'왕좌에 앉은 바로':'왕궁에서 바로 앞에 선 모세와 아론'));
      const ref=royal?'8:25':'8:27';
      tools.append(button('온우의 말씀 기록 · 출 '+ref,()=>openBook(ref)));
      music='palace-court';
    }else{
      const king=view==='king';
      title.textContent=king?'파리가 떠난 뒤 · 바로':'파리가 떠난 뒤 · 왕궁 뜰';
      hero.replaceChildren(photo(king?'refusal':'court',king?'왕궁에서 거절하는 바로':'파리 떼가 사라진 왕궁 뜰'));
      const tabs=el('div',{class:'frog-records',role:'group','aria-label':'온우의 마지막 관찰'});
      for(const [dest,label] of [['court','왕궁 뜰 보기'],['king','바로 보기']]){
        const tab=button(label,()=>{
          s.fliesEnd=dest;app.save();switchView(dest);
          slot.querySelector('[aria-pressed="true"]').focus({preventScroll:true});
        });
        tab.setAttribute('aria-pressed',String(dest===view));tabs.append(tab);
      }
      const ref=king?'8:32':'8:31';
      tools.append(tabs,button(labels[view]+' · 출 '+ref,()=>{mark(view);openBook(ref);}));
      feedback.textContent=king?'온우와 32절에서 바로의 결정을 확인하세요.':'온우와 31절을 펼쳐 뜰에서 무엇이 사라졌는지 확인하세요.';
      music=king?null:'palace-frogs-yard';
    }
    if(feedback.textContent)tools.append(feedback);
    return music;
  }
  function journal(openBook){
    const marks=app.state.palace.fliesMarks;
    if(!marks || !Object.keys(marks).length)return null;
    const entry=el('section',{class:'pf-entry'},el('h3',{},'파리 떼 · 애굽과 고센'),el('p',{},'『탐험대 이야기』 관찰 기록'),
      el('ul',{},Object.entries(labels).filter(([key])=>marks[key]).map(([,label])=>el('li',{},label))));
    if(marks.court && marks.king)entry.append(button('말씀 인장 · 출 8:31–32',()=>openBook('8:32')));
    return entry;
  }
  app.palaceFlies={verses,page,field,journal};
})();
