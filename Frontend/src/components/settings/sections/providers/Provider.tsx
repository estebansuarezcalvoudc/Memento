import { useEffect, useState } from 'react'

import { useUpdateProviderStatus } from '../../../../api/queries/settings/useProvidersQueries'
import { type Provider } from '../../../../types/settings/providers'
import Toggle from '../../../common/Toggle'
import Tooltip from '../../../common/Tooltip'
import ApiKeySection from './ApiKeySection'

export default function Provider({ provider }: { provider: Provider }) {
  const {
    mutate: updateStatus,
    isPending: isUpdatingStatus,
    isError,
  } = useUpdateProviderStatus()

  const [showError, setShowError] = useState(false)

  useEffect(() => {
    if (isError) {
      setShowError(true)
      const timer = setTimeout(() => setShowError(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isError])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-ubuntu text-lg text-stone-800">
          {provider.name}
        </span>
        <div className="relative">
          <Toggle
            enabled={provider.active}
            onChange={active => updateStatus({ providerName: provider.name, active })}
            disabled={isUpdatingStatus || (provider.requiresApiKey && !provider.hasApiKey)}
          />
          {showError && <Tooltip message="Debe haber al menos un proveedor activo" />}
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
