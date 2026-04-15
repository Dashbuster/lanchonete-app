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
        "group overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] transition duration-300 hover:-translate-y-1 hover:border-brand-400/40 hover:shadow-[0_26px_70px_rgba(0,0,0,0.35)]",
        !available && "opacity-55"
      )}
    >
      <div className="relative aspect-[1.15] overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.4),rgba(20,15,11,0.95))]">
            <span className="text-7xl">🍔</span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-brand-300" />
            destaque
          </div>
        </div>

        {!available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55">
            <span className="rounded-full border border-white/10 bg-black/50 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-white">
              indisponível
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4 p-5">
        <div>
          <h3 className="text-xl font-bold text-white">{name}</h3>
          <p className="mt-2 min-h-[3.5rem] text-sm leading-7 text-dark-200">
            {description || "Blend artesanal, ingredientes frescos e montagem impecável."}
          </p>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-dark-300">
              a partir de
            </p>
            <p className="mt-1 text-2xl font-black text-white">
              R$ {price.toFixed(2).replace(".", ",")}
            </p>
          </div>

          {available && (
            <Button size="md" className="gap-2" onClick={onAdd}>
              <Plus className="h-4 w-4" />
              Montar pedido
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
