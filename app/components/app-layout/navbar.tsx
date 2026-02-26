import { LogOut, Menu } from "lucide-react";
import { Form } from "react-router";
import { PATHS } from "~/lib/constants";
import { Button } from "~/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import type { UserInfo } from "~/lib/user-info";

interface NavbarProps {
  userInfo: UserInfo;
  onMenuClick?: () => void;
}

export function Navbar({ userInfo, onMenuClick }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-header-bg text-header-foreground shadow-sm">
      <div className="flex h-14 min-h-[3.5rem] items-center justify-between gap-2 px-3 sm:px-4 lg:px-6">
        {/* Botón menú móvil */}
        {onMenuClick && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 h-10 w-10 lg:hidden"
            onClick={onMenuClick}
            aria-label="Abrir menú"
          >
            <Menu className="h-6 w-6" />
          </Button>
        )}

        {/* Logo/Título - visible en desktop */}
        <div className="hidden lg:block">
          <h1 className="text-lg font-semibold text-primary">{userInfo.clinicName}</h1>
        </div>

        {/* Spacer en móvil si hay botón menú; en desktop sin menú */}
        <div className={onMenuClick ? "flex-1 min-w-0" : "lg:hidden flex-1"} />

        {/* Acciones del usuario */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Toggle de tema */}
          <ThemeToggle />

          {/* Nombre de la institución y usuario */}
          <div className="hidden md:flex items-center gap-2 px-3 text-sm">
            <span className="text-muted-foreground">{userInfo.institutionName}</span>
          </div>

          {/* Botón de cerrar sesión */}
          <Form method="post" action={PATHS.logout}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="gap-2"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{userInfo.userName}</span>
            </Button>
          </Form>
        </div>
      </div>
    </header>
  );
}
