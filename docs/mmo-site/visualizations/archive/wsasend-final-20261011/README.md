# WSASend 최종 보관본

보관일: 2026-10-11
원본: ../../pcb-animation-v1

- index.html: 이전/이번 디자인을 비교할 수 있는 독립 실행 HTML.
- wsasend-design-compare.html: 인라인 시각화용 HTML 조각.
- current-design.html, previous-design.html: 두 디자인의 독립 실행 스냅샷.
- qa/: 생성 스크립트와 검증 자료의 보관 사본.
- manifest.json: 최상위 HTML 8개 파일의 SHA256 및 크기.

마법사 캐릭터, Msg의 좌→우 채움, 변경 전/후 순차 재생을 보존했다. 신호 확대와 추가 대기 시간을 되돌린 시점의 파일이며, ResizeObserver 오류 수정은 유지한다.
HTML 8개와 QA 파일 46개를 복사한 뒤 모두 원본과 SHA256 일치를 확인했다. 원본은 그대로 남아 있다.
qa의 일부 스크립트와 과거 결과는 원래 실행 경로를 포함하므로 보관 사본에서 자동 재실행한 결과로 취급하지 않는다.
