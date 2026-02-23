import { useState } from 'react'

import {
  useGetAvailableModels,
  useGetSummaryModel,
  useUpdateSummaryModel,
} from '../../../../api/queries/settings/useModelsQueries'
import { type ModelConfig } from '../../../../types/settings/models'
import Input from '../../../common/Input'
import Select from '../../../common/Select'
import CancelButton from '../ui/CancelButton'
import ConfirmButton from '../ui/ConfirmButton'
import ErrorMessage from '../ui/ErrorMessage'
import SubSectionTitle from '../ui/SubSectionTitle'

export default function ModelSection() {
  const { data: availableModels, isLoading: modelsLoading } =
    useGetAvailableModels()
  const { data: currentModel, isLoading: configLoading } = useGetSummaryModel()
  const { mutate: updateModel, isPending, isError } = useUpdateSummaryModel()

  const [draft, setDraft] = useState<ModelConfig | undefined>(undefined)

  const value: ModelConfig = draft ??
    currentModel ?? {
    provider: '',
    modelName: '',
    temperature: 0.7,
    maxTokens: 2000,
  }

  const isModified = draft !== undefined
  const isLoading = modelsLoading || configLoading

  const isValid = value.provider !== '' && value.modelName !== ''

  function handleSave() {
    updateModel(draft!, { onSuccess: () => setDraft(undefined) })
  }

  function patch(fields: Partial<ModelConfig>) {
    setDraft({ ...value, ...fields })
  }

  return (
    <div className="flex flex-col gap-2">
      <SubSectionTitle title="Language Model" />
      {isLoading ? (
        <span className="text-base text-stone-500">Loading...</span>
      ) : (
        <>
          <Select
            label="Model"
            value={value.modelName}
            onChange={e => {
              const selected = availableModels?.find(
                m => m.id === e.target.value,
              )
              if (selected) {
                patch({ modelName: selected.id, provider: selected.provider })
              }
            }}
          >
            <option value="">Select a model</option>
            {(availableModels ?? []).map(m => (
              <option key={m.id} value={m.id}>
                {m.provider} — {m.id}
              </option>
            ))}
          </Select>
          <Input
            label="Temperature"
            type="number"
            min={0}
            max={2}
            step={0.1}
            value={value.temperature}
            onChange={e => patch({ temperature: parseFloat(e.target.value) })}
          />
          <Input
            label="Max tokens"
            type="number"
            min={1}
            step={1}
            value={value.maxTokens}
            onChange={e => patch({ maxTokens: parseInt(e.target.value) })}
          />
          <div className="mt-2 flex justify-end gap-2">
            <CancelButton
              onClick={() => setDraft(undefined)}
              disabled={isPending || !isModified}
            />
            <ConfirmButton
              type="button"
              label="Save"
              isPending={isPending}
              disabled={!isModified || !isValid}
              onClick={handleSave}
            />
          </div>
          {isError && (
            <ErrorMessage message="Failed to save. Please try again." />
          )}
        </>
      )}
    </div>
  )
}
