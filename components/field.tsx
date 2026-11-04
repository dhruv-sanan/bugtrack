import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

interface FieldProps {
  label: string;
  htmlFor: string;
  errors?: string[];
  hint?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, errors, hint, children }: FieldProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !errors?.length && <p className="text-xs text-muted-foreground">{hint}</p>}
      {errors?.length ? (
        <p role="alert" className="text-xs text-destructive">
          {errors[0]}
        </p>
      ) : null}
    </div>
  );
}
