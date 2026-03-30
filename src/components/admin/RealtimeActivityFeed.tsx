import { useRealtimeActivity, ActivityEvent } from "@/hooks/useRealtimeActivity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Users, Package, Handshake, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const typeConfig: Record<ActivityEvent["type"], { icon: typeof Activity; color: string }> = {
  user: { icon: Users, color: "bg-blue-500/10 text-blue-600" },
  item: { icon: Package, color: "bg-green-500/10 text-green-600" },
  match: { icon: Handshake, color: "bg-amber-500/10 text-amber-600" },
  message: { icon: MessageSquare, color: "bg-purple-500/10 text-purple-600" },
};

export function RealtimeActivityFeed() {
  const events = useRealtimeActivity();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Atividade em Tempo Real
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            Aguardando atividade...
          </p>
        ) : (
          events.map((event) => {
            const config = typeConfig[event.type];
            const Icon = config.icon;
            return (
              <div
                key={event.id}
                className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0"
              >
                <div className={`rounded-md p-1.5 ${config.color}`}>
                  <Icon className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">{event.description}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(event.timestamp), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {event.type}
                </Badge>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
