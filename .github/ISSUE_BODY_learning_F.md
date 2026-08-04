**작업명:** feat(learning): 대단원 시나리오 퀴즈 화면

## 작업 배경

대단원 내 전체 소단원 수료 후 상황판단형 대단원 퀴즈를 제공한다. 응시·제출·채점 구조는 소단원 퀴즈와 동일하고, 캐릭터·금융시장 상황·제약 조건은 `scenario_json`으로 UI에 표시한다.

## 작업(구현) 내용 및 현황

- [x] `MainChapterScenarioQuizView.vue` 추가 (Front)
- [x] 시작(공문서)·페르소나 프로필·클립보드 문항·결과/평가 컴포넌트 추가 (Front)
- [x] 시작 → 문항(미선택/선택) → 결과 확인 플로우 (Front)
- [x] `오늘의 금융 시황` 하단 바(펼침 UI) (Front)
- [x] `studyService` 시나리오 퀴즈·`scenario_json` mock (Front)
- [x] `studyStore` 시나리오 응시·채점·대단원 수료 연동 (Front)
- [x] 정답 수 기반 포인트 지급 목업 (Front)

## 참고 사항

- Parent: `feat: 학습 화면 구현` (Epic)
- 선행: 이슈 A, C (전체 소단원 수료 분기). D/E와 병렬 가능하나 수료 연동은 G에서 마무리
- Figma 시작: https://www.figma.com/design/GVO1hxcyoYFiUjpCMZ7Gwa/Firstfolio?node-id=1197-30718
- Figma 문항(미선택): https://www.figma.com/design/GVO1hxcyoYFiUjpCMZ7Gwa/Firstfolio?node-id=1197-30577
- Figma 문항(선택): https://www.figma.com/design/GVO1hxcyoYFiUjpCMZ7Gwa/Firstfolio?node-id=1197-30819
- Figma 결과: https://www.figma.com/design/GVO1hxcyoYFiUjpCMZ7Gwa/Firstfolio?node-id=1197-30001
- `prompt` + nullable `scenario_json` (`PROJECT_SPEC` §18-22). 상황판단형일 때만 scenario 필수
- 소단원 퀴즈와 동일 응시·제출·채점 구조 (`PROJECT_SPEC` §18-20)
- FE mock API: `getChapterGame` / `getScenario` / `submitScenarioAttempt` (content.opening·conditions·steps)
