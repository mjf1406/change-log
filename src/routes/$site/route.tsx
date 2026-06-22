import {
  createFileRoute,
  Outlet,
  useMatchRoute,
} from "@tanstack/react-router";
import { PageLoader } from "@/components/PageLoader";
import { SiteNotFound } from "@/components/SiteNotFound";
import { SitePageHeader } from "@/components/SitePageHeader";
import { useSiteBySlug } from "@/lib/sites";

export const Route = createFileRoute("/$site")({
  pendingMs: 0,
  pendingMinMs: 0,
  component: SiteLayout,
});

function SiteLayout() {
  const { site: siteSlug } = Route.useParams();
  const { isLoading, site } = useSiteBySlug(siteSlug);
  const matchRoute = useMatchRoute();
  const activeTab = matchRoute({ to: "/$site/board" }) ? "board" : "feed";

  if (isLoading && !site) {
    return <PageLoader />;
  }

  if (!site) {
    return <SiteNotFound slug={siteSlug} />;
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <SitePageHeader site={site} activeTab={activeTab} />
      <Outlet />
    </main>
  );
}
