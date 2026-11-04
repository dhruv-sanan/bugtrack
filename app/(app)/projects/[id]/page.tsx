"use client";

import { Plus, SearchX, Settings, Ticket as TicketIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Board } from "@/components/board";
import { FilterBar } from "@/components/filter-bar";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { EmptyState, ListSkeleton, QueryError } from "@/components/states";
import { TicketDialog } from "@/components/ticket-dialog";
import { TicketList } from "@/components/ticket-list";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetProjectQuery, useListMembersQuery, useListTicketsQuery } from "@/lib/api";
import { setTicketView, useAppDispatch, useAppSelector, type TicketView } from "@/lib/store";
import { useCurrentUser } from "@/lib/use-current-user";
import { useRouteId } from "@/lib/use-route-id";
import { toTicketQuery, useTicketFilters } from "@/lib/use-ticket-filters";
import { canManageProject } from "@/shared/permissions";

const BOARD_LIMIT = 200;

function ProjectContent({ projectId }: { projectId: number }) {
  const user = useCurrentUser();
  const dispatch = useAppDispatch();
  const view = useAppSelector((state) => state.ui.ticketView);
  const controls = useTicketFilters();
  const { filters, setFilters, clearFilters, hasFilters } = controls;
  const isBoard = view === "board";

  const project = useGetProjectQuery(projectId);
  const { data: members } = useListMembersQuery(projectId, { skip: !project.data });

  // The board shows every status at once, so it ignores the status filter and paging.
  const query = { ...toTicketQuery(filters), projectId };
  const tickets = useListTicketsQuery(
    isBoard ? { ...query, status: undefined, page: 1, limit: BOARD_LIMIT, sort: "priority" } : query,
    { skip: !project.data },
  );

  if (project.isLoading) return <ListSkeleton />;
  if (project.error || !project.data) {
    return <QueryError error={project.error} resource="project" backHref="/projects" onRetry={project.refetch} />;
  }

  const newTicket = (
    <TicketDialog
      projectId={projectId}
      trigger={
        <Button size="lg">
          <Plus /> New ticket
        </Button>
      }
    />
  );

  const isEmpty = tickets.data?.data.length === 0;

  return (
    <>
      <PageHeader
        title={project.data.name}
        label={project.data.key}
        description={project.data.description}
        actions={
          <>
            {canManageProject(user, true) && (
              <Button variant="outline" size="lg" asChild>
                <Link href={`/projects/${projectId}/settings`}>
                  <Settings /> Settings
                </Link>
              </Button>
            )}
            {newTicket}
          </>
        }
      />

      <Tabs
        value={view}
        onValueChange={(next) => dispatch(setTicketView(next as TicketView))}
        className="mb-3"
      >
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>
      </Tabs>

      <FilterBar controls={controls} showStatus={!isBoard} showSort={!isBoard} members={members} />

      {tickets.isLoading && <ListSkeleton />}
      {tickets.error && (
        <QueryError error={tickets.error} resource="ticket list" backHref="/projects" onRetry={tickets.refetch} />
      )}
      {isEmpty && hasFilters && (
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
      {isEmpty && !hasFilters && (
        <EmptyState icon={TicketIcon} title="No tickets yet" action={newTicket}>
          Report the first bug in {project.data.name}.
        </EmptyState>
      )}
      {tickets.data && !isEmpty && isBoard && <Board tickets={tickets.data.data} />}
      {tickets.data && !isEmpty && !isBoard && (
        <>
          <TicketList tickets={tickets.data.data} />
          <Pagination meta={tickets.data.meta} onPageChange={(page) => setFilters({ page })} />
        </>
      )}
    </>
  );
}

export default function ProjectPage() {
  const projectId = useRouteId();
  return (
    <Suspense fallback={<ListSkeleton />}>
      <ProjectContent projectId={projectId} />
    </Suspense>
  );
}
