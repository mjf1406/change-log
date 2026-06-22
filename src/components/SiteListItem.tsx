import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { SiteAvatar } from "@/components/SiteAvatar";
import { Button } from "@/components/ui/button";
import type { SiteWithLogo } from "@/lib/sites";
import { cn } from "@/lib/utils";

type SiteListItemProps = {
  site: SiteWithLogo;
  isAdmin: boolean;
  onEdit: (site: SiteWithLogo) => void;
  onDelete: (site: SiteWithLogo) => void;
  isOverlay?: boolean;
};

export function SiteListItem({
  site,
  isAdmin,
  onEdit,
  onDelete,
  isOverlay = false,
}: SiteListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: site.id,
    disabled: !isAdmin || isOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2",
        isDragging && "opacity-40",
        isOverlay && "shadow-md ring-1 ring-ring/20",
      )}
    >
      {isAdmin ? (
        <button
          type="button"
          className="-m-2 flex min-h-11 min-w-11 touch-none cursor-grab items-center justify-center text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label={`Reorder ${site.name}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      ) : null}

      <SiteAvatar
        name={site.name}
        logoUrl={site.logo?.url}
        className="size-10 shrink-0"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{site.name}</p>
        <p className="truncate text-xs text-muted-foreground">/{site.slug}</p>
      </div>

      {isAdmin ? (
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`Edit ${site.name}`}
            onClick={() => onEdit(site)}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-destructive"
            aria-label={`Delete ${site.name}`}
            onClick={() => onDelete(site)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ) : null}
    </li>
  );
}
