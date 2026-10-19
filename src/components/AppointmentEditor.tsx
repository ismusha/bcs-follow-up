import { createContext, useContext, useState, type ReactNode } from "react";
import { format, parseISO } from "date-fns";
import { AlertTriangle, CalendarIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { validateAssignment } from "@/lib/assignment";
import {
  findConflicts, hhmm, useAppointments, useCleaners, useDeleteAppointment,
  useLocations, useSaveAppointment, type Appointment, type AppointmentInput,
} from "@/lib/data";

type Ctx = { open: (a?: Partial<Appointment>) => void; askDelete: (a: Appointment) => void };
const EditorCtx = createContext<Ctx | null>(null);
export const useAppointmentEditor = () => {
  const c = useContext(EditorCtx);
  if (!c) throw new Error("AppointmentEditorProvider missing");
  return c;
};

const blank = (): AppointmentInput => ({
  date: format(new Date(), "yyyy-MM-dd"),
  start_time: "09:00",
  end_time: "12:00",
  location: "",
  remark: "",
  tasks: [],
  status: "scheduled",
  cleaner_ids: [],
});

export function AppointmentEditorProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<AppointmentInput | null>(null);
  const [toDelete, setToDelete] = useState<Appointment | null>(null);
  const del = useDeleteAppointment();

  const open = (a?: Partial<Appointment>) =>
    setDraft({
      ...blank(),
      ...a,
      start_time: a?.start_time ? hhmm(a.start_time) : "09:00",
      end_time: a?.end_time ? hhmm(a.end_time) : "12:00",
    });

  return (
    <EditorCtx.Provider value={{ open, askDelete: setToDelete }}>
      {children}
      {draft && (
        <AppointmentDialog
          draft={draft}
          onClose={() => setDraft(null)}
          onDelete={(a) => setToDelete(a)}
        />
      )}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this cleaning assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && `${toDelete.location} on ${format(parseISO(toDelete.date), "PPP")}. `}
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!toDelete) return;
                try {
                  await del.mutateAsync(toDelete.id);
                  toast.success("Cleaning assignment deleted");
                  setDraft(null);
                } catch (e) {
                  toast.error((e as Error).message);
                }
                setToDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </EditorCtx.Provider>
  );
}

function AppointmentDialog({
  draft, onClose, onDelete,
}: { draft: AppointmentInput; onClose: () => void; onDelete: (a: Appointment) => void }) {
  const [f, setF] = useState(draft);
  const [errors, setErrors] = useState<string[]>([]);
  const { data: cleaners = [] } = useCleaners();
  const { data: locations = [] } = useLocations();
  const { data: appts = [] } = useAppointments();
  const save = useSaveAppointment();
  const set = <K extends keyof AppointmentInput>(k: K, v: AppointmentInput[K]) => setF((p) => ({ ...p, [k]: v }));
  const conflicts = findConflicts(appts, f);
  const nameOf = (id: string) => cleaners.find((c) => c.id === id)?.name ?? "Cleaner";

  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  async function submit() {
    const errs = validateAssignment(f);
    if (conflicts.length) errs.push("Resolve the scheduling conflicts below.");
    setErrors(errs);
    if (errs.length) return;
    try {
      await save.mutateAsync(f);
      toast.success(f.id ? "Cleaning assignment updated" : "Cleaning assignment created");
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{f.id ? "Edit cleaning assignment" : "Cleaning Assignment Form"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
              <Label htmlFor="assignment-date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="assignment-date" variant="outline" className="justify-start font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {f.date ? format(parseISO(f.date), "MMM d, yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={f.date ? parseISO(f.date) : undefined}
                    onSelect={(d) => d && set("date", format(d, "yyyy-MM-dd"))}
                    className="pointer-events-auto p-3"
                  />
                </PopoverContent>
              </Popover>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="loc">Location</Label>
            <Input id="loc" list="loc-list" placeholder="e.g. ECA" maxLength={200} value={f.location} onChange={(e) => set("location", e.target.value)} />
            <datalist id="loc-list">
              {locations.map((l) => <option key={l.id} value={l.name} />)}
            </datalist>
          </div>

          <fieldset className="grid gap-1.5">
            <legend className="mb-1.5 text-sm font-medium">Assigned Cleaners</legend>
            {cleaners.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cleaners yet — add them on the Cleaners page.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {cleaners.map((c) => {
                  const on = f.cleaner_ids.includes(c.id);
                  const clash = conflicts.some((x) => x.cleanerId === c.id);
                  return (
                    <Label
                      key={c.id}
                      htmlFor={`assigned-${c.id}`}
                      className="flex min-w-0 cursor-pointer items-center gap-2 rounded-md border p-3 text-sm font-medium"
                    >
                      <Checkbox
                        id={`assigned-${c.id}`}
                        checked={on}
                        aria-invalid={clash}
                        onCheckedChange={() => set("cleaner_ids", toggle(f.cleaner_ids, c.id))}
                      />
                      <span className="break-words">{c.name}</span>
                    </Label>
                  );
                })}
              </div>
            )}
            {conflicts.map((c) => (
              <p key={c.cleanerId} className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {nameOf(c.cleanerId)} is already at {c.appt.location} {hhmm(c.appt.start_time)}–{hhmm(c.appt.end_time)}.
              </p>
            ))}
          </fieldset>

          <div className="grid gap-1.5">
            <Label htmlFor="rm">Remark</Label>
            <Textarea id="rm" rows={4} maxLength={2000} placeholder="Office cleaning and floor cleaning." value={f.remark} onChange={(e) => set("remark", e.target.value)} />
          </div>

          {errors.length > 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {errors.map((e) => <p key={e}>• {e}</p>)}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {f.id ? (
            <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDelete(f as Appointment)}>
              <Trash2 className="mr-1 h-4 w-4" /> Delete
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={submit} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save assignment"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
