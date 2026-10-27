import { createFileRoute } from "@tanstack/react-router";
import { PaymentChecklistPage } from "@/components/pages/PaymentChecklistPage";

export const Route = createFileRoute("/view/payments")({
  head: () => ({ meta: [{ title: "Payment Checklist (View Only) · Bethelehem Cleaning Service" }, { name: "robots", content: "noindex" }] }),
  component: PaymentChecklistPage,
});
