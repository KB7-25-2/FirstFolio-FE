**작업명:** feat(learning): 학습 로드맵(대단원 선택) 화면

## 작업 배경

학습 탭 진입 시 대단원(예금·주식·채권·펀드)을 고르는 로드맵 화면을 구현한다. `PROJECT_SPEC` 초기 제공 대단원 4개와 Figma「학습 카테고리 선택」을 기준으로 한다.

## 작업(구현) 내용 및 현황

- [ ] `LearningRoadmapView.vue` 추가 (Front)
- [ ] 카테고리 메모(포스트잇) 카드 컴포넌트 추가 (Front)
- [ ] `studyService` 커리큘럼/카테고리 mock 확장 (Front)
- [ ] `studyStore` 로드맵 상태 연동 (Front)
- [ ] 라우트 `/learning` → 로드맵 연결, 카드 클릭 시 소단원 선택으로 이동 (Front)

## 참고 사항

- Parent: `feat: 학습 화면 구현` (Epic)
- 선행: 이슈 A (라우팅·mock 기반)
- Figma: https://www.figma.com/design/GVO1hxcyoYFiUjpCMZ7Gwa/Firstfolio?node-id=1197-28433
- BottomNav「학습」탭 활성 상태 유지 (`AppLayout` / `useNavTabs`)
- 포트폴리오 기초 과정은 필수 선행이며 선택형 대단원과 구분 (`PROJECT_SPEC` §3.2) — UI에 노출 여부는 커리큘럼 mock 데이터에 따름
