# MMO 서버 R&D

IOCP 기반 MMO 서버 R&D 페이지 — 맵당 동접 5,000, 실측 기반 병목 개선.
**Live:** https://cocoz93.github.io/portfolio/mmo-site/

## 구성
- `mmo.src.html` — 셸. `<head>` · 탭 줄 · `#p-misc` · 방문 분석 스니펫과 `<!--#include 조각이름 -->` 마커.
  마커에 `parts/` 를 붙이지 않는다 — 빌드가 붙인다(`<!--#include common.css -->`).
  **조각의 순서(= IIFE 실행 순서)를 셸이 들고 있다** — 마커 순서를 바꾸면 첫 로드 애니가 깨진다.
- `parts/` — 조각 13개. 갈래별 소유와 병렬 작업 규칙은 `parts/README.md`
  (폰트 자리표시자 `__PRETENDARD_WOFF2_BASE64__` / `__JBMONO_WOFF2_BASE64__` 는 `parts/common.css`)
- `build.ps1` — 조각을 합친 뒤 Pretendard/JetBrains Mono를 사용 글리프만 서브셋해 base64 인라인 → `index.html`
- `index.html` — 배포 산출물(자체 완결, GitHub Pages 진입점)
- `fonts/` — 원본 woff2

## 재빌드
```
powershell -ExecutionPolicy Bypass -File build.ps1
```
