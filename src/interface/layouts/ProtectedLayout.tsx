// src/interface/layouts/ProtectedLayout.tsx
import { Outlet } from "react-router-dom"
import { Sidebar } from "@/components/Sidebar"
import { TopHeader } from "@/components/TopHeader"

export function ProtectedLayout() {
  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      <Sidebar />
      {/* Scroll container: the TopHeader lives inside so its `sticky top-0`
          anchors to this container — staying visible as the user scrolls
          through long pages (e.g. the campaign wizard). */}
      <div className="flex-1 ml-52 flex flex-col overflow-auto">
        <TopHeader />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
