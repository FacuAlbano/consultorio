import * as React from "react";
import { useLoaderData, useActionData, useSearchParams, Form, useFetcher, Link } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/dashboard.agenda.editar-bloques";
import { requireAuth } from "~/lib/middleware";
import { getUserInfo } from "~/lib/user-info";
import { getAllDoctors } from "~/lib/doctors.server";
import { getAllAppointmentTypes } from "~/lib/appointment-types.server";
import { listGeneratedAgendaBlocks, updateGeneratedAgendaBlock } from "~/lib/generated-agenda.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Calendar, Clock, ArrowLeft, Loader2 } from "lucide-react";
import { PATHS } from "~/lib/constants";
import { formatDate } from "~/lib/utils";

export async function loader({ request }: Route.LoaderArgs) {
  const { tokenType } = await requireAuth(request);
  const userInfo = getUserInfo(tokenType);
  const url = new URL(request.url);
  const doctorId = url.searchParams.get("doctorId") || "";
  const dateFrom = url.searchParams.get("dateFrom") || "";
  const dateTo = url.searchParams.get("dateTo") || "";
  const timeFrom = url.searchParams.get("timeFrom") || "";
  const timeTo = url.searchParams.get("timeTo") || "";
  const typeId = url.searchParams.get("typeId") || "";
  const forWeb = url.searchParams.get("forWeb");
  const onSave = url.searchParams.get("onSave");

  const [doctors, appointmentTypes, blocks] = await Promise.all([
    getAllDoctors({ limit: 200 }),
    getAllAppointmentTypes({ limit: 100 }),
    doctorId && dateFrom && dateTo
      ? listGeneratedAgendaBlocks({
          doctorId,
          dateFrom,
          dateTo,
          timeFrom: timeFrom || undefined,
          timeTo: timeTo || undefined,
          appointmentTypeId: typeId || undefined,
          forWebBooking: forWeb === "1" ? true : forWeb === "0" ? false : undefined,
          availableOnSave: onSave === "1" ? true : onSave === "0" ? false : undefined,
        })
      : [],
  ]);

  return {
    userInfo,
    doctors,
    appointmentTypes,
    blocks,
    filters: { doctorId, dateFrom, dateTo, timeFrom, timeTo, typeId, forWeb, onSave },
  };
}

const INTENT_UPDATE = "updateBlock";

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const formData = await request.formData();
  if (formData.get("_intent") === INTENT_UPDATE) {
    const blockId = formData.get("blockId") as string;
    const forWebArr = formData.getAll("forWebBooking");
    const onSaveArr = formData.getAll("availableOnSave");
    const forWebBooking = forWebArr.length > 0 ? forWebArr[forWebArr.length - 1] === "1" : false;
    const availableOnSave = onSaveArr.length > 0 ? onSaveArr[onSaveArr.length - 1] === "1" : false;
    const result = await updateGeneratedAgendaBlock(blockId, {
      forWebBooking,
      availableOnSave,
    });
    if (!result.success) return { success: false, error: result.error };
    return { success: true, updated: true };
  }
  return { success: false };
}

export default function EditarAgendaBloques() {
  const { doctors, appointmentTypes, blocks, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const fetcher = useFetcher<{ success?: boolean; updated?: boolean }>();

  const handleShowTurnos = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const params = new URLSearchParams();
    const doc = fd.get("doctorId") as string;
    const from = fd.get("dateFrom") as string;
    const to = fd.get("dateTo") as string;
    const tFrom = fd.get("timeFrom") as string;
    const tTo = fd.get("timeTo") as string;
    const typeId = fd.get("typeId") as string;
    const forWebChecked = fd.getAll("forWeb").includes("1");
    const onSaveChecked = fd.getAll("onSave").includes("1");
    if (doc) params.set("doctorId", doc);
    if (from) params.set("dateFrom", from);
    if (to) params.set("dateTo", to);
    if (tFrom) params.set("timeFrom", tFrom);
    if (tTo) params.set("timeTo", tTo);
    if (typeId) params.set("typeId", typeId);
    params.set("forWeb", forWebChecked ? "1" : "0");
    params.set("onSave", onSaveChecked ? "1" : "0");
    setSearchParams(params, { replace: true });
  };

  React.useEffect(() => {
    if (fetcher.data?.success && fetcher.data?.updated) toast.success("Turno actualizado");
    else if (fetcher.data?.success === false && (fetcher.data as { error?: string }).error) toast.error((fetcher.data as { error: string }).error);
  }, [fetcher.data]);

  const periodLabel = (p: string) => (p === "morning" ? "Mañana" : "Tarde");

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link to={PATHS.agenda} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Volver a Agenda de Turnos
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="h-7 w-7" />
          Editar Agenda
        </h1>
        <p className="text-muted-foreground mt-1">
          Filtre por médico, rango de fechas y horario. Luego use &quot;Mostrar Turnos&quot; para ver y editar la disponibilidad.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form onSubmit={handleShowTurnos}>
            <div className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-center">
                <Label htmlFor="doctorId" className="text-right">Médico</Label>
                <select id="doctorId" name="doctorId" className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm" defaultValue={filters.doctorId}>
                  <option value="">Seleccionar médico...</option>
                  {doctors.map((d) => (<option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>))}
                </select>
                <Label htmlFor="dateFrom" className="text-right">Fecha Desde</Label>
                <Input id="dateFrom" name="dateFrom" type="date" className="h-9 max-w-xs" defaultValue={filters.dateFrom} />
                <Label htmlFor="dateTo" className="text-right">Fecha Hasta</Label>
                <Input id="dateTo" name="dateTo" type="date" className="h-9 max-w-xs" defaultValue={filters.dateTo} />
                <Label htmlFor="timeFrom" className="text-right">Desde</Label>
                <Input id="timeFrom" name="timeFrom" type="time" className="h-9 max-w-xs" defaultValue={filters.timeFrom} />
                <Label htmlFor="timeTo" className="text-right">Hasta</Label>
                <Input id="timeTo" name="timeTo" type="time" className="h-9 max-w-xs" defaultValue={filters.timeTo} />
                <Label htmlFor="typeId" className="text-right">Tipo</Label>
                <select id="typeId" name="typeId" className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm" defaultValue={filters.typeId}>
                  <option value="">Todos</option>
                  {appointmentTypes.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                </select>
                <span className="text-right text-sm text-muted-foreground">¿Disponibles para Reserva WEB?</span>
                <label className="inline-flex items-center gap-2">
                  <input type="hidden" name="forWeb" value="0" />
                  <input type="checkbox" name="forWeb" value="1" defaultChecked={filters.forWeb === "1"} className="rounded border-input" />
                </label>
                <span className="text-right text-sm text-muted-foreground">¿Disponibles al guardar la agenda?</span>
                <label className="inline-flex items-center gap-2">
                  <input type="hidden" name="onSave" value="0" />
                  <input type="checkbox" name="onSave" value="1" defaultChecked={filters.onSave !== "0"} className="rounded border-input" />
                </label>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button type="submit" className="gap-2 bg-primary">
                <Clock className="h-4 w-4" />
                Mostrar Turnos
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>

      {blocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Turnos ({blocks.length})</CardTitle>
            <p className="text-muted-foreground text-sm">Marque o desmarque disponibilidad y guarde.</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-medium">Fecha</th>
                    <th className="text-left py-2 px-2 font-medium">Período</th>
                    <th className="text-left py-2 px-2 font-medium">Desde</th>
                    <th className="text-left py-2 px-2 font-medium">Hasta</th>
                    <th className="text-left py-2 px-2 font-medium">Duración</th>
                    <th className="text-left py-2 px-2 font-medium">Médico</th>
                    <th className="text-left py-2 px-2 font-medium">Tipo</th>
                    <th className="text-left py-2 px-2 font-medium">Reserva WEB</th>
                    <th className="text-left py-2 px-2 font-medium">Disponible al guardar</th>
                  </tr>
                </thead>
                <tbody>
                  {blocks.map(({ block, doctor, appointmentType }) => (
                    <tr key={block.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 px-2">{formatDate(block.date)}</td>
                      <td className="py-2 px-2">{periodLabel(block.period)}</td>
                      <td className="py-2 px-2">{String(block.startTime).slice(0, 5)}</td>
                      <td className="py-2 px-2">{String(block.endTime).slice(0, 5)}</td>
                      <td className="py-2 px-2">{block.durationMinutes} min</td>
                      <td className="py-2 px-2">{doctor ? `${doctor.firstName} ${doctor.lastName}` : "—"}</td>
                      <td className="py-2 px-2">{appointmentType?.name ?? "—"}</td>
                      <td className="py-2 px-2">
                        <fetcher.Form method="post" className="inline">
                          <input type="hidden" name="_intent" value={INTENT_UPDATE} />
                          <input type="hidden" name="blockId" value={block.id} />
                          <input
                            type="hidden"
                            name="forWebBooking"
                            value={block.forWebBooking ? "1" : "0"}
                          />
                          <input
                            type="hidden"
                            name="availableOnSave"
                            value={block.availableOnSave ? "1" : "0"}
                          />
                          <button
                            type="submit"
                            name="forWebBooking"
                            value={block.forWebBooking ? "0" : "1"}
                            className="text-primary hover:underline"
                          >
                            {block.forWebBooking ? "Sí" : "No"}
                          </button>
                        </fetcher.Form>
                      </td>
                      <td className="py-2 px-2">
                        <fetcher.Form method="post" className="inline">
                          <input type="hidden" name="_intent" value={INTENT_UPDATE} />
                          <input type="hidden" name="blockId" value={block.id} />
                          <input
                            type="hidden"
                            name="forWebBooking"
                            value={block.forWebBooking ? "1" : "0"}
                          />
                          <input
                            type="hidden"
                            name="availableOnSave"
                            value={block.availableOnSave ? "0" : "1"}
                          />
                          <button
                            type="submit"
                            name="availableOnSave"
                            value={block.availableOnSave ? "0" : "1"}
                            className="text-primary hover:underline"
                          >
                            {block.availableOnSave ? "Sí" : "No"}
                          </button>
                        </fetcher.Form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {filters.doctorId && filters.dateFrom && filters.dateTo && blocks.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No hay turnos que coincidan con los filtros. Ajuste los criterios o genere agenda con &quot;Crear Agenda Propia&quot;.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
