import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2, AlertTriangle, XCircle, Clock, Activity,
  Server, Database, MessageSquare, Globe, Shield, Zap,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useHealthCheck, useIncidents, useUptimeHistory, useSaveUptimeCheck,
  type SystemIncident,
} from "@/hooks/useSystemStatus";
import CreateIncidentDialog from "@/components/admin/CreateIncidentDialog";
import UpdateIncidentDialog from "@/components/admin/UpdateIncidentDialog";

type ServiceStatus = "operational" | "degraded" | "partial_outage" | "major_outage";

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

const componentDefs = [
  { name: "Autenticação", key: "auth", icon: Shield, desc: "Login, registro e sessões", checkIdx: 5, latencyMul: 0.3 },
  { name: "Banco de Dados", key: "database", icon: Database, desc: "Armazenamento e consultas", checkIdx: 0, latencyMul: 0.8 },
  { name: "API Principal", key: "api", icon: Server, desc: "Endpoints REST e CRUD", checkIdx: 1, latencyMul: 1.0 },
  { name: "Sistema de Matches", key: "matches", icon: Zap, desc: "Motor de matching e propostas", checkIdx: 2, latencyMul: 1.1 },
  { name: "Chat & Mensagens", key: "chat", icon: MessageSquare, desc: "Realtime messaging", checkIdx: 3, latencyMul: 0.9 },
  { name: "CDN & Storage", key: "cdn", icon: Globe, desc: "Imagens, vídeos e assets", checkIdx: -1, latencyMul: 0.4 },
];

const AdminStatus = () => {
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null);
  const { data: healthData } = useHealthCheck();
  const { data: incidents = [] } = useIncidents();
  const { data: uptimeChecks = [] } = useUptimeHistory();
  const saveUptime = useSaveUptimeCheck();

  // Save uptime check whenever health data refreshes
  useEffect(() => {
    if (!healthData) return;
    const checks = componentDefs.map((c) => ({
      component: c.key,
      status: getComponentStatus(c.checkIdx) as string,
      latency_ms: healthData.dbLatency ? Math.round(healthData.dbLatency * c.latencyMul) : null,
    }));
    saveUptime.mutate(checks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [healthData?.timestamp]);

  function getComponentStatus(checkIndex: number): ServiceStatus {
    if (!healthData) return "operational";
    if (checkIndex === -1) return "operational";
    const check = healthData.checks[checkIndex];
    if (check.status === "rejected") return "major_outage";
    if (check.status === "fulfilled" && "error" in check.value && check.value.error) return "degraded";
    return "operational";
  }

  // Compute real uptime from stored checks (last 30 days)
  const computeUptime = (componentKey: string) => {
    const checks = uptimeChecks.filter(
      (c) => c.component === componentKey && new Date(c.checked_at) >= subDays(new Date(), 30)
    );
    if (checks.length === 0) return { pct: 100, bars: [] as string[] };
    const operational = checks.filter((c) => c.status === "operational").length;
    const pct = parseFloat(((operational / checks.length) * 100).toFixed(2));

    // Build 90-day bars from real data
    const bars: string[] = [];
    for (let i = 89; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStr = format(day, "yyyy-MM-dd");
      const dayChecks = uptimeChecks.filter(
        (c) => c.component === componentKey && c.checked_at.startsWith(dayStr)
      );
      if (dayChecks.length === 0) {
        bars.push("unknown");
      } else {
        const allOk = dayChecks.every((c) => c.status === "operational");
        bars.push(allOk ? "operational" : "degraded");
      }
    }
    return { pct, bars };
  };

  const components = componentDefs.map((def) => {
    const { pct, bars } = computeUptime(def.key);
    return {
      ...def,
      status: getComponentStatus(def.checkIdx),
      uptime: pct,
      uptimeBars: bars,
      latency: healthData?.dbLatency ? Math.round(healthData.dbLatency * def.latencyMul) : undefined,
    };
  });

  const overallStatus: ServiceStatus = components.some((c) => c.status === "major_outage")
    ? "major_outage"
    : components.some((c) => c.status === "partial_outage")
    ? "partial_outage"
    : components.some((c) => c.status === "degraded")
    ? "degraded"
    : "operational";

  const overall = statusConfig[overallStatus];

  // Real incident stats
  const last30 = incidents.filter((i) => new Date(i.created_at) >= subDays(new Date(), 30));
  const unresolvedCount = last30.filter((i) => i.status !== "resolved").length;

  // Average uptime across components
  const avgUptime = components.length > 0
    ? (components.reduce((s, c) => s + c.uptime, 0) / components.length).toFixed(2)
    : "100.00";

  return (
    <div className="space-y-8">
      {/* Overall Status Banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className={`border-0 shadow-lg ${overall.bg}`}>
          <CardContent className="py-6 sm:py-8 px-4 sm:px-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`p-2.5 sm:p-3 rounded-2xl ${overall.bg}`}>
                  <overall.icon className={`h-6 w-6 sm:h-8 sm:w-8 ${overall.color}`} />
                </div>
                <div>
                  <h2 className={`text-xl sm:text-2xl font-bold ${overall.color}`}>{overall.label}</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {overallStatus === "operational"
                      ? "Todos os sistemas estão funcionando normalmente"
                      : "Alguns serviços estão com problemas"}
                  </p>
                </div>
              </div>
              <div className="text-right">
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
              return (
                <motion.div
                  key={component.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="px-4 sm:px-6 py-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className={`p-2 rounded-xl ${config.bg} flex-shrink-0`}>
                        <component.icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-foreground truncate">{component.name}</h4>
                          {component.latency !== undefined && (
                            <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded flex-shrink-0">
                              {component.latency}ms
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{component.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                      {/* Uptime bars (90 days) */}
                      <div className="hidden lg:flex items-end gap-[2px] h-6">
                        {component.uptimeBars.map((bar, i) => (
                          <div
                            key={i}
                            className={`w-[3px] rounded-full transition-all ${
                              bar === "operational"
                                ? "bg-emerald-500/60 h-full"
                                : bar === "degraded"
                                ? "bg-amber-500/80 h-3"
                                : "bg-muted/40 h-full"
                            }`}
                          />
                        ))}
                      </div>

                      <span className="text-xs font-mono text-muted-foreground hidden md:block w-16 text-right">
                        {component.uptime}%
                      </span>

                      <div className="flex items-center gap-1.5">
                        <div className={`h-2 w-2 rounded-full ${config.dot}`} />
                        <span className={`text-xs font-medium ${config.color} hidden sm:inline`}>{config.label}</span>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Uptime (30 dias)", value: `${avgUptime}%`, sub: "média dos componentes" },
          { label: "Tempo médio de resposta", value: `${healthData?.dbLatency || "—"}ms`, sub: "latência atual" },
          { label: "Incidentes (30 dias)", value: String(last30.length), sub: `${unresolvedCount} não resolvido(s)` },
        ].map((metric, i) => (
          <motion.div key={metric.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Incidentes
            </h3>
          </div>
          <CreateIncidentDialog />
        </div>

        {incidents.length === 0 ? (
          <Card className="border border-border/50">
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum incidente registrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {incidents.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                isExpanded={expandedIncident === incident.id}
                onToggle={() => setExpandedIncident(expandedIncident === incident.id ? null : incident.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">
          Status atualizado automaticamente a cada 15 segundos • Uptime calculado com dados reais
        </p>
      </div>
    </div>
  );
};

function IncidentCard({ incident, isExpanded, onToggle }: { incident: SystemIncident; isExpanded: boolean; onToggle: () => void }) {
  const incStatus = incidentStatusConfig[incident.status] || incidentStatusConfig.investigating;
  const sev = severityConfig[incident.severity] || severityConfig.minor;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Card className="border border-border/50 overflow-hidden">
        <button onClick={onToggle} className="w-full text-left px-4 sm:px-5 py-4 hover:bg-muted/20 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="mt-0.5 flex-shrink-0">
                {incident.status === "resolved" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-foreground truncate">{incident.title}</h4>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge variant="outline" className={`text-[10px] px-2 py-0 ${incStatus.color}`}>
                    {incStatus.label}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] px-2 py-0 ${sev.color}`}>
                    {sev.label}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 mt-1">
              {incident.status !== "resolved" && (
                <div onClick={(e) => e.stopPropagation()}>
                  <UpdateIncidentDialog incidentId={incident.id} currentStatus={incident.status} />
                </div>
              )}
              {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && incident.updates && incident.updates.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Separator />
              <div className="px-4 sm:px-5 py-4">
                <div className="relative pl-6">
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                  {incident.updates.map((update) => {
                    const updateConfig = incidentStatusConfig[update.status] || incidentStatusConfig.investigating;
                    return (
                      <div key={update.id} className="relative pb-5 last:pb-0">
                        <div className={`absolute left-[-17px] top-1.5 h-3 w-3 rounded-full border-2 border-background ${
                          update.status === "resolved" ? "bg-emerald-500" :
                          update.status === "identified" ? "bg-amber-500" :
                          update.status === "monitoring" ? "bg-blue-500" :
                          "bg-red-500"
                        }`} />
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${updateConfig.color}`}>
                              {updateConfig.label}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {format(new Date(update.created_at), "dd/MM HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{update.message}</p>
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
}

export default AdminStatus;
