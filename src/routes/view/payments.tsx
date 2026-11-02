import { createFileRoute } from "@tanstack/react-router";
import { PaymentChecklistPage } from "@/components/pages/PaymentChecklistPage";

export const Route = createFileRoute("/view/payments")({
  head: () => ({ meta: [
    { title: "Payment Checklist (View Only) · Bethelehem Cleaning Service" },
    { name: "description", content: "View monthly company payment statuses for Bethelehem Cleaning Service." },
    { property: "og:title", content: "Payment Checklist (View Only) · Bethelehem Cleaning Service" },
    { property: "og:description", content: "Read-only monthly company payment checklist." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: PaymentChecklistPage,
});
