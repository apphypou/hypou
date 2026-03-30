import { useRealtimeActivity, ActivityEvent } from "@/hooks/useRealtimeActivity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Users, Package, Handshake, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

const typeConfig: Record<ActivityEvent["type"], { icon: typeof Activity; color: string; dot: string }> = {
  user: { icon: Users, color: "bg-blue-500/10 text-blue-500", dot: "bg-blue-500" },
  item: { icon: Package, color: "bg-emerald-500/10 text-emerald-500", dot: "bg-emerald-500" },
  match: { icon: Handshake, color: "bg-amber-500/10 text-amber-500", dot: "bg-amber-500" },
  message: { icon: MessageSquare, color: "bg-purple-500/10 text-purple-500", dot: "bg-purple-500" },
};

export function RealtimeActivityFeed() {
  const events = useRealtimeActivity();

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          Atividade em Tempo Real
          <span className="relative flex h-2.5 w-2.5 ml-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[420px] overflow-y-auto">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-xs text-muted-foreground">Aguardando atividade...</p>
          </div>
        ) : (
          <div className="relative pl-6">
            {/* Timeline line */}
            <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />

            <AnimatePresence initial={false}>
              {events.map((event) => {
                const config = typeConfig[event.type];
                const Icon = config.icon;
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative flex items-start gap-3 pb-4 last:pb-0"
                  >
                    {/* Timeline dot */}
                    <div className={`absolute -left-6 top-1 h-[18px] w-[18px] rounded-full border-2 border-background flex items-center justify-center ${config.dot}`}>
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    </div>

                    <div className="flex-1 min-w-0 bg-muted/30 rounded-xl px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`rounded-md p-1 ${config.color}`}>
                            <Icon className="h-3 w-3" />
                          </div>
                          <p className="text-xs text-foreground truncate">{event.description}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0 rounded-full">
                          {event.type}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 pl-6">
                        {formatDistanceToNow(new Date(event.timestamp), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
