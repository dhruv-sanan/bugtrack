import { cn } from "cn";
import { initials } from "@/lib/format";
import type { Person as PersonData } from "@/lib/types";

export function Avatar({ person, className }: { person: PersonData | null; className?: string }) {
  return (
    <span
      title={person?.name ?? "Unassigned"}
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold",
        person ? "bg-foreground text-background" : "border border-dashed border-input text-muted-foreground",
        className,
      )}
    >
      {person ? initials(person.name) : "–"}
    </span>
  );
}

/** `emptyLabel` differs by field: no assignee is normal, a missing reporter was deleted. */
export function Person({ person, emptyLabel }: { person: PersonData | null; emptyLabel: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2 text-sm">
      <Avatar person={person} />
      <span className={cn("truncate", !person && "text-muted-foreground")}>{person?.name ?? emptyLabel}</span>
    </span>
  );
}
