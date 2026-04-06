import * as React from "react";
import { useLoaderData, useSearchParams, Link, useFetcher, useNavigate } from "react-router";
import type { Route } from "./+types/dashboard.historia-clinica.$patientId";
import { requireAuth } from "~/lib/middleware";
import { getPatientById } from "~/lib/patients.server";
import { getConsultationsByPatientId, getConsultationById, updateConsultation } from "~/lib/medical-records.server";
import { getAllDoctors } from "~/lib/doctors.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ResponsiveDialog } from "~/components/crud/responsive-dialog";
import { ArrowLeft, FileText, Plus, Stethoscope, Calendar, Loader2, FileDown, CheckCircle, Pencil } from "lucide-react";
import { PATHS } from "~/lib/constants";
import { formatDate, calculateAge, formatPatientDisplayName } from "~/lib/utils";
import { isValidUUID } from "~/lib/utils";
import { toast } from "sonner";

const CREATE_INTENT = "create";
const UPDATE_NOTES_INTENT = "updateNotes";

export async function action({ request, params }: Route.ActionArgs) {
  await requireAuth(request);
  const { patientId } = params;
  if (!patientId || !isValidUUID(patientId)) {
    return { success: false as const, error: "Paciente inválido" };
  }

  const formData = await request.formData();
  const intent = formData.get("_intent");

  if (intent === UPDATE_NOTES_INTENT) {
    const consultationId = (formData.get("consultationId") as string) || "";
    const notes = (formData.get("notes") as string) ?? "";
    if (!consultationId || !isValidUUID(consultationId)) {
      return { success: false as const, error: "Consulta inválida" };
    }
    const existing = await getConsultationById(consultationId);
    if (!existing || existing.consultation.patientId !== patientId) {
      return { success: false as const, error: "No se pudo actualizar la nota" };
    }
    const result = await updateConsultation(consultationId, { notes: notes.trim() || null });
    if (!result.success) {
      return { success: false as const, error: result.error ?? "Error al guardar" };
    }
    return { success: true as const, consultationId };
  }

  return null;
}

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
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? undefined;
  const returnDate = searchParams.get("returnDate") ?? undefined;
  const returnView = searchParams.get("returnView") ?? undefined;
  const returnDateFrom = searchParams.get("returnDateFrom") ?? undefined;
  const returnDateTo = searchParams.get("returnDateTo") ?? undefined;
  const returnDoctorId = searchParams.get("returnDoctorId") ?? undefined;
  const returnConsultingRoomId = searchParams.get("returnConsultingRoomId") ?? undefined;
  const returnAppointmentTypeId = searchParams.get("returnAppointmentTypeId") ?? undefined;
  const returnStatus = searchParams.get("returnStatus") ?? undefined;
  const [nuevaConsultaOpen, setNuevaConsultaOpen] = React.useState(false);
  const fetcher = useFetcher<{ success?: boolean; createdId?: string; error?: string }>();
  const notesFetcher = useFetcher<{ success?: boolean; error?: string; consultationId?: string }>();
  const navigate = useNavigate();
  const [notesEdit, setNotesEdit] = React.useState<{
    consultationId: string;
    draft: string;
    mode: "inline" | "dialog";
  } | null>(null);

  const returnQuery = React.useMemo(() => {
    if (!returnDate) return "";
    const p = new URLSearchParams({ returnDate });
    if (returnTo) p.set("returnTo", returnTo);
    if (returnView) p.set("returnView", returnView);
    if (returnDateFrom) p.set("returnDateFrom", returnDateFrom);
    if (returnDateTo) p.set("returnDateTo", returnDateTo);
    if (returnDoctorId) p.set("returnDoctorId", returnDoctorId);
    if (returnConsultingRoomId) p.set("returnConsultingRoomId", returnConsultingRoomId);
    if (returnAppointmentTypeId) p.set("returnAppointmentTypeId", returnAppointmentTypeId);
    if (returnStatus) p.set("returnStatus", returnStatus);
    return `?${p.toString()}`;
  }, [returnTo, returnDate, returnView, returnDateFrom, returnDateTo, returnDoctorId, returnConsultingRoomId, returnAppointmentTypeId, returnStatus]);
  /** Si vinimos del pool, volver al pool con fecha y médico */
  const poolReturnUrl =
    returnTo === "pool" && returnDate
      ? `${PATHS.poolAtencion}?returnTo=pool&returnDate=${encodeURIComponent(returnDate)}${returnDoctorId ? `&returnDoctorId=${encodeURIComponent(returnDoctorId)}` : ""}`
      : null;
  /** Siempre tener una URL a agenda: con filtros si vinimos desde agenda, si no agenda por defecto */
  const agendaReturnUrl = returnDate
    ? PATHS.agendaReturnFilters(returnDate, returnView, {
        dateFrom: returnDateFrom,
        dateTo: returnDateTo,
        doctorId: returnDoctorId,
        consultingRoomId: returnConsultingRoomId,
        appointmentTypeId: returnAppointmentTypeId,
        status: returnStatus,
      })
    : PATHS.agenda;

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
  const notesActionPath = PATHS.historiaClinicaPaciente(patient.id);

  const notesSubmitDone = React.useRef(false);
  React.useEffect(() => {
    if (notesFetcher.state === "submitting" || notesFetcher.state === "loading") {
      notesSubmitDone.current = true;
      return;
    }
    if (notesFetcher.state !== "idle" || !notesSubmitDone.current) return;
    notesSubmitDone.current = false;
    const d = notesFetcher.data;
    if (d && "success" in d && d.success) {
      toast.success("Notas guardadas");
      setNotesEdit((prev) => (prev?.consultationId === d.consultationId ? null : prev));
    } else if (d && "error" in d && d.error) {
      toast.error(d.error);
    }
  }, [notesFetcher.state, notesFetcher.data]);

  React.useEffect(() => {
    if (!nuevaConsultaOpen) return;
    const data = fetcher.data;
    if (data && "createdId" in data && data.createdId) {
      toast.success("Consulta creada correctamente");
      setNuevaConsultaOpen(false);
      navigate(PATHS.historiaClinicaConsulta(patient.id, data.createdId) + returnQuery);
    } else if (data && data.success === false && data.error) {
      toast.error(data.error);
    }
  }, [nuevaConsultaOpen, fetcher.data, patient.id, navigate]);

  const createAction = PATHS.historiaClinicaConsulta(patient.id, "nueva");
  const isSubmitting = fetcher.state === "submitting" || fetcher.state === "loading";

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Button asChild variant="ghost" size="icon" className="shrink-0" aria-label="Volver">
            <Link to={poolReturnUrl ?? PATHS.historiaClinica}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
              {formatPatientDisplayName(patient)}
            </h1>
            <p className="text-muted-foreground text-sm">
              HC: {patient.medicalRecordNumber ?? "—"} · DNI: {patient.documentNumber}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-wrap">
          <Button asChild className="gap-2 bg-primary">
            <Link to={poolReturnUrl ?? agendaReturnUrl}>
              <CheckCircle className="h-4 w-4" />
              Terminado
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link to={PATHS.historiaClinicaPacientePdf(patient.id)} target="_blank" rel="noopener noreferrer">
              <FileDown className="h-4 w-4" />
              Exportar a PDF
            </Link>
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setNuevaConsultaOpen(true)}>
            <Plus className="h-4 w-4" />
            Nueva consulta
          </Button>
        </div>
      </div>

      {/* Datos afiliatorios del paciente */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Datos del paciente</CardTitle>
        </CardHeader>
        <CardContent className="py-2 pt-0">
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Nombre</dt>
              <dd className="font-medium">{formatPatientDisplayName(patient)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Edad</dt>
              <dd className="font-medium">{patient.birthDate ? `${calculateAge(patient.birthDate) ?? "—"} años` : "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Obra social</dt>
              <dd className="font-medium">{patient.insuranceCompany ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Nº de afiliado</dt>
              <dd className="font-medium">{patient.insuranceNumber ?? "—"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <ResponsiveDialog
        open={nuevaConsultaOpen}
        onOpenChange={setNuevaConsultaOpen}
        title="Nueva consulta"
        description={formatPatientDisplayName(patient)}
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
                      <th className="text-left py-3 px-2 font-medium w-36">Fecha</th>
                      <th className="text-left py-3 px-2 font-medium min-w-[220px]">Notas</th>
                      <th className="text-left py-3 px-2 font-medium w-44">Médico</th>
                      <th className="text-right py-3 px-2 font-medium w-28">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consultations.map(({ consultation, doctor }) => {
                      const editingInline =
                        notesEdit?.consultationId === consultation.id && notesEdit.mode === "inline";
                      return (
                        <tr key={consultation.id} className="border-b border-border/50 hover:bg-muted/30 align-top">
                          <td className="py-3 px-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                              {formatDate(consultation.consultationDate)}
                            </span>
                          </td>
                          <td className="py-3 px-2 max-w-xl">
                            {editingInline ? (
                              <notesFetcher.Form
                                method="post"
                                action={notesActionPath}
                                className="space-y-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input type="hidden" name="_intent" value={UPDATE_NOTES_INTENT} />
                                <input type="hidden" name="consultationId" value={consultation.id} />
                                <textarea
                                  name="notes"
                                  value={notesEdit.draft}
                                  onChange={(e) =>
                                    setNotesEdit((prev) =>
                                      prev && prev.consultationId === consultation.id
                                        ? { ...prev, draft: e.target.value }
                                        : prev
                                    )
                                  }
                                  rows={5}
                                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[100px] resize-y"
                                  placeholder="Notas del profesional"
                                  aria-label="Editar notas de la consulta"
                                />
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    type="submit"
                                    size="sm"
                                    disabled={notesFetcher.state !== "idle"}
                                  >
                                    {notesFetcher.state !== "idle" ? (
                                      <>
                                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                        Guardando…
                                      </>
                                    ) : (
                                      "Guardar"
                                    )}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setNotesEdit(null)}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </notesFetcher.Form>
                            ) : (
                              <button
                                type="button"
                                className="w-full text-left rounded-md border border-transparent hover:border-border hover:bg-muted/50 px-2 py-1.5 -mx-2 -my-1.5 transition-colors group"
                                onClick={() =>
                                  setNotesEdit({
                                    consultationId: consultation.id,
                                    draft: consultation.notes ?? "",
                                    mode: "inline",
                                  })
                                }
                              >
                                <span className="flex items-start gap-2">
                                  <Pencil className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5 opacity-70 group-hover:opacity-100" />
                                  <span className="line-clamp-4 whitespace-pre-wrap break-words">
                                    {consultation.notes?.trim() ? (
                                      consultation.notes
                                    ) : (
                                      <span className="text-muted-foreground italic">
                                        Sin notas — clic para escribir
                                      </span>
                                    )}
                                  </span>
                                </span>
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            {doctor ? `${doctor.firstName} ${doctor.lastName}` : "—"}
                          </td>
                          <td className="py-3 px-2 text-right">
                            <Button asChild variant="outline" size="sm">
                              <Link to={PATHS.historiaClinicaConsulta(patient.id, consultation.id) + returnQuery}>
                                Ver
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden space-y-3">
                {consultations.map(({ consultation, doctor }) => (
                  <div
                    key={consultation.id}
                    className="rounded-lg border p-4 flex flex-col gap-3 bg-card"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(consultation.consultationDate)}
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link to={PATHS.historiaClinicaConsulta(patient.id, consultation.id) + returnQuery}>
                          Ver consulta
                        </Link>
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Médico: </span>
                      {doctor ? `${doctor.firstName} ${doctor.lastName}` : "—"}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Notas</p>
                      <button
                        type="button"
                        className="w-full text-left text-sm rounded-md border border-dashed border-border hover:bg-muted/50 px-3 py-2 transition-colors"
                        onClick={() =>
                          setNotesEdit({
                            consultationId: consultation.id,
                            draft: consultation.notes ?? "",
                            mode: "dialog",
                          })
                        }
                      >
                        {consultation.notes?.trim() ? (
                          <span className="line-clamp-4 whitespace-pre-wrap break-words">{consultation.notes}</span>
                        ) : (
                          <span className="text-muted-foreground italic">Tocar para agregar o editar notas</span>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <ResponsiveDialog
                open={
                  !!notesEdit &&
                  notesEdit.mode === "dialog" &&
                  consultations.some((c) => c.consultation.id === notesEdit.consultationId)
                }
                onOpenChange={(open) => {
                  if (!open) setNotesEdit(null);
                }}
                title="Notas de la consulta"
                description={
                  notesEdit
                    ? formatDate(
                        consultations.find((c) => c.consultation.id === notesEdit.consultationId)?.consultation
                          .consultationDate ?? ""
                      )
                    : ""
                }
              >
                {notesEdit && notesEdit.mode === "dialog" && (
                  <notesFetcher.Form method="post" action={notesActionPath} className="space-y-4">
                    <input type="hidden" name="_intent" value={UPDATE_NOTES_INTENT} />
                    <input type="hidden" name="consultationId" value={notesEdit.consultationId} />
                    <textarea
                      name="notes"
                      value={notesEdit.draft}
                      onChange={(e) =>
                        setNotesEdit((prev) =>
                          prev && prev.consultationId === notesEdit.consultationId
                            ? { ...prev, draft: e.target.value }
                            : prev
                        )
                      }
                      rows={8}
                      className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[160px]"
                      placeholder="Notas del profesional"
                      aria-label="Notas"
                    />
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                      <Button type="button" variant="outline" onClick={() => setNotesEdit(null)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={notesFetcher.state !== "idle"}>
                        {notesFetcher.state !== "idle" ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Guardando…
                          </>
                        ) : (
                          "Guardar notas"
                        )}
                      </Button>
                    </div>
                  </notesFetcher.Form>
                )}
              </ResponsiveDialog>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
