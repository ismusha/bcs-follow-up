import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { inspectionSchema, type Inspection } from "@/lib/project-inspection";

export const inspectionQuery = queryOptions({
  queryKey: ["project-inspections"],
  queryFn: async (): Promise<Inspection[]> => {
    const { data, error } = await supabase.from("project_inspections").select("*").order("inspection_date", { ascending: false }).order("created_at", { ascending: false });
    if (error) throw error;
    return data.map((row) => ({ ...row, ...inspectionSchema.parse(row) }));
  },
});