import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/pages/DashboardPage";

export const Route = createFileRoute("/view/dashboard")({
  head: () => ({
    meta: [
      { title: "Schedule Overview · Bethelehem Cleaning Service" },
      { name: "description", content: "Read-only overview of today's cleaning jobs and cleaner availability." },
      { property: "og:title", content: "Schedule Overview · Bethelehem Cleaning Service" },
      { property: "og:description", content: "Read-only overview of today's cleaning jobs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});
