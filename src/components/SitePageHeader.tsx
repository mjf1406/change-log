import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { SiteAvatar } from "@/components/SiteAvatar";
import type { SiteWithTasks } from "@/lib/sites";
import { cn } from "@/lib/utils";

export type SiteTab = "feed" | "board";

type SitePageHeaderProps = {
  site: SiteWithTasks;
  activeTab: SiteTab;
};

const tabClass =
  "inline-flex items-center border-b-2 border-transparent px-1 pb-3 pt-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";

const tabActiveClass = "border-primary text-foreground";

function formatUrlDisplay(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.178 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.021C22 6.484 17.522 2 12 2Z" />
    </svg>
  );
}

function SiteUrlLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      {icon}
      <span className="truncate">{formatUrlDisplay(href)}</span>
      <span className="sr-only">({label})</span>
    </a>
  );
}

export function SitePageHeader({ site, activeTab }: SitePageHeaderProps) {
  const hasUrls = site.liveUrl || site.githubUrl;

  return (
    <header className="mb-8 space-y-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <SiteAvatar
            name={site.name}
            logoUrl={site.logo?.url}
            className="size-14"
          />
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {site.name}
            </h1>
            {site.description ? (
              <p className="text-muted-foreground">{site.description}</p>
            ) : null}
          </div>
        </div>

        {hasUrls ? (
          <div className="flex flex-col items-start gap-2 sm:items-end">
            {site.liveUrl ? (
              <SiteUrlLink
                href={site.liveUrl}
                icon={<ExternalLink className="size-4 shrink-0" />}
                label="Live site"
              />
            ) : null}
            {site.githubUrl ? (
              <SiteUrlLink
                href={site.githubUrl}
                icon={<GithubIcon className="size-4 shrink-0" />}
                label="GitHub repository"
              />
            ) : null}
          </div>
        ) : null}
      </div>

      <nav
        className="flex gap-6 border-b border-border"
        aria-label="Site sections"
      >
        <Link
          to="/$site"
          params={{ site: site.slug }}
          search={{ tab: "feed" }}
          className={cn(tabClass, activeTab === "feed" && tabActiveClass)}
        >
          Feed
        </Link>
        <Link
          to="/$site"
          params={{ site: site.slug }}
          search={{ tab: "board" }}
          className={cn(tabClass, activeTab === "board" && tabActiveClass)}
        >
          Board
        </Link>
      </nav>
    </header>
  );
}
