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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop siempre visible, Mobile con drawer */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        userInfo={userInfo}
      />

      {/* Overlay para mobile cuando sidebar está abierto */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Navbar */}
        <Navbar 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
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
