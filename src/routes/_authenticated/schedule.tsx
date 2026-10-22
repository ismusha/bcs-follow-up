import { createFileRoute } from "@tanstack/react-router";
import { SchedulePage } from "@/components/pages/SchedulePage";

export const Route = createFileRoute("/_authenticated/schedule")({
  head: () => ({
    meta: [
      { title: "Cleaning Schedule · Bethelehem Cleaning Service" },
      { name: "description", content: "Cleaning Schedule for Bethelehem Cleaning Service staff." },
      { property: "og:title", content: "Cleaning Schedule · Bethelehem Cleaning Service" },
      { property: "og:description", content: "Cleaning Schedule for Bethelehem Cleaning Service staff." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SchedulePage,
});
