// 내용이 세로로 길면 읽을 수 있도록 움직인 뒤 살핀다. 가로 넘침은 허용하지 않는다.
function layoutIssues(selector) {
  const problems = new Set();
  const screen = document.querySelector(selector);
  const controls = [...screen.querySelectorAll('button, input, textarea')];
  const viewport = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
  const scrollValues = new Map();
  const tolerance = 2;
  const label = (el) => (el.getAttribute('aria-label') || el.textContent || el.className).trim().slice(0, 36);

  function clipChain(el) {
    const clips = [];
    for (let parent = el.parentElement; parent; parent = parent.parentElement) {
      const { overflowX, overflowY } = getComputedStyle(parent);
      if (overflowX === 'visible' && overflowY === 'visible') continue;
      const { x, y } = parent.getBoundingClientRect();
      const left = x + parent.clientLeft;
      const top = y + parent.clientTop;
      clips.push({ parent, overflowX, overflowY, left, top,
        right: left + parent.clientWidth, bottom: top + parent.clientHeight });
    }
    return clips;
  }

  function visibleBox(el) {
    const r = el.getBoundingClientRect();
    const box = { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    for (const clip of [...clipChain(el), viewport]) {
      if (clip.overflowX !== 'visible') {
        box.left = Math.max(box.left, clip.left);
        box.right = Math.min(box.right, clip.right);
      }
      if (clip.overflowY !== 'visible') {
        box.top = Math.max(box.top, clip.top);
        box.bottom = Math.min(box.bottom, clip.bottom);
      }
    }
    return box;
  }

  for (const control of controls) {
    const box = control.getBoundingClientRect();
    if (!box.width || !box.height) continue;
    const scroll = clipChain(control).find(({ parent, overflowY }) =>
      ['auto', 'scroll'].includes(overflowY) && parent.scrollHeight > parent.clientHeight + 1);
    if (scroll) {
      if (!scrollValues.has(scroll.parent)) scrollValues.set(scroll.parent, scroll.parent.scrollTop);
      scroll.parent.scrollTop += (box.top + box.bottom - scroll.top - scroll.bottom) / 2;
    }

    const r = control.getBoundingClientRect();
    const visible = visibleBox(control);
    if (r.width - (visible.right - visible.left) > tolerance ||
        r.height - (visible.bottom - visible.top) > tolerance) {
      problems.add(`조작 항목이 잘림 · ${label(control)}`);
    } else if (!control.disabled) {
      // 원형 단서에서도 영역 안쪽의 중심과 네 방향을 실제로 누를 수 있어야 한다.
      const uncovered = [[.5, .5], [.18, .5], [.82, .5], [.5, .18], [.5, .82]]
        .every(([x, y]) => control.contains(document.elementFromPoint(r.left + r.width * x, r.top + r.height * y)));
      if (!uncovered) problems.add(`조작 항목이 가려짐 · ${label(control)}`);
    }

    for (const other of controls) {
      if (other === control) continue;
      const v = visibleBox(other);
      const overlapX = Math.min(visible.right, v.right) - Math.max(visible.left, v.left);
      const overlapY = Math.min(visible.bottom, v.bottom) - Math.max(visible.top, v.top);
      if (overlapX > tolerance && overlapY > tolerance) {
        problems.add(`조작 항목이 겹침 · ${[label(control), label(other)].sort().join(' / ')}`);
      }
    }
  }
  for (const [element, top] of scrollValues) element.scrollTop = top;

  const walker = document.createTreeWalker(screen, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = node.parentElement;
    if (!node.textContent.trim() || el.closest('svg')) continue;
    const folded = el.closest('details:not([open])');
    if (folded && !folded.querySelector('summary').contains(el)) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const clips = [...clipChain(node), viewport];
    for (const line of range.getClientRects()) {
      for (const clip of clips) {
        if (clip.overflowX !== 'visible' &&
            (line.left < clip.left - tolerance || line.right > clip.right + tolerance)) {
          problems.add(`글이 좌우로 잘림 · ${node.textContent.trim().slice(0, 36)}`);
        }
      }
      for (const clip of clips) {
        if (clip.overflowY === 'visible') continue;
        const scrolls = ['auto', 'scroll'].includes(clip.overflowY);
        const top = clip.top - (scrolls ? clip.parent.scrollTop : 0);
        const bottom = scrolls ? top + clip.parent.scrollHeight : clip.bottom;
        if (line.top < top - tolerance || line.bottom > bottom + tolerance ||
            line.height > clip.bottom - clip.top + tolerance) {
          problems.add(`글이 위아래로 잘림 · ${node.textContent.trim().slice(0, 36)}`);
        }
        if (scrolls) break;
      }
    }
  }
  return [...problems];
}

module.exports = layoutIssues;
