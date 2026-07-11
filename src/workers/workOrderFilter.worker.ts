import {
  filterAndSortWorkOrderItems,
  type WorkOrderFilterRequest,
  type WorkOrderFilterResponse,
} from "@/lib/workOrderFilter";

self.onmessage = (event: MessageEvent<WorkOrderFilterRequest>) => {
  const { requestId, sites, selectedStatuses, dateSort } = event.data;
  const items = filterAndSortWorkOrderItems(sites, selectedStatuses, dateSort);

  const response: WorkOrderFilterResponse = { requestId, items };
  self.postMessage(response);
};
