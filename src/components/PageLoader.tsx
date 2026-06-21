import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type PageLoaderProps = {
  className?: string;
};

export function PageLoader({ className }: PageLoaderProps) {
  return (
    <div
      className={cn(
        "flex min-h-[calc(100vh-3.5rem)] items-center justify-center",
        className,
      )}
      role="status"
      aria-label="Loading page"
    >
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  );
}
