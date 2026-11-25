/* 8~10세 진행 순서. 입력은 감수가 끝나 이용할 수 있는 회차 번호의 목록이다. */
(function () {
  'use strict';
  const guardianOnly = Object.freeze([46, 50, 51, 52]);

  function readingOrder(reviewedEpisodes, guardianChoices = []) {
    const selected = new Set(guardianChoices);
    return reviewedEpisodes.filter(number => !guardianOnly.includes(number) || selected.has(number));
  }

  const policy = Object.freeze({ guardianOnly, readingOrder });
  if (typeof module === 'object' && module.exports) module.exports = policy;
  else window.genesisYoungReaders = policy;
})();
