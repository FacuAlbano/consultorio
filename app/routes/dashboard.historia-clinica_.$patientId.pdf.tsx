import type { Route } from "./+types/dashboard.historia-clinica_.$patientId.pdf";
import { requireAuth } from "~/lib/middleware";
import { getPatientById } from "~/lib/patients.server";
import { getConsultationsByPatientId, getConsultationById } from "~/lib/medical-records.server";
import { getAllInstitutions } from "~/lib/institutions.server";
import { generatePatientHistoryPdf } from "~/lib/pdf-history.server";
import { isValidUUID } from "~/lib/utils";

/** Límite para evitar timeout/memoria en Vercel (serverless 10s) */
const MAX_CONSULTATIONS_PDF = 50;

export async function loader({ request, params }: Route.LoaderArgs) {
  try {
    await requireAuth(request);
    const { patientId } = params;
    if (!patientId || !isValidUUID(patientId)) {
      return new Response("Paciente no encontrado", { status: 404 });
    }

    const patient = await getPatientById(patientId);
    if (!patient) {
      return new Response("Paciente no encontrado", { status: 404 });
    }

    const list = await getConsultationsByPatientId({ patientId, limit: MAX_CONSULTATIONS_PDF });
    const consultationsFull = await Promise.all(
      list.map(({ consultation }) => getConsultationById(consultation.id))
    );

    const consultations = consultationsFull
      .filter((c): c is NonNullable<typeof c> => c != null && c.patient != null)
      .map((c) => ({
        patient: {
          firstName: c.patient.firstName,
          lastName: c.patient.lastName,
          documentNumber: c.patient.documentNumber,
          medicalRecordNumber: c.patient.medicalRecordNumber ?? null,
          birthDate: c.patient.birthDate ?? null,
        },
        consultationDate: c.consultation.consultationDate,
        doctorName: c.doctor
          ? `${c.doctor.firstName} ${c.doctor.lastName}`
          : "—",
        reason: c.consultation.reason ?? null,
        notes: c.consultation.notes ?? null,
        diagnoses: c.diagnoses.map((d) => ({ name: d.name, code: d.code ?? null })),
        treatments: c.treatments.map((t) => ({ description: t.description })),
        studies: c.studies.map((s) => ({ description: s.description, result: s.result ?? null })),
      }));

    let institutionName: string | undefined;
    try {
      const institutions = await getAllInstitutions({ limit: 1 });
      if (institutions[0]) institutionName = institutions[0].name;
    } catch {
      // ignore
    }

    const pdfData = {
      patient: {
        firstName: patient.firstName,
        lastName: patient.lastName,
        documentNumber: patient.documentNumber,
        medicalRecordNumber: patient.medicalRecordNumber ?? null,
        birthDate: patient.birthDate ?? null,
      },
      consultations,
      institutionName,
    };

    const pdfBuffer = await generatePatientHistoryPdf(pdfData);
    const safeName = `${patient.lastName}-${patient.firstName}`.replace(/[^a-zA-Z0-9-_]/g, "_");
    const filename = `historia-clinica-${safeName}.pdf`;
    const byteLength = pdfBuffer.byteLength ?? pdfBuffer.length;
    return new Response(pdfBuffer as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(byteLength),
      },
    });
  } catch (err) {
    console.error("PDF historia clínica failed:", err);
    return new Response("Error al generar el PDF. Intente de nuevo más tarde.", { status: 500 });
  }
}
