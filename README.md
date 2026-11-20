# bible_onyou

성경의 장소를 탐험하는 휴대폰용 스토리 RPG (8~19세). 현재 단계는 출애굽기 시범판.

## 문서

- [AGENTS.md](AGENTS.md): 어느 AI든 가장 먼저 읽는 공통 안내
- [docs/06_진행판.md](docs/06_진행판.md): 지금 상태와 다음 할 일
- [docs/00_공통규칙서.md](docs/00_공통규칙서.md): 모든 작업 전에 읽는 기준 문서
- [docs/01_출애굽기_장면목록.md](docs/01_출애굽기_장면목록.md): 장면별 근거 장절과 감수 필수 여부
- [docs/02_그림_스타일가이드.md](docs/02_그림_스타일가이드.md): 그림 규칙과 파일 규격

## 시범 화면

`web/` 폴더가 게임 화면이다. 설치할 것 없이 `web/index.html`을 브라우저로 열면 된다.

| 위치 | 내용 |
|---|---|
| `web/js/content.js` | 장면 대본, 질문, 정답 장절 (나이 단계별) |
| `web/js/app-core.js`, `web/js/app-questions.js`, `web/js/app-scene.js`, `web/js/app.js` | 저장·공통 도구, 물음·시대 단서, 장면 진행, 시작·시간표·일지·안내 |
| `web/css/app.css` | 화면 디자인 |
| `web/assets/` | 배경 그림과 캐릭터 그림 (SVG. 대표가 승인한 사진형 배경은 JPG·PNG, 그림 스타일 가이드 5.2절) |
| `web/js/art.js` | 그림을 한 파일로 묶은 것. 직접 고치지 않는다 |

그림을 바꾼 뒤에는 묶음 파일을 다시 만든다.

```bash
node tools/build.js
```

이 명령은 `dist/preview.html`(한 파일짜리 미리보기)도 함께 만든다.

## 3D 한 장면 샘플

`web3d/` 폴더는 떨기나무 장면을 3D로 만든 샘플이다. 주인공을 직접 움직여 탐험하는 구조를 확인하기 위한 것이며, 그래픽은 코드로 만든 단순한 3D다. `web3d/index.html`을 브라우저로 열면 된다.

| 위치 | 내용 |
|---|---|
| `web3d/js/world.js` | 지형, 하늘, 빛, 소품 배치 |
| `web3d/js/models.js` | 세 아이, 모세, 양, 떨기나무, 타임머신 등 3D 모델 |
| `web3d/js/game.js` | 조작, 카메라, 진행, 화면 위 안내 |
| `web3d/vendor/` | three.js r128 (MIT 라이선스) |

대본은 2D 시범판과 같은 `web/js/content.js`를 쓴다. 한 파일짜리 미리보기는 아래 명령으로 만든다.

```bash
node tools/build3d.js
```

사실적 3D 외주 제작의 비용 자료는 [docs/04_외주_시세조사.md](docs/04_외주_시세조사.md)에 있다.

## 클라우드 브라우저에서 미리보기

클라우드 브라우저가 HTML 파일을 직접 열 수 없을 때는 저장소 폴더에서 두 미리보기를 만들고 로컬 웹 서버를 실행한다.

```bash
node tools/build.js
node tools/build3d.js
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

서버가 실행 중인 클라우드 컴퓨터의 Chrome 주소창에 2D는 `http://127.0.0.1:4173/preview.html`, 3D는 `http://127.0.0.1:4173/preview3d.html`을 입력한다. Codex 데스크톱 앱에서는 오른쪽 패널의 **+ → 데스크톱**에서 공유 화면을 열 수 있다. 게임 진행은 브라우저에 저장되므로 같은 브라우저에서 같은 주소로 다시 열면 이어서 탐험할 수 있다.
