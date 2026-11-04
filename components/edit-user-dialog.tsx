"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUpdateUserMutation } from "@/lib/api";
import { apiFieldErrors, errorMessage, errorStatus, zodFieldErrors, type FieldErrors } from "@/lib/errors";
import type { User } from "@/lib/types";
import { useCurrentUser } from "@/lib/use-current-user";
import { canManageUsers } from "@/shared/permissions";
import { isDemoAccount } from "@/shared/constants";
import { updateSelfSchema, updateUserSchema } from "@/shared/schemas";

interface EditUserDialogProps {
  user: User;
  trigger: ReactNode;
}

/** Edits name, email and password. Admins edit anyone; others only their own name and password. */
export function EditUserDialog({ user, trigger }: EditUserDialogProps) {
  const currentUser = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [updateUser, { isLoading }] = useUpdateUserMutation();

  const isSelf = user.id === currentUser.id;
  const isAdmin = canManageUsers(currentUser);
  const isLocked = isDemoAccount(user.email);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    setErrors({});
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name")).trim();
    const email = isAdmin ? String(form.get("email")).trim().toLowerCase() : user.email;
    const password = String(form.get("password"));

    // Only what changed is sent, and a blank password means keep the current one.
    const changes = {
      ...(name !== user.name && { name }),
      ...(email !== user.email && { email }),
      ...(password && { password }),
    };
    if (Object.keys(changes).length === 0) return handleOpenChange(false);

    const parsed = (isAdmin ? updateUserSchema : updateSelfSchema).safeParse(changes);
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error));
    try {
      const updated = await updateUser({ id: user.id, ...parsed.data }).unwrap();
      handleOpenChange(false);
      toast.success(isSelf ? "Profile saved" : `${updated.name} saved`);
    } catch (err) {
      // Email is a user's only unique field.
      if (errorStatus(err) === 409) return setErrors({ email: ["That email is already in use"] });
      setErrors(apiFieldErrors(err));
      toast.error(errorMessage(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isSelf ? "Your profile" : `Edit ${user.name}`}</DialogTitle>
          <DialogDescription>
            {isLocked
              ? "Demo accounts are shared, so they cannot be changed. Sign up to try editing a profile."
              : "Leave the password blank to keep the current one."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          <Field label="Name" htmlFor="edit-user-name" errors={errors.name}>
            <Input id="edit-user-name" name="name" defaultValue={user.name} disabled={isLocked} />
          </Field>
          <Field
            label="Email"
            htmlFor="edit-user-email"
            errors={errors.email}
            hint={!isAdmin && !isLocked ? "Only an Admin can change your email." : undefined}
          >
            <Input
              id="edit-user-email"
              name="email"
              type="email"
              defaultValue={user.email}
              disabled={isLocked || !isAdmin}
            />
          </Field>
          {!isLocked && (
            <Field label="New password" htmlFor="edit-user-password" errors={errors.password}>
              <Input id="edit-user-password" name="password" type="password" autoComplete="new-password" />
            </Field>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              {isLocked ? "Close" : "Cancel"}
            </Button>
            {!isLocked && (
              <Button type="submit" disabled={isLoading}>
                Save changes
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
