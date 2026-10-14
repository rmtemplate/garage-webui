import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

export type Tone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "info";

const TONES: Record<Tone, string> = {
  neutral: "bg-base-content/[0.06] text-base-content/70 border-base-content/10",
  primary: "bg-primary/10 text-primary border-primary/20",
  success: "bg-success/10 text-success border-success/25",
  warning: "bg-warning/10 text-warning border-warning/25",
  error: "bg-error/10 text-error border-error/25",
  info: "bg-info/10 text-info border-info/25",
};

const DOTS: Record<Tone, string> = {
  neutral: "bg-base-content/40",
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
  info: "bg-info",
};

type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  tone?: Tone;
  /** Prefixes a small status dot. */
  dot?: boolean;
};

/** Low-saturation status pill — the only badge style in the app. */
export const Badge = ({
  tone = "neutral",
  dot,
  className,
  children,
  ...props
}: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 h-[1.375rem] px-2 rounded-badge border",
      "text-[0.6875rem] font-semibold tracking-[0.01em] whitespace-nowrap",
      TONES[tone],
      className
    )}
    {...props}
  >
    {dot ? (
      <span
        aria-hidden
        className={cn("size-1.5 rounded-full shrink-0", DOTS[tone])}
      />
    ) : null}
    {children}
  </span>
);

/** A bare dot, for use inside dense rows where a pill is too heavy. */
export const StatusDot = ({
  tone = "neutral",
  pulse,
  className,
}: {
  tone?: Tone;
  pulse?: boolean;
  className?: string;
}) => (
  <span className={cn("relative flex size-2 shrink-0", className)}>
    {pulse ? (
      <span
        aria-hidden
        className={cn(
          "absolute inline-flex size-full rounded-full opacity-60 animate-ping",
          DOTS[tone]
        )}
      />
    ) : null}
    <span className={cn("relative inline-flex size-2 rounded-full", DOTS[tone])} />
  </span>
);

export default Badge;
