/* 셋째 재앙. KorRV 출 8:16–19 · Public Domain · scrollmapper/bible_databases 59b18c5af5845728c275d5b7178ad0d024172b1f */
(function () {
  'use strict';
  const app = BO.app2d, el = app.el;
  const verses = {
    "8:16": "여호와께서 모세에게 이르시되 아론에게 명하기를 네 지팡이를 들어 땅의 티끌을 치라 하라 그것이 애굽 온 땅에서 이가 되리라",
    "8:17": "그들이 그대로 행할새 아론이 지팡이를 잡고 손을 들어 땅의 티끌을 치매 애굽 온 땅의 티끌이 다 이가 되어 사람과 생축에게 오르니",
    "8:18": "술객들이 자기 술법으로 이같이 행하여 이를 내려 하였으나 못 하였고 이는 사람과 생축에게 있은지라",
    "8:19": "술객이 바로에게 고하되 이는 하나님의 권능이니이다 하나 바로의 마음이 강퍅케 되어 그들을 듣지 아니하였으니 여호와의 말씀과 같더라"
  };
  const clues = BO.palaceWatchScenes[2].clues;
  const views = {
    ground: ['dust-ground','땅의 티끌','지팡이 끝이 닿은 흙바닥',null],
    pen: ['shepherd','목자의 우리','왼쪽에서 목자가 어깨를 긁고 오른쪽에서 염소가 기둥에 몸을 비빈다','palace-dust-pen'],
    court: ['magicians','바로 앞의 요술사들','왕좌 앞에서 손을 펼쳐 말하는 요술사들','palace-court'],
    king: ['dust-king','말을 들은 바로','요술사의 말을 듣고 왕좌에 앉아 있는 바로',null]
  };
  const image = key => BO.palaceWatchImages?.[key] || 'assets/palace-watch/'+key+'.jpg';
  const button = (label,action) => el('button',{type:'button',class:'pf-action',on:{click:action}},label);
  function page(ref,close) { app.openFieldScroll('8:16–19',verses,ref,close); }
  function field(hero,slot,view,s,openBook,switchView,shutter) {
    const [key,title,alt,music] = views[view];
    const marks = app.state.palace.dustMarks ||= {};
    const feedback = el('p',{class:'pf-feedback',role:'status'});
    const tools = el('div',{class:'pf-tools'},el('b',{class:'pf-place'},title));
    hero.dataset.dustView = view;
    hero.replaceChildren(el('img',{src:image(key),alt,draggable:'false'}));
    function pin(label,x,y,action) {
      const control=el('button',{type:'button',class:'pf-pin','aria-label':label,
        style:'left:clamp(23px,'+x+'%,calc(100% - 23px));top:clamp(23px,'+y+'%,calc(100% - 23px))',
        on:{click:action}},el('span',{'aria-hidden':'true'}));
      hero.append(control);
      return control;
    }
    function remember(name) { marks[name]=true; app.save(); }
    if(view==='ground') {
      feedback.textContent='『탐험대 이야기』 최온과 지팡이 끝의 흙을 짚어 보세요.';
      pin('지팡이 끝의 티끌 살펴보기',28,85,()=>{remember('ground');openBook('8:16');});
    } else if(view==='pen') {
      const names=['shepherd','goat'];
      const prints=el('div',{class:'dust-prints','aria-label':'휴의 관찰 사진첩'});
      function develop() {
        prints.replaceChildren(...clues.map((clue,i)=>{
          const name=names[i], found=!!marks[name];
          const frame=el('figure',{class:'dust-print'});
          if(found)frame.append(el('img',{src:image(key),alt:'',style:'object-position:'+clue.x+'% '+clue.y+'%'}));
          frame.append(el('figcaption',{},found?clue.name:['목자 찾기','염소 찾기'][i]));
          return frame;
        }));
        pins.forEach((p,i)=>p.setAttribute('aria-pressed',String(!!marks[names[i]])));
        const last=names.indexOf(s.dustLast);
        const instruction=last<0 ? '휴의 사진첩이 비었어요. 목자의 어깨와 염소가 닿은 기둥을 찍어 보세요.' : clues[last].note;
        const count=names.filter(n=>marks[n]).length;
        feedback.textContent=instruction+' · 사진 '+count+'/2'+(count===2?' · 이제 왕궁에서 요술사들의 말을 들어 보세요.':'');
      }
      const pins=clues.map((clue,i)=>pin(clue.name,clue.x,clue.y,()=>{
        s.dustLast=names[i];remember(names[i]);shutter();develop();
      }));
      tools.append(prints);develop();
    } else {
      const king=view==='king';
      feedback.textContent=king ? '온우와 19절에서 바로가 그 말을 듣고 어떻게 했는지 확인해 보세요.' :
        '온우와 18절에서 요술사들이 시도한 일을 읽고, 바로 쪽으로 시선을 옮겨 보세요.';
      const tabs=el('div',{class:'frog-records',role:'group','aria-label':'온우의 왕궁 기록'});
      for(const [dest,label] of [['court','요술사들 보기'],['king','바로 돌아보기']]){
        const tab=button(label,()=>{
          s.dustCourt=dest;app.save();switchView(dest);
          slot.querySelector('[aria-pressed="true"]').focus({preventScroll:true});
        });
        tab.setAttribute('aria-pressed',String(dest===view));tabs.append(tab);
      }
      const ref=king?'8:19':'8:18';
      tools.append(tabs,button((king?'바로의 반응':'요술사들이 한 일')+' · 출 '+ref,()=>{remember(view);openBook(ref);}));
    }
    tools.append(feedback);slot.replaceChildren(tools);
    return music;
  }
  function journal(openBook) {
    const marks=app.state.palace.dustMarks;
    if(!marks || !Object.keys(marks).length)return null;
    const labels={ground:'지팡이 끝의 티끌',shepherd:clues[0].name,goat:clues[1].name,court:'요술사들이 한 일',king:'바로의 반응'};
    const entry=el('section',{class:'pf-entry'},el('h3',{},'목자의 우리에서 왕궁까지'),
      el('p',{},'『탐험대 이야기』 관찰 기록'),el('ul',{},Object.entries(labels).filter(([key])=>marks[key]).map(([,label])=>el('li',{},label))));
    if(marks.court && marks.king)entry.append(button('말씀 인장 · 출 8:18–19',()=>openBook('8:19')));
    return entry;
  }
  app.palaceDust={verses,page,field,journal};
})();
