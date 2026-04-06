"use client"

import { Dialog, DialogContent as DialogContentBase, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog"
import { ReactNode } from "react"

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

export function Modal({ open, onOpenChange, title, description, children, footer }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContentBase>
        {title && <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>}
        {description && <DialogDescription>{description}</DialogDescription>}
        <div className="space-y-4 py-4">{children}</div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContentBase>
    </Dialog>
  )
}
