"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "react-hot-toast"
import { CartProvider } from "@/hooks/useCart"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
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
    </SessionProvider>
  )
}
