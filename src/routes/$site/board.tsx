import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import {
  getTodoColumnLength,
  KanbanBoard,
} from "@/components/KanbanBoard";
import { TaskFormDialog } from "@/components/TaskFormDialog";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/lib/admin";
import { useSiteBySlug } from "@/lib/sites";

export const Route = createFileRoute("/$site/board")({
  pendingMs: 0,
  pendingMinMs: 0,
  component: SiteBoardPage,
});

function SiteBoardPage() {
  const { site: siteSlug } = Route.useParams();
  const { isAdmin } = useIsAdmin();
  const { site } = useSiteBySlug(siteSlug);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  if (!site) {
    return null;
  }

  return (
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

      {isAdmin ? (
        <TaskFormDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          mode="create"
          siteId={site.id}
          nextOrder={getTodoColumnLength(site)}
        />
      ) : null}
    </div>
  );
}
