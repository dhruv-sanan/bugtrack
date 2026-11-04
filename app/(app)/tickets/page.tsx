"use client";

import { Plus, SearchX, Ticket as TicketIcon, UserRoundPlus } from "lucide-react";
import { Suspense } from "react";
import { FilterBar } from "@/components/filter-bar";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { EmptyState, ListSkeleton, QueryError } from "@/components/states";
import { TicketDialog } from "@/components/ticket-dialog";
import { TicketList } from "@/components/ticket-list";
import { Button } from "@/components/ui/button";
import { useListProjectsQuery, useListTicketsQuery } from "@/lib/api";
import { toTicketQuery, useTicketFilters } from "@/lib/use-ticket-filters";

function TicketsContent() {
  const controls = useTicketFilters();
  const { filters, setFilters, clearFilters, hasFilters } = controls;
  const tickets = useListTicketsQuery(toTicketQuery(filters));
  const projects = useListProjectsQuery({ limit: 200 });
  const hasProjects = (projects.data?.data.length ?? 0) > 0;

  const newTicket = (
    <TicketDialog
      trigger={
        <Button size="lg">
          <Plus /> New ticket
        </Button>
      }
    />
  );

  return (
    <>
      <PageHeader
        title="Tickets"
        label={tickets.data ? String(tickets.data.meta.total) : undefined}
        actions={hasProjects && newTicket}
      />
      <FilterBar controls={controls} />

      {tickets.isLoading && <ListSkeleton />}
      {tickets.error && (
        <QueryError error={tickets.error} resource="ticket list" backHref="/projects" onRetry={tickets.refetch} />
      )}
      {tickets.data?.data.length === 0 && hasFilters && (
        <EmptyState
          icon={SearchX}
          title="No tickets match these filters"
          action={
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      )}
      {tickets.data?.data.length === 0 && !hasFilters && !projects.isLoading && !hasProjects && (
        <EmptyState icon={UserRoundPlus} title="You are not in a project yet">
          Tickets belong to projects. Ask an Admin or Manager to add you, and any ticket assigned to you will show up here
          and arrive by email.
        </EmptyState>
      )}
      {tickets.data?.data.length === 0 && !hasFilters && hasProjects && (
        <EmptyState icon={TicketIcon} title="No tickets yet" action={newTicket}>
          Report the first bug to get started.
        </EmptyState>
      )}
      {tickets.data && tickets.data.data.length > 0 && (
        <>
          <TicketList tickets={tickets.data.data} showProject />
          <Pagination meta={tickets.data.meta} onPageChange={(page) => setFilters({ page })} />
        </>
      )}
    </>
  );
}

export default function TicketsPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <TicketsContent />
    </Suspense>
  );
}
