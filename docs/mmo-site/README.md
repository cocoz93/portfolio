# MMO 서버 R&D

IOCP 기반 MMO 서버 R&D 페이지 — 맵당 동접 4,000, 실측 기반 병목 개선.
**Live:** https://cocoz93.github.io/mmo/

## 구성
- `mmo.src.html` — 소스(폰트 자리표시자 `__PRETENDARD_WOFF2_BASE64__` / `__JBMONO_WOFF2_BASE64__`)
- `build.ps1` — Pretendard/JetBrains Mono를 사용 글리프만 서브셋해 base64 인라인 → `index.html`
- `index.html` — 배포 산출물(자체 완결, GitHub Pages 진입점)
- `fonts/` — 원본 woff2

## 재빌드
```
powershell -ExecutionPolicy Bypass -File build.ps1
```
