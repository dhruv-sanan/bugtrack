"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetMeQuery } from "@/lib/api";
import { isUnauthorized } from "@/lib/errors";

/**
 * For UX only: the API does the real enforcement. Only a 401 means signed out. A
 * 500 or network failure offers a retry, so a blip does not end someone's session.
 */
export function RouteGuard({ children }: { children: ReactNode }) {
  const { data: user, error, refetch } = useGetMeQuery();
  const router = useRouter();
  const isSignedOut = isUnauthorized(error);

  useEffect(() => {
    if (!isSignedOut) return;
    const next = window.location.pathname + window.location.search;
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [isSignedOut, router]);

  if (error && !isSignedOut) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-semibold">Could not reach BugTrack</h1>
        <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
        <Button onClick={refetch}>Try again</Button>
      </main>
    );
  }

  if (isSignedOut || !user) {
    return (
      <main aria-label="Loading" className="grid min-h-svh gap-3 p-6 lg:pl-66">
        <Skeleton className="h-9 w-48 bg-secondary" />
        <Skeleton className="h-96 w-full bg-secondary" />
      </main>
    );
  }

  return children;
}
