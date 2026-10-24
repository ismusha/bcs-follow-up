CREATE TABLE public.payment_checks (
  appointment_id uuid PRIMARY KEY REFERENCES public.appointments(id) ON DELETE CASCADE,
  is_paid boolean NOT NULL DEFAULT false
);
GRANT SELECT ON public.payment_checks TO anon;
GRANT SELECT, INSERT, UPDATE ON public.payment_checks TO authenticated;
GRANT ALL ON public.payment_checks TO service_role;
ALTER TABLE public.payment_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read payment checklist" ON public.payment_checks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff add payment checks" ON public.payment_checks FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'staff'));
CREATE POLICY "Staff update payment checks" ON public.payment_checks FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'staff')) WITH CHECK (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'staff'));
