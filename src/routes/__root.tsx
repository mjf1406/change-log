/** @format */

import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { useInstantConnectionToasts } from "@/lib/instant-connection";

export const Route = createRootRoute({
    loader: () => void 0,
    component: RootComponent,
});

function InstantConnectionToasts() {
    useInstantConnectionToasts();
    return null;
}

function RootComponent() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <Outlet />
            <InstantConnectionToasts />
            <Toaster />
        </div>
    );
}
