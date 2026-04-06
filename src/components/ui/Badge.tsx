import { cn } from "@/utils/cn"
import { HTMLAttributes } from "react"

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info"
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variants = {
    default: "bg-dark-600 text-white",
    success: "bg-emerald-500/20 text-emerald-400",
    warning: "bg-yellow-500/20 text-yellow-400",
    danger: "bg-red-500/20 text-red-400",
    info: "bg-blue-500/20 text-blue-400",
  }
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", variants[variant], className)} {...props}>
      {children}
    </span>
  )
}
