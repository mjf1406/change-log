import { useMemo, useState } from "react";
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
import { PageLoader } from "@/components/PageLoader";
import { TaskCard } from "@/components/TaskCard";
import { TaskDetailDialog } from "@/components/TaskDetailDialog";
import { TaskFormDialog } from "@/components/TaskFormDialog";
import { useIsAdmin } from "@/lib/admin";
import { useDndSensors } from "@/lib/dnd-sensors";
import { db } from "@/lib/db";
import type { SiteWithTasks, Task } from "@/lib/sites";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  buildColumnPersistTxs,
  type ColumnTasks,
  type TaskStatus,
} from "@/lib/tasks";

type KanbanBoardProps = {
  site: SiteWithTasks;
};

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

function resolveOverContainer(
  overId: string,
  columns: ColumnTasks,
): TaskStatus | null {
  return parseContainerId(overId) ?? findTaskContainer(overId, columns);
}

function KanbanColumn({
  status,
  tasks,
  isAdmin,
  onEditTask,
  onViewTask,
  onDeleteTask,
}: {
  status: TaskStatus;
  tasks: Task[];
  isAdmin: boolean;
  onEditTask: (task: Task) => void;
  onViewTask: (task: Task) => void;
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

export function KanbanBoard({ site }: KanbanBoardProps) {
  const { isLoading: authLoading, isAdmin } = useIsAdmin();
  const [columns, setColumns] = useState<ColumnTasks | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [originStatus, setOriginStatus] = useState<TaskStatus | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const grouped = useMemo(
    () => groupTasksByStatus((site.tasks ?? []) as Task[]),
    [site.tasks],
  );

  const displayColumns = columns ?? grouped;

  const sensors = useDndSensors();

  if (authLoading) {
    return <PageLoader />;
  }

  const handleDragStart = (event: DragStartEvent) => {
    if (!isAdmin) return;

    const activeId = String(event.active.id);
    const task = (site.tasks as Task[]).find((item) => item.id === activeId);
    if (!task) return;

    setActiveTask(task);
    setOriginStatus(findTaskContainer(activeId, grouped));
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
    setActiveTask(null);

    if (!isAdmin) {
      setOriginStatus(null);
      setColumns(null);
      return;
    }

    const { active, over } = event;
    const fromStatus = originStatus;
    setOriginStatus(null);

    if (!over || !fromStatus) {
      setColumns(null);
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

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

      finalColumns = {
        todo: [...grouped.todo],
        doing: [...grouped.doing],
        done: [...grouped.done],
      };

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
    setOriginStatus(null);
    setColumns(null);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete || !isAdmin) return;
    await db.transact(db.tx.tasks[taskToDelete.id].delete());
    setTaskToDelete(null);
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
          {TASK_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={displayColumns[status]}
              isAdmin={isAdmin}
              onEditTask={setEditingTask}
              onViewTask={setViewingTask}
              onDeleteTask={(taskId) => {
                const task = (site.tasks as Task[]).find(
                  (item) => item.id === taskId,
                );
                if (task) setTaskToDelete(task);
              }}
            />
          ))}
        </div>

        {!isAdmin ? (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Sign in to manage tasks on this board.
          </p>
        ) : null}

        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} isAdmin={isAdmin} isOverlay />
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
        open={viewingTask !== null}
        onOpenChange={(open) => {
          if (!open) setViewingTask(null);
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
    </>
  );
}

export function getTodoColumnLength(site: SiteWithTasks) {
  return (site.tasks ?? []).filter((task) => task.status === "todo").length;
}
