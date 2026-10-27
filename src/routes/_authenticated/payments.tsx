import { createFileRoute } from "@tanstack/react-router";
import { PaymentChecklistPage } from "@/components/pages/PaymentChecklistPage";

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({ meta: [{ title: "Payment Checklist · Bethelehem Cleaning Service" }] }),
  component: PaymentChecklistPage,
});
