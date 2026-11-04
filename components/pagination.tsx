import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Paginated } from "@/lib/types";

interface PaginationProps {
  meta: Paginated<unknown>["meta"];
  onPageChange: (page: number) => void;
}

export function Pagination({ meta: { page, limit, total }, onPageChange }: PaginationProps) {
  if (total <= limit) return null;
  const first = (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-3">
      <p className="font-mono text-xs text-muted-foreground">
        {first}–{last} of {total}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft /> Previous
        </Button>
        <Button variant="outline" size="sm" disabled={last >= total} onClick={() => onPageChange(page + 1)}>
          Next <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}
