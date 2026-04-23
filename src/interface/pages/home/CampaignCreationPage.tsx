import { useEffect, useRef, useState } from "react"
import { FormProvider } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ArrowRight, Building2, Check, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import Stepper, { type Step as StepDef } from "@/interface/components/campaign-creation/Stepper"
import Step1Identity from "@/interface/components/campaign-creation/steps/Step1Identity"
import Step2Budget from "@/interface/components/campaign-creation/steps/Step2Budget"
import Step3Targeting from "@/interface/components/campaign-creation/steps/Step3Targeting"
import Step4Creative from "@/interface/components/campaign-creation/steps/Step4Creative"
import Step5Preview from "@/interface/components/campaign-creation/steps/Step5Preview"
import { useCampaignForm } from "@/interface/components/campaign-creation/hooks/useCampaignForm"
import { DEFAULT_CAMPAIGN_FORM, serializeForBackend, type CampaignFormValues } from "@/interface/components/campaign-creation/schemas"
import { createCampaign } from "@/infrastructure/api/campaignsRepository"
import { useSubscriptionGate } from "@/interface/hooks/useSubscriptionGate"
import { useClient } from "@/app/providers/ClientProvider"

const STEPS: StepDef[] = [
  { key: "identity", label: "Identidad", description: "Nombre + plataforma" },
  { key: "budget", label: "Presupuesto", description: "Gasto + fechas" },
  { key: "targeting", label: "Audiencia", description: "Ubicación + edad" },
  { key: "creative", label: "Creativo", description: "Imagen + copy" },
  { key: "preview", label: "Vista previa", description: "Revisa y crea" },
]

// Fields validated per step so we only advance when the step is clean
const STEP_FIELDS: Array<Array<keyof CampaignFormValues>> = [
  ["name", "platforms", "objective"],
  ["platform_budgets", "start_date", "end_date", "bid_strategy", "billing_event"],
  ["geo_countries", "age_min", "age_max", "genders"],
  ["media", "headline", "primary_text", "description", "cta", "link"],
  [],
]

export default function CampaignCreationPage() {
  const navigate = useNavigate()
  const { form, clearPersisted } = useCampaignForm()
  const { canAct, openPaywall, PaywallModal } = useSubscriptionGate()
  const { selectedClient, selectedClientId, clients } = useClient()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [maxReachedIndex, setMaxReachedIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // Reset the form whenever the user switches brand from the TopHeader.
  const prevClientIdRef = useRef<string | null>(selectedClientId)
  useEffect(() => {
    if (prevClientIdRef.current === selectedClientId) return
    if (prevClientIdRef.current != null) {
      clearPersisted()
      form.reset({ ...DEFAULT_CAMPAIGN_FORM, client_id: selectedClientId ?? undefined })
      setCurrentIndex(0)
      setMaxReachedIndex(0)
    }
    prevClientIdRef.current = selectedClientId
  }, [selectedClientId, clearPersisted, form])

  const isLast = currentIndex === STEPS.length - 1

  const goNext = async () => {
    const fields = STEP_FIELDS[currentIndex]
    const valid = await form.trigger(fields, { shouldFocus: true })
    if (!valid) return
    const next = currentIndex + 1
    setCurrentIndex(next)
    setMaxReachedIndex((m) => Math.max(m, next))
  }

  const goBack = () => {
    setCurrentIndex((i) => Math.max(0, i - 1))
  }

  const onSubmit = async (values: CampaignFormValues) => {
    if (!canAct) {
      openPaywall()
      return
    }
    if (!selectedClientId) {
      toast.error("Selecciona una marca antes de crear la campaña.")
      return
    }
    setSubmitting(true)
    try {
      const payload = serializeForBackend(values)
      const result = await createCampaign(payload as any)
      // 207 response: partial success — some platforms failed
      if ((result as any)?.failures?.length) {
        const failures: Array<{ platform: string; message: string }> = (result as any).failures
        failures.forEach((f) => {
          const platformLabel = f.platform === "meta" ? "Meta Ads" : f.platform === "google_ads" ? "Google Ads" : f.platform
          toast.error(`${platformLabel}: ${f.message}`, { duration: 8000 })
        })
        const successes: string[] = (result as any).successes ?? []
        if (successes.length > 0) {
          toast.success(`Campaña creada en: ${successes.join(", ")}`)
        }
        // Navigate to the campaign even on partial success
        const id = (result as any)?.campaign?.id
        if (id) {
          clearPersisted()
          navigate(`/campaigns/${id}`)
        }
        return
      }
      clearPersisted()
      toast.success("¡Campaña creada correctamente!")
      const id = (result as any)?.id || (result as any)?.campaign?.id
      navigate(id ? `/campaigns/${id}` : "/campaigns")
    } catch (err: any) {
      const data = err?.response?.data
      const message = data?.message || data?.error || err?.message || "Error al crear campaña"
      toast.error(message, { duration: 6000 })
    } finally {
      setSubmitting(false)
    }
  }

  const brandName = selectedClient?.name
  const noBrand = clients.length > 0 && !selectedClientId

  return (
    <div className="max-w-5xl mx-auto">
      <PaywallModal />
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate("/campaigns")}
          className="text-gray-400 hover:text-gray-600"
          title="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-gray-900">Nueva campaña</h1>
          {brandName ? (
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-500" />
              Publicando para{" "}
              <span className="font-medium text-gray-800 truncate max-w-[240px]">
                {brandName}
              </span>
              <span className="text-gray-400">·</span>
              <span className="text-xs text-gray-400">
                Cambia la marca desde el selector arriba a la derecha
              </span>
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              Crea una campaña en Meta y/o Google Ads directamente desde Perfomad.
            </p>
          )}
        </div>
      </div>

      {noBrand && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <p className="font-medium">Selecciona una marca</p>
            <p className="text-xs text-amber-800 mt-0.5">
              Necesitas elegir una marca en el selector de arriba antes de crear la campaña.
            </p>
          </div>
        </div>
      )}

      <Stepper
        steps={STEPS}
        currentIndex={currentIndex}
        maxReachedIndex={maxReachedIndex}
        onStepClick={(i) => setCurrentIndex(i)}
      />

      <Card>
        <CardContent className="p-6">
          <FormProvider {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLast) e.preventDefault()
              }}
            >
              {currentIndex === 0 && <Step1Identity />}
              {currentIndex === 1 && <Step2Budget />}
              {currentIndex === 2 && <Step3Targeting />}
              {currentIndex === 3 && <Step4Creative />}
              {currentIndex === 4 && <Step5Preview />}

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  disabled={currentIndex === 0 || submitting}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Atrás
                </Button>

                {isLast ? (
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creando…
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Crear campaña
                      </>
                    )}
                  </Button>
                ) : (
                  <Button type="button" onClick={goNext}>
                    Siguiente
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  )
}
