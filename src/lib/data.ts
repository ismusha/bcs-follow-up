import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Status = "scheduled" | "in_progress" | "completed" | "cancelled";
export const STATUSES: { value: Status; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];
export const TASK_OPTIONS = [
  "Office cleaning",
  "Floor cleaning",
  "Window cleaning",
  "Deep cleaning",
  "Special request",
];

export type Cleaner = { id: string; name: string; phone: string | null; email: string | null; notes: string | null };
export type Location = { id: string; name: string; address: string | null };
export type Appointment = {
  id: string;
  date: string;
  /** Last day of the job; equals `date` for single-day jobs. */
  end_date: string;
  start_time: string;
  end_time: string;
  location: string;
  remark: string;
  tasks: string[];
  status: Status;
  cleaner_ids: string[];
};
export type AppointmentInput = Omit<Appointment, "id"> & { id?: string };

export const hhmm = (t: string) => t.slice(0, 5);
/** Last day of an appointment (end_date falls back to date). */
export const lastDay = (a: { date: string; end_date?: string }) => a.end_date || a.date;
/** True when the appointment spans the given day (yyyy-MM-dd). */
export const spansDay = (a: { date: string; end_date?: string }, day: string) => a.date <= day && lastDay(a) >= day;

export function useCleaners() {
  return useQuery({
    queryKey: ["cleaners"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cleaners").select("*").order("name");
      if (error) throw error;
      return data as Cleaner[];
    },
  });
}

export function useLocations() {
  return useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("locations").select("*").order("name");
      if (error) throw error;
      return data as Location[];
    },
  });
}

export function useAppointments() {
  return useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, appointment_cleaners(cleaner_id)")
        .order("date")
        .order("start_time");
      if (error) throw error;
      return data.map((a) => ({
        id: a.id,
        date: a.date,
        end_date: a.end_date,
        start_time: a.start_time,
        end_time: a.end_time,
        location: a.location,
        remark: a.remark,
        tasks: a.tasks,
        status: a.status,
        cleaner_ids: (a.appointment_cleaners ?? []).map((c) => c.cleaner_id),
      })) as Appointment[];
    },
  });
}

/** Returns the conflicting appointment for a cleaner, if any. */
export function findConflicts(all: Appointment[], draft: AppointmentInput) {
  if (draft.status === "cancelled") return [];
  const draftEnd = draft.end_date || draft.date;
  const out: { cleanerId: string; appt: Appointment }[] = [];
  for (const cid of draft.cleaner_ids) {
    const clash = all.find(
      (o) =>
        o.id !== draft.id &&
        o.status !== "cancelled" &&
        o.date <= draftEnd &&
        lastDay(o) >= draft.date &&
        o.cleaner_ids.includes(cid) &&
        hhmm(o.start_time) < hhmm(draft.end_time) &&
        hhmm(o.end_time) > hhmm(draft.start_time),
    );
    if (clash) out.push({ cleanerId: cid, appt: clash });
  }
  return out;
}

export function useSaveAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AppointmentInput) => {
      const row = {
        date: input.date,
        end_date: input.end_date || input.date,
        start_time: input.start_time,
        end_time: input.end_time,
        location: input.location.trim(),
        remark: input.remark.trim(),
        tasks: input.tasks,
        status: input.status,
      };
      let id = input.id;
      if (id) {
        const { error } = await supabase.from("appointments").update(row).eq("id", id);
        if (error) throw error;
        const { error: e2 } = await supabase.from("appointment_cleaners").delete().eq("appointment_id", id);
        if (e2) throw e2;
      } else {
        const { data, error } = await supabase.from("appointments").insert(row).select("id").single();
        if (error) throw error;
        id = data.id;
      }
      if (input.cleaner_ids.length) {
        const { error } = await supabase
          .from("appointment_cleaners")
          .insert(input.cleaner_ids.map((cleaner_id) => ({ appointment_id: id!, cleaner_id })));
        if (error) throw error;
      }
      // remember new locations
      await supabase.from("locations").upsert({ name: row.location }, { onConflict: "name", ignoreDuplicates: true });
      return id;
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function useSaveCleaner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: { id?: string | undefined; name: string; phone?: string | null; email?: string | null; notes?: string | null }) => {
      const row = { name: c.name.trim(), phone: c.phone || null, email: c.email || null, notes: c.notes || null };
      const { error } = c.id
        ? await supabase.from("cleaners").update(row).eq("id", c.id)
        : await supabase.from("cleaners").insert(row);
      if (error) throw error;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["cleaners"] }),
  });
}

export function useDeleteCleaner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cleaners").delete().eq("id", id);
      if (error) throw error;
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["cleaners"] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}
