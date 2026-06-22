import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { CompletionHeatmap } from "@/components/CompletionHeatmap";
import { DailyFeed } from "@/components/DailyFeed";

const legacySearchSchema = z.object({
  tab: z.enum(["feed", "board"]).optional().catch(undefined),
});

export const Route = createFileRoute("/$site/")({
  validateSearch: legacySearchSchema,
  beforeLoad: ({ search, params }) => {
    if (search.tab === "board") {
      throw redirect({
        to: "/$site/board",
        params: { site: params.site },
      });
    }
  },
  pendingMs: 0,
  pendingMinMs: 0,
  component: SiteFeedPage,
});

function SiteFeedPage() {
  const { site: siteSlug } = Route.useParams();

  return (
    <div className="space-y-10">
      <DailyFeed
        siteSlug={siteSlug}
        title="Completed"
        description="Tasks completed for this site, grouped by day."
        emptyMessage="No completed tasks yet for this site."
      />
      <CompletionHeatmap siteSlug={siteSlug} />
    </div>
  );
}
