export type AssignmentFields = {
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  cleaner_ids: string[];
  remark: string;
};

export function validateAssignment(fields: AssignmentFields): string[] {
  const errors: string[] = [];
  if (!fields.date) errors.push("Choose a date.");
  if (!fields.start_time || !fields.end_time) errors.push("Set start and finish time.");
  else if (fields.end_time <= fields.start_time) errors.push("Finish time must be after start time.");
  if (!fields.location.trim()) errors.push("Enter a location.");
  if (fields.location.length > 200) errors.push("Location is too long.");
  if (!fields.cleaner_ids.length) errors.push("Assign at least one cleaner.");
  if (fields.remark.length > 2000) errors.push("Remark is too long (max 2000 characters).");
  return errors;
}