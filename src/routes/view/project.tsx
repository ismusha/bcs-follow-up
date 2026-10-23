import { createFileRoute } from "@tanstack/react-router";
import { ProjectPage } from "@/components/pages/ProjectPage";
import { inspectionQuery } from "@/lib/inspection-data";

export const Route = createFileRoute("/view/project")({
  ssr: false,
  loader: ({ context }) => context.queryClient.ensureQueryData(inspectionQuery),
  head: () => ({ meta: [
    { title: "Project Inspections (View Only) · Bethelehem Cleaning Service" },
    { name: "description", content: "Read-only project inspection records from Bethelehem Cleaning Service." },
    { property: "og:title", content: "Project Inspections (View Only) · Bethelehem Cleaning Service" },
    { property: "og:description", content: "Read-only project inspection records from Bethelehem Cleaning Service." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "robots", content: "noindex" },
  ] }),
  component: ProjectPage,
});