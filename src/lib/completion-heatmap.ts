import type { Task } from "@/lib/sites";
import { formatDayKey } from "@/lib/tasks";

export type HeatmapCell = {
  date: Date;
  key: string;
  count: number;
};

function toDate(value: number | Date): Date {
  return typeof value === "number" ? new Date(value) : value;
}

export function countTasksByDay(tasks: Task[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const task of tasks) {
    if (!task.completedAt) continue;
    const key = formatDayKey(toDate(task.completedAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}

export function buildHeatmapWeeks(
  counts: Map<string, number>,
  weeks = 52,
): HeatmapCell[][] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalDays = weeks * 7;
  const endDate = new Date(today);

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - totalDays + 1);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const result: HeatmapCell[][] = [];
  let currentWeek: HeatmapCell[] = [];

  const current = new Date(startDate);
  while (current <= endDate) {
    const key = formatDayKey(current);
    currentWeek.push({
      date: new Date(current),
      key,
      count: counts.get(key) ?? 0,
    });

    if (current.getDay() === 6) {
      result.push(currentWeek);
      currentWeek = [];
    }

    current.setDate(current.getDate() + 1);
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      const last = currentWeek[currentWeek.length - 1]!;
      const next = new Date(last.date);
      next.setDate(next.getDate() + 1);
      currentWeek.push({
        date: next,
        key: formatDayKey(next),
        count: counts.get(formatDayKey(next)) ?? 0,
      });
    }
    result.push(currentWeek);
  }

  return result;
}

export function getHeatmapMax(counts: Map<string, number>): number {
  let max = 0;
  for (const count of counts.values()) {
    if (count > max) max = count;
  }
  return max;
}

export function getHeatmapLevel(
  count: number,
  max: number,
): 0 | 1 | 2 | 3 | 4 {
  if (count === 0 || max === 0) return 0;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

export const HEATMAP_LEVEL_CLASSES: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-muted",
  1: "bg-primary/25",
  2: "bg-primary/45",
  3: "bg-primary/70",
  4: "bg-primary",
};

export function formatHeatmapTooltip(date: Date, count: number): string {
  const label = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (count === 0) return `No tasks on ${label}`;
  if (count === 1) return `1 task on ${label}`;
  return `${count} tasks on ${label}`;
}
