/* 성경 탐험대 3D 샘플 — 떨기나무 장면 하나.
 * 주인공을 직접 움직여 탐험하고, 말씀 조각 3개를 모으고, 사건을 지켜본 뒤 관문을 지난다.
 * 대본은 2D 시범판과 같은 web/js/content.js(독립 검증을 거친 문장)를 그대로 쓴다.
 */
/* 역할별 파일은 함수를 먼저 등록한 뒤, 원래 game.js 순서로 초기화한다.
 * G는 모듈 사이에서 바뀌는 상태와 함수를 연결하는 비공개 객체다.
 * 모든 초기화가 끝난 뒤 화면과 프레임을 시작한다. */
(function () {
  'use strict';
  var G = {}, modules = BO3D.gameModules;
  var initialize = [
    modules.scene(G),
    modules.ui(G),
    modules.awe(G),
    modules.exploration(G),
    modules.travel(G),
    modules.jordan(G),
    modules.story(G),
    modules.controls(G),
    modules.loop(G),
    modules.debug(G)
  ];
  modules.save(G);
  initialize.forEach(function (init) { init(); });

  G.resize(); G.menu(); requestAnimationFrame(G.frame);
})();
