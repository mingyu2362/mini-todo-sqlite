export const PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const DEFAULT_PRIORITY: Priority = "MEDIUM";

export const PRIORITY_LABELS: Record<Priority, string> = {
  HIGH: "높음",
  MEDIUM: "보통",
  LOW: "낮음",
};
