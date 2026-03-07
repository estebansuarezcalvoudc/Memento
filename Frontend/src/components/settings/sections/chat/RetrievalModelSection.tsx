import {
  useGetAvailableModels,
  useGetRetrievalModel,
  useUpdateRetrievalModel,
} from '../../../../api/queries/settings/useModelsQueries'
import ModelConfigSection from '../ui/ModelConfigSection'

export default function RetrievalModelSection() {
  const { data: availableModels, isLoading: modelsLoading } =
    useGetAvailableModels()
  const { data: currentModel, isLoading: configLoading } =
    useGetRetrievalModel()
  const { mutate: updateModel, isPending, isError } = useUpdateRetrievalModel()

  return (
    <ModelConfigSection
      title="Retrieval Model"
      availableModels={availableModels}
      currentModel={currentModel}
      isLoading={modelsLoading || configLoading}
      isPending={isPending}
      isError={isError}
      onSave={(config, options) => updateModel(config, options)}
    />
  )
}
