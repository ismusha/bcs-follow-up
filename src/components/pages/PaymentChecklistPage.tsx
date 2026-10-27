import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { CheckCircle2, CircleDollarSign, LoaderCircle, Search, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useReadOnly } from "@/lib/readonly";
import { useAppointments, useCleaners } from "@/lib/data";

type PaymentCheck = { appointment_id: string; is_paid: boolean };

export function PaymentChecklistPage() {
  const readOnly = useReadOnly();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const appointments = useAppointments();
  const cleaners = useCleaners();
  const payments = useQuery({
    queryKey: ["payment-checks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_checks").select("*");
      if (error) throw error;
      return data as PaymentCheck[];
    },
  });

  const save = useMutation({
    mutationFn: async ({ appointmentId, isPaid }: { appointmentId: string; isPaid: boolean }) => {
      if (readOnly) throw new Error("This view is read-only.");
      const { error } = await supabase.from("payment_checks").upsert(
        { appointment_id: appointmentId, is_paid: isPaid },
        { onConflict: "appointment_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-checks"] }),
    onError: (error) => toast.error(`Could not update payment status: ${error.message}`),
  });

  const rows = useMemo(() => {
    const paid = new Map((payments.data ?? []).map((p) => [p.appointment_id, p.is_paid]));
    const cleanerNames = new Map((cleaners.data ?? []).map((c) => [c.id, c.name]));
    return (appointments.data ?? []).map((a) => ({
      ...a,
      isPaid: paid.get(a.id) ?? false,
      assigned: a.cleaner_ids.map((id) => cleanerNames.get(id)).filter(Boolean).join(", "),
    })).filter((a) => `${a.location} ${a.assigned} ${a.remark} ${a.date}`.toLowerCase().includes(search.toLowerCase()));
  }, [appointments.data, cleaners.data, payments.data, search]);

  const isLoading = appointments.isLoading || cleaners.isLoading || payments.isLoading;
  const error = appointments.error || cleaners.error || payments.error;

  return <>
    <PageHeader title="Payment Checklist" subtitle="Track which cleaning assignments have been paid.">
      <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        {rows.filter((r) => r.isPaid).length} paid / {rows.length} assignments
      </div>
    </PageHeader>
    <div className="relative mb-5 max-w-md">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input aria-label="Search assignments" placeholder="Search location, staff, date…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
    </div>
    {isLoading ? <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground"><LoaderCircle className="h-5 w-5 animate-spin" />Loading payment checklist…</div>
      : error ? <div role="alert" className="rounded-xl border border-destructive/30 p-6 text-sm"><p className="font-semibold">Could not load payment checklist.</p><p className="mt-1 text-muted-foreground">{error.message}</p><Button className="mt-3" variant="outline" onClick={() => { appointments.refetch(); cleaners.refetch(); payments.refetch(); }}>Try again</Button></div>
      : rows.length === 0 ? <div className="rounded-xl border border-dashed p-12 text-center"><CircleDollarSign className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-semibold">{(appointments.data ?? []).length ? "No matching assignments" : "No assignments yet"}</p><p className="mt-1 text-sm text-muted-foreground">Cleaning assignments will appear here automatically.</p></div>
      : <div className="grid gap-3">{rows.map((a) => <article key={a.id} className="rounded-xl border bg-card p-4 shadow-card sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><h2 className="break-words font-display text-lg font-semibold">{a.location}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${a.isPaid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{a.isPaid ? "Paid" : "Unpaid"}</span></div>
            <p className="mt-1 text-sm text-muted-foreground">{format(parseISO(a.date), "EEE, MMM d, yyyy")} · {a.start_time.slice(0,5)}–{a.end_time.slice(0,5)}</p>
            <p className="mt-1 text-sm"><span className="text-muted-foreground">Assigned staff: </span>{a.assigned || "Unassigned"}</p>
            {a.remark && <p className="mt-1 break-words text-sm text-muted-foreground">{a.remark}</p>}
          </div>
          {!readOnly && <Button className="shrink-0" variant={a.isPaid ? "outline" : "default"} disabled={save.isPending} onClick={() => save.mutate({ appointmentId: a.id, isPaid: !a.isPaid })}>
            {save.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : a.isPaid ? <XCircle className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Mark {a.isPaid ? "unpaid" : "paid"}
          </Button>}
        </div>
      </article>)}</div>}
    {readOnly && <p className="mt-5 text-center text-xs text-muted-foreground">View only — payment statuses cannot be changed here.</p>}
  </>;
}
