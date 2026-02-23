export interface ModelConfig {
  provider: string
  modelName: string
  temperature: number
  maxTokens: number
}

export interface AvailableModel {
  id: string
  provider: string
}
