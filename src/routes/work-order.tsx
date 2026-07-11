import { createFileRoute } from "@tanstack/react-router";
import { PageLoader } from "@/components/PageLoader";
import { WorkOrderList } from "@/components/WorkOrderList";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useIsAdmin } from "@/lib/admin";

export const Route = createFileRoute("/work-order")({
  component: WorkOrderPage,
});

function WorkOrderPage() {
  const { isLoading: authLoading, isAdmin } = useIsAdmin();

  if (authLoading) {
    return <PageLoader />;
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Work Order</h1>
        <p className="text-muted-foreground">Tasks across all sites.</p>
      </div>

      {!isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>
              Sign in as the admin to view the work order.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <WorkOrderList />
      )}
    </main>
  );
}
