import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Mail, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/AppShell";
import { useAppointmentEditor } from "@/components/AppointmentEditor";
import { useReadOnly } from "@/lib/readonly";
import { hhmm, lastDay, spansDay, useAppointments, useCleaners, useDeleteCleaner, useSaveCleaner, type Cleaner } from "@/lib/data";

export function CleanersPage() {
  const { data: cleaners = [], isLoading } = useCleaners();
  const { data: appts = [] } = useAppointments();
  const { open } = useAppointmentEditor();
  const readOnly = useReadOnly();
  const [editing, setEditing] = useState<Partial<Cleaner> | null>(null);
  const [removing, setRemoving] = useState<Cleaner | null>(null);
  const del = useDeleteCleaner();
  const today = format(new Date(), "yyyy-MM-dd");
  const now = format(new Date(), "HH:mm");

  return (
    <>
      <PageHeader title="Cleaners" subtitle="Your team, their contacts and upcoming jobs.">
        {!readOnly && (
          <Button variant="outline" onClick={() => setEditing({})}><Plus className="mr-1 h-4 w-4" />Add cleaner</Button>
        )}
      </PageHeader>

      {!isLoading && cleaners.length === 0 && (
        <div className="rounded-xl border border-dashed bg-card p-12 text-center">
          <p className="font-display text-lg font-semibold">No cleaners yet</p>
          {!readOnly && (
            <Button className="mt-4" onClick={() => setEditing({})}>Add your first cleaner</Button>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cleaners.map((c) => {
          const mine = appts.filter((a) => a.cleaner_ids.includes(c.id) && a.status !== "cancelled" && a.status !== "completed" && lastDay(a) >= today);
          const todayJob = mine.find((a) => spansDay(a, today));
          const busyNow = mine.some((a) => spansDay(a, today) && hhmm(a.start_time) <= now && hhmm(a.end_time) > now);
          return (
            <div key={c.id} className="flex flex-col rounded-xl border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-navy font-display font-bold text-navy-foreground">{c.name.slice(0, 1).toUpperCase()}</div>
                  <div>
                    <p className="font-display font-semibold">{c.name}</p>
                    <span className={busyNow ? "text-xs font-semibold text-warning" : todayJob ? "text-xs font-semibold text-primary" : "text-xs font-semibold text-success"}>
                      {busyNow ? "On a job now" : todayJob ? `Assigned today at ${hhmm(todayJob.start_time)}` : "Available today"}
                    </span>
                  </div>
                </div>
                {!readOnly && (
                  <div className="flex">
                    <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label="Remove" className="text-destructive hover:text-destructive" onClick={() => setRemoving(c)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                )}
              </div>
              <div className="mt-3 grid gap-1 text-sm text-muted-foreground">
                {c.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-2 hover:text-foreground"><Phone className="h-3.5 w-3.5" />{c.phone}</a>}
                {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-2 hover:text-foreground"><Mail className="h-3.5 w-3.5" />{c.email}</a>}
              </div>
              <div className="mt-4 border-t pt-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Upcoming ({mine.length})</p>
                {mine.length === 0 ? <p className="text-sm text-muted-foreground">No upcoming assignments.</p> : (
                  <div className="grid gap-1.5">
                    {mine.slice(0, 4).map((a) => (
                      <button key={a.id} onClick={() => open(a)} className="flex justify-between gap-2 rounded-md bg-sky-soft px-2.5 py-1.5 text-left text-xs hover:bg-accent">
                        <span className="font-semibold text-primary">{a.location}</span>
                        <span className="text-muted-foreground">
                          {lastDay(a) > a.date ? `${format(parseISO(a.date), "MMM d")}–${format(parseISO(lastDay(a)), "MMM d")}` : format(parseISO(a.date), "MMM d")} · {hhmm(a.start_time)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editing && !readOnly && <CleanerDialog initial={editing} onClose={() => setEditing(null)} />}

      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>They will be unassigned from all appointments. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!removing) return;
                try { await del.mutateAsync(removing.id); toast.success("Cleaner removed"); }
                catch (e) { toast.error((e as Error).message); }
                setRemoving(null);
              }}
            >Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CleanerDialog({ initial, onClose }: { initial: Partial<Cleaner>; onClose: () => void }) {
  const [f, setF] = useState({ name: initial.name ?? "", phone: initial.phone ?? "", email: initial.email ?? "", notes: initial.notes ?? "" });
  const [err, setErr] = useState("");
  const save = useSaveCleaner();

  async function submit() {
    if (!f.name.trim()) return setErr("Name is required.");
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) return setErr("Enter a valid email or leave it blank.");
    try {
      await save.mutateAsync({ ...f, id: initial.id });
      toast.success(initial.id ? "Cleaner updated" : "Cleaner added");
      onClose();
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial.id ? "Edit cleaner" : "Add cleaner"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5"><Label htmlFor="cn">Name</Label><Input id="cn" maxLength={100} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label htmlFor="cp">Phone</Label><Input id="cp" type="tel" maxLength={30} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label htmlFor="ce">Email</Label><Input id="ce" type="email" maxLength={255} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label htmlFor="cno">Notes</Label><Textarea id="cno" maxLength={500} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
          {err && <p className="text-sm text-destructive">{err}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={save.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
