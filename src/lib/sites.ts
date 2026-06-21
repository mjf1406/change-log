import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { db } from "@/lib/db";

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
