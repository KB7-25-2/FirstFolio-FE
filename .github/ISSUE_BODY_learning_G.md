**작업명:** feat(learning): 이어하기·진도·수료 연동

## 작업 배경

홈「학습 이어하기」(`StudyNote`)와 학습 라우트를 연결하고, 소단원/대단원 수료 분기·진도 반영을 end-to-end로 맞춘다. B~F 화면이 모인 뒤 플로우를 닫는 마무리 이슈다.

## 작업(구현) 내용 및 현황

- [ ] 홈 `StudyNote` / `getContinuePosition` → 실제 학습 라우트 딥링크 (Front)
- [ ] 소단원 퀴즈 수료 후 시간표 상태·다음 소단원 잠금 해제 반영 (Front)
- [ ] 전체 소단원 수료 시 대단원 시나리오 퀴즈 진입 유도 (Front)
- [ ] 대단원 수료 후 로드맵/커리큘럼 상태 갱신 (Front)
- [ ] `studyStore` 진도·이어하기 일관성 점검 및 mock 시나리오 보강 (Front)
- [ ] 로드맵 → 시간표 → 강좌 → 퀴즈 → 시나리오 스모크 체크리스트 통과 (Front)

## 참고 사항

- Parent: `feat: 학습 화면 구현` (Epic)
- 선행: 이슈 A~F
- Figma 플로우: https://www.figma.com/design/GVO1hxcyoYFiUjpCMZ7Gwa/Firstfolio?node-id=1207-2130
- 홈 학습 이어하기 요구: `PROJECT_SPEC` §5.3
- 수료·재응시·포인트 중복 지급은 미확정 — [`src/constants/quizPolicy.js`](../src/constants/quizPolicy.js)의 `ALLOW_DUPLICATE_POINT_GRANT` / `POINTS_PER_CORRECT`만 사용 (현재 재응시 시 포인트 재지급 안 함)
- E2E 자동화 필수는 아님. 수동 스모크 체크리스트로 충분

## Mock 시드 (진도·이어하기)

- 커리큘럼: 기초 COMPLETED, 예·적금 ACTIVE, 채권~펀드 LOCKED
- 예·적금 진행: 1~2교시 COMPLETED, 3교시(103) IN_PROGRESS, 시나리오 NOT_STARTED·챕터 게임 잠금
- 전체 LESSON 수료 시 챕터 게임 해금 + 시나리오 CTA / 시나리오 수료 시 다음 대단원 ACTIVE
