import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { AppointmentCard } from "@/components/AppointmentCard";
import { useAppointmentEditor } from "@/components/AppointmentEditor";
import { STATUSES, hhmm, useAppointments, useCleaners, useLocations } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/schedule")({
  head: () => ({
    meta: [
      { title: "Cleaning Schedule · Bethelehem Cleaning Service" },
      { name: "description", content: "Search, filter and manage every cleaning appointment." },
      { property: "og:title", content: "Cleaning Schedule · Bethelehem Cleaning Service" },
      { property: "og:description", content: "Search, filter and manage every cleaning appointment." },
    ],
  }),
  component: Schedule,
});

const ALL = "all";

function Schedule() {
  const { data: appts = [], isLoading } = useAppointments();
  const { data: cleaners = [] } = useCleaners();
  const { data: locations = [] } = useLocations();
  const { open, askDelete } = useAppointmentEditor();
  const [q, setQ] = useState("");
  const [date, setDate] = useState("");
  const [loc, setLoc] = useState(ALL);
  const [cleaner, setCleaner] = useState(ALL);
  const [status, setStatus] = useState(ALL);

  const nameOf = (id: string) => cleaners.find((c) => c.id === id)?.name ?? "";
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return appts.filter((a) => {
      if (date && a.date !== date) return false;
      if (loc !== ALL && a.location !== loc) return false;
      if (cleaner !== ALL && !a.cleaner_ids.includes(cleaner)) return false;
      if (status !== ALL && a.status !== status) return false;
      if (s) {
        const hay = [a.location, a.remark, a.tasks.join(" "), a.cleaner_ids.map(nameOf).join(" ")].join(" ").toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [appts, q, date, loc, cleaner, status, cleaners]);

  const filtered = q || date || loc !== ALL || cleaner !== ALL || status !== ALL;

  return (
    <>
      <PageHeader title="Cleaning Schedule" subtitle="All appointments — tap any row to edit." />

      <div className="mb-4 grid gap-2 rounded-xl border bg-card p-3 shadow-card sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Filter by date" />
        <Select value={loc} onValueChange={setLoc}>
          <SelectTrigger><SelectValue placeholder="Location" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All locations</SelectItem>
            {locations.map((l) => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={cleaner} onValueChange={setCleaner}>
          <SelectTrigger><SelectValue placeholder="Cleaner" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All cleaners</SelectItem>
            {cleaners.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {filtered && (
        <button className="mb-3 text-sm font-semibold text-primary hover:underline" onClick={() => { setQ(""); setDate(""); setLoc(ALL); setCleaner(ALL); setStatus(ALL); }}>
          Clear filters
        </button>
      )}

      {!isLoading && rows.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-12 text-center">
          <p className="font-display text-lg font-semibold">{filtered ? "No matching appointments" : "No scheduled jobs yet"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{filtered ? "Try changing the filters." : "Create your first cleaning appointment."}</p>
          <Button className="mt-4" onClick={() => open()}><Plus className="mr-1 h-4 w-4" />New Appointment</Button>
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {rows.map((a) => <AppointmentCard key={a.id} a={a} cleaners={cleaners} showDate />)}
          </div>
          <div className="hidden overflow-hidden rounded-xl border bg-card shadow-card md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Date</th><th className="px-4 py-3">Time</th><th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Cleaners</th><th className="px-4 py-3">Remark</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className="cursor-pointer border-t hover:bg-accent/40" onClick={() => open(a)}>
                    <td className="whitespace-nowrap px-4 py-3 font-medium">{format(parseISO(a.date), "MMM d, yyyy")}</td>
                    <td className="whitespace-nowrap px-4 py-3">{hhmm(a.start_time)}–{hhmm(a.end_time)}</td>
                    <td className="px-4 py-3 font-semibold">{a.location}</td>
                    <td className="px-4 py-3">{a.cleaner_ids.map(nameOf).join(", ") || "—"}</td>
                    <td className="max-w-xs px-4 py-3"><p className="line-clamp-2 text-muted-foreground">{a.remark || "—"}</p></td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => open(a)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" aria-label="Delete" className="text-destructive hover:text-destructive" onClick={() => askDelete(a)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
