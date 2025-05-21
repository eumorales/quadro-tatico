"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

type Element = {
  id: string
  type: "volleyball"
  position: { x: number; y: number }
}

type ElementDeleteModalProps = {
  element: Element
  onCancel: () => void
  onDelete: (elementId: string) => void
}

export default function ElementDeleteModal({ element, onCancel, onDelete }: ElementDeleteModalProps) {
  const handleDelete = () => {
    onDelete(element.id)
  }

  const getElementName = (type: string) => {
    switch (type) {
      case "volleyball":
        return "Bola"
      default:
        return "Elemento"
    }
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Remover {getElementName(element.type)}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>Tem certeza que deseja remover este elemento?</p>
        </div>
        <DialogFooter className="flex flex-row justify-between sm:justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleDelete}
            className="bg-white hover:bg-red-50 text-red-500 border-red-200 text-xs sm:text-sm px-2 sm:px-3"
          >
            <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="whitespace-nowrap">Remover</span>
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} className="text-xs sm:text-sm px-2 sm:px-3">
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
