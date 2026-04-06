"use client"

import Image from "next/image"
import { Plus } from "lucide-react"
import { cn } from "@/utils/cn"
import { Button } from "@/components/ui/Button"

interface ProductCardProps {
  id: string
  name: string
  description: string | null
  price: number
  image: string | null
  available: boolean
  onAdd: () => void
}

export function ProductCard({
  id,
  name,
  description,
  price,
  image,
  available,
  onAdd,
}: ProductCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-dark-600 bg-dark-800 overflow-hidden transition-all duration-200",
        !available && "opacity-60 grayscale"
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover rounded-t-xl"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-dark-700 flex items-center justify-center">
            <span className="text-4xl">🍔</span>
          </div>
        )}
        {!available && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-dark-900/90 text-dark-200 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wider">
              Indisponível
            </span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        <h3 className="text-base font-semibold text-white truncate">
          {name}
        </h3>
        {description && (
          <p className="text-sm text-dark-300 line-clamp-2 min-h-[2.5rem]">
            {description}
          </p>
        )}
        {!description && <div className="min-h-[2.5rem]" />}

        <div className="flex items-center justify-between mt-2">
          <span className="text-lg font-bold text-brand-500">
            R$ {price.toFixed(2).replace(".", ",")}
          </span>
          {available && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onAdd()
              }}
              className="gap-1"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
