import { prisma } from "@/lib/prisma";
import { createTodoSchema } from "@/lib/validation";
import { jsonData, jsonError } from "@/lib/api-response";

export async function GET() {
  const todos = await prisma.todo.findMany({
    orderBy: { createdAt: "asc" },
  });
  return jsonData(todos);
}

export async function POST(request: Request) {
  const body: unknown = await request.json();
  const result = createTodoSchema.safeParse(body);

  if (!result.success) {
    return jsonError(result.error.issues[0]?.message ?? "잘못된 요청입니다.", 400);
  }

  const todo = await prisma.todo.create({
    data: { title: result.data.title, priority: result.data.priority },
  });

  return jsonData(todo, 201);
}
