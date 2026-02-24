import type { Route } from "./+types/dashboard.historia-clinica.$patientId.consulta.$consultationId.pdf";
import { requireAuth } from "~/lib/middleware";
import { getConsultationById } from "~/lib/medical-records.server";
import { getAllInstitutions } from "~/lib/institutions.server";
import { generateConsultationPdf } from "~/lib/pdf-history.server";
import { isValidUUID } from "~/lib/utils";

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireAuth(request);
  const { consultationId } = params;
  if (!consultationId || consultationId === "nueva" || !isValidUUID(consultationId)) {
    return new Response("Consulta no encontrada", { status: 404 });
  }

  const consultation = await getConsultationById(consultationId);
  if (!consultation?.patient) {
    return new Response("Consulta no encontrada", { status: 404 });
  }

  let institutionName: string | undefined;
  let logoUrl: string | null = null;
  try {
    const list = await getAllInstitutions({ limit: 1 });
    const first = list[0];
    if (first) {
      institutionName = first.name;
      logoUrl = first.logoUrl ?? null;
    }
  } catch {
    // ignore
  }

  const pdfData = {
    patient: {
      firstName: consultation.patient.firstName,
      lastName: consultation.patient.lastName,
      documentNumber: consultation.patient.documentNumber,
      medicalRecordNumber: consultation.patient.medicalRecordNumber ?? null,
      birthDate: consultation.patient.birthDate ?? null,
    },
    consultationDate: consultation.consultation.consultationDate,
    doctorName: consultation.doctor
      ? `${consultation.doctor.firstName} ${consultation.doctor.lastName}`
      : "—",
    reason: consultation.consultation.reason ?? null,
    notes: consultation.consultation.notes ?? null,
    diagnoses: consultation.diagnoses.map((d) => ({ name: d.name, code: d.code ?? null })),
    treatments: consultation.treatments.map((t) => ({ description: t.description })),
    studies: consultation.studies.map((s) => ({ description: s.description, result: s.result ?? null })),
    institutionName,
    logoUrl,
  };

  try {
    const pdfBuffer = await generateConsultationPdf(pdfData);
    const filename = `historia-clinica-${consultation.consultation.consultationDate}-${consultation.patient.lastName}.pdf`;
    return new Response(pdfBuffer as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (err) {
    console.error("PDF generation failed:", err);
    return new Response("Error al generar el PDF", { status: 500 });
  }
}
