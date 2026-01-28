import { requireAuth } from "~/lib/middleware";
import { getUserInfo } from "~/lib/user-info";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
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
          Funcionalidad en desarrollo
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta funcionalidad permitirá solicitar nuevas obras sociales para la institución.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
