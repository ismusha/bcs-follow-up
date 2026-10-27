CREATE TABLE public.monthly_company_payments (
  company_name text NOT NULL,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  year integer NOT NULL,
  is_paid boolean NOT NULL DEFAULT false,
  PRIMARY KEY (company_name, month, year)
);

GRANT SELECT ON public.monthly_company_payments TO anon;
GRANT SELECT, INSERT, UPDATE ON public.monthly_company_payments TO authenticated;
GRANT ALL ON public.monthly_company_payments TO service_role;

ALTER TABLE public.monthly_company_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read monthly company payments"
  ON public.monthly_company_payments FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Staff add monthly company payments"
  ON public.monthly_company_payments FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff update monthly company payments"
  ON public.monthly_company_payments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'staff'))
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'staff'));
