import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "outline";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-primary-100 text-primary-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  outline: "bg-transparent border border-slate-300 text-slate-600",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

export function Badge({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// Status-specific badge variants for bookings and custom requests
export function BookingStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { variant: BadgeVariant; label: string }> = {
    PENDING: { variant: "warning", label: "Pending Payment" },
    PAYMENT_RECEIVED: { variant: "info", label: "Payment Received" },
    PROCESSED: { variant: "default", label: "Processed" },
    ONGOING: { variant: "info", label: "Ongoing" },
    COMPLETED: { variant: "success", label: "Completed" },
    CANCELLED: { variant: "danger", label: "Cancelled" },
    EXPIRED: { variant: "danger", label: "Expired" },
  };

  const config = statusConfig[status] || { variant: "default", label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function CustomRequestStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { variant: BadgeVariant; label: string }> = {
    PENDING: { variant: "warning", label: "Pending" },
    IN_REVIEW: { variant: "info", label: "In Review" },
    ACCEPTED: { variant: "success", label: "Accepted" },
    PAID: { variant: "info", label: "Paid" },
    PROCESSED: { variant: "default", label: "Processed" },
    ONGOING: { variant: "info", label: "Ongoing" },
    COMPLETED: { variant: "success", label: "Completed" },
    REJECTED: { variant: "danger", label: "Rejected" },
    CANCELLED: { variant: "danger", label: "Cancelled" },
  };

  const config = statusConfig[status] || { variant: "default", label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function TripTypeBadge({ type }: { type: string }) {
  const isOpen = type === "OPEN_TRIP";
  return (
    <Badge variant={isOpen ? "info" : "success"}>
      {isOpen ? "Open Trip" : "Private Trip"}
    </Badge>
  );
}
