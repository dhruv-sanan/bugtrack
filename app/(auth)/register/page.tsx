"use client";

import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRegisterMutation } from "@/lib/api";
import { apiFieldErrors, errorMessage, zodFieldErrors, type FieldErrors } from "@/lib/errors";
import { useRedirectIfSignedIn } from "@/lib/use-redirect-if-signed-in";
import { registerSchema } from "@/shared/schemas";

function RegisterForm() {
  useRedirectIfSignedIn();
  const [register, { isLoading }] = useRegisterMutation();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(undefined);
    const parsed = registerSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error));
    try {
      await register(parsed.data).unwrap();
    } catch (err) {
      setErrors(apiFieldErrors(err));
      setFormError(errorMessage(err));
    }
  }

  return (
    <>
      <h2 className="text-3xl font-semibold">Create your account</h2>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Already have one?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>

      <form onSubmit={handleSubmit} noValidate className="grid gap-4">
        <Field label="Name" htmlFor="name" errors={errors.name}>
          <Input id="name" name="name" autoComplete="name" className="h-10 bg-card" />
        </Field>
        <Field label="Email" htmlFor="email" errors={errors.email} hint="Ticket assignments are sent to this address.">
          <Input id="email" name="email" type="email" autoComplete="email" className="h-10 bg-card" />
        </Field>
        <Field label="Password" htmlFor="password" errors={errors.password} hint="At least 8 characters.">
          <Input id="password" name="password" type="password" autoComplete="new-password" className="h-10 bg-card" />
        </Field>
        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}
        <Button type="submit" size="lg" className="h-10" disabled={isLoading}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-xs text-muted-foreground">
        New accounts start as Developers. An Admin or Manager adds you to a project.
      </p>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
