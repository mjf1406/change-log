import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$site/board")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$site",
      params: { site: params.site },
      search: { tab: "board" },
    });
  },
});
