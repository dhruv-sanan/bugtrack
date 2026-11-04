"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { TicketForm } from "@/components/ticket-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ticketKey, type Ticket } from "@/lib/types";

interface TicketDialogProps {
  trigger: ReactNode;
  /** Present when editing. */
  ticket?: Ticket;
  projectId?: number;
}

/** Radix unmounts closed content, so the form's state starts fresh every time it opens. */
export function TicketDialog({ trigger, ticket, projectId }: TicketDialogProps) {
  const [open, setOpen] = useState(false);

  function handleDone(saved: Ticket) {
    setOpen(false);
    toast.success(ticket ? `${ticketKey(saved)} saved` : `${ticketKey(saved)} created`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{ticket ? `Edit ${ticketKey(ticket)}` : "New ticket"}</DialogTitle>
          <DialogDescription>
            {ticket ? "Change the details of this ticket." : "Report a bug so someone can pick it up."}
          </DialogDescription>
        </DialogHeader>
        <TicketForm ticket={ticket} projectId={projectId} onDone={handleDone} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
