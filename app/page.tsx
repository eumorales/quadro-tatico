import TacticalBoard from "@/components/tactical-board"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center p-4 md:p-8 bg-gradient-to-b from-white to-gray-100">
      <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter mb-2 sm:mb-4 text-gray-900 animate-text-gradient-black">
        quadro tático.
      </h1>
      <TacticalBoard />
    </main>
  )
}
