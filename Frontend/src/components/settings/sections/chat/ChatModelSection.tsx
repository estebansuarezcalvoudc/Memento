import { useTranslation } from 'react-i18next'

import {
  useGetAvailableModels,
  useGetChatModel,
  useUpdateChatModel,
} from '../../../../api/queries/settings/useModelsQueries'
import ModelConfigSection from '../ModelConfigSection'

export default function ChatModelSection() {
  const { t } = useTranslation()
  const { data: availableModels, isLoading: modelsLoading } =
    useGetAvailableModels()
  const { data: currentModel, isLoading: configLoading } = useGetChatModel()
  const { mutate: updateModel, isPending, isError } = useUpdateChatModel()

  return (
    <ModelConfigSection
      title={t('settings.chat.chatModel')}
      availableModels={availableModels}
      currentModel={currentModel}
      isLoading={modelsLoading || configLoading}
      isPending={isPending}
      isError={isError}
      onSave={(config, options) => updateModel(config, options)}
    />
  )
}
