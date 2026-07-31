**작업명:** feat(learning): 학습 라우팅·공통 레이아웃·study mock 기반

## 작업 배경

학습 화면 하위 이슈(B~G)가 공통으로 쓸 라우트 골격, 노트지/헤더 레이아웃, `study` 타입·서비스·스토어 확장을 먼저 깔아 둔다. 현재 `/learning`은 스텁이며 `studyService`/`studyStore`/`types/study.js`와 홈 `StudyNote`만 존재한다.

## 작업(구현) 내용 및 현황

- [ ] `/learning` 하위 라우트 골격 추가 (`roadmap`, `main-chapters/:id`, `sub-chapters/:id`, `quiz`, `scenario-quiz` 등) (Front)
- [ ] 학습 공통 레이아웃·헤더·노트지(시험지) 컨테이너 컴포넌트 추가 (Front)
- [ ] `types/study.js` 퀴즈·시나리오·소단원 목록 타입 확장 (Front)
- [ ] `studyService.js` mock API 확장 (소단원 목록, 퀴즈 문항, 시나리오, 진도 저장) (Front)
- [ ] `studyStore.js` 학습 세션·진도·퀴즈 상태 확장 (Front)
- [ ] 기존 stub `LearningView.vue`를 로드맵 진입점과 연결 (Front)

## 참고 사항

- Parent: `feat: 학습 화면 구현` (Epic)
- 실 API 대신 `services/studyService.js` mock 패턴 유지 (`api/*Api.js` 신설하지 않음)
- 이어하기 mock route(`/learning/sub-chapters/...`)가 실제 라우트와 맞도록 맞춤
- Figma 플로우: https://www.figma.com/design/GVO1hxcyoYFiUjpCMZ7Gwa/Firstfolio?node-id=1207-2130
- 보조 프레임: https://www.figma.com/design/GVO1hxcyoYFiUjpCMZ7Gwa/Firstfolio?node-id=695-291
- 의존: 없음 (B~G의 선행 이슈)
