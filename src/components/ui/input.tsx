import React, { forwardRef } from "react";
import { Input as BaseInput } from "react-daisyui";
import FormControl from "./form-control";
import { FieldValues } from "react-hook-form";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type InputProps = Omit<
  React.ComponentPropsWithoutRef<typeof BaseInput>,
  "form"
> & {
  /** Icon rendered inside the field, on the left. */
  icon?: LucideIcon;
  /** Node pinned inside the field, on the right (copy button, unit, …). */
  suffix?: React.ReactNode;
  containerClassName?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon: Icon, suffix, className, containerClassName, ...props }, ref) => {
    const field = (
      <BaseInput
        ref={ref}
        bordered
        className={cn(
          "w-full",
          Icon && "pl-9",
          suffix && "pr-10",
          className
        )}
        {...props}
      />
    );

    if (!Icon && !suffix) return field;

    return (
      <div className={cn("relative", containerClassName)}>
        {Icon ? (
          <Icon
            size={15}
            aria-hidden
            className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none z-10"
          />
        ) : null}
        {field}
        {suffix ? (
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center">
            {suffix}
          </div>
        ) : null}
      </div>
    );
  }
);

type InputFieldProps<T extends FieldValues> = Omit<
  React.ComponentPropsWithoutRef<typeof FormControl<T>>,
  "render"
> &
  InputProps & {
    inputClassName?: string;
  };

export const InputField = <T extends FieldValues>({
  form,
  name,
  title,
  hint,
  className,
  inputClassName,
  ...props
}: InputFieldProps<T>) => {
  return (
    <FormControl
      form={form}
      name={name}
      title={title}
      hint={hint}
      className={className}
      render={(field) => (
        <Input
          {...props}
          {...field}
          value={field.value ?? ""}
          className={inputClassName}
        />
      )}
    />
  );
};

export default Input;
