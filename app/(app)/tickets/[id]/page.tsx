"use client";

import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { PriorityBadge } from "@/components/badges";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Person } from "@/components/person";
import { ListSkeleton, QueryError } from "@/components/states";
import { StatusSelect } from "@/components/status-select";
import { TicketDialog } from "@/components/ticket-dialog";
import { STUB_COLORS } from "@/components/ticket-stub";
import { Button } from "@/components/ui/button";
import { useDeleteTicketMutation, useGetTicketQuery } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { formatDate, formatRelative } from "@/lib/format";
import { ticketKey } from "@/lib/types";
import { useCurrentUser } from "@/lib/use-current-user";
import { useRouteId } from "@/lib/use-route-id";
import { canAssignOrDeleteTicket, canEditTicket } from "@/shared/permissions";

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-2 py-2.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm">{children}</dd>
    </div>
  );
}

export default function TicketDetailPage() {
  const ticketId = useRouteId();
  const user = useCurrentUser();
  const router = useRouter();
  const { data: ticket, error, isLoading, refetch } = useGetTicketQuery(ticketId);
  const [deleteTicket] = useDeleteTicketMutation();

  if (isLoading) return <ListSkeleton rows={3} />;
  if (error || !ticket) {
    return <QueryError error={error} resource="ticket" backHref="/tickets" onRetry={refetch} />;
  }

  const key = ticketKey(ticket);

  async function handleDelete() {
    try {
      await deleteTicket({ id: ticketId, projectId: ticket!.projectId }).unwrap();
      toast.success(`${key} deleted`);
      router.push(`/projects/${ticket!.projectId}`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <>
      <Link
        href={`/projects/${ticket.projectId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" /> {ticket.project.name}
      </Link>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="drop-shadow-[0_1px_2px_rgb(20_27_45/0.14)]">
          <article className="ticket-stub grid min-h-72 grid-cols-[var(--stub-width)_minmax(0,1fr)] bg-card">
            <div className={`flex justify-center py-4 ${STUB_COLORS[ticket.priority]}`}>
              <span className="ticket-key font-mono text-xs font-semibold tracking-wider">{key}</span>
            </div>
            <div className="min-w-0 border-l-2 border-dashed border-border p-5 sm:p-6">
              <h1 className="text-2xl leading-tight font-semibold wrap-anywhere sm:text-3xl">{ticket.title}</h1>
              <p className="mt-4 text-sm leading-relaxed wrap-anywhere whitespace-pre-wrap">
                {ticket.description || <span className="text-muted-foreground">No description.</span>}
              </p>
            </div>
          </article>
        </div>

        <aside className="rounded-xl border bg-card p-4">
          <dl className="divide-y">
            <Detail label="Status">
              <StatusSelect ticket={ticket} />
            </Detail>
            <Detail label="Priority">
              <PriorityBadge priority={ticket.priority} />
            </Detail>
            <Detail label="Assignee">
              <Person person={ticket.assignee} emptyLabel="Unassigned" />
            </Detail>
            <Detail label="Reporter">
              <Person person={ticket.reporter} emptyLabel="Deleted user" />
            </Detail>
            <Detail label="Created">{formatDate(ticket.createdAt)}</Detail>
            <Detail label="Updated">{formatRelative(ticket.updatedAt)}</Detail>
          </dl>
          <div className="mt-3 flex gap-2 border-t pt-4">
            {canEditTicket(user, true, ticket) && (
              <TicketDialog
                ticket={ticket}
                trigger={
                  <Button variant="outline" className="flex-1">
                    <Pencil /> Edit
                  </Button>
                }
              />
            )}
            {canAssignOrDeleteTicket(user, true) && (
              <ConfirmDialog
                title={`Delete ${key}?`}
                description="This permanently removes the ticket. It cannot be undone."
                confirmLabel="Delete ticket"
                onConfirm={handleDelete}
                trigger={
                  <Button variant="destructive" className="flex-1">
                    <Trash2 /> Delete
                  </Button>
                }
              />
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
