import { describe, expect, it } from "vite-plus/test";
import { DEFAULT_WORK_ORDER_STATUSES } from "@/lib/tasks";
import {
  countSitesWithTasks,
  filterAndSortWorkOrderItems,
  type WorkOrderSiteSnapshot,
} from "@/lib/workOrderFilter";

const sites: WorkOrderSiteSnapshot[] = [
  {
    id: "site-a",
    name: "Alpha",
    slug: "alpha",
    logo: null,
    tasks: [
      {
        id: "task-1",
        text: "Todo task",
        status: "todo",
        order: 0,
        createdAt: 100,
      },
      {
        id: "task-2",
        text: "Doing task",
        status: "doing",
        order: 1,
        createdAt: 200,
      },
      {
        id: "task-3",
        text: "Done task",
        status: "done",
        order: 2,
        createdAt: 300,
      },
    ],
  },
  {
    id: "site-b",
    name: "Beta",
    slug: "beta",
    logo: { url: "https://example.com/logo.png" },
    tasks: [
      {
        id: "task-4",
        text: "Dream",
        status: "dreams",
        order: 0,
        createdAt: 150,
      },
    ],
  },
];

describe("filterAndSortWorkOrderItems", () => {
  it("filters to the default todo and doing statuses", () => {
    const items = filterAndSortWorkOrderItems(sites, DEFAULT_WORK_ORDER_STATUSES, "desc");

    expect(items.map((item) => item.task.id)).toEqual(["task-2", "task-1"]);
    expect(
      items.every((item) =>
        DEFAULT_WORK_ORDER_STATUSES.includes(item.task.status as "todo" | "doing"),
      ),
    ).toBe(true);
  });

  it("returns an empty list when no statuses are selected", () => {
    expect(filterAndSortWorkOrderItems(sites, [], "desc")).toEqual([]);
  });

  it("sorts newest first by default", () => {
    const items = filterAndSortWorkOrderItems(sites, ["todo", "doing", "done", "dreams"], "desc");

    expect(items.map((item) => item.task.id)).toEqual(["task-3", "task-2", "task-4", "task-1"]);
  });

  it("sorts oldest first when requested", () => {
    const items = filterAndSortWorkOrderItems(sites, ["todo", "doing", "done", "dreams"], "asc");

    expect(items.map((item) => item.task.id)).toEqual(["task-1", "task-4", "task-2", "task-3"]);
  });

  it("flattens tasks from multiple sites", () => {
    const items = filterAndSortWorkOrderItems(sites, ["dreams"], "desc");

    expect(items).toHaveLength(1);
    expect(items[0]?.site.slug).toBe("beta");
    expect(items[0]?.task.text).toBe("Dream");
  });
});

describe("countSitesWithTasks", () => {
  it("counts unique sites in filtered items", () => {
    const items = filterAndSortWorkOrderItems(sites, ["todo", "doing", "dreams"], "desc");

    expect(countSitesWithTasks(items)).toBe(2);
  });
});
