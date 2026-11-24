"""D01 들판 망원경 · 실제 터치, 키보드, 일지와 영상 재생."""
from http.server import ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import expect, sync_playwright

from verify_field import LEGACY
from verify_restore import Quiet


def play(browser, url, legacy=False):
    context = browser.new_context(viewport={'width': 320, 'height': 568},
                                  is_mobile=True, has_touch=True, reduced_motion='reduce')
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(url)
    if legacy:
        page.evaluate(LEGACY)
        page.reload()
        page.locator('[data-scene="D01"]').press('Enter')
        page.locator('[data-action="open-pasture"]').press('Enter')
    else:
        page.locator('[data-field-start="D01"]').tap()

    count = page.locator('.meadow-count')
    lens = page.get_by_role('slider', name='들판 망원경 방향')
    log = page.locator('[data-pasture-action="observe"]')
    question = page.locator('.meadow-question')
    expect(question).to_be_hidden()
    box = log.bounding_box()
    assert box['y'] >= 0 and box['y'] + box['height'] <= 568
    expect(lens).to_have_attribute('aria-valuenow', '50')
    if legacy:
        lens.press('Space')
        lens.press('Home')
    else:
        page.locator('.meadow-lens [data-sheep="lamb"]').tap()
        expect(log).to_be_disabled()
        lens.press('Space')
        expect(count).to_have_text('1 / 3')
        # Swipe from the centre towards the right to see the left pasture.
        bounds = lens.bounding_box()
        touch = context.new_cdp_session(page)
        x = bounds['x'] + bounds['width'] * .2
        y = bounds['y'] + bounds['height'] / 2
        touch.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y}]})
        for step in range(1, 7):
            point = {'x': x + bounds['width'] * .1 * step, 'y': y}
            touch.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [point]})
        touch.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})

    expect(lens).to_have_attribute('aria-valuenow', '0')
    if legacy:
        log.press('Enter')
    else:
        log.tap()
    expect(count).to_have_text('2 / 3')
    page.set_viewport_size({'width': 640, 'height': 360})
    page.reload()
    expect(lens).to_have_attribute('aria-valuenow', '0')
    expect(count).to_have_text('2 / 3')
    page.locator('[data-action="home"]').click()
    page.locator('[data-field-start="D01"]').click()
    expect(count).to_have_text('2 / 3')
    if legacy:
        lens.press('End')
        lens.press('Enter')
    else:
        for _ in range(10):
            page.locator('[data-pasture-action="right"]').tap()
        log.tap()
    expect(count).to_have_text('3 / 3')
    expect(question.locator('h3')).to_be_focused()

    page.locator('[data-choice="jonathan-robe"]').click()
    page.reload()
    expect(page.locator('[data-detour="jonathan-robe"]')).to_be_visible()
    page.locator('[data-action="retry-choice"]').click()
    expect(question).to_be_visible()
    page.locator('[data-choice="horn"]').click()
    page.reload()
    result = page.locator('[data-discovery="D01"]')
    expect(result).to_contain_text('귀를 세운 어린양 → 풀을 뜯는 양 → 앉아 쉬는 양')
    page.locator('[data-action="open-journal"]').click()
    expect(page.locator('[data-journal-id]')).to_have_count(9 if legacy else 1)
    expect(page.locator('[data-journal-id="D01"] .ref')).to_have_text('삼상 16:11–13')

    page.locator('[data-action="home"]').click()
    page.locator('[data-field-start="D01"]').click()
    expect(count).to_have_text('0 / 3')
    expect(lens).to_have_attribute('aria-valuetext', '돌담 앞 · 앉아 쉬는 양')
    for key in ['Home', 'Space', 'End', 'Space']:
        lens.press(key)
    for _ in range(5):
        lens.press('ArrowLeft')
    lens.press('Enter')
    page.locator('[data-choice="horn"]').click()
    page.locator('[data-action="replay-pasture"]').click()
    expect(lens).to_have_attribute('aria-valuetext', '돌담 앞 · 풀을 뜯는 양')
    page.locator('summary').click()
    video = page.locator('.lookout-film video')
    video.evaluate('v => v.play()')
    page.wait_for_function("document.querySelector('video').currentTime > 0.1")
    assert video.evaluate('v => v.videoWidth === 768 && v.duration === 7')
    page.locator('summary').click()
    expect(video).to_have_js_property('paused', True)
    assert not errors, errors
    context.close()


if __name__ == '__main__':
    with ThreadingHTTPServer(('127.0.0.1', 0), Quiet) as server:
        Thread(target=server.serve_forever, daemon=True).start()
        url = f'http://127.0.0.1:{server.server_port}/web/david/'
        with sync_playwright() as p:
            browser = p.chromium.launch()
            play(browser, url)
            play(browser, url, legacy=True)
            browser.close()
        server.shutdown()
    print('D01 들판 망원경 · 터치, 키보드, 두 판, 복원, 장절, 기존 9/9 일지, 영상 통과')
