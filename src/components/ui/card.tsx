import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type CardProps = ComponentPropsWithoutRef<"section"> & {
  /** Renders a bordered header strip above the body. */
  title?: ReactNode;
  description?: ReactNode;
  /** Right-aligned controls in the header. */
  actions?: ReactNode;
  /** Set false when the content provides its own padding (e.g. a table). */
  padded?: boolean;
  bodyClassName?: string;
};

/**
 * The single surface primitive. Every raised panel in the app is one of
 * these, so border, radius, header rhythm and padding stay identical
 * everywhere.
 */
const Card = ({
  title,
  description,
  actions,
  padded = true,
  className,
  bodyClassName,
  children,
  ...props
}: CardProps) => {
  return (
    <section className={cn("surface overflow-hidden", className)} {...props}>
      {title || actions ? (
        <header className="surface-header">
          <div className="flex-1 min-w-0">
            <h2 className="surface-title truncate">{title}</h2>
            {description ? (
              <p className="text-xs muted mt-0.5">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-row items-center gap-2 shrink-0">
              {actions}
            </div>
          ) : null}
        </header>
      ) : null}

      <div className={cn(padded && "surface-body", bodyClassName)}>
        {children}
      </div>
    </section>
  );
};

export default Card;
