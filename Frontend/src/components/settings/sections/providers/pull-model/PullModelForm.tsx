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
  const { mutateAsync: pullModel } = usePullModel()

  return (
    <ProviderInlineForm
      inputName="modelName"
      placeholder="Enter the model name"
      emptyError="Model cannot be empty"
      onSubmit={(model) => pullModel({ provider: providerName, model })}
      onClose={onClose}
    />
  )
}
