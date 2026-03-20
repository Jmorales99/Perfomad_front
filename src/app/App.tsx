import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./providers/AuthProvider"
import { ClientProvider } from "./providers/ClientProvider"

// Layouts
import { PublicLayout } from "@/interface/layouts/PublicLayout"
import { ProtectedLayout } from "@/interface/layouts/ProtectedLayout"

// Pages
import LandingPage from "@/interface/pages/auth/LandingPage"
import AuthPage from "@/interface/pages/auth/AuthPage"
import RegisterPage from "@/interface/pages/auth/RegisterPage"
import HomePage from "@/interface/pages/home/HomePage"
import CampaignsPage from "@/interface/pages/home/CampaignsPage"
import CampaignDetailsPage from "@/interface/pages/home/CampaignDetailsPage"
import UploadImagesPage from "@/interface/pages/home/UploadImagesPage"
import NotFoundPage from "@/interface/pages/NotFoundPage"
import SettingsPage from "@/interface/pages/settings/SettingsPage"
import BrandsPage from "@/interface/pages/brands/BrandsPage"
import MetaPage from "@/interface/pages/platforms/MetaPage"
import GoogleAdsPage from "@/interface/pages/platforms/GoogleAdsPage"
import LinkedInPage from "@/interface/pages/platforms/LinkedInPage"
import TikTokPage from "@/interface/pages/platforms/TikTokPage"

// Route guards
import ProtectedRoute from "./router/ProtectedRoute"
import PublicRoute from "./router/PublicRoute"

export default function App() {
  return (
    <AuthProvider>
      <ClientProvider>
      <BrowserRouter>
        <Routes>
          {/* 🌐 Landing pública (layout propio) */}
          <Route path="/" element={<LandingPage />} />

          {/* 🌐 Páginas públicas con PublicLayout */}
          <Route element={<PublicLayout />}>
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
            <Route path="/campaigns/:id" element={<CampaignDetailsPage />} />
            <Route path="/optimize/:id" element={<CampaignDetailsPage />} />
            <Route path="/images" element={<UploadImagesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/brands" element={<BrandsPage />} />
            <Route path="/platforms/meta" element={<MetaPage />} />
            <Route path="/platforms/google-ads" element={<GoogleAdsPage />} />
            <Route path="/platforms/linkedin" element={<LinkedInPage />} />
            <Route path="/platforms/tiktok" element={<TikTokPage />} />
          </Route>

          {/* 🧭 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
      </ClientProvider>
    </AuthProvider>
  )
}
