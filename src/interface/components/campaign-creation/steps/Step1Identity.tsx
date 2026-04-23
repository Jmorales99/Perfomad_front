import { useEffect, useRef, useState } from "react"
import { Controller, useFormContext } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import type { CampaignFormValues } from "../schemas"
import {
  CREATION_PLATFORMS,
  META_OBJECTIVES,
  META_OBJECTIVE_LABELS,
} from "../schemas"
import { useClient } from "@/app/providers/ClientProvider"
import { getMetaAdAccounts } from "@/infrastructure/repositories/integrations/metaRepository"
import { getGoogleAdsAdAccounts } from "@/infrastructure/repositories/integrations/googleAdsRepository"
import { listMetaPages } from "@/infrastructure/api/platformRepository"

type CreationPlatform = (typeof CREATION_PLATFORMS)[number]

type PlatformAccount = {
  id: string
  platform_account_id: string
  account_name: string | null
  is_active: boolean
  currency?: string
}

const PLATFORM_META: Record<CreationPlatform, { label: string; brand: string; color: string }> = {
  meta: { label: "Meta Ads", brand: "Facebook / Instagram", color: "bg-blue-50 border-blue-200 text-blue-700" },
  google_ads: { label: "Google Ads", brand: "Search / Display / YouTube", color: "bg-amber-50 border-amber-200 text-amber-700" },
}

export default function Step1Identity() {
  const { register, control, watch, setValue, formState } = useFormContext<CampaignFormValues>()
  const { selectedClientId } = useClient()
  const platforms = (watch("platforms") ?? []) as CreationPlatform[]
  const adAccountIds = (watch("ad_account_ids") ?? {}) as Record<string, string>

  const [accounts, setAccounts] = useState<
    Partial<Record<CreationPlatform, PlatformAccount[]>>
  >({})
  const [loadingPlatforms, setLoadingPlatforms] = useState<Record<string, boolean>>({})
  const [metaPages, setMetaPages] = useState<Array<{ id: string; name: string }>>([])
  const [loadingPages, setLoadingPages] = useState(false)

  /**
   * Synchronous dedupe of "already started loading" per {clientId, platform}.
   * A state-based cache races with the brand-reset effect (both effects run
   * against the same stale snapshot in the commit where selectedClientId
   * changed), so we rely on a ref for the guard.
   */
  const loadedKeysRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!selectedClientId) return
    setValue("client_id", selectedClientId)
  }, [selectedClientId, setValue])

  // Brand changed → drop any cached accounts AND the "loaded" guard so the
  // loader effect below re-fetches for the new brand.
  useEffect(() => {
    loadedKeysRef.current = new Set()
    setAccounts({})
    setLoadingPlatforms({})
    setMetaPages([])
  }, [selectedClientId])

  // Load Facebook Pages when Meta is selected
  useEffect(() => {
    if (!selectedClientId || !platforms.includes("meta")) return
    if (metaPages.length > 0 || loadingPages) return
    setLoadingPages(true)
    listMetaPages(selectedClientId)
      .then((pages) => {
        setMetaPages(pages)
        if (pages.length === 1) {
          setValue("meta_page_id", pages[0].id)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPages(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platforms, selectedClientId])

  // Load ad accounts for each currently selected platform
  useEffect(() => {
    if (!selectedClientId) return
    for (const p of platforms) {
      const key = `${selectedClientId}:${p}`
      if (loadedKeysRef.current.has(key)) continue
      loadedKeysRef.current.add(key)
      setLoadingPlatforms((s) => ({ ...s, [p]: true }))
      const loader =
        p === "meta"
          ? getMetaAdAccounts(selectedClientId)
          : getGoogleAdsAdAccounts(selectedClientId)
      loader
        .then((accs) => {
          const active = (accs as PlatformAccount[]).filter((a) => a.is_active)
          setAccounts((prev) => ({ ...prev, [p]: active }))
          // Auto-select if there's exactly one
          if (active.length === 1 && !adAccountIds[p]) {
            setValue(`ad_account_ids.${p}` as const, active[0].platform_account_id)
          }
        })
        .catch(() => {
          setAccounts((prev) => ({ ...prev, [p]: [] }))
        })
        .finally(() => {
          setLoadingPlatforms((s) => ({ ...s, [p]: false }))
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platforms, selectedClientId])

  const togglePlatform = (p: CreationPlatform) => {
    const current = platforms
    if (current.includes(p)) {
      setValue("platforms", current.filter((x) => x !== p))
    } else {
      setValue("platforms", [...current, p])
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="campaign-name">Nombre de la campaña</Label>
        <Input
          id="campaign-name"
          {...register("name")}
          placeholder="Ej. Black Friday 2026 — Remarketing"
          className="mt-1"
        />
        {formState.errors.name && (
          <p className="text-xs text-red-600 mt-1">{formState.errors.name.message}</p>
        )}
      </div>

      <div>
        <Label>Plataformas</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
          {CREATION_PLATFORMS.map((p) => {
            const meta = PLATFORM_META[p]
            const selected = platforms?.includes(p)
            const accs = accounts[p]
            const loading = loadingPlatforms[p]
            const hasAccs = (accs?.length ?? 0) > 0
            return (
              <button
                key={p}
                type="button"
                onClick={() => togglePlatform(p)}
                className={`text-left rounded-xl border p-3 transition ${
                  selected
                    ? "border-blue-500 ring-2 ring-blue-100 bg-blue-50/30"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{meta.label}</div>
                    <div className="text-xs text-gray-500">{meta.brand}</div>
                  </div>
                  {loading ? (
                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                  ) : hasAccs ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : accs ? (
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  ) : null}
                </div>
                {selected && accs && accs.length === 0 && (
                  <div className="text-xs text-amber-700 mt-2">
                    No tienes cuentas conectadas. Conéctala en /platforms/{p}.
                  </div>
                )}
                {selected && accs && accs.length > 1 && (
                  <select
                    onClick={(e) => e.stopPropagation()}
                    value={adAccountIds[p] ?? ""}
                    onChange={(e) =>
                      setValue(
                        `ad_account_ids.${p}` as const,
                        e.target.value
                      )
                    }
                    className="mt-2 w-full text-xs border border-gray-200 rounded-md px-2 py-1 bg-white"
                  >
                    <option value="">Elegir cuenta…</option>
                    {accs.map((a) => (
                      <option key={a.id} value={a.platform_account_id}>
                        {a.account_name || a.platform_account_id}
                      </option>
                    ))}
                  </select>
                )}
              </button>
            )
          })}
        </div>
        {formState.errors.platforms && (
          <p className="text-xs text-red-600 mt-1">{formState.errors.platforms.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="objective">Objetivo</Label>
        <Controller
          name="objective"
          control={control}
          render={({ field }) => (
            <select
              id="objective"
              value={field.value}
              onChange={field.onChange}
              className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              {META_OBJECTIVES.map((o) => (
                <option key={o} value={o}>
                  {META_OBJECTIVE_LABELS[o]}
                </option>
              ))}
            </select>
          )}
        />
        <p className="text-xs text-gray-500 mt-1">
          Define qué quieres optimizar en la campaña. Se aplica principalmente a Meta Ads.
        </p>
      </div>

      {platforms.includes("meta") && (
        <div>
          <Label htmlFor="meta-page">Página de Facebook</Label>
          <div className="relative mt-1">
            {loadingPages && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
            )}
            <Controller
              name="meta_page_id"
              control={control}
              render={({ field }) => (
                <select
                  id="meta-page"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  disabled={loadingPages}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60"
                >
                  <option value="">
                    {loadingPages
                      ? "Cargando páginas…"
                      : metaPages.length === 0
                      ? "Sin páginas (reconecta Meta con los permisos de Páginas)"
                      : "Seleccionar página…"}
                  </option>
                  {metaPages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Necesaria para crear el anuncio en Meta. Si no aparece tu página,{" "}
            <a href="/platforms/meta" className="text-blue-600 underline">reconecta tu cuenta Meta</a>{" "}
            y acepta el permiso de Páginas.
          </p>
        </div>
      )}
    </div>
  )
}
