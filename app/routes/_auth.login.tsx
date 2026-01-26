import { Button } from "~/components/ui/button";
import { useState } from "react";
import { Eye, EyeOff, Lock, Shield, Loader2 } from "lucide-react";
import { useActionData, redirect, useSubmit, useNavigation } from "react-router";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import type { Route } from "./+types/_auth.login";
import { verifyCredentials } from "~/lib/auth";
import { createUserSession } from "~/lib/session";
import { PATHS } from "~/lib/constants";

type LoginFormData = {
  email: string;
  password: string;
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login - Consultorio" },
    { name: "description", content: "Iniciar sesión en Consultorio" },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const user = await verifyCredentials(email, password);
  if (!user) {
    return { error: "Credenciales inválidas" };
  }

  // Create user session and redirect to dashboard
  const { redirect: redirectTo, headers } = await createUserSession(user.id, PATHS.dashboard);
  throw redirect(redirectTo, { headers });
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const [showPassword, setShowPassword] = useState(false);
  
  const isSubmitting = navigation.state === "submitting";
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit: SubmitHandler<LoginFormData> = (data) => {
    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);
    submit(formData, { method: "post" });
  };

  return (
    <div className="relative z-10 w-full max-w-md p-4 md:p-6 mx-4 md:mx-auto">
      <Card className="relative bg-card border-border shadow-lg rounded-xl">
        <CardHeader className="text-center space-y-4 pb-6">
          <div>
            <CardTitle className="text-3xl font-bold mb-2 text-primary">
              Consultorio
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Acceso seguro a la plataforma
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="email" className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Lock className="size-4 text-primary" />
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`w-full bg-input border text-foreground rounded-lg px-4 py-3 outline-none transition-all duration-200 ${
                  errors.email
                    ? "border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20"
                    : "border-border focus:border-primary focus:ring-2 focus:ring-ring"
                }`}
                placeholder="tu@email.com"
                {...register("email", { 
                  required: "El email es obligatorio",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Email inválido"
                  }
                })}
                aria-invalid={errors.email ? "true" : "false"}
              />
              {errors.email && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <label htmlFor="password" className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Lock className="size-4 text-primary" />
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className={`w-full bg-input border text-foreground rounded-lg pr-12 pl-4 py-3 outline-none transition-all duration-200 ${
                    errors.password
                      ? "border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20"
                      : "border-border focus:border-primary focus:ring-2 focus:ring-ring"
                  }`}
                  placeholder="Ingresa tu contraseña"
                  {...register("password", { required: "La contraseña es obligatoria" })}
                  aria-invalid={errors.password ? "true" : "false"}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 my-auto h-full px-4 inline-flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted transition-all duration-300 rounded-r-lg"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {actionData?.error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <Shield className="size-4 text-destructive" />
                <p className="text-sm text-destructive font-medium">
                  {actionData.error}
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 py-6 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center justify-center gap-2">
                {isSubmitting && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {isSubmitting ? "Iniciando sesión..." : "Iniciar Sesión"}
                {!isSubmitting && <Lock className="size-4" />}
              </span>
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center pt-6">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Shield className="size-4" />
            Acceso seguro y encriptado
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
