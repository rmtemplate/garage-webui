import { cn } from "@/lib/utils";
import { AlertTriangle, Loader2, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import Button from "./button";

/* -- Skeleton -------------------------------------------------------------- */

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("skeleton-box h-4 w-full", className)} aria-hidden />
);

/** Placeholder rows matching the table layout they stand in for. */
export const SkeletonRows = ({
  rows = 6,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) => (
  <>
    {Array.from({ length: rows }).map((_, r) => (
      <tr key={r} className="border-b border-base-300/70">
        {Array.from({ length: cols }).map((_, c) => (
          <td key={c} className="py-3">
            <Skeleton
              className={cn("h-3.5", c === 0 ? "w-2/3" : "w-16")}
            />
          </td>
        ))}
      </tr>
    ))}
  </>
);

/* -- Spinner --------------------------------------------------------------- */

export const Spinner = ({
  className,
  size = 18,
}: {
  className?: string;
  size?: number;
}) => (
  <Loader2
    size={size}
    className={cn("animate-spin text-base-content/50", className)}
    aria-hidden
  />
);

export const LoadingBlock = ({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) => (
  <div
    role="status"
    aria-live="polite"
    className={cn(
      "flex flex-col items-center justify-center gap-3 py-16 text-sm muted",
      className
    )}
  >
    <Spinner size={22} />
    <span>{label}</span>
  </div>
);

/* -- Empty ----------------------------------------------------------------- */

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
};

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: EmptyStateProps) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center text-center animate-fade-in",
      compact ? "py-10 px-4" : "py-16 px-6",
      className
    )}
  >
    {Icon ? (
      <div className="mb-4 grid place-items-center size-11 rounded-full bg-base-content/[0.05] border border-base-300">
        <Icon size={20} className="text-base-content/45" aria-hidden />
      </div>
    ) : null}
    <p className="text-sm font-semibold text-base-content">{title}</p>
    {description ? (
      <p className="text-[0.8125rem] muted mt-1.5 max-w-sm leading-relaxed">
        {description}
      </p>
    ) : null}
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);

/* -- Error ----------------------------------------------------------------- */

export const ErrorState = ({
  title = "Something went wrong",
  error,
  onRetry,
  className,
}: {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}) => {
  const message =
    (error as Error)?.message || "The request could not be completed.";

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center text-center py-14 px-6 animate-fade-in",
        className
      )}
    >
      <div className="mb-4 grid place-items-center size-11 rounded-full bg-error/10 border border-error/20">
        <AlertTriangle size={20} className="text-error" aria-hidden />
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-[0.8125rem] muted mt-1.5 max-w-md break-words">
        {message}
      </p>
      {onRetry ? (
        <Button size="sm" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
};
