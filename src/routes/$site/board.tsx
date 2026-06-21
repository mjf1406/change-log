import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Plus } from "lucide-react";
import {
  getTodoColumnLength,
  KanbanBoard,
} from "@/components/KanbanBoard";
import { PageLoader } from "@/components/PageLoader";
import { SiteNotFound } from "@/components/SiteNotFound";
import { TaskFormDialog } from "@/components/TaskFormDialog";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/lib/admin";
import { useSiteBySlug } from "@/lib/sites";

export const Route = createFileRoute("/$site/board")({
  component: SiteBoardPage,
});

function SiteBoardPage() {
  const { site: siteSlug } = Route.useParams();
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
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {site.name} board
          </h1>
          <p className="text-muted-foreground">
            Todo, doing, and done for this site.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin ? (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus data-icon="inline-start" />
              Add task
            </Button>
          ) : null}
          <Button variant="outline" asChild>
            <Link to="/$site" params={{ site: site.slug }}>
              <ArrowLeft data-icon="inline-start" />
              Back to feed
            </Link>
          </Button>
        </div>
      </div>

      <KanbanBoard site={site} />

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
