import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { DailyFeed } from "@/components/DailyFeed";
import { PageLoader } from "@/components/PageLoader";
import { SiteAvatar } from "@/components/SiteAvatar";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSites } from "@/lib/sites";

export const Route = createFileRoute("/")({
  component: HubPage,
});

function HubPage() {
  const { isLoading, sites } = useSites();

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Change Log</h1>
        <p className="text-muted-foreground">
          Track work across your sites and publish completed tasks by day.
        </p>
      </div>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold tracking-tight">Sites</h2>
        {sites.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No sites yet</CardTitle>
              <CardDescription>
                Sign in and add your first site from the navbar.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sites.map((site) => (
              <Link
                key={site.id}
                to="/$site"
                params={{ site: site.slug }}
                className="group block rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Card className="h-full transition-colors group-hover:bg-muted/40">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <SiteAvatar
                          name={site.name}
                          logoUrl={site.logo?.url}
                          className="size-10"
                        />
                        <CardTitle>{site.name}</CardTitle>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <CardDescription>
                      {site.description ?? `/${site.slug}`}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <DailyFeed
        title="All completed"
        description="Completed tasks across every site, grouped by day."
        showSiteBadge
        emptyMessage="No completed tasks yet across any site."
      />
    </main>
  );
}
