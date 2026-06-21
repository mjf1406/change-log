import { createFileRoute, Link } from "@tanstack/react-router";
import { LayoutGrid } from "lucide-react";
import { DailyFeed } from "@/components/DailyFeed";
import { PageLoader } from "@/components/PageLoader";
import { SiteAvatar } from "@/components/SiteAvatar";
import { SiteNotFound } from "@/components/SiteNotFound";
import { Button } from "@/components/ui/button";
import { useSiteBySlug } from "@/lib/sites";

export const Route = createFileRoute("/$site/")({
  component: SiteFeedPage,
});

function SiteFeedPage() {
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
        <div className="flex items-start gap-4">
          <SiteAvatar
            name={site.name}
            logoUrl={site.logo?.url}
            className="size-14"
          />
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {site.name}
            </h1>
            {site.description ? (
              <p className="text-muted-foreground">{site.description}</p>
            ) : null}
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link to="/$site/board" params={{ site: site.slug }}>
            <LayoutGrid data-icon="inline-start" />
            View board
          </Link>
        </Button>
      </div>

      <DailyFeed
        siteSlug={site.slug}
        title="Completed"
        description="Tasks completed for this site, grouped by day."
        emptyMessage="No completed tasks yet for this site."
      />
    </main>
  );
}
