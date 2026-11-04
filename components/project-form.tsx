"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Field } from "@/components/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFieldErrors, errorMessage, errorStatus, zodFieldErrors, type FieldErrors } from "@/lib/errors";
import type { Project } from "@/lib/types";
import { createProjectSchema, type CreateProjectInput } from "@/shared/schemas";

interface ProjectFormProps {
  project?: Project;
  /** Should reject on failure, so the form can show the error. */
  onSubmit: (values: CreateProjectInput) => Promise<unknown>;
  /** The form's buttons, which differ between the dialog and the settings page. */
  actions: ReactNode;
}

export function ProjectForm({ project, onSubmit, actions }: ProjectFormProps) {
  const [errors, setErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    const parsed = createProjectSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error));
    try {
      await onSubmit(parsed.data);
    } catch (err) {
      // The key is a project's only unique field.
      if (errorStatus(err) === 409) return setErrors({ key: ["That key is already in use"] });
      setErrors(apiFieldErrors(err));
      toast.error(errorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
        <Field label="Name" htmlFor="project-name" errors={errors.name}>
          <Input id="project-name" name="name" defaultValue={project?.name} placeholder="Customer Portal" />
        </Field>
        <Field label="Key" htmlFor="project-key" errors={errors.key}>
          <Input
            id="project-key"
            name="key"
            defaultValue={project?.key}
            placeholder="BUG"
            className="font-mono uppercase"
          />
        </Field>
      </div>
      <Field label="Description" htmlFor="project-description" errors={errors.description}>
        <Textarea id="project-description" name="description" defaultValue={project?.description} rows={3} />
      </Field>
      <div className="flex justify-end gap-2">{actions}</div>
    </form>
  );
}
