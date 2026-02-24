export type ConsultationPdfData = {
  patient: { firstName: string; lastName: string; documentNumber: string; medicalRecordNumber: string | null; birthDate: string | null };
  consultationDate: string;
  doctorName: string;
  reason: string | null;
  notes: string | null;
  diagnoses: { name: string; code: string | null }[];
  treatments: { description: string }[];
  studies: { description: string; result: string | null }[];
  institutionName?: string;
  logoUrl?: string | null;
};

function wrapText(doc: { splitTextToSize: (text: string, maxWidth: number) => string[]; text: (lines: string | string[], x: number, y: number) => void }, text: string, x: number, y: number, maxWidth: number, lineHeight = 6): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

export async function generateConsultationPdf(data: ConsultationPdfData): Promise<Uint8Array> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const pageWidth = doc.getPageWidth();
  const margin = 20;
  let y = margin;

  const titleFont = 16;
  const normalFont = 10;
  const smallFont = 9;

  doc.setFontSize(titleFont);
  doc.text("Historia Clínica - Consulta", margin, y);
  y += 10;

  doc.setFontSize(normalFont);
  y = wrapText(doc, `Paciente: ${data.patient.firstName} ${data.patient.lastName}`, margin, y, pageWidth - 2 * margin) + 2;
  y = wrapText(doc, `HC: ${data.patient.medicalRecordNumber ?? "—"}  |  DNI: ${data.patient.documentNumber}`, margin, y, pageWidth - 2 * margin) + 2;
  if (data.patient.birthDate) {
    y = wrapText(doc, `Fecha de nacimiento: ${data.patient.birthDate}`, margin, y, pageWidth - 2 * margin) + 2;
  }
  y += 4;

  doc.setFontSize(smallFont);
  doc.setTextColor(100, 100, 100);
  y = wrapText(doc, `Fecha de consulta: ${data.consultationDate}  |  Médico: ${data.doctorName}`, margin, y, pageWidth - 2 * margin) + 4;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(normalFont);

  if (data.reason) {
    doc.setFont("helvetica", "bold");
    doc.text("Motivo de consulta:", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    y = wrapText(doc, data.reason, margin, y, pageWidth - 2 * margin) + 4;
  }

  if (data.notes) {
    doc.setFont("helvetica", "bold");
    doc.text("Notas:", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    y = wrapText(doc, data.notes, margin, y, pageWidth - 2 * margin) + 4;
  }

  if (data.diagnoses.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("Diagnósticos:", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    for (const d of data.diagnoses) {
      const line = d.code ? `${d.name} (${d.code})` : d.name;
      y = wrapText(doc, `• ${line}`, margin, y, pageWidth - 2 * margin - 5) + 2;
    }
    y += 2;
  }

  if (data.treatments.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("Tratamientos:", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    for (const t of data.treatments) {
      y = wrapText(doc, `• ${t.description}`, margin, y, pageWidth - 2 * margin - 5) + 2;
    }
    y += 2;
  }

  if (data.studies.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("Estudios:", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    for (const s of data.studies) {
      y = wrapText(doc, `• ${s.description}${s.result ? ` — ${s.result}` : ""}`, margin, y, pageWidth - 2 * margin - 5) + 2;
    }
    y += 2;
  }

  if (data.institutionName) {
    y += 6;
    doc.setFontSize(smallFont);
    doc.setTextColor(100, 100, 100);
    doc.text(data.institutionName, margin, y);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(normalFont);
  }

  const pageHeight = doc.getPageHeight();
  doc.setFontSize(smallFont);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Documento generado el ${new Date().toLocaleDateString("es-AR")} a las ${new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`,
    margin,
    pageHeight - 10
  );
  doc.text(`Página 1 de 1`, pageWidth - margin - 20, pageHeight - 10);
  doc.setTextColor(0, 0, 0);

  const raw = doc.output("arraybuffer");
  return new Uint8Array(raw instanceof ArrayBuffer ? raw : (raw as Uint8Array).buffer);
}

export type PatientHistoryPdfData = {
  patient: { firstName: string; lastName: string; documentNumber: string; medicalRecordNumber: string | null; birthDate: string | null };
  consultations: ConsultationPdfData[];
  institutionName?: string;
};

function addNewPageIfNeeded(
  doc: { addPage: () => void; getPageHeight?: () => number },
  y: number,
  margin: number,
  pageHeight: number,
  minSpace = 40
): number {
  if (y > pageHeight - minSpace) {
    doc.addPage();
    return margin;
  }
  return y;
}

export async function generatePatientHistoryPdf(data: PatientHistoryPdfData): Promise<Uint8Array> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const pageWidth = doc.getPageWidth();
  const pageHeight = doc.getPageHeight();
  const margin = 20;
  let y = margin;

  const titleFont = 16;
  const normalFont = 10;
  const smallFont = 9;

  // Portada: datos del paciente
  doc.setFontSize(titleFont);
  doc.text("Historia Clínica - Resumen del paciente", margin, y);
  y += 12;

  doc.setFontSize(normalFont);
  y = wrapText(doc, `Paciente: ${data.patient.firstName} ${data.patient.lastName}`, margin, y, pageWidth - 2 * margin) + 2;
  y = wrapText(doc, `HC: ${data.patient.medicalRecordNumber ?? "—"}  |  DNI: ${data.patient.documentNumber}`, margin, y, pageWidth - 2 * margin) + 2;
  if (data.patient.birthDate) {
    y = wrapText(doc, `Fecha de nacimiento: ${data.patient.birthDate}`, margin, y, pageWidth - 2 * margin) + 2;
  }
  y += 4;
  doc.setFontSize(smallFont);
  doc.text(`Total de consultas: ${data.consultations.length}`, margin, y);
  y += 8;
  if (data.institutionName) {
    doc.setTextColor(100, 100, 100);
    doc.text(data.institutionName, margin, y);
    doc.setTextColor(0, 0, 0);
    y += 10;
  }
  doc.setFontSize(normalFont);

  // Cada consulta en una o más páginas
  const totalPages = data.consultations.length;
  for (let i = 0; i < data.consultations.length; i++) {
    const c = data.consultations[i];
    y = addNewPageIfNeeded(doc, y, margin, pageHeight);
    if (i > 0) y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Consulta ${i + 1} de ${totalPages} — ${c.consultationDate}`, margin, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(smallFont);
    doc.setTextColor(100, 100, 100);
    y = wrapText(doc, `Médico: ${c.doctorName}`, margin, y, pageWidth - 2 * margin) + 4;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(normalFont);

    if (c.reason) {
      doc.setFont("helvetica", "bold");
      doc.text("Motivo de consulta:", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      y = wrapText(doc, c.reason, margin, y, pageWidth - 2 * margin) + 4;
    }

    if (c.notes) {
      y = addNewPageIfNeeded(doc, y, margin, pageHeight);
      doc.setFont("helvetica", "bold");
      doc.text("Notas:", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      y = wrapText(doc, c.notes, margin, y, pageWidth - 2 * margin) + 4;
    }

    if (c.diagnoses.length > 0) {
      y = addNewPageIfNeeded(doc, y, margin, pageHeight);
      doc.setFont("helvetica", "bold");
      doc.text("Diagnósticos:", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      for (const d of c.diagnoses) {
        const line = d.code ? `${d.name} (${d.code})` : d.name;
        y = wrapText(doc, `• ${line}`, margin, y, pageWidth - 2 * margin - 5) + 2;
      }
      y += 2;
    }

    if (c.treatments.length > 0) {
      y = addNewPageIfNeeded(doc, y, margin, pageHeight);
      doc.setFont("helvetica", "bold");
      doc.text("Tratamientos:", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      for (const t of c.treatments) {
        y = wrapText(doc, `• ${t.description}`, margin, y, pageWidth - 2 * margin - 5) + 2;
      }
      y += 2;
    }

    if (c.studies.length > 0) {
      y = addNewPageIfNeeded(doc, y, margin, pageHeight);
      doc.setFont("helvetica", "bold");
      doc.text("Estudios:", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      for (const s of c.studies) {
        y = wrapText(doc, `• ${s.description}${s.result ? ` — ${s.result}` : ""}`, margin, y, pageWidth - 2 * margin - 5) + 2;
      }
      y += 2;
    }
  }

  // Pie de página en todas las hojas
  const numPages = doc.getNumberOfPages();
  const generatedAt = `Generado el ${new Date().toLocaleDateString("es-AR")} ${new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`;
  for (let p = 1; p <= numPages; p++) {
    doc.setPage(p);
    doc.setFontSize(smallFont);
    doc.setTextColor(120, 120, 120);
    doc.text(generatedAt, margin, pageHeight - 10);
    doc.text(`Página ${p} de ${numPages}`, pageWidth - margin - 25, pageHeight - 10);
    doc.setTextColor(0, 0, 0);
  }

  const raw = doc.output("arraybuffer");
  return new Uint8Array(raw instanceof ArrayBuffer ? raw : (raw as Uint8Array).buffer);
}
