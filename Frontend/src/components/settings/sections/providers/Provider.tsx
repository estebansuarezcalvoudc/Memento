import { useUpdateProviderStatus } from '../../../../api/queries/settings/useProvidersQueries'
import { type Provider } from '../../../../types/settings/providers'
import Toggle from '../../../common/Toggle'
import ApiKeySection from './ApiKeySection'

export default function Provider({ provider }: { provider: Provider }) {
  const { mutate: updateStatus, isPending: isUpdatingStatus } =
    useUpdateProviderStatus()

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-ubuntu text-lg text-stone-800">
          {provider.name}
        </span>
        <Toggle
          enabled={provider.active}
          onChange={active => updateStatus({ providerName: provider.name, active })}
          disabled={isUpdatingStatus || (provider.requiresApiKey && !provider.hasApiKey)}
        />
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
