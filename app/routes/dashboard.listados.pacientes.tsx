import * as React from "react";
import { useLoaderData, useSearchParams, Form, Link } from "react-router";
import type { Route } from "./+types/dashboard.listados.pacientes";
import { requireAuth } from "~/lib/middleware";
import { searchPatients, getAllPatients } from "~/lib/patients.server";
import { calculateAge } from "~/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Search, Users } from "lucide-react";
import { useState } from "react";
import type { Patient } from "~/db/schema";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);

  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";
  const filter = (url.searchParams.get("filter") as "all" | "name" | "document" | "hc" | "insurance") || "all";

  let patients: Patient[];
  if (query.trim().length >= (filter === "document" ? 1 : 2)) {
    patients = await searchPatients({ query: query.trim(), limit: 100, filter });
  } else {
    patients = await getAllPatients({ limit: 100 });
  }

  return {
    patients,
    query,
    filter,
  };
}

export default function ListadoPacientes() {
  const { patients, query: initialQuery, filter: initialFilter } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [filterType, setFilterType] = useState<"all" | "name" | "document" | "hc" | "insurance">(initialFilter);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) {
      params.set("q", searchQuery);
      params.set("filter", filterType);
    } else {
      params.delete("q");
      params.delete("filter");
    }
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-7 w-7" />
            Gestión de Pacientes
          </h1>
          <p className="text-muted-foreground mt-1">
            Listado de pacientes. Buscar por DNI, nombre, HC u obra social.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <Form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: "Todos" },
                  { value: "document", label: "DNI" },
                  { value: "name", label: "Nombre" },
                  { value: "hc", label: "HC" },
                  { value: "insurance", label: "Obra Social" },
                ].map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFilterType(f.value as typeof filterType)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                      filterType === f.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Ingresar DNI, nombre, HC u obra social..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button type="submit">Buscar</Button>
              </div>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Pacientes {patients.length > 0 ? `(${patients.length})` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patients.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No se encontraron pacientes.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-medium">Nombre</th>
                      <th className="text-left py-3 px-2 font-medium">DNI</th>
                      <th className="text-left py-3 px-2 font-medium">HC</th>
                      <th className="text-left py-3 px-2 font-medium">Edad</th>
                      <th className="text-left py-3 px-2 font-medium">Teléfono</th>
                      <th className="text-left py-3 px-2 font-medium">Obra Social</th>
                      <th className="text-left py-3 px-2 w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((patient) => {
                      const age = calculateAge(patient.birthDate);
                      return (
                        <tr key={patient.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-3 px-2 font-medium">
                            {patient.firstName} {patient.lastName}
                          </td>
                          <td className="py-3 px-2">{patient.documentNumber}</td>
                          <td className="py-3 px-2">{patient.medicalRecordNumber ?? "—"}</td>
                          <td className="py-3 px-2">{age != null ? `${age} años` : "—"}</td>
                          <td className="py-3 px-2">{patient.phone ?? "—"}</td>
                          <td className="py-3 px-2">
                            {patient.insuranceCompany ?? "—"}
                            {patient.insuranceNumber ? ` (${patient.insuranceNumber})` : ""}
                          </td>
                          <td className="py-3 px-2 space-x-2">
                            <Link
                              to={`/pacientes/${patient.id}`}
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              Ver
                            </Link>
                            <Link
                              to={`/pacientes/${patient.id}/editar`}
                              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline"
                            >
                              Editar
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
