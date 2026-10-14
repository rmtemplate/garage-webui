import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import React, { forwardRef } from "react";

type Props = Omit<React.ComponentPropsWithoutRef<"div">, "onClick"> & {
  onClick?: () => void;
  onRemove?: () => void;
  /** Accessible name for the remove button, e.g. the chip's own value. */
  removeLabel?: string;
};

const Chips = forwardRef<HTMLDivElement, Props>(
  ({ className, children, onRemove, removeLabel, onClick, ...props }, ref) => {
    const Comp = onClick ? "button" : "div";

    return (
      <Comp
        ref={ref as never}
        onClick={onClick}
        className={cn(
          "inline-flex flex-row items-center gap-1.5 h-7 pl-2.5 rounded-badge",
          "text-[0.8125rem] bg-base-200 border border-base-300 text-base-content/85",
          onRemove ? "pr-1" : "pr-2.5",
          onClick && "hover:border-base-content/25 transition-colors",
          className
        )}
        {...(props as any)}
      >
        <span className="truncate max-w-[14rem]">{children}</span>
        {onRemove ? (
          <button
            type="button"
            title={removeLabel ? `Remove ${removeLabel}` : "Remove"}
            aria-label={removeLabel ? `Remove ${removeLabel}` : "Remove"}
            className="grid place-items-center size-5 rounded shrink-0
                       text-base-content/45 hover:text-error hover:bg-error/10
                       transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <X size={13} />
          </button>
        ) : null}
      </Comp>
    );
  }
);

export default Chips;
