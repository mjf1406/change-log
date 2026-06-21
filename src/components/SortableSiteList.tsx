import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
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
import { SiteListItem } from "@/components/SiteListItem";
import { db } from "@/lib/db";
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
  const [orderedSites, setOrderedSites] = useState<SiteWithLogo[] | null>(null);

  const displaySites = orderedSites ?? sites;

  const siteIds = useMemo(
    () => displaySites.map((site) => site.id),
    [displaySites],
  );

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

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveSite(null);

    if (!isAdmin) return;

    const { active, over } = event;
    setOrderedSites(null);

    if (!over || active.id === over.id) return;

    const oldIndex = displaySites.findIndex((site) => site.id === active.id);
    const newIndex = displaySites.findIndex((site) => site.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const nextSites = arrayMove(displaySites, oldIndex, newIndex);
    const txs = nextSites.map((site, index) =>
      db.tx.sites[site.id].update({ order: index }),
    );

    void db.transact(txs);
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!isAdmin) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrderedSites((current) => {
      const base = current ?? sites;
      const oldIndex = base.findIndex((site) => site.id === active.id);
      const newIndex = base.findIndex((site) => site.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return base;
      return arrayMove(base, oldIndex, newIndex);
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={siteIds} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {displaySites.map((site) => (
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
