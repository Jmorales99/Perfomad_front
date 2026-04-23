import { useEffect } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  fullCampaignSchema,
  DEFAULT_CAMPAIGN_FORM,
  type CampaignFormValues,
} from "../schemas"

const STORAGE_KEY = "perfomad.campaignWizard.v1"

function loadPersisted(): Partial<CampaignFormValues> | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Don't restore media previewUrls — they're object URLs from a previous
    // session and no longer resolve. The user re-uploads or we'd need to
    // rebuild from storage paths via a signed URL API.
    if (parsed && Array.isArray(parsed.media)) {
      parsed.media = []
    }
    return parsed
  } catch {
    return null
  }
}

/**
 * React Hook Form wrapper for the campaign-creation wizard.
 * Persists the form state to sessionStorage so the user doesn't lose work
 * if they accidentally navigate away or reload.
 */
export function useCampaignForm() {
  const persisted = loadPersisted()
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(fullCampaignSchema) as unknown as Resolver<CampaignFormValues>,
    defaultValues: { ...DEFAULT_CAMPAIGN_FORM, ...persisted } as CampaignFormValues,
    mode: "onBlur",
  })

  // Auto-persist on change
  useEffect(() => {
    const sub = form.watch((value) => {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value))
      } catch {
        // quota / private mode — ignore
      }
    })
    return () => sub.unsubscribe()
  }, [form])

  const clearPersisted = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }

  return { form, clearPersisted }
}
