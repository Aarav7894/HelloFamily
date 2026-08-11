import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import type { CheckInStatus } from "@/lib/sample-data";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<CheckInStatus, string> = {
  completed: "Check-in completed",
  pending: "Check-in pending",
  concern: "Concern detected",
  missed: "Missed",
};

const STATUS_CLASS: Record<CheckInStatus, string> = {
  completed: "border-transparent bg-emerald-100",
  pending: "border-transparent bg-amber-100",
  concern: "border-transparent bg-orange-100",
  missed: "border-transparent bg-stone-200",
};

const STATUS_TEXT_CLASS: Record<CheckInStatus, string> = {
  completed: "text-emerald-800",
  pending: "text-amber-800",
  concern: "text-orange-800",
  missed: "text-stone-700",
};

type StatusBadgeProps = {
  status: CheckInStatus;
  size?: "default" | "compact";
  label?: string;
};

export function StatusBadge({
  status,
  size = "default",
  label,
}: StatusBadgeProps) {
  return (
    <Badge
      className={cn(
        "self-start",
        size === "default" ? "px-4 py-2" : "px-3 py-1",
        STATUS_CLASS[status],
      )}
    >
      <Text
        className={cn(
          "font-semibold",
          size === "default" ? "text-base" : "text-sm",
          STATUS_TEXT_CLASS[status],
        )}
      >
        {label ?? STATUS_LABEL[status]}
      </Text>
    </Badge>
  );
}
