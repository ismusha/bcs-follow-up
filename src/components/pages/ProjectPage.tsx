import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ClipboardCheck, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useReadOnly } from "@/lib/readonly";
import { INSPECTORS, inspectionSchema, type Inspection, type InspectionInput } from "@/lib/project-inspection";
import { inspectionQuery } from "@/lib/inspection-data";

export function ProjectPage() {
  const { data: records } = useSuspenseQuery(inspectionQuery);
  const readOnly = useReadOnly();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Partial<Inspection> | null>(null);
  const [removing, setRemoving] = useState<Inspection | null>(null);
  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (readOnly) throw new Error("View only.");
      const { error } = await supabase.from("project_inspections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: inspectionQuery.queryKey }); setRemoving(null); toast.success("Inspection removed"); },
    onError: (error) => toast.error(error.message),
  });
  const filtered = records.filter((record) => `${record.project_name} ${record.inspected_by} ${record.remark}`.toLowerCase().includes(search.toLowerCase()));
  return <>
    <PageHeader title="Project" subtitle="Project inspections">
      {!readOnly && <Button onClick={() => setEditing({})}><Plus className="mr-1 h-4 w-4" />New inspection</Button>}
    </PageHeader>
    <div className="relative mb-6 max-w-md"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search inspections" placeholder="Search inspections" className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
    {filtered.length === 0 ? <div className="border-t py-16 text-center"><ClipboardCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-display font-semibold">{records.length ? "No matching inspections" : "No inspections yet"}</p></div> :
      <div className="grid gap-4 md:grid-cols-2">{filtered.map((record) => <article key={record.id} className="rounded-lg border bg-card p-5 shadow-card">
        <div className="flex items-start justify-between gap-3"><h2 className="break-words font-display text-lg font-semibold">{record.project_name}</h2>{!readOnly && <div className="flex shrink-0"><Button variant="ghost" size="icon" aria-label={`Edit ${record.project_name}`} onClick={() => setEditing(record)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-destructive" aria-label={`Remove ${record.project_name}`} onClick={() => setRemoving(record)}><Trash2 className="h-4 w-4" /></Button></div>}</div>
        <dl className="mt-3 grid gap-2 text-sm"><div><dt className="text-muted-foreground">Date of inspection</dt><dd>{format(parseISO(record.inspection_date), "MMMM d, yyyy")}</dd></div><div><dt className="text-muted-foreground">Inspected by</dt><dd>{record.inspected_by}</dd></div><div><dt className="text-muted-foreground">Remark</dt><dd className="whitespace-pre-wrap break-words">{record.remark || "—"}</dd></div></dl>
      </article>)}</div>}
    {!readOnly && editing && <InspectionDialog initial={editing} onClose={() => setEditing(null)} />}
    {!readOnly && <AlertDialog open={Boolean(removing)} onOpenChange={(open) => { if (!open) setRemoving(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remove this inspection?</AlertDialogTitle><AlertDialogDescription>{removing?.project_name} will be removed permanently.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction disabled={remove.isPending} onClick={(event) => { event.preventDefault(); if (removing) remove.mutate(removing.id); }}>Remove</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
  </>;
}

function InspectionDialog({ initial, onClose }: { initial: Partial<Inspection>; onClose: () => void }) {
  const qc = useQueryClient();
  const [fields, setFields] = useState({ project_name: initial.project_name ?? "", inspection_date: initial.inspection_date ?? "", inspected_by: initial.inspected_by ?? "", remark: initial.remark ?? "" });
  const [error, setError] = useState("");
  const save = useMutation({
    mutationFn: async (input: InspectionInput) => {
      const row = inspectionSchema.parse(input);
      const result = initial.id ? await supabase.from("project_inspections").update(row).eq("id", initial.id) : await supabase.from("project_inspections").insert(row);
      if (result.error) throw result.error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: inspectionQuery.queryKey }); toast.success("Inspection saved"); onClose(); },
    onError: (error) => setError(error.message),
  });
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>{initial.id ? "Edit project inspection" : "Project inspection"}</DialogTitle></DialogHeader>
    <form onSubmit={(event) => { event.preventDefault(); const result = inspectionSchema.safeParse(fields); if (!result.success) { setError(result.error.issues[0]?.message ?? "Check the fields."); return; } setError(""); save.mutate(result.data); }}>
      <div className="grid gap-4"><div className="grid gap-1.5"><Label htmlFor="project-name">Project name</Label><Input id="project-name" maxLength={200} value={fields.project_name} onChange={(e) => setFields({ ...fields, project_name: e.target.value })} /></div>
      <div className="grid gap-1.5"><Label htmlFor="inspection-date">Date of inspection</Label><Input id="inspection-date" type="date" value={fields.inspection_date} onChange={(e) => setFields({ ...fields, inspection_date: e.target.value })} /></div>
      <div className="grid gap-1.5"><Label htmlFor="inspection-inspector">Inspected by</Label><Select value={fields.inspected_by} onValueChange={(value) => setFields({ ...fields, inspected_by: value })}><SelectTrigger id="inspection-inspector"><SelectValue placeholder="Choose inspector" /></SelectTrigger><SelectContent>{INSPECTORS.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent></Select></div>
      <div className="grid gap-1.5"><Label htmlFor="inspection-remark">Remark</Label><Textarea id="inspection-remark" maxLength={2000} value={fields.remark} onChange={(e) => setFields({ ...fields, remark: e.target.value })} /></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}</div>
      <DialogFooter className="mt-5"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save inspection"}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}