import { HTMLAttributes, forwardRef } from "react"
import { cn } from "@/utils/cn"

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

const Card = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-xl border border-dark-600 bg-dark-800 p-4", className)} {...props} />
))
Card.displayName = "Card"

export { Card }
