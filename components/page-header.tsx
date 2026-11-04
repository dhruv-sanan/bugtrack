import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  /** A short mono label that identifies the page, such as a count or project key. */
  label?: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, label, description, actions }: PageHeaderProps) {
  return (
    <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-baseline gap-2.5">
          <h1 className="truncate text-2xl font-semibold sm:text-3xl">{title}</h1>
          {label && <span className="font-mono text-sm text-muted-foreground">{label}</span>}
        </div>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
