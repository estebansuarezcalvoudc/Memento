import { useTranslation } from 'react-i18next'

import { usePullModel } from '../../../../../api/queries/settings/useModelsQueries'
import ProviderInlineForm from '../ProviderInlineForm'

interface PullModelFormProps {
  providerName: string
  onClose: () => void
}

export default function PullModelForm({
  providerName,
  onClose,
}: PullModelFormProps) {
  const { t } = useTranslation()
  const { mutateAsync: pullModel } = usePullModel()

  return (
    <ProviderInlineForm
      inputName="modelName"
      placeholder={t('settings.providers.pullModelPlaceholder')}
      emptyError={t('settings.providers.pullModelEmptyError')}
      onSubmit={async model => {
        await pullModel({ provider: providerName, model })
      }}
      onClose={onClose}
    />
  )
}
