// src/interface/layouts/ProtectedLayout.tsx
import { Outlet } from "react-router-dom"
import { NavbarPrivate } from "@/components/NavbarPrivate"

export function ProtectedLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavbarPrivate />
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
