import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/pages/DashboardPage";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · Bethelehem Cleaning Service" },
      { name: "description", content: "Dashboard for Bethelehem Cleaning Service staff." },
      { property: "og:title", content: "Dashboard · Bethelehem Cleaning Service" },
      { property: "og:description", content: "Dashboard for Bethelehem Cleaning Service staff." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});
