import { Link } from "@tanstack/react-router";
import { ChevronUp } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PageLoader } from "@/components/PageLoader";
import { useDoneTasks, type Task } from "@/lib/sites";
import {
  daysToComplete,
  formatCompletedTime,
  formatDayKey,
  formatDayLabel,
  isRecentFeedDay,
} from "@/lib/tasks";

function toDate(value: number | Date): Date {
  return typeof value === "number" ? new Date(value) : value;
}

type DailyFeedProps = {
  siteSlug?: string;
  title?: string;
  description?: string;
  showSiteBadge?: boolean;
  emptyMessage?: string;
};

type DayGroup = {
  key: string;
  label: string;
  tasks: Task[];
};

function groupTasksByDay(tasks: Task[]): DayGroup[] {
  const groups = new Map<string, DayGroup>();

  for (const task of tasks) {
    if (!task.completedAt) continue;
    const completedAt = toDate(task.completedAt);
    const key = formatDayKey(completedAt);

    const existing = groups.get(key);
    if (existing) {
      existing.tasks.push(task);
      continue;
    }

    groups.set(key, {
      key,
      label: formatDayLabel(completedAt),
      tasks: [task],
    });
  }

  return [...groups.values()].sort((a, b) => b.key.localeCompare(a.key));
}

export function DailyFeed({
  siteSlug,
  title = "Completed",
  description,
  showSiteBadge = false,
  emptyMessage = "No completed tasks yet.",
}: DailyFeedProps) {
  const { isLoading, error, tasks } = useDoneTasks(siteSlug);

  if (isLoading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">
        Failed to load completed tasks.
      </p>
    );
  }

  const dayGroups = groupTasksByDay(tasks);

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {dayGroups.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {dayGroups.map((group) => (
            <Collapsible
              key={group.key}
              className="group"
              defaultOpen={isRecentFeedDay(group.key)}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer border-b border-border pb-4">
                    <CardTitle>{group.label}</CardTitle>
                    <CardDescription>
                      {group.tasks.length}{" "}
                      {group.tasks.length === 1 ? "task" : "tasks"} completed
                    </CardDescription>
                    <CardAction>
                      <ChevronUp className="size-8 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </CardAction>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-3 pt-4">
                    {group.tasks.map((task) => {
                      const createdAt = toDate(task.createdAt);
                      const completedAt = toDate(task.completedAt!);

                      return (
                        <div
                          key={task.id}
                          className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/20 px-4 py-3"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{task.text}</p>
                              {showSiteBadge && task.site ? (
                                <Link
                                  to="/$site"
                                  params={{ site: task.site.slug }}
                                  className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                                >
                                  {task.site.name}
                                </Link>
                              ) : null}
                            </div>
                            {task.description ? (
                              <p className="text-sm text-muted-foreground">
                                {task.description}
                              </p>
                            ) : null}
                          </div>
                          <div className="shrink-0 text-right text-xs text-muted-foreground">
                            <p>{formatCompletedTime(completedAt)}</p>
                            <p>{daysToComplete(createdAt, completedAt)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </section>
  );
}
