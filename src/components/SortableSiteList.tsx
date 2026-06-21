import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SiteListItem } from "@/components/SiteListItem";
import { buildSiteOrderTxs } from "@/lib/sites";
import type { SiteWithLogo } from "@/lib/sites";

type SortableSiteListProps = {
  sites: SiteWithLogo[];
  isAdmin: boolean;
  onEdit: (site: SiteWithLogo) => void;
  onDelete: (site: SiteWithLogo) => void;
};

export function SortableSiteList({
  sites,
  isAdmin,
  onEdit,
  onDelete,
}: SortableSiteListProps) {
  const [activeSite, setActiveSite] = useState<SiteWithLogo | null>(null);

  const siteIds = useMemo(() => sites.map((site) => site.id), [sites]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (!isAdmin) return;
    const site = sites.find((item) => item.id === event.active.id);
    if (site) setActiveSite(site);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveSite(null);

    if (!isAdmin) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sites.findIndex((site) => site.id === active.id);
    const newIndex = sites.findIndex((site) => site.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const nextSites = arrayMove(sites, oldIndex, newIndex);

    try {
      await buildSiteOrderTxs(nextSites);
    } catch (error) {
      console.error("Failed to reorder sites:", error);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={(event) => void handleDragEnd(event)}
    >
      <SortableContext items={siteIds} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {sites.map((site) => (
            <SiteListItem
              key={site.id}
              site={site}
              isAdmin={isAdmin}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      </SortableContext>

      <DragOverlay>
        {activeSite ? (
          <SiteListItem
            site={activeSite}
            isAdmin={isAdmin}
            onEdit={onEdit}
            onDelete={onDelete}
            isOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
