import { Info, LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

type MetricTone = "cyan" | "pink" | "violet" | "neutral";

interface AdminMetricCardProps {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  tone?: MetricTone;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  data?: { date: string; count: number }[];
}

const strokeByTone: Record<MetricTone, string> = {
  cyan: "#18d5dc",
  pink: "#fa2b83",
  violet: "#a468f5",
  neutral: "#d5dde1",
};

export function AdminMetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "cyan",
  trend = "neutral",
  trendLabel,
  data = [],
}: AdminMetricCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : TrendingDown;

  return (
    <section className={cn("admin-metric-card", `admin-metric-card--${tone}`)}>
      <div className="flex items-center justify-between gap-2">
        <p>{label}</p>
        <span title={description} aria-label={description}><Info className="h-3.5 w-3.5" /></span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <strong>{value}</strong>
          {trendLabel ? (
            <span className={cn("admin-metric-card__trend", trend === "down" && "is-negative", trend === "neutral" && "is-neutral")}>
              {trend !== "neutral" && <TrendIcon className="h-3.5 w-3.5" />}
              {trendLabel}
            </span>
          ) : <span className="admin-metric-card__caption">{description}</span>}
        </div>
        <span className="admin-metric-card__icon"><Icon className="h-4 w-4" /></span>
      </div>
      <div className="admin-metric-card__chart" aria-hidden="true">
        {data.length > 1 && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line type="monotone" dataKey="count" stroke={strokeByTone[tone]} strokeWidth={1.75} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
