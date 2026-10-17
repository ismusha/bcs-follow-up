import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bethelehem Cleaning Service · Management" },
      { name: "description", content: "Internal scheduling and cleaner management for Bethelehem Cleaning Service." },
      { property: "og:title", content: "Bethelehem Cleaning Service · Management" },
      { property: "og:description", content: "Internal scheduling and cleaner management system." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
