import { useLoaderData } from "react-router";
import type { Route } from "./+types/dashboard._index";
import { PatientSearchInput } from "~/components/patient-search/patient-search-input";
import { Card, CardContent } from "~/components/ui/card";
import { 
  Users, 
  Calendar, 
  UserPlus, 
  ClipboardList,
  Stethoscope,
  Activity
} from "lucide-react";
import { Link } from "react-router";
import { PATHS } from "~/lib/constants";

/**
 * Meta tags para la página de inicio
 */
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Clínica Pendino - Sistema de Gestión" },
    { name: "description", content: "Sistema de gestión de consultorio médico" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  // TODO: Agregar estadísticas cuando tengamos datos
  return {
    // Estadísticas opcionales para el futuro
    stats: {
      turnosHoy: 0,
      pacientesPendientes: 0,
    },
  };
}

/**
 * Componente de la página principal del sistema
 * Incluye buscador de pacientes, accesos rápidos y estadísticas
 */
export default function Index() {
  const { stats } = useLoaderData<typeof loader>();

  const quickActions = [
    {
      title: "Pool de Atención",
      description: "Ver turnos del día",
      icon: ClipboardList,
      href: "/medicos/pool",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "Atender sin Turno",
      description: "Atención sin cita previa",
      icon: UserPlus,
      href: "/medicos/atender",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "Gestión de Pacientes",
      description: "Administrar pacientes",
      icon: Users,
      href: "/listados/pacientes",
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      title: "Calendario",
      description: "Ver agenda completa",
      icon: Calendar,
      href: "/listados/agenda",
      color: "bg-orange-500 hover:bg-orange-600",
    },
  ];

  const handleSearch = (query: string) => {
    // TODO: Implementar navegación a resultados de búsqueda
    console.log("Buscando:", query);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 md:p-8">
      {/* Imagen de fondo con estetoscopio y elementos médicos */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10">
            <Stethoscope className="h-32 w-32 text-primary rotate-12" />
          </div>
          <div className="absolute bottom-20 right-10">
            <Activity className="h-24 w-24 text-primary -rotate-12" />
          </div>
          <div className="absolute top-1/2 left-1/4">
            <ClipboardList className="h-20 w-20 text-primary rotate-45" />
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 w-full max-w-6xl space-y-12">
        {/* Título principal */}
        <div className="text-center space-y-4">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-primary via-primary/90 to-primary bg-clip-text text-transparent drop-shadow-2xl">
            CLÍNICA
          </h1>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-primary drop-shadow-lg">
            PENDINO
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mt-4">
            Sistema de Gestión de Consultorio Médico
          </p>
        </div>

        {/* Buscador de pacientes */}
        <div className="flex justify-center">
          <PatientSearchInput
            onSearch={handleSearch}
            className="w-full"
          />
        </div>

        {/* Accesos rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                to={action.href}
                className="group"
              >
                <Card className="h-full transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 hover:border-primary">
                  <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                    <div className={`${action.color} p-4 rounded-full text-white transition-transform group-hover:scale-110`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        {action.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Estadísticas (opcional, cuando tengamos datos) */}
        {stats.turnosHoy > 0 || stats.pacientesPendientes > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Turnos del día</p>
                    <p className="text-3xl font-bold text-foreground">{stats.turnosHoy}</p>
                  </div>
                  <Calendar className="h-12 w-12 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pacientes pendientes</p>
                    <p className="text-3xl font-bold text-foreground">{stats.pacientesPendientes}</p>
                  </div>
                  <Users className="h-12 w-12 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}
