# 최적화 그림 1–5 중간 확정본 보관 (2026-10-14)

사용자가 이 다섯 그림으로 중간 결론을 내고 “따로 보관”과 “기억”을 명시적으로 요청했다. 다음에 1~5번 그림 또는 중간 확정본을 찾으면 이 보관 묶음을 우선 사용한다. 과거 MEMORY.md에 있는 1·2번 원본 경로보다 이 날짜의 다섯 개 묶음이 최신 기준이다.

- 작업 공간: C:/Users/USER/Desktop/MyGit/MMO_Zone
- 보관 폴더: C:/Users/USER/Desktop/MyGit/portfolio/docs/mmo-site/visualizations/archive/optimization-figures-interim-20261014
- 시작 파일: 위 폴더의 index.html. manifest.json에 원본 경로, 승인 버전과 SHA-256이 있다.
- 1번: 01-wsasend.html — 틱 끝 WSASend 묶음 호출, wsasend-held-pulse-v11.
- 2번: 02-msg-bundle.html — 여러 이동 정보를 Msg 하나로 묶기, sector-bundle-held-pulse-v26.
- 3번: 03-msg-sharing.html — 직렬화버퍼 공유, AddRef/SubRef와 반환, serial-sector-bank-v1. 회로 게이트/슬롯 뱅크, A 마법사와 S1~S3 검사. Ref 1→4→3→2→1→0, SendQ 사본은 유지.
- 4번: 04-digest.html — 섹터별 Msg 보관→수신 섹터별 Digest 구성→동일 섹터 주민별 1회 적재, digest-compare-four-residents-v17. 주민 2/1/1명, SendQ 4개.
- 5번: 05-quantization.html — 좌표 양자화, quantization-value-change-v13. 서버 float 유지, ×512·반올림→uint16, 좌표 부분 8B→4B. 이름/값/4B·2B를 함께 전환한다. 양자화→Msg 이동 1회, 배선과 이중 채우기는 없다. 떠난 블록은 원래 슬롯에 다시 나타나지 않는다. 반올림 오차 안내가 있다.
- 전부 변경 전/후 애니메이션을 포함한 중간 확정본이다. 후속 수정은 작업본에서 진행하고 이 보관본을 덮어쓰지 않는다. 네이비 PCB와 선명한 블루 톤을 유지한다.
- 대상: 면접관, 장기 복습용 본인. 상용급 완성이나 Codex 호스트/서버 바이너리 검증 완료로 과장하지 않는다.
- 이 폴더는 원본 복사본(*-source.html), 독립 브라우저 재생용 파일, 목록과 검증 기록을 포함한다. 보관 작업은 원본 그림을 수정하거나 포트폴리오에 게시하지 않았다.
- 관련 rollout id: 01a11c42-4baf-7450-b29c-e804573c9d61
