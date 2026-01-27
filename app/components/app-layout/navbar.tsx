import { Menu, LogOut, Video, MessageSquare, HelpCircle } from "lucide-react";
import { Form } from "react-router";
import { PATHS } from "~/lib/constants";
import { Button } from "~/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const submit = useSubmit();

  const handleLogout = () => {
    submit(null, { method: "post", action: PATHS.logout });
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-header-bg text-header-foreground shadow-sm">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        {/* Botón de menú mobile */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo/Título - solo visible en desktop cuando sidebar está visible */}
        <div className="hidden lg:block">
          <h1 className="text-lg font-semibold text-primary">Consultorio</h1>
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
            <span className="text-muted-foreground">Centro Médico Cardiovascular</span>
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
              <span className="hidden sm:inline">PENDINO LISANDRO</span>
            </Button>
          </Form>
        </div>
      </div>
    </header>
  );
}
