import { useState } from "react";
import { Link, useLocation } from "react-router";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  FileText,
  Menu,
  ChevronRight,
  Stethoscope,
  UserPlus,
  ClipboardList,
  Calendar
} from "lucide-react";
import { PATHS } from "~/lib/constants";
import { cn } from "~/lib/utils";
import type { UserInfo } from "~/lib/user-info";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  userInfo: UserInfo;
}

interface MenuItem {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  path?: string;
  children?: MenuItem[];
  badge?: string;
}

const menuItems: MenuItem[] = [
  {
    label: "Inicio",
    icon: LayoutDashboard,
    path: PATHS.dashboard,
  },
  {
    label: "Médicos",
    icon: Stethoscope,
    path: PATHS.medicos,
    children: [
      { label: "Pool de Atención", path: PATHS.poolAtencion, icon: Stethoscope },
      { label: "Atender sin Turno", path: PATHS.atenderSinTurno, icon: UserPlus },
      { label: "Gestión de Médicos", path: PATHS.medicos, icon: Users },
    ],
  },
  {
    label: "Agenda",
    icon: Calendar,
    path: PATHS.agenda,
    children: [
      { label: "Agenda de Turnos", path: PATHS.agenda },
      { label: "Crear Agenda Propia", path: PATHS.agendaCrear },
      { label: "Editar Agenda", path: PATHS.agendaEditarBloques },
      { label: "Eliminar Agenda", path: PATHS.agendaEliminar },
    ],
  },
  {
    label: "Administración de Recursos",
    icon: Settings,
    path: PATHS.administracion.consultorio,
    children: [
      {
        label: "Recursos para Generación de Agenda",
        children: [
          { label: "Asignación de Consultorio", path: PATHS.administracion.consultorio },
          { label: "Días no Laborables", path: PATHS.administracion.diasNoLaborables },
          { label: "Solicitar Tipo de Turno", path: PATHS.administracion.solicitarTurno },
        ],
      },
      {
        label: "Recursos para la Página Web",
        children: [
          { label: "Datos de Institución", path: PATHS.administracion.institucion },
          { label: "Tipos de Turnos de la Institución", path: PATHS.administracion.tiposTurnos },
        ],
      },
      {
        label: "Recursos para Registro de Pacientes",
        children: [
          { label: "Obras Sociales de la Institución", path: PATHS.administracion.obrasSociales },
          { label: "Solicitar Obra Social", path: PATHS.administracion.solicitarObraSocial },
        ],
      },
    ],
  },
  {
    label: "Historia Clínica",
    icon: ClipboardList,
    path: PATHS.historiaClinica,
  },
  {
    label: "Listados",
    icon: FileText,
    children: [
      { label: "Control Institucional", path: PATHS.listadosControl },
      { label: "Agenda del Profesional", path: PATHS.listadosAgenda },
      { label: "Gestión de disponibilidad", path: PATHS.listadosGestionDisponibilidad },
      { label: "Turnos de la Institución", path: PATHS.listadosTurnos },
      { label: "Pacientes", path: PATHS.listadosPacientes },
      { label: "Pacientes Atendidos", path: PATHS.listadosPacientesAtendidos },
      { label: "Pacientes Atendidos por OS", path: PATHS.listadosPacientesOS },
      { label: "Pacientes NO Atendidos", path: PATHS.listadosPacientesNoAtendidos },
      { label: "Turnos Anulados", path: PATHS.listadosTurnosAnulados },
    ],
  },
];

interface SidebarContentProps {
  userInfo: UserInfo;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

/**
 * Componente de contenido del sidebar extraído para evitar remontajes
 * cuando cambian los estados de expansión del menú
 */
function SidebarContent({ userInfo, isOpen, onToggle, children }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      <div className={cn(
        "flex items-center border-b border-sidebar-border transition-all shrink-0 h-14",
        isOpen ? "justify-between px-4" : "justify-center px-2"
      )}>
        {isOpen && (
          <h2 className="text-base font-bold text-sidebar-foreground truncate">{userInfo.clinicName}</h2>
        )}
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors",
            !isOpen && "mx-auto"
          )}
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
      <nav className={cn(
        "flex-1 py-4 space-y-1 transition-all min-h-0",
        isOpen ? "px-2 overflow-y-auto" : "px-1 overflow-hidden"
      )}>
        {children}
      </nav>
    </div>
  );
}

export function Sidebar({ isOpen, onToggle, userInfo }: SidebarProps) {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [expandedSubItems, setExpandedSubItems] = useState<string[]>([]);

  const toggleExpand = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path)
        ? prev.filter((p) => p !== path)
        : [...prev, path]
    );
  };

  const toggleSubExpand = (label: string) => {
    setExpandedSubItems((prev) =>
      prev.includes(label)
        ? prev.filter((l) => l !== label)
        : [...prev, label]
    );
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const isAnyChildActive = (item: MenuItem): boolean => {
    if (!item.children) return false;
    
    for (const child of item.children) {
      if (child.path && isActive(child.path)) return true;
      if (isAnyChildActive(child)) return true;
    }
    
    return false;
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const hasSubChildren = hasChildren && item.children!.some((child) => child.children);
    const isExpanded = expandedItems.includes(item.path || item.label);
    const active = isActive(item.path) || isAnyChildActive(item);

    // Cuando está cerrada: solo iconos, todos con el mismo estilo (como sunshine-v2)
    if (!isOpen) {
      if (item.path) {
        return (
          <Link
            key={item.path || item.label}
            to={item.path}
            className={cn(
              "flex items-center justify-center p-2 rounded-lg transition-colors relative group",
              "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              active && "text-sidebar-primary"
            )}
            title={item.label}
          >
            {item.icon && <item.icon className="h-5 w-5" />}
            <span className="absolute left-full ml-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[100] transition-opacity">
              {item.label}
            </span>
          </Link>
        );
      }
      if (item.icon) {
        return (
          <button
            type="button"
            key={item.path || item.label}
            onClick={onToggle}
            className={cn(
              "flex items-center justify-center p-2 rounded-lg transition-colors relative group w-full",
              "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              active && "text-sidebar-primary"
            )}
            title={item.label}
          >
            <item.icon className="h-5 w-5" />
            <span className="absolute left-full ml-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[100] transition-opacity">
              {item.label}
            </span>
          </button>
        );
      }
      return null;
    }

    // Cuando está abierta, mostrar contenido completo
    if (hasSubChildren) {
      // Item con submenús anidados (3 niveles)
      const subExpanded = expandedSubItems.includes(item.label);

      return (
        <div key={item.path || item.label}>
          <button
            type="button"
            onClick={() => toggleSubExpand(item.label)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
              level === 0 && "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              level === 1 && "text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
            )}
          >
            <div className="flex items-center gap-3">
              {item.icon && <item.icon className="h-5 w-5 flex-shrink-0" />}
              <span>{item.label}</span>
            </div>
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform",
                subExpanded && "rotate-90"
              )}
            />
          </button>
          {subExpanded && (
            <div className={cn("ml-4 mt-1 space-y-1", level === 0 && "border-l border-sidebar-border pl-2")}>
              {item.children!.map((child) => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    if (hasChildren) {
      // Item con children directos (2 niveles) — activo: barra lateral, sin bloque de fondo
      return (
        <div key={item.path || item.label} className="relative">
          {active && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-sidebar-primary rounded-r-full" aria-hidden />
          )}
          <div
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors relative",
              active ? "text-sidebar-primary" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {item.icon && <item.icon className="h-5 w-5 flex-shrink-0" />}
              {item.path ? (
                <Link 
                  to={item.path} 
                  className="flex-1 text-left truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.label}
                </Link>
              ) : (
                <span className="flex-1">{item.label}</span>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(item.path || item.label);
              }}
              className="ml-2 p-1 rounded hover:bg-sidebar-accent/50 flex-shrink-0"
              aria-label={isExpanded ? "Colapsar" : "Expandir"}
              aria-expanded={isExpanded}
            >
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-transform",
                  isExpanded && "rotate-90"
                )}
              />
            </button>
          </div>
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-2">
              {item.children!.map((child) => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    // Item sin children (hoja) — como sunshine: activo = barra izquierda + texto primary, sin bloque azul
    return (
      <div key={item.path || item.label} className="relative">
        {item.path ? (
          <Link
            to={item.path}
            className={cn(
              "flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 relative",
              isActive(item.path)
                ? "text-sidebar-primary bg-transparent"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            {isActive(item.path) && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-sidebar-primary rounded-r-full" aria-hidden />
            )}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {item.icon && <item.icon className="h-5 w-5 flex-shrink-0" />}
              <span className="truncate">{item.label}</span>
            </div>
            {item.badge && (
              <span className="text-xs bg-sidebar-primary text-sidebar-primary-foreground px-2 py-0.5 rounded shrink-0">
                {item.badge}
              </span>
            )}
          </Link>
        ) : (
          <div className="px-3 py-2 text-sm text-sidebar-foreground/60">
            {item.label}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={cn(
        "bg-sidebar border-r border-sidebar-border shadow-md transition-all duration-300 ease-in-out flex-shrink-0 flex flex-col h-screen min-h-0 overflow-hidden",
        isOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex flex-col h-full min-h-0 min-w-0 overflow-hidden flex-1">
        <SidebarContent userInfo={userInfo} isOpen={isOpen} onToggle={onToggle}>
          {menuItems.map((item) => renderMenuItem(item))}
        </SidebarContent>
      </div>
    </aside>
  );
}
