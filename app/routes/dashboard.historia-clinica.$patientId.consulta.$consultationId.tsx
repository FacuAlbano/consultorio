import * as React from "react";
import { useLoaderData, useActionData, useNavigate, Link, Form } from "react-router";
import type { Route } from "./+types/dashboard.historia-clinica.$patientId.consulta.$consultationId";
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
import { ArrowLeft, Plus, Trash2, FileDown, Printer } from "lucide-react";
import { PATHS } from "~/lib/constants";
import { formatDate } from "~/lib/utils";
import { isValidUUID } from "~/lib/utils";

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
  if (!patientId || !isValidUUID(patientId)) return { success: false, error: "Paciente inválido" };

  if (intent === INTENTS.create) {
    const res = await createConsultation({
      patientId,
      doctorId: (formData.get("doctorId") as string) || null,
      appointmentId: null,
      consultationDate: (formData.get("consultationDate") as string) || new Date().toISOString().slice(0, 10),
      reason: (formData.get("reason") as string) || null,
      notes: (formData.get("notes") as string) || null,
    });
    if (res.success && res.data) return { success: true, createdId: res.data.id };
    return { success: false, error: res.error };
  }

  if (intent === INTENTS.update && consultationId && consultationId !== "nueva") {
    const res = await updateConsultation(consultationId, {
      consultationDate: formData.get("consultationDate") as string,
      doctorId: (formData.get("doctorId") as string) || null,
      reason: (formData.get("reason") as string) || null,
      notes: (formData.get("notes") as string) || null,
    });
    return res;
  }

  if (intent === INTENTS.delete && consultationId && consultationId !== "nueva") {
    const res = await deleteConsultation(consultationId);
    if (res.success) return { success: true, deleted: true };
    return res;
  }

  if (intent === INTENTS.addDiagnosis && consultationId && consultationId !== "nueva") {
    return await addDiagnosis(consultationId, {
      code: (formData.get("code") as string) || undefined,
      name: (formData.get("name") as string) || "",
      description: (formData.get("description") as string) || undefined,
    });
  }

  if (intent === INTENTS.updateDiagnosis) {
    const id = formData.get("diagnosisId") as string;
    return await updateDiagnosis(id, {
      code: (formData.get("code") as string) || undefined,
      name: (formData.get("name") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
    });
  }

  if (intent === INTENTS.deleteDiagnosis) {
    return await deleteDiagnosis(formData.get("diagnosisId") as string);
  }

  if (intent === INTENTS.addTreatment && consultationId && consultationId !== "nueva") {
    return await addTreatment(consultationId, (formData.get("description") as string) || "");
  }

  if (intent === INTENTS.updateTreatment) {
    return await updateTreatment(formData.get("treatmentId") as string, (formData.get("description") as string) || "");
  }

  if (intent === INTENTS.deleteTreatment) {
    return await deleteTreatment(formData.get("treatmentId") as string);
  }

  if (intent === INTENTS.addStudy && consultationId && consultationId !== "nueva") {
    return await addStudy(consultationId, {
      description: (formData.get("description") as string) || "",
      result: (formData.get("result") as string) || undefined,
    });
  }

  if (intent === INTENTS.updateStudy) {
    return await updateStudy(formData.get("studyId") as string, {
      description: (formData.get("description") as string) || undefined,
      result: (formData.get("result") as string) || undefined,
    });
  }

  if (intent === INTENTS.deleteStudy) {
    return await deleteStudy(formData.get("studyId") as string);
  }

  return { success: false, error: "Acción no válida" };
}

export default function ConsultaDetalle() {
  const { patient, consultation, doctors, isNew } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();

  const consultationId = consultation?.consultation.id ?? "nueva";
  const backUrl = PATHS.historiaClinicaPaciente(patient.id);

  React.useEffect(() => {
    if (actionData && "createdId" in actionData && actionData.createdId) {
      navigate(PATHS.historiaClinicaConsulta(patient.id, actionData.createdId), { replace: true });
    }
    if (actionData && "deleted" in actionData && actionData.deleted) {
      navigate(backUrl, { replace: true });
    }
  }, [actionData, patient.id, backUrl, navigate]);

  if (isNew) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="shrink-0" aria-label="Volver">
            <Link to={backUrl}><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">Nueva consulta</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datos de la consulta</CardTitle>
            <p className="text-muted-foreground text-sm">{patient.firstName} {patient.lastName}</p>
          </CardHeader>
          <CardContent>
            <Form method="post" className="space-y-4">
              <input type="hidden" name="_intent" value={INTENTS.create} />
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos de la consulta</CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            <input type="hidden" name="_intent" value={INTENTS.update} />
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
          <Form method="post" className="flex gap-2 flex-wrap">
            <input type="hidden" name="_intent" value={INTENTS.addDiagnosis} />
            <Input name="name" placeholder="Nombre" className="w-32 sm:w-40" required />
            <Input name="code" placeholder="Código (opc.)" className="w-24 hidden sm:block" />
            <Button type="submit" size="sm" className="gap-1"><Plus className="h-4 w-4" /> Agregar</Button>
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
