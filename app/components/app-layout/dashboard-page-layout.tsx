import { useState } from "react";
import { Outlet } from "react-router";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import type { UserInfo } from "~/lib/user-info";

interface DashboardPageLayoutProps {
  userInfo: UserInfo;
}

/**
 * Layout principal del dashboard con sidebar y navbar responsive
 */
export function DashboardPageLayout({ userInfo }: DashboardPageLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Abierta por defecto

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Siempre visible, colapsable */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        userInfo={userInfo}
      />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar */}
        <Navbar 
          userInfo={userInfo}
        />

        {/* Contenido de la página */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
