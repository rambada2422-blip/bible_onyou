"""D03 겉옷 그림 회전, 이어하기, 성경 물음, 기존 D03 순서 놀이와 일지."""
from http.server import ThreadingHTTPServer
from threading import Thread

from playwright.sync_api import expect, sync_playwright

from verify_field import LEGACY
from verify_restore import Quiet


def play(browser, url, legacy=False):
    context = browser.new_context(viewport={'width': 320, 'height': 568},
                                  has_touch=True, is_mobile=True, reduced_motion='reduce')
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(url)

    def activate(target):
        if legacy:
            target.press('Enter')
        else:
            target.tap()

    def action(name):
        return page.locator(f'[data-action="{name}"]')

    start = page.locator('[data-field-start="D03"]')
    if legacy:
        page.evaluate(LEGACY)
        page.reload()
        activate(page.locator('[data-scene="D03"]'))
        # The original route still completes without earning the optional picture.
        activate(page.locator('[data-choice="self-robe"]'))
        activate(page.locator('[data-d03-entry="gift"]'))
        activate(page.locator('[data-order-id="farewell"]'))
        activate(action('check-order'))
        activate(action('open-journal'))
        expect(page.locator('[data-journal-id]')).to_have_count(9)
        expect(page.locator('.robe-keepsake')).to_have_count(0)
        activate(page.locator('[data-reopen="D03"]'))
        activate(action('open-robe'))
    else:
        activate(start)

    pieces = page.locator('[data-robe-piece]')
    count = page.locator('.robe-count')
    question = page.locator('.robe-question')
    expect(count).to_have_text('1 / 4')
    expect(question).to_be_hidden()
    for box in [piece.bounding_box() for piece in pieces.all()]:
        assert box['height'] >= 44 and box['y'] + box['height'] <= 568, box
    expect(pieces.nth(0)).to_have_attribute('aria-disabled', 'true')
    activate(pieces.nth(1))
    expect(count).to_have_text('2 / 4')
    activate(pieces.nth(2))
    expect(pieces.nth(2)).to_have_attribute('aria-label', '왼쪽 아래 조각 · 270도 · 오른쪽으로 돌리기')
    compare = page.locator('.robe-compare')
    activate(compare)
    expect(pieces.nth(2)).to_be_hidden()
    expect(page.locator('.robe-reference')).to_be_visible()
    activate(compare)
    expect(pieces.nth(2)).to_be_visible()
    page.set_viewport_size({'width': 640, 'height': 360})
    page.reload()
    activate(action('home'))
    activate(start)
    expect(count).to_have_text('2 / 4')
    expect(pieces.nth(2)).to_have_attribute('aria-label', '왼쪽 아래 조각 · 270도 · 오른쪽으로 돌리기')
    for index in [2, 3, 3, 3]:
        activate(pieces.nth(index))
    expect(count).to_have_text('4 / 4')
    expect(question.locator('h3')).to_be_focused()
    activate(page.locator('[data-choice="brook-stones"]'))
    page.reload()
    expect(page.locator('[data-detour="brook-stones"]')).to_be_visible()
    activate(action('retry-choice'))
    expect(count).to_have_text('4 / 4')
    activate(page.locator('[data-choice="self-robe"]'))

    # Try the reversed order, then restore a corrected spread before claiming the picture.
    activate(action('check-order'))
    expect(page.locator('[data-d03-msg]')).to_be_visible()
    activate(page.locator('[data-d03-entry="gift"]'))
    activate(page.locator('[data-order-id="farewell"]'))
    expect(page.locator('[data-order-id]').first).to_have_attribute('data-order-id', 'gift')
    activate(action('home'))
    activate(start)
    page.reload()
    expect(page.locator('[data-order-id]').first).to_have_attribute('data-order-id', 'gift')
    activate(action('check-order'))
    expect(page.locator('[data-discovery="D03"]')).to_be_visible()
    activate(action('open-journal'))
    expect(page.locator('[data-journal-id]')).to_have_count(9 if legacy else 1)
    entry = page.locator('[data-journal-id="D03"]')
    expect(entry.locator('.ref')).to_have_text('삼상 18:1–4, 20:41–42')
    activate(entry.locator('.robe-keepsake summary'))
    assert entry.locator('.robe-keepsake img').evaluate('img => img.decode().then(() => img.naturalWidth > 0)')

    activate(action('home'))
    page.goto(url + '#robe-puzzle')
    expect(page).to_have_url(url)
    expect(count).to_have_text('1 / 4')
    expect(pieces.nth(1)).to_have_attribute('aria-disabled', 'true')
    expect(pieces.nth(0)).to_have_attribute('aria-disabled', 'false')
    film = page.locator('.lookout-film')
    activate(film.locator('summary'))
    film.locator('video').evaluate('v => v.play()')
    page.wait_for_function("document.querySelector('video').currentTime > .1")
    assert film.locator('video').evaluate('v => v.duration === 6 && v.videoWidth === 640')
    activate(film.locator('summary'))
    expect(film.locator('video')).to_have_js_property('paused', True)
    assert not errors, errors
    context.close()


if __name__ == '__main__':
    with ThreadingHTTPServer(('127.0.0.1', 0), Quiet) as server:
        Thread(target=server.serve_forever, daemon=True).start()
        with sync_playwright() as p:
            browser = p.chromium.launch()
            for legacy in [False, True]:
                play(browser, f'http://127.0.0.1:{server.server_port}/web/david/', legacy)
            browser.close()
        server.shutdown()
    print('D03 그림 퍼즐 · 터치, 키보드, 도중 복원, 성경 물음, 순서, 그림 일지, 새 배치와 영상 통과')
