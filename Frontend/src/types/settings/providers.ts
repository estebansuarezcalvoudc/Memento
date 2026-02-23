export interface Provider {
  name: string
  requiresApiKey: boolean
  hasApiKey?: boolean
  active: boolean
}
