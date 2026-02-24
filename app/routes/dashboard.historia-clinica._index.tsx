import * as React from "react";
import { useLoaderData, useSearchParams, useNavigate, Form, Link } from "react-router";
import type { Route } from "./+types/dashboard.historia-clinica._index";
import { requireAuth } from "~/lib/middleware";
import { searchPatients, getAllPatients } from "~/lib/patients.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { FileSearch, User, FileText } from "lucide-react";
import { PATHS } from "~/lib/constants";
import { useState } from "react";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const filter = (url.searchParams.get("filter") as "all" | "hc" | "document") || "all";

  let patients: Awaited<ReturnType<typeof searchPatients>> = [];
  if (filter === "all" && !q.trim()) {
    patients = await getAllPatients({ limit: 200 });
  } else if (q.trim().length >= (filter === "document" ? 1 : 1)) {
    patients = await searchPatients({
      query: q.trim(),
      limit: 100,
      filter: filter === "document" ? "document" : filter === "hc" ? "hc" : "all",
    });
  }

  return { patients, q, filter };
}

export default function HistoriaClinicaIndex() {
  const { patients, q: initialQ, filter: initialFilter } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState(initialQ);
  const [filter, setFilter] = useState<"all" | "hc" | "document">(initialFilter);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("filter", filter);
    if (q.trim()) params.set("q", q.trim());
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="h-7 w-7" />
          Historia Clínica
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Buscar por número de HC o DNI para ver el historial médico del paciente.
        </p>
      </div>

      <Card>
        <CardHeader className="py-2 px-4 sm:px-6">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileSearch className="h-4 w-4" />
            Búsqueda por HC / Documento
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-3 px-4 sm:px-6">
          <Form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex flex-wrap gap-2">
              {[
                { value: "hc" as const, label: "HC" },
                { value: "document" as const, label: "DNI" },
                { value: "all" as const, label: "Todos" },
              ].map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  className={`rounded-full px-3 py-1 text-sm transition-colors ${
                    filter === f.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex-1 flex gap-2 min-w-0 items-center">
              <Input
                type="text"
                placeholder={filter === "hc" ? "Número de HC..." : filter === "document" ? "DNI..." : "HC, DNI o nombre..."}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="min-w-0 h-9"
              />
              <Button type="submit" size="sm" className="shrink-0 h-9">Buscar</Button>
            </div>
          </Form>
        </CardContent>
      </Card>

      {patients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pacientes encontrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium">Paciente</th>
                    <th className="text-left py-3 px-2 font-medium hidden sm:table-cell">HC</th>
                    <th className="text-left py-3 px-2 font-medium hidden md:table-cell">DNI</th>
                    <th className="text-right py-3 px-2 font-medium w-32 sm:w-40">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      className="border-b border-border/50 hover:bg-muted/30 cursor-pointer"
                      onClick={() => navigate(PATHS.historiaClinicaPaciente(p.id))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(PATHS.historiaClinicaPaciente(p.id));
                        }
                      }}
                    >
                      <td className="py-3 px-2">
                        <span className="font-medium">{p.firstName} {p.lastName}</span>
                      </td>
                      <td className="py-3 px-2 hidden sm:table-cell text-muted-foreground">{p.medicalRecordNumber ?? "—"}</td>
                      <td className="py-3 px-2 hidden md:table-cell text-muted-foreground">{p.documentNumber}</td>
                      <td className="py-3 px-2 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button asChild variant="outline" size="sm" className="gap-1">
                          <Link to={PATHS.historiaClinicaPaciente(p.id)}>
                            <User className="h-4 w-4" />
                            <span className="hidden xs:inline">Ver historial</span>
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden space-y-3">
              {patients.map((p) => (
                <Link
                  key={p.id}
                  to={PATHS.historiaClinicaPaciente(p.id)}
                  className="block rounded-lg border p-4 flex flex-col gap-2 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="font-medium">{p.firstName} {p.lastName}</div>
                  <div className="text-muted-foreground text-sm">
                    HC: {p.medicalRecordNumber ?? "—"} · DNI: {p.documentNumber}
                  </div>
                  <span className="text-sm text-primary font-medium flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Ver historial
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {q.trim() && patients.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No se encontraron pacientes con &quot;{q}&quot;. Probá con otro valor o filtro.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
