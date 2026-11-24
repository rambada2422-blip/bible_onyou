/* 배경음악 전용. 효과음·낭독 음량과 분리하고 첫 플레이 조작에서 오디오를 연다. */
(function () {
  'use strict';
  const normal=.43, soft=.085, preference='bo_scene_music_v1';
  function create(){
    let enabled=true;
    try{enabled=localStorage.getItem(preference)!=='off';}catch(_){}
    const Audio=window.AudioContext||window.webkitAudioContext;
    const button=BO.app2d.el('button',{type:'button',class:'rs-link rs-music'});
    button.hidden=!Audio;
    const buffers=new Map(),voices=new Set();
    let ctx,bus,current,pending=null,cue=null,active=false,blurred=false,closed=false,failed=false,version=0,attack=.42;
    function label(){
      button.textContent=!enabled?'음악 켜기':failed?'음악 다시 듣기':current||pending?'음악 끄기':'음악 듣기';
    }
    function stop(voice,fade){
      const now=ctx.currentTime;
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setTargetAtTime(0,now,fade?.09:.001);
      try{voice.source.stop(now+(fade?.42:0));}catch(_){}
    }
    function pause(){
      version++;pending=null;current=null;
      for(const voice of voices)stop(voice,false);
      if(ctx && ctx.state!=='closed')ctx.suspend().catch(()=>{});
      label();
    }
    function buffer(key){
      if(!buffers.has(key)){
        const url=BO.sceneAudio?.[key] || 'assets/audio/score/'+key+'.mp3';
        const task=fetch(url).then(r=>{
          if(!r.ok)throw new Error('music '+r.status);
          return r.arrayBuffer();
        }).then(data=>ctx.decodeAudioData(data)).catch(error=>{buffers.delete(key);throw error;});
        buffers.set(key,task);
      }
      return buffers.get(key);
    }
    async function play(){
      if(!Audio||closed||failed||!active||!enabled||blurred||document.hidden||!cue||pending===cue)return;
      if(current?.key===cue&&!pending)return;
      const key=cue,request=++version;
      pending=key;label();
      try{
        if(!ctx){
          ctx=new Audio();
          bus=ctx.createGain();bus.gain.value=normal;bus.connect(ctx.destination);
        }
        // resume는 클릭 또는 키보드 이벤트 안에서 먼저 호출해야 한다.
        const [,audioBuffer]=await Promise.all([ctx.resume(),buffer(key)]);
        if(request!==version)return;
        const source=ctx.createBufferSource(),gain=ctx.createGain(),now=ctx.currentTime;
        const voice={source,gain,key};
        source.buffer=audioBuffer;source.loop=true;
        source.connect(gain);gain.connect(bus);
        gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(1,now+attack);
        source.onended=()=>{voices.delete(voice);source.disconnect();gain.disconnect();};
        source.start();voices.add(voice);
        if(current)stop(current,true);
        current=voice;
      }catch(_){
        if(request===version){pause();failed=true;}
      }finally{
        if(request===version)pending=null;
        label();
      }
    }
    function setCue(key,fadeIn=.42){
      if(cue===key)return;
      cue=key;attack=fadeIn;failed=false;
      if(current?.key===key && pending){version++;pending=null;label();return;}
      play();
    }
    function gesture(event){
      if(closed||button.contains(event.target)||!enabled)return;
      active=true;blurred=false;play();
    }
    function toggle(){
      enabled=!(enabled&&!failed&&(current||pending));
      try{localStorage.setItem(preference,enabled?'on':'off');}catch(_){}
      failed=false;active=true;blurred=false;
      if(enabled)play();else pause();
      label();
    }
    function duck(){
      if(!bus||!enabled||closed)return;
      const t=ctx.currentTime,level=bus.gain;
      level.cancelScheduledValues(t);
      level.setTargetAtTime(soft,t,.025);
      level.setTargetAtTime(normal,t+.80,.22);
    }
    function hide(){blurred=true;pause();}
    function show(){blurred=false;play();}
    function visibility(){if(document.hidden)hide();else show();}
    function close(){
      closed=true;pause();
      window.removeEventListener('pagehide',hide);window.removeEventListener('pageshow',show);
      window.removeEventListener('blur',hide);window.removeEventListener('focus',show);
      document.removeEventListener('visibilitychange',visibility);
      if(ctx)ctx.close().catch(()=>{});
      buffers.clear();
    }
    button.addEventListener('click',toggle);label();
    window.addEventListener('pagehide',hide);window.addEventListener('pageshow',show);
    window.addEventListener('blur',hide);window.addEventListener('focus',show);
    document.addEventListener('visibilitychange',visibility);
    return {button,gesture,setCue,duck,close};
  }
  BO.sceneMusic={create};
})();
