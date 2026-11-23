/* 빙글 도는 물길. 한 번 노를 저으면 다음 둔덕이나 나루까지 간다. */
(function () {
  'use strict';
  const directions = {
    up: {x:0, y:-1, label:'위', arrow:'↑'},
    left: {x:-1, y:0, label:'왼쪽', arrow:'←'},
    down: {x:0, y:1, label:'아래', arrow:'↓'},
    right: {x:1, y:0, label:'오른쪽', arrow:'→'}
  };
  function makeRoute([name, rows]) {
    const route = {name, rows, wheels:[], gates:[]};
    for (const [y, row] of rows.entries()) {
      for (const [x, tile] of Array.from(row).entries()) {
        const key = {S:'start', D:'dock', L:'lotus'}[tile];
        if (key) route[key] = {x,y};
        if (tile === 'T') route.wheels.push({x,y});
        if (tile === 'A' || tile === 'B') route.gates.push({x, y, type:tile});
      }
    }
    route.paired = route.gates.some(gate => gate.type === 'B');
    return route;
  }
  const routes = [
    ['갈대 나루', ['D....','.....','.S#..','#L..#','..###']],
    ['모래톱 굽이', ['#....#','#.#.D.','.L#.#.','......','#..S..']],
    ['연못 사이로', ['..D...','......','.###.#','#.....','##.S.L','#....#']],
    ['저녁 등불', ['..#.###','#..D...','#.##...','#....##','....L..','.S..#..']]
  ].map(makeRoute);
  const locks = [
    ['갈대 수문', ['.S.T.','..#..','.....','..#.#','.L.AD']],
    ['엇갈린 두 문', ['..#.#.','T....#','.L....','S#....','#D.AB.']],
    ['두 바퀴의 나루', ['S.#...','T.#..#','..T.#D','......','..ALB#','...##.']]
  ].map(makeRoute);
  function sail(route, position, direction) {
    if (position.arrived) return null;
    if (direction === 'turn') {
      return route.rows[position.y][position.x] === 'T' ? {...position, gateOpen:!position.gateOpen} : null;
    }
    if (!Object.hasOwn(directions, direction)) return null;
    const vector = directions[direction];
    let {x, y, found} = position;
    const startX = x, startY = y;
    let arrived = false;
    while (!arrived) {
      const tile = route.rows[y + vector.y]?.[x + vector.x];
      if (!tile || tile === '#' || (tile === 'A' && !position.gateOpen) || (tile === 'B' && position.gateOpen)) break;
      x += vector.x;
      y += vector.y;
      found ||= tile === 'L';
      arrived = tile === 'D';
      if (tile === 'T') break;
    }
    return x === startX && y === startY ? null : {x, y, found, arrived, gateOpen:position.gateOpen};
  }
  function start(route) { return {...route.start, found:false, arrived:false, gateOpen:false}; }
  function trace(route, moves) {
    const positions = [start(route)];
    for (const dir of moves) {
      const next = sail(route, positions[positions.length - 1], dir);
      if (!next) break;
      positions.push(next);
    }
    return positions;
  }
  function hint(route, position) {
    const queue = [{position, first:null}];
    const stateKey = p => [p.x, p.y, p.gateOpen].join(',');
    const seen = new Set([stateKey(position)]);
    const actions = Object.keys(directions);
    if (route.wheels.length) actions.push('turn');
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      for (const dir of actions) {
        const next = sail(route, item.position, dir);
        if (!next) continue;
        const first = item.first || dir;
        if (next.arrived) return first;
        const key = stateKey(next);
        if (!seen.has(key)) {
          seen.add(key);
          queue.push({position:next, first});
        }
      }
    }
    return null;
  }
  BO.nileRoutes = {routes, locks, directions, sail, start, trace, hint};
})();
