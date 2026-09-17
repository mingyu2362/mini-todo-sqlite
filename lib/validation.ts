import { z } from "zod";
import { PRIORITIES, DEFAULT_PRIORITY } from "./priority";

export const todoTitleSchema = z
  .string()
  .trim()
  .min(1, "제목은 필수이며 공백일 수 없습니다.")
  .max(200, "제목은 최대 200자까지 입력할 수 있습니다.");

export const todoPrioritySchema = z.enum(PRIORITIES, {
  error: "우선순위는 HIGH, MEDIUM, LOW 중 하나여야 합니다.",
});

export const createTodoSchema = z.object({
  title: todoTitleSchema,
  priority: todoPrioritySchema.default(DEFAULT_PRIORITY),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;

export const updateTodoSchema = z
  .object({
    completed: z.boolean().optional(),
    priority: todoPrioritySchema.optional(),
  })
  .refine((data) => data.completed !== undefined || data.priority !== undefined, {
    message: "completed 또는 priority 중 최소 하나는 포함되어야 합니다.",
  });

export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
