import * as React from "react";
import { useLoaderData, useActionData, useSearchParams, Form, useNavigation } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/dashboard.agenda.editar";
import { requireAuth } from "~/lib/middleware";
import { getUserInfo } from "~/lib/user-info";
import { getAllDoctors } from "~/lib/doctors.server";
import {
  getDoctorWeeklySchedule,
  getDoctorSlotDurationMinutes,
  setDoctorWeeklySchedule,
  type DaySchedule,
} from "~/lib/doctor-agenda.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Calendar, Loader2, ArrowLeft } from "lucide-react";
import { PATHS } from "~/lib/constants";
import { Link } from "react-router";

const DAY_LABELS: { day: string; label: string }[] = [
  { day: "1", label: "Lunes" },
  { day: "2", label: "Martes" },
  { day: "3", label: "Miércoles" },
  { day: "4", label: "Jueves" },
  { day: "5", label: "Viernes" },
  { day: "6", label: "Sábado" },
  { day: "7", label: "Domingo" },
];

export async function loader({ request }: Route.LoaderArgs) {
  const { tokenType } = await requireAuth(request);
  const userInfo = getUserInfo(tokenType);
  const url = new URL(request.url);
  const doctorId = url.searchParams.get("doctorId") || "";
  const doctors = await getAllDoctors({ limit: 100 });
  let schedule: DaySchedule[] = [];
  let slotDurationMinutes = 15;
  if (doctorId) {
    const [sched, slot] = await Promise.all([
      getDoctorWeeklySchedule(doctorId),
      getDoctorSlotDurationMinutes(doctorId),
    ]);
    schedule = sched;
    slotDurationMinutes = slot;
  }
  return {
    userInfo,
    doctors,
    doctorId,
    schedule,
    slotDurationMinutes,
  };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const formData = await request.formData();
  const doctorId = formData.get("doctorId") as string;
  const slotDurationMinutes = parseInt(String(formData.get("slotDurationMinutes") || "15"), 10);
  if (!doctorId) {
    return { success: false as const, error: "Seleccione un médico" };
  }
  const schedules: DaySchedule[] = [];
  for (const { day } of DAY_LABELS) {
    const enabled = formData.get(`day_${day}`) === "1";
    if (!enabled) continue;
    const start = (formData.get(`start_${day}`) as string)?.trim() || "08:00";
    const end = (formData.get(`end_${day}`) as string)?.trim() || "17:00";
    schedules.push({ dayOfWeek: day, startTime: start.slice(0, 5), endTime: end.slice(0, 5) });
  }
  const result = await setDoctorWeeklySchedule(doctorId, schedules, slotDurationMinutes);
  if (!result.success) return { success: false, error: result.error };
  return { success: true as const };
}

export default function EditarAgenda() {
  const { doctors, doctorId, schedule, slotDurationMinutes } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentDoctorId, setCurrentDoctorId] = React.useState((doctorId || doctors[0]?.id) ?? "");
  const isSubmitting = navigation.state === "submitting";
  React.useEffect(() => {
    setCurrentDoctorId((doctorId || doctors[0]?.id) ?? "");
  }, [doctorId, doctors]);

  React.useEffect(() => {
    if (actionData?.success) toast.success("Agenda guardada correctamente");
    else if (actionData?.success === false && actionData?.error) toast.error(actionData.error);
  }, [actionData]);

  const scheduleByDay = React.useMemo(() => {
    const map = new Map<string, DaySchedule>();
    for (const s of schedule) map.set(s.dayOfWeek, s);
    return map;
  }, [schedule]);

  const handleDoctorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setCurrentDoctorId(id);
    const params = new URLSearchParams(searchParams);
    if (id) params.set("doctorId", id);
    else params.delete("doctorId");
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          to={PATHS.agenda}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Agenda
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="h-7 w-7" />
          Editar agenda
        </h1>
        <p className="text-muted-foreground mt-1">
          Defina qué días trabaja y el horario de cada día. Los turnos se ofrecerán según el intervalo elegido.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Horario semanal</CardTitle>
          <p className="text-muted-foreground text-sm">
            Marque los días que trabaja e indique hora de inicio y fin. Puede haber más de un turno en el mismo horario.
          </p>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-6" key={currentDoctorId || "none"}>
            <input type="hidden" name="doctorId" value={currentDoctorId} />
            <div className="space-y-2">
              <Label htmlFor="doctorId">Médico</Label>
              <select
                id="doctorId"
                className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={currentDoctorId}
                onChange={handleDoctorChange}
                disabled={navigation.state !== "idle"}
              >
                <option value="">Seleccionar médico</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.firstName} {d.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slotDurationMinutes">Turnos cada (minutos)</Label>
              <select
                id="slotDurationMinutes"
                name="slotDurationMinutes"
                defaultValue={slotDurationMinutes}
                className="flex h-9 w-full max-w-[200px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                {[5, 10, 15, 20, 30, 60].map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </select>
            </div>

            <div className="border rounded-lg divide-y overflow-hidden">
              {DAY_LABELS.map(({ day, label }) => {
                const s = scheduleByDay.get(day);
                const enabled = !!s;
                return (
                  <div key={day} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 items-center bg-card">
                    <div className="sm:col-span-3 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`day_${day}`}
                        name={`day_${day}`}
                        value="1"
                        defaultChecked={enabled}
                        className="rounded border-input"
                      />
                      <Label htmlFor={`day_${day}`} className="font-medium">
                        {label}
                      </Label>
                    </div>
                    <div className="sm:col-span-4 flex gap-2 items-center">
                      <Label htmlFor={`start_${day}`} className="text-muted-foreground text-xs shrink-0">
                        Inicio
                      </Label>
                      <Input
                        id={`start_${day}`}
                        name={`start_${day}`}
                        type="time"
                        defaultValue={s?.startTime?.slice(0, 5) || "08:00"}
                        className="h-9"
                      />
                    </div>
                    <div className="sm:col-span-4 flex gap-2 items-center">
                      <Label htmlFor={`end_${day}`} className="text-muted-foreground text-xs shrink-0">
                        Fin
                      </Label>
                      <Input
                        id={`end_${day}`}
                        name={`end_${day}`}
                        type="time"
                        defaultValue={s?.endTime?.slice(0, 5) || "17:00"}
                        className="h-9"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={!currentDoctorId || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar agenda"
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to={PATHS.agenda}>Cancelar</Link>
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
