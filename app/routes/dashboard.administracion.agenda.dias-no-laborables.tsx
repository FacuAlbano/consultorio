import * as React from "react";
import { useLoaderData, useActionData, Form, useNavigation, useFetcher } from "react-router";
import type { Route } from "./+types/dashboard.administracion.agenda.dias-no-laborables";
import { requireAuth } from "~/lib/middleware";
import { getUserInfo } from "~/lib/user-info";
import { addInstitutionUnavailableDay, removeInstitutionUnavailableDay } from "~/lib/institution-unavailable-days.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Calendar, Plus, X, Loader2 } from "lucide-react";
import { useState } from "react";

const UNAVAILABLE_DAY_ACTIONS = {
  ADD: "add",
  REMOVE: "remove",
} as const;

export async function loader({ request }: Route.LoaderArgs) {
  const { getInstitutionUnavailableDays } = await import("~/lib/institution-unavailable-days.server");
  const { tokenType } = await requireAuth(request);
  const userInfo = getUserInfo(tokenType);

  const days = await getInstitutionUnavailableDays();

  return {
    userInfo,
    days,
  };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === UNAVAILABLE_DAY_ACTIONS.ADD) {
    const date = formData.get("date") as string;
    const reason = formData.get("reason") as string || undefined;
    const result = await addInstitutionUnavailableDay(date, reason);
    return {
      success: result.success,
      data: result.data,
      error: result.error,
      actionType: UNAVAILABLE_DAY_ACTIONS.ADD,
    };
  }

  if (intent === UNAVAILABLE_DAY_ACTIONS.REMOVE) {
    const dayId = formData.get("dayId") as string;
    const result = await removeInstitutionUnavailableDay(dayId);
    return {
      success: result.success,
      ...("data" in result && result.data ? { data: result.data } : {}),
      ...("error" in result && result.error ? { error: result.error } : {}),
      dayId,
      actionType: UNAVAILABLE_DAY_ACTIONS.REMOVE,
    };
  }

  return { success: false, error: "Acción no válida", actionType: "" };
}

export default function DiasNoLaborables() {
  const { days: initialDays } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const fetcher = useFetcher();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [days, setDays] = useState(initialDays);

  const isSubmitting = navigation.state === "submitting";

  // Actualizar días después de acciones exitosas
  React.useEffect(() => {
    if (actionData?.success) {
      if (actionData.actionType === UNAVAILABLE_DAY_ACTIONS.ADD && actionData.data) {
        setDays([actionData.data, ...days]);
        setShowAddForm(false);
        setNewDate("");
        setNewReason("");
      } else if (actionData.actionType === UNAVAILABLE_DAY_ACTIONS.REMOVE) {
        const dayId = actionData.data?.id || (actionData as any).dayId;
        if (dayId) {
          setDays(days.filter((day) => day.id !== dayId));
        }
      }
      // Recargar datos desde el servidor
      fetcher.load(".");
    }
  }, [actionData]);

  // Sincronizar con datos del fetcher
  React.useEffect(() => {
    if (fetcher.data && Array.isArray(fetcher.data.days)) {
      setDays(fetcher.data.days);
    }
  }, [fetcher.data]);

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Días no Laborables</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Gestiona los días no laborables de la institución
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Días No Laborables
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mensajes */}
          {actionData?.success && (
            <div className="p-3 rounded-md bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 text-sm">
              {actionData.actionType === UNAVAILABLE_DAY_ACTIONS.ADD && "Día no laborable agregado"}
              {actionData.actionType === UNAVAILABLE_DAY_ACTIONS.REMOVE && "Día no laborable eliminado"}
            </div>
          )}

          {actionData?.error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {actionData.error}
            </div>
          )}

          {/* Formulario para agregar día */}
          {!showAddForm ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddForm(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Día No Laborable
            </Button>
          ) : (
            <Form method="post" className="space-y-3 p-4 bg-muted rounded-lg">
              <input type="hidden" name="intent" value={UNAVAILABLE_DAY_ACTIONS.ADD} />
              
              <div>
                <label className="block text-sm font-medium mb-2">Fecha</label>
                <Input
                  type="date"
                  name="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Motivo (Opcional)</label>
                <Input
                  name="reason"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="Ej: Feriado nacional, Día de la institución..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Agregando...
                    </>
                  ) : (
                    "Agregar"
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewDate("");
                    setNewReason("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </Form>
          )}

          {/* Lista de días no laborables */}
          <div className="space-y-2">
            {days.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay días no laborables registrados
              </p>
            ) : (
              days.map((day) => (
                <div
                  key={day.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {formatDate(day.date)}
                    </p>
                    {day.reason && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {day.reason}
                      </p>
                    )}
                  </div>
                  <Form method="post">
                    <input type="hidden" name="intent" value={UNAVAILABLE_DAY_ACTIONS.REMOVE} />
                    <input type="hidden" name="dayId" value={day.id} />
                    <Button
                      type="submit"
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive h-8 w-8 p-0"
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </Form>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
