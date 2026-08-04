**작업명:** feat(learning): 소단원 선택(시간표) 화면

## 작업 배경

대단원 선택 후 소단원 목록을「학습 시간표」노트로 보여 주고, 완료/진행중/다음/잠김 상태에 따라 진입을 제어한다. 가로 스와이프로 다른 대단원 시간표를 넘길 수 있다.

## 작업(구현) 내용 및 현황

- [ ] `SubChapterSelectView.vue` 추가 (Front)
- [ ] 시간표 노트·교시 행·상태 뱃지 컴포넌트 추가 (Front)
- [ ] 대단원 가로 스와이프/페이지네이션 도트 UI (Front)
- [ ] `studyService` 소단원 목록·진행 상태 mock 확장 (Front)
- [ ] `studyStore` 선택 대단원·소단원 목록 연동 (Front)
- [ ] 진행중/완료 소단원 → 학습 진행, 전체 소단원 수료 시 → 시나리오 퀴즈 진입 분기 (Front)

## 참고 사항

- Parent: `feat: 학습 화면 구현` (Epic)
- 선행: 이슈 A, B
- Figma (예금): https://www.figma.com/design/GVO1hxcyoYFiUjpCMZ7Gwa/Firstfolio?node-id=1197-29042
- Figma (주식): https://www.figma.com/design/GVO1hxcyoYFiUjpCMZ7Gwa/Firstfolio?node-id=1197-29170
- 잠김 규칙: 플로우상「1단원이거나 직전 단원 수료」— 미확정 세부는 설정값으로 분리
- 마지막 목록 항목이 대단원 실전 퀴즈인 경우 UI만 구분하고, 시나리오 퀴즈 화면은 이슈 F에서 구현
