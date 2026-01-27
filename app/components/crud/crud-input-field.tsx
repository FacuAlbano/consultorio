import { forwardRef } from "react";
import { useFormContext } from "react-hook-form";
import { cn } from "~/lib/utils";

interface CrudInputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  error?: string;
}

export const CrudInputField = forwardRef<HTMLInputElement, CrudInputFieldProps>(
  ({ name, label, error, className, ...props }, ref) => {
    const { register, formState } = useFormContext();
    const fieldError = error || formState.errors[name]?.message?.toString();
    
    // Extraer el ref de register y combinar con el ref externo
    const { ref: registerRef, ...registerProps } = register(name);
    
    // Callback ref que combina ambos refs
    const combinedRef = (element: HTMLInputElement | null) => {
      // Asignar el ref de react-hook-form (siempre es una función callback)
      registerRef(element);
      
      // Asignar el ref externo
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
    };

    return (
      <div className="space-y-2">
        <label htmlFor={name} className="text-sm font-medium text-foreground">
          {label}
          {props.required && <span className="text-destructive ml-1">*</span>}
        </label>
        <input
          id={name}
          {...registerProps}
          {...props}
          ref={combinedRef}
          className={cn(
            "w-full px-3 py-2 bg-input border rounded-lg text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            fieldError && "border-destructive focus:ring-destructive/20",
            className
          )}
          aria-invalid={!!fieldError}
          aria-describedby={fieldError ? `${name}-error` : undefined}
        />
        {fieldError && (
          <p id={`${name}-error`} className="text-sm text-destructive" role="alert">
            {fieldError}
          </p>
        )}
      </div>
    );
  }
);

CrudInputField.displayName = "CrudInputField";
