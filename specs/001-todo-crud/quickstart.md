# Quickstart: 할 일(Todo) 추가/조회/토글/삭제 검증

이 문서는 구현 완료 후 스펙의 4개 사용자 스토리를 로컬에서 엔드투엔드로 검증하기
위한 절차다. API 계약은 [contracts/tasks-api.yaml](./contracts/tasks-api.yaml),
데이터 모델은 [data-model.md](./data-model.md)를 참고한다.

## 0. 사전 준비

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

- `prisma migrate dev`는 `prisma/schema.prisma`(data-model.md 기준)로부터
  `prisma/dev.db`를 생성한다.
- 개발 서버는 기본적으로 `http://localhost:3000`에서 실행된다.

## 1. 할 일 추가 (User Story 1 / P1)

```bash
curl -s -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"우유 사기"}'
```

**기대 결과**: `201`과 함께 `{"data":{"id":1,"title":"우유 사기","completed":false,...}}` 형태의
JSON이 반환된다 (Acceptance Scenario 1).

```bash
curl -s -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":""}'
```

**기대 결과**: `400`과 함께 `{"error":{"message":"..."}}` 형태의 JSON이 반환된다
(Acceptance Scenario 2, FR-002).

## 2. 목록 조회 (User Story 2 / P2)

```bash
curl -s http://localhost:3000/api/tasks
```

**기대 결과**: `200`과 함께 지금까지 추가한 모든 할 일이 `{"data":[...]}` 배열로
반환된다. 아직 아무것도 추가하지 않았다면 `{"data":[]}`가 반환된다(FR-004).

## 3. 완료 여부 토글 (User Story 3 / P3)

```bash
curl -s -X PATCH http://localhost:3000/api/tasks/1
```

**기대 결과**: 1번 항목의 `completed`가 반전된 `{"data":{...,"completed":true}}`가
반환된다. 같은 요청을 다시 보내면 `completed`가 다시 `false`로 돌아온다(FR-005).

## 4. 할 일 삭제 (User Story 4 / P4)

```bash
curl -s -X DELETE http://localhost:3000/api/tasks/1
curl -s http://localhost:3000/api/tasks
```

**기대 결과**: 삭제 요청은 `200`과 `{"data":{"id":1}}`을 반환하고, 이어지는 목록
조회에서 해당 항목이 더 이상 보이지 않는다(FR-006, SC-003).

```bash
curl -s -X DELETE http://localhost:3000/api/tasks/9999
```

**기대 결과**: 존재하지 않는 id에 대해 `404`와 `{"error":{"message":"..."}}`가
반환되고, 다른 항목에는 영향이 없다(FR-007).

## 5. 자동화 테스트

```bash
npx vitest run
```

`tests/api/tasks.test.ts`가 위 시나리오들을 라우트 핸들러 수준에서 재현하여
회귀를 방지한다.
