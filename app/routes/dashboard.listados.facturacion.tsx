import * as React from "react";
import { useLoaderData, useActionData, useSearchParams, Form } from "react-router";
import type { Route } from "./+types/dashboard.listados.facturacion";
import { requireAuth } from "~/lib/middleware";
import {
  getInvoices,
  getFacturacionReport,
  createInvoice,
  addPayment,
  getPaymentsByInvoiceId,
  updateInvoice,
} from "~/lib/invoices.server";
import { getAllPatients } from "~/lib/patients.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { DollarSign, Plus, CreditCard, BarChart3 } from "lucide-react";
import { useState } from "react";

const INTENTS = { CREATE_INVOICE: "createInvoice", ADD_PAYMENT: "addPayment", MARK_PAID: "markPaid" } as const;

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  const url = new URL(request.url);
  const fromDate = url.searchParams.get("fromDate") || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const toDate = url.searchParams.get("toDate") || new Date().toISOString().slice(0, 10);
  const status = url.searchParams.get("status") || "";

  const [invoicesList, patients, report] = await Promise.all([
    getInvoices({ fromDate, toDate, status: status || undefined, limit: 200 }),
    getAllPatients({ limit: 500 }),
    getFacturacionReport(fromDate, toDate),
  ]);
  return { invoices: invoicesList, patients, report, fromDate, toDate, status };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === INTENTS.CREATE_INVOICE) {
    const patientId = formData.get("patientId") as string;
    const amount = formData.get("amount") as string;
    const notes = (formData.get("notes") as string) || null;
    if (!patientId || !amount) return { success: false, error: "Paciente y monto son obligatorios" };
    const result = await createInvoice({
      patientId,
      amount: amount.replace(",", "."),
      notes,
      status: "pending",
    });
    return result;
  }

  if (intent === INTENTS.ADD_PAYMENT) {
    const invoiceId = formData.get("invoiceId") as string;
    const amount = formData.get("amount") as string;
    const method = (formData.get("method") as string) || null;
    if (!invoiceId || !amount) return { success: false, error: "Monto obligatorio" };
    return await addPayment({
      invoiceId,
      amount: amount.replace(",", "."),
      method,
      paymentDate: new Date().toISOString().slice(0, 10),
    });
  }

  if (intent === INTENTS.MARK_PAID) {
    const invoiceId = formData.get("invoiceId") as string;
    if (!invoiceId) return { success: false, error: "ID de factura requerido" };
    return await updateInvoice(invoiceId, { status: "paid" });
  }

  return { success: false, error: "Acción no válida" };
}

export default function FacturacionTurnos() {
  const { invoices, patients, report, fromDate, toDate, status } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showNewInvoice, setShowNewInvoice] = useState(false);

  const handleReportFilter = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const from = (form.elements.namedItem("fromDate") as HTMLInputElement)?.value;
    const to = (form.elements.namedItem("toDate") as HTMLInputElement)?.value;
    const st = (form.elements.namedItem("status") as HTMLSelectElement)?.value;
    const params = new URLSearchParams();
    if (from) params.set("fromDate", from);
    if (to) params.set("toDate", to);
    if (st) params.set("status", st);
    setSearchParams(params);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <DollarSign className="h-7 w-7" />
            Facturación de Turnos Médicos
          </h1>
          <p className="text-muted-foreground mt-1">
            Generación de facturas, control de pagos y reportes de facturación.
          </p>
        </div>
        <Button onClick={() => setShowNewInvoice(!showNewInvoice)} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva factura
        </Button>
      </div>

      {actionData?.success === false && actionData?.error && (
        <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-3 text-sm">{actionData.error}</div>
      )}
      {actionData?.success && (
        <div className="rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 px-4 py-3 text-sm">Operación realizada correctamente.</div>
      )}

      {/* Reportes de facturación */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Reportes de facturación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form method="get" onSubmit={handleReportFilter} className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <Label>Desde</Label>
              <Input name="fromDate" type="date" defaultValue={fromDate} />
            </div>
            <div className="space-y-1">
              <Label>Hasta</Label>
              <Input name="toDate" type="date" defaultValue={toDate} />
            </div>
            <div className="space-y-1">
              <Label>Estado</Label>
              <select name="status" defaultValue={status} className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm min-w-[120px]">
                <option value="">Todos</option>
                <option value="pending">Pendiente</option>
                <option value="paid">Pagado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            <Button type="submit">Filtrar</Button>
          </Form>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Total facturado (período)</p>
              <p className="text-2xl font-bold">${report.totalFacturado.toFixed(2)}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Total pagado</p>
              <p className="text-2xl font-bold">${report.totalPagado.toFixed(2)}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Cantidad de facturas</p>
              <p className="text-2xl font-bold">{report.cantidad}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generación de facturas */}
      {showNewInvoice && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><CreditCard className="h-5 w-5" /> Nueva factura</CardTitle>
          </CardHeader>
          <CardContent>
            <Form method="post" className="space-y-4 max-w-md">
              <input type="hidden" name="intent" value={INTENTS.CREATE_INVOICE} />
              <div className="space-y-2">
                <Label htmlFor="patientId">Paciente *</Label>
                <select id="patientId" name="patientId" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">Seleccionar paciente</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName} (DNI {p.documentNumber})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Monto *</Label>
                <Input id="amount" name="amount" type="text" placeholder="1500.00" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Input id="notes" name="notes" type="text" />
              </div>
              <Button type="submit">Crear factura</Button>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Listado facturas - Control de pagos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Facturas y control de pagos</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No hay facturas en el período seleccionado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium">Fecha</th>
                    <th className="text-left py-3 px-2 font-medium">Paciente</th>
                    <th className="text-left py-3 px-2 font-medium">Monto</th>
                    <th className="text-left py-3 px-2 font-medium">Estado</th>
                    <th className="text-left py-3 px-2 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(({ invoice, patient }) => (
                    <tr key={invoice.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 px-2">{new Date(invoice.invoiceDate).toLocaleDateString("es-AR")}</td>
                      <td className="py-3 px-2">{patient ? `${patient.firstName} ${patient.lastName}` : "—"}</td>
                      <td className="py-3 px-2">${invoice.amount}</td>
                      <td className="py-3 px-2">
                        <span className={invoice.status === "paid" ? "text-green-600" : invoice.status === "cancelled" ? "text-muted-foreground" : ""}>
                          {invoice.status === "pending" ? "Pendiente" : invoice.status === "paid" ? "Pagado" : "Cancelado"}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        {invoice.status === "pending" && (
                          <Form method="post" className="inline">
                            <input type="hidden" name="intent" value={INTENTS.MARK_PAID} />
                            <input type="hidden" name="invoiceId" value={invoice.id} />
                            <Button type="submit" variant="outline" size="sm">Marcar como pagado</Button>
                          </Form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
