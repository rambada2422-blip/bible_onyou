"""D07 왕의 식탁 그림 탐사 · 돋보기 위치, 실제 스크랩, 기존 수첩과 오프라인 복원."""
from argparse import ArgumentParser
from http.server import ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread

from playwright.sync_api import expect, sync_playwright
from verify_field import LEGACY
from verify_hebron_cards import card
from verify_restore import Quiet


def read(page):
    return page.evaluate('BO_DAVID.debug.state().tableSearch')


def action(page, name):
    return page.locator(f'[data-action="{name}"]')


def tool(page, name):
    return page.locator(f'[data-table-action="{name}"]')


def test_film(page):
    film = page.locator('.table-panel .lookout-film')
    film.locator('summary').click()
    video = film.locator('video')
    video.evaluate('v => v.play()')
    page.wait_for_function("document.querySelector('.table-panel video').currentTime > .1")
    assert video.evaluate('v => v.duration === 10 && v.videoWidth === 576')
    film.locator('summary').click()
    expect(video).to_have_js_property('paused', True)


def check_album(page, shots, total):
    expect(page.locator('[data-journal-id]')).to_have_count(total)
    album = page.locator('[data-journal-id="D07"] .table-keepsake')
    album.locator('summary').click()
    names = {'bread': '둥근 빵', 'grapes': '포도 그릇', 'cloth': '줄무늬 천'}
    expect(album.locator('.table-caption')).to_have_text([f"{i+1}. {names[s['id']]}" for i,s in enumerate(shots)])
    album.locator('img').evaluate_all('imgs => Promise.all(imgs.map(img => img.decode()))')
    for i, shot in enumerate(shots):
        # Each journal crop points to the child's actual capture, including off-centre shots.
        crop = album.locator('.table-crop img').nth(i)
        assert crop.evaluate("""img => ['--table-x', '--table-y'].map(p =>
            parseFloat(getComputedStyle(img).getPropertyValue(p)))""") == [shot['x'], shot['y']]
    assert page.evaluate('BO_DAVID.debug.state().journal.D07.tablePictures') == shots


def source_game(browser, url, legacy=False):
    ctx = browser.new_context(viewport={'width': 320, 'height': 568}, has_touch=True, is_mobile=True, reduced_motion='reduce')
    page = ctx.new_page()
    errors = []
    page.on('pageerror', lambda err: errors.append(str(err)))
    page.goto(url)

    def press(locator):
        if legacy:
            locator.press('Enter')
        else:
            locator.tap()

    if legacy:
        page.evaluate(LEGACY)
        page.reload()
        press(page.locator('[data-scene="D07"]'))
        expect(page.locator('[data-notebook-map="D07"]')).to_be_visible()
        press(action(page, 'open-table'))
    else:
        press(page.locator('[data-field-start="D07"]'))

    board = page.locator('.table-board')
    expect(page.locator('.table-question')).to_be_hidden()
    assert tool(page, 'take').bounding_box()['y'] + tool(page, 'take').bounding_box()['height'] <= 568
    press(tool(page, 'take'))
    assert not read(page)['shots']
    if legacy:
        press(tool(page, 'move'))
        board.press('ArrowRight')
        board.press('Enter')
        assert read(page)['shots'] == [{'id': 'bread', 'x': 23, 'y': 67}]
    else:
        touch = ctx.new_cdp_session(page)
        box = board.bounding_box()
        for step in range(9):
            x = box['x'] + box['width'] * (.50 + .30*step/8)
            y = box['y'] + box['height'] * (.45 + .21*step/8)
            touch.send('Input.dispatchTouchEvent', {'type': 'touchMove' if step else 'touchStart',
                                                     'touchPoints': [{'x': x, 'y': y}]})
        touch.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
        press(tool(page, 'take'))
        assert read(page)['shots'] == [{'id': 'grapes', 'x': 80, 'y': 66}]
    before = read(page)
    press(tool(page, 'take'))
    expect(page.locator('.field-feedback')).to_contain_text('이미')
    page.set_viewport_size({'width': 740, 'height': 414})
    page.reload()
    press(action(page, 'home'))
    press(page.locator('[data-field-start="D07"]'))
    assert read(page) == before
    expect(board).to_have_css('--table-x', f"{before['x']}%")
    expect(board).to_have_css('--table-y', f"{before['y']}%")
    for _ in range(2):
        press(tool(page, 'move'))
        press(tool(page, 'take'))
    shots = read(page)['shots']
    expect(page.locator('.table-count')).to_have_text('3 / 3장')
    expect(page.locator('.table-question h3')).to_be_focused()
    assert len({s['id'] for s in shots}) == 3
    press(page.locator('[data-choice="jonathan"]'))
    page.reload()
    expect(page.locator('[data-detour="jonathan-robe"]')).to_be_visible()
    press(action(page, 'retry-choice'))
    expect(page.locator('.table-question')).to_be_visible()
    press(page.locator('[data-choice="mephibosheth"]'))
    expect(page.locator('[data-discovery="D07"]')).to_be_visible()
    press(action(page, 'replay-table'))
    expect(page.locator('.table-count')).to_have_text('0 / 3장')
    press(action(page, 'journal'))
    check_album(page, shots, 9 if legacy else 1)
    page.goto(url + '#royal-table')
    expect(page).to_have_url(url)
    assert not read(page)['shots']
    test_film(page)
    assert page.evaluate('BO_DAVID.debug.state().journal.D07.tablePictures') == shots
    assert not errors, errors
    ctx.close()


def from_procession(browser, url):
    page = browser.new_page()
    page.goto(url + '#hebron-cards')
    for picture, clue in [(0, 1), (1, 2), (2, 0)]:
        card(page, 'picture', picture).click()
        card(page, 'clue', clue).click()
    page.locator('[data-choice="judah"]').click()
    page.locator('[data-choice="israel-elders-next"]').click()
    action(page, 'next-scene').click()
    page.locator('[data-field-action="trace"]').click()
    page.locator('[data-field-action="side-1"]').click()
    page.locator('[data-field-action="trace"]').click()
    slider = page.locator('.field-overlay input')
    slider.press('Home')
    for _ in range(5):
        slider.press('PageUp')
    page.locator('[data-field-action="keep-views"]').click()
    action(page, 'next-scene').click()
    expect(page.locator('.table-board')).to_be_visible()
    assert page.evaluate('!!BO_DAVID.debug.state().journal.D06.fieldNote')
    assert page.evaluate('BO_DAVID.debug.state().journal.D05.hebronMatches') == ['town', 'judah', 'elders']
    page.close()


def offline(engine, file):
    url = file.resolve().as_uri()
    with TemporaryDirectory() as profile:
        errors, external = [], []
        def reopen(fragment=''):
            ctx = engine.launch_persistent_context(profile, offline=True, reduced_motion='reduce')
            page = ctx.pages[0]
            page.on('request', lambda req: external.append(req.url) if not req.url.startswith((url, 'data:')) else None)
            page.on('pageerror', lambda err: errors.append(str(err)))
            page.goto(url + fragment)
            return ctx, page

        ctx, page = reopen('#royal-table')
        tool(page, 'move').click()
        tool(page, 'take').click()
        tool(page, 'move').click()
        state = read(page)
        ctx.close()
        ctx, page = reopen()
        assert state == read(page)
        tool(page, 'take').click()
        tool(page, 'move').click()
        tool(page, 'take').click()
        shots = read(page)['shots']
        test_film(page)
        page.locator('[data-choice="mephibosheth"]').click()
        action(page, 'open-journal').click()
        ctx.close()
        ctx, page = reopen()
        check_album(page, shots, 1)
        assert not errors and not external, (errors, external)
        ctx.close()


if __name__ == '__main__':
    parser = ArgumentParser()
    parser.add_argument('--bundle', type=Path)
    args = parser.parse_args()
    with sync_playwright() as p:
        with ThreadingHTTPServer(('127.0.0.1', 0), Quiet) as server:
            Thread(target=server.serve_forever, daemon=True).start()
            url = f'http://127.0.0.1:{server.server_port}/web/david/'
            browser = p.chromium.launch()
            source_game(browser, url)
            source_game(browser, url, legacy=True)
            from_procession(browser, url)
            browser.close()
            server.shutdown()
        if args.bundle:
            offline(p.chromium, args.bundle)
            print('오프라인 실행본 · 브라우저 재시작, 수첩 그림 복원, 10초 영상 통과')
    print('D07 왕의 식탁 · 드래그·키보드, 겹치는 기록 방지, 복원, 그림 일지, D06 연결, 9/9 일지 통과')
