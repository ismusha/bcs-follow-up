import { createFileRoute } from "@tanstack/react-router";
import { CleanersPage } from "@/components/pages/CleanersPage";

export const Route = createFileRoute("/view/cleaners")({
  head: () => ({
    meta: [
      { title: "Cleaners (View Only) · Bethelehem Cleaning Service" },
      { name: "description", content: "Read-only view of the cleaning team and their upcoming jobs." },
      { property: "og:title", content: "Cleaners (View Only) · Bethelehem Cleaning Service" },
      { property: "og:description", content: "Read-only view of the cleaning team and their upcoming jobs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CleanersPage,
});
