import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LogIn, LogOut, Menu, Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SignInDialog } from "@/components/SignInDialog";
import { SiteFormDialog } from "@/components/SiteFormDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useIsAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { useSites } from "@/lib/sites";
import { cn } from "@/lib/utils";

const navLinkClass =
  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

const navLinkActiveClass = "bg-muted text-foreground";

function NavLink({
  to,
  params,
  search,
  children,
  exact = false,
  includeSearch = true,
  onNavigate,
  className,
}: {
  to: string;
  params?: Record<string, string>;
  search?: Record<string, string>;
  children: ReactNode;
  exact?: boolean;
  includeSearch?: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <Link
      to={to}
      params={params}
      search={search}
      activeOptions={{ exact, includeSearch }}
      onClick={onNavigate}
      className={cn(navLinkClass, className)}
      activeProps={{
        className: cn(navLinkClass, navLinkActiveClass, className),
      }}
    >
      {children}
    </Link>
  );
}

function SiteNavLinks({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const { isLoading, sites } = useSites();

  if (isLoading) {
    return (
      <span className="px-3 py-2 text-xs text-muted-foreground">Loading...</span>
    );
  }

  return (
    <>
      {sites.map((site) => (
        <NavLink
          key={site.id}
          to="/$site"
          params={{ site: site.slug }}
          onNavigate={onNavigate}
          className={className}
        >
          {site.name}
        </NavLink>
      ))}
    </>
  );
}

function DesktopNav() {
  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
      <NavLink to="/" exact>
        Home
      </NavLink>
      <SiteNavLinks />
    </nav>
  );
}

function AuthActions({
  onSignIn,
  onCreateSite,
  className,
}: {
  onSignIn: () => void;
  onCreateSite: () => void;
  className?: string;
}) {
  const { isLoading, user } = db.useAuth();
  const { isAdmin } = useIsAdmin();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return (
      <Button
        variant="default"
        size="icon-sm"
        className={className}
        onClick={onSignIn}
        aria-label="Sign in"
      >
        <LogIn />
      </Button>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {isAdmin ? (
        <>
          <Button
            variant="outline"
            size="icon-sm"
            asChild
            aria-label="Manage sites"
          >
            <Link to="/sites">
              <Settings2 />
            </Link>
          </Button>
          <Button
            variant="default"
            size="icon-sm"
            onClick={onCreateSite}
            aria-label="Add site"
          >
            <Plus />
          </Button>
        </>
      ) : null}
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => db.auth.signOut()}
        aria-label="Sign out"
      >
        <LogOut />
      </Button>
    </div>
  );
}

function MobileNav({
  open,
  onOpenChange,
  onSignIn,
  onCreateSite,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignIn: () => void;
  onCreateSite: () => void;
}) {
  const close = () => onOpenChange(false);
  const { isLoading, user } = db.useAuth();
  const { isAdmin } = useIsAdmin();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-xs">
        <nav className="flex flex-col gap-1 px-4 pt-4" aria-label="Main">
          <NavLink to="/" exact onNavigate={close} className="w-full">
            Home
          </NavLink>
          <SiteNavLinks onNavigate={close} className="w-full" />
        </nav>
        <SheetFooter className="border-t border-border">
          {!isLoading && !user ? (
            <Button
              variant="default"
              size="icon-sm"
              className="mx-auto"
              onClick={() => {
                close();
                onSignIn();
              }}
              aria-label="Sign in"
            >
              <LogIn />
            </Button>
          ) : null}
          {!isLoading && user ? (
            <div className="flex items-center justify-center gap-2">
              {isAdmin ? (
                <>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    asChild
                    aria-label="Manage sites"
                  >
                    <Link to="/sites" onClick={close}>
                      <Settings2 />
                    </Link>
                  </Button>
                  <Button
                    variant="default"
                    size="icon-sm"
                    onClick={() => {
                      close();
                      onCreateSite();
                    }}
                    aria-label="Add site"
                  >
                    <Plus />
                  </Button>
                </>
              ) : null}
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => {
                  close();
                  void db.auth.signOut();
                }}
                aria-label="Sign out"
              >
                <LogOut />
              </Button>
            </div>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [createSiteOpen, setCreateSiteOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <div className="flex flex-1 items-center justify-end gap-3 md:justify-between">
            <DesktopNav />

            <div className="flex items-center gap-2">
              <AuthActions
                onSignIn={() => setSignInOpen(true)}
                onCreateSite={() => setCreateSiteOpen(true)}
                className="hidden md:flex"
              />
              <ThemeToggle />
              <MobileNav
                open={mobileOpen}
                onOpenChange={setMobileOpen}
                onSignIn={() => setSignInOpen(true)}
                onCreateSite={() => setCreateSiteOpen(true)}
              />
            </div>
          </div>
        </div>
      </header>

      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
      <SiteFormDialog
        open={createSiteOpen}
        onOpenChange={setCreateSiteOpen}
        mode="create"
      />
    </>
  );
}
