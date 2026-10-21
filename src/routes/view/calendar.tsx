import { createFileRoute } from "@tanstack/react-router";
import { CalendarPage } from "@/components/pages/CalendarPage";

export const Route = createFileRoute("/view/calendar")({
  head: () => ({
    meta: [
      { title: "Cleaning Calendar (View Only) · Bethelehem Cleaning Service" },
      { name: "description", content: "Read-only daily, weekly and monthly cleaning calendar." },
      { property: "og:title", content: "Cleaning Calendar (View Only) · Bethelehem Cleaning Service" },
      { property: "og:description", content: "Read-only daily, weekly and monthly cleaning calendar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CalendarPage,
});
