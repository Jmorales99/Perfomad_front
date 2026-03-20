# FASE 0 — Inventario del Frontend (auditoría solo lectura)

Documento generado para alinear el frontend con el backend (clients + OAuth Meta + multi-empresa). **Sin cambios de código.**

---

## 1. Framework y router

| Aspecto | Detalle |
|--------|--------|
| **Framework** | React 19 + Vite 7 |
| **Router** | React Router DOM v7 (`BrowserRouter`, `Routes`, `Route`) |
| **Definición de rutas** | `src/app/App.tsx` |

### Rutas principales

| Ruta | Layout | Componente | Descripción |
|------|--------|------------|-------------|
| `/` | PublicLayout | LandingPage | Página de aterrizaje |
| `/auth` | PublicLayout | AuthPage | Login (PublicRoute) |
| `/register` | PublicLayout | RegisterPage | Registro (PublicRoute) |
| `/home` | ProtectedLayout | HomePage | Dashboard principal |
| `/campaigns` | ProtectedLayout | CampaignsPage | Lista de campañas |
| `/campaigns/:id` | ProtectedLayout | CampaignDetailsPage | Detalle campaña |
| `/optimize/:id` | ProtectedLayout | CampaignDetailsPage | Optimización |
| `/images` | ProtectedLayout | UploadImagesPage | Subida de imágenes |
| `/settings` | ProtectedLayout | SettingsPage | Configuración (Perfil, Cuenta, Integraciones) |
| `/platforms/meta` | ProtectedLayout | MetaPage | Meta Ads (métricas, conectar) |
| `/platforms/google-ads` | ProtectedLayout | GoogleAdsPage | Google Ads |
| `/platforms/linkedin` | ProtectedLayout | LinkedInPage | LinkedIn Ads |
| `/platforms/tiktok` | ProtectedLayout | TikTokPage | TikTok |
| `*` | — | NotFoundPage | 404 |

**Guards:** `ProtectedRoute` (requiere sesión; redirige a `/auth`) y `PublicRoute` (páginas públicas).

---

## 2. Inicialización de Supabase

- **No hay Supabase en el frontend.**  
- El frontend **no** usa `createClient` de Supabase ni variables `SUPABASE_*`.  
- La autenticación es **100% vía backend**: el backend (Fastify + Supabase) expone `/v1/auth/login` y devuelve un **access token** (Supabase access token o equivalente). Ese token se guarda en el front y se envía como `Authorization: Bearer <token>`.

---

## 3. Manejo de sesión

| Aspecto | Ubicación | Comportamiento |
|--------|-----------|----------------|
| **Contexto de auth** | `src/app/providers/AuthProvider.tsx` | `AuthContext` con `isAuthenticated`, `user`, `hasSubscription`, `loading`, `login`, `register`, `logout`, `refreshProfile`, `setHasSubscription`. |
| **Inicio de sesión** | AuthProvider + `authRepository` | Al montar: si hay token en storage → `getProfile()`; si responde OK → `setIsAuthenticated(true)` y `setHasSubscription(profile.has_active_subscription)`. Si falla → `removeToken()` y `setIsAuthenticated(false)`. |
| **Token storage** | `src/infrastructure/storage/tokenStorage.ts` | `sessionStorage`: clave `access_token`. Helpers: `getAccessToken`, `setAccessToken`, `removeToken`, `refreshTokenActivity`, `isTokenExpired(maxHours)`, `markLoggingOut`, `getIsLoggingOut`. |
| **onAuthStateChange / getSession** | No usado | No hay suscripción a cambios de sesión de Supabase. La “sesión” es: token en sessionStorage + estado en AuthProvider derivado de `getProfile()`. |
| **Protección de rutas** | `src/app/router/ProtectedRoute.tsx` | Usa `useAuth()`; si `!isAuthenticated` → `Navigate to="/auth"`. Si `isTokenExpired(1)` → logout y redirección. |

Resumen: sesión = token en sessionStorage + perfil obtenido por `GET /v1/profile`. No hay integración directa con Supabase en el cliente.

---

## 4. Llamadas al backend

### Cliente HTTP

- **Archivo:** `src/infrastructure/api/client.ts`  
- **Cliente:** Axios (`apiClient`) con `baseURL: import.meta.env.VITE_API_URL`, `Content-Type: application/json`.  
- **Request interceptor:** añade `Authorization: Bearer <token>` con `getAccessToken()`.  
- **Response interceptor:** en 401 elimina token y redirige a `/auth` (salvo si `getIsLoggingOut()`). No hay manejo de 402 ni 403 específico.

### Endpoints /v1 usados (por archivo)

| Archivo | Endpoints |
|---------|-----------|
| **authRepository** | `POST /v1/auth/login`, `POST /v1/auth/signup` |
| **profileRepository** | `GET /v1/profile`, `PATCH /v1/profile/onboarding` |
| **subscriptionRepository** | `POST /v1/subscription/activate`, `POST /v1/subscription/connect-account`, `POST /v1/subscription/sync-accounts`, `GET /v1/subscription/accounts`, `POST /v1/subscription/connect-account-with-credentials` |
| **platformRepository** | `GET /v1/platforms/summary`, `GET /v1/platforms/:platform/metrics`, `GET /v1/platforms/:platform/insights`, `GET /v1/dashboard/platform-summary` |
| **campaignsRepository** | `GET /v1/campaigns`, `GET /v1/campaigns/:id`, `GET /v1/campaigns/can-create`, `POST /v1/campaigns`, `PATCH /v1/campaigns/:id`, `DELETE /v1/campaigns/:id`, `GET /v1/campaigns/:id/overview`, `GET /v1/campaigns/:id/insights`, `POST /v1/campaigns/:id/sync`, `GET /v1/dashboard/metrics`, `GET /v1/campaigns/:id/sales-history`, `GET /v1/dashboard/sales-history` |
| **imagesRepository** | `POST /v1/images/upload-url`, `GET /v1/images`, `DELETE /v1/images/:filename` |
| **MetaPage** (directo) | `POST /v1/subscription/connect-account` (body: `{ platform: "meta" }`) |
| **SubscriptionBanner** | `POST /v1/subscription/activate` |

### Llamadas que NO pasan por apiClient

- **authService.ts** (`src/infrastructure/services/authService.ts`): usa `fetch()` contra `VITE_API_URL` para `/auth/signup` y `/auth/login` **sin** enviar `Authorization`. **No se usa en la app:** AuthProvider usa `authRepository` (apiClient). Código legacy.
- **UploadImagesPage**: `fetch(uploadUrl, …)` para subir el archivo a la URL firmada (esperado).
- **CampaignsPage**: `axios.put(uploadUrl, file, …)` para subir imagen a URL firmada (esperado).

**Resumen:** Casi todas las llamadas al API pasan por `apiClient` (Axios). No existe una capa única tipo `apiFetch(path, options)`; el interceptor ya añade el Bearer. No se envía `clientId` en ningún endpoint (no hay multi-empresa en front hoy). No hay manejo explícito de 402 (subscription_required) ni 403.

---

## 5. Suscripción (plan activo/inactivo)

| Dónde se obtiene | Cómo |
|------------------|------|
| **Backend** | `GET /v1/profile` devuelve `has_active_subscription` (boolean). |
| **Frontend** | `AuthProvider` guarda `hasSubscription` desde `profile.has_active_subscription` tras `getProfile()` (inicio y tras login). `refreshProfile()` actualiza perfil y `hasSubscription`. |
| **UI** | `SubscriptionBanner`: si `!hasSubscription` muestra banner “Plan inactivo” y botón “Activar suscripción” que llama a `POST /v1/subscription/activate` y luego `refreshProfile()`. No hay gating: no se deshabilitan acciones (conectar/sync/crear/editar/borrar) cuando no hay suscripción. |
| **Perfil** | Tipo `Profile` en `profileRepository`: `id`, `email`, `name`, `age`, `phone`, `has_completed_onboarding`, `has_active_subscription`, `created_at`. |

No se lee `profiles` desde Supabase directo; todo pasa por `/v1/profile`.

---

## 6. Pantalla “Integraciones” y estado Meta/Google

### Dónde aparece

- **Home (Dashboard):** bloque “Plataformas” con `PlatformCard` por plataforma. Cada card muestra “Conectado” o “No conectado” según `platform.is_connected` del `GET /v1/dashboard/platform-summary`. No hay botón “Conectar” en la card; el clic lleva a `/platforms/meta` (o google-ads/linkedin).
- **Settings → pestaña “Integraciones”:** lista Meta Ads, Google Ads, LinkedIn con estado conectado/no conectado y botón “Conectar”. Conectar usa `createConnectionLink(platform, redirectUri)` → `POST /v1/subscription/connect-account` con `platform` y `redirect_uri`. En producción redirige a OAuth; en dev puede abrir `ConnectAccountModal` (credenciales).
- **MetaPage (`/platforms/meta`):** si `metrics.summary.connected_accounts === 0` muestra card “Conecta tu cuenta de Meta Ads” y botón “Conectar cuenta de Meta” que llama a `apiClient.post("/v1/subscription/connect-account", { platform: "meta" })` y redirige a `data.link`. No usa el nuevo backend `POST /v1/platforms/meta/connect-link` con `clientId`. No hay manejo de query `connect=success|error` al volver del OAuth. No hay “Sincronizar cuentas” específico para Meta (en Settings sí hay “Sincronizar” genérico vía `syncConnectedAccounts` → `POST /v1/subscription/sync-accounts`).

### Estado “conectado”

- **Dashboard:** `is_connected` y métricas por plataforma vienen de `GET /v1/dashboard/platform-summary` (y `GET /v1/platforms/:platform/metrics` en páginas de plataforma).
- **Settings:** lista de cuentas de `GET /v1/subscription/accounts`; “conectado” = existe cuenta activa para esa plataforma.

### Resumen integraciones

- Hay UI de integraciones en **Home** (cards) y **Settings → Integraciones** (conectar/sincronizar).
- Meta: flujo actual usa `POST /v1/subscription/connect-account` (sin `clientId`). Falta alinear con backend nuevo: `POST /v1/platforms/meta/connect-link` (body `clientId`, `redirect_uri?`) y `GET /v1/platforms/meta/callback` que redirige al front con `?connect=success|error&message=...`, y `POST /v1/platforms/meta/sync-accounts` (body `clientId`).
- No hay tabla `clients` ni selector de “empresa interna” en el front; no se envía `clientId` en ninguna llamada.

---

## 7. Variables de entorno

- **API base:** `import.meta.env.VITE_API_URL` (usado en `client.ts` y en `authService.ts`). Sin valor por defecto en código (Vite no define default en el snippet revisado). Típico: `.env` con `VITE_API_URL=https://...` o `http://localhost:3xxx`.
- No se referencian `SUPABASE_*`, `META_*`, `GOOGLE_*` ni claves de cifrado en el front.

---

## 8. Checklist para las siguientes fases

- [ ] Crear capa única `apiFetch` (o equivalente) y tipos de error (p. ej. 402).
- [ ] Sustituir llamadas directas a `apiClient` por esa capa donde corresponda; mantener `Authorization: Bearer` y no loguear tokens.
- [ ] Introducir `clients` y `selectedClientId` (store/context + persistencia en localStorage).
- [ ] Conectar Meta vía `POST /v1/platforms/meta/connect-link` con `clientId` y manejar retorno `connect=success|error` en la ruta de vuelta.
- [ ] Sync Meta con `POST /v1/platforms/meta/sync-accounts` y reflejar estado “conectado” por client.
- [ ] Gating por suscripción en UI (deshabilitar acciones si no hay plan) y manejo de 402 (modal/redirect a pricing).
- [ ] En todas las llamadas que lo requieran, enviar `clientId` (empresa interna seleccionada).

---

*Fin del inventario FASE 0. Sin cambios de código.*
