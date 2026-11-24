"""다윗 현장 탐사 A43~A48 · 실제 입력, 타이머, 이전 일지와 두 번째 판."""
from http.server import ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright, expect
from verify_restore import Quiet

LEGACY = """() => {
  const journal = Object.fromEntries(BO_DAVID.data.scenes.map(sc =>
    [sc.id, {id: sc.id, title: sc.title, ref: sc.journalRef, discovery: sc.discovery}]));
  localStorage.setItem(BO_DAVID.debug.storageKey, JSON.stringify({view: 'home', journal}));
}"""


def play(browser, url, legacy):
    context = browser.new_context(viewport={'width': 320, 'height': 568}, has_touch=True,
                                  is_mobile=True, reduced_motion='reduce')
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(url)
    if legacy:
        page.evaluate(LEGACY)
        page.reload()

    def action(name):
        return page.locator(f'[data-field-action="{name}"]')

    def press(locator):
        if legacy:
            locator.press('Enter')
        else:
            locator.tap()

    def visit_home():
        press(page.locator('[data-action="home"]'))

    def finish(scene, number, ref):
        expect(page.locator(f'[data-discovery="{scene}"]')).to_be_visible()
        press(page.locator('[data-action="open-journal"]'))
        expect(page.locator('[data-journal-id]')).to_have_count(9 if legacy else number)
        entry = page.locator(f'[data-journal-id="{scene}"]')
        expect(entry.locator('.ref')).to_have_text(ref)

    press(page.locator('[data-action="quick-trial"]'))
    for run in range(2):
        if run:
            press(page.locator('[data-action="replay-scene"]'))
        press(page.locator('[data-action="d02-shutter"]'))
        press(page.locator('[data-brook-move="left"]' if run else '[data-brook-move="right"]'))
        press(page.locator('[data-action="d02-shutter"]'))
        press(page.locator('[data-brook-pick]').nth(1))
        page.reload()
        expect(page.locator('[data-brook-pick]').nth(1)).to_have_attribute('aria-pressed', 'true')
        for _ in range(5):
            press(page.locator('[data-spot-kind="stone"][aria-pressed="false"]').first)
    finish('D02', 1, '삼상 17:38–40, 45')
    visit_home()
    press(page.locator('[data-field-start="D06"]'))
    for run in range(2):
        if run:
            press(page.locator('[data-action="replay-scene"]'))
            expect(page.locator('.field-memory')).to_contain_text('왼쪽 자리 → 오른쪽 자리')
        # Enter via both existing notebook routes.
        press(page.locator('[data-d06-path="place"]' if run else '[data-d06-path="object"]'))
        press(action('side-' + str(run)))
        press(action('trace'))
        if legacy:
            page.keyboard.press('ArrowLeft' if run else 'ArrowRight')
        else:
            press(action('side-' + str(1 - run)))
        press(action('trace'))
        desk = page.locator('.overlay-desk')
        slider = page.locator('.field-overlay input')
        slider.press('Home')
        slider.press('PageUp')
        slider.press('PageUp')
        offset = slider.input_value()
        assert 0 < int(offset) < 47
        page.set_viewport_size({'width': 640, 'height': 360})
        page.reload()
        visit_home()
        press(page.locator('[data-field-start="D06"]'))
        expect(slider).to_have_value(offset)
        expect(action('side-' + str(1 - run))).to_have_attribute('aria-pressed', 'true')
        if legacy:
            for _ in range(3):
                slider.press('PageUp')
        else:
            desk.scroll_into_view_if_needed()
            box = desk.bounding_box()
            x, y, w = box['x'], box['y'] + box['height'] / 2, box['width']
            start = x + w * (.5 + (int(offset) - 50) * .0064)
            if run:
                desk.tap(position={'x': start - x, 'y': box['height'] / 2})
                desk.tap(position={'x': w / 2, 'y': box['height'] / 2})
            else:
                touch = context.new_cdp_session(page)
                def move(kind, points):
                    touch.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': points})
                move('touchStart', [{'x': start, 'y': y}])
                for step in range(1, 9):
                    move('touchMove', [{'x': start + (x + w / 2 - start) * step / 8, 'y': y}])
                    page.wait_for_timeout(20)
                page.wait_for_timeout(100)
                move('touchEnd', [])
        expect(page.locator('.field-evidence:visible')).to_contain_text('삼하 6:17')
        press(action('keep-views'))
    finish('D06', 2, '삼하 6:12–15, 17–19')
    visit_home()
    press(page.locator('[data-field-start="D09"]'))
    for run in range(2):
        if run:
            press(page.locator('[data-action="replay-scene"]'))
            expect(page.locator('.field-memory')).to_contain_text('금과 은 →')
        press(action('fit'))
        expect(action('light-0')).to_be_disabled()
        press(action('rotate'))
        press(action('rotate'))
        press(action('undo'))
        page.reload()
        press(action('fit'))
        press(action('light-' + str(run)))
        page.set_viewport_size({'width': 320, 'height': 568})
        page.reload()
        visit_home()
        press(page.locator('[data-field-start="D09"]'))
        expect(action('light-' + str(run))).to_have_attribute('aria-pressed', 'true')
        press(action('light-' + str(1 - run)))
        expect(page.locator('.field-evidence p')).to_have_count(2)
        press(action('keep-light'))
    finish('D09', 3, '대상 29:6–9')
    expect(page.locator('[data-journal-id="D09"]')).to_contain_text('기쁜 마음으로 함께 기뻐함 → 금과 은')
    visit_home()
    press(page.locator('[data-field-start="D09"]'))
    expect(page.locator('.field-memory')).to_contain_text('기쁜 마음으로 함께 기뻐함 → 금과 은')
    expect(action('rotate')).to_be_enabled()
    assert not errors, errors
    context.close()


def check_first_controls(browser, url):
    for width, height in [(320, 568), (640, 360), (1280, 800)]:
        context = browser.new_context(viewport={'width': width, 'height': height}, has_touch=True)
        page = context.new_page()
        for scene, selector in [('D02', '[data-action="d02-shutter"]'),
                                ('D06', '[data-field-action="side-1"]'),
                                ('D09', '[data-field-action="rotate"]')]:
            page.goto(url)
            home = page.locator('[data-action="home"]')
            if home.count():
                home.click()
            entry = '[data-action="quick-trial"]' if scene == 'D02' else f'[data-field-start="{scene}"]'
            page.locator(entry).click()
            control = page.locator(selector)
            box = control.bounding_box()
            assert 0 <= box['y'] and box['y'] + box['height'] <= height, (scene, width, box)
            assert control.evaluate("""e => {
              const r=e.getBoundingClientRect();
              return e.contains(document.elementFromPoint(r.x+r.width/2, r.y+r.height/2));
            }"""), (scene, 'covered control')
            if width == 1280:
                control.press('Enter')
            elif scene == 'D09':
                touch = context.new_cdp_session(page)
                point = {'x': box['x'] + box['width']/2, 'y': box['y'] + box['height']/2}
                touch.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [point]})
                page.wait_for_timeout(750)
                touch.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
                assert page.evaluate('BO_DAVID.debug.state().lamp.turn') == 1
            else:
                control.tap()
        context.close()


def check_hints(browser, url):
    for tier, times in [('t1', (10, 20, 30)), ('t2', (15, 30, 45)), ('t3', (25,))]:
        page = browser.new_page(viewport={'width': 1280, 'height': 800})
        page.goto(url)
        page.locator(f'[data-tier="{tier}"]').click()
        page.clock.install()
        page.locator('[data-field-start="D06"]').click()
        note = page.locator('.field-hint [role="status"]')
        previous, elapsed = '', 0
        for seconds in times:
            page.clock.fast_forward((seconds - elapsed) * 1000 - 900)
            expect(note).to_have_text(previous)
            page.clock.fast_forward(900)
            assert note.inner_text() and note.inner_text() != previous
            previous, elapsed = note.inner_text(), seconds
        page.clock.fast_forward(60000)
        expect(note).to_have_text(previous)
        page.locator('[data-field-action="hint"]').press('Enter')
        assert note.inner_text() != previous
        page.locator('[data-action="home"]').click()
        page.locator('[data-field-start="D09"]').click()
        page.locator('[data-field-action="rotate"]').press('Enter')
        page.clock.fast_forward(60000)
        expect(note).to_be_empty()
        page.close()


if __name__ == '__main__':
    with ThreadingHTTPServer(('127.0.0.1', 0), Quiet) as server:
        Thread(target=server.serve_forever, daemon=True).start()
        url = f'http://127.0.0.1:{server.server_port}/web/david/'
        with sync_playwright() as p:
            browser = p.chromium.launch()
            play(browser, url, False)
            play(browser, url, True)
            check_first_controls(browser, url)
            check_hints(browser, url)
            browser.close()
        server.shutdown()
    print('A43–A48 · touch, drag, keyboard, restore, two rounds, legacy 9/9 and timed hints passed')
