export type AssignmentStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

/** True once the job's finish date and time have passed (local time). */
export function isJobPast(
  a: { date: string; end_date?: string; end_time: string },
  now = new Date(),
): boolean {
  const end = new Date(`${a.end_date || a.date}T${a.end_time.slice(0, 5)}:00`);
  return end.getTime() <= now.getTime();
}

/**
 * Status as it should be shown: a job whose finish date/time has passed
 * automatically reads as Completed. Cancelled and Completed never change.
 */
export function displayStatus(
  a: { date: string; end_date?: string; end_time: string; status: AssignmentStatus },
  now = new Date(),
): AssignmentStatus {
  if (a.status === "cancelled" || a.status === "completed") return a.status;
  if (isJobPast(a, now)) return "completed";
  return a.status;
}

export type AssignmentFields = {
  date: string;
  /** Finish date for multi-day jobs; "" means the job lasts only one day. */
  end_date: string;
  start_time: string;
  end_time: string;
  location: string;
  cleaner_ids: string[];
  remark: string;
};

export function validateAssignment(fields: AssignmentFields): string[] {
  const errors: string[] = [];
  if (!fields.date) errors.push("Choose a start date.");
  if (fields.end_date && fields.date && fields.end_date < fields.date)
    errors.push("Finish date must be on or after the start date.");
  if (!fields.start_time || !fields.end_time) errors.push("Set start and finish time.");
  else if (fields.end_time <= fields.start_time) errors.push("Finish time must be after start time.");
  if (!fields.location.trim()) errors.push("Enter a location.");
  if (fields.location.length > 200) errors.push("Location is too long.");
  if (!fields.cleaner_ids.length) errors.push("Assign at least one cleaner.");
  if (fields.remark.length > 2000) errors.push("Remark is too long (max 2000 characters).");
  return errors;
}
