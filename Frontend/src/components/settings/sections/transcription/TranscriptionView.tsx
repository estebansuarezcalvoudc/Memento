import {
  useGetTranscriptionConfiguration,
  useGetTranscriptionOptions,
  useUpdateTranscriptionConfiguration,
} from '../../../../api/queries/settings/useTranscriptionQueries'
import Select from '../../../common/Select'
import SubSectionTitle from '../ui/SubSectionTitle'

export default function TranscriptionView() {
  const { data: options, isLoading: optionsLoading } = useGetTranscriptionOptions()
  const { data: config, isLoading: configLoading } = useGetTranscriptionConfiguration()
  const { mutate: updateConfig } = useUpdateTranscriptionConfiguration()

  const isLoading = optionsLoading || configLoading
  const selectedDevice = config?.device ?? 'cuda'

  return (
    <>
      {isLoading ? (
        <span>Loading...</span>
      ) : (
        <div className="flex flex-col gap-6">
          <div>
            <SubSectionTitle title="WhisperX" />
            <Select
              label="Model size"
              value={config?.modelSize ?? ''}
              onChange={e => updateConfig({ model_size: e.target.value })}
            >
              {(options?.models ?? []).map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
            <Select
              label="Compute type"
              value={config?.computeType ?? ''}
              onChange={e => updateConfig({ compute_type: e.target.value })}
            >
              {(options?.computeTypes ?? []).map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select
              label="Device"
              value={selectedDevice}
              onChange={e => updateConfig({ device: e.target.value })}
            >
              {(options?.devices ?? []).map(d => <option key={d} value={d}>{d}</option>)}
            </Select>
            {selectedDevice === 'cuda' && (
              <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
                If the GPU is unavailable or fails, transcription will automatically fall back to CPU using <strong>int8</strong> precision
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
