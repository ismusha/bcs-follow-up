import { createFileRoute } from "@tanstack/react-router";
import { SchedulePage } from "@/components/pages/SchedulePage";

export const Route = createFileRoute("/view/schedule")({
  head: () => ({
    meta: [
      { title: "Cleaning Schedule (View Only) · Bethelehem Cleaning Service" },
      { name: "description", content: "Read-only view of every scheduled cleaning job." },
      { property: "og:title", content: "Cleaning Schedule (View Only) · Bethelehem Cleaning Service" },
      { property: "og:description", content: "Read-only view of every scheduled cleaning job." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SchedulePage,
});
