# Data Model: 할 일(Todo) 추가/조회/토글/삭제

## Todo

스펙의 Key Entities("할 일")와 Clarifications(제목 최대 200자, 초과 시 거부 /
제목 중복 허용)를 반영한 단일 엔티티 모델이다.

| 필드 | 타입 | 제약 | 비고 |
|---|---|---|---|
| `id` | Int | PK, autoincrement | 항목을 구분하는 유일한 값 (research.md #2) |
| `title` | String | 필수, 공백만으로는 불가, 최대 200자 | FR-002, FR-011 |
| `completed` | Boolean | 기본값 `false` | FR-003 |
| `createdAt` | DateTime | 기본값 현재 시각 | 목록 노출 순서(생성 순) 기준, spec Assumptions |

### 검증 규칙 (Zod 스키마 기준)

- `title`: `string().trim().min(1).max(200)` — trim 후 빈 문자열이면 거부(FR-002),
  200자 초과면 거부(FR-011).
- `completed`: 생성 시 클라이언트가 지정할 수 없음(항상 `false`로 시작, FR-003). 토글
  엔드포인트만 이 값을 반전시킬 수 있다.
- 제목 중복: 유니크 제약 없음 — 동일한 `title`을 가진 여러 행이 허용된다(Clarifications 참고).

### 상태 전이

```text
[생성] --title 필수/길이 검증 통과--> completed = false
completed = false --토글--> completed = true
completed = true --토글--> completed = false
(어느 상태든) --삭제--> [행 제거, 이후 조회에 나타나지 않음]
```

존재하지 않거나 이미 삭제된 `id`에 대한 토글/삭제 요청은 상태를 변경하지 않고
오류를 반환한다(FR-007).

### Prisma 스키마 초안

```prisma
model Todo {
  id        Int      @id @default(autoincrement())
  title     String
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

(정확한 최대 길이 제약은 애플리케이션 레이어의 Zod 스키마에서 강제하며, SQLite는
`VARCHAR(n)` 길이 제약을 강제하지 않으므로 데이터베이스 레벨 제약에 의존하지 않는다.)
