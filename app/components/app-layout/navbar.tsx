import { Menu, LogOut, Video, MessageSquare, HelpCircle } from "lucide-react";
import { Form } from "react-router";
import { PATHS } from "~/lib/constants";
import { Button } from "~/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import type { UserInfo } from "~/lib/user-info";

interface NavbarProps {
  onMenuClick: () => void;
  userInfo: UserInfo;
}

export function Navbar({ onMenuClick, userInfo }: NavbarProps) {

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-header-bg text-header-foreground shadow-sm">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        {/* Botón de menú - visible en todos los tamaños */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo/Título - visible en desktop */}
        <div className="hidden lg:block ml-2">
          <h1 className="text-lg font-semibold text-primary">{userInfo.clinicName}</h1>
        </div>

        {/* Spacer para centrar en mobile */}
        <div className="lg:hidden flex-1" />

        {/* Acciones del usuario */}
        <div className="flex items-center gap-2">
          {/* Toggle de tema */}
          <ThemeToggle />

          {/* Tutoriales */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            title="Tutoriales"
            aria-label="Tutoriales"
          >
            <Video className="h-4 w-4" />
            <span className="hidden sm:inline">Tutoriales</span>
          </Button>

          {/* Comunicación */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            title="Comunicación con Digital Salud"
            aria-label="Comunicación"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Comunicación</span>
          </Button>

          {/* Acerca de */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            title="Acerca de"
            aria-label="Acerca de"
            onClick={() => {
              // TODO: Implementar modal de "Acerca de"
              alert("Digital Salud - Sistema de Gestión de Consultorio\nVersión 1.0.0");
            }}
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Ayuda</span>
          </Button>

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
