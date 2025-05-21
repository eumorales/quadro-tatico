"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2 } from "lucide-react"

type Player = {
  id: string
  number: number
  color: string
  position: { x: number; y: number }
  name?: string
}

type PlayerEditModalProps = {
  player: Player
  onSave: (player: Player) => void
  onCancel: () => void
  onDelete: (playerId: string) => void
}

export default function PlayerEditModal({ player, onSave, onCancel, onDelete }: PlayerEditModalProps) {
  const [number, setNumber] = useState(player.number)
  const [color, setColor] = useState(player.color)
  const [name, setName] = useState(player.name || `Jogador ${player.number}`)
  const [isMobile, setIsMobile] = useState(false)

  const colors = ["#ff6b6b", "#ffa06b", "#ffd56b", "#c2e076", "#6bceff", "#9f7aea", "#ff7eb3"]

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  const handleSave = () => {
    onSave({
      ...player,
      number,
      color,
      name,
    })
  }

  const handleDelete = () => {
    onDelete(player.id)
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Editar Jogador</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right font-medium">
              Nome
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="number" className="text-right font-medium">
              Número
            </Label>
            <Input
              id="number"
              type="number"
              value={number}
              onChange={(e) => setNumber(Number.parseInt(e.target.value) || 0)}
              min={0}
              max={99}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-medium">Cor</Label>
            <div className="flex justify-between col-span-3 w-full">
              {colors.map((c) => (
                <button
                  key={c}
                  className={`rounded-full flex-shrink-0 transition-transform duration-200 ${
                    color === c ? "ring-1 ring-offset-1 ring-black scale-110" : "hover:scale-105"
                  }`}
                  style={{
                    backgroundColor: c,
                    width: isMobile ? "20px" : "32px",
                    height: isMobile ? "20px" : "32px",
                  }}
                  onClick={() => setColor(c)}
                  aria-label={`Cor ${c}`}
                />
              ))}
            </div>
          </div>
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
          <div className="flex gap-1 sm:gap-2">
            <Button type="button" variant="outline" onClick={onCancel} className="text-xs sm:text-sm px-2 sm:px-3">
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="bg-gray-900 hover:bg-gray-800 text-xs sm:text-sm px-2 sm:px-3"
            >
              Salvar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
