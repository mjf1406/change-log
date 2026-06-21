import { z } from "zod";
import type { Task } from "@/lib/sites";

export const taskFormSchema = z.object({
  text: z.string().trim().min(1, "Task name is required"),
  description: z.string(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export function getDefaultTaskFormValues(): TaskFormValues {
  return {
    text: "",
    description: "",
  };
}

export function taskToFormValues(task: Task): TaskFormValues {
  return {
    text: task.text,
    description: task.description ?? "",
  };
}

export function normalizeTaskDescription(description: string): string | undefined {
  const trimmed = description.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
