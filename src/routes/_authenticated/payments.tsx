import { createFileRoute } from "@tanstack/react-router";
import { PaymentChecklistPage } from "@/components/pages/PaymentChecklistPage";

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({ meta: [
    { title: "Payment Checklist · Bethelehem Cleaning Service" },
    { name: "description", content: "Monthly company payment checklist for Bethelehem Cleaning Service staff." },
    { property: "og:title", content: "Payment Checklist · Bethelehem Cleaning Service" },
    { property: "og:description", content: "Monthly company payment status for Bethelehem Cleaning Service." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: PaymentChecklistPage,
});
