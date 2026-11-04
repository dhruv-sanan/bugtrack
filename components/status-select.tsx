"use client";

import { toast } from "sonner";
import { StatusBadge, StatusGlyph } from "@/components/badges";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useUpdateTicketMutation } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { ticketKey, type Ticket } from "@/lib/types";
import { useCurrentUser } from "@/lib/use-current-user";
import { canEditTicket } from "@/shared/permissions";
import { STATUS_LABELS, TICKET_STATUSES, type TicketStatus } from "@/shared/constants";

/** Changes status without dragging, so touch and keyboard users can too. Read-only without permission. */
export function StatusSelect({ ticket }: { ticket: Ticket }) {
  const user = useCurrentUser();
  const [updateTicket] = useUpdateTicketMutation();

  if (!canEditTicket(user, true, ticket)) return <StatusBadge status={ticket.status} />;

  async function changeStatus(status: string) {
    try {
      await updateTicket({ id: ticket.id, status: status as TicketStatus }).unwrap();
    } catch (err) {
      toast.error(`Could not move ${ticketKey(ticket)}: ${errorMessage(err)}`);
    }
  }

  return (
    <Select value={ticket.status} onValueChange={changeStatus}>
      <SelectTrigger
        size="sm"
        aria-label={`Status of ${ticketKey(ticket)}`}
        className="relative z-10 border-transparent bg-transparent px-1.5 text-xs font-medium shadow-none hover:bg-muted"
      >
        <span className="flex items-center gap-1.5">
          <StatusGlyph status={ticket.status} />
          {STATUS_LABELS[ticket.status]}
        </span>
      </SelectTrigger>
      <SelectContent>
        {TICKET_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            <StatusGlyph status={status} />
            {STATUS_LABELS[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
