import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ChevronDown, Copy, Pencil, Trash2 } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { PageLoader } from "@/components/PageLoader";
import { SiteAvatar } from "@/components/SiteAvatar";
import { TaskFormDialog } from "@/components/TaskFormDialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SiteWithTasks, Task } from "@/lib/sites";
import { useWorkOrderSites } from "@/lib/sites";
import { useIsAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  formatTaskDateTime,
  formatTaskForCopy,
  getStatusUpdates,
  toDate,
  type TaskStatus,
} from "@/lib/tasks";
import { cn } from "@/lib/utils";

type DateSort = "desc" | "asc";

type WorkOrderItem = {
  task: SiteWithTasks["tasks"][number];
  site: Pick<SiteWithTasks, "id" | "name" | "slug" | "logo">;
};

function sortWorkOrderItems(items: WorkOrderItem[], dateSort: DateSort) {
  const direction = dateSort === "desc" ? -1 : 1;

  return [...items].sort((a, b) => {
    const dateDiff = (a.task.createdAt - b.task.createdAt) * direction;
    if (dateDiff !== 0) return dateDiff;
    return a.task.order - b.task.order;
  });
}

function SiteBadge({
  site,
}: {
  site: Pick<SiteWithTasks, "name" | "slug">;
}) {
  return (
    <Link
      to="/$site/board"
      params={{ site: site.slug }}
      className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {site.name}
    </Link>
  );
}

function getAppendColumnOrder(
  tasks: SiteWithTasks["tasks"],
  status: TaskStatus,
  excludeTaskId: string,
) {
  const column = tasks.filter(
    (task) => task.status === status && task.id !== excludeTaskId,
  );
  if (column.length === 0) return 0;
  return Math.max(...column.map((task) => task.order)) + 1;
}

function statusBadgeClass(status: TaskStatus) {
  return cn(
    "shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium",
    status === "doing"
      ? "border-primary/30 bg-primary/10 text-primary"
      : "border-border bg-muted text-muted-foreground",
  );
}

function StatusBadge({ status }: { status: TaskStatus }) {
  if (!TASK_STATUSES.includes(status)) return null;

  return <span className={statusBadgeClass(status)}>{TASK_STATUS_LABELS[status]}</span>;
}

function StatusSelect({
  status,
  disabled,
  onChange,
}: {
  status: TaskStatus;
  disabled?: boolean;
  onChange: (status: TaskStatus) => void;
}) {
  if (!TASK_STATUSES.includes(status)) return null;

  return (
    <div className="relative shrink-0">
      <select
        value={status}
        disabled={disabled}
        aria-label="Task status"
        onChange={(event) => onChange(event.target.value as TaskStatus)}
        className={cn(
          statusBadgeClass(status),
          "cursor-pointer appearance-none pr-7 shadow-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {TASK_STATUSES.map((option) => (
          <option key={option} value={option}>
            {TASK_STATUS_LABELS[option]}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-1.5 size-3 -translate-y-1/2 opacity-60"
        aria-hidden
      />
    </div>
  );
}

function WorkOrderTaskRow({
  item,
  isAdmin,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  item: WorkOrderItem;
  isAdmin: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, siteId: string, status: TaskStatus) => void;
}) {
  const { task, site } = item;
  const status = task.status as TaskStatus;
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  return (
    <li className="flex overflow-hidden rounded-lg border border-border bg-card">
      <Link
        to="/$site/board"
        params={{ site: site.slug }}
        className="flex w-16 shrink-0 items-center justify-center self-stretch overflow-hidden border-r border-border bg-muted p-2"
        aria-label={`${site.name} board`}
      >
        <SiteAvatar
          name={site.name}
          logoUrl={site.logo?.url}
          className={cn(
            "rounded-none",
            site.logo?.url
              ? "max-h-full max-w-full object-contain"
              : "size-full",
          )}
        />
      </Link>

      <div className="flex min-w-0 flex-1 items-start gap-3 p-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <SiteBadge site={site} />
            {isAdmin ? (
              <StatusSelect
                status={status}
                onChange={(nextStatus) =>
                  onStatusChange(task as Task, site.id, nextStatus)
                }
              />
            ) : (
              <StatusBadge status={status} />
            )}
            <p className="font-medium leading-snug">{task.text}</p>
          </div>
          {task.description?.trim() ? (
            <p className="text-sm text-muted-foreground">{task.description}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Created {formatTaskDateTime(toDate(task.createdAt))}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={copied ? "Copied" : "Copy task"}
            onClick={() => {
              void navigator.clipboard
                .writeText(
                  formatTaskForCopy({
                    text: `[${site.name}] ${task.text}`,
                    description: task.description,
                  }),
                )
                .then(() => {
                  setCopied(true);
                  if (copyTimeoutRef.current) {
                    clearTimeout(copyTimeoutRef.current);
                  }
                  copyTimeoutRef.current = setTimeout(
                    () => setCopied(false),
                    1500,
                  );
                })
                .catch((error) => {
                  console.error("Failed to copy task", error);
                });
            }}
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>

          {isAdmin ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Edit task"
                onClick={() => onEdit(task as Task)}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-destructive"
                aria-label="Delete task"
                onClick={() => onDelete(task as Task)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export function WorkOrderList() {
  const { isAdmin } = useIsAdmin();
  const { isLoading, error, sites } = useWorkOrderSites();
  const [dateSort, setDateSort] = useState<DateSort>("desc");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const sitesWithTasks = useMemo(
    () => sites.filter((site) => site.tasks.length > 0),
    [sites],
  );

  const sortedItems = useMemo(() => {
    const items: WorkOrderItem[] = sitesWithTasks.flatMap((site) =>
      site.tasks.map((task) => ({
        task,
        site: {
          id: site.id,
          name: site.name,
          slug: site.slug,
          logo: site.logo,
        },
      })),
    );
    return sortWorkOrderItems(items, dateSort);
  }, [sitesWithTasks, dateSort]);

  const totalTasks = sortedItems.length;

  const handleDeleteTask = () => {
    if (!taskToDelete || !isAdmin) return;
    void db.transact(db.tx.tasks[taskToDelete.id].delete());
  };

  const handleStatusChange = (
    task: Task,
    siteId: string,
    toStatus: TaskStatus,
  ) => {
    if (!isAdmin) return;

    const fromStatus = task.status as TaskStatus;
    if (fromStatus === toStatus || !TASK_STATUSES.includes(fromStatus)) return;

    const site = sitesWithTasks.find((entry) => entry.id === siteId);
    if (!site) return;

    const now = Date.now();
    const order = getAppendColumnOrder(site.tasks, toStatus, task.id);

    void db.transact(
      db.tx.tasks[task.id].update({
        ...getStatusUpdates(fromStatus, toStatus, now),
        order,
      }),
    );
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">Failed to load work order.</p>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {totalTasks === 0
              ? "No open tasks"
              : `${totalTasks} open ${totalTasks === 1 ? "task" : "tasks"} across ${sitesWithTasks.length} ${sitesWithTasks.length === 1 ? "site" : "sites"}`}
          </p>
          {totalTasks > 0 ? (
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant={dateSort === "desc" ? "default" : "outline"}
                size="sm"
                onClick={() => setDateSort("desc")}
              >
                Newest
              </Button>
              <Button
                type="button"
                variant={dateSort === "asc" ? "default" : "outline"}
                size="sm"
                onClick={() => setDateSort("asc")}
              >
                Oldest
              </Button>
            </div>
          ) : null}
        </div>

        {sitesWithTasks.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>All caught up</CardTitle>
              <CardDescription>
                No open tasks across any site. Check individual boards for
                completed work.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <ul className="space-y-2">
            {sortedItems.map((item) => (
              <WorkOrderTaskRow
                key={item.task.id}
                item={item}
                isAdmin={isAdmin}
                onEdit={setEditingTask}
                onDelete={setTaskToDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </ul>
        )}
      </div>

      <TaskFormDialog
        open={editingTask !== null}
        onOpenChange={(open) => {
          if (!open) setEditingTask(null);
        }}
        mode="edit"
        task={editingTask ?? undefined}
      />

      <DeleteConfirmDialog
        open={taskToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setTaskToDelete(null);
        }}
        title="Delete task?"
        description={
          taskToDelete
            ? `Delete "${taskToDelete.text}"? This cannot be undone.`
            : ""
        }
        onConfirm={handleDeleteTask}
      />
    </>
  );
}
