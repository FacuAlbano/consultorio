import * as React from "react";
import { useLoaderData, useActionData, Form, useNavigation, Link } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/dashboard.agenda.crear";
import { requireAuth } from "~/lib/middleware";
import { getUserInfo } from "~/lib/user-info";
import { getAllDoctors } from "~/lib/doctors.server";
import { getAllAppointmentTypes } from "~/lib/appointment-types.server";
import { generateAgendaBlocks } from "~/lib/generated-agenda.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Calendar, Loader2, ArrowLeft } from "lucide-react";
import { PATHS } from "~/lib/constants";

const DAYS_OPTIONS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
];

export async function loader({ request }: Route.LoaderArgs) {
  const { tokenType } = await requireAuth(request);
  const userInfo = getUserInfo(tokenType);
  const [doctors, appointmentTypes] = await Promise.all([
    getAllDoctors({ limit: 200 }),
    getAllAppointmentTypes({ limit: 100 }),
  ]);
  const specialties = [...new Set(doctors.map((d) => d.specialty).filter(Boolean))] as string[];
  specialties.sort();
  return { userInfo, doctors, appointmentTypes, specialties };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const formData = await request.formData();
  const doctorId = formData.get("doctorId") as string;
  const appointmentTypeId = (formData.get("appointmentTypeId") as string) || null;
  const dateFrom = formData.get("dateFrom") as string;
  const dateTo = formData.get("dateTo") as string;
  const daysOfWeekStr = (formData.get("daysOfWeek") as string) || "";
  const daysOfWeek = daysOfWeekStr ? daysOfWeekStr.split(",").map(Number).filter((n) => n >= 1 && n <= 7) : [];

  const morningFrom = (formData.get("morningFrom") as string)?.trim() || "";
  const morningTo = (formData.get("morningTo") as string)?.trim() || "";
  const morningDuration = parseInt(String(formData.get("morningDuration") || "15"), 10);
  const morningWeb = formData.get("morningForWeb") === "1";
  const morningOnSave = formData.getAll("morningAvailableOnSave").includes("1");

  const afternoonFrom = (formData.get("afternoonFrom") as string)?.trim() || "";
  const afternoonTo = (formData.get("afternoonTo") as string)?.trim() || "";
  const afternoonDuration = parseInt(String(formData.get("afternoonDuration") || "15"), 10);
  const afternoonWeb = formData.get("afternoonForWeb") === "1";
  const afternoonOnSave = formData.getAll("afternoonAvailableOnSave").includes("1");

  const morning = morningFrom && morningTo ? { startTime: morningFrom, endTime: morningTo, durationMinutes: morningDuration, forWebBooking: morningWeb, availableOnSave: morningOnSave } : null;
  const afternoon = afternoonFrom && afternoonTo ? { startTime: afternoonFrom, endTime: afternoonTo, durationMinutes: afternoonDuration, forWebBooking: afternoonWeb, availableOnSave: afternoonOnSave } : null;

  const result = await generateAgendaBlocks({
    doctorId,
    appointmentTypeId: appointmentTypeId || undefined,
    dateFrom,
    dateTo,
    daysOfWeek,
    morning,
    afternoon,
  });

  if (!result.success) return { success: false as const, error: result.error, count: 0 };
  return { success: true as const, count: result.count };
}

export default function CrearAgendaPropia() {
  const { doctors, appointmentTypes, specialties } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [selectedDays, setSelectedDays] = React.useState<number[]>([]);
  const isSubmitting = navigation.state === "submitting";

  React.useEffect(() => {
    if (actionData?.success) {
      toast.success(`Agenda creada correctamente. ${actionData.count} bloque(s) generado(s).`);
    } else if (actionData?.success === false && actionData?.error) {
      toast.error(actionData.error);
    }
  }, [actionData]);

  const toggleDay = (d: number) => {
    setSelectedDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link to={PATHS.agenda} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Volver a Agenda de Turnos
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="h-7 w-7" />
          Crear Agenda Propia
        </h1>
        <p className="text-muted-foreground mt-1">
          Genere bloques de disponibilidad por rango de fechas, días de la semana y horarios de mañana/tarde.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Parámetros de la agenda</CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="agendaType">¿Tipo de Prácticas?</Label>
              <select
                id="agendaType"
                name="appointmentTypeId"
                className="flex h-9 w-full max-w-md rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="">Seleccione tipo de agenda...</option>
                {appointmentTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doctorId">Médico *</Label>
                <select
                  id="doctorId"
                  name="doctorId"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="">Seleccionar médico...</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.firstName} {d.lastName}{d.specialty ? ` — ${d.specialty}` : ""}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialty">Especialidad (filtro)</Label>
                <select
                  id="specialty"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  onChange={(e) => {
                    const s = e.target.value;
                    if (!s) return;
                    const doc = doctors.find((d) => d.specialty === s);
                    if (doc) (document.getElementById("doctorId") as HTMLSelectElement).value = doc.id;
                  }}
                >
                  <option value="">Todas</option>
                  {specialties.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">Fecha Desde *</Label>
                <Input id="dateFrom" name="dateFrom" type="date" required className="h-9 w-full" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">Fecha Hasta *</Label>
                <Input id="dateTo" name="dateTo" type="date" required className="h-9 w-full" />
              </div>
            </div>

            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-sm text-amber-800 dark:text-amber-200">
              Utilice el Día de la Semana solo si quisiera generar algún día de la semana en particular del rango de fechas ingresado.
            </div>

            <div className="space-y-2">
              <Label>Día de la Semana</Label>
              <input type="hidden" name="daysOfWeek" value={selectedDays.join(",")} />
              <div className="flex flex-wrap gap-2">
                {DAYS_OPTIONS.map(({ value, label }) => (
                  <label key={value} className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDays.includes(value)}
                      onChange={() => toggleDay(value)}
                      className="rounded border-input"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Días de la semana a generar. Si no marca ninguno, se generan todos los días del rango.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 border-t pt-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Mañana</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="morningFrom">Desde</Label>
                    <Input id="morningFrom" name="morningFrom" type="time" className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="morningTo">Hasta</Label>
                    <Input id="morningTo" name="morningTo" type="time" className="h-9" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="morningDuration">Duración (min)</Label>
                  <Input id="morningDuration" name="morningDuration" type="number" min={5} max={120} defaultValue={15} className="h-9 w-24" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="morningForWeb" value="1" className="rounded border-input" />
                    <span className="text-sm">¿Disponibles para Reserva WEB?</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="hidden" name="morningAvailableOnSave" value="0" />
                    <input type="checkbox" name="morningAvailableOnSave" value="1" defaultChecked className="rounded border-input" />
                    <span className="text-sm">¿Disponibles al guardar la agenda?</span>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Tarde</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="afternoonFrom">Desde</Label>
                    <Input id="afternoonFrom" name="afternoonFrom" type="time" className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="afternoonTo">Hasta</Label>
                    <Input id="afternoonTo" name="afternoonTo" type="time" className="h-9" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="afternoonDuration">Duración (min)</Label>
                  <Input id="afternoonDuration" name="afternoonDuration" type="number" min={5} max={120} defaultValue={15} className="h-9 w-24" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="afternoonForWeb" value="1" className="rounded border-input" />
                    <span className="text-sm">¿Disponibles para Reserva WEB?</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="hidden" name="afternoonAvailableOnSave" value="0" />
                    <input type="checkbox" name="afternoonAvailableOnSave" value="1" defaultChecked className="rounded border-input" />
                    <span className="text-sm">¿Disponibles al guardar la agenda?</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
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
