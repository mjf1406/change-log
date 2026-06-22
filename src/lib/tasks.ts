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

export function toDate(value: number | Date): Date {
  return typeof value === "number" ? new Date(value) : value;
}

export function formatTaskDateTime(date: Date): string {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDuration(start: Date, end: Date): string {
  const ms = Math.max(0, end.getTime() - start.getTime());
  const minutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  }

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return "same day";
}

export type TaskDetailTimingRow = {
  label: string;
  value: string;
};

export function getTaskDetailTiming(task: Task): TaskDetailTimingRow[] {
  const status = task.status as TaskStatus;
  const createdAt = toDate(task.createdAt);
  const startedAt = task.startedAt;
  const completedAt = task.completedAt;

  const rows: TaskDetailTimingRow[] = [
    {
      label: "Status",
      value: TASK_STATUSES.includes(status)
        ? TASK_STATUS_LABELS[status]
        : task.status,
    },
    { label: "Created", value: formatTaskDateTime(createdAt) },
    {
      label: "Started",
      value:
        startedAt != null ? formatTaskDateTime(toDate(startedAt)) : "Not started",
    },
    {
      label: "Completed",
      value:
        completedAt != null
          ? formatTaskDateTime(toDate(completedAt))
          : "Not completed",
    },
  ];

  if (completedAt != null) {
    const completedDate = toDate(completedAt);
    rows.push({
      label: "Active time",
      value:
        startedAt != null
          ? formatDuration(toDate(startedAt), completedDate)
          : "Skipped Doing",
    });
    rows.push({
      label: "Total time",
      value: formatDuration(createdAt, completedDate),
    });
  }

  return rows;
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

export function formatCompletedTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function isRecentFeedDay(dayKey: string, windowDays = 3): boolean {
  const today = new Date();
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (formatDayKey(d) === dayKey) return true;
  }
  return false;
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
