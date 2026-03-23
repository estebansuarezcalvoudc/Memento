export interface TranscriptionAvailableOptions {
  models?: string[]
  computeTypes?: string[]
  devices?: string[]
  speechModels?: string[]
  supportsLanguageDetection?: boolean
}

export interface TranscriptionConfiguration {
  modelSize?: string
  computeType?: string
  device?: string
  speechModel?: string
  speakerLabels?: boolean
}

export type TranscriptionProviderName = 'whisperx' | 'aai'

export interface TranscriptionProvider {
  name: TranscriptionProviderName
  requiresApiKey: boolean
  hasApiKey: boolean | null
  isActive: boolean
}
