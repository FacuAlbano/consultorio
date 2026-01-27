# Guía de Uso de Arquitectura CRUD

Esta guía muestra cómo crear un nuevo CRUD siguiendo la arquitectura establecida.

## Estructura de Archivos

```
app/
├── routes/
│   └── _dashboard.{model}.tsx           # UI + Routing
├── lib/
│   ├── {model}.server.ts                # Database Queries
│   └── {model}-crud.service.server.ts   # Business Logic
```

## Ejemplo: CRUD de Médicos

### 1. Crear el archivo de servidor (`lib/doctors.server.ts`)

```typescript
import { db } from "~/db/client";
import { doctors } from "~/db/schema";
import { eq, and, like, desc } from "drizzle-orm";

export interface GetDoctorsOptions {
  search?: string;
  limit?: number;
  offset?: number;
}

export async function getAllDoctors(options: GetDoctorsOptions = {}) {
  const { search, limit = 50, offset = 0 } = options;
  
  let query = db.select().from(doctors);
  
  if (search) {
    query = query.where(
      like(doctors.name, `%${search}%`)
    ) as any;
  }
  
  const results = await query
    .limit(limit)
    .offset(offset)
    .orderBy(desc(doctors.createdAt));
  
  return results;
}

export async function getDoctorById(id: string) {
  const [doctor] = await db
    .select()
    .from(doctors)
    .where(eq(doctors.id, id))
    .limit(1);
  
  return doctor || null;
}

export async function createDoctor(data: typeof doctors.$inferInsert) {
  const [newDoctor] = await db
    .insert(doctors)
    .values(data)
    .returning();
  
  return { success: true, data: newDoctor };
}

export async function updateDoctor(id: string, data: Partial<typeof doctors.$inferInsert>) {
  const [updatedDoctor] = await db
    .update(doctors)
    .set(data)
    .where(eq(doctors.id, id))
    .returning();
  
  return { success: true, data: updatedDoctor };
}

export async function deleteDoctor(id: string) {
  await db.delete(doctors).where(eq(doctors.id, id));
  return { success: true };
}
```

### 2. Crear el servicio CRUD (`lib/doctors-crud.service.server.ts`)

```typescript
import { z } from "zod";
import { createDoctor, updateDoctor, deleteDoctor } from "./doctors.server";

const doctorSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Email inválido"),
  specialty: z.string().min(1, "La especialidad es obligatoria"),
});

export class DoctorCRUDService {
  static async createDoctor({ formData }: { formData: FormData }) {
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      specialty: formData.get("specialty") as string,
    };

    const validation = doctorSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0].message,
      };
    }

    try {
      const result = await createDoctor(validation.data);
      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error: "Error al crear el médico",
      };
    }
  }

  static async updateDoctor({ doctorId, formData }: { doctorId: string; formData: FormData }) {
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      specialty: formData.get("specialty") as string,
    };

    const validation = doctorSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0].message,
      };
    }

    try {
      const result = await updateDoctor(doctorId, validation.data);
      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error: "Error al actualizar el médico",
      };
    }
  }

  static async deleteDoctor({ doctorId }: { doctorId: string }) {
    try {
      await deleteDoctor(doctorId);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: "Error al eliminar el médico",
      };
    }
  }
}
```

### 3. Crear la ruta (`routes/_dashboard.doctors.tsx`)

```typescript
import { useState } from "react";
import { useLoaderData, useActionData, Form, useNavigation } from "react-router";
import type { Route } from "./+types/_dashboard.doctors";
import { requireAuth } from "~/lib/middleware";
import { getAllDoctors } from "~/lib/doctors.server";
import { DoctorCRUDService } from "~/lib/doctors-crud.service.server";
import { CrudLayout } from "~/components/crud/crud-layout";
import { CrudTable, type CrudTableColumn } from "~/components/crud/crud-table";
import { ResponsiveDialog } from "~/components/crud/responsive-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CrudInputField } from "~/components/crud/crud-input-field";
import { Button } from "~/components/ui/button";

const DOCTOR_ACTIONS = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
} as const;

const doctorFormSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Email inválido"),
  specialty: z.string().min(1, "La especialidad es obligatoria"),
});

type DoctorFormData = z.infer<typeof doctorFormSchema>;

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  
  const doctors = await getAllDoctors({ search });
  
  return { doctors, search };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === DOCTOR_ACTIONS.CREATE) {
    return await DoctorCRUDService.createDoctor({ formData });
  }

  if (intent === DOCTOR_ACTIONS.UPDATE) {
    const doctorId = formData.get("doctorId") as string;
    return await DoctorCRUDService.updateDoctor({ doctorId, formData });
  }

  if (intent === DOCTOR_ACTIONS.DELETE) {
    const doctorId = formData.get("doctorId") as string;
    return await DoctorCRUDService.deleteDoctor({ doctorId });
  }

  return { success: false, error: "Acción no válida" };
}

export default function Doctors() {
  const { doctors, search } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<typeof doctors[0] | null>(null);

  const isSubmitting = navigation.state === "submitting";

  const columns: CrudTableColumn<typeof doctors[0]>[] = [
    {
      key: "name",
      header: "Nombre",
      render: (doctor) => doctor.name,
    },
    {
      key: "email",
      header: "Email",
      render: (doctor) => doctor.email,
    },
    {
      key: "specialty",
      header: "Especialidad",
      render: (doctor) => doctor.specialty,
    },
  ];

  const handleEdit = (doctor: typeof doctors[0]) => {
    setSelectedDoctor(doctor);
    setEditOpen(true);
  };

  const handleDelete = async (doctor: typeof doctors[0]) => {
    if (confirm(`¿Estás seguro de eliminar a ${doctor.name}?`)) {
      const formData = new FormData();
      formData.append("intent", DOCTOR_ACTIONS.DELETE);
      formData.append("doctorId", doctor.id);
      // Enviar formulario
    }
  };

  return (
    <CrudLayout
      title="Médicos"
      itemName="médico"
      onCreateClick={() => setCreateOpen(true)}
      renderList={() => (
        <CrudTable
          items={doctors}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
      renderCreateDialog={() => (
        <CreateDoctorDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          actionData={actionData}
          isSubmitting={isSubmitting}
        />
      )}
      renderEditDialog={() => (
        selectedDoctor && (
          <EditDoctorDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            doctor={selectedDoctor}
            actionData={actionData}
            isSubmitting={isSubmitting}
          />
        )
      )}
    />
  );
}

function CreateDoctorDialog({
  open,
  onOpenChange,
  actionData,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionData: any;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DoctorFormData>({
    resolver: zodResolver(doctorFormSchema),
  });

  // Cerrar y resetear si fue exitoso
  if (actionData?.success && !isSubmitting) {
    onOpenChange(false);
    reset();
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Crear Médico"
    >
      <Form method="post" onSubmit={handleSubmit(() => {})}>
        <input type="hidden" name="intent" value={DOCTOR_ACTIONS.CREATE} />
        
        <div className="space-y-4">
          <CrudInputField
            name="name"
            label="Nombre"
            {...register("name")}
            error={errors.name?.message}
            required
          />
          <CrudInputField
            name="email"
            label="Email"
            type="email"
            {...register("email")}
            error={errors.email?.message}
            required
          />
          <CrudInputField
            name="specialty"
            label="Especialidad"
            {...register("specialty")}
            error={errors.specialty?.message}
            required
          />

          {actionData?.error && (
            <p className="text-sm text-destructive">{actionData.error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando..." : "Crear"}
            </Button>
          </div>
        </div>
      </Form>
    </ResponsiveDialog>
  );
}

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
  actionData: any;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DoctorFormData>({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      name: doctor.name,
      email: doctor.email,
      specialty: doctor.specialty,
    },
  });

  // Cerrar y resetear si fue exitoso
  if (actionData?.success && !isSubmitting) {
    onOpenChange(false);
    reset();
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Editar Médico"
    >
      <Form method="post" onSubmit={handleSubmit(() => {})}>
        <input type="hidden" name="intent" value={DOCTOR_ACTIONS.UPDATE} />
        <input type="hidden" name="doctorId" value={doctor.id} />
        
        <div className="space-y-4">
          <CrudInputField
            name="name"
            label="Nombre"
            {...register("name")}
            error={errors.name?.message}
            required
          />
          <CrudInputField
            name="email"
            label="Email"
            type="email"
            {...register("email")}
            error={errors.email?.message}
            required
          />
          <CrudInputField
            name="specialty"
            label="Especialidad"
            {...register("specialty")}
            error={errors.specialty?.message}
            required
          />

          {actionData?.error && (
            <p className="text-sm text-destructive">{actionData.error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </Form>
    </ResponsiveDialog>
  );
}
```

## Reglas Importantes

1. ✅ **Siempre usar `.server.ts`** para archivos con lógica de base de datos
2. ✅ **Validar en el servicio**, no en el servidor
3. ✅ **Extraer FormData en el servicio**, no en la ruta
4. ✅ **Usar componentes CRUD reutilizables** para consistencia
5. ✅ **Proteger rutas con `requireAuth`** en el loader
6. ✅ **Retornar respuestas consistentes**: `{ success: boolean, data?, error? }`
