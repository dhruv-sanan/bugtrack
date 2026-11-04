import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="text-3xl font-semibold">This page does not exist</h1>
      <Button asChild className="mt-2">
        <Link href="/tickets">Go to tickets</Link>
      </Button>
    </main>
  );
}
