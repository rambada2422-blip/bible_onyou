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
    var TRACE_PARTS = [
      {
        id: 'edge',
        label: '베어진 가장자리',
        shapeCode: '모양 ▲ 계단식 가장자리',
        ownerHint: '사울의 겉옷 자락 · 삼상 24:4',
        note: '옷자락 끝이 계단 모양으로 베어져 있는 흔적이 남아 있어요.',
        art: 'd04-trace-edge'
      },
      {
        id: 'trim',
        label: '아랫단 띠',
        shapeCode: '모양 ═ 두 줄 톱니 띠',
        ownerHint: '사울의 겉옷 자락 · 삼상 24:11',
        note: '두 줄로 짠 가로 띠와 점선 바느질 무늬가 보여요.',
        art: 'd04-trace-trim'
      },
      {
        id: 'weave',
        label: '온전한 겉옷 깃·띠',
        shapeCode: '모양 ◆ 꺾인 깃과 허리띠 매듭',
        ownerHint: '요나단의 겉옷 · 삼상 18:4',
        note: '베어진 곳이 없고 목깃과 허리띠 매듭이 그대로 붙어 있어요.',
        art: 'd04-trace-weave'
      }
    ];
    var curTraceId = state.d04TracePart || 'edge';
    var curTrace = TRACE_PARTS[0];
    for (var ti = 0; ti < TRACE_PARTS.length; ti++) {
      if (TRACE_PARTS[ti].id === curTraceId) { curTrace = TRACE_PARTS[ti]; break; }
    }

    var traceBtns = TRACE_PARTS.map(function (pt, idx) {
      var active = curTrace.id === pt.id;
      return el('button', {
        class: 'd04-trace-tab' + (active ? ' active' : ''),
        'data-d04-trace-btn': pt.id,
        'aria-pressed': String(active),
        on: {
          click: function () {
            state.d04TracePart = pt.id;
            ctx.recordFirstAction('D04:trace:' + pt.id);
            ctx.saveState();
            ctx.render();
          },
          keydown: function (ev) {
            if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') {
              ev.preventDefault();
              var nextIdx = (idx + (ev.key === 'ArrowRight' ? 1 : TRACE_PARTS.length - 1)) % TRACE_PARTS.length;
              state.d04TracePart = TRACE_PARTS[nextIdx].id;
              ctx.saveState();
              ctx.render();
              var nb = ctx.root.querySelector('[data-d04-trace-btn="' + TRACE_PARTS[nextIdx].id + '"]');
              if (nb) nb.focus();
            }
          }
        }
      }, pt.label);
    });

    var traceWindow = el('div', {
      class: 'd04-trace-lens' + (state.d04Mono ? ' mono' : ''),
      'data-d04-trace': 'true',
      'data-d04-trace-active': curTrace.id,
      'data-d04-mono': String(!!state.d04Mono)
    },
      el('div', { class: 'd04-trace-head' },
        el('span', { class: 'd04-trace-title', text: '흔적을 보는 창 (손을 떼도 선택한 부분이 남아요)' }),
        el('button', {
          class: 'd04-mono-btn' + (state.d04Mono ? ' active' : ''),
          'data-action': 'd04-toggle-mono',
          'aria-pressed': String(!!state.d04Mono),
          on: {
            click: function () {
              state.d04Mono = !state.d04Mono;
              ctx.saveState();
              ctx.render();
            }
          }
        }, state.d04Mono ? '색 켜기' : '색 끄고 모양 보기')
      ),
      el('div', { class: 'd04-trace-tabs', role: 'group', 'aria-label': '천 조각 관찰 부위 선택' }, traceBtns),
      el('div', { class: 'd04-trace-view' },
        el('div', { class: 'd04-trace-art', html: ART.zoom(curTrace.art) }),
        el('div', { class: 'd04-trace-meta' },
          el('span', { class: 'd04-trace-shape', text: curTrace.shapeCode }),
          el('span', { class: 'ref', text: curTrace.ownerHint })
        ),
        el('p', { class: 'd04-trace-note', text: curTrace.note })
      )
    );

    return el('section', {
      class: 'notebook-map d04-compare-tray' + (state.d04Mono ? ' mono-mode' : ''),
      'data-d04-compare': 'true',
      'data-d04-seed': String(seed)
    },
      el('div', { class: 'one-line-guide', text: '『탐험대 이야기』 같은 크기의 비교대에서 두 겉옷의 주인과 장절 쪽지를 맞춰 보자. 놓은 쪽지는 끌기·두 번 탭·Backspace로 한 장만 되돌릴 수 있어요.' }),
      el('div', { class: 'd04-specimen-grid' }, specimenNodes),
      traceWindow,
      el('div', {
        class: 'd04-tag-tray',
        'data-d04-tag-tray': 'true',
        on: {
          dragenter: function (ev) { ev.preventDefault(); },
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

  var D05_WINGS = [
    {
      id: 'judah',
      side: '왼쪽 펼침면',
      title: '유다 사람들',
      ref: '삼하 2:4',
      fact: '유다 사람들이 헤브론에 와서 다윗에게 기름을 부어 유다의 왕으로 세웠어.',
      icon: 'horn'
    },
    {
      id: 'elders',
      side: '오른쪽 펼침면',
      title: '이스라엘의 장로들',
      ref: '삼하 5:1–5',
      fact: '유다의 왕이 된 지 칠 년 반 뒤, 이스라엘의 장로들이 헤브론에 와서 이스라엘의 왕으로 세웠어.',
      icon: 'person'
    }
  ];

  function getD05Wing(id) {
    for (var i = 0; i < D05_WINGS.length; i++) {
      if (D05_WINGS[i].id === id) return D05_WINGS[i];
    }
    return null;
  }

  /* A05(D05): 헤브론의 두 만남 — 같은 장소에서 두 만남을 양쪽으로 펼쳐 순서를 직접 놓기 */
  function renderD05Hebron(ctx, sc) {
    var state = ctx.state;
    var el = ctx.el;
    var ART = ctx.ART;
    var seed = ctx.getSeed(state, 'D05');

    if (!Array.isArray(state.d05Opened)) state.d05Opened = [];
    if (!Array.isArray(state.d05Order) || state.d05Order.length !== 2) state.d05Order = [null, null];

    var wings = D05_WINGS.slice();
    if (seed % 2 === 1) wings.reverse();

    function placeInSlot(wingId, slotIdx) {
      if (state.d05Order[0] === wingId) state.d05Order[0] = null;
      if (state.d05Order[1] === wingId) state.d05Order[1] = null;
      state.d05Order[slotIdx] = wingId;
      state.d05Pick = null;
      state.d05ReopenRef = null;
      state.d05Msg = '';
      ctx.saveState();
      ctx.render();
    }

    function undoSingleSlot(slotIdx) {
      var removedId = state.d05Order[slotIdx];
      if (!removedId) return;
      state.d05Order[slotIdx] = null;
      state.d05Pick = removedId;
      state.d05ReopenRef = removedId;
      var rw = getD05Wing(removedId);
      state.d05Msg = (slotIdx + 1) + '번째 칸 쪽지 한 장만 되돌렸어요. ' + (rw ? (rw.ref + '을 다시 펴고 자리를 골라 보세요.') : '');
      ctx.recordFirstAction('D05:undo-slot:' + slotIdx + ':' + removedId);
      ctx.saveState();
      ctx.render();
    }

    var wingNodes = wings.map(function (w, idx) {
      var opened = state.d05Opened.indexOf(w.id) !== -1;
      var sideLabel = idx === 0 ? '왼쪽 펼침면' : '오른쪽 펼침면';
      return el('div', { class: 'd05-wing-card' + (opened ? ' opened' : ''), 'data-d05-wing-card': w.id },
        el('button', {
          class: 'd05-wing-btn',
          'data-d05-wing': w.id,
          'aria-expanded': String(opened),
          on: {
            click: function () {
              ctx.recordFirstAction('D05:wing:' + w.id);
              if (state.d05Opened.indexOf(w.id) === -1) state.d05Opened.push(w.id);
              if (!state.d05FirstWing) state.d05FirstWing = w.id;
              state.d05Pick = w.id;
              state.d05Msg = '';
              ctx.saveState();
              ctx.render();
            }
          }
        },
          el('div', { class: 'fold-dir', text: sideLabel + (opened ? ' · 펼쳐짐 ✓' : ' · 펼치기') }),
          el('div', { class: 'fold-main' },
            el('span', { class: 'fold-icon', html: ART.icon(w.icon) }),
            el('div', { class: 'fold-text' },
              el('span', { class: 'fold-title', text: w.title }),
              el('span', { class: 'fold-sub', text: opened ? w.ref : '눌러서 기록 펼치기' })
            )
          )
        ),
        opened ? el('div', { class: 'd05-wing-detail', 'data-d05-detail': w.id },
          el('p', { class: 'd05-wing-fact', text: w.fact }),
          el('div', { class: 'd05-wing-place-btns' },
            el('button', {
              class: 'd05-mini-btn' + (state.d05Order[0] === w.id ? ' active' : ''),
              'data-d05-put': w.id + ':0',
              on: { click: function () { placeInSlot(w.id, 0); } }
            }, '1번째에 놓기'),
            el('button', {
              class: 'd05-mini-btn' + (state.d05Order[1] === w.id ? ' active' : ''),
              'data-d05-put': w.id + ':1',
              on: { click: function () { placeInSlot(w.id, 1); } }
            }, '2번째에 놓기')
          )
        ) : null
      );
    });

    var slotLabels = ['1번째 (먼저 일어난 만남)', '2번째 (나중 만남)'];
    var slotNodes = [0, 1].map(function (sIdx) {
      var placedId = state.d05Order[sIdx];
      var placedWing = placedId ? getD05Wing(placedId) : null;
      return el('div', {
        class: 'd05-order-slot' + (placedWing ? ' filled' : ''),
        'data-d05-order-slot': String(sIdx)
      },
        el('div', { class: 'd05-slot-head', text: slotLabels[sIdx] }),
        placedWing
          ? el('div', { class: 'd04-placed-wrap' },
              el('button', {
                class: 'd05-slot-placed',
                'data-d05-slot-val': placedWing.id,
                'aria-label': placedWing.title + ' 놓임. 두 번 탭 또는 Backspace로 이 칸만 되돌리기',
                on: {
                  dblclick: function () { undoSingleSlot(sIdx); },
                  keydown: function (ev) {
                    if (ev.key === 'Backspace' || ev.key === 'Delete') {
                      ev.preventDefault();
                      undoSingleSlot(sIdx);
                    }
                  }
                }
              },
                el('span', { class: 'd04-chip-owner', text: placedWing.title }),
                el('span', { class: 'd04-chip-ref', text: placedWing.ref })
              ),
              el('button', {
                class: 'd04-undo-btn',
                'data-d05-undo-slot': String(sIdx),
                on: { click: function () { undoSingleSlot(sIdx); } }
              }, '한 칸 되돌리기')
            )
          : el('button', {
              class: 'd04-drop-btn' + (state.d05Pick ? ' ready' : ''),
              'data-d05-slot-btn': String(sIdx),
              on: {
                click: function () {
                  if (state.d05Pick) {
                    placeInSlot(state.d05Pick, sIdx);
                  } else {
                    state.d05Msg = '위에서 만남 펼침면을 먼저 눌러 확인한 뒤 자리에 놓아 보세요.';
                    ctx.render();
                  }
                }
              }
            }, state.d05Pick ? ('여기에 \'' + getD05Wing(state.d05Pick).title + '\' 놓기') : '펼친 만남을 놓는 자리')
      );
    });

    var reopenWing = state.d05ReopenRef ? getD05Wing(state.d05ReopenRef) : null;
    var reopenCard = reopenWing ? el('div', { class: 'd05-reopen-card', 'data-d05-reopen-ref': reopenWing.id },
      el('span', { class: 'ref', text: '장절 다시 펴기 · ' + reopenWing.ref }),
      el('p', { class: 'd05-wing-fact', text: reopenWing.title + ': ' + reopenWing.fact })
    ) : null;

    var bothOpened = state.d05Opened.indexOf('judah') !== -1 && state.d05Opened.indexOf('elders') !== -1;
    var bothPlaced = !!(state.d05Order[0] && state.d05Order[1]);

    return el('section', {
      class: 'notebook-map d05-hebron-board',
      'data-d05-board': 'true',
      'data-d05-seed': String(seed)
    },
      el('div', { class: 'one-line-guide', text: '『탐험대 이야기』 같은 장소 헤브론의 두 만남을 양쪽으로 펼쳐 보고, 어느 쪽부터 시작했든 두 기록을 시간순으로 놓아 보자.' }),
      el('div', { class: 'd05-wings' }, wingNodes),
      el('div', { class: 'd05-order-slots' }, slotNodes),
      reopenCard,
      state.d05Msg ? el('div', { class: 'order-msg', 'data-d05-msg': 'true', text: state.d05Msg }) : null,
      el('button', {
        class: 'btn brass d04-check-btn',
        'data-action': 'd05-check',
        disabled: !(bothOpened && bothPlaced),
        on: {
          click: function () {
            if (state.d05Order[0] === 'judah' && state.d05Order[1] === 'elders') {
              var firstW = getD05Wing(state.d05FirstWing) || getD05Wing('judah');
              ctx.recordDiscovery(
                sc,
                '『탐험대 이야기』 헤브론 두 만남(먼저 펼친 쪽: ' + firstW.title + '): 유다 사람들(삼하 2:4) → 이스라엘의 장로들(삼하 5:1–5)'
              );
              state.step = 'done';
              state.d05ReopenRef = null;
              state.d05Msg = '';
              ctx.saveState();
              ctx.render();
            } else {
              state.d05Msg = '순서가 바뀌었어요. 한 칸만 되돌려 장절을 다시 펴고 놓아 보세요 (삼하 2:4 → 삼하 5:1–5).';
              ctx.render();
            }
          }
        }
      }, bothOpened ? '두 만남 순서 확인하기' : '두 만남을 모두 펼친 뒤 확인하기')
    );
  }

  var D06_PAGES = [
    {
      id: 'ark',
      pageLabel: '수첩 1면 · 궤가 들어옴',
      nameTag: '이름표: 하나님의 궤 (청색 천으로 덮임 · 민 4:5–6)',
      title: '궤가 들어옴',
      ref: '삼하 6:12–13',
      fact: '행렬이 청색 천으로 덮인 하나님의 궤를 다윗 성으로 메고 들어왔어.',
      icon: 'ark'
    },
    {
      id: 'tent',
      pageLabel: '수첩 2면 · 마련한 장막',
      nameTag: '이름표: 다윗이 마련한 장막',
      title: '마련한 장막',
      ref: '삼하 6:17',
      fact: '다윗 성에 들어온 하나님의 궤를 다윗이 마련한 장막 안에 두었어.',
      icon: 'tent'
    }
  ];

  /* A07·A08(D06): 행렬 기록 펼치기 + 관찰 경로 두 개('물건부터' / '도착한 곳부터') */
  function renderD06Notebook(ctx, sc) {
    var state = ctx.state;
    var el = ctx.el;
    var ART = ctx.ART;
    var seed = ctx.getSeed(state, 'D06');

    if (!Array.isArray(state.d06Opened)) state.d06Opened = [];

    var curPath = state.d06Path || (seed % 2 === 1 ? 'place' : 'object');
    var pages = curPath === 'place' ? [D06_PAGES[1], D06_PAGES[0]] : [D06_PAGES[0], D06_PAGES[1]];

    function selectPath(pathId) {
      state.d06Path = pathId;
      var firstId = pathId === 'place' ? 'tent' : 'ark';
      state.d06Opened = [firstId];
      ctx.recordFirstAction('D06:path:' + pathId);
      ctx.saveState();
      ctx.render();
    }

    var pathBar = el('div', { class: 'd05-wing-place-btns d06-path-row', 'data-d06-path-active': curPath },
      el('button', {
        class: 'd05-mini-btn' + (curPath === 'object' ? ' active' : ''),
        'data-d06-path': 'object',
        'aria-pressed': String(curPath === 'object'),
        on: { click: function () { selectPath('object'); } }
      }, '물건부터 (궤 → 장막)'),
      el('button', {
        class: 'd05-mini-btn' + (curPath === 'place' ? ' active' : ''),
        'data-d06-path': 'place',
        'aria-pressed': String(curPath === 'place'),
        on: { click: function () { selectPath('place'); } }
      }, '도착한 곳부터 (장막 → 궤)')
    );

    var pageNodes = pages.map(function (pg, idx) {
      var opened = state.d06Opened.indexOf(pg.id) !== -1;
      var stepTag = idx === 0 ? '첫 증거' : '다음 기록';
      return el('div', { class: 'd05-wing-card' + (opened ? ' opened' : ''), 'data-d06-page-card': pg.id, 'data-d06-order': String(idx) },
        el('button', {
          class: 'd05-wing-btn',
          'data-d06-page': pg.id,
          'aria-expanded': String(opened),
          on: {
            click: function () {
              ctx.recordFirstAction('D06:page:' + pg.id);
              if (state.d06Opened.indexOf(pg.id) === -1) state.d06Opened.push(pg.id);
              ctx.saveState();
              ctx.render();
            }
          }
        },
          el('div', { class: 'fold-dir', text: stepTag + ' · ' + pg.pageLabel + (opened ? ' ✓' : '') }),
          el('div', { class: 'fold-main' },
            el('span', { class: 'fold-icon', html: ART.icon(pg.icon) }),
            el('div', { class: 'fold-text' },
              el('span', { class: 'fold-title', text: pg.title }),
              el('span', { class: 'fold-sub', text: opened ? pg.ref : '이름표와 기록 펼치기' })
            )
          )
        ),
        opened ? el('div', { class: 'd05-wing-detail', 'data-d06-detail': pg.id },
          el('span', { class: 'tag', text: pg.nameTag }),
          el('p', { class: 'd05-wing-fact', text: pg.fact })
        ) : null
      );
    });

    var bothOpened = state.d06Opened.indexOf('ark') !== -1 && state.d06Opened.indexOf('tent') !== -1;
    var pathLabel = curPath === 'place' ? '도착한 곳부터(장막 → 궤)' : '물건부터(궤 → 장막)';

    return el('section', {
      class: 'notebook-map d05-hebron-board',
      'data-d06-board': 'true',
      'data-d06-seed': String(seed),
      'data-d06-first': pages[0].id
    },
      el('div', { class: 'one-line-guide', text: '『탐험대 이야기』 관찰 경로를 골라 처음 볼 증거를 바꾸고, 두 면을 모두 펼쳐 같은 장절(삼하 6:12–15, 17–19)에 도착해 보자.' }),
      pathBar,
      el('div', { class: 'd05-wings' }, pageNodes),
      el('button', {
        class: 'btn brass d04-check-btn',
        'data-action': 'd06-finish',
        disabled: !bothOpened,
        on: {
          click: function () {
            ctx.recordDiscovery(
              sc,
              '『탐험대 이야기』 행렬 기록 수첩 · 경로: ' + pathLabel + ' → 도착 장절 ' + (sc.journalRef || sc.ref)
            );
            state.step = 'done';
            ctx.saveState();
            ctx.render();
          }
        }
      }, bothOpened ? '두 면의 기록을 일지에 남기기 (삼하 6:12–15, 17–19)' : '수첩 두 면을 모두 펼쳐 보세요')
    );
  }

  var D08_NODES = [
    {
      idx: 0,
      kind: 'station',
      short: '1. 성문 곁 우물',
      title: '출발 · 베들레헴 성문 곁 우물',
      ref: '삼하 23:15',
      fact: '다윗이 베들레헴 성문 곁 우물물을 마시고 싶어 했어.',
      icon: 'water'
    },
    {
      idx: 1,
      kind: 'step',
      short: '길목 1',
      title: '이동 칸 1 · 성문 곁에서 산성으로',
      ref: '삼하 23:16',
      fact: '세 용사가 물을 길어 다윗이 있는 산성 쪽으로 옮기고 있어.',
      icon: 'water'
    },
    {
      idx: 2,
      kind: 'station',
      short: '2. 물을 가져온 사람들',
      title: '중간 · 물을 가져온 세 사람',
      ref: '삼하 23:16',
      fact: '세 사람이 베들레헴 성문 곁 우물에서 물을 길어 다윗에게 가져왔어.',
      icon: 'person'
    },
    {
      idx: 3,
      kind: 'step',
      short: '길목 2',
      title: '이동 칸 2 · 아둘람 굴 앞 도착',
      ref: '삼하 23:16',
      fact: '우물물이 다윗 앞에 놓였어. 한 칸 더 가면 다윗의 행동을 확인할 수 있어.',
      icon: 'water'
    },
    {
      idx: 4,
      kind: 'station',
      short: '3. 다윗의 행동',
      title: '도착 · 아둘람 굴에서 다윗의 행동',
      ref: '삼하 23:16–17',
      fact: '다윗은 그 물을 마시지 않고 여호와께 바쳐 쏟았어.',
      icon: 'water'
    }
  ];

  var d08HoldTimer = null;
  var d08HoldInterval = null;
  var d08SkipNextClick = false;

  function stopD08Hold() {
    if (d08HoldTimer) { clearTimeout(d08HoldTimer); d08HoldTimer = null; }
    if (d08HoldInterval) { clearInterval(d08HoldInterval); d08HoldInterval = null; }
  }

  /* A09·A10(D08): 우물물의 출발과 도착 + 중간 분기 다음 지점 예상 + 부모·교사 안내 연결 */
  function renderD08Path(ctx, sc) {
    var state = ctx.state;
    var el = ctx.el;
    var seed = ctx.getSeed(state, 'D08');

    if (typeof state.d08Pos !== 'number') state.d08Pos = 0;
    if (!Array.isArray(state.d08Visited) || !state.d08Visited.length) state.d08Visited = [0];

    function stepMove(delta) {
      var next = Math.max(0, Math.min(4, state.d08Pos + delta));
      if (next > 2 && !state.d08GuessOk) {
        stopD08Hold();
        state.d08Pos = 2;
        if (state.d08Visited.indexOf(2) === -1) state.d08Visited.push(2);
        state.d08GuessMsg = '중간 분기(2번 지점)에서 다음 기록을 먼저 예상해 보세요.';
        ctx.saveState();
        ctx.render();
        return false;
      }
      if (next === state.d08Pos) {
        stopD08Hold();
        return false;
      }
      state.d08Pos = next;
      if (state.d08Visited.indexOf(next) === -1) state.d08Visited.push(next);
      ctx.recordFirstAction('D08:move:' + next);
      ctx.saveState();
      ctx.render();
      return true;
    }

    function startHold(delta) {
      stopD08Hold();
      d08SkipNextClick = true;
      stepMove(delta);
      d08HoldTimer = setTimeout(function () {
        d08HoldInterval = setInterval(function () {
          if (!stepMove(delta)) stopD08Hold();
        }, 260);
      }, 320);
      function onEnd() {
        stopD08Hold();
      }
      window.addEventListener('pointerup', onEnd, { once: true });
      window.addEventListener('pointercancel', onEnd, { once: true });
    }

    var curNode = D08_NODES[state.d08Pos] || D08_NODES[0];
    var trackNodes = D08_NODES.map(function (nd) {
      var visited = state.d08Visited.indexOf(nd.idx) !== -1;
      var current = state.d08Pos === nd.idx;
      return el('div', {
        class: 'd08-cell ' + nd.kind + (visited ? ' visited' : '') + (current ? ' current' : ''),
        'data-d08-cell': String(nd.idx),
        'aria-current': current ? 'step' : null
      },
        el('span', { class: 'd08-cell-dot', text: current ? '●' : (visited ? '✓' : String(nd.idx + 1)) }),
        el('span', { class: 'd08-cell-label', text: nd.short })
      );
    });

    var guessBox = null;
    if (state.d08Pos >= 2 || state.d08Visited.indexOf(2) !== -1) {
      guessBox = el('div', { class: 'd05-reopen-card', 'data-d08-guess-box': 'true', 'data-d08-guess-ok': String(!!state.d08GuessOk) },
        el('div', { class: 'd01-zoom-head' },
          el('span', { class: 'tag', text: '중간 분기 · 다음 기록 예상' }),
          el('span', { class: 'ref', text: '삼하 23:16–17' })
        ),
        el('p', { class: 'd05-wing-fact', text: '세 사람이 우물물을 가져왔을 때, 다음 기록은 무엇일까?' }),
        el('div', { class: 'd05-wing-place-btns' },
          el('button', {
            class: 'd05-mini-btn' + (state.d08Guess === 'drink' ? ' active' : ''),
            'data-d08-guess': 'drink',
            on: {
              click: function () {
                state.d08Guess = 'drink';
                state.d08GuessOk = false;
                /* 예상이 어긋나면 처음(0)이 아니라 마지막 분기(2번 지점)에서만 다시 시작한다 */
                state.d08Pos = 2;
                state.d08GuessMsg = '예상이 어긋났어요. 마지막 분기(2번 지점)에서 삼하 23:16–17을 펼쳐 다시 골라 보세요.';
                ctx.saveState();
                ctx.render();
              }
            }
          }, '물을 바로 마셨어'),
          el('button', {
            class: 'd05-mini-btn' + (state.d08Guess === 'pour' ? ' active' : ''),
            'data-d08-guess': 'pour',
            on: {
              click: function () {
                state.d08Guess = 'pour';
                state.d08GuessOk = true;
                state.d08GuessMsg = '삼하 23:16 확인 완료! 이제 도착 지점(다윗의 행동)까지 한 칸씩 이동해 보세요.';
                ctx.saveState();
                ctx.render();
              }
            }
          }, '여호와께 바쳐 쏟았어')
        ),
        state.d08GuessMsg ? el('div', { class: 'order-msg', 'data-d08-guess-msg': 'true', text: state.d08GuessMsg }) : null,
        el('button', {
          class: 'd04-undo-btn',
          'data-action': 'd08-open-guardian',
          on: { click: function () { ctx.openGuardian(); } }
        }, '목회자 감수 대기 해석 · 부모·교사 안내에서 함께 읽기')
      );
    }

    var reachedAll = state.d08GuessOk && state.d08Visited.indexOf(0) !== -1 && state.d08Visited.indexOf(2) !== -1 && state.d08Visited.indexOf(4) !== -1;

    return el('section', {
      class: 'notebook-map d08-path-board',
      'data-d08-board': 'true',
      'data-d08-pos': String(state.d08Pos),
      'data-d08-seed': String(seed),
      tabindex: '0',
      'aria-label': '우물물 이동 경로. 좌우 방향키로 한 칸씩 움직일 수 있어요.',
      on: {
        keydown: function (ev) {
          if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') {
            ev.preventDefault();
            stepMove(1);
          } else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') {
            ev.preventDefault();
            stepMove(-1);
          }
        }
      }
    },
      el('div', { class: 'one-line-guide', text: '『탐험대 이야기』 세 지점(우물 → 가져온 사람들 → 다윗의 행동)을 한 칸씩 눌러 이어 보자. 길게 누르다 떼면 그 자리에서 멈춰요.' }),
      el('div', { class: 'd08-track' }, trackNodes),
      el('div', { class: 'd08-card', 'data-d08-current-card': String(curNode.idx) },
        el('div', { class: 'd01-zoom-head' },
          el('span', { class: 'tag', text: curNode.title }),
          el('span', { class: 'ref', text: curNode.ref })
        ),
        el('p', { class: 'd05-wing-fact', text: curNode.fact })
      ),
      guessBox,
      el('div', { class: 'd08-controls' },
        el('button', {
          class: 'btn plain d08-step-btn',
          'data-d08-move': 'prev',
          disabled: state.d08Pos <= 0,
          on: {
            pointerdown: function (ev) { if (ev.button === 0 || ev.pointerType !== 'mouse') startHold(-1); },
            click: function () {
              if (d08SkipNextClick) { d08SkipNextClick = false; return; }
              stepMove(-1);
            }
          }
        }, '← 한 칸 뒤로'),
        el('button', {
          class: 'btn brass d08-step-btn',
          'data-d08-move': 'next',
          disabled: state.d08Pos >= 4,
          on: {
            pointerdown: function (ev) { if (ev.button === 0 || ev.pointerType !== 'mouse') startHold(1); },
            click: function () {
              if (d08SkipNextClick) { d08SkipNextClick = false; return; }
              stepMove(1);
            }
          }
        }, '한 칸 앞으로 →')
      ),
      el('button', {
        class: 'btn brass d04-check-btn',
        'data-action': 'd08-finish',
        disabled: !reachedAll,
        on: {
          click: function () {
            stopD08Hold();
            ctx.recordDiscovery(
              sc,
              '『탐험대 이야기』 우물물 경로 연결: 성문 곁 우물(삼하 23:15) → 물을 가져온 세 사람(분기 예상 확인) → 아둘람 굴에서 다윗의 행동(삼하 23:16–17)'
            );
            state.step = 'done';
            ctx.saveState();
            ctx.render();
          }
        }
      }, reachedAll ? '세 지점 경로를 일지에 남기기 (삼하 23:13–17)' : '중간 분기 예상 후 도착 지점까지 이동해 보세요')
    );
  }

  var D09_CARDS = [
    {
      id: 'gold-silver',
      kind: '사물 카드',
      title: '금과 은',
      sub: '성전을 위해 드린 예물',
      ref: '대상 29:6–7',
      icon: 'gold'
    },
    {
      id: 'people-joy',
      kind: '단서 쪽지',
      title: '기쁜 마음으로 함께 기뻐함',
      sub: '백성의 반응 기록',
      ref: '대상 29:9',
      icon: 'person'
    }
  ];

  function getD09Card(id) {
    for (var i = 0; i < D09_CARDS.length; i++) {
      if (D09_CARDS[i].id === id) return D09_CARDS[i];
    }
    return null;
  }

  /* A11(D09): 예물 작업대 — 확인된 사물(금·은)과 가져온 이들/백성의 반응 짝짓기 (가치 순위·가격·점수 없음) */
  function renderD09Workbench(ctx, sc) {
    var state = ctx.state;
    var el = ctx.el;
    var ART = ctx.ART;
    var seed = ctx.getSeed(state, 'D09');

    if (!state.d09Slots || typeof state.d09Slots !== 'object') {
      state.d09Slots = { givers: null, joy: null };
    }

    function placeD09Card(cardId, slotKey) {
      if (!cardId || !slotKey) return;
      if (state.d09Slots.givers === cardId) state.d09Slots.givers = null;
      if (state.d09Slots.joy === cardId) state.d09Slots.joy = null;
      state.d09Slots[slotKey] = cardId;
      state.d09Pick = null;
      state.d09Msg = '';
      ctx.recordFirstAction('D09:place:' + cardId + '->' + slotKey);
      ctx.saveState();
      ctx.render();
    }

    function undoD09Slot(slotKey) {
      if (!state.d09Slots[slotKey]) return;
      state.d09Slots[slotKey] = null;
      state.d09Pick = null;
      state.d09Msg = '한 칸만 되돌렸어요.';
      ctx.saveState();
      ctx.render();
    }

    var slotsMeta = [
      { key: 'givers', head: '가져온 이들 · 지도자들', ref: '대상 29:6–7', hint: '성전을 위해 가져온 사물 카드 놓기' },
      { key: 'joy', head: '백성의 반응 · 기뻐함', ref: '대상 29:9', hint: '백성의 반응 단서 쪽지 놓기' }
    ];
    if (seed % 2 === 1) slotsMeta.reverse();

    var slotNodes = slotsMeta.map(function (sm) {
      var placedId = state.d09Slots[sm.key];
      var card = placedId ? getD09Card(placedId) : null;
      return el('div', {
        class: 'd05-order-slot' + (card ? ' filled' : ''),
        'data-d09-slot': sm.key
      },
        el('div', { class: 'd05-slot-head', text: sm.head + ' (' + sm.ref + ')' }),
        card
          ? el('div', { class: 'd04-placed-wrap' },
              el('div', { class: 'd05-slot-placed', 'data-d09-placed': sm.key, 'data-d09-card-val': card.id },
                el('span', { class: 'd04-chip-owner', text: card.title }),
                el('span', { class: 'd04-chip-ref', text: card.ref })
              ),
              el('button', {
                class: 'd04-undo-btn',
                'data-d09-undo': sm.key,
                on: { click: function () { undoD09Slot(sm.key); } }
              }, '한 장 되돌리기')
            )
          : el('button', {
              class: 'd04-drop-btn' + (state.d09Pick ? ' ready' : ''),
              'data-d09-slot-btn': sm.key,
              on: {
                click: function () {
                  if (state.d09Pick) placeD09Card(state.d09Pick, sm.key);
                  else {
                    state.d09Msg = '아래 카드 두 장 중 어느 것이든 먼저 눌러 고른 뒤 이 칸에 놓아 보세요.';
                    ctx.render();
                  }
                }
              }
            }, state.d09Pick ? ('여기에 \'' + getD09Card(state.d09Pick).title + '\' 놓기') : sm.hint)
      );
    });

    var unplaced = D09_CARDS.filter(function (c) {
      return state.d09Slots.givers !== c.id && state.d09Slots.joy !== c.id;
    });
    if (seed % 2 === 1) unplaced.reverse();

    var cardNodes = unplaced.map(function (c) {
      var picked = state.d09Pick === c.id;
      return el('button', {
        class: 'd04-tag-chip' + (picked ? ' picked' : ''),
        'data-d09-card': c.id,
        'aria-pressed': String(picked),
        on: {
          click: function () {
            state.d09Pick = picked ? null : c.id;
            state.d09Msg = '';
            ctx.recordFirstAction('D09:pick:' + c.id);
            ctx.render();
          }
        }
      },
        el('span', { class: 'fold-icon', html: ART.icon(c.icon) }),
        el('span', { class: 'd04-chip-owner', text: c.title }),
        el('span', { class: 'd04-chip-ref', text: c.kind + ' · ' + c.ref })
      );
    });

    var bothPlaced = !!(state.d09Slots.givers && state.d09Slots.joy);

    return el('section', {
      class: 'notebook-map d05-hebron-board',
      'data-d09-board': 'true',
      'data-d09-seed': String(seed)
    },
      el('div', { class: 'one-line-guide', text: '『탐험대 이야기』 예물 작업대에서 금·은 사물 카드와 백성의 반응 쪽지를 어느 쪽부터든 옮겨 짝지어 보자.' }),
      el('div', { class: 'd05-order-slots' }, slotNodes),
      el('div', { class: 'd04-tag-tray', 'data-d09-tray': 'true' },
        cardNodes.length ? cardNodes : el('span', { class: 'd04-tray-hint', text: '두 카드를 모두 놓았어요. 짝짓기를 확인해 보세요.' })
      ),
      state.d09Msg ? el('div', { class: 'order-msg', 'data-d09-msg': 'true', text: state.d09Msg }) : null,
      el('button', {
        class: 'btn brass d04-check-btn',
        'data-action': 'd09-check',
        disabled: !bothPlaced,
        on: {
          click: function () {
            if (state.d09Slots.givers === 'gold-silver' && state.d09Slots.joy === 'people-joy') {
              ctx.recordDiscovery(
                sc,
                '『탐험대 이야기』 예물 작업대 짝짓기 완료: 지도자들이 드린 금과 은(대상 29:6–7) · 백성의 기쁨(대상 29:9)'
              );
              state.step = 'done';
              state.d09Msg = '';
              ctx.saveState();
              ctx.render();
            } else {
              state.d09Msg = '짝이 서로 바뀌었어요. 대상 29:6–7(금과 은)과 대상 29:9(백성의 기쁨)을 다시 살펴보세요.';
              ctx.render();
            }
          }
        }
      }, '예물 작업대 확인하기 (대상 29:6–9)')
    );
  }

  window.BO_DAVID.boards = {
    renderD04Compare: renderD04Compare,
    renderD05Hebron: renderD05Hebron,
    renderD06Notebook: renderD06Notebook,
    renderD08Path: renderD08Path,
    renderD09Workbench: renderD09Workbench
  };
})();
