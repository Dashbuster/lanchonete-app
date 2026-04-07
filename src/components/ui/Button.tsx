"use client"

import React, { forwardRef, type ButtonHTMLAttributes, type PropsWithChildren } from "react"
import { cn } from "@/utils/cn"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost"
  size?: "sm" | "md" | "lg"
}

export const Button = forwardRef<HTMLButtonElement, PropsWithChildren<ButtonProps>>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const variants: Record<string, string> = {
      primary: "bg-brand-500 hover:bg-brand-600 text-white",
      secondary: "bg-dark-600 hover:bg-dark-500 text-white",
      danger: "bg-red-600 hover:bg-red-700 text-white",
      ghost: "bg-transparent hover:bg-dark-700 text-white",
    }
    const sizes: Record<string, string> = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    }
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
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
  }
)
Button.displayName = "Button"
