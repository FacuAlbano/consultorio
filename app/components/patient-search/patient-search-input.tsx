import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { useNavigate } from "react-router";
import { Input } from "~/components/ui/input";

interface PatientSearchInputProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onPatientSelect?: (patientId: string) => void;
  className?: string;
}

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
export function PatientSearchInput({
  placeholder = "Haz tu busqueda por paciente...",
  onSearch,
  onPatientSelect,
  className = "",
}: PatientSearchInputProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<PatientSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

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
        const response = await fetch(
          `/api/patients/search?q=${encodeURIComponent(query)}`,
          { signal: abortController.signal }
        );
        
        // Verificar si la petición fue abortada
        if (abortController.signal.aborted) {
          return;
        }
        
        if (!response.ok) {
          console.error("Error al buscar pacientes:", response.statusText);
          setSuggestions([]);
          return;
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
  }, [query]);

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
    // TODO: Navegar al perfil del paciente cuando esté implementado
    // navigate(`/pacientes/${patient.id}`);
  };

  const handleSuggestionClick = (patient: PatientSuggestion) => {
    handlePatientSelect(patient);
  };

  return (
    <div className={`relative w-full max-w-2xl ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setShowSuggestions(true)}
            onBlur={() => {
              // Delay para permitir clicks en sugerencias
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            placeholder={placeholder}
            className="pl-12 pr-12 h-14 text-lg bg-background/95 backdrop-blur-sm border-2 border-border focus:border-primary shadow-lg"
          />
          {isSearching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
          )}
        </div>
      </form>

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
