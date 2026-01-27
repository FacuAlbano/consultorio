import { redirect } from "react-router";
import type { Route } from "./+types/_auth.logout";
import { logout } from "~/lib/session";

export async function loader({ request }: Route.LoaderArgs) {
  const { redirect: redirectTo, headers } = await logout(request);
  throw redirect(redirectTo, { headers });
}

export async function action({ request }: Route.ActionArgs) {
  const { redirect: redirectTo, headers } = await logout(request);
  throw redirect(redirectTo, { headers });
}