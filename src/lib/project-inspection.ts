import { z } from "zod";

export const INSPECTORS = ["Bethelehem", "Eshetu"] as const;
export const inspectionSchema = z.object({
  project_name: z.string().trim().min(1, "Enter a project name.").max(200),
  inspection_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose an inspection date.").refine((value) => {
    const date = new Date(`${value}T12:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Choose a valid inspection date."),
  inspected_by: z.enum(INSPECTORS),
  remark: z.string().trim().max(2000),
});
export type InspectionInput = z.infer<typeof inspectionSchema>;
export type Inspection = InspectionInput & { id: string; created_at: string };