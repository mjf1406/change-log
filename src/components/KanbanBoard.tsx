import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { id } from "@instantdb/react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/PageLoader";
import { useIsAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import type { SiteWithTasks, Task } from "@/lib/sites";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type TaskStatus,
} from "@/lib/tasks";
import { TaskCard } from "@/components/TaskCard";

type KanbanBoardProps = {
  site: SiteWithTasks;
};

type ColumnTasks = Record<TaskStatus, Task[]>;

function groupTasksByStatus(tasks: Task[]): ColumnTasks {
  const grouped: ColumnTasks = {
    todo: [],
    doing: [],
    done: [],
  };

  for (const task of tasks) {
    const status = task.status as TaskStatus;
    if (TASK_STATUSES.includes(status)) {
      grouped[status].push(task);
    }
  }

  for (const status of TASK_STATUSES) {
    grouped[status].sort((a, b) => a.order - b.order);
  }

  return grouped;
}

function getContainerId(status: TaskStatus) {
  return `column-${status}`;
}

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

function getStatusUpdates(
  fromStatus: TaskStatus,
  toStatus: TaskStatus,
  now: number,
): Partial<{
  status: TaskStatus;
  startedAt: number | null;
  completedAt: number | null;
}> {
  if (fromStatus === toStatus) {
    return { status: toStatus };
  }

  const updates: Partial<{
    status: TaskStatus;
    startedAt: number | null;
    completedAt: number | null;
  }> = { status: toStatus };

  if (toStatus === "doing" && fromStatus === "todo") {
    updates.startedAt = now;
  }

  if (toStatus === "done") {
    updates.completedAt = now;
  }

  if (fromStatus === "done" && toStatus !== "done") {
    updates.completedAt = null;
  }

  if (fromStatus === "doing" && toStatus === "todo") {
    updates.startedAt = null;
  }

  return updates;
}

function KanbanColumn({
  status,
  tasks,
  isAdmin,
  onDeleteTask,
}: {
  status: TaskStatus;
  tasks: Task[];
  isAdmin: boolean;
  onDeleteTask: (taskId: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id: getContainerId(status) });

  return (
    <section
      ref={setNodeRef}
      className="flex min-h-64 flex-col rounded-xl border border-border bg-muted/20"
    >
      <header className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">{TASK_STATUS_LABELS[status]}</h3>
        <p className="text-xs text-muted-foreground">
          {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
        </p>
      </header>

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
              onDelete={() => onDeleteTask(task.id)}
            />
          ))}
        </div>
      </SortableContext>
    </section>
  );
}

export function KanbanBoard({ site }: KanbanBoardProps) {
  const { isLoading: authLoading, isAdmin } = useIsAdmin();
  const [columns, setColumns] = useState<ColumnTasks | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [newTaskText, setNewTaskText] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const grouped = useMemo(
    () => groupTasksByStatus((site.tasks ?? []) as Task[]),
    [site.tasks],
  );

  const displayColumns = columns ?? grouped;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  if (authLoading) {
    return <PageLoader />;
  }

  const handleDragStart = (event: DragStartEvent) => {
    if (!isAdmin) return;
    const task = [...site.tasks].find((item) => item.id === event.active.id);
    if (task) setActiveTask(task as Task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!isAdmin) return;

    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    setColumns((current) => {
      const base = current ?? grouped;
      const activeContainer = findTaskContainer(activeId, base);
      if (!activeContainer) return base;

      const overContainer =
        parseContainerId(overId) ?? findTaskContainer(overId, base);
      if (!overContainer || activeContainer === overContainer) return base;

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
    setActiveTask(null);

    if (!isAdmin) return;

    const { active, over } = event;
    const finalColumns = columns ?? grouped;
    setColumns(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeContainer = findTaskContainer(activeId, finalColumns);
    if (!activeContainer) return;

    const overContainer =
      parseContainerId(overId) ?? findTaskContainer(overId, finalColumns);
    if (!overContainer) return;

    const now = Date.now();
    const columnTasks = [...finalColumns[activeContainer]];
    const activeIndex = columnTasks.findIndex((task) => task.id === activeId);
    if (activeIndex === -1) return;

    let nextTasks = finalColumns[overContainer];
    let nextIndex = nextTasks.findIndex((task) => task.id === overId);

    if (activeContainer === overContainer) {
      if (activeIndex === nextIndex) return;
      nextTasks = arrayMove(columnTasks, activeIndex, nextIndex);
    } else {
      const [movedTask] = columnTasks.splice(activeIndex, 1);
      nextTasks = [...finalColumns[overContainer]];
      if (nextIndex === -1) nextIndex = nextTasks.length;
      nextTasks.splice(nextIndex, 0, movedTask);
    }

    const txs = nextTasks.map((task, index) => {
      const fromStatus = (task.id === activeId
        ? activeContainer
        : (task.status as TaskStatus)) as TaskStatus;
      const toStatus =
        task.id === activeId ? overContainer : (task.status as TaskStatus);
      const updates = getStatusUpdates(fromStatus, toStatus, now);

      return db.tx.tasks[task.id].update({
        ...updates,
        order: index,
      });
    });

    if (txs.length > 0) {
      void db.transact(txs);
    }
  };

  const handleAddTask = async () => {
    const text = newTaskText.trim();
    if (!text || !isAdmin) return;

    setIsAdding(true);
    const taskId = id();
    const nextOrder = displayColumns.todo.length;

    try {
      await db.transact(
        db.tx.tasks[taskId]
          .update({
            text,
            status: "todo",
            order: nextOrder,
            createdAt: Date.now(),
          })
          .link({ site: site.id }),
      );
      setNewTaskText("");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    if (!isAdmin) return;
    void db.transact(db.tx.tasks[taskId].delete());
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {TASK_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={displayColumns[status]}
            isAdmin={isAdmin}
            onDeleteTask={handleDeleteTask}
          />
        ))}
      </div>

      {isAdmin ? (
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-dashed border-border p-4 sm:flex-row">
          <input
            type="text"
            value={newTaskText}
            onChange={(event) => setNewTaskText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleAddTask();
              }
            }}
            placeholder="Add a new task..."
            className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <Button
            onClick={() => void handleAddTask()}
            disabled={!newTaskText.trim() || isAdding}
          >
            <Plus data-icon="inline-start" />
            Add task
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Sign in to manage tasks on this board.
        </p>
      )}

      <DragOverlay>
        {activeTask ? (
          <TaskCard task={activeTask} isAdmin={isAdmin} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
