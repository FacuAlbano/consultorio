import { useState, useEffect } from "react";

/**
 * Hook para detectar si una media query coincide
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Establecer el valor inicial
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    // Listener para cambios
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Agregar listener (usar addEventListener si está disponible, sino addListener)
    if (media.addEventListener) {
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    } else {
      // Fallback para navegadores antiguos
      media.addListener(listener);
      return () => media.removeListener(listener);
    }
  }, [matches, query]);

  return matches;
}
