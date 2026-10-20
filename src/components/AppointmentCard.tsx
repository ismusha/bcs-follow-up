import { Clock, MapPin, Users } from "lucide-react";
import { format, parseISO } from "date-fns";
import { hhmm, lastDay, type Appointment, type Cleaner } from "@/lib/data";
import { StatusBadge } from "@/components/StatusBadge";
import { useAppointmentEditor } from "@/components/AppointmentEditor";

export function AppointmentCard({ a, cleaners, showDate }: { a: Appointment; cleaners: Cleaner[]; showDate?: boolean | undefined }) {
  const { open } = useAppointmentEditor();
  const names = a.cleaner_ids.map((id) => cleaners.find((c) => c.id === id)?.name).filter(Boolean).join(", ");
  const multiDay = lastDay(a) > a.date;
  const dateLabel = multiDay
    ? `${format(parseISO(a.date), "MMM d")} – ${format(parseISO(lastDay(a)), "MMM d")}`
    : format(parseISO(a.date), "EEE, MMM d");
  return (
    <button onClick={() => open(a)} className="w-full rounded-xl border bg-card p-4 text-left shadow-card transition hover:border-sky">
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-1.5 font-display font-semibold"><MapPin className="h-4 w-4 text-sky" />{a.location}</p>
        <StatusBadge status={a.status} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{(showDate || multiDay) && `${dateLabel} · `}{hhmm(a.start_time)}–{hhmm(a.end_time)}</span>
        <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{names || "Unassigned"}</span>
      </div>
      {a.remark && <p className="mt-2 line-clamp-2 text-sm">{a.remark}</p>}
    </button>
  );
}
