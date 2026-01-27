import { useLoaderData } from "react-router";
import type { Route } from "./+types/dashboard";
import { requireAuth } from "~/lib/middleware";
import { getUserInfo } from "~/lib/user-info";
import { DashboardPageLayout } from "~/components/app-layout/dashboard-page-layout";

export async function loader({ request }: Route.LoaderArgs) {
  const { tokenType } = await requireAuth(request);
  
  // Obtener información del usuario basada en el tokenType
  const userInfo = getUserInfo(tokenType);
  
  return {
    tokenType,
    userInfo,
  };
}

export default function DashboardLayout() {
  const { userInfo } = useLoaderData<typeof loader>();
  return <DashboardPageLayout userInfo={userInfo} />;
}
