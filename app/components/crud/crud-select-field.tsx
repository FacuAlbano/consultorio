import * as React from "react";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";

interface CrudSelectFieldProps extends React.ComponentProps<"select"> {
  label: string;
  error?: string;
  required?: boolean;
  options: { value: string; label: string }[];
}

export function CrudSelectField({
  label,
  error,
  required,
  options,
  className,
  ...props
}: CrudSelectFieldProps) {
  const id = React.useId();

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <select
        id={id}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive",
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
