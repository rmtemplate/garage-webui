import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import { ComponentPropsWithoutRef, useId } from "react";
import {
  FieldValues,
  UseFormReturn,
  Controller,
  ControllerRenderProps,
  ControllerFieldState,
  FieldPath,
  UseFormStateReturn,
} from "react-hook-form";

type FormControlProps<
  T extends FieldValues,
  U extends FieldPath<T> = FieldPath<T>
> = ComponentPropsWithoutRef<"div"> & {
  form: UseFormReturn<T>;
  name: FieldPath<T>;
  title?: string;
  /** Helper text under the control, replaced by the error when invalid. */
  hint?: string;

  render: (
    field: ControllerRenderProps<T, U>,
    fieldProps: {
      fieldState: ControllerFieldState;
      formState: UseFormStateReturn<T>;
    }
  ) => React.ReactElement;
};

/**
 * Label + control + error, with the accessibility wiring done once.
 *
 * `id`, `aria-invalid` and `aria-describedby` are merged into the `field`
 * object, so every existing `render={(field) => <Input {...field} />}` call
 * site gets a correctly labelled, correctly described input for free.
 */
const FormControl = <T extends FieldValues>({
  form,
  name,
  title,
  hint,
  className,
  render,
}: FormControlProps<T>) => {
  const uid = useId();
  const id = `${uid}-${name}`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState, formState }) => {
        const invalid = !!fieldState.error;

        return (
          <div className={cn("form-control w-full", className)}>
            {title ? (
              <label htmlFor={id} className="label label-text pt-0">
                {title}
              </label>
            ) : null}

            {render(
              {
                ...field,
                id,
                "aria-invalid": invalid || undefined,
                "aria-describedby": invalid
                  ? errorId
                  : hint
                    ? hintId
                    : undefined,
              } as typeof field,
              { fieldState, formState }
            )}

            {invalid ? (
              <p
                id={errorId}
                role="alert"
                className="flex items-start gap-1.5 text-xs text-error mt-1.5"
              >
                <AlertCircle size={13} className="mt-px shrink-0" aria-hidden />
                {fieldState.error?.message}
              </p>
            ) : hint ? (
              <p id={hintId} className="text-xs muted mt-1.5">
                {hint}
              </p>
            ) : null}
          </div>
        );
      }}
    />
  );
};

export default FormControl;
