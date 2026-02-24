-- Bloques de agenda generada (Crear Agenda Propia): mañana/tarde por médico y fecha
CREATE TABLE IF NOT EXISTS generated_agenda_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_type_id uuid REFERENCES appointment_types(id) ON DELETE SET NULL,
  date date NOT NULL,
  period varchar(20) NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  duration_minutes numeric(3, 0) NOT NULL,
  for_web_booking boolean NOT NULL DEFAULT false,
  available_on_save boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS generated_agenda_blocks_doctor_id_idx ON generated_agenda_blocks(doctor_id);
CREATE INDEX IF NOT EXISTS generated_agenda_blocks_date_idx ON generated_agenda_blocks(date);
CREATE INDEX IF NOT EXISTS generated_agenda_blocks_doctor_date_period_idx ON generated_agenda_blocks(doctor_id, date, period);
