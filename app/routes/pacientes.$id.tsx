import { useLoaderData } from "react-router";
import type { Route } from "./+types/pacientes.$id";
import { getPatientById } from "~/lib/patients.server";
import { requireAuth } from "~/lib/middleware";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { User, FileText, Phone, Mail, MapPin, Calendar, CreditCard } from "lucide-react";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { tokenType } = await requireAuth(request);
  const { id } = params;

  if (!id) {
    throw new Response("ID de paciente no proporcionado", { status: 400 });
  }

  const patient = await getPatientById(id);

  if (!patient) {
    throw new Response("Paciente no encontrado", { status: 404 });
  }

  return { patient };
}

export default function PatientProfile() {
  const { patient } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {patient.firstName} {patient.lastName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Perfil del Paciente
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nombre completo</p>
              <p className="font-medium">{patient.firstName} {patient.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo de documento</p>
              <p className="font-medium">{patient.documentType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Número de documento</p>
              <p className="font-medium">{patient.documentNumber}</p>
            </div>
            {patient.birthDate && (
              <div>
                <p className="text-sm text-muted-foreground">Fecha de nacimiento</p>
                <p className="font-medium">
                  {new Date(patient.birthDate).toLocaleDateString("es-AR")}
                </p>
              </div>
            )}
            {patient.gender && (
              <div>
                <p className="text-sm text-muted-foreground">Género</p>
                <p className="font-medium">{patient.gender}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información de Contacto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Información de Contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {patient.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Teléfono</p>
                <p className="font-medium">{patient.phone}</p>
              </div>
            )}
            {patient.email && (
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{patient.email}</p>
              </div>
            )}
            {patient.address && (
              <div>
                <p className="text-sm text-muted-foreground">Dirección</p>
                <p className="font-medium">{patient.address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historia Clínica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Historia Clínica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {patient.medicalRecordNumber ? (
              <div>
                <p className="text-sm text-muted-foreground">Número de Historia Clínica</p>
                <p className="font-medium">{patient.medicalRecordNumber}</p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No tiene número de HC asignado</p>
            )}
          </CardContent>
        </Card>

        {/* Obra Social */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Obra Social
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {patient.insuranceCompany ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Obra Social</p>
                  <p className="font-medium">{patient.insuranceCompany}</p>
                </div>
                {patient.insuranceNumber && (
                  <div>
                    <p className="text-sm text-muted-foreground">Número de afiliado</p>
                    <p className="font-medium">{patient.insuranceNumber}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No tiene obra social registrada</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Información del Registro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Fecha de creación</p>
            <p className="font-medium">
              {new Date(patient.createdAt).toLocaleDateString("es-AR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Última actualización</p>
            <p className="font-medium">
              {new Date(patient.updatedAt).toLocaleDateString("es-AR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
