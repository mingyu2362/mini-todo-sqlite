import { prisma } from "@/lib/prisma";
import { updateTodoSchema } from "@/lib/validation";
import { jsonData, jsonError } from "@/lib/api-response";

type RouteContext = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) ? id : null;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id === null) {
    return jsonError("해당 id의 할 일을 찾을 수 없습니다.", 404);
  }

  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo) {
    return jsonError("해당 id의 할 일을 찾을 수 없습니다.", 404);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("잘못된 요청입니다.", 400);
  }

  const result = updateTodoSchema.safeParse(body);
  if (!result.success) {
    return jsonError(result.error.issues[0]?.message ?? "잘못된 요청입니다.", 400);
  }

  const updated = await prisma.todo.update({
    where: { id },
    data: result.data,
  });

  return jsonData(updated);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id === null) {
    return jsonError("해당 id의 할 일을 찾을 수 없습니다.", 404);
  }

  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo) {
    return jsonError("해당 id의 할 일을 찾을 수 없습니다.", 404);
  }

  await prisma.todo.delete({ where: { id } });

  return jsonData({ id });
}
