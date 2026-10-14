import { cn, readableBytes } from "@/lib/utils";

type Props = {
  used: number;
  total: number;
  label?: string;
  hint?: string;
  className?: string;
};

/**
 * A single meter, not a chart. The number is the information; the bar only
 * exists so the ratio is readable at a glance.
 */
const CapacityBar = ({ used, total, label, hint, className }: Props) => {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const tone =
    pct >= 90 ? "bg-error" : pct >= 75 ? "bg-warning" : "bg-primary";

  return (
    <div className={className}>
      <div className="flex flex-row items-baseline justify-between gap-3 mb-2">
        <p className="text-[0.8125rem] font-medium truncate">{label}</p>
        <p className="text-xs muted tnum shrink-0">
          <span className="font-medium text-base-content/80">
            {readableBytes(used, 1000)}
          </span>{" "}
          / {total > 0 ? readableBytes(total, 1000) : "—"}
        </p>
      </div>

      <div
        role="meter"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || "Capacity used"}
        className="h-1.5 w-full rounded-full bg-base-content/[0.08] overflow-hidden"
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", tone)}
          style={{ width: `${Math.max(pct, pct > 0 ? 1.5 : 0)}%` }}
        />
      </div>

      {hint ? <p className="text-xs muted mt-2">{hint}</p> : null}
    </div>
  );
};

export default CapacityBar;
