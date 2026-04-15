"use client"

import React, {
  forwardRef,
  type ButtonHTMLAttributes,
  type PropsWithChildren,
} from "react"
import { cn } from "@/utils/cn"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost"
  size?: "sm" | "md" | "lg"
}

export const Button = forwardRef<
  HTMLButtonElement,
  PropsWithChildren<ButtonProps>
>(({ className, variant = "primary", size = "md", children, ...props }, ref) => {
  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary:
      "bg-brand-500 text-white shadow-[0_14px_30px_rgba(249,115,22,0.28)] hover:bg-brand-400",
    secondary:
      "border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]",
    danger: "bg-red-600 text-white hover:bg-red-500",
    ghost: "bg-transparent text-white hover:bg-white/[0.08]",
  }

  const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
    sm: "h-10 px-4 text-sm",
    md: "h-11 px-5 text-sm",
    lg: "h-12 px-6 text-base",
  }

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  )
})

Button.displayName = "Button"
