import { redirect } from "react-router";
import type { Route } from "./+types/dashboard";
import { getSession } from "~/lib/session";
import { PATHS } from "~/lib/constants";
import { DashboardPageLayout } from "~/components/app-layout/dashboard-page-layout";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  const tokenType = session.get("tokenType");

  if (!tokenType) {
    throw redirect(PATHS.login);
  }
  
  return {
    tokenType: tokenType as string,
  };
}

export default function DashboardLayout() {
  return <DashboardPageLayout />;
}
