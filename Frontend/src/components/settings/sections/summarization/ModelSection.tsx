import {
  useGetAvailableModels,
  useGetSummaryModel,
  useUpdateSummaryModel,
} from '../../../../api/queries/settings/useModelsQueries'
import ModelConfigSection from '../ui/ModelConfigSection'

export default function ModelSection() {
  const { data: availableModels, isLoading: modelsLoading } =
    useGetAvailableModels()
  const { data: currentModel, isLoading: configLoading } = useGetSummaryModel()
  const { mutate: updateModel, isPending, isError } = useUpdateSummaryModel()

  return (
    <ModelConfigSection
      title="Language Model"
      availableModels={availableModels}
      currentModel={currentModel}
      isLoading={modelsLoading || configLoading}
      isPending={isPending}
      isError={isError}
      onSave={(config, options) => updateModel(config, options)}
    />
  )
}
