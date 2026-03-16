import { useTranslation } from 'react-i18next'

import {
  useGetAvailableModels,
  useGetRetrievalModel,
  useUpdateRetrievalModel,
} from '../../../../api/queries/settings/useModelsQueries'
import ModelConfigSection from '../ModelConfigSection'

export default function RetrievalModelSection() {
  const { t } = useTranslation()
  const { data: availableModels, isLoading: modelsLoading } =
    useGetAvailableModels()
  const { data: currentModel, isLoading: configLoading } =
    useGetRetrievalModel()
  const { mutate: updateModel, isPending, isError } = useUpdateRetrievalModel()

  return (
    <ModelConfigSection
      title={t('settings.chat.retrievalModel')}
      availableModels={availableModels}
      currentModel={currentModel}
      isLoading={modelsLoading || configLoading}
      isPending={isPending}
      isError={isError}
      onSave={(config, options) => updateModel(config, options)}
    />
  )
}
