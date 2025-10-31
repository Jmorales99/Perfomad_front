const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/v1";

export async function registerUser({
  name,
  age,
  email,
  password,
}: {
  name: string;
  age: number;
  email: string;
  password: string;
}) {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, age, email, password }),
  });

  const data = await res.json();

  // Si el backend manda un mensaje de error personalizado
  if (!res.ok) {
    throw new Error(data.error || "Error al registrar usuario.");
  }

  return data;
}

export async function loginUser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Error al iniciar sesión.");
  }

  return data;
}
