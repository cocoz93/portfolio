# MMO 서버 R&D

IOCP 기반 MMO 서버 R&D 페이지 — 맵당 동접 5,000, 실측 기반 병목 개선.
**Live:** https://cocoz93.github.io/portfolio/mmo-site/

## 구성
- `mmo.src.html` — 셸. `<head>` · 탭 줄 · `#p-misc` · 방문 분석 스니펫과 `<!--#include 조각이름 -->` 마커.
  마커에 `parts/` 를 붙이지 않는다 — 빌드가 붙인다(`<!--#include common.css -->`).
  **조각의 순서(= IIFE 실행 순서)를 셸이 들고 있다** — 마커 순서를 바꾸면 첫 로드 애니가 깨진다.
- `parts/` — 화면별 조각. 갈래별 소유와 병렬 작업 규칙은 `parts/README.md`
  (폰트 자리표시자 `__PRETENDARD_WOFF2_BASE64__` / `__JBMONO_WOFF2_BASE64__` 는 `parts/common.css`)
- `build.ps1` — 조각을 합친 뒤 Pretendard/JetBrains Mono를 사용 글리프만 서브셋해 base64 인라인 → `index.html`
- `index.html` — 배포 산출물(자체 완결, GitHub Pages 진입점)
- 원본 woff2 는 포폴 홈과 같이 쓰는 `../fonts/` 에 있다

## 재빌드
```
powershell -ExecutionPolicy Bypass -File build.ps1
```

## 1-3 최적화 원리

`parts/panel-optimization.html`, `parts/optimization.css`, `parts/optimization.js`에서 관리한다.
다섯 그림은 `visualizations/optimization-figures-current.json`의 현재 인라인 소스를 직접 연다.
기존 소스를 복제하지 않으며, 그림을 바꾸면 `optimization.js`의 소스 경로와 root도 함께 갱신한다.

넓은 화면에서는 220px 왼쪽 목차를 쓴다. 1,000px 이하에서는 목차를 상단으로 옮겨
그림의 가로 폭을 확보한다. 그림별 실제 높이를 따라가고, 탭을 떠나면 재생을 멈춘다.
`#optimization` 또는 `#optimization-msg-sharing`처럼 각 그림을 직접 열 수 있다.
1-2에서 관련 실험을 고르면 같은 그림으로 가는 '원리 보기' 링크가 나타난다.
