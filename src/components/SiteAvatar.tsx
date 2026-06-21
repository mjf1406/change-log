import { cn } from "@/lib/utils";

type SiteAvatarProps = {
  name: string;
  logoUrl?: string | null;
  className?: string;
};

export function SiteAvatar({ name, logoUrl, className }: SiteAvatarProps) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        className={cn("rounded-md object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground",
        className,
      )}
      aria-hidden
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}
