import { cn } from "cn";
import { GripVertical } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { PriorityBadge } from "@/components/badges";
import { Avatar } from "@/components/person";
import { ticketKey, type Ticket } from "@/lib/types";
import type { TicketPriority } from "@/shared/constants";

export const STUB_COLORS: Record<TicketPriority, string> = {
  HIGH: "bg-priority-high text-white",
  MEDIUM: "bg-priority-medium text-foreground",
  LOW: "bg-priority-low text-white",
};

interface TicketStubProps {
  ticket: Ticket;
  /** Props for the drag handle. Without them the stub is a plain label. */
  handle?: ComponentProps<"button">;
  /** Shown beside the priority, usually a status control. */
  status?: ReactNode;
  showProject?: boolean;
  className?: string;
}

/** The signature card: a priority-coloured stub, torn from the body along a perforation. */
export function TicketStub({ ticket, handle, status, showProject, className }: TicketStubProps) {
  const key = ticketKey(ticket);
  const stubContent = (
    <>
      {handle && <GripVertical aria-hidden className="size-3.5 shrink-0 opacity-80" />}
      <span title={key} className="ticket-key truncate font-mono text-[11px] font-semibold tracking-wider">
        {key}
      </span>
    </>
  );
  const stubClass = cn(
    "flex flex-col items-center gap-2 py-2.5",
    "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-current focus-visible:outline-none",
    STUB_COLORS[ticket.priority],
  );

  return (
    <div className={cn("drop-shadow-[0_1px_2px_rgb(20_27_45/0.14)]", className)}>
      <article className="ticket-stub grid min-h-30 grid-cols-[var(--stub-width)_minmax(0,1fr)] overflow-hidden bg-card">
        {handle ? (
          <button type="button" aria-label={`Move ${key}`} {...handle} className={cn(stubClass, "cursor-grab touch-none active:cursor-grabbing")}>
            {stubContent}
          </button>
        ) : (
          <div className={stubClass}>{stubContent}</div>
        )}

        <div className="relative flex min-w-0 flex-col gap-2 border-l-2 border-dashed border-border p-3">
          {showProject && <p className="truncate text-xs text-muted-foreground">{ticket.project.name}</p>}
          <Link
            href={`/tickets/${ticket.id}`}
            className="line-clamp-3 text-sm leading-snug font-medium after:absolute after:inset-0 hover:text-primary focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
          >
            {ticket.title}
          </Link>
          <div className="relative z-10 mt-auto flex flex-wrap items-center gap-x-2 gap-y-1">
            <PriorityBadge priority={ticket.priority} />
            {status}
            <Avatar person={ticket.assignee} className="ml-auto" />
          </div>
        </div>
      </article>
    </div>
  );
}
