import { forwardRef, InputHTMLProps } from "react"
import { cn } from "@/utils/cn"

const Input = forwardRef<HTMLInputElement, InputHTMLProps<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "w-full px-3 py-2 rounded-lg bg-dark-700 border border-dark-500 text-white placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors",
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
