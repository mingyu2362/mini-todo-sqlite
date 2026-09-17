# Implementation Plan: 할 일(Todo) 추가/조회/토글/삭제

**Branch**: `001-todo-crud` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-todo-crud/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

할 일 추가·목록 조회·완료 토글·삭제 기능을 Next.js App Router의 REST API 라우트
(`app/api/tasks`)로 제공한다. 데이터는 Prisma ORM을 통해 로컬 SQLite 파일
(`prisma/dev.db`)에 저장하며, 별도의 서버 인프라나 외부 서비스 가입 없이 로컬에서
바로 실행 가능하도록 구성한다. 기존 `app/page.tsx`는 이 API를 호출하는 화면으로
구성되어 사용자 스토리(추가/조회/토글/삭제)를 엔드투엔드로 검증할 수 있게 한다.

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js 16.3.5 / Node.js 20+ LTS)

**Primary Dependencies**: Next.js 16 (App Router), React 19, Prisma ORM (`prisma`,
`@prisma/client`), Zod (요청 바디 검증 — `any` 없이 타입 안전하게 파싱하기 위함)

**Storage**: SQLite 파일 (`prisma/dev.db`), Prisma Client를 통해 접근

**Testing**: Vitest — API 라우트 핸들러에 대한 통합 테스트 (요청 → 응답 JSON 검증)

**Target Platform**: 로컬/자체 호스팅 Node.js 서버 프로세스 (`next start`); 서버리스
환경은 대상이 아님 — SQLite 파일은 영속적인 로컬 파일시스템을 필요로 하기 때문

**Project Type**: 웹 애플리케이션 (API 라우트 + UI가 한 Next.js 프로젝트 안에 공존)

**Performance Goals**: 할 일 100개 상태에서 목록 조회가 1초 이내 (spec SC-004)

**Constraints**: 외부 서비스 가입/계정 불필요; 모든 데이터는 `prisma/dev.db`에 로컬로
저장; 모든 API 응답은 성공/실패 관계없이 동일한 JSON 형태를 따라야 함 (헌법 원칙 II)

**Scale/Scope**: 단일 사용자, 할 일 수백 개 수준; 동시 다중 사용자/동시성 요구 없음

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Section | Gate | Status |
|---|---|---|
| I. Next.js App Router + TypeScript | API 라우트는 `app/api/tasks/route.ts`, `app/api/tasks/[id]/route.ts` 형태로 App Router 규칙을 따르고, 모든 소스 파일은 `.ts`/`.tsx`로 작성한다. Pages Router는 사용하지 않는다. | PASS |
| II. Unified JSON API Responses | 모든 라우트는 성공/실패 모두 `Content-Type: application/json`과 동일한 응답 봉투(`{ data }` / `{ error }`)를 사용한다 (contracts 참고). | PASS |
| III. No `any` Type | Prisma Client가 생성하는 타입과 Zod로 검증된 입력 타입을 사용하며, `any`/암묵적 `any`를 사용하지 않는다. `@typescript-eslint/no-explicit-any`는 기존 eslint 설정에서 유지된다. | PASS |
| Technology Constraints | 추가되는 의존성(Prisma, Zod, Vitest)은 모두 TypeScript와 호환되며 Pages Router를 요구하지 않는다. `tsconfig.json`의 `strict: true`는 그대로 유지한다. | PASS |
| Quality Gates | `next build`/`tsc --noEmit`과 `npm run lint`가 병합 전 게이트로 유지되며, 새 API 라우트도 동일하게 검사된다. | PASS |

위반 사항 없음 — Complexity Tracking 불필요.

**Post-Design Re-check (Phase 1 완료 후)**: data-model.md, contracts/tasks-api.yaml,
research.md 작성 후 다시 검토한 결과 위 5개 게이트는 모두 그대로 PASS이다. 응답
봉투(`{data}`/`{error}`)는 계약 전체에서 일관되며, Prisma/Zod 도입은 App Router·
TypeScript·no-`any` 원칙과 충돌하지 않는다.

## Project Structure

### Documentation (this feature)

```text
specs/001-todo-crud/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── tasks-api.yaml
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
app/
├── page.tsx                    # 할 일 목록 UI: 추가 폼, 목록, 토글/삭제 버튼
├── layout.tsx                  # 기존 루트 레이아웃 (변경 없음)
└── api/
    └── tasks/
        ├── route.ts            # GET (목록 조회), POST (추가)
        └── [id]/
            └── route.ts        # PATCH (완료 토글), DELETE (삭제)

lib/
├── prisma.ts                   # Prisma Client 싱글턴 (dev 모드 다중 인스턴스 방지)
└── validation.ts               # Zod 스키마 (제목 필수/최대 200자 등 요청 검증)

prisma/
├── schema.prisma                # Todo 모델 정의 (datasource: sqlite, file:./dev.db)
└── dev.db                       # 로컬 SQLite 파일 (버전 관리 대상 아님, .gitignore)

tests/
└── api/
    └── tasks.test.ts             # API 라우트 통합 테스트 (Vitest)
```

**Structure Decision**: 단일 Next.js 프로젝트 구조를 채택한다. 별도의 backend/frontend
분리 없이 `app/api/tasks`가 REST 엔드포인트를, `app/page.tsx`가 이를 소비하는 UI를
같은 프로젝트 안에서 제공한다. 데이터 접근은 `lib/prisma.ts`의 싱글턴 Prisma Client를
통해서만 이루어지며, 입력 검증은 `lib/validation.ts`의 Zod 스키마로 일원화한다.

## Complexity Tracking

> 헌법 위반 사항이 없으므로 이 섹션은 해당 없음.
