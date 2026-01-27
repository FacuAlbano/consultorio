import { useState } from "react";
import { Link, useLocation } from "react-router";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  FileText,
  Menu,
  ChevronRight
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
    icon: Users,
    path: "/medicos",
    children: [
      { label: "Pool de Atención", path: "/medicos/pool" },
      { label: "Atender sin Turno", path: "/medicos/atender" },
    ],
  },
  {
    label: "Administración de Recursos",
    icon: Settings,
    path: "/administracion",
    children: [
      {
        label: "Recursos para Generación de Agenda",
        children: [
          { label: "Asignación de Consultorio", path: "/administracion/agenda/consultorio", badge: "nuevo" },
          { label: "Días no Laborables", path: "/administracion/agenda/dias-no-laborables" },
          { label: "Solicitar Tipo de Turno", path: "/administracion/agenda/solicitar-turno" },
        ],
      },
      {
        label: "Recursos para la Página Web",
        children: [
          { label: "Datos de Institución", path: "/administracion/web/institucion" },
          { label: "Tipos de Turnos de la Institución", path: "/administracion/web/tipos-turnos" },
        ],
      },
      {
        label: "Recursos para Registro de Pacientes",
        children: [
          { label: "Obras Sociales de la Institución", path: "/administracion/pacientes/obras-sociales" },
          { label: "Solicitar Obra Social", path: "/administracion/pacientes/solicitar-obra-social" },
        ],
      },
      {
        label: "Recursos para Médicos",
        children: [
          { label: "Datos Personales", path: "/administracion/medicos/datos-personales" },
          { label: "Días no Laborables como Profesional", path: "/administracion/medicos/dias-no-laborables", badge: "nuevo" },
          { label: "Foto", path: "/administracion/medicos/foto" },
          { label: "Plantilla de Atención", path: "/administracion/medicos/plantilla", badge: "nuevo" },
          { label: "Registrar Firma", path: "/administracion/medicos/firma" },
          { label: "Tipos de Turnos Asociados al Profesional", path: "/administracion/medicos/tipos-turnos" },
          { label: "Ventana de Tiempo de Atención", path: "/administracion/medicos/ventana-tiempo" },
        ],
      },
    ],
  },
  {
    label: "Listados",
    icon: FileText,
    path: "/listados",
    children: [
      { label: "Control Institucional", path: "/listados/control" },
      { label: "Agenda del Profesional", path: "/listados/agenda" },
      { label: "Facturación de Turnos Médicos", path: "/listados/facturacion" },
      { label: "Turnos de la Institución", path: "/listados/turnos" },
      { label: "Pacientes", path: "/listados/pacientes" },
      { label: "Pacientes Atendidos", path: "/listados/pacientes-atendidos" },
      { label: "Pacientes Atendidos por OS", path: "/listados/pacientes-os" },
      { label: "Pacientes NO Atendidos", path: "/listados/pacientes-no-atendidos" },
      { label: "Turnos Anulados", path: "/listados/turnos-anulados", badge: "NUEVO" },
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
        "flex items-center border-b border-sidebar-border transition-all",
        isOpen ? "justify-between px-4 py-4" : "justify-center px-2 py-4"
      )}>
        {isOpen && (
          <h2 className="text-xl font-bold text-sidebar-foreground">{userInfo.clinicName}</h2>
        )}
        <button
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
        "flex-1 py-4 space-y-1 overflow-y-auto transition-all",
        isOpen ? "px-2" : "px-1"
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

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const hasSubChildren = hasChildren && item.children!.some((child) => child.children);
    const isExpanded = expandedItems.includes(item.path || item.label);
    const active = isActive(item.path);

    // Cuando está cerrada, solo mostrar iconos
    if (!isOpen) {
      if (item.path) {
        return (
          <Link
            key={item.path || item.label}
            to={item.path}
            className={cn(
              "flex items-center justify-center p-2 rounded-lg transition-colors relative group",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
            title={item.label}
          >
            {item.icon && <item.icon className="h-5 w-5" />}
            {/* Tooltip cuando está cerrada */}
            {!isOpen && (
              <span className="absolute left-full ml-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[100] transition-opacity">
                {item.label}
              </span>
            )}
          </Link>
        );
      }
      // Si no tiene path pero tiene icono, mostrar el icono
      if (item.icon) {
        return (
          <div
            key={item.path || item.label}
            className="flex items-center justify-center p-2 rounded-lg text-sidebar-foreground/60"
            title={item.label}
          >
            <item.icon className="h-5 w-5" />
          </div>
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
      // Item con children directos (2 niveles)
      return (
        <div key={item.path || item.label}>
          <div
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {item.icon && <item.icon className="h-5 w-5 flex-shrink-0" />}
              {item.path ? (
                <Link 
                  to={item.path} 
                  className="flex-1 text-left truncate"
                  onClick={(e) => {
                    // Si se hace click en el link, no expandir/colapsar
                    e.stopPropagation();
                  }}
                >
                  {item.label}
                </Link>
              ) : (
                <span className="flex-1">{item.label}</span>
              )}
            </div>
            <button
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

    // Item sin children (hoja)
    return (
      <div key={item.path || item.label}>
        {item.path ? (
          <Link
            to={item.path}
            className={cn(
              "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
              isActive(item.path)
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              {item.icon && <item.icon className="h-5 w-5" />}
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <span className="text-xs bg-sidebar-primary text-sidebar-primary-foreground px-2 py-0.5 rounded">
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
        "bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out flex-shrink-0",
        isOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex flex-col h-full overflow-y-auto">
        <SidebarContent userInfo={userInfo} isOpen={isOpen} onToggle={onToggle}>
          {menuItems.map((item) => renderMenuItem(item))}
        </SidebarContent>
      </div>
    </aside>
  );
}
