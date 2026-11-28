/* 개역성경 KorRV · Public Domain · scrollmapper/bible_databases 59b18c5af5845728c275d5b7178ad0d024172b1f */
(function () {
  'use strict';
  const app = BO.app2d, el = app.el;
  const verses = {
    "9:8": "여호와께서 모세와 아론에게 이르시되 너희는 풀무의 재 두 움큼을 가지고 모세가 바로의 목전에서 하늘을 향하여 날리라",
    "9:9": "그 재가 애굽 온 땅의 티끌이 되어 애굽 온 땅의 사람과 짐승에게 붙어서 독종이 발하리라",
    "9:10": "그들이 풀무의 재를 가지고 바로 앞에 서서 모세가 하늘을 향하여 날리니 사람과 짐승에게 붙어 독종이 발하고",
    "9:11": "술객도 독종으로 인하여 모세 앞에 서지 못하니 독종이 술객들로부터 애굽 모든 사람에게 발하였음이라",
    "9:12": "그러나 여호와께서 바로의 마음을 강퍅케 하셨으므로 그들을 듣지 아니하였으니 여호와께서 모세에게 말씀하심과 같더라"
  };
  const [arm, tool] = BO.palaceWatchScenes[5].clues;
  const frames = [
    {image:'kiln-ash', name:'화덕의 재', alt:'모아 쥔 두 손에 잿가루가 담겨 있다', cue:'palace-kiln-ash',
      prompt:'최온과 손 안에 담긴 것을 짚어 보세요.',
      spots:[{key:'ash', label:'손 안의 잿가루', x:56, y:52, note:'손에 담긴 재를 기록했어요.'}]},
    {image:'workshop', name:'멈춘 작업장', alt:'작업자들이 손을 멈췄고 앞쪽 작업대에 연장이 놓여 있다', cue:'palace-kiln-workshop',
      prompt:'일하던 손과 작업대에 남은 연장을 찾아보세요.',
      spots:[{key:'arm',label:arm.name,x:60,y:51,note:arm.note},{key:'tool',label:tool.name,x:89,y:85,note:tool.note}]},
    {image:'kiln-beast', name:'가축 곁', alt:'가축의 옆구리와 곁에 있는 사람의 팔이 보인다', cue:null,
      prompt:'가축의 옆구리를 짚어 작업장에서 본 흔적과 비교해 보세요.',
      spots:[{key:'beast',label:'가축의 옆구리',x:17,y:71,note:'가축의 옆구리에 난 자국을 기록했어요.'}]}
  ];
  const records = [
    ...frames.flatMap(frame=>frame.spots.map(spot=>[spot.key,spot.label])),
    ['witness','모세 앞에 서지 못한 술객들'],['king','바로가 듣지 않은 말씀']
  ];
  function page(ref,close) { app.openFieldScroll('9:8–12',verses,ref,close); }
  function picture(key,alt) {
    return el('img',{src:BO.palaceWatchImages?.[key] || 'assets/palace-watch/'+key+'.jpg',alt,draggable:'false'});
  }
  function button(label,click) { return el('button',{type:'button',class:'pf-action',on:{click}},label); }
  function pin(label,x,y,click) {
    return el('button',{type:'button',class:'pf-pin','aria-label':label,
      style:'left:clamp(24px,'+x+'%,calc(100% - 24px));top:clamp(24px,'+y+'%,calc(100% - 24px))',
      on:{click}},el('span',{'aria-hidden':'true'}));
  }
  function field(hero,slot,view,s,openBook,switchView,shutter,setMusic) {
    const marks=app.state.palace.kilnMarks ||= {};
    const title=el('b',{class:'pf-place'}), feedback=el('p',{class:'pf-feedback',role:'status'});
    const tools=el('div',{class:'pf-tools'},title);
    hero.dataset.kilnView=view;
    slot.replaceChildren(tools);
    function mark(key) { marks[key]=true;app.save(); }
    if(view==='ash'){
      const frame=frames[0], spot=frame.spots[0];
      hero.replaceChildren(picture(frame.image,frame.alt),pin('두 손의 재 살펴보기',spot.x,spot.y,()=>{
        mark('ash');openBook('9:8');
      }));
      title.textContent='최온의 발견 · 두 손에 든 것';
      feedback.textContent='『탐험대 이야기』 재를 짚어 8절을 펼쳐 보세요. 그다음에 무슨 일이 생길까요?';
      tools.append(feedback);
      return null;
    }
    if(view==='reel'){
      let index=Number.isInteger(s.kilnFrame) && frames[s.kilnFrame] ? s.kilnFrame : 0;
      const slider=el('input',{type:'range',min:0,max:frames.length-1,step:1,value:index,'aria-label':'휴의 기록 필름 감기'});
      const previous=button('이전 사진',()=>wind(index-1));
      const next=button('다음 사진',()=>wind(index+1));
      next.dataset.windForward='';
      const controls=el('div',{class:'kiln-reel'},previous,slider,next);
      const count=el('span',{class:'kiln-counter'});
      tools.append(controls,feedback);
      function drawFrame(){
        const frame=frames[index];
        title.textContent='휴의 기록 필름 · '+frame.name;
        slider.value=index;
        slider.setAttribute('aria-valuetext',(index+1)+' / '+frames.length+' · '+frame.name);
        previous.disabled=index===0;next.disabled=index===frames.length-1;
        hero.dataset.kilnFrame=index;
        function updateCount(){
          count.textContent='현장 기록 '+frames.flatMap(f=>f.spots).filter(spot=>marks[spot.key]).length+'/4';
        }
        updateCount();
        hero.replaceChildren(picture(frame.image,frame.alt),count);
        for(const spot of frame.spots){
          const target=pin(spot.label,spot.x,spot.y,()=>{
            mark(spot.key);shutter();target.setAttribute('aria-pressed','true');updateCount();
            feedback.textContent=spot.note+' · '+count.textContent;
          });
          target.setAttribute('aria-pressed',String(!!marks[spot.key]));hero.append(target);
        }
        feedback.textContent=frame.prompt;
      }
      function wind(to){
        if(!frames[to] || index===to)return;
        index=to;s.kilnFrame=index;app.save();drawFrame();setMusic(frames[index].cue);
      }
      slider.addEventListener('input',()=>wind(Number(slider.value)));
      drawFrame();
      return frames[index].cue;
    }
    const king=view==='king';
    const ref=king?'9:12':'9:11';
    title.textContent=king?'왕궁 · 바로의 반응':'왕궁 · 술객들이 있던 자리';
    hero.replaceChildren(picture('kiln-court','계단에 몸을 굽힌 두 사람과 왕좌에 앉은 바로'));
    const tabs=el('div',{class:'cattle-tabs',role:'group','aria-label':'온우의 왕궁 기록'});
    for(const [dest,label] of [['witness','술객들의 자리'],['king','바로의 반응']]){
      const tab=button(label,()=>{
        s.kilnCourt=dest;app.save();switchView(dest);
        slot.querySelector('[aria-pressed="true"]').focus({preventScroll:true});
      });
      tab.setAttribute('aria-pressed',String(dest===view));tabs.append(tab);
    }
    tools.append(tabs,button((king?'바로의 기록':'술객들의 기록')+' · 출 '+ref,()=>{mark(view);openBook(ref);}));
    feedback.textContent=king?'온우와 12절을 읽고 바로가 누구의 말을 듣지 않았는지 확인해 보세요.':
      '온우와 11절을 펼쳐 술객들이 모세 앞에 서지 못한 까닭을 찾아보세요.';
    tools.append(feedback);
    return king?null:'palace-court';
  }
  function journal(openBook) {
    const marks=app.state.palace.kilnMarks;
    if(!marks || !Object.keys(marks).length)return null;
    const entry=el('section',{class:'pf-entry'},el('h3',{},'화덕에서 왕궁까지'),
      el('p',{},'『탐험대 이야기』 관찰 기록'),
      el('ul',{},records.filter(([key])=>marks[key]).map(([,label])=>el('li',{},label))));
    if(marks.witness && marks.king)entry.append(button('말씀 인장 · 출 9:11–12',()=>openBook('9:12')));
    return entry;
  }
  app.palaceKiln={verses,page,field,journal};
})();
