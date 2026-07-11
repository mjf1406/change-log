import { useEffect, useRef, useState } from "react";
import type { SiteWithTasks } from "@/lib/sites";
import type { TaskStatus } from "@/lib/tasks";
import {
  toWorkOrderSiteSnapshots,
  type DateSort,
  type WorkOrderFilterResponse,
  type WorkOrderItem,
} from "@/lib/workOrderFilter";

export function useWorkOrderFilter(
  sites: SiteWithTasks[],
  selectedStatuses: TaskStatus[],
  dateSort: DateSort,
  enabled: boolean,
) {
  const [items, setItems] = useState<WorkOrderItem[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const requestIdRef = useRef(0);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/workOrderFilter.worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkOrderFilterResponse>) => {
      const { requestId, items: nextItems } = event.data;
      if (requestId !== requestIdRef.current) {
        return;
      }

      setItems(nextItems);
      setIsFiltering(false);
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsFiltering(false);
      return;
    }

    const worker = workerRef.current;
    if (!worker) {
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsFiltering(true);

    worker.postMessage({
      requestId,
      sites: toWorkOrderSiteSnapshots(sites),
      selectedStatuses,
      dateSort,
    });
  }, [sites, selectedStatuses, dateSort, enabled]);

  return { items, isFiltering };
}
