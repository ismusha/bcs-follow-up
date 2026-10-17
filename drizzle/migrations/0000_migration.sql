CREATE TYPE public.appointment_status AS ENUM ('scheduled','in_progress','completed','cancelled');

CREATE TABLE public.cleaners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  location text NOT NULL,
  remark text NOT NULL DEFAULT '',
  tasks text[] NOT NULL DEFAULT '{}',
  status public.appointment_status NOT NULL DEFAULT 'scheduled',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.appointment_cleaners (
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  cleaner_id uuid NOT NULL REFERENCES public.cleaners(id) ON DELETE CASCADE,
  PRIMARY KEY (appointment_id, cleaner_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cleaners, public.locations, public.appointments, public.appointment_cleaners TO authenticated;
GRANT ALL ON public.cleaners, public.locations, public.appointments, public.appointment_cleaners TO service_role;

ALTER TABLE public.cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_cleaners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage cleaners" ON public.cleaners FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff manage locations" ON public.locations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff manage appointments" ON public.appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff manage assignments" ON public.appointment_cleaners FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.validate_appointment() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.end_time <= NEW.start_time THEN RAISE EXCEPTION 'End time must be after start time'; END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER appointments_validate BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.validate_appointment();

CREATE OR REPLACE FUNCTION public.prevent_double_booking() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE a public.appointments; clash text;
BEGIN
  SELECT * INTO a FROM public.appointments WHERE id = NEW.appointment_id;
  IF a.status = 'cancelled' THEN RETURN NEW; END IF;
  SELECT o.location INTO clash FROM public.appointment_cleaners ac
    JOIN public.appointments o ON o.id = ac.appointment_id
    WHERE ac.cleaner_id = NEW.cleaner_id AND o.id <> a.id AND o.date = a.date
      AND o.status <> 'cancelled' AND o.start_time < a.end_time AND o.end_time > a.start_time
    LIMIT 1;
  IF clash IS NOT NULL THEN
    RAISE EXCEPTION 'Cleaner is already booked at % during this time', clash;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER appointment_cleaners_no_overlap BEFORE INSERT OR UPDATE ON public.appointment_cleaners FOR EACH ROW EXECUTE FUNCTION public.prevent_double_booking();

INSERT INTO public.cleaners (id, name, phone, email) VALUES
 ('11111111-0000-0000-0000-000000000001','Wabi','+251 911 234 567','wabi@bethelehem.et'),
 ('11111111-0000-0000-0000-000000000002','Zelalem','+251 912 345 678','zelalem@bethelehem.et'),
 ('11111111-0000-0000-0000-000000000003','Hanna','+251 913 456 789',NULL),
 ('11111111-0000-0000-0000-000000000004','Dawit','+251 914 567 890',NULL),
 ('11111111-0000-0000-0000-000000000005','Meron','+251 915 678 901',NULL);

INSERT INTO public.locations (name, address) VALUES
 ('ECA','UN Conference Centre, Menelik II Ave'),
 ('Bole Office Tower','Bole Road, Addis Ababa'),
 ('Sheraton Addis','Taitu St'),
 ('Kazanchis Residence','Kazanchis, Addis Ababa');

INSERT INTO public.appointments (id, date, start_time, end_time, location, remark, tasks, status) VALUES
 ('22222222-0000-0000-0000-000000000001','2026-10-16','08:00','12:00','ECA','Clean all conference rooms on floor 2, mop corridors and empty bins.','{"Office cleaning","Floor cleaning"}','completed'),
 ('22222222-0000-0000-0000-000000000002','2026-10-17','09:00','13:00','Bole Office Tower','Window cleaning on floors 3-5, inside only.','{"Window cleaning"}','in_progress'),
 ('22222222-0000-0000-0000-000000000003','2026-10-17','14:00','17:00','Kazanchis Residence','Deep clean kitchen and two bathrooms. Customer asks for eco products.','{"Deep cleaning","Special request"}','scheduled'),
 ('22222222-0000-0000-0000-000000000004','2026-10-19','08:00','11:00','ECA','Weekly office cleaning, reception and lounge.','{"Office cleaning"}','scheduled'),
 ('22222222-0000-0000-0000-000000000005','2026-10-21','10:00','15:00','Sheraton Addis','Floor polishing in the ballroom before event.','{"Floor cleaning","Deep cleaning"}','scheduled'),
 ('22222222-0000-0000-0000-000000000006','2026-10-24','09:00','12:00','Bole Office Tower','Monthly carpet shampoo.','{"Floor cleaning"}','scheduled');

INSERT INTO public.appointment_cleaners VALUES
 ('22222222-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001'),
 ('22222222-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000002'),
 ('22222222-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000003'),
 ('22222222-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000004'),
 ('22222222-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000001'),
 ('22222222-0000-0000-0000-000000000004','11111111-0000-0000-0000-000000000001'),
 ('22222222-0000-0000-0000-000000000004','11111111-0000-0000-0000-000000000002'),
 ('22222222-0000-0000-0000-000000000005','11111111-0000-0000-0000-000000000005'),
 ('22222222-0000-0000-0000-000000000005','11111111-0000-0000-0000-000000000003'),
 ('22222222-0000-0000-0000-000000000006','11111111-0000-0000-0000-000000000004');