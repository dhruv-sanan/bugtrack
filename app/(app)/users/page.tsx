"use client";

import { Plus, ShieldAlert, Trash2, UsersRound } from "lucide-react";
import { useDeferredValue, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Field } from "@/components/field";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { Person } from "@/components/person";
import { EmptyState, ListSkeleton, QueryError } from "@/components/states";
import { Badge } from "@/components/ui/badge";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useListUsersQuery,
  useUpdateUserMutation,
} from "@/lib/api";
import { apiFieldErrors, errorMessage, zodFieldErrors, type FieldErrors } from "@/lib/errors";
import type { User } from "@/lib/types";
import { useCurrentUser } from "@/lib/use-current-user";
import { canManageUsers } from "@/shared/permissions";
import { isDemoAccount, ROLE_LABELS, ROLES, type Role } from "@/shared/constants";
import { createUserSchema } from "@/shared/schemas";

function RoleSelect({ value, onChange, disabled, id }: { value: Role; onChange: (role: Role) => void; disabled?: boolean; id?: string }) {
  return (
    <Select value={value} onValueChange={(role) => onChange(role as Role)} disabled={disabled}>
      <SelectTrigger id={id} aria-label="Role" className="w-full sm:w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((role) => (
          <SelectItem key={role} value={role}>
            {ROLE_LABELS[role]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function NewUserDialog() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>("DEVELOPER");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [createUser, { isLoading }] = useCreateUserMutation();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    const parsed = createUserSchema.safeParse({ ...Object.fromEntries(new FormData(event.currentTarget)), role });
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error));
    try {
      const user = await createUser(parsed.data).unwrap();
      setOpen(false);
      toast.success(`${user.name} added`);
    } catch (err) {
      setErrors(apiFieldErrors(err));
      toast.error(errorMessage(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <Plus /> New user
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New user</DialogTitle>
          <DialogDescription>Share the password with them directly.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          <Field label="Name" htmlFor="user-name" errors={errors.name}>
            <Input id="user-name" name="name" />
          </Field>
          <Field label="Email" htmlFor="user-email" errors={errors.email}>
            <Input id="user-email" name="email" type="email" />
          </Field>
          <Field label="Password" htmlFor="user-password" errors={errors.password}>
            <Input id="user-password" name="password" type="password" autoComplete="new-password" />
          </Field>
          <Field label="Role" htmlFor="user-role" errors={errors.role}>
            <RoleSelect id="user-role" value={role} onChange={setRole} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              Add user
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function useUserActions(user: User) {
  const currentUser = useCurrentUser();
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  // The API refuses these too. Disabling them explains the rule before anyone tries.
  const isLocked = user.id === currentUser.id || isDemoAccount(user.email);

  async function changeRole(role: Role) {
    try {
      await updateUser({ id: user.id, role }).unwrap();
      toast.success(`${user.name} is now ${ROLE_LABELS[role]}`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function remove() {
    try {
      await deleteUser(user.id).unwrap();
      toast.success(`${user.name} deleted`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return { isLocked, changeRole, remove };
}

function DeleteUserButton({ user, disabled, onConfirm }: { user: User; disabled: boolean; onConfirm: () => void }) {
  return (
    <ConfirmDialog
      title={`Delete ${user.name}?`}
      description="They lose access, and their tickets become unassigned. This cannot be undone."
      confirmLabel="Delete user"
      onConfirm={onConfirm}
      trigger={
        <Button variant="ghost" size="icon" aria-label={`Delete ${user.name}`} disabled={disabled}>
          <Trash2 />
        </Button>
      }
    />
  );
}

function UserLabel({ user }: { user: User }) {
  const currentUser = useCurrentUser();
  return (
    <span className="flex items-center gap-2">
      <Person person={user} emptyLabel="" />
      {user.id === currentUser.id && <Badge variant="secondary">You</Badge>}
      {isDemoAccount(user.email) && <Badge variant="outline">Demo</Badge>}
    </span>
  );
}

function UserRow({ user }: { user: User }) {
  const { isLocked, changeRole, remove } = useUserActions(user);
  return (
    <TableRow>
      <TableCell className="pl-4">
        <UserLabel user={user} />
      </TableCell>
      <TableCell className="text-muted-foreground">{user.email}</TableCell>
      <TableCell>
        <RoleSelect value={user.role} onChange={changeRole} disabled={isLocked} />
      </TableCell>
      <TableCell className="w-12 text-right">
        <DeleteUserButton user={user} disabled={isLocked} onConfirm={remove} />
      </TableCell>
    </TableRow>
  );
}

function UserCard({ user }: { user: User }) {
  const { isLocked, changeRole, remove } = useUserActions(user);
  return (
    <div className="rounded-xl border bg-card p-4">
      <UserLabel user={user} />
      <p className="mt-1 truncate text-xs text-muted-foreground">{user.email}</p>
      <div className="mt-3 flex items-center gap-2">
        <RoleSelect value={user.role} onChange={changeRole} disabled={isLocked} />
        <DeleteUserButton user={user} disabled={isLocked} onConfirm={remove} />
      </div>
    </div>
  );
}

function UsersContent() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDeferredValue(search.trim());
  const { data, error, isLoading, refetch } = useListUsersQuery({ q: q || undefined, page });

  return (
    <>
      <PageHeader title="Users" label={data ? String(data.meta.total) : undefined} actions={<NewUserDialog />} />
      <Input
        type="search"
        aria-label="Search users"
        placeholder="Search by name or email"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
        className="mb-4 bg-card sm:w-72"
      />

      {isLoading && <ListSkeleton />}
      {error && <QueryError error={error} resource="user list" backHref="/tickets" onRetry={refetch} />}
      {data?.data.length === 0 && <EmptyState icon={UsersRound} title="No users match this search" />}

      {data && data.data.length > 0 && (
        <>
          <div className="grid gap-2 md:hidden">
            {data.data.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
          <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-36">Role</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((user) => (
                  <UserRow key={user.id} user={user} />
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination meta={data.meta} onPageChange={setPage} />
        </>
      )}
    </>
  );
}

export default function UsersPage() {
  const user = useCurrentUser();
  // Managers can read GET /users for member pickers, so an API error would not stop them here.
  if (!canManageUsers(user)) {
    return <EmptyState icon={ShieldAlert} title="Only Admins can manage users" />;
  }
  return <UsersContent />;
}
