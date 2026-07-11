import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ChevronDown, Copy, Pencil, Trash2 } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { PageLoader } from "@/components/PageLoader";
import { SiteAvatar } from "@/components/SiteAvatar";
import { TaskFormDialog } from "@/components/TaskFormDialog";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useWorkOrderFilter } from "@/hooks/useWorkOrderFilter";
import type { SiteWithTasks, Task } from "@/lib/sites";
import { useWorkOrderSites } from "@/lib/sites";
import { useIsAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import {
  DEFAULT_WORK_ORDER_STATUSES,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  formatTaskDateTime,
  formatTaskForCopy,
  getStatusUpdates,
  toDate,
  type TaskStatus,
} from "@/lib/tasks";
import {
  countSitesWithTasks,
  type DateSort,
  type WorkOrderItem,
} from "@/lib/workOrderFilter";
import { cn } from "@/lib/utils";

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
  const [selectedStatuses, setSelectedStatuses] = useState<TaskStatus[]>(
    DEFAULT_WORK_ORDER_STATUSES,
  );
  const { isLoading, error, sites } = useWorkOrderSites();
  const [dateSort, setDateSort] = useState<DateSort>("desc");
  const { items: sortedItems, isFiltering } = useWorkOrderFilter(
    sites,
    selectedStatuses,
    dateSort,
    !isLoading,
  );
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const siteCount = countSitesWithTasks(sortedItems);
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

    const site = sites.find((entry) => entry.id === siteId);
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
          <p
            className={cn(
              "text-sm text-muted-foreground transition-opacity",
              isFiltering && "opacity-60",
            )}
          >
            {selectedStatuses.length === 0
              ? "Select at least one status to show tasks."
              : totalTasks === 0
                ? "No tasks match the selected statuses."
                : `${totalTasks} ${totalTasks === 1 ? "task" : "tasks"} across ${siteCount} ${siteCount === 1 ? "site" : "sites"}`}
          </p>
          <div
            className={cn(
              "flex shrink-0 flex-wrap items-center justify-end gap-2 transition-opacity",
              isFiltering && "opacity-60",
            )}
          >
            <ButtonGroup aria-label="Filter by status">
              {TASK_STATUSES.map((status) => {
                const selected = selectedStatuses.includes(status);
                return (
                  <Button
                    key={status}
                    type="button"
                    size="sm"
                    variant={selected ? "default" : "outline"}
                    aria-pressed={selected}
                    onClick={() => {
                      setSelectedStatuses((current) =>
                        selected
                          ? current.filter((entry) => entry !== status)
                          : [...current, status],
                      );
                    }}
                  >
                    {TASK_STATUS_LABELS[status]}
                  </Button>
                );
              })}
            </ButtonGroup>
            <div role="radiogroup" aria-label="Sort order">
              <ButtonGroup>
                <Button
                  type="button"
                  role="radio"
                  size="sm"
                  variant={dateSort === "desc" ? "default" : "outline"}
                  aria-checked={dateSort === "desc"}
                  onClick={() => setDateSort("desc")}
                >
                  Newest
                </Button>
                <Button
                  type="button"
                  role="radio"
                  size="sm"
                  variant={dateSort === "asc" ? "default" : "outline"}
                  aria-checked={dateSort === "asc"}
                  onClick={() => setDateSort("asc")}
                >
                  Oldest
                </Button>
              </ButtonGroup>
            </div>
          </div>
        </div>

        {selectedStatuses.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No statuses selected</CardTitle>
              <CardDescription>
                Select at least one status to show tasks.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : totalTasks === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No matching tasks</CardTitle>
              <CardDescription>
                No tasks match the selected statuses. Try selecting additional
                statuses.
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
