import type { SiteWithTasks } from "@/lib/sites";
import type { TaskStatus } from "@/lib/tasks";

export type DateSort = "desc" | "asc";

export type WorkOrderTaskSnapshot = {
  id: string;
  text: string;
  description?: string;
  status: string;
  order: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
};

export type WorkOrderSiteSnapshot = {
  id: string;
  name: string;
  slug: string;
  logo?: { url?: string } | null;
  tasks: WorkOrderTaskSnapshot[];
};

export type WorkOrderItem = {
  task: WorkOrderTaskSnapshot;
  site: Pick<WorkOrderSiteSnapshot, "id" | "name" | "slug" | "logo">;
};

export type WorkOrderFilterRequest = {
  requestId: number;
  sites: WorkOrderSiteSnapshot[];
  selectedStatuses: TaskStatus[];
  dateSort: DateSort;
};

export type WorkOrderFilterResponse = {
  requestId: number;
  items: WorkOrderItem[];
};

export function toWorkOrderSiteSnapshots(
  sites: SiteWithTasks[],
): WorkOrderSiteSnapshot[] {
  return sites.map((site) => ({
    id: site.id,
    name: site.name,
    slug: site.slug,
    logo: site.logo ? { url: site.logo.url } : null,
    tasks: (site.tasks ?? []).map((task) => ({
      id: task.id,
      text: task.text,
      description: task.description,
      status: task.status,
      order: task.order,
      createdAt: task.createdAt,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
    })),
  }));
}

function sortWorkOrderItems(items: WorkOrderItem[], dateSort: DateSort) {
  const direction = dateSort === "desc" ? -1 : 1;

  return [...items].sort((a, b) => {
    const dateDiff = (a.task.createdAt - b.task.createdAt) * direction;
    if (dateDiff !== 0) return dateDiff;
    return a.task.order - b.task.order;
  });
}

export function filterAndSortWorkOrderItems(
  sites: WorkOrderSiteSnapshot[],
  selectedStatuses: TaskStatus[],
  dateSort: DateSort,
): WorkOrderItem[] {
  if (selectedStatuses.length === 0) {
    return [];
  }

  const statusSet = new Set(selectedStatuses);
  const items: WorkOrderItem[] = [];

  for (const site of sites) {
    for (const task of site.tasks) {
      if (!statusSet.has(task.status as TaskStatus)) {
        continue;
      }

      items.push({
        task,
        site: {
          id: site.id,
          name: site.name,
          slug: site.slug,
          logo: site.logo,
        },
      });
    }
  }

  return sortWorkOrderItems(items, dateSort);
}

export function countSitesWithTasks(items: WorkOrderItem[]): number {
  return new Set(items.map((item) => item.site.id)).size;
}
