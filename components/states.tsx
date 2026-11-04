import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { errorStatus } from "@/lib/errors";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, children, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-input px-6 py-14 text-center">
      <Icon aria-hidden className="mb-3 size-6 text-muted-foreground" />
      <h2 className="text-lg font-semibold">{title}</h2>
      {children && <p className="mt-1 max-w-md text-sm text-muted-foreground">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface QueryErrorProps {
  error: unknown;
  /** What was being loaded, such as "ticket". */
  resource: string;
  backHref: string;
  onRetry?: () => void;
}

/** A 400 means a malformed ID in the URL, which to a reader is the same as not found. */
export function QueryError({ error, resource, backHref, onRetry }: QueryErrorProps) {
  const status = errorStatus(error);
  const isMissing = status === 404 || status === 400;
  const isForbidden = status === 403;

  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-input px-6 py-14 text-center">
      <h2 className="text-lg font-semibold">
        {isMissing && `This ${resource} does not exist`}
        {isForbidden && `You do not have access to this ${resource}`}
        {!isMissing && !isForbidden && `Could not load this ${resource}`}
      </h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {isMissing && "It may have been deleted, or the link may be wrong."}
        {isForbidden && "An Admin or Manager can add you to the project."}
        {!isMissing && !isForbidden && "Check your connection and try again."}
      </p>
      <div className="mt-4 flex gap-2">
        {!isMissing && !isForbidden && onRetry && <Button onClick={onRetry}>Try again</Button>}
        <Button variant="outline" asChild>
          <Link href={backHref}>Go back</Link>
        </Button>
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="grid gap-2" aria-label="Loading">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full bg-secondary" />
      ))}
    </div>
  );
}
