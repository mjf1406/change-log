import { createElement, useCallback, useEffect, useRef, useState } from "react";
import { CircleCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";

const SYNC_FALLBACK_MS = 2000;
const SYNC_MIN_DISPLAY_MS = 400;
const RECONNECTED_DISPLAY_MS = 2000;

const SENTINEL_QUERY = {
  sites: {
    $: { order: { order: "asc" as const } },
  },
};

const RECONNECTING_STATUSES = new Set([
  "closed",
  "errored",
  "connecting",
  "opened",
]);

const spinnerIcon = createElement(Loader2, {
  className: "size-4 animate-spin text-sky-600 dark:text-sky-400",
});

const checkIcon = createElement(CircleCheck, {
  className: "size-4 text-emerald-600 dark:text-emerald-400",
});

export type InstantConnectionUi =
  | "hidden"
  | "reconnecting"
  | "reconnected"
  | "syncing";

export function useInstantConnectionToasts() {
  const status = db.useConnectionStatus();
  const hasConnectedRef = useRef(false);
  const phaseRef = useRef<InstantConnectionUi>("hidden");
  const activeToastIdsRef = useRef<Array<string | number>>([]);
  const [uiState, setUiState] = useState<InstantConnectionUi>("hidden");

  const trackToast = useCallback((id: string | number) => {
    activeToastIdsRef.current.push(id);
    return id;
  }, []);

  const dismissCycleToasts = useCallback(() => {
    for (const id of activeToastIdsRef.current) {
      toast.dismiss(id);
    }
    activeToastIdsRef.current = [];
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      if (hasConnectedRef.current && phaseRef.current === "reconnecting") {
        phaseRef.current = "reconnected";
        setUiState("reconnected");
      }
      hasConnectedRef.current = true;
      return;
    }

    if (hasConnectedRef.current && RECONNECTING_STATUSES.has(status)) {
      phaseRef.current = "reconnecting";
      setUiState("reconnecting");
    }
  }, [status]);

  useEffect(() => {
    if (uiState === "reconnected") {
      const timer = setTimeout(() => {
        phaseRef.current = "syncing";
        setUiState("syncing");
      }, RECONNECTED_DISPLAY_MS);

      return () => clearTimeout(timer);
    }
  }, [uiState]);

  useEffect(() => {
    if (uiState === "reconnecting") {
      dismissCycleToasts();
      trackToast(
        toast.info("Reconnecting…", {
          duration: Infinity,
          icon: spinnerIcon,
        }),
      );
      return;
    }

    if (uiState === "reconnected") {
      trackToast(
        toast.success("Reconnected", {
          duration: Infinity,
          icon: checkIcon,
        }),
      );
      return;
    }

    if (uiState === "syncing") {
      trackToast(
        toast.info("Syncing changes…", {
          duration: Infinity,
          icon: spinnerIcon,
        }),
      );
    }
  }, [uiState, dismissCycleToasts, trackToast]);

  useEffect(() => {
    if (uiState !== "syncing") return;

    const syncStartedAt = Date.now();
    let resolved = false;
    let minDisplayTimer: ReturnType<typeof setTimeout> | undefined;

    const finishSyncing = () => {
      if (resolved) return;

      const elapsed = Date.now() - syncStartedAt;
      const remaining = Math.max(0, SYNC_MIN_DISPLAY_MS - elapsed);

      minDisplayTimer = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        phaseRef.current = "hidden";
        setUiState("hidden");
        dismissCycleToasts();
      }, remaining);
    };

    let callbackCount = 0;
    const unsub = db.core.subscribeQuery(SENTINEL_QUERY, () => {
      callbackCount += 1;
      if (callbackCount >= 2) {
        finishSyncing();
      }
    });

    const fallback = setTimeout(finishSyncing, SYNC_FALLBACK_MS);

    return () => {
      resolved = true;
      clearTimeout(fallback);
      if (minDisplayTimer) clearTimeout(minDisplayTimer);
      unsub();
    };
  }, [uiState, dismissCycleToasts]);
}
