import { useLoaderData, useActionData, Form, Link } from "react-router";
import type { Route } from "./+types/pacientes.$id.editar";
import { getPatientById } from "~/lib/patients.server";
import { updatePatient } from "~/lib/patients.server";
import { getAllInsuranceCompanies } from "~/lib/insurance-companies.server";
import { requireAuth } from "~/lib/middleware";
import { isValidUUID } from "~/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ArrowLeft } from "lucide-react";

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireAuth(request);
  const { id } = params;
  if (!id || !isValidUUID(id)) {
    throw new Response("ID de paciente inválido", { status: 400 });
  }
  const patient = await getPatientById(id);
  if (!patient) {
    throw new Response("Paciente no encontrado", { status: 404 });
  }
  const insuranceCompanies = await getAllInsuranceCompanies({ limit: 200 });
  return { patient, insuranceCompanies };
}

export async function action({ request, params }: Route.ActionArgs) {
  await requireAuth(request);
  const { id } = params;
  if (!id || !isValidUUID(id)) {
    return { success: false, error: "ID de paciente inválido" };
  }
  const formData = await request.formData();
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const documentType = (formData.get("documentType") as string) || "DNI";
  const documentNumber = formData.get("documentNumber") as string;
  const birthDate = (formData.get("birthDate") as string) || null;
  const gender = (formData.get("gender") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const whatsapp = (formData.get("whatsapp") as string) || null;
  const email = (formData.get("email") as string) || null;
  const address = (formData.get("address") as string) || null;
  const medicalRecordNumber = (formData.get("medicalRecordNumber") as string) || null;
  const insuranceCompany = (formData.get("insuranceCompany") as string) || null;
  const insuranceNumber = (formData.get("insuranceNumber") as string) || null;

  if (!firstName?.trim() || !lastName?.trim() || !documentNumber?.trim()) {
    return { success: false, error: "Nombre, apellido y DNI son obligatorios" };
  }

  const result = await updatePatient(id, {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    documentType: documentType.trim(),
    documentNumber: documentNumber.trim(),
    birthDate: birthDate || null,
    gender: gender || null,
    phone: phone?.trim() || null,
    whatsapp: whatsapp?.trim() || null,
    email: email?.trim() || null,
    address: address?.trim() || null,
    medicalRecordNumber: medicalRecordNumber?.trim() || null,
    insuranceCompany: insuranceCompany?.trim() || null,
    insuranceNumber: insuranceNumber?.trim() || null,
  });

  if (!result.success) {
    return { success: false, error: result.error || "Error al actualizar" };
  }
  return { success: true };
}

export default function EditarPaciente() {
  const { patient, insuranceCompanies } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const birthDateStr = patient.birthDate
    ? new Date(patient.birthDate).toISOString().slice(0, 10)
    : "";

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/pacientes/${patient.id}`}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Editar datos del paciente</h1>
            <p className="text-muted-foreground text-sm">
              {patient.firstName} {patient.lastName}
            </p>
          </div>
        </div>
      </div>

      {actionData?.success && (
        <div className="rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 px-4 py-3 text-sm">
          Datos actualizados correctamente.
        </div>
      )}
      {actionData?.success === false && actionData?.error && (
        <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-3 text-sm">
          {actionData.error}
        </div>
      )}

      <Form method="post" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos personales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  defaultValue={patient.firstName}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  defaultValue={patient.lastName}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentType">Tipo documento</Label>
                <Input
                  id="documentType"
                  name="documentType"
                  defaultValue={patient.documentType ?? "DNI"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentNumber">DNI / Número documento *</Label>
                <Input
                  id="documentNumber"
                  name="documentNumber"
                  defaultValue={patient.documentNumber}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Fecha de nacimiento</Label>
                <Input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  defaultValue={birthDateStr}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Género</Label>
                <Input
                  id="gender"
                  name="gender"
                  defaultValue={patient.gender ?? ""}
                  placeholder="M, F, Otro"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" name="phone" type="tel" defaultValue={patient.phone ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" name="whatsapp" type="tel" defaultValue={patient.whatsapp ?? ""} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={patient.email ?? ""} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Dirección</Label>
                <Input id="address" name="address" defaultValue={patient.address ?? ""} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historia clínica y obra social</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="medicalRecordNumber">Número de Historia Clínica (HC)</Label>
              <Input
                id="medicalRecordNumber"
                name="medicalRecordNumber"
                defaultValue={patient.medicalRecordNumber ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insuranceCompany">Obra social</Label>
              <select
                id="insuranceCompany"
                name="insuranceCompany"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                defaultValue={patient.insuranceCompany ?? ""}
              >
                <option value="">— Sin obra social —</option>
                {insuranceCompanies.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="insuranceNumber">Número de afiliado</Label>
              <Input
                id="insuranceNumber"
                name="insuranceNumber"
                defaultValue={patient.insuranceNumber ?? ""}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit">Guardar cambios</Button>
          <Button type="button" variant="outline" asChild>
            <Link to={`/pacientes/${patient.id}`}>Cancelar</Link>
          </Button>
        </div>
      </Form>
    </div>
  );
}
