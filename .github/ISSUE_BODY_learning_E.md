**작업명:** feat(learning): 소단원 퀴즈(시험지) 화면

## 작업 배경

소단원 강좌 완료 후 여러 문항의 시험지 퀴즈를 응시·제출·채점한다. 풀기/답 선택/정답/오답 상태를 Figma에 맞춰 구현하고, 포인트는 정답 수 기준으로 목업 지급한다.

## 작업(구현) 내용 및 현황

- [ ] `SubChapterQuizView.vue` 추가 (Front)
- [ ] 시험지·선택지·채점/해설 컴포넌트 추가 (Front)
- [ ] 상태 구현: 시험 중 / 답 선택 / 정답 / 오답 (Front)
- [ ] 문항 이동·포기·다시 풀기·제출 플로우 (Front)
- [ ] `studyService` 퀴즈 문항·채점·오답 이력 mock (Front)
- [ ] `studyStore` 응시 세션·점수·정답 수 연동 (Front)
- [ ] 정답 수 기반 포인트 지급 목업 및 소단원 수료 처리 (Front)

## 참고 사항

- Parent: `feat: 학습 화면 구현` (Epic)
- 선행: 이슈 A, D
- Figma 시험 중: https://www.figma.com/design/GVO1hxcyoYFiUjpCMZ7Gwa/Firstfolio?node-id=1197-29635
- Figma 답 선택: https://www.figma.com/design/GVO1hxcyoYFiUjpCMZ7Gwa/Firstfolio?node-id=1197-29817
- Figma 정답: https://www.figma.com/design/GVO1hxcyoYFiUjpCMZ7Gwa/Firstfolio?node-id=1197-29299
- Figma 오답: https://www.figma.com/design/GVO1hxcyoYFiUjpCMZ7Gwa/Firstfolio?node-id=1197-29693
- 포인트 = 정답 수 (`PROJECT_SPEC` §18-9). 재응시·중복 지급은 미확정 → 가정 시 설정값 분리
- 퀴즈 문항 원본은 MySQL 행 가정, 소단원 JSON에는 문항 ID만 참조 (`PROJECT_SPEC` §13)
