import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ViewerShell } from "@/components/ViewerShell";

export const Route = createFileRoute("/view")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex" }],
  }),
  component: () => (
    <ViewerShell>
      <Outlet />
    </ViewerShell>
  ),
});
