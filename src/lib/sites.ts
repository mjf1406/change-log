import { useMemo } from "react";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { db } from "@/lib/db";
import { getSevenDayWindow } from "@/lib/tasks";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type SiteWithLogo = InstaQLEntity<AppSchema, "sites", { logo: {} }>;
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type Task = InstaQLEntity<AppSchema, "tasks", { site: {} }>;
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type SiteWithTasks = InstaQLEntity<AppSchema, "sites", { tasks: {}; logo: {} }>;

export async function buildSiteOrderTxs(ordered: SiteWithLogo[]) {
  const txs = ordered.map((site, index) =>
    db.tx.sites[site.id].update({ order: index }),
  );
  await db.transact(txs);
}

export function useSites() {
  const { isLoading, error, data } = db.useQuery({
    sites: {
      $: { order: { order: "asc" } },
      logo: {},
    },
  });

  return {
    isLoading,
    error,
    sites: (data?.sites ?? []) as SiteWithLogo[],
  };
}

export function useSiteBySlug(slug: string) {
  const { isLoading, error, data } = db.useQuery({
    sites: {
      $: { where: { slug } },
      tasks: {
        $: { order: { order: "asc" } },
      },
      logo: {},
    },
  });

  return {
    isLoading,
    error,
    site: data?.sites[0] as SiteWithTasks | undefined,
  };
}

export function useWorkOrderSites() {
  const { isLoading, error, data } = db.useQuery({
    sites: {
      $: { order: { order: "asc" } },
      tasks: {
        $: { order: { order: "asc" } },
      },
      logo: {},
    },
  });

  return {
    isLoading,
    error,
    sites: (data?.sites ?? []) as SiteWithTasks[],
  };
}

export function useDoneTasks(siteSlug?: string) {
  const { isLoading, error, data } = db.useQuery({
    tasks: {
      $: {
        where: {
          status: "done",
          ...(siteSlug ? { "site.slug": siteSlug } : {}),
        },
        order: { completedAt: "desc" },
      },
      site: {},
    },
  });

  return {
    isLoading,
    error,
    tasks: (data?.tasks ?? []) as Task[],
  };
}

export function useDoneTasksFeed(siteSlug?: string, pageIndex = 0) {
  const { startMs, endMs } = useMemo(
    () => getSevenDayWindow(pageIndex),
    [pageIndex],
  );

  const feedQuery = siteSlug
    ? {
        tasks: {
          $: {
            where: {
              status: "done",
              completedAt: { $gte: startMs, $lte: endMs },
              "site.slug": siteSlug,
            },
            order: { completedAt: "desc" as const },
          },
          site: {},
        },
      }
    : {
        tasks: {
          $: {
            where: {
              status: "done",
              completedAt: { $gte: startMs, $lte: endMs },
            },
            order: { completedAt: "desc" as const },
          },
          site: {},
        },
      };

  const olderQuery = siteSlug
    ? {
        tasks: {
          $: {
            where: {
              status: "done",
              completedAt: { $lt: startMs },
              "site.slug": siteSlug,
            },
            limit: 1,
          },
          site: {},
        },
      }
    : {
        tasks: {
          $: {
            where: {
              status: "done",
              completedAt: { $lt: startMs },
            },
            limit: 1,
          },
          site: {},
        },
      };

  const { isLoading, error, data } = db.useQuery(feedQuery);
  const { isLoading: isOlderLoading, data: olderData } = db.useQuery(olderQuery);

  const olderTasks = (olderData?.tasks ?? []) as Task[];

  return {
    isLoading: isLoading || isOlderLoading,
    error,
    tasks: (data?.tasks ?? []) as Task[],
    window: { startMs, endMs },
    hasOlder: olderTasks.length > 0,
    hasNewer: pageIndex > 0,
  };
}
