import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { useMediaQuery } from "~/hooks/use-media-query";
import type { UserInfo } from "~/lib/user-info";
import { cn } from "~/lib/utils";

interface DashboardPageLayoutProps {
  userInfo: UserInfo;
}

/**
 * Layout principal del dashboard con sidebar y navbar responsive.
 * En móvil: sidebar como drawer (overlay), botón menú en navbar.
 */
export function DashboardPageLayout({ userInfo }: DashboardPageLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 1023px)"); // lg = 1024px
  const location = useLocation();

  // Cerrar drawer en móvil al navegar (p. ej. al tocar un Link del sidebar)
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile, location.pathname]);

  const handleSidebarToggle = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="h-screen min-h-screen bg-background flex overflow-hidden">
      {/* Backdrop móvil cuando el drawer está abierto */}
      {isMobile && (
        <button
          type="button"
          onClick={handleCloseSidebar}
          className={cn(
            "fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden",
            sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          aria-label="Cerrar menú"
          tabIndex={sidebarOpen ? 0 : -1}
        />
      )}

      {/* Sidebar: en móvil es drawer (fixed), en desktop en flujo */}
      <div
        className={cn(
          "flex flex-col h-screen flex-shrink-0 transition-all duration-300 ease-out",
          isMobile && "fixed left-0 top-0 z-50 w-[min(280px,85vw)] transform shadow-xl",
          isMobile && !sidebarOpen && "-translate-x-full"
        )}
      >
        <Sidebar
          isOpen={isMobile ? true : sidebarOpen}
          onToggle={isMobile ? handleCloseSidebar : handleSidebarToggle}
          userInfo={userInfo}
          fullWidth={isMobile}
        />
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          userInfo={userInfo}
          onMenuClick={isMobile ? () => setSidebarOpen(true) : undefined}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
