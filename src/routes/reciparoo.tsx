import { createFileRoute } from "@tanstack/react-router";
import { AppPlaceholder } from "@/components/AppPlaceholder";

export const Route = createFileRoute("/reciparoo")({
  component: ReciparooPage,
});

function ReciparooPage() {
  return <AppPlaceholder slug="reciparoo" />;
}
