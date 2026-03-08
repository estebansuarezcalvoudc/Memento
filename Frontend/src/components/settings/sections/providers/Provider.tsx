import { type Provider } from '../../../../types/settings/providers'
import SubSectionTitle from '../ui/SubSectionTitle'
import ApiKeySection from './ApiKeySection'

export default function Provider({ provider }: { provider: Provider }) {
  return (
    <div className="flex flex-col gap-2">
      <SubSectionTitle title={provider.name} />
      {provider.requiresApiKey && (
        <ApiKeySection
          providerName={provider.name}
          hasApiKey={provider.hasApiKey ?? false}
        />
      )}
    </div>
  )
}
