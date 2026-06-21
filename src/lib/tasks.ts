import type { Task } from "@/lib/sites";
import { db } from "@/lib/db";

export const TASK_STATUSES = ["todo", "doing", "done"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Todo",
  doing: "Doing",
  done: "Done",
};

export type ColumnTasks = Record<TaskStatus, Task[]>;

export function getStatusUpdates(
  fromStatus: TaskStatus,
  toStatus: TaskStatus,
  now: number,
): Partial<{
  status: TaskStatus;
  startedAt: number | null;
  completedAt: number | null;
}> {
  if (fromStatus === toStatus) {
    return { status: toStatus };
  }

  const updates: Partial<{
    status: TaskStatus;
    startedAt: number | null;
    completedAt: number | null;
  }> = { status: toStatus };

  if (toStatus === "doing" && fromStatus === "todo") {
    updates.startedAt = now;
  }

  if (toStatus === "done") {
    updates.completedAt = now;
  }

  if (fromStatus === "done" && toStatus !== "done") {
    updates.completedAt = null;
  }

  if (fromStatus === "doing" && toStatus === "todo") {
    updates.startedAt = null;
  }

  return updates;
}

export function buildColumnPersistTxs(
  nextColumns: ColumnTasks,
  movedTaskId: string,
  fromStatus: TaskStatus,
  toStatus: TaskStatus,
  now: number,
) {
  const affected =
    fromStatus === toStatus ? [fromStatus] : [fromStatus, toStatus];
  const txs = [];

  for (const status of affected) {
    for (const [index, task] of nextColumns[status].entries()) {
      if (task.id === movedTaskId) {
        txs.push(
          db.tx.tasks[task.id].update({
            ...getStatusUpdates(fromStatus, toStatus, now),
            order: index,
          }),
        );
      } else if (task.order !== index) {
        txs.push(db.tx.tasks[task.id].update({ order: index }));
      }
    }
  }

  return txs;
}

export function daysToComplete(createdAt: Date, completedAt: Date): string {
  const ms = completedAt.getTime() - createdAt.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days <= 0) return "same day";
  return `${days}d`;
}

export function formatDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatDayLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const key = formatDayKey(date);
  if (key === formatDayKey(today)) return "Today";
  if (key === formatDayKey(yesterday)) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
