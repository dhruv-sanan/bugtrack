"use client";

import { useGetMeQuery } from "./api";
import type { User } from "./types";

/** For use below the route guard, which renders children only once the user has loaded. */
export function useCurrentUser(): User {
  const { data } = useGetMeQuery();
  if (!data) throw new Error("useCurrentUser must be used inside RouteGuard");
  return data;
}
