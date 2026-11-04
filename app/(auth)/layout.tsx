import type { ReactNode } from "react";
import { Logo } from "@/components/app-shell";

/** The left panel is a stack of real-looking tickets, because that is what the product is. */
function HeroTicket({ ticketKey, title, className }: { ticketKey: string; title: string; className: string }) {
  return (
    <div className={`ticket-stub grid h-36 grid-cols-[var(--stub-width)_minmax(0,1fr)] bg-card text-foreground ${className}`}>
      <div className="flex items-center justify-center bg-priority-high text-white">
        <span className="ticket-key font-mono text-[11px] font-semibold tracking-wider">{ticketKey}</span>
      </div>
      <div className="flex flex-col justify-between border-l-2 border-dashed border-border p-4">
        <p className="font-heading text-lg leading-snug font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">High priority · To do</p>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <aside className="flex flex-col justify-between bg-sidebar p-6 text-sidebar-foreground lg:p-10">
        <Logo />
        <div className="hidden lg:block">
          <h1 className="max-w-lg text-5xl leading-[1.05] font-semibold text-white">
            Every bug gets a ticket. Every ticket gets an owner.
          </h1>
          <div className="relative mt-12 h-48 max-w-md">
            <HeroTicket
              ticketKey="PAY-8"
              title="Refund webhook is delivered twice on retry"
              className="absolute inset-x-0 top-0 translate-x-6 rotate-3 opacity-50"
            />
            <HeroTicket
              ticketKey="BUG-1"
              title="Login fails when the email contains a plus sign"
              className="absolute inset-x-0 top-6 -rotate-1"
            />
          </div>
        </div>
        <p className="hidden text-sm opacity-70 lg:block">Report it, assign it, drag it to done.</p>
      </aside>
      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
