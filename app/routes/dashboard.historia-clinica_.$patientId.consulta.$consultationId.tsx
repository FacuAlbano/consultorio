import * as React from "react";
import { useLoaderData, useActionData, useSearchParams, useNavigate, Link, Form } from "react-router";
import type { Route } from "./+types/dashboard.historia-clinica_.$patientId.consulta.$consultationId";
import { requireAuth } from "~/lib/middleware";
import { getPatientById } from "~/lib/patients.server";
import {
  getConsultationById,
  createConsultation,
  updateConsultation,
  deleteConsultation,
  addDiagnosis,
  updateDiagnosis,
  deleteDiagnosis,
  addTreatment,
  updateTreatment,
  deleteTreatment,
  addStudy,
  updateStudy,
  deleteStudy,
} from "~/lib/medical-records.server";
import { getAllDoctors } from "~/lib/doctors.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, FileDown, Printer, CheckCircle } from "lucide-react";
import { PATHS } from "~/lib/constants";
import { formatDate, calculateAge } from "~/lib/utils";
import { isValidUUID } from "~/lib/utils";
import { toast } from "sonner";

const INTENTS = {
  create: "create",
  update: "update",
  delete: "delete",
  addDiagnosis: "addDiagnosis",
  updateDiagnosis: "updateDiagnosis",
  deleteDiagnosis: "deleteDiagnosis",
  addTreatment: "addTreatment",
  updateTreatment: "updateTreatment",
  deleteTreatment: "deleteTreatment",
  addStudy: "addStudy",
  updateStudy: "updateStudy",
  deleteStudy: "deleteStudy",
} as const;

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireAuth(request);
  const { patientId, consultationId } = params;
  if (!patientId || !isValidUUID(patientId)) throw new Response("No encontrado", { status: 404 });

  const patient = await getPatientById(patientId);
  if (!patient) throw new Response("Paciente no encontrado", { status: 404 });

  const isNew = consultationId === "nueva";
  let consultation: Awaited<ReturnType<typeof getConsultationById>> = null;
  let doctors: Awaited<ReturnType<typeof getAllDoctors>> = [];

  if (isNew) {
    doctors = await getAllDoctors({ limit: 100 });
    return { patient, consultation: null, doctors, isNew: true };
  }

  if (!isValidUUID(consultationId!)) throw new Response("Consulta no encontrada", { status: 404 });
  consultation = await getConsultationById(consultationId!);
  if (!consultation) throw new Response("Consulta no encontrada", { status: 404 });
  doctors = await getAllDoctors({ limit: 100 });

  return { patient, consultation, doctors, isNew: false };
}

export async function action({ request, params }: Route.ActionArgs) {
  await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("_intent") as string;
  const { patientId, consultationId } = params;
  if (!patientId || !isValidUUID(patientId)) return { success: false, error: "Paciente inválido", actionType: null };

  if (intent === INTENTS.create) {
    const res = await createConsultation({
      patientId,
      doctorId: (formData.get("doctorId") as string) || null,
      appointmentId: null,
      consultationDate: (formData.get("consultationDate") as string) || new Date().toISOString().slice(0, 10),
      reason: (formData.get("reason") as string) || null,
      notes: (formData.get("notes") as string) || null,
    });
    if (res.success && res.data) {
      const redirectToAgenda = formData.get("redirectToAgenda") === "1";
      const payload: {
        success: true;
        createdId: string;
        actionType: string;
        redirectToAgenda?: boolean;
        returnDate?: string | null;
        returnView?: string | null;
        returnDateFrom?: string | null;
        returnDateTo?: string | null;
        returnDoctorId?: string | null;
        returnConsultingRoomId?: string | null;
        returnAppointmentTypeId?: string | null;
        returnStatus?: string | null;
      } = { success: true, createdId: res.data.id, actionType: INTENTS.create };
      if (redirectToAgenda) {
        payload.redirectToAgenda = true;
        payload.returnDate = formData.get("returnDate") as string | null;
        payload.returnView = formData.get("returnView") as string | null;
        payload.returnDateFrom = formData.get("returnDateFrom") as string | null;
        payload.returnDateTo = formData.get("returnDateTo") as string | null;
        payload.returnDoctorId = formData.get("returnDoctorId") as string | null;
        payload.returnConsultingRoomId = formData.get("returnConsultingRoomId") as string | null;
        payload.returnAppointmentTypeId = formData.get("returnAppointmentTypeId") as string | null;
        payload.returnStatus = formData.get("returnStatus") as string | null;
      }
      return payload;
    }
    return { success: false, error: res.error, actionType: INTENTS.create };
  }

  if (intent === INTENTS.update && consultationId && consultationId !== "nueva") {
    const res = await updateConsultation(consultationId, {
      consultationDate: formData.get("consultationDate") as string,
      doctorId: (formData.get("doctorId") as string) || null,
      reason: (formData.get("reason") as string) || null,
      notes: (formData.get("notes") as string) || null,
    });
    const payload = { ...res, actionType: INTENTS.update } as {
      success: boolean;
      error?: string;
      actionType: string;
      redirectToAgenda?: boolean;
      returnDate?: string | null;
      returnView?: string | null;
      returnDateFrom?: string | null;
      returnDateTo?: string | null;
      returnDoctorId?: string | null;
      returnConsultingRoomId?: string | null;
      returnAppointmentTypeId?: string | null;
      returnStatus?: string | null;
    };
    if (res.success && formData.get("redirectToAgenda") === "1") {
      payload.redirectToAgenda = true;
      payload.returnDate = formData.get("returnDate") as string | null;
      payload.returnView = formData.get("returnView") as string | null;
      payload.returnDateFrom = formData.get("returnDateFrom") as string | null;
      payload.returnDateTo = formData.get("returnDateTo") as string | null;
      payload.returnDoctorId = formData.get("returnDoctorId") as string | null;
      payload.returnConsultingRoomId = formData.get("returnConsultingRoomId") as string | null;
      payload.returnAppointmentTypeId = formData.get("returnAppointmentTypeId") as string | null;
      payload.returnStatus = formData.get("returnStatus") as string | null;
    }
    return payload;
  }

  if (intent === INTENTS.delete && consultationId && consultationId !== "nueva") {
    const res = await deleteConsultation(consultationId);
    if (res.success) return { success: true, deleted: true, actionType: INTENTS.delete };
    return { ...res, actionType: INTENTS.delete };
  }

  if (intent === INTENTS.addDiagnosis && consultationId && consultationId !== "nueva") {
    const res = await addDiagnosis(consultationId, {
      code: (formData.get("code") as string) || undefined,
      name: (formData.get("name") as string) || "",
      description: (formData.get("description") as string) || undefined,
    });
    return { ...res, actionType: INTENTS.addDiagnosis };
  }

  if (intent === INTENTS.updateDiagnosis) {
    const id = formData.get("diagnosisId") as string;
    const res = await updateDiagnosis(id, {
      code: (formData.get("code") as string) || undefined,
      name: (formData.get("name") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
    });
    return { ...res, actionType: INTENTS.updateDiagnosis };
  }

  if (intent === INTENTS.deleteDiagnosis) {
    const res = await deleteDiagnosis(formData.get("diagnosisId") as string);
    return { ...res, actionType: INTENTS.deleteDiagnosis };
  }

  if (intent === INTENTS.addTreatment && consultationId && consultationId !== "nueva") {
    const res = await addTreatment(consultationId, (formData.get("description") as string) || "");
    return { ...res, actionType: INTENTS.addTreatment };
  }

  if (intent === INTENTS.updateTreatment) {
    const res = await updateTreatment(formData.get("treatmentId") as string, (formData.get("description") as string) || "");
    return { ...res, actionType: INTENTS.updateTreatment };
  }

  if (intent === INTENTS.deleteTreatment) {
    const res = await deleteTreatment(formData.get("treatmentId") as string);
    return { ...res, actionType: INTENTS.deleteTreatment };
  }

  if (intent === INTENTS.addStudy && consultationId && consultationId !== "nueva") {
    const res = await addStudy(consultationId, {
      description: (formData.get("description") as string) || "",
      result: (formData.get("result") as string) || undefined,
    });
    return { ...res, actionType: INTENTS.addStudy };
  }

  if (intent === INTENTS.updateStudy) {
    const res = await updateStudy(formData.get("studyId") as string, {
      description: (formData.get("description") as string) || undefined,
      result: (formData.get("result") as string) || undefined,
    });
    return { ...res, actionType: INTENTS.updateStudy };
  }

  if (intent === INTENTS.deleteStudy) {
    const res = await deleteStudy(formData.get("studyId") as string);
    return { ...res, actionType: INTENTS.deleteStudy };
  }

  return { success: false, error: "Acción no válida", actionType: null };
}

export default function ConsultaDetalle() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
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

  const [searchParams] = useSearchParams();
  const returnDate = searchParams.get("returnDate") ?? undefined;
  const returnView = searchParams.get("returnView") ?? undefined;
  const returnDateFrom = searchParams.get("returnDateFrom") ?? undefined;
  const returnDateTo = searchParams.get("returnDateTo") ?? undefined;
  const returnDoctorId = searchParams.get("returnDoctorId") ?? undefined;
  const returnConsultingRoomId = searchParams.get("returnConsultingRoomId") ?? undefined;
  const returnAppointmentTypeId = searchParams.get("returnAppointmentTypeId") ?? undefined;
  const returnStatus = searchParams.get("returnStatus") ?? undefined;
  const returnQuery = React.useMemo(() => {
    if (!returnDate) return "";
    const p = new URLSearchParams({ returnDate });
    if (returnView) p.set("returnView", returnView);
    if (returnDateFrom) p.set("returnDateFrom", returnDateFrom);
    if (returnDateTo) p.set("returnDateTo", returnDateTo);
    if (returnDoctorId) p.set("returnDoctorId", returnDoctorId);
    if (returnConsultingRoomId) p.set("returnConsultingRoomId", returnConsultingRoomId);
    if (returnAppointmentTypeId) p.set("returnAppointmentTypeId", returnAppointmentTypeId);
    if (returnStatus) p.set("returnStatus", returnStatus);
    return `?${p.toString()}`;
  }, [returnDate, returnView, returnDateFrom, returnDateTo, returnDoctorId, returnConsultingRoomId, returnAppointmentTypeId, returnStatus]);
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

  const [terminadoDialogOpen, setTerminadoDialogOpen] = React.useState(false);
  const [saveAndExitPending, setSaveAndExitPending] = React.useState<{
    returnDate: string;
    returnView?: string;
    returnDateFrom?: string;
    returnDateTo?: string;
    returnDoctorId?: string;
    returnConsultingRoomId?: string;
    returnAppointmentTypeId?: string;
    returnStatus?: string;
  } | null>(null);
  const consultaFormRef = React.useRef<HTMLFormElement>(null);

  const { patient, consultation, doctors, isNew } = loaderData;
  const consultationId = consultation?.consultation.id ?? "nueva";
  const backUrl = PATHS.historiaClinicaPaciente(patient.id) + (returnDate ? returnQuery : "");

  if (!isNew && !consultation) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <p className="text-muted-foreground">Consulta no encontrada.</p>
        <Button asChild variant="outline">
          <Link to={backUrl}>Volver al historial del paciente</Link>
        </Button>
      </div>
    );
  }

  const INTENT_MESSAGES: Record<string, { ok: string }> = {
    update: { ok: "Cambios guardados correctamente" },
    addDiagnosis: { ok: "Diagnóstico agregado" },
    updateDiagnosis: { ok: "Diagnóstico actualizado" },
    deleteDiagnosis: { ok: "Diagnóstico eliminado" },
    addTreatment: { ok: "Tratamiento agregado" },
    updateTreatment: { ok: "Tratamiento actualizado" },
    deleteTreatment: { ok: "Tratamiento eliminado" },
    addStudy: { ok: "Estudio agregado" },
    updateStudy: { ok: "Estudio actualizado" },
    deleteStudy: { ok: "Estudio eliminado" },
  };

  React.useEffect(() => {
    const data = actionData as {
      redirectToAgenda?: boolean;
      returnDate?: string | null;
      returnView?: string | null;
      returnDateFrom?: string | null;
      returnDateTo?: string | null;
      returnDoctorId?: string | null;
      returnConsultingRoomId?: string | null;
      returnAppointmentTypeId?: string | null;
      returnStatus?: string | null;
      createdId?: string;
      deleted?: boolean;
    } | undefined;
    if (data?.redirectToAgenda && data?.success) {
      toast.success(data.createdId ? "Consulta creada correctamente" : "Cambios guardados");
      const url = data.returnDate
        ? PATHS.agendaReturnFilters(data.returnDate, data.returnView ?? undefined, {
            dateFrom: data.returnDateFrom ?? undefined,
            dateTo: data.returnDateTo ?? undefined,
            doctorId: data.returnDoctorId ?? undefined,
            consultingRoomId: data.returnConsultingRoomId ?? undefined,
            appointmentTypeId: data.returnAppointmentTypeId ?? undefined,
            status: data.returnStatus ?? undefined,
          })
        : PATHS.agenda;
      navigate(url, { replace: true });
      return;
    }
    if (actionData && "createdId" in actionData && actionData.createdId) {
      toast.success("Consulta creada correctamente");
      navigate(PATHS.historiaClinicaConsulta(patient.id, actionData.createdId) + returnQuery, { replace: true });
      return;
    }
    if (actionData && "deleted" in actionData && actionData.deleted) {
      toast.success("Consulta eliminada");
      navigate(backUrl, { replace: true });
      return;
    }
    if (actionData && "intent" in actionData && typeof actionData.intent === "string") {
      const intent = actionData.intent as string;
      if (actionData.success && INTENT_MESSAGES[intent]?.ok) {
        toast.success(INTENT_MESSAGES[intent].ok);
      } else if (actionData.success === false && actionData.error) {
        toast.error(actionData.error);
      }
    } else if (actionData && actionData.success === false && actionData.error) {
      toast.error(actionData.error);
    }
  }, [actionData, patient.id, backUrl, navigate, returnQuery]);

  React.useEffect(() => {
    if (saveAndExitPending && consultaFormRef.current) {
      consultaFormRef.current.requestSubmit();
      setSaveAndExitPending(null);
    }
  }, [saveAndExitPending]);

  const actionTypeMessages: Record<string, string> = {
    [INTENTS.update]: "Consulta actualizada correctamente",
    [INTENTS.addDiagnosis]: "Diagnóstico agregado",
    [INTENTS.updateDiagnosis]: "Diagnóstico actualizado",
    [INTENTS.deleteDiagnosis]: "Diagnóstico eliminado",
    [INTENTS.addTreatment]: "Tratamiento agregado",
    [INTENTS.updateTreatment]: "Tratamiento actualizado",
    [INTENTS.deleteTreatment]: "Tratamiento eliminado",
    [INTENTS.addStudy]: "Estudio agregado",
    [INTENTS.updateStudy]: "Estudio actualizado",
    [INTENTS.deleteStudy]: "Estudio eliminado",
  };

  React.useEffect(() => {
    if (!actionData || "createdId" in actionData || "deleted" in actionData) return;
    const actionType = (actionData as { actionType?: string }).actionType;
    if (actionData.success === true && actionType && actionTypeMessages[actionType]) {
      toast.success(actionTypeMessages[actionType]);
    } else if (actionData.success === false && actionData.error) {
      toast.error(actionData.error);
    }
  }, [actionData]);

  const PatientDataCard = () => (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base">Datos del paciente</CardTitle>
      </CardHeader>
      <CardContent className="py-2 pt-0">
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Nombre</dt>
            <dd className="font-medium">{patient.firstName} {patient.lastName}</dd>
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
  );

  if (isNew) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Button asChild variant="ghost" size="icon" className="shrink-0" aria-label="Volver">
              <Link to={backUrl}><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold">Nueva consulta</h1>
          </div>
          <>
              <Button type="button" className="gap-2 bg-primary" onClick={() => setTerminadoDialogOpen(true)}>
                <CheckCircle className="h-4 w-4" />
                Terminado
              </Button>
              <Dialog open={terminadoDialogOpen} onOpenChange={setTerminadoDialogOpen}>
                <DialogContent showCloseButton={false} className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>¿Salir sin guardar?</DialogTitle>
                    <DialogDescription>
                      Tiene cambios sin guardar. ¿Desea guardar antes de volver a la agenda?
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="button" variant="outline" onClick={() => setTerminadoDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setTerminadoDialogOpen(false);
                        navigate(agendaReturnUrl);
                      }}
                    >
                      Salir sin guardar
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setTerminadoDialogOpen(false);
                        setSaveAndExitPending({
                          returnDate,
                          returnView,
                          returnDateFrom,
                          returnDateTo,
                          returnDoctorId,
                          returnConsultingRoomId,
                          returnAppointmentTypeId,
                          returnStatus,
                        });
                      }}
                    >
                      Guardar y salir
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
        </div>
        <PatientDataCard />
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datos de la consulta</CardTitle>
          </CardHeader>
          <CardContent>
            <Form method="post" className="space-y-4" ref={consultaFormRef}>
              <input type="hidden" name="_intent" value={INTENTS.create} />
              {saveAndExitPending && (
                <>
                  <input type="hidden" name="redirectToAgenda" value="1" />
                  <input type="hidden" name="returnDate" value={saveAndExitPending.returnDate} />
                  <input type="hidden" name="returnView" value={saveAndExitPending.returnView ?? ""} />
                  {saveAndExitPending.returnDateFrom && <input type="hidden" name="returnDateFrom" value={saveAndExitPending.returnDateFrom} />}
                  {saveAndExitPending.returnDateTo && <input type="hidden" name="returnDateTo" value={saveAndExitPending.returnDateTo} />}
                  {saveAndExitPending.returnDoctorId && <input type="hidden" name="returnDoctorId" value={saveAndExitPending.returnDoctorId} />}
                  {saveAndExitPending.returnConsultingRoomId && <input type="hidden" name="returnConsultingRoomId" value={saveAndExitPending.returnConsultingRoomId} />}
                  {saveAndExitPending.returnAppointmentTypeId && <input type="hidden" name="returnAppointmentTypeId" value={saveAndExitPending.returnAppointmentTypeId} />}
                  {saveAndExitPending.returnStatus && <input type="hidden" name="returnStatus" value={saveAndExitPending.returnStatus} />}
                </>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="consultationDate">Fecha</Label>
                  <Input id="consultationDate" name="consultationDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
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
                <textarea id="notes" name="notes" rows={4} className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[80px]" placeholder="Notas del profesional" />
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" asChild><Link to={backUrl}>Cancelar</Link></Button>
                <Button type="submit">
                  {actionData && "success" in actionData && !actionData.success ? "Reintentar" : "Crear consulta"}
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const c = consultation!;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Button asChild variant="ghost" size="icon" className="shrink-0"><Link to={backUrl}><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold truncate">Consulta {formatDate(c.consultation.consultationDate)}</h1>
            <p className="text-muted-foreground text-sm">{c.patient?.firstName} {c.patient?.lastName}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
            <>
              <Button type="button" className="gap-2 bg-primary" onClick={() => setTerminadoDialogOpen(true)}>
                <CheckCircle className="h-4 w-4" />
                Terminado
              </Button>
              <Dialog open={terminadoDialogOpen} onOpenChange={setTerminadoDialogOpen}>
                <DialogContent showCloseButton={false} className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>¿Salir sin guardar?</DialogTitle>
                    <DialogDescription>
                      Tiene cambios sin guardar. ¿Desea guardar antes de volver a la agenda?
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="button" variant="outline" onClick={() => setTerminadoDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setTerminadoDialogOpen(false);
                        navigate(agendaReturnUrl);
                      }}
                    >
                      Salir sin guardar
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setTerminadoDialogOpen(false);
                        setSaveAndExitPending({
                          returnDate,
                          returnView,
                          returnDateFrom,
                          returnDateTo,
                          returnDoctorId,
                          returnConsultingRoomId,
                          returnAppointmentTypeId,
                          returnStatus,
                        });
                      }}
                    >
                      Guardar y salir
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          <Button asChild variant="outline" size="sm" className="gap-1">
            <a href={PATHS.historiaClinicaConsultaPdf(patient.id, c.consultation.id)} download>
              <FileDown className="h-4 w-4" />
              Descargar PDF
            </a>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1">
            <a href={PATHS.historiaClinicaConsultaPdf(patient.id, c.consultation.id)} target="_blank" rel="noopener noreferrer">
              <Printer className="h-4 w-4" />
              Imprimir
            </a>
          </Button>
          <Button asChild variant="outline" size="sm"><Link to={`/pacientes/${patient.id}`}>Ver paciente</Link></Button>
          <Form method="post" onSubmit={(e) => !confirm("¿Eliminar esta consulta?") && e.preventDefault()}>
            <input type="hidden" name="_intent" value={INTENTS.delete} />
            <Button type="submit" variant="outline" size="sm" className="text-destructive hover:text-destructive">Eliminar</Button>
          </Form>
        </div>
      </div>

      <PatientDataCard />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos de la consulta</CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4" ref={consultaFormRef}>
            <input type="hidden" name="_intent" value={INTENTS.update} />
            {saveAndExitPending && (
              <>
                <input type="hidden" name="redirectToAgenda" value="1" />
                <input type="hidden" name="returnDate" value={saveAndExitPending.returnDate} />
                <input type="hidden" name="returnView" value={saveAndExitPending.returnView ?? ""} />
                {saveAndExitPending.returnDateFrom && <input type="hidden" name="returnDateFrom" value={saveAndExitPending.returnDateFrom} />}
                {saveAndExitPending.returnDateTo && <input type="hidden" name="returnDateTo" value={saveAndExitPending.returnDateTo} />}
                {saveAndExitPending.returnDoctorId && <input type="hidden" name="returnDoctorId" value={saveAndExitPending.returnDoctorId} />}
                {saveAndExitPending.returnConsultingRoomId && <input type="hidden" name="returnConsultingRoomId" value={saveAndExitPending.returnConsultingRoomId} />}
                {saveAndExitPending.returnAppointmentTypeId && <input type="hidden" name="returnAppointmentTypeId" value={saveAndExitPending.returnAppointmentTypeId} />}
                {saveAndExitPending.returnStatus && <input type="hidden" name="returnStatus" value={saveAndExitPending.returnStatus} />}
              </>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="consultationDate">Fecha</Label>
                <Input id="consultationDate" name="consultationDate" type="date" defaultValue={c.consultation.consultationDate} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctorId">Médico</Label>
                <select id="doctorId" name="doctorId" defaultValue={c.consultation.doctorId ?? ""}>
                  <option value="">—</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo</Label>
              <Input id="reason" name="reason" defaultValue={c.consultation.reason ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <textarea id="notes" name="notes" rows={4} className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[80px]" defaultValue={c.consultation.notes ?? ""} />
            </div>
            <Button type="submit">Guardar cambios</Button>
          </Form>
        </CardContent>
      </Card>

      {/* Diagnósticos */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg">Diagnósticos</CardTitle>
          <Form method="post" className="flex gap-2 flex-wrap flex-1 min-w-0">
            <input type="hidden" name="_intent" value={INTENTS.addDiagnosis} />
            <Input name="name" placeholder="Nombre del diagnóstico" className="min-w-[200px] sm:min-w-[280px] flex-1 max-w-md" required />
            <Input name="code" placeholder="Código (opc.)" className="w-24 hidden sm:block shrink-0" />
            <Button type="submit" size="sm" className="gap-1 shrink-0"><Plus className="h-4 w-4" /> Agregar</Button>
          </Form>
        </CardHeader>
        <CardContent>
          {c.diagnoses.length === 0 ? (
            <p className="text-muted-foreground text-sm">Sin diagnósticos cargados.</p>
          ) : (
            <ul className="space-y-2">
              {c.diagnoses.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center gap-2 rounded border p-2 text-sm">
                  <span className="font-medium">{d.name}</span>
                  {d.code && <span className="text-muted-foreground">({d.code})</span>}
                  <Form method="post" className="ml-auto flex gap-1">
                    <input type="hidden" name="_intent" value={INTENTS.deleteDiagnosis} />
                    <input type="hidden" name="diagnosisId" value={d.id} />
                    <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </Form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Tratamientos */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg">Tratamientos</CardTitle>
          <Form method="post" className="flex gap-2 flex-1 min-w-0">
            <input type="hidden" name="_intent" value={INTENTS.addTreatment} />
            <Input name="description" placeholder="Descripción" className="min-w-0 flex-1" required />
            <Button type="submit" size="sm" className="gap-1 shrink-0"><Plus className="h-4 w-4" /> Agregar</Button>
          </Form>
        </CardHeader>
        <CardContent>
          {c.treatments.length === 0 ? (
            <p className="text-muted-foreground text-sm">Sin tratamientos.</p>
          ) : (
            <ul className="space-y-2">
              {c.treatments.map((t) => (
                <li key={t.id} className="flex items-center gap-2 rounded border p-2 text-sm">
                  <span className="flex-1 min-w-0">{t.description}</span>
                  <Form method="post">
                    <input type="hidden" name="_intent" value={INTENTS.deleteTreatment} />
                    <input type="hidden" name="treatmentId" value={t.id} />
                    <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0"><Trash2 className="h-4 w-4" /></Button>
                  </Form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Estudios */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg">Estudios</CardTitle>
          <Form method="post" className="flex flex-col sm:flex-row gap-2 flex-1 min-w-0">
            <input type="hidden" name="_intent" value={INTENTS.addStudy} />
            <Input name="description" placeholder="Descripción" className="min-w-0 flex-1" required />
            <Input name="result" placeholder="Resultado (opc.)" className="min-w-0 flex-1 sm:max-w-[180px]" />
            <Button type="submit" size="sm" className="gap-1 shrink-0"><Plus className="h-4 w-4" /> Agregar</Button>
          </Form>
        </CardHeader>
        <CardContent>
          {c.studies.length === 0 ? (
            <p className="text-muted-foreground text-sm">Sin estudios cargados.</p>
          ) : (
            <ul className="space-y-2">
              {c.studies.map((s) => (
                <li key={s.id} className="rounded border p-2 text-sm">
                  <div className="font-medium">{s.description}</div>
                  {s.result && <div className="text-muted-foreground text-xs mt-1">{s.result}</div>}
                  <Form method="post" className="mt-2">
                    <input type="hidden" name="_intent" value={INTENTS.deleteStudy} />
                    <input type="hidden" name="studyId" value={s.id} />
                    <Button type="submit" variant="ghost" size="sm" className="text-destructive h-8"><Trash2 className="h-4 w-4 mr-1" /> Eliminar</Button>
                  </Form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
