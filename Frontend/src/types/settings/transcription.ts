export interface TranscriptionAvailableOptions {
  models: string[]
  computeTypes: string[]
  devices: string[]
}

export interface TranscriptionConfiguration {
  modelSize: string
  computeType: string
  device: string
}
