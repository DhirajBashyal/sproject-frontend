import type { ComponentProps } from "react";
import { Input } from "./input";
import { Label } from "./label";

interface FormFieldProps extends ComponentProps<"input"> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
}

export function FormField({ id, label, hint, error, ...props }: FormFieldProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? `${id}-note` : undefined}
        {...props}
      />
      {(error || hint) && (
        <p
          id={`${id}-note`}
          role={error ? "alert" : undefined}
          className={error ? "text-xs text-destructive" : "text-xs text-muted-foreground"}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
