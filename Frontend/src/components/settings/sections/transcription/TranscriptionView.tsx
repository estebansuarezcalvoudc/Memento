import {
  useGetTranscriptionConfiguration,
  useGetTranscriptionOptions,
  useUpdateTranscriptionConfiguration,
} from '../../../../api/queries/settings/useTranscriptionQueries'
import Select from '../../../common/Select'
import { Section } from '../Section'
import SectionHeader from '../SectionHeader'
import SubSectionTitle from '../SubSectionTitle'

export default function TranscriptionView() {
  const { data: options, isLoading: optionsLoading } = useGetTranscriptionOptions()
  const { data: config, isLoading: configLoading } = useGetTranscriptionConfiguration()
  const { mutate: updateConfig } = useUpdateTranscriptionConfiguration()

  const isLoading = optionsLoading || configLoading
  const selectedDevice = config?.device ?? 'cuda'

  return (
    <>
      <SectionHeader section={Section.Transcription} />
      {isLoading ? (
        <span>Loading...</span>
      ) : (
        <div className="flex flex-col gap-6">
          <div>
            <SubSectionTitle title="WhisperX" />
            <Select
              label="Model size"
              options={(options?.models ?? []).map(m => ({ code: m, name: m }))}
              value={config?.modelSize ?? ''}
              onChange={e => updateConfig({ model_size: e.target.value })}
              placeholder=""
            />
            <Select
              label="Compute type"
              options={(options?.computeTypes ?? []).map(c => ({ code: c, name: c }))}
              value={config?.computeType ?? ''}
              onChange={e => updateConfig({ compute_type: e.target.value })}
              placeholder=""
            />
            <Select
              label="Device"
              options={(options?.devices ?? []).map(d => ({ code: d, name: d }))}
              value={selectedDevice}
              onChange={e => updateConfig({ device: e.target.value })}
              placeholder=""
            />
            {selectedDevice === 'cuda' && (
              <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
                If the GPU is unavailable or fails, transcription will automatically fall back to CPU using <strong>int8</strong> precision.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
