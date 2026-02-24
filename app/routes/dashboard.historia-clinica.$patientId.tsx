import * as React from "react";
import { useLoaderData, Link, useFetcher, useNavigate } from "react-router";
import type { Route } from "./+types/dashboard.historia-clinica.$patientId";
import { requireAuth } from "~/lib/middleware";
import { getPatientById } from "~/lib/patients.server";
import { getConsultationsByPatientId } from "~/lib/medical-records.server";
import { getAllDoctors } from "~/lib/doctors.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ResponsiveDialog } from "~/components/crud/responsive-dialog";
import { ArrowLeft, FileText, Plus, Stethoscope, Calendar, Loader2, FileDown } from "lucide-react";
import { PATHS } from "~/lib/constants";
import { formatDate } from "~/lib/utils";
import { isValidUUID } from "~/lib/utils";

const CREATE_INTENT = "create";

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireAuth(request);
  const { patientId } = params;
  if (!patientId || !isValidUUID(patientId)) {
    throw new Response("Paciente no encontrado", { status: 404 });
  }

  const [patient, consultationsList, doctors] = await Promise.all([
    getPatientById(patientId),
    getConsultationsByPatientId({ patientId, limit: 100 }),
    getAllDoctors({ limit: 100 }),
  ]);

  if (!patient) throw new Response("Paciente no encontrado", { status: 404 });

  return { patient, consultations: consultationsList, doctors };
}

export default function HistoriaClinicaPaciente() {
  const loaderData = useLoaderData<typeof loader>();
  const [nuevaConsultaOpen, setNuevaConsultaOpen] = React.useState(false);
  const fetcher = useFetcher<{ success?: boolean; createdId?: string; error?: string }>();
  const navigate = useNavigate();

  if (!loaderData?.patient) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <p className="text-muted-foreground">Paciente no encontrado o datos no disponibles.</p>
        <Button asChild variant="outline">
          <Link to={PATHS.historiaClinica}>Volver a Historia clínica</Link>
        </Button>
      </div>
    );
  }

  const { patient, consultations, doctors } = loaderData;

  React.useEffect(() => {
    if (!nuevaConsultaOpen) return;
    const data = fetcher.data;
    if (data && "createdId" in data && data.createdId) {
      setNuevaConsultaOpen(false);
      navigate(PATHS.historiaClinicaConsulta(patient.id, data.createdId));
    }
  }, [nuevaConsultaOpen, fetcher.data, patient.id, navigate]);

  const createAction = PATHS.historiaClinicaConsulta(patient.id, "nueva");
  const isSubmitting = fetcher.state === "submitting" || fetcher.state === "loading";

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Button asChild variant="ghost" size="icon" className="shrink-0" aria-label="Volver">
            <Link to={PATHS.historiaClinica}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-muted-foreground text-sm">
              HC: {patient.medicalRecordNumber ?? "—"} · DNI: {patient.documentNumber}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button asChild variant="outline" className="gap-2">
            <Link to={PATHS.historiaClinicaPacientePdf(patient.id)} target="_blank" rel="noopener noreferrer">
              <FileDown className="h-4 w-4" />
              Exportar a PDF
            </Link>
          </Button>
          <Button className="gap-2" onClick={() => setNuevaConsultaOpen(true)}>
            <Plus className="h-4 w-4" />
            Nueva consulta
          </Button>
        </div>
      </div>

      <ResponsiveDialog
        open={nuevaConsultaOpen}
        onOpenChange={setNuevaConsultaOpen}
        title="Nueva consulta"
        description={`${patient.firstName} ${patient.lastName}`}
      >
        <fetcher.Form method="post" action={createAction} className="space-y-4">
          <input type="hidden" name="_intent" value={CREATE_INTENT} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="consultationDate">Fecha</Label>
              <Input
                id="consultationDate"
                name="consultationDate"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doctorId">Médico</Label>
              <select id="doctorId" name="doctorId">
                <option value="">—</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo de consulta</Label>
            <Input id="reason" name="reason" placeholder="Opcional" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[80px]"
              placeholder="Notas del profesional"
            />
          </div>
          {fetcher.data && "error" in fetcher.data && fetcher.data.error && (
            <p className="text-sm text-destructive">{fetcher.data.error}</p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setNuevaConsultaOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creando...</>
              ) : (
                "Crear consulta"
              )}
            </Button>
          </div>
        </fetcher.Form>
      </ResponsiveDialog>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Historial de consultas
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            {consultations.length} consulta{consultations.length !== 1 ? "s" : ""} registrada{consultations.length !== 1 ? "s" : ""}
          </p>
        </CardHeader>
        <CardContent>
          {consultations.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Stethoscope className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay consultas cargadas.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setNuevaConsultaOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva consulta
              </Button>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-medium">Fecha</th>
                      <th className="text-left py-3 px-2 font-medium">Médico</th>
                      <th className="text-left py-3 px-2 font-medium">Motivo</th>
                      <th className="text-right py-3 px-2 font-medium w-28">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consultations.map(({ consultation, doctor }) => (
                      <tr
                        key={consultation.id}
                        role="button"
                        tabIndex={0}
                        className="border-b border-border/50 hover:bg-muted/30 cursor-pointer"
                        onClick={() => navigate(PATHS.historiaClinicaConsulta(patient.id, consultation.id))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            navigate(PATHS.historiaClinicaConsulta(patient.id, consultation.id));
                          }
                        }}
                      >
                        <td className="py-3 px-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(consultation.consultationDate)}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          {doctor ? `${doctor.firstName} ${doctor.lastName}` : "—"}
                        </td>
                        <td className="py-3 px-2 text-muted-foreground max-w-[200px] truncate" title={consultation.reason ?? ""}>
                          {consultation.reason ?? "—"}
                        </td>
                        <td className="py-3 px-2 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button asChild variant="outline" size="sm">
                            <Link to={PATHS.historiaClinicaConsulta(patient.id, consultation.id)}>
                              Ver
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden space-y-3">
                {consultations.map(({ consultation, doctor }) => (
                  <Link
                    key={consultation.id}
                    to={PATHS.historiaClinicaConsulta(patient.id, consultation.id)}
                    className="block rounded-lg border p-4 flex flex-col gap-2 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDate(consultation.consultationDate)}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {doctor ? `${doctor.firstName} ${doctor.lastName}` : "Sin médico"}
                    </div>
                    {consultation.reason && (
                      <p className="text-sm line-clamp-2">{consultation.reason}</p>
                    )}
                    <span className="text-sm text-primary font-medium">Ver consulta</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
