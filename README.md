# 주우진 · Game Server Engineer — Portfolio

C++ 게임 서버 엔지니어 구직용 단일 페이지 포트폴리오 (정적, 백엔드 없음).

**Live:** https://cocoz93.github.io/portfolio/

## 구성
- `portfolio.html` — 편집용 소스 (폰트·사진은 base64 자리표시자)
- `build.ps1` — 폰트/사진을 base64로 임베드해 자체 완결형 `index.html` 생성
- `index.html` — 배포본 (GitHub Pages 진입점)
- `fonts/PretendardVariable.woff2` — 본문 폰트 (Pretendard, OFL)
- `photo.png` — 프로필 사진

## 빌드
```powershell
powershell -ExecutionPolicy Bypass -File build.ps1
```
`portfolio.html` 수정 → 위 명령으로 `index.html` 재생성 → 커밋/푸시하면 Pages 갱신.
