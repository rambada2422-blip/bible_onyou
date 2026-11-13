/* 화면 UI용 작은 그림. 8~10세 단계의 그림 고르기 보기와 버튼 아이콘에 쓴다. */
window.BO = window.BO || {};
(function () {
  var S = function (body) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true">' + body + '</svg>';
  };
  var flame = function (x, y, s, c1, c2) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<path d="M0-22C8-12 13-6 11 4 10 11 5 15 0 15S-10 11-11 4C-13-5-6-8-4-15-2-11 0-10 0-22Z" fill="' + c1 + '"/>' +
      '<path d="M0-6C4-1 6 2 5 7 4 11 2 12 0 12S-4 11-5 7C-6 2-2 0 0-6Z" fill="' + c2 + '"/></g>';
  };
  BO.icons = {
    brick: S('<rect x="6" y="38" width="24" height="12" rx="2" fill="#B9763F"/><rect x="33" y="38" width="24" height="12" rx="2" fill="#A7663A"/>' +
      '<rect x="19" y="24" width="24" height="12" rx="2" fill="#C68247"/><path d="M4 54h56" stroke="#7A4B27" stroke-width="3" stroke-linecap="round"/>'),
    boat: S('<path d="M8 40h48l-8 12H16Z" fill="#9A6238"/><path d="M32 10v28" stroke="#6B4424" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M34 12c10 6 14 14 14 24H34Z" fill="#FBF7EE"/><path d="M4 56c6-4 10 4 16 0s10 4 16 0 10 4 16 0 8 2 8 2" fill="none" stroke="#3E9AA6" stroke-width="3" stroke-linecap="round"/>'),
    sheep: S('<ellipse cx="30" cy="34" rx="18" ry="13" fill="#FBF7EE"/><circle cx="18" cy="26" r="7" fill="#FBF7EE"/><circle cx="30" cy="22" r="8" fill="#FBF7EE"/><circle cx="42" cy="26" r="7" fill="#FBF7EE"/>' +
      '<ellipse cx="49" cy="33" rx="7" ry="8" fill="#4A4038"/><rect x="20" y="44" width="4" height="10" rx="2" fill="#4A4038"/><rect x="36" y="44" width="4" height="10" rx="2" fill="#4A4038"/>'),
    bushfire: S('<path d="M32 58V40" stroke="#6B4424" stroke-width="4" stroke-linecap="round"/><path d="M32 46l-10-8M32 44l10-8" stroke="#6B4424" stroke-width="3" stroke-linecap="round"/>' +
      flame(32, 26, 1.15, '#EA6A2A', '#F7B733') + flame(18, 34, 0.7, '#EA6A2A', '#F7B733') + flame(46, 34, 0.7, '#EA6A2A', '#F7B733') +
      '<circle cx="22" cy="42" r="6" fill="#6F8448"/><circle cx="32" cy="38" r="7" fill="#7E9552"/><circle cx="42" cy="42" r="6" fill="#6F8448"/>'),
    ash: S('<path d="M32 56V38" stroke="#4A4038" stroke-width="4" stroke-linecap="round"/><path d="M32 46l-9-9M32 42l9-8M24 38l-3-7M40 34l4-6" stroke="#4A4038" stroke-width="3" stroke-linecap="round"/>' +
      '<ellipse cx="32" cy="57" rx="20" ry="4" fill="#8C8680"/><circle cx="18" cy="20" r="2" fill="#B8B2AA"/><circle cx="46" cy="16" r="2" fill="#B8B2AA"/><circle cx="34" cy="12" r="1.6" fill="#B8B2AA"/>'),
    fruit: S('<path d="M32 58V36" stroke="#6B4424" stroke-width="4" stroke-linecap="round"/><circle cx="20" cy="30" r="12" fill="#6F8448"/><circle cx="44" cy="30" r="12" fill="#6F8448"/><circle cx="32" cy="20" r="13" fill="#7E9552"/>' +
      '<circle cx="20" cy="32" r="4" fill="#D9473B"/><circle cx="36" cy="18" r="4" fill="#D9473B"/><circle cx="45" cy="34" r="4" fill="#D9473B"/><circle cx="29" cy="34" r="4" fill="#D9473B"/>'),
    cloud: S('<path d="M22 58c-6-8 2-12-2-20s4-10 2-16 6-12 14-10 12 6 10 12 6 8 2 16 4 10-2 18Z" fill="#FBF7EE"/>' +
      '<path d="M26 58c-3-8 3-10 0-18s4-9 3-14" fill="none" stroke="#D5DDE4" stroke-width="3" stroke-linecap="round"/><path d="M8 58h48" stroke="#C99A55" stroke-width="3" stroke-linecap="round"/>'),
    fire: S('<path d="M32 4c10 10 14 18 12 28 6 6 4 16-2 22H22c-6-6-8-16-2-22-2-10 4-16 12-28Z" fill="#EA6A2A"/>' +
      '<path d="M32 20c6 7 8 12 6 18 3 4 2 10-1 16H27c-3-6-4-12-1-16-2-6 2-10 6-18Z" fill="#F7B733"/><path d="M8 58h48" stroke="#7A4B27" stroke-width="3" stroke-linecap="round"/>'),
    star: S('<path d="M32 8l6.5 15 16 1.5-12 10.8 3.6 16L32 43l-14.1 8.3 3.6-16-12-10.8 16-1.5Z" fill="#F7D774"/>'),
    mountain: S('<path d="M4 54L24 18l9 14 7-10 20 32Z" fill="#9A6238"/><path d="M24 18l-6 11 4 2 3-4 4 5 4-2Z" fill="#E4BE7E"/><path d="M40 22l-3 5 3 2 3-2Z" fill="#E4BE7E"/><path d="M4 56h56" stroke="#7A4B27" stroke-width="3" stroke-linecap="round"/>'),
    wave: S('<path d="M4 30c7-6 12 6 19 0s12 6 19 0 11 4 18 0" fill="none" stroke="#3E9AA6" stroke-width="5" stroke-linecap="round"/><path d="M4 44c7-6 12 6 19 0s12 6 19 0 11 4 18 0" fill="none" stroke="#7AD0C8" stroke-width="5" stroke-linecap="round"/><circle cx="48" cy="14" r="6" fill="#F7D774"/>'),
    moon: S('<path d="M42 8a24 24 0 1 0 14 34A20 20 0 0 1 42 8Z" fill="#F3E3A6"/><circle cx="14" cy="14" r="2" fill="#F3E3A6"/><circle cx="52" cy="52" r="1.6" fill="#F3E3A6"/>'),
    /* 버튼용 */
    book: S('<path d="M8 14c8-4 16-4 24 2v36c-8-6-16-6-24-2Z" fill="#FBF7EE"/><path d="M56 14c-8-4-16-4-24 2v36c8-6 16-6 24-2Z" fill="#EFE6D2"/>' +
      '<path d="M32 16v36" stroke="#C99A55" stroke-width="2"/><path d="M13 24c5-2 9-2 14 0M13 32c5-2 9-2 14 0M37 24c5-2 9-2 14 0M37 32c5-2 9-2 14 0" fill="none" stroke="#B6AA90" stroke-width="2" stroke-linecap="round"/>'),
    bookline: S('<path d="M32 18c-7-6-15-7-24-4v34c9-3 17-2 24 4 7-6 15-7 24-4V14c-9-3-17-2-24 4Zm0 0v34" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>'),
    journal: S('<rect x="14" y="8" width="38" height="48" rx="5" fill="#2F9C95"/><rect x="20" y="8" width="32" height="48" rx="4" fill="#FBF7EE"/>' +
      '<path d="M27 22h18M27 31h18M27 40h11" stroke="#9AA7B8" stroke-width="3" stroke-linecap="round"/><circle cx="14" cy="20" r="3" fill="#16233F"/><circle cx="14" cy="32" r="3" fill="#16233F"/><circle cx="14" cy="44" r="3" fill="#16233F"/>'),
    speaker: S('<path d="M10 24h10l14-11v38L20 40H10Z" fill="currentColor"/><path d="M42 22c5 5 5 15 0 20M49 15c9 9 9 25 0 34" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>'),
    check: S('<path d="M12 34l13 13 27-30" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>'),
    lock: S('<rect x="14" y="28" width="36" height="28" rx="6" fill="currentColor"/><path d="M22 28v-8a10 10 0 0 1 20 0v8" fill="none" stroke="currentColor" stroke-width="6"/>'),
    back: S('<path d="M38 12L18 32l20 20" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>'),
    camera: S('<path d="M10 20h10l4-7h16l4 7h10a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V24a4 4 0 0 1 4-4Z" fill="currentColor"/><circle cx="32" cy="35" r="10" fill="none" stroke="#FBF7EE" stroke-width="4"/>'),
    arrow: S('<path d="M32 6l19 27H39v25H25V33H13Z" fill="currentColor"/>'),
    gear: S('<circle cx="32" cy="32" r="19" fill="none" stroke="currentColor" stroke-width="11" stroke-dasharray="7.5 4.44"/><circle cx="32" cy="32" r="12" fill="none" stroke="currentColor" stroke-width="7"/>'),
    lens: S('<circle cx="32" cy="32" r="19" fill="#7AD0C8"/><circle cx="32" cy="32" r="19" fill="none" stroke="currentColor" stroke-width="6"/><path d="M22 26c3-5 8-7 13-6" fill="none" stroke="#FBF7EE" stroke-width="4" stroke-linecap="round"/>'),
    screw: S('<path d="M20 14h24l-3 9H23Z" fill="currentColor"/><path d="M29 14h6" stroke="#16233F" stroke-width="3"/><rect x="27" y="23" width="10" height="27" fill="currentColor"/><path d="M26 28l12-3M26 35l12-3M26 42l12-3" stroke="#16233F" stroke-width="2.5"/><path d="M27 50l5 8 5-8Z" fill="currentColor"/>'),
    compass: S('<circle cx="32" cy="32" r="25" fill="none" stroke="currentColor" stroke-width="4"/><path d="M40 24L36 36 24 40l4-12Z" fill="currentColor"/><circle cx="32" cy="32" r="3" fill="#16233F"/>')
  };
})();
