/* 호렙의 목축 풍경과 말씀 장면. 2D와 3D에서 대표가 선택한 두 정지 그림을 공유한다. */
(function () {
  'use strict';
  const app = BO.app2d, el = app.el;
  function scroll(ref, onClose) {
    app.openFieldScroll('3:1–12', BO.horebVerses, ref, onClose);
  }
  function create(screen, stage) {
    const score = BO.sceneMusic.create();
    const canPlay = !score.button.hidden;
    const photo = el('img', {draggable:'false'});
    const inspect = el('button', {class:'horeb-picture', type:'button', hidden:true,
      'aria-label':'관찰 그림 크게 보기', on:{click: enlarge}}, el('span',{class:'horeb-print'},photo), el('span', {class:'horeb-expand-label'}, '크게 보기'));
    stage.querySelector('.hud').append(score.button);
    for (const event of ['pointerdown', 'keydown', 'click']) screen.addEventListener(event, score.gesture, true);
    let audible = false, reading = false, bookOpen = false, closed = false;
    score.button.title = '호렙의 음악과 불 소리';
    function quiet() { score.setPaused(!audible || bookOpen || reading); }
    function render(step) {
      const inPasture = step.k === 'arrive' || step.k === 'beat' && step.i === 0;
      const atBush = step.k === 'beat' && step.i === 1;
      audible = inPasture || atBush;
      score.button.hidden = !canPlay || !audible;
      if (audible) score.setCue(inPasture ? 'horeb-flock' : 'horeb-embers', .12);
      quiet();
      stage.classList.toggle('horeb-pasture', step.k === 'arrive');
      const witness = step.k === 'beat' && step.i >= 1;
      stage.classList.toggle('horeb-witness', witness);
      inspect.hidden = !witness;
      if (!witness) { inspect.remove(); return; }
      if (!inspect.isConnected) stage.append(inspect);
      inspect.classList.toggle('horeb-near', step.i === 1);
      const key = step.i < 4 ? 'standing' : 'covered';
      if (photo.dataset.view !== key) {
        photo.dataset.view = key;
        photo.alt = key === 'standing' ? '푸른 잎 사이에 불이 붙은 떨기나무와 오른쪽에 서 있는 모세' :
          '같은 떨기나무 앞에서 얼굴을 팔로 가린 모세';
        photo.src = BO.horebImages?.[key] || 'assets/horeb/' + key + '.jpg';
      }
    }
    function enlarge() {
      const closeButton = el('button', {type:'button',on:{click:()=>dialog.close()}}, '그림 닫기');
      const dialog = el('dialog', {class:'horeb-enlarged','aria-label':'호렙 관찰 그림'},
        closeButton, el('img', {src:photo.src,alt:photo.alt}));
      document.body.append(dialog);
      dialog.showModal();
      dialog.addEventListener('close', () => { dialog.remove(); if (inspect.isConnected) inspect.focus(); }, {once:true});
    }
    function openBook(ref) {
      bookOpen = true;
      quiet();
      app.stopReading();
      scroll(ref, () => { bookOpen = false; if (!closed) quiet(); });
    }
    function setReading(value) { reading = value; if (!closed) quiet(); }
    function close() {
      closed = true;
      score.close();
      for (const event of ['pointerdown', 'keydown', 'click']) screen.removeEventListener(event, score.gesture, true);
    }
    return {render, openBook, setReading, close};
  }
  BO.horebField = {create, scroll};
})();
