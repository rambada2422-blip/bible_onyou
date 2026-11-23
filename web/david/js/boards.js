/* 바이블 온유 · 다윗 탐험 연속 제작 놀이판 모듈 (A03~)
 * 『탐험대 이야기』 수첩 안의 비교대·관찰 창·경로 놀이판을 담당한다.
 */
window.BO_DAVID = window.BO_DAVID || {};
(function () {
  'use strict';

  var D04_SPECIMENS = [
    {
      id: 'jonathan',
      shapeTag: '모양: 소매·띠가 있는 온전한 겉옷',
      title: '겉옷 표본 A',
      art: 'd04-jonathan'
    },
    {
      id: 'saul',
      shapeTag: '모양: 가장자리가 베어진 천 조각',
      title: '겉옷 표본 B',
      art: 'd04-saul'
    }
  ];

  var D04_TAGS = [
    {
      id: 'jonathan',
      owner: '요나단',
      ref: '삼상 18:4',
      label: '요나단의 겉옷 · 삼상 18:4'
    },
    {
      id: 'saul',
      owner: '사울',
      ref: '삼상 24:4, 11',
      label: '사울의 겉옷 자락 · 삼상 24:4, 11'
    }
  ];

  function getD04Tag(id) {
    for (var i = 0; i < D04_TAGS.length; i++) {
      if (D04_TAGS[i].id === id) return D04_TAGS[i];
    }
    return null;
  }

  /* A03(D04): 두 겉옷 맞대기 — 같은 크기 비교대 + 주인·장절 쪽지 맞추기 + 한 쪽지만 되돌리기 */
  function renderD04Compare(ctx, sc) {
    var state = ctx.state;
    var el = ctx.el;
    var ART = ctx.ART;
    var seed = ctx.getSeed(state, 'D04');

    if (!state.d04Slots || typeof state.d04Slots !== 'object') {
      state.d04Slots = { jonathan: null, saul: null };
    }

    var specimens = D04_SPECIMENS.slice();
    if (seed % 2 === 1) specimens.reverse();

    var dragTagId = null;
    var dragFromSlot = null;
    var pointerTagId = null;
    var pointerFromSlot = null;

    function placeTagOnSlot(tagId, slotId) {
      if (!tagId || !slotId) return;
      /* 이미 다른 칸에 놓여 있던 쪽지라면 그 칸에서만 떼어 새 칸으로 옮긴다 */
      if (state.d04Slots.jonathan === tagId) state.d04Slots.jonathan = null;
      if (state.d04Slots.saul === tagId) state.d04Slots.saul = null;
      state.d04Slots[slotId] = tagId;
      state.d04PickTag = null;
      state.d04Msg = '';
      ctx.recordFirstAction('D04:place:' + tagId + '->' + slotId);
      ctx.saveState();
      ctx.render();
    }

    function returnSingleTag(slotId, method) {
      if (!state.d04Slots[slotId]) return;
      var removed = state.d04Slots[slotId];
      state.d04Slots[slotId] = null;
      state.d04PickTag = null;
      state.d04Msg = '쪽지 한 장만 되돌렸어요. 다른 칸은 그대로 남아 있어요.';
      ctx.recordFirstAction('D04:undo:' + method + ':' + removed);
      ctx.saveState();
      ctx.render();
    }

    function beginPointerDrag(tagId, fromSlot) {
      pointerTagId = tagId;
      pointerFromSlot = fromSlot;
      function onUp(ev) {
        if (pointerTagId && typeof document.elementFromPoint === 'function') {
          var hit = document.elementFromPoint(ev.clientX, ev.clientY);
          if (pointerFromSlot && hit && hit.closest && hit.closest('[data-d04-tag-tray="true"]')) {
            returnSingleTag(pointerFromSlot, 'pointer-drag');
          } else if (hit && hit.closest) {
            var targetDrop = hit.closest('[data-d04-drop]');
            if (targetDrop) {
              var tSlot = targetDrop.getAttribute('data-d04-drop');
              if (tSlot && tSlot !== pointerFromSlot) {
                placeTagOnSlot(pointerTagId, tSlot);
              }
            }
          }
        }
        pointerTagId = null;
        pointerFromSlot = null;
      }
      window.addEventListener('pointerup', onUp, { once: true });
    }

    var specimenNodes = specimens.map(function (sp, idx) {
      var placedId = state.d04Slots[sp.id] || null;
      var placedTag = placedId ? getD04Tag(placedId) : null;
      var dropReady = !!state.d04PickTag;

      var slotChildren = [
        el('div', { class: 'd04-spec-head' },
          el('span', { class: 'd04-spec-title', text: sp.title }),
          el('span', { class: 'd04-spec-shape', text: sp.shapeTag })
        ),
        el('div', { class: 'd04-spec-art', html: ART.zoom(sp.art) })
      ];

      if (placedTag) {
        slotChildren.push(
          el('div', { class: 'd04-placed-wrap' },
            el('button', {
              class: 'd04-placed-chip',
              'data-d04-placed': sp.id,
              'data-d04-placed-tag': placedTag.id,
              draggable: 'true',
              'aria-label': placedTag.label + ' 놓임. 두 번 탭, 끌기, 또는 Backspace로 이 쪽지만 되돌리기',
              on: {
                dblclick: function (ev) {
                  ev.stopPropagation();
                  returnSingleTag(sp.id, 'dblclick');
                },
                keydown: function (ev) {
                  if (ev.key === 'Backspace' || ev.key === 'Delete') {
                    ev.preventDefault();
                    returnSingleTag(sp.id, 'keyboard');
                  }
                },
                dragstart: function (ev) {
                  dragTagId = placedTag.id;
                  dragFromSlot = sp.id;
                  if (ev.dataTransfer) {
                    ev.dataTransfer.effectAllowed = 'move';
                    ev.dataTransfer.setData('text/plain', 'slot:' + sp.id + ':' + placedTag.id);
                  }
                },
                pointerdown: function () {
                  beginPointerDrag(placedTag.id, sp.id);
                }
              }
            },
              el('span', { class: 'd04-chip-owner', text: placedTag.owner }),
              el('span', { class: 'd04-chip-ref', text: placedTag.ref })
            ),
            el('button', {
              class: 'd04-undo-btn',
              'data-d04-undo': sp.id,
              'aria-label': sp.title + ' 쪽지 한 장만 되돌리기',
              on: {
                click: function (ev) {
                  ev.stopPropagation();
                  returnSingleTag(sp.id, 'button');
                }
              }
            }, '되돌리기')
          )
        );
      } else {
        slotChildren.push(
          el('button', {
            class: 'd04-drop-btn' + (dropReady ? ' ready' : ''),
            'data-d04-slot-btn': sp.id,
            on: {
              click: function () {
                if (state.d04PickTag) {
                  placeTagOnSlot(state.d04PickTag, sp.id);
                } else {
                  state.d04Msg = '아래 쪽지 하나를 먼저 고르거나 이곳으로 끌어 놓아 보세요.';
                  ctx.render();
                }
              }
            }
          }, dropReady ? '여기에 고른 쪽지 놓기' : '주인·장절 쪽지 놓는 칸')
        );
      }

      return el('div', {
        class: 'd04-spec-card' + (placedTag ? ' filled' : '') + (dropReady && !placedTag ? ' drop-ready' : ''),
        'data-d04-drop': sp.id,
        'data-d04-slot-idx': String(idx),
        on: {
          dragenter: function (ev) { ev.preventDefault(); },
          dragover: function (ev) { ev.preventDefault(); },
          drop: function (ev) {
            ev.preventDefault();
            var tid = dragTagId;
            if (!tid && ev.dataTransfer) {
              var raw = ev.dataTransfer.getData('text/plain') || '';
              tid = raw.indexOf('slot:') === 0 ? raw.split(':')[2] : raw;
            }
            if (tid) placeTagOnSlot(tid, sp.id);
            dragTagId = null;
            dragFromSlot = null;
          }
        }
      }, slotChildren);
    });

    var unplacedTags = D04_TAGS.filter(function (t) {
      return state.d04Slots.jonathan !== t.id && state.d04Slots.saul !== t.id;
    });

    var tagNodes = unplacedTags.map(function (t) {
      var picked = state.d04PickTag === t.id;
      return el('button', {
        class: 'd04-tag-chip' + (picked ? ' picked' : ''),
        'data-d04-tag': t.id,
        draggable: 'true',
        'aria-pressed': String(picked),
        on: {
          click: function () {
            state.d04PickTag = picked ? null : t.id;
            state.d04Msg = '';
            ctx.recordFirstAction('D04:pick:' + t.id);
            ctx.render();
          },
          dragstart: function (ev) {
            dragTagId = t.id;
            dragFromSlot = null;
            state.d04PickTag = t.id;
            if (ev.dataTransfer) {
              ev.dataTransfer.effectAllowed = 'move';
              ev.dataTransfer.setData('text/plain', t.id);
            }
          },
          pointerdown: function () {
            beginPointerDrag(t.id, null);
          }
        }
      },
        el('span', { class: 'd04-chip-owner', text: t.owner }),
        el('span', { class: 'd04-chip-ref', text: t.ref })
      );
    });

    var bothPlaced = !!(state.d04Slots.jonathan && state.d04Slots.saul);

    return el('section', {
      class: 'notebook-map d04-compare-tray',
      'data-d04-compare': 'true',
      'data-d04-seed': String(seed)
    },
      el('div', { class: 'one-line-guide', text: '『탐험대 이야기』 같은 크기의 비교대에서 두 겉옷의 주인과 장절 쪽지를 맞춰 보자. 놓은 쪽지는 끌기·두 번 탭·Backspace로 한 장만 되돌릴 수 있어요.' }),
      el('div', { class: 'd04-specimen-grid' }, specimenNodes),
      el('div', {
        class: 'd04-tag-tray',
        'data-d04-tag-tray': 'true',
        on: {
          dragover: function (ev) { ev.preventDefault(); },
          drop: function (ev) {
            ev.preventDefault();
            var fromSlot = dragFromSlot;
            if (!fromSlot && ev.dataTransfer) {
              var raw = ev.dataTransfer.getData('text/plain') || '';
              if (raw.indexOf('slot:') === 0) fromSlot = raw.split(':')[1];
            }
            if (fromSlot) returnSingleTag(fromSlot, 'drag-back');
            dragTagId = null;
            dragFromSlot = null;
          }
        }
      },
        tagNodes.length
          ? tagNodes
          : el('span', { class: 'd04-tray-hint', text: '쪽지 두 장을 모두 놓았어요. 한 장만 되돌리려면 이 칸으로 끌어오거나 두 번 탭하세요.' })
      ),
      state.d04Msg ? el('div', { class: 'order-msg', 'data-d04-msg': 'true', text: state.d04Msg }) : null,
      el('button', {
        class: 'btn brass d04-check-btn',
        'data-action': 'd04-check',
        disabled: !bothPlaced,
        on: {
          click: function () {
            if (state.d04Slots.jonathan === 'jonathan' && state.d04Slots.saul === 'saul') {
              ctx.recordDiscovery(sc, '『탐험대 이야기』 두 겉옷 맞대기 완료: 요나단의 겉옷(삼상 18:4) ↔ 사울의 겉옷 자락(삼상 24:4, 11)');
              state.step = 'done';
              state.d04Msg = '';
              ctx.saveState();
              ctx.render();
            } else {
              state.d04Msg = '두 쪽지의 자리가 바뀌었어요. 한 쪽지만 되돌려 다시 놓아 보세요 (요나단 삼상 18:4 · 사울 삼상 24:4, 11).';
              ctx.render();
            }
          }
        }
      }, '두 겉옷 맞대기 확인하기')
    );
  }

  window.BO_DAVID.boards = {
    renderD04Compare: renderD04Compare
  };
})();
