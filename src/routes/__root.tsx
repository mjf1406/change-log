import { createRootRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { PageLoader } from "@/components/PageLoader";

export const Route = createRootRoute({
  loader: () => void 0,
  component: RootComponent,
});

function RootComponent() {
  const isLoading = useRouterState({ select: (state) => state.isLoading });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {isLoading ? <PageLoader /> : <Outlet />}
    </div>
  );
}
