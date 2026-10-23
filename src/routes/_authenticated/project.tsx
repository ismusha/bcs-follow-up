import { createFileRoute } from "@tanstack/react-router";
import { ProjectPage } from "@/components/pages/ProjectPage";
import { inspectionQuery } from "@/lib/inspection-data";

export const Route = createFileRoute("/_authenticated/project")({
  loader: ({ context }) => context.queryClient.ensureQueryData(inspectionQuery),
  head: () => ({ meta: [
    { title: "Project Inspections · Bethelehem Cleaning Service" },
    { name: "description", content: "Project inspection records for Bethelehem Cleaning Service." },
    { property: "og:title", content: "Project Inspections · Bethelehem Cleaning Service" },
    { property: "og:description", content: "Project inspection records for Bethelehem Cleaning Service." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ProjectPage,
});