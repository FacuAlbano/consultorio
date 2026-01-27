import { forwardRef } from "react";
import { useFormContext } from "react-hook-form";
import { cn } from "~/lib/utils";

interface CrudSelectFieldOption {
  value: string;
  label: string;
}

interface CrudSelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  name: string;
  label: string;
  options: CrudSelectFieldOption[];
  error?: string;
}

export const CrudSelectField = forwardRef<HTMLSelectElement, CrudSelectFieldProps>(
  ({ name, label, options, error, className, ...props }, ref) => {
    const { register, formState } = useFormContext();
    const fieldError = error || formState.errors[name]?.message?.toString();

    return (
      <div className="space-y-2">
        <label htmlFor={name} className="text-sm font-medium text-foreground">
          {label}
          {props.required && <span className="text-destructive ml-1">*</span>}
        </label>
        <select
          id={name}
          {...register(name)}
          {...props}
          ref={ref}
          className={cn(
            "w-full px-3 py-2 bg-input border rounded-lg text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            fieldError && "border-destructive focus:ring-destructive/20",
            className
          )}
          aria-invalid={!!fieldError}
          aria-describedby={fieldError ? `${name}-error` : undefined}
        >
          {!props.required && <option value="">Seleccionar...</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {fieldError && (
          <p id={`${name}-error`} className="text-sm text-destructive" role="alert">
            {fieldError}
          </p>
        )}
      </div>
    );
  }
);

CrudSelectField.displayName = "CrudSelectField";
