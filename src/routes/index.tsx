import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { APPS } from "@/lib/apps";

export const Route = createFileRoute("/")({
  component: HubPage,
});

function HubPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Change Log</h1>
        <p className="text-muted-foreground">
          Choose an app to get started.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {APPS.map((app) => (
          <Link
            key={app.slug}
            to={`/${app.slug}`}
            className="group block rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Card className="h-full transition-colors group-hover:bg-muted/40">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle>{app.name}</CardTitle>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <CardDescription>{app.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
