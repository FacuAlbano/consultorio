import { Outlet, redirect, useLoaderData } from "react-router";
import type { Route } from "./+types/_dashboard";
import { getSession } from "~/lib/session";
import { PATHS } from "~/lib/constants";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  const userId = session.get("userId");

  if (!userId) {
    throw redirect(PATHS.login);
  }
  
  return {
    userId: userId as string,
  };
}

export default function DashboardLayout() {
  const { userId } = useLoaderData<typeof loader>();
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-header-bg text-header-foreground">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Consultorio</h1>
          <nav className="flex items-center gap-4">
            <a href={PATHS.logout} className="text-sm hover:text-primary transition-colors">
              Cerrar Sesión
            </a>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
