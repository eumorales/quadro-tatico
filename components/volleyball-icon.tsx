"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"

type Element = {
  id: string
  type: "volleyball"
  position: { x: number; y: number }
}

type VolleyballIconProps = {
  element: Element
  onDrag: (id: string, position: { x: number; y: number }) => void
  onDoubleClick: (element: Element) => void
  isDraggable: boolean
}

export default function VolleyballIcon({ element, onDrag, onDoubleClick, isDraggable }: VolleyballIconProps) {
  const constraintsRef = useRef<HTMLDivElement>(null)
  const [parentSize, setParentSize] = useState({ width: 0, height: 0 })
  const [isSelected, setIsSelected] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)

  const handleTouchStart = () => {
    if (!isDraggable) return

    const timer = setTimeout(() => {
      onDoubleClick(element)
    }, 500)

    setLongPressTimer(timer)
  }

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

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

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640
  const size = isMobile ? 24 : 30

  return (
    <div ref={constraintsRef} className="absolute inset-0 pointer-events-none">
      <motion.div
        className="absolute flex items-center justify-center z-20 cursor-grab active:cursor-grabbing"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          x: element.position.x - size / 2,
          y: element.position.y - size / 2,
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
          const newX = element.position.x + info.offset.x
          const newY = element.position.y + info.offset.y

          const boundedX = Math.max(size / 2, Math.min(newX, parentSize.width - size / 2))
          const boundedY = Math.max(size / 2, Math.min(newY, parentSize.height - size / 2))

          onDrag(element.id, { x: boundedX, y: boundedY })
        }}
        onDoubleClick={() => onDoubleClick(element)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
      >
        <img
          src="/bola.png"
          alt="Bola"
          className="w-full h-full object-contain"
          draggable="false"
        />
      </motion.div>
    </div>
  )
}
