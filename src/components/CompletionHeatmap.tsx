import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageLoader } from "@/components/PageLoader";
import {
  buildHeatmapWeeks,
  countTasksByDay,
  formatHeatmapTooltip,
  getHeatmapLevel,
  getHeatmapMax,
  HEATMAP_LEVEL_CLASSES,
} from "@/lib/completion-heatmap";
import { useDoneTasks } from "@/lib/sites";
import { cn } from "@/lib/utils";

type CompletionHeatmapProps = {
  siteSlug?: string;
};

export function CompletionHeatmap({ siteSlug }: CompletionHeatmapProps = {}) {
  const { isLoading, error, tasks } = useDoneTasks(siteSlug);

  if (isLoading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">Failed to load activity data.</p>
    );
  }

  const counts = countTasksByDay(tasks);
  const max = getHeatmapMax(counts);
  const weeks = buildHeatmapWeeks(counts);
  const hasActivity = max > 0;
  const emptyMessage = siteSlug
    ? "No completed tasks yet for this site."
    : "No completed tasks yet across any site.";

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">Activity</h2>
        <p className="text-sm text-muted-foreground">
          Tasks completed per day over the last year.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Completion heatmap</CardTitle>
          <CardDescription>
            {hasActivity
              ? `${tasks.length} completed ${tasks.length === 1 ? "task" : "tasks"} in the last 52 weeks`
              : "Complete tasks to see activity here."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasActivity ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </p>
          ) : (
            <div className="space-y-3">
              <div className="overflow-x-auto pb-1">
                <div className="inline-flex gap-1">
                  {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-1">
                      {week.map((cell) => {
                        const level = getHeatmapLevel(cell.count, max);
                        return (
                          <div
                            key={cell.key}
                            title={formatHeatmapTooltip(cell.date, cell.count)}
                            className={cn(
                              "size-3 rounded-sm",
                              HEATMAP_LEVEL_CLASSES[level],
                            )}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                <span>Less</span>
                {([0, 1, 2, 3, 4] as const).map((level) => (
                  <div
                    key={level}
                    className={cn(
                      "size-3 rounded-sm",
                      HEATMAP_LEVEL_CLASSES[level],
                    )}
                  />
                ))}
                <span>More</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
