"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLoginMutation } from "@/lib/api";
import { errorMessage, zodFieldErrors, type FieldErrors } from "@/lib/errors";
import { useRedirectIfSignedIn } from "@/lib/use-redirect-if-signed-in";
import { loginSchema, type LoginInput } from "@/shared/schemas";

const DEMO_PASSWORD = "demo1234";

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@example.com", name: "Asha Admin", can: "Manages users, projects and every ticket" },
  { role: "Manager", email: "manager@example.com", name: "Manav Manager", can: "Runs projects, assigns tickets" },
  { role: "Developer", email: "developer@example.com", name: "Divya Developer", can: "Works on assigned tickets" },
];

function LoginForm() {
  const registerHref = useRegisterHref();
  useRedirectIfSignedIn();
  const [login, { isLoading }] = useLoginMutation();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();

  async function signIn(values: LoginInput) {
    setErrors({});
    setFormError(undefined);
    try {
      await login(values).unwrap();
    } catch (err) {
      setFormError(errorMessage(err));
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = loginSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (parsed.success) signIn(parsed.data);
    else setErrors(zodFieldErrors(parsed.error));
  }

  return (
    <>
      <h2 className="text-3xl font-semibold">Sign in</h2>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        New here?{" "}
        <Link href={registerHref} className="font-medium text-primary underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>

      <form onSubmit={handleSubmit} noValidate className="grid gap-4">
        <Field label="Email" htmlFor="email" errors={errors.email}>
          <Input id="email" name="email" type="email" autoComplete="email" className="h-10 bg-card" />
        </Field>
        <Field label="Password" htmlFor="password" errors={errors.password}>
          <Input id="password" name="password" type="password" autoComplete="current-password" className="h-10 bg-card" />
        </Field>
        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}
        <Button type="submit" size="lg" className="h-10" disabled={isLoading}>
          Sign in
        </Button>
      </form>

      <h3 className="mt-8 mb-3 text-sm font-semibold">Or try a demo account</h3>
      <div className="grid gap-2">
        {DEMO_ACCOUNTS.map(({ role, email, name, can }) => (
          <button
            key={email}
            type="button"
            disabled={isLoading}
            onClick={() => signIn({ email, password: DEMO_PASSWORD })}
            aria-label={`Sign in as ${name}, ${role}`}
            className="group rounded-lg text-left drop-shadow-[0_1px_2px_rgb(20_27_45/0.14)] transition-transform focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-60 motion-safe:hover:-translate-y-0.5"
          >
            <span className="ticket-stub grid grid-cols-[var(--stub-width)_minmax(0,1fr)] bg-card">
              <span className="flex min-h-22 items-center justify-center bg-primary py-2 text-primary-foreground">
                <span className="ticket-key font-mono text-[10px] font-semibold tracking-wider uppercase">{role}</span>
              </span>
              <span className="flex flex-col justify-center border-l-2 border-dashed border-border px-3.5 py-2.5">
                <span className="text-sm font-medium group-hover:text-primary">{name}</span>
                <span className="text-xs text-muted-foreground">{can}</span>
              </span>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

/** Keeps the post-login destination when someone switches to the register page. */
function useRegisterHref() {
  const next = useSearchParams()?.get("next");
  return next ? `/register?next=${encodeURIComponent(next)}` : "/register";
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
