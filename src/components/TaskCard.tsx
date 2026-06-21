import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Task } from "@/lib/sites";
import { cn } from "@/lib/utils";

type TaskCardProps = {
  task: Task;
  isAdmin: boolean;
  isOverlay?: boolean;
  onDelete?: () => void;
};

export function TaskCard({
  task,
  isAdmin,
  isOverlay = false,
  onDelete,
}: TaskCardProps) {
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
            className="mt-0.5 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
            aria-label="Drag task"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
        ) : null}

        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-medium leading-snug">{task.text}</p>
          {task.description ? (
            <p className="text-xs text-muted-foreground">{task.description}</p>
          ) : null}
        </div>

        {isAdmin && onDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            aria-label="Delete task"
          >
            <Trash2 className="size-3.5" />
          </Button>
        ) : null}
      </div>
    </article>
  );
}
