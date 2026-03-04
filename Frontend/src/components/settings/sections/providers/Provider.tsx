import { useState } from 'react'

import { useUpdateProviderStatus } from '../../../../api/queries/settings/useProvidersQueries'
import { type Provider } from '../../../../types/settings/providers'
import Toggle from '../../../common/Toggle'
import Tooltip from '../../../common/Tooltip'
import SubSectionTitle from '../ui/SubSectionTitle'
import ApiKeySection from './ApiKeySection'

export default function Provider({ provider }: { provider: Provider }) {
  const { mutate: updateStatus, isPending: isUpdatingStatus } =
    useUpdateProviderStatus()

  const [tooltipMessage, setTooltipMessage] = useState<string | null>(null)

  const missingApiKey = provider.requiresApiKey && !provider.hasApiKey

  function handleToggleAreaClick() {
    if (missingApiKey) {
      setTooltipMessage(
        'You must add an API key before activating this provider',
      )
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <SubSectionTitle title={provider.name} />
        <div className="relative">
          <Toggle
            enabled={provider.active}
            onChange={active =>
              updateStatus(
                { providerName: provider.name, active },
                {
                  onError: () =>
                    setTooltipMessage(
                      'At least one provider needs to be available',
                    ),
                },
              )
            }
            disabled={isUpdatingStatus || missingApiKey}
          />
          {missingApiKey && (
            <div
              className="absolute inset-0 z-10 cursor-not-allowed"
              onClick={handleToggleAreaClick}
            />
          )}
          <Tooltip message={tooltipMessage} />
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
