import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SignInDialog } from "@/components/SignInDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { APPS } from "@/lib/apps";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

const navLinkClass =
  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

const navLinkActiveClass = "bg-muted text-foreground";

function NavLink({
  to,
  children,
  exact = false,
  onNavigate,
  className,
}: {
  to: string;
  children: ReactNode;
  exact?: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact }}
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

function DesktopNav() {
  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
      <NavLink to="/" exact>
        Home
      </NavLink>
      {APPS.map((app) => (
        <NavLink key={app.slug} to={`/${app.slug}`}>
          {app.name}
        </NavLink>
      ))}
    </nav>
  );
}

function AuthActions({
  onSignIn,
  className,
}: {
  onSignIn: () => void;
  className?: string;
}) {
  const { isLoading, user } = db.useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return (
      <Button variant="outline" size="sm" className={className} onClick={onSignIn}>
        Sign in
      </Button>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <p className="max-w-48 truncate text-xs text-muted-foreground">
        {user.email}
      </p>
      <Button variant="outline" size="sm" onClick={() => db.auth.signOut()}>
        Sign out
      </Button>
    </div>
  );
}

function MobileNav({
  open,
  onOpenChange,
  onSignIn,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignIn: () => void;
}) {
  const close = () => onOpenChange(false);
  const { isLoading, user } = db.useAuth();

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
          {APPS.map((app) => (
            <NavLink
              key={app.slug}
              to={`/${app.slug}`}
              onNavigate={close}
              className="w-full"
            >
              {app.name}
            </NavLink>
          ))}
        </nav>
        <SheetFooter className="border-t border-border">
          {!isLoading && !user ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                close();
                onSignIn();
              }}
            >
              Sign in
            </Button>
          ) : null}
          {!isLoading && user ? (
            <>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  close();
                  void db.auth.signOut();
                }}
              >
                Sign out
              </Button>
            </>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <div className="flex flex-1 items-center justify-end gap-3 md:justify-between">
            <DesktopNav />

            <div className="flex items-center gap-2">
              <AuthActions
                onSignIn={() => setSignInOpen(true)}
                className="hidden md:flex"
              />
              <ThemeToggle />
              <MobileNav
                open={mobileOpen}
                onOpenChange={setMobileOpen}
                onSignIn={() => setSignInOpen(true)}
              />
            </div>
          </div>
        </div>
      </header>

      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </>
  );
}
