"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Field } from "@/components/field";
import { Person } from "@/components/person";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateTicketMutation,
  useListMembersQuery,
  useListProjectsQuery,
  useUpdateTicketMutation,
} from "@/lib/api";
import { apiFieldErrors, errorMessage, zodFieldErrors, type FieldErrors } from "@/lib/errors";
import type { Ticket } from "@/lib/types";
import { useCurrentUser } from "@/lib/use-current-user";
import { canAssignOrDeleteTicket } from "@/shared/permissions";
import { createTicketSchema, updateTicketSchema, type UpdateTicketInput } from "@/shared/schemas";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type TicketPriority,
  type TicketStatus,
} from "@/shared/constants";

const UNASSIGNED = "none";

interface TicketFormProps {
  /** Present when editing. */
  ticket?: Ticket;
  /** Fixes the project when creating. Without it, the form shows a project picker. */
  projectId?: number;
  onDone: (ticket: Ticket) => void;
  onCancel: () => void;
}

export function TicketForm({ ticket, projectId: fixedProjectId, onDone, onCancel }: TicketFormProps) {
  const user = useCurrentUser();
  const canAssign = canAssignOrDeleteTicket(user, true);

  const [projectId, setProjectId] = useState(ticket?.projectId ?? fixedProjectId);
  const [title, setTitle] = useState(ticket?.title ?? "");
  const [description, setDescription] = useState(ticket?.description ?? "");
  const [status, setStatus] = useState<TicketStatus>(ticket?.status ?? "TODO");
  const [priority, setPriority] = useState<TicketPriority>(ticket?.priority ?? "MEDIUM");
  const [assigneeId, setAssigneeId] = useState<number | null>(ticket?.assigneeId ?? null);
  const [errors, setErrors] = useState<FieldErrors>({});

  const needsProjectPicker = !ticket && !fixedProjectId;
  const { data: projects } = useListProjectsQuery({ limit: 200 }, { skip: !needsProjectPicker });
  const { data: members } = useListMembersQuery(projectId as number, { skip: !projectId || !canAssign });

  const [createTicket, createState] = useCreateTicketMutation();
  const [updateTicket, updateState] = useUpdateTicketMutation();
  const isSaving = createState.isLoading || updateState.isLoading;

  function changeProject(value: string) {
    setProjectId(Number(value));
    // The API rejects an assignee who is not a member of the chosen project.
    setAssigneeId(null);
  }

  async function saveChanges(existing: Ticket) {
    const candidate: UpdateTicketInput = {
      ...(title !== existing.title && { title }),
      ...(description !== existing.description && { description }),
      ...(status !== existing.status && { status }),
      ...(priority !== existing.priority && { priority }),
      ...(assigneeId !== existing.assigneeId && { assigneeId }),
    };
    if (Object.keys(candidate).length === 0) return onDone(existing);

    const parsed = updateTicketSchema.safeParse(candidate);
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error));
    onDone(await updateTicket({ id: existing.id, ...parsed.data }).unwrap());
  }

  async function createNew() {
    const parsed = createTicketSchema.safeParse({ projectId, title, description, status, priority, assigneeId });
    if (!parsed.success) return setErrors(zodFieldErrors(parsed.error));
    onDone(await createTicket(parsed.data).unwrap());
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrors({});
    try {
      await (ticket ? saveChanges(ticket) : createNew());
    } catch (err) {
      setErrors(apiFieldErrors(err));
      toast.error(errorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      {needsProjectPicker && (
        <Field label="Project" htmlFor="ticket-project" errors={errors.projectId && ["Choose a project"]}>
          <Select value={projectId ? String(projectId) : undefined} onValueChange={changeProject}>
            <SelectTrigger id="ticket-project" className="w-full">
              <SelectValue placeholder="Choose a project" />
            </SelectTrigger>
            <SelectContent>
              {projects?.data.map((project) => (
                <SelectItem key={project.id} value={String(project.id)}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}

      <Field label="Title" htmlFor="ticket-title" errors={errors.title}>
        <Input
          id="ticket-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What is broken?"
          autoFocus
        />
      </Field>

      <Field label="Description" htmlFor="ticket-description" errors={errors.description}>
        <Textarea
          id="ticket-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Steps to reproduce, and what you expected to happen"
          rows={4}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Priority" htmlFor="ticket-priority" errors={errors.priority}>
          <Select value={priority} onValueChange={(value) => setPriority(value as TicketPriority)}>
            <SelectTrigger id="ticket-priority" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[...TICKET_PRIORITIES].reverse().map((option) => (
                <SelectItem key={option} value={option}>
                  {PRIORITY_LABELS[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {ticket && (
          <Field label="Status" htmlFor="ticket-status" errors={errors.status}>
            <Select value={status} onValueChange={(value) => setStatus(value as TicketStatus)}>
              <SelectTrigger id="ticket-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TICKET_STATUSES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {STATUS_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}

        {canAssign && (
          <Field label="Assignee" htmlFor="ticket-assignee" errors={errors.assigneeId}>
            <Select
              value={assigneeId === null ? UNASSIGNED : String(assigneeId)}
              onValueChange={(value) => setAssigneeId(value === UNASSIGNED ? null : Number(value))}
              disabled={!projectId}
            >
              <SelectTrigger id="ticket-assignee" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                {members?.map((member) => (
                  <SelectItem key={member.id} value={String(member.id)}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}

        {!canAssign && ticket && (
          <div className="grid gap-1.5">
            <p className="text-sm font-medium">Assignee</p>
            <Person person={ticket.assignee} emptyLabel="Unassigned" />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {ticket ? "Save changes" : "Create ticket"}
        </Button>
      </div>
    </form>
  );
}
