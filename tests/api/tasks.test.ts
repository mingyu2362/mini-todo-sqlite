import { beforeEach, afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "@/app/api/tasks/route";
import { PATCH, DELETE } from "@/app/api/tasks/[id]/route";

function postRequest(body: unknown) {
  return new Request("http://localhost/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function patchRequest(body: unknown) {
  return new Request("http://localhost", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function withId(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(async () => {
  await prisma.todo.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /api/tasks (US1)", () => {
  it("creates a todo with completed=false (FR-001, FR-003)", async () => {
    const res = await POST(postRequest({ title: "우유 사기" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data).toMatchObject({ title: "우유 사기", completed: false, priority: "MEDIUM" });
  });

  it("creates a todo with an explicit priority", async () => {
    const res = await POST(postRequest({ title: "긴급 처리", priority: "HIGH" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.priority).toBe("HIGH");
  });

  it("rejects an invalid priority value", async () => {
    const res = await POST(postRequest({ title: "잘못된 우선순위", priority: "URGENT" }));
    expect(res.status).toBe(400);
  });

  it("rejects an empty title (FR-002)", async () => {
    const res = await POST(postRequest({ title: "" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error?.message).toBeTruthy();
  });

  it("rejects a whitespace-only title (FR-002)", async () => {
    const res = await POST(postRequest({ title: "   " }));
    expect(res.status).toBe(400);
  });

  it("rejects a title longer than 200 characters (FR-011)", async () => {
    const res = await POST(postRequest({ title: "a".repeat(201) }));
    expect(res.status).toBe(400);
  });
});

describe("GET /api/tasks (US2)", () => {
  it("returns an empty list when no todos exist (FR-004)", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
  });

  it("returns all todos with title and completed (FR-004)", async () => {
    await POST(postRequest({ title: "완료된 할 일" }));
    await POST(postRequest({ title: "미완료 할 일" }));

    const res = await GET();
    const body = await res.json();
    expect(body.data).toHaveLength(2);
    expect(body.data[0]).toHaveProperty("title");
    expect(body.data[0]).toHaveProperty("completed");
    expect(body.data[0]).toHaveProperty("priority");
  });
});

describe("PATCH /api/tasks/:id (US3)", () => {
  it("sets completed to true and back to false explicitly (FR-005)", async () => {
    const created = await (await POST(postRequest({ title: "토글 대상" }))).json();
    const id = created.data.id as number;

    const toggled = await (await PATCH(patchRequest({ completed: true }), withId(String(id)))).json();
    expect(toggled.data.completed).toBe(true);

    const toggledAgain = await (
      await PATCH(patchRequest({ completed: false }), withId(String(id)))
    ).json();
    expect(toggledAgain.data.completed).toBe(false);
  });

  it("returns 404 for a non-existent id (FR-007)", async () => {
    const res = await PATCH(new Request("http://localhost"), withId("999999"));
    expect(res.status).toBe(404);
  });

  it("updates priority", async () => {
    const created = await (await POST(postRequest({ title: "우선순위 변경" }))).json();
    const id = created.data.id as number;

    const res = await PATCH(patchRequest({ priority: "LOW" }), withId(String(id)));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.priority).toBe("LOW");
  });

  it("updates completed and priority together in one call", async () => {
    const created = await (await POST(postRequest({ title: "동시 변경" }))).json();
    const id = created.data.id as number;

    const res = await PATCH(patchRequest({ completed: true, priority: "HIGH" }), withId(String(id)));
    const body = await res.json();
    expect(body.data).toMatchObject({ completed: true, priority: "HIGH" });
  });

  it("rejects an empty body with no fields to update", async () => {
    const created = await (await POST(postRequest({ title: "빈 요청" }))).json();
    const id = created.data.id as number;

    const res = await PATCH(patchRequest({}), withId(String(id)));
    expect(res.status).toBe(400);
  });

  it("rejects an invalid priority value on update", async () => {
    const created = await (await POST(postRequest({ title: "잘못된 값" }))).json();
    const id = created.data.id as number;

    const res = await PATCH(patchRequest({ priority: "URGENT" }), withId(String(id)));
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/tasks/:id (US4)", () => {
  it("deletes an existing todo so it no longer appears in the list (FR-006, SC-003)", async () => {
    const created = await (await POST(postRequest({ title: "삭제 대상" }))).json();
    const id = created.data.id as number;

    const res = await DELETE(new Request("http://localhost"), withId(String(id)));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual({ id });

    const listRes = await GET();
    const listBody = await listRes.json();
    expect(listBody.data).toEqual([]);
  });

  it("returns 404 for a non-existent id and does not affect other todos (FR-007)", async () => {
    const created = await (await POST(postRequest({ title: "영향 없어야 함" }))).json();

    const res = await DELETE(new Request("http://localhost"), withId("999999"));
    expect(res.status).toBe(404);

    const listRes = await GET();
    const listBody = await listRes.json();
    expect(listBody.data).toHaveLength(1);
    expect(listBody.data[0].id).toBe(created.data.id);
  });
});
