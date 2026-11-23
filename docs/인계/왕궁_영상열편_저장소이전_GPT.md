# 모세와 바로 게임의 영상 열 편

게임 브랜치는 `gpt/nile-skiff`, 기능 커밋은 `d46850e`다. 열 편 모두 [videos/exodus-palace](../../videos/exodus-palace)에 일반 Git 파일로 보관했다. 각 파일은 기존 게임에서 상영하던 힉스필드 1080p 원본과 SHA-256 및 크기가 일치한다. 합계는 162,765,856바이트다. 열 편의 영상과 소리를 처음부터 끝까지 디코딩했다.

| 장 | 영상 | 장 | 영상 |
|---|---|---|---|
| 1 | [피로 변한 나일강](../../videos/exodus-palace/01.mp4) | 6 | [종기](../../videos/exodus-palace/06.mp4) |
| 2 | [개구리](../../videos/exodus-palace/02.mp4) | 7 | [우박](../../videos/exodus-palace/07.mp4) |
| 3 | [이](../../videos/exodus-palace/03.mp4) | 8 | [메뚜기](../../videos/exodus-palace/08.mp4) |
| 4 | [파리 떼](../../videos/exodus-palace/04.mp4) | 9 | [흑암](../../videos/exodus-palace/09.mp4) |
| 5 | [가축의 죽음](../../videos/exodus-palace/05.mp4) | 10 | [마지막 밤과 출발](../../videos/exodus-palace/10.mp4) |

원본 게임은 `web/index.html#palace`에서 열린다. `node tools/build.js`가 배포용 `dist/preview.html` 옆의 `videos/exodus-palace/`에 열 편을 복사한다. 미리보기를 다른 기기로 옮길 때는 HTML과 이 폴더를 함께 복사한다. 왕궁 대화와 세 친구의 현장 관찰은 둘 다 해당 게임과 같은 곳에서 영상을 불러온다.

## 확인한 동작

- `tools/test/full/palace-story.js`로 원본 360×640과 하위 폴더에 배포한 미리보기 844×390에서 각각 열 편 모두 재생했다. 영상의 크기·길이·주소를 확인하고 끝부분까지 이동해 실제 재생 종료 후 ‘세 친구와 현장 살펴보기’가 나타나는 것을 확인했다. 320×568에서는 영상 요청을 실패시켜 다시 불러오기와 글로 진행을 확인했다. [우박 편 실제 재생 화면](사진/왕궁_저장소영상_우박재생.png)
- `tools/test/full/palace-watch.js`로 세 친구의 ‘영상 함께 보기’에서 열 편의 종료 뒤 관찰 사진으로 돌아오는 경로, 일지와 선택 복원을 확인했다.
- 대표 전용 비공개 사이트 버전 11 배포가 성공했다. 사이트 내부 미리보기 연결은 시간 초과였다. 저장소 게임의 실제 브라우저 재생과 배포 서비스의 성공 응답을 각각 확인했다. 실물 휴대폰 및 실제 아이의 플레이는 미확인이다. [왕궁 게임](https://bible-onyou-moses-and-pharaoh.taupemast4.chatgpt.site/#palace)
- 작업 파일은 영상 열 편, `web/js/palace-story.js`, `tools/build.js`, 테스트용 서버와 왕궁 재생·관찰 검사, 이 기록과 화면 사진이다. 대표 승인 뒤 총괄이 병합한다.

## 전체 점검

`node tools/check.js --full`의 마지막 두 줄이다.

```text
점검 종류: 전체 · 통과 8/8
점검 결과: 합격
```
