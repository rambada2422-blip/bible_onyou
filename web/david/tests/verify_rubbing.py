"""D04 탁본 · 실제 손가락 자국 복원, 두 천의 근거와 일지, 이전 장면 연결."""
from http.server import ThreadingHTTPServer
from threading import Thread

from playwright.sync_api import expect, sync_playwright
from verify_field import LEGACY
from verify_restore import Quiet


def play(browser, url, legacy=False):
    context = browser.new_context(viewport={'width': 320, 'height': 568}, has_touch=True,
                                  is_mobile=True, reduced_motion='reduce', offline=url.startswith('file:'))
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(url)
    if legacy:
        page.evaluate(LEGACY)
        page.reload()
        page.locator('[data-scene="D04"]').press('Enter')
        page.locator('[data-action="open-rubbing"]').press('Enter')
    else:
        page.locator('[data-field-start="D04"]').tap()

    def read_run():
        return page.evaluate('BO_DAVID.debug.state().rubbing')

    def band(i):
        return page.locator(f'[data-rub-band="{i}"]')

    def fill():
        for i in range(3):
            button = band(i)
            if button.is_visible() and button.is_enabled():
                if legacy:
                    button.press('Space')
                else:
                    button.tap()

    def mask_samples(canvas):
        return canvas.evaluate("""c => {
          const data = c.getContext('2d').getImageData(0,0,c.width,c.height).data;
          return Array.from({length:144}, (_,i) => {
            const x = (i%12+.5)*c.width/12, y = (Math.floor(i/12)+.5)*c.height/12;
            return data[(y*c.width+x)*4+3];
          });
        }""")

    canvas = page.locator('.rub-work > .rub-paper canvas')
    box = canvas.bounding_box()
    assert box['y'] > 0 and box['y'] + box['height'] < 568
    if legacy:
        band(1).press('Enter')
        expect(band(1)).to_be_disabled()
    else:
        # Cross the paper in one real touch gesture.
        cdp = context.new_cdp_session(page)
        for i in range(9):
            point = {'x': box['x'] + (.1 + i * .1) * box['width'], 'y': box['y'] + box['height'] * .45}
            cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove' if i else 'touchStart', 'touchPoints': [point]})
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
    first_marks = read_run()['marks']['robe']
    assert 15 <= len(first_marks) < 105
    alpha = mask_samples(canvas)
    assert min(alpha) == 0 and max(alpha) == 255
    page.set_viewport_size({'width':640, 'height':360})
    page.reload()
    page.locator('[data-action="home"]').click()
    page.locator('[data-field-start="D04"]').click()
    assert read_run()['marks']['robe'] == first_marks and mask_samples(canvas) == alpha
    fill()
    expect(page.locator('.field-feedback')).to_contain_text('삼상 18:4')
    page.locator('[data-action="next-rubbing"]').click()
    band(1).click()
    page.reload()
    expect(page.locator('.rub-counter')).to_have_text('둘째 장')
    expect(band(1)).to_be_disabled()
    fill()
    expect(page.locator('.rub-prints figcaption').last).to_contain_text('삼상 24:4, 11')
    expect(page.locator('.robe-question h3')).to_be_focused()
    page.locator('[data-choice="jonathan-robe"]').click()
    page.reload()
    page.locator('[data-action="retry-choice"]').click()
    expect(page.locator('.rub-percent')).to_be_hidden()
    page.locator('[data-choice="saul-hem"]').click()
    expect(page.locator('[data-discovery="D04"]')).to_be_visible()
    saved = read_run()
    page.locator('[data-action="open-journal"]').click()
    expect(page.locator('[data-journal-id]')).to_have_count(9 if legacy else 1)
    entry = page.locator('[data-journal-id="D04"]')
    expect(entry.locator('.ref')).to_have_text('삼상 24:8–12')
    entry.locator('summary').click()
    expect(entry.locator('.rub-prints figure')).to_have_count(2)
    expect(entry.locator('.rub-prints strong').first).to_have_text('요나단의 겉옷')
    assert page.evaluate('BO_DAVID.debug.state().journal.D04.rubbings.marks') == saved['marks']
    for i, specimen in enumerate(['robe', 'hem']):
        alpha = mask_samples(entry.locator('canvas').nth(i))
        assert {cell for cell, opacity in enumerate(alpha) if opacity == 0} == set(saved['marks'][specimen])

    page.goto(url + '#engedi-rubbing')
    expect(page).to_have_url(url)
    assert read_run()['first'] == 'hem'
    expect(page.locator('.rub-percent')).to_have_text('0%')
    fill()
    expect(page.locator('.field-feedback')).to_contain_text('사울의 겉옷 자락')
    page.locator('[data-action="next-rubbing"]').click()
    film = page.locator('.lookout-film')
    film.locator('summary').click()
    film.locator('video').evaluate('v => v.play()')
    page.wait_for_function("document.querySelector('video').currentTime > .1")
    assert film.locator('video').evaluate('v => v.videoWidth === 576 && v.duration === 6')
    film.locator('summary').click()
    expect(film.locator('video')).to_have_js_property('paused', True)
    assert page.evaluate('BO_DAVID.debug.state().journal.D04.rubbings.marks') == saved['marks']
    assert not errors, errors
    context.close()


def continue_from_robe(browser, url):
    page = browser.new_page()
    page.goto(url + '#robe-puzzle')
    for i in [1,2,2,3,3,3]:
        page.locator(f'[data-robe-piece="{i}"]').click()
    page.locator('[data-choice="self-robe"]').click()
    page.locator('[data-d03-entry="gift"]').click()
    page.locator('[data-order-id="farewell"]').click()
    page.locator('[data-action="check-order"]').click()
    page.locator('[data-action="next-scene"]').click()
    expect(page.locator('[data-field="D04"]')).to_be_visible()
    assert page.evaluate('!!BO_DAVID.debug.state().journal.D03.robePicture')
    page.close()


if __name__ == '__main__':
    with ThreadingHTTPServer(('127.0.0.1', 0), Quiet) as server:
        Thread(target=server.serve_forever, daemon=True).start()
        url = f'http://127.0.0.1:{server.server_port}/web/david/'
        with sync_playwright() as p:
            browser = p.chromium.launch()
            play(browser, url)
            play(browser, url, legacy=True)
            continue_from_robe(browser, url)
            browser.close()
        server.shutdown()
    print('D04 탁본 · 터치 자국, 복원, 키보드, 두 장절, 그림 일지, 재도전, D03 연결, 영상 통과')
