import { cn } from "@/lib/utils";
import React, { forwardRef } from "react";
import { Checkbox as BaseCheckbox } from "react-daisyui";
import FormControl from "./form-control";
import { FieldValues } from "react-hook-form";

type CheckboxProps = Omit<
  React.ComponentPropsWithoutRef<typeof BaseCheckbox>,
  "form"
> & {
  label?: string;
  description?: string;
  inputClassName?: string;
};

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className, inputClassName, ...props }, ref) => {
    const control = (
      <BaseCheckbox
        ref={ref}
        color="primary"
        size="sm"
        className={cn("shrink-0", inputClassName)}
        {...props}
      />
    );

    // Bare checkbox (table cells) — no label wrapper to throw the row off.
    if (!label && !description) return control;

    return (
      <label
        className={cn(
          "inline-flex items-start gap-2.5 cursor-pointer select-none py-1",
          props.disabled && "cursor-not-allowed opacity-60",
          className
        )}
      >
        <span className="flex items-center h-[1.375rem]">{control}</span>
        <span className="min-w-0">
          <span className="block text-[0.8125rem] leading-[1.375rem] text-base-content">
            {label}
          </span>
          {description ? (
            <span className="block text-xs muted mt-0.5 leading-relaxed">
              {description}
            </span>
          ) : null}
        </span>
      </label>
    );
  }
);

type CheckboxFieldProps<T extends FieldValues> = Omit<
  React.ComponentPropsWithoutRef<typeof FormControl<T>>,
  "render"
> &
  CheckboxProps;

export const CheckboxField = <T extends FieldValues>({
  form,
  name,
  ...props
}: CheckboxFieldProps<T>) => {
  return (
    <FormControl
      form={form}
      name={name}
      render={(field) => (
        <Checkbox
          {...props}
          {...field}
          checked={!!field.value}
          onChange={(e) => field.onChange(e.target.checked)}
        />
      )}
    />
  );
};

export default Checkbox;
