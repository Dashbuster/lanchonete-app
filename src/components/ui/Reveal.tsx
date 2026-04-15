"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/utils/cn"

interface RevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  animation?: "fade-up" | "fade" | "scale"
  threshold?: number
  once?: boolean
}

export function Reveal({
  children,
  className,
  delay = 0,
  animation = "fade-up",
  threshold = 0.1,
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          if (once) {
            observer.disconnect()
          }
        } else if (!once) {
          setVisible(false)
        }
      },
      { threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, once])

  const animationClass =
    animation === "fade"
      ? "animate-fade-in"
      : animation === "scale"
        ? "animate-scale-in"
        : "animate-fade-in-up"

  return (
    <div
      ref={ref}
      className={cn(visible ? animationClass : "opacity-0", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
