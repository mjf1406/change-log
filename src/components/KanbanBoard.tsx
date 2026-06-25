import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Copy, ArrowRightLeft } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  pointerWithin,
  useDroppable,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { QuickAddTask } from "@/components/QuickAddTask";
import { PageLoader } from "@/components/PageLoader";
import { TaskCard } from "@/components/TaskCard";
import { TaskDetailDialog } from "@/components/TaskDetailDialog";
import { TaskFormDialog } from "@/components/TaskFormDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useIsAdmin } from "@/lib/admin";
import { useDndSensors } from "@/lib/dnd-sensors";
import { db } from "@/lib/db";
import type { SiteWithTasks, Task } from "@/lib/sites";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  MAIN_BOARD_STATUSES,
  COLUMN_BULK_MOVE_TARGETS,
  buildBulkColumnMoveTxs,
  buildColumnPersistTxs,
  formatTasksForColumnCopy,
  getBulkMoveConfirmDescription,
  getStatusUpdates,
  splitTasksForBoard,
  type ColumnTasks,
  type MainBoardStatus,
  type TaskStatus,
} from "@/lib/tasks";
import { cn } from "@/lib/utils";

type KanbanBoardProps = {
  site: SiteWithTasks;
};

type TaskLocation =
  | { kind: "column"; status: TaskStatus }
  | { kind: "archive" };

function useBoardNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}

function getContainerId(status: TaskStatus) {
  return `column-${status}`;
}

const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  return closestCorners(args);
};

function parseContainerId(containerId: string): TaskStatus | null {
  if (!containerId.startsWith("column-")) return null;
  const status = containerId.replace("column-", "") as TaskStatus;
  return TASK_STATUSES.includes(status) ? status : null;
}

function findTaskContainer(
  taskId: string,
  columns: ColumnTasks,
): TaskStatus | null {
  for (const status of TASK_STATUSES) {
    if (columns[status].some((task) => task.id === taskId)) {
      return status;
    }
  }
  return null;
}

function findTaskLocation(
  taskId: string,
  columns: ColumnTasks,
  archived: Task[],
): TaskLocation | null {
  const columnStatus = findTaskContainer(taskId, columns);
  if (columnStatus) {
    return { kind: "column", status: columnStatus };
  }
  if (archived.some((task) => task.id === taskId)) {
    return { kind: "archive" };
  }
  return null;
}

function resolveOverContainer(
  overId: string,
  columns: ColumnTasks,
): TaskStatus | null {
  return parseContainerId(overId) ?? findTaskContainer(overId, columns);
}

function KanbanColumn({
  status,
  tasks,
  siteId,
  isAdmin,
  bulkMoveTargets,
  onRequestBulkMove,
  onEditTask,
  onViewTask,
  onDeleteTask,
}: {
  status: TaskStatus;
  tasks: Task[];
  siteId: string;
  isAdmin: boolean;
  bulkMoveTargets?: readonly MainBoardStatus[];
  onRequestBulkMove?: (toStatus: MainBoardStatus) => void;
  onEditTask: (task: Task) => void;
  onViewTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id: getContainerId(status) });
  const [copied, setCopied] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const columnCopyText = useMemo(
    () => formatTasksForColumnCopy(tasks),
    [tasks],
  );
  const canBulkMove =
    isAdmin &&
    bulkMoveTargets != null &&
    bulkMoveTargets.length > 0 &&
    onRequestBulkMove != null;

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  return (
    <section
      ref={setNodeRef}
      className="flex min-h-64 flex-col rounded-xl border border-border bg-muted/20"
    >
      <header className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{TASK_STATUS_LABELS[status]}</h3>
          <p className="text-xs text-muted-foreground">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {canBulkMove ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              disabled={tasks.length === 0}
              aria-label={`Move all ${TASK_STATUS_LABELS[status]} tasks`}
              onClick={() => setMoveDialogOpen(true)}
            >
              <ArrowRightLeft className="size-3.5" />
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="shrink-0"
            disabled={tasks.length === 0}
            aria-label={
              copied
                ? "Copied column"
                : `Copy all ${TASK_STATUS_LABELS[status]} tasks`
            }
            onClick={() => {
              void navigator.clipboard
                .writeText(columnCopyText)
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
                  console.error("Failed to copy column tasks", error);
                });
            }}
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
        </div>
      </header>

      {canBulkMove ? (
        <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
          <DialogContent showCloseButton>
            <DialogHeader>
              <DialogTitle>
                Move all {TASK_STATUS_LABELS[status]} tasks
              </DialogTitle>
              <DialogDescription>
                Choose a destination column for all {tasks.length}{" "}
                {tasks.length === 1 ? "task" : "tasks"}.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              {bulkMoveTargets.map((target) => (
                <Button
                  key={target}
                  type="button"
                  variant="outline"
                  className="justify-start"
                  onClick={() => {
                    setMoveDialogOpen(false);
                    onRequestBulkMove(target);
                  }}
                >
                  Move to {TASK_STATUS_LABELS[target]}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      ) : null}

      {status === "todo" && isAdmin ? (
        <div className="px-3 pt-3">
          <QuickAddTask siteId={siteId} nextOrder={tasks.length} />
        </div>
      ) : null}

      {status === "dreams" && isAdmin ? (
        <div className="px-3 pt-3">
          <QuickAddTask
            siteId={siteId}
            nextOrder={tasks.length}
            status="dreams"
          />
        </div>
      ) : null}

      <SortableContext
        id={getContainerId(status)}
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-1 flex-col gap-2 p-3" data-status={status}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isAdmin={isAdmin}
              truncateTitle={status === "done"}
              onView={() => onViewTask(task)}
              onEdit={() => onEditTask(task)}
              onDelete={() => onDeleteTask(task.id)}
            />
          ))}
        </div>
      </SortableContext>
    </section>
  );
}

function ArchivedTasksSection({
  tasks,
  isAdmin,
  onEditTask,
  onViewTask,
  onDeleteTask,
}: {
  tasks: Task[];
  isAdmin: boolean;
  onEditTask: (task: Task) => void;
  onViewTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}) {
  const [open, setOpen] = useState(tasks.length > 0);

  useEffect(() => {
    if (tasks.length > 0) {
      setOpen(true);
    }
  }, [tasks.length]);

  if (tasks.length === 0) {
    return null;
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="mt-6 border-t border-border pt-6"
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 rounded-lg px-1 py-2 text-left hover:bg-muted/40"
        >
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">Archive</h3>
            <p className="text-xs text-muted-foreground">
              {tasks.length} {tasks.length === 1 ? "task" : "tasks"} completed
              more than 24 hours ago
            </p>
          </div>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-3 flex flex-col gap-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              variant="archived"
              isAdmin={isAdmin}
              onView={() => onViewTask(task)}
              onEdit={() => onEditTask(task)}
              onDelete={() => onDeleteTask(task.id)}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function KanbanBoard({ site }: KanbanBoardProps) {
  const { isLoading: authLoading, isAdmin } = useIsAdmin();
  const now = useBoardNow();
  const [columns, setColumns] = useState<ColumnTasks | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeVariant, setActiveVariant] = useState<"board" | "archived">(
    "board",
  );
  const [originLocation, setOriginLocation] = useState<TaskLocation | null>(
    null,
  );
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTaskId, setViewingTaskId] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [bulkMove, setBulkMove] = useState<{
    fromStatus: MainBoardStatus;
    toStatus: MainBoardStatus;
  } | null>(null);

  const boardTasks = useMemo(
    () => splitTasksForBoard((site.tasks ?? []) as Task[], now),
    [site.tasks, now],
  );

  const grouped = boardTasks.columns;
  const archivedTasks = boardTasks.archived;

  const displayColumns = columns ?? grouped;

  const sensors = useDndSensors();

  const resolveTask = (taskId: string) =>
    (site.tasks as Task[]).find((item) => item.id === taskId);

  const viewingTask = viewingTaskId
    ? (resolveTask(viewingTaskId) ?? null)
    : null;

  const handleDeleteById = (taskId: string) => {
    const task = resolveTask(taskId);
    if (task) setTaskToDelete(task);
  };

  if (authLoading) {
    return <PageLoader />;
  }

  const handleDragStart = (event: DragStartEvent) => {
    if (!isAdmin) return;

    const activeId = String(event.active.id);
    const task = resolveTask(activeId);
    if (!task) return;

    const location = findTaskLocation(activeId, grouped, archivedTasks);
    if (!location) return;

    setActiveTask(task);
    setActiveVariant(location.kind === "archive" ? "archived" : "board");
    setOriginLocation(location);
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!isAdmin) return;
    if (originLocation?.kind === "archive") return;

    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    setColumns((current) => {
      const base = current ?? grouped;
      const activeContainer = findTaskContainer(activeId, base);
      if (!activeContainer) return base;

      const overContainer = resolveOverContainer(overId, base);
      if (!overContainer) return base;

      if (activeContainer === overContainer) {
        const items = [...base[activeContainer]];
        const activeIndex = items.findIndex((task) => task.id === activeId);
        const overIndex = items.findIndex((task) => task.id === overId);
        if (
          activeIndex === -1 ||
          overIndex === -1 ||
          activeIndex === overIndex
        ) {
          return base;
        }

        return {
          ...base,
          [activeContainer]: arrayMove(items, activeIndex, overIndex),
        };
      }

      const activeItems = [...base[activeContainer]];
      const overItems = [...base[overContainer]];
      const activeIndex = activeItems.findIndex((task) => task.id === activeId);
      if (activeIndex === -1) return base;

      const [movedTask] = activeItems.splice(activeIndex, 1);
      const overIndex = overItems.findIndex((task) => task.id === overId);
      const insertIndex = overIndex >= 0 ? overIndex : overItems.length;
      overItems.splice(insertIndex, 0, {
        ...movedTask,
        status: overContainer,
      });

      return {
        ...base,
        [activeContainer]: activeItems,
        [overContainer]: overItems,
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const fromLocation = originLocation;
    setActiveTask(null);
    setActiveVariant("board");
    setOriginLocation(null);

    if (!isAdmin) {
      setColumns(null);
      return;
    }

    const { active, over } = event;

    if (!over || !fromLocation) {
      setColumns(null);
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    if (fromLocation.kind === "archive") {
      const overContainer = resolveOverContainer(overId, grouped);
      if (!overContainer || overContainer === "done") {
        setColumns(null);
        return;
      }

      const nowMs = Date.now();
      const targetOrder = grouped[overContainer].length;
      void db.transact(
        db.tx.tasks[activeId].update({
          ...getStatusUpdates("done", overContainer, nowMs),
          order: targetOrder,
        }),
      );
      setColumns(null);
      return;
    }

    const fromStatus = fromLocation.status;
    let finalColumns = columns ?? grouped;

    if (!columns) {
      const activeContainer = findTaskContainer(activeId, grouped);
      if (!activeContainer) {
        setColumns(null);
        return;
      }

      const overContainer = resolveOverContainer(overId, grouped);
      if (!overContainer) {
        setColumns(null);
        return;
      }

      finalColumns = Object.fromEntries(
        TASK_STATUSES.map((status) => [status, [...grouped[status]]]),
      ) as ColumnTasks;

      if (activeContainer === overContainer) {
        const items = [...finalColumns[activeContainer]];
        const activeIndex = items.findIndex((task) => task.id === activeId);
        const overIndex = items.findIndex((task) => task.id === overId);
        if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
          setColumns(null);
          return;
        }
        finalColumns[activeContainer] = arrayMove(items, activeIndex, overIndex);
      } else {
        const sourceItems = [...finalColumns[activeContainer]];
        const destItems = [...finalColumns[overContainer]];
        const activeIndex = sourceItems.findIndex((task) => task.id === activeId);
        if (activeIndex === -1) {
          setColumns(null);
          return;
        }

        const [movedTask] = sourceItems.splice(activeIndex, 1);
        const overIndex = destItems.findIndex((task) => task.id === overId);
        const insertIndex = overIndex >= 0 ? overIndex : destItems.length;
        destItems.splice(insertIndex, 0, movedTask);
        finalColumns[activeContainer] = sourceItems;
        finalColumns[overContainer] = destItems;
      }
    }

    const toStatus = findTaskContainer(activeId, finalColumns);
    if (!toStatus) {
      setColumns(null);
      return;
    }

    const txs = buildColumnPersistTxs(
      finalColumns,
      activeId,
      fromStatus,
      toStatus,
      Date.now(),
    );

    setColumns(null);

    if (txs.length > 0) {
      void db.transact(txs);
    }
  };

  const handleDragCancel = () => {
    setActiveTask(null);
    setActiveVariant("board");
    setOriginLocation(null);
    setColumns(null);
  };

  const handleDeleteTask = () => {
    if (!taskToDelete || !isAdmin) return;
    void db.transact(db.tx.tasks[taskToDelete.id].delete());
  };

  const handleRequestBulkMove = (
    fromStatus: MainBoardStatus,
    toStatus: MainBoardStatus,
  ) => {
    setBulkMove({ fromStatus, toStatus });
  };

  const handleConfirmBulkMove = () => {
    if (!bulkMove || !isAdmin) return;

    const sourceTasks = displayColumns[bulkMove.fromStatus];
    const destTasks = displayColumns[bulkMove.toStatus];
    const txs = buildBulkColumnMoveTxs(
      sourceTasks,
      destTasks,
      bulkMove.fromStatus,
      bulkMove.toStatus,
      Date.now(),
    );

    if (txs.length > 0) {
      void db.transact(txs);
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {MAIN_BOARD_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={displayColumns[status]}
              siteId={site.id}
              isAdmin={isAdmin}
              bulkMoveTargets={COLUMN_BULK_MOVE_TARGETS[status]}
              onRequestBulkMove={(toStatus) =>
                handleRequestBulkMove(status, toStatus)
              }
              onEditTask={setEditingTask}
              onViewTask={(task) => setViewingTaskId(task.id)}
              onDeleteTask={handleDeleteById}
            />
          ))}
        </div>

        <div className="mt-4">
          <KanbanColumn
            status="dreams"
            tasks={displayColumns.dreams}
            siteId={site.id}
            isAdmin={isAdmin}
            onEditTask={setEditingTask}
            onViewTask={(task) => setViewingTaskId(task.id)}
            onDeleteTask={handleDeleteById}
          />
        </div>

        <ArchivedTasksSection
          tasks={archivedTasks}
          isAdmin={isAdmin}
          onEditTask={setEditingTask}
          onViewTask={(task) => setViewingTaskId(task.id)}
          onDeleteTask={handleDeleteById}
        />

        {!isAdmin ? (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Sign in to manage tasks on this board.
          </p>
        ) : null}

        <DragOverlay>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              variant={activeVariant}
              isAdmin={isAdmin}
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskFormDialog
        open={editingTask !== null}
        onOpenChange={(open) => {
          if (!open) setEditingTask(null);
        }}
        mode="edit"
        task={editingTask ?? undefined}
      />

      <TaskDetailDialog
        open={viewingTaskId !== null}
        onOpenChange={(open) => {
          if (!open) setViewingTaskId(null);
        }}
        task={viewingTask}
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

      <DeleteConfirmDialog
        open={bulkMove !== null}
        onOpenChange={(open) => {
          if (!open) setBulkMove(null);
        }}
        title="Move all tasks?"
        description={
          bulkMove
            ? getBulkMoveConfirmDescription(
                bulkMove.fromStatus,
                bulkMove.toStatus,
                displayColumns[bulkMove.fromStatus].length,
              )
            : ""
        }
        confirmLabel="Move all"
        confirmVariant="default"
        onConfirm={handleConfirmBulkMove}
      />
    </>
  );
}

export function getTodoColumnLength(site: SiteWithTasks) {
  return (site.tasks ?? []).filter((task) => task.status === "todo").length;
}
