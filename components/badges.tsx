import { cn } from "cn";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  type TicketPriority,
  type TicketStatus,
} from "@/shared/constants";

const PRIORITY_DOT: Record<TicketPriority, string> = {
  HIGH: "bg-priority-high",
  MEDIUM: "bg-priority-medium",
  LOW: "bg-priority-low",
};

const PRIORITY_TEXT: Record<TicketPriority, string> = {
  HIGH: "text-priority-high-text",
  MEDIUM: "text-priority-medium-text",
  LOW: "text-priority-low-text",
};

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", PRIORITY_TEXT[priority])}>
      <span aria-hidden className={cn("size-2 rounded-[2px]", PRIORITY_DOT[priority])} />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

// A circle that fills as work advances, so the icon itself shows progress.
const STATUS_FILL: Record<TicketStatus, number> = {
  TODO: 0,
  IN_PROGRESS: 0.5,
  IN_REVIEW: 0.75,
  DONE: 1,
};

const PIE_RADIUS = 3;
const PIE_CIRCUMFERENCE = 2 * Math.PI * PIE_RADIUS;

export function StatusGlyph({ status, className }: { status: TicketStatus; className?: string }) {
  const fill = STATUS_FILL[status];
  const color = status === "DONE" ? "text-priority-low" : fill === 0 ? "text-muted-foreground" : "text-primary";
  return (
    <svg aria-hidden viewBox="0 0 14 14" className={cn("size-3.5 shrink-0", color, className)}>
      <circle cx="7" cy="7" r="6" fill={fill === 1 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" />
      {fill > 0 && fill < 1 && (
        <circle
          cx="7"
          cy="7"
          r={PIE_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={PIE_RADIUS * 2}
          strokeDasharray={`${PIE_CIRCUMFERENCE * fill} ${PIE_CIRCUMFERENCE}`}
          transform="rotate(-90 7 7)"
        />
      )}
      {fill === 1 && (
        <path d="M4.2 7.2 6.2 9.2 9.8 5.2" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <StatusGlyph status={status} />
      {STATUS_LABELS[status]}
    </span>
  );
}
