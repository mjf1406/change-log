import { GripVertical, FileText, Pencil, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import type { Task } from "@/lib/sites";
import { cn } from "@/lib/utils";

type TaskCardProps = {
  task: Task;
  isAdmin: boolean;
  isOverlay?: boolean;
  onEdit?: () => void;
  onViewDescription?: () => void;
  onDelete?: () => void;
};

export function TaskCard({
  task,
  isAdmin,
  isOverlay = false,
  onEdit,
  onViewDescription,
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

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug">{task.text}</p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {task.description && onViewDescription ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-foreground"
              onClick={onViewDescription}
              aria-label="View task description"
            >
              <FileText className="size-3.5" />
            </Button>
          ) : null}

          {isAdmin && onEdit ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Edit task"
              onClick={onEdit}
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
              onClick={onDelete}
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
