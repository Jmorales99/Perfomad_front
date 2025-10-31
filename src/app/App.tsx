import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./providers/AuthProvider"

// Layouts
import { PublicLayout } from "@/interface/layouts/PublicLayout"
import { ProtectedLayout } from "@/interface/layouts/ProtectedLayout"

// Pages
import LandingPage from "@/interface/pages/auth/LandingPage"
import AuthPage from "@/interface/pages/auth/AuthPage"
import RegisterPage from "@/interface/pages/auth/RegisterPage"
import HomePage from "@/interface/pages/home/HomePage"
import CampaignsPage from "@/interface/pages/home/CampaignsPage"
import UploadImagesPage from "@/interface/pages/home/UploadImagesPage"
import NotFoundPage from "@/interface/pages/NotFoundPage"

// Route guards
import ProtectedRoute from "./router/ProtectedRoute"
import PublicRoute from "./router/PublicRoute"

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 🌐 Páginas públicas (sin sesión) */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/auth"
              element={
                <PublicRoute>
                  <AuthPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />
          </Route>

          {/* 🔐 Páginas privadas (con sesión activa) */}
          <Route
            element={
              <ProtectedRoute>
                <ProtectedLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/home" element={<HomePage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/images" element={<UploadImagesPage />} />
          </Route>

          {/* 🧭 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
