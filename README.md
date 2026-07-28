# FirstFolio-FE

## 1. 프로젝트 개요

**Firstfolio(퍼스트폴리오)**는 금융교육이 필요한 고등학생과 20세 전후 사회초년생, 즉 Gen Z를 위한 **학습형 자산관리 시뮬레이션 서비스**다.

서비스명은 "처음 만드는 포트폴리오(First Portfolio)"라는 의미를 담고 있으며, 핵심 슬로건은 다음과 같다.

> 배우며 완성하는 나의 첫 자산 포트폴리오

사용자는 금융 개념을 단순히 읽고 암기하는 데 그치지 않는다. 학습과 퀴즈, 상황 기반 의사결정 게임을 거쳐 가상화폐인 **스타(Star)**를 획득하고, 이를 금융상품에 배분해 자신만의 학습용 포트폴리오를 만든다.

이후 자신의 실제 자산과 목표 자산 배분을 입력하면 두 포트폴리오를 비교한 결과와 AI 기반 금융교육 피드백을 받을 수 있다.

Firstfolio는 투자 수익을 보장하거나 특정 금융상품을 직접 권유하는 투자 자문 서비스가 아니다. 사용자가 금융 개념과 자산 배분의 원리를 안전하게 체험하고, 스스로 판단하는 능력을 기르는 것을 목적으로 한다.

### 기술 스택

| 구분            | 기술                      |
| --------------- | ------------------------- |
| 웹 프레임워크   | Vue.js 3                  |
| 라우터          | Vue Router                |
| HTTP 클라이언트 | Axios                     |
| 전역 상태 관리  | Pinia                     |
| 빌드            | Vite                      |
| 스타일          | Tailwind CSS              |
| PWA             | vite-plugin-pwa (Workbox) |
| 배포            | Vercel                    |

---

## 2. 사용 라이브러리

### Dependencies

| 패키지        | 버전    | 용도                    |
| ------------- | ------- | ----------------------- |
| `vue`         | ^3.5.39 | UI 프레임워크           |
| `vue-router`  | ^5.2.0  | SPA 라우팅              |
| `pinia`       | ^4.0.2  | 전역 상태 관리          |
| `axios`       | ^1.18.1 | REST API 통신           |
| `tailwindcss` | ^4.3.3  | 유틸리티 CSS 프레임워크 |

### DevDependencies

| 패키지                            | 버전     | 용도                          |
| --------------------------------- | -------- | ----------------------------- |
| `vite`                            | ^8.1.1   | 개발 서버 및 빌드             |
| `@vitejs/plugin-vue`              | ^6.0.7   | Vite Vue 플러그인             |
| `@tailwindcss/vite`               | ^4.3.3   | Vite Tailwind CSS 플러그인    |
| `eslint`                          | ^10.7.0  | 코드 린트                     |
| `eslint-plugin-vue`               | ^10.10.0 | Vue ESLint 규칙               |
| `eslint-config-prettier`          | ^10.1.8  | ESLint ↔ Prettier 충돌 방지   |
| `@eslint/js`                      | ^10.0.1  | ESLint Flat Config            |
| `prettier`                        | ^3.9.6   | 코드 포맷터                   |
| `globals`                         | ^17.7.0  | ESLint 전역 변수 설정         |
| `vite-plugin-pwa`                 | ^1.3.0   | PWA 및 Service Worker         |
| `husky`                           | ^9.1.7   | Git hooks                     |
| `lint-staged`                     | ^16.4.0  | 커밋 전 staged 파일 린트/포맷 |
| `@commitlint/cli`                 | ^19.x    | 커밋 메시지 린트              |
| `@commitlint/config-conventional` | ^19.x    | Conventional Commits 규칙     |

---

## 3. 프로젝트 세팅

### 사전 요구사항

- Node.js 20+ (`.nvmrc` 참고)
- npm 10+

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env

# 개발 서버 실행 (http://localhost:5173)
npm run dev
```

### 환경 변수

`.env.example`을 참고해 `.env` 파일을 생성한다.

| 변수                    | 설명                  | 기본값                  |
| ----------------------- | --------------------- | ----------------------- |
| `VITE_API_BASE_URL`     | API Base URL          | `/api`                  |
| `VITE_API_TIMEOUT`      | 요청 타임아웃 (ms)    | `10000`                 |
| `VITE_TOKEN_KEY`        | localStorage 토큰 키  | `access_token`          |
| `VITE_API_PROXY_TARGET` | 개발 서버 프록시 대상 | `http://localhost:8080` |

### 스크립트

| 명령어                 | 설명                 |
| ---------------------- | -------------------- |
| `npm run dev`          | 개발 서버 실행       |
| `npm run build`        | 프로덕션 빌드        |
| `npm run preview`      | 빌드 결과물 미리보기 |
| `npm run lint`         | ESLint 검사          |
| `npm run lint:fix`     | ESLint 자동 수정     |
| `npm run format`       | Prettier 포맷 적용   |
| `npm run format:check` | Prettier 포맷 검사   |

### Git Hooks (Husky)

`git commit` 시 staged 파일에 대해 ESLint와 Prettier가 자동 실행된다. 오류가 있으면 커밋이 차단된다.

| 대상 파일              | 실행 명령                           |
| ---------------------- | ----------------------------------- |
| `*.{js,vue}`           | `eslint --fix` → `prettier --write` |
| `*.{json,css,md,html}` | `prettier --write`                  |

```bash
# 훅 수동 재설치 (npm install 후 자동 실행됨)
npm run prepare
```

**commit-msg 훅** — Conventional Commits 형식을 검사한다. 규칙은 `commitlint.config.js` 및 `.cursor/rules/commit-conventions.mdc` 참고.

```
feat(auth): 로그인 화면 추가
fix(api): 401 응답 처리 수정
chore: Vercel 배포 설정 추가
```

### CI (GitHub Actions)

PR 및 `main` / `dev` 푸시 시 [`.github/workflows/ci.yml`](.github/workflows/ci.yml)이 실행된다. 아래가 모두 통과해야 CI가 성공한다.

| 순서 | 명령어                 | 설명               |
| ---- | ---------------------- | ------------------ |
| 1    | `npm run lint`         | ESLint 검사        |
| 2    | `npm run format:check` | Prettier 포맷 검사 |
| 3    | `npm run build`        | 프로덕션 빌드      |

CI 빌드에는 `.env.example`과 동일한 `VITE_*` 값이 사용된다. 실제 API URL 등은 Vercel 환경 변수에서 관리한다.

### 배포 (Vercel)

배포는 **Vercel Git Integration**이 담당한다. GitHub Actions에서는 배포를 수행하지 않는다.

| Git                   | Vercel 환경 |
| --------------------- | ----------- |
| `main` (push / merge) | Production  |
| `dev` 푸시 / 모든 PR  | Preview     |

`vercel.json`에 SPA 라우팅 fallback이 설정되어 있어 Vue Router `history` 모드에서 새로고침 시 404가 발생하지 않는다.

#### Vercel 환경 변수

Project Settings → Environment Variables에서 Production / Preview 스코프별로 등록한다.

| 변수                | 설명                 | 예시 (로컬)    |
| ------------------- | -------------------- | -------------- |
| `VITE_API_BASE_URL` | API Base URL         | `/api`         |
| `VITE_API_TIMEOUT`  | 요청 타임아웃 (ms)   | `10000`        |
| `VITE_TOKEN_KEY`    | localStorage 토큰 키 | `access_token` |

`VITE_API_PROXY_TARGET`은 Vite 개발 서버 전용이므로 Vercel에는 등록하지 않아도 된다.

권장 설정: Production Branch = `main`, Framework Preset = Vite, Build Command = `npm run build`, Output Directory = `dist`.

### PWA

프로덕션 빌드 시 Service Worker와 Web App Manifest가 자동 생성된다.

```bash
# PWA 동작 확인 (HTTPS 또는 localhost 필요)
npm run build
npm run preview
```

| 파일                          | 설명                |
| ----------------------------- | ------------------- |
| `public/icon.png`             | 앱 아이콘 (임시)    |
| `public/pwa-192x192.png`      | PWA 아이콘 192×192  |
| `public/pwa-512x512.png`      | PWA 아이콘 512×512  |
| `public/apple-touch-icon.png` | iOS 홈 화면 아이콘  |
| `src/pwa/register.js`         | Service Worker 등록 |

---

## 4. 프로젝트 구조

```
FirstFolio-FE/
├── .cursor/
│   └── rules/              # Cursor AI 네이밍·커밋 규칙
├── .github/
│   └── workflows/
│       └── ci.yml          # lint / format / build CI
├── .husky/
│   ├── pre-commit          # 커밋 전 lint-staged 실행
│   └── commit-msg          # 커밋 메시지 commitlint 검사
├── public/
│   ├── icon.png              # 앱 아이콘 (임시)
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   └── apple-touch-icon.png
├── src/
│   ├── api/                # Axios 인스턴스 및 API 모듈
│   │   ├── authApi.js
│   │   ├── errorHandler.js
│   │   ├── index.js
│   │   ├── interceptors.js
│   │   └── userApi.js
│   ├── assets/             # 정적 리소스 (스타일, 이미지)
│   │   └── styles/
│   │       └── main.css
│   ├── components/         # 공통 컴포넌트
│   │   └── BaseButton.vue
│   ├── router/             # Vue Router 설정
│   │   └── index.js
│   ├── store/              # Pinia 스토어
│   │   └── userStore.js
│   ├── pwa/                # PWA Service Worker 등록
│   │   └── register.js
│   ├── utils/              # 유틸리티 함수
│   │   └── token.js
│   ├── views/              # 화면 컴포넌트
│   │   └── HomeView.vue
│   ├── App.vue
│   └── main.js
├── .env.example
├── .editorconfig
├── .nvmrc
├── commitlint.config.js
├── eslint.config.js
├── index.html
├── jsconfig.json
├── package.json
├── vercel.json
└── vite.config.js
```
