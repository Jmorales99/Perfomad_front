// src/interface/layouts/PublicLayout.tsx
import { Outlet } from "react-router-dom"

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header simple arriba */}
      <header className="w-full py-4 text-center font-bold text-xl text-blue-700 bg-transparent">
        Perfomad
      </header>

      {/* 👇 Elimina la limitación visual, deja que el hijo maneje el fondo */}
      <main className="flex-1">
        <Outlet /> {/* Aquí se renderiza Landing, Login o Registro */}
      </main>

      <footer className="text-center py-4 text-sm text-gray-500 border-t bg-transparent">
        © {new Date().getFullYear()} Perfomad — Impulsa tu rendimiento digital 🚀
      </footer>
    </div>
  )
}
