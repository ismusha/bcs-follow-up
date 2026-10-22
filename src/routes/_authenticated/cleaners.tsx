import { createFileRoute } from "@tanstack/react-router";
import { CleanersPage } from "@/components/pages/CleanersPage";

export const Route = createFileRoute("/_authenticated/cleaners")({
  head: () => ({
    meta: [
      { title: "Cleaners · Bethelehem Cleaning Service" },
      { name: "description", content: "Cleaners for Bethelehem Cleaning Service staff." },
      { property: "og:title", content: "Cleaners · Bethelehem Cleaning Service" },
      { property: "og:description", content: "Cleaners for Bethelehem Cleaning Service staff." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CleanersPage,
});
