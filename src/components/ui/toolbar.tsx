import { cn } from "@/lib/utils";
import { Search, X, type LucideIcon } from "lucide-react";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

/* -- Toolbar --------------------------------------------------------------- */

/** The filter/action row that sits above every list in the app. */
export const Toolbar = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3",
      className
    )}
  >
    {children}
  </div>
);

export const ToolbarSpacer = () => <div className="hidden sm:block flex-1" />;

/* -- Search ---------------------------------------------------------------- */

type SearchInputProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "onChange" | "value"
> & {
  value: string;
  onChange: (value: string) => void;
  containerClassName?: string;
};

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    { value, onChange, placeholder = "Search…", containerClassName, ...props },
    ref
  ) => (
    <div className={cn("relative sm:w-72", containerClassName)}>
      <Search
        size={15}
        aria-hidden
        className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none"
      />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={props["aria-label"] || placeholder}
        className="input input-bordered input-sm w-full pl-9 pr-8
                   [&::-webkit-search-cancel-button]:appearance-none"
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          title="Clear search"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 grid place-items-center
                     size-6 rounded-md text-base-content/45 hover:text-base-content
                     hover:bg-base-content/[0.07] transition-colors"
        >
          <X size={13} />
        </button>
      ) : null}
    </div>
  )
);

/* -- Segmented control ----------------------------------------------------- */

type SegmentedOption<T extends string> = {
  value: T;
  label?: string;
  icon?: LucideIcon;
  title?: string;
};

/** Used for view switches (list / grid) and small mode toggles. */
export const Segmented = <T extends string>({
  options,
  value,
  onChange,
  className,
  ariaLabel,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  ariaLabel: string;
}) => (
  <div
    role="radiogroup"
    aria-label={ariaLabel}
    className={cn(
      "inline-flex items-center p-0.5 gap-0.5 rounded-btn bg-base-200 border border-base-300 shrink-0",
      className
    )}
  >
    {options.map((opt) => {
      const active = opt.value === value;
      return (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={active}
          title={opt.title || opt.label}
          aria-label={opt.title || opt.label}
          onClick={() => onChange(opt.value)}
          className={cn(
            "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[0.375rem]",
            "text-xs font-medium transition-colors duration-150",
            active
              ? "bg-base-100 text-base-content shadow-xs"
              : "text-base-content/55 hover:text-base-content"
          )}
        >
          {opt.icon ? <opt.icon size={14} aria-hidden /> : null}
          {opt.label}
        </button>
      );
    })}
  </div>
);

/* -- Native select, styled ------------------------------------------------- */

export const FilterSelect = <T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  label: string;
  className?: string;
}) => (
  <select
    aria-label={label}
    value={value}
    onChange={(e) => onChange(e.target.value as T)}
    className={cn(
      "select select-bordered select-sm h-[var(--ctl-h)] min-h-0 text-[0.8125rem] font-normal",
      className
    )}
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);
