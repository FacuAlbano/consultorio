import { Moon, Sun } from "lucide-react";
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const fetcher = useFetcher();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Detectar tema inicial
    const html = document.documentElement;
    const isDark = html.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);

    // Actualizar clase en el HTML
    const html = document.documentElement;
    if (newTheme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }

    // Guardar en cookie
    fetcher.submit(
      { theme: newTheme },
      { method: "post", action: "/api/theme" }
    );
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="gap-2"
      aria-label={`Cambiar a tema ${theme === "light" ? "oscuro" : "claro"}`}
    >
      {theme === "dark" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">
        {theme === "dark" ? "Oscuro" : "Claro"}
      </span>
    </Button>
  );
}
