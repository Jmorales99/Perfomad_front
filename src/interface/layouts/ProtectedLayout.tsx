// src/interface/layouts/ProtectedLayout.tsx
import { Outlet } from "react-router-dom"
import { Sidebar } from "@/components/Sidebar"

export function ProtectedLayout() {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-6">
        <Outlet />
      </main>
    </div>
  )
}
