# Research: 할 일(Todo) 추가/조회/토글/삭제

이 문서는 Technical Context에서 제기된 기술적 결정 사항을 정리한다. 스펙 단계에서
`[NEEDS CLARIFICATION]`으로 남은 항목은 없었으나(모두 `/speckit-clarify`에서 해소),
플랜 단계에서 구체적인 기술 선택이 필요한 항목들을 아래에 정리한다.

## 1. API 응답 봉투(envelope) 형식

- **Decision**: 모든 API 응답은 `{ "data": <payload> }`(성공) 또는
  `{ "error": { "message": string } }`(실패) 형태를 사용한다. 성공 시 HTTP 상태 코드는
  200(조회/수정/삭제) 또는 201(생성), 실패 시 400(검증 실패) 또는 404(대상 없음)을 사용한다.
- **Rationale**: 헌법 원칙 II("API 응답은 항상 JSON 형태로 통일한다")를 만족시키기 위해
  모든 라우트가 동일한 응답 구조를 따라야 한다. `data`/`error` 최상위 키로 성공/실패를
  명확히 구분하면 클라이언트(테스트 포함)가 분기 처리하기 쉽다.
- **Alternatives considered**: 상태 코드만으로 성공/실패를 구분하고 페이로드를 그대로
  반환하는 방식은 각 라우트마다 응답 형태가 달라질 위험이 있어 기각했다.

## 2. 식별자(ID) 전략

- **Decision**: Prisma의 SQLite autoincrement 정수 기본키(`id Int @id @default(autoincrement())`)를 사용한다.
- **Rationale**: 단일 사용자 로컬 앱이며 ID를 외부에 노출해도 보안상 문제가 되는
  시나리오(공개 API, 다중 테넌트)가 아니다. 추가 의존성(cuid/uuid 생성 라이브러리) 없이
  Prisma와 SQLite만으로 바로 사용할 수 있어 "외부 서비스 가입 불필요" 제약과도 부합한다.
- **Alternatives considered**: `cuid()`/`uuid()` 문자열 ID는 공개 서비스에 더 적합하지만
  이번 스코프에서는 불필요한 복잡도를 추가한다.

## 3. Prisma Client 싱글턴 패턴

- **Decision**: `lib/prisma.ts`에서 `globalThis`에 Prisma Client 인스턴스를 캐싱하는
  표준 Next.js 싱글턴 패턴을 사용한다.
- **Rationale**: Next.js 개발 모드의 hot-reload는 모듈을 반복적으로 재평가하므로,
  싱글턴 없이 매번 `new PrismaClient()`를 호출하면 SQLite 파일에 대한 커넥션이 누적되어
  "too many connections" 류의 문제가 발생할 수 있다. 이는 Prisma 공식 문서가 Next.js
  App Router 프로젝트에 권장하는 패턴이다.
- **Alternatives considered**: 요청마다 새 클라이언트를 생성하는 방식은 개발 모드에서
  커넥션 누수를 일으켜 기각했다.

## 4. 입력 검증과 `any` 회피

- **Decision**: `zod`로 요청 바디 스키마(`title: string` 필수/공백 아님/최대 200자)를
  정의하고, `request.json()`의 결과를 해당 스키마로 파싱한다.
- **Rationale**: 헌법 원칙 III("타입은 any를 쓰지 않는다")에 따라 `request.json()`이
  반환하는 `unknown`/`any` 성격의 값을 안전하게 좁혀야(narrow) 한다. Zod는 런타임
  검증과 정적 타입 추론을 동시에 제공하여 별도의 수동 타입 단언 없이 이를 만족시킨다.
- **Alternatives considered**: 수동 `typeof` 체크만으로도 가능하지만, 필드가 늘어날
  경우 검증 로직이 흩어지고 실수로 `any`/`as` 캐스팅을 쓰게 될 위험이 커서 Zod를
  선택했다.

## 5. 테스트 프레임워크

- **Decision**: Vitest를 사용해 API 라우트 핸들러에 대한 통합 테스트를 작성한다
  (요청 객체를 구성해 라우트 핸들러를 직접 호출하고 응답 JSON과 상태 코드를 검증).
- **Rationale**: 현재 프로젝트에는 테스트 러너가 설치되어 있지 않다. Vitest는 ESM/TS를
  기본 지원하고 설정이 가볍고 빨라 Next.js App Router 프로젝트에서 널리 쓰이는 선택이다.
- **Alternatives considered**: Jest도 가능하지만 Next.js 16 + ESM 환경에서 추가 설정이
  더 필요해 Vitest보다 번거롭다.

## 6. 데이터베이스 마이그레이션 방식

- **Decision**: `prisma migrate dev`로 초기 마이그레이션을 생성하고 `prisma/dev.db`를
  로컬에 생성한다. `dev.db`와 `prisma/migrations`의 생성된 SQLite 파일 자체는
  `.gitignore`에 추가하되, 마이그레이션 SQL 파일은 커밋한다.
- **Rationale**: `migrate dev`는 스키마 변경 이력을 SQL 파일로 남겨 재현 가능하게
  하며, 로컬 파일 기반 SQLite와 잘 맞는다. 별도 서버나 외부 서비스가 필요 없다.
- **Alternatives considered**: `prisma db push`는 마이그레이션 이력을 남기지 않아
  협업/재현성 측면에서 불리해 기각했다.

## 결론

Technical Context의 모든 항목이 위 결정으로 해소되었다. Phase 1(데이터 모델 및
계약) 진행에 걸림돌이 되는 미해결 항목은 없다.
