"use client"

import Image from "next/image"
import { Plus, Sparkles } from "lucide-react"
import { cn } from "@/utils/cn"
import { Button } from "@/components/ui/Button"

interface ProductCardProps {
  name: string
  description: string | null
  price: number
  image: string | null
  available: boolean
  onAdd: () => void
}

export function ProductCard({
  name,
  description,
  price,
  image,
  available,
  onAdd,
}: ProductCardProps) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] transition-all duration-500 hover:-translate-y-2 hover:border-brand-400/30 hover:shadow-[0_30px_80px_rgba(249,115,22,0.15),0_20px_50px_rgba(0,0,0,0.3)]",
        !available && "opacity-55"
      )}
    >
      {/* Brand glow ring on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-[30px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ boxShadow: "inset 0 0 30px rgba(249, 115, 22, 0.06)" }}
      />

      <div className="relative aspect-[1.15] overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.5),rgba(20,15,11,0.95) 60%)] transition-transform duration-700 ease-out group-hover:scale-110">
            <span className="text-7xl transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
              🍔
            </span>
          </div>
        )}

        {/* Animated gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white backdrop-blur-md transition-all duration-300 group-hover:border-brand-400/30 group-hover:bg-brand-500/20">
            <Sparkles className="h-3.5 w-3.5 text-brand-300 transition-transform duration-300 group-hover:rotate-12" />
            destaque
          </div>
        </div>

        {!available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[2px]">
            <span className="rounded-full border border-white/10 bg-black/50 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-white">
              indisponível
            </span>
          </div>
        )}
      </div>

      <div className="relative space-y-4 p-5">
        <div>
          <h3 className="text-xl font-bold text-white transition-colors duration-300 group-hover:text-brand-100">{name}</h3>
          <p className="mt-2 min-h-[3.5rem] text-sm leading-7 text-dark-200">
            {description || "Blend artesanal, ingredientes frescos e montagem impecável."}
          </p>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-dark-300">
              a partir de
            </p>
            <p className="mt-1 text-2xl font-black text-white transition-colors duration-300 group-hover:text-brand-200">
              R$ {price.toFixed(2).replace(".", ",")}
            </p>
          </div>

          {available && (
            <Button size="md" className="gap-2 transition-all duration-300 hover:shadow-[0_8px_25px_rgba(249,115,22,0.3)]" onClick={onAdd}>
              <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
              Montar pedido
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
