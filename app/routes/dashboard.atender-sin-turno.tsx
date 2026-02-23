import { useLoaderData, useActionData, useNavigation, Form } from "react-router";
import type { Route } from "./+types/dashboard.atender-sin-turno";
import { requireAuth } from "~/lib/middleware";
import { getUserInfo } from "~/lib/user-info";
import { getAllDoctors } from "~/lib/doctors.server";
import { getAllPatients, createPatient, getPatientByDocument } from "~/lib/patients.server";
import { createAppointment } from "~/lib/appointments.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { PatientSearchInput } from "~/components/patient-search/patient-search-input";
import { UserPlus, Stethoscope, Clock, User, Loader2, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";


export async function loader({ request }: Route.LoaderArgs) {
  const { tokenType } = await requireAuth(request);
  const userInfo = getUserInfo(tokenType);

  // Obtener lista de médicos y pacientes para los selects
  const doctors = await getAllDoctors({ limit: 100 });
  const patients = await getAllPatients({ limit: 50 });

  return {
    userInfo,
    doctors,
    patients,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { tokenType } = await requireAuth(request);
  
  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;

  if (actionType === "createPatient") {
    // Crear paciente nuevo
    const patientData = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      documentNumber: formData.get("documentNumber") as string,
      documentType: formData.get("documentType") as string || "DNI",
      phone: formData.get("phone") as string || undefined,
      email: formData.get("email") as string || undefined,
    };

    // Verificar si el paciente ya existe
    const existingPatient = await getPatientByDocument(patientData.documentNumber);
    if (existingPatient) {
      return {
        success: false,
        error: "Ya existe un paciente con ese número de documento",
        patientId: existingPatient.id,
      };
    }

    const result = await createPatient(patientData);
    if (result.success) {
      return {
        success: true,
        message: "Paciente creado exitosamente",
        patientId: result.data.id,
      };
    }

    return {
      success: false,
      error: "Error al crear el paciente",
    };
  }

  if (actionType === "createAppointment") {
    // Crear turno/consulta
    const appointmentData = {
      patientId: formData.get("patientId") as string,
      doctorId: formData.get("doctorId") as string || undefined,
      appointmentDate: formData.get("appointmentDate") as string,
      appointmentTime: formData.get("appointmentTime") as string,
      notes: formData.get("notes") as string || undefined,
      status: "scheduled" as const,
      isOverbooking: false,
    };

    const result = await createAppointment(appointmentData);
    if (result.success && result.data) {
      return {
        success: true,
        message: "Consulta creada exitosamente",
        appointmentId: result.data.id,
      };
    }

    return {
      success: false,
      error: result.error || "Error al crear la consulta",
    };
  }

  return {
    success: false,
    error: "Acción no válida",
  };
}

export default function AtenderSinTurno() {
  const { doctors, patients } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [formStep, setFormStep] = useState<"patient" | "appointment">("patient");
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [appointmentTime, setAppointmentTime] = useState(new Date().toTimeString().slice(0, 5));

  // Cuando se selecciona un paciente desde el buscador
  const handlePatientSelect = (patientId: string) => {
    setSelectedPatientId(patientId);
    setFormStep("appointment");
  };

  // Cuando se crea un paciente exitosamente, avanzar al siguiente paso
  useEffect(() => {
    if (actionData?.success && actionData.patientId && formStep === "patient") {
      setSelectedPatientId(actionData.patientId);
      setFormStep("appointment");
    }
  }, [actionData, formStep]);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <UserPlus className="h-8 w-8" />
            Atender sin Turno
          </h1>
          <p className="text-muted-foreground mt-1">
            Registro rápido de atención sin cita previa
          </p>
        </div>
      </div>

      {/* Mensajes de éxito/error */}
      {actionData?.success && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-medium">{actionData.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {actionData?.error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <p className="font-medium">{actionData.error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paso 1: Seleccionar o crear paciente */}
      {formStep === "patient" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Buscar paciente existente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Buscar Paciente Existente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PatientSearchInput
                placeholder="Buscar por nombre, DNI, HC..."
                onPatientSelect={handlePatientSelect}
                showFilters={true}
                showHistory={true}
              />
              {selectedPatient && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    DNI: {selectedPatient.documentNumber}
                    {selectedPatient.medicalRecordNumber && ` • HC: ${selectedPatient.medicalRecordNumber}`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registrar nuevo paciente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Registrar Nuevo Paciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form method="post" className="space-y-4">
                <input type="hidden" name="actionType" value="createPatient" />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Nombre *
                    </label>
                    <Input
                      name="firstName"
                      required
                      placeholder="Nombre"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Apellido *
                    </label>
                    <Input
                      name="lastName"
                      required
                      placeholder="Apellido"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Tipo Documento
                    </label>
                    <select
                      name="documentType"
                      defaultValue="DNI"
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm"
                    >
                      <option value="DNI">DNI</option>
                      <option value="LC">LC</option>
                      <option value="LE">LE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Número Documento *
                    </label>
                    <Input
                      name="documentNumber"
                      required
                      placeholder="12345678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Teléfono
                  </label>
                  <Input
                    name="phone"
                    type="tel"
                    placeholder="(011) 1234-5678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="email@ejemplo.com"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Crear Paciente
                    </>
                  )}
                </Button>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Paso 2: Crear consulta */}
      {formStep === "appointment" && selectedPatientId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Crear Consulta
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Información del paciente seleccionado */}
            {selectedPatient && (
              <div className="mb-6 p-4 bg-muted rounded-lg">
                <p className="font-medium text-lg">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  DNI: {selectedPatient.documentNumber}
                  {selectedPatient.medicalRecordNumber && ` • HC: ${selectedPatient.medicalRecordNumber}`}
                </p>
              </div>
            )}

            <Form method="post" className="space-y-4">
              <input type="hidden" name="actionType" value="createAppointment" />
              <input type="hidden" name="patientId" value={selectedPatientId} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Stethoscope className="h-4 w-4 inline mr-1" />
                    Médico (Opcional)
                  </label>
                  <select
                    name="doctorId"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm"
                  >
                    <option value="">Sin asignar</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.firstName} {doctor.lastName}
                        {doctor.practice && ` - ${doctor.practice}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Fecha
                  </label>
                  <Input
                    type="date"
                    name="appointmentDate"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Hora
                </label>
                <Input
                  type="time"
                  name="appointmentTime"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Notas (Opcional)
                </label>
                <textarea
                  name="notes"
                  className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm"
                  placeholder="Notas adicionales sobre la consulta..."
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormStep("patient");
                    setSelectedPatientId("");
                  }}
                >
                  Volver
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creando consulta...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Crear Consulta
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
