import { type Provider } from '../../../../types/settings/providers'
import SubSectionTitle from '../ui/SubSectionTitle'
import ApiKeySection from './api-key/ApiKeySection'
import PullModelSection from './pull-model/PullModelSection'

export default function Provider({ provider }: { provider: Provider }) {
  return (
    <div className="flex items-center justify-between">
      <SubSectionTitle title={provider.name} />
      <div className="flex items-center gap-2">
        {provider.requiresApiKey && (
          <ApiKeySection
            providerName={provider.name}
            hasApiKey={provider.hasApiKey ?? false}
          />
        )}
        {provider.name === 'Ollama' && (
          <PullModelSection providerName={provider.name} />
        )}
      </div>
    </div>
  )
}
