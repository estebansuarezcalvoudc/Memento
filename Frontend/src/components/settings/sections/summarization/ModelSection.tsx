import { useTranslation } from 'react-i18next'

import {
  useGetAvailableModels,
  useGetSummaryModel,
  useUpdateSummaryModel,
} from '../../../../api/queries/settings/useModelsQueries'
import ModelConfigSection from '../ModelConfigSection'

export default function ModelSection() {
  const { t } = useTranslation()
  const { data: availableModels, isLoading: modelsLoading } =
    useGetAvailableModels()
  const { data: currentModel, isLoading: configLoading } = useGetSummaryModel()
  const { mutate: updateModel, isPending, isError } = useUpdateSummaryModel()

  return (
    <ModelConfigSection
      title={t('settings.summarization.languageModel')}
      availableModels={availableModels}
      currentModel={currentModel}
      isLoading={modelsLoading || configLoading}
      isPending={isPending}
      isError={isError}
      onSave={(config, options) => updateModel(config, options)}
    />
  )
}
