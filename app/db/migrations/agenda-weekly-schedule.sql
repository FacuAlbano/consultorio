-- Agenda semanal por médico: días y horario de trabajo
-- Ejecutar manualmente si no usás drizzle-kit push/generate

-- Columna en doctors para intervalo de turnos (minutos)
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS slot_duration_minutes numeric(3, 0);

-- Tabla agenda semanal (1 = lunes .. 7 = domingo)
CREATE TABLE IF NOT EXISTS doctor_weekly_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week varchar(10) NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS doctor_weekly_schedule_doctor_id_idx ON doctor_weekly_schedule(doctor_id);
CREATE UNIQUE INDEX IF NOT EXISTS doctor_weekly_schedule_doctor_day_unique_idx ON doctor_weekly_schedule(doctor_id, day_of_week);
