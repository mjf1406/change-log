import { useEffect, useRef, useState } from "react";
import { Check, Copy, GripVertical, Pencil, Trash2 } from "lucide-react";
import { useDraggable, type DraggableAttributes } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getChecklistProgress, hasChecklist } from "@/lib/checklist";
import type { Task } from "@/lib/sites";
import { formatTaskDateTime, formatTaskForCopy, toDate } from "@/lib/tasks";
import { cn } from "@/lib/utils";

type TaskCardProps = {
  task: Task;
  isAdmin: boolean;
  variant?: "board" | "archived";
  isOverlay?: boolean;
  truncateTitle?: boolean;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function TaskCard({
  task,
  isAdmin,
  variant = "board",
  isOverlay = false,
  truncateTitle = false,
  onView,
  onEdit,
  onDelete,
}: TaskCardProps) {
  if (variant === "archived") {
    return (
      <ArchivedTaskCard
        task={task}
        isAdmin={isAdmin}
        isOverlay={isOverlay}
        truncateTitle={truncateTitle}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
  }

  return (
    <BoardTaskCard
      task={task}
      isAdmin={isAdmin}
      isOverlay={isOverlay}
      truncateTitle={truncateTitle}
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}

type TaskCardContentProps = {
  task: Task;
  isAdmin: boolean;
  variant: "board" | "archived";
  isOverlay?: boolean;
  isDragging?: boolean;
  dragHandleProps?: {
    attributes: DraggableAttributes;
    listeners: SyntheticListenerMap | undefined;
  };
  setNodeRef?: (node: HTMLElement | null) => void;
  style?: React.CSSProperties;
  truncateTitle?: boolean;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

function TaskCardContent({
  task,
  isAdmin,
  variant,
  isOverlay = false,
  isDragging = false,
  dragHandleProps,
  setNodeRef,
  style,
  truncateTitle = false,
  onView,
  onEdit,
  onDelete,
}: TaskCardContentProps) {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const subtitle =
    variant === "archived" && task.completedAt != null
      ? `Completed · ${formatTaskDateTime(toDate(task.completedAt))}`
      : `Created · ${formatTaskDateTime(toDate(task.createdAt))}`;
  const checklistProgress = hasChecklist(task.description)
    ? getChecklistProgress(task.description)
    : null;

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cn(
        "min-w-0 w-full overflow-hidden rounded-lg border border-border p-3 shadow-xs",
        variant === "archived" ? "bg-muted/30" : "bg-card",
        isDragging && "opacity-40",
        isOverlay && "shadow-md ring-1 ring-ring/20",
      )}
    >
      <div className="flex min-w-0 items-start gap-2">
        {isAdmin && dragHandleProps ? (
          <button
            type="button"
            className="mt-0.5 flex min-h-11 min-w-11 shrink-0 touch-none cursor-grab items-center justify-center text-muted-foreground hover:text-foreground active:cursor-grabbing"
            aria-label="Drag task"
            {...dragHandleProps.attributes}
            {...dragHandleProps.listeners}
          >
            <GripVertical className="size-4" />
          </button>
        ) : null}

        <button
          type="button"
          onClick={onView}
          disabled={!onView || isOverlay}
          className={cn(
            "min-w-0 flex-1 space-y-1 text-left",
            onView && !isOverlay && "cursor-pointer rounded-sm hover:opacity-80",
          )}
        >
          <p
            className={cn(
              "text-sm font-medium leading-snug wrap-break-word",
              truncateTitle && "truncate",
            )}
            title={truncateTitle ? task.text : undefined}
          >
            {task.text}
          </p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          {checklistProgress ? (
            <div className="space-y-1 pt-1">
              <Progress value={checklistProgress.percent} />
              <p className="text-[11px] text-muted-foreground">
                {checklistProgress.checked}/{checklistProgress.total} ·{" "}
                {checklistProgress.percent}%
              </p>
            </div>
          ) : null}
        </button>

        <div className="flex shrink-0 items-center gap-0.5">
          {!isOverlay ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={copied ? "Copied" : "Copy task"}
              onClick={(event) => {
                event.stopPropagation();
                void navigator.clipboard
                  .writeText(formatTaskForCopy(task))
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
          ) : null}

          {isAdmin && onEdit ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Edit task"
              onClick={(event) => {
                event.stopPropagation();
                onEdit();
              }}
            >
              <Pencil className="size-3.5" />
            </Button>
          ) : null}

          {isAdmin && onDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-destructive"
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              aria-label="Delete task"
            >
              <Trash2 className="size-3.5" />
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function BoardTaskCard({
  task,
  isAdmin,
  isOverlay = false,
  truncateTitle = false,
  onView,
  onEdit,
  onDelete,
}: Omit<TaskCardProps, "variant">) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: !isAdmin || isOverlay,
  });

  return (
    <TaskCardContent
      task={task}
      isAdmin={isAdmin}
      variant="board"
      isOverlay={isOverlay}
      isDragging={isDragging}
      setNodeRef={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      dragHandleProps={
        isAdmin ? { attributes, listeners } : undefined
      }
      truncateTitle={truncateTitle}
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}

function ArchivedTaskCard({
  task,
  isAdmin,
  isOverlay = false,
  truncateTitle = false,
  onView,
  onEdit,
  onDelete,
}: Omit<TaskCardProps, "variant">) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      disabled: !isAdmin || isOverlay,
    });

  return (
    <TaskCardContent
      task={task}
      isAdmin={isAdmin}
      variant="archived"
      isOverlay={isOverlay}
      isDragging={isDragging}
      setNodeRef={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
      }}
      dragHandleProps={
        isAdmin ? { attributes, listeners } : undefined
      }
      truncateTitle={truncateTitle}
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}
