**작업명:** feat(learning): 학습 진행(강좌 페이지) 화면

## 작업 배경

소단원 강좌의 여러 페이지를 노트(교과서) UI로 표시하고, 페이지 진도를 저장한 뒤 마지막 페이지에서 소단원 퀴즈로 이동한다. 정적 학습 본문은 S3 버전 JSON을 가정하고 FE는 mock으로 선구현한다.

## 작업(구현) 내용 및 현황

- [ ] `LessonPlayerView.vue` 추가 (Front)
- [ ] 개념 정리 노트·결론 카드·정의 블록 등 페이지 블록 컴포넌트 추가 (Front)
- [ ] 페이지 네비게이션(이전/다음)·`lastPageId` 진도 저장 (Front)
- [ ] `studyService` 소단원 콘텐츠(페이지 목록) mock 확장 (Front)
- [ ] `studyStore` 현재 페이지·진도 연동 (Front)
- [ ] 「퀴즈 풀기」→ 소단원 퀴즈 라우트, 「학습 중단」→ 소단원 선택 복귀 (Front)

## 참고 사항

- Parent: `feat: 학습 화면 구현` (Epic)
- 선행: 이슈 A, C
- Figma: https://www.figma.com/design/GVO1hxcyoYFiUjpCMZ7Gwa/Firstfolio?node-id=1197-29362
- 콘텐츠는 S3 버전형 JSON, 퀴즈 원본은 MySQL — FE는 `contentUrl` mock (`PROJECT_SPEC` §13)
- 마지막 소단원의 상품 소개도 동일 강좌 유형이며 별도 타입/FK를 두지 않음 (`PROJECT_SPEC` §18-21)
