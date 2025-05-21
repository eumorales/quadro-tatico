"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"

type Player = {
  id: string
  number: number
  color: string
  position: { x: number; y: number }
  name?: string
}

type PlayerIconProps = {
  player: Player
  onDrag: (id: string, position: { x: number; y: number }) => void
  onDoubleClick: (player: Player) => void
  isDraggable: boolean
}

export default function PlayerIcon({ player, onDrag, onDoubleClick, isDraggable }: PlayerIconProps) {
  const constraintsRef = useRef<HTMLDivElement>(null)
  const [parentSize, setParentSize] = useState({ width: 0, height: 0 })
  const [nameWidth, setNameWidth] = useState(0)
  const [isSelected, setIsSelected] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (constraintsRef.current) {
      const parent = constraintsRef.current.parentElement
      if (parent) {
        const updateSize = () => {
          setParentSize({
            width: parent.clientWidth,
            height: parent.clientHeight,
          })
        }

        updateSize()
        window.addEventListener("resize", updateSize)
        return () => window.removeEventListener("resize", updateSize)
      }
    }
  }, [])

  useEffect(() => {
    const playerName = player.name || `Jogador ${player.number}`
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")
    if (context) {
      context.font = "0.7rem Arial"
      const metrics = context.measureText(playerName)
      setNameWidth(Math.max(Math.min(metrics.width + 16, 120), 40))
    }
  }, [player.name, player.number])

  const playerName = player.name || `Jogador ${player.number}`
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640
  const playerSize = isMobile ? 28 : 36

  const handleTouchStart = () => {
    if (!isDraggable) return

    const timer = setTimeout(() => {
      onDoubleClick(player)
    }, 500)

    setLongPressTimer(timer)
  }

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  return (
    <div ref={constraintsRef} className="absolute inset-0 pointer-events-none">
      <motion.div
        className={`absolute flex items-center justify-center rounded-full cursor-grab active:cursor-grabbing z-20 shadow-md`}
        style={{
          backgroundColor: player.color,
          width: `${playerSize}px`,
          height: `${playerSize}px`,
          x: player.position.x - playerSize / 2,
          y: player.position.y - playerSize / 2,
          pointerEvents: isDraggable ? "auto" : "none",
          touchAction: "none",
        }}
        drag={isDraggable}
        dragMomentum={false}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        onDragEnd={(_, info) => {
          const newX = player.position.x + info.offset.x
          const newY = player.position.y + info.offset.y

          const boundedX = Math.max(playerSize / 2, Math.min(newX, parentSize.width - playerSize / 2))
          const boundedY = Math.max(playerSize / 2, Math.min(newY, parentSize.height - playerSize / 2))

          onDrag(player.id, { x: boundedX, y: boundedY })
        }}
        onDoubleClick={() => onDoubleClick(player)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
      >
        <span className="text-white font-bold text-sm sm:text-base">{player.number}</span>
        <div
          className="player-tag"
          style={{
            width: `${nameWidth}px`,
            maxWidth: isMobile ? "70px" : "90px",
          }}
        >
          {playerName}
        </div>
      </motion.div>
    </div>
  )
}
