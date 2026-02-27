import * as React from "react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

/**
 * Campos del formulario "Registrar Nuevo Paciente".
 * Misma estructura, etiquetas y placeholders en todos los flujos de creación de paciente.
 */
export function RegistrarPacienteFormFields({
  idPrefix = "",
  defaultDocumentNumber,
  className,
}: {
  idPrefix?: string;
  defaultDocumentNumber?: string;
  className?: string;
}) {
  const id = (name: string) => (idPrefix ? `${idPrefix}${name}` : name);
  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={id("firstName")}>Nombre *</Label>
          <Input id={id("firstName")} name="firstName" required placeholder="Nombre" className="h-9" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={id("lastName")}>Apellido *</Label>
          <Input id={id("lastName")} name="lastName" required placeholder="Apellido" className="h-9" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={id("documentType")}>Tipo Documento</Label>
          <select
            id={id("documentType")}
            name="documentType"
            defaultValue="DNI"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            <option value="DNI">DNI</option>
            <option value="LC">LC</option>
            <option value="LE">LE</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={id("documentNumber")}>Número Documento *</Label>
          <Input
            id={id("documentNumber")}
            name="documentNumber"
            required
            placeholder="12345678"
            defaultValue={defaultDocumentNumber}
            className="h-9"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={id("birthDate")}>Fecha de nacimiento</Label>
        <Input id={id("birthDate")} name="birthDate" type="date" className="h-9" />
      </div>
      <div className="space-y-2">
        <Label htmlFor={id("insuranceCompany")}>Obra social</Label>
        <Input id={id("insuranceCompany")} name="insuranceCompany" placeholder="Opcional" className="h-9" />
      </div>
      <div className="space-y-2">
        <Label htmlFor={id("insuranceNumber")}>Número de afiliado</Label>
        <Input id={id("insuranceNumber")} name="insuranceNumber" placeholder="Opcional" className="h-9" />
      </div>
      <div className="space-y-2">
        <Label htmlFor={id("phone")}>Teléfono</Label>
        <Input id={id("phone")} name="phone" type="tel" placeholder="(011) 1234-5678" className="h-9" />
      </div>
      <div className="space-y-2">
        <Label htmlFor={id("email")}>Email</Label>
        <Input id={id("email")} name="email" type="email" placeholder="email@ejemplo.com" className="h-9" />
      </div>
    </div>
  );
}
