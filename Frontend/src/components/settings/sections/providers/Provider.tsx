import { useEffect, useRef, useState } from 'react'

import { useUpdateProviderStatus } from '../../../../api/queries/settings/useProvidersQueries'
import { type Provider } from '../../../../types/settings/providers'
import Toggle from '../../../common/Toggle'
import Tooltip from '../../../common/Tooltip'
import ApiKeySection from './ApiKeySection'
import SubSectionTitle from '../SubSectionTitle'

export default function Provider({ provider }: { provider: Provider }) {
  const {
    mutate: updateStatus,
    isPending: isUpdatingStatus,
    isError,
  } = useUpdateProviderStatus()

  const [tooltipMessage, setTooltipMessage] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showTooltip(message: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    setTooltipMessage(message)
    timerRef.current = setTimeout(() => setTooltipMessage(null), 3000)
  }

  useEffect(() => {
    if (isError) showTooltip('At least one provider needs to be available')
  }, [isError])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const missingApiKey = provider.requiresApiKey && !provider.hasApiKey

  function handleToggleAreaClick() {
    if (missingApiKey) showTooltip('You must add an API key before activating this provider')
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <SubSectionTitle title={provider.name} />
        <div className="relative">
          <Toggle
            enabled={provider.active}
            onChange={active => updateStatus({ providerName: provider.name, active })}
            disabled={isUpdatingStatus || missingApiKey}
          />
          {missingApiKey && (
            <div className="absolute inset-0 z-10 cursor-not-allowed" onClick={handleToggleAreaClick} />
          )}
          {tooltipMessage && <Tooltip message={tooltipMessage} />}
        </div>
      </div>
      {provider.requiresApiKey && (
        <ApiKeySection
          providerName={provider.name}
          hasApiKey={provider.hasApiKey ?? false}
        />
      )}
    </div>
  )
}
