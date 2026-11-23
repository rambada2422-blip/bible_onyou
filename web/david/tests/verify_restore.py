#!/usr/bin/env python3
"""다윗 A18 회귀 검사: 새 조작(D01·D04·D05·D06·D08·D09) 진행 중 새로고침·가로 회전·탭 이동 복원 및 옛 9/9 일지 열기"""
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
        browser.close()
    httpd.shutdown()
    print('A18 RESTORE & LEGACY 9/9 REGRESSION CHECK PASSED')


def _assert(cond, msg):
    if not cond:
        raise AssertionError(msg)


if __name__ == '__main__':
    main()
