"use client";

import { Search, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Person } from "@/lib/types";
import type { useTicketFilters } from "@/lib/use-ticket-filters";
import {
  PRIORITY_LABELS,
  SORT_LABELS,
  STATUS_LABELS,
  TICKET_PRIORITIES,
  TICKET_SORTS,
  TICKET_STATUSES,
} from "@/shared/constants";

const SEARCH_DEBOUNCE_MS = 300;
// Radix Select throws on an empty value, so "no filter" needs a real one.
const ALL = "all";

interface FilterBarProps {
  controls: ReturnType<typeof useTicketFilters>;
  /** The board's columns already show status, so it hides this filter. */
  showStatus?: boolean;
  showSort?: boolean;
  /** Without members, the assignee filter offers only "Assigned to me". */
  members?: Person[];
}

interface FilterSelectProps {
  label: string;
  value: string | undefined;
  options: [value: string, label: string][];
  onChange: (value: string | undefined) => void;
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <Select value={value ?? ALL} onValueChange={(next) => onChange(next === ALL ? undefined : next)}>
      <SelectTrigger aria-label={label} className="w-full bg-card sm:w-auto">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{label}: any</SelectItem>
        {options.map(([optionValue, optionLabel]) => (
          <SelectItem key={optionValue} value={optionValue}>
            {optionLabel}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function FilterBar({ controls, showStatus = true, showSort = true, members }: FilterBarProps) {
  const { filters, setFilters, clearFilters, hasFilters } = controls;
  const [search, setSearch] = useState(filters.q);
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  function handleSearch(value: string) {
    setSearch(value);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setFilters({ q: value.trim() || undefined }), SEARCH_DEBOUNCE_MS);
  }

  function handleClear() {
    clearTimeout(debounce.current);
    setSearch("");
    clearFilters();
  }

  const assigneeOptions: [string, string][] = [
    ["me", "Assigned to me"],
    ...(members
      ? ([["none", "Unassigned"], ...members.map((member) => [String(member.id), member.name])] as [string, string][])
      : []),
  ];

  return (
    <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
      <div className="relative col-span-2 sm:w-64">
        <Search aria-hidden className="absolute top-2 left-2.5 size-4 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Search tickets"
          placeholder="Search title or BUG-12"
          value={search}
          onChange={(event) => handleSearch(event.target.value)}
          className="bg-card pl-8"
        />
      </div>
      {showStatus && (
        <FilterSelect
          label="Status"
          value={filters.status}
          options={TICKET_STATUSES.map((status) => [status, STATUS_LABELS[status]])}
          onChange={(status) => setFilters({ status })}
        />
      )}
      <FilterSelect
        label="Priority"
        value={filters.priority}
        options={[...TICKET_PRIORITIES].reverse().map((priority) => [priority, PRIORITY_LABELS[priority]])}
        onChange={(priority) => setFilters({ priority })}
      />
      <FilterSelect
        label="Assignee"
        value={filters.assignee}
        options={assigneeOptions}
        onChange={(assignee) => setFilters({ assignee })}
      />
      {showSort && (
        <Select value={filters.sort} onValueChange={(sort) => setFilters({ sort })}>
          <SelectTrigger aria-label="Sort by" className="w-full bg-card sm:w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TICKET_SORTS.map((sort) => (
              <SelectItem key={sort} value={sort}>
                {SORT_LABELS[sort]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {hasFilters && (
        <Button variant="ghost" onClick={handleClear}>
          <X /> Clear
        </Button>
      )}
    </div>
  );
}
