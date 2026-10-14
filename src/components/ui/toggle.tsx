import React, { forwardRef } from "react";
import { Toggle as BaseToggle } from "react-daisyui";
import FormControl from "./form-control";
import { FieldValues } from "react-hook-form";
import { cn } from "@/lib/utils";

type ToggleProps = Omit<
  React.ComponentPropsWithoutRef<typeof BaseToggle>,
  "form"
> & {
  label?: string;
  description?: string;
};

const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, description, className, ...props }, ref) => (
    <label
      className={cn(
        "flex flex-row items-start gap-3 cursor-pointer select-none",
        className
      )}
    >
      <span className="flex items-center h-5 shrink-0">
        <BaseToggle ref={ref} size="sm" {...props} />
      </span>
      {label || description ? (
        <span className="min-w-0">
          <span className="block text-[0.8125rem] font-medium leading-5">
            {label}
          </span>
          {description ? (
            <span className="block text-xs muted mt-0.5 leading-relaxed">
              {description}
            </span>
          ) : null}
        </span>
      ) : null}
    </label>
  )
);

type ToggleFieldProps<T extends FieldValues> = Omit<
  React.ComponentPropsWithoutRef<typeof FormControl<T>>,
  "render"
> &
  ToggleProps & {
    inputClassName?: string;
  };

export const ToggleField = <T extends FieldValues>({
  form,
  name,
  title,
  className,
  inputClassName,
  ...props
}: ToggleFieldProps<T>) => {
  return (
    <FormControl
      form={form}
      name={name}
      title={title}
      className={className}
      render={(field) => (
        <Toggle
          {...props}
          {...field}
          className={inputClassName}
          color={field.value ? "primary" : undefined}
          checked={!!field.value}
          onChange={(e) => field.onChange(e.target.checked)}
        />
      )}
    />
  );
};

export default Toggle;
