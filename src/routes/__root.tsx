import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Outlet />
    </div>
  );
}
