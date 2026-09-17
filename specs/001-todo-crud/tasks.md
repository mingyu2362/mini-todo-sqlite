---

description: "Task list template for feature implementation"
---

# Tasks: 할 일(Todo) 추가/조회/토글/삭제

**Input**: Design documents from `/specs/001-todo-crud/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/tasks-api.yaml, quickstart.md (모두 존재)

**Tests**: plan.md/research.md에서 Vitest를 테스트 프레임워크로 확정하고 quickstart.md가
`tests/api/tasks.test.ts` 실행을 검증 절차에 포함했으므로, 각 사용자 스토리에 통합 테스트
작성 태스크를 포함한다.

**Organization**: 태스크는 spec.md의 사용자 스토리(P1~P4) 기준으로 그룹화되어 각 스토리를
독립적으로 구현·검증할 수 있다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 선행 의존성 없음)
- **[Story]**: 이 태스크가 속한 사용자 스토리 (US1~US4)
- 모든 태스크에 정확한 파일 경로를 포함한다

## Path Conventions

plan.md의 Project Structure를 따른다 (단일 Next.js 프로젝트):

- `app/api/tasks/route.ts`, `app/api/tasks/[id]/route.ts` — REST 엔드포인트
- `lib/prisma.ts`, `lib/validation.ts`, `lib/api-response.ts` — 공유 인프라
- `prisma/schema.prisma`, `prisma/dev.db` — 데이터베이스
- `tests/api/tasks.test.ts` — 통합 테스트
- `app/page.tsx` — UI

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 프로젝트 초기화 및 기본 구조 준비

- [ ] T001 `npx prisma init --datasource-provider sqlite`를 실행하여 `prisma/schema.prisma` 초안과 `DATABASE_URL="file:./dev.db"`가 설정된 `.env`를 생성한다
- [ ] T002 [P] `prisma`, `@prisma/client`, `zod`를 dependencies로, `vitest`를 devDependencies로 `package.json`에 설치하고 `"test": "vitest run"` 스크립트를 추가한다
- [ ] T003 [P] `.gitignore`에 `prisma/dev.db`, `prisma/dev.db-journal` 등 로컬 SQLite 생성 파일을 추가한다

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 사용자 스토리가 공유하는 핵심 인프라 (완료 전에는 어떤 스토리도 시작 불가)

**⚠️ CRITICAL**: 이 단계가 끝나기 전에는 Phase 3 이후를 시작할 수 없다

- [ ] T004 `prisma/schema.prisma`에 `Todo` 모델을 data-model.md대로 정의한다: `id Int @id @default(autoincrement())`, `title String`, `completed Boolean @default(false)`, `createdAt DateTime @default(now())` (depends on T001)
- [ ] T005 `npx prisma migrate dev --name init`을 실행해 초기 마이그레이션과 `prisma/dev.db`, Prisma Client 타입을 생성한다 (depends on T002, T004)
- [ ] T006 [P] `lib/prisma.ts`에 `globalThis` 캐싱 기반 Prisma Client 싱글턴을 구현한다 (research.md #3, dev 모드 재평가로 인한 커넥션 누적 방지) (depends on T005)
- [ ] T007 [P] `lib/validation.ts`에 Zod 스키마를 구현한다: `title`은 trim 후 1자 이상, 최대 200자(data-model.md, FR-002 "제목이 비어 있거나 공백만으로 이루어진 요청 거부", FR-011 "200자 초과 시 거부") (depends on T002)
- [ ] T008 [P] `lib/api-response.ts`에 성공 `{ "data": ... }` / 실패 `{ "error": { "message": string } }` JSON 응답 헬퍼를 구현한다 (research.md #1, 헌법 원칙 II)

**Checkpoint**: 이 시점부터 사용자 스토리 구현을 시작할 수 있다

---

## Phase 3: User Story 1 - 할 일 추가 (Priority: P1) 🎯 MVP

**Goal**: 사용자가 제목을 입력하여 새로운 할 일을 추가하고, 완료 여부가 기본값
"미완료"로 설정되게 한다.

**Independent Test**: `POST /api/tasks`를 호출해 응답의 `data`에 생성된 항목(제목,
`completed: false`)이 포함되는지 확인한다 (quickstart.md #1).

### Tests for User Story 1 ⚠️

> 구현 전에 실패하는 상태로 먼저 작성한다

- [ ] T009 [US1] `tests/api/tasks.test.ts`에 `POST /api/tasks` 통합 테스트를 작성한다: 정상 제목 → 201 & `completed:false`(FR-001, FR-003), 빈/공백 제목 → 400(FR-002), 200자 초과 제목 → 400(FR-011)

### Implementation for User Story 1

- [ ] T010 [US1] `app/api/tasks/route.ts`에 `POST` 핸들러를 구현한다: `lib/validation.ts`로 `title` 검증 → 통과 시 `lib/prisma.ts`로 `completed:false`인 `Todo` 생성 → `lib/api-response.ts`로 201 `{data}` 또는 400 `{error}` 응답 (FR-001, FR-002, FR-003, FR-011) (depends on T006, T007, T008, T009)

**Checkpoint**: User Story 1은 이 시점에 독립적으로 완전히 동작하고 테스트 가능해야 한다 (MVP)

---

## Phase 4: User Story 2 - 할 일 목록 확인 (Priority: P2)

**Goal**: 지금까지 추가된 모든 할 일을 제목과 완료 여부를 포함해 목록으로 확인한다.

**Independent Test**: 사전에 준비된 데이터가 있는 상태에서 `GET /api/tasks`를 호출해
각 항목의 제목/완료 여부가 올바르게 반환되는지 확인한다 (quickstart.md #2).

### Tests for User Story 2 ⚠️

- [ ] T011 [US2] `tests/api/tasks.test.ts`에 `GET /api/tasks` 통합 테스트를 추가한다: 항목이 없을 때 `{data:[]}`, 완료/미완료 항목이 섞여 있을 때 각 항목의 `title`/`completed`가 노출되는지 확인 (FR-004) (depends on T009, 같은 파일)

### Implementation for User Story 2

- [ ] T012 [US2] `app/api/tasks/route.ts`에 `GET` 핸들러를 구현한다: 모든 `Todo`를 `createdAt` 오름차순으로 조회해 200 `{data: Todo[]}` 응답 (FR-004) (depends on T010, 같은 파일)

**Checkpoint**: User Story 1과 2가 함께 독립적으로 동작해야 한다

---

## Phase 5: User Story 3 - 완료 여부 토글 (Priority: P3)

**Goal**: 사용자가 특정 할 일의 완료 여부를 완료 ↔ 미완료로 전환한다.

**Independent Test**: 미완료 상태의 할 일 하나를 `PATCH`로 토글해 `completed`가
반전되는지, 다시 토글하면 원래대로 돌아오는지 확인한다 (quickstart.md #3).

### Tests for User Story 3 ⚠️

- [ ] T013 [US3] `tests/api/tasks.test.ts`에 `PATCH /api/tasks/[id]` 통합 테스트를 추가한다: 존재하는 id → 200 & `completed` 반전(FR-005), 존재하지 않는/이미 삭제된 id → 404(FR-007) (depends on T011, 같은 파일)

### Implementation for User Story 3

- [ ] T014 [US3] `app/api/tasks/[id]/route.ts`에 `PATCH` 핸들러를 구현한다: id로 `Todo` 조회 → 없으면 `lib/api-response.ts`로 404 `{error}`, 있으면 `completed`를 반전시켜 200 `{data}` 응답 (FR-005, FR-007) (depends on T006, T008)

**Checkpoint**: User Story 1~3이 함께 독립적으로 동작해야 한다

---

## Phase 6: User Story 4 - 할 일 삭제 (Priority: P4)

**Goal**: 사용자가 더 이상 필요 없는 할 일을 목록에서 삭제한다.

**Independent Test**: 기존 항목을 삭제한 뒤 목록을 다시 조회했을 때 해당 항목이
사라졌는지, 존재하지 않는 id 삭제 시 오류가 반환되는지 확인한다 (quickstart.md #4).

### Tests for User Story 4 ⚠️

- [ ] T015 [US4] `tests/api/tasks.test.ts`에 `DELETE /api/tasks/[id]` 통합 테스트를 추가한다: 존재하는 id → 200 & `{data:{id}}`(FR-006), 존재하지 않는/이미 삭제된 id → 404(FR-007) (depends on T013, 같은 파일)

### Implementation for User Story 4

- [ ] T016 [US4] `app/api/tasks/[id]/route.ts`에 `DELETE` 핸들러를 구현한다: id로 `Todo` 조회 → 없으면 404 `{error}`, 있으면 삭제 후 200 `{data:{id}}` 응답 (FR-006, FR-007) (depends on T014, 같은 파일)

**Checkpoint**: 모든 사용자 스토리(US1~US4)가 독립적으로 동작해야 한다

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 여러 사용자 스토리에 걸친 마무리 작업

- [ ] T017 [P] `app/page.tsx`에서 `/api/tasks`, `/api/tasks/[id]`를 호출하는 UI를 구현한다: 추가 폼, 목록 렌더링, 항목별 토글/삭제 버튼 (SC-001, SC-002, SC-005) (depends on T010, T012, T014, T016)
- [ ] T018 [P] `npm run lint`와 `npx tsc --noEmit`(또는 `next build`)을 실행해 `any` 사용/타입 오류가 없는지 확인한다 (헌법 원칙 III, Quality Gates)
- [ ] T019 quickstart.md의 curl 시나리오와 `npx vitest run`을 실행해 4개 사용자 스토리를 엔드투엔드로 검증한다 (depends on T009-T016, T017)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료에 의존 — 모든 사용자 스토리를 블로킹
- **User Stories (Phase 3-6)**: 모두 Foundational 완료에 의존
  - 우선순위 순서(P1→P2→P3→P4)로 순차 진행하는 것을 권장하나, 팀 인원이 충분하면
    US3(Phase 5)은 US1/US2의 라우트 파일과 다른 파일(`[id]/route.ts`)을 사용하므로
    Foundational 완료 후 병렬 착수 가능
- **Polish (Phase 7)**: 구현하고자 하는 모든 사용자 스토리 완료에 의존

### User Story Dependencies

- **US1 (P1)**: Foundational 이후 시작 가능, 다른 스토리에 의존하지 않음
- **US2 (P2)**: Foundational 이후 시작 가능하나 `app/api/tasks/route.ts`를 US1과 공유하므로 파일 충돌을 피하려면 US1 이후 진행 권장
- **US3 (P3)**: Foundational 이후 시작 가능, 별도 파일(`[id]/route.ts`)이라 US1/US2와 독립적으로 병렬 가능
- **US4 (P4)**: US3과 같은 파일(`[id]/route.ts`)을 사용하므로 US3 이후 진행 권장

### Within Each User Story

- 테스트를 먼저 작성해 실패를 확인한 뒤 구현한다
- 같은 파일을 수정하는 태스크는 순차적으로 진행한다 (예: T010→T012, T014→T016)

### Parallel Opportunities

- Setup의 T002, T003은 병렬 가능
- Foundational의 T006, T007, T008은 병렬 가능 (T005 완료 후, 서로 다른 파일)
- Foundational 완료 후 US1(Phase 3)과 US3(Phase 5)은 서로 다른 라우트 파일을 사용하므로 병렬 착수 가능 (US2/US4는 각각 US1/US3 이후)
- Polish의 T017, T018은 병렬 가능

---

## Parallel Example: Foundational Phase

```bash
# T005 완료 후 아래 3개를 병렬로 진행할 수 있다:
Task: "lib/prisma.ts에 Prisma Client 싱글턴 구현"
Task: "lib/validation.ts에 Zod title 스키마 구현"
Task: "lib/api-response.ts에 success/error JSON 헬퍼 구현"
```

---

## Implementation Strategy

### MVP First (User Story 1만)

1. Phase 1: Setup 완료
2. Phase 2: Foundational 완료 (필수 — 모든 스토리를 블로킹)
3. Phase 3: User Story 1 완료
4. **STOP & VALIDATE**: `POST /api/tasks`가 quickstart.md #1대로 동작하는지 독립적으로 확인
5. 필요 시 여기서 데모/배포

### Incremental Delivery

1. Setup + Foundational 완료 → 기반 준비 완료
2. US1(할 일 추가) 추가 → 독립 검증 → 데모 (MVP!)
3. US2(목록 확인) 추가 → 독립 검증 → 데모
4. US3(완료 토글) 추가 → 독립 검증 → 데모
5. US4(삭제) 추가 → 독립 검증 → 데모
6. Polish(UI, lint/build 게이트, quickstart 전체 검증)로 마무리

---

## Notes

- `[P]` 태스크는 서로 다른 파일을 다루며 선행 의존성이 없다
- `[Story]` 라벨은 태스크를 특정 사용자 스토리로 추적하기 위한 것이다
- 각 사용자 스토리는 독립적으로 완료·테스트 가능해야 한다
- 구현 전에 테스트가 실패하는지 확인한다
- 같은 파일(`app/api/tasks/route.ts`, `app/api/tasks/[id]/route.ts`,
  `tests/api/tasks.test.ts`)을 다루는 태스크는 병렬로 표시하지 않았다
