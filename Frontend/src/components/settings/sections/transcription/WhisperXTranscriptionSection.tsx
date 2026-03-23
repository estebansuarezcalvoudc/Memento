import { Trans, useTranslation } from 'react-i18next'

import { type TranscriptionAvailableOptions } from '../../../../types/settings/transcription'
import Select from '../../../ui/inputs/Select'
import ProviderSelectorTitle from './ProviderSelectorTitle'

interface WhisperXTranscriptionSectionProps {
  options?: TranscriptionAvailableOptions
  modelSize?: string
  computeType?: string
  device?: string
  isActive: boolean
  onSelectProvider: () => void
  onUpdateConfiguration: (update: {
    model_size?: string
    compute_type?: string
    device?: string
  }) => void
}

export default function WhisperXTranscriptionSection({
  options,
  modelSize,
  computeType,
  device,
  isActive,
  onSelectProvider,
  onUpdateConfiguration,
}: WhisperXTranscriptionSectionProps) {
  const { t } = useTranslation()

  const selectedDevice = device ?? 'cuda'

  return (
    <div>
      <ProviderSelectorTitle
        title="WhisperX"
        providerName="whisperx"
        checked={isActive}
        onSelect={() => onSelectProvider()}
      />

      <div className={isActive ? '' : 'opacity-60'}>
        <Select
          label={t('settings.transcription.modelSize')}
          value={modelSize ?? ''}
          disabled={!isActive}
          onChange={e => onUpdateConfiguration({ model_size: e.target.value })}
        >
          {(options?.models ?? []).map(m => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>

        <Select
          label={t('settings.transcription.computeType')}
          value={computeType ?? ''}
          disabled={!isActive}
          onChange={e =>
            onUpdateConfiguration({ compute_type: e.target.value })
          }
        >
          {(options?.computeTypes ?? []).map(c => (
            <option
              key={c}
              value={c}
              disabled={selectedDevice === 'cpu' && c !== 'int8'}
            >
              {c}
            </option>
          ))}
        </Select>

        <Select
          label={t('settings.transcription.device')}
          value={selectedDevice}
          disabled={!isActive}
          onChange={e => {
            const newDevice = e.target.value
            const update: { device: string; compute_type?: string } = {
              device: newDevice,
            }
            if (newDevice === 'cpu' && computeType !== 'int8') {
              update.compute_type = 'int8'
            }
            onUpdateConfiguration(update)
          }}
        >
          {(options?.devices ?? []).map(d => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>

        {selectedDevice === 'cuda' && (
          <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
            <Trans i18nKey="settings.transcription.cudaWarning">
              If the GPU is unavailable or fails, transcription will
              automatically fall back to CPU using <strong>int8</strong>{' '}
              precision
            </Trans>
          </p>
        )}
      </div>
    </div>
  )
}
