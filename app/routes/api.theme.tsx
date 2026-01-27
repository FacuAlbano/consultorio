import type { Route } from "./+types/api.theme";
import { createCookie } from "react-router";

const themeCookie = createCookie("theme", {
  maxAge: 60 * 60 * 24 * 365, // 1 año
  httpOnly: false, // Necesario para que JS pueda leerlo
  sameSite: "lax",
});

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const theme = formData.get("theme") as string;

  return {
    headers: {
      "Set-Cookie": await themeCookie.serialize(theme),
    },
  };
}
