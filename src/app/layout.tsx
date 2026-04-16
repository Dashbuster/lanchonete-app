import type { Metadata } from "next"
import type { CSSProperties, ReactNode } from "react"
import "./globals.css"
import { Providers } from "@/components/shared/Providers"

export const metadata: Metadata = {
  title: {
    default: "Pedidos Online",
    template: "%s | Pedidos Online",
  },
  description:
    "Site moderno para pedidos online de lanches, combos, bebidas e pagamentos.",
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className="min-h-screen bg-dark-900 text-white antialiased"
        style={
          {
            fontFamily:
              '"Manrope", "Segoe UI", "Trebuchet MS", system-ui, sans-serif',
            ["--font-heading" as string]:
              '"Impact", "Arial Black", "Bebas Neue", sans-serif',
          } as CSSProperties
        }
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
