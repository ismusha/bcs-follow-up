import { createFileRoute } from "@tanstack/react-router";
import { CalendarPage } from "@/components/pages/CalendarPage";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar · Bethelehem Cleaning Service" },
      { name: "description", content: "Calendar for Bethelehem Cleaning Service staff." },
      { property: "og:title", content: "Calendar · Bethelehem Cleaning Service" },
      { property: "og:description", content: "Calendar for Bethelehem Cleaning Service staff." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CalendarPage,
});
