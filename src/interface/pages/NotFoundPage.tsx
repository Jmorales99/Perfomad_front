import { Link } from "react-router-dom"
import { motion } from "framer-motion"

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4 relative overflow-hidden">
      {/* Fondo animado */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#3b82f6_0%,_transparent_70%)] blur-3xl"
      />

      {/* Contenido */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="z-10 bg-white/70 backdrop-blur-md border border-blue-200 rounded-3xl shadow-2xl p-10 text-center max-w-md"
      >
        <motion.h1
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-8xl font-extrabold text-blue-700 mb-2 select-none"
        >
          404
        </motion.h1>

        <p className="text-lg text-gray-600 mb-6">
          Parece que te perdiste en el universo digital 🌌
        </p>

        <Link
          to="/"
          className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
        >
          ← Volver al inicio
        </Link>
      </motion.div>

      {/* Footer */}
      <footer className="z-10 mt-12 text-gray-500 text-sm">
        © {new Date().getFullYear()}{" "}
        <span className="font-medium text-blue-700">Perfomad</span>
      </footer>
    </div>
  )
}
