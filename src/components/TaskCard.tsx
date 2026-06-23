import { useEffect, useRef, useState } from "react";
import { Check, Copy, GripVertical, Pencil, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import type { Task } from "@/lib/sites";
import { formatTaskDateTime, formatTaskForCopy, toDate } from "@/lib/tasks";
import { cn } from "@/lib/utils";

type TaskCardProps = {
  task: Task;
  isAdmin: boolean;
  isOverlay?: boolean;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function TaskCard({
  task,
  isAdmin,
  isOverlay = false,
  onView,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border border-border bg-card p-3 shadow-xs",
        isDragging && "opacity-40",
        isOverlay && "shadow-md ring-1 ring-ring/20",
      )}
    >
      <div className="flex items-start gap-2">
        {isAdmin ? (
          <button
            type="button"
            className="-m-2 mt-0.5 flex min-h-11 min-w-11 touch-none cursor-grab items-center justify-center text-muted-foreground hover:text-foreground active:cursor-grabbing"
            aria-label="Drag task"
            {...attributes}
            {...listeners}
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
          <p className="text-sm font-medium leading-snug">{task.text}</p>
          <p className="text-xs text-muted-foreground">
            Created · {formatTaskDateTime(toDate(task.createdAt))}
          </p>
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
