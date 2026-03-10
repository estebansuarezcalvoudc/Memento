import { useState } from 'react'

import {
  type AvailableModel,
  type ModelConfig,
} from '../../../../types/settings/models'
import Input from '../../../common/Input'
import Select from '../../../common/Select'
import SecondaryButton from './SecondaryButton'
import ConfirmButton from './ConfirmButton'
import ErrorMessage from './ErrorMessage'
import SubSectionTitle from './SubSectionTitle'

const DEFAULT_MODEL_CONFIG: ModelConfig = {
  provider: '',
  modelName: '',
  temperature: 0.7,
  maxTokens: 2000,
}

interface ModelConfigSectionProps {
  title: string
  availableModels: AvailableModel[] | undefined
  currentModel: ModelConfig | null | undefined
  isLoading: boolean
  isPending: boolean
  isError: boolean
  onSave: (config: ModelConfig, options?: { onSuccess?: () => void }) => void
}

export default function ModelConfigSection({
  title,
  availableModels,
  currentModel,
  isLoading,
  isPending,
  isError,
  onSave,
}: ModelConfigSectionProps) {
  const [draft, setDraft] = useState<ModelConfig | undefined>(undefined)

  const effectiveValue: ModelConfig =
    draft ?? currentModel ?? DEFAULT_MODEL_CONFIG
  const isModified = draft !== undefined
  const isValid =
    effectiveValue.provider !== '' && effectiveValue.modelName !== ''

  function patch(fields: Partial<ModelConfig>) {
    setDraft({ ...effectiveValue, ...fields })
  }

  function handleModelChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const selected = availableModels?.find(m => m.id === e.target.value)
    if (selected) {
      patch({ modelName: selected.id, provider: selected.provider })
    }
  }

  function handleSave() {
    onSave(draft!, { onSuccess: () => setDraft(undefined) })
  }

  function handleCancel() {
    setDraft(undefined)
  }

  return (
    <div className="flex flex-col gap-2">
      <SubSectionTitle title={title} />
      {isLoading ? (
        <span className="text-base text-stone-500">Loading...</span>
      ) : (
        <>
          <Select
            label="Model"
            value={effectiveValue.modelName}
            onChange={handleModelChange}
          >
            <option value="">Select a model</option>
            {(availableModels ?? []).map(model => (
              <option key={model.id} value={model.id}>
                {model.provider} — {model.id}
              </option>
            ))}
          </Select>
          <Input
            label="Temperature"
            type="number"
            min={0}
            max={2}
            step={0.1}
            value={effectiveValue.temperature}
            onChange={e => patch({ temperature: parseFloat(e.target.value) })}
          />
          <Input
            label="Max tokens"
            type="number"
            min={1}
            step={1}
            value={effectiveValue.maxTokens}
            onChange={e => patch({ maxTokens: parseInt(e.target.value) })}
          />
          <div className="mt-2 flex justify-end gap-2">
            <SecondaryButton
              onClick={handleCancel}
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
