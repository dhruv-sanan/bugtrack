"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import {
  TICKET_PRIORITIES,
  TICKET_SORTS,
  TICKET_STATUSES,
  type TicketPriority,
  type TicketSort,
  type TicketStatus,
} from "@/shared/constants";
import type { ListTicketsArgs } from "./api";

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  /** A user ID, "me" or "none". */
  assignee?: string;
  q: string;
  sort: TicketSort;
  page: number;
}

const DEFAULT_SORT: TicketSort = "updated";

const oneOf = <T extends string>(allowed: readonly T[], value: string | null | undefined) =>
  allowed.find((candidate) => candidate === value);

/** Filters live in the URL, so links and refreshes keep them. Invalid values are ignored. */
export function useTicketFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() ?? "/";

  const filters = useMemo<TicketFilters>(() => {
    const assignee = searchParams?.get("assignee");
    const page = Number(searchParams?.get("page"));
    return {
      status: oneOf(TICKET_STATUSES, searchParams?.get("status")),
      priority: oneOf(TICKET_PRIORITIES, searchParams?.get("priority")),
      assignee: assignee && /^(me|none|\d+)$/.test(assignee) ? assignee : undefined,
      q: searchParams?.get("q") ?? "",
      sort: oneOf(TICKET_SORTS, searchParams?.get("sort")) ?? DEFAULT_SORT,
      page: Number.isInteger(page) && page > 0 ? page : 1,
    };
  }, [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<Record<keyof TicketFilters, string | number | undefined>>) => {
      // Read the live URL: the debounced search calls this after renders have moved on.
      const next = new URLSearchParams(window.location.search);
      // Any change other than paging can shrink the results, so go back to the first page.
      if (!("page" in patch)) next.delete("page");
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === "") next.delete(key);
        else next.set(key, String(value));
      }
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const clearFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const hasFilters = Boolean(filters.status || filters.priority || filters.assignee || filters.q);

  return { filters, setFilters, clearFilters, hasFilters };
}

/** Leaves out empty values, because the API rejects `status=` with a 400. */
export function toTicketQuery(filters: TicketFilters): ListTicketsArgs {
  const query: ListTicketsArgs = { sort: filters.sort, page: filters.page };
  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;
  if (filters.q) query.q = filters.q;
  if (filters.assignee) {
    query.assigneeId =
      filters.assignee === "me" || filters.assignee === "none"
        ? filters.assignee
        : Number(filters.assignee);
  }
  return query;
}
