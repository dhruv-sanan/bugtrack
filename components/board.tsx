"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";
import { cn } from "cn";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { StatusGlyph } from "@/components/badges";
import { StatusSelect } from "@/components/status-select";
import { TicketStub } from "@/components/ticket-stub";
import { useUpdateTicketMutation } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { ticketKey, type Ticket } from "@/lib/types";
import { useCurrentUser } from "@/lib/use-current-user";
import { canEditTicket } from "@/shared/permissions";
import {
  STATUS_LABELS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type TicketStatus,
} from "@/shared/constants";

/** Keyboard dragging has no pointer position, so it falls back to overlap with the column. */
const detectColumn: CollisionDetection = (args) =>
  args.pointerCoordinates ? pointerWithin(args) : rectIntersection(args);

const byPriorityThenRecent = (a: Ticket, b: Ticket) =>
  TICKET_PRIORITIES.indexOf(b.priority) - TICKET_PRIORITIES.indexOf(a.priority) ||
  b.updatedAt.localeCompare(a.updatedAt);

export function Board({ tickets }: { tickets: Ticket[] }) {
  const [updateTicket] = useUpdateTicketMutation();
  const [activeId, setActiveId] = useState<number | null>(null);
  const sensors = useSensors(
    // The small distance lets a tap on the handle stay a tap.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const columns = useMemo(() => {
    const sorted = [...tickets].sort(byPriorityThenRecent);
    return TICKET_STATUSES.map((status) => ({
      status,
      tickets: sorted.filter((ticket) => ticket.status === status),
    }));
  }, [tickets]);

  const activeTicket = tickets.find((ticket) => ticket.id === activeId);

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    const ticket = tickets.find((candidate) => candidate.id === active.id);
    const status = over?.id as TicketStatus | undefined;
    if (!ticket || !status || ticket.status === status) return;

    try {
      await updateTicket({ id: ticket.id, status }).unwrap();
    } catch (err) {
      toast.error(`Could not move ${ticketKey(ticket)}: ${errorMessage(err)}`);
    }
  }

  return (
    <DndContext
      id="ticket-board"
      sensors={sensors}
      collisionDetection={detectColumn}
      onDragStart={({ active }) => setActiveId(Number(active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      {/* Columns scroll sideways on small screens, and fit side by side on large ones. */}
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 xl:mx-0 xl:grid xl:grid-cols-4 xl:overflow-visible xl:px-0">
        {columns.map((column) => (
          <BoardColumn key={column.status} {...column} />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTicket && (
          <TicketStub ticket={activeTicket} handle={{}} className="-rotate-2 drop-shadow-[0_10px_16px_rgb(20_27_45/0.28)]" />
        )}
      </DragOverlay>
    </DndContext>
  );
}

function BoardColumn({ status, tickets }: { status: TicketStatus; tickets: Ticket[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      aria-label={STATUS_LABELS[status]}
      className={cn(
        "flex w-[82vw] max-w-80 shrink-0 snap-center flex-col rounded-xl bg-secondary/70 p-2 transition-colors sm:w-72 xl:w-auto xl:max-w-none",
        isOver && "bg-accent ring-2 ring-primary ring-inset",
      )}
    >
      <header className="flex items-center gap-2 px-1.5 pt-1 pb-2.5">
        <StatusGlyph status={status} />
        <h2 className="text-sm font-semibold">{STATUS_LABELS[status]}</h2>
        <span className="ml-auto font-mono text-xs text-muted-foreground">{tickets.length}</span>
      </header>
      <div className="flex min-h-40 flex-1 flex-col gap-2">
        {tickets.map((ticket) => (
          <DraggableTicket key={ticket.id} ticket={ticket} />
        ))}
        {tickets.length === 0 && (
          <p className="m-auto px-4 text-center text-xs text-muted-foreground">No tickets here</p>
        )}
      </div>
    </section>
  );
}

function DraggableTicket({ ticket }: { ticket: Ticket }) {
  const user = useCurrentUser();
  const canMove = canEditTicket(user, true, ticket);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: ticket.id,
    disabled: !canMove,
  });

  return (
    <div ref={setNodeRef} className={cn(isDragging && "opacity-40")}>
      <TicketStub
        ticket={ticket}
        status={<StatusSelect ticket={ticket} />}
        handle={canMove ? { ref: setActivatorNodeRef, ...attributes, ...listeners } : undefined}
      />
    </div>
  );
}
