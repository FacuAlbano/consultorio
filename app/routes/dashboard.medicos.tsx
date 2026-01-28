import * as React from "react";
import { useLoaderData, useActionData, useSearchParams, Form, useNavigation, useFetcher } from "react-router";
import type { Route } from "./+types/dashboard.medicos";
import { requireAuth } from "~/lib/middleware";
import { getUserInfo } from "~/lib/user-info";
import { DoctorCRUDService } from "~/lib/doctors-crud.service.server";
import { CrudLayout, type CrudLayoutConfig } from "~/components/crud/crud-layout";
import { CrudTable, type CrudTableColumn } from "~/components/crud/crud-table";
import { CrudInputField } from "~/components/crud/crud-input-field";
import { CrudSelectField } from "~/components/crud/crud-select-field";
import { ResponsiveDialog } from "~/components/crud/responsive-dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Users, Search, Edit, User, Loader2, Calendar, Image, FileText, Clock, Plus, X } from "lucide-react";
import { useState } from "react";

// Constantes de acciones
const DOCTOR_ACTIONS = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  ADD_UNAVAILABLE_DAY: "addUnavailableDay",
  REMOVE_UNAVAILABLE_DAY: "removeUnavailableDay",
} as const;

export async function loader({ request }: Route.LoaderArgs) {
  const { getAllDoctors, searchDoctors } = await import("~/lib/doctors.server");
  const { tokenType } = await requireAuth(request);
  const userInfo = getUserInfo(tokenType);

  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";

  let doctors;
  if (query && query.length >= 2) {
    doctors = await searchDoctors({ query, limit: 50 });
  } else {
    doctors = await getAllDoctors({ limit: 50 });
  }

  return {
    userInfo,
    doctors,
    query,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { addDoctorUnavailableDay, removeDoctorUnavailableDay } = await import("~/lib/doctors.server");
  await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === DOCTOR_ACTIONS.CREATE) {
    const result = await DoctorCRUDService.createDoctor({ formData });
    return { ...result, actionType: DOCTOR_ACTIONS.CREATE };
  }

  if (intent === DOCTOR_ACTIONS.UPDATE) {
    const doctorId = formData.get("doctorId") as string;
    const result = await DoctorCRUDService.updateDoctor({ doctorId, formData });
    return { ...result, actionType: DOCTOR_ACTIONS.UPDATE };
  }

  if (intent === DOCTOR_ACTIONS.DELETE) {
    const doctorId = formData.get("doctorId") as string;
    const result = await DoctorCRUDService.deleteDoctor({ doctorId });
    return { ...result, actionType: DOCTOR_ACTIONS.DELETE };
  }

  if (intent === DOCTOR_ACTIONS.ADD_UNAVAILABLE_DAY) {
    const doctorId = formData.get("doctorId") as string;
    const date = formData.get("date") as string;
    const reason = formData.get("reason") as string || undefined;
    const result = await addDoctorUnavailableDay(doctorId, date, reason);
    return {
      success: result.success,
      data: result.data,
      error: result.error,
      actionType: DOCTOR_ACTIONS.ADD_UNAVAILABLE_DAY,
    };
  }

  if (intent === DOCTOR_ACTIONS.REMOVE_UNAVAILABLE_DAY) {
    const dayId = formData.get("dayId") as string;
    const result = await removeDoctorUnavailableDay(dayId);
    return {
      success: result.success,
      ...("data" in result && result.data ? { data: result.data } : {}),
      ...("error" in result && result.error ? { error: result.error } : {}),
      actionType: DOCTOR_ACTIONS.REMOVE_UNAVAILABLE_DAY,
    };
  }

  return { success: false, error: "Acción no válida", actionType: "" };
}

export default function Medicos() {
  const { doctors, query: initialQuery } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const unavailableDaysFetcher = useFetcher<any[]>();

  const isSubmitting = navigation.state === "submitting";

  // Cargar días no laborables cuando se abre el dialog o cambia el médico seleccionado
  // Usamos useRef para rastrear el último ID cargado y forzar recarga cuando cambia
  const lastLoadedDoctorId = React.useRef<string | null>(null);
  
  React.useEffect(() => {
    if (profileDialogOpen && selectedDoctor?.id) {
      // Si el ID del médico cambió, forzar recarga incluso si hay datos en caché
      if (lastLoadedDoctorId.current !== selectedDoctor.id) {
        lastLoadedDoctorId.current = selectedDoctor.id;
        unavailableDaysFetcher.load(`/api/doctors/${selectedDoctor.id}/unavailable-days`);
      }
    } else if (!profileDialogOpen) {
      // Limpiar la referencia cuando se cierra el diálogo
      lastLoadedDoctorId.current = null;
    }
  }, [profileDialogOpen, selectedDoctor?.id]);

  // Recargar días no laborables después de acciones exitosas
  React.useEffect(() => {
    if (actionData?.success && selectedDoctor && (actionData.actionType === DOCTOR_ACTIONS.ADD_UNAVAILABLE_DAY || actionData.actionType === DOCTOR_ACTIONS.REMOVE_UNAVAILABLE_DAY)) {
      unavailableDaysFetcher.load(`/api/doctors/${selectedDoctor.id}/unavailable-days`);
    }
  }, [actionData, selectedDoctor]);

  // Estado local para los días no disponibles del médico actual
  // Se limpia cuando cambia el médico para evitar mostrar datos del médico anterior
  const [doctorUnavailableDays, setDoctorUnavailableDays] = React.useState<any[]>([]);
  
  // Limpiar días no disponibles cuando cambia el médico seleccionado
  React.useEffect(() => {
    setDoctorUnavailableDays([]);
  }, [selectedDoctor?.id]);
  
  // Actualizar días no disponibles cuando el fetcher tiene datos
  React.useEffect(() => {
    if (unavailableDaysFetcher.data && Array.isArray(unavailableDaysFetcher.data)) {
      setDoctorUnavailableDays(unavailableDaysFetcher.data);
    }
  }, [unavailableDaysFetcher.data]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) {
      params.set("q", searchQuery);
    } else {
      params.delete("q");
    }
    setSearchParams(params, { replace: true });
  };

  const handleDelete = async (doctor: any) => {
    if (confirm(`¿Estás seguro de eliminar a ${doctor.firstName} ${doctor.lastName}?`)) {
      const formData = new FormData();
      formData.append("intent", DOCTOR_ACTIONS.DELETE);
      formData.append("doctorId", doctor.id);
      const form = document.createElement("form");
      form.method = "post";
      Array.from(formData.entries()).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value as string;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    }
  };

  const handleViewProfile = (doctor: any) => {
    setSelectedDoctor(doctor);
    setProfileDialogOpen(true);
    // Los días no laborables se cargan automáticamente mediante el useEffect
    // cuando profileDialogOpen y selectedDoctor cambian
  };

  const config: CrudLayoutConfig = {
    title: "Gestión de Médicos",
    itemName: "médico",
    items: doctors,
  };

  const columns: CrudTableColumn[] = [
    {
      key: "name",
      header: "Nombre",
      render: (doctor) => (
        <button
          onClick={() => handleViewProfile(doctor)}
          className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity w-full"
        >
          {doctor.photoUrl ? (
            <img
              src={doctor.photoUrl}
              alt={`${doctor.firstName} ${doctor.lastName}`}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
          )}
          <div>
            <div className="font-medium">
              {doctor.firstName} {doctor.lastName}
            </div>
            {doctor.specialty && (
              <div className="text-sm text-muted-foreground">{doctor.specialty}</div>
            )}
          </div>
        </button>
      ),
    },
    {
      key: "document",
      header: "Documento",
      render: (doctor) => (
        <div className="text-sm">
          {doctor.documentType} {doctor.documentNumber}
        </div>
      ),
    },
    {
      key: "license",
      header: "Matrícula",
      render: (doctor) => (
        <div className="text-sm">{doctor.licenseNumber || "-"}</div>
      ),
    },
    {
      key: "practice",
      header: "Práctica",
      render: (doctor) => (
        <div className="text-sm">{doctor.practice || "-"}</div>
      ),
    },
  ];

  return (
    <>
      <CrudLayout
        config={config}
        renderFilters={({ filters }) => (
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, documento, matrícula, especialidad..."
              className="flex-1"
            />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1 sm:flex-initial">
                <Search className="h-4 w-4 sm:mr-2" />
                <span className="sm:inline">Buscar</span>
              </Button>
              {searchQuery && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchParams({}, { replace: true });
                  }}
                  className="sm:flex-initial"
                >
                  <span className="sm:inline">Limpiar</span>
                </Button>
              )}
            </div>
          </form>
        )}
        renderList={({ items, onEdit }) => (
          <CrudTable
            items={items}
            columns={columns}
            onEdit={onEdit}
            onDelete={handleDelete}
            emptyMessage="No se encontraron médicos"
          />
        )}
        renderCreateDialog={({ open, onOpenChange }) => (
          <CreateDoctorDialog
            open={open}
            onOpenChange={onOpenChange}
            actionData={actionData}
            isSubmitting={isSubmitting}
          />
        )}
        renderEditDialog={({ item, open, onOpenChange }) => (
          <EditDoctorDialog
            open={open}
            onOpenChange={onOpenChange}
            doctor={item}
            actionData={actionData}
            isSubmitting={isSubmitting}
          />
        )}
      />

      {/* Dialog de Perfil/Detalle */}
      {selectedDoctor && (
        <DoctorProfileDialog
          open={profileDialogOpen}
          onOpenChange={setProfileDialogOpen}
          doctor={selectedDoctor}
          unavailableDays={doctorUnavailableDays}
          actionData={actionData}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
}

// Dialog para crear médico
function CreateDoctorDialog({
  open,
  onOpenChange,
  actionData,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionData?: any;
  isSubmitting: boolean;
}) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nuevo Médico"
      description="Registrar un nuevo médico o profesional"
    >
      <Form method="post" className="space-y-4">
        <input type="hidden" name="intent" value={DOCTOR_ACTIONS.CREATE} />

        {actionData?.error && actionData.actionType === DOCTOR_ACTIONS.CREATE && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {actionData.error}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CrudInputField
              name="firstName"
              label="Nombre"
              required
              placeholder="Nombre"
            />
            <CrudInputField
              name="lastName"
              label="Apellido"
              required
              placeholder="Apellido"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CrudSelectField
              name="documentType"
              label="Tipo Documento"
              defaultValue="DNI"
              options={[
                { value: "DNI", label: "DNI" },
                { value: "LC", label: "LC" },
                { value: "LE", label: "LE" },
              ]}
            />
            <CrudInputField
              name="documentNumber"
              label="Número Documento"
              required
              placeholder="12345678"
            />
          </div>

          <CrudInputField
            name="licenseNumber"
            label="Matrícula Profesional"
            placeholder="Número de matrícula"
          />

          <CrudInputField
            name="specialty"
            label="Especialidad"
            placeholder="Ej: Cardiología, Pediatría..."
          />

          <CrudInputField
            name="practice"
            label="Práctica / Área de Trabajo"
            placeholder="Ej: Consultorio, Guardia..."
          />

          <CrudInputField
            name="photoUrl"
            label="URL de Foto"
            type="url"
            placeholder="https://..."
          />

          <CrudInputField
            name="signatureUrl"
            label="URL de Firma"
            type="url"
            placeholder="https://..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CrudInputField
              name="attentionWindowStart"
              label="Hora Inicio Ventana de Atención"
              type="time"
            />
            <CrudInputField
              name="attentionWindowEnd"
              label="Hora Fin Ventana de Atención"
              type="time"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Plantilla de Atención
            </label>
            <textarea
              name="attentionTemplate"
              className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm"
              placeholder="Plantilla de texto para atención..."
            />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear Médico"
            )}
          </Button>
        </div>
      </Form>
    </ResponsiveDialog>
  );
}

// Dialog para editar médico
function EditDoctorDialog({
  open,
  onOpenChange,
  doctor,
  actionData,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor: any;
  actionData?: any;
  isSubmitting: boolean;
}) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Editar Médico"
      description={`Editar información de ${doctor.firstName} ${doctor.lastName}`}
    >
      <Form method="post" className="space-y-4">
        <input type="hidden" name="intent" value={DOCTOR_ACTIONS.UPDATE} />
        <input type="hidden" name="doctorId" value={doctor.id} />

        {actionData?.error && actionData.actionType === DOCTOR_ACTIONS.UPDATE && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {actionData.error}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CrudInputField
              name="firstName"
              label="Nombre"
              required
              defaultValue={doctor.firstName}
              placeholder="Nombre"
            />
            <CrudInputField
              name="lastName"
              label="Apellido"
              required
              defaultValue={doctor.lastName}
              placeholder="Apellido"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CrudSelectField
              name="documentType"
              label="Tipo Documento"
              defaultValue={doctor.documentType || "DNI"}
              options={[
                { value: "DNI", label: "DNI" },
                { value: "LC", label: "LC" },
                { value: "LE", label: "LE" },
              ]}
            />
            <CrudInputField
              name="documentNumber"
              label="Número Documento"
              required
              defaultValue={doctor.documentNumber}
              placeholder="12345678"
            />
          </div>

          <CrudInputField
            name="licenseNumber"
            label="Matrícula Profesional"
            defaultValue={doctor.licenseNumber || ""}
            placeholder="Número de matrícula"
          />

          <CrudInputField
            name="specialty"
            label="Especialidad"
            defaultValue={doctor.specialty || ""}
            placeholder="Ej: Cardiología, Pediatría..."
          />

          <CrudInputField
            name="practice"
            label="Práctica / Área de Trabajo"
            defaultValue={doctor.practice || ""}
            placeholder="Ej: Consultorio, Guardia..."
          />

          <CrudInputField
            name="photoUrl"
            label="URL de Foto"
            type="url"
            defaultValue={doctor.photoUrl || ""}
            placeholder="https://..."
          />

          <CrudInputField
            name="signatureUrl"
            label="URL de Firma"
            type="url"
            defaultValue={doctor.signatureUrl || ""}
            placeholder="https://..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CrudInputField
              name="attentionWindowStart"
              label="Hora Inicio Ventana de Atención"
              type="time"
              defaultValue={doctor.attentionWindowStart ? doctor.attentionWindowStart.substring(0, 5) : ""}
            />
            <CrudInputField
              name="attentionWindowEnd"
              label="Hora Fin Ventana de Atención"
              type="time"
              defaultValue={doctor.attentionWindowEnd ? doctor.attentionWindowEnd.substring(0, 5) : ""}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Plantilla de Atención
            </label>
            <textarea
              name="attentionTemplate"
              className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm"
              defaultValue={doctor.attentionTemplate || ""}
              placeholder="Plantilla de texto para atención..."
            />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </div>
      </Form>
    </ResponsiveDialog>
  );
}

// Dialog de Perfil Completo
function DoctorProfileDialog({
  open,
  onOpenChange,
  doctor,
  unavailableDays,
  actionData,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor: any;
  unavailableDays: any[];
  actionData?: any;
  isSubmitting: boolean;
}) {
  const [showUnavailableDayForm, setShowUnavailableDayForm] = useState(false);
  const [newUnavailableDate, setNewUnavailableDate] = useState("");
  const [newUnavailableReason, setNewUnavailableReason] = useState("");

  const formatTime = (time: string | null) => {
    if (!time) return "";
    return time.substring(0, 5);
  };


  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${doctor.firstName} ${doctor.lastName}`}
      description={doctor.specialty || "Perfil del médico"}
    >
      <div className="space-y-6">
        {/* Mensajes */}
        {actionData?.success && (
          <div className="p-3 rounded-md bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 text-sm">
            {actionData.actionType === DOCTOR_ACTIONS.UPDATE && "Médico actualizado exitosamente"}
            {actionData.actionType === DOCTOR_ACTIONS.ADD_UNAVAILABLE_DAY && "Día no laborable agregado"}
            {actionData.actionType === DOCTOR_ACTIONS.REMOVE_UNAVAILABLE_DAY && "Día no laborable eliminado"}
          </div>
        )}

        {actionData?.error && (actionData.actionType === DOCTOR_ACTIONS.UPDATE || actionData.actionType === DOCTOR_ACTIONS.ADD_UNAVAILABLE_DAY || actionData.actionType === DOCTOR_ACTIONS.REMOVE_UNAVAILABLE_DAY) && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {actionData.error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-4">
            {/* Datos Personales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Datos Personales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form method="post" className="space-y-4">
                  <input type="hidden" name="intent" value={DOCTOR_ACTIONS.UPDATE} />
                  <input type="hidden" name="doctorId" value={doctor.id} />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CrudInputField
                      name="firstName"
                      label="Nombre"
                      required
                      defaultValue={doctor.firstName}
                    />
                    <CrudInputField
                      name="lastName"
                      label="Apellido"
                      required
                      defaultValue={doctor.lastName}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CrudSelectField
                      name="documentType"
                      label="Tipo Documento"
                      defaultValue={doctor.documentType || "DNI"}
                      options={[
                        { value: "DNI", label: "DNI" },
                        { value: "LC", label: "LC" },
                        { value: "LE", label: "LE" },
                      ]}
                    />
                    <CrudInputField
                      name="documentNumber"
                      label="Número Documento"
                      required
                      defaultValue={doctor.documentNumber}
                    />
                  </div>

                  <Button type="submit" size="sm" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </Form>
              </CardContent>
            </Card>

            {/* Información Profesional */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información Profesional</CardTitle>
              </CardHeader>
              <CardContent>
                <Form method="post" className="space-y-4">
                  <input type="hidden" name="intent" value={DOCTOR_ACTIONS.UPDATE} />
                  <input type="hidden" name="doctorId" value={doctor.id} />
                  
                  <CrudInputField
                    name="licenseNumber"
                    label="Matrícula Profesional"
                    defaultValue={doctor.licenseNumber || ""}
                  />

                  <CrudInputField
                    name="specialty"
                    label="Especialidad"
                    defaultValue={doctor.specialty || ""}
                  />

                  <CrudInputField
                    name="practice"
                    label="Práctica / Área de Trabajo"
                    defaultValue={doctor.practice || ""}
                  />

                  <Button type="submit" size="sm" disabled={isSubmitting}>
                    Guardar Cambios
                  </Button>
                </Form>
              </CardContent>
            </Card>

            {/* Configuración */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configuración</CardTitle>
              </CardHeader>
              <CardContent>
                <Form method="post" className="space-y-4">
                  <input type="hidden" name="intent" value={DOCTOR_ACTIONS.UPDATE} />
                  <input type="hidden" name="doctorId" value={doctor.id} />
                  
                  <CrudInputField
                    name="photoUrl"
                    label="URL de Foto"
                    type="url"
                    defaultValue={doctor.photoUrl || ""}
                  />

                  <CrudInputField
                    name="signatureUrl"
                    label="URL de Firma"
                    type="url"
                    defaultValue={doctor.signatureUrl || ""}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CrudInputField
                      name="attentionWindowStart"
                      label="Hora Inicio Ventana"
                      type="time"
                      defaultValue={formatTime(doctor.attentionWindowStart)}
                    />
                    <CrudInputField
                      name="attentionWindowEnd"
                      label="Hora Fin Ventana"
                      type="time"
                      defaultValue={formatTime(doctor.attentionWindowEnd)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Plantilla de Atención
                    </label>
                    <textarea
                      name="attentionTemplate"
                      defaultValue={doctor.attentionTemplate || ""}
                      className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm"
                      placeholder="Plantilla de texto para atención..."
                    />
                  </div>

                  <Button type="submit" size="sm" disabled={isSubmitting}>
                    Guardar Cambios
                  </Button>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Columna lateral - Días no laborables */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5" />
                  Días No Laborables
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showUnavailableDayForm ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowUnavailableDayForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Día
                  </Button>
                ) : (
                  <Form method="post" className="space-y-3 p-3 bg-muted rounded-lg">
                    <input type="hidden" name="intent" value={DOCTOR_ACTIONS.ADD_UNAVAILABLE_DAY} />
                    <input type="hidden" name="doctorId" value={doctor.id} />
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Fecha
                      </label>
                      <Input
                        type="date"
                        name="date"
                        value={newUnavailableDate}
                        onChange={(e) => setNewUnavailableDate(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Motivo (Opcional)
                      </label>
                      <Input
                        name="reason"
                        value={newUnavailableReason}
                        onChange={(e) => setNewUnavailableReason(e.target.value)}
                        placeholder="Ej: Vacaciones..."
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={isSubmitting}>
                        Agregar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowUnavailableDayForm(false);
                          setNewUnavailableDate("");
                          setNewUnavailableReason("");
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </Form>
                )}

                <div className="space-y-2">
                  {unavailableDays.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay días no laborables
                    </p>
                  ) : (
                    unavailableDays.map((day) => (
                      <div
                        key={day.id}
                        className="flex items-center justify-between p-2 bg-muted rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {(() => {
                              const [year, month, dayNum] = day.date.split("-").map(Number);
                              return new Date(year, month - 1, dayNum).toLocaleDateString("es-AR");
                            })()}
                          </p>
                          {day.reason && (
                            <p className="text-xs text-muted-foreground">
                              {day.reason}
                            </p>
                          )}
                        </div>
                        <Form method="post">
                          <input type="hidden" name="intent" value={DOCTOR_ACTIONS.REMOVE_UNAVAILABLE_DAY} />
                          <input type="hidden" name="dayId" value={day.id} />
                          <Button
                            type="submit"
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
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
        </div>
      </div>
    </ResponsiveDialog>
  );
}
