# 주우진 · Game Server Engineer — Portfolio

[![대형 라이브 경험과 저수준 성능 — 추측 아닌 실측으로](docs/og.png)](https://cocoz93.github.io/portfolio/)

**C++ 게임 서버 엔지니어 구직 포트폴리오입니다** — 위 그림을 누르면 바로 열립니다.

Windows·Linux 라이브 3년 · 라그나로크 · 던전앤파이터 · 신규 MMO 설계
개인 R&D · 맵당 동접 ~5,000 · tick p99 65 → 9ms · **채택도 기각도 A/B 실측**

## 🔗 바로가기
- 🌐 **포트폴리오** — https://cocoz93.github.io/portfolio/
- 🏭 **MMO 서버 구조·병목 투어** — https://cocoz93.github.io/portfolio/mmo-site/
- 🍀 **기술경력서** — [Notion 바로가기](https://feline-vacation-d6d.notion.site/23316a0b9f59809db2e5d610a23a10a5)
- 📚 **DEV LOG 26** — [노션 블로그 전체](https://feline-vacation-d6d.notion.site/DEV-LOG-26-2db16a0b9f598196a471d53775ab4223)
- 📧 **Email** — wndnwls7@gmail.com

## 📂 함께 보는 저장소
| 저장소 | 내용 |
|--------|------|
| [MMO_Zone](https://github.com/cocoz93/MMO_Zone) | Windows IOCP MMO 게임서버 — 동접 200 → ~5,000 병목 추적 |
| [ServerCore](https://github.com/cocoz93/ServerCore) | 계층 분리된 C++17 서버 코어 — IOCP · RIO · epoll |
| [MO_Belt](https://github.com/cocoz93/MO_Belt) | 벨트스크롤 액션 MO 서버 — Linux epoll |
| [LockFree](https://github.com/cocoz93/LockFree) | 락프리 큐·스택 + 2계층 메모리풀 |

---

## 이 저장소를 고칠 때

백엔드 없는 정적 단일 페이지입니다.

| 파일 | 역할 |
|------|------|
| `docs/portfolio.html` | 편집용 소스 — 폰트·사진이 base64 자리표시자 |
| `docs/build.ps1` | 폰트·사진을 base64 로 묻어 자체 완결형 `index.html` 생성 |
| `docs/index.html` | 배포본 — GitHub Pages 진입점 |
| `docs/fonts/` · `docs/photo.png` | 본문 폰트(Pretendard, OFL) · 프로필 사진 |

```powershell
powershell -ExecutionPolicy Bypass -File docs/build.ps1
```

`portfolio.html` 수정 → 위 명령으로 `index.html` 재생성 → 커밋·푸시하면 Pages 갱신.
