import { useState } from "react";

export default function ConnectAccountsModal({ name, onClose }: { name: string; onClose: () => void }) {
  const [formData, setFormData] = useState({ meta: "", google: "", linkedin: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-xl p-6 shadow-xl w-[90%] max-w-md">
        <h2 className="text-2xl font-semibold mb-2">¡Hola, {name}! 👋</h2>
        <p className="text-gray-600 mb-4">Conecta tus cuentas para comenzar:</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {["meta", "google", "linkedin"].map((platform) => (
            <div key={platform}>
              <label className="block text-sm text-gray-700 capitalize">
                {platform === "meta" ? "Meta (Facebook / Instagram)" : platform}
              </label>
              <input
                type="text"
                name={platform}
                value={(formData as any)[platform]}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
                placeholder={`Usuario de ${platform}`}
              />
            </div>
          ))}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition"
            >
              Omitir
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition"
            >
              Conectar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
