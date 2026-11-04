import { cn } from "cn";
import Link from "next/link";
import { PriorityBadge } from "@/components/badges";
import { Person } from "@/components/person";
import { StatusSelect } from "@/components/status-select";
import { STUB_COLORS, TicketStub } from "@/components/ticket-stub";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRelative } from "@/lib/format";
import { ticketKey, type Ticket } from "@/lib/types";

interface TicketListProps {
  tickets: Ticket[];
  showProject?: boolean;
}

/** A table on large screens, ticket stubs on small ones. */
export function TicketList({ tickets, showProject }: TicketListProps) {
  return (
    <>
      <div className="grid gap-2 md:hidden">
        {tickets.map((ticket) => (
          <TicketStub
            key={ticket.id}
            ticket={ticket}
            showProject={showProject}
            status={<StatusSelect ticket={ticket} />}
          />
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28 pl-4">Key</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-24">Priority</TableHead>
              <TableHead className="w-36">Status</TableHead>
              <TableHead className="w-44">Assignee</TableHead>
              <TableHead className="w-32">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="pl-4">
                  <span className="inline-flex items-center gap-2 font-mono text-xs font-semibold">
                    <span aria-hidden className={cn("h-5 w-1 rounded-full", STUB_COLORS[ticket.priority])} />
                    {ticketKey(ticket)}
                  </span>
                </TableCell>
                <TableCell className="max-w-0 whitespace-normal">
                  <Link href={`/tickets/${ticket.id}`} className="line-clamp-1 font-medium hover:text-primary hover:underline">
                    {ticket.title}
                  </Link>
                  {showProject && <p className="truncate text-xs text-muted-foreground">{ticket.project.name}</p>}
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={ticket.priority} />
                </TableCell>
                <TableCell>
                  <StatusSelect ticket={ticket} />
                </TableCell>
                <TableCell>
                  <Person person={ticket.assignee} emptyLabel="Unassigned" />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatRelative(ticket.updatedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
