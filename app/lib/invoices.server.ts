import { db } from "~/db/client";
import { invoices, payments, patients } from "~/db/schema";
import { eq, desc, gte, lte, and, count, sum, sql } from "drizzle-orm";
import { isValidUUID } from "~/lib/utils";

export async function getInvoices(options: { patientId?: string; status?: string; fromDate?: string; toDate?: string; limit?: number } = {}) {
  const { patientId, status, fromDate, toDate, limit = 100 } = options;
  const conditions = [];
  if (patientId && isValidUUID(patientId)) conditions.push(eq(invoices.patientId, patientId));
  if (status) conditions.push(eq(invoices.status, status));
  if (fromDate) conditions.push(gte(invoices.invoiceDate, fromDate));
  if (toDate) conditions.push(lte(invoices.invoiceDate, toDate));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db
    .select({
      invoice: invoices,
      patient: { id: patients.id, firstName: patients.firstName, lastName: patients.lastName },
    })
    .from(invoices)
    .leftJoin(patients, eq(invoices.patientId, patients.id))
    .where(where)
    .orderBy(desc(invoices.invoiceDate))
    .limit(limit);
  return results;
}

export async function getInvoiceById(id: string) {
  if (!isValidUUID(id)) return null;
  const [row] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  return row ?? null;
}

export async function createInvoice(data: typeof invoices.$inferInsert) {
  try {
    const [created] = await db.insert(invoices).values({ ...data, updatedAt: new Date() }).returning();
    if (!created) return { success: false, error: "Error al crear factura" };
    return { success: true, data: created };
  } catch (e) {
    return { success: false, error: "Error al crear factura" };
  }
}

export async function updateInvoice(id: string, data: Partial<typeof invoices.$inferInsert>) {
  const [updated] = await db.update(invoices).set({ ...data, updatedAt: new Date() }).where(eq(invoices.id, id)).returning();
  if (!updated) return { success: false, error: "Factura no encontrada" };
  return { success: true, data: updated };
}

export async function getPaymentsByInvoiceId(invoiceId: string) {
  const rows = await db.select().from(payments).where(eq(payments.invoiceId, invoiceId)).orderBy(desc(payments.paymentDate));
  return rows;
}

export async function addPayment(data: typeof payments.$inferInsert) {
  try {
    const [created] = await db.insert(payments).values(data).returning();
    if (!created) return { success: false, error: "Error al registrar pago" };
    const totalPaid = await db.select().from(payments).where(eq(payments.invoiceId, data.invoiceId));
    const sum = totalPaid.reduce((s, p) => s + parseFloat(p.amount || "0"), 0);
    const inv = await getInvoiceById(data.invoiceId);
    if (inv && sum >= parseFloat(inv.amount)) {
      await updateInvoice(data.invoiceId, { status: "paid" });
    }
    return { success: true, data: created };
  } catch (e) {
    return { success: false, error: "Error al registrar pago" };
  }
}

export async function getFacturacionReport(fromDate: string, toDate: string) {
  const conditions = [];
  if (fromDate) conditions.push(gte(invoices.invoiceDate, fromDate));
  if (toDate) conditions.push(lte(invoices.invoiceDate, toDate));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // Usar agregaciones SQL para calcular los totales de manera eficiente
  const [result] = await db
    .select({
      cantidad: count(),
      totalFacturado: sum(sql`CAST(${invoices.amount} AS NUMERIC)`),
      totalPagado: sum(sql`CASE WHEN ${invoices.status} = 'paid' THEN CAST(${invoices.amount} AS NUMERIC) ELSE 0 END`),
    })
    .from(invoices)
    .where(where);

  return {
    totalFacturado: parseFloat(String(result?.totalFacturado ?? 0)),
    totalPagado: parseFloat(String(result?.totalPagado ?? 0)),
    cantidad: result?.cantidad ?? 0,
  };
}
