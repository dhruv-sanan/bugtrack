"use client";

import { FolderKanban, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { ProjectForm } from "@/components/project-form";
import { EmptyState, ListSkeleton, QueryError } from "@/components/states";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateProjectMutation, useListProjectsQuery } from "@/lib/api";
import { useCurrentUser } from "@/lib/use-current-user";
import { canCreateProject } from "@/shared/permissions";
import type { CreateProjectInput } from "@/shared/schemas";

function NewProjectDialog() {
  const [open, setOpen] = useState(false);
  const [createProject, { isLoading }] = useCreateProjectMutation();

  async function handleCreate(values: CreateProjectInput) {
    const project = await createProject(values).unwrap();
    setOpen(false);
    toast.success(`${project.name} created`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <Plus /> New project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>The key prefixes every ticket number, like BUG-12.</DialogDescription>
        </DialogHeader>
        <ProjectForm
          onSubmit={handleCreate}
          actions={
            <>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                Create project
              </Button>
            </>
          }
        />
      </DialogContent>
    </Dialog>
  );
}

export default function ProjectsPage() {
  const user = useCurrentUser();
  const { data, error, isLoading, refetch } = useListProjectsQuery({ limit: 200 });
  const canCreate = canCreateProject(user);

  return (
    <>
      <PageHeader
        title="Projects"
        label={data ? String(data.meta.total) : undefined}
        actions={canCreate && <NewProjectDialog />}
      />

      {isLoading && <ListSkeleton />}
      {error && <QueryError error={error} resource="project list" backHref="/tickets" onRetry={refetch} />}
      {data?.data.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          title={canCreate ? "No projects yet" : "You are not in a project yet"}
          action={canCreate && <NewProjectDialog />}
        >
          {canCreate
            ? "Create a project to start tracking its bugs."
            : "Ask an Admin or Manager to add you, and the project will show up here."}
        </EmptyState>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data?.data.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="group flex flex-col rounded-xl border bg-card p-5 transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <span className="font-mono text-xs font-semibold text-muted-foreground">{project.key}</span>
            <h2 className="mt-1 text-xl font-semibold group-hover:text-primary">{project.name}</h2>
            <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">
              {project.description || "No description."}
            </p>
            <p className="mt-4 font-mono text-xs text-muted-foreground">
              {project._count.tickets} {project._count.tickets === 1 ? "ticket" : "tickets"} · {project._count.members}{" "}
              {project._count.members === 1 ? "member" : "members"}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
