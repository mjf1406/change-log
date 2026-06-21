import { createFileRoute } from "@tanstack/react-router";
import { AppPlaceholder } from "@/components/AppPlaceholder";

export const Route = createFileRoute("/imagaroo")({
  component: ImagarooPage,
});

function ImagarooPage() {
  return <AppPlaceholder slug="imagaroo" />;
}
