ALTER TABLE public.appointments ADD COLUMN end_date date;

UPDATE public.appointments SET end_date = date WHERE end_date IS NULL;

ALTER TABLE public.appointments ALTER COLUMN end_date SET NOT NULL;

ALTER TABLE public.appointments ADD CONSTRAINT appointments_end_date_after_start CHECK (end_date >= date);

CREATE OR REPLACE FUNCTION public.prevent_double_booking() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE a public.appointments; clash text;
BEGIN
  SELECT * INTO a FROM public.appointments WHERE id = NEW.appointment_id;
  IF a.status = 'cancelled' THEN RETURN NEW; END IF;
  SELECT o.location INTO clash FROM public.appointment_cleaners ac
    JOIN public.appointments o ON o.id = ac.appointment_id
    WHERE ac.cleaner_id = NEW.cleaner_id AND o.id <> a.id
      AND o.status <> 'cancelled'
      AND o.date <= a.end_date AND o.end_date >= a.date
      AND o.start_time < a.end_time AND o.end_time > a.start_time
    LIMIT 1;
  IF clash IS NOT NULL THEN
    RAISE EXCEPTION 'Cleaner is already booked at % during this time', clash;
  END IF;
  RETURN NEW;
END $$;

GRANT SELECT ON public.cleaners, public.locations, public.appointments, public.appointment_cleaners TO anon;

CREATE POLICY "Viewers can read cleaners" ON public.cleaners FOR SELECT TO anon USING (true);
CREATE POLICY "Viewers can read locations" ON public.locations FOR SELECT TO anon USING (true);
CREATE POLICY "Viewers can read appointments" ON public.appointments FOR SELECT TO anon USING (true);
CREATE POLICY "Viewers can read assignments" ON public.appointment_cleaners FOR SELECT TO anon USING (true);