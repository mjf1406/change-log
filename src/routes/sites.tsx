import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { PageLoader } from "@/components/PageLoader";
import { SiteFormDialog } from "@/components/SiteFormDialog";
import { SortableSiteList } from "@/components/SortableSiteList";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useIsAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { useSites, type SiteWithLogo } from "@/lib/sites";

export const Route = createFileRoute("/sites")({
  component: SitesPage,
});

function SitesPage() {
  const { isLoading: authLoading, isAdmin } = useIsAdmin();
  const { isLoading, sites } = useSites();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingSite, setEditingSite] = useState<SiteWithLogo | undefined>();
  const [siteToDelete, setSiteToDelete] = useState<SiteWithLogo | null>(null);

  if (isLoading || authLoading) {
    return <PageLoader />;
  }

  const openCreateDialog = () => {
    setDialogMode("create");
    setEditingSite(undefined);
    setDialogOpen(true);
  };

  const openEditDialog = (site: SiteWithLogo) => {
    setDialogMode("edit");
    setEditingSite(site);
    setDialogOpen(true);
  };

  const handleDeleteSite = () => {
    if (!siteToDelete) return;
    void db.transact(db.tx.sites[siteToDelete.id].delete());
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Sites</h1>
          <p className="text-muted-foreground">
            Manage sites, ordering, logos, and links.
          </p>
        </div>
        {isAdmin ? (
          <Button
            variant="default"
            size="icon-sm"
            onClick={openCreateDialog}
            aria-label="Add site"
          >
            <Plus />
          </Button>
        ) : null}
      </div>

      {!isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>
              Sign in as the admin to manage sites.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : sites.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No sites yet</CardTitle>
            <CardDescription>
              Add your first site to get started.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <SortableSiteList
          sites={sites}
          isAdmin={isAdmin}
          onEdit={openEditDialog}
          onDelete={setSiteToDelete}
        />
      )}

      <SiteFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        site={editingSite}
      />

      <DeleteConfirmDialog
        open={siteToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setSiteToDelete(null);
        }}
        title="Delete site?"
        description={
          siteToDelete
            ? `Delete "${siteToDelete.name}"? This will remove the site entry. Linked tasks may need cleanup.`
            : ""
        }
        onConfirm={handleDeleteSite}
      />
    </main>
  );
}
