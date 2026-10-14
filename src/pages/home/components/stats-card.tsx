import { Skeleton } from "@/components/ui/states";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  title: string;
  value?: string | number | null;
  icon: LucideIcon;
  /** Secondary line under the value. */
  hint?: ReactNode;
  valueClassName?: string;
  iconClassName?: string;
  loading?: boolean;
  children?: ReactNode;
};

/**
 * Label-first metric tile: the eyebrow names the measure, the number carries
 * the weight, and the icon stays quiet in the corner so a row of tiles reads
 * as numbers rather than as a row of icons.
 */
const StatsCard = ({
  title,
  value,
  icon: Icon,
  hint,
  valueClassName,
  iconClassName,
  loading,
  children,
}: Props) => {
  return (
    <div className="surface surface-hover p-4 md:p-[1.125rem] flex flex-col">
      <div className="flex flex-row items-start gap-3">
        <p className="eyebrow flex-1 min-w-0 truncate">{title}</p>
        <Icon
          size={16}
          aria-hidden
          className={cn("shrink-0 text-base-content/35", iconClassName)}
        />
      </div>

      <div className="mt-2.5">
        {loading ? (
          <Skeleton className="h-7 w-20" />
        ) : children != null ? (
          children
        ) : (
          <p className={cn("metric truncate", valueClassName)}>
            {value ?? "—"}
          </p>
        )}
      </div>

      {hint ? (
        <p className="text-xs muted mt-1.5 truncate">{hint}</p>
      ) : null}
    </div>
  );
};

export default StatsCard;
