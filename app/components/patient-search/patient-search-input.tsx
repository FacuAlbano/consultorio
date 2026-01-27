import { useState, useEffect } from "react";
import { Search, Loader2, Clock, X } from "lucide-react";
import { useNavigate } from "react-router";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

interface PatientSearchInputProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onPatientSelect?: (patientId: string) => void;
  className?: string;
  showHistory?: boolean;
  showFilters?: boolean;
}

const SEARCH_HISTORY_KEY = "patient_search_history";
const MAX_HISTORY_ITEMS = 5;

interface PatientSuggestion {
  id: string;
  label: string;
  documentNumber: string;
  medicalRecordNumber?: string | null;
  insuranceCompany?: string | null;
  fullInfo: string;
}

/**
 * Componente de búsqueda de pacientes con autocompletado
 * Permite buscar pacientes por nombre, documento, HC u obra social
 */
// Funciones para manejar historial de búsquedas
function getSearchHistory(): PatientSuggestion[] {
  if (typeof window === "undefined") return [];
  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
}

function saveToSearchHistory(patient: PatientSuggestion) {
  if (typeof window === "undefined") return;
  try {
    const history = getSearchHistory();
    // Remover si ya existe
    const filtered = history.filter((p) => p.id !== patient.id);
    // Agregar al inicio
    const updated = [patient, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Ignorar errores de localStorage
  }
}

function clearSearchHistory() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch {
    // Ignorar errores
  }
}

export function PatientSearchInput({
  placeholder = "Haz tu búsqueda por paciente...",
  onSearch,
  onPatientSelect,
  className = "",
  showHistory = true,
  showFilters = true,
}: PatientSearchInputProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<PatientSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<PatientSuggestion[]>([]);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "name" | "document" | "hc" | "insurance">("all");
  const navigate = useNavigate();

  // Cargar historial al montar
  useEffect(() => {
    if (showHistory) {
      setSearchHistory(getSearchHistory());
    }
  }, [showHistory]);

  // Búsqueda real en la base de datos
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // AbortController para cancelar peticiones anteriores
    const abortController = new AbortController();

    // Debounce para búsqueda
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      
      try {
        // Agregar filtro si está seleccionado
        const filterParam = filterType !== "all" ? `&filter=${filterType}` : "";
        const response = await fetch(
          `/api/patients/search?q=${encodeURIComponent(query)}${filterParam}`,
          { signal: abortController.signal }
        );
        
        // Verificar si la petición fue abortada
        if (abortController.signal.aborted) {
          return;
        }
        
        // Verificar si la respuesta es exitosa antes de parsear JSON
        if (!response.ok) {
          throw new Error(`Error en la búsqueda: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setSuggestions(data.patients || []);
        setShowSuggestions(true);
      } catch (error) {
        // Ignorar errores de abort
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error("Error al buscar pacientes:", error);
        setSuggestions([]);
      } finally {
        // Solo actualizar el estado si la petición no fue abortada
        if (!abortController.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [query, filterType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch?.(query);
      // Si hay una sugerencia exacta, seleccionarla
      const exactMatch = suggestions.find(
        (s) => s.fullInfo.toLowerCase() === query.toLowerCase()
      );
      if (exactMatch) {
        handlePatientSelect(exactMatch);
      } else {
        // Navegar a resultados de búsqueda
        navigate(`/listados/pacientes?q=${encodeURIComponent(query)}`);
      }
    }
  };

  const handlePatientSelect = (patient: PatientSuggestion) => {
    setQuery(patient.fullInfo);
    setShowSuggestions(false);
    onPatientSelect?.(patient.id);
    // Guardar en historial de búsquedas
    saveToSearchHistory(patient);
    // Navegar al perfil del paciente
    navigate(`/pacientes/${patient.id}`);
  };

  const handleSuggestionClick = (patient: PatientSuggestion) => {
    handlePatientSelect(patient);
  };

  const handleHistoryClick = (patient: PatientSuggestion) => {
    handlePatientSelect(patient);
    setShowHistoryDropdown(false);
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setSearchHistory([]);
  };

  return (
    <div className={`relative w-full max-w-2xl ${className}`}>
      {/* Filtros avanzados */}
      {showFilters && (
        <div className="mb-2 flex gap-2 flex-wrap">
          {[
            { value: "all", label: "Todos" },
            { value: "name", label: "Nombre" },
            { value: "document", label: "Documento" },
            { value: "hc", label: "HC" },
            { value: "insurance", label: "Obra Social" },
          ].map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setFilterType(filter.value as typeof filterType)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filterType === filter.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (query.length >= 2) {
                setShowSuggestions(true);
              } else if (showHistory && searchHistory.length > 0) {
                setShowHistoryDropdown(true);
              }
            }}
            onBlur={() => {
              // Delay para permitir clicks en sugerencias
              setTimeout(() => {
                setShowSuggestions(false);
                setShowHistoryDropdown(false);
              }, 200);
            }}
            placeholder={placeholder}
            className="pl-12 pr-12 h-14 text-lg bg-background/95 backdrop-blur-sm border-2 border-border focus:border-primary shadow-lg"
          />
          {isSearching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
          )}
        </div>
      </form>

      {/* Historial de búsquedas */}
      {showHistory && showHistoryDropdown && searchHistory.length > 0 && query.length < 2 && (
        <div className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Búsquedas recientes</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearHistory}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Limpiar
            </Button>
          </div>
          {searchHistory.map((patient) => (
            <button
              key={patient.id}
              type="button"
              onClick={() => handleHistoryClick(patient)}
              className="w-full px-4 py-3 text-left hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <div className="font-medium text-foreground">{patient.label}</div>
              <div className="text-sm text-muted-foreground">
                DNI: {patient.documentNumber}
                {patient.medicalRecordNumber && ` • HC: ${patient.medicalRecordNumber}`}
                {patient.insuranceCompany && ` • ${patient.insuranceCompany}`}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Dropdown de sugerencias */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((patient) => (
            <button
              key={patient.id}
              type="button"
              onClick={() => handleSuggestionClick(patient)}
              className="w-full px-4 py-3 text-left hover:bg-accent hover:text-accent-foreground transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              <div className="font-medium text-foreground">{patient.label}</div>
              <div className="text-sm text-muted-foreground">
                DNI: {patient.documentNumber}
                {patient.medicalRecordNumber && ` • HC: ${patient.medicalRecordNumber}`}
                {patient.insuranceCompany && ` • ${patient.insuranceCompany}`}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Mensaje cuando no hay resultados */}
      {showSuggestions && query.length >= 2 && suggestions.length === 0 && !isSearching && (
        <div className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-lg shadow-lg p-4 text-center text-muted-foreground">
          No se encontraron resultados
        </div>
      )}
    </div>
  );
}
