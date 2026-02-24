import { useLoaderData, Link, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Settings, Clock, CalendarOff } from "lucide-react";
import { PATHS } from "~/lib/constants";

export function ListadoGestionDisponibilidad() {
  const { doctors, byId } = useLoaderData<{
    doctors: Array<{
      id: string;
      firstName: string;
      lastName: string;
      attentionWindowStart: string | null;
      attentionWindowEnd: string | null;
    }>;
    byId: Record<string, { doctorId: string; unavailableCount: number; futureUnavailable: number }>;
  }>();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-7 w-7" />
          Gestión de disponibilidad
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure la ventana de atención y los días no laborables de cada profesional. Use &quot;Configurar&quot; para editar.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profesionales</CardTitle>
        </CardHeader>
        <CardContent>
          {doctors.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No hay médicos registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium">Médico</th>
                    <th className="text-left py-3 px-2 font-medium">Ventana de atención</th>
                    <th className="text-left py-3 px-2 font-medium">Días no laborables</th>
                    <th className="text-left py-3 px-2 w-28"></th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((d) => {
                    const info = byId[d.id];
                    const start = d.attentionWindowStart ? String(d.attentionWindowStart).slice(0, 5) : "—";
                    const end = d.attentionWindowEnd ? String(d.attentionWindowEnd).slice(0, 5) : "—";
                    return (
                      <tr
                        key={d.id}
                        role="button"
                        tabIndex={0}
                        className="border-b border-border/50 hover:bg-muted/30 cursor-pointer"
                        onClick={() => navigate(PATHS.medicoProfile(d.id))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            navigate(PATHS.medicoProfile(d.id));
                          }
                        }}
                      >
                        <td className="py-3 px-2 font-medium">{d.firstName} {d.lastName}</td>
                        <td className="py-3 px-2 flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {start} – {end}
                        </td>
                        <td className="py-3 px-2 flex items-center gap-1">
                          <CalendarOff className="h-4 w-4 text-muted-foreground" />
                          {info ? `${info.unavailableCount} días` : "0"} (próximos: {info?.futureUnavailable ?? 0})
                        </td>
                        <td className="py-3 px-2" onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={PATHS.medicoProfile(d.id)}>Configurar</Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
