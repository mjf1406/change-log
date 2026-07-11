import type { Task } from "@/lib/sites";
import { db } from "@/lib/db";

export const TASK_STATUSES = ["todo", "doing", "done", "dreams"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const MAIN_BOARD_STATUSES = ["todo", "doing", "done"] as const;

export type MainBoardStatus = (typeof MAIN_BOARD_STATUSES)[number];

export const COLUMN_BULK_MOVE_TARGETS: Record<
  MainBoardStatus,
  MainBoardStatus[]
> = {
  todo: ["doing", "done"],
  doing: ["todo", "done"],
  done: ["todo", "doing"],
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Todo",
  doing: "Doing",
  done: "Done",
  dreams: "Dreams",
};

export const DEFAULT_WORK_ORDER_STATUSES: TaskStatus[] = ["todo", "doing"];

export type ColumnTasks = Record<TaskStatus, Task[]>;

export const DONE_BOARD_RETENTION_MS = 24 * 60 * 60 * 1000;

export type BoardTasks = {
  columns: ColumnTasks;
  archived: Task[];
};

export function isTaskArchived(
  task: Pick<Task, "status" | "completedAt">,
  now = Date.now(),
): boolean {
  return (
    task.status === "done" &&
    task.completedAt != null &&
    now - task.completedAt >= DONE_BOARD_RETENTION_MS
  );
}

export function isTaskOnDoneBoard(
  task: Pick<Task, "status" | "completedAt">,
  now = Date.now(),
): boolean {
  return task.status === "done" && !isTaskArchived(task, now);
}

export function splitTasksForBoard(tasks: Task[], now = Date.now()): BoardTasks {
  const columns: ColumnTasks = {
    todo: [],
    doing: [],
    done: [],
    dreams: [],
  };
  const archived: Task[] = [];

  for (const task of tasks) {
    const status = task.status as TaskStatus;
    if (status === "todo" || status === "doing" || status === "dreams") {
      columns[status].push(task);
    } else if (status === "done") {
      if (isTaskArchived(task, now)) {
        archived.push(task);
      } else {
        columns.done.push(task);
      }
    }
  }

  columns.todo.sort((a, b) => a.order - b.order);
  columns.doing.sort((a, b) => a.order - b.order);
  columns.done.sort((a, b) => a.order - b.order);
  columns.dreams.sort((a, b) => a.order - b.order);
  archived.sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));

  return { columns, archived };
}

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

  if (
    toStatus === "doing" &&
    (fromStatus === "todo" || fromStatus === "dreams")
  ) {
    updates.startedAt = now;
  }

  if (toStatus === "done") {
    updates.completedAt = now;
  }

  if (fromStatus === "done" && toStatus !== "done") {
    updates.completedAt = null;
  }

  if (
    fromStatus === "doing" &&
    (toStatus === "todo" || toStatus === "dreams")
  ) {
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

export function buildBulkColumnMoveTxs(
  sourceTasks: Task[],
  destTasks: Task[],
  fromStatus: TaskStatus,
  toStatus: TaskStatus,
  now: number,
) {
  const sorted = [...sourceTasks].sort((a, b) => a.order - b.order);
  const baseOrder = destTasks.length;

  return sorted.map((task, index) =>
    db.tx.tasks[task.id].update({
      ...getStatusUpdates(fromStatus, toStatus, now),
      order: baseOrder + index,
    }),
  );
}

export function getBulkMoveConfirmDescription(
  fromStatus: MainBoardStatus,
  toStatus: MainBoardStatus,
  count: number,
): string {
  const noun = count === 1 ? "task" : "tasks";
  const from = TASK_STATUS_LABELS[fromStatus];
  const to = TASK_STATUS_LABELS[toStatus];
  let message = `Move all ${count} ${from} ${noun} to ${to}?`;
  if (toStatus === "done") {
    message += " This will mark them completed now.";
  }
  return message;
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

export function formatTaskForCopy(
  task: Pick<Task, "text" | "description">,
): string {
  const title = task.text.trim();
  const description = task.description?.trim();
  const titleLine = `- ${title}`;
  if (!description) return titleLine;

  const descriptionLines = description.split("\n").map((line) =>
    line.length === 0 ? "" : `-- ${line}`,
  );
  return [titleLine, ...descriptionLines].join("\n");
}

export function formatTasksForColumnCopy(
  tasks: Pick<Task, "text" | "description">[],
): string {
  return tasks.map(formatTaskForCopy).join("\n");
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
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

export function getSevenDayWindow(pageIndex: number) {
  const today = new Date();
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);
  end.setDate(end.getDate() - pageIndex * 7);

  const start = new Date(end);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);

  return { startMs: start.getTime(), endMs: end.getTime() };
}

export function formatWindowRange(startMs: number, endMs: number): string {
  const start = new Date(startMs);
  const end = new Date(endMs);
  const monthDay: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };

  if (start.getFullYear() !== end.getFullYear()) {
    return `${start.toLocaleDateString(undefined, { ...monthDay, year: "numeric" })} – ${end.toLocaleDateString(undefined, { ...monthDay, year: "numeric" })}`;
  }

  return `${start.toLocaleDateString(undefined, monthDay)} – ${end.toLocaleDateString(undefined, { ...monthDay, year: "numeric" })}`;
}

export function isRecentFeedDay(dayKey: string, windowDays = 7): boolean {
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
