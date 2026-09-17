import { z } from "zod";

export const todoTitleSchema = z
  .string()
  .trim()
  .min(1, "제목은 필수이며 공백일 수 없습니다.")
  .max(200, "제목은 최대 200자까지 입력할 수 있습니다.");

export const createTodoSchema = z.object({
  title: todoTitleSchema,
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
