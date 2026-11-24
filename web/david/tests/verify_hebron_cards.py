"""D05 기억 카드 · 두 만남, 맞춘 순서, 새 배치와 오프라인 이어하기."""
from http.server import ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread

from playwright.sync_api import expect, sync_playwright
from verify_field import LEGACY
from verify_restore import Quiet


def card(page, kind, slot):
    return page.locator(f'.hm-card[data-kind="{kind}"][data-slot="{slot}"]')


def run_state(page):
    return page.evaluate('BO_DAVID.debug.state().hebronCards')


def play_movie(page):
    film = page.locator('.lookout-film')
    film.locator('summary').click()
    video = film.locator('video')
    video.evaluate('v => v.play()')
    page.wait_for_function("document.querySelector('video').currentTime > .1")
    assert video.evaluate('v => v.videoWidth === 560 && v.duration === 9')
    film.locator('summary').click()
    expect(video).to_have_js_property('paused', True)


def check_journal(page, total):
    expect(page.locator('[data-journal-id]')).to_have_count(total)
    album = page.locator('[data-journal-id="D05"] .hm-keepsake')
    album.locator('summary').click()
    expect(album.locator('strong')).to_have_text(['이스라엘의 장로들', '헤브론', '유다 사람들'])
    expect(album.locator('small')).to_have_text(['삼하 5:3', '삼하 2:1–4, 5:1–5', '삼하 2:4'])
    album.locator('img').evaluate_all('imgs => Promise.all(imgs.map(i => i.decode()))')


def play(browser, url, legacy=False):
    ctx = browser.new_context(viewport={'width': 320, 'height': 568}, has_touch=True,
                              is_mobile=True, reduced_motion='reduce')
    page = ctx.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(url)

    def activate(locator):
        if legacy:
            locator.press('Enter')
        else:
            locator.tap()

    def action(name):
        return page.locator(f'[data-action="{name}"]')

    def choice(name):
        return page.locator(f'[data-choice="{name}"]')

    if legacy:
        page.evaluate(LEGACY)
        page.reload()
        activate(page.locator('[data-scene="D05"]'))
        activate(choice('judah'))
        activate(choice('israel-elders-next'))
        activate(action('open-journal'))
        expect(page.locator('[data-journal-id]')).to_have_count(9)
        expect(page.locator('.hm-keepsake')).to_have_count(0)
        activate(page.locator('[data-reopen="D05"]'))
        activate(action('open-memory'))
    else:
        activate(page.locator('[data-field-start="D05"]'))
    deck = page.locator('.hm-deck')
    assert deck.evaluate('d => d.getBoundingClientRect().bottom <= innerHeight')
    expect(deck.locator('button[aria-pressed="false"]')).to_have_count(6)
    activate(card(page, 'picture', 0))
    page.reload()
    expect(card(page, 'picture', 0)).to_have_attribute('aria-pressed', 'true')
    expect(page.locator('.field-feedback')).to_contain_text('삼하 2:1–4, 5:1–5')
    activate(card(page, 'clue', 0))
    expect(action('cover-cards')).to_be_focused()
    expect(deck.locator('button:disabled')).to_have_count(6)
    page.set_viewport_size({'width': 640, 'height': 360})
    page.reload()
    activate(action('home'))
    activate(page.locator('[data-field-start="D05"]'))
    assert run_state(page)['picture'] == 'town' and run_state(page)['clue'] == 'elders'
    activate(action('cover-cards'))
    expect(card(page, 'picture', 0)).to_be_focused()
    activate(card(page, 'clue', 0))
    activate(card(page, 'picture', 2))
    expect(page.locator('.hm-count')).to_have_text('1 / 3짝')
    expect(deck.locator('button:disabled')).to_have_count(2)
    activate(card(page, 'clue', 1))
    page.reload()
    assert run_state(page)['found'] == ['elders'] and run_state(page)['clue'] == 'town'
    activate(card(page, 'picture', 0))
    activate(card(page, 'picture', 1))
    activate(card(page, 'clue', 2))
    expect(deck).to_be_hidden()
    expect(page.locator('.hm-question h3')).to_be_focused()
    expect(page.locator('.hm-question .ref')).to_have_text('삼하 2:4')
    activate(choice('elders'))
    page.reload()
    expect(page.locator('[data-detour="hebron-elders"]')).to_be_visible()
    activate(action('retry-choice'))
    expect(page.locator('.hm-count')).to_have_text('3 / 3짝')
    activate(choice('judah'))
    activate(action('home'))
    activate(page.locator('[data-field-start="D05"]'))
    page.reload()
    expect(choice('israel-elders-next')).to_be_visible()
    activate(choice('israel-elders-next'))
    expect(page.locator('[data-discovery="D05"]')).to_be_visible()
    expect(action('replay-scene')).to_have_text('기본 장면 다시 보기')
    activate(action('replay-memory'))
    expect(page.locator('.hm-count')).to_have_text('0 / 3짝')
    activate(action('journal'))
    check_journal(page, 9 if legacy else 1)
    page.goto(url + '#hebron-cards')
    expect(page).to_have_url(url)
    assert run_state(page)['layout'] == 1 and run_state(page)['found'] == []
    activate(card(page, 'picture', 0))
    activate(card(page, 'clue', 2))
    assert run_state(page)['found'] == ['elders']
    assert page.evaluate('BO_DAVID.debug.state().journal.D05.hebronMatches') == ['elders', 'town', 'judah']
    play_movie(page)
    assert not errors, errors
    ctx.close()


def continue_from_rubbing(browser, url):
    page = browser.new_page()
    page.goto(url + '#engedi-rubbing')
    for sheet in range(2):
        for band in range(3):
            page.locator(f'[data-rub-band="{band}"]').click()
        if sheet == 0:
            page.locator('[data-action="next-rubbing"]').click()
    page.locator('[data-choice="saul-hem"]').click()
    page.locator('[data-action="next-scene"]').click()
    expect(page.locator('.hm-deck')).to_be_visible()
    assert page.evaluate('!!BO_DAVID.debug.state().journal.D04.rubbings')
    page.close()


def offline(engine, path):
    url = path.resolve().as_uri()
    with TemporaryDirectory() as profile:
        errors, requests = [], []

        def open_file(fragment=''):
            ctx = engine.launch_persistent_context(profile, viewport={'width': 360, 'height': 640},
                                                   offline=True, reduced_motion='reduce')
            page = ctx.pages[0]
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.on('request', lambda r: requests.append(r.url) if not r.url.startswith(('data:', url)) else None)
            page.goto(url + fragment)
            return ctx, page

        ctx, page = open_file('#hebron-cards')
        card(page, 'picture', 2).click()
        card(page, 'clue', 0).click()
        card(page, 'clue', 1).click()
        ctx.close()
        ctx, page = open_file()
        assert run_state(page)['found'] == ['elders'] and run_state(page)['clue'] == 'town'
        card(page, 'picture', 0).click()
        card(page, 'clue', 2).click()
        card(page, 'picture', 1).click()
        play_movie(page)
        page.locator('[data-choice="judah"]').click()
        page.locator('[data-choice="israel-elders-next"]').click()
        page.locator('[data-action="open-journal"]').click()
        ctx.close()
        ctx, page = open_file()
        check_journal(page, 1)
        assert not errors and not requests, (errors, requests)
        ctx.close()


if __name__ == '__main__':
    from argparse import ArgumentParser
    parser = ArgumentParser()
    parser.add_argument('--bundle', type=Path, help='브라우저를 종료하고 다시 열어 오프라인 실행본도 검사')
    args = parser.parse_args()
    with sync_playwright() as p:
        with ThreadingHTTPServer(('127.0.0.1', 0), Quiet) as server:
            Thread(target=server.serve_forever, daemon=True).start()
            url = f'http://127.0.0.1:{server.server_port}/web/david/'
            browser = p.chromium.launch()
            play(browser, url)
            play(browser, url, legacy=True)
            continue_from_rubbing(browser, url)
            browser.close()
            server.shutdown()
        if args.bundle:
            offline(p.chromium, args.bundle)
    print('D05 헤브론 · 터치·키보드, 두 만남, 복원, 그림 일지, 새 배치, D04 연결, 영상 통과')
    if args.bundle:
        print('오프라인 단일 파일 · 브라우저 재시작, 그림·영상과 완성 일지 통과')
