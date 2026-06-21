import { Loader2 } from "lucide-react";

export function PageLoader() {
  return (
    <div
      className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center"
      role="status"
      aria-label="Loading page"
    >
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  );
}
