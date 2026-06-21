import { createFileRoute } from "@tanstack/react-router";
import { AppPlaceholder } from "@/components/AppPlaceholder";

export const Route = createFileRoute("/solsim")({
  component: SolsimPage,
});

function SolsimPage() {
  return <AppPlaceholder slug="solsim" />;
}
