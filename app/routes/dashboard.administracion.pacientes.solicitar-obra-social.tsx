import { Link } from "react-router";
import { requireAuth } from "~/lib/middleware";
import { getUserInfo } from "~/lib/user-info";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { PATHS } from "~/lib/constants";
import { ArrowRight } from "lucide-react";
import type { Route } from "./+types/dashboard.administracion.pacientes.solicitar-obra-social";

export async function loader({ request }: Route.LoaderArgs) {
  const { tokenType } = await requireAuth(request);
  const userInfo = getUserInfo(tokenType);

  return {
    userInfo,
  };
}

export default function SolicitarObraSocial() {
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Solicitar Obra Social</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Agregar o gestionar obras sociales de la institución
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Obras sociales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Puede ver y agregar obras sociales desde la lista. Use el botón correspondiente para crear una nueva.
          </p>
          <Button asChild>
            <Link to={PATHS.administracion.obrasSociales} className="inline-flex items-center gap-2">
              Ir a Obras sociales
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
