import { useLoaderData } from "react-router";
import type { Route } from "./+types/_dashboard._index";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

/**
 * Meta tags for the home page
 */
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Consultorio - Dashboard" },
    { name: "description", content: "¡Bienvenido a Consultorio!" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  // Loader data can be added here as needed
  return {
    message: "Bienvenido al sistema de Consultorio",
  };
}

/**
 * Dashboard home page component
 */
export default function Index() {
  const { message } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Dashboard</CardTitle>
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta es la página principal del dashboard. Aquí puedes agregar tus componentes y funcionalidades.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
