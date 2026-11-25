/* 같은 초상화의 입 모양과 탐험대 장비 소리. 원문을 읽는 동안에는 조용히 둔다. */
(function () {
  'use strict';
  const faces = new Map();
  function portrait(actor, expression) {
    const key=actor+'-'+expression;
    if (!faces.has(key)) {
      const xml=BO.art[actor+'-avatar'];
      if(!xml) return BO.app2d.pic(actor+'-avatar','','');
      const svg=new DOMParser().parseFromString(xml,'image/svg+xml');
      const mouth=svg.querySelector('path[stroke="#B8574B"],path[fill="#B8574B"]');
      if(mouth){
        if(mouth.nextElementSibling?.getAttribute('fill')==='#EE8E7E') mouth.nextElementSibling.remove();
        mouth.setAttribute('d', ({neutral:'M-6 28Q0 30 6 28',surprised:'M-4 28a4 5 0 1 0 8 0a4 5 0 1 0-8 0',smile:'M-9 25Q0 31 9 24Q6 40-3 35Q-7 33-9 25'})[expression]);
        mouth.setAttribute('stroke','#B8574B');mouth.setAttribute('stroke-width','2');
        mouth.style.fill=expression==='neutral'?'none':'#B8574B';
      }
      faces.set(key,'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(svg)));
    }
    return BO.app2d.el('img',{src:faces.get(key),alt:''});
  }
  function audio() {
    let ctx, bed;
    function stopBed(){if(bed){bed.stop();bed.disconnect();bed=null;}}
    function stop(){stopBed();if(ctx){ctx.close().catch(()=>{});ctx=null;}}
    function play(key,place){
      const Type=window.AudioContext||window.webkitAudioContext;
      if(!Type)return;
      try {
        if(!ctx)ctx=new Type();
        if(ctx.state==='suspended')ctx.resume().catch(()=>{});
        const t=ctx.currentTime;
        if(!bed){
          const buffer=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate), samples=buffer.getChannelData(0);
          let last=0;
          for(let i=0;i<samples.length;i++){last=.93*last+.07*(Math.random()*2-1);samples[i]=last;}
          bed=ctx.createBufferSource();bed.buffer=buffer;bed.loop=true;
          const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=place==='rock'||place==='elim'?1700:640;
          const volume=ctx.createGain();volume.gain.value=.035;
          bed.connect(filter);filter.connect(volume);volume.connect(ctx.destination);bed.start();
        }
        if(key==='shutter'){
          const sample=ctx.createBuffer(1,Math.round(ctx.sampleRate*.13),ctx.sampleRate);
          const wave=sample.getChannelData(0);
          for(let i=0;i<wave.length;i++){
            const t=i/ctx.sampleRate;
            const close=t>.055?Math.exp(-100*(t-.055)):0;
            wave[i]=(Math.random()*2-1)*(.17*Math.exp(-145*t)+.1*close);
          }
          const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter();
          filter.type='bandpass';filter.frequency.value=1550;
          src.buffer=sample;src.connect(filter);filter.connect(ctx.destination);
          src.onended=()=>{src.disconnect();filter.disconnect();};src.start();return;
        }
        if(key==='ripple'||key==='leaves'){
          const water=key==='ripple';
          const sample=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.42),ctx.sampleRate);
          const wave=sample.getChannelData(0);
          // 짧은 물방울 두 번과 잎을 스치는 소리.
          const drop=(at,pitch)=>at<0?0:Math.sin(2*Math.PI*(pitch*at+220*at*at))*Math.exp(-26*at);
          for(let i=0;i<wave.length;i++){
            const time=i/ctx.sampleRate;
            wave[i]=water?.13*(drop(time,730)+.7*drop(time-.12,930)):
              (Math.random()-.5)*.12*Math.sin(Math.PI*i/wave.length)**2;
          }
          const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter();
          filter.type=water?'lowpass':'bandpass';filter.frequency.value=water?2300:3100;
          src.buffer=sample;src.connect(filter);filter.connect(ctx.destination);
          src.onended=()=>{src.disconnect();filter.disconnect();};src.start();return;
        }
        if(key==='scoop'||key==='cup'){
          // 곡식을 쓸어 담을 때의 짧은 마찰과 빈 되 가장자리의 두드림.
          const brush=key==='scoop',length=brush?.34:.19;
          const buffer=ctx.createBuffer(1,Math.ceil(length*ctx.sampleRate),ctx.sampleRate);
          const samples=buffer.getChannelData(0);
          for(let n=0;n<samples.length;n++){
            const u=n/ctx.sampleRate;
            samples[n]=brush?(Math.random()*2-1)*.17*Math.sin(Math.PI*u/length)**2*(.6+.4*Math.cos(u*128)):
              .10*(Math.sin(2*Math.PI*610*u)+.4*Math.sin(2*Math.PI*1010*u))*Math.exp(-33*u)*Math.min(u/.003,1);
          }
          const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter();
          filter.type=brush?'bandpass':'lowpass';filter.frequency.value=brush?1750:2600;
          src.buffer=buffer;src.connect(filter);filter.connect(ctx.destination);
          src.onended=()=>{src.disconnect();filter.disconnect();};src.start();return;
        }
        const notes=BO.wildField.sounds;
        (notes[key]||notes.tap).forEach((f,i)=>{
          const osc=ctx.createOscillator(),gain=ctx.createGain();
          const begin=t+i*.085, duration=key==='talk'?.035:.095;
          osc.type=key==='wood'||key==='stone'?'triangle':'sine';
          osc.frequency.setValueAtTime(f,begin);osc.frequency.exponentialRampToValueAtTime(f*.74,begin+duration);
          gain.gain.setValueAtTime(.001,begin);gain.gain.exponentialRampToValueAtTime(.075,begin+.006);gain.gain.exponentialRampToValueAtTime(.001,begin+duration);
          osc.connect(gain);gain.connect(ctx.destination);osc.start(begin);osc.stop(begin+duration+.01);
        });
      }catch(_){stop();}
    }
    return {play,stop};
  }
  BO.wildFeel={portrait,audio};
})();
