export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-100 to-white">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold text-emerald-700">Perfomad</h1>
        <p className="text-gray-600 mt-2">Optimiza tus publicidad 🚀</p>
      </div>
      {children}
    </div>
  )
}
