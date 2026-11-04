"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useGetMeQuery } from "./api";
import { safeNextPath } from "./format";

/** Sends signed-in users to `?next=` or the default page. Also what moves them on after login. */
export function useRedirectIfSignedIn() {
  const { data: user } = useGetMeQuery();
  const router = useRouter();
  const next = useSearchParams()?.get("next") ?? null;

  useEffect(() => {
    if (user) router.replace(safeNextPath(next));
  }, [user, next, router]);
}
