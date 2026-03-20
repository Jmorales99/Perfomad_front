// src/interface/layouts/PublicLayout.tsx
import { Outlet } from "react-router-dom"

/**
 * Sin header ni footer fijos: auth/register ocupan toda la altura (evita scroll innecesario).
 */
export function PublicLayout() {
  return (
    <div className="min-h-dvh flex flex-col">
      <main className="flex-1 flex flex-col min-h-0">
        <Outlet />
      </main>
    </div>
  )
}
