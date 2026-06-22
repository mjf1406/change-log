import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { z } from "zod";
import { CompletionHeatmap } from "@/components/CompletionHeatmap";
import { DailyFeed } from "@/components/DailyFeed";
import {
  getTodoColumnLength,
  KanbanBoard,
} from "@/components/KanbanBoard";
import { PageLoader } from "@/components/PageLoader";
import { SiteNotFound } from "@/components/SiteNotFound";
import { SitePageHeader } from "@/components/SitePageHeader";
import { TaskFormDialog } from "@/components/TaskFormDialog";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/lib/admin";
import { useSiteBySlug } from "@/lib/sites";

const siteSearchSchema = z.object({
  tab: z.enum(["feed", "board"]).catch("feed"),
});

export const Route = createFileRoute("/$site/")({
  validateSearch: siteSearchSchema,
  component: SitePage,
});

function SitePage() {
  const { site: siteSlug } = Route.useParams();
  const { tab } = Route.useSearch();
  const { isLoading: authLoading, isAdmin } = useIsAdmin();
  const { isLoading, site } = useSiteBySlug(siteSlug);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  if (isLoading || authLoading) {
    return <PageLoader />;
  }

  if (!site) {
    return <SiteNotFound slug={siteSlug} />;
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <SitePageHeader site={site} activeTab={tab} />

      {tab === "feed" ? (
        <div className="space-y-10">
          <DailyFeed
            siteSlug={site.slug}
            title="Completed"
            description="Tasks completed for this site, grouped by day."
            emptyMessage="No completed tasks yet for this site."
          />
          <CompletionHeatmap siteSlug={site.slug} />
        </div>
      ) : (
        <div className="space-y-6">
          {isAdmin ? (
            <div className="flex justify-end">
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus data-icon="inline-start" />
                Add task
              </Button>
            </div>
          ) : null}
          <KanbanBoard site={site} />
        </div>
      )}

      {isAdmin ? (
        <TaskFormDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          mode="create"
          siteId={site.id}
          nextOrder={getTodoColumnLength(site)}
        />
      ) : null}
    </main>
  );
}
