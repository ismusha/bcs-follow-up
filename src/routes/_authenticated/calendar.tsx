import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  addDays, addMonths, addWeeks, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth,
  isToday, startOfMonth, startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/AppShell";
import { AppointmentCard } from "@/components/AppointmentCard";
import { useAppointmentEditor } from "@/components/AppointmentEditor";
import { cn } from "@/lib/utils";
import { hhmm, useAppointments, useCleaners, type Appointment } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar · Bethelehem Cleaning Service" },
      { name: "description", content: "Daily, weekly and monthly view of who is cleaning where and when." },
      { property: "og:title", content: "Calendar · Bethelehem Cleaning Service" },
      { property: "og:description", content: "Daily, weekly and monthly cleaning calendar." },
    ],
  }),
  component: CalendarPage,
});

type View = "day" | "week" | "month";
const key = (d: Date) => format(d, "yyyy-MM-dd");

function CalendarPage() {
  const [view, setView] = useState<View>("week");
  const [cursor, setCursor] = useState(new Date());
  const { data: appts = [] } = useAppointments();
  const { data: cleaners = [] } = useCleaners();
  const { open } = useAppointmentEditor();
  const byDay = (d: Date) => appts.filter((a) => a.date === key(d));
  const shortNames = (a: Appointment) => a.cleaner_ids.map((id) => cleaners.find((c) => c.id === id)?.name).filter(Boolean).join(", ");

  const step = (n: number) =>
    setCursor((c) => (view === "day" ? addDays(c, n) : view === "week" ? addWeeks(c, n) : addMonths(c, n)));

  const title =
    view === "day" ? format(cursor, "EEEE, MMMM d, yyyy")
    : view === "week" ? `${format(startOfWeek(cursor, { weekStartsOn: 1 }), "MMM d")} – ${format(endOfWeek(cursor, { weekStartsOn: 1 }), "MMM d, yyyy")}`
    : format(cursor, "MMMM yyyy");

  return (
    <>
      <PageHeader title="Calendar" subtitle="See who is going where and when.">
        <Tabs value={view} onValueChange={(v) => setView(v as View)}>
          <TabsList>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button size="icon" variant="outline" onClick={() => step(-1)} aria-label="Previous"><ChevronLeft className="h-4 w-4" /></Button>
          <Button size="icon" variant="outline" onClick={() => step(1)} aria-label="Next"><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="ghost" onClick={() => setCursor(new Date())}>Today</Button>
        </div>
        <p className="font-display text-sm font-semibold sm:text-lg">{title}</p>
      </div>

      {view === "day" && (
        <div className="grid gap-3">
          {byDay(cursor).length ? (
            byDay(cursor).map((a) => <AppointmentCard key={a.id} a={a} cleaners={cleaners} />)
          ) : (
            <div className="rounded-xl border border-dashed bg-card p-12 text-center">
              <p className="text-sm text-muted-foreground">No jobs on this day.</p>
              <Button className="mt-3" variant="outline" onClick={() => open({ date: key(cursor) })}>Add appointment</Button>
            </div>
          )}
        </div>
      )}

      {view === "week" && (
        <div className="grid gap-3 md:grid-cols-7">
          {eachDayOfInterval({ start: startOfWeek(cursor, { weekStartsOn: 1 }), end: endOfWeek(cursor, { weekStartsOn: 1 }) }).map((d) => (
            <div key={key(d)} className={cn("min-h-40 rounded-xl border bg-card p-2 shadow-card", isToday(d) && "border-sky ring-1 ring-sky")}>
              <button onClick={() => open({ date: key(d) })} className="mb-2 flex w-full items-baseline justify-between px-1 text-left">
                <span className="text-xs font-semibold uppercase text-muted-foreground">{format(d, "EEE")}</span>
                <span className="font-display text-lg font-bold">{format(d, "d")}</span>
              </button>
              <div className="grid gap-1.5">
                {byDay(d).map((a) => (
                  <button key={a.id} onClick={() => open(a)} className={cn("rounded-lg bg-sky-soft p-2 text-left text-xs hover:bg-accent", a.status === "cancelled" && "opacity-50 line-through", a.status === "completed" && "bg-success-soft")}>
                    <p className="font-semibold text-primary">{hhmm(a.start_time)} · {a.location}</p>
                    <p className="truncate text-muted-foreground">{shortNames(a) || "Unassigned"}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "month" && (
        <div className="overflow-hidden rounded-xl border bg-card shadow-card">
          <div className="grid grid-cols-7 bg-muted text-center text-xs font-semibold uppercase text-muted-foreground">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {eachDayOfInterval({ start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }) }).map((d) => {
              const items = byDay(d);
              return (
                <button
                  key={key(d)}
                  onClick={() => { setCursor(d); setView("day"); }}
                  className={cn("min-h-16 border-t border-l p-1.5 text-left align-top hover:bg-accent/40 sm:min-h-24", !isSameMonth(d, cursor) && "text-muted-foreground/50")}
                >
                  <span className={cn("inline-grid h-6 w-6 place-items-center rounded-full text-xs font-semibold", isToday(d) && "bg-primary text-primary-foreground")}>{format(d, "d")}</span>
                  <div className="mt-1 hidden gap-1 sm:grid">
                    {items.slice(0, 2).map((a) => <p key={a.id} className="truncate rounded bg-sky-soft px-1 text-[11px] font-medium text-primary">{hhmm(a.start_time)} {a.location}</p>)}
                    {items.length > 2 && <p className="text-[11px] text-muted-foreground">+{items.length - 2} more</p>}
                  </div>
                  {items.length > 0 && <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-sky sm:hidden" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
