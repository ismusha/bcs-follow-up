import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useReadOnly } from "@/lib/readonly";

const COMPANIES = [
  "ECA",
  "Zam Zam Bank",
  "AUCDC",
  "Last Mile",
  "Reinsurance",
  "Compassion",
  "UNISA",
  "Qatar Airways",
  "Water Aid",
  "Corteva",
  "UNDP (Kality)",
  "UNDP (Bambis)",
  "UNESCO",
  "Kifiya",
  "Hijra Bank",
  "Bank of Abyssinia",
] as const;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type MonthlyPayment = { company_name: string; month: number; year: number; is_paid: boolean };

export function PaymentChecklistPage() {
  const readOnly = useReadOnly();
  const qc = useQueryClient();
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const year = new Date().getFullYear();

  const payments = useQuery({
    queryKey: ["monthly-company-payments", year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_company_payments")
        .select("company_name, month, year, is_paid")
        .eq("year", year)
        .eq("month", Number(month));
      if (error) throw error;
      return data as MonthlyPayment[];
    },
  });

  const save = useMutation({
    mutationFn: async ({ company, isPaid }: { company: string; isPaid: boolean }) => {
      if (readOnly) throw new Error("This view is read-only.");
      const { error } = await supabase.from("monthly_company_payments").upsert(
        { company_name: company, month: Number(month), year, is_paid: isPaid },
        { onConflict: "company_name,month,year" },
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monthly-company-payments", year, month] }),
    onError: (error) => toast.error(`Could not update payment status: ${error.message}`),
  });

  const paidMap = new Map((payments.data ?? []).map((p) => [p.company_name, p.is_paid]));

  return <>
    <PageHeader title="Payment Checklist" subtitle="Monthly payment status for the 16 companies." />
    <div className="mb-5 max-w-xs">
      <Select value={month} onValueChange={setMonth}>
        <SelectTrigger aria-label="Choose month"><SelectValue placeholder="Choose month" /></SelectTrigger>
        <SelectContent>
          {MONTHS.map((name, index) => <SelectItem key={name} value={String(index + 1)}>{name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>

    {payments.isLoading
      ? <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground"><LoaderCircle className="h-5 w-5 animate-spin" />Loading payments…</div>
      : payments.error
        ? <div role="alert" className="rounded-xl border border-destructive/30 p-6 text-sm"><p className="font-semibold">Could not load payments.</p><p className="mt-1 text-muted-foreground">{payments.error.message}</p><Button className="mt-3" variant="outline" onClick={() => payments.refetch()}>Try again</Button></div>
        : <div className="overflow-hidden rounded-xl border bg-card">
          {COMPANIES.map((company, index) => {
            const isPaid = paidMap.get(company) ?? false;
            return <div key={company} className={`flex items-center justify-between gap-3 px-4 py-4 sm:px-5 ${index < COMPANIES.length - 1 ? "border-b" : ""}`}>
              <span className="font-medium">{company}</span>
              <Button
                variant={isPaid ? "outline" : "secondary"}
                className={`min-w-28 shrink-0 ${isPaid ? "text-emerald-700" : ""}`}
                disabled={readOnly || save.isPending}
                onClick={() => save.mutate({ company, isPaid: !isPaid })}
              >
                {save.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : isPaid ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Circle className="mr-2 h-4 w-4" />}
                {isPaid ? "Paid" : "Unpaid"}
              </Button>
            </div>;
          })}
        </div>}
    {readOnly && <p className="mt-4 text-center text-xs text-muted-foreground">View only — payment statuses cannot be changed here.</p>}
  </>;
}
