"use client";

import { ArrowLeft, ShieldAlert, Trash2, UserPlus, UserRoundX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/page-header";
import { Person } from "@/components/person";
import { ProjectForm } from "@/components/project-form";
import { EmptyState, ListSkeleton, QueryError } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useAddMemberMutation,
  useDeleteProjectMutation,
  useGetProjectQuery,
  useListMembersQuery,
  useListUsersQuery,
  useRemoveMemberMutation,
  useUpdateProjectMutation,
} from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useCurrentUser } from "@/lib/use-current-user";
import { useRouteId } from "@/lib/use-route-id";
import { canManageProject } from "@/shared/permissions";
import type { CreateProjectInput } from "@/shared/schemas";

function MembersSection({ projectId }: { projectId: number }) {
  const { data: members } = useListMembersQuery(projectId);
  const [search, setSearch] = useState("");
  const q = useDeferredValue(search.trim());
  const { data: users } = useListUsersQuery({ q: q || undefined, limit: 20 });
  const [addMember] = useAddMemberMutation();
  const [removeMember] = useRemoveMemberMutation();

  const memberIds = new Set(members?.map((member) => member.id));
  const candidates = users?.data.filter((user) => !memberIds.has(user.id)) ?? [];

  async function handleAdd(userId: number, name: string) {
    try {
      await addMember({ projectId, userId }).unwrap();
      toast.success(`${name} added`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function handleRemove(userId: number, name: string) {
    try {
      await removeMember({ projectId, userId }).unwrap();
      toast.success(`${name} removed`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="text-lg font-semibold">Members</h2>
      <p className="mb-3 text-sm text-muted-foreground">Only members can be assigned tickets in this project.</p>

      <ul className="divide-y">
        {members?.map((member) => (
          <li key={member.id} className="flex items-center justify-between gap-3 py-2">
            <span className="min-w-0">
              <Person person={member} emptyLabel="" />
              <span className="block truncate pl-8 text-xs text-muted-foreground">{member.email}</span>
            </span>
            <ConfirmDialog
              title={`Remove ${member.name}?`}
              description="Their tickets in this project become unassigned."
              confirmLabel="Remove member"
              onConfirm={() => handleRemove(member.id, member.name)}
              trigger={
                <Button variant="ghost" size="sm">
                  <UserRoundX /> Remove
                </Button>
              }
            />
          </li>
        ))}
        {members?.length === 0 && <li className="py-2 text-sm text-muted-foreground">No members yet.</li>}
      </ul>

      <h3 className="mt-5 mb-2 text-sm font-semibold">Add a member</h3>
      <Input
        type="search"
        aria-label="Search people to add"
        placeholder="Search by name or email"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <ul className="mt-1 max-h-64 divide-y overflow-y-auto">
        {candidates.map((user) => (
          <li key={user.id} className="flex items-center justify-between gap-3 py-2">
            <span className="min-w-0">
              <Person person={user} emptyLabel="" />
              <span className="block truncate pl-8 text-xs text-muted-foreground">{user.email}</span>
            </span>
            <Button variant="outline" size="sm" onClick={() => handleAdd(user.id, user.name)}>
              <UserPlus /> Add
            </Button>
          </li>
        ))}
        {users && candidates.length === 0 && (
          <li className="py-2 text-sm text-muted-foreground">No one else matches.</li>
        )}
      </ul>
    </section>
  );
}

export default function ProjectSettingsPage() {
  const projectId = useRouteId();
  const user = useCurrentUser();
  const router = useRouter();
  const { data: project, error, isLoading, refetch } = useGetProjectQuery(projectId);
  const [updateProject, updateState] = useUpdateProjectMutation();
  const [deleteProject] = useDeleteProjectMutation();

  if (isLoading) return <ListSkeleton />;
  if (error || !project) {
    return <QueryError error={error} resource="project" backHref="/projects" onRetry={refetch} />;
  }
  if (!canManageProject(user, true)) {
    return (
      <EmptyState icon={ShieldAlert} title="Only Admins and Managers can change project settings">
        You can still view and work on this project&apos;s tickets.
      </EmptyState>
    );
  }

  async function handleSave(values: CreateProjectInput) {
    await updateProject({ id: projectId, ...values }).unwrap();
    toast.success("Project saved");
  }

  async function handleDelete() {
    try {
      await deleteProject(projectId).unwrap();
      toast.success(`${project!.name} deleted`);
      router.push("/projects");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <>
      <Link
        href={`/projects/${projectId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" /> {project.name}
      </Link>
      <PageHeader title="Project settings" label={project.key} />

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <div className="grid gap-4">
          <section className="rounded-xl border bg-card p-5">
            <h2 className="mb-3 text-lg font-semibold">Details</h2>
            <ProjectForm
              project={project}
              onSubmit={handleSave}
              actions={
                <Button type="submit" disabled={updateState.isLoading}>
                  Save changes
                </Button>
              }
            />
          </section>

          <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-card p-5">
            <div>
              <h2 className="text-lg font-semibold">Delete project</h2>
              <p className="text-sm text-muted-foreground">Also deletes its {project._count.tickets} tickets.</p>
            </div>
            <ConfirmDialog
              title={`Delete ${project.name}?`}
              description={`This permanently removes the project and its ${project._count.tickets} tickets. It cannot be undone.`}
              confirmLabel="Delete project"
              onConfirm={handleDelete}
              trigger={
                <Button variant="destructive">
                  <Trash2 /> Delete project
                </Button>
              }
            />
          </section>
        </div>

        <MembersSection projectId={projectId} />
      </div>
    </>
  );
}
