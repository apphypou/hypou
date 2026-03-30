import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  trend?: "up" | "down" | "neutral";
  colorClass?: string;
}

const defaultColorClass = "bg-primary/10 text-primary";

export function KpiCard({ title, value, icon: Icon, description, trend, colorClass = defaultColorClass }: KpiCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 overflow-hidden">
      <CardContent className="p-5 flex items-start gap-4">
        <div className={cn("rounded-xl p-3 transition-transform duration-300 group-hover:scale-110", colorClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider truncate">{title}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
            </p>
            {trend && trend !== "neutral" && (
              <span className={cn(
                "inline-flex items-center text-xs font-medium",
                trend === "up" ? "text-emerald-500" : "text-red-500"
              )}>
                {trend === "up" ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
              </span>
            )}
          </div>
          {description && (
            <p className="text-[11px] text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
