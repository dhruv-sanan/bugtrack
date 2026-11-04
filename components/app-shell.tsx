"use client";

import { cn } from "cn";
import { FolderKanban, LogOut, Menu, Ticket as TicketIcon, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/person";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useListProjectsQuery, useLogoutMutation } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useCurrentUser } from "@/lib/use-current-user";
import { canManageUsers } from "@/shared/permissions";
import { ROLE_LABELS } from "@/shared/constants";

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 font-heading text-lg font-semibold tracking-tight">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.svg" alt="" width={22} height={22} />
      BugTrack
    </span>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const user = useCurrentUser();
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [logout, { isLoading: isSigningOut }] = useLogoutMutation();
  const { data: projects } = useListProjectsQuery({ limit: 200 });

  const links = [
    { href: "/tickets", label: "Tickets", icon: TicketIcon },
    { href: "/projects", label: "Projects", icon: FolderKanban },
    ...(canManageUsers(user) ? [{ href: "/users", label: "Users", icon: Users }] : []),
  ];

  async function handleSignOut() {
    try {
      await logout().unwrap();
      router.replace("/login");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const linkClass = (isActive: boolean) =>
    cn(
      "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none",
      isActive && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
    );

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link href="/tickets" onClick={onNavigate} className="px-1">
        <Logo />
      </Link>

      <nav aria-label="Main" className="grid gap-0.5">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} onClick={onNavigate} className={linkClass(pathname === href)}>
            <Icon aria-hidden className="size-4" />
            {label}
          </Link>
        ))}
      </nav>

      {projects && projects.data.length > 0 && (
        <nav aria-label="Projects" className="grid min-h-0 gap-0.5 overflow-y-auto">
          <h2 className="mb-1 px-2.5 font-sans text-xs font-medium tracking-normal opacity-60">Your projects</h2>
          {projects.data.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              onClick={onNavigate}
              className={linkClass(pathname.startsWith(`/projects/${project.id}`))}
            >
              <span className="w-10 shrink-0 truncate font-mono text-[11px] opacity-70">{project.key}</span>
              <span className="truncate">{project.name}</span>
            </Link>
          ))}
        </nav>
      )}

      <div className="mt-auto flex items-center gap-2.5 border-t border-sidebar-border pt-4">
        <Avatar person={user} className="size-8 bg-sidebar-accent text-sidebar-accent-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="text-xs opacity-70">{ROLE_LABELS[user.role]}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Sign out"
          title="Sign out"
          disabled={isSigningOut}
          onClick={handleSignOut}
          className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut />
        </Button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-svh">
      <aside className="fixed inset-y-0 left-0 hidden w-60 bg-sidebar text-sidebar-foreground lg:block">
        <SidebarContent />
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between bg-sidebar px-4 py-2.5 text-sidebar-foreground lg:hidden">
        <Link href="/tickets">
          <Logo />
        </Link>
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu" className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 border-none bg-sidebar p-0 text-sidebar-foreground">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SheetDescription className="sr-only">Navigate between tickets, projects and users.</SheetDescription>
            <SidebarContent onNavigate={() => setIsMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:pl-66">{children}</main>
    </div>
  );
}
