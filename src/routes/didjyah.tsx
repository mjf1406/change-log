import { createFileRoute } from "@tanstack/react-router";
import { AppPlaceholder } from "@/components/AppPlaceholder";

export const Route = createFileRoute("/didjyah")({
  component: DidjyahPage,
});

function DidjyahPage() {
  return <AppPlaceholder slug="didjyah" />;
}
