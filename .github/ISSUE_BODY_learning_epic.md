**작업명:** feat: 학습 화면 구현

## 작업 배경

`PROJECT_SPEC` §3.3 학습 흐름과 Figma「플로우 · 학습 모드」를 기준으로, Navbar 학습 탭부터 대단원 완료까지 프론트 학습 경험을 구축한다.

### 학습 흐름 (명세)

```text
학습 로드맵(대단원 선택)
  → 소단원 선택
  → 소단원 강좌(여러 페이지)
  → 소단원 퀴즈(여러 문항 · 정답 수 포인트)
  → (반복)
  → 대단원 퀴즈(상황판단형 · scenario_json)
  → 대단원 완료
```

### Figma 매핑

| 화면            | Figma node                              | 링크                                                                              |
| --------------- | --------------------------------------- | --------------------------------------------------------------------------------- |
| 플로우(참고)    | `1207:2130`                             | https://www.figma.com/design/GVO1hxcyoYFiUjpCMZ7Gwa/Firstfolio?node-id=1207-2130  |
| 학습 로드맵     | `1197:28433`                            | https://www.figma.com/design/GVO1hxcyoYFiUjpCMZ7Gwa/Firstfolio?node-id=1197-28433 |
| 소단원 선택     | `1197:29042`, `1197:29170`              | https://www.figma.com/design/GVO1hxcyoYFiUjpCMZ7Gwa/Firstfolio?node-id=1197-29042 |
| 학습 진행       | `1197:29362`                            | https://www.figma.com/design/GVO1hxcyoYFiUjpCMZ7Gwa/Firstfolio?node-id=1197-29362 |
| 소단원 퀴즈     | `1197:29635`, `29817`, `29299`, `29693` | https://www.figma.com/design/GVO1hxcyoYFiUjpCMZ7Gwa/Firstfolio?node-id=1197-29635 |
| 대단원 시나리오 | `1197:30718`, `30577`, `30819`, `30001` | https://www.figma.com/design/GVO1hxcyoYFiUjpCMZ7Gwa/Firstfolio?node-id=1197-30718 |
| (보조)          | `695:291`                               | https://www.figma.com/design/GVO1hxcyoYFiUjpCMZ7Gwa/Firstfolio?node-id=695-291    |

## 작업(구현) 내용 및 현황

하위 이슈를 등록한 뒤 `#` 번호를 채워 주세요. 의존 순서: A → B → C → D → (E ∥ F) → G

- [ ] #A `feat(learning): 학습 라우팅·공통 레이아웃·study mock 기반`
- [ ] #B `feat(learning): 학습 로드맵(대단원 선택) 화면`
- [ ] #C `feat(learning): 소단원 선택(시간표) 화면`
- [ ] #D `feat(learning): 학습 진행(강좌 페이지) 화면`
- [ ] #E `feat(learning): 소단원 퀴즈(시험지) 화면`
- [ ] #F `feat(learning): 대단원 시나리오 퀴즈 화면`
- [ ] #G `feat(learning): 이어하기·진도·수료 연동`

## 참고 사항

- 기존 `studyService` / `studyStore` / 홈 `StudyNote`와 이어하기 API를 재사용·확장한다.
- 소단원 강좌 JSON은 S3 버전, 퀴즈 문항 원본은 MySQL(FE는 목업으로 선구현).
- 퀴즈 포인트는 완료가 아니라 **정답 수** 기준 (`PROJECT_SPEC` §18-9).
- 대단원 퀴즈는 소단원과 동일 응시·제출·채점 구조 + `scenario_json` 상황판단형 (`PROJECT_SPEC` §18-20, 22).
- 재응시·합격 기준·중복 지급은 명세상 미확정 → 임시 가정 시 설정값으로 분리하고 해당 이슈에 명시.
- Vue 네이밍: `LearningRoadmapView`, `SubChapterSelectView`, `LessonPlayerView`, `SubChapterQuizView`, `MainChapterScenarioQuizView`.
- 본문 초안: `.github/ISSUE_BODY_learning_A.md` ~ `_G.md`
