#!/usr/bin/env python3
"""다윗 회귀 검사: 장면 복원(A18), D02 사진기와 수첩(A41~A42), 옛 9/9 일지"""
import threading
import http.server
import os
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))


class Quiet(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, format, *args):
        pass


def main():
    httpd = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Quiet)
    port = httpd.server_address[1]
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    url = f'http://127.0.0.1:{port}/web/david/'

    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={'width': 360, 'height': 640})
        page = ctx.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))

        def check_reload_rotate_tab(check_fn, label):
            # 1) Rotate to landscape 640x360
            page.set_viewport_size({'width': 640, 'height': 360})
            check_fn(f'{label}:rotate')
            # 2) Open another tab and switch back (tab switch)
            tab2 = ctx.new_page()
            tab2.goto('about:blank')
            tab2.close()
            page.bring_to_front()
            # 3) Reload in portrait 360x640
            page.set_viewport_size({'width': 360, 'height': 640})
            page.reload()
            check_fn(f'{label}:reload')

        # 1) D01 mid-zoom restore
        page.goto(url)
        page.evaluate("localStorage.clear()")
        page.reload()
        page.click('[data-scene="D01"]')
        page.click('[data-d01-cover="horn"]')
        check_reload_rotate_tab(
            lambda tag: _assert(page.locator('[data-d01-zoom="horn"]').is_visible(), f'{tag} D01 zoom lost'),
            'D01'
        )

        # 2) D04 mid-placement & mono trace restore
        page.click('[data-action="home"]')
        page.click('[data-scene="D04"]')
        page.click('[data-d04-tag="jonathan"]')
        page.click('[data-d04-slot-btn="jonathan"]')
        page.click('[data-action="d04-toggle-mono"]')
        page.click('[data-d04-trace-btn="trim"]')
        check_reload_rotate_tab(
            lambda tag: _assert(
                page.locator('[data-d04-placed="jonathan"]').is_visible()
                and page.locator('[data-d04-trace]').get_attribute('data-d04-trace-active') == 'trim'
                and page.locator('[data-d04-trace]').get_attribute('data-d04-mono') == 'true',
                f'{tag} D04 state lost'
            ),
            'D04'
        )

        # 3) D05 mid-order restore
        page.click('[data-action="home"]')
        page.click('[data-scene="D05"]')
        page.click('[data-d05-wing="elders"]')
        page.click('[data-d05-put="elders:1"]')
        check_reload_rotate_tab(
            lambda tag: _assert(
                page.evaluate("window.BO_DAVID.debug.state().d05Order")[1] == 'elders',
                f'{tag} D05 order lost'
            ),
            'D05'
        )

        # 4) D06 mid-path restore
        page.click('[data-action="home"]')
        page.click('[data-scene="D06"]')
        page.click('[data-d06-path="place"]')
        check_reload_rotate_tab(
            lambda tag: _assert(
                page.locator('[data-d06-board]').get_attribute('data-d06-first') == 'tent',
                f'{tag} D06 path lost'
            ),
            'D06'
        )

        # 5) D08 mid-branch restore
        page.click('[data-action="home"]')
        page.click('[data-scene="D08"]')
        page.click('[data-d08-move="next"]')
        page.click('[data-d08-move="next"]')
        check_reload_rotate_tab(
            lambda tag: _assert(
                page.locator('[data-d08-board]').get_attribute('data-d08-pos') == '2',
                f'{tag} D08 pos lost'
            ),
            'D08'
        )

        # 6) D09 mid-coop privacy shield restore (turn=1, no leak after reload)
        page.click('[data-action="home"]')
        page.click('[data-scene="D09"]')
        page.click('[data-d09-mode="coop"]')
        page.click('[data-d09-coop-pick="gold-silver"]')
        page.click('[data-action="d09-pass"]')
        check_reload_rotate_tab(
            lambda tag: _assert(
                page.locator('[data-d09-shield="true"]').is_visible()
                and '금과 은' not in page.locator('[data-d09-shield="true"]').inner_text(),
                f'{tag} D09 shield lost or leaked'
            ),
            'D09'
        )

        # 7) Legacy 9/9 journal schema compatibility (no loss, no duplication)
        page.evaluate("""() => {
          const legacyJournal = {};
          window.BO_DAVID.data.scenes.forEach(sc => {
            legacyJournal[sc.id] = { id: sc.id, title: sc.title, ref: sc.ref, discovery: sc.discovery };
          });
          localStorage.setItem('bibleOnyou.david.v1', JSON.stringify({
            view: 'journal',
            journal: legacyJournal
          }));
        }""")
        page.reload()
        _assert(page.locator('[data-journal-id]').count() == 9, 'Legacy 9/9 journal count != 9')
        # Re-open D01 and complete again -> still exactly 9 entries (no duplicate)
        page.click('[data-reopen="D01"]')
        page.click('[data-d01-cover="shepherd"]')
        page.click('[data-action="d01-bring-journal"]')
        page.click('[data-action="open-journal"]')
        _assert(page.locator('[data-journal-id]').count() == 9, 'Journal duplicated after replay')
        _assert(len(errors) == 0, f'Page errors: {errors}')
        ctx.close()
        verify_brook_camera(browser, url)
        browser.close()
    httpd.shutdown()
    print('A18 RESTORE & LEGACY 9/9 REGRESSION CHECK PASSED')
    print('A41–A42 D02 CAMERA, ALBUM & REPLAY CHECK PASSED')


def verify_brook_camera(browser, url):
    mobile = browser.new_context(viewport={'width': 320, 'height': 568}, has_touch=True, is_mobile=True)
    page = mobile.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(url)
    page.tap('[data-action="quick-trial"]')
    preview = page.locator('.brook-viewfinder')
    shutter = page.locator('[data-action="d02-shutter"]')
    left = page.locator('[data-brook-move="left"]')
    right = page.locator('[data-brook-move="right"]')
    _assert(preview.get_attribute('data-brook-position') == '1', 'Fresh camera did not start in the middle')
    shutter_box = shutter.bounding_box()
    _assert(shutter_box['y'] + shutter_box['height'] <= 568, 'Shutter is below the first phone screen')

    left.tap()
    _assert(preview.get_attribute('data-brook-position') == '0', 'A short tap did not move exactly one place')
    first_crop = preview.locator('svg').get_attribute('viewBox')
    shutter.tap()
    first = page.locator('[data-brook-pick="0"]')
    _assert(first.locator('svg').get_attribute('viewBox') == first_crop, 'First photo differs from the viewfinder')

    touch = mobile.new_cdp_session(page)
    box = right.bounding_box()
    point = {'x': box['x'] + box['width'] / 2, 'y': box['y'] + box['height'] / 2}
    touch.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [point]})
    page.wait_for_timeout(750)
    touch.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
    _assert(preview.get_attribute('data-brook-position') == '1', 'A long press moved more or less than one place')
    second_crop = preview.locator('svg').get_attribute('viewBox')
    shutter.tap()
    second = page.locator('[data-brook-pick="1"]')
    _assert(first_crop != second_crop and second.locator('svg').get_attribute('viewBox') == second_crop, 'Second photo is not a distinct matching crop')
    first.tap()
    _assert(first.get_attribute('aria-pressed') == 'true', 'First photo could not be selected')
    second.tap()
    _assert(second.get_attribute('aria-pressed') == 'true', 'Second photo could not be selected')

    page.set_viewport_size({'width': 640, 'height': 360})
    page.reload()
    _assert(page.locator('.brook-photo-pick').count() == 2 and second.get_attribute('aria-pressed') == 'true',
            'Photos or selection lost after rotation and reload')
    _assert(preview.get_attribute('data-brook-position') == '1', 'Camera position lost after rotation and reload')
    _assert(page.get_by_text('관찰한 돌 0 / 5', exact=True).is_visible(), 'Taking photos changed the stone count')
    _assert(page.evaluate('document.querySelector(".sheet").scrollWidth === document.querySelector(".sheet").clientWidth'), 'Camera overflows the landscape sheet')

    def finish_stones():
        for _ in range(5):
            page.locator('[data-spot-kind="stone"][aria-pressed="false"]').first.tap()
        _assert(page.locator('[data-discovery="D02"]').is_visible(), 'The five-stone game did not finish')

    finish_stones()
    _assert(page.locator('.sheet [data-brook-kept="1"]').is_visible(), 'The selected photo is missing at completion')
    page.tap('[data-action="replay-scene"]')
    _assert(page.locator('.brook-camera [data-brook-kept="1"]').is_visible(), 'The previous notebook photo is missing on replay')
    right.tap()
    shutter.tap()
    page.tap('[data-brook-pick="2"]')
    finish_stones()
    page.tap('[data-action="open-journal"]')
    journal = page.locator('[data-journal-id="D02"]')
    _assert(page.locator('[data-journal-id]').count() == 1 and journal.locator('.ref').inner_text() == '삼상 17:38–40, 45', 'D02 reference or journal count changed')
    _assert(journal.locator('[data-brook-kept="2"]').is_visible(), 'The new selection is missing from the journal')
    _assert(len(errors) == 0, f'Page errors: {errors}')
    mobile.close()

    desktop = browser.new_context(viewport={'width': 1280, 'height': 800})
    page = desktop.new_page()
    page.goto(url)
    page.click('[data-scene="D02"]')
    page.click('[data-choice="stones"]')
    shutter = page.locator('[data-action="d02-shutter"]')
    shutter.focus()
    page.keyboard.press('ArrowLeft')
    page.keyboard.press('Enter')
    _assert(page.locator('[data-brook-pick="0"]').is_visible(), 'The keyboard did not move the camera and take a photo')
    page.keyboard.press('ArrowRight')
    page.keyboard.press('Space')
    _assert(page.locator('[data-brook-pick="1"]').is_visible(), 'The keyboard lost focus during camera use')
    desktop.close()


def _assert(cond, msg):
    if not cond:
        raise AssertionError(msg)


if __name__ == '__main__':
    main()
