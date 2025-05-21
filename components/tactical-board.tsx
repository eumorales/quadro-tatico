"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Pencil, MousePointerClick, Plus, Trash2, Download, Grid, Eraser } from "lucide-react"
import PlayerIcon from "./player-icon"
import VolleyballIcon from "./volleyball-icon"
import PlayerEditModal from "./player-edit-modal"
import ElementDeleteModal from "./element-delete-modal"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"

type Player = {
  id: string
  number: number
  color: string
  position: { x: number; y: number }
  name?: string
}

type Element = {
  id: string
  type: "volleyball"
  position: { x: number; y: number }
}

type Tool = "select" | "draw"
type DrawMode = "pencil" | "eraser"

type ActionType = "addPlayer" | "removePlayer" | "addElement" | "removeElement" | "drawing"

type ActionHistoryItem = {
  type: ActionType
  data: any
}

export default function TacticalBoard() {
  const [players, setPlayers] = useState<Player[]>([])
  const [elements, setElements] = useState<Element[]>([])
  const [selectedTool, setSelectedTool] = useState<Tool>("select")
  const [drawMode, setDrawMode] = useState<DrawMode>("pencil")
  const [selectedColor, setSelectedColor] = useState("#ff0000")
  const [isDrawing, setIsDrawing] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [deletingElement, setDeletingElement] = useState<Element | null>(null)
  const [lineWidth, setLineWidth] = useState(3)
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [showCursor, setShowCursor] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const drawingHistory = useRef<ImageData[]>([])
  const historyIndex = useRef<number>(-1)
  const actionHistory = useRef<ActionHistoryItem[]>([])
  const actionHistoryIndex = useRef<number>(-1)

  const colors = ["#ff6b6b", "#ffa06b", "#ffd56b", "#c2e076", "#6bceff", "#9f7aea", "#ff7eb3"]
  const drawingColors = ["#ff0000", "#ff9900", "#ffff00", "#00ff00", "#0000ff", "#9900ff", "#000000"]

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem("volleyballTacticalBoard_hasVisited")

    if (!hasVisitedBefore && isMobile) {
      alert("Dica: Toque e segure em um jogador ou elemento para editá-lo.")
      localStorage.setItem("volleyballTacticalBoard_hasVisited", "true")
    }
  }, [isMobile])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      if (boardRef.current) {
        const { width, height } = boardRef.current.getBoundingClientRect()
        canvas.width = width
        canvas.height = height

        if (historyIndex.current >= 0 && drawingHistory.current[historyIndex.current]) {
          ctx.putImageData(drawingHistory.current[historyIndex.current], 0, 0)
        }
      }
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height)
    drawingHistory.current = [initialState]
    historyIndex.current = 0

    loadFromLocalStorage()

    return () => window.removeEventListener("resize", resizeCanvas)
  }, [])

  useEffect(() => {
    saveToLocalStorage()
  }, [players, elements])

  const saveToLocalStorage = useCallback(() => {
    try {
      localStorage.setItem("volleyballTacticalBoard_players", JSON.stringify(players))
      localStorage.setItem("volleyballTacticalBoard_elements", JSON.stringify(elements))

      if (canvasRef.current) {
        const canvas = canvasRef.current
        const dataURL = canvas.toDataURL("image/png")
        localStorage.setItem("volleyballTacticalBoard_drawing", dataURL)
      }

      localStorage.setItem("volleyballTacticalBoard_actionHistory", JSON.stringify(actionHistory.current))
      localStorage.setItem("volleyballTacticalBoard_actionHistoryIndex", actionHistoryIndex.current.toString())
    } catch (error) {
      console.error("Erro ao salvar no localStorage:", error)
    }
  }, [players, elements])

  const loadFromLocalStorage = useCallback(() => {
    try {
      const savedPlayers = localStorage.getItem("volleyballTacticalBoard_players")
      if (savedPlayers) {
        setPlayers(JSON.parse(savedPlayers))
      }

      const savedElements = localStorage.getItem("volleyballTacticalBoard_elements")
      if (savedElements) {
        setElements(JSON.parse(savedElements))
      }

      const savedDrawing = localStorage.getItem("volleyballTacticalBoard_drawing")
      if (savedDrawing && canvasRef.current) {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          const canvas = canvasRef.current
          if (canvas) {
            const ctx = canvas.getContext("2d")
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height)
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
              const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height)
              drawingHistory.current = [currentState]
              historyIndex.current = 0
            }
          }
        }
        img.src = savedDrawing
      }

      const savedActionHistory = localStorage.getItem("volleyballTacticalBoard_actionHistory")
      const savedActionHistoryIndex = localStorage.getItem("volleyballTacticalBoard_actionHistoryIndex")

      if (savedActionHistory) {
        actionHistory.current = JSON.parse(savedActionHistory)
      }

      if (savedActionHistoryIndex) {
        actionHistoryIndex.current = Number.parseInt(savedActionHistoryIndex, 10)
      }
    } catch (error) {
      console.error("Erro ao carregar do localStorage:", error)
    }
  }, [])

  useEffect(() => {
    const preventScroll = (e: TouchEvent) => {
      if (selectedTool === "draw" && isDrawing) {
        e.preventDefault()
      }
    }

    document.addEventListener("touchmove", preventScroll, { passive: false })
    return () => document.removeEventListener("touchmove", preventScroll)
  }, [selectedTool, isDrawing])

  useEffect(() => {
    const handleMouseEnter = () => {
      if (selectedTool === "draw") {
        setShowCursor(true)
      }
    }

    const handleMouseLeave = () => {
      setShowCursor(false)
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (selectedTool === "draw" && boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect()
        setCursorPosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        })
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (selectedTool === "draw" && boardRef.current && e.touches.length > 0) {
        const rect = boardRef.current.getBoundingClientRect()
        setCursorPosition({
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        })
      }
    }

    const canvas = canvasRef.current
    if (canvas) {
      canvas.addEventListener("mouseenter", handleMouseEnter)
      canvas.addEventListener("mouseleave", handleMouseLeave)
      canvas.addEventListener("mousemove", handleMouseMove)
      canvas.addEventListener("touchmove", handleTouchMove)
      canvas.addEventListener("touchstart", handleTouchMove)
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener("mouseenter", handleMouseEnter)
        canvas.removeEventListener("mouseleave", handleMouseLeave)
        canvas.removeEventListener("mousemove", handleMouseMove)
        canvas.removeEventListener("touchmove", handleTouchMove)
        canvas.removeEventListener("touchstart", handleTouchMove)
      }
    }
  }, [selectedTool])

  const toggleDrawMode = () => {
    if (selectedTool === "select") {
      setSelectedTool("draw")
      setDrawMode("pencil")
    } else {
      setSelectedTool("select")
    }
  }

  const addPlayer = () => {
    const newPlayer: Player = {
      id: `player-${Date.now()}`,
      number: players.length + 1,
      color: colors[players.length % colors.length],
      name: `Jogador ${players.length + 1}`,
      position: {
        x: boardRef.current?.clientWidth ? boardRef.current.clientWidth / 2 : 200,
        y: boardRef.current?.clientHeight ? boardRef.current.clientHeight / 2 : 200,
      },
    }

    const newActionHistory = [
      ...actionHistory.current.slice(0, actionHistoryIndex.current + 1),
      { type: "addPlayer", data: newPlayer },
    ]
    actionHistory.current = newActionHistory
    actionHistoryIndex.current = newActionHistory.length - 1

    setPlayers([...players, newPlayer])
  }

  const addElement = (type: "volleyball") => {
    const newElement: Element = {
      id: `element-${Date.now()}`,
      type,
      position: {
        x: boardRef.current?.clientWidth ? boardRef.current.clientWidth / 2 : 200,
        y: boardRef.current?.clientHeight ? boardRef.current.clientHeight / 2 : 200,
      },
    }

    const newActionHistory = [
      ...actionHistory.current.slice(0, actionHistoryIndex.current + 1),
      { type: "addElement", data: newElement },
    ]
    actionHistory.current = newActionHistory
    actionHistoryIndex.current = newActionHistory.length - 1

    setElements([...elements, newElement])
  }

  const handlePlayerDrag = (id: string, position: { x: number; y: number }) => {
    setPlayers(players.map((player) => (player.id === id ? { ...player, position } : player)))
  }

  const handleElementDrag = (id: string, position: { x: number; y: number }) => {
    setElements(elements.map((element) => (element.id === id ? { ...element, position } : element)))
  }

  const handlePlayerDoubleClick = (player: Player) => {
    setEditingPlayer(player)
  }

  const handleElementDoubleClick = (element: Element) => {
    setDeletingElement(element)
  }

  const updatePlayer = (updatedPlayer: Player) => {
    setPlayers(players.map((player) => (player.id === updatedPlayer.id ? updatedPlayer : player)))
    setEditingPlayer(null)
  }

  const deletePlayer = (playerId: string) => {
    const playerToDelete = players.find((p) => p.id === playerId)
    if (playerToDelete) {
      const newActionHistory = [
        ...actionHistory.current.slice(0, actionHistoryIndex.current + 1),
        { type: "removePlayer", data: playerToDelete },
      ]
      actionHistory.current = newActionHistory
      actionHistoryIndex.current = newActionHistory.length - 1
    }

    setPlayers(players.filter((player) => player.id !== playerId))
    setEditingPlayer(null)
  }

  const deleteElement = (elementId: string) => {
    const elementToDelete = elements.find((e) => e.id === elementId)
    if (elementToDelete) {
      const newActionHistory = [
        ...actionHistory.current.slice(0, actionHistoryIndex.current + 1),
        { type: "removeElement", data: elementToDelete },
      ]
      actionHistory.current = newActionHistory
      actionHistoryIndex.current = newActionHistory.length - 1
    }

    setElements(elements.filter((element) => element.id !== elementId))
    setDeletingElement(null)
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (selectedTool !== "draw") return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    setIsDrawing(true)

    const rect = canvas.getBoundingClientRect()
    let clientX, clientY

    if ("touches" in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    ctx.beginPath()
    ctx.moveTo(clientX - rect.left, clientY - rect.top)

    if (drawMode === "pencil") {
      ctx.strokeStyle = selectedColor
      ctx.lineWidth = lineWidth
      ctx.globalCompositeOperation = "source-over"
    } else if (drawMode === "eraser") {
      ctx.globalCompositeOperation = "destination-out"
      ctx.strokeStyle = "rgba(0,0,0,1)"
      ctx.lineWidth = lineWidth * 3
    }

    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || selectedTool !== "draw") return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    let clientX, clientY

    if ("touches" in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    ctx.lineTo(clientX - rect.left, clientY - rect.top)
    ctx.stroke()
  }

  const handleCanvasMouseUp = () => {
    if (isDrawing && selectedTool === "draw") {
      setIsDrawing(false)

      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      if (drawMode === "eraser") {
        ctx.globalCompositeOperation = "source-over"
      }

      if (historyIndex.current < drawingHistory.current.length - 1) {
        drawingHistory.current = drawingHistory.current.slice(0, historyIndex.current + 1)
      }

      const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height)
      drawingHistory.current.push(currentState)
      historyIndex.current = drawingHistory.current.length - 1

      const newActionHistory = [
        ...actionHistory.current.slice(0, actionHistoryIndex.current + 1),
        { type: "drawing", data: historyIndex.current },
      ]
      actionHistory.current = newActionHistory
      actionHistoryIndex.current = newActionHistory.length - 1

      saveToLocalStorage()
    }
  }

  const undo = () => {
    if (actionHistoryIndex.current >= 0) {
      const lastAction = actionHistory.current[actionHistoryIndex.current]

      if (lastAction.type === "addPlayer") {
        setPlayers((prevPlayers) => prevPlayers.filter((p) => p.id !== lastAction.data.id))
      } else if (lastAction.type === "removePlayer") {
        setPlayers((prevPlayers) => [...prevPlayers, lastAction.data])
      } else if (lastAction.type === "addElement") {
        setElements((prevElements) => prevElements.filter((e) => e.id !== lastAction.data.id))
      } else if (lastAction.type === "removeElement") {
        setElements((prevElements) => [...prevElements, lastAction.data])
      } else if (lastAction.type === "drawing") {
        if (historyIndex.current > 0) {
          historyIndex.current--

          const canvas = canvasRef.current
          if (!canvas) return

          const ctx = canvas.getContext("2d")
          if (!ctx) return

          ctx.putImageData(drawingHistory.current[historyIndex.current], 0, 0)
        }
      }

      actionHistoryIndex.current--
      saveToLocalStorage()
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const blankState = ctx.getImageData(0, 0, canvas.width, canvas.height)
    drawingHistory.current = [blankState]
    historyIndex.current = 0

    setPlayers([])
    setElements([])

    actionHistory.current = []
    actionHistoryIndex.current = -1

    localStorage.removeItem("volleyballTacticalBoard_players")
    localStorage.removeItem("volleyballTacticalBoard_elements")
    localStorage.removeItem("volleyballTacticalBoard_drawing")
    localStorage.removeItem("volleyballTacticalBoard_actionHistory")
    localStorage.removeItem("volleyballTacticalBoard_actionHistoryIndex")
  }

  const downloadImage = () => {
    if (!boardRef.current || !canvasRef.current) return

    const tempCanvas = document.createElement("canvas")
    const tempCtx = tempCanvas.getContext("2d")
    if (!tempCtx) return

    const scale = 2
    tempCanvas.width = boardRef.current.clientWidth * scale
    tempCanvas.height = boardRef.current.clientHeight * scale
    tempCtx.scale(scale, scale)

    tempCtx.fillStyle = "#d4a76a"
    tempCtx.fillRect(0, 0, boardRef.current.clientWidth, boardRef.current.clientHeight)

    tempCtx.strokeStyle = "white"
    tempCtx.lineWidth = 2
    tempCtx.strokeRect(0, 0, boardRef.current.clientWidth, boardRef.current.clientHeight)

    tempCtx.beginPath()
    tempCtx.moveTo(boardRef.current.clientWidth / 2, 0)
    tempCtx.lineTo(boardRef.current.clientWidth / 2, boardRef.current.clientHeight)
    tempCtx.lineWidth = 4
    tempCtx.stroke()

    tempCtx.lineWidth = 2
    tempCtx.strokeStyle = "rgba(255, 255, 255, 0.6)"
    const attackLineDistance = boardRef.current.clientWidth / 3

    tempCtx.beginPath()
    tempCtx.moveTo(attackLineDistance, 0)
    tempCtx.lineTo(attackLineDistance, boardRef.current.clientHeight)
    tempCtx.stroke()

    tempCtx.beginPath()
    tempCtx.moveTo(boardRef.current.clientWidth - attackLineDistance, 0)
    tempCtx.lineTo(boardRef.current.clientWidth - attackLineDistance, boardRef.current.clientHeight)
    tempCtx.stroke()

    const originalCanvas = canvasRef.current
    tempCtx.drawImage(originalCanvas, 0, 0)

    const isMobile = window.innerWidth < 640
    const ballSize = isMobile ? 12 : 15

    const volleyballImg = new Image()
    volleyballImg.src = "/bola.png" 

    elements.forEach((element) => {
    if (element.type === "volleyball") {
      tempCtx.drawImage(
        volleyballImg,
        element.position.x - ballSize,
        element.position.y - ballSize,
        ballSize * 2,
        ballSize * 2
      )
    }
    })

    const playerSize = isMobile ? 28 : 36
    const playerFontSize = isMobile ? 12 : 16
    const tagPadding = isMobile ? 4 : 6
    const tagFontSize = isMobile ? 10 : 12

    players.forEach((player) => {

      tempCtx.shadowColor = "rgba(0, 0, 0, 0.3)"
      tempCtx.shadowBlur = 5
      tempCtx.shadowOffsetX = 2
      tempCtx.shadowOffsetY = 2

      tempCtx.beginPath()
      tempCtx.arc(player.position.x, player.position.y, playerSize / 2, 0, Math.PI * 2)
      tempCtx.fillStyle = player.color
      tempCtx.fill()

      tempCtx.shadowColor = "transparent"
      tempCtx.shadowBlur = 0
      tempCtx.shadowOffsetX = 0
      tempCtx.shadowOffsetY = 0

      tempCtx.fillStyle = "white"
      tempCtx.font = `bold ${playerFontSize}px Arial`
      tempCtx.textAlign = "center"
      tempCtx.textBaseline = "middle"
      tempCtx.fillText(player.number.toString(), player.position.x, player.position.y)

      const playerName = player.name || `Jogador ${player.number}`
      tempCtx.font = `${tagFontSize}px Arial`
      const textMetrics = tempCtx.measureText(playerName)
      const textWidth = textMetrics.width

      const tagHeight = isMobile ? 16 : 20
      const tagWidth = Math.min(Math.max(textWidth + tagPadding * 2, 40), 120)

      tempCtx.fillStyle = "rgba(0, 0, 0, 0.7)"
      tempCtx.fillRect(player.position.x - tagWidth / 2, player.position.y + playerSize / 2 + 4, tagWidth, tagHeight)

      tempCtx.fillStyle = "white"
      tempCtx.textAlign = "center"
      tempCtx.textBaseline = "middle"

      let displayName = playerName
      if (textWidth > tagWidth - tagPadding * 2) {
        let fitLength = playerName.length
        while (fitLength > 0) {
          const trimmedText = playerName.substring(0, fitLength) + "..."
          const trimmedWidth = tempCtx.measureText(trimmedText).width
          if (trimmedWidth <= tagWidth - tagPadding * 2) {
            displayName = trimmedText
            break
          }
          fitLength--
        }
      }

      tempCtx.fillText(displayName, player.position.x, player.position.y + playerSize / 2 + 4 + tagHeight / 2)
    })

    tempCtx.font = "12px Arial"
    tempCtx.fillStyle = "rgba(255, 255, 255, 0.5)"
    tempCtx.textAlign = "right"
    tempCtx.fillText("gilbertomorales.com", boardRef.current.clientWidth - 10, boardRef.current.clientHeight - 10)

    try {
      const dataURL = tempCanvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.download = "quadro-tatico.png"
      link.href = dataURL
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Erro ao gerar imagem: ", error)
      alert("Ocorreu um erro ao gerar a imagem. Por favor, tente novamente.")
    }
  }

  const getCursorSize = () => {
    if (drawMode === "pencil") {
      return lineWidth
    } else {
      return lineWidth * 3
    }
  }

  const visibleColors = isMobile ? drawingColors.slice(0, 4) : drawingColors

  return (
    <div className="flex flex-col w-full max-w-4xl">
      <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-md mb-4 h-16 overflow-hidden">
        <div className="flex items-center space-x-1 sm:space-x-2 min-w-fit">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileTap={{ scale: 0.95 }} className="relative">
                  <Toggle
                    pressed={selectedTool === "select"}
                    onPressedChange={() => {
                      if (selectedTool === "draw") {
                        setSelectedTool("select")
                      } else {
                        setSelectedTool("select")
                      }
                    }}
                    aria-label="Selecionar"
                    className="w-8 h-8 sm:w-9 sm:h-9 data-[state=on]:bg-orange-100 data-[state=on]:text-orange-700 hover:bg-orange-50 relative z-10"
                  >
                    <MousePointerClick className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Toggle>
                  {selectedTool === "select" && (
                    <motion.div
                      layoutId="toolIndicator"
                      className="absolute inset-0 bg-orange-100 rounded-md -z-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>Selecionar</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileTap={{ scale: 0.95 }} className="relative">
                  <Toggle
                    pressed={selectedTool === "draw" && drawMode === "pencil"}
                    onPressedChange={() => {
                      if (selectedTool === "select" || drawMode === "eraser") {
                        setSelectedTool("draw")
                        setDrawMode("pencil")
                      } else {
                        setSelectedTool("select")
                      }
                    }}
                    aria-label="Desenhar"
                    className="w-8 h-8 sm:w-9 sm:h-9 data-[state=on]:bg-orange-100 data-[state=on]:text-orange-700 hover:bg-orange-50 relative z-10"
                  >
                    <Pencil className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Toggle>
                  {selectedTool === "draw" && drawMode === "pencil" && (
                    <motion.div
                      layoutId="toolIndicator"
                      className="absolute inset-0 bg-orange-100 rounded-md -z-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>Desenhar</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <AnimatePresence mode="wait">
            {selectedTool === "draw" && (
              <motion.div
                className="flex flex-wrap gap-1 ml-1 p-1 bg-gray-50 rounded-md h-auto min-h-8 flex-shrink-0 items-center max-w-[180px] sm:max-w-none"
                initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                animate={{ opacity: 1, width: "auto", marginLeft: "0.25rem" }}
                exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                transition={{ duration: 0.2 }}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button
                        className={`w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 ${
                          drawMode === "eraser"
                            ? "bg-gray-200 text-gray-700"
                            : "bg-white text-gray-500 hover:bg-gray-100"
                        }`}
                        onClick={() => setDrawMode(drawMode === "eraser" ? "pencil" : "eraser")}
                        aria-label="Borracha"
                        whileTap={{ scale: 0.9 }}
                      >
                        <Eraser className="h-4 w-4" />
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent>Borracha</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="w-px h-5 bg-gray-300 mx-1"></div>

                <div className="flex flex-wrap gap-1 max-w-[140px] sm:max-w-none">
                  {visibleColors.map((color) => (
                    <motion.button
                      key={color}
                      className={`w-5 h-5 rounded-full transition-all duration-200 ${
                        selectedColor === color && drawMode === "pencil"
                          ? "ring-1 ring-offset-1 ring-black scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                      aria-label={`Cor ${color}`}
                      whileTap={{ scale: 0.9 }}
                      initial={{ scale: 0 }}
                      animate={{ scale: selectedColor === color && drawMode === "pencil" ? 1.1 : 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {selectedTool === "select" ? (
            <motion.div
              className="flex items-center space-x-1 sm:space-x-2 min-w-fit"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={addPlayer}
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 sm:px-3 text-xs sm:text-sm bg-white hover:bg-green-50 border-green-200 text-green-700 flex-shrink-0"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Adicionar</span>
                </Button>
              </motion.div>

              <motion.div whileTap={{ scale: 0.95 }}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 sm:px-3 text-xs sm:text-sm bg-white hover:bg-purple-50 border-purple-200 text-purple-700 flex-shrink-0"
                    >
                      <Grid className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Elementos</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => addElement("volleyball")}>
                      <img
                        src="/bola.png"
                        alt="Bola"
                        className="w-5 h-5 mr-2"
                      />
                      Bola
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>

              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={clearCanvas}
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 sm:px-3 text-xs sm:text-sm bg-white hover:bg-red-50 border-red-200 text-red-600 flex-shrink-0"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline ml-1">Limpar</span>
                </Button>
              </motion.div>

              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={downloadImage}
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 sm:px-3 text-xs sm:text-sm bg-white hover:bg-blue-50 border-blue-200 text-blue-700 flex-shrink-0"
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline ml-1">Salvar</span>
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              className="flex items-center space-x-1 sm:space-x-2 min-w-fit"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={clearCanvas}
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 sm:px-3 text-xs sm:text-sm bg-white hover:bg-red-50 border-red-200 text-red-600 flex-shrink-0"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline ml-1">Limpar</span>
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative">
        <div
          ref={boardRef}
          className="relative w-full aspect-[4/3] bg-[#d4a76a] border-2 border-white rounded-md overflow-hidden shadow-xl"
        >
          <div className="absolute inset-0">
            <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-white"></div>
            <div className="absolute top-0 bottom-0 left-1/3 w-0.5 bg-white/60"></div>
            <div className="absolute top-0 bottom-0 right-1/3 w-0.5 bg-white/60"></div>
            <div className="absolute inset-0 border-2 border-white pointer-events-none"></div>
          </div>

          <canvas
            ref={canvasRef}
            className={`absolute inset-0 z-10 touch-none ${selectedTool === "draw" ? "cursor-none" : "cursor-auto"}`}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onTouchStart={handleCanvasMouseDown}
            onTouchMove={handleCanvasMouseMove}
            onTouchEnd={handleCanvasMouseUp}
          />

          {showCursor && selectedTool === "draw" && (
            <div
              ref={cursorRef}
              className={`absolute rounded-full pointer-events-none z-20 ${
                drawMode === "eraser" ? "border-2 border-gray-800 bg-white/30" : "border border-white bg-transparent"
              }`}
              style={{
                width: `${getCursorSize() * 2}px`,
                height: `${getCursorSize() * 2}px`,
                transform: `translate(${cursorPosition.x - getCursorSize()}px, ${
                  cursorPosition.y - getCursorSize()
                }px)`,
                boxShadow: drawMode === "eraser" ? "0 0 0 1px rgba(0,0,0,0.2)" : "0 0 0 1px rgba(0,0,0,0.5)",
              }}
            ></div>
          )}

          {elements.map((element) => {
            if (element.type === "volleyball") {
              return (
                <VolleyballIcon
                  key={element.id}
                  element={element}
                  onDrag={handleElementDrag}
                  onDoubleClick={handleElementDoubleClick}
                  isDraggable={selectedTool === "select"}
                />
              )
            }
            return null
          })}

          {players.map((player) => (
            <PlayerIcon
              key={player.id}
              player={player}
              onDrag={handlePlayerDrag}
              onDoubleClick={handlePlayerDoubleClick}
              isDraggable={selectedTool === "select"}
            />
          ))}
        </div>
        <div className="mt-2 py-1 px-2 bg-gray-100 text-gray-500 text-[10px] rounded-sm inline-block ml-auto mr-0">
          Dica: {isMobile ? "Toque e segure" : "Clique duas vezes"} para editar
        </div>
      </div>

      {editingPlayer && (
        <PlayerEditModal
          player={editingPlayer}
          onSave={updatePlayer}
          onCancel={() => setEditingPlayer(null)}
          onDelete={deletePlayer}
        />
      )}

      {deletingElement && (
        <ElementDeleteModal
          element={deletingElement}
          onCancel={() => setDeletingElement(null)}
          onDelete={deleteElement}
        />
      )}
    </div>
  )
}
