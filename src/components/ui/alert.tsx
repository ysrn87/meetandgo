import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";

type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  onClose?: () => void;
}

const variantStyles: Record<AlertVariant, string> = {
  info: "bg-blue-50 text-blue-800 border-blue-200",
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  error: "bg-red-50 text-red-800 border-red-200",
};

const iconStyles: Record<AlertVariant, string> = {
  info: "text-blue-500",
  success: "text-emerald-500",
  warning: "text-amber-500",
  error: "text-red-500",
};

const icons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

export function Alert({
  className,
  variant = "info",
  title,
  onClose,
  children,
  ...props
}: AlertProps) {
  const Icon = icons[variant];

  return (
    <div
      role="alert"
      className={cn(
        "relative rounded-lg border p-4 flex gap-3",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", iconStyles[variant])} />
      <div className="flex-1">
        {title && <h5 className="font-medium mb-1">{title}</h5>}
        <div className="text-sm">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 rounded-md p-1 hover:bg-black/5 transition-colors"
          aria-label="Close alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
