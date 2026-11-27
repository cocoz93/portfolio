# parts/ — 조각과 갈래

`mmo.src.html`(셸)이 `<!--#include … -->` 로 이 조각들을 부르고, `build.ps1` 이 합쳐 `index.html` 을 만든다.
쪼갠 목적은 **갈래별 동시 작업**이다. 한 사람이 작업할 때는 신경 쓸 것이 없다.

## 갈래는 둘이다 (셋이 아니다)

| 갈래 | 조각 |
|---|---|
| **서버** — 설계 탭 + 병목 탭 + 핵심 최적화(병목 탭 아래 판) | `common.css` `bneck.css` `bneck-tail.css` `optimization.css` `panel-build.html` `panel-bneck.html` `panel-optimization.html` `scene.js` `wave.js` `bneck.js` `optimization.js` |
| **클라** — 1-2 맨 아래 결과 판 = 실행 화면 녹화(옛 클라이언트 2-1) | `client.css` `panel-client.html` `client-render.js` |
| **공통** — 단독 작업만 | 셸 `mmo.src.html` · `tabs.js` · 왼쪽 기둥(`common.css` 의 1280 블록) |
| **MO(녹스)** — 상위 탭 NOX 서버 | `mo.css` `panel-mo.html` `mo.js` |
| **소개 판** — 세 상위 탭의 첫 하위 탭(목록 · 그림 · 카드) + MMORPG 소개 + 슈팅 서버 판 | `intro.css` `intro.js` `panel-intro.html` `panel-shooter.html` |

MO 갈래(2026-11-17)는 위 둘과 스코프를 나누지 않는다 — `mo.js` 는 자기 IIFE 안에서 끝나고,
하위 탭 버튼은 `data-sub` 가 아니라 `data-mo` 를 써서 `tabs.js` 가 건드리지 않는다.
클래스 접두어는 `.mo-*` `.ms-*`(구조) `.mb-*`(병목) · id 는 `#mosub` `#mo-*` `#ms-*` `#mb-*`.
소개 판은 아래 소개 갈래의 `.gi-*` 를 쓴다(옛 `.mi-*`(소개) · `.mc-*`(컨텐츠)는 11-17 에 그리로 합쳤다).
그림은 `media/mo-*.jpg` 외부 파일이다(시험 캡처에서 창 테두리를 잘라 낸 1280×960).

소개 갈래(2026-11-17)는 세 상위 탭의 하위 줄을 소개 · 전체 구조 · 병목 개선 셋으로 맞추며 생겼다.
소개 판의 표는 스크립트가 아니라 **마크업**이 들고 있다 — 버튼 n번째(`.gi-it`) = 카드 n번째(`.gi-card`), 그림은 버튼의 `data-img`.
짝이 어긋나면 `intro.js` 가 콘솔 오류를 남기고 그 판을 건너뛴다. 슈팅 서버 판은 자기 스크립트가 없어 하위 줄도 `intro.js` 의 `nav[data-panes]` 가 열고,
전체 구조의 상자 고르기도 `intro.js` 의 `.ms[data-pick]` 이 한다(상자 `.nd[data-n]` = 같은 `data-n` 의 `.mo-card`). 구조도 짜임 `.ms` · `.nd` · `.mo-card` 는 `mo.css` 것을 빌려 쓴다.
슈팅 서버 그림은 `media/sh-*.jpg`(2026-11-25 다리 판 자동 촬영 1920×1080 을 자르지 않고 줄인 1280×720 — 찍은 판 · 고른 장은 `panel-shooter.html` 머리 주석).
2026-11-26 부터 개요 · 걷기 대시 · 점프대 순간이동 · 사격 · 근접은 `media/sh-*.mp4` 영상(1280×720 30fps · 4Mbps 상한)이고, 같은 이름 jpg 는 그 영상의 첫 장면이다. 수류탄만 사진 · 준비 중 딱지.
카드 안에 `.gi-sub` 가 있으면 그 단추를 고를 때 액자 왼쪽 가운데에 둥근 판이 떠서 세부를 동그란 아이콘으로 세운다(2026-11-23 슈팅 서버) — 세부마다 `data-label` · `data-img` · `data-vid`(영상) · `data-wip`(준비 중 딱지) + 아이콘 `svg`. 글 없는 카드(`.gi-bare`)는 띄우지 않는다. 짜는 법은 `intro.js` 머리 주석.
넓은 화면(1461 이상)에서 16:9 판(`.gi-over` — MMORPG · 슈팅)은 카드를 그림 오른쪽 위에 얹는다. 녹스(4:3)는 옆에 둔다(까닭은 `intro.css`).
녹스 소개 판의 「직업 소개」(2026-11-25 · 5판에서 바꿈)는 슈팅 서버 판과 같은 세부 아이콘 칸이다 — 카드 `#mo-job-card` 는 글 없는 카드(`.gi-bare`)이고 세부(`.gi-sub`) 셋이 직업마다 아이콘 · 첫 장면 · 영상을 든다(둥근 판 · 고르기 · 틀기는 `intro.js`).
직업 설명 · 서버 한 줄은 개요 카드의 `.mo-jobs` · `.sv` 로 옮겼다. 2026-11-26 부터 직업 소개 칸은 카드 칸을 감추고 영상만 크게 보인다(`mo.css` — 옛 판은 개요 카드를 옆에 세우고 `mo.js` 가 지금 편의 직업 줄을 켰다. 그 줄 켜기 · 세부 ↔ 직업 줄 짝 검사는 걷었다). `mo.js` 는 그 칸에서 액자를 16:9 로 바꾸고 영상을 되풀지 않게 한다(검게 끝남 · 아이콘을 다시 누르면 처음부터).
1280 이상에선 직업 소개 · 일반 대전 · 랭크 매칭 판이 창 높이로 폭이 묶인다(한 화면 · `mo.css`). 옛 「이어 보기」(아래 막대 `.mo-reel` · 카드 줄 `.mo-row` · 로고 표지 `.mo-cover` · 감싸개 `.mo-col`)는 걷었다.
「일반 대전」 · 「랭크 매칭」(2026-11-25)은 목록 단추의 `data-vid` 로 `intro.js` 가 트는 영상이고, `mo.js` 는 카드(`.mo-flow`)의 차례 줄(`.mo-steps button` · `data-t` = 영상 초)을 그 영상 시각에 맞춰 켠다 — 영상을 다시 뽑으면 `data-t` 와 줄의 시각 글자도 같이 고칠 것. 2026-11-26 부터 그 카드는 영상 아래 가로 펼침 띠다(흐름 카드가 보이면 `mo.css` 의 `:has` 가 판을 한 칸으로 내림 · 칸 막대 `.done` · `--p` 는 `mo.js`). 영상은 소리 없이 시작하고, 영상 카드(직업 소개 · 흐름 카드)가 보일 때만 액자의 `.mo-snd` 단추로 켠다(영상 카드를 떠나면 `mo.js` 가 다시 끈다).
MMORPG 첫 화면이 소개가 되면서 `#p-build` 는 **숨은 채 로드된다** — `wave.js` 는 등장 지연을 로드 때가 아니라 처음 보일 때(`play`) 잰다.
포폴 홈 정지 컷을 뽑는 `docs/home/sync-scene.ps1` 도 그래서 `#build` 로 연다.

왼쪽 기둥(2026-11-18)은 넓은 화면(1280 이상)에서 상위 탭 · 하위 탭 · 소개 판 목록 세 겹을 왼쪽 한 줄기(`#side`)로 보인다.
기둥은 **대리 단추**다 — `tabs.js` 끝 IIFE 가 원래 단추(`.tabrow .tab` · `.subtab` · `.gi-it`)에서 이름을 읽어 만들고,
누르면 원래 단추를 `.click()` 한다. 판 여닫기 · 주소 · 애니는 지금까지처럼 `tabs.js` · `mo.js` · `intro.js` 가 하고,
기둥은 원래 단추의 `class` 를 지켜보다(MutationObserver) 켜짐 표시만 따라간다. 원래 줄은 좁은 화면에서 그대로 쓰이므로 지우지 말 것.
MMORPG 병목 개선 아래 차례 세 칸(병목 지도 · 핵심 최적화 · 실서버 화면)은 원래 단추가 없어 기둥이 직접 판(`#p-bneck` `#p-optimization` `#p-crender`)으로
내려가고, 스크롤 위치로 켜진다. 이름과 판 id 는 같은 IIFE 의 `SECT` 표에만 있다 — 1-2 에 판을 더하거나 빼면 거기도 고칠 것.
목록(소개 판 목록 · 1-2 차례)은 켜진 상위 탭 안에서 늘 펼쳐 둔다 — 하위 탭을 바꿔도 기둥 단추가 제자리에 있게.
안 보는 하위 탭의 목록은 켜짐을 칠하지 않고, 그 칸을 누르면 하위 탭부터 연다.
켜진 프로젝트(묶음이 있는 상위 탭)는 위로 높은 띠가 되고, 띠부터 묶음 끝까지 그 프로젝트의 게임 화면 한 장이 옅게 깔린다(2026-11-24 · `.sd-cover`). 그림은 `media/side-{mmo,mo,shooter}.jpg` 이고 열쇠(원래 단추의 `data-tab`) → 파일 표는 `tabs.js` 기둥 IIFE 의 `COVER` 한 곳이다 — **상위 탭을 더하면 거기도 넣을 것**(안 넣으면 그 탭만 그림 없이 띠만 선다). 그림 상자 자리는 `cover` 가 재고(`place` 끝 · 묶음이 펴지고 접히는 동안은 ResizeObserver), 모양 · 옅기 · 고른 경위는 `common.css` `.sd-t` · `.sd-cover` 주석. 하위 탭 앞 아이콘은 같은 날 뺐다 — 파란 바탕은 글자 10px 앞부터 진다.
켜진 상위 탭을 다시 누르면 그 묶음이 접힌다(`tabs.js` 기둥 IIFE `folded` — 원래 탭은 누르지 않는다). 지금 보는 칸의 파란 바탕은 칸마다 칠하지 않고 묶음마다 하나(`.sd-ind`)를 켜진 칸 자리로 옮겨 미끄러뜨린다(`place`) — `.sd-ind` 는 묶음의 첫 자식이어야 칸 글자 밑에 칠해진다.
기둥 오른쪽 경계선은 화면 위아래 끝까지 닿는다 — `.wrap` 여백만큼 margin 을 음수로 당기고 padding 으로 돌려줘서 본문 자리는 그대로다(`common.css` 기둥 블록).
셸의 `.main` 은 넓은 화면에서 기둥 옆 칸이 되는 감싸개일 뿐 판을 숨기지 않는다.

탭 전환 페이드(2026-11-20)는 `tabs.js` 맨 끝 IIFE 다. 원래 단추를 누를 때 새로 보이게 된 판 중 가장 바깥 것만 흐리게 띄운다.
걸 판 목록(`TGT`)을 거기서 들고 있다 — **판을 더하면 거기도 넣을 것**(안 넣으면 그 판만 효과 없이 바뀐다). 병목 개선 줄기는 일부러 뺐다(펴지는 장면이 따로 있다).

설계 탭과 병목 탭은 **갈래로 못 나눈다.** 병목 지도를 그리는 코드가 씬 IIFE 안에 중첩돼 바깥 스코프
(`paintZones` `PJ` `wireify` 등)를 그대로 쓰고, `#p-bneck` 안을 열고 닫는 것도 `scene.js` 다.
실험 수치(`EXPS`)와 핀 정의(`PINS`), 노션 주소 표(`NOTION_EXP`)도 `scene.js` 에 있어서,
병목 수치 한 줄을 고치려 해도 씬 파일을 연다.

`bneck-tail.css` 는 병목 규칙인데 `client.css` **뒤**에 온다. 순서가 곧 우선순위라서 그렇다 —
같은 특이도로 겹치는 짝이 앞뒤 양쪽에 있다: `.bn-stage` grid(bneck.css ↔ bneck-tail.css, 근거는
common.css 의 "여기 두면 grid 선언보다 먼저 와서 못 이긴다") · `.cl-dash.spec`(client.css 는 6열,
bneck-tail.css 는 760px 이하 3열). 위로 올리면 좁은 화면에서 규격 칸이 6열로 남는다.
그 안 `.cl-dash.spec` 한 줄만 클라 것이다.

## 병렬 중에는 못 바꾸는 것

1. **조각 순서** — 셸이 들고 있다. `__scenePlay` 가 아직 없을 때 웨이브가 스스로 재생하는 식의
   순서 의존이 있어서, 마커 순서를 바꾸면 첫 로드 애니가 조용히 깨진다.
2. **window 훅** — `__flowStart` `__flowStop` `__flowReset` `__scenePlay` `__zoneTourArm`
   `resetZone` `playBneckIntro` `__EXPS` `__PINS` `__crenderPlay` `bneckRing`.
   (`bneckRing` 은 2026-10-29 — bneck.js 가 내놓고 scene.js 가 판을 켤 때 불러 고리를 다시 칠한다.)
   이름·인자를 바꾸려면 단독 작업으로.
   (`__bnPickLoc` 은 2026-08-04 에 없앴다 — 핀에서 클릭을 걷어내면서 부를 곳이 사라졌다.)
3. **DOM id** — `#p-intro` `#p-build` `#p-bneck` `#p-optimization` `#p-crender` `#p-mo` `#p-shooter` `#p-misc` `#scene`
   `#subtabs` `#side`. `tabs.js` 가 전부 하드코딩한다(`#side` 는 기둥 IIFE 가 `#subtabs` `#mosub` `#shsub` 와 함께 읽는다).
   (`#builddoor` 는 2026-10-27 에 없앴다 — 1-1 의 나가는 문은 `#p-build` 안 `.stage-ctl` 로 내려가 판과 함께 숨는다.
   2026-11-20 '다시 재생' 을 빼서 wave.js 는 이 줄을 더는 안 만진다. 대신 1280 이상에서 `scene.js` 가 문(`#p-build .stage-door`)을
   `#card` 맨 끝으로 옮긴다 — 그래서 문과 `#card`(그 안 `#cardbd` 만 갈아 끼운다)는 panel-build.html ↔ scene.js 의 계약이다.)
   (2026-10-23 옛 상위 탭 '클라이언트'를 없앴다 — `#p-crender` 는 1-1 구조도 아래로 옮겼다가 10-27 에 1-2 맨 아래 결과 판으로 옮겼고,
   `#p-csafe`(2-2)·`#p-cload`(2-3)·`#subtabs2`·`client.js`·`safe-scene.js`·`mmo-safe-edit.html` 은 지웠다.)
4. **마크업 계약** — 병목 탭은 셋이 물려 있다.
   - `scene.js` 가 만들고 `bneck.js` 가 읽는다: `.pin[data-loc]` 과 그 안의 `text.pin-no`
     (배지 번호는 비어 나오고, 고른 카드의 번호를 bneck.js 가 넣는다).
   - `scene.js` 가 붙이고 `bneck.js` 가 쓴다: `EXPS[].no`(카드 번호) · `EXPS[].nt`(노션 주소).
     둘 다 `NOTION_EXP` 표가 정본 — 이 표에 있는 실험만 카드로 선다.
     `EXPS[].km`(대표 지표 · null 이면 고리 없는 카드) · `EXPS[].ms`(두 줄 설명)는 `FACE` 표가 정본이다
     (값은 bm/am·ab 를 가리키기만 한다 — `_work/verify.mjs` R8 이 둘의 관계를 본다).
   - 셸이 두고 둘이 나눠 쓴다: `#bncard[hidden]`(scene.js 가 열고 닫음) · `#bnc-b`(bneck.js 가 채움).
5. **두 파일이 함께 지켜야 하는 수치** — 둘로 나뉜다.
   - *같은 값이라 한쪽만 고치면 어긋나는 것*: `1.34s`(scene.js 초 1560 · 밀리초 1671 ↔ bneck.css 145
     — scene.js 안에서도 두 벌이다) · `160ms`(common.css `.16s` ↔ wave.js `SPAN+160+100`)
   - *크기 관계라 같이 조정해야 하는 것*: 구역순회 `TOUR_HOLD 500ms`(scene.js) **>** 페이드 `.22s`(common.css) ·
     카드 짓기 `300ms`(scene.js `fillCard`) **<** 재적용 `400ms`(bneck.js) ·
     진입 끝 `BN_TOTAL 2140ms`(scene.js) **≥** 마지막 핀이 앉는 시각 `1.34s + 5×0.08s + 0.30s = 2.04s`
     (핀 지연 간격은 scene.js `animationDelay`, 드롭 길이는 common.css `bnPinDrop`).
     계수 5 는 `PINS` 배열의 마지막 인덱스다 — 자리가 여섯이던 시절엔 2.12s 였고 그때 2140 이 정해졌다.
     작으면 마지막 핀이 공중에서 규칙을 잃고 제자리로 점프한다 — 핀을 더 꽂거나 간격을 늘리면 여기부터 볼 것.
   - *왼쪽 기둥의 폭 환산* — 1280 이상에서 기둥(220) + 틈(40)이 본문을 **260px** 줄인다(`common.css` 기둥 블록).
     그래서 화면 폭을 보는 규칙은 「옛 폭 + 260」 범위를 하나 더 가진다: `intro.css` · `mo.css` 1460(옛 1200) ·
     `client.css` · `optimization.css` 1280~1460(옛 1200) · `bneck.css` 1820(옛 1560) · 1280~1360(옛 1100) ·
     `bneck-tail.css` 1541~1580 · 1540(옛 1281~1320 · 1280). 기둥 폭이나 틈을 바꾸면 이 숫자들을 같이 옮길 것.
     폭 규칙을 새로 넣을 때도 1280 이상이면 같은 환산이 필요하다.
     1-1 구조도는 폭 규칙 대신 `common.css` 의 `#scene{width:min(100%, calc((100% - 356px) / .742))}` 로 카드 자리를 비운다
     (356 = `.card` 최소 318 + 오른쪽 18 + 틈 20 · .742 = 「게임 루프」 라벨 오른쪽 끝의 그림 폭 비율, viewBox 341~1423 기준).
     카드 최소 폭이나 viewBox 를 바꾸면 이 둘을 다시 잴 것.
6. **클래스 접두어** — 병목 `.bn-*` `.bx-*`(오른쪽 판 안 조각은 `.bx-*` — 옛 카드 `.rc` 는 2026-10-26 에 없앴다) / 클라 `.cl-*` `.cr-*`.
   `.card .stage .hit .panel` 은 이미 공유 중이니 새로 만들지 말 것.

## 산출물은 병합 뒤 한 번만 빌드

`index.html` 과 (풀 빌드면) `portfolio.html` 은 빌드 산출물이다. 병렬 브랜치에서 각자 빌드해 커밋하면
594KB 파일이 통째로 충돌한다. 작업 중에는 `build.ps1 -Fast`(→ `_preview.html`, gitignore 됨)로 보고,
**합친 뒤 한 번만** 풀 빌드해서 커밋한다.

## 조각을 옮겼을 때 확인법

순수 이동(내용 무변경)이라면 재빌드한 `index.html` 의 sha256 이 이동 전과 **같아야 한다.**
재빌드는 `-NoSync` 로 — 풀 빌드는 `sync-scene.ps1` 까지 불러 `portfolio.html` 을 건드리는데,
그쪽은 렌더 결과라 같은 입력에도 값이 흔들린다.
폰트 서브셋은 결정적이라 이 비교가 성립한다(같은 입력 → 같은 woff2 바이트, 실측 확인).
해시가 달라졌다면 줄이 새거나 줄바꿈이 바뀐 것이다 — 조각은 BOM 없는 UTF-8 · CRLF 를 지킨다.
