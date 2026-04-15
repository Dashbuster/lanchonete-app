import { forwardRef, type InputHTMLAttributes } from "react"
import { cn } from "@/utils/cn"

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-dark-300 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"

export { Input }
