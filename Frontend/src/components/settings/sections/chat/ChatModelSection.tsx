import {
  useGetAvailableModels,
  useGetChatModel,
  useUpdateChatModel,
} from '../../../../api/queries/settings/useModelsQueries'
import ModelConfigSection from '../ui/ModelConfigSection'

export default function ChatModelSection() {
  const { data: availableModels, isLoading: modelsLoading } =
    useGetAvailableModels()
  const { data: currentModel, isLoading: configLoading } = useGetChatModel()
  const { mutate: updateModel, isPending, isError } = useUpdateChatModel()

  return (
    <ModelConfigSection
      title="Language Model"
      availableModels={availableModels}
      currentModel={currentModel}
      isLoading={modelsLoading || configLoading}
      isPending={isPending}
      isError={isError}
      onSave={config => updateModel(config)}
    />
  )
}
