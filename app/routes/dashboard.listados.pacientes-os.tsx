import * as React from "react";
import { useLoaderData, useSearchParams, Form, Link } from "react-router";
import type { Route } from "./+types/dashboard.listados.pacientes-os";
import { requireAuth } from "~/lib/middleware";
import { getAppointments } from "~/lib/appointments.server";
import { getAllInsuranceCompanies } from "~/lib/insurance-companies.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { CreditCard, ExternalLink, BarChart3, Users, Building2, PieChart } from "lucide-react";
import { useState } from "react";
import { formatDate } from "~/lib/utils";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  const url = new URL(request.url);
  const insuranceCompany = url.searchParams.get("insuranceCompany") || "";
  const date = url.searchParams.get("date") || "";

  const [appointments, insuranceCompanies] = await Promise.all([
    getAppointments({
      status: "attended",
      insuranceCompany: insuranceCompany || undefined,
      date: date || undefined,
      limit: 200,
    }),
    getAllInsuranceCompanies({ limit: 200 }),
  ]);

  const statsByOS: { obraSocial: string; cantidad: number }[] = [];
  const map = new Map<string, number>();
  for (const { patient } of appointments) {
    const os = (patient as { insuranceCompany?: string })?.insuranceCompany ?? "Sin obra social";
    map.set(os, (map.get(os) ?? 0) + 1);
  }
  map.forEach((cantidad, obraSocial) => statsByOS.push({ obraSocial, cantidad }));
  statsByOS.sort((a, b) => b.cantidad - a.cantidad);

  const totalAtendidos = statsByOS.reduce((acc, r) => acc + r.cantidad, 0);
  const top3 = statsByOS.slice(0, 3);
  const top3Sum = top3.reduce((acc, r) => acc + r.cantidad, 0);
  const top3Percent = totalAtendidos > 0 ? Math.round((top3Sum / totalAtendidos) * 100) : 0;

  return {
    appointments,
    insuranceCompanies,
    insuranceCompany,
    date,
    statsByOS,
    statsSummary: { totalAtendidos, cantidadOS: statsByOS.length, top3Percent },
  };
}

export default function PacientesAtendidosPorOS() {
  const {
    appointments,
    insuranceCompanies,
    insuranceCompany: initialOS,
    date: initialDate,
    statsByOS,
    statsSummary,
  } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [insuranceCompany, setInsuranceCompany] = useState(initialOS);
  const [date, setDate] = useState(initialDate);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (insuranceCompany) params.set("insuranceCompany", insuranceCompany);
    if (date) params.set("date", date);
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CreditCard className="h-7 w-7" />
          Pacientes Atendidos por Obra Social
        </h1>
        <p className="text-muted-foreground mt-1">
          Filtro por obra social. Listado de pacientes atendidos según su obra social.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <Form onSubmit={handleFilter} className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-sm font-medium">Obra social</label>
              <select
                value={insuranceCompany}
                onChange={(e) => setInsuranceCompany(e.target.value)}
                className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm min-w-[220px]"
              >
                <option value="">Todas</option>
                {insuranceCompanies.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              />
            </div>
            <Button type="submit">Filtrar</Button>
          </Form>
        </CardContent>
      </Card>

      {statsSummary && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-5 w-5" />
                <span className="text-sm font-medium">Total atendidos</span>
              </div>
              <p className="mt-2 text-2xl font-bold">{statsSummary.totalAtendidos}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-5 w-5" />
                <span className="text-sm font-medium">Obras sociales</span>
              </div>
              <p className="mt-2 text-2xl font-bold">{statsSummary.cantidadOS}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <PieChart className="h-5 w-5" />
                <span className="text-sm font-medium">Top 3 OS (% del total)</span>
              </div>
              <p className="mt-2 text-2xl font-bold">{statsSummary.top3Percent}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      {statsByOS.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Estadísticas por obra social
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-medium">Obra social</th>
                    <th className="text-right py-2 px-2 font-medium">Pacientes atendidos</th>
                  </tr>
                </thead>
                <tbody>
                  {statsByOS.map((row) => (
                    <tr key={row.obraSocial} className="border-b border-border/50">
                      <td className="py-2 px-2">{row.obraSocial}</td>
                      <td className="py-2 px-2 text-right font-medium">{row.cantidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Atendidos {insuranceCompany ? `(${insuranceCompany})` : ""} {appointments.length > 0 ? `— ${appointments.length} registros` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No hay pacientes atendidos con los filtros seleccionados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium">Fecha</th>
                    <th className="text-left py-3 px-2 font-medium">Hora</th>
                    <th className="text-left py-3 px-2 font-medium">Paciente</th>
                    <th className="text-left py-3 px-2 font-medium">Obra social</th>
                    <th className="text-left py-3 px-2 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(({ appointment, patient }) => (
                    <tr key={appointment.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 px-2">{formatDate(appointment.appointmentDate)}</td>
                      <td className="py-3 px-2">{appointment.appointmentTime}</td>
                      <td className="py-3 px-2">{patient ? `${patient.firstName} ${patient.lastName}` : "—"}</td>
                      <td className="py-3 px-2">{patient?.insuranceCompany ?? "—"}</td>
                      <td className="py-3 px-2">
                        {patient && (
                          <Link to={`/pacientes/${patient.id}`} className="text-primary hover:underline inline-flex items-center gap-1">
                            Ver <ExternalLink className="h-3 w-3" />
                          </Link>
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
