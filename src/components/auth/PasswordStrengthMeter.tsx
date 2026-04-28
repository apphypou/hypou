import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PasswordStrengthMeterProps {
  password: string;
}

type Level = { score: 0 | 1 | 2 | 3 | 4; label: string; color: string };

const evaluate = (pw: string): Level => {
  if (!pw) return { score: 0, label: "", color: "bg-foreground/10" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) s++;
  const map: Record<number, Level> = {
    0: { score: 0, label: "Muito fraca", color: "bg-destructive" },
    1: { score: 1, label: "Fraca", color: "bg-destructive" },
    2: { score: 2, label: "Razoável", color: "bg-yellow-500" },
    3: { score: 3, label: "Boa", color: "bg-primary" },
    4: { score: 4, label: "Forte", color: "bg-primary" },
  };
  return map[s] as Level;
};

const PasswordStrengthMeter = ({ password }: PasswordStrengthMeterProps) => {
  const level = useMemo(() => evaluate(password), [password]);
  if (!password) return null;

  return (
    <div className="flex items-center gap-2 px-1 -mt-1">
      <div className="flex gap-1 flex-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              i < level.score ? level.color : "bg-foreground/10"
            )}
          />
        ))}
      </div>
      <span
        className={cn(
          "text-[10px] font-semibold tracking-wide uppercase min-w-[70px] text-right",
          level.score >= 3
            ? "text-primary"
            : level.score === 2
              ? "text-yellow-500"
              : "text-destructive"
        )}
      >
        {level.label}
      </span>
    </div>
  );
};

export default PasswordStrengthMeter;
