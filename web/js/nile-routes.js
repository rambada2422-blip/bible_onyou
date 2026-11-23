/* 빙글 도는 물길. 한 번 노를 저으면 다음 둔덕이나 나루까지 간다. */
(function () {
  'use strict';
  const directions = {
    up: {x:0, y:-1, label:'위', arrow:'↑'},
    left: {x:-1, y:0, label:'왼쪽', arrow:'←'},
    down: {x:0, y:1, label:'아래', arrow:'↓'},
    right: {x:1, y:0, label:'오른쪽', arrow:'→'}
  };
  const routes = [
    ['갈대 나루', ['D....','.....','.S#..','#L..#','..###']],
    ['모래톱 굽이', ['#....#','#.#.D.','.L#.#.','......','#..S..']],
    ['연못 사이로', ['..D...','......','.###.#','#.....','##.S.L','#....#']],
    ['저녁 등불', ['..#.###','#..D...','#.##...','#....##','....L..','.S..#..']]
  ].map(([name, rows]) => {
    const route = {name, rows};
    for (const [y, row] of rows.entries()) {
      for (const [x, tile] of Array.from(row).entries()) {
        const key = {S:'start', D:'dock', L:'lotus'}[tile];
        if (key) route[key] = {x,y};
      }
    }
    return route;
  });
  function sail(route, position, direction) {
    const vector = directions[direction];
    if (!Object.hasOwn(directions, direction) || position.arrived) return null;
    let {x, y, found} = position;
    const startX = x, startY = y;
    let arrived = false;
    while (!arrived) {
      const tile = route.rows[y + vector.y]?.[x + vector.x];
      if (!tile || tile === '#') break;
      x += vector.x;
      y += vector.y;
      found ||= tile === 'L';
      arrived = tile === 'D';
    }
    return x === startX && y === startY ? null : {x, y, found, arrived};
  }
  function start(route) { return {...route.start, found:false, arrived:false}; }
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
    const seen = new Set([position.x + ',' + position.y]);
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      for (const dir of Object.keys(directions)) {
        const next = sail(route, item.position, dir);
        if (!next) continue;
        const first = item.first || dir;
        if (next.arrived) return first;
        const key = next.x + ',' + next.y;
        if (!seen.has(key)) {
          seen.add(key);
          queue.push({position:next, first});
        }
      }
    }
    return null;
  }
  BO.nileRoutes = {routes, directions, sail, start, trace, hint};
})();
