import { cn } from "@/lib/utils";
import { STATUSES, type Status } from "@/lib/data";

const styles: Record<Status, string> = {
  scheduled: "bg-sky-soft text-primary",
  in_progress: "bg-warning-soft text-warning",
  completed: "bg-success-soft text-success",
  cancelled: "bg-muted text-muted-foreground line-through",
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", styles[status], className)}>
      {STATUSES.find((s) => s.value === status)?.label}
    </span>
  );
}
