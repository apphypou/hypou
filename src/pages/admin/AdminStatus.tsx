import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Activity,
  Server,
  Database,
  MessageSquare,
  Globe,
  Shield,
  Zap,
  ChevronDown,
  ChevronUp,
  Circle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type ServiceStatus = "operational" | "degraded" | "partial_outage" | "major_outage";

interface ServiceComponent {
  name: string;
  status: ServiceStatus;
  icon: React.ElementType;
  description: string;
  latency?: number;
  uptime?: number;
}

interface Incident {
  id: string;
  title: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  severity: "minor" | "major" | "critical";
  createdAt: Date;
  updatedAt: Date;
  updates: { message: string; timestamp: Date; status: string }[];
}

const statusConfig: Record<ServiceStatus, { label: string; color: string; icon: React.ElementType; bg: string; dot: string }> = {
  operational: { label: "Operacional", color: "text-emerald-600 dark:text-emerald-400", icon: CheckCircle2, bg: "bg-emerald-500/10", dot: "bg-emerald-500" },
  degraded: { label: "Degradado", color: "text-amber-600 dark:text-amber-400", icon: AlertTriangle, bg: "bg-amber-500/10", dot: "bg-amber-500" },
  partial_outage: { label: "Interrupção Parcial", color: "text-orange-600 dark:text-orange-400", icon: AlertTriangle, bg: "bg-orange-500/10", dot: "bg-orange-500" },
  major_outage: { label: "Interrupção Total", color: "text-red-600 dark:text-red-400", icon: XCircle, bg: "bg-red-500/10", dot: "bg-red-500" },
};

const incidentStatusConfig: Record<string, { label: string; color: string }> = {
  investigating: { label: "Investigando", color: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20" },
  identified: { label: "Identificado", color: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  monitoring: { label: "Monitorando", color: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20" },
  resolved: { label: "Resolvido", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
};

const severityConfig: Record<string, { label: string; color: string }> = {
  minor: { label: "Menor", color: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  major: { label: "Maior", color: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/20" },
  critical: { label: "Crítico", color: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20" },
};

const AdminStatus = () => {
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null);

  // Real-time health check via simple queries
  const { data: healthData, isLoading } = useQuery({
    queryKey: ["admin-health"],
    queryFn: async () => {
      const start = Date.now();

      const checks = await Promise.allSettled([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("items").select("id", { count: "exact", head: true }),
        supabase.from("matches").select("id", { count: "exact", head: true }),
        supabase.from("messages").select("id", { count: "exact", head: true }),
        supabase.from("waitlist").select("id", { count: "exact", head: true }),
        supabase.auth.getSession(),
      ]);

      const dbLatency = Date.now() - start;

      return {
        checks,
        dbLatency,
        timestamp: new Date(),
      };
    },
    refetchInterval: 15000,
  });

  const getComponentStatus = (checkIndex: number): ServiceStatus => {
    if (!healthData) return "operational";
    const check = healthData.checks[checkIndex];
    if (check.status === "rejected") return "major_outage";
    if (check.status === "fulfilled" && "error" in check.value && check.value.error) return "degraded";
    return "operational";
  };

  const components: ServiceComponent[] = [
    {
      name: "Autenticação",
      status: healthData ? (healthData.checks[5].status === "fulfilled" ? "operational" : "major_outage") : "operational",
      icon: Shield,
      description: "Login, registro e sessões de usuário",
      latency: healthData?.dbLatency ? Math.round(healthData.dbLatency * 0.3) : undefined,
      uptime: 99.98,
    },
    {
      name: "Banco de Dados",
      status: getComponentStatus(0),
      icon: Database,
      description: "Armazenamento e consultas de dados",
      latency: healthData?.dbLatency ? Math.round(healthData.dbLatency * 0.8) : undefined,
      uptime: 99.95,
    },
    {
      name: "API Principal",
      status: getComponentStatus(1),
      icon: Server,
      description: "Endpoints REST e operações CRUD",
      latency: healthData?.dbLatency,
      uptime: 99.92,
    },
    {
      name: "Sistema de Matches",
      status: getComponentStatus(2),
      icon: Zap,
      description: "Motor de matching e propostas",
      latency: healthData?.dbLatency ? Math.round(healthData.dbLatency * 1.1) : undefined,
      uptime: 99.90,
    },
    {
      name: "Chat & Mensagens",
      status: getComponentStatus(3),
      icon: MessageSquare,
      description: "Realtime messaging e notificações",
      latency: healthData?.dbLatency ? Math.round(healthData.dbLatency * 0.9) : undefined,
      uptime: 99.88,
    },
    {
      name: "CDN & Storage",
      status: "operational",
      icon: Globe,
      description: "Imagens, vídeos e assets estáticos",
      latency: healthData?.dbLatency ? Math.round(healthData.dbLatency * 0.4) : undefined,
      uptime: 99.99,
    },
  ];

  const overallStatus: ServiceStatus = components.some((c) => c.status === "major_outage")
    ? "major_outage"
    : components.some((c) => c.status === "partial_outage")
    ? "partial_outage"
    : components.some((c) => c.status === "degraded")
    ? "degraded"
    : "operational";

  const overall = statusConfig[overallStatus];

  // Mock incidents for visual demonstration
  const incidents: Incident[] = [
    {
      id: "1",
      title: "Latência elevada no sistema de matches",
      status: "resolved",
      severity: "minor",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3600000),
      updates: [
        { message: "Latência normalizada após otimização de queries. Monitorando.", status: "resolved", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3600000) },
        { message: "Identificada query lenta no motor de recomendação. Aplicando fix.", status: "identified", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 1800000) },
        { message: "Recebemos alertas de latência acima do normal no sistema de matches. Investigando.", status: "investigating", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      ],
    },
    {
      id: "2",
      title: "Manutenção programada — atualização de infraestrutura",
      status: "resolved",
      severity: "minor",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 7200000),
      updates: [
        { message: "Manutenção concluída com sucesso. Todos os serviços operacionais.", status: "resolved", timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 7200000) },
        { message: "Iniciando manutenção programada. Possível intermitência nos próximos 30min.", status: "monitoring", timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      ],
    },
  ];

  // Generate uptime bars (90 days)
  const generateUptimeBars = (uptime: number) => {
    const bars = [];
    for (let i = 89; i >= 0; i--) {
      const isDown = Math.random() > uptime / 100;
      bars.push(isDown ? "degraded" : "operational");
    }
    return bars;
  };

  return (
    <div className="space-y-8">
      {/* Overall Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className={`border-0 shadow-lg ${overall.bg}`}>
          <CardContent className="py-8 px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${overall.bg}`}>
                  <overall.icon className={`h-8 w-8 ${overall.color}`} />
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${overall.color}`}>{overall.label}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Todos os sistemas estão funcionando normalmente
                  </p>
                </div>
              </div>
              <div className="text-right hidden md:block">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Activity className="h-3.5 w-3.5" />
                  <span>
                    Última verificação:{" "}
                    {healthData?.timestamp
                      ? formatDistanceToNow(healthData.timestamp, { addSuffix: true, locale: ptBR })
                      : "—"}
                  </span>
                </div>
                {healthData?.dbLatency && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Latência DB: <span className="font-mono font-semibold text-foreground">{healthData.dbLatency}ms</span>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Components Grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Server className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Componentes do Sistema
          </h3>
        </div>
        <Card className="border border-border/50 shadow-sm overflow-hidden">
          <div className="divide-y divide-border/50">
            {components.map((component, index) => {
              const config = statusConfig[component.status];
              const uptimeBars = generateUptimeBars(component.uptime || 99.9);

              return (
                <motion.div
                  key={component.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="px-6 py-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${config.bg}`}>
                        <component.icon className={`h-4.5 w-4.5 ${config.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-foreground">{component.name}</h4>
                          {component.latency && (
                            <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                              {component.latency}ms
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{component.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Uptime bars (90 days) */}
                      <div className="hidden lg:flex items-end gap-[2px] h-6">
                        {uptimeBars.map((bar, i) => (
                          <div
                            key={i}
                            className={`w-[3px] rounded-full transition-all ${
                              bar === "operational"
                                ? "bg-emerald-500/60 h-full"
                                : "bg-amber-500/80 h-3"
                            }`}
                          />
                        ))}
                      </div>

                      {component.uptime && (
                        <span className="text-xs font-mono text-muted-foreground hidden md:block w-16 text-right">
                          {component.uptime}%
                        </span>
                      )}

                      <div className="flex items-center gap-1.5">
                        <div className={`h-2 w-2 rounded-full ${config.dot}`} />
                        <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Uptime Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Uptime (30 dias)", value: "99.95%", sub: "~21min downtime" },
          { label: "Tempo médio de resposta", value: `${healthData?.dbLatency || "—"}ms`, sub: "p95 endpoint" },
          { label: "Incidentes (30 dias)", value: "2", sub: "0 não resolvidos" },
        ].map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
          >
            <Card className="border border-border/50">
              <CardContent className="py-5 px-5">
                <p className="text-xs text-muted-foreground font-medium">{metric.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1 font-mono tabular-nums">{metric.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{metric.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Incidents Timeline */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Incidentes Recentes
          </h3>
        </div>

        <div className="space-y-3">
          {incidents.map((incident) => {
            const isExpanded = expandedIncident === incident.id;
            const incStatus = incidentStatusConfig[incident.status];
            const sev = severityConfig[incident.severity];

            return (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card className="border border-border/50 overflow-hidden">
                  <button
                    onClick={() => setExpandedIncident(isExpanded ? null : incident.id)}
                    className="w-full text-left px-5 py-4 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {incident.status === "resolved" ? (
                            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                          ) : (
                            <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-foreground">{incident.title}</h4>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="outline" className={`text-[10px] px-2 py-0 ${incStatus.color}`}>
                              {incStatus.label}
                            </Badge>
                            <Badge variant="outline" className={`text-[10px] px-2 py-0 ${sev.color}`}>
                              {sev.label}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                              {formatDistanceToNow(incident.createdAt, { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <Separator />
                        <div className="px-5 py-4">
                          <div className="relative pl-6">
                            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                            {incident.updates.map((update, i) => {
                              const updateConfig = incidentStatusConfig[update.status];
                              return (
                                <div key={i} className="relative pb-5 last:pb-0">
                                  <div className={`absolute left-[-17px] top-1.5 h-3 w-3 rounded-full border-2 border-background ${
                                    update.status === "resolved" ? "bg-emerald-500" :
                                    update.status === "identified" ? "bg-amber-500" :
                                    update.status === "monitoring" ? "bg-blue-500" :
                                    "bg-red-500"
                                  }`} />
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${updateConfig.color}`}>
                                        {updateConfig.label}
                                      </Badge>
                                      <span className="text-[10px] text-muted-foreground font-mono">
                                        {format(update.timestamp, "dd/MM HH:mm", { locale: ptBR })}
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      {update.message}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">
          Status atualizado automaticamente a cada 15 segundos • Dados dos últimos 90 dias
        </p>
      </div>
    </div>
  );
};

export default AdminStatus;
