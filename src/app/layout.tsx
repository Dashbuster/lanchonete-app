import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "@/components/shared/Providers"

export const metadata: Metadata = {
  title: {
    default: "Lanchonete - Cardápio Digital",
    template: "%s | Lanchonete",
  },
  description: "Faça seu pedido online - Lanchonete",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-dark-900 text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
