"use client"

import type { ReactNode } from "react"
import { SessionProvider } from "next-auth/react"
import { Toaster } from "react-hot-toast"
import { CartProvider } from "@/hooks/useCart"
import { ThemeProvider } from "@/contexts/ThemeContext"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <CartProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#1E2224",
                color: "#fff",
                border: "1px solid #30373A",
              },
            }}
          />
        </CartProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
