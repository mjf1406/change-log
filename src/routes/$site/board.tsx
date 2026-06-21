import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { PageLoader } from "@/components/PageLoader";
import { SiteNotFound } from "@/components/SiteNotFound";
import { Button } from "@/components/ui/button";
import { useSiteBySlug } from "@/lib/sites";

export const Route = createFileRoute("/$site/board")({
  component: SiteBoardPage,
});

function SiteBoardPage() {
  const { site: siteSlug } = Route.useParams();
  const { isLoading, site } = useSiteBySlug(siteSlug);

  if (isLoading) {
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
        <Button variant="outline" asChild>
          <Link to="/$site" params={{ site: site.slug }}>
            <ArrowLeft data-icon="inline-start" />
            Back to feed
          </Link>
        </Button>
      </div>

      <KanbanBoard site={site} />
    </main>
  );
}
