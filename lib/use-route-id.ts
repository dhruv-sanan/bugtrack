"use client";

import { useParams } from "next/navigation";

/** The numeric `[id]` route param. NaN for a malformed URL, which the API answers with a 400. */
export function useRouteId(): number {
  return Number(useParams<{ id: string }>()?.id);
}
