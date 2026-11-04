import type { ZodError } from "zod";

export type FieldErrors = Record<string, string[] | undefined>;

interface ApiErrorShape {
  status?: number | string;
  data?: {
    error?: { message?: string; details?: { fieldErrors?: FieldErrors } };
  };
}

export const errorStatus = (err: unknown) => (err as ApiErrorShape | undefined)?.status;

export const isUnauthorized = (err: unknown) => errorStatus(err) === 401;

export function errorMessage(err: unknown, fallback = "Something went wrong. Try again."): string {
  return (err as ApiErrorShape | undefined)?.data?.error?.message ?? fallback;
}

/** Field-level messages from a failed API validation, for showing under each input. */
export function apiFieldErrors(err: unknown): FieldErrors {
  return (err as ApiErrorShape | undefined)?.data?.error?.details?.fieldErrors ?? {};
}

export function zodFieldErrors(error: ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    errors[field] = [...(errors[field] ?? []), issue.message];
  }
  return errors;
}
