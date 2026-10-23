CREATE TABLE public.project_inspections (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 project_name text NOT NULL CHECK (length(trim(project_name)) BETWEEN 1 AND 200),
 inspection_date date NOT NULL,
 inspected_by text NOT NULL CHECK (inspected_by IN ('Bethelehem', 'Eshetu')),
 remark text NOT NULL DEFAULT '' CHECK (length(remark) <= 2000),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_inspections TO authenticated;
GRANT SELECT ON public.project_inspections TO anon;
GRANT ALL ON public.project_inspections TO service_role;
ALTER TABLE public.project_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage project inspections" ON public.project_inspections FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Viewers read project inspections" ON public.project_inspections FOR SELECT TO anon USING (true);