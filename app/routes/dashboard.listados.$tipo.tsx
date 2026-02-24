import * as React from "react";
import { loadListado, actionListado, isValidListadoTipo, type ListadoTipo } from "~/lib/listados.server";
import { requireAuth } from "~/lib/middleware";
import { ListadoControl } from "~/components/listados/listado-control";
import { ListadoAgenda } from "~/components/listados/listado-agenda";
import { ListadoTurnos } from "~/components/listados/listado-turnos";
import { ListadoPacientes } from "~/components/listados/listado-pacientes";
import { ListadoPacientesAtendidos } from "~/components/listados/listado-pacientes-atendidos";
import { ListadoPacientesOS } from "~/components/listados/listado-pacientes-os";
import { ListadoPacientesNoAtendidos } from "~/components/listados/listado-pacientes-no-atendidos";
import { ListadoTurnosAnulados } from "~/components/listados/listado-turnos-anulados";
import { ListadoGestionDisponibilidad } from "~/components/listados/listado-gestion-disponibilidad";
import type { Route } from "./+types/dashboard.listados.$tipo";

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireAuth(request);
  const tipo = params.tipo ?? "";
  if (!isValidListadoTipo(tipo)) {
    throw new Response("Tipo de listado no válido", { status: 404 });
  }
  return loadListado(request, tipo);
}

export async function action({ request, params }: Route.ActionArgs) {
  await requireAuth(request);
  const tipo = params.tipo ?? "";
  if (!isValidListadoTipo(tipo)) {
    throw new Response("Tipo de listado no válido", { status: 404 });
  }
  return actionListado(request, tipo);
}

const COMPONENTS: Record<ListadoTipo, () => React.ReactNode> = {
  control: () => <ListadoControl />,
  agenda: () => <ListadoAgenda />,
  turnos: () => <ListadoTurnos />,
  pacientes: () => <ListadoPacientes />,
  "pacientes-atendidos": () => <ListadoPacientesAtendidos />,
  "pacientes-os": () => <ListadoPacientesOS />,
  "pacientes-no-atendidos": () => <ListadoPacientesNoAtendidos />,
  "turnos-anulados": () => <ListadoTurnosAnulados />,
  "gestion-disponibilidad": () => <ListadoGestionDisponibilidad />,
};

export default function DashboardListadosTipo({ params }: Route.ComponentProps) {
  const tipo = params.tipo as ListadoTipo;
  const Component = COMPONENTS[tipo];
  return Component ? Component() : null;
}
