import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { CalendarCheck, CalendarClock, CheckCircle2, ClipboardList, Hourglass, Plus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/AppShell";
import { AppointmentCard } from "@/components/AppointmentCard";
import { useAppointmentEditor } from "@/components/AppointmentEditor";
import { useReadOnly } from "@/lib/readonly";
import { hhmm, spansDay, useAppointments, useCleaners, type Appointment, type Cleaner } from "@/lib/data";

export function DashboardPage() {
  const { data: appts = [] } = useAppointments();
  const { data: cleaners = [] } = useCleaners();
  const { open } = useAppointmentEditor();
  const readOnly = useReadOnly();
  const today = format(new Date(), "yyyy-MM-dd");
  const now = format(new Date(), "HH:mm");

  const todays = appts.filter((a) => spansDay(a, today) && a.status !== "cancelled");
  const upcoming = appts.filter((a) => a.date > today && a.status !== "cancelled");
  const completed = appts.filter((a) => a.status === "completed").length;
  const pending = appts.filter((a) => a.status === "scheduled" || a.status === "in_progress").length;
  const busyNow = new Set(
    todays.filter((a) => hhmm(a.start_time) <= now && hhmm(a.end_time) > now && a.status !== "completed").flatMap((a) => a.cleaner_ids),
  );
  const available = cleaners.length - busyNow.size;

  const stats = [
    { label: "Total appointments", value: appts.length, icon: ClipboardList },
    { label: "Today's jobs", value: todays.length, icon: CalendarCheck },
    { label: "Upcoming jobs", value: upcoming.length, icon: CalendarClock },
    { label: "Available cleaners", value: `${available}/${cleaners.length}`, icon: UserCheck },
    { label: "Completed", value: completed, icon: CheckCircle2 },
    { label: "Pending", value: pending, icon: Hourglass },
  ];

  return (
    <>
      <div className="mb-6 overflow-hidden rounded-2xl bg-hero p-6 text-navy-foreground sm:p-8">
        <p className="text-sm font-medium text-sky">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Good day — here's today at a glance</h1>
        <p className="mt-2 max-w-lg text-sm text-navy-foreground/80">
          {todays.length ? `${todays.length} job${todays.length > 1 ? "s" : ""} scheduled today.` : "No jobs scheduled today."}
        </p>
        {!readOnly && (
          <Button onClick={() => open()} variant="secondary" className="mt-5">
            <Plus className="mr-1 h-4 w-4" /> New Assignment
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border bg-card p-4 shadow-card">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-soft text-primary"><Icon className="h-5 w-5" /></div>
            <p className="mt-3 font-display text-2xl font-bold">{value}</p>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <PageHeader title="Today" />
          <List items={todays} cleaners={cleaners} empty="Nothing on the schedule today." />
        </section>
        <section>
          <PageHeader title="Upcoming">
            <Link to={readOnly ? "/view/schedule" : "/schedule"} className="text-sm font-semibold text-primary hover:underline">View all</Link>
          </PageHeader>
          <List items={upcoming.slice(0, 5)} cleaners={cleaners} empty="No upcoming jobs." showDate />
        </section>
      </div>
    </>
  );
}

function List({ items, cleaners, empty, showDate }: { items: Appointment[]; cleaners: Cleaner[]; empty: string; showDate?: boolean | undefined }) {
  const { open } = useAppointmentEditor();
  const readOnly = useReadOnly();
  if (!items.length)
    return (
      <div className="rounded-xl border border-dashed bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">{empty}</p>
        {!readOnly && (
          <Button variant="outline" size="sm" className="mt-3" onClick={() => open()}><Plus className="mr-1 h-4 w-4" />Add assignment</Button>
        )}
      </div>
    );
  return <div className="grid gap-3">{items.map((a) => <AppointmentCard key={a.id} a={a} cleaners={cleaners} showDate={showDate} />)}</div>;
}
