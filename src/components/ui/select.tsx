import { cn } from "@/lib/utils";
import { ComponentPropsWithoutRef, forwardRef } from "react";
import BaseSelect from "react-select";
import Creatable from "react-select/creatable";

type Props = ComponentPropsWithoutRef<typeof BaseSelect> & {
  creatable?: boolean;
  onCreateOption?: (inputValue: string) => void;
};

/**
 * react-select, restyled onto the app's control tokens so it is
 * indistinguishable from a native field.
 */
const Select = forwardRef<any, Props>(({ creatable, ...props }, ref) => {
  const Comp = creatable ? Creatable : BaseSelect;

  return (
    <Comp
      ref={ref}
      unstyled
      menuPlacement="auto"
      classNames={{
        control: (p) =>
          cn(
            "bg-base-100 border rounded-btn text-sm text-base-content transition-colors duration-150",
            "min-h-[var(--ctl-h-lg)] px-3",
            p.isFocused
              ? "border-primary ring-2 ring-primary/20"
              : "border-base-300 hover:border-base-content/20",
            p.isMulti && "py-1 flex flex-row gap-1.5 items-center flex-wrap"
          ),
        valueContainer: () => "gap-1",
        placeholder: () => "text-base-content/40",
        input: () => "text-base-content",
        indicatorsContainer: () => "text-base-content/40 gap-1",
        dropdownIndicator: () => "px-0.5",
        clearIndicator: () => "px-0.5 hover:text-base-content cursor-pointer",
        menu: () => "mt-1.5 z-30",
        menuList: () =>
          "panel max-h-60 overflow-y-auto flex flex-col gap-0.5",
        noOptionsMessage: () => "py-3 text-[0.8125rem] text-base-content/50",
        option: (p) =>
          cn(
            "px-2.5 py-2 rounded-btn text-[0.8125rem] cursor-pointer transition-colors",
            p.isSelected
              ? "bg-primary text-primary-content"
              : p.isFocused
                ? "bg-base-content/[0.06] text-base-content"
                : "text-base-content"
          ),
        singleValue: () => "text-base-content",
        multiValue: () =>
          "bg-base-200 border border-base-300 rounded-badge pl-2 h-6 flex flex-row items-center text-[0.8125rem]",
        multiValueLabel: () => "pr-1",
        multiValueRemove: () =>
          "px-1 h-full flex items-center rounded-r-badge text-base-content/45 hover:text-error hover:bg-error/10 cursor-pointer",
      }}
      noOptionsMessage={() =>
        creatable ? "Type to add a new value…" : "No options"
      }
      {...props}
    />
  );
});

export default Select;
