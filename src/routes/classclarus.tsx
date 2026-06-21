import { createFileRoute } from "@tanstack/react-router";
import { AppPlaceholder } from "@/components/AppPlaceholder";

export const Route = createFileRoute("/classclarus")({
  component: ClassClarusPage,
});

function ClassClarusPage() {
  return <AppPlaceholder slug="classclarus" />;
}
